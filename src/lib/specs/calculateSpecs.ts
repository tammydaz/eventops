/**
 * Spec Engine — Full implementation in src/lib/specs
 *
 * Master Menu Specs (Airtable) links to Menu Items.
 * Tier-based values, Nick compression, vessel logic, industry comparison.
 */

import type { SpecCategory, SpecUnitType } from "../menuItems";
import { normalizeSpecCategory, normalizeSpecUnitType } from "../menuItems";
import {
  fetchEvent,
  fetchMenuItem,
  fetchMasterMenuSpecsMap,
  parseSpecForGuestCount,
  type RawSpecRecord,
  type AirtableErrorResult,
} from "../airtable";
import { FIELD_IDS } from "../../services/airtable/events";
import { isErrorResult } from "../../services/airtable/selectors";

export type { SpecCategory, SpecUnitType } from "../menuItems";

export type GuestTier = "t1" | "t2" | "t3" | "t4" | "t5" | "t6";

/** Input for a single item (from Master Menu Specs + Menu Item) */
export type SpecItemInput = {
  itemName: string;
  tierBaseValue: number;
  specUnitType: SpecUnitType;
  specCategory: SpecCategory;
  industryStandard: number;
  specNotes?: string;
  /** For Passed App Pieces: divide total by this (number of passed app items) */
  passedAppItemCount?: number;
};

