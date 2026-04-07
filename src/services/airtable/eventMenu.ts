/**
 * Event Menu table — shadow system.
 * When user adds a menu item via MenuPickerModal, we also create a row here.
 * Does NOT replace or modify existing Events field logic.
 */

import {
  airtableFetch,
  getBaseId,
  getApiKey,
  getEventMenuTable,
  getEventMenuShadowTable,
  type AirtableListResponse,
  type AirtableErrorResult,
} from "./client";
import { asLinkedRecordIds, asSingleSelectName, asString, isErrorResult } from "./selectors";
import { updateEventMultiple, FIELD_IDS, loadEvent } from "./events";
import { isDeliveryOrPickup } from "../../lib/deliveryHelpers";

/** Maps picker targetField to Event Menu Section value (exact Airtable values). */
export function targetFieldToSection(targetField: string): string | null {
  const map: Record<string, string> = {
    passedApps: "Passed Appetizers",
    presentedApps: "Presented Appetizers",
    buffetMetal: "Buffet – Metal",
    buffetChina: "Buffet – China",
    desserts: "Desserts",
    deli: "Deli",
    fullServiceDeli: "Deli",
    deliveryDeli: "Deli",
    roomTemp: "Room Temp",
    roomTempDisplay: "Room Temp / Display",
  };
  return map[targetField] ?? null;
}

/**
 * Returns the next Sort Order for that event+section (max existing + 1). One record fetched.
 */
