/**
 * Spec Engine — Data Fetch Blueprint (Section 2)
 *
 * TABLE 1 — Menu Items: Item Name, Child Items, Category, Service Type
 * TABLE 2 — Master Menu Specs: Spec_Tier_*, Spec_Unit_Type, Spec_Category, Industry_Standard, Spec_Notes
 * TABLE 3 — Events: Guest Count
 *
 * JOIN: Event → Menu Items (linked) → Master Menu Specs (linked from Menu Item)
 */

import { airtableFetch, airtableMetaFetch, getBaseId, getEventsTable, getApiKey } from "../airtable/client";
import type { AirtableListResponse, AirtableRecord, AirtableErrorResult } from "../airtable/client";
import { isErrorResult, asString, asLinkedRecordIds, asNumber } from "../airtable/selectors";
import { FIELD_IDS } from "../airtable/events";
import type { SpecMenuItem } from "./specAlgorithm";
import { getTier, normalizeSpecCategory, normalizeSpecUnitType } from "./specAlgorithm";
import { TIER_TO_AIRTABLE_COLUMN } from "./airtableFields";

// ── Table IDs ──
const MENU_ITEMS_TABLE_ID = "tbl0aN33DGG6R1sPZ";
const MASTER_MENU_SPECS_TABLE_ID = "tblGeCmzJscnocs1T";

// ── Menu Items fields (TABLE 1) ──
const MENU_ITEM_NAME = "fldW5gfSlHRTl01v1"; // Item Name (single line)
const MENU_ITEM_CHILD_ITEMS = "fldIu6qmlUwAEn2W9"; // Child Items (linked)
const MENU_ITEM_CATEGORY = "fldM7lWvjH8S0YNSX"; // Category
const MENU_ITEM_SERVICE_TYPE = "fld2EhDP5GRalZJzQ"; // Service Type

// ── Master Menu Specs fields (TABLE 2) — update IDs when available ──
const SPEC_TIER_0_40 = "Spec_Tier_0_40";
const SPEC_TIER_41_75 = "Spec_Tier_41_75";
const SPEC_TIER_76_125 = "Spec_Tier_76_125";
const SPEC_TIER_126_175 = "Spec_Tier_126_175";
const SPEC_TIER_176_225 = "Spec_Tier_176_225";
const SPEC_TIER_225_PLUS = "Spec_Tier_225_plus";
const SPEC_UNIT_TYPE = "Spec_Unit_Type";
const SPEC_CATEGORY = "Spec_Category";
const INDUSTRY_STANDARD = "Industry_Standard";
const SPEC_NOTES = "Spec_Notes";

/** Resolve Master Menu Specs field IDs by name (Meta API). Cached. */
let cachedSpecFieldIds: Record<string, string> | null = null;

async function getMasterSpecsFieldIds(): Promise<Record<string, string> | AirtableErrorResult> {
  if (cachedSpecFieldIds) return cachedSpecFieldIds;

  if (typeof getBaseId() !== "string" || typeof getApiKey() !== "string") {
    return { error: true, message: "Missing Airtable config" };
  }

  const data = await airtableMetaFetch<{
    tables: Array<{ id: string; name: string; fields: Array<{ id: string; name: string }> }>;
  }>("");

  if (isErrorResult(data)) return data;

  const table = (data as { tables?: Array<{ id: string; name: string; fields: Array<{ id: string; name: string }> }> }).tables?.find(
    (t) => t.id === MASTER_MENU_SPECS_TABLE_ID
  );
  if (!table) {
    return { error: true, message: `Master Menu Specs table ${MASTER_MENU_SPECS_TABLE_ID} not found` };
  }

  const byName: Record<string, string> = {};
  for (const f of table.fields) {
    byName[f.name] = f.id;
  }

  cachedSpecFieldIds = {
    [SPEC_TIER_0_40]: byName["Spec_Tier_0_40"] ?? "",
    [SPEC_TIER_41_75]: byName["Spec_Tier_41_75"] ?? "",
    [SPEC_TIER_76_125]: byName["Spec_Tier_76_125"] ?? "",
    [SPEC_TIER_126_175]: byName["Spec_Tier_126_175"] ?? "",
    [SPEC_TIER_176_225]: byName["Spec_Tier_176_225"] ?? "",
    [SPEC_TIER_225_PLUS]: byName["Spec_Tier_225_plus"] ?? "",
    [SPEC_UNIT_TYPE]: byName["Spec_Unit_Type"] ?? "",
    [SPEC_CATEGORY]: byName["Spec_Category"] ?? "",
    [INDUSTRY_STANDARD]: byName["Industry_Standard"] ?? "",
    [SPEC_NOTES]: byName["Spec_Notes"] ?? "",
  };
  return cachedSpecFieldIds;
}

/** Resolve the field on Master Menu Specs that links to Menu Items. Cached. */
let cachedMenuItemsLinkFieldId: string | null | undefined = undefined;

