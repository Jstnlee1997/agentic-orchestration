# save-005: Savings Summary Charts

## Metadata

- Artifact path: `docs/tasks/save-005-savings-summary-charts.md`
- Created: `2026-06-10`
- Updated: `2026-06-10`
- Owner: `agent`
- Current state: `review ready`
- Next action: Perform final acceptance review and decide whether to mark done.

## Goal

Show visual summaries of saved money over time and by category.

## Scope

- Total saved card.
- Category breakdown chart.
- Trend chart by day or week.
- Empty state when there is no savings data.

## Non-Goals

- Advanced analytics.
- Forecasting.
- Exportable reports.
- Third-party chart service integration.

## Source Links

- User request: "see overtime how much money I have saved."
- Related task: `save-003-category-taxonomy-and-icons.md`.
- Related task: `save-004-dashboard-date-range-filters.md`.

## Assumptions

- A lightweight in-app chart component is enough for MVP.
- Chart data should be derived from entries, not stored separately.
- Chart colors can use the app theme once it exists.

## Open Questions

- Should trend buckets be daily or weekly by default on the main dashboard?

## Blockers

- None currently.

## Existing Behavior and Relevant Files

### Existing Behavior

- Summary aggregation helpers and lightweight chart rendering are implemented and verified.

### Relevant Files

- `src/features/savings/savingsSummary.js`: Aggregation helpers, money formatting, and summary chart HTML renderer.
- `src/features/savings/__tests__/savingsSummary.test.js`: Aggregation and renderer tests.
- `src/app.js`: Wires summary rendering into the dashboard.
- `src/styles.css`: Styles the lightweight bar chart rows.

### Repo Instructions Read

- None found in this sample app folder.

## Short Spec

### Desired Behavior

- Dashboard shows total saved for the selected range.
- Category chart shows amount saved by category.
- Trend chart shows saved amount over time.
- Empty chart states are readable and do not display misleading zeros as activity.

### Acceptance Criteria

- Given three food entries totaling `$18`, category summary returns food `$18`.
- Given entries across multiple dates, trend summary preserves chronological order.
- Given no entries, total is `$0` and charts show empty state.

### Edge Cases

- Unknown categories are grouped under `other`.
- Decimal sums are rounded to currency display precision.

### Spec Status

- `needed`
- Reason: Chart summaries must be numerically trustworthy.

## Execution Plans

### Plan A: Aggregation Helpers

- Status: `complete`
- Objective: Build pure summary helpers for total, category, and trend data.
- Expected files:
  - `src/features/savings/savingsSummary.js`
  - `src/features/savings/__tests__/savingsSummary.test.js`
- Test approach:
  - Unit tests for totals, category grouping, trend ordering, empty data.
- Verification commands:
  - `npm run test:summary`
- Notes:
  - Completed and verified.

### Plan B: Summary UI

- Status: `complete`
- Objective: Render summary cards and charts from helper output.
- Expected files:
  - `src/features/savings/savingsSummary.js`
  - `src/app.js`
  - `src/styles.css`
- Test approach:
  - Renderer test verifies category and trend chart sections appear.
- Verification commands:
  - `npm run test:summary`
- Notes:
  - Implemented as dependency-free HTML bar sections instead of a chart library.

## Implementation Log

- `2026-06-10`: Implemented aggregation helpers, currency formatting, dashboard summary object, and lightweight category/trend bar renderer.
- `2026-06-10`: Wired summary renderer into `src/app.js` and added chart row styles.

## Tests

- Added or updated:
  - `src/features/savings/__tests__/savingsSummary.test.js`
- Deferred:
  - None.

## Verification Evidence

- `2026-06-10`: `npm run test:summary` — `passed`
  - Scope: Verifies total saved math, category grouping, trend ordering, money formatting, and chart section rendering.
  - Notes: 5 tests passed.
- `2026-06-10`: `npm test` — `passed`
  - Scope: Verifies the full focused savings suite.
  - Notes: 25 tests passed.

## Diff Review

- `2026-06-10`: Reviewed diff for scope.
  - In-scope changes: Summary helpers, chart renderer, dashboard wiring, chart styles, focused tests.
  - Out-of-scope changes: None.
  - Generated or lock files: None.

## Final Handoff

- Task: save-005
- State: review ready
- Artifact path: `docs/tasks/save-005-savings-summary-charts.md`
- Changes made: Implemented summary helpers, money formatting, lightweight category/trend chart rendering, dashboard wiring, styles, and focused tests.
- Verification run: `npm run test:summary` passed; `npm test` passed.
- Blockers or risks: Visual chart polish can improve later, but MVP summary behavior is verified.
- Next action: Final acceptance review; mark `done` if the lightweight chart style is accepted.

## State History

- `2026-06-10`: `intake` — artifact created.
- `2026-06-10`: `spec ready` — summary behavior specified.
- `2026-06-10`: `plan ready` — summary helper and UI plans recorded.
- `2026-06-10`: `coding` — implementation started.
- `2026-06-10`: `code ready` — changed files and test additions recorded.
- `2026-06-10`: `review ready` — verification and diff review recorded.
