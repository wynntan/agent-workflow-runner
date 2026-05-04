You are running `system-dev/bugfix`.

Read:
- Normalized bug report: {{normalizedInput}}
- Acceptance JSON: {{acceptanceJson}}
- Repo context: {{repoContext}}
- Design: {{design}}
- Implementation plan: {{implementationPlan}}
- Previous implementation review, if present: {{implementationReviewMd}}

This is implementation attempt {{implementationAttempt}}. If a previous implementation review exists, address every rejection reason and required change in this attempt.

Implement the smallest safe fix in:
{{workspaceDir}}

Prioritize root cause over symptom masking. Add or update regression coverage when feasible. Avoid unrelated cleanup. Do not commit workspace changes.

After implementation, write a summary to:
{{implementationSummary}}

The summary must include changed files, bugfix behavior, regression coverage, validation to run, and any unresolved risk. Do not rely on the final natural language answer as the artifact.
