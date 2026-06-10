import { SAVINGS_CATEGORIES, normalizeCategoryId } from "./savingsCategories.js";

export function getTotalSaved(entries) {
  return roundCurrency(entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0));
}

export function getCategorySummary(entries) {
  const totals = new Map(SAVINGS_CATEGORIES.map((category) => [category.id, 0]));

  for (const entry of entries) {
    const categoryId = normalizeCategoryId(entry.categoryId);
    totals.set(categoryId, roundCurrency((totals.get(categoryId) || 0) + Number(entry.amount || 0)));
  }

  return SAVINGS_CATEGORIES.map((category) => ({
    categoryId: category.id,
    label: category.label,
    amount: totals.get(category.id) || 0
  })).filter((item) => item.amount > 0);
}

export function getTrendSummary(entries, bucket = "day") {
  const totals = new Map();

  for (const entry of entries) {
    const key = bucket === "week" ? getWeekBucket(entry.date) : entry.date;
    totals.set(key, roundCurrency((totals.get(key) || 0) + Number(entry.amount || 0)));
  }

  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));
}

export function buildDashboardSummary(entries) {
  return {
    total: getTotalSaved(entries),
    byCategory: getCategorySummary(entries),
    trend: getTrendSummary(entries)
  };
}

export function renderSavingsSummary(entries) {
  const dashboard = buildDashboardSummary(entries);
  if (entries.length === 0) {
    return '<div class="summary-empty">No savings logged for this range yet.</div>';
  }

  return [
    `<p><strong>${formatMoney(dashboard.total)}</strong> saved in this range.</p>`,
    renderBarChart("By category", dashboard.byCategory, "label"),
    renderBarChart("Trend", dashboard.trend, "date")
  ].join("");
}

export function formatMoney(amount, currency = "USD", locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency
  }).format(Number(amount || 0));
}

function renderBarChart(title, rows, labelKey) {
  if (rows.length === 0) {
    return `<section class="mini-chart"><h3>${title}</h3><p>No data yet.</p></section>`;
  }

  const max = Math.max(...rows.map((row) => row.amount), 1);
  const bars = rows.map((row) => {
    const width = Math.max(4, Math.round((row.amount / max) * 100));
    return [
      '<div class="bar-row">',
      `<span>${escapeHtml(row[labelKey])}</span>`,
      `<div class="bar-track"><i style="width: ${width}%"></i></div>`,
      `<strong>${formatMoney(row.amount)}</strong>`,
      "</div>"
    ].join("");
  });

  return `<section class="mini-chart"><h3>${title}</h3>${bars.join("")}</section>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getWeekBucket(isoDate) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const dayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayOffset);
  return date.toISOString().slice(0, 10);
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}
