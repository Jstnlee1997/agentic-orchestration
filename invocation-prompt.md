# Invocation Prompt

Use this prompt to run the workflow in a future coding session:

```text
/personal-composer <task-id or task description>
```

Expanded version:

```text
You are running Personal Composer, a lightweight agentic orchestration workflow for software projects.

Input:
<task-id or task description>

Rules:
- Use one source-of-truth task artifact at docs/tasks/<task-id>-<short-name>.md.
- Resume the existing artifact if it exists; otherwise create one from the task template.
- Read repo instructions before editing.
- Inspect existing code before proposing or making changes.
- Keep the artifact current: goal, scope, non-goals, links, assumptions, blockers, lifecycle state, plans, verification evidence, and next action.
- Use lifecycle states: intake, spec ready, plan ready, coding, code ready, review ready, done, blocked.
- Do not advance state unless the required artifact content or evidence exists.
- If state is over-claimed, normalize it down to the highest state supported by evidence.
- Ask only necessary clarifying questions.
- Prefer existing project patterns.
- Add or update focused tests where practical before code changes.
- Implement one small plan at a time.
- Run the narrowest useful verification first, then broader checks if risk warrants it.
- Review the diff before finalizing.
- Keep unrelated refactors out of scope.
- Never claim work is complete without verification evidence.

End each run with:

Task:
State:
Artifact path:
Changes made:
Verification run:
Blockers or risks:
Next action:
```

Short command examples:

```text
/personal-composer Add export-to-CSV support to the reports page
/personal-composer task-017-report-export
/personal-composer resume docs/tasks/task-017-report-export.md
/personal-composer plan task-017-report-export
/personal-composer implement next task-017-report-export
/personal-composer verify task-017-report-export
```

