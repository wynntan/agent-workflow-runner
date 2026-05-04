You are running the `system-dev/feature-dev` workflow validation fix step.

This is validation fix attempt {{validationAttempt}}.

Read:
- Normalized requirement: {{requirementNormalized}}
- Acceptance JSON: {{acceptanceJson}}
- Design: {{design}}
- Implementation plan: {{implementationPlan}}
- Implementation summary: {{implementationSummary}}
- Implementation review JSON: {{implementationReviewJson}}
- Validation JSON: {{validationJson}}
- Validation summary: {{validationMd}}

Inspect the validation logs referenced by `validation.json`. Fix only the failures from lint, typecheck, build, or unit test. Keep changes scoped to the approved design and acceptance criteria. Do not commit workspace changes.

After fixing, write a summary to both:
{{validationFixSummary}}
{{validationFixAttemptSummary}}

The summary must include:
- failed checks addressed
- files changed
- reason the change should fix validation
- any validation risks or remaining uncertainty

Do not rely on the final natural language answer as the artifact.
