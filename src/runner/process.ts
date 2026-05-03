import { createWriteStream } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { ensureDir } from "../fs-utils.js";
import type { CommandResult } from "../types.js";

export interface SpawnCommandOptions {
  command: string;
  args: string[];
  displayCommand: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  stdoutLog: string;
  stderrLog: string;
  timeoutSec?: number | null;
}

let currentChildPid: number | undefined;

export function installSignalHandlers(onInterrupted: (signal: NodeJS.Signals) => void): void {
  const handler = (signal: NodeJS.Signals) => {
    onInterrupted(signal);
    killCurrentProcessGroup(signal);
  };
  process.once("SIGINT", handler);
  process.once("SIGTERM", handler);
}

export async function runSpawnedCommand(options: SpawnCommandOptions): Promise<CommandResult> {
  await ensureDir(path.dirname(options.stdoutLog));
  await ensureDir(path.dirname(options.stderrLog));

  const startedAt = new Date();
  const stdoutStream = createWriteStream(options.stdoutLog, { flags: "a" });
  const stderrStream = createWriteStream(options.stderrLog, { flags: "a" });
  const child = spawn(options.command, options.args, {
    cwd: options.cwd,
    env: options.env,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (child.pid !== undefined) {
    currentChildPid = child.pid;
  }

  child.stdout?.on("data", (chunk: Buffer) => {
    process.stdout.write(chunk);
    stdoutStream.write(chunk);
  });
  child.stderr?.on("data", (chunk: Buffer) => {
    process.stderr.write(chunk);
    stderrStream.write(chunk);
  });

  let timedOut = false;
  let killTimer: NodeJS.Timeout | undefined;
  let forceKillTimer: NodeJS.Timeout | undefined;

  if (options.timeoutSec !== undefined && options.timeoutSec !== null) {
    killTimer = setTimeout(() => {
      timedOut = true;
      killProcessGroup(child.pid, "SIGTERM");
      forceKillTimer = setTimeout(() => killProcessGroup(child.pid, "SIGKILL"), 5_000);
    }, options.timeoutSec * 1000);
  }

  const completion = await new Promise<{
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    spawnError?: Error;
  }>((resolve) => {
    let settled = false;
    const settle = (result: { exitCode: number | null; signal: NodeJS.Signals | null; spawnError?: Error }) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(result);
    };

    child.once("error", (error) => {
      settle({ exitCode: 127, signal: null, spawnError: error });
    });
    child.once("exit", (exitCode, signal) => {
      settle({ exitCode, signal });
    });
  });
  if (killTimer !== undefined) {
    clearTimeout(killTimer);
  }
  if (forceKillTimer !== undefined) {
    clearTimeout(forceKillTimer);
  }
  currentChildPid = undefined;

  if (completion.spawnError !== undefined) {
    const message = `${completion.spawnError.name}: ${completion.spawnError.message}\n`;
    process.stderr.write(message);
    stderrStream.write(message);
  }

  await Promise.all([
    new Promise<void>((resolve) => stdoutStream.end(resolve)),
    new Promise<void>((resolve) => stderrStream.end(resolve))
  ]);

  const endedAt = new Date();
  return {
    command: options.displayCommand,
    cwd: options.cwd,
    exit_code: completion.exitCode,
    signal: completion.signal,
    timed_out: timedOut,
    started_at: startedAt.toISOString(),
    ended_at: endedAt.toISOString(),
    duration_ms: endedAt.getTime() - startedAt.getTime(),
    stdout_log: options.stdoutLog,
    stderr_log: options.stderrLog
  };
}

function killCurrentProcessGroup(signal: NodeJS.Signals): void {
  killProcessGroup(currentChildPid, signal);
}

function killProcessGroup(pid: number | undefined, signal: NodeJS.Signals): void {
  if (pid === undefined) {
    return;
  }
  try {
    process.kill(-pid, signal);
  } catch {
    try {
      process.kill(pid, signal);
    } catch {
      // The process may have already exited.
    }
  }
}
