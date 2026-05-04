You are running `system-dev/api-change`.

Read:
- API change requirement: {{inputOriginal}}
- API template: {{inputTemplate}}
- Repo context: {{repoContext}}

Normalize the API change request with:
- goal
- API surface
- request/response/error contract changes
- compatibility requirements
- migration/deprecation notes
- scope
- out of scope
- acceptance criteria
- validation plan
- open questions

Write the normalized API change to:
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

Make compatibility requirements explicit. Do not invent contract details.
