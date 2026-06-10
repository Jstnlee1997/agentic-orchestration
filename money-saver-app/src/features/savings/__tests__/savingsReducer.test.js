import test from "node:test";
import assert from "node:assert/strict";
import { savingsReducer, updateEntry } from "../savingsReducer.js";

const baseEntry = {
  id: "entry-1",
  title: "Skipped coffee",
  amount: 6,
  categoryId: "food",
  date: "2026-06-10",
  note: "",
  createdAt: "2026-06-10T12:00:00.000Z",
  updatedAt: null
};

test("add appends a savings entry", () => {
  const next = savingsReducer([], { type: "add", entry: baseEntry });
  assert.deepEqual(next, [baseEntry]);
});

test("update changes an existing entry and preserves id", () => {
  const next = updateEntry([baseEntry], "entry-1", { amount: 8, title: "Skipped large coffee" });
  assert.equal(next[0].id, "entry-1");
  assert.equal(next[0].amount, 8);
  assert.equal(next[0].title, "Skipped large coffee");
  assert.equal(next[0].createdAt, baseEntry.createdAt);
  assert.ok(next[0].updatedAt);
});

test("update with unknown id returns the original array", () => {
  const entries = [baseEntry];
  assert.equal(updateEntry(entries, "missing", { amount: 10 }), entries);
});

test("delete removes the entry by id", () => {
  const next = savingsReducer([baseEntry], { type: "delete", id: "entry-1" });
  assert.deepEqual(next, []);
});

