import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const artifactsDir = requiredEnv("AWR_ARTIFACTS_DIR");
const workspaceDir = requiredEnv("AWR_WORKSPACE_DIR");
fs.mkdirSync(artifactsDir, { recursive: true });

const insideWorkTree = run("git", ["rev-parse", "--is-inside-work-tree"]).stdout.trim() === "true";
if (!insideWorkTree) {
  console.error(`feature-dev requires a git workspace: ${workspaceDir}`);
  process.exit(2);
}

const packageInfo = readPackageInfo(workspaceDir);
const preflight = {
  workspace_dir: workspaceDir,
  git: {
    top_level: run("git", ["rev-parse", "--show-toplevel"]).stdout.trim(),
    branch: run("git", ["branch", "--show-current"]).stdout.trim(),
    head: run("git", ["rev-parse", "--short", "HEAD"]).stdout.trim(),
    status_short: run("git", ["status", "--short"]).stdout,
    diff_stat: run("git", ["diff", "--stat"]).stdout
  },
  package: packageInfo,
  tools: {
    node: runOptional("node", ["--version"]),
    npm: runOptional("npm", ["--version"]),
    pnpm: runOptional("pnpm", ["--version"]),
    yarn: runOptional("yarn", ["--version"]),
    bun: runOptional("bun", ["--version"])
  }
};

fs.writeFileSync(path.join(artifactsDir, "preflight.json"), `${JSON.stringify(preflight, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(artifactsDir, "preflight.md"), renderMarkdown(preflight), "utf8");

function readPackageInfo(cwd) {
  const packagePath = path.join(cwd, "package.json");
  if (!fs.existsSync(packagePath)) {
    return {
      exists: false,
      manager: null,
      scripts: {}
    };
  }
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  return {
    exists: true,
    manager: detectPackageManager(cwd),
    scripts: pkg.scripts ?? {}
  };
}

function detectPackageManager(cwd) {
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(cwd, "bun.lockb")) || fs.existsSync(path.join(cwd, "bun.lock"))) return "bun";
  if (fs.existsSync(path.join(cwd, "package-lock.json"))) return "npm";
  return "npm";
}

function renderMarkdown(preflight) {
  const scripts = Object.keys(preflight.package.scripts);
  return [
    "# Preflight",
    "",
    `- Workspace: ${preflight.workspace_dir}`,
    `- Git top level: ${preflight.git.top_level}`,
    `- Branch: ${preflight.git.branch || "(detached or unnamed)"}`,
    `- HEAD: ${preflight.git.head}`,
    `- Package manager: ${preflight.package.manager ?? "(none)"}`,
    `- Package scripts: ${scripts.length === 0 ? "(none)" : scripts.join(", ")}`,
    "",
    "## Git Status",
    "",
    "```text",
    preflight.git.status_short.trim() === "" ? "(clean)" : preflight.git.status_short.trimEnd(),
    "```",
    "",
    "## Git Diff Stat",
    "",
    "```text",
    preflight.git.diff_stat.trim() === "" ? "(no unstaged diff)" : preflight.git.diff_stat.trimEnd(),
    "```",
    ""
  ].join("\n");
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: workspaceDir,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr}`);
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
  return result.stdout.trim();
}

function requiredEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`${name} is required`);
  }
  return value;
}
