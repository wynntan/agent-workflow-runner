# system-dev/api-change

API変更要求を入力に、契約、互換性、migration、docs、検証、E2E、PR作成を扱うapi change workflowです。

## Command

```bash
awr run system-dev/api-change --workspace-dir /path/to/project --var task_name=my-api-change --var api_change_file=/path/to/api-change.md
awr run system-dev/api-change --workspace-dir /path/to/project --var task_name=my-api-change --var api_change="Change ..."
```

## Variables

| name | type | required | default | summary |
|---|---|---:|---|---|
| `task_name` | string | yes | - | 作業branch名の元になるタスク名。`api-change/<slug>` のbranchを `origin/dev` 最新から作成する。 |
| `api_change_file` | string | no | `""` | API変更要件Markdown file path。 |
| `api_change` | string | no | `""` | 短いAPI変更要件本文。 |
| `model` | string | no | `""` | Codex stepごとのmodel割当。未指定stepは `gpt-5.5`。 |

`api_change_file` と `api_change` はどちらか一方が必須です。

`model` は `step=model` をcommaまたは改行区切りで指定します。未指定stepは `gpt-5.5` です。指定できるstep名は `repo_scan`, `normalize_input`, `design`, `design_review`, `implement`, `implementation_review`, `fix_validation`, `fix_e2e` です。

## Behavior

- `origin/dev` 最新から `api-change/<slug>` branchを作成する。
- API contract、互換性、migration、docs更新、検証範囲を設計に含める。
- design / implementation reviewは最大3回まで再実行する。
- validateを実行し、E2Eはfailed時に必要な修正を挟んで最大3回まで再実行する。最後に既存差分をすべてcommitしてPRを作成する。

## PR Rule

- commit message: `api-change: <task_name>`
- PR title: `api-change: <task_name>`
- PR body headings: `Summary`, `Changes`, `Validation`, `ADR`, `Workflow Artifacts`, `Notes`

## Outputs

`branch.json`, `branch.md`, `input.original.md`, `input.normalized.md`, `acceptance.json`, `repo_context.md`, `design.md`, `implementation_plan.json`, `design_review.md`, `design_review.json`, `adr_proposal.md`, `adr_apply.json`, `adr_apply.md`, `implementation_summary.md`, `implementation_review.md`, `implementation_review.json`, `validation.json`, `validation.md`, `e2e.json`, `e2e.md`, `e2e-logs/<step>/`, `e2e_fix_summary.md`, `e2e_fixes/attempt-*.md`, `handoff.md`, `pr_body.md`, `pr.json`, `pr.md`

## Requirements

- `codex` CLI
- GitHub CLI `gh`
- git workspace
- clean workspace at branch creation
- `origin/dev` remote branch
- Node.js

## Template

- [api-change-template.md](../../src/workflows/system-dev/api-change/api-change-template.md)

## Implementation

- [src/workflows/system-dev/api-change/index.ts](../../src/workflows/system-dev/api-change/index.ts)
