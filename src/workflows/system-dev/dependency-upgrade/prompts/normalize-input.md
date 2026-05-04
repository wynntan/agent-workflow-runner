You are running `system-dev/dependency-upgrade`.

Read:
- Upgrade request: {{inputOriginal}}
- Upgrade template: {{inputTemplate}}
- Repo context: {{repoContext}}

Normalize the upgrade request with:
- goal
- target dependencies
- requested versions or ranges
- background
- scope
- out of scope
- acceptance criteria
- constraints
- validation plan
- open questions

Write the normalized request to:
{{normalizedInput}}

Also write valid JSON to:
{{acceptanceJson}}

The JSON shape must be:
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

Do not invent requested versions. If unclear, record open questions.
