You are running `system-dev/bugfix`.

Read:
- Bug report: {{inputOriginal}}
- Bug report template: {{inputTemplate}}
- Repo context: {{repoContext}}

Normalize the bug report into an implementation-ready document with clear:
- summary
- expected behavior
- actual behavior
- reproduction steps
- suspected scope
- out of scope
- acceptance criteria
- constraints
- validation plan
- open questions

Write the normalized bug report to:
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

Do not invent missing reproduction details. Put unknowns in `open_questions`. Do not modify source files.
