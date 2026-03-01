/**
 * Spec Engine — Full implementation
 *
 * Master Menu Specs (Airtable) links to Menu Items.
 * Tier-based values, Nick compression, vessel logic, industry comparison.
 *
 * Functions are pure and modular where possible.
 */

import type { SpecCategory, SpecUnitType } from "./specAlgorithm";
import { normalizeSpecCategory, normalizeSpecUnitType } from "./specAlgorithm";
import { fetchSpecDataForEvent } from "./specDataFetch";
import { isErrorResult } from "../airtable/selectors";

export type { SpecOutputItem, SpecMenuItem, SpecCategory, SpecUnitType } from "./specAlgorithm";

/** Input for a single item (from Master Menu Specs + Menu Item) */
export type SpecItemInput = {
  itemName: string;
  tierBaseValue: number;
  specUnitType: SpecUnitType;
  specCategory: SpecCategory;
  industryStandard: number;
  specNotes?: string;
};

/** Nick compression factors by category. Passed App uses PPR only (no compression). */
const COMPRESSION: Record<SpecCategory, number | null> = {
  Protein: 0.9,
  "Heavy Side": 0.92,
  "Veg Side": 0.95,
  Sauce: 0.8,
  "Passed App": null,
  "Presented App": 0.95,
  Dessert: 0.95,
};

/** ALWAYS round up — Nick never under-specs */
function roundUp(value: number): number {
  return Math.ceil(value);
}

/** Safety rule: if compressed is >0.5 below raw tier value, bump by 0.5 or round up */
function applySafetyRule(compressed: number, tierDefault: number): number {
  const diff = tierDefault - compressed;
  if (diff > 0.5) return roundUp(compressed + 0.5);
  return roundUp(compressed);
}

/** Apply Nick compression + safety. ALWAYS round up. */
function applyNickCompression(tierBaseValue: number, category: SpecCategory): number {
  const factor = COMPRESSION[category];
  if (factor === null) return roundUp(tierBaseValue);
  const compressed = tierBaseValue * factor;
  return applySafetyRule(compressed, tierBaseValue);
}

/**
 * Calculate FWX spec for a single item.
 * Pure function: tier value → Nick compression → vessel logic.
 */
export function calculateSpecForItem(
  item: SpecItemInput,
  guestCount: number
): { itemName: string; fwxSpecValue: number; industryValue: number; unitType: SpecUnitType; chaferCount: number; notes: string } {
  const compressed = applyNickCompression(item.tierBaseValue, item.specCategory);

  let fwxSpecValue: number;
  let chaferCount: number;
  let notes: string;

  switch (item.specUnitType) {
    case "Full Pan":
      fwxSpecValue = roundUp(compressed);
      chaferCount = fwxSpecValue;
      notes = "1 full pan = 1 chafer";
      break;
    case "Half Pan": {
      const halfPans = roundUp(compressed);
      chaferCount = roundUp(halfPans / 2);
      fwxSpecValue = halfPans;
      notes = "2 half pans = 1 chafer";
      break;
    }
    case "Round Pan": {
      const fullPanEq = compressed * 0.75;
      fwxSpecValue = roundUp(fullPanEq);
      chaferCount = fwxSpecValue;
      notes = "Round pan = 0.75 full pan equivalent";
      break;
    }
    case "Quart":
      fwxSpecValue = roundUp(compressed);
      chaferCount = 0;
      notes = "Sauces — round up to whole quart";
      break;
    case "Pieces":
      fwxSpecValue = roundUp(item.industryStandard * guestCount);
      chaferCount = 0;
      notes = `PPR: ${item.industryStandard} pc/guest × ${guestCount} guests`;
      break;
    default:
      fwxSpecValue = roundUp(compressed);
      chaferCount = 0;
      notes = "";
  }

  const industryValue = calculateIndustrySpec(item.industryStandard, guestCount, item.specUnitType);

  const finalNotes = item.specNotes ? (notes ? `${notes} | ${item.specNotes}` : item.specNotes) : notes;

  return {
    itemName: item.itemName,
    fwxSpecValue,
    industryValue,
    unitType: item.specUnitType,
    chaferCount,
    notes: finalNotes,
  };
}

