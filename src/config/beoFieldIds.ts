/**
 * BEO Field ID Constants
 * Centralized field IDs for BEO-related Airtable operations.
 *
 * Events table field IDs are re-exported from FIELD_IDS in events.ts.
 * Menu Items table field IDs are defined here.
 *
 * NEVER use raw field ID strings — always use these constants.
 * NEVER write to formula/computed fields (marked READ ONLY below).
 */

import { FIELD_IDS } from "../services/airtable/events";

// ── Airtable Table IDs ───────────────────────────────────────────────────────

/** Menu Items table ID */
export const MENU_ITEMS_TABLE_ID = "tbl0aN33DGG6R1sPZ";

// ── Events Table — BEO Header Fields ────────────────────────────────────────

export const BEO_EVENTS = {
  /** Formula – display name for the event (READ ONLY) */
  JOB_NUMBER: FIELD_IDS.EVENT_NAME,

  /** Client first name (used as display label) */
  CLIENT_DISPLAY: FIELD_IDS.CLIENT_FIRST_NAME,

  /** Client last name */
  CLIENT_LAST_NAME: FIELD_IDS.CLIENT_LAST_NAME,

  /** Client phone number */
  CLIENT_PHONE: FIELD_IDS.CLIENT_PHONE,

  /** Venue name */
  VENUE_NAME: FIELD_IDS.VENUE_NAME,

  /** Venue / Event Location address */
  EVENT_LOCATION: FIELD_IDS.VENUE_ADDRESS,

  /** Formula – full venue address (READ ONLY) */
  VENUE_FULL_ADDRESS: FIELD_IDS.VENUE_FULL_ADDRESS,

  /** Venue city */
  VENUE_CITY: FIELD_IDS.VENUE_CITY,

  /** Venue state */
  VENUE_STATE: FIELD_IDS.VENUE_STATE,

  /** Event date */
  EVENT_DATE: FIELD_IDS.EVENT_DATE,

  /** Guest count */
  GUEST_COUNT: FIELD_IDS.GUEST_COUNT,

  /** Event start time */
  EVENT_START_TIME: FIELD_IDS.EVENT_START_TIME,

  /** Event end time */
  EVENT_END_TIME: FIELD_IDS.EVENT_END_TIME,

  /** FoodWerx arrival time */
  EVENT_ARRIVAL_TIME: FIELD_IDS.FOODWERX_ARRIVAL,

  /** Dispatch time */
  DISPATCH_TIME: FIELD_IDS.DISPATCH_TIME,

  /** Service style single-select */
  SERVICE_STYLE: FIELD_IDS.SERVICE_STYLE,

  /** Dietary / allergy notes */
  DIETARY_NOTES: FIELD_IDS.DIETARY_NOTES,

  /** Special / ops notes */
  SPECIAL_NOTES: FIELD_IDS.SPECIAL_NOTES,
} as const;

// ── Events Table — Menu Selection Fields ────────────────────────────────────

export const BEO_MENU_FIELDS = {
  /** Linked records → Menu Items (Passed Appetizers) */
  PASSED_APPETIZERS: FIELD_IDS.PASSED_APPETIZERS,

  /** Linked records → Menu Items (Presented Appetizers) */
  PRESENTED_APPETIZERS: FIELD_IDS.PRESENTED_APPETIZERS,

  /** Linked records → Menu Items (Buffet – Metal) */
  BUFFET_METAL: FIELD_IDS.BUFFET_METAL,

  /** Linked records → Menu Items (Buffet – China) */
  BUFFET_CHINA: FIELD_IDS.BUFFET_CHINA,

  /** Linked records → Menu Items (Desserts) */
  DESSERTS: FIELD_IDS.DESSERTS,

  /** Linked records → Menu Items (Beverages) */
  BEVERAGES: FIELD_IDS.BEVERAGES,

  /** Custom free-text passed appetizers */
  CUSTOM_PASSED_APP: FIELD_IDS.CUSTOM_PASSED_APP,

  /** Custom free-text presented appetizers */
  CUSTOM_PRESENTED_APP: FIELD_IDS.CUSTOM_PRESENTED_APP,

  /** Custom free-text buffet metal items */
  CUSTOM_BUFFET_METAL: FIELD_IDS.CUSTOM_BUFFET_METAL,

  /** Custom free-text buffet china items */
  CUSTOM_BUFFET_CHINA: FIELD_IDS.CUSTOM_BUFFET_CHINA,

  /** Custom free-text desserts */
  CUSTOM_DESSERTS: FIELD_IDS.CUSTOM_DESSERTS,
} as const;

