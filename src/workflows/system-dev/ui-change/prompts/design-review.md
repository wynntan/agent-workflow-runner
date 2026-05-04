You are running the `system-dev/ui-change` workflow design review.

Review design attempt {{designAttempt}}. Do not modify source files or project ADR files in this step.

Read:
- Normalized UI requirement: {{normalizedInput}}
- Acceptance JSON: {{acceptanceJson}}
- Repo context: {{repoContext}}
- Design: {{design}}
- Implementation plan: {{implementationPlan}}
- ADR proposal artifact, if present: {{adrProposal}}

Review using these criteria:
- acceptance coverage: the design covers all acceptance criteria and constraints.
- basic design: system boundaries, responsibilities, external interfaces, data or state impact, non-functional concerns, assumptions, out-of-scope items, and tradeoffs are explicit.
- detailed design: changed files or modules, control flow, validation plan, risks, and implementation sequencing are actionable.
- repo fit: the design is consistent with repo context, existing architecture, and local conventions.
- ADR: ADR need, proposal content, and future workspace path are correct when applicable.
- blocker threshold: approve when the design is safe enough to implement; reject only for concrete blockers likely to cause incorrect implementation, unacceptable risk, or missing acceptance coverage. Do not reject for minor wording or optional polish.

Base the review decision on the criteria above. Approve only if the design covers target UI states, interactions, responsive behavior, accessibility basics, visual/manual validation, repo design-system conventions, and includes a correct ADR decision.

Reject if important states are missing, accessibility or responsive risk is ignored, the design conflicts with the existing design system, validation is weak, the implementation plan is not actionable, or the ADR decision/content is wrong.

Write a human-readable review to both:
{{designReviewMd}}
{{designReviewAttemptMd}}

Also write the same valid JSON review to both:
{{designReviewJson}}
{{designReviewAttemptJson}}

The JSON must have this shape:
{
  "status": "approved|rejected",
  "attempt": {{designAttempt}},
  "summary": "string",
  "criteria": { "criterion_name": "pass|fail|warning: short rationale" },
  "reasons": ["string"],
  "required_changes": ["string"],
  "approval_conditions": ["string"]
}

If rejected, `required_changes` must be specific enough for the next design attempt to act on. Do not rely on the final natural language answer as the artifact.
