import test from "node:test";
import assert from "node:assert/strict";
import { clearSavingsEntries, getSavingsStorageKey, loadSavingsEntries, saveSavingsEntries } from "../savingsStorage.js";
import { createMemoryStorage } from "./testStorage.js";

test("storage loads empty list when no data exists", () => {
  const storage = createMemoryStorage();
  assert.deepEqual(loadSavingsEntries(storage), []);
});

test("storage saves and loads valid entries", () => {
  const storage = createMemoryStorage();
  const entries = [{ id: "entry-1", title: "Skipped coffee", amount: 6, categoryId: "food", date: "2026-06-10" }];
  assert.equal(saveSavingsEntries(entries, storage), true);
  assert.deepEqual(loadSavingsEntries(storage), entries);
});

test("storage ignores malformed data", () => {
  const storage = createMemoryStorage();
  storage.setItem(getSavingsStorageKey(), "{not json");
  assert.deepEqual(loadSavingsEntries(storage), []);
});

test("storage can clear entries", () => {
  const storage = createMemoryStorage();
  saveSavingsEntries([{ id: "entry-1", title: "Skipped coffee" }], storage);
  assert.equal(clearSavingsEntries(storage), true);
  assert.deepEqual(loadSavingsEntries(storage), []);
});
