#!/usr/bin/env node
import { runWorkflow } from "./runner/run.js";
import { getWorkflow, listWorkflows } from "./workflows/index.js";

type CliArgs =
  | {
      command: "run";
      workflowId: string;
      artifactRepoDir?: string;
      workspaceDir?: string;
      vars: Record<string, string>;
    }
  | {
      command: "list";
    };

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "list") {
    printWorkflowList();
    return;
  }

  const workflow = getWorkflow(args.workflowId);
  const manifest = await runWorkflow(workflow, {
    artifactRepoDir: args.artifactRepoDir,
    workspaceDir: args.workspaceDir,
    vars: args.vars
  });

  const summary = {
    run_id: manifest.run_id,
    workflow_id: manifest.workflow_id,
    status: manifest.status,
    artifact_repo_dir: manifest.artifact_repo_dir,
    artifact_repo_branch: manifest.artifact_repo_branch,
    run_dir: manifest.run_dir,
    workspace_run_dir: manifest.workspace_run_dir,
    artifacts_dir: manifest.artifacts_dir,
    manifest: `${manifest.run_dir}/run.json`
  };
  process.stdout.write(`\n${JSON.stringify(summary, null, 2)}\n`);
  process.exitCode = manifest.status === "passed" ? 0 : 1;
}

function parseArgs(args: string[]): CliArgs {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  const command = args.shift();
  if (command === "list") {
    return { command };
  }
  if (command !== "run") {
    throw new Error(`Unknown command "${command}". Expected "run" or "list".`);
  }

  const workflowId = args.shift();
  if (workflowId === undefined || workflowId.startsWith("-")) {
    throw new Error("Usage: awr run <workflow-id> [--var key=value] [--workspace-dir dir] [--artifact-repo-dir dir]");
  }

  const vars: Record<string, string> = {};
  let artifactRepoDir: string | undefined;
  let workspaceDir: string | undefined;
  while (args.length > 0) {
    const flag = args.shift();
    if (flag === "--artifact-repo-dir") {
      artifactRepoDir = takeFlagValue(args, flag);
    } else if (flag === "--workspace-dir") {
      workspaceDir = takeFlagValue(args, flag);
    } else if (flag === "--var" || flag === "-v") {
      const assignment = takeFlagValue(args, flag);
      const separator = assignment.indexOf("=");
      if (separator <= 0) {
        throw new Error(`${flag} expects key=value`);
      }
      vars[assignment.slice(0, separator)] = assignment.slice(separator + 1);
    } else {
      throw new Error(`Unknown flag "${flag}"`);
    }
  }

  return {
    command: "run",
    workflowId,
    vars,
    ...(artifactRepoDir === undefined ? {} : { artifactRepoDir }),
    ...(workspaceDir === undefined ? {} : { workspaceDir })
  };
}

function takeFlagValue(args: string[], flag: string): string {
  const value = args.shift();
  if (value === undefined) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function printHelp(): void {
  process.stdout.write(`agent-workflow-runner

Usage:
  awr run <workflow-id> [--var key=value] [--workspace-dir dir] [--artifact-repo-dir dir]
  awr list

Commands:
  run     Execute a registered workflow synchronously.
  list    Show registered workflows.
`);
}

function printWorkflowList(): void {
  for (const workflow of listWorkflows()) {
    process.stdout.write(`${workflow.id}\t${workflow.summary}\n`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
