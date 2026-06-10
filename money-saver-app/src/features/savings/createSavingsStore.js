import { savingsReducer } from "./savingsReducer.js";
import { loadSavingsEntries, saveSavingsEntries } from "./savingsStorage.js";

export function createSavingsStore(storage) {
  let entries = loadSavingsEntries(storage);
  const listeners = new Set();

  function getEntries() {
    return [...entries];
  }

  function dispatch(action) {
    entries = savingsReducer(entries, action);
    saveSavingsEntries(entries, storage);
    for (const listener of listeners) {
      listener(getEntries());
    }
    return getEntries();
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    getEntries,
    dispatch,
    subscribe
  };
}

