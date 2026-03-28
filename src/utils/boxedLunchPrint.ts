/**
 * Boxed lunch print — ONLY `orderName` with prefix FWX_BOXED_V2: + JSON.parse.
 * No o.v2, no legacy order items, no shadow menu.
 */
import type { BoxedLunchBoxSnapshot, BoxType } from "../config/boxedLunchBeo";
import { getBoxTypeById } from "../config/boxedLunchBeo";

const FWX_BOXED_V2_PREFIX = "FWX_BOXED_V2:";

export type BoxedLunchPrintParsed = {
  boxTypeId: string;
  sandwiches: { name: string; qty: number }[];
  boxSnapshot?: BoxedLunchBoxSnapshot;
};

function resolveBoxForPrint(
  boxTypeId: string,
  boxSnapshot?: BoxedLunchBoxSnapshot
): BoxType | null {
  const fromConfig = getBoxTypeById(boxTypeId);
  if (fromConfig) return fromConfig;
  if (boxSnapshot)
    return {
      id: boxTypeId,
      name: boxSnapshot.name,
      sides: boxSnapshot.sides,
      dessert: boxSnapshot.dessert,
    };
  return null;
}

/** Find boxed order row and parse JSON from orderName (trim / BOM-safe). */
export function parseBoxedLunchFromOrders(
  orders: Array<{ orderName: string }>
): BoxedLunchPrintParsed | null {
  const boxed = orders.find((o) =>
    (o.orderName || "").trim().replace(/^\uFEFF/, "").startsWith(FWX_BOXED_V2_PREFIX)
  );
  if (!boxed?.orderName) return null;
  try {
    const parsed = JSON.parse(boxed.orderName.replace(FWX_BOXED_V2_PREFIX, "")) as {
      boxTypeId?: unknown;
      sandwiches?: unknown;
    };
    const boxTypeId =
      typeof parsed.boxTypeId === "string"
        ? parsed.boxTypeId.trim()
        : parsed.boxTypeId != null && parsed.boxTypeId !== ""
          ? String(parsed.boxTypeId).trim()
          : "";
    if (!boxTypeId) return null;
    const arr = Array.isArray(parsed.sandwiches) ? parsed.sandwiches : [];
    const sandwiches = arr
      .map((row) => {
        if (!row || typeof row !== "object" || Array.isArray(row)) return { name: "", qty: 0 };
        const r = row as Record<string, unknown>;
        const name =
          typeof r.name === "string" ? r.name.trim() : r.name != null ? String(r.name).trim() : "";
        const qRaw = r.qty !== undefined ? r.qty : r.quantity;
        const qty =
          typeof qRaw === "number" && !Number.isNaN(qRaw)
            ? Math.max(0, Math.floor(qRaw))
            : typeof qRaw === "string" && qRaw.trim() !== ""
              ? Math.max(0, Math.floor(Number(qRaw.trim()) || 0))
              : 0;
        return { name, qty };
      })
      .filter((s) => s.name && s.qty > 0);
    if (sandwiches.length === 0) return null;
    const snapRaw = parsed.boxSnapshot;
    let boxSnapshot: BoxedLunchBoxSnapshot | undefined;
    if (snapRaw && typeof snapRaw === "object" && !Array.isArray(snapRaw)) {
      const s = snapRaw as Record<string, unknown>;
      const n = typeof s.name === "string" ? s.name.trim() : "";
      const d = typeof s.dessert === "string" ? s.dessert.trim() : "";
      const sidesArr = Array.isArray(s.sides)
        ? s.sides.map((x) => (typeof x === "string" ? x : String(x))).filter(Boolean)
        : [];
      if (n || sidesArr.length || d) {
        boxSnapshot = { name: n || "Boxed lunch", sides: sidesArr, dessert: d || "—" };
      }
    }
    return { boxTypeId, sandwiches, ...(boxSnapshot ? { boxSnapshot } : {}) };
  } catch {
    return null;
  }
}

/** Match BeoPrintPage MenuLineItem (avoid importing page → circular). */
type BeoMenuLineItem = {
  id: string;
  name: string;
  specQty?: string;
  specVessel?: string;
  packOutItems?: string;
  loaded?: boolean;
};

export type BeoPrintSectionSlice = { title: string; fieldId: string; items: BeoMenuLineItem[] };

/** Kitchen BEO MenuSection slice */
export type KitchenMenuSectionSlice = {
  title: string;
  vessel: string;
  items: Array<{
    qty: string;
    name: string;
    groupHeader?: string;
    subItems?: { text: string }[];
  }>;
};

export function buildBoxedLunchBeoSectionsFromOrders(
  orders: Array<{ orderName: string }>
): BeoPrintSectionSlice[] {
  const parsed = parseBoxedLunchFromOrders(orders);
  if (!parsed) return [];
  const total = parsed.sandwiches.reduce((sum, s) => sum + s.qty, 0);
  if (total <= 0) return [];

  const box = resolveBoxForPrint(parsed.boxTypeId, parsed.boxSnapshot);
  const headerLabel = box?.name ?? parsed.boxSnapshot?.name ?? parsed.boxTypeId;

  const deliBoxed: BeoMenuLineItem[] = [
    { id: "boxed-v2-header", name: headerLabel, specQty: "" },
    ...parsed.sandwiches.map((s, i) => ({
      id: `boxed-v2-sw-${i}`,
      name: `${s.qty} ${s.name}`,
      specQty: "",
    })),
  ];
  const out: BeoPrintSectionSlice[] = [
    { title: "BOXED ITEMS — INDIVIDUAL PACKAGING", fieldId: "boxed-lunch-v2-deli", items: deliBoxed },
  ];
  if (box) {
    out.push(
      {
        title: "COLD / DELI — PLASTIC CONTAINER",
        fieldId: "boxed-lunch-v2-salad",
        items: box.sides.map((side, i) => ({
          id: `boxed-v2-side-${i}`,
          name: `${total} ${side}`,
          specQty: "",
        })),
      },
      {
        title: "DESSERT / SNACKS",
        fieldId: "boxed-lunch-v2-dessert",
        items: [{ id: "boxed-v2-dessert", name: `${total} ${box.dessert}`, specQty: "" }],
      }
    );
  }
  return out;
}

export function buildBoxedLunchKitchenSectionsFromOrders(
  orders: Array<{ orderName: string }>
): KitchenMenuSectionSlice[] {
  const parsed = parseBoxedLunchFromOrders(orders);
  if (!parsed) return [];
  const total = parsed.sandwiches.reduce((sum, s) => sum + s.qty, 0);
  if (total <= 0) return [];

  const box = resolveBoxForPrint(parsed.boxTypeId, parsed.boxSnapshot);
  const headerLabel = box?.name ?? parsed.boxSnapshot?.name ?? parsed.boxTypeId;

  const deliItems: KitchenMenuSectionSlice["items"] = [
    { qty: "—", name: headerLabel },
    ...parsed.sandwiches.map((s) => ({
      qty: "—",
      name: `${s.qty} ${s.name}`,
    })),
  ];
  const out: KitchenMenuSectionSlice[] = [
    { title: "BOXED ITEMS — INDIVIDUAL PACKAGING", vessel: "", items: deliItems },
  ];
  if (box) {
    out.push(
      {
        title: "COLD / DELI — PLASTIC CONTAINER",
        vessel: "",
        items: box.sides.map((side) => ({ qty: "—", name: `${total} ${side}` })),
      },
      {
        title: "DESSERT / SNACKS",
        vessel: "",
        items: [{ qty: "—", name: `${total} ${box.dessert}` }],
      }
    );
  }
  return out;
}
