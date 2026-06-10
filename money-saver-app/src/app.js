import { DATE_RANGE_MODES } from "./features/savings/savingsTypes.js";
import { SAVINGS_CATEGORIES } from "./features/savings/savingsCategories.js";
import { buildEntryFromForm, populateCategorySelect, readForm } from "./features/savings/SavingsEntryForm.js";
import { createSavingsStore } from "./features/savings/createSavingsStore.js";
import { filterEntriesByRange } from "./features/savings/savingsUtils.js";
import { buildDashboardSummary, formatMoney, renderSavingsSummary } from "./features/savings/savingsSummary.js";
import { renderHistoryItems } from "./features/savings/SavingsHistory.js";

const store = createSavingsStore(globalThis.localStorage);
let activeRange = DATE_RANGE_MODES.ALL;

const form = document.querySelector("#entryForm");
const categorySelect = document.querySelector("#categorySelect");
const formError = document.querySelector("#formError");
const totalSaved = document.querySelector("#totalSaved");
const summary = document.querySelector("#summary");
const history = document.querySelector("#history");
const filterButtons = [...document.querySelectorAll("[data-range]")];

populateCategorySelect(categorySelect);
form.elements.date.value = new Date().toISOString().slice(0, 10);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const result = buildEntryFromForm(readForm(form));
  if (!result.ok) {
    formError.textContent = Object.values(result.errors)[0];
    return;
  }
  formError.textContent = "";
  store.dispatch({ type: "add", entry: result.entry });
  form.reset();
  form.elements.date.value = new Date().toISOString().slice(0, 10);
  categorySelect.value = SAVINGS_CATEGORIES[0].id;
});

for (const button of filterButtons) {
  button.addEventListener("click", () => {
    activeRange = button.dataset.range;
    render();
  });
}

store.subscribe(render);
render();

function render() {
  const entries = getVisibleEntries();
  const dashboard = buildDashboardSummary(entries);

  totalSaved.textContent = formatMoney(dashboard.total);
  summary.innerHTML = renderSavingsSummary(entries);
  history.innerHTML = renderHistoryItems(entries);

  for (const button of filterButtons) {
    button.classList.toggle("active", button.dataset.range === activeRange);
  }
}

function getVisibleEntries() {
  if (activeRange === DATE_RANGE_MODES.ALL) {
    return store.getEntries();
  }
  return filterEntriesByRange(store.getEntries(), activeRange, {
    today: new Date().toISOString().slice(0, 10)
  });
}
