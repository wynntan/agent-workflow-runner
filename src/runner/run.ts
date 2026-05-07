import { cp, lstat } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { ensureDir, fileExists, sha256File, writeJson } from "../fs-utils.js";
import { runClaudePrompt, runCodexExec } from "../tools/llm.js";
import type {
  ArtifactRecord,
  ClaudeStepInput,
  CodexStepInput,
  CommandResult,
  RunManifest,
  RunOptions,
  ShellStepInput,
  StepOutput,
  StepResult,
  WorkflowContext,
  WorkflowDefinition,
  WorkflowStepInput,
  WorkflowVars,
  WorkflowVarType,
  WorkflowVarValue,
  WorkflowVariable
} from "../types.js";
import { installSignalHandlers, runSpawnedCommand } from "./process.js";

interface RuntimeContext {
  workflow: WorkflowDefinition;
  vars: WorkflowVars;
  workspaceDir: string;
  artifactRepoDir: string;
  artifactRepoBranch: string;
  workspaceRunDir?: string;
  runId: string;
  runDir: string;
  artifactsDir: string;
  logsDir: string;
  manifestPath: string;
  startedAt: Date;
  interrupted: boolean;
  stepIndex: number;
  manifest: RunManifest;
}

class StepFailedError extends Error {
  constructor(readonly step: StepResult) {
    super(step.error ?? `Step "${step.id}" failed`);
  }
}

