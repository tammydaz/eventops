/**
 * Airtable fetch functions for EventOps.
 * Wraps services/airtable for Events, Menu Items, Master Menu Specs.
 */

import { airtableFetch, getEventsTable, getMasterMenuSpecsTable, getMenuItemsTable } from "../services/airtable/client";
import type { AirtableListResponse, AirtableRecord, AirtableErrorResult } from "../services/airtable/client";
import { isErrorResult, asString, asLinkedRecordIds, asNumber } from "../services/airtable/selectors";
import { FIELD_IDS } from "../services/airtable/events";

export type { AirtableErrorResult };

const getMenuItemsTableId = () => getMenuItemsTable();
const getMasterMenuSpecsTableId = () => getMasterMenuSpecsTable();

/** Menu Items field name patterns (no hardcoded IDs — base may differ) */
const MENU_ITEM_NAME_PATTERNS = [/^name$/i, /item\s*name/i, /menu\s*item\s*name/i];
const MENU_ITEM_CHILD_PATTERNS = [/child\s*items?/i, /sub[- ]?items?/i];
const MENU_ITEM_CATEGORY_PATTERNS = [/category/i];
const MENU_ITEM_SERVICE_TYPE_PATTERNS = [/service\s*type/i];

const TIER_COLUMNS = [
  "Spec_Tier_0_40",
  "Spec_Tier_41_75",
  "Spec_Tier_76_125",
  "Spec_Tier_126_175",
  "Spec_Tier_176_225",
  "Spec_Tier_225_plus",
] as const;

/** Field name patterns for Master Menu Specs (match flexibly — no hardcoded field IDs) */
const MENU_ITEM_FIELD_PATTERNS = [/menu\s*items?/i, /menu_item/i, /linked\s*.*menu/i, /^item$/i];
const TIER_FIELD_PATTERNS: Record<string, RegExp[]> = {
  Spec_Tier_0_40: [/spec\s*tier\s*0[-_]?40/i, /spec_tier_0_40/i],
  Spec_Tier_41_75: [/spec\s*tier\s*41[-_]?75/i, /spec_tier_41_75/i],
  Spec_Tier_76_125: [/spec\s*tier\s*76[-_]?125/i, /spec_tier_76_125/i],
  Spec_Tier_126_175: [/spec\s*tier\s*126[-_]?175/i, /spec_tier_126_175/i],
  Spec_Tier_176_225: [/spec\s*tier\s*176[-_]?225/i, /spec_tier_176_225/i],
  Spec_Tier_225_plus: [/spec\s*tier\s*225[-_]?plus|225\+/i, /spec_tier_225_plus/i],
};
const SPEC_UNIT_TYPE_PATTERNS = [/spec\s*unit\s*type/i, /spec_unit_type/i];
const SPEC_CATEGORY_PATTERNS = [/spec\s*category/i, /spec_category/i];
const INDUSTRY_STANDARD_PATTERNS = [/industry\s*standard/i, /industry_standard/i];
const SPEC_NOTES_PATTERNS = [/spec\s*notes/i, /spec_notes/i];

function findFieldByPatterns(fields: Record<string, unknown>, patterns: RegExp[]): string | null {
  for (const name of Object.keys(fields)) {
    if (patterns.some((p) => p.test(name))) return name;
  }
  return null;
}

function findMenuItemLinkFieldFallback(fields: Record<string, unknown>): string | null {
  const recIdPattern = /^rec[A-Za-z0-9]{14}$/;
  let fallback: string | null = null;
  for (const [name, val] of Object.entries(fields)) {
    if (!Array.isArray(val) || val.length === 0) continue;
    const ids = asLinkedRecordIds(val);
    if (ids.length === 0) continue;
    if (!recIdPattern.test(ids[0])) continue;
    if (/item|menu|link/i.test(name) || name.length <= 20) return name;
    if (!fallback) fallback = name;
  }
  return fallback;
}

