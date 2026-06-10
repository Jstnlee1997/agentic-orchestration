# save-006: Entry History Edit and Delete

## Metadata

- Artifact path: `docs/tasks/save-006-entry-history-edit-delete.md`
- Created: `2026-06-10`
- Updated: `2026-06-10`
- Owner: `agent`
- Current state: `review ready`
- Next action: Perform final acceptance review and decide whether to mark done.

## Goal

Let users review, edit, and delete saved entries from their history.

## Scope

- Chronological entry list.
- Edit action for amount, title, category, date, and note.
- Delete action with confirmation.
- Dashboard totals update after edit or delete.

## Non-Goals

- Bulk edit.
- Undo delete.
- Server sync.
- Audit history.

## Source Links

- Related task: `save-002-add-savings-entry-form.md`.
- Related task: `save-004-dashboard-date-range-filters.md`.

## Assumptions

- Entry ids are stable and generated when entries are created.
- Delete confirmation can be a lightweight modal or inline confirmation.
- Editing reuses the same validation rules as the add form.

## Open Questions

- Should delete confirmation be required for every entry, or only entries above a threshold amount?

## Blockers

- None currently.

## Existing Behavior and Relevant Files

### Existing Behavior

- Entry history rendering, edit patch creation, delete confirmation, and reducer update/delete behavior are implemented and verified.

### Relevant Files

- `src/features/savings/SavingsHistory.js`: Entry history rendering, edit patch helper, and delete confirmation helper.
- `src/features/savings/SavingsEntryForm.js`: Shared entry validation and entry construction.
- `src/features/savings/savingsReducer.js`: Entry add, update, delete, and replace state transitions.
- `src/features/savings/__tests__/SavingsHistory.test.js`: History rendering and action helper tests.
- `src/features/savings/__tests__/savingsReducer.test.js`: Reducer tests.

### Repo Instructions Read

- None found in this sample app folder.

## Short Spec

### Desired Behavior

- User can see recent saved entries in reverse chronological order.
- User can edit an entry and see totals update.
- User can delete an entry after confirming.
- User cannot save invalid edits.

### Acceptance Criteria

- Editing `$6` to `$8` updates history and dashboard total.
- Deleting an entry removes it from the list and recalculates totals.
- Canceling delete keeps the entry.
- Invalid edit preserves original entry data.

### Edge Cases

- Editing an entry outside the current date filter should remove it from the filtered list after save.
- Deleting the last visible entry should show the empty state.

### Spec Status

- `needed`
- Reason: Mutations must keep history and totals consistent.

## Execution Plans

### Plan A: Reducer Update and Delete Tests

- Status: `complete`
- Objective: Verify update and delete state transitions.
- Expected files:
  - `src/features/savings/savingsReducer.js`
  - `src/features/savings/__tests__/savingsReducer.test.js`
- Test approach:
  - Unit tests for update, delete, invalid id, and unchanged state.
- Verification commands:
  - `npm run test:history`
- Notes:
  - Completed and verified.

### Plan B: History UI Actions

- Status: `complete`
- Objective: Add edit and delete controls to entry history.
- Expected files:
  - `src/features/savings/SavingsHistory.js`
  - `src/features/savings/__tests__/SavingsHistory.test.js`
- Test approach:
  - Unit tests for escaped history rendering, empty state, edit patch creation, and delete confirmation.
- Verification commands:
  - `npm run test:history`
- Notes:
  - Completed and verified.

## Implementation Log

- `2026-06-10`: Added reducer behavior for adding, updating, replacing, and deleting entries.
- `2026-06-10`: Added history rendering, edit patch helper, delete confirmation helper, and focused tests.

## Tests

- Added or updated:
  - `src/features/savings/__tests__/savingsReducer.test.js`
  - `src/features/savings/__tests__/SavingsHistory.test.js`
- Deferred:
  - None.

## Verification Evidence

- `2026-06-10`: `npm run test:history` — `passed`
  - Scope: Verifies history rendering, delete confirmation, edit patch creation, and reducer update/delete behavior.
  - Notes: 8 tests passed.
- `2026-06-10`: `npm test` — `passed`
  - Scope: Verifies the full focused savings suite.
  - Notes: 25 tests passed.

## Diff Review

- `2026-06-10`: Reviewed diff for scope.
  - In-scope changes: History UI, reducer update/delete behavior, focused tests.
  - Out-of-scope changes: None.
  - Generated or lock files: None.

## Final Handoff

- Task: save-006
- State: review ready
- Artifact path: `docs/tasks/save-006-entry-history-edit-delete.md`
- Changes made: Implemented history rendering helpers, edit/delete state transitions, delete confirmation helper, and focused tests.
- Verification run: `npm run test:history` passed; `npm test` passed.
- Blockers or risks: Delete confirmation policy still has a minor product question.
- Next action: Accept the delete confirmation behavior or adjust policy before marking `done`.

## State History

- `2026-06-10`: `intake` — artifact created.
- `2026-06-10`: `spec ready` — edit/delete behavior specified.
- `2026-06-10`: `plan ready` — reducer and UI plans recorded.
- `2026-06-10`: `coding` — implementation started.
- `2026-06-10`: `code ready` — implementation and tests recorded.
- `2026-06-10`: `review ready` — verification and diff review recorded.
