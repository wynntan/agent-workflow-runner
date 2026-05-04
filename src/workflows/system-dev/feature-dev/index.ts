import { existsSync, readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { WorkflowDefinition, WorkflowVarValue } from "../../../types.js";

const workflowDir = path.dirname(fileURLToPath(import.meta.url));

export const featureDevWorkflow: WorkflowDefinition = {
  id: "system-dev/feature-dev",
  name: "System Development Feature Dev",
  summary: "要件定義を入力に、repo scan、要件正規化、設計、実装、検証、E2E、handoff、PR作成を順に実行する機能追加workflow。",
  variables: [
    {
      name: "task_name",
      summary: "作業branch名の元になるタスク名。feature/<slug> のbranchをorigin/dev最新から作成する。",
      type: "string",
      required: true
    },
    {
      name: "requirement_file",
      summary: "要件定義Markdown file path。長文要件ではこちらを推奨。",
      type: "string",
      default: ""
    },
    {
      name: "requirement",
      summary: "短い要件定義本文。requirement_fileが空の場合に使う。",
      type: "string",
      default: ""
    },
    {
      name: "model",
      summary: "Codex stepごとのmodel割当。例: repo_scan=gpt-5.4,implement=gpt-5.5。未指定stepはgpt-5.5。",
      type: "string",
      default: ""
    }
  ],
  async run(ctx) {
    const taskName = stringVar(ctx.vars.task_name);
    const requirementFile = stringVar(ctx.vars.requirement_file);
    const requirement = stringVar(ctx.vars.requirement);
    const modelAssignments = parseModelAssignments(stringVar(ctx.vars.model));

    if (taskName === "") {
      throw new Error('"task_name" is required');
    }
    if (requirementFile === "" && requirement === "") {
      throw new Error('Either "requirement_file" or "requirement" is required');
    }

    const paths = {
      workspaceDir: ctx.workspaceDir,
      requirementOriginal: ctx.artifact("requirement.original.md"),
      requirementTemplate: ctx.artifact("requirement-template.md"),
      workflowInput: ctx.artifact("workflow_input.json"),
      branchJson: ctx.artifact("branch.json"),
      branchMd: ctx.artifact("branch.md"),
      preflightJson: ctx.artifact("preflight.json"),
      preflightMd: ctx.artifact("preflight.md"),
      repoContext: ctx.artifact("repo_context.md"),
      requirementNormalized: ctx.artifact("requirement.normalized.md"),
      acceptanceJson: ctx.artifact("acceptance.json"),
      design: ctx.artifact("design.md"),
      implementationPlan: ctx.artifact("implementation_plan.json"),
      adrDir: path.join(ctx.workspaceDir, "docs", "adr"),
      adrProposal: ctx.artifact("adr_proposal.md"),
      adrApplyJson: ctx.artifact("adr_apply.json"),
      adrApplyMd: ctx.artifact("adr_apply.md"),
      designReviewMd: ctx.artifact("design_review.md"),
      designReviewJson: ctx.artifact("design_review.json"),
      implementationSummary: ctx.artifact("implementation_summary.md"),
      implementationReviewMd: ctx.artifact("implementation_review.md"),
      implementationReviewJson: ctx.artifact("implementation_review.json"),
      prepareLocalEnvironmentJson: ctx.artifact("prepare_local_environment.json"),
      prepareLocalEnvironmentMd: ctx.artifact("prepare_local_environment.md"),
      validationJson: ctx.artifact("validation.json"),
      validationMd: ctx.artifact("validation.md"),
      validationFixSummary: ctx.artifact("validation_fix_summary.md"),
      e2eJson: ctx.artifact("e2e.json"),
      e2eMd: ctx.artifact("e2e.md"),
      e2eFixSummary: ctx.artifact("e2e_fix_summary.md"),
      handoffMd: ctx.artifact("handoff.md"),
      prJson: ctx.artifact("pr.json"),
      prMd: ctx.artifact("pr.md"),
      prBody: ctx.artifact("pr_body.md")
    };

    await ctx.shell({
      id: "create_task_branch",
      summary: "最新のorigin/devを取得し、devからtask_name由来の作業branchを作成する。",
      env: {
        AWR_FEATURE_TASK_NAME: taskName
      },
      script: `node ${shellQuote(scriptPath("scripts/create-task-branch.mjs"))}`,
      outputs: [
        { path: "branch.json" },
        { path: "branch.md" }
      ]
    });

    await ctx.shell({
      id: "capture_requirement",
      summary: "入力された要件定義をartifactへ固定し、workflow入力を記録する。",
      env: {
        AWR_FEATURE_TASK_NAME: taskName,
        AWR_FEATURE_REQUIREMENT_FILE: requirementFile,
        AWR_FEATURE_REQUIREMENT: requirement,
        AWR_FEATURE_REQUIREMENT_TEMPLATE: scriptPath("requirement-template.md")
      },
      script: `node ${shellQuote(scriptPath("scripts/capture-requirement.mjs"))}`,
      outputs: [
        { path: "requirement.original.md" },
        { path: "requirement-template.md" },
        { path: "workflow_input.json" }
      ]
    });

    await ctx.shell({
      id: "preflight",
      summary: "workspaceのgit状態、package scripts、tool候補を記録する。",
      script: `node ${shellQuote(scriptPath("scripts/preflight.mjs"))}`,
      outputs: [
        { path: "preflight.json" },
        { path: "preflight.md" }
      ]
    });

    await ctx.codex({
      id: "repo_scan",
      summary: "要件に関係するrepo構造、既存実装、ルール、影響範囲を調査する。",
      model: modelFor(modelAssignments, "repo_scan"),
      instruction: renderPrompt("repo-scan.md", paths),
      outputs: [{ path: "repo_context.md" }]
    });

    await ctx.codex({
      id: "normalize_requirements",
      summary: "入力要件を薄い定型フォーマットとacceptance JSONへ正規化する。",
      model: modelFor(modelAssignments, "normalize_requirements"),
      instruction: renderPrompt("normalize-requirements.md", paths),
      outputs: [
        { path: "requirement.normalized.md" },
        { path: "acceptance.json" }
      ]
    });

    let designApproved = false;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const attemptPaths = {
        ...paths,
        designAttempt: String(attempt),
        designReviewAttemptMd: ctx.artifact(`design_reviews/attempt-${attempt}.md`),
        designReviewAttemptJson: ctx.artifact(`design_reviews/attempt-${attempt}.json`)
      };
      removeFileIfExists(paths.adrProposal);

      const designStepId = attempt === 1 ? "design" : `design_redesign_${attempt}`;
      await ctx.codex({
        id: designStepId,
        summary: attempt === 1
          ? "実装方針、変更予定、リスク、検証方針を設計artifactへ落とす。"
          : "設計レビュー結果を元に設計artifactを再作成する。",
        model: modelFor(modelAssignments, designStepId),
        instruction: renderPrompt("design.md", attemptPaths),
        outputs: [
          { path: "design.md" },
          { path: "implementation_plan.json" },
          { path: "adr_proposal.md", required: false }
        ]
      });

      const designReviewStepId = `design_review_${attempt}`;
      await ctx.codex({
        id: designReviewStepId,
        summary: "設計をレビューし、承認または却下を理由つきでartifactへ記録する。",
        model: modelFor(modelAssignments, designReviewStepId),
        instruction: renderPrompt("design-review.md", attemptPaths),
        outputs: [
          { path: "design_review.md" },
          { path: "design_review.json" },
          { path: `design_reviews/attempt-${attempt}.md` },
          { path: `design_reviews/attempt-${attempt}.json` }
        ]
      });

      if (readDesignReviewDecision(paths.designReviewJson) === "approved") {
        designApproved = true;
        break;
      }
    }

    if (!designApproved) {
      throw new Error("Design review rejected after 3 attempts");
    }

    await ctx.shell({
      id: "apply_adr",
      summary: "承認済み設計でADRが必要な場合、adr_proposal.mdをworkspaceのdocs/adrへ反映する。",
      script: `node ${shellQuote(scriptPath("scripts/apply-adr.mjs"))}`,
      outputs: [
        { path: "adr_apply.json" },
        { path: "adr_apply.md" }
      ]
    });

    let implementationApproved = false;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const attemptPaths = {
        ...paths,
        implementationAttempt: String(attempt),
        implementationReviewAttemptMd: ctx.artifact(`implementation_reviews/attempt-${attempt}.md`),
        implementationReviewAttemptJson: ctx.artifact(`implementation_reviews/attempt-${attempt}.json`)
      };

      const implementStepId = attempt === 1 ? "implement" : `implement_rework_${attempt}`;
      await ctx.codex({
        id: implementStepId,
        summary: attempt === 1
          ? "設計とacceptanceに沿ってworkspaceへ機能追加を実装する。"
          : "実装レビュー結果を元にworkspaceの実装を修正する。",
        model: modelFor(modelAssignments, implementStepId),
        instruction: renderPrompt("implement.md", attemptPaths),
        outputs: [{ path: "implementation_summary.md" }]
      });

      const implementationReviewStepId = `implementation_review_${attempt}`;
      await ctx.codex({
        id: implementationReviewStepId,
        summary: "実装内容をレビューし、承認または却下を理由つきでartifactへ記録する。",
        model: modelFor(modelAssignments, implementationReviewStepId),
        instruction: renderPrompt("implementation-review.md", attemptPaths),
        outputs: [
          { path: "implementation_review.md" },
          { path: "implementation_review.json" },
          { path: `implementation_reviews/attempt-${attempt}.md` },
          { path: `implementation_reviews/attempt-${attempt}.json` }
        ]
      });

      if (readImplementationReviewDecision(paths.implementationReviewJson) === "approved") {
        implementationApproved = true;
        break;
      }
    }

    if (!implementationApproved) {
      throw new Error("Implementation review rejected after 3 attempts");
    }

    await ctx.shell({
      id: "prepare_local_environment",
      summary: "依存関係、DB migration適用、codegenなど、validate前に必要なローカル環境反映を実行する。",
      script: `node ${shellQuote(scriptPath("scripts/prepare-local-environment.mjs"))}`,
      outputs: [
        { path: "prepare_local_environment.json" },
        { path: "prepare_local_environment.md" },
        { path: "prepare-local-environment-logs", required: false }
      ]
    });

    let validationPassed = false;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const attemptPaths = {
        ...paths,
        validationAttempt: String(attempt),
        validationFixAttemptSummary: ctx.artifact(`validation_fixes/attempt-${attempt}.md`)
      };

      await ctx.shell({
        id: attempt === 1 ? "validate" : `validate_after_fix_${attempt}`,
        summary: "lint、typecheck、build、unit testを実行し、結果をartifactへ記録する。",
        script: `node ${shellQuote(scriptPath("scripts/validate.mjs"))}`,
        outputs: [
          { path: "validation.json" },
          { path: "validation.md" },
          { path: "validation-logs", required: false }
        ]
      });

      const validationStatus = readValidationStatus(paths.validationJson);
      if (validationStatus === "passed" || validationStatus === "skipped") {
        validationPassed = true;
        break;
      }
      if (attempt < 3) {
        const fixValidationStepId = `fix_validation_${attempt}`;
        await ctx.codex({
          id: fixValidationStepId,
          summary: "validateで失敗したlint/typecheck/build/unit testを修正する。",
          model: modelFor(modelAssignments, fixValidationStepId),
          instruction: renderPrompt("validation-fix.md", attemptPaths),
          outputs: [
            { path: "validation_fix_summary.md" },
            { path: `validation_fixes/attempt-${attempt}.md` }
          ]
        });
      }
    }

    if (!validationPassed) {
      throw new Error("Validation failed after 3 attempts");
    }

    let e2ePassed = false;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const attemptPaths = {
        ...paths,
        e2eAttempt: String(attempt),
        e2eFixAttemptSummary: ctx.artifact(`e2e_fixes/attempt-${attempt}.md`)
      };

      await ctx.shell({
        id: attempt === 1 ? "e2e" : `e2e_after_fix_${attempt}`,
        summary: "E2E test scriptがある場合に実行し、結果をartifactへ記録する。",
        script: `node ${shellQuote(scriptPath("scripts/e2e.mjs"))}`,
        outputs: [
          { path: "e2e.json" },
          { path: "e2e.md" },
          { path: "e2e-logs", required: false }
        ]
      });

      const e2eStatus = readArtifactStatus(paths.e2eJson, "e2e");
      if (e2eStatus === "passed" || e2eStatus === "skipped") {
        e2ePassed = true;
        break;
      }
      if (attempt < 3) {
        const fixE2eStepId = `fix_e2e_${attempt}`;
        await ctx.codex({
          id: fixE2eStepId,
          summary: "E2E結果に基づき、必要な場合だけworkspaceを修正する。不要なら理由を記録する。",
          model: modelFor(modelAssignments, fixE2eStepId),
          instruction: renderPrompt("e2e-fix.md", attemptPaths),
          outputs: [
            { path: "e2e_fix_summary.md" },
            { path: `e2e_fixes/attempt-${attempt}.md` }
          ]
        });
      }
    }

    await ctx.shell({
      id: "handoff",
      summary: e2ePassed
        ? "変更内容、検証結果、残課題をhandoff artifactへまとめる。"
        : "失敗したE2E結果を含めてhandoff artifactを作成し、workflowをfailedにする。",
      script: `node ${shellQuote(scriptPath("scripts/handoff.mjs"))}`,
      outputs: [{ path: "handoff.md" }]
    });

    await ctx.shell({
      id: "create_pr",
      summary: "workspaceの既存差分をcommitし、branchをpushしてPRを作成する。",
      script: `node ${shellQuote(scriptPath("scripts/create-pr.mjs"))}`,
      outputs: [
        { path: "pr.json" },
        { path: "pr.md" },
        { path: "pr_body.md" }
      ]
    });
  }
};

