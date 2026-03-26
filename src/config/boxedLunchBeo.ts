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
    id: "premium-werx",
    name: "Premium Werx Box",
    sides: ["Pasta Salad", "Fruit Salad", "Chips"],
    dessert: "Brownie Square",
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

/** Single-line header for print: "Premium Werx Box - pasta salad, fruit salad, chips, brownie square" */
export function formatBoxTypeHeaderLine(box: BoxType): string {
  const parts = [...box.sides.map((s) => s.toLowerCase()), box.dessert.toLowerCase()];
  return `${box.name} - ${parts.join(", ")}`;
}

export type BoxedLunchSandwichLine = { name: string; qty: number };

/** Airtable Menu Items id for “Salad Boxed Lunch” (entrée salad counts, not sandwiches). */
export const SALAD_BOXED_LUNCH_BOX_TYPE_ID = "recLYTCqkmX77u5qI";

/** Entrée salad options from catalog copy (matches client-facing description on that Menu Item). */
export const SALAD_BOXED_LUNCH_ENTREE_CHOICES: readonly string[] = [
  "Grilled Chicken Caesar",
  "Cobb",
  "Asian Chicken",
  "Mediterranean",
];

/** Salad Boxed Lunch uses fixed salad lines + qty; other box types use free-text sandwich lines. */
export function isSaladBoxedLunchBox(boxTypeId: string, box?: BoxType): boolean {
  if (boxTypeId === SALAD_BOXED_LUNCH_BOX_TYPE_ID) return true;
  const raw = (box?.name ?? "").toLowerCase().replace(/[–—-]\s*$/g, "").trim();
  return raw.includes("salad boxed lunch");
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
