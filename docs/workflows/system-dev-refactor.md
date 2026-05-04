# system-dev/refactor

リファクタリング目標を入力に、振る舞い維持の条件を固定し、設計、変更、検証、E2E、handoff、PR作成を実行するrefactor workflowです。

## Command

```bash
awr run system-dev/refactor --workspace-dir /path/to/project --var task_name=my-refactor --var refactor_goal_file=/path/to/refactor-goal.md
awr run system-dev/refactor --workspace-dir /path/to/project --var task_name=my-refactor --var refactor_goal="Refactor ..."
```

## Variables

| name | type | required | default | summary |
|---|---|---:|---|---|
| `task_name` | string | yes | - | 作業branch名の元になるタスク名。`refactor/<slug>` のbranchを `origin/dev` 最新から作成する。 |
| `refactor_goal_file` | string | no | `""` | リファクタリング目標Markdown file path。 |
| `refactor_goal` | string | no | `""` | 短いリファクタリング目標本文。 |
| `model` | string | no | `""` | Codex stepごとのmodel割当。未指定stepは `gpt-5.5`。 |

`refactor_goal_file` と `refactor_goal` はどちらか一方が必須です。

`model` は `step=model` をcommaまたは改行区切りで指定します。未指定stepは `gpt-5.5` です。指定できるstep名は `repo_scan`, `normalize_input`, `design`, `design_review`, `implement`, `implementation_review`, `fix_validation`, `fix_e2e` です。

## Behavior

- `origin/dev` 最新から `refactor/<slug>` branchを作成する。
- 外部挙動維持をacceptanceとして扱う。
- design / implementation reviewは最大3回まで再実行する。
- validateを実行し、E2Eはfailed時に必要な修正を挟んで最大3回まで再実行する。最後に既存差分をすべてcommitしてPRを作成する。

## PR Rule

- commit message: `refactor: <task_name>`
- PR title: `refactor: <task_name>`
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

- [refactor-goal-template.md](../../src/workflows/system-dev/refactor/refactor-goal-template.md)

## Implementation

- [src/workflows/system-dev/refactor/index.ts](../../src/workflows/system-dev/refactor/index.ts)
