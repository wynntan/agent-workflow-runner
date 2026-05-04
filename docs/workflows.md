# Workflows

`awr run <workflow-id>` で実行できる登録済みworkflowの一覧です。各workflowの詳細は個別ファイルに記載します。

| workflow id | 用途 | 主な入力 | 詳細 |
|---|---|---|---|
| `hello` | runnerの基本動作確認。shell stepとCodex stepでartifactを生成する。 | `message` | [hello](workflows/hello.md) |
| `system-dev/feature-dev` | 通常の機能追加。要件定義から実装、検証、E2E、handoff、PR作成まで実行する。 | `task_name`, `requirement_file` / `requirement` | [system-dev/feature-dev](workflows/system-dev-feature-dev.md) |
| `system-dev/bugfix` | 不具合修正。再現観点、原因調査、修正、検証、E2E、PR作成を実行する。 | `task_name`, `bug_report_file` / `bug_report` | [system-dev/bugfix](workflows/system-dev-bugfix.md) |
| `system-dev/refactor` | リファクタリング。外部挙動維持を前提に構造改善、検証、E2E、PR作成を実行する。 | `task_name`, `refactor_goal_file` / `refactor_goal` | [system-dev/refactor](workflows/system-dev-refactor.md) |
| `system-dev/dependency-upgrade` | 依存関係更新。対象依存、lockfile、互換性、検証、E2E、PR作成を管理する。 | `task_name`, `upgrade_request_file` / `upgrade_request` | [system-dev/dependency-upgrade](workflows/system-dev-dependency-upgrade.md) |
| `system-dev/ui-change` | UI変更。画面状態、アクセシビリティ、レスポンシブ、検証、E2E、PR作成を扱う。 | `task_name`, `ui_requirement_file` / `ui_requirement` | [system-dev/ui-change](workflows/system-dev-ui-change.md) |
| `system-dev/api-change` | API変更。契約、互換性、migration、docs、検証、E2E、PR作成を扱う。 | `task_name`, `api_change_file` / `api_change` | [system-dev/api-change](workflows/system-dev-api-change.md) |

## Codex CLI Models

`system-dev/*` workflowの `model` には、Codex CLIの `codex exec --model <MODEL>` に渡せるmodel文字列を `step=model` 形式で指定します。未指定stepは `gpt-5.5` を使います。

確認元: `codex-cli 0.128.0-alpha.1` の `codex debug models`

指定例:

```bash
--var model=repo_scan=gpt-5.4,design=gpt-5.5,design_review=gpt-5.3-codex,implement=gpt-5.5,implementation_review=gpt-5.3-codex,fix_validation=gpt-5.4
```

指定できるstep名:

| workflow | step names |
|---|---|
| `system-dev/feature-dev` | `repo_scan`, `normalize_requirements`, `design`, `design_review`, `implement`, `implementation_review`, `fix_validation`, `fix_e2e` |
| other `system-dev/*` | `repo_scan`, `normalize_input`, `design`, `design_review`, `implement`, `implementation_review`, `fix_validation`, `fix_e2e` |

`design_review` の指定は `design_review_1` / `design_review_2` / `design_review_3` に適用されます。`implementation_review`, `design`, `implement`, `fix_validation`, `fix_e2e` も同様に再実行stepへ適用されます。個別attemptだけ変えたい場合は `design_review_2=gpt-5.4` のように実際のstep idを指定できます。

| model string | display name | 用途 |
|---|---|---|
| `gpt-5.5` | GPT-5.5 | 複雑なcoding、research、実務作業向けのfrontier model。 |
| `gpt-5.4` | gpt-5.4 | 日常的なcoding向けの強いmodel。 |
| `gpt-5.4-mini` | GPT-5.4-Mini | 軽めのcoding task向けの小さく速い低cost model。 |
| `gpt-5.3-codex` | gpt-5.3-codex | coding最適化model。 |
| `gpt-5.3-codex-spark` | GPT-5.3-Codex-Spark | 高速なcoding model。 |
| `gpt-5.2` | gpt-5.2 | professional workとlong-running agent向けmodel。 |
| `codex-auto-review` | Codex Auto Review | Codexの自動approval review向けmodel。通常の実装stepではなくreview用途。 |
