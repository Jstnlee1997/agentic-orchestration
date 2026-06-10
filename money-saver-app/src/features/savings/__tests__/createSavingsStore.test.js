import test from "node:test";
import assert from "node:assert/strict";
import { createSavingsStore } from "../createSavingsStore.js";
import { loadSavingsEntries } from "../savingsStorage.js";
import { createMemoryStorage } from "./testStorage.js";

const entry = {
  id: "entry-1",
  title: "Skipped coffee",
  amount: 6,
  categoryId: "food",
  date: "2026-06-10",
  note: "",
  createdAt: "2026-06-10T12:00:00.000Z"
};

test("store loads entries and persists add, update, and delete", () => {
  const storage = createMemoryStorage();
  const store = createSavingsStore(storage);

  store.dispatch({ type: "add", entry });
  assert.deepEqual(loadSavingsEntries(storage), [entry]);

  store.dispatch({ type: "update", id: "entry-1", patch: { amount: 8 } });
  assert.equal(loadSavingsEntries(storage)[0].amount, 8);

  store.dispatch({ type: "delete", id: "entry-1" });
  assert.deepEqual(loadSavingsEntries(storage), []);
});

test("store notifies subscribers", () => {
  const storage = createMemoryStorage();
  const store = createSavingsStore(storage);
  let seen = null;
  const unsubscribe = store.subscribe((entries) => {
    seen = entries;
  });

  store.dispatch({ type: "add", entry });
  assert.deepEqual(seen, [entry]);

  unsubscribe();
  store.dispatch({ type: "delete", id: "entry-1" });
  assert.deepEqual(seen, [entry]);
});
