/**
 * Boxed Lunch Orders — Airtable integration for Omni's boxed lunch schema.
 * Tables: Boxed Lunch Orders, Boxed Lunch Order Items, Box Customizations.
 * Used for BEO merge logic (delivery + full-service).
 */

import { airtableFetch, getBaseId, getApiKey, type AirtableListResponse, type AirtableErrorResult } from "./client";
import { isErrorResult, asString, asLinkedRecordIds } from "./selectors";

// ── Table IDs ──
export const BOXED_LUNCH_ORDERS_TABLE = "tbldRHfhjCY4x2Hyy";
export const BOXED_LUNCH_ORDER_ITEMS_TABLE = "tblbkSAnNpUkjWtsa";
export const BOX_CUSTOMIZATIONS_TABLE = "tblAulNkoIFgNhJxw";

// ── Boxed Lunch Orders fields ──
export const BOXED_LUNCH_ORDERS_FIELD_IDS = {
  orderName: "fldBWaqX8nmvYjiDg",
  clientEvent: "fldUnkvbaJhny05V3",  // Linked record → Events
  orderDate: "fldRUiayIsWpqEkXT",
  boxedLunchSelections: "fldfltt8RGxBtW2cj",  // Linked record → Boxed Lunch Order Items
} as const;

// ── Boxed Lunch Order Items fields ──
export const BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS = {
  orderItemId: "fldoN8vRP7B9kmOrA",
  order: "fld4nC951QmByIOsJ",  // Linked record → Boxed Lunch Orders
  boxedLunchType: "fld0u5GkL3lnvXNg5",  // Linked record → Menu Items
  quantity: "fld9Cs3tcmJT6vqcY",
  customizations: "fldqiy52e9uzckXCd",  // Linked record → Box Customizations
} as const;

// ── Box Customizations fields ──
export const BOX_CUSTOMIZATIONS_FIELD_IDS = {
  orderItem: "fldAEfP10RiN8mRSf",  // Linked record → Boxed Lunch Order Items
  boxNumber: "fldPzCQ0NlObQgpGI",
  swappedItem: "fldx7BTghnsdGJFbP",  // Linked record → Menu Items
  specialRequests: "fld7eYwx4pMNttLJ8",
} as const;

// ── Menu Items table (for resolving Boxed Lunch Type names) ──
const MENU_ITEMS_TABLE = "tbl0aN33DGG6R1sPZ";
const MENU_ITEM_NAME_FIELD_ID = "fldW5gfSlHRTl01v1";

export type BoxedLunchOrderItem = {
  id: string;
  boxedLunchTypeId: string;
  boxedLunchTypeName: string;
  quantity: number;
  customizations?: Array<{ boxNumber?: number; swappedItemName?: string; specialRequests?: string }>;
};

export type BoxedLunchOrder = {
  id: string;
  orderName: string;
  orderDate?: string;
  items: BoxedLunchOrderItem[];
};

/**
 * Load boxed lunch orders for an event. Uses two approaches:
 * 1. Query Boxed Lunch Orders where Client/Event contains eventId
 * 2. Or use Events.Boxed Lunch Orders (fldHCcFbEH7bEwwkb) when loading event data
 */
export async function loadBoxedLunchOrdersByEventId(
  eventId: string
): Promise<BoxedLunchOrder[] | AirtableErrorResult> {
  const baseIdResult = getBaseId();
  const apiKeyResult = getApiKey();
  if (isErrorResult(baseIdResult) || isErrorResult(apiKeyResult)) {
    return baseIdResult as AirtableErrorResult;
  }

  // Query Boxed Lunch Orders where Client/Event contains eventId (formula uses field name)
  const clientEventFieldName = "Client/Event";
  const formula = `FIND('${eventId}', ARRAYJOIN({${clientEventFieldName}})) > 0`;
  const params = new URLSearchParams();
  params.set("filterByFormula", formula);
  params.set("returnFieldsByFieldId", "true");

  const ordersData = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${BOXED_LUNCH_ORDERS_TABLE}?${params.toString()}`
  );

  if (isErrorResult(ordersData)) return ordersData;

  if (ordersData.records.length === 0) return [];

  const orders: BoxedLunchOrder[] = [];
  const menuItemCache: Record<string, string> = {};

  for (const rec of ordersData.records) {
    const fields = rec.fields as Record<string, unknown>;
    const orderId = rec.id;
    const orderName = asString(fields[BOXED_LUNCH_ORDERS_FIELD_IDS.orderName]) || "Boxed Lunch Order";
    const orderDate = asString(fields[BOXED_LUNCH_ORDERS_FIELD_IDS.orderDate]);
    const itemIds = asLinkedRecordIds(fields[BOXED_LUNCH_ORDERS_FIELD_IDS.boxedLunchSelections]);

    const items: BoxedLunchOrderItem[] = [];

    for (const itemId of itemIds) {
      // Fetch order item to get Boxed Lunch Type and Quantity
      const itemFormula = `RECORD_ID()='${itemId}'`;
      const itemParams = new URLSearchParams();
      itemParams.set("filterByFormula", itemFormula);
      itemParams.set("returnFieldsByFieldId", "true");

      const itemData = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
        `/${BOXED_LUNCH_ORDER_ITEMS_TABLE}?${itemParams.toString()}`
      );

      if (isErrorResult(itemData) || !itemData.records[0]) continue;

      const itemFields = itemData.records[0].fields as Record<string, unknown>;
      const typeIds = asLinkedRecordIds(itemFields[BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS.boxedLunchType]);
      const boxedLunchTypeId = typeIds[0] ?? "";
      const quantity = typeof itemFields[BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS.quantity] === "number"
        ? (itemFields[BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS.quantity] as number)
        : 0;

      // Resolve menu item name
      let boxedLunchTypeName = menuItemCache[boxedLunchTypeId];
      if (!boxedLunchTypeName && boxedLunchTypeId) {
        const menuParams = new URLSearchParams();
        menuParams.set("filterByFormula", `RECORD_ID()='${boxedLunchTypeId}'`);
        menuParams.set("returnFieldsByFieldId", "true");
        menuParams.append("fields[]", MENU_ITEM_NAME_FIELD_ID);
        const menuData = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
          `/${MENU_ITEMS_TABLE}?${menuParams.toString()}`
        );
        if (!isErrorResult(menuData) && menuData.records[0]) {
          const nameRaw = (menuData.records[0].fields as Record<string, unknown>)[MENU_ITEM_NAME_FIELD_ID];
          boxedLunchTypeName = typeof nameRaw === "string" ? nameRaw : "Boxed Lunch";
          menuItemCache[boxedLunchTypeId] = boxedLunchTypeName;
        } else {
          boxedLunchTypeName = "Boxed Lunch";
        }
      } else if (!boxedLunchTypeName) {
        boxedLunchTypeName = "Boxed Lunch";
      }

      items.push({
        id: itemId,
        boxedLunchTypeId,
        boxedLunchTypeName,
        quantity,
      });
    }

    orders.push({
      id: orderId,
      orderName,
      orderDate,
      items,
    });
  }

  return orders;
}
