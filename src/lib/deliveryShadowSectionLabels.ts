/**
 * Delivery BEO section labels — locked structure (2026-03-27).
 * HOT FOOD → COLD / DELI → BOXED ITEMS → DESSERT / SNACKS → BEVERAGES → SERVICEWARE
 */

/** Merged block: passed + presented only (legacy key used internally) */
export const DELIVERY_HOT_APPETIZERS_BLOCK_KEY = "__DELIVERY_HOT_APPETIZERS__";

export const DELIVERY_HOT_APPETIZER_INTERNAL: readonly string[] = ["Passed Appetizers", "Presented Appetizers"];

const DELIVERY_SHADOW_SECTION_HEADING: Record<string, string> = {
  // Full-service field names → delivery BEO section headers
  "Buffet – Metal": "HOT FOOD — TIN / HEATED",
  "Buffet – China": "COLD / DELI — PLASTIC CONTAINER",
  Deli: "COLD / DELI — PLASTIC CONTAINER",
  Desserts: "DESSERT / SNACKS",
  "Room Temp": "COLD / DELI — PLASTIC CONTAINER",
  "Room Temp / Display": "COLD / DELI — PLASTIC CONTAINER",
};

/** Intake / preview heading for one shadow section key. */
export function shadowSectionHeading(isDelivery: boolean, section: string): string {
  if (!isDelivery) return section;
  if (DELIVERY_HOT_APPETIZER_INTERNAL.includes(section)) return "HOT FOOD — TIN / HEATED";
  return DELIVERY_SHADOW_SECTION_HEADING[section] ?? section;
}

/** Food-list section order for delivery (locked structure). */
export function deliveryFoodListSectionKeys(isDelivery: boolean, bySection: Record<string, unknown[]>, sectionOrder: string[]): string[] {
  if (!isDelivery) {
    const withItems = sectionOrder.filter((s) => (bySection[s]?.length ?? 0) > 0);
    const extra = Object.keys(bySection).filter((s) => !sectionOrder.includes(s) && (bySection[s]?.length ?? 0) > 0);
    return [...withItems, ...extra];
  }
  const hotAppHas = DELIVERY_HOT_APPETIZER_INTERNAL.some((s) => (bySection[s]?.length ?? 0) > 0);
  const hotHas = (bySection["Buffet – Metal"]?.length ?? 0) > 0;
  const coldDeliSections = ["Deli", "Buffet – China", "Room Temp", "Room Temp / Display"];
  const coldHas = coldDeliSections.some((s) => (bySection[s]?.length ?? 0) > 0);
  const dessertsHas = (bySection["Desserts"]?.length ?? 0) > 0;
  const extra = Object.keys(bySection).filter(
    (s) =>
      !sectionOrder.includes(s) &&
      !DELIVERY_HOT_APPETIZER_INTERNAL.includes(s) &&
      s !== "Buffet – Metal" &&
      !coldDeliSections.includes(s) &&
      s !== "Desserts" &&
      (bySection[s]?.length ?? 0) > 0
  );
  return [
    ...(hotAppHas ? [DELIVERY_HOT_APPETIZERS_BLOCK_KEY] : []),
    ...(hotHas ? ["Buffet – Metal"] : []),
    ...(coldHas ? coldDeliSections.filter((s) => (bySection[s]?.length ?? 0) > 0) : []),
    ...(dessertsHas ? ["Desserts"] : []),
    ...extra,
  ];
}

export function deliveryHotAppetizerRows<T>(bySection: Record<string, T[]>): T[] {
  return DELIVERY_HOT_APPETIZER_INTERNAL.flatMap((s) => bySection[s] ?? []);
}
