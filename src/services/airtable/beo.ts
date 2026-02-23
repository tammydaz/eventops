/**
 * BEO Airtable Data Service
 * Helper functions for fetching and updating BEO-related data.
 * All field IDs come from src/config/beoFieldIds.ts.
 */

import {
  airtableFetch,
  type AirtableListResponse,
  type AirtableRecord,
  type AirtableErrorResult,
} from "./client";
import { loadEvent, updateEventMultiple, FIELD_IDS } from "./events";
import { isErrorResult, asString, asSingleSelectName, asLinkedRecordIds, asStringArray, asBoolean } from "./selectors";
import {
  MENU_ITEMS_TABLE_ID,
  BEO_MENU_ITEM_FIELDS,
  BEO_EVENTS,
  BEO_MENU_FIELDS,
} from "../../config/beoFieldIds";
import type { BeoData, EventData, MenuItem, MenuSelectionIds, SpecOverrides } from "../../types/beo";

// ── Internal helpers ─────────────────────────────────────────────────────────

const AIRTABLE_BASE_ID = (import.meta.env.VITE_AIRTABLE_BASE_ID as string | undefined)?.trim();
const AIRTABLE_API_KEY = (import.meta.env.VITE_AIRTABLE_API_KEY as string | undefined)?.trim();

type MenuItemFields = Record<string, unknown>;

/** Map a raw Airtable record to a MenuItem (children populated later) */
function rawToMenuItem(record: AirtableRecord<MenuItemFields>): MenuItem {
  const f = record.fields;
  const allergenRaw = f[BEO_MENU_ITEM_FIELDS.ALLERGEN_ICONS];
  const allergens = Array.isArray(allergenRaw)
    ? allergenRaw.filter((v): v is string => typeof v === "string")
    : [];

  const isSauceRaw = asSingleSelectName(f[BEO_MENU_ITEM_FIELDS.IS_SAUCE]);
  const isSauce = isSauceRaw.toLowerCase() === "yes" || isSauceRaw.toLowerCase() === "sauce";
  const standAloneSauce = asBoolean(f[BEO_MENU_ITEM_FIELDS.STAND_ALONE_SAUCE]);

  const parentIds = asLinkedRecordIds(f[BEO_MENU_ITEM_FIELDS.PARENT_ITEM]);
  const parentId = parentIds.length > 0 ? parentIds[0] : undefined;

  const overrideQty = asString(f[BEO_MENU_ITEM_FIELDS.QTY_NICK_SPEC]);
  const overridePanType = asSingleSelectName(f[BEO_MENU_ITEM_FIELDS.PAN_TYPE_NICK_SPEC]);
  const overrideVessel = asSingleSelectName(f[BEO_MENU_ITEM_FIELDS.SERVING_VESSEL_NICK_SPEC]);
  const overrideNotes = asString(f[BEO_MENU_ITEM_FIELDS.NOTES_NICK]);

  const hasOverride = overrideQty || overridePanType || overrideVessel || overrideNotes;

  return {
    id: record.id,
    name: asString(f[BEO_MENU_ITEM_FIELDS.DISPLAY_NAME]),
    section: asSingleSelectName(f[BEO_MENU_ITEM_FIELDS.SECTION]),
    autoSpec: asString(f[BEO_MENU_ITEM_FIELDS.PRINT_SPEC_LINE]),
    specOverride: hasOverride
      ? {
          qty: overrideQty || undefined,
          panType: overridePanType || undefined,
          servingVessel: overrideVessel || undefined,
          notes: overrideNotes || undefined,
        }
      : undefined,
    allergens,
    children: [],
    isSauce,
    standAloneSauce,
    notes: overrideNotes || undefined,
    kitchenTasks: asString(f[BEO_MENU_ITEM_FIELDS.KITCHEN_TASKS]) || undefined,
    serviceType: asSingleSelectName(f[BEO_MENU_ITEM_FIELDS.SERVICE_TYPE]) || undefined,
    parentId,
  };
}

