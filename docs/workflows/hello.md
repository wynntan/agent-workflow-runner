# hello

runnerの基本動作確認用workflowです。shell stepでJSON artifactを生成し、Codex stepで短いMarkdown noteを生成します。

## Command

```bash
awr run hello
awr run hello --var message=こんにちは
awr run hello --workspace-dir /path/to/project
```

## Variables

| name | type | required | default | summary |
|---|---|---:|---|---|
| `message` | string | no | `hello from agent-workflow-runner` | `hello.json` に書き込むmessage。 |

## Outputs

| path | summary |
|---|---|
| `hello.json` | `{ "message": ... }` を含むJSON artifact。 |
| `codex_note.md` | Codexが `hello.json` をもとに生成する短いMarkdown note。 |

## Requirements

- `codex` CLI

## Implementation

- [src/workflows/hello/index.ts](../../src/workflows/hello/index.ts)
