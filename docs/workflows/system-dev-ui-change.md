# system-dev/ui-change

UI変更要求を入力に、画面状態、アクセシビリティ、レスポンシブ、検証、E2E、PR作成を扱うui change workflowです。

## Command

```bash
awr run system-dev/ui-change --workspace-dir /path/to/project --var task_name=my-ui-change --var ui_requirement_file=/path/to/ui-requirement.md
awr run system-dev/ui-change --workspace-dir /path/to/project --var task_name=my-ui-change --var ui_requirement="Change ..."
```

## Variables

| name | type | required | default | summary |
|---|---|---:|---|---|
| `task_name` | string | yes | - | 作業branch名の元になるタスク名。`ui-change/<slug>` のbranchを `origin/dev` 最新から作成する。 |
| `ui_requirement_file` | string | no | `""` | UI変更要件Markdown file path。 |
| `ui_requirement` | string | no | `""` | 短いUI変更要件本文。 |
| `model` | string | no | `""` | Codex stepごとのmodel割当。未指定stepは `gpt-5.5`。 |

`ui_requirement_file` と `ui_requirement` はどちらか一方が必須です。

`model` は `step=model` をcommaまたは改行区切りで指定します。未指定stepは `gpt-5.5` です。指定できるstep名は `repo_scan`, `normalize_input`, `design`, `design_review`, `implement`, `implementation_review`, `fix_validation`, `fix_e2e` です。

## Behavior

- `origin/dev` 最新から `ui-change/<slug>` branchを作成する。
- 画面状態、アクセシビリティ、レスポンシブ、視覚確認観点を設計に含める。
- design / implementation reviewは最大3回まで再実行する。
- validateを実行し、E2Eはfailed時に必要な修正を挟んで最大3回まで再実行する。最後に既存差分をすべてcommitしてPRを作成する。

## PR Rule

- commit message: `ui-change: <task_name>`
- PR title: `ui-change: <task_name>`
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

- [ui-requirement-template.md](../../src/workflows/system-dev/ui-change/ui-requirement-template.md)

## Implementation

- [src/workflows/system-dev/ui-change/index.ts](../../src/workflows/system-dev/ui-change/index.ts)
