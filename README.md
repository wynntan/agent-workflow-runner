# agent-workflow-runner

LLM/ツール実行ワークフローを、YAML DSLではなくTypeScriptの実装済みworkflowとして動かす個人用runnerです。

`awr run` を統一エントリーポイントにして、登録済みworkflow idを指定して同期実行します。runnerは実行の外枠として、`workflow-artifacts` repository、runごとのartifact directory、stdout/stderr logs、`run.json`、artifact hashを保存します。

## 使い方

```bash
npm install
npm run example
```

開発中のCLI:

```bash
npm run dev -- run hello
npm run dev -- run hello --var message=こんにちは
npm run dev -- run hello --workspace-dir /path/to/project
npm run dev -- list
```

ビルド後の想定:

```bash
awr run <workflow-id> [--var key=value] [--workspace-dir dir] [--artifact-repo-dir dir]
awr list
```

実行ごとの `run_id` は毎回自動生成されます。ユーザーが指定するのは `workflow-id`、workflow変数、必要なら `workspace-dir` です。

## Artifact Repository

成果物はまず `workflow-artifacts` repositoryへ集約します。

```text
workflow-artifacts/
  .git/
  runs/
    <run_id>/
      run.json
      steps/
      logs/
      artifacts/
```

`workflow-artifacts` は事前に作成済みのgit repositoryとして扱います。runnerはrepo作成や `git init` は行いません。実行時はworkflow idと同じ名前のgit branchを作成またはcheckoutします。たとえば `awr run hello` は `hello` branch上に `runs/<run_id>/...` を作ります。

workflowが終了したら、成功・失敗どちらでも `workflow-artifacts` 側の `runs/<run_id>/...` を自動commitします。commit messageは `awr: <workflow-id> <run_id> <status>` です。

defaultのartifact repositoryは、コマンド実行ディレクトリ配下の `workflow-artifacts` です。変更する場合は次のどちらかを使います。

```bash
awr run hello --artifact-repo-dir /path/to/workflow-artifacts
AWR_ARTIFACT_REPO_DIR=/path/to/workflow-artifacts awr run hello
```

`--workspace-dir` を指定した場合は、primary出力を `workflow-artifacts` に作ったあと、同じrun directoryをworkspace側にもコピーします。
workspace側は自動commitしません。必要な場合はworkflow内で明示的にcommitします。

```text
/path/to/project/
  runs/
    <run_id>/
      run.json
      steps/
      logs/
      artifacts/
```

## 現在のworkflow

使えるworkflowは [docs/workflows.md](docs/workflows.md) にまとめています。

## 実行モデル

```text
awr run hello --var message=hello
  -> workflow registryから hello を解決
  -> workflow変数を検証
  -> run_idを自動生成
  -> workflow functionを実行
  -> workflow内で ctx.shell / ctx.codex / ctx.claude を呼ぶ
  -> stdout/stderrを画面とログへstream
  -> outputsを確認してsha256を記録
  -> 失敗したらそこで停止
  -> run.jsonを確定
  -> workspace-dir指定時はruns/<run_id>をコピー
  -> workflow-artifactsへ自動commit
```

## Workflow実装例

```ts
import type { WorkflowDefinition } from "../types.js";

export const helloWorkflow: WorkflowDefinition = {
  id: "hello",
  name: "Hello Artifact",
  summary: "shell stepでJSON artifactを生成し、Codex stepで短いMarkdown noteを生成する登録済みworkflow。",
  variables: [
    {
      name: "message",
      summary: "hello.json に書き込むmessage。",
      type: "string",
      default: "hello from agent-workflow-runner"
    }
  ],
  async run(ctx) {
    await ctx.shell({
      id: "write_hello",
      summary: "hello.json をartifact directoryに書き出す。",
      script: `mkdir -p "$AWR_ARTIFACTS_DIR"
node <<'NODE'
const fs = require("fs");
const path = process.env.AWR_ARTIFACTS_DIR + "/hello.json";
const value = { message: process.env.AWR_VAR_MESSAGE };
fs.writeFileSync(path, JSON.stringify(value, null, 2) + "\\n");
NODE`,
      outputs: [{ path: "hello.json" }]
    });

    await ctx.codex({
      id: "write_codex_note",
      summary: "hello.jsonをもとにcodex_note.mdを生成する。",
      instruction: [
        `Read ${ctx.artifact("hello.json")}.`,
        `Write a short Markdown note to ${ctx.artifact("codex_note.md")}.`,
        "The note must mention the JSON message value.",
        "Do not rely on the final natural language answer as the artifact."
      ].join("\n"),
      outputs: [{ path: "codex_note.md" }]
    });
  }
};
```

workflowを増やすときは `src/workflows/<id>.ts` に実装し、`src/workflows/index.ts` のregistryに追加します。あわせて [docs/workflows.md](docs/workflows.md) に追記します。

## LLM Tool Utilities

`codex` / `claude` のCLI呼び出しは [src/tools/llm.ts](src/tools/llm.ts) に集約しています。

- `runCodexExec(...)`: `codex exec --json --cd <dir> ... <instruction>` を実行
- `runClaudePrompt(...)`: `claude -p --output-format stream-json ... <instruction>` を実行
- `buildCodexExecArgs(...)` / `buildClaudePromptArgs(...)`: 引数配列を生成

通常のworkflow実装では `ctx.codex(...)` / `ctx.claude(...)` を使えば、このutility経由で実行されます。
CodexとClaudeのstdoutはJSONLとして `logs/<step>.stdout.jsonl` に保存されます。stderrは非構造ログとして `logs/<step>.stderr.log` に保存されます。

## Runtime Context

workflow functionには `ctx` が渡されます。

```ts
ctx.vars
ctx.runId
ctx.workspaceDir
ctx.artifactRepoDir
ctx.artifactRepoBranch
ctx.workspaceRunDir
ctx.runDir
ctx.artifactsDir
ctx.logsDir
ctx.artifact("file.json")
ctx.runPath("tmp/file.txt")
ctx.shell(...)
ctx.codex(...)
ctx.claude(...)
```

各stepには次の環境変数も渡されます。

```text
AWR_RUN_ID
AWR_RUN_DIR
AWR_ARTIFACTS_DIR
AWR_LOGS_DIR
AWR_WORKSPACE_DIR
AWR_ARTIFACT_REPO_DIR
AWR_ARTIFACT_REPO_BRANCH
AWR_WORKFLOW_ID
AWR_STEP_ID
AWR_VAR_<VARIABLE_NAME>
```

`AWR_WORKSPACE_RUN_DIR` は `--workspace-dir` を指定した場合だけ渡されます。

## Primary Run Directory

```text
workflow-artifacts/  # branch: <workflow-id>
  runs/<run_id>/
    run.json
    steps/
      <step_id>.json
    logs/
      01-<shell_step_id>.stdout.log
      01-<shell_step_id>.stderr.log
      02-<llm_step_id>.stdout.jsonl
      02-<llm_step_id>.stderr.log
    artifacts/
      ...
```
