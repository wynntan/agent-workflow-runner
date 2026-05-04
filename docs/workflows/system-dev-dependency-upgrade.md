# system-dev/dependency-upgrade

依存関係更新要求を入力に、対象依存・互換性・lockfile・検証・E2E・PR作成を管理するdependency upgrade workflowです。

## Command

```bash
awr run system-dev/dependency-upgrade --workspace-dir /path/to/project --var task_name=my-upgrade --var upgrade_request_file=/path/to/upgrade-request.md
awr run system-dev/dependency-upgrade --workspace-dir /path/to/project --var task_name=my-upgrade --var upgrade_request="Upgrade ..."
```

## Variables

| name | type | required | default | summary |
|---|---|---:|---|---|
| `task_name` | string | yes | - | 作業branch名の元になるタスク名。`dependency-upgrade/<slug>` のbranchを `origin/dev` 最新から作成する。 |
| `upgrade_request_file` | string | no | `""` | 依存関係更新要求Markdown file path。 |
| `upgrade_request` | string | no | `""` | 短い依存関係更新要求本文。 |
| `model` | string | no | `""` | Codex stepごとのmodel割当。未指定stepは `gpt-5.5`。 |

`upgrade_request_file` と `upgrade_request` はどちらか一方が必須です。

`model` は `step=model` をcommaまたは改行区切りで指定します。未指定stepは `gpt-5.5` です。指定できるstep名は `repo_scan`, `normalize_input`, `design`, `design_review`, `implement`, `implementation_review`, `fix_validation`, `fix_e2e` です。

## Behavior

- `origin/dev` 最新から `dependency-upgrade/<slug>` branchを作成する。
- lockfile、互換性、破壊的変更、検証範囲を設計で明示する。
- design / implementation reviewは最大3回まで再実行する。
- validateを実行し、E2Eはfailed時に必要な修正を挟んで最大3回まで再実行する。最後に既存差分をすべてcommitしてPRを作成する。

## PR Rule

- commit message: `dependency-upgrade: <task_name>`
- PR title: `dependency-upgrade: <task_name>`
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

- [upgrade-request-template.md](../../src/workflows/system-dev/dependency-upgrade/upgrade-request-template.md)

## Implementation

- [src/workflows/system-dev/dependency-upgrade/index.ts](../../src/workflows/system-dev/dependency-upgrade/index.ts)
