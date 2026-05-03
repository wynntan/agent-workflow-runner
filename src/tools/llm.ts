import type { CommandResult } from "../types.js";
import { runSpawnedCommand } from "../runner/process.js";

interface BaseToolRunOptions {
  cwd: string;
  env: NodeJS.ProcessEnv;
  stdoutLog: string;
  stderrLog: string;
  timeoutSec?: number | null;
}

export interface CodexExecOptions extends BaseToolRunOptions {
  instruction: string;
  cd: string;
  model?: string;
  extraArgs?: string[];
}

export interface ClaudePromptOptions extends BaseToolRunOptions {
  instruction: string;
  model?: string;
  extraArgs?: string[];
}

export async function runCodexExec(options: CodexExecOptions): Promise<CommandResult> {
  const args = buildCodexExecArgs(options);
  return runSpawnedCommand({
    command: "codex",
    args,
    displayCommand: formatCommand("codex", args),
    cwd: options.cwd,
    env: options.env,
    stdoutLog: options.stdoutLog,
    stderrLog: options.stderrLog,
    timeoutSec: options.timeoutSec
  });
}

export async function runClaudePrompt(options: ClaudePromptOptions): Promise<CommandResult> {
  const args = buildClaudePromptArgs(options);
  return runSpawnedCommand({
    command: "claude",
    args,
    displayCommand: formatCommand("claude", args),
    cwd: options.cwd,
    env: options.env,
    stdoutLog: options.stdoutLog,
    stderrLog: options.stderrLog,
    timeoutSec: options.timeoutSec
  });
}

export function buildCodexExecArgs(options: Pick<CodexExecOptions, "instruction" | "cd" | "model" | "extraArgs">): string[] {
  const args = ["exec", "--json", "--cd", options.cd];
  if (options.model !== undefined) {
    args.push("-m", options.model);
  }
  if (options.extraArgs !== undefined) {
    args.push(...options.extraArgs);
  }
  args.push(options.instruction);
  return args;
}

export function buildClaudePromptArgs(options: Pick<ClaudePromptOptions, "instruction" | "model" | "extraArgs">): string[] {
  const args = ["-p", "--output-format", "stream-json"];
  if (options.model !== undefined) {
    args.push("--model", options.model);
  }
  if (options.extraArgs !== undefined) {
    args.push(...options.extraArgs);
  }
  args.push(options.instruction);
  return args;
}

export function formatCommand(command: string, args: string[]): string {
  return [command, ...args.map(shellDisplayArg)].join(" ");
}

function shellDisplayArg(value: string): string {
  if (/^[a-zA-Z0-9_./:=@+-]+$/.test(value)) {
    return value;
  }
  return `'${value.replaceAll("'", "'\\''")}'`;
}
