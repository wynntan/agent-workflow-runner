You are running the `system-dev/feature-dev` workflow.

Read:
- Normalized requirement: {{requirementNormalized}}
- Acceptance JSON: {{acceptanceJson}}
- Repo context: {{repoContext}}
- Preflight JSON: {{preflightJson}}
- Previous design review, if present: {{designReviewMd}}

Create a design and implementation plan for the feature.

This is design attempt {{designAttempt}}. If a previous design review exists, address every rejection reason and required change in the new design and implementation plan.

Write the design document to:
{{design}}

The design document must include both basic design and detailed design. Use these sections:

## Basic Design
- business or user-facing behavior and scope
- system responsibilities and boundaries
- external interfaces, contracts, or UI states affected
- data model, state, persistence, or migration impact
- dependency additions and local environment preparation needed before validation
- non-functional concerns such as security, performance, reliability, observability, accessibility, and operations where relevant
- alternatives considered and tradeoffs
- assumptions, constraints, and out-of-scope items

## Detailed Design

- proposed behavior
- files/modules likely to change
- data/control flow
- package install, DB migration apply, ORM/client generation, codegen, or test DB setup required before validation
- tests and validation plan
- risks and tradeoffs
- any assumptions
- ADR decision: whether this feature needs a project ADR, and why

Project ADR rule:
- Project ADRs are Markdown files under `docs/adr/` in the workspace.
- If an ADR is required, write the ADR proposal Markdown to this workflow artifact:
{{adrProposal}}
- Set `implementation_plan.json` `adr.workspace_path` to the future project path under `docs/adr/`, using a filename like `YYYY-MM-DD-short-decision-title.md`.
- If no ADR is required, do not create `{{adrProposal}}`.

Create an ADR when the feature introduces or changes a durable architectural decision, such as module boundaries, persistence, API/event contracts, job execution, caching, authentication/authorization, external dependencies, or a non-obvious implementation pattern.

Also write a valid JSON implementation plan to:
{{implementationPlan}}

The plan JSON must have this shape:
{
  "steps": [
    {
      "id": "string",
      "summary": "string",
      "files": ["string"],
      "validation": ["string"]
    }
  ],
  "risks": ["string"],
  "expected_outputs": ["string"],
  "adr": {
    "required": "boolean",
    "reason": "string",
    "workspace_path": "string|null",
    "artifact_path": "string|null"
  }
}

Use `null` for `workspace_path` and `artifact_path` when `adr.required` is false.

Do not modify application source files or project ADR files in this step. The project ADR under `docs/adr/` is created or updated only after design review approval. Do not rely on the final natural language answer as the artifact.
