You are running the `system-dev/feature-dev` workflow.

Read:
- Normalized requirement: {{requirementNormalized}}
- Acceptance JSON: {{acceptanceJson}}
- Repo context: {{repoContext}}
- Design: {{design}}
- Implementation plan: {{implementationPlan}}
- Previous implementation review, if present: {{implementationReviewMd}}

This is implementation attempt {{implementationAttempt}}. If a previous implementation review exists, address every rejection reason and required change in this attempt.

Implement the feature in the workspace:
{{workspaceDir}}

Implementation order:
1. First, add or update the tests that capture the required behavior and acceptance criteria.
2. Then implement or update the production code needed to make those tests pass.

If the implementation requires packages, DB schema changes, migrations, generated clients, codegen, or test DB setup, create or update the durable repository files in this step. Do not rely on manual local-only changes. The `prepare_local_environment` shell step runs after implementation review to install dependencies, apply local migrations, run codegen, or prepare the test environment before validation.

Use the repository's existing test style, test framework, naming, and file locations. Prefer focused tests for the requested behavior. If no automated test can reasonably be added or updated, explain the reason in the implementation summary before describing production changes.

Follow the repository's existing style and local instructions. Keep changes scoped to the requirement. Do not commit workspace changes.

After implementation, write a summary to:
{{implementationSummary}}

The implementation summary must include:
- changed files
- behavior implemented
- tests added or updated, or why automated tests were not changed
- packages, migrations, codegen, or local environment preparation required before validation
- validation that should be run
- known limitations or follow-up work

Do not rely on the final natural language answer as the artifact.
