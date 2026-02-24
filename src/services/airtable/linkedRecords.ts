import { airtableFetch, getBaseId, getApiKey, type AirtableListResponse, type AirtableErrorResult } from "./client";
import { isErrorResult, asString, asSingleSelectName } from "./selectors";

export type LinkedRecordItem = {
  id: string;
  name: string;
  category?: string | null;
  childItems?: string[];
};

const MENU_ITEMS_TABLE_ID = "tbl0aN33DGG6R1sPZ";
const MENU_ITEMS_FORMATTED_NAME_FIELD_ID = "fldQ83gpgOmMxNMQw"; // Name field - verify in Airtable
const MENU_ITEMS_SERVICE_TYPE_FIELD_ID = "fld2EhDP5GRalZJzQ"; // Service Type - verify in Airtable
const MENU_ITEMS_CATEGORY_FIELD_ID = "fldM7lWvjH8S0YNSX"; // Category (alternate) - verify in Airtable
const MENU_ITEMS_DIETARY_TAGS_FIELD_ID = "fldUSr1QgzP4nv9vs"; // Allergen Icons / dietary tags - verify in Airtable
/** Vessel Type: "Metal – Hot", "Full Pan (Hot)", "China – Cold / Display", "China – Room Temp" — used for buffet Metal vs China */
const MENU_ITEMS_VESSEL_TYPE_FIELD_ID = "fldZCnfKzWijIDaeV";
/** Section: "Passed Apps", "Presented Apps", "Buffet", "Desserts", "Beverages", etc. */
const MENU_ITEMS_SECTION_FIELD_ID = "fldwl2KIn0xOW1TR3";

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
  const apiKeyResult = getApiKey();
  const baseIdResult = getBaseId();
  if (isErrorResult(apiKeyResult)) return apiKeyResult;
  if (isErrorResult(baseIdResult)) return baseIdResult;
  const apiKey = (apiKeyResult as string).trim();
  const baseId = (baseIdResult as string).trim();
  if (!apiKey || !baseId) {
    return { error: true, message: "Missing Airtable API key or base ID" };
  }

  const allRecords: LinkedRecordItem[] = [];
  let offset: string | undefined = undefined;

  try {
    do {
      const params = new URLSearchParams();
      params.set("pageSize", "100");
      params.set("returnFieldsByFieldId", "true");
      params.append("fields[]", MENU_ITEMS_FORMATTED_NAME_FIELD_ID);
      params.append("fields[]", MENU_ITEMS_CATEGORY_FIELD_ID);
      if (offset) params.set("offset", offset);

      const res = await fetch(
        `https://api.airtable.com/v0/${baseId}/${MENU_ITEMS_TABLE_ID}?${params.toString()}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );

      const data = (await res.json()) as {
        records?: Array<{ id: string; fields: Record<string, unknown> }>;
        offset?: string;
        error?: { type: string; message: string };
      };

      console.log("MENU ITEMS RESPONSE:", data);

      if (data.error) {
        return { error: true, message: data.error.message ?? "Airtable API error" };
      }

      if (data.records) {
        const pageRecords = data.records.map((rec) => {
          const nameRaw = rec.fields[MENU_ITEMS_FORMATTED_NAME_FIELD_ID];
          const name = typeof nameRaw === "string" ? nameRaw : nameRaw && typeof nameRaw === "object" && "name" in nameRaw ? String((nameRaw as { name: string }).name) : "";

          const categoryRaw = rec.fields[MENU_ITEMS_CATEGORY_FIELD_ID];

          let category: string | undefined;

          if (Array.isArray(categoryRaw)) {
            category = categoryRaw[0] ?? undefined;
          } else if (typeof categoryRaw === "string") {
            category = categoryRaw;
          } else if (
            categoryRaw &&
            typeof categoryRaw === "object" &&
            "name" in categoryRaw
          ) {
            category = String((categoryRaw as { name: string }).name);
          } else {
            category = undefined;
          }

          return {
            id: rec.id,
            name: name || "",
            category,
          } as LinkedRecordItem;
        });
        allRecords.push(...pageRecords);
        console.log(`📦 Loaded ${pageRecords.length} menu items (total: ${allRecords.length})`);
      }

      offset = data.offset;
    } while (offset);

    console.log(`✅ Finished loading ${allRecords.length} total menu items`);
    return allRecords;
  } catch (error) {
    console.error("❌ Failed to load menu items:", error);
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
  const baseId = getBaseId();
  const apiKey = getApiKey();
  if (typeof baseId !== "string" || typeof apiKey !== "string") {
    console.error("[fetchLinkedRecordOptions] Missing baseId or apiKey");
    return [];
  }

  console.log("[fetchLinkedRecordOptions] Fetching for field:", fieldId);

  try {
    const params = new URLSearchParams();
    params.set("maxRecords", "1200");
    params.set("cellFormat", "json");
    params.set("returnFieldsByFieldId", "true");
    params.append("fields[]", MENU_ITEMS_FORMATTED_NAME_FIELD_ID);
    params.append("fields[]", MENU_ITEMS_CATEGORY_FIELD_ID);
    params.append("fields[]", MENU_ITEMS_DIETARY_TAGS_FIELD_ID);

    const url = `https://api.airtable.com/v0/${baseId}/${tableId}?${params.toString()}`;
    console.log("[fetchLinkedRecordOptions] Request URL:", url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data = (await response.json()) as { records?: Array<{ id: string; fields: Record<string, unknown> }> };
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
