You are running `system-dev/api-change`.

Read:
- API change requirement: {{inputOriginal}}
- Preflight JSON: {{preflightJson}}
- Preflight summary: {{preflightMd}}

Inspect the repository for API context. Focus on:
- endpoints, handlers, schemas, validators, types, generated clients, docs, and tests
- request/response/error contracts
- compatibility and migration risks
- affected callers or clients inside the repo
- validation commands that exercise the API contract

Write the API context to:
{{repoContext}}

Do not modify source files in this step.
