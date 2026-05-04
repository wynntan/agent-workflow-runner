import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const artifactsDir = requiredEnv("AWR_ARTIFACTS_DIR");
const workspaceDir = requiredEnv("AWR_WORKSPACE_DIR");
const stepId = process.env.AWR_STEP_ID ?? "prepare_local_environment";
const logsDir = path.join(artifactsDir, "prepare-local-environment-logs", stepId);
fs.mkdirSync(logsDir, { recursive: true });

const packageInfo = readPackageInfo(workspaceDir);
const changedFiles = listChangedFiles();
const tasks = resolveTasks(packageInfo, changedFiles);
const results = [];

for (const task of tasks) {
  if (task.command === null) {
    results.push({
      id: task.id,
      label: task.label,
      status: task.required === true ? "failed" : "skipped",
      command: null,
      reason: task.reason,
      exit_code: null,
      signal: null,
      log: null
    });
    continue;
  }

  const logPath = path.join(logsDir, `${task.id}.log`);
  fs.writeFileSync(logPath, `$ ${task.command}\n`, "utf8");
  const startedAt = new Date();
  const result = spawnSync("/bin/bash", ["-lc", task.command], {
    cwd: workspaceDir,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024
  });
  const endedAt = new Date();
  fs.appendFileSync(logPath, result.stdout ?? "", "utf8");
  fs.appendFileSync(logPath, result.stderr ?? "", "utf8");

  results.push({
    id: task.id,
    label: task.label,
    status: result.status === 0 && result.signal === null ? "passed" : "failed",
    command: task.command,
    reason: task.reason,
    exit_code: result.status,
    signal: result.signal,
    started_at: startedAt.toISOString(),
    ended_at: endedAt.toISOString(),
    duration_ms: endedAt.getTime() - startedAt.getTime(),
    log: logPath
  });
}

const failed = results.filter((result) => result.status === "failed");
const runnable = results.filter((result) => result.status !== "skipped");
const report = {
  status: failed.length > 0 ? "failed" : runnable.length === 0 ? "skipped" : "passed",
  workspace_dir: workspaceDir,
  package: packageInfo,
  changed_files: changedFiles,
  tasks,
  results
};