async function getMenuItemsLinkFieldId(): Promise<string | null> {
  if (cachedMenuItemsLinkFieldId !== undefined) return cachedMenuItemsLinkFieldId;

  const data = await airtableMetaFetch<{
    tables: Array<{ id: string; name: string; fields: Array<{ id: string; name: string; type: string }> }>;
  }>("");

  if (isErrorResult(data)) {
    cachedMenuItemsLinkFieldId = null;
    return null;
  }

  const table = (data as { tables?: Array<{ id: string; fields: Array<{ id: string; name: string; type: string }> }> }).tables?.find(
    (t) => t.id === MASTER_MENU_SPECS_TABLE_ID
  );
  if (!table) {
    cachedMenuItemsLinkFieldId = null;
    return null;
  }

  const linkField = table.fields.find(
    (f) => f.type === "multipleRecordLinks" && /menu\s*item/i.test(f.name)
  );
  cachedMenuItemsLinkFieldId = linkField?.id ?? null;
  return cachedMenuItemsLinkFieldId;
}

/** Extract tier base value from a Master Menu Spec record for given guest count */
function getTierBaseValueFromSpec(
  specFields: Record<string, unknown>,
  guestCount: number,
  fieldIds: Record<string, string>
): number {
  const tier = getTier(guestCount);
  const columnKey = TIER_TO_AIRTABLE_COLUMN[tier];
  const fieldId = fieldIds[columnKey];
  const raw = specFields[fieldId];
  const num = asNumber(raw) ?? (typeof raw === "number" ? raw : 0);
  return Math.max(0, num);
}

export type MenuItemWithMeta = {
  id: string;
  itemName: string;
  childItems: string[];
  category: string;
  serviceType: string;
};

export type SpecDataForEvent = {
  guestCount: number;
  menuItems: MenuItemWithMeta[];
  specMenuItems: SpecMenuItem[];
  errors: string[];
};

/**
 * Fetch all data needed for the Spec Engine for a given event.
 * JOIN: Event (Guest Count + Menu Items) → Menu Items → Master Menu Specs
 */
