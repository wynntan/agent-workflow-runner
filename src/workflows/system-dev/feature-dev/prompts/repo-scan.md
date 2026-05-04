You are running the `system-dev/feature-dev` workflow.

Workspace:
{{workspaceDir}}

Read these artifacts first:
- Task branch: {{branchJson}}
- Original requirement: {{requirementOriginal}}
- Preflight JSON: {{preflightJson}}
- Preflight summary: {{preflightMd}}

Inspect the repository for the requested feature. Focus on:
- project structure and package/tooling
- existing rules or agent instructions
- files and modules likely related to the requirement
- existing tests or validation commands
- implementation risks and unknowns

Write the repository context to:
{{repoContext}}

Do not modify source files in this step. Do not rely on the final natural language answer as the artifact.
