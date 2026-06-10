# save-001: Capture MVP Scope

## Metadata

- Artifact path: `docs/tasks/save-001-capture-mvp-scope.md`
- Created: `2026-06-10`
- Updated: `2026-06-10`
- Owner: `agent`
- Current state: `intake`
- Next action: Clarify the smallest useful MVP for logging and reviewing skipped purchases.

## Goal

Define the first usable version of a money saving app where a user records how much they saved by intentionally not buying something.

## Scope

- Capture the core user journey.
- Define the minimum data model for a saved purchase avoidance entry.
- Identify the first dashboard metrics.
- Decide which filters are needed for MVP.

## Non-Goals

- Bank integrations.
- Budget forecasting.
- Shared accounts.
- Authentication.
- Production deployment.

## Source Links

- User request: "if I purposefully skipped starbucks, I Saved $6" with categories and date range filters.

## Assumptions

- The first version is personal and local-first.
- Manual entry is acceptable for MVP.
- A "saved entry" represents a purchase the user intentionally skipped.

## Open Questions

- Should saved amounts support decimals only, or also quick presets such as `$5`, `$10`, `$20`?
- Should the app track emotional motivation, such as "avoided impulse buy", or stay purely financial?

## Blockers

- None currently.

## Existing Behavior and Relevant Files

### Existing Behavior

- No app exists yet in this sample task pack.

### Relevant Files

- `docs/tasks/save-001-capture-mvp-scope.md`: Source of truth for MVP scope.

### Repo Instructions Read

- None found in this sample app folder.

## Short Spec

### Desired Behavior

- User can understand what the MVP includes before implementation begins.
- Agent can create follow-up implementation tasks from the agreed scope.

### Acceptance Criteria

- MVP goal is written in one paragraph.
- In-scope and out-of-scope items are explicit.
- Follow-up tasks are listed or linked.

### Edge Cases

- If scope expands into budgeting or banking features, split those into later tasks.

### Spec Status

- `needed`
- Reason: The app idea is still broad and should be bounded before coding.

## Execution Plans

### Plan A: Define MVP Product Slice

- Status: `not started`
- Objective: Convert the raw app idea into a one-screen MVP.
- Expected files:
  - `docs/tasks/save-001-capture-mvp-scope.md`
- Test approach:
  - Not applicable; this is a planning artifact.
- Verification commands:
  - Manual review of scope against user request.
- Notes:
  - Keep the first version focused on manual logging and simple totals.

## Implementation Log

- None yet.

## Tests

- Added or updated:
  - None.
- Deferred:
  - Tests are not applicable until implementation tasks begin.

## Verification Evidence

- Not run.

## Diff Review

- Not reviewed yet.

## Final Handoff

- Task: save-001
- State: intake
- Artifact path: `docs/tasks/save-001-capture-mvp-scope.md`
- Changes made: Created initial intake artifact.
- Verification run: None.
- Blockers or risks: MVP scope still needs confirmation.
- Next action: Clarify MVP boundaries and advance to `spec ready` when scope is recorded.

## State History

- `2026-06-10`: `intake` — artifact created.

