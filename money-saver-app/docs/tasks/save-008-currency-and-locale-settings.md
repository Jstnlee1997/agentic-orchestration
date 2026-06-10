# save-008: Currency and Locale Settings

## Metadata

- Artifact path: `docs/tasks/save-008-currency-and-locale-settings.md`
- Created: `2026-06-10`
- Updated: `2026-06-10`
- Owner: `agent`
- Current state: `blocked`
- Next action: Decide whether MVP supports only USD or includes user-selectable currency.

## Goal

Let users display saved amounts in their preferred currency and locale formatting.

## Scope

- Currency display setting.
- Locale-aware currency formatting.
- Default currency behavior.
- Formatting utilities used by summaries, history, and forms.

## Non-Goals

- Currency conversion.
- Exchange rates.
- Multi-currency entries in one account.
- Tax or financial advice.

## Source Links

- Related task: `save-005-savings-summary-charts.md`.
- Related task: `save-007-local-storage-persistence.md`.

## Assumptions

- Stored amounts are numeric and currency-agnostic unless the product decides otherwise.
- MVP can start with one currency if user-selectable currency adds too much complexity.

## Open Questions

- Should currency be global app preference or stored per entry?
- Should MVP default to USD, device locale currency, or explicit user choice during onboarding?
- Should changing currency relabel existing amounts or require conversion warnings?

## Blockers

- `2026-06-10`: Currency data model is blocked on product decision.
  - Cause: Storing currency globally versus per entry affects persistence and future migration.
  - Tried: Scoped a formatting-only approach and a per-entry currency approach.
  - Needed: Decision on MVP currency policy.
  - Next action: Choose one of: USD-only MVP, global currency preference, or per-entry currency.

## Existing Behavior and Relevant Files

### Existing Behavior

- Sample app currently assumes dollar display in copy and examples.

### Relevant Files

- `src/features/savings/savingsSummary.js`: Current `formatMoney` helper defaults to USD display.
- `src/features/settings/CurrencySettings.js`: Possible future settings UI.
- `src/features/savings/savingsTypes.js`: May need currency field if per-entry.
- `src/features/savings/savingsStorage.js`: May need migration if stored data shape changes.

### Repo Instructions Read

- None found in this sample app folder.

## Short Spec

### Desired Behavior

- Blocked until currency ownership is decided.

### Acceptance Criteria

- Not ready.

### Edge Cases

- Changing currency after entries exist.
- Stored entries created before currency support.
- Locale formatting for currencies without decimal minor units.

### Spec Status

- `needed`
- Reason: Data model and persistence behavior depend on the decision.

## Execution Plans

### Plan A: Formatting-Only USD MVP

- Status: `blocked`
- Objective: Add a shared formatter that defaults to USD and current locale.
- Expected files:
  - `src/features/savings/savingsSummary.js`
  - `src/features/savings/__tests__/formatMoney.test.js`
- Test approach:
  - Unit tests for formatting decimals and zero values.
- Verification commands:
  - `node --test src/features/savings/__tests__/formatMoney.test.js`
- Notes:
  - Lowest complexity option.

### Plan B: Global Currency Preference

- Status: `blocked`
- Objective: Add one app-level currency preference used for all entries.
- Expected files:
  - `src/features/settings/CurrencySettings.js`
  - `src/features/savings/savingsSummary.js`
  - `src/features/savings/savingsStorage.js`
- Test approach:
  - Unit tests for formatter and persistence of setting.
- Verification commands:
  - `node --test src/features/savings/__tests__/formatMoney.test.js src/features/settings/__tests__/CurrencySettings.test.js`
- Notes:
  - Better UX, but requires settings persistence.

### Plan C: Per-Entry Currency

- Status: `blocked`
- Objective: Store currency on each savings entry.
- Expected files:
  - `src/features/savings/savingsTypes.js`
  - `src/features/savings/SavingsEntryForm.js`
  - `src/features/savings/savingsStorage.js`
- Test approach:
  - Entry form, migration, and formatter tests.
- Verification commands:
  - `node --test src/features/savings/__tests__/SavingsEntryForm.test.js src/features/savings/__tests__/savingsStorage.test.js src/features/savings/__tests__/formatMoney.test.js`
- Notes:
  - Most flexible, but not ideal for a lightweight MVP.

## Implementation Log

- None; implementation is blocked.

## Tests

- Added or updated:
  - None.
- Deferred:
  - All tests deferred until currency policy is chosen.

## Verification Evidence

- Not run.

## Diff Review

- Not reviewed.

## Final Handoff

- Task: save-008
- State: blocked
- Artifact path: `docs/tasks/save-008-currency-and-locale-settings.md`
- Changes made: Recorded currency support options and blocker.
- Verification run: None.
- Blockers or risks: Data model can be overbuilt if currency policy is chosen too early.
- Next action: Decide between USD-only MVP, global currency preference, or per-entry currency.

## State History

- `2026-06-10`: `intake` — artifact created.
- `2026-06-10`: `blocked` — product/data-model decision required before planning or coding.
