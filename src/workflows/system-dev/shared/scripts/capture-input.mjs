import fs from "node:fs";
import path from "node:path";

const artifactsDir = requiredEnv("AWR_ARTIFACTS_DIR");
const workspaceDir = requiredEnv("AWR_WORKSPACE_DIR");
const inputFile = process.env.AWR_SYSTEM_DEV_INPUT_FILE?.trim() ?? "";
const inputText = process.env.AWR_SYSTEM_DEV_INPUT_TEXT?.trim() ?? "";
const inputFileVar = process.env.AWR_SYSTEM_DEV_INPUT_FILE_VAR ?? "input_file";
const inputTextVar = process.env.AWR_SYSTEM_DEV_INPUT_TEXT_VAR ?? "input";
const inputLabel = process.env.AWR_SYSTEM_DEV_INPUT_LABEL ?? "Input";
const templatePath = requiredEnv("AWR_SYSTEM_DEV_INPUT_TEMPLATE");

fs.mkdirSync(artifactsDir, { recursive: true });

let source;
let originalInput;
if (inputFile !== "") {
  const resolvedInputFile = path.isAbsolute(inputFile) ? inputFile : path.resolve(process.cwd(), inputFile);
  if (!fs.existsSync(resolvedInputFile)) {
    console.error(`${inputLabel} file does not exist: ${resolvedInputFile}`);
    process.exit(2);
  }
  originalInput = fs.readFileSync(resolvedInputFile, "utf8");
  source = {
    type: "file",
    variable: inputFileVar,
    path: resolvedInputFile
  };
} else if (inputText !== "") {
  originalInput = `${inputText}\n`;
  source = {
    type: "inline",
    variable: inputTextVar
  };
} else {
  console.error(`Either "${inputFileVar}" or "${inputTextVar}" is required`);
  process.exit(2);
}

fs.writeFileSync(path.join(artifactsDir, "input.original.md"), originalInput, "utf8");
fs.copyFileSync(templatePath, path.join(artifactsDir, "input-template.md"));
fs.writeFileSync(
  path.join(artifactsDir, "workflow_input.json"),
  `${JSON.stringify(
    {
      label: inputLabel,
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
