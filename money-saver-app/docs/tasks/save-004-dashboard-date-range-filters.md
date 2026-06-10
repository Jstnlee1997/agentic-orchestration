# save-004: Dashboard Date Range Filters

## Metadata

- Artifact path: `docs/tasks/save-004-dashboard-date-range-filters.md`
- Created: `2026-06-10`
- Updated: `2026-06-10`
- Owner: `agent`
- Current state: `coding`
- Next action: Add custom range UI controls or narrow the scope to preset ranges only.

## Goal

Let the user filter savings totals by daily, weekly, monthly, all-time, and custom date ranges.

## Scope

- Date range mode selector.
- Utility for computing date ranges.
- Dashboard total recalculation by selected range.
- Empty state when no entries match the selected range.

## Non-Goals

- Time zone preference UI.
- Fiscal calendars.
- Exporting filtered results.
- Server-side filtering.

## Source Links

- User request: "see overtime how much money I have saved, can easily filter by date range: daily, weekly, etc."

## Assumptions

- Dates are stored as ISO date strings.
- Local device time zone is acceptable for MVP.
- Weekly range starts on Monday unless product preference changes.

## Open Questions

- Should "weekly" mean current calendar week or trailing seven days?

## Blockers

- None currently.

## Existing Behavior and Relevant Files

### Existing Behavior

- Dashboard supports today, week, month, and all-time filters. Date range utilities support custom ranges, but the browser UI does not yet expose custom start/end controls.

### Relevant Files

- `src/app.js`: Dashboard filter button wiring.
- `src/features/savings/dateRanges.js`: Date range utilities.
- `src/features/savings/savingsUtils.js`: Filtering helpers.
- `src/features/savings/__tests__/dateRanges.test.js`: Focused unit tests.

### Repo Instructions Read

- None found in this sample app folder.

## Short Spec

### Desired Behavior

- User can choose today, this week, this month, all time, or custom range.
- Dashboard total updates when the range changes.
- Matching entries list updates with the same selected range.
- Empty state explains that no saved entries exist for the selected range.

### Acceptance Criteria

- Today filter includes only entries dated today.
- Week filter includes entries from the current Monday through Sunday.
- Month filter includes entries in the current calendar month.
- Custom filter includes entries on both start and end dates.

### Edge Cases

- Invalid custom range where end is before start should show validation instead of filtering.
- Entries with malformed dates should be excluded and logged in tests as unsupported input.

### Spec Status

- `needed`
- Reason: Date filtering affects totals and user trust.

## Execution Plans

### Plan A: Date Range Utilities

- Status: `complete`
- Objective: Add date range calculation and entry filtering helpers.
- Expected files:
  - `src/features/savings/dateRanges.js`
  - `src/features/savings/savingsUtils.js`
  - `src/features/savings/__tests__/dateRanges.test.js`
- Test approach:
  - Unit tests for daily, weekly, monthly, all-time, and custom ranges.
- Verification commands:
  - `npm run test:dates`
- Notes:
  - Completed and verified with fixed test dates.

### Plan B: Dashboard Filter Controls

- Status: `in progress`
- Objective: Add UI controls and connect them to dashboard totals.
- Expected files:
  - `src/app.js`
  - `index.html`
- Test approach:
  - Browser behavior still needs either DOM tests or manual QA.
- Verification commands:
  - `npm run test:dates`
- Notes:
  - Preset range buttons are wired. Custom range controls are still missing, so task remains `coding`.

## Implementation Log

- `2026-06-10`: Implemented date range utilities, filtering helpers, preset range buttons, and focused date range tests.

## Tests

- Added or updated:
  - `src/features/savings/__tests__/dateRanges.test.js`
- Deferred:
  - Dashboard DOM tests and custom range UI verification are deferred until Plan B is complete.

## Verification Evidence

- `2026-06-10`: `npm run test:dates` — `passed`
  - Scope: Verifies today, Monday-start week, month, inclusive custom range, and invalid custom range behavior.
  - Notes: 4 tests passed.
- `2026-06-10`: `npm test` — `passed`
  - Scope: Verifies the full focused savings suite.
  - Notes: 25 tests passed.

## Diff Review

- Not reviewed for finalization because custom range UI remains in progress.

## Final Handoff

- Task: save-004
- State: coding
- Artifact path: `docs/tasks/save-004-dashboard-date-range-filters.md`
- Changes made: Implemented date range utilities, filtering helpers, and preset dashboard filter buttons.
- Verification run: `npm run test:dates` passed; `npm test` passed.
- Blockers or risks: Custom range UI is not implemented; weekly range uses Monday-start calendar week.
- Next action: Add custom range UI controls or update scope to exclude custom range from MVP.

## State History

- `2026-06-10`: `intake` — artifact created.
- `2026-06-10`: `spec ready` — date filter behavior specified.
- `2026-06-10`: `plan ready` — Plan A and Plan B recorded.
- `2026-06-10`: `coding` — Plan A complete and Plan B remains in progress because custom range UI is missing.
