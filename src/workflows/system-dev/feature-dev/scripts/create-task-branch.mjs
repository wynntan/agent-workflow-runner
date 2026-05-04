import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const artifactsDir = requiredEnv("AWR_ARTIFACTS_DIR");
const workspaceDir = requiredEnv("AWR_WORKSPACE_DIR");
const runId = requiredEnv("AWR_RUN_ID");
const taskName = requiredEnv("AWR_FEATURE_TASK_NAME").trim();
const branchPrefix = process.env.AWR_FEATURE_BRANCH_PREFIX?.trim() || "feature";

fs.mkdirSync(artifactsDir, { recursive: true });

if (taskName === "") {
  console.error("task_name is required");
  process.exit(2);
}

const insideWorkTree = run("git", ["rev-parse", "--is-inside-work-tree"]).stdout.trim() === "true";
if (!insideWorkTree) {
  console.error(`feature-dev requires a git workspace: ${workspaceDir}`);
  process.exit(2);
}

const status = run("git", ["status", "--porcelain"]).stdout;
if (status.trim() !== "") {
  console.error("Workspace has uncommitted changes. Commit, stash, or clean them before creating a task branch.");
  console.error(status.trimEnd());
  process.exit(2);
}

const previousBranch = run("git", ["branch", "--show-current"]).stdout.trim();
const branchName = buildBranchName(taskName, branchPrefix, runId);

run("git", ["check-ref-format", "--branch", branchName]);

if (runOptional("git", ["rev-parse", "--verify", branchName]) !== null) {
  console.error(`Branch already exists: ${branchName}`);
  process.exit(2);
}

run("git", ["fetch", "origin", "+refs/heads/dev:refs/remotes/origin/dev"]);

if (runOptional("git", ["rev-parse", "--verify", "origin/dev"]) === null) {
  console.error("origin/dev does not exist after fetch");
  process.exit(2);
}

if (runOptional("git", ["rev-parse", "--verify", "dev"]) === null) {
  run("git", ["checkout", "-b", "dev", "origin/dev"]);
} else {
  run("git", ["checkout", "dev"]);
  run("git", ["merge", "--ff-only", "origin/dev"]);
}

const baseCommit = run("git", ["rev-parse", "HEAD"]).stdout.trim();
run("git", ["checkout", "-b", branchName]);
const headCommit = run("git", ["rev-parse", "HEAD"]).stdout.trim();

const result = {
  task_name: taskName,
  branch_name: branchName,
  branch_prefix: branchPrefix,
  base_branch: "dev",
  base_remote: "origin/dev",
  base_commit: baseCommit,
  head_commit: headCommit,
  previous_branch: previousBranch,
  created_at: new Date().toISOString()
};

fs.writeFileSync(path.join(artifactsDir, "branch.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(artifactsDir, "branch.md"), renderMarkdown(result), "utf8");

function buildBranchName(name, prefix, fallback) {
  const slug = name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/\.+$/g, "");
  const safeSlug = slug === "" ? `task-${fallback}` : slug;
  return `${prefix}/${safeSlug}`;
}

function renderMarkdown(result) {
  return [
    "# Task Branch",
    "",
    `- Task name: ${result.task_name}`,
    `- Branch: ${result.branch_name}`,
    `- Base: ${result.base_remote}`,
    `- Base commit: ${result.base_commit}`,
    `- Previous branch: ${result.previous_branch || "(detached or unnamed)"}`,
    `- Created at: ${result.created_at}`,
    ""
  ].join("\n");
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: workspaceDir,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? ""
  };
}

function runOptional(command, args) {
  const result = spawnSync(command, args, {
    cwd: workspaceDir,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    return null;
  }
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? ""
  };
}

function requiredEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`${name} is required`);
  }
  return value;
}