/** Output for a single item */
export type SpecResultItem = {
  itemId: string;
  itemName: string;
  fwxSpecValue: number;
  industryValue: number;
  unitType: SpecUnitType;
  chaferCount: number;
  panCount?: number;
  notes: string;
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

/** STEP 1 — Determine Guest Tier */
export function getTier(guestCount: number): GuestTier {
  if (guestCount <= 40) return "t1";
  if (guestCount <= 75) return "t2";
  if (guestCount <= 125) return "t3";
  if (guestCount <= 175) return "t4";
  if (guestCount <= 225) return "t5";
  return "t6";
}

/** Safety rule: if compressed is >0.5 below raw tier value, bump by 0.5 or round up */
export function applySafetyRule(compressed: number, tierDefault: number): number {
  const diff = tierDefault - compressed;
  if (diff > 0.5) return roundUp(compressed + 0.5);
  return roundUp(compressed);
}

/** Apply Nick compression + safety. ALWAYS round up. */
export function applyNickCompression(tierBaseValue: number, category: SpecCategory): number {
  const factor = COMPRESSION[category];
  if (factor === null) return roundUp(tierBaseValue);
  const compressed = tierBaseValue * factor;
  return applySafetyRule(compressed, tierBaseValue);
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
 * Calculate industry comparison value.
 * industryValue = Industry_Standard × guestCount (units depend on item type).
 * When industryStandard is 1 (seed default), treat as "1 pan per 30 guests" for pans.
 */
export function calculateIndustrySpec(
  industryStandard: number,
  guestCount: number,
  unitType: SpecUnitType
): number {
  let effective = industryStandard;
  if (industryStandard === 1 && (unitType === "Full Pan" || unitType === "Half Pan" || unitType === "Round Pan")) {
    effective = 1 / 30;
  }
  return roundUp(effective * guestCount);
}

/**
 * Calculate FWX spec for a single item.
 * Pure function: tier value → Nick compression → vessel logic.
 */
export function calculateSpecForItem(
  item: SpecItemInput,
  guestCount: number
): { itemName: string; fwxSpecValue: number; industryValue: number; unitType: SpecUnitType; chaferCount: number; panCount?: number; notes: string } {
  const compressed = applyNickCompression(item.tierBaseValue, item.specCategory);

  let fwxSpecValue: number;
  let chaferCount: number;
  let panCount: number | undefined;
  let notes: string;

  switch (item.specUnitType) {
    case "Full Pan":
      fwxSpecValue = roundUp(compressed);
      chaferCount = fwxSpecValue;
      panCount = fwxSpecValue;
      notes = "1 full pan = 1 chafer";
      break;
    case "Half Pan": {
      const halfPans = roundUp(compressed);
      chaferCount = roundUp(halfPans / 2);
      panCount = halfPans;
      fwxSpecValue = halfPans;
      notes = "2 half pans = 1 chafer";
      break;
    }
    case "Round Pan": {
      const fullPanEq = compressed * 0.75;
      fwxSpecValue = roundUp(fullPanEq);
      chaferCount = fwxSpecValue;
      panCount = fwxSpecValue;
      notes = "Round pan = 0.75 full pan equivalent";
      break;
    }
    case "Quart":
      fwxSpecValue = roundUp(compressed);
      chaferCount = 0;
      panCount = undefined;
      notes = "Sauces — round up to whole quart";
      break;
    case "Pieces": {
      const totalPieces = roundUp(item.industryStandard * guestCount);
      const count = item.passedAppItemCount ?? 1;
      fwxSpecValue = count > 1 ? roundUp(totalPieces / count) : totalPieces;
      chaferCount = 0;
      panCount = undefined;
      notes =
        count > 1
          ? `PPR: ${item.industryStandard} pc/guest × ${guestCount} ÷ ${count} items = ${fwxSpecValue} pc each`
          : `PPR: ${item.industryStandard} pc/guest × ${guestCount} guests`;
      break;
    }
    default:
      fwxSpecValue = roundUp(compressed);
      chaferCount = 0;
      panCount = undefined;
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
    panCount,
    notes: finalNotes,
  };
}

/**
 * Calculate specs for an entire event.
 * Fetches Event → Menu Items → Master Menu Specs, joins, runs algorithm.
 */
/** Airtable record IDs start with "rec" followed by 14 alphanumeric chars */
const AIRTABLE_RECORD_ID_REGEX = /^rec[A-Za-z0-9]{14}$/;

function isValidAirtableRecordId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && AIRTABLE_RECORD_ID_REGEX.test(id);
}

export async function calculateSpecsForEvent(
  eventId: string
): Promise<
  | { items: SpecResultItem[]; errors: string[] }
  | AirtableErrorResult
> {
  console.log("DEBUG: Attempting to fetch event with ID:", eventId);

  if (!isValidAirtableRecordId(eventId)) {
    const msg = `Invalid event ID "${eventId}". Airtable needs the record ID (e.g. recCZ5RWNCZE0yfcV) from the event URL, not a job/order number.`;
    console.error("AIRTABLE REJECTION:", msg);
    return { error: true, message: msg };
  }

  const eventResult = await fetchEvent(eventId);

  if (isErrorResult(eventResult)) {
    console.error("AIRTABLE REJECTION:", eventResult);
    return eventResult;
  }

  const { guestCount, menuItemIds, itemToSection } = eventResult;
  const passedAppCount =
    menuItemIds.filter((id) => itemToSection[id] === FIELD_IDS.PASSED_APPETIZERS).length || 1;
  const errors: string[] = [];

  if (menuItemIds.length === 0) {
    return { items: [], errors: ["No menu items linked to this event"] };
  }

  const [specsMapResult, ...menuItemResults] = await Promise.all([
    fetchMasterMenuSpecsMap(),
    ...menuItemIds.map((id) => fetchMenuItem(id)),
  ]);

  if (isErrorResult(specsMapResult)) return specsMapResult;
  const specsMap = specsMapResult;

  const items: SpecResultItem[] = [];

  for (let i = 0; i < menuItemIds.length; i++) {
    const menuItemId = menuItemIds[i];
    const menuResult = menuItemResults[i];

    if (isErrorResult(menuResult)) {
      errors.push(`Failed to load menu item ${menuItemId}`);
      continue;
    }

    const { id, name, category } = menuResult;
    const rawSpec = specsMap[id] as RawSpecRecord | undefined;

    if (!rawSpec) {
      errors.push(`No Master Menu Spec found for: ${name}`);
      items.push({
        itemId: id,
        itemName: name,
        fwxSpecValue: 1,
        industryValue: guestCount,
        unitType: "Full Pan",
        chaferCount: 1,
        panCount: 1,
        notes: "No spec — using defaults",
      });
      continue;
    }

    const parsed = parseSpecForGuestCount(rawSpec, guestCount);
    const specCategory = normalizeSpecCategory(parsed.specCategory || category);
    const specUnitType = normalizeSpecUnitType(parsed.specUnitType);
    const isPassedApp = itemToSection[id] === FIELD_IDS.PASSED_APPETIZERS;
    const passedAppItemCount =
      isPassedApp && specUnitType === "Pieces" && passedAppCount > 0 ? passedAppCount : undefined;

    const result = calculateSpecForItem(
      {
        itemName: name,
        tierBaseValue: parsed.tierBaseValue,
        specUnitType,
        specCategory,
        industryStandard: parsed.industryStandard,
        specNotes: parsed.specNotes || undefined,
        passedAppItemCount,
      },
      guestCount
    );

    items.push({
      ...result,
      itemId: id,
    });
  }

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
