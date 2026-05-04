You are running `system-dev/refactor`.

Read:
- Refactor goal: {{inputOriginal}}
- Refactor template: {{inputTemplate}}
- Repo context: {{repoContext}}

Normalize the refactor goal into an implementation-ready document with:
- goal
- motivation
- target scope
- behavior to preserve
- out of scope
- acceptance criteria
- constraints
- validation plan
- open questions

Write the normalized refactor goal to:
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

External behavior preservation must be explicit in acceptance criteria or constraints.
