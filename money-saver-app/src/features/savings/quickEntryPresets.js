export const QUICK_ENTRY_PRESETS = Object.freeze([
  {
    id: "coffee",
    title: "Skipped coffee",
    amount: 6,
    categoryId: "food"
  },
  {
    id: "lunch",
    title: "Packed lunch",
    amount: 14,
    categoryId: "food"
  },
  {
    id: "rideshare",
    title: "Walked instead of rideshare",
    amount: 18,
    categoryId: "transport"
  },
  {
    id: "snack",
    title: "Skipped snack run",
    amount: 5,
    categoryId: "food"
  },
  {
    id: "impulse",
    title: "Avoided impulse buy",
    amount: 25,
    categoryId: "shopping"
  }
]);

export function getQuickEntryPreset(id) {
  return QUICK_ENTRY_PRESETS.find((preset) => preset.id === id) || null;
}

export function buildEntryInputFromPreset(id, date = new Date().toISOString().slice(0, 10)) {
  const preset = getQuickEntryPreset(id);
  if (!preset) {
    throw new Error(`Unknown quick entry preset: ${id}`);
  }

  return {
    title: preset.title,
    amount: preset.amount,
    categoryId: preset.categoryId,
    date,
    note: ""
  };
}