export async function runWorkflow(workflow: WorkflowDefinition, options: RunOptions = {}): Promise<RunManifest> {
  const invocationDir = process.cwd();
  const workspaceDir = path.resolve(options.workspaceDir ?? invocationDir);
  const artifactRepoDir = path.resolve(options.artifactRepoDir ?? process.env.AWR_ARTIFACT_REPO_DIR ?? "workflow-artifacts");
  const artifactRepoBranch = workflow.id;
  const vars = resolveWorkflowVars(workflow, options.vars ?? {});
  const runId = createRunId();
  await ensureArtifactRepository(artifactRepoDir, artifactRepoBranch);

  const runDir = path.join(artifactRepoDir, "runs", runId);
  const workspaceRunDir = options.workspaceDir === undefined ? undefined : path.join(workspaceDir, "runs", runId);
  const artifactsDir = path.join(runDir, "artifacts");
  const logsDir = path.join(runDir, "logs");
  const manifestPath = path.join(runDir, "run.json");
  const startedAt = new Date();

  await ensureDir(runDir);
  await ensureDir(artifactsDir);
  await ensureDir(logsDir);

  const manifest: RunManifest = {
    run_id: runId,
    workflow_id: workflow.id,
    workflow_name: workflow.name,
    workflow_summary: workflow.summary,
    artifact_repo_dir: artifactRepoDir,
    artifact_repo_branch: artifactRepoBranch,
    workspace_dir: workspaceDir,
    ...(workspaceRunDir === undefined ? {} : { workspace_run_dir: workspaceRunDir }),
    run_dir: runDir,
    artifacts_dir: artifactsDir,
    logs_dir: logsDir,
    variables: vars,
    started_at: startedAt.toISOString(),
    status: "running",
    steps: []
  };

  const runtime: RuntimeContext = {
    workflow,
    vars,
    workspaceDir,
    artifactRepoDir,
    artifactRepoBranch,
    ...(workspaceRunDir === undefined ? {} : { workspaceRunDir }),
    runId,
    runDir,
    artifactsDir,
    logsDir,
    manifestPath,
    startedAt,
    interrupted: false,
    stepIndex: 0,
    manifest
  };

  installSignalHandlers((signal) => {
    runtime.interrupted = true;
    manifest.status = "interrupted";
    void persistManifest(runtime);
    process.stderr.write(`\nInterrupted by ${signal}; stopping current process group.\n`);
  });

  await persistManifest(runtime);

  try {
    await workflow.run(createWorkflowContext(runtime));
    if (manifest.status === "running") {
      manifest.status = runtime.interrupted ? "interrupted" : "passed";
    }
  } catch (error) {
    if (runtime.interrupted) {
      manifest.status = "interrupted";
    } else {
      manifest.status = "failed";
      if (!(error instanceof StepFailedError)) {
        manifest.steps.push({
          id: "workflow",
          runner: "shell",
          summary: "Workflow runtime error",
          status: "failed",
          artifacts: [],
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  const endedAt = new Date();
  manifest.ended_at = endedAt.toISOString();
  manifest.duration_ms = endedAt.getTime() - runtime.startedAt.getTime();
  await persistManifest(runtime);
  await mirrorToWorkspaceSafely(runtime);
  await commitArtifactRunSafely(runtime);
  return manifest;
}

function createWorkflowContext(runtime: RuntimeContext): WorkflowContext {
  return {
    workflow: runtime.workflow,
    vars: runtime.vars,
    runId: runtime.runId,
    workspaceDir: runtime.workspaceDir,
    artifactRepoDir: runtime.artifactRepoDir,
    artifactRepoBranch: runtime.artifactRepoBranch,
    ...(runtime.workspaceRunDir === undefined ? {} : { workspaceRunDir: runtime.workspaceRunDir }),
    runDir: runtime.runDir,
    artifactsDir: runtime.artifactsDir,
    logsDir: runtime.logsDir,
    artifact: (artifactPath) => resolveOutputPath(runtime, artifactPath),
    runPath: (relativePath) => path.resolve(runtime.runDir, relativePath),
    shell: (step) => runStep(runtime, { ...step, runner: "shell" }),
    codex: (step) => runStep(runtime, { ...step, runner: "codex" }),
    claude: (step) => runStep(runtime, { ...step, runner: "claude" })
  };
}

async function runStep(runtime: RuntimeContext, step: WorkflowStepInput): Promise<StepResult> {
  if (runtime.interrupted) {
    throw new Error("Workflow was interrupted");
  }

  runtime.stepIndex += 1;
  const startedAt = new Date();
  const stepResult = createInitialStepResult(step);
  runtime.manifest.steps.push(stepResult);
  stepResult.status = "running";
  stepResult.started_at = startedAt.toISOString();
  await persistStep(runtime, stepResult);
  await persistManifest(runtime);

  const commandResult = await runStepCommand(runtime, step, runtime.stepIndex);
  stepResult.command = commandResult;
  if (commandResult.exit_code !== 0 || commandResult.signal !== null || commandResult.timed_out) {
    stepResult.status = "failed";
    stepResult.error = commandFailureMessage("step body", commandResult);
    await finalizeStep(runtime, step, stepResult, startedAt);
    runtime.manifest.status = runtime.interrupted ? "interrupted" : "failed";
    await persistManifest(runtime);
    throw new StepFailedError(stepResult);
  }

  stepResult.artifacts = await collectArtifacts(runtime, step.outputs ?? []);
  const missing = stepResult.artifacts.filter((artifact) => artifact.required && !artifact.exists);
  if (missing.length > 0) {
    stepResult.status = "failed";
    stepResult.error = `Missing required outputs: ${missing.map((artifact) => artifact.declared_path).join(", ")}`;
    await finalizeStep(runtime, step, stepResult, startedAt);
    runtime.manifest.status = "failed";
    await persistManifest(runtime);
    throw new StepFailedError(stepResult);
  }

  stepResult.status = "passed";
  await finalizeStep(runtime, step, stepResult, startedAt);
  await persistManifest(runtime);
  return stepResult;
}

async function runStepCommand(runtime: RuntimeContext, step: WorkflowStepInput, index: number): Promise<CommandResult> {
  if (step.runner === "shell") {
    return runShellStep(runtime, step, index);
  }
  if (step.runner === "codex") {
    return runCodexStep(runtime, step, index);
  }
  return runClaudeStep(runtime, step, index);
}

async function runShellStep(
  runtime: RuntimeContext,
  step: Extract<WorkflowStepInput, { runner: "shell" }>,
  index: number
): Promise<CommandResult> {
  const cwd = resolveStepCwd(runtime, step.cwd);
  return runSpawnedCommand({
    command: "/bin/bash",
    args: ["-lc", step.script],
    displayCommand: step.script,
    cwd,
    env: buildStepEnv(runtime, step),
    stdoutLog: path.join(runtime.logsDir, `${formatStepPrefix(index, step.id)}.stdout.log`),
    stderrLog: path.join(runtime.logsDir, `${formatStepPrefix(index, step.id)}.stderr.log`),
    timeoutSec: step.timeoutSec
  });
}

async function runCodexStep(
  runtime: RuntimeContext,
  step: Extract<WorkflowStepInput, { runner: "codex" }>,
  index: number
): Promise<CommandResult> {
  const cd = resolveStepCwd(runtime, step.cd ?? step.cwd);
  return runCodexExec({
    instruction: step.instruction,
    model: step.model,
    extraArgs: step.extraArgs,
    cd,
    cwd: cd,
    env: buildStepEnv(runtime, step),
    stdoutLog: path.join(runtime.logsDir, `${formatStepPrefix(index, step.id)}.stdout.jsonl`),
    stderrLog: path.join(runtime.logsDir, `${formatStepPrefix(index, step.id)}.stderr.log`),
    timeoutSec: step.timeoutSec
  });
}

async function runClaudeStep(
  runtime: RuntimeContext,
  step: Extract<WorkflowStepInput, { runner: "claude" }>,
  index: number
): Promise<CommandResult> {
  const cwd = resolveStepCwd(runtime, step.cwd);
  return runClaudePrompt({
    instruction: step.instruction,
    model: step.model,
    extraArgs: step.extraArgs,
    cwd,
    env: buildStepEnv(runtime, step),
    stdoutLog: path.join(runtime.logsDir, `${formatStepPrefix(index, step.id)}.stdout.jsonl`),
    stderrLog: path.join(runtime.logsDir, `${formatStepPrefix(index, step.id)}.stderr.log`),
    timeoutSec: step.timeoutSec
  });
}

async function collectArtifacts(runtime: RuntimeContext, outputs: StepOutput[]): Promise<ArtifactRecord[]> {
  const records: ArtifactRecord[] = [];
  for (const output of outputs) {
    const resolved = resolveOutputPath(runtime, output.path);
    const exists = await fileExists(resolved);
    const record: ArtifactRecord = {
      declared_path: output.path,
      path: resolved,
      exists,
      required: output.required ?? true
    };
    if (exists) {
      const info = await lstat(resolved);
      record.kind = info.isFile() ? "file" : info.isDirectory() ? "directory" : "other";
      if (info.isFile()) {
        record.bytes = info.size;
        record.sha256 = await sha256File(resolved);
      }
    }
    records.push(record);
  }
  return records;
}

async function finalizeStep(
  runtime: RuntimeContext,
  step: WorkflowStepInput,
  stepResult: StepResult,
  startedAt: Date
): Promise<void> {
  stepResult.artifacts = await collectArtifacts(runtime, step.outputs ?? []);
  const endedAt = new Date();
  stepResult.ended_at = endedAt.toISOString();
  stepResult.duration_ms = endedAt.getTime() - startedAt.getTime();
  await persistStep(runtime, stepResult);
}

function createInitialStepResult(step: WorkflowStepInput): StepResult {
  return {
    id: step.id,
    runner: step.runner,
    summary: step.summary,
    ...("instruction" in step ? { instruction: step.instruction } : {}),
    status: "pending",
    artifacts: []
  };
}

function resolveStepCwd(runtime: RuntimeContext, cwd: string | undefined): string {
  if (cwd === undefined) {
    return runtime.workspaceDir;
  }
  return path.resolve(runtime.workspaceDir, cwd);
}

function resolveOutputPath(runtime: RuntimeContext, outputPath: string): string {
  const expanded = outputPath
    .replaceAll("${artifacts}", runtime.artifactsDir)
    .replaceAll("$AWR_ARTIFACTS_DIR", runtime.artifactsDir)
    .replaceAll("${run}", runtime.runDir)
    .replaceAll("$AWR_RUN_DIR", runtime.runDir);

  if (path.isAbsolute(expanded)) {
    return expanded;
  }
  const normalized = expanded.replace(/^\.?\/*artifacts\//, "");
  return path.resolve(runtime.artifactsDir, normalized);
}

function buildStepEnv(runtime: RuntimeContext, step: WorkflowStepInput): NodeJS.ProcessEnv {
  const stepEnv = Object.fromEntries(
    Object.entries(step.env ?? {}).map(([key, value]) => [key, String(value)])
  );
  const varsEnv = Object.fromEntries(
    Object.entries(runtime.vars).map(([key, value]) => [`AWR_VAR_${toEnvKey(key)}`, String(value)])
  );
  return {
    ...process.env,
    ...varsEnv,
    ...stepEnv,
    AWR_RUN_ID: runtime.runId,
    AWR_RUN_DIR: runtime.runDir,
    AWR_ARTIFACTS_DIR: runtime.artifactsDir,
    AWR_LOGS_DIR: runtime.logsDir,
    AWR_WORKSPACE_DIR: runtime.workspaceDir,
    AWR_ARTIFACT_REPO_DIR: runtime.artifactRepoDir,
    AWR_ARTIFACT_REPO_BRANCH: runtime.artifactRepoBranch,
    ...(runtime.workspaceRunDir === undefined ? {} : { AWR_WORKSPACE_RUN_DIR: runtime.workspaceRunDir }),
    AWR_WORKFLOW_ID: runtime.workflow.id,
    AWR_STEP_ID: step.id
  };
}

async function persistManifest(runtime: RuntimeContext): Promise<void> {
  await writeJson(runtime.manifestPath, runtime.manifest);
}

async function persistStep(runtime: RuntimeContext, stepResult: StepResult): Promise<void> {
  await writeJson(path.join(runtime.runDir, "steps", `${stepResult.id}.json`), stepResult);
}

async function mirrorToWorkspace(runtime: RuntimeContext): Promise<void> {
  if (runtime.workspaceRunDir === undefined) {
    return;
  }
  if (path.resolve(runtime.workspaceRunDir) === path.resolve(runtime.runDir)) {
    return;
  }
  await ensureDir(path.dirname(runtime.workspaceRunDir));
  await cp(runtime.runDir, runtime.workspaceRunDir, {
    recursive: true,
    force: true
  });
}

async function mirrorToWorkspaceSafely(runtime: RuntimeContext): Promise<void> {
  try {
    await mirrorToWorkspace(runtime);
  } catch (error) {
    await recordRunnerError(runtime, "workspace_mirror", "Workspace run directory mirror failed", error);
  }
}

async function commitArtifactRunSafely(runtime: RuntimeContext): Promise<void> {
  try {
    await commitArtifactRun(runtime);
  } catch (error) {
    await recordRunnerError(runtime, "artifact_commit", "Artifact repository commit failed", error);
  }
}

async function commitArtifactRun(runtime: RuntimeContext): Promise<void> {
  const relativeRunDir = path.relative(runtime.artifactRepoDir, runtime.runDir);
  const message = `awr: ${runtime.workflow.id} ${runtime.runId} ${runtime.manifest.status}`;
  await runGit(runtime.artifactRepoDir, ["add", "--", relativeRunDir]);
  await runGit(runtime.artifactRepoDir, [
    "-c",
    "user.name=agent-workflow-runner",
    "-c",
    "user.email=agent-workflow-runner@local",
    "commit",
    "-m",
    message,
    "--only",
    "--",
    relativeRunDir
  ]);
}

async function recordRunnerError(
  runtime: RuntimeContext,
  id: string,
  summary: string,
  error: unknown
): Promise<void> {
  runtime.manifest.status = "failed";
  runtime.manifest.steps.push({
    id,
    runner: "shell",
    summary,
    status: "failed",
    artifacts: [],
    error: error instanceof Error ? error.message : String(error)
  });
  await persistManifest(runtime);
}

async function ensureArtifactRepository(repoDir: string, branchName: string): Promise<void> {
  validateGitBranchName(branchName);
  if (!(await fileExists(path.join(repoDir, ".git")))) {
    throw new Error(`Artifact repository must already exist as a git repository: ${repoDir}`);
  }

  const branchExists = await runGit(repoDir, ["show-ref", "--verify", `refs/heads/${branchName}`], {
    allowFailure: true
  });
  if (branchExists.exitCode === 0) {
    await runGit(repoDir, ["checkout", branchName]);
  } else {
    await runGit(repoDir, ["checkout", "-b", branchName]);
  }
}

async function runGit(
  cwd: string,
  args: string[],
  options: { allowFailure?: boolean } = {}
): Promise<{ exitCode: number; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd,
      stdio: ["ignore", "ignore", "pipe"]
    });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      const exitCode = code ?? 1;
      if (exitCode !== 0 && options.allowFailure !== true) {
        reject(new Error(`git ${args.join(" ")} failed in ${cwd}: ${stderr.trim()}`));
        return;
      }
      resolve({ exitCode, stderr });
    });
  });
}

function validateGitBranchName(branchName: string): void {
  const invalidChars = ["~", "^", ":", "?", "*", "[", "]", "\\"];
  if (
    branchName.trim() === "" ||
    branchName.startsWith("-") ||
    branchName.includes("..") ||
    branchName.includes(" ") ||
    branchName.includes("@{") ||
    branchName.endsWith("/") ||
    branchName.endsWith(".lock") ||
    invalidChars.some((char) => branchName.includes(char))
  ) {
    throw new Error(`Workflow id "${branchName}" cannot be used as a git branch name`);
  }
}

function resolveWorkflowVars(workflow: WorkflowDefinition, rawVars: Record<string, string>): WorkflowVars {
  const definitions = workflow.variables ?? [];
  const definitionByName = new Map(definitions.map((definition) => [definition.name, definition]));
  const vars: WorkflowVars = {};

  for (const definition of definitions) {
    if (definition.default !== undefined) {
      vars[definition.name] = definition.default;
    }
  }

  for (const [name, rawValue] of Object.entries(rawVars)) {
    const definition = definitionByName.get(name);
    if (definition === undefined) {
      throw new Error(`Unknown variable "${name}" for workflow "${workflow.id}"`);
    }
    vars[name] = parseWorkflowVar(rawValue, definition);
  }

  for (const definition of definitions) {
    if (definition.required === true && vars[definition.name] === undefined) {
      throw new Error(`Missing required variable "${definition.name}" for workflow "${workflow.id}"`);
    }
  }

  return vars;
}

function parseWorkflowVar(rawValue: string, definition: WorkflowVariable): WorkflowVarValue {
  const type = definition.type ?? inferWorkflowVarType(definition.default);
  if (type === "number") {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      throw new Error(`Variable "${definition.name}" must be a number`);
    }
    return value;
  }
  if (type === "boolean") {
    if (rawValue === "true") {
      return true;
    }
    if (rawValue === "false") {
      return false;
    }
    throw new Error(`Variable "${definition.name}" must be "true" or "false"`);
  }
  return rawValue;
}

function inferWorkflowVarType(value: WorkflowVarValue | undefined): WorkflowVarType {
  if (typeof value === "number") {
    return "number";
  }
  if (typeof value === "boolean") {
    return "boolean";
  }
  return "string";
}

function commandFailureMessage(label: string, result: CommandResult): string {
  if (result.timed_out) {
    return `${label} timed out`;
  }
  if (result.signal !== null) {
    return `${label} exited by signal ${result.signal}`;
  }
  return `${label} failed with exit code ${result.exit_code}`;
}

function createRunId(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${suffix}`;
}

function formatStepPrefix(index: number, stepId: string): string {
  return `${String(index).padStart(2, "0")}-${stepId}`;
}

function toEnvKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, "_").toUpperCase();
}
