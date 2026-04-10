/**
 * Boxed Lunch Orders — Airtable: Boxed Lunch Orders + Order Items (legacy).
 * V2 payload: single JSON blob in orderName (FWX_BOXED_V2:...) — sandwich counts + box type only.
 */

import { airtableFetch, getBaseId, getApiKey, getMenuItemsTable, type AirtableListResponse, type AirtableErrorResult } from "./client";
import { getMenuCatalogFieldIds } from "./menuCatalogConfig";
import { isErrorResult, asString, asLinkedRecordIds } from "./selectors";
import {
  isSaladBoxedLunchBox,
  v2BoxedPayloadHasSavedSandwiches,
  type BoxedLunchBoxSnapshot,
  type BoxedLunchSandwichLine,
  type BoxedLunchV2Payload,
} from "../../config/boxedLunchBeo";
import {
  cheeseOptionLabelForAirtable,
  decodeCustomizationFromSpecialRequests,
  encodeCustomizationForSpecialRequests,
  mergeCustomizationPayloads,
  partialCustomizationFromAirtableFields,
  sanitizeAdditionalSpreads,
} from "../../config/boxedLunchCustomization";
import { sanitizeRemovalKeys } from "../../config/boxedLunchCorporateCatering";

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
  /** Structured corporate fields (IDs only — do not use display names in API payloads). */
  breadType: "fldn13vheKToKrRo7",
  spreads: "fldc9VmAftI0jVsJN",
  cheeseOption: "fldZPc1qjiKwT7Y94",
  removedItems: "fldyDr3U3wCHuRBYJ",
  customNotes: "fldQpeZEjAG4ujmYt",
} as const;

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
  const parseCheese = (v: unknown): BoxedLunchSandwichLine["cheeseOption"] => {
    if (v === "none" || v === "special") return v;
    return "default";
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
    const menuItemId =
      typeof r.menuItemId === "string" && r.menuItemId.startsWith("rec") ? r.menuItemId.trim() : undefined;
    const breadType =
      typeof r.breadType === "string" && r.breadType.trim() ? r.breadType.trim() : undefined;
    let spreads: string[] | undefined;
    if (Array.isArray(r.spreads)) {
      const arr = sanitizeAdditionalSpreads(
        r.spreads.map((x) => (typeof x === "string" ? x : String(x)))
      );
      spreads = arr.length > 0 ? arr : undefined;
    }
    const cheeseOption = parseCheese(r.cheeseOption);
    const customNotes =
      typeof r.customNotes === "string" && r.customNotes.trim() ? r.customNotes.trim() : undefined;
    let removedItems: string[] | undefined;
    if (Array.isArray(r.removedItems)) {
      const arr = sanitizeRemovalKeys(
        r.removedItems.map((x) => (typeof x === "string" ? x : String(x)))
      );
      removedItems = arr.length > 0 ? arr : undefined;
    }
    const line: BoxedLunchSandwichLine = { name, qty, cheeseOption };
    if (menuItemId) line.menuItemId = menuItemId;
    if (breadType) line.breadType = breadType;
    if (spreads) line.spreads = spreads;
    if (customNotes) line.customNotes = customNotes;
    if (removedItems) line.removedItems = removedItems;
    return line;
  });
  const result: BoxedLunchV2Payload = { boxTypeId, sandwiches };
  const snapRaw = o.boxSnapshot;
  if (snapRaw && typeof snapRaw === "object" && !Array.isArray(snapRaw)) {
    const s = snapRaw as Record<string, unknown>;
    const n = typeof s.name === "string" ? s.name.trim() : "";
    const d = typeof s.dessert === "string" ? s.dessert.trim() : "";
    const sidesArr = Array.isArray(s.sides)
      ? s.sides.map((x) => (typeof x === "string" ? x : String(x))).filter(Boolean)
      : [];
    if (n || sidesArr.length || d) {
      result.boxSnapshot = { name: n || "Boxed lunch", sides: sidesArr, dessert: d || "—" };
    }
  }
  return result;
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

/** True if any order has legacy line qty or V2 lines with a real sandwich name + qty (not blank rows with default qty). */
export function boxedLunchOrdersHaveContent(orders: BoxedLunchOrder[]): boolean {
  for (const o of orders) {
    if (o.items.some((i) => Math.max(0, Math.floor(Number(i.quantity) || 0)) > 0)) return true;
    if (o.v2 && v2BoxedPayloadHasSavedSandwiches(o.v2)) return true;
  }
  return false;
}

/**
 * Load boxed lunch orders for an event.
 * V2 orders expose `v2` and typically have `items: []`.
 */
/**
 * Extract all event record IDs from a Boxed Lunch Orders record's Client/Event field.
 * Works whether Airtable returns linked fields as string IDs or { id, name } objects.
 * Used as a client-side guard after the server formula (which compares primary-field
 * values, not record IDs, so can return 0 or imprecise results).
 */
