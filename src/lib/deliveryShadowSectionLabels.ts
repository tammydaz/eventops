/**
 * Delivery BEO intake / preview labels — operator-facing names (not print slug).
 * Shadow rows still use full-service section keys for Airtable.
 */

/** Merged block: passed + presented only */
export const DELIVERY_HOT_APPETIZERS_BLOCK_KEY = "__DELIVERY_HOT_APPETIZERS__";

export const DELIVERY_HOT_APPETIZER_INTERNAL: readonly string[] = ["Passed Appetizers", "Presented Appetizers"];

const DELIVERY_SHADOW_SECTION_HEADING: Record<string, string> = {
  "Buffet – Metal": "Buffet hot",
  "Buffet – China": "Buffet disposable",
  Deli: "Deli / sandwiches",
  Desserts: "Dessert disposable",
  "Room Temp": "Salads — disposable",
  "Room Temp / Display": "Salads — disposable",
};

/** Intake / preview heading for one shadow section key. */
export function shadowSectionHeading(isDelivery: boolean, section: string): string {
  if (!isDelivery) return section;
  if (DELIVERY_HOT_APPETIZER_INTERNAL.includes(section)) return "Appetizers — hot appetizers — disposable";
  return DELIVERY_SHADOW_SECTION_HEADING[section] ?? section;
}

/** Food-list section order for delivery (merged hot appetizers; buffet metal & china separate). */
export function deliveryFoodListSectionKeys(isDelivery: boolean, bySection: Record<string, unknown[]>, sectionOrder: string[]): string[] {
  if (!isDelivery) {
    const withItems = sectionOrder.filter((s) => (bySection[s]?.length ?? 0) > 0);
    const extra = Object.keys(bySection).filter((s) => !sectionOrder.includes(s) && (bySection[s]?.length ?? 0) > 0);
    return [...withItems, ...extra];
  }
  const hotAppHas = DELIVERY_HOT_APPETIZER_INTERNAL.some((s) => (bySection[s]?.length ?? 0) > 0);
  const metalHas = (bySection["Buffet – Metal"]?.length ?? 0) > 0;
  const restOrder = ["Buffet – China", "Deli", "Desserts", "Room Temp", "Room Temp / Display"];
  const rest = restOrder.filter((s) => (bySection[s]?.length ?? 0) > 0);
  const extra = Object.keys(bySection).filter(
    (s) =>
      !sectionOrder.includes(s) &&
      !DELIVERY_HOT_APPETIZER_INTERNAL.includes(s) &&
      s !== "Buffet – Metal" &&
      (bySection[s]?.length ?? 0) > 0
  );
  return [...(hotAppHas ? [DELIVERY_HOT_APPETIZERS_BLOCK_KEY] : []), ...(metalHas ? ["Buffet – Metal"] : []), ...rest, ...extra];
}

export function deliveryHotAppetizerRows<T>(bySection: Record<string, T[]>): T[] {
  return DELIVERY_HOT_APPETIZER_INTERNAL.flatMap((s) => bySection[s] ?? []);
}