function renderPrompt(name: string, values: Record<string, string>): string {
  let prompt = readFileSync(scriptPath(path.join("prompts", name)), "utf8");
  for (const [key, value] of Object.entries(values)) {
    prompt = prompt.replaceAll(`{{${key}}}`, value);
  }
  return prompt;
}

function readDesignReviewDecision(file: string): "approved" | "rejected" {
  return readApprovalDecision(file, "design review");
}

function readImplementationReviewDecision(file: string): "approved" | "rejected" {
  return readApprovalDecision(file, "implementation review");
}

function readValidationStatus(file: string): "passed" | "failed" | "skipped" {
  return readArtifactStatus(file, "validation");
}

function readArtifactStatus(file: string, label: string): "passed" | "failed" | "skipped" {
  const parsed = JSON.parse(readFileSync(file, "utf8")) as { status?: unknown };
  const status = String(parsed.status ?? "").toLowerCase();
  if (status === "passed" || status === "failed" || status === "skipped") {
    return status;
  }
  throw new Error(`Invalid ${label} status in ${file}: expected passed, failed, or skipped`);
}

function readApprovalDecision(file: string, label: string): "approved" | "rejected" {
  const parsed = JSON.parse(readFileSync(file, "utf8")) as { status?: unknown; decision?: unknown };
  const decision = String(parsed.status ?? parsed.decision ?? "").toLowerCase();
  if (decision === "approved" || decision === "approve" || decision === "accepted") {
    return "approved";
  }
  if (decision === "rejected" || decision === "reject" || decision === "needs_changes" || decision === "ng") {
    return "rejected";
  }
  throw new Error(`Invalid ${label} decision in ${file}: expected approved or rejected`);
}

