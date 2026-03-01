/**
 * Airtable Menu Items table — Spec Engine field IDs
 * Update these when you have the actual field IDs from your base.
 *
 * Table: Menu Items (tbl0a33DGG6R1sPZ)
 */
import type { GuestTier } from "./specAlgorithm";

/** Maps guest tier to Airtable column name for base spec value */
export const TIER_TO_AIRTABLE_COLUMN: Record<GuestTier, string> = {
  t1: "Spec_Tier_0_40",
  t2: "Spec_Tier_41_75",
  t3: "Spec_Tier_76_125",
  t4: "Spec_Tier_126_175",
  t5: "Spec_Tier_176_225",
  t6: "Spec_Tier_225_plus",
};

/** Placeholder field IDs — replace with actual IDs from your Airtable base */
export const MENU_SPEC_FIELD_IDS = {
  SPEC_TIER_0_40: "Spec_Tier_0_40", // TODO: add fldXXX when available
  SPEC_TIER_41_75: "Spec_Tier_41_75",
  SPEC_TIER_76_125: "Spec_Tier_76_125",
  SPEC_TIER_126_175: "Spec_Tier_126_175",
  SPEC_TIER_176_225: "Spec_Tier_176_225",
  SPEC_TIER_225_PLUS: "Spec_Tier_225_plus",
  SPEC_UNIT_TYPE: "Spec_Unit_Type", // Full Pan | Half Pan | Round Pan | Quart | Pieces
  SPEC_CATEGORY: "Spec_Category", // Protein | Heavy Side | Veg Side | Sauce | Passed App | Presented App | Dessert
  INDUSTRY_STANDARD: "Industry_Standard",
} as const;
