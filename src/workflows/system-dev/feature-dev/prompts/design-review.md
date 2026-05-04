You are running the `system-dev/feature-dev` workflow design review.

Review design attempt {{designAttempt}}. Do not modify source files or project ADR files in this step.

Read:
- Normalized requirement: {{requirementNormalized}}
- Acceptance JSON: {{acceptanceJson}}
- Repo context: {{repoContext}}
- Design: {{design}}
- Implementation plan: {{implementationPlan}}
- ADR proposal artifact, if present: {{adrProposal}}

Review thoroughly using the organized criteria below. Treat non-applicable backend or frontend criteria as `pass: not applicable` only when the design clearly does not touch that layer.

Core review criteria:
- requirements: acceptance criteria, constraints, assumptions, out-of-scope items, and user-visible behavior are fully covered and traceable from requirement to design.
- architecture: system boundaries, responsibilities, external interfaces, data/state impact, non-functional concerns, tradeoffs, repo fit, and ADR need are explicit and consistent with the existing architecture.
- security: authn/authz, input validation, data exposure, secrets, injection/XSS/CSRF or equivalent attack surfaces, permissions, and dependency risk are considered where relevant.
- QA: risks, observability/logging needs, rollback or failure handling, edge cases, compatibility, migration/data safety, and manual verification needs are identified.
- testing: unit/integration/E2E or manual test strategy is concrete, tied to acceptance criteria, and realistic for the repo's tooling.
- implementation readiness: changed files/modules, control flow, sequencing, and validation commands are actionable enough for implementation.

Backend-specific criteria, when backend code, APIs, jobs, persistence, or server-side integrations are affected:
- backend structure: domain/application/infrastructure boundaries, API boundaries, persistence boundaries, error handling, and transaction/state consistency are clear.
- backend modularity: responsibilities are split into cohesive modules without coupling unrelated concerns or leaking infrastructure details into domain logic.
- hexagonal architecture: ports/adapters or equivalent boundaries are respected when the repo follows or can reasonably benefit from that style; external systems are isolated behind interfaces.
- backend security: authorization, authentication, validation, serialization, sensitive data handling, rate/abuse concerns, and secure defaults are addressed.
- backend QA: contract tests, regression tests, data migration checks, failure-path tests, and operational validation are planned where relevant.

Frontend-specific criteria, when UI, client state, browser behavior, or frontend integrations are affected:
- frontend structure: page/route/component/state boundaries are clear and match existing frontend architecture.
- frontend modularity: components, hooks, utilities, and data-fetching concerns are separated without creating unnecessary abstraction.
- component design: component API, composition, state ownership, loading/error/empty states, accessibility, responsive behavior, and design-system fit are specified.
- frontend security: XSS, unsafe rendering, client-side authorization assumptions, token/storage handling, third-party content, and dependency risk are addressed.
- frontend QA: interaction tests, visual/manual checks, accessibility checks, responsive checks, and E2E coverage are planned where relevant.

Decision threshold:
- Approve only if the design is implementation-ready, covers acceptance criteria, respects constraints, addresses the relevant architecture/security/QA/testing requirements, handles backend/frontend-specific concerns when applicable, and includes a correct ADR decision.
- Reject when a concrete blocker is likely to cause incorrect implementation, missing acceptance coverage, security risk, architectural drift, weak validation, untestable design, or unacceptable regression risk.
- Do not reject for minor wording or optional polish. If the design is mostly sound but has non-blocking gaps, approve with `approval_conditions`.

Write a human-readable review to both:
{{designReviewMd}}
{{designReviewAttemptMd}}

Also write the same valid JSON review to both:
{{designReviewJson}}
{{designReviewAttemptJson}}

The JSON must have this shape:
{
  "status": "approved|rejected",
  "attempt": {{designAttempt}},
  "summary": "string",
  "criteria": { "criterion_name": "pass|fail|warning: short rationale" },
  "reasons": ["string"],
  "required_changes": ["string"],
  "approval_conditions": ["string"]
}

If rejected, `required_changes` must be specific enough for the next design attempt to act on. Do not rely on the final natural language answer as the artifact.
