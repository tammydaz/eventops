import { airtableFetch, getMenuItemsTable, getMenuLabTable } from "./client";
import { isErrorResult, asLinkedRecordIds } from "./selectors";
import { cleanDisplayName } from "../../utils/displayName";
import { CATEGORY_MAP } from "../../constants/menuCategories";

const MENU_ITEMS_TABLE_ID_DEFAULT = "tbl0aN33DGG6R1sPZ";
const MENU_ITEMS_DESCRIPTION_NAME_FIELD_ID = "fldQ83gpgOmMxNMQw"; // Description Name/Formula (display label)
/** Field name for filterByFormula (Airtable formulas use names, not IDs) */
const MENU_ITEMS_DESCRIPTION_NAME_FIELD_NAME = "Description Name";
const MENU_ITEMS_CHILD_ITEMS_FIELD_ID = "fldIu6qmlUwAEn2W9"; // Child Items (linked)

export interface MenuItemRecord {
  id: string;
  name: string;
  /** Child item names for picker label (e.g. "Pineapple Colada Dipping Sauce" for Coconut Shrimp) */
  childItems?: string[];
}

/** Boxed-lunch *box templates* in Menu Items: Deli category + "Boxed Lunch" in Item Name (see Airtable base). */
const BOXED_LUNCH_BOX_FILTER_FORMULA =
  'AND(FIND("Deli/Sandwhiches", {Category}&""), FIND("Boxed Lunch", {Item Name}&""))';

async function fetchMenuItemsByFilterFormula(filterByFormula: string): Promise<MenuItemRecord[]> {
  const tableId = getMenuItemsTable() || MENU_ITEMS_TABLE_ID_DEFAULT;

  const allRecords: Array<{ id: string; fields: Record<string, unknown> }> = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    params.set("filterByFormula", filterByFormula);
    params.set("pageSize", "100");
    params.set("returnFieldsByFieldId", "true");
    params.append("fields[]", MENU_ITEMS_DESCRIPTION_NAME_FIELD_ID);
    params.append("fields[]", MENU_ITEMS_CHILD_ITEMS_FIELD_ID);
    if (offset) params.set("offset", offset);

    const path = `/${tableId}?${params.toString()}`;
    const data = await airtableFetch<{
      records?: Array<{ id: string; fields: Record<string, unknown> }>;
      offset?: string;
      error?: { message?: string };
    }>(path);

    if (isErrorResult(data) || !data?.records) {
      break;
    }
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  const idToName: Record<string, string> = {};
  for (const rec of allRecords) {
    const nameRaw = rec.fields[MENU_ITEMS_DESCRIPTION_NAME_FIELD_ID];
    const name =
      typeof nameRaw === "string"
        ? nameRaw
        : nameRaw && typeof nameRaw === "object" && "name" in nameRaw
          ? String((nameRaw as { name: string }).name)
          : rec.id;
    idToName[rec.id] = cleanDisplayName(name || "") || rec.id;
  }

  const childIdsToFetch = new Set<string>();
  for (const rec of allRecords) {
    const childIds = asLinkedRecordIds(rec.fields[MENU_ITEMS_CHILD_ITEMS_FIELD_ID]).filter((id) =>
      id.startsWith("rec")
    );
    for (const cid of childIds) {
      if (!idToName[cid]) childIdsToFetch.add(cid);
    }
  }

  if (childIdsToFetch.size > 0) {
    const ids = [...childIdsToFetch];
    for (let i = 0; i < ids.length; i += 10) {
      const chunk = ids.slice(i, i + 10);
      const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
      const params = new URLSearchParams();
      params.set("filterByFormula", formula);
      params.set("returnFieldsByFieldId", "true");
      params.append("fields[]", MENU_ITEMS_DESCRIPTION_NAME_FIELD_ID);
      const path = `/${tableId}?${params.toString()}`;
      const childData = await airtableFetch<{
        records?: Array<{ id: string; fields: Record<string, unknown> }>;
        error?: { message?: string };
      }>(path);
      if (!isErrorResult(childData) && childData?.records) {
        for (const rec of childData.records) {
          const nameRaw = rec.fields[MENU_ITEMS_DESCRIPTION_NAME_FIELD_ID];
          const name =
            typeof nameRaw === "string"
              ? nameRaw
              : nameRaw && typeof nameRaw === "object" && "name" in nameRaw
                ? String((nameRaw as { name: string }).name)
                : rec.id;
          idToName[rec.id] = cleanDisplayName(name || "") || rec.id;
        }
      }
    }
  }

  return allRecords.map((rec) => {
    const name = idToName[rec.id] ?? rec.id;
    const childIds = asLinkedRecordIds(rec.fields[MENU_ITEMS_CHILD_ITEMS_FIELD_ID]).filter((id) =>
      id.startsWith("rec")
    );
    const childItems = childIds
      .map((cid) => idToName[cid])
      .filter(Boolean);
    return {
      id: rec.id,
      name,
      childItems: childItems.length > 0 ? childItems : undefined,
    };
  });
}

