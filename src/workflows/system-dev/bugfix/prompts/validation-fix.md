You are running the `system-dev/bugfix` workflow validation fix step.

This is validation fix attempt {{validationAttempt}}.

Read:
- Normalized bug report: {{normalizedInput}}
- Acceptance JSON: {{acceptanceJson}}
- Design: {{design}}
- Implementation plan: {{implementationPlan}}
- Implementation summary: {{implementationSummary}}
- Implementation review JSON: {{implementationReviewJson}}
- Validation JSON: {{validationJson}}
- Validation summary: {{validationMd}}

Inspect the validation logs referenced by `validation.json`. Fix only the failures from lint, typecheck, build, or unit test. Preserve the intended bugfix and avoid unrelated cleanup. Do not commit workspace changes.

After fixing, write a summary to both:
{{validationFixSummary}}
{{validationFixAttemptSummary}}

The summary must include failed checks addressed, files changed, why the fix should pass validation, and remaining risks. Do not rely on the final natural language answer as the artifact.