fs.writeFileSync(path.join(artifactsDir, "prepare_local_environment.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(artifactsDir, "prepare_local_environment.md"), renderMarkdown(report), "utf8");

if (failed.length > 0) {
  process.exit(1);
}

function resolveTasks(packageInfo, changedFiles) {
  if (!packageInfo.exists) {
    return [
      {
        id: "dependency_install",
        label: "Dependency install",
        command: null,
        required: false,
        reason: "No package.json found"
      },
      {
        id: "codegen",
        label: "Code generation",
        command: null,
        required: false,
        reason: "No package.json found"
      },
      {
        id: "db_prepare",
        label: "DB prepare/migrate",
        command: null,
        required: false,
        reason: "No package.json found"
      }
    ];
  }

  const dependencyInstallNeeded = hasPackageChange(changedFiles) || !fs.existsSync(path.join(workspaceDir, "node_modules"));
  const codegenNeeded = hasCodegenRelevantChange(changedFiles);
  const dbPrepareNeeded = hasDbRelevantChange(changedFiles);

  const tasks = [
    {
      id: "dependency_install",
      label: "Dependency install",
      command: dependencyInstallNeeded ? installCommand(packageInfo.manager) : null,
      required: false,
      reason: dependencyInstallNeeded
        ? "Package files changed or node_modules is missing"
        : "No package file changes and node_modules exists"
    }
  ];

  tasks.push(resolveScriptTask({
    id: "codegen",
    label: "Code generation",
    needed: codegenNeeded,
    packageInfo,
    candidates: ["codegen", "generate", "prisma:generate", "db:generate"],
    notNeededReason: "No schema, API, GraphQL, Prisma, Drizzle, or generated-source relevant changes detected"
  }));

  tasks.push(resolveScriptTask({
    id: "db_prepare",
    label: "DB prepare/migrate",
    needed: dbPrepareNeeded,
    packageInfo,
    candidates: ["db:prepare", "db:migrate", "migrate:dev", "prisma:migrate", "db:test:prepare", "test:db:prepare"],
    notNeededReason: "No DB schema or migration changes detected"
  }));

  return tasks;
}

function resolveScriptTask({ id, label, needed, packageInfo, candidates, notNeededReason }) {
  if (!needed) {
    return {
      id,
      label,
      command: null,
      required: false,
      reason: notNeededReason
    };
  }

  const script = candidates.find((name) => Object.hasOwn(packageInfo.scripts, name));
  if (script === undefined) {
    return {
      id,
      label,
      command: null,
      required: true,
      reason: `Needed, but no package script found. Tried: ${candidates.join(", ")}`
    };
  }

  return {
    id,
    label,
    command: `${packageInfo.manager} run ${script}`,
    required: true,
    reason: `Detected relevant changes and package script "${script}"`
  };
}

function installCommand(packageManager) {
  if (packageManager === "pnpm") return "pnpm install";
  if (packageManager === "yarn") return "yarn install";
  if (packageManager === "bun") return "bun install";
  return "npm install";
}

function readPackageInfo(cwd) {
  const packagePath = path.join(cwd, "package.json");
  if (!fs.existsSync(packagePath)) {
    return {
      exists: false,
      manager: null,
      scripts: {}
    };
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  return {
    exists: true,
    manager: detectPackageManager(cwd),
    scripts: packageJson.scripts ?? {}
  };
}

function detectPackageManager(cwd) {
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(cwd, "bun.lockb")) || fs.existsSync(path.join(cwd, "bun.lock"))) return "bun";
  return "npm";
}

function listChangedFiles() {
  const names = new Set();
  for (const line of runGit(["status", "--porcelain"]).stdout.split(/\r?\n/)) {
    if (line.trim() === "") {
      continue;
    }
    const raw = line.slice(3).trim();
    const file = raw.includes(" -> ") ? raw.split(" -> ").at(-1) : raw;
    names.add(stripQuotes(file));
  }
  return [...names].sort();
}

function hasPackageChange(files) {
  return files.some((file) => [
    "package.json",
    "package-lock.json",
    "npm-shrinkwrap.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "bun.lock",
    "bun.lockb"
  ].includes(file) || /(^|\/)package\.json$/.test(file));
}

function hasCodegenRelevantChange(files) {
  return files.some((file) => {
    const lower = file.toLowerCase();
    return lower.endsWith("schema.prisma")
      || lower.includes("openapi")
      || lower.includes("swagger")
      || lower.endsWith(".graphql")
      || lower.endsWith(".gql")
      || lower.includes("drizzle")
      || lower.includes("generated");
  });
}

function hasDbRelevantChange(files) {
  return files.some((file) => {
    const lower = file.toLowerCase();
    return lower.includes("prisma/migrations/")
      || lower.endsWith("schema.prisma")
      || lower.includes("db/migrate")
      || lower.includes("database/migrations")
      || lower.includes("migrations/")
      || lower.includes("supabase/migrations")
      || lower.includes("drizzle")
      || lower.includes("schema.sql");
  });
}

function renderMarkdown(report) {
  const lines = [
    "# Prepare Local Environment",
    "",
    `- Status: ${report.status}`,
    `- Workspace: ${report.workspace_dir}`,
    `- Package manager: ${report.package.manager ?? "(none)"}`,
    "",
    "## Changed Files",
    "",
    ...(
      report.changed_files.length === 0
        ? ["(none)"]
        : report.changed_files.map((file) => `- ${file}`)
    ),
    "",
    "## Tasks",
    "",
    "| task | status | command | exit | signal | log/reason |",
    "|---|---|---|---:|---|---|"
  ];

  for (const result of report.results) {
    const logOrReason = result.log === null ? result.reason : result.log;
    lines.push(`| ${result.label} | ${result.status} | ${result.command === null ? "" : `\`${escapePipe(result.command)}\``} | ${result.exit_code ?? ""} | ${result.signal ?? ""} | ${escapePipe(logOrReason ?? "")} |`);
  }
  lines.push("");
  return lines.join("\n");
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: workspaceDir,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  }
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? ""
  };
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  return trimmed;
}

function escapePipe(value) {
  return String(value).replaceAll("|", "\\|");
}

function requiredEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`${name} is required`);
  }
  return value;
}
