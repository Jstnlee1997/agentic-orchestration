# Personal Composer Workflow

This workflow helps an AI agent take a software task from vague request to completed, verified implementation while preserving honest state across sessions. It is generic, local-first, and tool-agnostic.

## Core Principle

One task, one source of truth:

```text
docs/tasks/<task-id>-<short-name>.md
```

The task artifact is authoritative over chat memory. If the artifact and chat disagree, inspect the current repo state and update the artifact.

## Lifecycle

Use these states:

- `intake`: task captured, requirements still forming
- `spec ready`: behavior and boundaries are clear enough to plan
- `plan ready`: small executable plan exists
- `coding`: implementation is underway
- `code ready`: implementation is complete for the current plan
- `review ready`: verification and diff review are recorded
- `done`: accepted completion evidence exists
- `blocked`: progress needs input or an external condition

## Stage 1: Resume or Create Task Artifact

1. Search for an existing artifact by task id, title, branch name, or explicit path.
2. If found, read it completely before acting.
3. If not found, create `docs/tasks/<task-id>-<short-name>.md` from the template.
4. Record the raw user request, date, current state, and next action.
5. Read repo instructions before editing.

Gate:

- Do not leave `intake` unless the goal, initial scope, and next action are recorded.

## Stage 2: Clarify Requirements

1. Identify what is known, unknown, and assumed.
2. Ask only questions required to avoid likely rework or incorrect behavior.
3. Record assumptions when a reasonable default is safe.
4. Record non-goals to keep the task small.

Gate:

- Advance to `spec ready` only when scope, non-goals, assumptions, and open questions are recorded.

## Stage 3: Identify Existing Behavior and Relevant Files

1. Inspect the code before proposing changes.
2. Record relevant files, tests, commands, and existing behavior.
3. Prefer existing project patterns over new abstractions.
4. Note risky shared surfaces.

Gate:

- Do not create an execution plan until relevant files or the reason they are unknown is recorded.

## Stage 4: Draft a Short Spec When Needed

Write a short spec when behavior is user-facing, cross-module, risky, or ambiguous.

The spec should include:

- Desired behavior
- Out-of-scope behavior
- Acceptance criteria
- Error states or edge cases
- Compatibility or migration notes, if any

Gate:

- Advance to `plan ready` only when the spec is either recorded or explicitly marked unnecessary with a reason.

## Stage 5: Break Work into Small Execution Plans

Each plan should be small enough to implement and verify independently.

For each plan, record:

- Objective
- Expected files
- Test approach
- Verification commands
- Status

Gate:

- Do not enter `coding` until at least one plan is marked ready.

## Stage 6: Implement One Plan at a Time

1. Mark the active plan as in progress.
2. Add or update focused tests before code changes where practical.
3. Implement the smallest change that satisfies the plan.
4. Keep unrelated refactors out of scope.
5. Record changed files and notable decisions.

Gate:

- Advance to `code ready` only when changed files are recorded and tests are added, updated, or consciously deferred with a reason.

## Stage 7: Add or Update Focused Tests

Prefer focused tests close to the changed behavior.

If tests are not practical, record:

- Why not
- What alternative verification will be used
- What residual risk remains

Gate:

- Untested work can proceed only with an explicit risk note.

## Stage 8: Run Verification Commands

Run the narrowest useful verification first, then broader checks if risk warrants it.

Record:

- Date
- Command
- Scope
- Result
- Relevant failure summary, if failed

Gate:

- Do not advance to `review ready` without verification evidence.
- If verification cannot run, state must be no higher than `code ready` unless the task is blocked.

## Stage 9: Review the Diff Before Finalizing

Review the diff with scope discipline:

- Does the diff satisfy the task?
- Are there unrelated refactors?
- Are generated or lock files expected?
- Are tests aligned with the behavior?
- Did the artifact stay current?

Gate:

- Do not advance to `done` until diff review notes and completion evidence exist.

## Stage 10: Produce Final Handoff Summary

End every run with:

```text
Task:
State:
Artifact path:
Changes made:
Verification run:
Blockers or risks:
Next action:
```

If the task is not done, the next action must be concrete enough for the next session to continue.

## State Gate Rules

- State follows evidence.
- Do not advance state unless the required artifact or evidence exists.
- If evidence is missing, record a blocker or lower the state.
- If existing state is over-claimed, normalize it down to the highest state supported by evidence.
- Keep unrelated refactors out of scope.
- Do not use optional integrations as required gates.
- Never claim work is complete without verification evidence.

## Agent Operating Rules

- Read repo instructions before editing.
- Inspect existing code before proposing changes.
- Prefer existing project patterns.
- Ask only necessary clarifying questions.
- Record assumptions instead of hiding them.
- Before code changes, write or update focused tests where practical.
- After code changes, run the narrowest useful verification first.
- Run broader checks when risk warrants it.
- Review the diff before finalizing.
- Never claim completion without verification evidence.
- Keep the task artifact current enough for another session to resume.

