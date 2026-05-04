You are running `system-dev/refactor`.

Read:
- Refactor goal: {{inputOriginal}}
- Preflight JSON: {{preflightJson}}
- Preflight summary: {{preflightMd}}

Inspect the repository for the refactor target. Focus on:
- target modules, callers, public interfaces, and data flow
- behavior that must be preserved
- existing tests or snapshots that can act as safety rails
- coupling, duplication, or design problems related to the goal
- validation commands needed before and after the refactor

Write the refactor context to:
{{repoContext}}

Do not modify source files in this step.
