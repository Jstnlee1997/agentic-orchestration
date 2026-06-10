import { formatMoney } from "./savingsSummary.js";
import { sortEntriesNewestFirst } from "./savingsUtils.js";

export function renderHistoryItems(entries) {
  const sortedEntries = sortEntriesNewestFirst(entries);
  if (sortedEntries.length === 0) {
    return '<p class="empty">No savings logged for this range yet.</p>';
  }

  const items = sortedEntries.map((entry) => {
    return [
      '<li class="history-item">',
      `<strong>${escapeHtml(entry.title)}</strong>`,
      `<span>${formatMoney(entry.amount)} saved on ${escapeHtml(entry.date)}</span>`,
      entry.note ? `<small>${escapeHtml(entry.note)}</small>` : "",
      "</li>"
    ].join("");
  });

  return `<ul class="history-list">${items.join("")}</ul>`;
}

export function confirmDelete(entry, confirmFn = () => false) {
  return confirmFn(`Delete "${entry.title}"?`);
}

export function createEditPatch(input) {
  return {
    title: input.title,
    amount: input.amount,
    categoryId: input.categoryId,
    date: input.date,
    note: input.note || ""
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

