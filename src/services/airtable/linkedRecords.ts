import { airtableFetch, getBaseId, getApiKey, getStationsTable, getMenuItemsTable, airtableMetaFetch, type AirtableListResponse, type AirtableErrorResult } from "./client";
import { cleanDisplayName } from "../../utils/displayName";
import { isErrorResult, asString, asSingleSelectName, asLinkedRecordIds } from "./selectors";
import { STATION_ITEMS_FIELD_ID, STATION_EVENT_FIELD_ID, STATION_TYPE_FIELD_ID, STATION_NOTES_FIELD_ID } from "../../constants/stations";
import { getStationItemIds, hasStationMapping, itemMatchesStation } from "../../constants/stationItemMapping";

type StationsFieldIds = {
  stationType: string;
  stationItems: string;
  event: string;
  eventFieldName: string;
  stationNotes: string;
  stationTypeFieldName: string;
  stationPreset?: string;
  stationComponents?: string;
  customComponents?: string;
  customItems?: string;
  beoPlacement?: string;
};

let cachedStationsFieldIds: StationsFieldIds | null | undefined = undefined;

async function getStationsFieldIds(): Promise<StationsFieldIds | null> {
  if (cachedStationsFieldIds) return cachedStationsFieldIds;
  const tableId = getStationsTable();
  const data = await airtableMetaFetch<{ tables: Array<{ id: string; name: string; fields: Array<{ id: string; name: string; type: string }> }> }>("");
  if (isErrorResult(data)) {
    cachedStationsFieldIds = null;
    return null;
  }
  const table = data.tables.find((t) => t.id === tableId || t.name === tableId);
  if (!table) {
    cachedStationsFieldIds = null;
    return null;
  }
  const byName = (name: string) => table.fields.find((f) => f.name === name)?.id ?? "";
  const eventField = table.fields.find((f) => f.id === STATION_EVENT_FIELD_ID || f.name === "Event");
  const stationTypeId = byName("Station Type") || STATION_TYPE_FIELD_ID;
  const stationTypeField = table.fields.find((f) => f.id === stationTypeId || f.name === "Station Type");
  cachedStationsFieldIds = {
    stationType: stationTypeId,
    stationItems: byName("Station Items") || STATION_ITEMS_FIELD_ID,
    event: byName("Event") || STATION_EVENT_FIELD_ID,
    eventFieldName: eventField?.name ?? "Event",
    stationNotes: byName("Station Notes") || STATION_NOTES_FIELD_ID,
    stationTypeFieldName: stationTypeField?.name ?? "Station Type",
    stationPreset: byName("Station Preset") || byName("Station Presets") || undefined,
    stationComponents: byName("Station Components") || undefined,
    customComponents: byName("Custom Components") || undefined,
    customItems: byName("Custom Items") || byName("Additional Components") || undefined,
    beoPlacement: byName("BEO Placement") || byName("Placement") || byName("BEO Section") || undefined,
  };
  return cachedStationsFieldIds;
}

/** Fetch Station Type single-select options from Stations table (cached). */
export async function getStationTypeOptions(): Promise<string[]> {
  const fieldIds = await getStationsFieldIds();
  if (!fieldIds?.stationType) return [];
  const data = await airtableMetaFetch<{ tables: Array<{ id: string; name: string; fields: Array<{ id: string; name: string; type: string; options?: { choices?: Array<{ id: string; name: string }> } }> }> }>("");
  if (isErrorResult(data)) return [];
  const table = data.tables.find((t) => t.id === getStationsTable() || t.name === getStationsTable());
  const field = table?.fields.find((f) => f.id === fieldIds.stationType);
  if (field?.type === "singleSelect" && field.options?.choices?.length) {
    return field.options.choices.map((c) => c.name);
  }
  return [];
}

export type LinkedRecordItem = {
  id: string;
  name: string;
  category?: string | null;
  /** Child item names for picker label (e.g. "Marinara Sauce" for Mac & Cheese Melts) */
  childItems?: string[];
};

const MENU_ITEMS_TABLE_ID_DEFAULT = "tbl0aN33DGG6R1sPZ";
const MENU_ITEMS_FORMATTED_NAME_FIELD_ID = "fldQ83gpgOmMxNMQw"; // Description Name/Formula
const MENU_ITEMS_CHILD_ITEMS_FIELD_ID = "fldIu6qmlUwAEn2W9"; // Child Items (linked)
const MENU_ITEMS_ITEM_NAME_FIELD_ID = "fldW5gfSlHRTl01v1"; // Item Name (for child records)
const MENU_ITEMS_SERVICE_TYPE_FIELD_ID = "fld2EhDP5GRalZJzQ"; // Service Type - verify in Airtable
const MENU_ITEMS_CATEGORY_FIELD_ID = "fldM7lWvjH8S0YNSX"; // Category (alternate) - verify in Airtable
const MENU_ITEMS_DIETARY_TAGS_FIELD_ID = "fldUSr1QgzP4nv9vs"; // Allergen Icons / dietary tags - verify in Airtable
/** Vessel Type: "Metal – Hot", "Full Pan (Hot)", "China – Cold / Display", "China – Room Temp" — used for buffet Metal vs China */
const MENU_ITEMS_VESSEL_TYPE_FIELD_ID = "fldZCnfKzWijIDaeV";
/** Section: "Passed Apps", "Presented Apps", "Buffet", "Desserts", "Beverages", etc. */
const MENU_ITEMS_SECTION_FIELD_ID = "fldwl2KIn0xOW1TR3";
/** Menu Items.Station Type — links item to station type (e.g. "Pasta Station"). Per constants/stations.ts */
const MENU_ITEMS_STATION_TYPE_FIELD_ID = "fldBSOxpjxcVnIYhK";
/** Menu Items.Parent Item — linked record to parent. Parent items have this empty. */
const MENU_ITEMS_PARENT_FIELD_ID = "fldBzB941q8TDeqm3";

