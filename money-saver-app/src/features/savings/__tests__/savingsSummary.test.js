import test from "node:test";
import assert from "node:assert/strict";
import { buildDashboardSummary, formatMoney, getCategorySummary, getTotalSaved, getTrendSummary, renderSavingsSummary } from "../savingsSummary.js";

const entries = [
  { id: "1", title: "Skipped latte", amount: 6, categoryId: "food", date: "2026-06-10" },
  { id: "2", title: "Packed lunch", amount: 12, categoryId: "food", date: "2026-06-10" },
  { id: "3", title: "Walked home", amount: 4.5, categoryId: "transport", date: "2026-06-09" },
  { id: "4", title: "Skipped gadget", amount: 20, categoryId: "unknown", date: "2026-06-08" }
];

test("total saved sums decimal amounts", () => {
  assert.equal(getTotalSaved(entries), 42.5);
});

test("category summary groups unknown categories under other", () => {
  assert.deepEqual(getCategorySummary(entries), [
    { categoryId: "food", label: "Food", amount: 18 },
    { categoryId: "transport", label: "Transport", amount: 4.5 },
    { categoryId: "other", label: "Other", amount: 20 }
  ]);
});

test("trend summary is chronological", () => {
  assert.deepEqual(getTrendSummary(entries), [
    { date: "2026-06-08", amount: 20 },
    { date: "2026-06-09", amount: 4.5 },
    { date: "2026-06-10", amount: 18 }
  ]);
});

test("dashboard summary and money formatting are stable", () => {
  assert.equal(buildDashboardSummary(entries).total, 42.5);
  assert.equal(formatMoney(42.5), "$42.50");
});

test("summary renderer includes category and trend chart sections", () => {
  const html = renderSavingsSummary(entries);
  assert.match(html, /By category/);
  assert.match(html, /Trend/);
  assert.match(html, /Food/);
  assert.match(html, /\$42\.50/);
});
