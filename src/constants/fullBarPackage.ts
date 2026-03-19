/**
 * Full Bar Package contents — hard-coded, auto-added when "Full Bar Package" is selected.
 * Output to: Packout Table, BEO Print (Full BEO page 2) Bar Service, Kitchen BEO (mixers).
 */

export const FULL_BAR_PACKAGE = {
  glasswareAndService: [
    "Wine glasses",
    "Rocks glasses",
    "Beverage napkins",
  ],
  garnishes: [
    "Lemons",
    "Limes",
    "Cherries",
    "Olives",
    "Orange slices",
  ],
  mixers: [
    "Orange juice",
    "Cranberry juice",
    "Pineapple juice",
    "Club soda",
    "Soda",
    "Ginger ale",
    "Tonic",
    "Sour mix",
    "Grenadine",
    "Cream",
  ],
} as const;

/** All Full Bar Package items for packout (flat list). */
export function getFullBarPackagePackoutItems(): string[] {
  return [
    ...FULL_BAR_PACKAGE.glasswareAndService,
    ...FULL_BAR_PACKAGE.garnishes,
    ...FULL_BAR_PACKAGE.mixers,
  ];
}

/** Signature Cocktail Greeting line — use when Signature Drink = Yes. */
export function getSignatureCocktailGreeting(signatureDrinkName: string): string {
  const name = signatureDrinkName?.trim() || "Signature Cocktail";
  return `His & Hers greeting cocktails (${name})`;
}

/** Grouped bar rows for speck sheet format: spec | items (hyphen-separated). Glassware is in Paper Products. */
export const FULL_BAR_PACKAGE_SPECK_ROWS: { speck: string; item: string }[] = [
  { speck: "7+6+5+2", item: "COKE - DIET COKE - SPRITE - GINGER ALE" },
  { speck: "6+6+6+2", item: "SIMPLE SYRUP - SOUR MIX - GRENADINE - LIME JUICE" },
  { speck: "4+4+3", item: "CRANBERRY - PINEAPPLE - ORANGE JUICE" },
  { speck: "5+1+1", item: "SELTZER - BITTERS - LEMON JUICE" },
  { speck: "3+1+6", item: "OLIVES - CHERRIES - ORANGES" },
  { speck: "case each +25+15", item: "TONIC - CLUB SODA - LEMONS - LIMES" },
  { speck: "—", item: "CREAM" },
];

/** Mimosa Bar Juices — same layout as Full Bar mixers (speck | items). Printed under "Juices" on Server BEO. */
export const MIMOSA_BAR_JUICES_ROWS: { speck: string; item: string }[] = [
  { speck: "12+12", item: "MANGO - PEACH" },
  { speck: "2+2+2", item: "CRANBERRY - PINEAPPLE - ORANGE JUICE" },
  { speck: "QT+QT+QT+QT", item: "PINEAPPLE - STRAWBERRY - RASPBERRY - BLUEBERRY" },
];

/** @deprecated Use MIMOSA_BAR_JUICES_ROWS */
export const MIMOSA_BAR_SPECK_ROWS = MIMOSA_BAR_JUICES_ROWS;

/** Mimosa Bar Fruit Garnish — 4 rows like Juices (speck | items). Kitchen BEO: one item per line under DESSERTS. */
export const MIMOSA_BAR_FRUIT_GARNISH_ROWS: { speck: string; item: string }[] = [
  { speck: "—", item: "STRAWBERRIES - BLUEBERRIES" },
  { speck: "—", item: "RASPBERRIES - BLACKBERRIES" },
  { speck: "—", item: "ORANGES - ORANGE SLICES" },
  { speck: "—", item: "PINEAPPLE" },
];

/** @deprecated Use MIMOSA_BAR_FRUIT_GARNISH_ROWS; kept for compatibility. */
export const MIMOSA_BAR_FRUIT_GARNISH_ROW: { speck: string; item: string } = MIMOSA_BAR_FRUIT_GARNISH_ROWS[0];

/** Fruit garnish items for Kitchen BEO — one per line under DESSERTS when Bar Service = Mimosa Bar. */
export const MIMOSA_BAR_FRUIT_GARNISH_ITEMS: string[] = [
  "Strawberries",
  "Blueberries",
  "Raspberries",
  "Blackberries",
  "Oranges",
  "Orange slices",
  "Pineapple",
];

/** Normalized (lowercase) set of bar items we supply (from full bar package + speck rows). Used to highlight "in speck" sig drink items. */
const STANDARD_BAR_ITEMS_SET = (() => {
  const out = new Set<string>();
  for (const g of FULL_BAR_PACKAGE.garnishes) out.add(g.toLowerCase().trim());
  for (const m of FULL_BAR_PACKAGE.mixers) out.add(m.toLowerCase().trim());
  for (const row of FULL_BAR_PACKAGE_SPECK_ROWS) {
    row.item.split(/\s*-\s*/).forEach((t) => { const v = t.trim().toLowerCase(); if (v) out.add(v); });
  }
  ["oj", "orange juice", "cranberry juice", "pineapple juice", "club soda", "ginger ale", "diet coke", "sprite", "coke", "soda", "tonic", "sour mix", "grenadine", "lime juice", "lemon juice", "seltzer", "bitters", "olives", "cherries", "oranges", "lemons", "limes", "cream", "simple syrup"].forEach((x) => out.add(x));
  // Singular forms so "Lime" / "Limes" both match
  ["lime", "lemon", "orange", "cherry", "olive"].forEach((x) => out.add(x));
  return out;
})();

/** Returns true if this item name is in our standard bar speck (we already supply it). */
export function isStandardBarItem(item: string): boolean {
  const n = item.trim().toLowerCase();
  if (n.length === 0) return false;
  if (STANDARD_BAR_ITEMS_SET.has(n)) return true;
  // Pluralize for lookup: "lime" -> "limes", "lemon" -> "lemons"
  if (n.endsWith("s") && STANDARD_BAR_ITEMS_SET.has(n.slice(0, -1))) return true;
  if (!n.endsWith("s") && STANDARD_BAR_ITEMS_SET.has(n + "s")) return true;
  return false;
}

/** Parse mixers or garnishes string into tokens (comma or " - " separated). */
export function parseBarItemTokens(text: string): string[] {
  return text
    .split(/[,،\-–—]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Items in the list that we do NOT regularly supply (need to source). */
export function getNonStandardBarItems(mixersAndGarnishes: string): string[] {
  return parseBarItemTokens(mixersAndGarnishes).filter((t) => !isStandardBarItem(t));
}

/** Parse stored recipe: "Alcohol: ...\n\nrest" → { alcohol, recipe }. */
export function parseSignatureDrinkRecipe(stored: string): { alcohol: string; recipe: string } {
  const s = (stored || "").trim();
  const alcoholPrefix = "Alcohol:";
  if (s.startsWith(alcoholPrefix)) {
    const firstLineEnd = s.indexOf("\n");
    const alcohol = firstLineEnd >= 0 ? s.slice(alcoholPrefix.length, firstLineEnd).trim() : s.slice(alcoholPrefix.length).trim();
    const recipe = firstLineEnd >= 0 ? s.slice(firstLineEnd).trim() : "";
    return { alcohol, recipe };
  }
  return { alcohol: "", recipe: s };
}

/** Combine alcohol + recipe for storage. */
export function combineSignatureDrinkRecipe(alcohol: string, recipe: string): string {
  const a = (alcohol || "").trim();
  const r = (recipe || "").trim();
  if (a) return `Alcohol: ${a}\n\n${r}`;
  return r;
}
