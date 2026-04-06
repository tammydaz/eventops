/**
 * Single source of truth for delivery BEO menu sections (intake, print, kitchen BEO, shadow preview).
 * Do not duplicate section lists elsewhere — import this.
 */
import { FIELD_IDS } from "../services/airtable/events";

export type DeliverySectionConfigRow = {
  title: string;
  fieldIds: readonly string[];
  customFieldIds: readonly string[];
};

/** Locked delivery structure — same merge order as BeoPrintPage / KitchenBEOPrintPage */
export const DELIVERY_SECTION_CONFIG: readonly DeliverySectionConfigRow[] = [
  {
    title: "HOT FOOD — TIN / HEATED",
    fieldIds: [FIELD_IDS.BUFFET_METAL, FIELD_IDS.PASSED_APPETIZERS, FIELD_IDS.PRESENTED_APPETIZERS],
    customFieldIds: [FIELD_IDS.CUSTOM_BUFFET_METAL, FIELD_IDS.CUSTOM_PASSED_APP, FIELD_IDS.CUSTOM_PRESENTED_APP],
  },
  {
    title: "COLD / DELI — PLASTIC CONTAINER",
    fieldIds: [FIELD_IDS.DELIVERY_DELI, FIELD_IDS.BUFFET_CHINA, FIELD_IDS.ROOM_TEMP_DISPLAY],
    customFieldIds: [FIELD_IDS.CUSTOM_DELIVERY_DELI, FIELD_IDS.CUSTOM_BUFFET_CHINA, FIELD_IDS.CUSTOM_ROOM_TEMP_DISPLAY],
  },
  {
    title: "DESSERT / SNACKS",
    fieldIds: [FIELD_IDS.DESSERTS],
    customFieldIds: [FIELD_IDS.CUSTOM_DESSERTS],
  },
] as const;

/**
 * Event Menu (shadow) "Section" values that belong to each DELIVERY_SECTION_CONFIG row (same order).
 * Used to aggregate preview rows and order sections — not for Airtable field wiring.
 */
export const DELIVERY_SECTION_SHADOW_KEYS: readonly (readonly string[])[] = [
  ["Passed Appetizers", "Presented Appetizers", "Buffet – Metal"],
  ["Deli", "Buffet – China", "Room Temp", "Room Temp / Display"],
  ["Desserts"],
] as const;
