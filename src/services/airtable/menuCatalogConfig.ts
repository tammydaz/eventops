/**
 * Menu catalog source: legacy "Menu Items" vs experimental "Menu_Lab" table.
 * Toggle with VITE_AIRTABLE_MENU_ITEMS_TABLE + optional VITE_AIRTABLE_MENU_CATALOG_SCHEMA=menu_lab,
 * or set MENU_ITEMS_TABLE to tbl6gXRT2FPpTdf0J (Menu_Lab) to auto-detect.
 *
 * ── Menu_Lab intake pickers (BEO) ──
 * Picker queries use `filterByFormula` built from Display Type + Execution Type only
 * (`buildMenuLabCategoryFormula`, `buildMenuLabExecutionOrFormula`, delivery helpers in menuItems.ts).
 * The Airtable field **Test Status** (`MENU_LAB_TEST_STATUS_FIELD_ID`) is for editorial / QA workflow
 * in the base; **this app does not include Test Status in any picker formula.** If items seemed
 * “missing,” causes are usually: wrong Display/Execution tags for that section, wrong
 * VITE_AIRTABLE_MENU_ITEMS_TABLE (not pointing at Menu_Lab), or client-side picker rules
 * in MenuPickerModal — not a Draft/Approved gate in code.
 */

import { getMenuItemsTable } from "./client";

/** Default legacy production table */
export const LEGACY_MENU_ITEMS_TABLE_ID = "tbl0aN33DGG6R1sPZ";

/** Your Menu_Lab table (design / innovation catalog) */
export const MENU_LAB_TABLE_ID = "tbl6gXRT2FPpTdf0J";

export type MenuCatalogSchema = "legacy" | "menu_lab";

const MENU_LAB_ITEM_NAME = "fldpbzDFSg9sYeexU";
const MENU_LAB_CHILD_ITEMS = "fldDDfLJTI6BK1zKd";
const MENU_LAB_PARENT_ITEM = "fldLrxghm3bUg0bCx";
const MENU_LAB_DISPLAY_TYPE = "flddOn21WHp7XEaP9";
const MENU_LAB_EXECUTION_TYPE = "fldnP7tCisqdDkaOI";
const MENU_LAB_NOTES = "fldwsKX3gET8BZP4y";
const MENU_LAB_MENU_SECTION = "fld8Okh1qBnMeHwIN";
/** Single select — not used in intake `filterByFormula` (see file header). */
export const MENU_LAB_TEST_STATUS_FIELD_ID = "fldpLvIaTNhtVNeF1";

const LEGACY_ITEM_NAME = "fldW5gfSlHRTl01v1";
const LEGACY_DESCRIPTION_NAME = "fldQ83gpgOmMxNMQw";
const LEGACY_CHILD_ITEMS = "fldIu6qmlUwAEn2W9";
const LEGACY_PARENT_ITEM = "fldBzB941q8TDeqm3";
const LEGACY_CATEGORY = "fldM7lWvjH8S0YNSX";
const LEGACY_SERVICE_TYPE = "fld2EhDP5GRalZJzQ";
const LEGACY_DIETARY = "fldUSr1QgzP4nv9vs";
const LEGACY_DESCRIPTION = "fldtN2hxy9TS559Rm";
const LEGACY_VESSEL = "fldZCnfKzWijIDaeV";
const LEGACY_SAUCES = "fldCUjK7oBckAuNNa";

export type MenuCatalogFieldIds = {
  schema: MenuCatalogSchema;
  /** Primary display label field (returnFieldsByFieldId) */
  displayLabelFieldId: string;
  itemNameFieldId: string;
  childItemsFieldId: string;
  parentItemFieldId: string;
  /** Legacy Category (single select); Menu_Lab uses display + execution instead */
  categoryFieldId: string | null;
  serviceTypeFieldId: string | null;
  dietaryTagsFieldId: string | null;
  clientDescriptionFieldId: string | null;
  vesselTypeFieldId: string | null;
  longTextSaucesFieldId: string | null;
  /** Menu_Lab only — for picker filtering (multi-select) */
  displayTypeFieldId: string | null;
  executionTypeFieldId: string | null;
  /** Menu_Lab only — website menu section multi-select for delivery intake grouping */
  menuSectionFieldId: string | null;
  /** Field name for filterByFormula (Airtable uses names, not IDs) */
  displayTypeFieldName: string;
  executionTypeFieldName: string;
  menuSectionFieldName: string;
  itemNameFieldName: string;
  descriptionNameFieldName: string;
};