export async function getNextSortOrder(
  eventId: string,
  section: string
): Promise<number | AirtableErrorResult> {
  const baseIdResult = getBaseId();
  const apiKeyResult = getApiKey();
  if (isErrorResult(baseIdResult) || isErrorResult(apiKeyResult)) {
    return baseIdResult as AirtableErrorResult;
  }
  const tableId = getEventMenuTable();
  const escapedSection = section.replace(/'/g, "\\'");
  const formula = `AND(FIND('${eventId}', ARRAYJOIN({Event})) > 0, {Section}='${escapedSection}')`;
  const params = new URLSearchParams();
  params.set("filterByFormula", formula);
  params.set("maxRecords", "1");
  params.set("sort[0][field]", "Sort Order");
  params.set("sort[0][direction]", "desc");

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${tableId}?${params.toString()}`
  );
  if (isErrorResult(data)) return data;
  const records = (data as AirtableListResponse<Record<string, unknown>>).records ?? [];
  const maxOrder = records[0]?.fields?.["Sort Order"] as number | undefined;
  return (typeof maxOrder === "number" ? maxOrder : 0) + 1;
}

/** Child override stored in parent Event Menu row (Child Overrides JSON). */
export type ChildOverride = {
  enabled?: boolean;
  label?: string;
};

/** Parsed Child Overrides from parent row. */
export type ChildOverridesData = {
  overrides?: Record<string, ChildOverride>;
  added?: string[];
};

/** One row from Event Menu (for UI display). */
export type EventMenuRow = {
  id: string;
  section: string;
  sortOrder: number;
  catalogItemId: string | null;
  displayName: string | null;
  customText: string | null;
  sauceOverride: string | null;
  packOutNotes: string | null;
  /** Parent Item ID for Creation Stations hierarchy. Null = top-level station. */
  parentItemId: string | null;
  /** Child overrides (enabled, label) keyed by child ID; added items as list. */
  childOverrides: ChildOverridesData | null;
};

/** Display component for one menu line (merged from default children + overrides). */
export type EventMenuRowComponent = {
  name: string;
  isRemoved: boolean;
  isAdded: boolean;
};

/**
 * Load all Event Menu rows for an event (for UI display).
 * Fetches only rows for this event (filterByFormula) with pagination — render ALL, no picker filtering.
 */
export async function loadEventMenuRows(
  eventId: string
): Promise<EventMenuRow[] | AirtableErrorResult> {
  const baseIdResult = getBaseId();
  const apiKeyResult = getApiKey();
  if (isErrorResult(baseIdResult) || isErrorResult(apiKeyResult)) {
    return baseIdResult as AirtableErrorResult;
  }
  const tableIdOrName = getEventMenuShadowTable();
  const allRecords: Array<Record<string, unknown>> = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    const escapedEventId = eventId.replace(/'/g, "\\'");
    params.set(
      "filterByFormula",
      `OR({Event}='${escapedEventId}', FIND('${escapedEventId}', ARRAYJOIN({Event})) > 0)`
    );
    params.set("pageSize", "100");
    if (offset) params.set("offset", offset);

    const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
      `/${tableIdOrName}?${params.toString()}`
    );
    if (isErrorResult(data)) {
      console.error("[Event Menu] loadEventMenuRows failed for event", eventId, data);
      return data;
    }
    const records = (data as AirtableListResponse<Record<string, unknown>>).records ?? [];
    allRecords.push(...records);
    offset = (data as { offset?: string }).offset;
  } while (offset);

  const extractEventIds = (rec: Record<string, unknown>): string[] => {
    const v = (rec.fields ?? {})["Event"];
    const out: string[] = [];

    const pushIdIf = (x: unknown) => {
      if (typeof x === "string" && x.startsWith("rec")) out.push(x);
      if (x && typeof x === "object") {
        const id = (x as { id?: unknown }).id;
        if (typeof id === "string" && id.startsWith("rec")) out.push(id);
      }
    };

    if (Array.isArray(v)) {
      v.forEach(pushIdIf);
    } else {
      pushIdIf(v);
    }
    return out;
  };

  const records = allRecords.filter((rec) => extractEventIds(rec).includes(eventId));
  records.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
    const sa = (a.fields ?? {})["Section"] as string;
    const sb = (b.fields ?? {})["Section"] as string;
    const c = (sa ?? "").localeCompare(sb ?? "");
    if (c !== 0) return c;
    return (((a.fields ?? {})["Sort Order"] as number) ?? 0) - (((b.fields ?? {})["Sort Order"] as number) ?? 0);
  });

  console.log("[Event Menu] loadEventMenuRows", { table: tableIdOrName, eventId, rowCount: records.length });
  return records.map((rec) => {
    const f = rec.fields ?? {};
    const catalogItemIds = asLinkedRecordIds(f["Catalog Item"]);
    const parentIds = asLinkedRecordIds(f["Parent Item"]);
    const childOverridesRaw = (f["Child Overrides"] as string) ?? null;
    let childOverrides: ChildOverridesData | null = null;
    if (childOverridesRaw?.trim()) {
      try {
        const parsed = JSON.parse(childOverridesRaw) as ChildOverridesData;
        if (parsed && typeof parsed === "object") {
          const rawOverrides = parsed.overrides && typeof parsed.overrides === "object" ? parsed.overrides : {};
          const overrides: Record<string, ChildOverride> = {};
          for (const [key, val] of Object.entries(rawOverrides)) {
            if (key.startsWith("rec") && val && typeof val === "object") {
              overrides[key] = { enabled: val.enabled, label: val.label };
            }
          }
          childOverrides = {
            overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
            added: Array.isArray(parsed.added) ? parsed.added : undefined,
          };
          console.log("[ChildOverrides] Loaded", { recordId: rec.id, overrides: childOverrides.overrides, added: childOverrides.added });
        }
      } catch {
        // ignore invalid JSON
      }
    }
    return {
      id: rec.id,
      section: (f["Section"] as string) ?? "",
      sortOrder: (f["Sort Order"] as number) ?? 0,
      catalogItemId: catalogItemIds[0] ?? null,
      displayName: (f["Display Name"] as string) ?? null,
      customText: (f["Custom Text"] as string) ?? null,
      sauceOverride: (f["Sauce Override"] as string) ?? null,
      packOutNotes: (f["Pack-Out Notes"] as string) ?? null,
      parentItemId: parentIds[0] ?? null,
      childOverrides,
    };
  });
}

export type CreateEventMenuRowParams = {
  eventId: string;
  section: string;
  catalogItemId: string;
  sortOrder: number;
};

/** Create one record in Event Menu (SHADOW SYSTEM). */
async function createRecord(
  _tableName: string,
  fields: Record<string, unknown>
): Promise<{ id: string } | AirtableErrorResult> {
  const baseIdResult = getBaseId();
  const apiKeyResult = getApiKey();
  if (isErrorResult(baseIdResult) || isErrorResult(apiKeyResult)) {
    return baseIdResult as AirtableErrorResult;
  }
  const tableIdOrName = getEventMenuShadowTable();
  const data = await airtableFetch<{ records?: Array<{ id: string }> }>(
    `/${tableIdOrName}`,
    { method: "POST", body: JSON.stringify({ records: [{ fields }] }) }
  );
  if (isErrorResult(data)) {
    console.error("[Event Menu] createRecord failed", data);
    return data;
  }
  const rec = (data as { records?: Array<{ id: string }> }).records?.[0];
  if (rec) {
    console.log("[Event Menu] createRecord OK", { recordId: rec.id });
  }
  return rec ? { id: rec.id } : { error: true, message: "No record returned" };
}

/**
 * Creates one record in the Event Menu table (shadow system).
 * Signature: createEventMenuRow(eventId, section, catalogItemId)
 * CRITICAL: Event and Catalog Item are linked records → must be arrays of record IDs.
 */
export async function createEventMenuRow(
  eventId: string,
  section: string,
  catalogItemId: string
): Promise<{ id: string } | AirtableErrorResult> {
  const itemId = catalogItemId;
  const fields = {
    Event: [eventId] as string[],
    Section: section,
    "Catalog Item": [itemId] as string[],
    "Sort Order": 1,
    "Line Type": "Catalog",
    Mode: "DEFAULT",
  };
  console.log("CREATING ROW:", { eventId, section, itemId });
  return createRecord("Event Menu (SHADOW SYSTEM)", fields);
}

/**
 * Clones all Event Menu shadow rows from one event to another.
 * Copies section, catalog item, sort order, custom text, sauce override, pack-out notes, and child overrides.
 */
export async function cloneEventMenuShadowRowsFromEvent(
  sourceEventId: string,
  targetEventId: string
): Promise<{ success: true } | AirtableErrorResult> {
  const rows = await loadEventMenuRows(sourceEventId);
  if (isErrorResult(rows)) return rows;
  if (rows.length === 0) return { success: true };

  for (const row of rows) {
    if (!row.catalogItemId?.startsWith("rec")) continue;
    const fields: Record<string, unknown> = {
      Event: [targetEventId],
      Section: row.section,
      "Catalog Item": [row.catalogItemId],
      "Sort Order": row.sortOrder,
      "Line Type": "Catalog",
      Mode: "DEFAULT",
    };
    if (row.customText) fields["Custom Text"] = row.customText;
    if (row.sauceOverride) fields["Sauce Override"] = row.sauceOverride;
    if (row.packOutNotes) fields["Pack-Out Notes"] = row.packOutNotes;
    if (row.childOverrides) fields["Child Overrides"] = JSON.stringify(row.childOverrides);
    if (row.parentItemId) fields["Parent Item"] = [row.parentItemId];
    const result = await createRecord("Event Menu (SHADOW SYSTEM)", fields);
    if (isErrorResult(result)) return result;
  }
  return { success: true };
}

/**
 * Deletes one record from Event Menu (SHADOW SYSTEM). Does NOT touch Events or Menu Items.
 */
export async function deleteEventMenuRow(
  recordId: string
): Promise<{ success: true } | AirtableErrorResult> {
  const baseIdResult = getBaseId();
  const apiKeyResult = getApiKey();
  if (isErrorResult(baseIdResult) || isErrorResult(apiKeyResult)) {
    return baseIdResult as AirtableErrorResult;
  }
  const tableIdOrName = getEventMenuShadowTable();
  const data = await airtableFetch<{ deleted?: boolean; id?: string }>(
    `/${tableIdOrName}/${recordId}`,
    { method: "DELETE" }
  );
  if (isErrorResult(data)) return data;
  return { success: true };
}

export type UpdateEventMenuRowPatch = {
  customText?: string | null;
  sauceOverride?: string | null;
  packOutNotes?: string | null;
  childOverrides?: ChildOverridesData | null;
};

/**
 * Updates one record in Event Menu (SHADOW SYSTEM). Only updates the given fields. Does NOT touch Events or Menu Items.
 */
export async function updateEventMenuRow(
  recordId: string,
  patch: UpdateEventMenuRowPatch
): Promise<{ success: true } | AirtableErrorResult> {
  const baseIdResult = getBaseId();
  const apiKeyResult = getApiKey();
  if (isErrorResult(baseIdResult) || isErrorResult(apiKeyResult)) {
    return baseIdResult as AirtableErrorResult;
  }
  const fields: Record<string, unknown> = {};
  if (patch.customText !== undefined) fields["Custom Text"] = patch.customText ?? null;
  if (patch.sauceOverride !== undefined) fields["Sauce Override"] = patch.sauceOverride ?? null;
  if (patch.packOutNotes !== undefined) fields["Pack-Out Notes"] = patch.packOutNotes ?? null;
  if (patch.childOverrides !== undefined) {
    const co = patch.childOverrides;
    const hasOverrides = co?.overrides && Object.keys(co.overrides).length > 0;
    const hasAdded = Array.isArray(co?.added) && co.added.length > 0;
    const cleanCo: ChildOverridesData | null =
      hasOverrides || hasAdded
        ? {
            ...(hasOverrides && co?.overrides ? { overrides: co.overrides } : {}),
            ...(hasAdded && co?.added ? { added: co.added } : {}),
          }
        : null;
    const jsonStr = cleanCo ? JSON.stringify(cleanCo) : null;
    console.log("[ChildOverrides] Saving JSON", { recordId: recordId, json: jsonStr });
    fields["Child Overrides"] = jsonStr;
  }
  if (Object.keys(fields).length === 0) {
    console.warn("[Event Menu] updateEventMenuRow: no fields to update, skipping PATCH");
    return { success: true };
  }
  const tableIdOrName = getEventMenuShadowTable();
  const body = JSON.stringify({ records: [{ id: recordId, fields }] });
  console.log("[Event Menu] updateEventMenuRow PATCH", { tableIdOrName, recordId, fields });
  const data = await airtableFetch<{ records?: Array<{ id: string; fields?: Record<string, unknown> }> }>(
    `/${tableIdOrName}`,
    { method: "PATCH", body }
  );
  if (isErrorResult(data)) return data;
  console.log("[Event Menu] updateEventMenuRow OK", { recordId, responseRecords: (data as { records?: unknown[] }).records });
  return { success: true };
}

/** Section → Events field ID (linked record fields only). Room Temp + Room Temp / Display both → ROOM_TEMP_DISPLAY. */
const SECTION_TO_EVENT_FIELD: Record<string, string> = {
  "Passed Appetizers": FIELD_IDS.PASSED_APPETIZERS,
  "Presented Appetizers": FIELD_IDS.PRESENTED_APPETIZERS,
  "Buffet – Metal": FIELD_IDS.BUFFET_METAL,
  "Buffet – China": FIELD_IDS.BUFFET_CHINA,
  Desserts: FIELD_IDS.DESSERTS,
  Deli: FIELD_IDS.FULL_SERVICE_DELI,
  "Room Temp": FIELD_IDS.ROOM_TEMP_DISPLAY,
  "Room Temp / Display": FIELD_IDS.ROOM_TEMP_DISPLAY,
};

/** Deli shadow section → correct Events linked field (delivery/pickup use Deli delivery field). */
async function getSectionToEventFieldMap(
  eventId: string
): Promise<Record<string, string> | AirtableErrorResult> {
  const ev = await loadEvent(eventId);
  if (isErrorResult(ev)) return ev;
  const eventType =
    asSingleSelectName(ev.fields[FIELD_IDS.EVENT_TYPE]) || asString(ev.fields[FIELD_IDS.EVENT_TYPE]);
  const deliField = isDeliveryOrPickup(eventType) ? FIELD_IDS.DELIVERY_DELI : FIELD_IDS.FULL_SERVICE_DELI;
  return {
    ...SECTION_TO_EVENT_FIELD,
    Deli: deliField,
  };
}

/** Optional rows to merge in before sync (avoids race when createEventMenuRow just succeeded and loadEventMenuRows hasn't propagated yet). */
export type SyncShadowInjectedRow = { section: string; catalogItemId: string };

/**
 * Syncs Event Menu (SHADOW SYSTEM) rows to Events record linked fields.
 * ONLY syncs valid top-level menu items — no children, no custom-text-only, no components.
 *
 * RACE GUARD: If loadEventMenuRows returns 0 rows and no injectedRows, skip sync entirely.
 * This prevents overwriting Event menu fields with empty arrays during a mid-save transition
 * (e.g. right after createEventMenuRow before Airtable has propagated the new row).
 *
 * 1. Fetch Event Menu rows for eventId
 * 2. Merge any injectedRows (from a just-created row) to avoid race
 * 3. FILTER: Include ONLY rows where Parent Item is null
 * 4. Group by Section, extract Catalog Item IDs
 * 5. Update Events menu fields — only include fields with data; omit empty to avoid accidental wipe
 */
export async function syncShadowToEvent(
  eventId: string,
  options?: { injectedRows?: SyncShadowInjectedRow[] }
): Promise<{ success: true } | AirtableErrorResult> {
  const sectionToField = await getSectionToEventFieldMap(eventId);
  if (isErrorResult(sectionToField)) return sectionToField;

  const rows = await loadEventMenuRows(eventId);
  if (isErrorResult(rows)) return rows;

  const allRows: EventMenuRow[] = [...rows];

  if (options?.injectedRows?.length) {
    for (const { section, catalogItemId } of options.injectedRows) {
      if (section && catalogItemId?.startsWith("rec")) {
        allRows.push({
          id: "",
          section,
          sortOrder: 0,
          catalogItemId,
          displayName: null,
          customText: null,
          sauceOverride: null,
          packOutNotes: null,
          parentItemId: null,
          childOverrides: null,
        });
      }
    }
  }

  const validSections = new Set(Object.keys(sectionToField));
  const topLevelRows = allRows.filter((row) => {
    if (!validSections.has(row.section)) return false;
    if (row.parentItemId != null) return false;
    if (!row.catalogItemId || !row.catalogItemId.startsWith("rec")) return false;
    return true;
  });

  if (topLevelRows.length === 0) {
    return { success: true };
  }

  const bySection: Record<string, string[]> = {};
  for (const row of topLevelRows) {
    const id = row.catalogItemId!;
    if (!bySection[row.section]) bySection[row.section] = [];
    bySection[row.section].push(id);
  }

  const updates: Record<string, string[]> = {};
  for (const [section, ids] of Object.entries(bySection)) {
    const fieldId = sectionToField[section];
    if (!fieldId || ids.length === 0) continue;
    const unique = [...new Set(ids)];
    updates[fieldId] = unique;
  }

  for (const fieldId of new Set(Object.values(sectionToField))) {
    if (!(fieldId in updates)) {
      updates[fieldId] = [];
    }
  }

  if (Object.keys(updates).length === 0) return { success: true };

  return updateEventMultiple(eventId, updates);
}

// ─── Event Menu Components (SHADOW SYSTEM) ─────────────────────────────────

const EVENT_MENU_COMPONENTS_TABLE_NAME = "Event Menu Components (SHADOW SYSTEM)";

export type EventMenuComponentRecord = {
  id: string;
  eventMenuLineId: string;
  componentItemId: string | null;
  componentName: string | null;
  isRemoved: boolean;
  isAdded: boolean;
};

/**
 * @deprecated DISABLED — Child overrides now live in Event Menu row "Child Overrides" JSON. Do not use.
 */
export async function loadEventMenuComponentsByLineIds(
  _lineIds: string[]
): Promise<EventMenuComponentRecord[] | AirtableErrorResult> {
  console.warn("[Event Menu] loadEventMenuComponentsByLineIds is disabled; use Child Overrides on parent row");
  return [];
}

export type CreateEventMenuComponentParams = {
  eventMenuLineId: string;
  componentItemId?: string | null;
  componentName?: string | null;
  isRemoved: boolean;
  isAdded: boolean;
};

/**
 * @deprecated DISABLED — Child overrides now live in Event Menu row "Child Overrides" JSON. Do not use.
 */
export async function createEventMenuComponent(
  _params: CreateEventMenuComponentParams
): Promise<{ id: string } | AirtableErrorResult> {
  console.warn("[Event Menu] createEventMenuComponent is disabled; use Child Overrides on parent row");
  return { error: true, message: "createEventMenuComponent is disabled; use Child Overrides on parent row" };
}

/**
 * @deprecated DISABLED — Child overrides now live in Event Menu row "Child Overrides" JSON. Do not use.
 */
export async function deleteEventMenuComponentsForLine(
  _eventMenuLineId: string
): Promise<{ success: true } | AirtableErrorResult> {
  console.warn("[Event Menu] deleteEventMenuComponentsForLine is disabled; use Child Overrides on parent row");
  return { success: true };
}
