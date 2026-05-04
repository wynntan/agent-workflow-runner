# system-dev/bugfix

不具合報告を入力に、再現観点、原因調査、修正、検証、E2E、handoff、PR作成を実行するbugfix workflowです。

## Command

```bash
awr run system-dev/bugfix --workspace-dir /path/to/project --var task_name=my-bugfix --var bug_report_file=/path/to/bug-report.md
awr run system-dev/bugfix --workspace-dir /path/to/project --var task_name=my-bugfix --var bug_report="Fix ..."
```

## Variables

| name | type | required | default | summary |
|---|---|---:|---|---|
| `task_name` | string | yes | - | 作業branch名の元になるタスク名。`bugfix/<slug>` のbranchを `origin/dev` 最新から作成する。 |
| `bug_report_file` | string | no | `""` | 不具合報告Markdown file path。 |
| `bug_report` | string | no | `""` | 短い不具合報告本文。 |
| `model` | string | no | `""` | Codex stepごとのmodel割当。未指定stepは `gpt-5.5`。 |

`bug_report_file` と `bug_report` はどちらか一方が必須です。

`model` は `step=model` をcommaまたは改行区切りで指定します。未指定stepは `gpt-5.5` です。指定できるstep名は `repo_scan`, `normalize_input`, `design`, `design_review`, `implement`, `implementation_review`, `fix_validation`, `fix_e2e` です。

## Behavior

- `origin/dev` 最新から `bugfix/<slug>` branchを作成する。
- design / implementation reviewは最大3回まで再実行する。
- validateはlint、typecheck、build、unit testを実行し、failed時は最大3回まで修正stepを呼ぶ。
- E2E scriptがあれば実行し、failed時は必要な修正を挟んで最大3回まで再実行する。なければskippedとして記録する。
- 最後に既存差分をすべてcommitし、pushしてPRを作成する。

## PR Rule

- commit message: `bugfix: <task_name>`
- PR title: `bugfix: <task_name>`
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

- [bug-report-template.md](../../src/workflows/system-dev/bugfix/bug-report-template.md)

## Implementation

- [src/workflows/system-dev/bugfix/index.ts](../../src/workflows/system-dev/bugfix/index.ts)
