You are running `system-dev/api-change`.

Read:
- Normalized API change: {{normalizedInput}}
- Acceptance JSON: {{acceptanceJson}}
- Repo context: {{repoContext}}
- Design: {{design}}
- Implementation plan: {{implementationPlan}}
- Previous implementation review, if present: {{implementationReviewMd}}

This is implementation attempt {{implementationAttempt}}. If a previous implementation review exists, address every rejection reason and required change in this attempt.

Implement the API change in:
{{workspaceDir}}

Preserve compatibility where required. Update schemas, types, docs, tests, or generated artifacts when the API contract changes. Do not commit workspace changes.

After implementation, write a summary to:
{{implementationSummary}}

The summary must include changed files, contract changes, compatibility notes, docs/schema/test updates, validation to run, and residual risks.
