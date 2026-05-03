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
