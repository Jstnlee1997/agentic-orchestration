# save-003: Category Taxonomy and Icons

## Metadata

- Artifact path: `docs/tasks/save-003-category-taxonomy-and-icons.md`
- Created: `2026-06-10`
- Updated: `2026-06-10`
- Owner: `agent`
- Current state: `review ready`
- Next action: Final acceptance review; mark `done` if the fixed MVP taxonomy is accepted.

## Goal

Create a simple category model for grouping saved money entries by the type of skipped purchase.

## Scope

- Initial categories: food, transport, shopping, entertainment, subscriptions, wellness, other.
- Category labels and descriptions.
- Icon names or tokens for UI rendering.
- Utility for validating category ids.

## Non-Goals

- User-created custom categories.
- Category budgets.
- Category-specific goals.
- Icon artwork creation.

## Source Links

- User request: "different categories: transport, food, etc."
- Related task: `save-002-add-savings-entry-form.md`.

## Assumptions

- A small fixed taxonomy is enough for MVP.
- Icons can be referenced by name from whatever icon library the app uses later.
- `other` is required so the form never blocks on perfect categorization.

## Open Questions

- Should coffee be its own category, or should it stay under food?

## Blockers

- None currently.

## Existing Behavior and Relevant Files

### Existing Behavior

- Category constants, helpers, and focused tests exist.

### Relevant Files

- `src/features/savings/savingsCategories.js`: Category definitions and helper functions.
- `src/features/savings/SavingsEntryForm.js`: Renders category options from the shared taxonomy.
- `src/features/savings/__tests__/savingsCategories.test.js`: Category utility tests.

### Repo Instructions Read

- None found in this sample app folder.

## Short Spec

### Desired Behavior

- App exposes a stable list of category ids and display labels.
- Entry form can render category options.
- Dashboard can group totals by category.
- Unknown category ids are rejected or normalized to `other`.

### Acceptance Criteria

- Category list includes food, transport, shopping, entertainment, subscriptions, wellness, and other.
- Each category has id, label, and icon token.
- Category ids can be validated without duplicating string arrays.
- `other` appears last in the default display order.

### Edge Cases

- Unknown category from old data should not crash summary views.

### Spec Status

- `needed`
- Reason: Category ids become part of saved data and should be stable.

## Execution Plans

### Plan A: Add Category Model

- Status: `complete`
- Objective: Add typed category constants and validation helper.
- Expected files:
  - `src/features/savings/savingsCategories.js`
  - `src/features/savings/__tests__/savingsCategories.test.js`
- Test approach:
  - Unit tests for category order and validation.
- Verification commands:
  - `npm run test:categories`
- Notes:
  - Completed and verified. Icons are string tokens, not imported UI components.

### Plan B: Wire Categories Into Form

- Status: `complete`
- Objective: Let the entry form render category options from the shared taxonomy.
- Expected files:
  - `src/features/savings/SavingsEntryForm.js`
- Test approach:
  - Covered by category list tests and form category select population helper.
- Verification commands:
  - `npm run test:categories`
- Notes:
  - Browser form uses the shared taxonomy through `populateCategorySelect`.

## Implementation Log

- `2026-06-10`: Added fixed category taxonomy, validation helpers, and form category select population.

## Tests

- Added or updated:
  - `src/features/savings/__tests__/savingsCategories.test.js`
- Deferred:
  - None.

## Verification Evidence

- `2026-06-10`: `npm run test:categories` — `passed`
  - Scope: Verifies MVP category order, `other` last, category validation, normalization, and lookup.
  - Notes: 2 tests passed.
- `2026-06-10`: `npm test` — `passed`
  - Scope: Verifies the full focused savings suite.
  - Notes: 25 tests passed.

## Diff Review

- `2026-06-10`: Reviewed diff for scope.
  - In-scope changes: Category constants, category helpers, form category select support, focused category tests.
  - Out-of-scope changes: None.
  - Generated or lock files: None.

## Final Handoff

- Task: save-003
- State: review ready
- Artifact path: `docs/tasks/save-003-category-taxonomy-and-icons.md`
- Changes made: Implemented category taxonomy, validation helpers, and focused tests.
- Verification run: `npm run test:categories` passed; `npm test` passed.
- Blockers or risks: Coffee as standalone category remains undecided but can be handled later.
- Next action: Final acceptance review; mark `done` if the fixed taxonomy is accepted.

## State History

- `2026-06-10`: `intake` — artifact created.
- `2026-06-10`: `spec ready` — category spec recorded.
- `2026-06-10`: `plan ready` — Plan A marked ready.
- `2026-06-10`: `coding` — taxonomy implementation started.
- `2026-06-10`: `code ready` — taxonomy code and tests recorded.
- `2026-06-10`: `review ready` — verification and diff review recorded.
