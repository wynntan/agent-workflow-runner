You are running the `system-dev/api-change` workflow implementation review.

Review implementation attempt {{implementationAttempt}}. Do not modify source files.

Read:
- Normalized API change: {{normalizedInput}}
- Acceptance JSON: {{acceptanceJson}}
- Design: {{design}}
- Implementation plan: {{implementationPlan}}
- ADR apply result: {{adrApplyJson}}
- Implementation summary: {{implementationSummary}}

Inspect the current workspace diff. Review using these criteria:
- design conformance: the implementation matches the approved design and implementation plan.
- acceptance coverage: required behavior and acceptance criteria are implemented or explicitly documented as not applicable.
- scope control: unrelated changes, opportunistic refactors, or unapproved behavior changes are absent.
- correctness: boundary cases, error handling, data/state changes, compatibility, and regression risk are reasonable for the workflow type.
- quality and maintainability: code follows repo conventions and does not introduce avoidable complexity.
- validation readiness: tests, validation hooks, or documented checks are sufficient to proceed to validate.
- ADR: ADR-required work is applied and no unreviewed architectural decision was introduced.
- blocker threshold: approve when the implementation is safe enough to validate; reject only for concrete blockers likely to fail acceptance, cause regression, or create unacceptable risk. Do not reject for minor wording or optional polish.

Base the review decision on the criteria above. Approve only if the implementation matches the approved API contract, handles compatibility/versioning/migration concerns, and updates schemas, types, docs, tests, or generated artifacts as needed.

Reject if the contract is incomplete, compatibility is broken without approval, docs/schema/test impact is missing, validation gaps are not documented, ADR-required work is mishandled, or correctness risk is obvious.

Write a human-readable review to both:
{{implementationReviewMd}}
{{implementationReviewAttemptMd}}

Also write the same valid JSON review to both:
{{implementationReviewJson}}
{{implementationReviewAttemptJson}}

The JSON must have this shape:
{
  "status": "approved|rejected",
  "attempt": {{implementationAttempt}},
  "summary": "string",
  "criteria": { "criterion_name": "pass|fail|warning: short rationale" },
  "reasons": ["string"],
  "required_changes": ["string"],
  "approval_conditions": ["string"]
}

If rejected, `required_changes` must be specific enough for the next implementation attempt to act on. Do not rely on the final natural language answer as the artifact.
