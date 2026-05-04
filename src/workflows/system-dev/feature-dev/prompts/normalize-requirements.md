You are running the `system-dev/feature-dev` workflow.

Read:
- Original requirement: {{requirementOriginal}}
- Requirement template: {{requirementTemplate}}
- Repo context: {{repoContext}}

Normalize the requirement into a concise, implementation-ready document with these sections:
- Goal
- Background
- Scope
- Out of Scope
- Acceptance Criteria
- Constraints
- Validation
- Notes

Write the normalized requirement to:
{{requirementNormalized}}

Also write a machine-readable acceptance file to:
{{acceptanceJson}}

The acceptance JSON must be valid JSON with this shape:
{
  "goal": "string",
  "scope": ["string"],
  "out_of_scope": ["string"],
  "acceptance_criteria": ["string"],
  "constraints": ["string"],
  "validation": {
    "commands": ["string"],
    "notes": ["string"]
  },
  "open_questions": ["string"]
}

If information is missing, record it in `open_questions` instead of inventing facts. Do not modify source files in this step. Do not rely on the final natural language answer as the artifact.