function extractLinkedEventIds(val: unknown): string[] {
  const out: string[] = [];
  const pushIdIf = (x: unknown) => {
    if (typeof x === "string" && x.startsWith("rec")) out.push(x);
    if (x && typeof x === "object") {
      const id = (x as { id?: unknown }).id;
      if (typeof id === "string" && id.startsWith("rec")) out.push(id);
    }
  };
  if (Array.isArray(val)) val.forEach(pushIdIf);
  else pushIdIf(val);
  return out;
}

export async function loadBoxedLunchOrdersByEventId(
  eventId: string
): Promise<BoxedLunchOrder[] | AirtableErrorResult> {
  const baseIdResult = getBaseId();
  const apiKeyResult = getApiKey();
  if (isErrorResult(baseIdResult) || isErrorResult(apiKeyResult)) {
    return baseIdResult as AirtableErrorResult;
  }

  // The formula is a best-effort server-side pre-filter.  Airtable evaluates {Client/Event}
  // against the linked Event's primary-field value (not the record ID), so the OR/FIND
  // may return 0 rows even when records exist.  The client-side filter below is the real guard.
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

  // If the server formula returned 0 (common when primary-field != record ID), fall back
  // to fetching all recent orders and filtering client-side.
  let candidates = ordersData.records;
  if (candidates.length === 0) {
    const allParams = new URLSearchParams();
    allParams.set("returnFieldsByFieldId", "true");
    allParams.set("pageSize", "100");
    allParams.append("fields[]", BOXED_LUNCH_ORDERS_FIELD_IDS.clientEvent);
    allParams.append("fields[]", BOXED_LUNCH_ORDERS_FIELD_IDS.orderName);
    allParams.append("fields[]", BOXED_LUNCH_ORDERS_FIELD_IDS.orderDate);
    allParams.append("fields[]", BOXED_LUNCH_ORDERS_FIELD_IDS.boxedLunchSelections);
    const allData = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
      `/${BOXED_LUNCH_ORDERS_TABLE}?${allParams.toString()}`
    );
    if (!isErrorResult(allData)) candidates = allData.records;
  }

  // Client-side filter: keep only records actually linked to this event.
  const matchingRecords = candidates.filter((rec) =>
    extractLinkedEventIds((rec.fields ?? {})[BOXED_LUNCH_ORDERS_FIELD_IDS.clientEvent]).includes(eventId)
  );

  if (matchingRecords.length === 0) return [];

  const orders: BoxedLunchOrder[] = [];
  const menuItemCache: Record<string, string> = {};

  for (const rec of matchingRecords) {
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

      // Resolve type name BEFORE building customization payload (which needs the name)
      let boxedLunchTypeName = menuItemCache[boxedLunchTypeId];
      if (!boxedLunchTypeName && boxedLunchTypeId) {
        const cat = getMenuCatalogFieldIds();
        const menuTable = getMenuItemsTable() || "tbl0aN33DGG6R1sPZ";
        const nameField = cat.itemNameFieldId;
        const menuParams = new URLSearchParams();
        menuParams.set("filterByFormula", `RECORD_ID()='${boxedLunchTypeId}'`);
        menuParams.set("returnFieldsByFieldId", "true");
        menuParams.append("fields[]", nameField);
        const menuData = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
          `/${menuTable}?${menuParams.toString()}`
        );
        if (!isErrorResult(menuData) && menuData.records[0]) {
          const nameRaw = (menuData.records[0].fields as Record<string, unknown>)[nameField];
          boxedLunchTypeName = typeof nameRaw === "string" ? nameRaw : "Boxed Lunch";
          menuItemCache[boxedLunchTypeId] = boxedLunchTypeName;
        } else {
          boxedLunchTypeName = "Boxed Lunch";
        }
      } else if (!boxedLunchTypeName) {
        boxedLunchTypeName = "Boxed Lunch";
      }

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
          const sr = asString(cf[BOX_CUSTOMIZATIONS_FIELD_IDS.specialRequests]) || "";
          const partial = partialCustomizationFromAirtableFields(cf, {
            breadType: BOX_CUSTOMIZATIONS_FIELD_IDS.breadType,
            spreads: BOX_CUSTOMIZATIONS_FIELD_IDS.spreads,
            cheeseOption: BOX_CUSTOMIZATIONS_FIELD_IDS.cheeseOption,
            removedItems: BOX_CUSTOMIZATIONS_FIELD_IDS.removedItems,
            customNotes: BOX_CUSTOMIZATIONS_FIELD_IDS.customNotes,
          });
          const fromJson = sr.trim().length > 0 ? decodeCustomizationFromSpecialRequests(sr) : null;
          const merged =
            Object.keys(partial).length > 0 ? mergeCustomizationPayloads(fromJson, partial) : fromJson;
          if (merged) {
            specialRequests = encodeCustomizationForSpecialRequests({
              name: boxedLunchTypeName,
              qty: quantity,
              menuItemId: boxedLunchTypeId,
              breadType: merged.breadType,
              spreads: merged.spreads?.length ? merged.spreads : undefined,
              cheeseOption: merged.cheeseOption,
              customNotes: merged.customNotes?.trim() || undefined,
              removedItems: merged.removedItems?.length ? merged.removedItems : undefined,
            });
          } else {
            specialRequests = sr;
          }
        }
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

