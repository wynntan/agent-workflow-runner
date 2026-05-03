import type { WorkflowDefinition } from "../types.js";
import { helloWorkflow } from "./hello.js";

const workflowList: WorkflowDefinition[] = [
  helloWorkflow
];

export const workflows = new Map(
  workflowList.map((workflow): [string, WorkflowDefinition] => [workflow.id, workflow])
);

export function listWorkflows(): WorkflowDefinition[] {
  return workflowList;
}

export function getWorkflow(id: string): WorkflowDefinition {
  const workflow = workflows.get(id);
  if (workflow === undefined) {
    const available = workflowList.map((entry) => entry.id).join(", ");
    throw new Error(`Unknown workflow "${id}". Available workflows: ${available}`);
  }
  return workflow;
}
