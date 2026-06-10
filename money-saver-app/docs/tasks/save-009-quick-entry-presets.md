# save-009: Quick Entry Presets

## Metadata

- Artifact path: `docs/tasks/save-009-quick-entry-presets.md`
- Created: `2026-06-10`
- Updated: `2026-06-10`
- Owner: `agent`
- Current state: `code ready`
- Next action: Add focused tests for quick-entry presets, then run verification.

## Goal

Let the app offer quick skipped-purchase presets for common savings moments, such as skipped coffee, packed lunch, walking instead of rideshare, and avoided impulse buys.

## Scope

- Define a small preset list.
- Include preset id, title, amount, and category id.
- Provide a helper to get a preset by id.
- Provide a helper to turn a preset into entry form input for a selected date.

## Non-Goals

- User-created presets.
- Preset analytics.
- Remote preset configuration.
- UI buttons for presets.

## Source Links

- User request example: "if I purposefully skipped starbucks, I Saved $6."
- Related task: `save-002-add-savings-entry-form.md`.

## Assumptions

- Presets are optional accelerators; users can still enter custom skipped purchases manually.
- Preset amounts are editable after selection.
- Presets should reuse existing category ids.

## Open Questions

- Should preset amounts be opinionated defaults or learned from the user's previous entries?

## Blockers

- None currently.

## Existing Behavior and Relevant Files

### Existing Behavior

- Manual entry exists through the entry form. Quick preset code has been written, but focused tests have not been added yet.

### Relevant Files

- `src/features/savings/quickEntryPresets.js`: Preset list and helpers.
- `src/features/savings/SavingsEntryForm.js`: Future integration point for applying preset input to the form.
- `src/features/savings/__tests__/quickEntryPresets.test.js`: Expected focused tests.

### Repo Instructions Read

- None found in this sample app folder.

## Short Spec

### Desired Behavior

- App exposes common skipped-purchase presets.
- Selecting a preset can produce valid entry input with title, amount, category, date, and empty note.
- Unknown preset ids fail clearly.

### Acceptance Criteria

- Coffee preset returns title `Skipped coffee`, amount `6`, and category `food`.
- Rideshare preset returns category `transport`.
- Building entry input from a preset uses the supplied date.
- Unknown preset id throws an error.

### Edge Cases

- Preset ids must stay stable because UI controls may reference them later.
- Preset amounts should remain positive.

### Spec Status

- `needed`
- Reason: Presets will shape the fast-entry UX and should be tested before wiring into the form.

## Execution Plans

### Plan A: Add Preset Module

- Status: `complete`
- Objective: Add quick-entry preset constants and lookup/build helpers.
- Expected files:
  - `src/features/savings/quickEntryPresets.js`
- Test approach:
  - Tests deferred to Plan B.
- Verification commands:
  - Not run for this plan.
- Notes:
  - Code is present, so state can be `code ready`, but verification is missing.

### Plan B: Add Preset Tests

- Status: `not started`
- Objective: Verify preset ids, positive amounts, category ids, date handling, and unknown id behavior.
- Expected files:
  - `src/features/savings/__tests__/quickEntryPresets.test.js`
- Test approach:
  - Unit tests for preset lookup and entry input creation.
- Verification commands:
  - `node --test src/features/savings/__tests__/quickEntryPresets.test.js`
- Notes:
  - Required before this task can advance to `review ready`.

## Implementation Log

- `2026-06-10`: Added `src/features/savings/quickEntryPresets.js` with common skipped-purchase presets and helper functions.

## Tests

- Added or updated:
  - None yet.
- Deferred:
  - `src/features/savings/__tests__/quickEntryPresets.test.js` is required before review.

## Verification Evidence

- `2026-06-10`: `node --test src/features/savings/__tests__/quickEntryPresets.test.js` — `not run`
  - Scope: Would verify preset lookup and entry input creation.
  - Notes: Test file does not exist yet.

## Diff Review

- Not reviewed yet.

## Final Handoff

- Task: save-009
- State: code ready
- Artifact path: `docs/tasks/save-009-quick-entry-presets.md`
- Changes made: Added quick-entry preset module.
- Verification run: Not run.
- Blockers or risks: Preset code is unverified and not yet wired into the UI.
- Next action: Add focused preset tests and run `node --test src/features/savings/__tests__/quickEntryPresets.test.js`.

## State History

- `2026-06-10`: `intake` — artifact created.
- `2026-06-10`: `spec ready` — preset behavior specified.
- `2026-06-10`: `plan ready` — preset module and test plans recorded.
- `2026-06-10`: `coding` — preset module implementation started.
- `2026-06-10`: `code ready` — code exists; verification evidence is intentionally missing and recorded.

