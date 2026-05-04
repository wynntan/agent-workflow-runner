# system-dev/feature-dev

要件定義を入力に、repo scan、要件正規化、設計、実装、検証、E2E、handoff、PR作成を順に実行する機能追加workflowです。

## Command

```bash
awr run system-dev/feature-dev --workspace-dir /path/to/project --var task_name=my-feature --var requirement_file=/path/to/requirement.md
awr run system-dev/feature-dev --workspace-dir /path/to/project --var task_name=my-feature --var requirement="Add ..."
```

## Variables

| name | type | required | default | summary |
|---|---|---:|---|---|
| `task_name` | string | yes | - | 作業branch名の元になるタスク名。`feature/<slug>` のbranchを `origin/dev` 最新から作成する。 |
| `requirement_file` | string | no | `""` | 要件定義Markdown file path。長文要件ではこちらを推奨。 |
| `requirement` | string | no | `""` | 短い要件定義本文。`requirement_file` が空の場合に使う。 |
| `model` | string | no | `""` | Codex stepごとのmodel割当。未指定stepは `gpt-5.5`。 |

`requirement_file` と `requirement` はどちらか一方が必須です。

`model` は `step=model` をcommaまたは改行区切りで指定します。未指定stepは `gpt-5.5` です。指定できるstep名は `repo_scan`, `normalize_requirements`, `design`, `design_review`, `implement`, `implementation_review`, `fix_validation`, `fix_e2e` です。

## Flow

| step | runner | summary |
|---|---|---|
| `create_task_branch` | shell | 最新の `origin/dev` を取得し、`dev` から `feature/<slug>` branchを作成する。 |
| `capture_requirement` | shell | 入力要件をartifactへ固定する。 |
| `preflight` | shell | workspaceのgit状態、package scripts、tool候補を記録する。 |
| `repo_scan` | codex | 要件に関係するrepo構造、既存実装、ルール、影響範囲を調査する。 |
| `normalize_requirements` | codex | 要件を定型Markdownとacceptance JSONへ正規化する。 |
| `design` | codex | 実装方針と実装計画を作る。必要な場合はADR案をartifactへ出力する。 |
| `design_review` | codex | 設計を承認/却下する。却下なら最大3回まで設計を再実行する。 |
| `apply_adr` | shell | 承認済み設計でADRが必要な場合、`adr_proposal.md` をworkspaceの `docs/adr/` に反映する。 |
| `implement` | codex | workspaceに機能追加を実装する。 |
| `implementation_review` | codex | 実装内容を承認/却下する。却下なら最大3回まで実装を再実行する。 |
| `prepare_local_environment` | shell | 依存関係install、DB migration適用、codegen、test DB準備など、validate前に必要なローカル環境反映を実行する。 |
| `validate` | shell | lint、typecheck、build、unit testを実行して記録する。 |
| `fix_validation` | codex | validateがfailedの場合、失敗した検証を修正する。最大3回までvalidateを再実行する。 |
| `e2e` | shell | E2E test scriptがある場合に実行して記録する。 |
| `fix_e2e` | codex | E2Eがfailedの場合、必要に応じて修正する。最大3回までE2Eを再実行する。 |
| `handoff` | shell | validationとE2Eの結果を含む最終handoffを作る。 |
| `create_pr` | shell | 既存差分をすべてcommitし、branchをpushしてPRを作成する。 |

## PR Rule

- commit message: `<branch_prefix>: <task_name>`
- PR title: `<branch_prefix>: <task_name>`
- PR body headings: `Summary`, `Changes`, `Validation`, `ADR`, `Workflow Artifacts`, `Notes`
- 既存PRがある場合は新規作成せず、title/bodyを更新する。

## Outputs

`branch.json`, `branch.md`, `requirement.original.md`, `requirement.normalized.md`, `acceptance.json`, `repo_context.md`, `design.md`, `implementation_plan.json`, `design_review.md`, `design_review.json`, `design_reviews/attempt-*.md`, `design_reviews/attempt-*.json`, `adr_proposal.md`, `adr_apply.json`, `adr_apply.md`, `implementation_summary.md`, `implementation_review.md`, `implementation_review.json`, `implementation_reviews/attempt-*.md`, `implementation_reviews/attempt-*.json`, `prepare_local_environment.json`, `prepare_local_environment.md`, `prepare-local-environment-logs/<step>/`, `validation.json`, `validation.md`, `validation-logs/<step>/`, `validation_fix_summary.md`, `validation_fixes/attempt-*.md`, `e2e.json`, `e2e.md`, `e2e-logs/<step>/`, `e2e_fix_summary.md`, `e2e_fixes/attempt-*.md`, `handoff.md`, `pr_body.md`, `pr.json`, `pr.md`

## Requirements

- `codex` CLI
- GitHub CLI `gh`
- git workspace
- clean workspace at branch creation
- `origin/dev` remote branch
- Node.js

## Template

- [requirement-template.md](../../src/workflows/system-dev/feature-dev/requirement-template.md)

## Implementation

- [src/workflows/system-dev/feature-dev/index.ts](../../src/workflows/system-dev/feature-dev/index.ts)
