# Personal Composer

Personal Composer is a lightweight agentic orchestration workflow for software projects. It gives an AI coding agent one durable place to keep the truth about a task: what was asked, what is known, what is assumed, what changed, how it was verified, what is blocked, and what should happen next.

It is intentionally small. It works with local files, git, tests, and links the user provides. You can connect it to issue trackers, docs, GitHub, GitLab, design tools, or chat threads, but none of those are required.

## Overview

Most AI coding sessions fail in quiet ways: the request starts vague, assumptions drift, the plan lives only in chat, the agent forgets what happened last time, and "done" gets claimed without evidence. Personal Composer fixes that with one source-of-truth Markdown artifact per task.

Each task lives at:

```text
docs/tasks/<task-id>-<short-name>.md
```

The artifact tracks:

- Goal, scope, and non-goals
- Source links and user-provided context
- Assumptions and open questions
- Existing behavior and relevant files
- Lifecycle state
- Short spec, if needed
- Small execution plans
- Implementation notes
- Verification evidence
- Blockers and risks
- Next action

The workflow moves through a simple lifecycle:

```text
intake -> spec ready -> plan ready -> coding -> code ready -> review ready -> done
                                      \                         /
                                       -------- blocked --------
```

## Why Use This Workflow

Use Personal Composer when you want an AI agent to keep its footing across a real software task, especially one that spans multiple sessions.

It helps you:

- Turn vague requests into scoped implementation work
- Resume tasks without rebuilding context from memory
- Keep assumptions visible instead of implicit
- Prevent over-claimed progress
- Separate plans from evidence
- Keep unrelated refactors out of the task
- Make verification a first-class part of "done"
- Leave a useful handoff when the session ends

This is not a project management system. It is a small discipline for honest, repeatable coding work.

## Quick Start

1. Copy `task-template.md` into your repo:

   ```text
   docs/tasks/<task-id>-<short-name>.md
   ```

2. Start the agent with:

   ```text
   /personal-composer <task-id or task description>
   ```

3. The agent resumes an existing task artifact if one exists. Otherwise, it creates one in `docs/tasks/`.

4. The agent updates the artifact before and after meaningful work:

   - Before implementation: goal, scope, assumptions, relevant files, plan
   - During implementation: current plan, files changed, blockers
   - After implementation: verification evidence, diff review, next action

5. The agent ends every run with the final response template:

   ```text
   Task:
   State:
   Artifact path:
   Changes made:
   Verification run:
   Blockers or risks:
   Next action:
   ```

## Example Commands

Create or resume from a natural-language task:

```text
/personal-composer Add keyboard shortcuts to the editor toolbar
```

Resume a known task:

```text
/personal-composer task-042-editor-shortcuts
```

Ask the agent to continue from the artifact:

```text
/personal-composer resume docs/tasks/task-042-editor-shortcuts.md
```

Ask for planning only:

```text
/personal-composer plan docs/tasks/task-042-editor-shortcuts.md
```

Ask for implementation of the next ready plan:

```text
/personal-composer implement next docs/tasks/task-042-editor-shortcuts.md
```

Ask for verification and handoff:

```text
/personal-composer verify docs/tasks/task-042-editor-shortcuts.md
```

These commands are examples of invocation shape, not dependencies on a particular CLI. You can paste the prompt into any capable coding agent.

## Lifecycle States

| State | Meaning | Minimum Evidence |
| --- | --- | --- |
| `intake` | The task exists, but requirements may be vague. | Artifact exists with goal or request source. |
| `spec ready` | The intended behavior is clear enough to plan. | Scope, non-goals, assumptions, and open questions are recorded. |
| `plan ready` | Work is broken into small executable steps. | At least one focused plan exists with expected files and verification. |
| `coding` | A plan is actively being implemented. | Current plan is marked in progress and touched files are noted. |
| `code ready` | Implementation for the current plan is complete. | Changed files are listed and tests were added or the reason for not adding tests is recorded. |
| `review ready` | Verification ran and the diff was reviewed. | Verification commands and diff review notes are recorded. |
| `done` | The requested task is complete. | Acceptance evidence exists, blockers are resolved or accepted, and next action says no further action. |
| `blocked` | Progress cannot honestly continue. | Blocker includes cause, attempted resolution, owner or needed input, and next action. |

State is descriptive, not aspirational. If evidence does not support the current state, normalize the task down to the highest supported state.

## Task Artifact Format

The task artifact is the contract for the work. Keep it short enough to maintain, but complete enough that another session can resume without guessing.

Recommended sections:

- Metadata
- Goal
- Scope
- Non-goals
- Source links
- Current state
- Assumptions
- Open questions
- Blockers
- Existing behavior and relevant files
- Short spec
- Execution plans
- Implementation log
- Verification evidence
- Diff review
- Final handoff
- Next action

Use checkboxes sparingly. The artifact should stay readable, not become a second codebase.

## Folder Structure

Suggested layout:

```text
docs/
  tasks/
    task-042-editor-shortcuts.md
    task-043-settings-import.md
```

