import fs from "node:fs";
import path from "node:path";

const artifactsDir = requiredEnv("AWR_ARTIFACTS_DIR");
const workspaceDir = requiredEnv("AWR_WORKSPACE_DIR");
const taskName = requiredEnv("AWR_FEATURE_TASK_NAME");
const requirementFile = process.env.AWR_FEATURE_REQUIREMENT_FILE?.trim() ?? "";
const requirementText = process.env.AWR_FEATURE_REQUIREMENT?.trim() ?? "";
const templatePath = requiredEnv("AWR_FEATURE_REQUIREMENT_TEMPLATE");

fs.mkdirSync(artifactsDir, { recursive: true });

let source;
let originalRequirement;
if (requirementFile !== "") {
  const resolvedRequirementFile = path.isAbsolute(requirementFile)
    ? requirementFile
    : path.resolve(process.cwd(), requirementFile);
  if (!fs.existsSync(resolvedRequirementFile)) {
    console.error(`Requirement file does not exist: ${resolvedRequirementFile}`);
    process.exit(2);
  }
  originalRequirement = fs.readFileSync(resolvedRequirementFile, "utf8");
  source = {
    type: "file",
    path: resolvedRequirementFile
  };
} else if (requirementText !== "") {
  originalRequirement = `${requirementText}\n`;
  source = {
    type: "inline"
  };
} else {
  console.error('Either "requirement_file" or "requirement" is required');
  process.exit(2);
}

fs.writeFileSync(path.join(artifactsDir, "requirement.original.md"), originalRequirement, "utf8");
fs.copyFileSync(templatePath, path.join(artifactsDir, "requirement-template.md"));
fs.writeFileSync(
  path.join(artifactsDir, "workflow_input.json"),
  `${JSON.stringify(
    {
      task_name: taskName,
      source,
      workspace_dir: workspaceDir
    },
    null,
    2
  )}\n`,
  "utf8"
);

function requiredEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`${name} is required`);
  }
  return value;
}
