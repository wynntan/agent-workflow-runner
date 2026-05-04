import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const artifactsDir = requiredEnv("AWR_ARTIFACTS_DIR");
const workspaceDir = requiredEnv("AWR_WORKSPACE_DIR");
const validation = readJsonIfExists(path.join(artifactsDir, "validation.json"));
const e2e = readJsonIfExists(path.join(artifactsDir, "e2e.json"));
const implementationPlan = readJsonIfExists(path.join(artifactsDir, "implementation_plan.json"));
const adrProposalExists = fs.existsSync(path.join(artifactsDir, "adr_proposal.md"));

const handoff = [
  "# System Dev Handoff",
  "",
  `- Workspace: ${workspaceDir}`,
  `- Validation status: ${validation?.status ?? "unknown"}`,
  `- E2E status: ${e2e?.status ?? "unknown"}`,
  `- ADR required: ${implementationPlan?.adr?.required === true ? "yes" : "no"}`,
  ...(implementationPlan?.adr?.workspace_path ? [`- ADR path: ${implementationPlan.adr.workspace_path}`] : []),
  "",
  "## Artifacts",
  "",
  "- input.original.md",
  "- input.normalized.md",
  "- acceptance.json",
  "- repo_context.md",
  "- design.md",
  "- implementation_plan.json",
  "- design_review.md",
  "- design_review.json",
  ...(adrProposalExists ? ["- adr_proposal.md"] : []),
  "- adr_apply.json",
  "- adr_apply.md",
  "- implementation_summary.md",
  "- implementation_review.md",
  "- implementation_review.json",
  "- validation.json",
  "- validation.md",
  "- validation_fix_summary.md",
  "- e2e.json",
  "- e2e.md",
  "- e2e_fix_summary.md",
  "",
  "## Git Status",
  "",
  "```text",
  run("git", ["status", "--short"]).stdout.trimEnd() || "(clean)",
  "```",
  "",
  "## Git Diff Stat",
  "",
  "```text",
  run("git", ["diff", "--stat"]).stdout.trimEnd() || "(no unstaged diff)",
  "```",
  "",
  "## Notes",
  "",
  "- Workspace changes are not committed by the runner.",
  "- workflow-artifacts is committed automatically by the runner.",
  ""
].join("\n");

fs.writeFileSync(path.join(artifactsDir, "handoff.md"), handoff, "utf8");

if (validation?.status === "failed") {
  console.error("Validation failed; marking workflow as failed after writing handoff.md");
  process.exit(1);
}

if (e2e?.status === "failed") {
  console.error("E2E failed; marking workflow as failed after writing handoff.md");
  process.exit(1);
}

function readJsonIfExists(file) {
  if (!fs.existsSync(file)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: workspaceDir,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    return {
      stdout: "",
      stderr: result.stderr ?? ""
    };
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
