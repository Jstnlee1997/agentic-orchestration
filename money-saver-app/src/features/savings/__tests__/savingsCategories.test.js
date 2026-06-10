import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORY_IDS, SAVINGS_CATEGORIES, getCategoryById, isSavingsCategoryId, normalizeCategoryId } from "../savingsCategories.js";

test("category list includes the MVP categories with other last", () => {
  assert.deepEqual(CATEGORY_IDS, [
    "food",
    "transport",
    "shopping",
    "entertainment",
    "subscriptions",
    "wellness",
    "other"
  ]);
  assert.equal(SAVINGS_CATEGORIES.at(-1).id, "other");
});

test("category ids can be validated and normalized", () => {
  assert.equal(isSavingsCategoryId("food"), true);
  assert.equal(isSavingsCategoryId("coffee"), false);
  assert.equal(normalizeCategoryId("coffee"), "other");
  assert.equal(getCategoryById("transport").label, "Transport");
});

