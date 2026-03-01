/**
 * Spec Engine Algorithm — Section 1
 * Nick-Adjusted Conservative Logic for FoodWerx event specs.
 *
 * STEP 1: Determine Guest Tier (t1–t6)
 * STEP 2: Pull base tier value from Airtable (Spec_Tier_0_40, etc.)
 * STEP 3: Apply Nick compression factors + safety padding
 * STEP 4: Vessel logic (Full Pan, Half Pan, Round Pan, Quart, Pieces)
 * STEP 5: Industry comparison
 * STEP 6: Output object
 */

export type GuestTier = "t1" | "t2" | "t3" | "t4" | "t5" | "t6";

export type SpecUnitType = "Full Pan" | "Half Pan" | "Round Pan" | "Quart" | "Pieces";

export type SpecCategory =
  | "Protein"
  | "Heavy Side"
  | "Veg Side"
  | "Sauce"
  | "Passed App"
  | "Presented App"
  | "Dessert";

/** Menu item with Airtable spec fields */
export type SpecMenuItem = {
  id: string;
  itemName: string;
  /** Base value from tier column (Spec_Tier_0_40, Spec_Tier_41_75, etc.) */
  tierBaseValue: number;
  specUnitType: SpecUnitType;
  specCategory: SpecCategory;
  /** Industry standard (oz/guest, pieces/guest, qt/guest, etc.) */
  industryStandard: number;
  /** Optional Spec_Notes from Master Menu Specs */
  specNotes?: string;
};

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

export type SpecOutputItem = {
  itemName: string;
  fwxSpecValue: number;
  industryValue: number;
  unitType: SpecUnitType;
  chaferCount: number;
  notes: string;
};

const TIER_KEYS: Record<GuestTier, string> = {
  t1: "Spec_Tier_0_40",
  t2: "Spec_Tier_41_75",
  t3: "Spec_Tier_76_125",
  t4: "Spec_Tier_126_175",
  t5: "Spec_Tier_176_225",
  t6: "Spec_Tier_225_plus",
};

/** Compression factors by category — Nick never under-specs */
const COMPRESSION: Record<SpecCategory, number | null> = {
  Protein: 0.9,
  "Heavy Side": 0.92,
  "Veg Side": 0.95,
  Sauce: 0.8,
  "Passed App": null, // no compression — PPR logic only
  "Presented App": 0.95,
  Dessert: 0.95,
};

/** STEP 1 — Determine Guest Tier */
export function getTier(guestCount: number): GuestTier {
  if (guestCount <= 40) return "t1";
  if (guestCount <= 75) return "t2";
  if (guestCount <= 125) return "t3";
  if (guestCount <= 175) return "t4";
  if (guestCount <= 225) return "t5";
  return "t6";
}

/** Always round up — Nick never under-specs */
function roundUp(value: number): number {
  return Math.ceil(value);
}

/** Safety padding: if compression drops below tier default by >0.5, bump by 0.5 or round up one whole unit */
function applySafetyPadding(compressed: number, tierDefault: number): number {
  const diff = tierDefault - compressed;
  if (diff > 0.5) {
    return roundUp(compressed + 0.5);
  }
  return roundUp(compressed);
}

/** STEP 3 — Apply Nick compression + safety padding */
function applyNickCompression(
  tierBaseValue: number,
  category: SpecCategory
): number {
  const factor = COMPRESSION[category];
  if (factor === null) {
    return roundUp(tierBaseValue);
  }
  const compressed = tierBaseValue * factor;
  return applySafetyPadding(compressed, tierBaseValue);
}

/** STEP 4 — Vessel logic: chafer count and final value by unit type */
function applyVesselLogic(
  value: number,
  unitType: SpecUnitType,
  guestCount: number,
  industryStandard: number,
  category: SpecCategory
): { fwxSpecValue: number; chaferCount: number; notes: string } {
  switch (unitType) {
    case "Full Pan":
      return {
        fwxSpecValue: roundUp(value),
        chaferCount: roundUp(value),
        notes: "1 full pan = 1 chafer",
      };

    case "Half Pan": {
      const halfPans = roundUp(value);
      const chafers = roundUp(halfPans / 2);
      return {
        fwxSpecValue: halfPans,
        chaferCount: chafers,
        notes: "2 half pans = 1 chafer",
      };
    }

    case "Round Pan": {
      const fullPanEquivalent = value * 0.75;
      const pans = roundUp(fullPanEquivalent);
      return {
        fwxSpecValue: pans,
        chaferCount: pans,
        notes: "Round pan = 0.75 full pan equivalent",
      };
    }

    case "Quart":
      return {
        fwxSpecValue: roundUp(value),
        chaferCount: 0,
        notes: "Sauces — no chafer, round up to whole quart",
      };

    case "Pieces": {
      // Passed apps: Industry_Standard × guestCount, PPR rule
      const pieces = roundUp(industryStandard * guestCount);
      return {
        fwxSpecValue: pieces,
        chaferCount: 0,
        notes: `Passed apps: ${industryStandard} pieces/guest × ${guestCount} guests`,
      };
    }

    default:
      return {
        fwxSpecValue: roundUp(value),
        chaferCount: 0,
        notes: "",
      };
  }
}

/** STEP 5 — Industry comparison: Industry_Standard × guestCount (interpreted by unit) */
function computeIndustryValue(
  industryStandard: number,
  guestCount: number,
  unitType: SpecUnitType
): number {
  if (unitType === "Pieces") {
    return roundUp(industryStandard * guestCount);
  }
  return roundUp(industryStandard * guestCount);
}

/** Process a single menu item through the full algorithm */
export function processSpecItem(
  item: SpecMenuItem,
  guestCount: number
): SpecOutputItem {
  const tier = getTier(guestCount);

  // STEP 2: tierBaseValue is already pulled from Airtable (caller provides it)
  const tierBaseValue = item.tierBaseValue;

  // STEP 3: Nick compression
  const compressedValue = applyNickCompression(tierBaseValue, item.specCategory);

  // STEP 4: Vessel logic
  const { fwxSpecValue, chaferCount, notes } = applyVesselLogic(
    compressedValue,
    item.specUnitType,
    guestCount,
    item.industryStandard,
    item.specCategory
  );

  // STEP 5: Industry value
  const industryValue = computeIndustryValue(
    item.industryStandard,
    guestCount,
    item.specUnitType
  );

  return {
    itemName: item.itemName,
    fwxSpecValue,
    industryValue,
    unitType: item.specUnitType,
    chaferCount,
    notes,
  };
}

/** Run the full spec engine on a list of menu items */
export function runSpecEngine(
  menuItems: SpecMenuItem[],
  guestCount: number
): SpecOutputItem[] {
  return menuItems.map((item) => processSpecItem(item, guestCount));
}