Optional supporting files:

```text
docs/
  agent-workflow.md
  tasks/
    task-template.md
```

The only required file for a task is its task artifact.

## Resume Flow

When invoked, the agent should:

1. Locate an existing task artifact by path, task id, branch name, or nearby task description.
2. If no artifact exists, create one from the template.
3. Read repo instructions before editing, such as `README`, `CONTRIBUTING`, agent instruction files, or local style docs.
4. Read the current task artifact completely.
5. Inspect the working tree and relevant code before proposing changes.
6. Check whether the recorded state is supported by evidence.
7. Normalize over-claimed state down when needed.
8. Continue from the recorded next action.

Example normalization:

```text
Recorded state: review ready
Evidence found: code changed, but no verification command recorded
Normalized state: code ready
Reason: review readiness requires verification evidence
```

This is the heart of the workflow: state follows evidence.

## Verification and Evidence Rules

The agent may not advance state unless the artifact contains the required evidence.

Rules:

- Do not claim implementation is complete without listing changed files.
- Do not claim tests were added unless the test files are named.
- Do not claim verification passed unless command, scope, and result are recorded.
- If verification was not run, record why and set the state no higher than `code ready`.
- Run the narrowest useful verification first.
- Run broader checks when the changed surface is shared, risky, or user-facing.
- Treat failed verification as evidence, not embarrassment. Record it and either fix the issue or mark the task blocked.
- Review the diff before finalizing. Record whether the diff stayed in scope.

Good evidence:

```text
- 2026-06-10: `npm test -- editor-shortcuts.test.ts` passed.
- 2026-06-10: `npm run lint -- src/editor/Toolbar.tsx` passed.
- 2026-06-10: Reviewed `git diff -- src/editor src/editor/__tests__`; no unrelated refactors found.
```

Weak evidence:

```text
- Looks good.
- Should work.
- Tests probably pass.
```

Weak evidence does not advance the lifecycle.

## Blocker Handling

Use `blocked` when the agent cannot honestly continue without user input, missing context, failing external dependencies, or an unresolved technical obstacle.

A blocker must include:

- What is blocked
- Why it is blocked
- What was tried
- Who or what can unblock it
- The next concrete action

Example:

```text
### Blockers

- 2026-06-10: Cannot verify OAuth callback behavior locally because required test credentials are unavailable.
  - Tried: inspected existing auth tests, ran unit tests for callback parser.
  - Needed: user-provided sandbox credentials or approval to mock the provider boundary.
  - Next action: wait for credentials or update scope to unit-test parser only.
```

If evidence is missing, record a blocker or lower the state. Do not fill the gap with confidence.

## Example End-to-End Run

User:

```text
/personal-composer Add keyboard shortcuts to the editor toolbar
```

Agent:

1. Creates `docs/tasks/task-042-editor-shortcuts.md`.
2. Records the goal: add keyboard shortcuts for bold, italic, save, undo, and redo.
3. Reads repo instructions and inspects editor toolbar components.
4. Records relevant files:

   ```text
   - src/editor/Toolbar.tsx
   - src/editor/useEditorCommands.ts
   - src/editor/__tests__/Toolbar.test.tsx
   ```

5. Asks one clarifying question only if shortcut behavior is ambiguous.
6. Writes a short spec:

   ```text
   Ctrl/Cmd+B toggles bold when editor focus is active.
   Ctrl/Cmd+S triggers save and prevents browser save.
   Shortcuts do not fire while focus is inside modal text fields.
   ```

7. Creates a small plan:

   ```text
   Plan A: add command map and unit tests.
   Plan B: wire toolbar shortcuts and run focused editor tests.
   ```

8. Adds or updates focused tests.
9. Implements Plan A, then Plan B.
10. Runs focused tests first, then broader checks if needed.
11. Reviews the diff for scope.
12. Ends with:

   ```text
   Task: task-042-editor-shortcuts
   State: review ready
   Artifact path: docs/tasks/task-042-editor-shortcuts.md
   Changes made: Added editor shortcut command map, toolbar wiring, and focused tests.
   Verification run: `npm test -- Toolbar.test.tsx` passed.
   Blockers or risks: Browser-level shortcut behavior still needs manual QA in Safari.
   Next action: Perform manual browser QA or accept current automated coverage.
   ```

## Customization Guide

Keep the core small and tune only what helps you.

Good customizations:

- Add project-specific state gates, such as accessibility checks for UI work.
- Add preferred verification commands for your stack.
- Add optional links to issues, pull requests, design files, or docs.
- Add a "Manual QA" section for product work.
- Add a "Rollback plan" section for infrastructure or migration work.
- Add naming conventions for task ids.

Avoid:

- Requiring a specific issue tracker.
- Adding hidden lifecycle states that are not visible in the artifact.
- Letting chat history become the source of truth.
- Expanding the template until agents stop maintaining it.
- Treating unchecked plans as proof of completion.

The best version of this workflow is the one you will actually keep current.

