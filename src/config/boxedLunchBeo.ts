/**
 * Boxed lunch BEO model — office takes sandwich counts; kitchen runs bulk sides/dessert.
 * Box type = template only (what ships in every box). No per-sandwich sides/dessert.
 */

export type BoxType = {
  id: string;
  name: string;
  /** Component sides included in every box (bulk qty = total boxes). */
  sides: string[];
  dessert: string;
};

/** Authoritative box templates (add types here; ids stable for stored payloads). */
export const BOX_TYPES: BoxType[] = [
  {
    id: "super-saver-werx",
    name: "Super Saver Werx Box",
    sides: ["Pasta Salad", "Whole Fruit"],
    dessert: "Cookie",
  },
  {
    id: "premium-werx",
    name: "Premium Werx Box",
    sides: ["Pasta Salad", "Fruit Salad", "Chips"],
    dessert: "Brownie Square",
  },
  {
    id: "executive-werx",
    name: "Executive Werx Box",
    sides: ["Potato Salad", "Grilled Vegetables", "Artisan Roll"],
    dessert: "Brownie Square",
  },
  {
    id: "basic-saladwerx",
    name: "Basic Saladwerx Box",
    sides: ["Pasta Salad", "Artisan Roll", "Whole Fruit"],
    dessert: "Cookie",
  },
  {
    id: "premium-saladwerx",
    name: "Premium Saladwerx Box",
    sides: ["Artisan Roll", "Whole Fruit"],
    dessert: "Brownie Bar",
  },
  {
    id: "executive-saladwerx",
    name: "Executive Saladwerx Box",
    sides: ["Pasta Salad", "Artisan Roll", "Chocolate Dipped Fruit"],
    dessert: "Cannolis",
  },
];

/** Resolve box template by id; pass `merged` when UI includes Airtable-backed types (rec… ids). */
export function getBoxTypeById(id: string, merged?: BoxType[]): BoxType | undefined {
  const list = merged ?? BOX_TYPES;
  return list.find((b) => b.id === id);
}

/** Map a Menu Items row (Child Items = components) into sides + dessert for print. */
export function menuItemRecordToBoxType(m: {
  id: string;
  name: string;
  childItems?: string[];
}): BoxType {
  const kids = m.childItems ?? [];
  if (kids.length === 0) {
    return { id: m.id, name: m.name, sides: [], dessert: "—" };
  }
  if (kids.length === 1) {
    return { id: m.id, name: m.name, sides: [], dessert: kids[0] };
  }
  return {
    id: m.id,
    name: m.name,
    sides: kids.slice(0, -1),
    dessert: kids[kids.length - 1] ?? "—",
  };
}

/** Static templates first; Airtable rows appended (skip duplicate ids). */
export function mergeBoxTypesWithAirtable(
  staticTypes: BoxType[],
  airtableItems: Array<{ id: string; name: string; childItems?: string[] }>
): BoxType[] {
  const fromAirtable = airtableItems.map(menuItemRecordToBoxType);
  const staticIds = new Set(staticTypes.map((b) => b.id));
  return [...staticTypes, ...fromAirtable.filter((b) => !staticIds.has(b.id))];
}

/** Stored Menu Item name (and JSON snapshot) stays "Classic Boxed Lunch"; intake UI only uses this label. */
export const CLASSIC_BOXED_LUNCH_STORED_NAME = "Classic Boxed Lunch";
export const CLASSIC_BOXED_LUNCH_UI_LABEL = "Classic Boxed Lunch (Super Saver)";

/** Menu Items record id for the Classic Boxed Lunch box product (same as boxedLunchSandwichAllowlist). */
export const CLASSIC_BOXED_LUNCH_BOX_TYPE_RECORD_ID = "rectixyPfz9QIIuw9";

const BOX_TYPE_UI_LABEL_BY_ID: Record<string, string> = {
  [CLASSIC_BOXED_LUNCH_BOX_TYPE_RECORD_ID]: CLASSIC_BOXED_LUNCH_UI_LABEL,
};

const BOX_TYPE_UI_LABEL_BY_STORED_NAME: Record<string, string> = {
  [CLASSIC_BOXED_LUNCH_STORED_NAME]: CLASSIC_BOXED_LUNCH_UI_LABEL,
};

/**
 * Box type label for BEO Intake boxed lunch UI only. Does not change `boxTypeId`, `boxSnapshot`, or print payloads.
 */
export function displayBoxTypeLabelForUi(box: Pick<BoxType, "id" | "name">): string {
  const byId = BOX_TYPE_UI_LABEL_BY_ID[box.id];
  if (byId) return byId;
  const n = box.name.trim();
  return BOX_TYPE_UI_LABEL_BY_STORED_NAME[n] ?? box.name;
}

/** True when the selected box is Classic Boxed Lunch or Super Saver (category-based classic sandwich catalog). */
export function isClassicBoxedLunchBoxType(boxTypeId: string, box?: Pick<BoxType, "id" | "name"> | null): boolean {
  if (boxTypeId === CLASSIC_BOXED_LUNCH_BOX_TYPE_RECORD_ID) return true;
  if (boxTypeId === "super-saver-werx") return true;
  const n = (box?.name ?? "").trim().toLowerCase();
  return n === CLASSIC_BOXED_LUNCH_STORED_NAME.toLowerCase() || n.includes("super saver");
}

