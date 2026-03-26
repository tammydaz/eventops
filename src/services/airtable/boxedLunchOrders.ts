/**
 * Boxed Lunch Orders — Airtable: Boxed Lunch Orders + Order Items (legacy).
 * V2 payload: single JSON blob in orderName (FWX_BOXED_V2:...) — sandwich counts + box type only.
 */

import { airtableFetch, getBaseId, getApiKey, type AirtableListResponse, type AirtableErrorResult } from "./client";
import { isErrorResult, asString, asLinkedRecordIds } from "./selectors";
import type { BoxedLunchBoxSnapshot, BoxedLunchV2Payload } from "../../config/boxedLunchBeo";

// ── Table IDs ──
export const BOXED_LUNCH_ORDERS_TABLE = "tbldRHfhjCY4x2Hyy";
export const BOXED_LUNCH_ORDER_ITEMS_TABLE = "tblbkSAnNpUkjWtsa";
export const BOX_CUSTOMIZATIONS_TABLE = "tblAulNkoIFgNhJxw";

// ── Boxed Lunch Orders fields ──
export const BOXED_LUNCH_ORDERS_FIELD_IDS = {
  orderName: "fldBWaqX8nmvYjiDg",
  clientEvent: "fldUnkvbaJhny05V3", // Linked record → Events
  orderDate: "fldRUiayIsWpqEkXT",
  boxedLunchSelections: "fldfltt8RGxBtW2cj", // Linked record → Boxed Lunch Order Items
} as const;

// ── Boxed Lunch Order Items fields (legacy loads) ──
export const BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS = {
  orderItemId: "fldoN8vRP7B9kmOrA",
  order: "fld4nC951QmByIOsJ",
  boxedLunchType: "fld0u5GkL3lnvXNg5",
  quantity: "fld9Cs3tcmJT6vqcY",
  customizations: "fldqiy52e9uzckXCd",
} as const;

export const BOX_CUSTOMIZATIONS_FIELD_IDS = {
  orderItem: "fldAEfP10RiN8mRSf",
  boxNumber: "fldPzCQ0NlObQgpGI",
  swappedItem: "fldx7BTghnsdGJFbP",
  specialRequests: "fld7eYwx4pMNttLJ8",
} as const;

const MENU_ITEMS_TABLE = "tbl0aN33DGG6R1sPZ";
const MENU_ITEM_NAME_FIELD_ID = "fldW5gfSlHRTl01v1";

/** Prefix for V2 JSON in orderName — no per-box rows in Airtable. */
export const BOXED_LUNCH_V2_ORDER_NAME_PREFIX = "FWX_BOXED_V2:";

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
  /** Legacy line items (Pick1/Pick2 rows). */
  items: BoxedLunchOrderItem[];
  /** V2: box type + sandwich counts only. */
  v2?: BoxedLunchV2Payload;
};

/** Coerce Airtable / hand-edited JSON into the canonical V2 shape (qty vs quantity, string numbers). */
export function normalizeBoxedLunchV2Payload(raw: unknown): BoxedLunchV2Payload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const rawBt = o.boxTypeId;
  const boxTypeId =
    typeof rawBt === "string"
      ? rawBt.trim()
      : typeof rawBt === "number" && !Number.isNaN(rawBt)
        ? String(Math.floor(rawBt))
        : "";
  if (!boxTypeId) return null;

  const arr = o.sandwiches;
  let sandwichRows: unknown[];
  if (Array.isArray(arr)) sandwichRows = arr;
  else if (arr == null) sandwichRows = [];
  else return null;

  const parseQty = (v: unknown): number => {
    if (typeof v === "number" && !Number.isNaN(v)) return Math.max(0, Math.floor(v));
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v.trim());
      if (!Number.isNaN(n)) return Math.max(0, Math.floor(n));
    }
    return 0;
  };
  const sandwiches = sandwichRows.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return { name: "", qty: 0 };
    const r = row as Record<string, unknown>;
    const rawName = r.name;
    const name =
      typeof rawName === "string"
        ? rawName
        : rawName != null && rawName !== ""
          ? String(rawName).trim()
          : "";
    const qty = parseQty(r.qty !== undefined ? r.qty : r.quantity);
    return { name, qty };
  });
  return { boxTypeId, sandwiches };
}

export function parseBoxedLunchV2FromOrderName(orderName: string): BoxedLunchV2Payload | null {
  const t = (orderName || "").trim().replace(/^\uFEFF/, "");
  if (!t.startsWith(BOXED_LUNCH_V2_ORDER_NAME_PREFIX)) return null;
  try {
    const parsed = JSON.parse(t.slice(BOXED_LUNCH_V2_ORDER_NAME_PREFIX.length)) as unknown;
    return normalizeBoxedLunchV2Payload(parsed);
  } catch {
    return null;
  }
}

