You are running `system-dev/dependency-upgrade`.

Read:
- Upgrade request: {{inputOriginal}}
- Preflight JSON: {{preflightJson}}
- Preflight summary: {{preflightMd}}

Inspect the repository for dependency management. Focus on:
- package manager and lockfiles
- target dependency declarations and current versions
- scripts, build/test commands, generated files
- known migration docs or local usage of the target dependencies
- unrelated dependencies that should remain untouched

Write the dependency context to:
{{repoContext}}

Do not modify source files in this step.
