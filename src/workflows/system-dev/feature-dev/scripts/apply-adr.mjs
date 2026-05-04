import fs from "node:fs";
import path from "node:path";

const artifactsDir = requiredEnv("AWR_ARTIFACTS_DIR");
const workspaceDir = requiredEnv("AWR_WORKSPACE_DIR");
const planPath = path.join(artifactsDir, "implementation_plan.json");
const proposalPath = path.join(artifactsDir, "adr_proposal.md");

const plan = readJson(planPath);
const adr = plan.adr ?? {};
const required = adr.required === true;

const result = required ? applyAdr(adr) : skipAdr(adr);

fs.writeFileSync(path.join(artifactsDir, "adr_apply.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(artifactsDir, "adr_apply.md"), renderMarkdown(result), "utf8");

function applyAdr(adr) {
  if (!fs.existsSync(proposalPath)) {
    throw new Error("implementation_plan.json requires ADR, but adr_proposal.md does not exist");
  }
  const workspacePath = stringValue(adr.workspace_path);
  if (workspacePath === "") {
    throw new Error("implementation_plan.json requires ADR, but adr.workspace_path is empty");
  }

  const destination = resolveAdrPath(workspacePath);
  const content = fs.readFileSync(proposalPath, "utf8");
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content, "utf8");

  return {
    status: "applied",
    required: true,
    workspace_path: path.relative(workspaceDir, destination),
    absolute_workspace_path: destination,
    proposal_path: proposalPath,
    bytes: Buffer.byteLength(content, "utf8")
  };
}

function skipAdr(adr) {
  return {
    status: "skipped",
    required: false,
    reason: stringValue(adr.reason) || "ADR not required by approved design",
    workspace_path: null,
    proposal_path: fs.existsSync(proposalPath) ? proposalPath : null
  };
}

function resolveAdrPath(workspacePath) {
  if (path.isAbsolute(workspacePath)) {
    const relative = path.relative(workspaceDir, workspacePath);
    assertAdrRelativePath(relative);
    return workspacePath;
  }
  assertAdrRelativePath(workspacePath);
  return path.resolve(workspaceDir, workspacePath);
}

function assertAdrRelativePath(value) {
  const normalized = value.split(path.sep).join("/");
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new Error(`ADR path must stay inside workspace: ${value}`);
  }
  if (!normalized.startsWith("docs/adr/") || !normalized.endsWith(".md")) {
    throw new Error(`ADR path must be a Markdown file under docs/adr/: ${value}`);
  }
}

function renderMarkdown(result) {
  return [
    "# ADR Apply",
    "",
    `- Status: ${result.status}`,
    `- Required: ${result.required ? "yes" : "no"}`,
    `- Workspace path: ${result.workspace_path ?? "(none)"}`,
    `- Proposal path: ${result.proposal_path ?? "(none)"}`,
    ""
  ].join("\n");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function stringValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function requiredEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`${name} is required`);
  }
  return value;
}