type ModelAssignments = Map<string, string>;

const DEFAULT_CODEX_MODEL = "gpt-5.5";
const ALLOWED_MODELS = new Set([
  "gpt-5.5",
  "gpt-5.4",
  "gpt-5.4-mini",
  "gpt-5.3-codex",
  "gpt-5.3-codex-spark",
  "gpt-5.2",
  "codex-auto-review"
]);
const ALLOWED_MODEL_STEPS = new Set([
  "repo_scan",
  "normalize_requirements",
  "design",
  "design_review",
  "implement",
  "implementation_review",
  "fix_validation",
  "fix_e2e"
]);

function parseModelAssignments(value: string): ModelAssignments {
  const assignments = new Map<string, string>();
  for (const entry of value.split(/[\r\n,;]+/).map((item) => item.trim()).filter(Boolean)) {
    const separator = entry.indexOf("=");
    if (separator <= 0 || separator === entry.length - 1) {
      throw new Error(`Invalid model assignment "${entry}". Expected step=model.`);
    }
    const step = entry.slice(0, separator).trim();
    const model = entry.slice(separator + 1).trim();
    if (!isAllowedModelStep(step)) {
      throw new Error(`Invalid model assignment step "${step}".`);
    }
    if (!ALLOWED_MODELS.has(model)) {
      throw new Error(`Invalid model "${model}". See docs/workflows.md for supported Codex CLI model strings.`);
    }
    assignments.set(step, model);
  }
  return assignments;
}

