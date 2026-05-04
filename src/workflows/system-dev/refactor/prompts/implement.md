You are running `system-dev/refactor`.

Read:
- Normalized refactor goal: {{normalizedInput}}
- Acceptance JSON: {{acceptanceJson}}
- Repo context: {{repoContext}}
- Design: {{design}}
- Implementation plan: {{implementationPlan}}
- Previous implementation review, if present: {{implementationReviewMd}}

This is implementation attempt {{implementationAttempt}}. If a previous implementation review exists, address every rejection reason and required change in this attempt.

Refactor the target area in:
{{workspaceDir}}

Preserve external behavior unless the normalized input explicitly allows a change. Keep changes scoped. Avoid opportunistic features. Do not commit workspace changes.

After implementation, write a summary to:
{{implementationSummary}}

The summary must include changed files, structural changes, behavior-preservation notes, validation to run, and residual risks.
