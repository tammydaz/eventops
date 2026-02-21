import { airtableFetch, getEventsTable, type AirtableListResponse, type AirtableErrorResult } from "./client";
import { isErrorResult, asString } from "./selectors";

export type LinkedRecordItem = {
  id: string;
  name: string;
  category?: string | null;
  dietaryTags?: string | null;
};

const MENU_ITEMS_TABLE_ID = "tbl0aN33DGG6R1sPZ";
const MENU_ITEMS_FORMATTED_NAME_FIELD_ID = "fldQ83gpgOmMxNMQw";
const MENU_ITEMS_CATEGORY_FIELD_ID = "fldM7lWvjH8S0YNSX";
// TODO: Replace empty string with the actual field ID for "Menu Item Allergen/Restriction Tags (AI)"
const MENU_ITEMS_DIETARY_TAGS_FIELD_ID = "";

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
  const baseId = getEventsTable();
  if (typeof baseId !== "string") {
    return baseId;
  }

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
  const baseId = getEventsTable();
  if (typeof baseId !== "string") {
    return baseId;
  }

  const params = new URLSearchParams();
  params.set("maxRecords", "500");
  params.set("cellFormat", "json");
  params.set("returnFieldsByFieldId", "true");
  params.append("fields[]", MENU_ITEMS_FORMATTED_NAME_FIELD_ID);
  params.append("fields[]", MENU_ITEMS_CATEGORY_FIELD_ID);
  if (MENU_ITEMS_DIETARY_TAGS_FIELD_ID) {
    params.append("fields[]", MENU_ITEMS_DIETARY_TAGS_FIELD_ID);
  }

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${MENU_ITEMS_TABLE_ID}?${params.toString()}`
  );

  if (isErrorResult(data)) {
    return data;
  }

  return data.records.map((record) => {
    const formattedName = asString(record.fields[MENU_ITEMS_FORMATTED_NAME_FIELD_ID]);
    const categoryRaw = record.fields[MENU_ITEMS_CATEGORY_FIELD_ID];

    let category: string | null = null;
    if (typeof categoryRaw === "string") {
      category = categoryRaw;
    } else if (categoryRaw && typeof categoryRaw === "object" && "name" in categoryRaw) {
      category = String(categoryRaw.name);
    }

    const dietaryTags = MENU_ITEMS_DIETARY_TAGS_FIELD_ID
      ? asString(record.fields[MENU_ITEMS_DIETARY_TAGS_FIELD_ID]) || null
      : null;

    return {
      id: record.id,
      name: formattedName || "",
      category,
      dietaryTags,
    };
  });
};

export const loadMenuItemSpecs = async () =>
  listLinkedTableItems(MENU_ITEM_SPECS_TABLE_ID, MENU_ITEM_SPECS_NAME_FIELD_ID);

export const loadStaff = async () => listLinkedTableItems(STAFF_TABLE_ID, STAFF_NAME_FIELD_ID);

export const loadRentals = async () => listLinkedTableItems(RENTALS_TABLE_ID, RENTALS_NAME_FIELD_ID);

export const loadRentalItems = async () =>
  listLinkedTableItems(RENTAL_ITEMS_TABLE_ID, RENTAL_ITEMS_NAME_FIELD_ID);

export const loadServiceWare = async () =>
  listLinkedTableItems(SERVICE_WARE_TABLE_ID, SERVICE_WARE_NAME_FIELD_ID);
