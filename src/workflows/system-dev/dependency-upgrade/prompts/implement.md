You are running `system-dev/dependency-upgrade`.

Read:
- Normalized upgrade request: {{normalizedInput}}
- Acceptance JSON: {{acceptanceJson}}
- Repo context: {{repoContext}}
- Design: {{design}}
- Implementation plan: {{implementationPlan}}
- Previous implementation review, if present: {{implementationReviewMd}}

This is implementation attempt {{implementationAttempt}}. If a previous implementation review exists, address every rejection reason and required change in this attempt.

Upgrade the requested dependencies in:
{{workspaceDir}}

Use the repository's package manager. Update lockfiles as needed. Do not upgrade unrelated dependencies unless required by the requested upgrade. Do not commit workspace changes.

After implementation, write a summary to:
{{implementationSummary}}

The summary must include changed package files, old/new dependency versions when available, migration changes, validation to run, and residual risks.
