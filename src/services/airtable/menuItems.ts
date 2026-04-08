import { airtableFetch, getMenuItemsTable, type AirtableErrorResult } from "./client";
import { isErrorResult, asLinkedRecordIds } from "./selectors";
import { cleanDisplayName } from "../../utils/displayName";
import { CATEGORY_MAP } from "../../constants/menuCategories";
import {
  buildMenuLabCategoryFormula,
  buildMenuLabChaferHotBuffetFormula,
  buildMenuLabExecutionOrFormula,
  buildMenuLabSandwichTraysPickerFormula,
  buildMenuSectionOrFormula,
  DELIVERY_INTAKE_SECTIONS,
  getMenuCatalogFieldIds,
  isMenuLabCatalog,
  LEGACY_MENU_ITEMS_TABLE_ID,
  parseExecutionTokensFromCatalogFields,
} from "./menuCatalogConfig";

const MENU_ITEMS_TABLE_ID_DEFAULT = LEGACY_MENU_ITEMS_TABLE_ID;

export interface MenuItemRecord {
  id: string;
  name: string;
  /** Child item names for picker label (e.g. "Pineapple Colada Dipping Sauce" for Coconut Shrimp) */
  childItems?: string[];
}

/** Legacy boxed-lunch box templates: Deli category + "Boxed Lunch" in item name. */
const LEGACY_BOXED_LUNCH_BOX_FORMULA =
  'AND(FIND("Deli/Sandwhiches", {Category}&""), FIND("Boxed Lunch", {Item Name}&""))';

const LEGACY_MENU_NAME_FIELD = "fldW5gfSlHRTl01v1";
const LEGACY_MENU_CHILD_FIELD = "fldIu6qmlUwAEn2W9";

/**
 * Always reads **legacy** Menu Items — same table the shadow "Catalog Item" and boxed-lunch orders use.
 * Use for category pickers, boxed-lunch sandwiches, and box templates regardless of VITE_AIRTABLE_MENU_ITEMS_TABLE.
 */
async function fetchLegacyMenuItemsByFilterFormula(filterByFormula: string): Promise<MenuItemRecord[]> {
  const tableId = MENU_ITEMS_TABLE_ID_DEFAULT;
  const allRecords: Array<{ id: string; fields: Record<string, unknown> }> = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams();
    params.set("filterByFormula", filterByFormula);
    params.set("pageSize", "100");
    params.set("returnFieldsByFieldId", "true");
    params.append("fields[]", LEGACY_MENU_NAME_FIELD);
    params.append("fields[]", LEGACY_MENU_CHILD_FIELD);
    if (offset) params.set("offset", offset);
    const data = await airtableFetch<{
      records?: Array<{ id: string; fields: Record<string, unknown> }>;
      offset?: string;
    }>(`/${tableId}?${params.toString()}`);
    if (isErrorResult(data) || !data?.records) break;
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  const idToName: Record<string, string> = {};
  for (const rec of allRecords) {
    const raw = rec.fields[LEGACY_MENU_NAME_FIELD];
    idToName[rec.id] = cleanDisplayName(typeof raw === "string" ? raw : "") || rec.id;
  }

  const childIdsToFetch = new Set<string>();
  for (const rec of allRecords) {
    for (const cid of asLinkedRecordIds(rec.fields[LEGACY_MENU_CHILD_FIELD]).filter((id) => id.startsWith("rec"))) {
      if (!idToName[cid]) childIdsToFetch.add(cid);
    }
  }
  if (childIdsToFetch.size > 0) {
    const arr = [...childIdsToFetch];
    for (let i = 0; i < arr.length; i += 10) {
      const chunk = arr.slice(i, i + 10);
      const f = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
      const p = new URLSearchParams();
      p.set("filterByFormula", f);
      p.set("returnFieldsByFieldId", "true");
      p.append("fields[]", LEGACY_MENU_NAME_FIELD);
      const d = await airtableFetch<{ records?: Array<{ id: string; fields: Record<string, unknown> }> }>(
        `/${tableId}?${p.toString()}`
      );
      if (!isErrorResult(d) && d?.records) {
        for (const crec of d.records) {
          const raw = crec.fields[LEGACY_MENU_NAME_FIELD];
          idToName[crec.id] = cleanDisplayName(typeof raw === "string" ? raw : "") || crec.id;
        }
      }
    }
  }

  return allRecords.map((rec) => {
    const name = idToName[rec.id] ?? rec.id;
    const childIds = asLinkedRecordIds(rec.fields[LEGACY_MENU_CHILD_FIELD]).filter((id) => id.startsWith("rec"));
    const childItems = childIds.map((cid) => idToName[cid]).filter(Boolean);
    return { id: rec.id, name, childItems: childItems.length > 0 ? childItems : undefined };
  });
}