function buildSpecFieldMap(fields: Record<string, unknown>): Record<string, string> {
  const map: Record<string, string> = {};
  const menuItem = findFieldByPatterns(fields, MENU_ITEM_FIELD_PATTERNS) ?? findMenuItemLinkFieldFallback(fields);
  if (menuItem) map.Menu_Item = menuItem;
  for (const [key, patterns] of Object.entries(TIER_FIELD_PATTERNS)) {
    const found = findFieldByPatterns(fields, patterns);
    if (found) map[key] = found;
  }
  const unitType = findFieldByPatterns(fields, SPEC_UNIT_TYPE_PATTERNS);
  if (unitType) map.Spec_Unit_Type = unitType;
  const category = findFieldByPatterns(fields, SPEC_CATEGORY_PATTERNS);
  if (category) map.Spec_Category = category;
  const industry = findFieldByPatterns(fields, INDUSTRY_STANDARD_PATTERNS);
  if (industry) map.Industry_Standard = industry;
  const notes = findFieldByPatterns(fields, SPEC_NOTES_PATTERNS);
  if (notes) map.Spec_Notes = notes;
  return map;
}

const MENU_SECTION_FIELDS = [
  FIELD_IDS.PASSED_APPETIZERS,
  FIELD_IDS.PRESENTED_APPETIZERS,
  FIELD_IDS.BUFFET_METAL,
  FIELD_IDS.BUFFET_CHINA,
  FIELD_IDS.DESSERTS,
  FIELD_IDS.STATIONS,
  // ROOM_TEMP_DISPLAY omitted — may not exist in all bases (causes 422 if missing)
] as const;

/** Fetch event by ID, return guestCount, menu item IDs, and section info (for passed-app division).
 * Uses full record fetch (no field filter) to avoid 422 from invalid/missing field IDs. */
export async function fetchEvent(eventId: string): Promise<
  | { guestCount: number; menuItemIds: string[]; itemToSection: Record<string, string> }
  | AirtableErrorResult
> {
  const table = getEventsTable();
  if (typeof table !== "string") return table;
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");
  params.set("cellFormat", "json");

  const rec = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${eventId}?${params.toString()}`
  );
  if (isErrorResult(rec)) return rec;
  const f = rec.fields ?? {};
  const guestCount = asNumber(f[FIELD_IDS.GUEST_COUNT]) ?? 0;
  const itemToSection: Record<string, string> = {};
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const fieldId of MENU_SECTION_FIELDS) {
    const val = f[fieldId];
    if (val === undefined) continue;
    for (const id of asLinkedRecordIds(val)) {
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
        itemToSection[id] = fieldId;
      }
    }
  }
  if (ids.length === 0) {
    for (const id of asLinkedRecordIds(f[FIELD_IDS.MENU_ITEMS])) {
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }
  return { guestCount, menuItemIds: ids, itemToSection };
}

/** Fetch Menu Item by ID. Full record (no fields[]) — avoids 422 from invalid field IDs. */
export async function fetchMenuItem(menuItemId: string): Promise<
  | { id: string; name: string; childIds: string[]; category: string; serviceType: string }
  | AirtableErrorResult
> {
  const params = new URLSearchParams();
  params.set("cellFormat", "json");
  const rec = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${getMenuItemsTableId()}/${menuItemId}?${params.toString()}`
  );
  if (isErrorResult(rec)) return rec;
  const f = rec.fields;
  const nameField = findFieldByPatterns(f, MENU_ITEM_NAME_PATTERNS);
  const childField = findFieldByPatterns(f, MENU_ITEM_CHILD_PATTERNS);
  const categoryField = findFieldByPatterns(f, MENU_ITEM_CATEGORY_PATTERNS);
  const serviceTypeField = findFieldByPatterns(f, MENU_ITEM_SERVICE_TYPE_PATTERNS);
  const nameRaw = nameField ? f[nameField] : undefined;
  const name = typeof nameRaw === "string" ? nameRaw : (nameRaw && typeof nameRaw === "object" && "name" in nameRaw ? String((nameRaw as { name?: string }).name) : "") || "Unnamed";
  return {
    id: menuItemId,
    name,
    childIds: childField ? asLinkedRecordIds(f[childField]) : [],
    category: categoryField ? asString(f[categoryField]) : "",
    serviceType: serviceTypeField ? asString(f[serviceTypeField]) : "",
  };
}

/** Fetch Master Menu Spec by record ID. Full record (no fields[]) — avoids invalid field ID errors. */
export async function fetchMasterMenuSpecById(
  specRecordId: string,
  guestCount: number
): Promise<
  | { tierBaseValue: number; specUnitType: string; specCategory: string; industryStandard: number; specNotes: string }
  | AirtableErrorResult