function modelFor(assignments: ModelAssignments, stepId: string): string {
  for (const key of modelLookupKeys(stepId)) {
    const model = assignments.get(key);
    if (model !== undefined) {
      return model;
    }
  }
  return DEFAULT_CODEX_MODEL;
}

function modelLookupKeys(stepId: string): string[] {
  if (stepId.startsWith("design_redesign_")) return [stepId, "design"];
  if (stepId.startsWith("design_review_")) return [stepId, "design_review"];
  if (stepId.startsWith("implement_rework_")) return [stepId, "implement"];
  if (stepId.startsWith("implementation_review_")) return [stepId, "implementation_review"];
  if (stepId.startsWith("fix_validation_")) return [stepId, "fix_validation"];
  if (stepId.startsWith("fix_e2e_")) return [stepId, "fix_e2e"];
  return [stepId];
}

function isAllowedModelStep(step: string): boolean {
  return ALLOWED_MODEL_STEPS.has(step)
    || /^design_redesign_\d+$/.test(step)
    || /^design_review_\d+$/.test(step)
    || /^implement_rework_\d+$/.test(step)
    || /^implementation_review_\d+$/.test(step)
    || /^fix_validation_\d+$/.test(step)
    || /^fix_e2e_\d+$/.test(step);
}

function removeFileIfExists(file: string): void {
  if (existsSync(file)) {
    unlinkSync(file);
  }
}

function scriptPath(relativePath: string): string {
  return path.join(workflowDir, relativePath);
}

function stringVar(value: WorkflowVarValue | undefined): string {
  if (value === undefined) {
    return "";
  }
  return String(value).trim();
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}
