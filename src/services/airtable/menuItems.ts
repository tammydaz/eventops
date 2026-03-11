import { airtableFetch, getMenuItemsTable } from "./client";
import { isErrorResult } from "./selectors";
import { cleanDisplayName } from "../../utils/displayName";
import { CATEGORY_MAP } from "../../constants/menuCategories";

const MENU_ITEMS_TABLE_ID_DEFAULT = "tbl0aN33DGG6R1sPZ";
const MENU_ITEMS_FORMATTED_NAME_FIELD_ID = "fldQ83gpgOmMxNMQw";
const MENU_ITEMS_ITEM_NAME_FIELD_ID = "fldW5gfSlHRTl01v1";

export interface MenuItemRecord {
  id: string;
  name: string;
}

/** Fetch menu items filtered by category key. Uses CATEGORY_MAP to build OR formula for Airtable Category field. */
export async function fetchMenuItemsByCategory(categoryKey: string): Promise<MenuItemRecord[]> {
  const tableId = getMenuItemsTable() || MENU_ITEMS_TABLE_ID_DEFAULT;

  const allowedCategories = CATEGORY_MAP[categoryKey as keyof typeof CATEGORY_MAP];
  if (!allowedCategories?.length) {
    return [];
  }

  const orParts = allowedCategories.map((cat) => {
    const escaped = String(cat).replace(/"/g, '\\"');
    return `FIND("${escaped}", {Category})`;
  });
  const filterByFormula = `OR(${orParts.join(",")})`;

  const allRecords: Array<{ id: string; fields: Record<string, unknown> }> = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    params.set("filterByFormula", filterByFormula);
    params.set("pageSize", "100");
    params.set("returnFieldsByFieldId", "true");
    params.append("fields[]", MENU_ITEMS_FORMATTED_NAME_FIELD_ID);
    params.append("fields[]", MENU_ITEMS_ITEM_NAME_FIELD_ID);
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

  return allRecords.map((rec) => {
    const nameRaw =
      rec.fields[MENU_ITEMS_FORMATTED_NAME_FIELD_ID] ?? rec.fields[MENU_ITEMS_ITEM_NAME_FIELD_ID];
    const name =
      typeof nameRaw === "string"
        ? nameRaw
        : nameRaw && typeof nameRaw === "object" && "name" in nameRaw
          ? String((nameRaw as { name: string }).name)
          : rec.id;
    return { id: rec.id, name: cleanDisplayName(name || "") || rec.id };
  });
}
