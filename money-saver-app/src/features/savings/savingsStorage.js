const STORAGE_KEY = "money-saver.entries";

export function loadSavingsEntries(storage = globalThis.localStorage) {
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isStoredEntryLike) : [];
  } catch {
    return [];
  }
}

export function saveSavingsEntries(entries, storage = globalThis.localStorage) {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export function clearSavingsEntries(storage = globalThis.localStorage) {
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function getSavingsStorageKey() {
  return STORAGE_KEY;
}

function isStoredEntryLike(entry) {
  return Boolean(entry && typeof entry.id === "string" && typeof entry.title === "string");
}

