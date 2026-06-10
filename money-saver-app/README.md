# Money Saver App Task Pack

This folder contains example Personal Composer task artifacts for a lightweight app where users record money saved by intentionally not buying something.

Example behavior:

- User skips a purchase, such as coffee, rideshare, snacks, or an impulse item.
- User records the saved amount, category, date, and optional note.
- App shows total savings over time.
- App supports date filters such as daily, weekly, monthly, custom range.
- App groups savings by category, such as food, transport, shopping, entertainment, subscriptions, and other.

This folder now includes both the task artifacts and a small runnable implementation. Advanced states such as `review ready` and `done` point to real files under `src/` and real `npm` verification commands.

## Tasks

| Task | State | Purpose |
| --- | --- | --- |
| [`save-001-capture-mvp-scope.md`](docs/tasks/save-001-capture-mvp-scope.md) | `intake` | Capture the product goal and MVP boundaries. |
| [`save-002-add-savings-entry-form.md`](docs/tasks/save-002-add-savings-entry-form.md) | `code ready` | Add the form helpers and browser form; focused form tests still need to be added. |
| [`save-003-category-taxonomy-and-icons.md`](docs/tasks/save-003-category-taxonomy-and-icons.md) | `review ready` | Add category support with verification evidence recorded. |
| [`save-004-dashboard-date-range-filters.md`](docs/tasks/save-004-dashboard-date-range-filters.md) | `coding` | Add daily, weekly, monthly, and custom date filters. |
| [`save-005-savings-summary-charts.md`](docs/tasks/save-005-savings-summary-charts.md) | `review ready` | Add chart summaries with verification evidence recorded. |
| [`save-006-entry-history-edit-delete.md`](docs/tasks/save-006-entry-history-edit-delete.md) | `review ready` | Add entry history editing/deletion with verification evidence recorded. |
| [`save-007-local-storage-persistence.md`](docs/tasks/save-007-local-storage-persistence.md) | `done` | Persist entries locally with completion evidence recorded. |
| [`save-008-currency-and-locale-settings.md`](docs/tasks/save-008-currency-and-locale-settings.md) | `blocked` | Add currency/locale preferences, blocked on product decision. |
| [`save-009-quick-entry-presets.md`](docs/tasks/save-009-quick-entry-presets.md) | `code ready` | Add quick skipped-purchase presets; tests still need to be added. |

## App Shape

```text
index.html
package.json
src/
  app.js
  styles.css
  features/
    savings/
      SavingsEntryForm.js
      SavingsHistory.js
      createSavingsStore.js
      dateRanges.js
      quickEntryPresets.js
      savingsCategories.js
      savingsReducer.js
      savingsStorage.js
      savingsSummary.js
      savingsTypes.js
      savingsUtils.js
      __tests__/
```

## Verification

Run the whole focused test suite:

```text
npm test
```

Run a focused slice:

```text
npm run test:summary
npm run test:history
npm run test:storage
```

Use the task files as living artifacts. If the code changes, update each task state to match the available evidence.
