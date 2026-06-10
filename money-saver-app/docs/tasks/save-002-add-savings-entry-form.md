# save-002: Add Savings Entry Form

## Metadata

- Artifact path: `docs/tasks/save-002-add-savings-entry-form.md`
- Created: `2026-06-10`
- Updated: `2026-06-10`
- Owner: `agent`
- Current state: `code ready`
- Next action: Add focused form tests, then run verification.

## Goal

Let the user add a savings entry after skipping a purchase, such as "Skipped Starbucks" for `$6`.

## Scope

- Form fields for amount, category, date, title, and optional note.
- Validation for required amount, category, and date.
- Submit behavior that creates a new savings entry.
- Clear empty-state guidance when no entries exist.

## Non-Goals

- Recurring savings.
- Receipt scanning.
- Bank import.
- Multi-currency handling.

## Source Links

- User request: log money saved from not buying something.
- Related task: `save-001-capture-mvp-scope.md`.

## Assumptions

- Amount must be greater than zero.
- Default date is today.
- Category choices can use the initial taxonomy from `save-003-category-taxonomy-and-icons.md`.
- Notes are optional and should not block entry creation.

## Open Questions

- Should title be free text only, or should common skipped purchases be suggested?

## Blockers

- None currently.

## Existing Behavior and Relevant Files

### Existing Behavior

- Browser form and form helper code exist, but focused form tests have not been added yet.

### Relevant Files

- `src/features/savings/SavingsEntryForm.js`: Form validation, entry construction, category select population, and form reading helpers.
- `src/features/savings/savingsTypes.js`: Entry construction and validation primitives.
- `src/app.js`: Browser form wiring.
- `index.html`: Browser form markup.
- `src/features/savings/__tests__/SavingsEntryForm.test.js`: Expected focused tests.

### Repo Instructions Read

- None found in this sample app folder.

## Short Spec

### Desired Behavior

- User opens the app and can immediately log a skipped purchase.
- Form defaults date to today.
- Form requires amount, category, and title.
- Submitting a valid form adds the entry and resets the input fields.
- Invalid submission keeps the form visible and shows field-level errors.

### Acceptance Criteria

- Given amount `$6`, category `food`, title `Skipped Starbucks`, and today's date, submitting creates one entry.
- Given empty amount, submit shows an amount validation message.
- Given amount `0`, submit rejects the entry.
- Optional note can be saved when present.

### Edge Cases

- Decimal amounts such as `6.50` are accepted.
- Negative amounts are rejected.
- Future dates are allowed only if product scope confirms planned savings; otherwise reject them.

### Spec Status

- `needed`
- Reason: Form behavior affects validation, data shape, and test coverage.

## Execution Plans

### Plan A: Create Form and Validation Tests

- Status: `not started`
- Objective: Add focused tests for valid and invalid savings entry submissions.
- Expected files:
  - `src/features/savings/__tests__/SavingsEntryForm.test.js`
- Test approach:
  - Component tests for submission and validation.
- Verification commands:
  - `node --test src/features/savings/__tests__/SavingsEntryForm.test.js`
- Notes:
  - Tests should describe behavior before implementation.

### Plan B: Implement Entry Form

- Status: `complete`
- Objective: Build the form and wire submit behavior.
- Expected files:
  - `src/features/savings/SavingsEntryForm.js`
  - `src/features/savings/savingsTypes.js`
  - `src/app.js`
  - `index.html`
- Test approach:
  - Reuse Plan A tests.
- Verification commands:
  - `node --test src/features/savings/__tests__/SavingsEntryForm.test.js`
- Notes:
  - Keep styling minimal until the dashboard layout exists.

## Implementation Log

- `2026-06-10`: Implemented browser form markup, form validation helpers, entry construction, and app submit wiring.

## Tests

- Added or updated:
  - None yet.
- Deferred:
  - `src/features/savings/__tests__/SavingsEntryForm.test.js` is required before review.

## Verification Evidence

- `2026-06-10`: `node --test src/features/savings/__tests__/SavingsEntryForm.test.js` — `not run`
  - Scope: Would verify valid submission input and validation errors.
  - Notes: Test file does not exist yet.

## Diff Review

- Not reviewed yet.

## Final Handoff

- Task: save-002
- State: code ready
- Artifact path: `docs/tasks/save-002-add-savings-entry-form.md`
- Changes made: Implemented form helpers, browser form markup, and submit wiring.
- Verification run: Not run.
- Blockers or risks: Focused form tests are missing; title suggestions remain undecided but not blocking MVP.
- Next action: Add `src/features/savings/__tests__/SavingsEntryForm.test.js` and run it.

## State History

- `2026-06-10`: `intake` — artifact created.
- `2026-06-10`: `spec ready` — scope, assumptions, open question, and form spec recorded.
- `2026-06-10`: `coding` — form helper and browser wiring implementation started.
- `2026-06-10`: `code ready` — form code exists; focused verification is intentionally missing and recorded.