/** Loads rows from `getMenuItemsTable()` matching `filterByFormula`. Menu_Lab: no Test Status filter. */
async function fetchMenuItemsByFilterFormula(filterByFormula: string): Promise<MenuItemRecord[]> {
  const tableId = getMenuItemsTable() || MENU_ITEMS_TABLE_ID_DEFAULT;
  const ids = getMenuCatalogFieldIds();

  const allRecords: Array<{ id: string; fields: Record<string, unknown> }> = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    params.set("filterByFormula", filterByFormula);
    params.set("pageSize", "100");
    params.set("returnFieldsByFieldId", "true");
    params.append("fields[]", ids.displayLabelFieldId);
    params.append("fields[]", ids.childItemsFieldId);
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
    const nameRaw = rec.fields[ids.displayLabelFieldId];
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
    const childIds = asLinkedRecordIds(rec.fields[ids.childItemsFieldId]).filter((id) =>
      id.startsWith("rec")
    );
    for (const cid of childIds) {
      if (!idToName[cid]) childIdsToFetch.add(cid);
    }
  }

  if (childIdsToFetch.size > 0) {
    const idsFetch = [...childIdsToFetch];
    for (let i = 0; i < idsFetch.length; i += 10) {
      const chunk = idsFetch.slice(i, i + 10);
      const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
      const params = new URLSearchParams();
      params.set("filterByFormula", formula);
      params.set("returnFieldsByFieldId", "true");
      params.append("fields[]", ids.displayLabelFieldId);
      const path = `/${tableId}?${params.toString()}`;
      const childData = await airtableFetch<{
        records?: Array<{ id: string; fields: Record<string, unknown> }>;
        error?: { message?: string };
      }>(path);
      if (!isErrorResult(childData) && childData?.records) {
        for (const rec of childData.records) {
          const nameRaw = rec.fields[ids.displayLabelFieldId];
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
    const childIds = asLinkedRecordIds(rec.fields[ids.childItemsFieldId]).filter((id) =>
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

/** Fetch boxed-lunch box types from **legacy** Menu Items (Deli + name contains Boxed Lunch). */
export async function fetchBoxedLunchBoxMenuItems(): Promise<MenuItemRecord[]> {
  return fetchLegacyMenuItemsByFilterFormula(LEGACY_BOXED_LUNCH_BOX_FORMULA);
}

/** Valid values for the {Box Lunch Type} single-select on Menu Items (fld3QYpCSZaLTU2rg). */
export type BoxLunchTypeValue = "Classic Sandwich" | "Gourmet Sandwich" | "Wrap";

/**
 * Fetch sandwich / wrap rows for the boxed-lunch picker.
 * Always uses **legacy** `{Box Lunch Type}` (Classic Sandwich | Gourmet Sandwich | Wrap).
 * Menu_Lab name-guessing is not used — it mixed wrong items when the catalog pointed at Menu_Lab.
 */
export async function fetchMenuItemsByBoxLunchType(
  boxLunchType: BoxLunchTypeValue
): Promise<MenuItemRecord[]> {
  const VALID: readonly string[] = ["Classic Sandwich", "Gourmet Sandwich", "Wrap"];
  if (!VALID.includes(boxLunchType)) {
    console.warn(`fetchMenuItemsByBoxLunchType: unexpected value "${boxLunchType}" — skipping fetch`);
    return [];
  }
  const escaped = String(boxLunchType).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const filterByFormula = `{Box Lunch Type} = "${escaped}"`;
  return fetchLegacyMenuItemsByFilterFormula(filterByFormula);
}

/** Sentinel: cold display picker — each item carries `routeTargetField` (buffetChina | roomTempDisplay | desserts). */
export const DELIVERY_COLD_DISPLAY_TARGET_FIELD = "__delivery_cold__";

/** Sentinel: client-facing delivery intake — routeTargetField comes from item's Execution Type. */
export const DELIVERY_INTAKE_TARGET_FIELD = "__delivery_intake__";

/** Menu picker types handled by `fetchDeliveryMenuPickerItems` (execution / delivery buckets). */
export function isDeliveryPickerType(pickerType: string): boolean {
  return pickerType.startsWith("delivery_");
}

/** Client-facing delivery intake picker types (delivery_intake_*). */
export function isDeliveryIntakePickerType(pickerType: string): boolean {
  return pickerType.startsWith("delivery_intake_");
}

export type MenuItemRecordWithRoute = MenuItemRecord & {
  routeTargetField: "passedApps" | "presentedApps" | "buffetMetal";
};

export type MenuItemRecordWithTargetField = MenuItemRecord & { routeTargetField?: string };

/** CHAFER HOT / CHAFER READY catalog rows with save lane (metal > presented > passed). */
async function fetchChaferExecutionPickerItems(
  executionTokens: string[]
): Promise<MenuItemRecordWithRoute[]> {
  if (isMenuLabCatalog()) {
    const isChaferHotOnly =
      executionTokens.length === 1 && executionTokens[0] === "CHAFER HOT";
    const formula = isChaferHotOnly
      ? buildMenuLabChaferHotBuffetFormula()
      : buildMenuLabExecutionOrFormula(executionTokens);
    if (formula) {
      const items = await fetchMenuItemsByFilterFormula(formula);
      const [passed, presented, metal] = await Promise.all([
        fetchMenuItemsByCategory("passed"),
        fetchMenuItemsByCategory("presented"),
        fetchMenuItemsByCategory("buffet_metal"),
      ]);
      const metalIds = new Set(metal.map((x) => x.id));
      const presentedIds = new Set(presented.map((x) => x.id));
      const passedIds = new Set(passed.map((x) => x.id));
      return items.map((it) => {
        let route: MenuItemRecordWithRoute["routeTargetField"] = "buffetMetal";
        if (metalIds.has(it.id)) route = "buffetMetal";
        else if (presentedIds.has(it.id)) route = "presentedApps";
        else if (passedIds.has(it.id)) route = "passedApps";
        return { ...it, routeTargetField: route };
      });
    }
  }
  return legacyChaferHotMergeForDelivery();
}

async function legacyChaferHotMergeForDelivery(): Promise<MenuItemRecordWithRoute[]> {
  const [passed, presented, metal] = await Promise.all([
    fetchMenuItemsByCategory("passed"),
    fetchMenuItemsByCategory("presented"),
    fetchMenuItemsByCategory("buffet_metal"),
  ]);
  const byId = new Map<string, MenuItemRecordWithRoute>();
  for (const it of passed) byId.set(it.id, { ...it, routeTargetField: "passedApps" });
  for (const it of presented) byId.set(it.id, { ...it, routeTargetField: "presentedApps" });
  for (const it of metal) byId.set(it.id, { ...it, routeTargetField: "buffetMetal" });
  return [...byId.values()];
}

/** Delivery intake menu pickers (Menu_Lab execution filters + legacy fallbacks). */
export async function fetchDeliveryMenuPickerItems(pickerType: string): Promise<MenuItemRecordWithTargetField[]> {
  if (pickerType.startsWith("delivery_intake_")) {
    const sectionId = pickerType.replace("delivery_intake_", "");
    const section = DELIVERY_INTAKE_SECTIONS.find((s) => s.id === sectionId);
    if (section) return fetchDeliveryIntakeItems(section.menuSectionTags);
    return [];
  }
  if (pickerType === "delivery_chafer_hot") {
    return fetchChaferExecutionPickerItems(["CHAFER HOT"]);
  }
  if (pickerType === "delivery_chafer_ready") {
    return fetchChaferExecutionPickerItems(["CHAFER READY"]);
  }
  if (pickerType === "delivery_ready_display") {
    if (isMenuLabCatalog()) {
      const f = buildMenuLabExecutionOrFormula(["ROOM TEMP", "DISPLAY"]);
      if (f) return fetchMenuItemsByFilterFormula(f);
    }
    return fetchMenuItemsByCategory("room_temp");
  }
  if (pickerType === "delivery_cold_display") {
    return fetchMenuItemsDeliveryColdDisplayWithRoutes();
  }
  if (pickerType === "delivery_bulk_sides") {
    if (isMenuLabCatalog()) {
      const f = buildMenuLabExecutionOrFormula(["BULK SIDES"]);
      if (f) return fetchMenuItemsByFilterFormula(f);
    }
    return fetchMenuItemsByCategory("buffet_china");
  }
  if (pickerType === "delivery_individual_wrapped") {
    if (isMenuLabCatalog()) {
      const f = buildMenuLabExecutionOrFormula(["INDIVIDUAL PACKS"]);
      if (f) return fetchMenuItemsByFilterFormula(f);
    }
    return [];
  }
  if (pickerType === "delivery_sandwich_trays") {
    if (isMenuLabCatalog()) {
      const f = buildMenuLabSandwichTraysPickerFormula();
      if (f) return fetchMenuItemsByFilterFormula(f);
    }
    return fetchMenuItemsByCategory("deli");
  }
  return fetchMenuItemsByCategory(pickerType);
}

function routeColdDisplayFromExecution(exec: string[]): "buffetChina" | "roomTempDisplay" | "desserts" {
  const u = exec.map((s) => s.toUpperCase());
  if (u.some((s) => s.includes("DESSERTS"))) return "desserts";
  if (u.some((s) => s.includes("ROOM TEMP"))) return "roomTempDisplay";
  return "buffetChina";
}

async function fetchMenuItemsDeliveryColdDisplayWithRoutes(): Promise<MenuItemRecordWithTargetField[]> {
  if (isMenuLabCatalog()) {
    const formula = buildMenuLabExecutionOrFormula(["COLD DISPLAY", "DESSERTS", "ROOM TEMP"]);
    if (!formula) return [];
    const tableId = getMenuItemsTable() || MENU_ITEMS_TABLE_ID_DEFAULT;
    const ids = getMenuCatalogFieldIds();
    const allRecords: Array<{ id: string; fields: Record<string, unknown> }> = [];
    let offset: string | undefined;
    do {
      const params = new URLSearchParams();
      params.set("filterByFormula", formula);
      params.set("pageSize", "100");
      params.set("returnFieldsByFieldId", "true");
      params.append("fields[]", ids.displayLabelFieldId);
      params.append("fields[]", ids.childItemsFieldId);
      if (ids.executionTypeFieldId) params.append("fields[]", ids.executionTypeFieldId);
      if (offset) params.set("offset", offset);
      const data = await airtableFetch<{
        records?: Array<{ id: string; fields: Record<string, unknown> }>;
        offset?: string;
      }>(`/${tableId}?${params.toString()}`);
      if (isErrorResult(data) || !data?.records) break;
      allRecords.push(...data.records);
      offset = data.offset;
    } while (offset);

    const idToName: Record<string, string> = {};
    for (const rec of allRecords) {
      const nameRaw = rec.fields[ids.displayLabelFieldId];
      const name =
        typeof nameRaw === "string"
          ? nameRaw
          : nameRaw && typeof nameRaw === "object" && "name" in nameRaw
            ? String((nameRaw as { name: string }).name)
            : rec.id;
      idToName[rec.id] = cleanDisplayName(name || "") || rec.id;
    }

    return allRecords.map((rec) => {
      const ex = parseExecutionTokensFromCatalogFields(rec.fields ?? {}, ids);
      const route = routeColdDisplayFromExecution(ex);
      const childIds = asLinkedRecordIds(rec.fields[ids.childItemsFieldId]).filter((id) => id.startsWith("rec"));
      const childItems = childIds.map((cid) => idToName[cid]).filter(Boolean);
      const nameRaw = rec.fields[ids.displayLabelFieldId];
      const name =
        typeof nameRaw === "string"
          ? nameRaw
          : nameRaw && typeof nameRaw === "object" && "name" in nameRaw
            ? String((nameRaw as { name: string }).name)
            : rec.id;
      return {
        id: rec.id,
        name: cleanDisplayName(name || "") || rec.id,
        childItems: childItems.length > 0 ? childItems : undefined,
        routeTargetField: route,
      };
    });
  }

  const [china, room, dess] = await Promise.all([
    fetchMenuItemsByCategory("buffet_china"),
    fetchMenuItemsByCategory("room_temp"),
    fetchMenuItemsByCategory("desserts"),
  ]);
  const out: MenuItemRecordWithTargetField[] = [
    ...china.map((it) => ({ ...it, routeTargetField: "buffetChina" as const })),
    ...room.map((it) => ({ ...it, routeTargetField: "roomTempDisplay" as const })),
    ...dess.map((it) => ({ ...it, routeTargetField: "desserts" as const })),
  ];
  const seen = new Set<string>();
  return out.filter((it) => (seen.has(it.id) ? false : (seen.add(it.id), true)));
}

/**
 * Auto-route: given Execution Type tokens from a catalog item, determine which
 * Events-table linked field (targetField) the shadow row should be saved to.
 * Priority order prevents one item from landing in multiple lanes.
 */
export function routeTargetFieldFromExecutionTokens(tokens: string[]): string {
  const u = tokens.map((t) => t.toUpperCase());
  if (u.some((t) => t.includes("CHAFER HOT") || t.includes("CHAFER READY"))) return "buffetMetal";
  if (u.some((t) => t.includes("INDIVIDUAL PACKS"))) return "deliveryDeli";
  if (u.some((t) => t.includes("DESSERTS"))) return "desserts";
  if (u.some((t) => t.includes("ROOM TEMP"))) return "roomTempDisplay";
  if (u.some((t) => t.includes("COLD DISPLAY"))) return "buffetChina";
  if (u.some((t) => t.includes("BULK SIDES"))) return "buffetChina";
  if (u.some((t) => t.includes("DELI"))) return "deliveryDeli";
  return "buffetMetal";
}

/**
 * Fetch delivery intake items by Menu Section tags.
 * Each returned item includes `routeTargetField` derived from its Execution Type,
 * and `menuSectionTags` for optional sub-grouping in the picker UI.
 */
export async function fetchDeliveryIntakeItems(
  menuSectionTags: readonly string[]
): Promise<MenuItemRecordWithTargetField[]> {
  if (!isMenuLabCatalog()) return [];
  const formula = buildMenuSectionOrFormula(menuSectionTags);
  if (!formula) return [];

  const tableId = getMenuItemsTable() || MENU_ITEMS_TABLE_ID_DEFAULT;
  const ids = getMenuCatalogFieldIds();
  const allRecords: Array<{ id: string; fields: Record<string, unknown> }> = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    params.set("filterByFormula", formula);
    params.set("pageSize", "100");
    params.set("returnFieldsByFieldId", "true");
    params.append("fields[]", ids.displayLabelFieldId);
    params.append("fields[]", ids.childItemsFieldId);
    if (ids.executionTypeFieldId) params.append("fields[]", ids.executionTypeFieldId);
    if (ids.menuSectionFieldId) params.append("fields[]", ids.menuSectionFieldId);
    if (ids.parentItemFieldId) params.append("fields[]", ids.parentItemFieldId);
    if (offset) params.set("offset", offset);

    const data = await airtableFetch<{
      records?: Array<{ id: string; fields: Record<string, unknown> }>;
      offset?: string;
    }>(`/${tableId}?${params.toString()}`);
    if (isErrorResult(data) || !data?.records) break;
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  // Exclude child-only items (those with a Parent Item set) from the picker
  const parentOnly = ids.parentItemFieldId
    ? allRecords.filter((rec) => {
        const parentLinks = asLinkedRecordIds(rec.fields[ids.parentItemFieldId!]);
        return parentLinks.length === 0;
      })
    : allRecords;

  const idToName: Record<string, string> = {};
  for (const rec of parentOnly) {
    const nameRaw = rec.fields[ids.displayLabelFieldId];
    const name =
      typeof nameRaw === "string"
        ? nameRaw
        : nameRaw && typeof nameRaw === "object" && "name" in nameRaw
          ? String((nameRaw as { name: string }).name)
          : rec.id;
    idToName[rec.id] = cleanDisplayName(name || "") || rec.id;
  }

  const childIdsToFetch = new Set<string>();
  for (const rec of parentOnly) {
    const childIds = asLinkedRecordIds(rec.fields[ids.childItemsFieldId]).filter((id) => id.startsWith("rec"));
    for (const cid of childIds) {
      if (!idToName[cid]) childIdsToFetch.add(cid);
    }
  }
  if (childIdsToFetch.size > 0) {
    const idsArr = [...childIdsToFetch];
    for (let i = 0; i < idsArr.length; i += 10) {
      const chunk = idsArr.slice(i, i + 10);
      const f = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
      const params = new URLSearchParams();
      params.set("filterByFormula", f);
      params.set("returnFieldsByFieldId", "true");
      params.append("fields[]", ids.displayLabelFieldId);
      const childData = await airtableFetch<{
        records?: Array<{ id: string; fields: Record<string, unknown> }>;
      }>(`/${tableId}?${params.toString()}`);
      if (!isErrorResult(childData) && childData?.records) {
        for (const rec of childData.records) {
          const nameRaw = rec.fields[ids.displayLabelFieldId];
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

  // Menu_Lab IDs can't be saved to Events linked fields (which point to the legacy table).
  // Resolve each item name to its legacy table record ID so the shadow/event save works.
  const legacyTableId = MENU_ITEMS_TABLE_ID_DEFAULT;
  const legacyCfg = { displayLabelFieldId: "fldW5gfSlHRTl01v1", childItemsFieldId: "fldIu6qmlUwAEn2W9" };
  const parentNames = parentOnly.map((rec) => idToName[rec.id] ?? "").filter(Boolean);
  const nameToLegacyId: Record<string, string> = {};
  const legacyChildNames: Record<string, string[]> = {};

  if (parentNames.length > 0) {
    for (let i = 0; i < parentNames.length; i += 5) {
      const chunk = parentNames.slice(i, i + 5);
      const parts = chunk.map((n) => `{Item Name}="${n.replace(/"/g, '\\"')}"`);
      const f = parts.length === 1 ? parts[0] : `OR(${parts.join(",")})`;
      const p = new URLSearchParams();
      p.set("filterByFormula", f);
      p.set("returnFieldsByFieldId", "true");
      p.set("pageSize", "100");
      p.append("fields[]", legacyCfg.displayLabelFieldId);
      p.append("fields[]", legacyCfg.childItemsFieldId);
      const legData = await airtableFetch<{
        records?: Array<{ id: string; fields: Record<string, unknown> }>;
      }>(`/${legacyTableId}?${p.toString()}`);
      if (!isErrorResult(legData) && legData?.records) {
        for (const rec of legData.records) {
          const rawName = rec.fields[legacyCfg.displayLabelFieldId];
          const n = typeof rawName === "string" ? rawName.trim() : "";
          if (n) {
            nameToLegacyId[n.toLowerCase()] = rec.id;
            const cids = asLinkedRecordIds(rec.fields[legacyCfg.childItemsFieldId]).filter((x) => x.startsWith("rec"));
            if (cids.length > 0) legacyChildNames[rec.id] = cids;
          }
        }
      }
    }

    // Fetch child names from legacy table for display
    const legacyChildIdsToFetch = new Set<string>();
    for (const cids of Object.values(legacyChildNames)) {
      for (const cid of cids) legacyChildIdsToFetch.add(cid);
    }
    const legacyIdToName: Record<string, string> = {};
    if (legacyChildIdsToFetch.size > 0) {
      const arr = [...legacyChildIdsToFetch];
      for (let i = 0; i < arr.length; i += 10) {
        const chunk = arr.slice(i, i + 10);
        const f = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
        const p = new URLSearchParams();
        p.set("filterByFormula", f);
        p.set("returnFieldsByFieldId", "true");
        p.append("fields[]", legacyCfg.displayLabelFieldId);
        const d = await airtableFetch<{ records?: Array<{ id: string; fields: Record<string, unknown> }> }>(
          `/${legacyTableId}?${p.toString()}`
        );
        if (!isErrorResult(d) && d?.records) {
          for (const rec of d.records) {
            const rawN = rec.fields[legacyCfg.displayLabelFieldId];
            legacyIdToName[rec.id] = typeof rawN === "string" ? rawN.trim() : rec.id;
          }
        }
      }
    }

    const result: MenuItemRecordWithTargetField[] = [];
    for (const rec of parentOnly) {
      const menuLabName = idToName[rec.id] ?? "";
      const legacyId = nameToLegacyId[menuLabName.toLowerCase()];
      if (!legacyId) continue;
      const execTokens = parseExecutionTokensFromCatalogFields(rec.fields ?? {}, ids);
      const route = routeTargetFieldFromExecutionTokens(execTokens);
      const legChildIds = legacyChildNames[legacyId] ?? [];
      const childItems = legChildIds.map((cid) => legacyIdToName[cid]).filter(Boolean);
      result.push({
        id: legacyId,
        name: menuLabName,
        childItems: childItems.length > 0 ? childItems : undefined,
        routeTargetField: route,
      });
    }
    return result;
  }

  return parentOnly.map((rec) => {
    const name = idToName[rec.id] ?? rec.id;
    const execTokens = parseExecutionTokensFromCatalogFields(rec.fields ?? {}, ids);
    const route = routeTargetFieldFromExecutionTokens(execTokens);
    return { id: rec.id, name, routeTargetField: route };
  });
}

/** Menu_Lab: execution tokens from catalog rows (for delivery print / intake grouping).
 *  Handles legacy IDs by resolving names through the legacy table then matching in Menu_Lab. */
export async function fetchExecutionTokensByMenuItemIds(ids: string[]): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  if (!isMenuLabCatalog() || ids.length === 0) return out;
  const cfg = getMenuCatalogFieldIds();
  if (!cfg.executionTypeFieldId) return out;
  const menuLabTable = getMenuItemsTable() || MENU_ITEMS_TABLE_ID_DEFAULT;
  const clean = [...new Set(ids.filter((id) => id?.startsWith("rec")))];

  // 1. Try Menu_Lab directly (works for Menu_Lab-native IDs)
  for (let i = 0; i < clean.length; i += 10) {
    const chunk = clean.slice(i, i + 10);
    const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
    const params = new URLSearchParams();
    params.set("filterByFormula", formula);
    params.set("returnFieldsByFieldId", "true");
    params.append("fields[]", cfg.executionTypeFieldId);
    const data = await airtableFetch<{
      records?: Array<{ id: string; fields: Record<string, unknown> }>;
    }>(`/${menuLabTable}?${params.toString()}`);
    if (isErrorResult(data) || !data?.records) continue;
    for (const rec of data.records) {
      out[rec.id] = parseExecutionTokensFromCatalogFields(rec.fields ?? {}, cfg);
    }
  }

  // 2. For IDs not found in Menu_Lab (legacy IDs), resolve via name lookup
  const missing = clean.filter((id) => !out[id]);
  if (missing.length > 0 && menuLabTable !== MENU_ITEMS_TABLE_ID_DEFAULT) {
    const legacyLabelField = "fldW5gfSlHRTl01v1";
    const legacyIdToName: Record<string, string> = {};

    for (let i = 0; i < missing.length; i += 10) {
      const chunk = missing.slice(i, i + 10);
      const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
      const params = new URLSearchParams();
      params.set("filterByFormula", formula);
      params.set("returnFieldsByFieldId", "true");
      params.append("fields[]", legacyLabelField);
      const data = await airtableFetch<{
        records?: Array<{ id: string; fields: Record<string, unknown> }>;
      }>(`/${MENU_ITEMS_TABLE_ID_DEFAULT}?${params.toString()}`);
      if (isErrorResult(data) || !data?.records) continue;
      for (const rec of data.records) {
        const name = String(rec.fields[legacyLabelField] ?? "").trim();
        if (name) legacyIdToName[rec.id] = name;
      }
    }

    const namesToFind = Object.values(legacyIdToName);
    if (namesToFind.length > 0) {
      const nameToLegacyIds: Record<string, string[]> = {};
      for (const [lid, n] of Object.entries(legacyIdToName)) {
        const key = n.toLowerCase();
        (nameToLegacyIds[key] ??= []).push(lid);
      }

      for (let i = 0; i < namesToFind.length; i += 10) {
        const chunk = namesToFind.slice(i, i + 10);
        const orParts = chunk.map((n) => {
          const escaped = n.replace(/"/g, '\\"');
          return `{${cfg.displayLabelFieldId}}="${escaped}"`;
        });
        const formula = `OR(${orParts.join(",")})`;
        const params = new URLSearchParams();
        params.set("filterByFormula", formula);
        params.set("returnFieldsByFieldId", "true");
        params.append("fields[]", cfg.executionTypeFieldId);
        params.append("fields[]", cfg.displayLabelFieldId);
        const data = await airtableFetch<{
          records?: Array<{ id: string; fields: Record<string, unknown> }>;
        }>(`/${menuLabTable}?${params.toString()}`);
        if (isErrorResult(data) || !data?.records) continue;
        for (const rec of data.records) {
          const labName = String(rec.fields[cfg.displayLabelFieldId] ?? "").trim().toLowerCase();
          const tokens = parseExecutionTokensFromCatalogFields(rec.fields ?? {}, cfg);
          const legIds = nameToLegacyIds[labName] ?? [];
          for (const lid of legIds) {
            out[lid] = tokens;
          }
        }
      }
    }
  }

  return out;
}

/** Full-service picker: legacy Category or Menu_Lab display+execution (see MENU_LAB_PICKER_TAGS). */
/**
 * Full-service picker: always queries the LEGACY table by Category field.
 * The shadow table's "Catalog Item" linked field points to the legacy table,
 * so pickers must return legacy record IDs — never Menu_Lab IDs.
 */
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
  return fetchLegacyMenuItemsByFilterFormula(filterByFormula);
}

/** Fetch menu item display names by record IDs. Returns id -> name. Tries configured table first, then legacy fallback. */
export async function fetchMenuItemNamesByIds(
  ids: string[]
): Promise<Record<string, string>> {
  const configuredTable = getMenuItemsTable() || MENU_ITEMS_TABLE_ID_DEFAULT;
  const fieldIds = getMenuCatalogFieldIds();
  const result: Record<string, string> = {};
  if (ids.length === 0) return result;
  const cleanIds = ids.filter((id) => id && id.startsWith("rec"));

  const fetchFromTable = async (tableId: string, labelFieldId: string, idsToFetch: string[]) => {
    for (let i = 0; i < idsToFetch.length; i += 10) {
      const chunk = idsToFetch.slice(i, i + 10);
      const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
      const params = new URLSearchParams();
      params.set("filterByFormula", formula);
      params.set("returnFieldsByFieldId", "true");
      params.append("fields[]", labelFieldId);
      const path = `/${tableId}?${params.toString()}`;
      const data = await airtableFetch<{
        records?: Array<{ id: string; fields: Record<string, unknown> }>;
        error?: { message?: string };
      }>(path);
      if (isErrorResult(data) || !data?.records) continue;
      for (const rec of data.records) {
        const nameRaw = rec.fields[labelFieldId];
        const name =
          typeof nameRaw === "string"
            ? nameRaw
            : nameRaw && typeof nameRaw === "object" && "name" in nameRaw
              ? String((nameRaw as { name: string }).name)
              : rec.id;
        result[rec.id] = cleanDisplayName(name || "") || rec.id;
      }
    }
  };

  await fetchFromTable(configuredTable, fieldIds.displayLabelFieldId, cleanIds);

  // Fallback: try legacy table for any IDs not found in the configured table
  if (configuredTable !== MENU_ITEMS_TABLE_ID_DEFAULT) {
    const missing = cleanIds.filter((id) => !result[id]);
    if (missing.length > 0) {
      await fetchFromTable(MENU_ITEMS_TABLE_ID_DEFAULT, "fldW5gfSlHRTl01v1", missing);
    }
  }

  return result;
}

/** Fetch child items (id + name) for a catalog menu item from its Child Items field. Does NOT modify catalog rows. */
export async function fetchMenuItemChildren(
  catalogItemId: string
): Promise<{ id: string; name: string }[] | AirtableErrorResult> {
  if (!catalogItemId) return [];
  const configuredTable = getMenuItemsTable() || MENU_ITEMS_TABLE_ID_DEFAULT;
  const ids = getMenuCatalogFieldIds();
  const legacyIds = { displayLabelFieldId: "fldW5gfSlHRTl01v1", childItemsFieldId: "fldIu6qmlUwAEn2W9" };
  const legacyFieldBundle = { ...ids, displayLabelFieldId: legacyIds.displayLabelFieldId, childItemsFieldId: legacyIds.childItemsFieldId };

  /**
   * Event Menu "Catalog Item" links to **legacy** rows. Child Items (sauces, dessert components) are authored on legacy.
   * Menu_Lab copies often have empty Child Items — querying Menu_Lab first returned [] and hid children (e.g. dessert displays).
   * Order: legacy first when both exist; if a row has no linked children, try the next table.
   */
  const tablesToTry =
    configuredTable !== MENU_ITEMS_TABLE_ID_DEFAULT
      ? [
          { tableId: MENU_ITEMS_TABLE_ID_DEFAULT, fields: legacyFieldBundle },
          { tableId: configuredTable, fields: ids },
        ]
      : [{ tableId: configuredTable, fields: legacyFieldBundle }];

  let catalogRecId: string | null = catalogItemId.startsWith("rec") ? catalogItemId : null;
  let foundFields: Record<string, unknown> | null = null;
  let foundFieldConfig = ids;

  function childFieldHasLinks(fields: Record<string, unknown>, childFieldId: string): boolean {
    const raw = fields[childFieldId];
    if (Array.isArray(raw)) return raw.length > 0;
    return raw != null && raw !== "";
  }

  for (let ti = 0; ti < tablesToTry.length; ti++) {
    const { tableId, fields } = tablesToTry[ti];
    let recId = catalogRecId;
    if (!recId) {
      const escaped = String(catalogItemId).replace(/"/g, '\\"');
      const params = new URLSearchParams();
      const formula = `FIND("${escaped}", {${fields.descriptionNameFieldName ?? "Item Name"}})`;
      params.set("filterByFormula", formula);
      params.set("maxRecords", "1");
      const data = await airtableFetch<{
        records?: Array<{ id: string; fields: Record<string, unknown> }>;
      }>(`/${tableId}?${params.toString()}`);
      if (!isErrorResult(data) && data?.records?.[0]) recId = data.records[0].id;
    }
    if (!recId) continue;

    const listParams = new URLSearchParams();
    listParams.set("filterByFormula", `RECORD_ID()='${recId}'`);
    listParams.set("maxRecords", "1");
    listParams.set("returnFieldsByFieldId", "true");
    listParams.append("fields[]", fields.childItemsFieldId);
    listParams.append("fields[]", fields.displayLabelFieldId);
    const data = await airtableFetch<{
      records?: Array<{ id: string; fields: Record<string, unknown> }>;
    }>(`/${tableId}?${listParams.toString()}`);
    if (!isErrorResult(data) && data?.records?.[0]) {
      const candidate = data.records[0].fields;
      const hasLinks = childFieldHasLinks(candidate, fields.childItemsFieldId);
      foundFields = candidate;
      foundFieldConfig = fields;
      if (hasLinks || ti === tablesToTry.length - 1) break;
    }
  }

  if (!foundFields) return [];
  const raw = foundFields[foundFieldConfig.childItemsFieldId];

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
    pushItem(raw);
  }

  if (childValues.length === 0) return [];

  const recChildIds = childValues.map((c) => c.id).filter((x): x is string => typeof x === "string" && x.startsWith("rec"));
  const namesById = recChildIds.length ? await fetchMenuItemNamesByIds(recChildIds) : {};

  return childValues.map((c) => {
    const rid = c.id;
    if (rid && rid.startsWith("rec")) {
      return { id: rid, name: namesById[rid] ?? c.name };
    }
    return { id: c.name, name: c.name };
  });
}

/** Vessel type values matching Airtable single-select options in legacy Menu Items table */
export const VESSEL_TYPE_VALUES = {
  METAL_HOT: "Metal – Hot",
  CHINA_COLD: "China – Cold / Display",
  CHINA_ROOM_TEMP: "China – Room Temp",
} as const;

/**
 * Patch the Vessel Type field on a Menu Items record (legacy only).
 * Menu_Lab has no Vessel Type — no-op success so intake does not error.
 */
export async function updateMenuItemVesselType(
  menuItemId: string,
  vesselType: string
): Promise<{ success: true } | { error: true; message: string }> {
  const ids = getMenuCatalogFieldIds();
  if (!ids.vesselTypeFieldId) {
    return { success: true };
  }
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
              [ids.vesselTypeFieldId]: vesselType,
            },
          },
        ],
      }),
    }
  );

  if (isErrorResult(data)) {
    console.warn(`⚠️ updateMenuItemVesselType failed for ${menuItemId}:`, data);
    return { error: true, message: data.message ?? "Airtable error" };
  }
  return { success: true };
}
