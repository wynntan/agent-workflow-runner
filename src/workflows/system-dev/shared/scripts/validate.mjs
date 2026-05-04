import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const artifactsDir = requiredEnv("AWR_ARTIFACTS_DIR");
const workspaceDir = requiredEnv("AWR_WORKSPACE_DIR");
const stepId = process.env.AWR_STEP_ID ?? "validate";
const validationLogsDir = path.join(artifactsDir, "validation-logs", stepId);
fs.mkdirSync(validationLogsDir, { recursive: true });

const resolved = resolveValidationPlan();
const results = [];

for (const check of resolved.checks) {
  if (check.command === null) {
    results.push({
      id: check.id,
      label: check.label,
      status: "skipped",
      command: null,
      reason: check.reason ?? "No matching package script",
      exit_code: null,
      signal: null,
      log: null
    });
    continue;
  }

  const logPath = path.join(validationLogsDir, `${check.id}.log`);
  fs.writeFileSync(logPath, `$ ${check.command}\n`, "utf8");
  const startedAt = new Date();
  const result = spawnSync("/bin/bash", ["-lc", check.command], {
    cwd: workspaceDir,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024
  });
  const endedAt = new Date();
  fs.appendFileSync(logPath, result.stdout ?? "", "utf8");
  fs.appendFileSync(logPath, result.stderr ?? "", "utf8");
  results.push({
    id: check.id,
    label: check.label,
    status: result.status === 0 && result.signal === null ? "passed" : "failed",
    command: check.command,
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
const validation = {
  status: failed.length > 0 ? "failed" : runnable.length === 0 ? "skipped" : "passed",
  command_source: resolved.source,
  checks: resolved.checks.map(({ id, label, command, reason }) => ({ id, label, command, reason })),
  results
};

fs.writeFileSync(path.join(artifactsDir, "validation.json"), `${JSON.stringify(validation, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(artifactsDir, "validation.md"), renderMarkdown(validation), "utf8");

function resolveValidationPlan() {
  const packagePath = path.join(workspaceDir, "package.json");
  const packageInfo = fs.existsSync(packagePath)
    ? JSON.parse(fs.readFileSync(packagePath, "utf8"))
    : null;
  const scripts = packageInfo?.scripts ?? {};
  const packageManager = detectPackageManager(workspaceDir);

  const checks = [
    resolveScriptCheck("lint", "Lint", ["lint"], scripts, packageManager),
    resolveScriptCheck("typecheck", "Typecheck", ["typecheck", "type-check", "tsc"], scripts, packageManager),
    resolveScriptCheck("build", "Build", ["build"], scripts, packageManager),
    resolveScriptCheck("unit_test", "Unit test", ["test:unit", "unit", "test"], scripts, packageManager)
  ];

  return {
    source: "standard",
    checks
  };
}

function resolveScriptCheck(id, label, candidates, scripts, packageManager) {
  const script = candidates.find((name) => Object.hasOwn(scripts, name));
  if (script === undefined) {
    return {
      id,
      label,
      command: null,
      reason: `No package script found. Tried: ${candidates.join(", ")}`
    };
  }
  return {
    id,
    label,
    command: `${packageManager} run ${script}`
  };
}

function detectPackageManager(cwd) {
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(cwd, "bun.lockb")) || fs.existsSync(path.join(cwd, "bun.lock"))) return "bun";
  return "npm";
}

function renderMarkdown(validation) {
  const lines = [
    "# Validation",
    "",
    `- Status: ${validation.status}`,
    `- Command source: ${validation.command_source}`,
    "",
    "| check | status | command | exit | signal | log/reason |",
    "|---|---|---|---:|---|---|"
  ];
  for (const result of validation.results) {
    const logOrReason = result.log === null ? result.reason : result.log;
    lines.push(`| ${result.label} | ${result.status} | ${result.command === null ? "" : `\`${escapePipe(result.command)}\``} | ${result.exit_code ?? ""} | ${result.signal ?? ""} | ${escapePipe(logOrReason ?? "")} |`);
  }
  lines.push("");
  return lines.join("\n");
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
