/**
 * Corporate boxed lunch — classic sandwich allowlist + default “included” items (stored via removals when unchecked).
 */

export type BoxedLunchRemovalKey = "lettuce" | "tomato" | "mayo" | "mustard" | "cheese";

/** Canonical keys stored in `removedItems` / JSON (lowercase). */
export const BOXED_LUNCH_REMOVAL_KEYS: readonly BoxedLunchRemovalKey[] = [
  "lettuce",
  "tomato",
  "mayo",
  "mustard",
  "cheese",
];

/** Shown checked by default; unchecked → add key to `removedItems`. */
export const BOXED_LUNCH_DEFAULT_INCLUDED_ITEMS: readonly { key: BoxedLunchRemovalKey; label: string }[] = [
  { key: "tomato", label: "Roma tomatoes" },
  { key: "lettuce", label: "Green leaf lettuce" },
  { key: "mayo", label: "Mayo (side)" },
  { key: "mustard", label: "Spicy mustard (side)" },
  { key: "cheese", label: "Cheese (if applicable)" },
];

/**
 * Reference list for classic-tier sandwich names (documentation / expected count = 7).
 * BEO Intake loads the Classic tab from Airtable (Category = Classic AND Box Lunch Type = Classic Sandwich) — not this list.
 */
export const CLASSIC_CORPORATE_SANDWICH_NAMES: readonly string[] = [
  "Honey ham & american cheese",
  "Oven roasted turkey & swiss",
  "Roast beef & white cheddar",
  "Grilled chicken & pepper jack",
  "Tuna salad",
  "White grape chicken salad",
  "Genoa salami, capicola, & provolone",
];

/** Classic Boxed Lunch: Airtable must return exactly this many rows for the strict Classic + Classic Sandwich filter. */
export const EXPECTED_CLASSIC_BOXED_LUNCH_MENU_ITEM_COUNT = CLASSIC_CORPORATE_SANDWICH_NAMES.length;

export function normalizeCorporateSandwichName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/,/g, " ")
    .replace(/\bsandwich(?:es)?\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CLASSIC_NORMALIZED = new Set(CLASSIC_CORPORATE_SANDWICH_NAMES.map((n) => normalizeCorporateSandwichName(n)));
const CLASSIC_NORMALIZED_ALIASES = new Set(
  [
    "Honey Ham & American",
    "Honey Ham & American Sandwich",
    "Oven Roasted Turkey & Swiss Sandwich",
    "Roast Beef & White Cheddar Sandwich",
    "Grilled Chicken & Pepper Jack Sandwich",
    "Tuna Salad Sandwich",
    "White Grape Chicken Salad Sandwich",
    "Genoa Salami, Capicola & Provolone Sandwich",
  ].map((n) => normalizeCorporateSandwichName(n))
);

/** @deprecated Classic intake uses `{Boxed Lunch Category} = "Classic"` in Airtable instead. */
export function isClassicCorporateSandwichMenuName(menuItemName: string): boolean {
  const normalized = normalizeCorporateSandwichName(menuItemName);
  return CLASSIC_NORMALIZED.has(normalized) || CLASSIC_NORMALIZED_ALIASES.has(normalized);
}

/**
 * Only the five canonical keys, lowercase. Unknown tokens dropped — no aliases.
 * Order matches `BOXED_LUNCH_REMOVAL_KEYS` for stable storage / print.
 */
export function sanitizeRemovalKeys(raw: string[]): BoxedLunchRemovalKey[] {
  const want = new Set(raw.map((s) => s.trim().toLowerCase()).filter(Boolean));
  return BOXED_LUNCH_REMOVAL_KEYS.filter((k) => want.has(k));
}
