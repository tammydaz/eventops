/**
 * Boxed lunch print — `orderName` with prefix FWX_BOXED_V2: + JSON (canonical normalize).
 * No shadow menu.
 */
import type { BoxedLunchBoxSnapshot, BoxType, BoxedLunchSandwichLine } from "../config/boxedLunchBeo";
import { getBoxTypeById } from "../config/boxedLunchBeo";
import {
  coalesceBoxedSandwichLines,
  formatBoxedSandwichKitchenGroupedDetailStrings,
} from "../config/boxedLunchCustomization";
import { normalizeBoxedLunchV2Payload } from "../services/airtable/boxedLunchOrders";

const FWX_BOXED_V2_PREFIX = "FWX_BOXED_V2:";

export type BoxedLunchPrintParsed = {
  boxTypeId: string;
  sandwiches: BoxedLunchSandwichLine[];
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
    const parsed = JSON.parse(boxed.orderName.replace(FWX_BOXED_V2_PREFIX, "")) as unknown;
    const normalized = normalizeBoxedLunchV2Payload(parsed);
    if (!normalized) return null;
    const sandwiches = normalized.sandwiches.filter((s) => s.name && s.qty > 0);
    if (sandwiches.length === 0) return null;
    return {
      boxTypeId: normalized.boxTypeId,
      sandwiches,
      ...(normalized.boxSnapshot ? { boxSnapshot: normalized.boxSnapshot } : {}),
    };
  } catch {
    return null;
  }
}

export const BOXED_LUNCH_MISSING_BREAD_ERROR = "Missing bread selection";

/** "fixed" = executive trio placeholder (no bread applies). "n/a" also allowed. */
function isPlaceholderBread(bread: string | undefined): boolean {
  const b = (bread ?? "").trim().toLowerCase();
  return b === "fixed" || b === "n/a" || b === "none";
}

function boxedLunchParsedHasMissingBread(parsed: BoxedLunchPrintParsed): boolean {
  return parsed.sandwiches.some((s) => {
    const q = Math.max(0, Math.floor(Number(s.qty) || 0));
    if (q <= 0) return false;
    if (!(s.name ?? "").trim()) return false;
    if (isPlaceholderBread(s.breadType)) return false; // executive / fixed lines are OK
    return !(s.breadType ?? "").trim();
  });
}

/** Non-null when V2 boxed data exists and any sandwich line with qty & name lacks bread — save/print must fix. */
export function getBoxedLunchBreadValidationError(orders: Array<{ orderName: string }>): string | null {
  const parsed = parseBoxedLunchFromOrders(orders);
  if (!parsed || !boxedLunchParsedHasMissingBread(parsed)) return null;
  return BOXED_LUNCH_MISSING_BREAD_ERROR;
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
  if (boxedLunchParsedHasMissingBread(parsed)) return [];
  const total = parsed.sandwiches.reduce((sum, s) => sum + s.qty, 0);
  if (total <= 0) return [];

  const box = resolveBoxForPrint(parsed.boxTypeId, parsed.boxSnapshot);
  const headerLabel = box?.name ?? parsed.boxSnapshot?.name ?? parsed.boxTypeId;

  // Group sandwiches by type (coalesce identical name+bread combos)
  const grouped = coalesceBoxedSandwichLines(
    parsed.sandwiches.filter((s) => (s.name ?? "").trim() && s.qty > 0)
  );

  // Header row: "FOR [N] | [BoxName] — [sides], [dessert]"
  const sidesStr = box?.sides?.join(", ") ?? "";
  const dessertStr = box?.dessert ?? "";
  const headerDetail = [sidesStr, dessertStr].filter(Boolean).join(" & ");
  const headerName = headerDetail ? `${headerLabel} — ${headerDetail}` : headerLabel;

  const deliItems: BeoMenuLineItem[] = [
    {
      id: "boxed-v2-header",
      name: headerName,
      specQty: `FOR ${total}`,
    },
    ...grouped.map((s, i) => {
      const qty = Math.max(0, Math.floor(s.qty));
      const bread = (s.breadType ?? "").trim();
      const breadLabel = isPlaceholderBread(bread) ? "" : bread;
      const label = breadLabel
        ? `${(s.name ?? "").trim()} — ${breadLabel}`
        : (s.name ?? "").trim();
      return {
        id: `boxed-v2-line-${i}`,
        name: label,
        specQty: String(qty),
      };
    }),
  ];

  const out: BeoPrintSectionSlice[] = [
    { title: "BOXED ITEMS — INDIVIDUAL PACKAGING", fieldId: "boxed-lunch-v2-deli", items: deliItems },
  ];

  if (box) {
    out.push(
      {
        title: "BOXED LUNCH — SIDES",
        fieldId: "boxed-lunch-v2-salad",
        items: box.sides.map((side, i) => ({
          id: `boxed-v2-side-${i}`,
          name: side,
          specQty: String(total),
        })),
      },
      {
        title: "BOXED LUNCH — DESSERTS",
        fieldId: "boxed-lunch-v2-dessert",
        items: [{ id: "boxed-v2-dessert", name: box.dessert, specQty: String(total) }],
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
  if (boxedLunchParsedHasMissingBread(parsed)) return [];
  const total = parsed.sandwiches.reduce((sum, s) => sum + s.qty, 0);
  if (total <= 0) return [];

  const box = resolveBoxForPrint(parsed.boxTypeId, parsed.boxSnapshot);
  const headerLabel = box?.name ?? parsed.boxSnapshot?.name ?? parsed.boxTypeId;

  const groupedSandwiches = coalesceBoxedSandwichLines(
    parsed.sandwiches.filter((s) => (s.name ?? "").trim() && s.qty > 0)
  );

  // For fixed-menu boxes (executive), suppress "sandwich build" header
  const isFixedMenu = groupedSandwiches.length === 1 && isPlaceholderBread(groupedSandwiches[0]?.breadType);

  const deliItems: KitchenMenuSectionSlice["items"] = [
    {
      qty: "—",
      name: isFixedMenu
        ? `${headerLabel} — ${total} box${total === 1 ? "" : "es"}`
        : `${headerLabel} — sandwich build (grouped by configuration)`,
    },
    ...(isFixedMenu
      ? []
      : groupedSandwiches.map((s) => {
          const qtyStr = String(Math.max(0, Math.floor(s.qty)));
          const detailStrs = formatBoxedSandwichKitchenGroupedDetailStrings(s).filter(
            (d) => !d.toLowerCase().startsWith("bread: fixed") && !d.toLowerCase().startsWith("bread: n/a")
          );
          const subLines = detailStrs.map((text) => ({
            text: text.startsWith("*") ? text : `- ${text}`,
          }));
          return {
            qty: qtyStr,
            name: (s.name ?? "").trim(),
            ...(subLines.length > 0 ? { subItems: subLines } : {}),
          };
        })),
  ];
  const out: KitchenMenuSectionSlice[] = [
    { title: "BOXED ITEMS — INDIVIDUAL PACKAGING", vessel: "", items: deliItems },
  ];
  if (box) {
    out.push(
      {
        title: "BOXED LUNCH — SIDES",
        vessel: "",
        items: box.sides.map((side) => ({ qty: "—", name: `${total} ${side}` })),
      },
      {
        title: "BOXED LUNCH — DESSERTS",
        vessel: "",
        items: [{ qty: "—", name: `${total} ${box.dessert}` }],
      }
    );
  }
  return out;
}