async function fetchBoxedLunchOrderSelectionIds(orderId: string): Promise<string[]> {
  const data = await airtableFetch<{ fields?: Record<string, unknown> }>(
    `/${BOXED_LUNCH_ORDERS_TABLE}/${orderId}?returnFieldsByFieldId=true`
  );
  if (isErrorResult(data) || !data.fields) return [];
  return asLinkedRecordIds(data.fields[BOXED_LUNCH_ORDERS_FIELD_IDS.boxedLunchSelections]);
}

async function deleteBoxedLunchOrderItemAndCustomizations(itemId: string): Promise<void | AirtableErrorResult> {
  const itemData = await airtableFetch<{ fields?: Record<string, unknown> }>(
    `/${BOXED_LUNCH_ORDER_ITEMS_TABLE}/${itemId}?returnFieldsByFieldId=true`
  );
  if (isErrorResult(itemData)) return itemData;
  const customIds = asLinkedRecordIds(itemData.fields?.[BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS.customizations]);
  for (const cid of customIds) {
    const delC = await airtableFetch(`/${BOX_CUSTOMIZATIONS_TABLE}/${cid}`, { method: "DELETE" });
    if (isErrorResult(delC)) return delC;
  }
  const delI = await airtableFetch(`/${BOXED_LUNCH_ORDER_ITEMS_TABLE}/${itemId}`, { method: "DELETE" });
  if (isErrorResult(delI)) return delI;
  return;
}

/**
 * Replace linked Boxed Lunch Order Items + Box Customizations from V2 sandwich lines.
 * Salad / entrée boxed products: only clear links (no sandwich Menu Item rows).
 * Lines without `menuItemId` are JSON-only (no Airtable line item).
 */
export async function syncBoxedLunchOrderLinkedItems(
  orderId: string,
  payload: BoxedLunchV2Payload
): Promise<void | AirtableErrorResult> {
  const existingItemIds = await fetchBoxedLunchOrderSelectionIds(orderId);

  const clearPatch = await airtableFetch(`/${BOXED_LUNCH_ORDERS_TABLE}/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({
      fields: { [BOXED_LUNCH_ORDERS_FIELD_IDS.boxedLunchSelections]: [] },
    }),
  });
  if (isErrorResult(clearPatch)) return clearPatch;

  for (const itemId of existingItemIds) {
    const del = await deleteBoxedLunchOrderItemAndCustomizations(itemId);
    if (isErrorResult(del)) return del;
  }

  if (isSaladBoxedLunchBox(payload.boxTypeId)) {
    return;
  }

  const newItemIds: string[] = [];
  for (const line of payload.sandwiches) {
    const qty = Math.max(0, Math.floor(Number(line.qty) || 0));
    const name = String(line.name ?? "").trim();
    const menuId = typeof line.menuItemId === "string" && line.menuItemId.startsWith("rec") ? line.menuItemId : "";
    const bread = (line.breadType ?? "").trim();
    if (qty <= 0 || !name || !menuId || !bread) continue;

    const itemFields: Record<string, unknown> = {
      [BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS.order]: [orderId],
      [BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS.boxedLunchType]: [menuId],
      [BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS.quantity]: qty,
      [BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS.customizations]: [],
    };
    const itemRes = await airtableFetch<{ records?: Array<{ id: string }> }>(
      `/${BOXED_LUNCH_ORDER_ITEMS_TABLE}`,
      { method: "POST", body: JSON.stringify({ records: [{ fields: itemFields }] }) }
    );
    if (isErrorResult(itemRes) || !itemRes.records?.[0]?.id) {
      return { error: true, message: itemRes.message ?? "Failed to create boxed lunch order item" };
    }
    const newItemId = itemRes.records[0].id;

    const specialRequests = encodeCustomizationForSpecialRequests(line);
    const spreads = sanitizeAdditionalSpreads(line.spreads ?? []);
    const removedSorted = [...sanitizeRemovalKeys(line.removedItems ?? [])].sort();
    const notes = (line.customNotes ?? "").trim();
    const customFields: Record<string, unknown> = {
      [BOX_CUSTOMIZATIONS_FIELD_IDS.orderItem]: [newItemId],
      [BOX_CUSTOMIZATIONS_FIELD_IDS.specialRequests]: specialRequests,
      [BOX_CUSTOMIZATIONS_FIELD_IDS.breadType]: bread,
      [BOX_CUSTOMIZATIONS_FIELD_IDS.spreads]: spreads,
      [BOX_CUSTOMIZATIONS_FIELD_IDS.cheeseOption]: cheeseOptionLabelForAirtable(line.cheeseOption),
      [BOX_CUSTOMIZATIONS_FIELD_IDS.removedItems]: removedSorted,
      [BOX_CUSTOMIZATIONS_FIELD_IDS.customNotes]: notes,
    };
    const customRes = await airtableFetch<{ records?: Array<{ id: string }> }>(
      `/${BOX_CUSTOMIZATIONS_TABLE}`,
      { method: "POST", body: JSON.stringify({ records: [{ fields: customFields }] }) }
    );
    if (isErrorResult(customRes) || !customRes.records?.[0]?.id) {
      return { error: true, message: customRes.message ?? "Failed to create box customization" };
    }
    const customId = customRes.records[0].id;

    const linkRes = await airtableFetch(`/${BOXED_LUNCH_ORDER_ITEMS_TABLE}/${newItemId}`, {
      method: "PATCH",
      body: JSON.stringify({
        fields: { [BOXED_LUNCH_ORDER_ITEMS_FIELD_IDS.customizations]: [customId] },
      }),
    });
    if (isErrorResult(linkRes)) return linkRes;

    newItemIds.push(newItemId);
  }

  if (newItemIds.length > 0) {
    const linkOrder = await airtableFetch(`/${BOXED_LUNCH_ORDERS_TABLE}/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({
        fields: { [BOXED_LUNCH_ORDERS_FIELD_IDS.boxedLunchSelections]: newItemIds },
      }),
    });
    if (isErrorResult(linkOrder)) return linkOrder;
  }

  return;
}

