/**
 * Delivery BEO: section headings and shadow Event Menu row grouping.
 * Section order and titles come only from DELIVERY_SECTION_CONFIG.
 */
import {
  DELIVERY_SECTION_CONFIG,
  DELIVERY_SECTION_SHADOW_KEYS,
} from "../config/deliverySectionConfig";

/** Resolve preview / UI heading for a shadow section name or a delivery row title. */
export function shadowSectionHeading(isDelivery: boolean, section: string): string {
  if (!isDelivery) return section;
  if (DELIVERY_SECTION_CONFIG.some((c) => c.title === section)) return section;
  for (let i = 0; i < DELIVERY_SECTION_SHADOW_KEYS.length; i++) {
    if (DELIVERY_SECTION_SHADOW_KEYS[i].includes(section)) return DELIVERY_SECTION_CONFIG[i].title;
  }
  return section;
}

/** Aggregate shadow menu rows for one delivery row (by config title). */
export function rowsForDeliverySectionTitle<T>(sectionTitle: string, bySection: Record<string, T[]>): T[] {
  const idx = DELIVERY_SECTION_CONFIG.findIndex((c) => c.title === sectionTitle);
  if (idx < 0) return bySection[sectionTitle] ?? [];
  const keys = DELIVERY_SECTION_SHADOW_KEYS[idx];
  return keys.flatMap((k) => bySection[k] ?? []);
}

/**
 * Section keys to render for the food list / preview.
 * Delivery: only titles from DELIVERY_SECTION_CONFIG that have at least one row in a mapped shadow section.
 */
export function deliveryFoodListSectionKeys(
  isDelivery: boolean,
  bySection: Record<string, unknown[]>,
  sectionOrder: string[]
): string[] {
  if (!isDelivery) {
    const withItems = sectionOrder.filter((s) => (bySection[s]?.length ?? 0) > 0);
    const extra = Object.keys(bySection).filter((s) => !sectionOrder.includes(s) && (bySection[s]?.length ?? 0) > 0);
    return [...withItems, ...extra];
  }
  const out: string[] = [];
  for (let i = 0; i < DELIVERY_SECTION_CONFIG.length; i++) {
    const keys = DELIVERY_SECTION_SHADOW_KEYS[i];
    const has = keys.some((k) => (bySection[k]?.length ?? 0) > 0);
    if (has) out.push(DELIVERY_SECTION_CONFIG[i].title);
  }
  return out;
}
