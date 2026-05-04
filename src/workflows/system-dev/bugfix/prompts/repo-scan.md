You are running `system-dev/bugfix`.

Read:
- Bug report: {{inputOriginal}}
- Preflight JSON: {{preflightJson}}
- Preflight summary: {{preflightMd}}

Inspect the repository for the bug. Focus on:
- code paths likely responsible for the actual behavior
- reproduction entry points, fixtures, tests, routes, UI states, or commands
- expected behavior implied by existing tests/docs
- recent or nearby code that could explain a regression
- validation commands that can prove the fix

Write the bug investigation context to:
{{repoContext}}

Do not modify source files in this step. Do not rely on the final natural language answer as the artifact.