/** Extract EventData from raw fields */
function rawToEventData(fields: Record<string, unknown>): EventData {
  const clientFirstName = asString(fields[BEO_EVENTS.CLIENT_DISPLAY]);
  const clientLastName = asString(fields[BEO_EVENTS.CLIENT_LAST_NAME]);
  const clientDisplay = [clientFirstName, clientLastName].filter(Boolean).join(" ").trim();

  return {
    jobNumber: asString(fields[BEO_EVENTS.JOB_NUMBER]),
    clientFirstName,
    clientLastName,
    clientDisplay,
    clientPhone: asString(fields[BEO_EVENTS.CLIENT_PHONE]),
    venueName: asString(fields[BEO_EVENTS.VENUE_NAME]) || asString(fields[FIELD_IDS.VENUE]),
    eventLocation: asString(fields[BEO_EVENTS.EVENT_LOCATION]),
    venueCity: asString(fields[BEO_EVENTS.VENUE_CITY]),
    eventDate: asString(fields[BEO_EVENTS.EVENT_DATE]),
    guestCount:
      fields[BEO_EVENTS.GUEST_COUNT] !== undefined
        ? String(fields[BEO_EVENTS.GUEST_COUNT])
        : "",
    eventStartTime:
      fields[BEO_EVENTS.EVENT_START_TIME] !== undefined
        ? String(fields[BEO_EVENTS.EVENT_START_TIME])
        : "",
    eventEndTime:
      fields[BEO_EVENTS.EVENT_END_TIME] !== undefined
        ? String(fields[BEO_EVENTS.EVENT_END_TIME])
        : "",
    eventArrivalTime:
      fields[BEO_EVENTS.EVENT_ARRIVAL_TIME] !== undefined
        ? String(fields[BEO_EVENTS.EVENT_ARRIVAL_TIME])
        : "",
    dispatchTime: asString(fields[BEO_EVENTS.DISPATCH_TIME]),
    serviceStyle: asSingleSelectName(fields[BEO_EVENTS.SERVICE_STYLE]),
    dietaryNotes: asString(fields[BEO_EVENTS.DIETARY_NOTES]),
    specialNotes: asString(fields[BEO_EVENTS.SPECIAL_NOTES]),
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch all linked menu item records for an event.
 * Returns a flat list; parent-child relationships are resolved in fetchBeoData.
 */
export const fetchMenuItemsForEvent = async (
  recordIds: string[]
): Promise<MenuItem[] | AirtableErrorResult> => {
  if (!recordIds.length) return [];
  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    return { error: true, message: "Missing Airtable env vars" };
  }

  const FIELDS_TO_FETCH = [
    BEO_MENU_ITEM_FIELDS.DISPLAY_NAME,
    BEO_MENU_ITEM_FIELDS.SERVICE_TYPE,
    BEO_MENU_ITEM_FIELDS.SECTION,
    BEO_MENU_ITEM_FIELDS.PRINT_SPEC_LINE,
    BEO_MENU_ITEM_FIELDS.QTY_NICK_SPEC,
    BEO_MENU_ITEM_FIELDS.PAN_TYPE_NICK_SPEC,
    BEO_MENU_ITEM_FIELDS.SERVING_VESSEL_NICK_SPEC,
    BEO_MENU_ITEM_FIELDS.NOTES_NICK,
    BEO_MENU_ITEM_FIELDS.ALLERGEN_ICONS,
    BEO_MENU_ITEM_FIELDS.IS_SAUCE,
    BEO_MENU_ITEM_FIELDS.STAND_ALONE_SAUCE,
    BEO_MENU_ITEM_FIELDS.KITCHEN_TASKS,
    BEO_MENU_ITEM_FIELDS.PARENT_ITEM,
  ];

  const allItems: MenuItem[] = [];

  // Batch in chunks of 10 (Airtable filterByFormula OR limit)
  for (let i = 0; i < recordIds.length; i += 10) {
    const chunk = recordIds.slice(i, i + 10);
    const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;

    const params = new URLSearchParams();
    params.set("filterByFormula", formula);
    params.set("returnFieldsByFieldId", "true");
    params.set("cellFormat", "json");
    FIELDS_TO_FETCH.forEach((fid) => params.append("fields[]", fid));

    const data = await airtableFetch<AirtableListResponse<MenuItemFields>>(
      `/${MENU_ITEMS_TABLE_ID}?${params.toString()}`
    );

    if (isErrorResult(data)) return data;
    data.records.forEach((rec) => allItems.push(rawToMenuItem(rec)));
  }

  return allItems;
};

/**
 * Fetch child items (sauces / components) for a list of parent record IDs.
 * Queries the Menu Items table for records whose Parent Item field contains any of the parentIds.
 */
export const fetchChildItems = async (
  parentIds: string[]
): Promise<MenuItem[] | AirtableErrorResult> => {
  if (!parentIds.length) return [];
  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    return { error: true, message: "Missing Airtable env vars" };
  }

  const FIELDS_TO_FETCH = [
    BEO_MENU_ITEM_FIELDS.DISPLAY_NAME,
    BEO_MENU_ITEM_FIELDS.SERVICE_TYPE,
    BEO_MENU_ITEM_FIELDS.SECTION,
    BEO_MENU_ITEM_FIELDS.PRINT_SPEC_LINE,
    BEO_MENU_ITEM_FIELDS.QTY_NICK_SPEC,
    BEO_MENU_ITEM_FIELDS.PAN_TYPE_NICK_SPEC,
    BEO_MENU_ITEM_FIELDS.SERVING_VESSEL_NICK_SPEC,
    BEO_MENU_ITEM_FIELDS.NOTES_NICK,
    BEO_MENU_ITEM_FIELDS.ALLERGEN_ICONS,
    BEO_MENU_ITEM_FIELDS.IS_SAUCE,
    BEO_MENU_ITEM_FIELDS.STAND_ALONE_SAUCE,
    BEO_MENU_ITEM_FIELDS.KITCHEN_TASKS,
    BEO_MENU_ITEM_FIELDS.PARENT_ITEM,
  ];

  const allChildren: MenuItem[] = [];

  // Batch parent IDs in chunks of 5 (linked record filters can be large)
  for (let i = 0; i < parentIds.length; i += 5) {
    const chunk = parentIds.slice(i, i + 5);
    const formula = `OR(${chunk
      .map((id) => `FIND('${id}', ARRAYJOIN({${BEO_MENU_ITEM_FIELDS.PARENT_ITEM}}, ','))>0`)
      .join(",")})`;

    const params = new URLSearchParams();
    params.set("filterByFormula", formula);
    params.set("returnFieldsByFieldId", "true");
    params.set("cellFormat", "json");
    FIELDS_TO_FETCH.forEach((fid) => params.append("fields[]", fid));

    const data = await airtableFetch<AirtableListResponse<MenuItemFields>>(
      `/${MENU_ITEMS_TABLE_ID}?${params.toString()}`
    );

    if (isErrorResult(data)) return data;
    data.records.forEach((rec) => allChildren.push(rawToMenuItem(rec)));
  }

  return allChildren;
};