/** Fetch boxed-lunch box types from Menu Items (Airtable templates linked from legacy order items). */
export async function fetchBoxedLunchBoxMenuItems(): Promise<MenuItemRecord[]> {
  return fetchMenuItemsByFilterFormula(BOXED_LUNCH_BOX_FILTER_FORMULA);
}

/** Valid values for the {Box Lunch Type} single-select on Menu Items (fld3QYpCSZaLTU2rg). */
export type BoxLunchTypeValue = "Classic Sandwich" | "Gourmet Sandwich" | "Wrap";

/**
 * Fetch individual sandwich / wrap records tagged with a specific Box Lunch Type.
 * Filters by {Box Lunch Type} field — NOT by {Category} — so this never interferes
 * with the deli-tray picker, which filters by {Category}.
 */
export async function fetchMenuItemsByBoxLunchType(
  boxLunchType: BoxLunchTypeValue
): Promise<MenuItemRecord[]> {
  // Runtime guard: ensure the value is one of the three known enum strings before
  // embedding it in the Airtable formula, preventing accidental injection.
  const VALID: readonly string[] = ["Classic Sandwich", "Gourmet Sandwich", "Wrap"];
  if (!VALID.includes(boxLunchType)) {
    console.warn(`fetchMenuItemsByBoxLunchType: unexpected value "${boxLunchType}" — skipping fetch`);
    return [];
  }
  const escaped = String(boxLunchType).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const filterByFormula = `{Box Lunch Type} = "${escaped}"`;
  return fetchMenuItemsByFilterFormula(filterByFormula);
}

