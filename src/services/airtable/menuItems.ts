import { airtableFetch, getMenuItemsTable } from "./client";
import { isErrorResult, asLinkedRecordIds } from "./selectors";
import { cleanDisplayName } from "../../utils/displayName";
import { CATEGORY_MAP } from "../../constants/menuCategories";

const MENU_ITEMS_TABLE_ID_DEFAULT = "tbl0aN33DGG6R1sPZ";
const MENU_ITEMS_DESCRIPTION_NAME_FIELD_ID = "fldQ83gpgOmMxNMQw"; // Description Name/Formula (display label)
const MENU_ITEMS_CHILD_ITEMS_FIELD_ID = "fldIu6qmlUwAEn2W9"; // Child Items (linked)

export interface MenuItemRecord {
  id: string;
  name: string;
  /** Child item names for picker label (e.g. "Pineapple Colada Dipping Sauce" for Coconut Shrimp) */
  childItems?: string[];
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