let cached: MenuCatalogFieldIds | null = null;

export function getMenuCatalogSchemaEnv(): MenuCatalogSchema | undefined {
  const v = (import.meta.env.VITE_AIRTABLE_MENU_CATALOG_SCHEMA as string | undefined)?.trim().toLowerCase();
  if (v === "menu_lab" || v === "menulab") return "menu_lab";
  if (v === "legacy") return "legacy";
  return undefined;
}

export function isMenuLabCatalog(): boolean {
  const envSchema = getMenuCatalogSchemaEnv();
  if (envSchema === "menu_lab") return true;
  if (envSchema === "legacy") return false;
  const table = getMenuItemsTable();
  return table === MENU_LAB_TABLE_ID;
}

export function getMenuCatalogFieldIds(): MenuCatalogFieldIds {
  if (cached) return cached;
  if (isMenuLabCatalog()) {
    cached = {
      schema: "menu_lab",
      displayLabelFieldId: MENU_LAB_ITEM_NAME,
      itemNameFieldId: MENU_LAB_ITEM_NAME,
      childItemsFieldId: MENU_LAB_CHILD_ITEMS,
      parentItemFieldId: MENU_LAB_PARENT_ITEM,
      categoryFieldId: null,
      serviceTypeFieldId: null,
      dietaryTagsFieldId: null,
      clientDescriptionFieldId: MENU_LAB_NOTES,
      vesselTypeFieldId: null,
      longTextSaucesFieldId: null,
      displayTypeFieldId: MENU_LAB_DISPLAY_TYPE,
      executionTypeFieldId: MENU_LAB_EXECUTION_TYPE,
      menuSectionFieldId: MENU_LAB_MENU_SECTION,
      displayTypeFieldName: "Display Type",
      executionTypeFieldName: "Execution Type",
      menuSectionFieldName: "Menu Section",
      itemNameFieldName: "Item Name",
      descriptionNameFieldName: "Item Name",
    };
    return cached;
  }
  cached = {
    schema: "legacy",
    displayLabelFieldId: LEGACY_DESCRIPTION_NAME,
    itemNameFieldId: LEGACY_ITEM_NAME,
    childItemsFieldId: LEGACY_CHILD_ITEMS,
    parentItemFieldId: LEGACY_PARENT_ITEM,
    categoryFieldId: LEGACY_CATEGORY,
    serviceTypeFieldId: LEGACY_SERVICE_TYPE,
    dietaryTagsFieldId: LEGACY_DIETARY,
    clientDescriptionFieldId: LEGACY_DESCRIPTION,
    vesselTypeFieldId: LEGACY_VESSEL,
    longTextSaucesFieldId: LEGACY_SAUCES,
    displayTypeFieldId: null,
    executionTypeFieldId: null,
    menuSectionFieldId: null,
    displayTypeFieldName: "",
    executionTypeFieldName: "",
    menuSectionFieldName: "",
    itemNameFieldName: "Item Name",
    descriptionNameFieldName: "Description Name",
  };
  return cached;
}

/** Reset cache (tests / HMR) */
export function resetMenuCatalogFieldIdsCache(): void {
  cached = null;
}

