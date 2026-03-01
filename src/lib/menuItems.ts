/**
 * Menu item helpers for EventOps.
 * Normalize category and unit type from Airtable strings.
 */

export type SpecUnitType = "Full Pan" | "Half Pan" | "Round Pan" | "Quart" | "Pieces";

export type SpecCategory =
  | "Protein"
  | "Heavy Side"
  | "Veg Side"
  | "Sauce"
  | "Passed App"
  | "Presented App"
  | "Dessert";

/** Normalize category string from Airtable to SpecCategory */
export function normalizeSpecCategory(raw: string): SpecCategory {
  const m: Record<string, SpecCategory> = {
    protein: "Protein",
    "heavy side": "Heavy Side",
    "veg side": "Veg Side",
    sauce: "Sauce",
    "passed app": "Passed App",
    "presented app": "Presented App",
    dessert: "Dessert",
  };
  const key = String(raw || "").trim().toLowerCase();
  return m[key] ?? "Dessert";
}

/** Normalize unit type from Airtable */
export function normalizeSpecUnitType(raw: string): SpecUnitType {
  const m: Record<string, SpecUnitType> = {
    "full pan": "Full Pan",
    "half pan": "Half Pan",
    "round pan": "Round Pan",
    quart: "Quart",
    quarts: "Quart",
    pieces: "Pieces",
  };
  const key = String(raw || "").trim().toLowerCase();
  return m[key] ?? "Full Pan";
}
