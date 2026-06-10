import test from "node:test";
import assert from "node:assert/strict";
import { confirmDelete, createEditPatch, renderHistoryItems } from "../SavingsHistory.js";

const entries = [
  {
    id: "entry-1",
    title: "Skipped <coffee>",
    amount: 6,
    categoryId: "food",
    date: "2026-06-10",
    note: "Made tea instead"
  }
];

test("history render escapes entry content and shows amount", () => {
  const html = renderHistoryItems(entries);
  assert.match(html, /Skipped &lt;coffee&gt;/);
  assert.match(html, /\$6\.00 saved on 2026-06-10/);
  assert.match(html, /Made tea instead/);
});

test("history render shows an empty state", () => {
  assert.match(renderHistoryItems([]), /No savings logged/);
});

test("delete confirmation delegates to caller confirmation", () => {
  assert.equal(confirmDelete(entries[0], () => true), true);
  assert.equal(confirmDelete(entries[0], () => false), false);
});

test("edit patch keeps only editable entry fields", () => {
  assert.deepEqual(createEditPatch({
    title: "Walked instead",
    amount: 12,
    categoryId: "transport",
    date: "2026-06-11",
    note: ""
  }), {
    title: "Walked instead",
    amount: 12,
    categoryId: "transport",
    date: "2026-06-11",
    note: ""
  });
});