const MENU_ITEM_SPECS_TABLE_ID = "tblGeCmzJscnocs1T";
const MENU_ITEM_SPECS_NAME_FIELD_ID = "fldjrrdBySGDHLLLl";

const STAFF_TABLE_ID = "tblOkDtiCmyfiBGxa";
const STAFF_NAME_FIELD_ID = "fld6Po25JeLAYET2m";

const RENTALS_TABLE_ID = "tblD34B6aycmrJC3B";
const RENTALS_NAME_FIELD_ID = "fldcXvJ0FVivns03f";
const RENTAL_ITEMS_TABLE_ID = "tbljC4fD9RyTVQ216";
const RENTAL_ITEMS_NAME_FIELD_ID = "fldSFK1dJfw1UcMga";
const SERVICE_WARE_TABLE_ID = "tblQ6zrEDOGXKFso9";
const SERVICE_WARE_NAME_FIELD_ID = "fldkcqOQFYwcna659";

const listLinkedTableItems = async (
  tableId: string,
  nameFieldId: string
): Promise<LinkedRecordItem[] | AirtableErrorResult> => {
  const params = new URLSearchParams();
  params.set("maxRecords", "500");
  params.set("cellFormat", "json");
  params.set("returnFieldsByFieldId", "true");
  params.append("fields[]", nameFieldId);

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${tableId}?${params.toString()}`
  );

  if (isErrorResult(data)) {
    return data;
  }

  return data.records.map((record) => ({
    id: record.id,
    name: asString(record.fields[nameFieldId]),
  }));
};

export const loadMenuItems = async (): Promise<LinkedRecordItem[] | AirtableErrorResult> => {
  const allRecords: LinkedRecordItem[] = [];
  let offset: string | undefined = undefined;

  const rawRecords: Array<{ id: string; fields: Record<string, unknown> }> = [];
  try {
    do {
      const params = new URLSearchParams();
      params.set("pageSize", "100");
      params.set("returnFieldsByFieldId", "true");
      params.append("fields[]", MENU_ITEMS_ITEM_NAME_FIELD_ID);
      params.append("fields[]", MENU_ITEMS_CATEGORY_FIELD_ID);
      params.append("fields[]", MENU_ITEMS_CHILD_ITEMS_FIELD_ID);
      if (offset) params.set("offset", offset);

      const tableId = getMenuItemsTable() || MENU_ITEMS_TABLE_ID_DEFAULT;
      const data = await airtableFetch<{
        records?: Array<{ id: string; fields: Record<string, unknown> }>;
        offset?: string;
        error?: { type: string; message: string };
      }>(`/${tableId}?${params.toString()}`);

      if (isErrorResult(data)) return data;
      if (data.error) {
        return { error: true, message: data.error.message ?? "Airtable API error" };
      }

      if (data.records) rawRecords.push(...data.records);
      offset = data.offset;
    } while (offset);

    const idToName: Record<string, string> = {};
    for (const rec of rawRecords) {
      const nameRaw = rec.fields[MENU_ITEMS_ITEM_NAME_FIELD_ID];
      const name = typeof nameRaw === "string" ? nameRaw : nameRaw && typeof nameRaw === "object" && "name" in nameRaw ? String((nameRaw as { name: string }).name) : "";
      idToName[rec.id] = cleanDisplayName(name || "") || rec.id;
    }

    for (const rec of rawRecords) {
      const nameRaw = rec.fields[MENU_ITEMS_ITEM_NAME_FIELD_ID];
      const name = typeof nameRaw === "string" ? nameRaw : nameRaw && typeof nameRaw === "object" && "name" in nameRaw ? String((nameRaw as { name: string }).name) : "";
      const categoryRaw = rec.fields[MENU_ITEMS_CATEGORY_FIELD_ID];
      let category: string | undefined;
      if (Array.isArray(categoryRaw)) {
        category = categoryRaw[0] ?? undefined;
      } else if (typeof categoryRaw === "string") {
        category = categoryRaw;
      } else if (categoryRaw && typeof categoryRaw === "object" && "name" in categoryRaw) {
        category = String((categoryRaw as { name: string }).name);
      } else {
        category = undefined;
      }
      const childIds = asLinkedRecordIds(rec.fields[MENU_ITEMS_CHILD_ITEMS_FIELD_ID]);
      const childItems = childIds.map((id) => idToName[id]).filter(Boolean);
      allRecords.push({
        id: rec.id,
        name: cleanDisplayName(name || ""),
        category,
        childItems: childItems.length ? childItems : undefined,
      } as LinkedRecordItem);
    }

    return allRecords;
  } catch (error) {
    console.error("❌ Failed to load menu items:", error);
    return { error: true, message: error instanceof Error ? error.message : "Unknown error" };
  }
};

/** Load menu items for a station by ID. Fetches station to get type, then loads items for that type. */
export const loadMenuItemsByStationId = async (
  stationId: string
): Promise<LinkedRecordItem[] | AirtableErrorResult> => {
  const stations = await loadStationsByRecordIds([stationId]);
  if (isErrorResult(stations) || stations.length === 0) return [];
  return loadMenuItemsByStationType(stations[0].stationType);
};

/** True if item has no Parent Item link (i.e. is a top-level/parent item). */
function isParentItem(fields: Record<string, unknown>, parentFieldId: string): boolean {
  const val = fields[parentFieldId];
  if (val == null || val === "") return true;
  if (Array.isArray(val)) return val.length === 0;
  return false;
}

/** Filter to parent items only (exclude children). */
function filterToParentItems<T extends { id: string }>(
  records: Array<{ id: string; fields: Record<string, unknown> }>,
  parentFieldId: string,
  mapFn: (rec: { id: string; fields: Record<string, unknown> }) => T
): T[] {
  return records
    .filter((rec) => isParentItem(rec.fields, parentFieldId))
    .map(mapFn);
}

/** Fetch menu items by record IDs (OR formula). Returns parent items only. */
async function loadMenuItemsByIds(
  ids: string[]
): Promise<LinkedRecordItem[] | AirtableErrorResult> {
  if (ids.length === 0) return [];
  const tableId = getMenuItemsTable() || MENU_ITEMS_TABLE_ID_DEFAULT;
  const uniqueIds = [...new Set(ids)].filter((id) => id?.startsWith("rec"));
  if (uniqueIds.length === 0) return [];

  const formula = `OR(${uniqueIds.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
  const params = new URLSearchParams();
  params.set("pageSize", "100");
  params.set("returnFieldsByFieldId", "true");
  params.set("filterByFormula", formula);
  params.append("fields[]", MENU_ITEMS_FORMATTED_NAME_FIELD_ID);
  params.append("fields[]", MENU_ITEMS_CATEGORY_FIELD_ID);
  params.append("fields[]", MENU_ITEMS_PARENT_FIELD_ID);
  params.append("fields[]", MENU_ITEMS_CHILD_ITEMS_FIELD_ID);
  params.append("fields[]", MENU_ITEMS_ITEM_NAME_FIELD_ID);

  const data = await airtableFetch<{
    records?: Array<{ id: string; fields: Record<string, unknown> }>;
    error?: { message?: string };
  }>(`/${tableId}?${params.toString()}`);
  if (isErrorResult(data)) return data;
  if (data.error) return { error: true, message: data.error.message ?? "Airtable API error" };

  const allRecs = data.records ?? [];
  const idToName: Record<string, string> = {};
  for (const rec of allRecs) {
    const nameRaw = rec.fields[MENU_ITEMS_FORMATTED_NAME_FIELD_ID] ?? rec.fields[MENU_ITEMS_ITEM_NAME_FIELD_ID];
    const name = typeof nameRaw === "string" ? nameRaw : nameRaw && typeof nameRaw === "object" && "name" in nameRaw ? String((nameRaw as { name: string }).name) : "";
    idToName[rec.id] = cleanDisplayName(name || "") || rec.id;
  }

  const mapItem = (rec: { id: string; fields: Record<string, unknown> }) => {
    const nameRaw = rec.fields[MENU_ITEMS_FORMATTED_NAME_FIELD_ID];
    const name = typeof nameRaw === "string" ? nameRaw : nameRaw && typeof nameRaw === "object" && "name" in nameRaw ? String((nameRaw as { name: string }).name) : "";
    const categoryRaw = rec.fields[MENU_ITEMS_CATEGORY_FIELD_ID];
    const category = Array.isArray(categoryRaw) ? categoryRaw[0] : typeof categoryRaw === "string" ? categoryRaw : undefined;
    const childIds = asLinkedRecordIds(rec.fields[MENU_ITEMS_CHILD_ITEMS_FIELD_ID]);
    const childItems = childIds.map((id) => idToName[id]).filter(Boolean);
    return { id: rec.id, name: cleanDisplayName(name || "") || rec.id, category, childItems: childItems.length ? childItems : undefined } as LinkedRecordItem;
  };
  return filterToParentItems(allRecs, MENU_ITEMS_PARENT_FIELD_ID, mapItem);
}

/**
 * Fetch menu items for a station type.
 * 1. If we have a code mapping for this station: filter all menu items by name (bypasses Airtable)
 * 2. Else: Query Stations / Menu Items.Station Type from Airtable
 * 3. Fallback: Return all parent menu items
 */
export const loadMenuItemsByStationType = async (
  stationType: string
): Promise<LinkedRecordItem[] | AirtableErrorResult> => {
  const tableId = getMenuItemsTable() || MENU_ITEMS_TABLE_ID_DEFAULT;
  if (!stationType.trim()) return [];

  try {
    // 1. Use code mapping first — no Airtable config needed
    if (hasStationMapping(stationType)) {
      const allResult = await loadMenuItems();
      if (!isErrorResult(allResult)) {
        const ids = getStationItemIds(stationType);
        const filtered =
          ids.length > 0
            ? allResult.filter((item) => ids.includes(item.id))
            : allResult.filter((item) => itemMatchesStation(item.name, stationType));
        if (filtered.length > 0) {
          return filtered;
        }
      }
    }
  } catch {
    // Fall through to Airtable
  }

  const escaped = stationType.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  try {
    // 1. Query Stations where Station Type = X, get Station Items (linked menu IDs)
    const fieldIds = await getStationsFieldIds();
    const stationsTableId = getStationsTable();
    const stationsFormula = `{${fieldIds?.stationTypeFieldName ?? "Station Type"}}="${escaped}"`;
    const stationsParams = new URLSearchParams();
    stationsParams.set("filterByFormula", stationsFormula);
    stationsParams.set("returnFieldsByFieldId", "true");
    stationsParams.append("fields[]", fieldIds?.stationItems ?? STATION_ITEMS_FIELD_ID);

    const stationsData = await airtableFetch<{
      records?: Array<{ fields: Record<string, unknown> }>;
      error?: { message?: string };
    }>(`/${stationsTableId}?${stationsParams.toString()}`);
    if (isErrorResult(stationsData)) {
      console.warn("[Station Picker] Airtable error - check API key has access to base");
    }

    if (!isErrorResult(stationsData) && !stationsData.error && stationsData.records?.length) {
      const allItemIds = stationsData.records.flatMap((r) =>
        asLinkedRecordIds(r.fields[fieldIds?.stationItems ?? STATION_ITEMS_FIELD_ID])
      );
      const itemIds = [...new Set(allItemIds)].filter((id) => id?.startsWith("rec"));
      if (itemIds.length > 0) {
        const items = await loadMenuItemsByIds(itemIds);
        if (!isErrorResult(items) && items.length > 0) {
          console.log(`[Station Picker] Station Type: ${stationType} | Items from Station Items link: ${items.length}`);
          return items;
        }
      }
    }

    // 2. Fallback: Menu Items.Station Type filter (field name from schema)
    const metaData = await airtableMetaFetch<{ tables: Array<{ id: string; name?: string; fields: Array<{ id: string; name: string }> }> }>("");
    let menuStationTypeFieldName = "Station Type";
    if (!isErrorResult(metaData)) {
      const menuTable = metaData.tables.find((t) => t.id === tableId || t.name === "Menu Items");
      const stationTypeField = menuTable?.fields.find((f) => f.id === MENU_ITEMS_STATION_TYPE_FIELD_ID || f.name === "Station Type");
      if (stationTypeField?.name) menuStationTypeFieldName = stationTypeField.name;
    }

    const formula = `{${menuStationTypeFieldName}}="${escaped}"`;
    const params = new URLSearchParams();
    params.set("pageSize", "100");
    params.set("returnFieldsByFieldId", "true");
    params.set("filterByFormula", formula);
    params.append("fields[]", MENU_ITEMS_FORMATTED_NAME_FIELD_ID);
    params.append("fields[]", MENU_ITEMS_CATEGORY_FIELD_ID);
    params.append("fields[]", MENU_ITEMS_PARENT_FIELD_ID);
    params.append("fields[]", MENU_ITEMS_CHILD_ITEMS_FIELD_ID);
    params.append("fields[]", MENU_ITEMS_ITEM_NAME_FIELD_ID);

    const data = await airtableFetch<{
      records?: Array<{ id: string; fields: Record<string, unknown> }>;
      error?: { message?: string };
    }>(`/${tableId}?${params.toString()}`);
    if (isErrorResult(data)) {
      console.warn("[Station Picker] Airtable error on Menu Items - check API key has access to base");
    }
    if (!isErrorResult(data) && data.error) {
      console.warn(`[Station Picker] Station Type: ${stationType} | Menu Items filter error: ${data.error.message}`);
    }

    let items: LinkedRecordItem[] = [];
    const recordsData = isErrorResult(data) ? null : data;
    if (recordsData && !recordsData.error && recordsData.records?.length) {
      const allRecs = recordsData.records;
      const idToName: Record<string, string> = {};
      for (const rec of allRecs) {
        const nameRaw = rec.fields[MENU_ITEMS_FORMATTED_NAME_FIELD_ID] ?? rec.fields[MENU_ITEMS_ITEM_NAME_FIELD_ID];
        const name = typeof nameRaw === "string" ? nameRaw : nameRaw && typeof nameRaw === "object" && "name" in nameRaw ? String((nameRaw as { name: string }).name) : "";
        idToName[rec.id] = cleanDisplayName(name || "") || rec.id;
      }
      const mapItem = (rec: { id: string; fields: Record<string, unknown> }) => {
        const nameRaw = rec.fields[MENU_ITEMS_FORMATTED_NAME_FIELD_ID];
        const name = typeof nameRaw === "string" ? nameRaw : nameRaw && typeof nameRaw === "object" && "name" in nameRaw ? String((nameRaw as { name: string }).name) : "";
        const categoryRaw = rec.fields[MENU_ITEMS_CATEGORY_FIELD_ID];
        const category = Array.isArray(categoryRaw) ? categoryRaw[0] : typeof categoryRaw === "string" ? categoryRaw : undefined;
        const childIds = asLinkedRecordIds(rec.fields[MENU_ITEMS_CHILD_ITEMS_FIELD_ID]);
        const childItems = childIds.map((id) => idToName[id]).filter(Boolean);
        return { id: rec.id, name: cleanDisplayName(name || "") || rec.id, category, childItems: childItems.length ? childItems : undefined } as LinkedRecordItem;
      };
      items = filterToParentItems(allRecs, MENU_ITEMS_PARENT_FIELD_ID, mapItem);
      console.log(`[Station Picker] Station Type: ${stationType} | Parent items from Menu Items.Station Type: ${items.length}`);
    }

    // Fallback: if no items match station type, show all parent menu items so user can add
    if (items.length === 0) {
      console.log(`[Station Picker] Station Type: ${stationType} | No items found. Falling back to all parent menu items.`);
      const allResult = await loadMenuItems();
      if (!isErrorResult(allResult)) items = allResult;
    }
    return items;
  } catch (error) {
    console.error("❌ Failed to load menu items by station type:", error);
    return { error: true, message: error instanceof Error ? error.message : "Unknown error" };
  }
};

export type FetchLinkedRecordItem = {
  id: string;
  name: string;
  category: string;
  dietaryTags: string;
};

export async function fetchLinkedRecordOptions(
  tableId: string,
  fieldId: string
): Promise<FetchLinkedRecordItem[]> {
  console.log("[fetchLinkedRecordOptions] Fetching for field:", fieldId);

  try {
    const params = new URLSearchParams();
    params.set("maxRecords", "1200");
    params.set("cellFormat", "json");
    params.set("returnFieldsByFieldId", "true");
    params.append("fields[]", MENU_ITEMS_FORMATTED_NAME_FIELD_ID);
    params.append("fields[]", MENU_ITEMS_CATEGORY_FIELD_ID);
    params.append("fields[]", MENU_ITEMS_DIETARY_TAGS_FIELD_ID);

    const data = await airtableFetch<{ records?: Array<{ id: string; fields: Record<string, unknown> }> }>(
      `/${tableId}?${params.toString()}`
    );
    if (isErrorResult(data)) {
      console.error("[fetchLinkedRecordOptions] Airtable error");
      return [];
    }
    console.log("[fetchLinkedRecordOptions] Raw response:", JSON.stringify(data, null, 2));

    if (!data.records) {
      console.error("[fetchLinkedRecordOptions] No records in response");
      return [];
    }

    const items = data.records.map((record) => {
      const nameRaw = record.fields[MENU_ITEMS_FORMATTED_NAME_FIELD_ID];
      const categoryRaw = record.fields[MENU_ITEMS_CATEGORY_FIELD_ID];
      const dietaryTagsRaw = record.fields[MENU_ITEMS_DIETARY_TAGS_FIELD_ID];

      const name = typeof nameRaw === "string" ? nameRaw
        : nameRaw && typeof nameRaw === "object" && "name" in nameRaw ? String((nameRaw as { name: string }).name)
        : "Unnamed Item";
      const category = typeof categoryRaw === "string" ? categoryRaw
        : categoryRaw && typeof categoryRaw === "object" && "name" in categoryRaw ? String((categoryRaw as { name: string }).name)
        : "";
      const dietaryTags = typeof dietaryTagsRaw === "string" ? dietaryTagsRaw
        : dietaryTagsRaw && typeof dietaryTagsRaw === "object" && "name" in dietaryTagsRaw ? String((dietaryTagsRaw as { name: string }).name)
        : "";

      return {
        id: record.id,
        name,
        category,
        dietaryTags,
      };
    });

    console.log("[fetchLinkedRecordOptions] Parsed items:", items.length, "items");
    if (items.length > 0) {
      console.log("[fetchLinkedRecordOptions] First item:", JSON.stringify(items[0], null, 2));
    }
    return items;
  } catch (error) {
    console.error("[fetchLinkedRecordOptions] Error:", error);
    return [];
  }
}

export const loadMenuItemSpecs = async () =>
  listLinkedTableItems(MENU_ITEM_SPECS_TABLE_ID, MENU_ITEM_SPECS_NAME_FIELD_ID);

export const loadStaff = async () => listLinkedTableItems(STAFF_TABLE_ID, STAFF_NAME_FIELD_ID);

export const loadRentals = async () => listLinkedTableItems(RENTALS_TABLE_ID, RENTALS_NAME_FIELD_ID);

export const loadRentalItems = async () =>
  listLinkedTableItems(RENTAL_ITEMS_TABLE_ID, RENTAL_ITEMS_NAME_FIELD_ID);

export const loadServiceWare = async () =>
  listLinkedTableItems(SERVICE_WARE_TABLE_ID, SERVICE_WARE_NAME_FIELD_ID);

/** Station record from Stations table. */
export type StationRecord = {
  id: string;
  stationType: string;
  stationItems: string[];
  stationNotes: string;
  stationPresetId?: string;
  stationComponents?: string[];
  customItems?: string;
  beoPlacement?: "Presented Appetizer Metal/China" | "Buffet Metal/China";
};

/** Load station records for an event by querying Stations where Event = eventId. Keeps stations separate from Events (no Events.Stations needed). Falls back to loadStationsByRecordIds if formula returns empty and fallbackStationIds provided (e.g. when Events.Stations exists). */
export const loadStationsByEventId = async (
  eventId: string,
  fallbackStationIds?: string[]
): Promise<StationRecord[] | AirtableErrorResult> => {
  const baseIdResult = getBaseId();
  const apiKeyResult = getApiKey();
  if (isErrorResult(baseIdResult) || isErrorResult(apiKeyResult)) return baseIdResult as AirtableErrorResult;
  const fieldIds = await getStationsFieldIds();
  if (!fieldIds?.event || !fieldIds?.eventFieldName) {
    return { error: true, message: "Could not resolve Stations table Event field" };
  }
  const tableId = getStationsTable();
  // Linked record: FIND(eventId, ARRAYJOIN({Event})) finds if Event contains this event
  const formula = `FIND('${eventId}', ARRAYJOIN({${fieldIds.eventFieldName}})) > 0`;
  const params = new URLSearchParams();
  params.set("filterByFormula", formula);
  params.set("returnFieldsByFieldId", "true");
  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${tableId}?${params.toString()}`
  );
  if (isErrorResult(data)) return data;
  if (data.records.length === 0 && fallbackStationIds?.length) {
    return loadStationsByRecordIds(fallbackStationIds);
  }
  return data.records.map((rec) => {
    const fields = rec.fields as Record<string, unknown>;
    const stationType = asString(fields[fieldIds.stationType]) || asSingleSelectName(fields[fieldIds.stationType]) || "";
    const stationItems = asLinkedRecordIds(fields[fieldIds.stationItems]);
    const stationNotes = asString(fields[fieldIds.stationNotes]) || "";
    const stationPresetIds = fieldIds.stationPreset ? asLinkedRecordIds(fields[fieldIds.stationPreset]) : [];
    const stationPresetId = stationPresetIds[0];
    const stationComponents = fieldIds.stationComponents ? asLinkedRecordIds(fields[fieldIds.stationComponents]) : undefined;
    const customItems = fieldIds.customItems ? asString(fields[fieldIds.customItems]) : undefined;
    const beoPlacementRaw = fieldIds.beoPlacement ? (asString(fields[fieldIds.beoPlacement]) || asSingleSelectName(fields[fieldIds.beoPlacement])) : undefined;
    let beoPlacement: "Presented Appetizer Metal/China" | "Buffet Metal/China" | undefined = beoPlacementRaw === "Presented Appetizer Metal/China" || beoPlacementRaw === "Buffet Metal/China" ? beoPlacementRaw : undefined;
    if (!beoPlacement && customItems) {
      const m = customItems.match(/^BEO Placement:\s*(Presented Appetizer Metal\/China|Buffet Metal\/China)/im);
      if (m) beoPlacement = m[1] as "Presented Appetizer Metal/China" | "Buffet Metal/China";
    }
    return { id: rec.id, stationType, stationItems, stationNotes, stationPresetId, stationComponents, customItems, beoPlacement };
  });
};

/** Load station records by IDs. Uses field IDs from Meta API. */
export const loadStationsByRecordIds = async (
  recordIds: string[]
): Promise<StationRecord[] | AirtableErrorResult> => {
  if (recordIds.length === 0) return [];
  const baseIdResult = getBaseId();
  const apiKeyResult = getApiKey();
  if (isErrorResult(baseIdResult) || isErrorResult(apiKeyResult)) return baseIdResult as AirtableErrorResult;
  const fieldIds = await getStationsFieldIds();
  if (!fieldIds) {
    return { error: true, message: "Could not resolve Stations table field IDs" };
  }
  const tableId = getStationsTable();
  const formula = `OR(${recordIds.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
  const params = new URLSearchParams();
  params.set("filterByFormula", formula);
  params.set("returnFieldsByFieldId", "true");
  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${tableId}?${params.toString()}`
  );
  if (isErrorResult(data)) return data;
  return data.records.map((rec) => {
    const fields = rec.fields as Record<string, unknown>;
    const stationType = asString(fields[fieldIds.stationType]) || asSingleSelectName(fields[fieldIds.stationType]) || "";
    const stationItems = asLinkedRecordIds(fields[fieldIds.stationItems]);
    const stationNotes = asString(fields[fieldIds.stationNotes]) || "";
    const stationPresetIds = fieldIds.stationPreset ? asLinkedRecordIds(fields[fieldIds.stationPreset]) : [];
    const stationPresetId = stationPresetIds[0];
    const stationComponents = fieldIds.stationComponents ? asLinkedRecordIds(fields[fieldIds.stationComponents]) : undefined;
    const customItems = fieldIds.customItems ? asString(fields[fieldIds.customItems]) : undefined;
    const beoPlacementRaw = fieldIds.beoPlacement ? (asString(fields[fieldIds.beoPlacement]) || asSingleSelectName(fields[fieldIds.beoPlacement])) : undefined;
    let beoPlacement: "Presented Appetizer Metal/China" | "Buffet Metal/China" | undefined = beoPlacementRaw === "Presented Appetizer Metal/China" || beoPlacementRaw === "Buffet Metal/China" ? beoPlacementRaw : undefined;
    if (!beoPlacement && customItems) {
      const m = customItems.match(/^BEO Placement:\s*(Presented Appetizer Metal\/China|Buffet Metal\/China)/im);
      if (m) beoPlacement = m[1] as "Presented Appetizer Metal/China" | "Buffet Metal/China";
    }
    return { id: rec.id, stationType, stationItems, stationNotes, stationPresetId, stationComponents, customItems, beoPlacement };
  });
};

/** Create a station and link to event. Uses field names (not IDs) to avoid 403 on computed/renamed fields. */
export const createStation = async (params: {
  stationType: string;
  stationItems: string[];
  stationNotes: string;
  eventId: string;
}): Promise<{ id: string } | AirtableErrorResult> => {
  const baseIdResult = getBaseId();
  const apiKeyResult = getApiKey();
  if (isErrorResult(baseIdResult) || isErrorResult(apiKeyResult)) return baseIdResult as AirtableErrorResult;
  const tableId = getStationsTable();

  const fields: Record<string, unknown> = {
    "Station Type": params.stationType,
    "Station Items": params.stationItems,
    "Event": [params.eventId],
  };
  if (params.stationNotes?.trim()) {
    fields["Station Notes"] = params.stationNotes.trim();
  }

  const data = await airtableFetch<{ records?: Array<{ id: string }> }>(
    `/${tableId}`,
    { method: "POST", body: JSON.stringify({ records: [{ fields }] }) }
  );
  if (isErrorResult(data)) return data;
  const rec = (data as { records?: Array<{ id: string }> }).records?.[0];
  return rec ? { id: rec.id } : { error: true, message: "No record returned" };
};

/** Create station from preset with components. Uses field IDs for Station Preset, Station Components, Custom Items. */
export const createStationFromPreset = async (params: {
  presetId: string;
  presetName: string;
  stationComponents: string[];
  customItems?: string;
  stationNotes: string;
  eventId: string;
  beoPlacement?: "Presented Appetizer Metal/China" | "Buffet Metal/China";
}): Promise<{ id: string } | AirtableErrorResult> => {
  const fieldIds = await getStationsFieldIds();
  if (!fieldIds) return { error: true, message: "Could not resolve Stations table field IDs" };
  const tableId = getStationsTable();
  const fields: Record<string, unknown> = {
    [fieldIds.event]: [params.eventId],
    [fieldIds.stationType]: params.presetName,
  };
  if (fieldIds.stationPreset) fields[fieldIds.stationPreset] = [params.presetId];
  if (fieldIds.stationComponents && params.stationComponents.length > 0) fields[fieldIds.stationComponents] = params.stationComponents;
  let customText = params.customItems?.trim() ?? "";
  if (params.beoPlacement) {
    if (fieldIds.beoPlacement) {
      fields[fieldIds.beoPlacement] = params.beoPlacement;
    } else {
      customText = `BEO Placement: ${params.beoPlacement}\n${customText}`.trim();
    }
  }
  if (fieldIds.customItems && customText) fields[fieldIds.customItems] = customText;
  if (params.stationNotes?.trim()) fields[fieldIds.stationNotes] = params.stationNotes.trim();
  const data = await airtableFetch<{ records?: Array<{ id: string }> }>(`/${tableId}`, {
    method: "POST",
    body: JSON.stringify({ records: [{ fields }] }),
  });
  if (isErrorResult(data)) return data;
  const rec = (data as { records?: Array<{ id: string }> }).records?.[0];
  return rec ? { id: rec.id } : { error: true, message: "No record returned" };
};

/** Update station's Station Components, Custom Components, Custom Items, BEO Placement. */
export const updateStationComponents = async (
  stationId: string,
  patch: { stationComponents?: string[]; customItems?: string; beoPlacement?: "Presented Appetizer Metal/China" | "Buffet Metal/China" }
): Promise<{ success: boolean } | AirtableErrorResult> => {
  const fieldIds = await getStationsFieldIds();
  if (!fieldIds) return { error: true, message: "Could not resolve Stations table field IDs" };
  const tableId = getStationsTable();
  const fields: Record<string, unknown> = {};
  if (patch.stationComponents !== undefined && fieldIds.stationComponents) fields[fieldIds.stationComponents] = patch.stationComponents;
  let customText = patch.customItems;
  if (patch.beoPlacement !== undefined) {
    if (fieldIds.beoPlacement) {
      fields[fieldIds.beoPlacement] = patch.beoPlacement || null;
    } else if (fieldIds.customItems && patch.beoPlacement) {
      const base = (customText ?? "").replace(/^BEO Placement:\s*(?:Presented Appetizer Metal\/China|Buffet Metal\/China)\n?/im, "").trim();
      customText = `BEO Placement: ${patch.beoPlacement}\n${base}`.trim();
    }
  }
  if (customText !== undefined && fieldIds.customItems) fields[fieldIds.customItems] = customText || null;
  if (Object.keys(fields).length === 0) return { success: true };
  const data = await airtableFetch<{ id: string }>(`/${tableId}`, {
    method: "PATCH",
    body: JSON.stringify({ records: [{ id: stationId, fields }] }),
  });
  if (isErrorResult(data)) return data;
  return { success: true };
};

/** Station preset from Station Presets table. */
export type StationPreset = {
  name: string;
  line1: string[];
  line2: string[];
  individuals: string[];
};

/** Table name/ID for Station Presets. Use env or fallback to "Station Presets". */
const STATION_PRESETS_TABLE_DEFAULT = "Station Presets";

/** Field name for preset lookup (e.g. "Preset Name", "Station Type", "Name"). */
const STATION_PRESETS_NAME_FIELD =
  (import.meta.env.VITE_AIRTABLE_STATION_PRESETS_NAME_FIELD as string | undefined)?.trim() ||
  "Preset Name";

/** Fetch a station preset by name. Uses /api/airtable/select proxy (server-side) when available to avoid 403. */
export const loadStationPreset = async (presetName: string): Promise<StationPreset | null> => {
  try {
    const raw = import.meta.env.VITE_AIRTABLE_STATION_PRESETS_TABLE as string | undefined;
    let table = typeof raw === "string" && raw.trim() && raw !== "undefined" && raw !== "null"
      ? raw.trim()
      : STATION_PRESETS_TABLE_DEFAULT;
    if (!table || table === "undefined" || table === "null") {
      table = STATION_PRESETS_TABLE_DEFAULT;
    }

    const formula = `{${STATION_PRESETS_NAME_FIELD}} = "${presetName.replace(/"/g, '\\"')}"`;
    const tableParam = String(table);
    const nameFieldParam = encodeURIComponent(STATION_PRESETS_NAME_FIELD);
    const url = `/api/airtable/select?table=${encodeURIComponent(tableParam)}&formula=${encodeURIComponent(formula)}&nameField=${nameFieldParam}`;

    const resp = await fetch(url);
    const text = await resp.text();

    if (!resp.ok) {
      if (resp.status === 404 || resp.status === 400) return null;
      console.warn("[loadStationPreset] API error:", resp.status, text.slice(0, 100));
      return null;
    }

    let data: { records?: Array<{ fields: Record<string, unknown> }>; error?: { message?: string } };
    try {
      data = JSON.parse(text);
    } catch {
      console.warn("[loadStationPreset] Invalid JSON response");
      return null;
    }

    if (data.error || !data.records?.length) return null;
    const rec = data.records[0].fields;

    return {
      name: String(rec[STATION_PRESETS_NAME_FIELD] ?? presetName),
      line1: asLinkedRecordIds(rec["Line 1 Defaults"]),
      line2: asLinkedRecordIds(rec["Line 2 Defaults"]),
      individuals: asLinkedRecordIds(rec["Individual Defaults"]),
    };
  } catch (err) {
    console.warn("Failed to load station preset:", err);
    return null;
  }
};

/** Update a station's Station Items (linked menu items). Uses field ID from Meta API. */
export const updateStationItems = async (
  stationId: string,
  stationItems: string[]
): Promise<{ success: boolean } | AirtableErrorResult> => {
  const apiKeyResult = getApiKey();
  if (isErrorResult(apiKeyResult)) return apiKeyResult as AirtableErrorResult;
  const baseIdResult = getBaseId();
  if (isErrorResult(baseIdResult)) return baseIdResult as AirtableErrorResult;
  const fieldIds = await getStationsFieldIds();
  if (!fieldIds) {
    return { error: true, message: "Could not resolve Stations table field IDs" };
  }
  const tableId = getStationsTable();
  const fields: Record<string, unknown> = { [fieldIds.stationItems]: stationItems };
  const data = await airtableFetch<{ id: string }>(
    `/${tableId}`,
    { method: "PATCH", body: JSON.stringify({ records: [{ id: stationId, fields }] }) }
  );
  if (isErrorResult(data)) return data;
  return { success: true };
};

/** Update a station's Station Notes only. Used by config-driven stations (e.g. Viva La Pasta). */
export const updateStationNotes = async (
  stationId: string,
  stationNotes: string
): Promise<{ success: boolean } | AirtableErrorResult> => {
  const apiKeyResult = getApiKey();
  if (isErrorResult(apiKeyResult)) return apiKeyResult as AirtableErrorResult;
  const baseIdResult = getBaseId();
  if (isErrorResult(baseIdResult)) return baseIdResult as AirtableErrorResult;
  const fieldIds = await getStationsFieldIds();
  if (!fieldIds?.stationNotes) {
    return { error: true, message: "Could not resolve Station Notes field" };
  }
  const tableId = getStationsTable();
  const fields: Record<string, unknown> = { [fieldIds.stationNotes]: stationNotes.trim() || "" };
  const data = await airtableFetch<{ id: string }>(
    `/${tableId}`,
    { method: "PATCH", body: JSON.stringify({ records: [{ id: stationId, fields }] }) }
  );
  if (isErrorResult(data)) return data;
  return { success: true };
};