/** Fetch menu items filtered by category key. Uses CATEGORY_MAP to build OR formula for Airtable Category field. */
export async function fetchMenuItemsByCategory(categoryKey: string): Promise<MenuItemRecord[]> {
  const allowedCategories = CATEGORY_MAP[categoryKey as keyof typeof CATEGORY_MAP];
  if (!allowedCategories?.length) {
    return [];
  }

  const orParts = allowedCategories.map((cat) => {
    const escaped = String(cat).replace(/"/g, '\\"');
    return `FIND("${escaped}", {Category})`;
  });
  const filterByFormula = `OR(${orParts.join(",")})`;
  return fetchMenuItemsByFilterFormula(filterByFormula);
}

/** Fetch menu item display names by record IDs. Returns id -> name. */
export async function fetchMenuItemNamesByIds(
  ids: string[]
): Promise<Record<string, string>> {
  const tableId = getMenuItemsTable() || MENU_ITEMS_TABLE_ID_DEFAULT;
  const result: Record<string, string> = {};
  if (ids.length === 0) return result;
  const cleanIds = ids.filter((id) => id && id.startsWith("rec"));
  for (let i = 0; i < cleanIds.length; i += 10) {
    const chunk = cleanIds.slice(i, i + 10);
    const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
    const params = new URLSearchParams();
    params.set("filterByFormula", formula);
    params.set("returnFieldsByFieldId", "true");
    params.append("fields[]", MENU_ITEMS_DESCRIPTION_NAME_FIELD_ID);
    const path = `/${tableId}?${params.toString()}`;
    const data = await airtableFetch<{
      records?: Array<{ id: string; fields: Record<string, unknown> }>;
      error?: { message?: string };
    }>(path);
    if (isErrorResult(data) || !data?.records) continue;
    for (const rec of data.records) {
      const nameRaw = rec.fields[MENU_ITEMS_DESCRIPTION_NAME_FIELD_ID];
      const name =
        typeof nameRaw === "string"
          ? nameRaw
          : nameRaw && typeof nameRaw === "object" && "name" in nameRaw
            ? String((nameRaw as { name: string }).name)
            : rec.id;
      result[rec.id] = cleanDisplayName(name || "") || rec.id;
    }
  }
  return result;
}

/** Fetch child items (id + name) for a catalog menu item from its Child Items field. Does NOT modify Menu Items. */
export async function fetchMenuItemChildren(
  catalogItemId: string
): Promise<{ id: string; name: string }[] | AirtableErrorResult> {
  if (!catalogItemId) return [];
  const tableId = getMenuItemsTable() || MENU_ITEMS_TABLE_ID_DEFAULT;

  // If Airtable returns the linked value as a display name (instead of a record id),
  // resolve it back to the Menu Items record id so we can read its linked Child Items.
  let catalogRecId: string | null = catalogItemId.startsWith("rec") ? catalogItemId : null;
  if (!catalogRecId) {
    const escaped = String(catalogItemId).replace(/"/g, '\\"');
    const params = new URLSearchParams();
    // filterByFormula must use field NAME not field ID
    const formula = `FIND("${escaped}", {${MENU_ITEMS_DESCRIPTION_NAME_FIELD_NAME}})`;
    params.set("filterByFormula", formula);
    params.set("maxRecords", "1");
    const path = `/${tableId}?${params.toString()}`;
    const data = await airtableFetch<{
      records?: Array<{ id: string; fields: Record<string, unknown> }>;
      error?: { message?: string };
    }>(path);
    if (isErrorResult(data) || !data?.records?.[0]) return [];
    catalogRecId = data.records[0].id;
  }

  // Use list GET with RECORD_ID() filter and returnFieldsByFieldId=true (same pattern as BeoPrintPage).
  // Single-record endpoint with fields[] causes 422; list GET avoids that.
  const listParams = new URLSearchParams();
  listParams.set("filterByFormula", `RECORD_ID()='${catalogRecId}'`);
  listParams.set("maxRecords", "1");
  listParams.set("returnFieldsByFieldId", "true");
  listParams.append("fields[]", MENU_ITEMS_CHILD_ITEMS_FIELD_ID);
  listParams.append("fields[]", MENU_ITEMS_DESCRIPTION_NAME_FIELD_ID);
  const data = await airtableFetch<{
    records?: Array<{ id: string; fields: Record<string, unknown> }>;
    error?: { message?: string };
  }>(`/${tableId}?${listParams.toString()}`);
  if (isErrorResult(data) || !data?.records?.[0]) return [];
  const fields = data.records[0].fields;
  const raw = fields[MENU_ITEMS_CHILD_ITEMS_FIELD_ID];
  // Linked field returns array of rec IDs when returnFieldsByFieldId=true

  const childValues: Array<{ id?: string; name: string }> = [];
  const pushItem = (item: unknown) => {
    if (typeof item === "string") {
      childValues.push({ id: item.startsWith("rec") ? item : undefined, name: item });
      return;
    }
    if (!item || typeof item !== "object") return;
    const maybeId = typeof (item as { id?: unknown }).id === "string" ? String((item as { id?: string }).id) : undefined;
    const maybeName = typeof (item as { name?: unknown }).name === "string" ? String((item as { name?: string }).name) : undefined;
    const fallbackName = maybeId ? maybeId : undefined;
    const name = maybeName ?? fallbackName;
    if (name) childValues.push({ id: maybeId, name });
  };

  if (Array.isArray(raw)) {
    raw.forEach(pushItem);
  } else {
    // Linked-record field can be returned as a single value/object depending on Airtable configuration.
    pushItem(raw);
  }

  if (childValues.length === 0) return [];

  const recChildIds = childValues.map((c) => c.id).filter((id): id is string => Boolean(id) && id.startsWith("rec"));
  const namesById = recChildIds.length ? await fetchMenuItemNamesByIds(recChildIds) : {};

  // Preserve ordering from the linked field.
  return childValues.map((c) => {
    if (c.id && c.id.startsWith("rec")) {
      return { id: c.id, name: namesById[c.id] ?? c.name };
    }
    // No record id available; still render it as a component name.
    return { id: c.name, name: c.name };
  });
}

const MENU_ITEMS_VESSEL_TYPE_FIELD_ID = "fldZCnfKzWijIDaeV";

/** Vessel type values matching Airtable single-select options in Menu Items table */
export const VESSEL_TYPE_VALUES = {
  METAL_HOT: "Metal – Hot",
  CHINA_COLD: "China – Cold / Display",
  CHINA_ROOM_TEMP: "China – Room Temp",
} as const;

/**
 * Patch the Vessel Type field on a Menu Items record.
 * Called when a user places an item into a Metal or China section in the intake UI.
 * This does NOT go through the Events table — it patches the Menu Items table directly.
 */
export async function updateMenuItemVesselType(
  menuItemId: string,
  vesselType: string
): Promise<{ success: true } | { error: true; message: string }> {
  const tableId = getMenuItemsTable() || MENU_ITEMS_TABLE_ID_DEFAULT;

  const data = await airtableFetch<{ records?: unknown[]; error?: { message?: string } }>(
    `/${tableId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        records: [
          {
            id: menuItemId,
            fields: {
              [MENU_ITEMS_VESSEL_TYPE_FIELD_ID]: vesselType,
            },
          },
        ],
      }),
    }
  );

  if (isErrorResult(data)) {
    console.warn(`⚠️ updateMenuItemVesselType failed for ${menuItemId}:`, data);
    return data;
  }
  return { success: true };
}

/** One catalog item from Menu_Lab (used in delivery section pickers). */
export interface MenuLabItem {
  id: string;
  name: string;
}

/** Valid Execution Type values in Menu_Lab (multiple-select field fldnP7tCisqdDkaOI). */
const MENU_LAB_VALID_EXECUTION_TYPES: readonly string[] = [
  "CHAFER HOT",
  "CHAFER READY",
  "COLD DISPLAY",
  "INDIVIDUAL PACKS",
  "BULK SIDES",
  "DESSERTS",
  "STATIONS",
  "ROOM TEMP",
];

/**
 * Fetch catalog items from Menu_Lab whose Execution Type includes the given value.
 * Used by DeliverySectionPicker to populate each delivery section.
 */
export async function fetchMenuItemsByExecutionType(
  executionType: string
): Promise<MenuLabItem[]> {
  if (!MENU_LAB_VALID_EXECUTION_TYPES.includes(executionType)) {
    console.warn(`fetchMenuItemsByExecutionType: unexpected value "${executionType}" — skipping fetch`);
    return [];
  }
  const tableId = getMenuLabTable();
  const escaped = executionType.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const filterByFormula = `FIND("${escaped}", ARRAYJOIN({Execution Type})) > 0`;

  const allRecords: Array<{ id: string; fields: Record<string, unknown> }> = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    params.set("filterByFormula", filterByFormula);
    params.set("pageSize", "100");
    params.append("fields[]", "Item Name");
    if (offset) params.set("offset", offset);

    const data = await airtableFetch<{
      records?: Array<{ id: string; fields: Record<string, unknown> }>;
      offset?: string;
      error?: { message?: string };
    }>(`/${tableId}?${params.toString()}`);

    if (isErrorResult(data) || !data?.records) break;
    allRecords.push(...data.records);
    offset = (data as { offset?: string }).offset;
  } while (offset);

  return allRecords.map((rec) => ({
    id: rec.id,
    name: typeof rec.fields["Item Name"] === "string" ? rec.fields["Item Name"] : rec.id,
  }));
}