/**
 * Fetch complete BEO data for an event, including event header fields,
 * all menu items with parent-child relationships resolved.
 */
export const fetchBeoData = async (
  eventId: string
): Promise<BeoData | AirtableErrorResult> => {
  const eventRecord = await loadEvent(eventId);
  if (isErrorResult(eventRecord)) return eventRecord;

  const fields = eventRecord.fields;
  const event = rawToEventData(fields);

  const selectionIds: MenuSelectionIds = {
    passedAppetizers: asLinkedRecordIds(fields[BEO_MENU_FIELDS.PASSED_APPETIZERS]),
    presentedAppetizers: asLinkedRecordIds(fields[BEO_MENU_FIELDS.PRESENTED_APPETIZERS]),
    buffetMetal: asLinkedRecordIds(fields[BEO_MENU_FIELDS.BUFFET_METAL]),
    buffetChina: asLinkedRecordIds(fields[BEO_MENU_FIELDS.BUFFET_CHINA]),
    desserts: asLinkedRecordIds(fields[BEO_MENU_FIELDS.DESSERTS]),
    beverages: asLinkedRecordIds(fields[BEO_MENU_FIELDS.BEVERAGES]),
  };

  const allIds = [
    ...selectionIds.passedAppetizers,
    ...selectionIds.presentedAppetizers,
    ...selectionIds.buffetMetal,
    ...selectionIds.buffetChina,
    ...selectionIds.desserts,
    ...selectionIds.beverages,
  ];

  // Fetch parent items
  const parentItems = allIds.length > 0 ? await fetchMenuItemsForEvent(allIds) : [];
  if (isErrorResult(parentItems)) return parentItems;

  const parentMap = new Map<string, MenuItem>(parentItems.map((item) => [item.id, item]));
  const parentIdsWithChildren = parentItems.map((item) => item.id);

  // Fetch child items (sauces / components)
  const childItems =
    parentIdsWithChildren.length > 0
      ? await fetchChildItems(parentIdsWithChildren)
      : [];
  if (isErrorResult(childItems)) return childItems;

  // Attach children to their parents
  for (const child of childItems) {
    if (child.parentId && parentMap.has(child.parentId)) {
      const parent = parentMap.get(child.parentId)!;
      if (!child.standAloneSauce) {
        parent.children.push(child);
      }
    }
  }

  // Helper to build MenuItem[] for a section
  const buildSection = (ids: string[]): MenuItem[] =>
    ids
      .map((id) => parentMap.get(id))
      .filter((item): item is MenuItem => item !== undefined);

  return {
    event,
    selectionIds,
    menuSections: {
      passedAppetizers: buildSection(selectionIds.passedAppetizers),
      presentedAppetizers: buildSection(selectionIds.presentedAppetizers),
      buffetMetal: buildSection(selectionIds.buffetMetal),
      buffetChina: buildSection(selectionIds.buffetChina),
      desserts: buildSection(selectionIds.desserts),
      beverages: buildSection(selectionIds.beverages),
    },
  };
};