/**
 * Calculate industry comparison value.
 * industryValue = Industry_Standard × guestCount (units depend on item type).
 */
export function calculateIndustrySpec(
  industryStandard: number,
  guestCount: number,
  unitType: SpecUnitType
): number {
  return roundUp(industryStandard * guestCount);
}

/**
 * Calculate chafer count from FWX spec value and unit type.
 * Full Pan: 1 pan = 1 chafer
 * Half Pan: 2 half pans = 1 chafer (odd → round up)
 * Round Pan: 0.75 full pan equivalent
 * Quart / Pieces: 0 chafers
 */
export function calculateChaferCount(fwxSpecValue: number, unitType: SpecUnitType): number {
  switch (unitType) {
    case "Full Pan":
    case "Round Pan":
      return roundUp(fwxSpecValue);
    case "Half Pan":
      return roundUp(fwxSpecValue / 2);
    case "Quart":
    case "Pieces":
    default:
      return 0;
  }
}

/**
 * Calculate specs for an entire event.
 * Fetches Event → Menu Items → Master Menu Specs, joins, runs algorithm.
 */
export type SpecResultItem = {
  itemId: string;
  itemName: string;
  fwxSpecValue: number;
  industryValue: number;
  unitType: SpecUnitType;
  chaferCount: number;
  notes: string;
};

export async function calculateSpecsForEvent(
  eventId: string
): Promise<
  | { items: SpecResultItem[]; errors: string[] }
  | { error: true; message: string }
> {
  const data = await fetchSpecDataForEvent(eventId);
  if (isErrorResult(data)) return data;

  const { specMenuItems, guestCount, errors } = data;
  const items = specMenuItems.map((item) => {
    const result = calculateSpecForItem(
      {
        itemName: item.itemName,
        tierBaseValue: item.tierBaseValue,
        specUnitType: item.specUnitType,
        specCategory: item.specCategory,
        industryStandard: item.industryStandard,
        specNotes: item.specNotes,
      },
      guestCount
    );
    return { ...result, itemId: item.id };
  });

  return { items, errors };
}

/** Format spec for display (e.g. "2 full", "1 qt", "48 pc") */
export function formatSpecForDisplay(fwxSpecValue: number, unitType: SpecUnitType): string {
  switch (unitType) {
    case "Full Pan":
      return fwxSpecValue === 1 ? "1 full" : `${fwxSpecValue} full`;
    case "Half Pan":
      return fwxSpecValue === 1 ? "1 half" : `${fwxSpecValue} half`;
    case "Round Pan":
      return fwxSpecValue === 1 ? "1 round" : `${fwxSpecValue} round`;
    case "Quart":
      return fwxSpecValue === 1 ? "1 qt" : `${fwxSpecValue} qt`;
    case "Pieces":
      return `${fwxSpecValue} pc`;
    default:
      return String(fwxSpecValue);
  }
}

/** Format spec with full unit name for BEO output (e.g. "3 Full Pans", "2 Quarts") */
export function formatSpecWithUnit(value: number, unitType: SpecUnitType): string {
  switch (unitType) {
    case "Full Pan":
      return value === 1 ? "1 Full Pan" : `${value} Full Pans`;
    case "Half Pan":
      return value === 1 ? "1 Half Pan" : `${value} Half Pans`;
    case "Round Pan":
      return value === 1 ? "1 Round Pan" : `${value} Round Pans`;
    case "Quart":
      return value === 1 ? "1 Quart" : `${value} Quarts`;
    case "Pieces":
      return `${value} Pieces`;
    default:
      return `${value} ${unitType}`;
  }
}

/** Normalize raw strings from Airtable */
export { normalizeSpecCategory, normalizeSpecUnitType };
