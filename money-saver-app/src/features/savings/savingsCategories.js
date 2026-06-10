export const SAVINGS_CATEGORIES = Object.freeze([
  {
    id: "food",
    label: "Food",
    icon: "utensils",
    description: "Coffee, snacks, restaurants, and takeout skipped."
  },
  {
    id: "transport",
    label: "Transport",
    icon: "train",
    description: "Rideshares, parking, fuel, transit, or trips avoided."
  },
  {
    id: "shopping",
    label: "Shopping",
    icon: "shopping-bag",
    description: "Clothes, gadgets, and impulse purchases skipped."
  },
  {
    id: "entertainment",
    label: "Entertainment",
    icon: "ticket",
    description: "Movies, games, events, and paid activities skipped."
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    icon: "repeat",
    description: "Canceled or avoided recurring purchases."
  },
  {
    id: "wellness",
    label: "Wellness",
    icon: "heart-pulse",
    description: "Fitness, beauty, or wellness purchases skipped."
  },
  {
    id: "other",
    label: "Other",
    icon: "circle-ellipsis",
    description: "Anything that does not fit another category."
  }
]);

export const CATEGORY_IDS = Object.freeze(SAVINGS_CATEGORIES.map((category) => category.id));

export function isSavingsCategoryId(value) {
  return CATEGORY_IDS.includes(value);
}

export function normalizeCategoryId(value) {
  return isSavingsCategoryId(value) ? value : "other";
}

export function getCategoryById(value) {
  const normalized = normalizeCategoryId(value);
  return SAVINGS_CATEGORIES.find((category) => category.id === normalized);
}