// ── Menu Items Table — Display & Spec Fields ─────────────────────────────────

export const BEO_MENU_ITEM_FIELDS = {
  /** Formula – display name (READ ONLY) */
  DISPLAY_NAME: "fldQ83gpgOmMxNMQw",

  /** Service type single-select (determines picker category) */
  SERVICE_TYPE: "fld2EhDP5GRalZJzQ",

  /** Vessel type single-select (Metal vs China for buffet) */
  VESSEL_TYPE: "fldZCnfKzWijIDaeV",

  /** Section single-select (Passed Apps, Presented Apps, Buffet – Metal, Buffet – China, Desserts, Beverages)
   * @todo Confirm actual Airtable field ID — placeholder used below */
  SECTION: "fldSection",

  /** Formula – auto-calculated spec line for print (READ ONLY) */
  PRINT_SPEC_LINE: "fldRgW3KjM6Z9y7Bc",

  /** Manual quantity override (Nick Spec) */
  QTY_NICK_SPEC: "fldTfI1ioj7D7EPqI",

  /** Manual pan type override (Nick Spec) – single select */
  PAN_TYPE_NICK_SPEC: "fldT3IZ9AQRrxAxwp",

  /** Manual serving vessel override (Nick Spec) – single select */
  SERVING_VESSEL_NICK_SPEC: "fldZ2zRh6ShjGq6nK",

  /** Prep notes (Nick) – long text */
  NOTES_NICK: "fldb5DLnr89VMOwmY",

  /** Allergen icons – multiple select (🌾🌱🦐🥛🥚🥜🐷🧀) */
  ALLERGEN_ICONS: "fldUSr1QgzP4nv9vs",

  /** Is Sauce? – single select */
  IS_SAUCE: "fldLUONoixU3VLfQb",

  /** Stand-Alone Sauce – checkbox (rare; should NOT indent under parent) */
  STAND_ALONE_SAUCE: "fldjcjafusageAI8W",

  /** Kitchen tasks – long text */
  KITCHEN_TASKS: "fldSa6PbZ8fIA3YXq",

  /** Parent Item – linked record (self-referential, for sauces/components)
   * @todo Confirm actual Airtable field ID — placeholder used below */
  PARENT_ITEM: "fldParentItem",
} as const;

// ── Sacred Section Order ──────────────────────────────────────────────────────

/** Ordered list of menu section keys matching the sacred placement order */
export const SECTION_ORDER = [
  "passedAppetizers",
  "presentedAppetizers",
  "buffetMetal",
  "buffetChina",
  "desserts",
  "beverages",
] as const;

export type SectionKey = (typeof SECTION_ORDER)[number];

/** Human-readable labels for each section */
export const SECTION_LABELS: Record<SectionKey, string> = {
  passedAppetizers: "PASSED APPETIZERS",
  presentedAppetizers: "PRESENTED APPETIZERS",
  buffetMetal: "BUFFET \u2013 METAL",
  buffetChina: "BUFFET \u2013 CHINA",
  desserts: "DESSERTS",
  beverages: "BEVERAGES",
};

/** Maps each section key to the Events table field ID for that section */
export const SECTION_FIELD_MAP: Record<SectionKey, string> = {
  passedAppetizers: BEO_MENU_FIELDS.PASSED_APPETIZERS,
  presentedAppetizers: BEO_MENU_FIELDS.PRESENTED_APPETIZERS,
  buffetMetal: BEO_MENU_FIELDS.BUFFET_METAL,
  buffetChina: BEO_MENU_FIELDS.BUFFET_CHINA,
  desserts: BEO_MENU_FIELDS.DESSERTS,
  beverages: BEO_MENU_FIELDS.BEVERAGES,
};

/** Maps each section key to the Airtable "Service Type" values used for filtering menu item pickers */
export const SECTION_SERVICE_TYPES: Record<SectionKey, string[]> = {
  passedAppetizers: ["Passed App"],
  presentedAppetizers: ["Room Temp Display", "Presented App"],
  buffetMetal: ["Buffet \u2013 Hot", "Buffet"],
  buffetChina: ["Buffet \u2013 Cold", "Buffet"],
  desserts: ["Dessert"],
  beverages: ["Beverage"],
};
