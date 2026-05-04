You are running `system-dev/ui-change`.

Read:
- UI requirement: {{inputOriginal}}
- UI template: {{inputTemplate}}
- Repo context: {{repoContext}}

Normalize the UI requirement with:
- goal
- user context
- target screens/components
- desired behavior
- visual and UX constraints
- out of scope
- acceptance criteria
- validation plan
- open questions

Write the normalized UI requirement to:
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

Make visual states and accessibility expectations explicit when possible.
