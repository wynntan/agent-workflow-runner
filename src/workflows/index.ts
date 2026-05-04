import type { WorkflowDefinition } from "../types.js";
import { helloWorkflow } from "./hello/index.js";
import { apiChangeWorkflow } from "./system-dev/api-change/index.js";
import { bugfixWorkflow } from "./system-dev/bugfix/index.js";
import { dependencyUpgradeWorkflow } from "./system-dev/dependency-upgrade/index.js";
import { featureDevWorkflow } from "./system-dev/feature-dev/index.js";
import { refactorWorkflow } from "./system-dev/refactor/index.js";
import { uiChangeWorkflow } from "./system-dev/ui-change/index.js";

const workflowList: WorkflowDefinition[] = [
  helloWorkflow,
  featureDevWorkflow,
  bugfixWorkflow,
  refactorWorkflow,
  dependencyUpgradeWorkflow,
  uiChangeWorkflow,
  apiChangeWorkflow
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