/**
 * Load boxed lunch orders for an event.
 * V2 orders expose `v2` and typically have `items: []`.
 */
export async function loadBoxedLunchOrdersByEventId(
  eventId: string
): Promise<BoxedLunchOrder[] | AirtableErrorResult> {
  const baseIdResult = getBaseId();
  const apiKeyResult = getApiKey();
  if (isErrorResult(baseIdResult) || isErrorResult(apiKeyResult)) {
    return baseIdResult as AirtableErrorResult;
  }

  // Linked Events field: ARRAYJOIN() joins *primary field values*, not record IDs — FIND('rec…') alone
  // often returns no rows. Match eventMenu.ts: OR(direct link = recId, FIND in ARRAYJOIN fallback).
  const clientEventFieldName = "Client/Event";
  const escapedEventId = eventId.replace(/'/g, "\\'");
  const formula = `OR({${clientEventFieldName}}='${escapedEventId}', FIND('${escapedEventId}', ARRAYJOIN({${clientEventFieldName}})) > 0)`;
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
    const orderName = asString(fields[BOXED_LUNCH_ORDERS_FIELD_IDS.orderName]) || "";
    const orderDate = asString(fields[BOXED_LUNCH_ORDERS_FIELD_IDS.orderDate]);

    const v2 = parseBoxedLunchV2FromOrderName(orderName);
    if (v2) {
      orders.push({
        id: orderId,
        orderName,
        orderDate,
        items: [],
        v2,
      });
      continue;
    }

    // ── Legacy: resolve order items from linked selections ──
    const itemIds = asLinkedRecordIds(fields[BOXED_LUNCH_ORDERS_FIELD_IDS.boxedLunchSelections]);
    const items: BoxedLunchOrderItem[] = [];

    for (const itemId of itemIds) {
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
      const quantity =
        typeof itemFields[BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS.quantity] === "number"
          ? (itemFields[BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS.quantity] as number)
          : 0;

      const customIds = asLinkedRecordIds(itemFields[BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS.customizations]);
      let specialRequests = "";
      if (customIds.length > 0) {
        const customFormula = `RECORD_ID()='${customIds[0]}'`;
        const customParams = new URLSearchParams();
        customParams.set("filterByFormula", customFormula);
        customParams.set("returnFieldsByFieldId", "true");
        const customData = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
          `/${BOX_CUSTOMIZATIONS_TABLE}?${customParams.toString()}`
        );
        if (!isErrorResult(customData) && customData.records[0]) {
          const cf = customData.records[0].fields as Record<string, unknown>;
          specialRequests = asString(cf[BOX_CUSTOMIZATIONS_FIELD_IDS.specialRequests]) || "";
        }
      }

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
        customizations: specialRequests ? [{ specialRequests }] : undefined,
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

/**
 * Create or update the single boxed-lunch V2 record for an event.
 * Stores JSON in `orderName`; clears linked order items.
 */
export async function upsertBoxedLunchOrderV2(
  eventId: string,
  payload: BoxedLunchV2Payload
): Promise<{ orderId: string } | AirtableErrorResult> {
  const baseIdResult = getBaseId();
  const apiKeyResult = getApiKey();
  if (isErrorResult(baseIdResult) || isErrorResult(apiKeyResult)) {
    return baseIdResult as AirtableErrorResult;
  }

  const v2Json = JSON.stringify({
    boxTypeId: payload.boxTypeId,
    sandwiches: payload.sandwiches,
    ...(payload.boxSnapshot ? { boxSnapshot: payload.boxSnapshot } : {}),
  });
  const orderName = `${BOXED_LUNCH_V2_ORDER_NAME_PREFIX}${v2Json}`;
  const existing = await loadBoxedLunchOrdersByEventId(eventId);
  if (isErrorResult(existing)) return existing;

  const patchFields: Record<string, unknown> = {
    [BOXED_LUNCH_ORDERS_FIELD_IDS.orderName]: orderName,
    [BOXED_LUNCH_ORDERS_FIELD_IDS.boxedLunchSelections]: [],
  };

  if (existing.length > 0) {
    // Airtable list order is not guaranteed. Multiple rows can link to the same event (legacy + V2).
    // Updating only existing[0] was patching the wrong record, so save "failed" while load showed stale V2.
    const normName = (n: string) => n.trim().replace(/^\uFEFF/, "");
    const sorted = [...existing].sort((a, b) => {
      const aV2 = a.v2 != null || normName(a.orderName).startsWith(BOXED_LUNCH_V2_ORDER_NAME_PREFIX);
      const bV2 = b.v2 != null || normName(b.orderName).startsWith(BOXED_LUNCH_V2_ORDER_NAME_PREFIX);
      if (aV2 === bV2) return 0;
      return aV2 ? -1 : 1;
    });
    for (const row of sorted) {
      const patchRes = await airtableFetch(`/${BOXED_LUNCH_ORDERS_TABLE}/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ fields: patchFields }),
      });
      if (isErrorResult(patchRes)) {
        return { error: true, message: patchRes.message ?? "Failed to update boxed lunch order" };
      }
    }
    return { orderId: sorted[0].id };
  }

  const createFields: Record<string, unknown> = {
    ...patchFields,
    [BOXED_LUNCH_ORDERS_FIELD_IDS.clientEvent]: [eventId],
  };
  const orderRes = await airtableFetch<{ records?: Array<{ id: string }> }>(
    `/${BOXED_LUNCH_ORDERS_TABLE}`,
    { method: "POST", body: JSON.stringify({ records: [{ fields: createFields }] }) }
  );
  if (isErrorResult(orderRes) || !orderRes.records?.[0]) {
    return { error: true, message: "Failed to create boxed lunch order" };
  }
  return { orderId: orderRes.records[0].id };
}

/** @deprecated Legacy Pick1/Pick2 — retained for one-off migration scripts only */
export async function createBoxedLunchOrderFromRows(
  eventId: string,
  rows: Array<{ boxedLunchType: string; pick1: string; pick2: string; pick2Other?: string; quantity: number }>,
  orderName?: string
): Promise<{ orderId: string } | AirtableErrorResult> {
  const baseIdResult = getBaseId();
  const apiKeyResult = getApiKey();
  if (isErrorResult(baseIdResult) || isErrorResult(apiKeyResult)) {
    return baseIdResult as AirtableErrorResult;
  }

  const typeNames = [...new Set(rows.map((r) => r.boxedLunchType))];
  const nameToId: Record<string, string> = {};
  for (const name of typeNames) {
    const formula = `{Item Name}='${name.replace(/'/g, "\\'")}'`;
    const params = new URLSearchParams();
    params.set("filterByFormula", formula);
    params.set("returnFieldsByFieldId", "true");
    params.append("fields[]", MENU_ITEM_NAME_FIELD_ID);
    const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
      `/${MENU_ITEMS_TABLE}?${params.toString()}`
    );
    if (!isErrorResult(data) && data.records[0]) {
      nameToId[name] = data.records[0].id;
    }
  }

  const orderFields: Record<string, unknown> = {
    [BOXED_LUNCH_ORDERS_FIELD_IDS.orderName]: orderName || `Boxed Lunch ${new Date().toLocaleDateString()}`,
    [BOXED_LUNCH_ORDERS_FIELD_IDS.clientEvent]: [eventId],
  };
  const orderRes = await airtableFetch<{ records?: Array<{ id: string }> }>(
    `/${BOXED_LUNCH_ORDERS_TABLE}`,
    { method: "POST", body: JSON.stringify({ records: [{ fields: orderFields }] }) }
  );
  if (isErrorResult(orderRes) || !orderRes.records?.[0]) {
    return { error: true, message: "Failed to create Boxed Lunch Order" };
  }
  const orderId = orderRes.records[0].id;
  const orderItemIds: string[] = [];

  for (const row of rows) {
    const typeId = nameToId[row.boxedLunchType];
    if (!typeId) continue;

    const itemFields: Record<string, unknown> = {
      [BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS.order]: [orderId],
      [BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS.boxedLunchType]: [typeId],
      [BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS.quantity]: row.quantity,
    };
    const itemRes = await airtableFetch<{ records?: Array<{ id: string }> }>(
      `/${BOXED_LUNCH_ORDER_ITEMS_TABLE}`,
      { method: "POST", body: JSON.stringify({ records: [{ fields: itemFields }] }) }
    );
    if (isErrorResult(itemRes) || !itemRes.records?.[0]) continue;
    orderItemIds.push(itemRes.records[0].id);

    const specText = [row.pick1, row.pick2 === "Other" ? (row.pick2Other || "Other") : row.pick2].filter(Boolean).join(" | ");
    if (specText) {
      const customFields: Record<string, unknown> = {
        [BOX_CUSTOMIZATIONS_FIELD_IDS.orderItem]: [itemRes.records[0].id],
        [BOX_CUSTOMIZATIONS_FIELD_IDS.specialRequests]: `Pick 1: ${row.pick1} | Pick 2: ${row.pick2 === "Other" ? (row.pick2Other || "") : row.pick2}`,
      };
      await airtableFetch(`/${BOX_CUSTOMIZATIONS_TABLE}`, {
        method: "POST",
        body: JSON.stringify({ records: [{ fields: customFields }] }),
      });
    }
  }

  if (orderItemIds.length > 0) {
    await airtableFetch(`/${BOXED_LUNCH_ORDERS_TABLE}/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ fields: { [BOXED_LUNCH_ORDERS_FIELD_IDS.boxedLunchSelections]: orderItemIds } }),
    });
  }

  return { orderId };
}
