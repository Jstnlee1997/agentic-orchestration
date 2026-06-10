import test from "node:test";
import assert from "node:assert/strict";
import { DATE_RANGE_MODES } from "../savingsTypes.js";
import { filterEntriesByRange } from "../savingsUtils.js";
import { getDateRange, isDateInRange } from "../dateRanges.js";

const entries = [
  { id: "1", title: "Skipped coffee", amount: 6, categoryId: "food", date: "2026-06-08" },
  { id: "2", title: "Walked instead", amount: 12, categoryId: "transport", date: "2026-06-10" },
  { id: "3", title: "No impulse buy", amount: 30, categoryId: "shopping", date: "2026-05-30" }
];

test("today range includes only the selected day", () => {
  const range = getDateRange(DATE_RANGE_MODES.TODAY, { today: "2026-06-10" });
  assert.deepEqual(range, { mode: "custom", startDate: "2026-06-10", endDate: "2026-06-10" });
  assert.deepEqual(filterEntriesByRange(entries, DATE_RANGE_MODES.TODAY, { today: "2026-06-10" }).map((entry) => entry.id), ["2"]);
});

test("week range starts Monday and ends Sunday", () => {
  const range = getDateRange(DATE_RANGE_MODES.WEEK, { today: "2026-06-10" });
  assert.deepEqual(range, { mode: "custom", startDate: "2026-06-08", endDate: "2026-06-14" });
  assert.deepEqual(filterEntriesByRange(entries, DATE_RANGE_MODES.WEEK, { today: "2026-06-10" }).map((entry) => entry.id), ["1", "2"]);
});

test("month and custom ranges are inclusive", () => {
  const month = getDateRange(DATE_RANGE_MODES.MONTH, { today: "2026-06-10" });
  assert.deepEqual(month, { mode: "custom", startDate: "2026-06-01", endDate: "2026-06-30" });
  assert.equal(isDateInRange("2026-06-01", month), true);
  assert.equal(isDateInRange("2026-06-30", month), true);
  assert.deepEqual(filterEntriesByRange(entries, DATE_RANGE_MODES.CUSTOM, {
    startDate: "2026-05-30",
    endDate: "2026-06-08"
  }).map((entry) => entry.id), ["1", "3"]);
});

test("invalid custom range throws", () => {
  assert.throws(() => getDateRange(DATE_RANGE_MODES.CUSTOM, {
    startDate: "2026-06-12",
    endDate: "2026-06-10"
  }), /end must be on or after start/);
});

