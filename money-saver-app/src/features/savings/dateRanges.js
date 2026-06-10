import { DATE_RANGE_MODES, isIsoDate } from "./savingsTypes.js";

export function getDateRange(mode, options = {}) {
  const today = parseDate(options.today || toIsoDate(new Date()));

  if (mode === DATE_RANGE_MODES.TODAY) {
    return range(toIsoDate(today), toIsoDate(today));
  }

  if (mode === DATE_RANGE_MODES.WEEK) {
    const start = addDays(today, -((today.getUTCDay() + 6) % 7));
    return range(toIsoDate(start), toIsoDate(addDays(start, 6)));
  }

  if (mode === DATE_RANGE_MODES.MONTH) {
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
    return range(toIsoDate(start), toIsoDate(end));
  }

  if (mode === DATE_RANGE_MODES.CUSTOM) {
    const customRange = range(options.startDate, options.endDate);
    if (compareIsoDates(customRange.startDate, customRange.endDate) > 0) {
      throw new Error("Custom date range end must be on or after start");
    }
    return customRange;
  }

  return { mode: DATE_RANGE_MODES.ALL, startDate: null, endDate: null };
}

export function isDateInRange(date, dateRange) {
  if (!isIsoDate(date)) {
    return false;
  }
  if (!dateRange.startDate || !dateRange.endDate) {
    return true;
  }
  return compareIsoDates(date, dateRange.startDate) >= 0 && compareIsoDates(date, dateRange.endDate) <= 0;
}

export function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function range(startDate, endDate) {
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
    throw new Error("Date range requires ISO start and end dates");
  }
  return { mode: DATE_RANGE_MODES.CUSTOM, startDate, endDate };
}

function parseDate(value) {
  if (!isIsoDate(value)) {
    throw new Error("Expected ISO date");
  }
  return new Date(`${value}T00:00:00Z`);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function compareIsoDates(a, b) {
  return a.localeCompare(b);
}

