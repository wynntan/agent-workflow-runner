export type StepRunner = "shell" | "codex" | "claude";
export type WorkflowStatus = "running" | "passed" | "failed" | "interrupted";
export type StepStatus = "pending" | "running" | "passed" | "failed" | "skipped";
export type WorkflowVarValue = string | number | boolean;
export type WorkflowVars = Record<string, WorkflowVarValue>;
export type WorkflowVarType = "string" | "number" | "boolean";

export interface WorkflowVariable {
  name: string;
  summary: string;
  type?: WorkflowVarType;
  required?: boolean;
  default?: WorkflowVarValue;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  summary: string;
  variables?: WorkflowVariable[];
  run: (ctx: WorkflowContext) => Promise<void>;
}

export interface WorkflowContext {
  workflow: WorkflowDefinition;
  vars: WorkflowVars;
  runId: string;
  workspaceDir: string;
  artifactRepoDir: string;
  artifactRepoBranch: string;
  workspaceRunDir?: string;
  runDir: string;
  artifactsDir: string;
  logsDir: string;
  artifact: (artifactPath: string) => string;
  runPath: (relativePath: string) => string;
  shell: (step: ShellStepInput) => Promise<StepResult>;
  codex: (step: CodexStepInput) => Promise<StepResult>;
  claude: (step: ClaudeStepInput) => Promise<StepResult>;
}

export interface RunOptions {
  artifactRepoDir?: string;
  workspaceDir?: string;
  vars?: Record<string, string>;
}

export interface BaseStepInput {
  id: string;
  summary: string;
  cwd?: string;
  timeoutSec?: number | null;
  env?: Record<string, string | number | boolean>;
  outputs?: StepOutput[];
}

export interface ShellStepInput extends BaseStepInput {
  script: string;
}

export interface CodexStepInput extends BaseStepInput {
  instruction: string;
  model?: string;
  cd?: string;
  extraArgs?: string[];
}

export interface ClaudeStepInput extends BaseStepInput {
  instruction: string;
  model?: string;
  extraArgs?: string[];
}

export type WorkflowStepInput =
  | ({ runner: "shell" } & ShellStepInput)
  | ({ runner: "codex" } & CodexStepInput)
  | ({ runner: "claude" } & ClaudeStepInput);

export interface StepOutput {
  path: string;
  required?: boolean;
}

export interface ArtifactRecord {
  declared_path: string;
  path: string;
  exists: boolean;
  required: boolean;
  kind?: "file" | "directory" | "other";
  sha256?: string;
  bytes?: number;
}

export interface CommandResult {
  command: string;
  cwd: string;
  exit_code: number | null;
  signal: NodeJS.Signals | null;
  timed_out: boolean;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  stdout_log: string;
  stderr_log: string;
}

export interface StepResult {
  id: string;
  runner: StepRunner;
  summary: string;
  instruction?: string;
  status: StepStatus;
  started_at?: string;
  ended_at?: string;
  duration_ms?: number;
  command?: CommandResult;
  artifacts: ArtifactRecord[];
  error?: string;
}

export interface RunManifest {
  run_id: string;
  workflow_id: string;
  workflow_name: string;
  workflow_summary: string;
  artifact_repo_dir: string;
  artifact_repo_branch: string;
  workspace_dir: string;
  workspace_run_dir?: string;
  run_dir: string;
  artifacts_dir: string;
  logs_dir: string;
  variables: WorkflowVars;
  started_at: string;
  ended_at?: string;
  duration_ms?: number;
  status: WorkflowStatus;
  steps: StepResult[];
}