/** Single-line header for print: "Premium Werx Box - pasta salad, fruit salad, chips, brownie square" */
export function formatBoxTypeHeaderLine(box: BoxType): string {
  const parts = [...box.sides.map((s) => s.toLowerCase()), box.dessert.toLowerCase()];
  return `${box.name} - ${parts.join(", ")}`;
}

export type BoxedLunchCheeseOption = "default" | "none" | "special";

/** One persisted row = one identical configuration; qty is count of identical sandwiches only. */
export type BoxedLunchSandwichLine = {
  name: string;
  /** Persisted as `qty`; JSON may use `quantity` (normalized on load). */
  qty: number;
  /** Menu Items record id — required for corporate sandwich saves (Airtable line item). */
  menuItemId?: string;
  breadType?: string;
  /** Additional spreads only (e.g. Foodwerx secret sauce). Default mayo/mustard are implied unless in `removedItems`. */
  spreads?: string[];
  cheeseOption?: BoxedLunchCheeseOption;
  /** Canonical keys: lettuce | tomato | mayo | mustard | cheese — unchecked “included” defaults. */
  removedItems?: string[];
  customNotes?: string;
};

/** Airtable Menu Items id for “Salad Boxed Lunch” (entrée salad counts, not sandwiches). */
export const SALAD_BOXED_LUNCH_BOX_TYPE_ID = "recLYTCqkmX77u5qI";

/** Additional boxed products that use entrée salad counts (same UX as Salad Boxed Lunch). */
export const SALADWERX_BOXED_LUNCH_BOX_TYPE_IDS: readonly string[] = [
  // Static ids (BOX_TYPES)
  "basic-saladwerx",
  "premium-saladwerx",
  "executive-saladwerx",
  // Legacy Airtable record ids (kept for backwards compat)
  "rec7egpNTdVDYXRue",
  "recQsORHJahRqq0WH",
  "recaWIyntIBij4E7m",
];

/** Entrée salad options from catalog copy (matches client-facing description on that Menu Item). */
export const SALAD_BOXED_LUNCH_ENTREE_CHOICES: readonly string[] = [
  "Grilled Chicken Caesar",
  "Country Cobb",
  "White Grape Chicken Salad",
  "Honey Stung Chicken Salad",
  "Gochujang Chicken Salad",
  "Albacore Tuna Salad",
  "Deviled Egg Salad",
  "Southwest Shrimp Salad",
];

/** Executive Werx Box: fixed trio (no sandwich/salad picker — just a guest count). */
export function isExecutiveWerxBox(boxTypeId: string, box?: BoxType): boolean {
  if (boxTypeId === "executive-werx") return true;
  const raw = (box?.name ?? "").toLowerCase().trim();
  return raw.startsWith("executive werx") || raw === "executive werx box";
}

/** Salad Boxed Lunch uses fixed salad lines + qty; other box types use free-text sandwich lines. */
export function isSaladBoxedLunchBox(boxTypeId: string, box?: BoxType): boolean {
  if (boxTypeId === SALAD_BOXED_LUNCH_BOX_TYPE_ID) return true;
  if (SALADWERX_BOXED_LUNCH_BOX_TYPE_IDS.includes(boxTypeId)) return true;
  const raw = (box?.name ?? "").toLowerCase().replace(/[–—-]\s*$/g, "").trim();
  return raw.includes("salad boxed lunch") || raw.includes("saladwerx");
}

/** Persisted with V2 so BEO print works for Airtable-only box ids without a local catalog fetch. */
export type BoxedLunchBoxSnapshot = {
  name: string;
  sides: string[];
  dessert: string;
};

export type BoxedLunchV2Payload = {
  boxTypeId: string;
  sandwiches: BoxedLunchSandwichLine[];
  boxSnapshot?: BoxedLunchBoxSnapshot;
};

export function totalBoxesFromSandwiches(sandwiches: BoxedLunchSandwichLine[]): number {
  return sandwiches.reduce((n, s) => n + Math.max(0, Math.floor(s.qty || 0)), 0);
}

/** Matches save rules: only lines with a real sandwich name and qty count as “has boxed lunch”. */
export function v2BoxedPayloadHasSavedSandwiches(v2: BoxedLunchV2Payload): boolean {
  return v2.sandwiches.some(
    (s) => String(s.name ?? "").trim() !== "" && Math.max(0, Math.floor(Number(s.qty) || 0)) > 0
  );
}

/** Optional autocomplete for sandwich names (office-style free text still allowed). */
export const SANDWICH_NAME_SUGGESTIONS: string[] = [
  "Smoked Turkey",
  "Parmesan Crusted Chicken",
  "Eye Round of Beef",
  "Italian Hoagie",
  "Acapulco Turkey BLT",
  "Honey Stung Chicken",
  "foodwerx Italian Hoagie",
];
