import { createSavingsEntry } from "./savingsTypes.js";

export function savingsReducer(entries, action) {
  switch (action.type) {
    case "add":
      return [...entries, action.entry];
    case "update":
      return updateEntry(entries, action.id, action.patch);
    case "delete":
      return entries.filter((entry) => entry.id !== action.id);
    case "replace":
      return [...action.entries];
    default:
      return entries;
  }
}

export function updateEntry(entries, id, patch) {
  let changed = false;
  const nextEntries = entries.map((entry) => {
    if (entry.id !== id) {
      return entry;
    }
    changed = true;
    return createSavingsEntry(
      {
        ...entry,
        ...patch,
        id: entry.id,
        createdAt: entry.createdAt,
        updatedAt: new Date().toISOString()
      },
      () => entry.id
    );
  });
  return changed ? nextEntries : entries;
}