/**
 * Create or update the single boxed-lunch V2 record for an event.
 * Stores JSON in `orderName`; syncs Boxed Lunch Order Items + Box Customizations when applicable.
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
    const orderId = sorted[0].id;
    const syncRes = await syncBoxedLunchOrderLinkedItems(orderId, payload);
    if (isErrorResult(syncRes)) return syncRes;
    const emptyPayload: BoxedLunchV2Payload = {
      boxTypeId: payload.boxTypeId,
      sandwiches: [],
      ...(payload.boxSnapshot ? { boxSnapshot: payload.boxSnapshot } : {}),
    };
    for (const row of sorted.slice(1)) {
      const extra = await syncBoxedLunchOrderLinkedItems(row.id, emptyPayload);
      if (isErrorResult(extra)) return extra;
    }
    return { orderId };
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
  const orderId = orderRes.records[0].id;
  const syncRes = await syncBoxedLunchOrderLinkedItems(orderId, payload);
  if (isErrorResult(syncRes)) return syncRes;
  return { orderId };
}

/**
 * Clone all boxed lunch orders from one event to another.
 * Handles V2 (JSON blob) orders by creating new order records linked to the target event.
 */
export async function cloneBoxedLunchOrdersToEvent(
  sourceEventId: string,
  targetEventId: string
): Promise<{ success: true } | AirtableErrorResult> {
  const orders = await loadBoxedLunchOrdersByEventId(sourceEventId);
  if (isErrorResult(orders)) return orders;
  if (orders.length === 0) return { success: true };

  for (const order of orders) {
    const createFields: Record<string, unknown> = {
      [BOXED_LUNCH_ORDERS_FIELD_IDS.orderName]: order.orderName,
      [BOXED_LUNCH_ORDERS_FIELD_IDS.clientEvent]: [targetEventId],
    };
    const createRes = await airtableFetch<{ records?: Array<{ id: string }> }>(
      `/${BOXED_LUNCH_ORDERS_TABLE}`,
      { method: "POST", body: JSON.stringify({ records: [{ fields: createFields }] }) }
    );
    if (isErrorResult(createRes) || !createRes.records?.[0]) {
      return { error: true, message: "Failed to clone boxed lunch order" };
    }
  }
  return { success: true };
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

  const cat = getMenuCatalogFieldIds();
  const menuTable = getMenuItemsTable() || "tbl0aN33DGG6R1sPZ";
  const nameField = cat.itemNameFieldId;
  const typeNames = [...new Set(rows.map((r) => r.boxedLunchType))];
  const nameToId: Record<string, string> = {};
  for (const name of typeNames) {
    const formula = `{Item Name}='${name.replace(/'/g, "\\'")}'`;
    const params = new URLSearchParams();
    params.set("filterByFormula", formula);
    params.set("returnFieldsByFieldId", "true");
    params.append("fields[]", nameField);
    const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
      `/${menuTable}?${params.toString()}`
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