> {
  const params = new URLSearchParams();
  params.set("cellFormat", "json");
  const rec = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${getMasterMenuSpecsTableId()}/${specRecordId}?${params.toString()}`
  );
  if (isErrorResult(rec)) return rec;
  const fieldMap = buildSpecFieldMap(rec.fields);
  return parseSpecRecord(rec.fields, guestCount, fieldMap);
}

/** Raw spec record - used to resolve tier value when guestCount is known */
export type RawSpecRecord = Record<string, unknown>;

let cachedSpecFieldMap: Record<string, string> | null = null;

/** Fetch all Master Menu Specs and build map: menuItemId -> raw spec fields. Full record (no fields[]) — avoids invalid field ID errors. */
export async function fetchMasterMenuSpecsMap(): Promise<
  | Record<string, RawSpecRecord>
  | AirtableErrorResult
> {
  const params = new URLSearchParams();
  params.set("maxRecords", "500");
  params.set("cellFormat", "json");

  const tableId = getMasterMenuSpecsTableId();
  const listData = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${tableId}?${params.toString()}`
  );
  if (isErrorResult(listData)) return listData;

  const map: Record<string, RawSpecRecord> = {};
  const recordCount = listData.records?.length ?? 0;
  const fieldNames = recordCount > 0 ? Object.keys(listData.records[0].fields ?? {}) : [];

  for (const rec of listData.records) {
    const fieldMap = buildSpecFieldMap(rec.fields);
    if (!cachedSpecFieldMap) cachedSpecFieldMap = fieldMap;
    const menuItemField = fieldMap.Menu_Item;
    const linkedIds = menuItemField ? asLinkedRecordIds(rec.fields[menuItemField]) : [];
    for (const mid of linkedIds) {
      if (!map[mid]) map[mid] = rec.fields;
    }
  }

  if (recordCount > 0 && Object.keys(map).length === 0) {
    console.warn("[Specs] Master Menu Specs: found", recordCount, "records but 0 menu item links. Field names:", fieldNames.slice(0, 15), "Menu_Item field:", cachedSpecFieldMap?.Menu_Item ?? "not found");
  }
  return map;
}

/** Parse raw spec fields for a given guest count. Call after fetchMasterMenuSpecsMap or fetchMasterMenuSpecById. */
export function parseSpecForGuestCount(
  fields: RawSpecRecord,
  guestCount: number
): { tierBaseValue: number; specUnitType: string; specCategory: string; industryStandard: number; specNotes: string } {
  const fieldMap = cachedSpecFieldMap ?? buildSpecFieldMap(fields);
  if (Object.keys(fieldMap).length === 0) {
    return { tierBaseValue: 1, specUnitType: "Full Pan", specCategory: "Dessert", industryStandard: 1, specNotes: "" };
  }
  return parseSpecRecord(fields, guestCount, fieldMap);
}

function getTierForGuestCount(guestCount: number): number {
  if (guestCount <= 40) return 1;
  if (guestCount <= 75) return 2;
  if (guestCount <= 125) return 3;
  if (guestCount <= 175) return 4;
  if (guestCount <= 225) return 5;
  return 6;
}

function parseSpecRecord(
  fields: Record<string, unknown>,
  guestCount: number,
  fieldMap: Record<string, string>
): { tierBaseValue: number; specUnitType: string; specCategory: string; industryStandard: number; specNotes: string } {
  const tier = getTierForGuestCount(guestCount);
  const tierCol = TIER_COLUMNS[tier - 1];
  const tierFieldName = fieldMap[tierCol];
  const tierBaseValue = Math.max(0, asNumber(tierFieldName ? fields[tierFieldName] : undefined) ?? 0);
  const specUnitType = asString(fieldMap.Spec_Unit_Type ? fields[fieldMap.Spec_Unit_Type] : undefined) || "Full Pan";
  const specCategory = asString(fieldMap.Spec_Category ? fields[fieldMap.Spec_Category] : undefined) || "Dessert";
  const industryStandard = asNumber(fieldMap.Industry_Standard ? fields[fieldMap.Industry_Standard] : undefined) ?? 1;
  const specNotes = asString(fieldMap.Spec_Notes ? fields[fieldMap.Spec_Notes] : undefined) || "";
  return { tierBaseValue, specUnitType, specCategory, industryStandard, specNotes };
}
