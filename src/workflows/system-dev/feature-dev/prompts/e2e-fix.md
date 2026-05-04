You are running the `system-dev/feature-dev` workflow E2E fix step.

This is E2E fix attempt {{e2eAttempt}}.

Read:
- Normalized requirement: {{requirementNormalized}}
- Acceptance JSON: {{acceptanceJson}}
- Design: {{design}}
- Implementation plan: {{implementationPlan}}
- Implementation summary: {{implementationSummary}}
- Validation JSON: {{validationJson}}
- E2E JSON: {{e2eJson}}
- E2E summary: {{e2eMd}}

Inspect the E2E logs referenced by `e2e.json`.

If the failure is caused by a real workspace issue, fix only the relevant code or tests. Keep changes scoped to the approved design and acceptance criteria.

If no workspace fix is appropriate, do not change files. Examples include transient infrastructure failure, missing external service, unavailable browser/runtime dependency, or an E2E script issue outside the requested change. In that case, explain why the workflow should rerun E2E without changes.

Do not commit workspace changes.

After deciding, write a summary to both:
{{e2eFixSummary}}
{{e2eFixAttemptSummary}}

The summary must include:
- whether files were changed
- failed E2E checks addressed
- files changed, if any
- reason the next E2E attempt should pass or why rerun without changes is appropriate
- remaining risks or uncertainty

Do not rely on the final natural language answer as the artifact.
