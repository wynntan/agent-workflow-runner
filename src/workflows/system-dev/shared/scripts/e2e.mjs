import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const artifactsDir = requiredEnv("AWR_ARTIFACTS_DIR");
const workspaceDir = requiredEnv("AWR_WORKSPACE_DIR");
const stepId = process.env.AWR_STEP_ID ?? "e2e";
const e2eLogsDir = path.join(artifactsDir, "e2e-logs", stepId);
fs.mkdirSync(e2eLogsDir, { recursive: true });

const resolved = resolveE2ePlan();
const results = [];

for (const check of resolved.checks) {
  if (check.command === null) {
    results.push({
      id: check.id,
      label: check.label,
      status: "skipped",
      command: null,
      reason: check.reason,
      exit_code: null,
      signal: null,
      log: null
    });
    continue;
  }

  const logPath = path.join(e2eLogsDir, `${check.id}.log`);
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
const e2e = {
  status: failed.length > 0 ? "failed" : runnable.length === 0 ? "skipped" : "passed",
  command_source: resolved.source,
  checks: resolved.checks,
  results
};

fs.writeFileSync(path.join(artifactsDir, "e2e.json"), `${JSON.stringify(e2e, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(artifactsDir, "e2e.md"), renderMarkdown(e2e), "utf8");

function resolveE2ePlan() {
  const packagePath = path.join(workspaceDir, "package.json");
  if (!fs.existsSync(packagePath)) {
    return {
      source: "auto",
      checks: [
        {
          id: "e2e",
          label: "E2E",
          command: null,
          reason: "package.json not found"
        }
      ]
    };
  }

  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const scripts = pkg.scripts ?? {};
  const packageManager = detectPackageManager(workspaceDir);
  const candidates = ["test:e2e", "e2e", "e2e:test", "playwright:test"];
  const script = candidates.find((name) => Object.hasOwn(scripts, name));
  return {
    source: "auto",
    checks: [
      script === undefined
        ? {
            id: "e2e",
            label: "E2E",
            command: null,
            reason: `No package script found. Tried: ${candidates.join(", ")}`
          }
        : {
            id: "e2e",
            label: "E2E",
            command: `${packageManager} run ${script}`
          }
    ]
  };
}

function detectPackageManager(cwd) {
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(cwd, "bun.lockb")) || fs.existsSync(path.join(cwd, "bun.lock"))) return "bun";
  return "npm";
}

function renderMarkdown(e2e) {
  const lines = [
    "# E2E",
    "",
    `- Status: ${e2e.status}`,
    `- Command source: ${e2e.command_source}`,
    "",
    "| check | status | command | exit | signal | log/reason |",
    "|---|---|---|---:|---|---|"
  ];
  for (const result of e2e.results) {
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
