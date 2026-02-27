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