function escapeFormulaString(s: string): string {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Maps intake picker categoryKey → tokens on Menu_Lab multi-selects.
 * Option strings must match Airtable exactly (e.g. PASSED APPETIZERS).
 */
const MENU_LAB_PICKER_TAGS: Record<
  string,
  { display?: string[]; execution?: string[] }
> = {
  passed: { display: ["PASSED APPETIZERS"] },
  presented: { display: ["PRESENTED APPETIZERS"] },
  buffet_metal: { display: ["BUFFET METAL"] },
  buffet_china: { display: ["BUFFET CHINA"] },
  desserts: { display: ["DESSERTS"] },
  stations: { display: ["STATION"], execution: ["STATIONS"] },
  dressing: { display: ["BUFFET", "DISPLAY"] },
  deli: {
    display: ["DISPLAY", "BUFFET"],
    execution: ["COLD DISPLAY", "INDIVIDUAL PACKS"],
  },
  room_temp: { display: ["DISPLAY"], execution: ["ROOM TEMP"] },
  displays: { display: ["DISPLAY"] },
  beverage_service: { display: ["BEVERAGES"] },
  bar_service: { display: ["BEVERAGES"] },
  creation_station: { display: ["STATION"], execution: ["STATIONS"] },
};

function msFind(fieldName: string, token: string): string {
  const e = escapeFormulaString(token);
  return `FIND("${e}", ARRAYJOIN({${fieldName}}&""))`;
}

/** OR(FIND(token, Execution Type), …) for Menu_Lab pickers. */
export function buildMenuLabExecutionOrFormula(tokens: readonly string[]): string | null {
  if (tokens.length === 0) return null;
  const cfg = getMenuCatalogFieldIds();
  if (cfg.schema !== "menu_lab" || !cfg.executionTypeFieldName) return null;
  const parts = tokens.map((t) => msFind(cfg.executionTypeFieldName, t));
  return parts.length === 1 ? parts[0]! : `OR(${parts.join(",")})`;
}

/** Delivery chafer hot picker: Execution Type includes CHAFER HOT and Display Type includes BUFFET (excludes apps/stations that only match execution). */
export function buildMenuLabChaferHotBuffetFormula(): string | null {
  const cfg = getMenuCatalogFieldIds();
  if (cfg.schema !== "menu_lab" || !cfg.executionTypeFieldName || !cfg.displayTypeFieldName) return null;
  const exec = msFind(cfg.executionTypeFieldName, "CHAFER HOT");
  const display = msFind(cfg.displayTypeFieldName, "BUFFET");
  return `AND(${exec}, ${display})`;
}

/** Deli-style items excluding INDIVIDUAL PACKS execution (sandwich / tray lines). */
export function buildMenuLabSandwichTraysPickerFormula(): string | null {
  const deli = buildMenuLabCategoryFormula("deli");
  if (!deli) return null;
  const cfg = getMenuCatalogFieldIds();
  if (cfg.schema !== "menu_lab" || !cfg.executionTypeFieldName) return null;
  const notIndividual = `NOT(FIND("INDIVIDUAL PACKS", ARRAYJOIN({${cfg.executionTypeFieldName}}&"")))`;
  return `AND(${deli}, ${notIndividual})`;
}

/** Normalize Airtable multi-select execution field to uppercase token strings. */
export function parseExecutionTokensRaw(raw: unknown): string[] {
  if (raw == null) return [];
  const toOne = (x: unknown): string => {
    if (typeof x === "string") return x.trim();
    if (x && typeof x === "object" && "name" in x) return String((x as { name: string }).name).trim();
    return "";
  };
  if (Array.isArray(raw)) {
    return raw.map(toOne).filter(Boolean).map((s) => s.toUpperCase());
  }
  const one = toOne(raw);
  return one ? [one.toUpperCase()] : [];
}

export function parseExecutionTokensFromCatalogFields(
  fields: Record<string, unknown>,
  ids: MenuCatalogFieldIds
): string[] {
  if (!ids.executionTypeFieldId) return [];
  return parseExecutionTokensRaw(fields[ids.executionTypeFieldId]);
}

/**
 * Airtable formula for Menu_Lab pickers. Null = unknown key.
 */
export function buildMenuLabCategoryFormula(categoryKey: string): string | null {
  const tags = MENU_LAB_PICKER_TAGS[categoryKey];
  if (!tags) return null;
  const { display = [], execution = [] } = tags;
  const cfg = getMenuCatalogFieldIds();
  const parts: string[] = [];
  for (const d of display) parts.push(msFind(cfg.displayTypeFieldName, d));
  for (const e of execution) parts.push(msFind(cfg.executionTypeFieldName, e));
  if (parts.length === 0) return null;
  return parts.length === 1 ? parts[0]! : `OR(${parts.join(",")})`;
}

/**
 * Build an Airtable filterByFormula matching any of the given Menu Section tags.
 * Returns null when not on Menu_Lab or no tags provided.
 */
export function buildMenuSectionOrFormula(tags: readonly string[]): string | null {
  if (tags.length === 0) return null;
  const cfg = getMenuCatalogFieldIds();
  if (cfg.schema !== "menu_lab" || !cfg.menuSectionFieldName) return null;
  const parts = tags.map((t) => msFind(cfg.menuSectionFieldName, t));
  return parts.length === 1 ? parts[0]! : `OR(${parts.join(",")})`;
}

/**
 * Client-facing delivery intake sections.  Each maps a user-friendly header to
 * the set of `Menu Section` multi-select tags it should include in the picker.
 */
export type DeliveryIntakeSectionId =
  | "breakfast"
  | "lunch_sandwiches"
  | "salads_sides"
  | "hot_entrees"
  | "desserts_snacks"
  | "beverages";

export interface DeliveryIntakeSection {
  id: DeliveryIntakeSectionId;
  title: string;
  icon: string;
  menuSectionTags: readonly string[];
}

export const DELIVERY_INTAKE_SECTIONS: readonly DeliveryIntakeSection[] = [
  {
    id: "breakfast",
    title: "BREAKFAST",
    icon: "☀️",
    menuSectionTags: ["Breakfast - Room Temp", "Breakfast - Hot", "Breakfast - Complements"],
  },
  {
    id: "lunch_sandwiches",
    title: "LUNCH / SANDWICHES",
    icon: "🥪",
    menuSectionTags: [
      "Lunch - Classic Sandwiches",
      "Lunch - Signature Specialty",
      "Lunch - Wraps",
      "Lunch - Panini",
      "Lunch - Hoagies",
    ],
  },
  {
    id: "salads_sides",
    title: "SALADS & SIDES",
    icon: "🥗",
    menuSectionTags: ["Salads - Classic", "Salads - Signature"],
  },
  {
    id: "hot_entrees",
    title: "HOT ENTREES",
    icon: "🔥",
    menuSectionTags: ["Hot Lunch"],
  },
  {
    id: "desserts_snacks",
    title: "DESSERTS & SNACKS",
    icon: "🍰",
    menuSectionTags: ["Desserts", "Breaks and Snacks", "Ambient Displays"],
  },
  {
    id: "beverages",
    title: "BEVERAGES",
    icon: "☕",
    menuSectionTags: ["Beverages"],
  },
];

/** Readable "category" for station / linked UIs when Menu_Lab has no Category field */
export function syntheticCategoryFromMenuLabFields(
  fields: Record<string, unknown>,
  ids: MenuCatalogFieldIds
): string | undefined {
  if (ids.schema !== "menu_lab") return undefined;
  const d = fields[MENU_LAB_DISPLAY_TYPE];
  const e = fields[MENU_LAB_EXECUTION_TYPE];
  const toStr = (v: unknown): string => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (Array.isArray(v)) {
      return v
        .map((x) =>
          typeof x === "string" ? x : x && typeof x === "object" && "name" in x ? String((x as { name: string }).name) : ""
        )
        .filter(Boolean)
        .join(", ");
    }
    if (typeof v === "object" && v !== null && "name" in v) return String((v as { name: string }).name);
    return "";
  };
  const out = [toStr(d), toStr(e)].filter(Boolean).join(" · ");
  return out || undefined;
}
