import { getDateRange, isDateInRange } from "./dateRanges.js";
import { normalizeCategoryId } from "./savingsCategories.js";

export function filterEntriesByRange(entries, mode, options = {}) {
  const dateRange = getDateRange(mode, options);
  return entries.filter((entry) => isDateInRange(entry.date, dateRange));
}

export function normalizeEntryForDisplay(entry) {
  return {
    ...entry,
    categoryId: normalizeCategoryId(entry.categoryId),
    note: entry.note || ""
  };
}

export function sortEntriesNewestFirst(entries) {
  return [...entries].sort((a, b) => {
    const dateSort = b.date.localeCompare(a.date);
    if (dateSort !== 0) {
      return dateSort;
    }
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
}

