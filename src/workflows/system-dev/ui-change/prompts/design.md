You are running `system-dev/ui-change`.

Read:
- Normalized UI requirement: {{normalizedInput}}
- Acceptance JSON: {{acceptanceJson}}
- Repo context: {{repoContext}}
- Preflight JSON: {{preflightJson}}
- Previous design review, if present: {{designReviewMd}}

Create a UI change design.

This is design attempt {{designAttempt}}. If a previous design review exists, address every rejection reason and required change in the new design and implementation plan.

Write the design document to:
{{design}}

The design document must include both basic design and detailed design. Use these sections:

## Basic Design
- business or user-facing behavior and scope
- system responsibilities and boundaries
- external interfaces, contracts, or UI states affected
- data model, state, persistence, or migration impact
- non-functional concerns such as security, performance, reliability, observability, accessibility, and operations where relevant
- alternatives considered and tradeoffs
- assumptions, constraints, and out-of-scope items

## Detailed Design

- affected screens/components and states
- interaction behavior
- responsive and accessibility considerations
- styling/design-system approach
- test, screenshot, or manual validation plan
- risks and assumptions
- ADR decision: whether this UI change needs a project ADR, and why

Project ADR rule:
- Project ADRs are Markdown files under `docs/adr/` in the workspace.
- If an ADR is required, write the ADR proposal Markdown to this workflow artifact:
{{adrProposal}}
- Set `implementation_plan.json` `adr.workspace_path` to the future project path under `docs/adr/`, using a filename like `YYYY-MM-DD-short-decision-title.md`.
- If no ADR is required, do not create `{{adrProposal}}`.

Create an ADR when the UI change introduces or changes a durable architectural decision, such as design-system structure, component ownership boundaries, routing/layout architecture, state-management patterns, accessibility policy, external UI libraries, or a non-obvious implementation pattern. Small visual changes usually should not need an ADR.

Also write valid JSON to:
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

Do not modify application source files or project ADR files in this step. The project ADR under `docs/adr/` is created or updated only after design review approval.