export async function fetchSpecDataForEvent(eventId: string): Promise<SpecDataForEvent | AirtableErrorResult> {
  const table = getEventsTable();
  if (typeof table !== "string") return table;

  const baseId = getBaseId();
  const apiKey = getApiKey();
  if (typeof baseId !== "string" || typeof apiKey !== "string") {
    return { error: true, message: "Missing Airtable config" };
  }

  const errors: string[] = [];

  // ── STEP 1: Fetch Event (full record — no fields filter to avoid 422 from missing/invalid field IDs) ──
  const eventParams = new URLSearchParams();
  eventParams.set("returnFieldsByFieldId", "true");
  eventParams.set("cellFormat", "json");

  const eventData = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${eventId}?${eventParams.toString()}`
  );

  if (isErrorResult(eventData)) return eventData;

  const fields = eventData.fields;
  const guestCount = asNumber(fields[FIELD_IDS.GUEST_COUNT]) ?? 0;

  // Event links to Menu Items via MENU_ITEMS (TABLE 1), or section fields (Passed Apps, Buffet, Desserts, etc.).
  let menuItemIds = asLinkedRecordIds(fields[FIELD_IDS.MENU_ITEMS]);
  if (menuItemIds.length === 0) {
    const passed = asLinkedRecordIds(fields[FIELD_IDS.PASSED_APPETIZERS]);
    const presented = asLinkedRecordIds(fields[FIELD_IDS.PRESENTED_APPETIZERS]);
    const buffetMetal = asLinkedRecordIds(fields[FIELD_IDS.BUFFET_METAL]);
    const buffetChina = asLinkedRecordIds(fields[FIELD_IDS.BUFFET_CHINA]);
    const desserts = asLinkedRecordIds(fields[FIELD_IDS.DESSERTS]);
    const stations = asLinkedRecordIds(fields[FIELD_IDS.STATIONS]);
    const seen = new Set<string>();
    for (const id of [...passed, ...presented, ...buffetMetal, ...buffetChina, ...desserts, ...stations]) {
      if (id && !seen.has(id)) {
        seen.add(id);
        menuItemIds.push(id);
      }
    }
  }

  if (menuItemIds.length === 0) {
    return {
      guestCount,
      menuItems: [],
      specMenuItems: [],
      errors: ["No menu items linked to this event"],
    };
  }

  // ── STEP 2: Fetch Menu Items (Item Name, Child Items, Category, Service Type) ──
  const menuItemParams = new URLSearchParams();
  menuItemParams.set("returnFieldsByFieldId", "true");
  menuItemParams.append("fields[]", MENU_ITEM_NAME);
  menuItemParams.append("fields[]", MENU_ITEM_CHILD_ITEMS);
  menuItemParams.append("fields[]", MENU_ITEM_CATEGORY);
  menuItemParams.append("fields[]", MENU_ITEM_SERVICE_TYPE);

  const menuItemsById: Record<string, MenuItemWithMeta> = {};
  for (const id of menuItemIds) {
    const rec = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
      `/${MENU_ITEMS_TABLE_ID}/${id}?${menuItemParams.toString()}`
    );
    if (isErrorResult(rec)) {
      errors.push(`Failed to load menu item ${id}`);
      continue;
    }
    const f = rec.fields;
    const nameRaw = f[MENU_ITEM_NAME];
    const name = typeof nameRaw === "string" ? nameRaw : (nameRaw && typeof nameRaw === "object" && "name" in nameRaw ? String((nameRaw as { name?: string }).name) : "") || "Unnamed";
    menuItemsById[id] = {
      id,
      itemName: name,
      childItems: asLinkedRecordIds(f[MENU_ITEM_CHILD_ITEMS]),
      category: asString(f[MENU_ITEM_CATEGORY]),
      serviceType: asString(f[MENU_ITEM_SERVICE_TYPE]),
    };
  }

  // ── STEP 3: Fetch Master Menu Specs ──
  const specFieldIds = await getMasterSpecsFieldIds();
  if (isErrorResult(specFieldIds)) return specFieldIds;

  const menuItemLinkFieldId = await getMenuItemsLinkFieldId();
  const validSpecFields = Object.values(specFieldIds).filter((f) => f.startsWith("fld"));

  // JOIN strategy:
  // A) Event has MENU_ITEM_SPECS: match by index (Event.Menu_Items[i] ↔ Event.Menu_Item_Specs[i])
  // B) Else: Master Menu Specs links to Menu Items — fetch all specs, match by menu item ID
  const specIdsFromEvent = asLinkedRecordIds(fields[FIELD_IDS.MENU_ITEM_SPECS]);

  const specRecords: AirtableRecord<Record<string, unknown>>[] = [];
  const specByMenuItemId: Record<string, AirtableRecord<Record<string, unknown>>> = {};

  if (specIdsFromEvent.length > 0 && specIdsFromEvent.length >= menuItemIds.length) {
    const specParams = new URLSearchParams();
    specParams.set("returnFieldsByFieldId", "true");
    validSpecFields.forEach((fid) => specParams.append("fields[]", fid));
    if (menuItemLinkFieldId) specParams.append("fields[]", menuItemLinkFieldId);

    for (const specId of specIdsFromEvent) {
      const specRec = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
        `/${MASTER_MENU_SPECS_TABLE_ID}/${specId}?${specParams.toString()}`
      );
      if (!isErrorResult(specRec)) {
        specRecords.push(specRec);
      }
    }
  } else {
    const allSpecsParams = new URLSearchParams();
    allSpecsParams.set("maxRecords", "500");
    allSpecsParams.set("returnFieldsByFieldId", "true");
    validSpecFields.forEach((fid) => allSpecsParams.append("fields[]", fid));
    if (menuItemLinkFieldId) allSpecsParams.append("fields[]", menuItemLinkFieldId);

    const allSpecs = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
      `/${MASTER_MENU_SPECS_TABLE_ID}?${allSpecsParams.toString()}`
    );
    if (!isErrorResult(allSpecs)) {
      for (const rec of allSpecs.records) {
        const linkedIds = menuItemLinkFieldId ? asLinkedRecordIds(rec.fields[menuItemLinkFieldId]) : [];
        for (const mid of linkedIds) {
          if (!specByMenuItemId[mid]) specByMenuItemId[mid] = rec;
        }
      }
      specRecords.push(...allSpecs.records);
    }
  }

  // ── STEP 4: JOIN — Match Menu Item to Spec ──
  const specMenuItems: SpecMenuItem[] = [];

  for (let i = 0; i < menuItemIds.length; i++) {
    const menuId = menuItemIds[i];
    const menuMeta = menuItemsById[menuId];
    if (!menuMeta) continue;

    const specRec =
      specByMenuItemId[menuId] ?? specRecords[i] ?? specRecords[0];
    if (!specRec) {
      errors.push(`No spec found for menu item: ${menuMeta.itemName}`);
      specMenuItems.push({
        id: menuId,
        itemName: menuMeta.itemName,
        tierBaseValue: 1,
        specUnitType: "Full Pan",
        specCategory: "Dessert",
        industryStandard: 1,
      });
      continue;
    }

    const sf = specRec.fields;
    const tierBaseValue = getTierBaseValueFromSpec(sf, guestCount, specFieldIds);
    const specUnitType = normalizeSpecUnitType(asString(sf[specFieldIds[SPEC_UNIT_TYPE]]));
    const specCategory = normalizeSpecCategory(asString(sf[specFieldIds[SPEC_CATEGORY]]));
    const industryStandard = asNumber(sf[specFieldIds[INDUSTRY_STANDARD]]) ?? 1;
    const specNotes = asString(sf[specFieldIds[SPEC_NOTES]]);

    specMenuItems.push({
      id: menuId,
      itemName: menuMeta.itemName,
      tierBaseValue,
      specUnitType,
      specCategory,
      industryStandard,
      specNotes: specNotes || undefined,
    });
  }

  return {
    guestCount,
    menuItems: Object.values(menuItemsById),
    specMenuItems,
    errors,
  };
}
