export const DATE_RANGE_MODES = Object.freeze({
  TODAY: "today",
  WEEK: "week",
  MONTH: "month",
  ALL: "all",
  CUSTOM: "custom"
});

export function normalizeAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return Number.NaN;
  }
  return Math.round(amount * 100) / 100;
}

export function createSavingsEntry(input, idFactory = defaultIdFactory) {
  const amount = normalizeAmount(input.amount);
  const entry = {
    id: input.id || idFactory(),
    title: String(input.title || "").trim(),
    amount,
    categoryId: input.categoryId,
    date: input.date,
    note: String(input.note || "").trim(),
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || null
  };

  const errors = validateSavingsEntry(entry);
  if (errors.length > 0) {
    const error = new Error(errors.join("; "));
    error.name = "SavingsEntryValidationError";
    error.errors = errors;
    throw error;
  }

  return entry;
}

export function validateSavingsEntry(entry) {
  const errors = [];
  if (!entry.title || entry.title.length === 0) {
    errors.push("Title is required");
  }
  if (!Number.isFinite(entry.amount) || entry.amount <= 0) {
    errors.push("Amount must be greater than zero");
  }
  if (!entry.categoryId) {
    errors.push("Category is required");
  }
  if (!isIsoDate(entry.date)) {
    errors.push("Date must be an ISO date");
  }
  return errors;
}

export function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function defaultIdFactory() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

