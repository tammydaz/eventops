/**
 * Sandwich Platter Config — Pick X from list. Aligns with foodwerx Corporate Catering Menu and BEO wording.
 * Names match legacy BEOs so printed output looks the same (e.g. "Petite Cut Gourmet Sandwiches", "foodwerx Classic Sandwiches").
 */

export type PlatterType = keyof typeof PLATTER_CHOICES;

/** Platter types with their options and max pick count */
export const PLATTER_CHOICES: Record<
  string,
  { label: string; options: string[]; maxPick: number; instruction: string }
> = {
  "foodwerx Classic Sandwiches - Topped w/ Sliced Roma Tomato & Green Leaf Lettuce": {
    label: "foodwerx Classic Sandwiches - Topped w/ Sliced Roma Tomato & Green Leaf Lettuce",
    options: [
      "Honey Ham & American Cheese",
      "Oven Roasted Turkey & Swiss",
      "Roast Beef & White Cheddar",
      "Grilled Chicken & Pepper Jack",
      "Tuna Salad",
      "White Grape Chicken Salad",
      "Genoa Salami, Capicola & Provolone",
    ],
    maxPick: 5,
    instruction: "Pick up to 5 selections per order",
  },
  "Classic Sandwiches": {
    label: "Classic Sandwiches",
    options: [
      "Honey Ham & American Cheese",
      "Oven Roasted Turkey & Swiss",
      "Roast Beef & White Cheddar",
      "Grilled Chicken & Pepper Jack",
      "Tuna Salad",
      "White Grape Chicken Salad",
      "Genoa Salami, Capicola & Provolone",
    ],
    maxPick: 5,
    instruction: "Pick up to 5 selections per order",
  },
  "Signature Specialty Platter": {
    label: "Signature Specialty Platter",
    options: [
      "Acapulco Turkey BLT",
      "Smoked Turkey (apples, walnuts, brie, cranberry)",
      "Spa Turkey",
      "Smoked Turkey & Crispy Bacon",
      "Parmesan Crusted Chicken Cutlet",
      "The Greek (chicken, olives, feta, tzatziki)",
      "Honey Stung Chicken",
      "Herb Grilled Chicken Breast",
      "Savory & Sweet Flank Steak",
      "Eye Round of Beef",
      "Grilled Flank Steak",
      "Beef, Blue & Balsamic",
      "Honey Ham & Brie",
      "Ham & Cheese Squared",
      "foodwerx Italian Hoagie",
      "Prosciutto de Parma",
      "Southwest Shrimp Salad",
      "Tuna Salad BLT",
      "Marinated Grilled Vegetables",
      "Napa Valley (kale, avocado, hummus)",
      "Sharp Caprese",
      "Crunch Chicken Wrap",
      "Grilled Vegetable Wrap",
      "Turkey Club Wrap",
      "Buffalo Chicken Wrap",
      "Caesar Wrap",
    ],
    maxPick: 5,
    instruction: "Pick up to 5 selections per order",
  },
  "Signature Wrap Platter": {
    label: "Signature Wrap Platter",
    options: [
      "Cuban Chicken & Honey Ham",
      "Porta-mato-luscious",
      "Buffalo Chicken",
      "Crunch Chicken Wrap",
      "Grilled Vegetable Wrap",
      "Turkey Club Wrap",
      "Buffalo Chicken Wrap",
      "Caesar Wrap",
      "Zesty Mediterranean",
    ],
    maxPick: 5,
    instruction: "Pick up to 5 selections per order",
  },
  "Gourmet Specialty Sandwich & Wrap Platter": {
    label: "Gourmet Specialty Sandwich & Wrap Platter",
    options: [
      "Acapulco Turkey BLT",
      "Smoked Turkey (apples, walnuts, brie, cranberry)",
      "Spa Turkey",
      "Parmesan Crusted Chicken Cutlet",
      "The Greek",
      "Honey Stung Chicken",
      "Savory & Sweet Flank Steak",
      "Beef, Blue & Balsamic",
      "Honey Ham & Brie",
      "foodwerx Italian Hoagie",
      "Prosciutto de Parma",
      "Southwest Shrimp Salad",
      "Marinated Grilled Vegetables",
      "Napa Valley",
      "Sharp Caprese",
      "Cuban Chicken & Honey Ham",
      "Porta-mato-luscious",
      "Buffalo Chicken Wrap",
      "Turkey Club Wrap",
      "Caesar Wrap",
    ],
    maxPick: 5,
    instruction: "Select your favorites from both sandwiches & wraps",
  },
  "Petite Cut Gourmet Sandwiches": {
    label: "Petite Cut Gourmet Sandwiches",
    options: [
      "Charcuterie Sandwich - Honey-Goat Cheese Spread, Fig Jam, Olive Tapenade, Arugula, Prosciutto and Salami",
      "Smoked Turkey - Thinly Sliced Green Apples, Toasted Walnuts, Brie, Green Leaf Lettuce, & Cranberry Orange Relish",
      "Savory & Sweet Flank Steak - w/ Brie, Caramelized Onion, Arugula & Fig Jam",
      "Chicken Salad - w/ Celery, Walnuts & Dried Cranberries",
      "Prosciutto de Parma - Buffalo Mozzarella w/ Roasted Peppers Roma Tomato, Arugula, Cracked Pepper Basil Leaves",
      "Acapulco Turkey BLT",
      "The Greek",
      "Honey Stung Chicken",
      "Beef, Blue & Balsamic",
      "Honey Ham & Brie",
      "Napa Valley",
      "Sharp Caprese",
      "Buffalo Chicken Wrap",
      "Turkey Club Wrap",
      "Caesar Wrap",
    ],
    maxPick: 5,
    instruction: "Pick selections — prints as on BEO with platter name + choices",
  },
  "Panini Press": {
    label: "Panini Press",
    options: [
      "Italiano (Genoa, prosciutto, capicola & provolone)",
      "Biggie Beef",
      "Turkey",
      "Cheezie Veg",
      "Honey Roasted Ham & Brie",
    ],
    maxPick: 2,
    instruction: "Pick up to 2 selections for every 10 guests",
  },
  "Philadelphia Hoagie Platter": {
    label: "Philadelphia Hoagie Platter",
    options: [
      "Italian by foodwerx",
      "Roast Beef",
      "Simple Ham & Cheese",
      "Oven Roasted Turkey",
      "Spicy (Mild) Tuna Salad",
      "Crispy Chicken Cutlet & Pecorino Romano",
      "Vegetarian",
    ],
    maxPick: 5,
    instruction: "Pick up to 5 selections",
  },
  "Combination Platter": {
    label: "Combination Platter",
    options: [
      "Gourmet Specialty Sandwiches",
      "Signature Wraps",
      "Philadelphia Hoagies",
      "Pressed Panini Triangles",
    ],
    maxPick: 4,
    instruction: "Mix of gourmet sandwiches, wraps, hoagies & panini",
  },
};