/**
 * Save spec override fields for a single menu item record.
 * Only writes to editable fields — never formula fields.
 */
export const updateSpecOverrides = async (
  menuItemId: string,
  overrides: SpecOverrides
): Promise<{ success: true } | AirtableErrorResult> => {
  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    return { error: true, message: "Missing Airtable env vars" };
  }

  const patchFields: Record<string, unknown> = {};
  if (overrides.qty !== undefined)
    patchFields[BEO_MENU_ITEM_FIELDS.QTY_NICK_SPEC] = overrides.qty;
  if (overrides.panType !== undefined)
    patchFields[BEO_MENU_ITEM_FIELDS.PAN_TYPE_NICK_SPEC] = overrides.panType
      ? { name: overrides.panType }
      : null;
  if (overrides.servingVessel !== undefined)
    patchFields[BEO_MENU_ITEM_FIELDS.SERVING_VESSEL_NICK_SPEC] = overrides.servingVessel
      ? { name: overrides.servingVessel }
      : null;
  if (overrides.notes !== undefined)
    patchFields[BEO_MENU_ITEM_FIELDS.NOTES_NICK] = overrides.notes;

  const data = await airtableFetch(`/${MENU_ITEMS_TABLE_ID}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [{ id: menuItemId, fields: patchFields }],
    }),
  });

  if (isErrorResult(data)) return data;
  return { success: true };
};

/**
 * Lock specs for an event by appending a lock timestamp to SPECIAL_NOTES.
 * (Spec Lock Status is a formula on the Menu Items table and cannot be written.)
 * Reads existing notes first and appends to avoid overwriting them.
 */
export const lockSpecs = async (
  eventId: string
): Promise<{ success: true } | AirtableErrorResult> => {
  const eventRecord = await loadEvent(eventId);
  if (isErrorResult(eventRecord)) return eventRecord;

  const existingNotes = asString(eventRecord.fields[FIELD_IDS.SPECIAL_NOTES]);
  const lockNote = `[SPECS LOCKED: ${new Date().toLocaleString()}]`;
  const updatedNotes = existingNotes
    ? `${existingNotes}\n${lockNote}`
    : lockNote;

  return updateEventMultiple(eventId, {
    [FIELD_IDS.SPECIAL_NOTES]: updatedNotes,
  });
};

// Re-export field IDs for convenience
export { BEO_MENU_ITEM_FIELDS, BEO_EVENTS, BEO_MENU_FIELDS, MENU_ITEMS_TABLE_ID };
