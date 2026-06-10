import { SAVINGS_CATEGORIES, isSavingsCategoryId } from "./savingsCategories.js";
import { createSavingsEntry, normalizeAmount } from "./savingsTypes.js";

export function validateSavingsEntryInput(input) {
  const errors = {};
  const amount = normalizeAmount(input.amount);

  if (!String(input.title || "").trim()) {
    errors.title = "Add what you skipped.";
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = "Enter an amount greater than zero.";
  }
  if (!isSavingsCategoryId(input.categoryId)) {
    errors.categoryId = "Choose a savings category.";
  }
  if (!input.date) {
    errors.date = "Choose a date.";
  }

  return errors;
}

export function buildEntryFromForm(input, idFactory) {
  const errors = validateSavingsEntryInput(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    entry: createSavingsEntry(
      {
        title: input.title,
        amount: input.amount,
        categoryId: input.categoryId,
        date: input.date,
        note: input.note
      },
      idFactory
    )
  };
}

export function populateCategorySelect(selectElement) {
  selectElement.replaceChildren(
    ...SAVINGS_CATEGORIES.map((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.label;
      return option;
    })
  );
}

export function readForm(formElement) {
  const formData = new FormData(formElement);
  return {
    title: formData.get("title"),
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId"),
    date: formData.get("date"),
    note: formData.get("note")
  };
}

