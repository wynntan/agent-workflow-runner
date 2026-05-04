You are running the `system-dev/feature-dev` workflow implementation review.

Review implementation attempt {{implementationAttempt}}. Do not modify source files.

Read:
- Normalized requirement: {{requirementNormalized}}
- Acceptance JSON: {{acceptanceJson}}
- Design: {{design}}
- Implementation plan: {{implementationPlan}}
- ADR apply result: {{adrApplyJson}}
- Implementation summary: {{implementationSummary}}

Inspect the current workspace diff. Review thoroughly using the organized criteria below. Treat non-applicable backend or frontend criteria as `pass: not applicable` only when the diff clearly does not touch that layer.

Core review criteria:
- requirements: required behavior and acceptance criteria are implemented or explicitly documented as not applicable, with no missing user-visible behavior.
- design conformance: the implementation matches the approved design, implementation plan, ADR decision, and repo context.
- architecture: boundaries, responsibilities, dependency direction, data/state impact, external interfaces, and compatibility are consistent with the existing architecture.
- security: authn/authz, input validation, data exposure, secrets, injection/XSS/CSRF or equivalent attack surfaces, permissions, and dependency risk are handled where relevant.
- QA: edge cases, error handling, failure modes, observability/logging, rollback or migration safety, and regression risk are addressed.
- testing: tests or documented checks cover acceptance criteria, important edge cases, and relevant regression paths; test placement and style match the repo.
- scope control: unrelated changes, opportunistic refactors, unapproved behavior changes, and avoidable complexity are absent.
- maintainability: code follows repo conventions, names and module boundaries are clear, duplication is justified, and the implementation remains understandable.

Backend-specific criteria, when backend code, APIs, jobs, persistence, or server-side integrations are affected:
- backend structure: domain/application/infrastructure boundaries, API boundaries, persistence boundaries, error handling, and transaction/state consistency are implemented cleanly.
- backend modularity: modules are cohesive, coupling is controlled, and infrastructure details do not leak into domain logic unless the repo's style already requires it.
- hexagonal architecture: ports/adapters or equivalent seams are respected when present or when the approved design introduced them; external systems are isolated behind interfaces.
- backend security: authorization, authentication, validation, serialization, sensitive data handling, rate/abuse concerns, and secure defaults are correctly implemented.
- backend QA: contract tests, regression tests, data migration checks, failure-path tests, and operational validation are present or explicitly justified.

Frontend-specific criteria, when UI, client state, browser behavior, or frontend integrations are affected:
- frontend structure: page/route/component/state boundaries match the approved design and existing frontend architecture.
- frontend modularity: components, hooks, utilities, and data-fetching concerns are separated without unnecessary abstraction or cross-layer leakage.
- component design: component API, composition, state ownership, loading/error/empty states, accessibility, responsive behavior, and design-system fit are implemented correctly.
- frontend security: XSS, unsafe rendering, client-side authorization assumptions, token/storage handling, third-party content, and dependency risk are handled safely.
- frontend QA: interaction tests, visual/manual checks, accessibility checks, responsive checks, and E2E coverage are present or explicitly justified.

Decision threshold:
- Approve only if the implementation is safe enough to validate, matches the approved design, covers acceptance criteria, keeps scope tight, addresses relevant architecture/security/QA/testing concerns, and handles backend/frontend-specific concerns when applicable.
- Reject when a concrete blocker is likely to fail acceptance, cause regression, introduce security risk, violate architecture, leave important tests/checks missing, mishandle ADR-required work, or create unacceptable maintenance risk.
- Do not reject for minor wording or optional polish. If the implementation is mostly sound but has non-blocking gaps, approve with `approval_conditions`.

Write a human-readable review to both:
{{implementationReviewMd}}
{{implementationReviewAttemptMd}}

Also write the same valid JSON review to both:
{{implementationReviewJson}}
{{implementationReviewAttemptJson}}

The JSON must have this shape:
{
  "status": "approved|rejected",
  "attempt": {{implementationAttempt}},
  "summary": "string",
  "criteria": { "criterion_name": "pass|fail|warning: short rationale" },
  "reasons": ["string"],
  "required_changes": ["string"],
  "approval_conditions": ["string"]
}

If rejected, `required_changes` must be specific enough for the next implementation attempt to act on. Do not rely on the final natural language answer as the artifact.