export const PLATTER_TYPES = Object.keys(PLATTER_CHOICES);

/** One sandwich type on a platter with optional quantity (per type, not platter count). */
export type PlatterPick = {
  name: string;
  qty: number;
};

export type PlatterRow = {
  id: string;
  platterType: string;
  picks: PlatterPick[];
  quantity: number;
};

const MAX_PICK_QTY = 999;

export function normalizePlatterPick(p: unknown): PlatterPick {
  if (typeof p === "string") {
    return { name: p.trim(), qty: 1 };
  }
  if (p && typeof p === "object" && "name" in p) {
    const o = p as Record<string, unknown>;
    const name = String(o.name ?? "").trim();
    const qtyRaw = Number(o.qty);
    const qty =
      Number.isFinite(qtyRaw) && qtyRaw >= 1 ? Math.min(MAX_PICK_QTY, Math.floor(qtyRaw)) : 1;
    return { name, qty };
  }
  return { name: "", qty: 1 };
}

/** Migrates legacy `picks: string[]` from localStorage to `PlatterPick[]`. */
export function normalizePlatterPicks(picks: unknown): PlatterPick[] {
  if (!Array.isArray(picks)) return [];
  return picks.map(normalizePlatterPick);
}

export function normalizePlatterRow(row: Partial<PlatterRow> & Record<string, unknown>): PlatterRow {
  return {
    id: String(row.id ?? ""),
    platterType: String(row.platterType ?? ""),
    picks: normalizePlatterPicks(row.picks),
    quantity: Math.max(0, Number(row.quantity) || 0),
  };
}

export function hasPlatterPicks(row: PlatterRow): boolean {
  return row.picks.some((p) => p.name.trim());
}

export function formatPlatterPickForDisplay(p: PlatterPick): string {
  const n = p.name.trim();
  if (!n) return "";
  return p.qty > 1 ? `${n} × ${p.qty}` : n;
}

export function formatPlatterPicksLine(picks: PlatterPick[]): string {
  return picks.filter((p) => p.name.trim()).map(formatPlatterPickForDisplay).join(", ");
}
