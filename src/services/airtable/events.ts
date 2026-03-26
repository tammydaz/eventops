/**
 * ⚠️ GOLDEN RULE: NEVER write to computed fields.
 * Any Airtable field ending in "Print" is a FORMULA — read-only.
 * Examples: VenuePrint, EventLocationPrint, ClientNamePrint, ContactPrint
 * Only write to source fields (Venue, Client Address, City/State, etc.)
 * Print fields calculate automatically from source fields.
 */

import {
  airtableFetch,
  airtableMetaFetch,
  getEventsTable,
  type AirtableListResponse,
  type AirtableRecord,
  type AirtableErrorResult,
} from "./client";
import {
  asAttachments,
  asBoolean,
  asBarServicePrimary,
  asLinkedRecordIds,
  asMultiSelectNames,
  asSingleSelectName,
  asString,
  asStringArray,
  asAirtableCheckbox,
  isErrorResult,
  type AttachmentItem,
} from "./selectors";

export type { AttachmentItem } from "./selectors";

export async function fetchEvents() {
  const response = await fetch("/api/events");
  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`);
  }
  return await response.json();
}

export const FIELD_IDS = {
  // ── Event Core ──
  EVENT_NAME: "fldZuHc9D29Wcj60h",              // Formula - READ ONLY
  EVENT_DATE: "fldFYaE7hI27R3PsX",
  EVENT_TYPE: "fldtqnvD7M8xbc0Xb",
  EVENT_OCCASION: "fldVBvZ2m6zQ5xd2D",  // Single Select: Wedding, Bar/Bat Mitzvah, Corporate, Social, Birthday, Other
  SERVICE_STYLE: "fldqnW1ulcchcQ05t",  // Service Style (was wrong: fldR0ljDqgPKtRenQ is Ice Needed?)
  GUEST_COUNT: "fldjgqDUxVxaJ7Y9V",
  STATUS: "fldwdqfHaKXmqObE2",

  // ── Venue & Address (per BEO print guidelines) ──
  VENUE: "fldtCOxi4Axjfjt0V",                     // Main venue name (single line text)
  VENUE_ADDRESS: "fldJsajSl1l6marzw",            // Venue Address (street)
  VENUE_CITY: "fldNToCnV799eggiD",
  VENUE_STATE: "fldxCz5cPLwCetb0C",
  VENUE_ZIP: "fldWehIaLQd5sHDts",                 // Venue ZIP
  VENUE_FULL_ADDRESS: "fld0oRsZp6YCUsOki",        // Venue Full Address (single line text)
  VENUE_NAME_PRINT: "fldbglrqpkwjFon2w",          // Formula: "VENUE: [Venue Name]" - READ ONLY
  VENUE_PRINT: "fldfQoT3yhCBXzHWT",               // VenuePrint formula: IF(VENUE,VENUE,"Residence")
  PRINT_EVENT_ADDRESS: "fld01jca9w70MIZeb",       // Print – Event Address (formula, BEO canonical)
  PRINT_VENUE_ADDRESS: "fld0oRsZp6YCUsOki",       // Alias for VENUE_FULL_ADDRESS (legacy)

  // ── Client ──
  CLIENT: "fldRYDTj6V7L1xRP3",                   // Linked record
  CLIENT_FIRST_NAME: "fldFAspB1ds9Yn0Kl",
  CLIENT_LAST_NAME: "fldeciZmsIY3c2T1v",
  CLIENT_BUSINESS_NAME: "fld4YxQOjzPyyBIHL",     // Formula - READ ONLY
  BUSINESS_NAME: "fldm6SwoGe6pS7Uam",             // Business Name (writable, for delivery)
  CLIENT_EMAIL: "fldT5lcdCL5ndh84D",
  CLIENT_PHONE: "fldnw1VGIi3oXM4g3",
  CLIENT_STREET: "fldUyi7xzG60H1ML4",
  CLIENT_CITY: "fldoYWmGny8pkCKJQ",
  CLIENT_STATE: "fldffsjG72MWzrCjl",
  CLIENT_ZIP: "fldBuaBTjAkwmtd0J",
  CLIENT_ADDRESS_PRINT: "fldUddIF6WcrTCPHX",    // Formula - READ ONLY (suppresses if client=venue)

  // ── Primary Contact (Day-Of Person) ──
  PRIMARY_CONTACT_NAME: "fldmsFPsl2gAtiSCD",
  PRIMARY_CONTACT_PHONE: "fld4OK9zVwr16qMIt",
  CONTACT_FIRST_NAME: "fldmsFPsl2gAtiSCD",  // Alias for PRIMARY_CONTACT_NAME (legacy fld9LnsDlMBTl7C1G was formula - DO NOT USE)
  CONTACT_LAST_NAME: "fldmsFPsl2gAtiSCD",
  CONTACT_PHONE: "fld4OK9zVwr16qMIt",
  PRIMARY_CONTACT_ROLE: "fldMTRGNFa4pHbjY5",

  // ── Menu Sections (Sacred Placement Lanes) ──
  PASSED_APPETIZERS: "fldpprTRRFNydiV1m",
  CUSTOM_PASSED_APP: "fldDbT9eLZUoJUnmS",
  PRESENTED_APPETIZERS: "fldwku49gGffnnAOV",
  CUSTOM_PRESENTED_APP: "fldsIaND0Bp3ByW1c",
  BUFFET_METAL: "fldgi4mL7kyhpQzsy",
  CUSTOM_BUFFET_METAL: "fldm1qYJE55QVjYsd",
  BUFFET_CHINA: "fldtpY6zR1KCag3mI",
  CUSTOM_BUFFET_CHINA: "fldtquSPyLWUEYX6P",
  DESSERTS: "flddPGfYJQxixWRq9",
  CUSTOM_DESSERTS: "fld95NEZsIfHpVvAk",
  CUSTOM_DELIVERY_DELI: "fld5YbZaLNHvaBlKx",      // Custom Delivery DELI (Long Text)
  CUSTOM_ROOM_TEMP_DISPLAY: "fldCustomRoomTempTODO", // Create Long Text in Airtable, replace with real ID
  ROOM_TEMP_DISPLAY: "fld1373dtkeXhufoL",
  DISPLAYS: "fld9Yesa5cazu27W2",           // Display items (linked to Menu Items)
  STATIONS: "fldbbDlpheiUGQbKu",
  BEVERAGES: "fldRb454yd3EQhcbo",
  MENU_ITEMS: "fld7n9gmBURwXzrnB",

  // ── Delivery-only (linked to Menu Items; no metal/china/appetizer lanes) ──
  DELIVERY_HOT: "fldowVMZrulZLR8X5",   // Entrées (used for hot delivery items)
  DELIVERY_DELI: "fldKRlrDNIJjxg9jn",  // Deli (linked to Menu Items)
  FULL_SERVICE_DELI: "fldDV1mhz6i2ODDUE",    // DELI (Full Service) — linked to Menu Items
  CUSTOM_FULL_SERVICE_DELI: "fldyf5pQRMIzYW0aj",    // Custom DELI (Full Service) (Long Text)
  BOXED_LUNCH_ORDERS: "fldHCcFbEH7bEwwkb",  // Boxed Lunch Orders (linked to Boxed Lunch Orders table)
  MENU_ITEM_SPECS: "fldX9ayAyjMqYT2Oi",
  LOADED: "fldrKmicpgzVJRGjp",

  // ── Menu Items table (tbl0aN33DGG6R1sPZ) ──
  MENU_ITEM_NAME: "fldW5gfSlHRTl01v1",       // Item Name (single line)
  MENU_ITEM_CHILD_ITEMS: "fldIu6qmlUwAEn2W9", // Child Items (linked records)
  MENU_ITEM_DESCRIPTION: "fldtN2hxy9TS559Rm", // Description/Client Facing (long text)
  MENU_ITEM_DIETARY_TAGS: "fldUSr1QgzP4nv9vs", // Dietary tags / allergen icons

  // ── Bar & Beverage ──
  BAR_SERVICE: "fldXm91QjyvVKbiyO",              // Bar Service Needed (Single select) — confirmed field ID
  BAR_SIGNATURE_DRINK_YES_NO: "fldcry8vpUBY3fkHk", // Signature Drink? (Yes/No) — shown when Full Bar
  BAR_SIGNATURE_DRINK_NAME: "fldZSIBTkzcEmG7bt",  // Signature Drink Name
  BAR_SIGNATURE_DRINK_INGREDIENTS: "fld1sg6vQi7lziPDz", // Signature Drink Recipe & Ingredients
  BAR_SIGNATURE_DRINK_MIXERS_SUPPLIER: "fldoek1mpdi2ESyzu", // Who is supplying signature drink mixers and garnishes (Foodwerx, Client)
  BAR_SERVICE_NEEDED: "fldXm91QjyvVKbiyO",       // Alias for BAR_SERVICE — confirmed field ID
  BAR_DRINK_NAME: "fldZSIBTkzcEmG7bt",           // Alias for BAR_SIGNATURE_DRINK_NAME
  BAR_RECIPE: "fld1sg6vQi7lziPDz",               // Alias for BAR_SIGNATURE_DRINK_INGREDIENTS
  BAR_WHO_SUPPLIES: "fldoek1mpdi2ESyzu",         // Alias for BAR_SIGNATURE_DRINK_MIXERS_SUPPLIER
  BAR_MIXERS: "fldXL37gOon7wyQss",               // Signature Drink Mixers
  BAR_GARNISHES: "flduv4RtRR0lLm4vY",           // Signature Drink Garnishes
  // Bar narrative/print fields (Long text, often formula — typically read-only):
  BAR_SERVICE_PRINT_BLOCK: "fldQXaTtw94L6AGR0",
  BAR_SERVICE_SUMMARY: "fldrziYkLGiUcKHbT",
  BAR_SERVICE_KITCHEN_BEO: "fldXotqfetP6azASU",
  BAR_MIXER_ITEMS: "fldWj4wQIwIkz0rjg",         // Linked record → Bar Components
  BAR_GARNISH_ITEMS: "fldIPOF7dPSZWANg6",        // Linked record → Bar Components

  // ── Hydration (Events table) ──
  HYDRATION_STATION_PROVIDED: "fldfNln4oe566nENv",   // Single Select: Hydration Station Provided?
  HYDRATION_STATION_DRINK_OPTIONS: "fldxa3VSW1gNPqRQ0", // Multiple Select: Hydration Station Drink Options
  HYDRATION_STATION_NOTES: "fldZA0JhJF50PFiwM",      // Long Text: Hydration Station Notes
  HYDRATION_JSON: "fldfocVQF3rmmVsyD",               // JSON (automation) - typically read-only

  // Legacy hydration (kept for backward compat / other consumers)
  INFUSED_WATER: "fldyzrU3YnO8dzxbd",
  INFUSION_INGREDIENTS: "fldRxshZ4GqXGrJnu",
  DISPENSER_COUNT: "fldlDyMCzOTpzAPEh",

  // ── Coffee/Tea ──
  COFFEE_SERVICE_NEEDED: "fldKlKX0HEGX3NTcR",    // Single Select: Coffee Service Needed (Yes/No)
  COFFEE_MUG_TYPE: "fldCoffeeMugTypeTODO",        // Single Select: Standard / Premium / Irish — create in Airtable, replace ID

  // ── Ice ──
  ICE_PROVIDED_BY: "fldlPI3Ix1UTuGrCf",         // Single Select: shares field with SERVICE_WARE_SOURCE — if Ice has its own field in Airtable, update ID

  // ── Staff ──
  STAFF: "fldWkHPhynjxyecq7",
  CAPTAIN: "fldN2W8ITqFotKUF4",
  SERVERS: "fld4QUBWxoSu6o29l",
  UTILITY: "fldox9emNqGoemhz0",
  STATION_CREW: "flddTPAvICJSztxrj",
  CHEF: "fldmROaYyanyZi77Z",
  BARTENDERS: "fldHgVYksw8YsGX8f",
  DISPLAY_DESIGN: "fldJUrDnCSnw31wan",
  DINING_CREW: "fldaT7wcJglqPr8dA",
  // Long text: free-form BEO staff line ("1 Lead, 2 Servers…"). Distinct from linked-record CAPTAIN.
  FW_STAFF_SUMMARY: "fld7SuoE1E5XcfEyT",
  // Checkbox: office confirms staffing / Nowsta finalized (calendar amber Staff badge until checked).
  STAFFING_CONFIRMED_NOWSTA: "fldTXOxU0iNUD7pKK",

  // ── Dietary & Notes ──
  DIETARY_NOTES: "fldhGj51bQQWLJSX0",           // Allergies / Dietary
  SPECIAL_NOTES: "fldlTlYgvPTIUzzMn",
  OPS_EXCEPTIONS_SPECIAL_HANDLING: "fldL35sEiLnkyftFa",

  // ── Site Visit / Logistics (reused & new) ──
  PARKING_NOTES: "fldkmY1Y9b5ToJFsg",           // Parking Notes (Long Text)
  LOAD_IN_NOTES: "fldc75GFDDO1vv5rK",            // Load-In Notes (Long Text)
  VENUE_NOTES: "fldlc2oZdkJDtk1Mh",              // Venue Notes (Long Text)
  KITCHEN_ACCESS_NOTES: "fld1rsHIkn06rYh9H",     // Kitchen Access Notes (Long Text)
  POWER_NOTES: "fldzlZ54PL1WQ5glw",              // Power Notes (Long Text)
  TIMELINE_NOTES: "fldNmAssiLj9iYKx9",            // Timeline Notes (Long Text)
  EQUIPMENT_NOTES: "fldYmHWaoDv6OL7Mo",          // Equipment Notes (Long Text)
  STAIRS_STEPS: "fldSN2TvT87Nuhc0X",             // Stairs / Steps (Single Select)
  ELEVATORS_AVAILABLE: "fldbbYSVAn7ewQKOR",      // Elevators Available (Single Select)
  ANIMALS_PETS: "fldUFLWnKGtt3TDXZ",             // Animals / Pets (Long Text)
  FOOD_SETUP_LOCATION: "fldTecWfMr6IZoXKQ",      // Food Setup Location (Long Text)
  EVENT_PURPOSE: "fldT1y9bQdjAyjOlr",            // Event Purpose (Long Text)
  FOOD_SERVICE_FLOW: "fldCHZQBr3uffLjzp",        // Food Service Flow (Single Select)
  CLIENT_SUPPLIED_FOOD: "fldkEYTytozApTWxo",     // Client-Supplied Food (Long Text)
  RELIGIOUS_RESTRICTIONS: "fldL0tIU2I5oFI1gr",   // Religious Restrictions (Long Text)

  // ── Serviceware ──
  SERVICE_WARE: "fld3C67SAUsTxCS8E",
  RENTALS: "fldMKe8NjFvQABy5j",
  RENTAL_ITEMS: "fldv5sitKjwsIleEK",
  RENTALS_NEEDED: "fldKFjPzm1w9OoqOD",

  // ── Timeline & Logistics ──
  DISPATCH_TIME: "fld7m8eBhiJ58glyZ",  // CORE FIELD (source of truth). NEVER write to Dispatch Time (Print) fldbbHmaWqOBNUlJP
  EVENT_START_TIME: "fldDwDE87M9kFAIDn",  // duration (seconds) - was wrong ID
  EVENT_END_TIME: "fld7xeCnV751pxmWz",     // duration (seconds) - was wrong ID
  FOODWERX_ARRIVAL: "fldMYjGf8dQPNiY4Y",  // CORE FIELD (authoritative). DO NOT resolve by name; never use getFoodwerxArrivalFieldId() for arrival.
  VENUE_ARRIVAL_TIME: "fld807MPvraEV8QvN",  // Secondary/optional; NOT used for Event Arrival display or write
  // PARKING_LOAD_IN_NOTES deprecated — use LOAD_IN_NOTES (fldc75GFDDO1vv5rK)

  // ── Kitchen / Hot Food Logic ──
  KITCHEN_ON_SITE: "fldSpUlS9qEQ5ly6T",        // Single select: Yes/No/None
  FOOD_MUST_GO_HOT: "fldJFB69mmB5T4Ysp",       // Checkbox
  NO_KITCHEN_RESOLUTION: "fldm6U2EI3fZ4x6fB",  // Single select: resolution when no kitchen on site

  // ── Status & Booking ──
  BOOKING_STATUS: "fldUfOemMR4gpALQR",
  PAYMENT_STATUS: "fld84akZRtjijhCHQ",
  PAYMENT_TYPE: "fldfHa7vpohlikzaM",
  CONTRACT_SENT: "flduHZcyV31cdfl6h",
  CONTRACT_SIGNED: "fldUMBfmLyRTtR1t1",
  INVOICE_SENT: "fldtWmLeBbuecOeCi",
  INVOICE_PAID: "fldi2FjcfMFmOCV82",

  // ── Hydration Detail ──
  HYDRATION_BOTTLED_WATER: "fldQ8sJ6BzzbZDQ7v",
  HYDRATION_UNSWEET_TEA: "fldhJq2wz89p8ByQy",
  HYDRATION_SWEET_TEA: "fldI8bUs0r9kF0R2d",
  HYDRATION_SODA_SELECTION: "fldvM9UQdP3yQxTi6",
  HYDRATION_OTHER: "fldWjQ9vqN3zDhy7X",
  HYDRATION_BOTTLED_TEA: "fld91JcDezV20RarF",
  HYDRATION_DIET_TEA: "fldGUB8Thl42pJcx6",
  HYDRATION_MIXTURE: "fldV6XXkMe5S0zyEV",

  // ── Spec Engine ──
  SPEC_DEFAULT: "fldt09eXgXYoMkrbT",    // Spec – Default (formula/rollup) — READ ONLY, never write
  SPEC_OVERRIDE: "fldoMjEaGZek6pgXG",   // Spec – Override (editable) — write here only

  // ── Print & Docs ──
  THEME_COLOR_SCHEME: "fld5raG6Afilj1wDo",
  MENU_PRINT_THEME: "fldMenuPrintTheme", // Single Select: Classic European | Modern Minimal | Rustic Elegant | Black Tie Formal — update with actual Airtable field ID
  EVENT_DOCUMENTS: "fld8C7fjOqVtYmnCi",
  INVOICE_PDF: "fld5cENFzJ2DkL3yk",
  GENERATED_BEO_PDF: "fldi3Q1KcYTMoDDxr",
  PRINT_EVENT_HEADER: "fldqC8ojaYB5RJiWM",
  PRINT_EVENT_DETAILS: "fld8vx9rXXYQ1hHN5",
  PRINT_CLIENT_BLOCK: "fld9LnsDlMBTl7C1G",
  PRINT_ADDRESS_BLOCK: "fldJsajSl1l6marzw",       // Formula (same as PRINT_VENUE_ADDRESS) - READ ONLY
  ALLERGIES_PRINT: "fld0W6FZxATCOa8oP",
  DIETARY_SUMMARY: "fldN3z0LgsiM8eE5C",
  BEO_NOTES: "fldnGtJVWf4u39SHI",              // Long text
  BEO_TIMELINE: "fld6Z6xw9ciygqyff",           // Long text

  // ── Serviceware Detail ──
  CHINA_PAPER_GLASSWARE: "fldWc6PpHh5w2nl6l",
  SERVICE_WARE_SOURCE: "fldlPI3Ix1UTuGrCf",
  SERVICE_WARE_SOURCE_ALT: "fldQK1G8pE7VvDhoC",
  BBS: "fldC1hp7tQH1AXLpr",
  LARGE_PLATES: "fldm4fQK7mV5WuPZg",
  SALAD_PLATES: "fld7Jk0HF0P1uqVmk",
  PAPER_TYPE: "fld8pWDC3b0zuMZto",

  // ── Serviceware Panel (Plates / Cutlery / Glassware / Notes) ──
  PLATES_LIST: "fldpKcEoqYiHypHD3",
  CUTLERY_LIST: "fld0bZAToUEOodhA2",
  GLASSWARE_LIST: "fldNrnnkggmvbOGSU",
  SERVICEWARE_NOTES: "fldBmeHBiI5K7VuXc",
  SERVICEWARE_SOURCE: "fldTApRuNzh7uNWi2",   // FoodWerx / Client / Rentals / Mixed
  SERVICEWARE_PAPER_TYPE: "fldorT4tCcxnBXxgj", // Standard / Premium / China
  CARAFES_PER_TABLE: "fldCarafesPerTableTODO",  // Number — create in Airtable for China, replace ID

  // ── Logistics Detail ──
  TIMELINE: "fldCGIJmP74Vk8ViQ",
  PARKING_ACCESS: "fldMzNI4UGTkg9r0u",
  LINENS_OVERLAYS: "fldLyuDJTQ6bXQY3X",
} as const;

export type EventRecordData = {
  id: string;
  fields: Record<string, unknown>;
};

export type EventListItem = {
  id: string;
  eventName: string;
  eventDate?: string;
  eventType?: string;
  eventOccasion?: string;
  serviceStyle?: string;
  guestCount?: number;
  dispatchTimeSeconds?: number; // seconds since midnight for sorting
  /** Lockout / production state (from Approvals & Lockout fields) */
  guestCountConfirmed?: boolean;
  menuAcceptedByKitchen?: boolean;
  /** Per-department acceptance: event blinks for each dept until that dept accepts */
  productionAccepted?: boolean;       // Kitchen (legacy)
  productionAcceptedFlair?: boolean;
  productionAcceptedDelivery?: boolean;
  productionAcceptedOpsChief?: boolean;
  /** Client-facing change requested — BOH lights go yellow until all departments confirm */
  guestCountChangeRequested?: boolean;
  menuChangeRequested?: boolean;
  /** BOH production (from Airtable formulas/checkboxes) */
  beoSentToBOH?: boolean;
  productionColor?: string;           // hex from formula
  kitchenBlink?: boolean;
  flairBlink?: boolean;
  deliveryBlink?: boolean;
  opsChiefBlink?: boolean;
  eventChangeRequested?: boolean;
  changeConfirmedByBOH?: boolean;
  productionFrozen?: boolean;
  /** Checkbox: Staffing confirmed (Nowsta) */
  staffingConfirmedInNowsta?: boolean;
  /** FOH: BEO fired to BOH (see FOH_BEO_FIRED_FIELD_ID) */
  beoFiredToBOH?: boolean;
  /** FOH: Speck / spec complete (see FOH_SPECK_COMPLETE_FIELD_ID) */
  speckComplete?: boolean;
  /** FW Staff Summary Long text present (any non-empty) */
  fwStaffSummaryPresent?: boolean;
  /** Primary contact or client phone (list views) */
  clientPhone?: string;
  primaryContactPhone?: string;
  /** Main venue name (Airtable VENUE) — do not infer from event title alone */
  venue?: string;
  /** Client address (when event uses client location in header) */
  clientStreet?: string;
  clientCity?: string;
  clientState?: string;
  clientZip?: string;
  /** Venue street / city / state / zip (when different from client) */
  venueStreet?: string;
  venueCity?: string;
  venueState?: string;
  venueZip?: string;
  /** Long text — FOH detail panel */
  beoNotes?: string;
  /** Long text — event timeline (line-oriented) */
  timelineRaw?: string;
  /** Single select */
  paymentStatus?: string;
  /** Invoice paid checkbox */
  invoicePaid?: boolean;
};

type AirtableFieldSchema = {
  id: string;
  name: string;
  type: string;
  options?: {
    choices?: Array<{ id: string; name: string }>;
  };
};

type AirtableTableSchema = {
  id: string;
  name: string;
  fields: AirtableFieldSchema[];
};

type AirtableTablesResponse = {
  tables: AirtableTableSchema[];
};

export type SingleSelectOption = { id: string; name: string };

const getReturnFieldsParams = () => {
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");
  params.set("cellFormat", "json");
  return params;
};

let cachedCreatedTimeFieldId: string | null | undefined = undefined;

/** Resolve the Events table's Created time field ID from Airtable Meta API (cached). */
async function getCreatedTimeFieldId(): Promise<string | null> {
  if (cachedCreatedTimeFieldId !== undefined) return cachedCreatedTimeFieldId;
  const tableId = getEventsTable();
  if (typeof tableId !== "string") {
    cachedCreatedTimeFieldId = null;
    return null;
  }
  const data = await airtableMetaFetch<AirtableTablesResponse>("");
  if (isErrorResult(data)) {
    cachedCreatedTimeFieldId = null;
    return null;
  }
  const table = data.tables.find((t) => t.id === tableId || t.name === tableId);
  const createdField = table?.fields.find((f) => f.type === "createdTime");
  cachedCreatedTimeFieldId = createdField?.id ?? null;
  return cachedCreatedTimeFieldId;
}

let cachedFoodwerxArrivalFieldId: string | null | undefined = undefined;

/** Resolve "FoodWerx Staff Arrival" / "FW Arrival Time" field ID from Airtable Meta API by name (cached). */
export async function getFoodwerxArrivalFieldId(): Promise<string | null> {
  if (cachedFoodwerxArrivalFieldId !== undefined) return cachedFoodwerxArrivalFieldId;
  const tableKey = getEventsTable();
  if (typeof tableKey !== "string") {
    cachedFoodwerxArrivalFieldId = null;
    return null;
  }
  const data = await airtableMetaFetch<AirtableTablesResponse>("");
  if (isErrorResult(data)) {
    cachedFoodwerxArrivalFieldId = null;
    return null;
  }
  const table = data.tables.find((t) => t.id === tableKey || t.name === tableKey);
  const arrivalFields = table?.fields.filter(
    (f) => /foodwerx|fw\s*arrival|staff\s*arrival/i.test(f.name) && (f.type === "dateTime" || f.type === "date")
  ) ?? [];
  const field = arrivalFields.find((f) => /arrival/i.test(f.name)) ?? arrivalFields[0];
  cachedFoodwerxArrivalFieldId = field?.id ?? null;
  if (cachedFoodwerxArrivalFieldId) {
    additionalAllowedFieldIds.add(cachedFoodwerxArrivalFieldId);
    console.log("✅ FoodWerx Arrival field resolved:", cachedFoodwerxArrivalFieldId, field?.name);
  } else {
    console.warn("⚠️ FoodWerx Staff Arrival field not found. Run logEventsTableFieldsForTimeline() in console to find the correct field ID.");
  }
  return cachedFoodwerxArrivalFieldId;
}

let cachedBarServiceFieldId: string | null | undefined = undefined;

/** Resolve "Bar Service Needed" field ID from Airtable Meta API by name (cached). */
export async function getBarServiceFieldId(): Promise<string | null> {
  if (cachedBarServiceFieldId !== undefined) return cachedBarServiceFieldId;
  const tableKey = getEventsTable();
  if (typeof tableKey !== "string") {
    cachedBarServiceFieldId = null;
    return null;
  }
  const data = await airtableMetaFetch<AirtableTablesResponse>("");
  if (isErrorResult(data)) {
    cachedBarServiceFieldId = null;
    return null;
  }
  const table = data.tables.find((t) => t.id === tableKey || t.name === tableKey);
  const barServiceFields = table?.fields.filter(
    (f) => (f.type === "singleSelect" || f.type === "multipleSelects") && /bar\s*service/i.test(f.name)
  ) ?? [];
  const field = barServiceFields.find((f) => /needed/i.test(f.name)) ?? barServiceFields[0];
  // Fall back to the confirmed field ID if Meta API doesn't return a match
  cachedBarServiceFieldId = field?.id ?? "fldXm91QjyvVKbiyO";
  additionalAllowedFieldIds.add(cachedBarServiceFieldId);
  // ⚠️ Do NOT add to SINGLE_SELECT_FIELD_IDS — this base rejects { name } format for this field.
  // Plain string or null is the correct payload format for Bar Service Needed.
  if (field?.id) {
    console.log("✅ Bar Service field resolved via Meta API:", cachedBarServiceFieldId, field?.name);
  } else {
    console.log("✅ Bar Service field using confirmed fallback ID:", cachedBarServiceFieldId);
  }
  return cachedBarServiceFieldId;
}

/** Lockout field names (exact match in Airtable Events table) */
const LOCKOUT_FIELD_NAMES = [
  "Guest Count Confirmed",
  "Guest Count Change Requested",
  "Guest Count Change Approved (Kitchen)",
  "Menu Accepted by Kitchen",
  "Menu Change Requested",
  "Menu Change Approved (Kitchen)",
  "Production Accepted",
] as const;

export type LockoutFieldIds = {
  guestCountConfirmed: string;
  guestCountChangeRequested: string;
  guestCountChangeApprovedKitchen: string;
  menuAcceptedByKitchen: string;
  menuChangeRequested: string;
  menuChangeApprovedKitchen: string;
  /** Per-department acceptance (resolved by name). Create via: npm run schema ensure-department-acceptance */
  productionAccepted?: string;        // Kitchen
  productionAcceptedFlair?: string;
  productionAcceptedDelivery?: string;
  productionAcceptedOpsChief?: string;
};

/** BOH production fields (beoSentToBOH, blink formulas, freeze, etc.) — resolved by name */
export type BOHProductionFieldIds = {
  beoSentToBOH?: string;
  productionColor?: string;
  kitchenBlink?: string;
  flairBlink?: string;
  deliveryBlink?: string;
  opsChiefBlink?: string;
  eventChangeRequested?: string;
  changeConfirmedByBOH?: string;
  productionFrozen?: string;
};

let cachedLockoutFieldIds: LockoutFieldIds | null | undefined = undefined;
let cachedBOHProductionFieldIds: BOHProductionFieldIds | null | undefined = undefined;

/** Resolve Guest Count / Menu lockout field IDs from Airtable Meta API by name (cached). */
export async function getLockoutFieldIds(): Promise<LockoutFieldIds | null> {
  if (cachedLockoutFieldIds !== undefined) return cachedLockoutFieldIds;
  const tableKey = getEventsTable();
  if (typeof tableKey !== "string") {
    cachedLockoutFieldIds = null;
    return null;
  }
  const data = await airtableMetaFetch<AirtableTablesResponse>("");
  if (isErrorResult(data)) {
    cachedLockoutFieldIds = null;
    return null;
  }
  const table = data.tables.find((t) => t.id === tableKey || t.name === tableKey);
  if (!table) {
    cachedLockoutFieldIds = null;
    return null;
  }
  const byName = Object.fromEntries(table.fields.map((f) => [f.name, f.id]));
  const ids: LockoutFieldIds = {
    guestCountConfirmed: byName["Guest Count Confirmed"],
    guestCountChangeRequested: byName["Guest Count Change Requested"],
    guestCountChangeApprovedKitchen: byName["Guest Count Change Approved (Kitchen)"],
    menuAcceptedByKitchen: byName["Menu Accepted by Kitchen"],
    menuChangeRequested: byName["Menu Change Requested"],
    menuChangeApprovedKitchen: byName["Menu Change Approved (Kitchen)"],
    productionAccepted: byName["Production Accepted"] || undefined,
    productionAcceptedFlair: byName["Production Accepted (Flair)"] || undefined,
    productionAcceptedDelivery: byName["Production Accepted (Delivery)"] || undefined,
    productionAcceptedOpsChief: byName["Production Accepted (Ops Chief)"] || undefined,
  };
  const requiredPresent = [
    ids.guestCountConfirmed,
    ids.guestCountChangeRequested,
    ids.guestCountChangeApprovedKitchen,
    ids.menuAcceptedByKitchen,
    ids.menuChangeRequested,
    ids.menuChangeApprovedKitchen,
  ].every(Boolean);
  if (requiredPresent) {
    [ids.guestCountConfirmed, ids.guestCountChangeRequested, ids.guestCountChangeApprovedKitchen, ids.menuAcceptedByKitchen, ids.menuChangeRequested, ids.menuChangeApprovedKitchen].forEach((id) => id && additionalAllowedFieldIds.add(id));
    [ids.productionAccepted, ids.productionAcceptedFlair, ids.productionAcceptedDelivery, ids.productionAcceptedOpsChief]
      .filter(Boolean)
      .forEach((id) => id && additionalAllowedFieldIds.add(id));
    cachedLockoutFieldIds = ids;
  } else {
    cachedLockoutFieldIds = null;
  }
  return cachedLockoutFieldIds;
}

/** Resolve BOH production field IDs from Airtable Meta API by name (cached). */
export async function getBOHProductionFieldIds(): Promise<BOHProductionFieldIds | null> {
  if (cachedBOHProductionFieldIds !== undefined) return cachedBOHProductionFieldIds;
  const tableKey = getEventsTable();
  if (typeof tableKey !== "string") {
    cachedBOHProductionFieldIds = null;
    return null;
  }
  const data = await airtableMetaFetch<AirtableTablesResponse>("");
  if (isErrorResult(data)) {
    cachedBOHProductionFieldIds = null;
    return null;
  }
  const table = data.tables.find((t) => t.id === tableKey || t.name === tableKey);
  if (!table) {
    cachedBOHProductionFieldIds = null;
    return null;
  }
  const byName = Object.fromEntries(table.fields.map((f) => [f.name, f.id]));
  const findField = (...names: string[]): string | undefined =>
    names.map((n) => byName[n]).find(Boolean) as string | undefined;
  const ids: BOHProductionFieldIds = {
    beoSentToBOH: findField("BEO Sent to BOH", "beoSentToBOH") ?? undefined,
    productionColor: findField("Production Color", "productionColor") ?? undefined,
    kitchenBlink: findField("Kitchen Blink", "KitchenBlink") ?? undefined,
    flairBlink: findField("Flair Blink", "FlairBlink") ?? undefined,
    deliveryBlink: findField("Delivery Blink", "DeliveryBlink") ?? undefined,
    opsChiefBlink: findField("Ops Chief Blink", "OpsChiefBlink") ?? undefined,
    eventChangeRequested: findField("Event Change Requested", "eventChangeRequested") ?? undefined,
    changeConfirmedByBOH: findField("Change Confirmed by BOH", "changeConfirmedByBOH") ?? undefined,
    productionFrozen: findField("Production Frozen", "productionFrozen") ?? undefined,
  };
  if (ids.beoSentToBOH) additionalAllowedFieldIds.add(ids.beoSentToBOH);
  [ids.eventChangeRequested, ids.changeConfirmedByBOH].filter(Boolean).forEach((id) => id && additionalAllowedFieldIds.add(id));
  cachedBOHProductionFieldIds = ids;
  return ids;
}

/** Resolved field ID for FW Staff Summary (Long text). Override with VITE_AIRTABLE_FW_STAFF_SUMMARY_FIELD if your base uses a different ID. */
export const FW_STAFF_SUMMARY_FIELD_ID =
  (import.meta.env.VITE_AIRTABLE_FW_STAFF_SUMMARY_FIELD as string | undefined)?.trim() || FIELD_IDS.FW_STAFF_SUMMARY;

/** Checkbox: office confirms staffing / Nowsta is finalized. Override with VITE_AIRTABLE_STAFFING_CONFIRMED_FIELD if your base uses a different ID. */
export const STAFFING_CONFIRMED_FIELD_ID =
  (import.meta.env.VITE_AIRTABLE_STAFFING_CONFIRMED_FIELD as string | undefined)?.trim() || FIELD_IDS.STAFFING_CONFIRMED_NOWSTA;

/** FOH Intake list sidebar: BEO fired to BOH (checkbox). Set `VITE_AIRTABLE_FOH_BEO_FIRED_FIELD` to the field id after creating the column in Airtable. */
export const FOH_BEO_FIRED_FIELD_ID =
  (import.meta.env.VITE_AIRTABLE_FOH_BEO_FIRED_FIELD as string | undefined)?.trim() || "";

/** FOH Intake: Speck / spec checklist complete (checkbox). Set `VITE_AIRTABLE_FOH_SPECK_COMPLETE_FIELD`. */
export const FOH_SPECK_COMPLETE_FIELD_ID =
  (import.meta.env.VITE_AIRTABLE_FOH_SPECK_COMPLETE_FIELD as string | undefined)?.trim() || "";

/** Field IDs resolved at runtime (e.g. Bar Service by name) — allowed in PATCH */
const additionalAllowedFieldIds = new Set<string>([]);
if (FW_STAFF_SUMMARY_FIELD_ID) additionalAllowedFieldIds.add(FW_STAFF_SUMMARY_FIELD_ID);
if (STAFFING_CONFIRMED_FIELD_ID) additionalAllowedFieldIds.add(STAFFING_CONFIRMED_FIELD_ID);
if (FOH_BEO_FIRED_FIELD_ID) additionalAllowedFieldIds.add(FOH_BEO_FIRED_FIELD_ID);
if (FOH_SPECK_COMPLETE_FIELD_ID) additionalAllowedFieldIds.add(FOH_SPECK_COMPLETE_FIELD_ID);

/** BEO / print: prefer Long text FW staff line when configured; else legacy CAPTAIN (may be linked IDs). */
export function resolveFwStaffLineFromFields(fields: Record<string, unknown>): string {
  {
    const t = asString(fields[FW_STAFF_SUMMARY_FIELD_ID]);
    if (t) return t;
  }
  return asString(fields[FIELD_IDS.CAPTAIN]);
}

export const loadEvent = async (recordId: string): Promise<EventRecordData | AirtableErrorResult> => {
  const table = getEventsTable();
  if (typeof table !== "string") return table;

  const params = getReturnFieldsParams();
  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  if (isErrorResult(data)) return data;

  const fields = data.fields ?? {};
  // FOODWERX_ARRIVAL is hardcoded (fldMYjGf8dQPNiY4Y); no alias needed.

  return {
    id: data.id,
    fields,
  };
};

export const loadEvents = async (): Promise<EventListItem[] | AirtableErrorResult> => {
  const table = getEventsTable();
  if (typeof table !== "string") return table;

  const params = new URLSearchParams();
  params.set("pageSize", "100");
  params.set("cellFormat", "json");
  params.set("returnFieldsByFieldId", "true");
  params.append("fields[]", FIELD_IDS.EVENT_NAME);
  params.append("fields[]", FIELD_IDS.EVENT_DATE);
  params.append("fields[]", FIELD_IDS.DISPATCH_TIME);
  params.append("fields[]", FIELD_IDS.EVENT_TYPE);
  params.append("fields[]", FIELD_IDS.EVENT_OCCASION);
  params.append("fields[]", FIELD_IDS.SERVICE_STYLE);
  params.append("fields[]", FIELD_IDS.GUEST_COUNT);
  params.append("fields[]", FIELD_IDS.CLIENT_PHONE);
  params.append("fields[]", FIELD_IDS.PRIMARY_CONTACT_PHONE);
  params.append("fields[]", FIELD_IDS.VENUE);
  params.append("fields[]", FIELD_IDS.CLIENT_STREET);
  params.append("fields[]", FIELD_IDS.CLIENT_CITY);
  params.append("fields[]", FIELD_IDS.CLIENT_STATE);
  params.append("fields[]", FIELD_IDS.CLIENT_ZIP);
  params.append("fields[]", FIELD_IDS.VENUE_ADDRESS);
  params.append("fields[]", FIELD_IDS.VENUE_CITY);
  params.append("fields[]", FIELD_IDS.VENUE_STATE);
  params.append("fields[]", FIELD_IDS.VENUE_ZIP);
  const lockoutIds = await getLockoutFieldIds();
  if (lockoutIds) {
    params.append("fields[]", lockoutIds.guestCountConfirmed);
    params.append("fields[]", lockoutIds.menuAcceptedByKitchen);
    params.append("fields[]", lockoutIds.guestCountChangeRequested);
    params.append("fields[]", lockoutIds.menuChangeRequested);
    [lockoutIds.productionAccepted, lockoutIds.productionAcceptedFlair, lockoutIds.productionAcceptedDelivery, lockoutIds.productionAcceptedOpsChief]
      .filter(Boolean)
      .forEach((id) => id && params.append("fields[]", id));
  }
  const bohIds = await getBOHProductionFieldIds();
  if (bohIds) {
    [bohIds.beoSentToBOH, bohIds.productionColor, bohIds.kitchenBlink, bohIds.flairBlink, bohIds.deliveryBlink, bohIds.opsChiefBlink, bohIds.eventChangeRequested, bohIds.changeConfirmedByBOH, bohIds.productionFrozen]
      .filter(Boolean)
      .forEach((id) => id && params.append("fields[]", id));
  }
  params.append("fields[]", FIELD_IDS.FW_STAFF_SUMMARY);
  params.append("fields[]", STAFFING_CONFIRMED_FIELD_ID);
  if (FOH_BEO_FIRED_FIELD_ID) params.append("fields[]", FOH_BEO_FIRED_FIELD_ID);
  if (FOH_SPECK_COMPLETE_FIELD_ID) params.append("fields[]", FOH_SPECK_COMPLETE_FIELD_ID);
  params.append("fields[]", FIELD_IDS.BEO_NOTES);
  params.append("fields[]", FIELD_IDS.BEO_TIMELINE);
  params.append("fields[]", FIELD_IDS.PAYMENT_STATUS);
  params.append("fields[]", FIELD_IDS.INVOICE_PAID);
  const createdTimeFieldId = await getCreatedTimeFieldId();
  if (createdTimeFieldId) {
    params.append("sort[0][field]", createdTimeFieldId);
    params.append("sort[0][direction]", "desc");
  }

  type ListResponse = AirtableListResponse<Record<string, unknown>> & { offset?: string };
  let offset: string | undefined;
  let allRecords: AirtableRecord<Record<string, unknown>>[] = [];
  /** Cap to prevent freeze when event list has thousands of records */
  const MAX_EVENTS_LOAD = 500;

  do {
    const pageParams = new URLSearchParams(params);
    if (offset) pageParams.set("offset", offset);
    const data = await airtableFetch<ListResponse>(`/${table}?${pageParams.toString()}`);
    if (isErrorResult(data)) return data;
    allRecords.push(...data.records);
    offset = data.offset;
    if (allRecords.length >= MAX_EVENTS_LOAD) break;
  } while (offset);

  return allRecords.map((record) => {
    const fields = record.fields ?? {};
    const rawDispatch = fields[FIELD_IDS.DISPATCH_TIME];
    let dispatchTimeSeconds: number | undefined;
    if (typeof rawDispatch === "number" && !isNaN(rawDispatch)) {
      dispatchTimeSeconds = rawDispatch;
    } else if (typeof rawDispatch === "string") {
      const d = new Date(rawDispatch);
      if (!isNaN(d.getTime())) {
        dispatchTimeSeconds = d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
      }
    }
    const item: EventListItem = {
      id: record.id,
      clientPhone: asString(fields[FIELD_IDS.CLIENT_PHONE]) || undefined,
      primaryContactPhone: asString(fields[FIELD_IDS.PRIMARY_CONTACT_PHONE]) || undefined,
      eventName: asString(fields[FIELD_IDS.EVENT_NAME]),
      eventDate:
        typeof fields[FIELD_IDS.EVENT_DATE] === "string"
          ? (fields[FIELD_IDS.EVENT_DATE] as string)
          : undefined,
      eventType: asSingleSelectName(fields[FIELD_IDS.EVENT_TYPE]) || undefined,
      eventOccasion: asSingleSelectName(fields[FIELD_IDS.EVENT_OCCASION]) || undefined,
      serviceStyle: asSingleSelectName(fields[FIELD_IDS.SERVICE_STYLE]) || undefined,
      guestCount: typeof fields[FIELD_IDS.GUEST_COUNT] === "number" ? (fields[FIELD_IDS.GUEST_COUNT] as number) : undefined,
      dispatchTimeSeconds,
      fwStaffSummaryPresent: asString(fields[FIELD_IDS.FW_STAFF_SUMMARY]).trim().length > 0,
    };
    item.venue = asString(fields[FIELD_IDS.VENUE]) || undefined;
    item.clientStreet = asString(fields[FIELD_IDS.CLIENT_STREET]) || undefined;
    item.clientCity = asString(fields[FIELD_IDS.CLIENT_CITY]) || undefined;
    item.clientState = asSingleSelectName(fields[FIELD_IDS.CLIENT_STATE]) || undefined;
    item.clientZip = asString(fields[FIELD_IDS.CLIENT_ZIP]) || undefined;
    item.venueStreet = asString(fields[FIELD_IDS.VENUE_ADDRESS]) || undefined;
    item.venueCity = asString(fields[FIELD_IDS.VENUE_CITY]) || undefined;
    item.venueState = asSingleSelectName(fields[FIELD_IDS.VENUE_STATE]) || undefined;
    item.venueZip = asString(fields[FIELD_IDS.VENUE_ZIP]) || undefined;
    item.staffingConfirmedInNowsta = asAirtableCheckbox(fields[STAFFING_CONFIRMED_FIELD_ID]);
    if (FOH_BEO_FIRED_FIELD_ID) item.beoFiredToBOH = fields[FOH_BEO_FIRED_FIELD_ID] === true;
    if (FOH_SPECK_COMPLETE_FIELD_ID) item.speckComplete = fields[FOH_SPECK_COMPLETE_FIELD_ID] === true;
    item.beoNotes = asString(fields[FIELD_IDS.BEO_NOTES]) || undefined;
    item.timelineRaw = asString(fields[FIELD_IDS.BEO_TIMELINE]) || undefined;
    item.paymentStatus = asSingleSelectName(fields[FIELD_IDS.PAYMENT_STATUS]) || undefined;
    item.invoicePaid = fields[FIELD_IDS.INVOICE_PAID] === true;
    if (lockoutIds) {
      item.guestCountConfirmed = fields[lockoutIds.guestCountConfirmed] === true;
      item.menuAcceptedByKitchen = fields[lockoutIds.menuAcceptedByKitchen] === true;
      item.guestCountChangeRequested = fields[lockoutIds.guestCountChangeRequested] === true;
      item.menuChangeRequested = fields[lockoutIds.menuChangeRequested] === true;
      if (lockoutIds.productionAccepted) item.productionAccepted = fields[lockoutIds.productionAccepted] === true;
      if (lockoutIds.productionAcceptedFlair) item.productionAcceptedFlair = fields[lockoutIds.productionAcceptedFlair] === true;
      if (lockoutIds.productionAcceptedDelivery) item.productionAcceptedDelivery = fields[lockoutIds.productionAcceptedDelivery] === true;
      if (lockoutIds.productionAcceptedOpsChief) item.productionAcceptedOpsChief = fields[lockoutIds.productionAcceptedOpsChief] === true;
    }
    if (bohIds) {
      if (bohIds.beoSentToBOH) item.beoSentToBOH = fields[bohIds.beoSentToBOH] === true;
      if (bohIds.productionColor) {
        const hex = fields[bohIds.productionColor];
        item.productionColor = typeof hex === "string" && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : undefined;
      }
      if (bohIds.kitchenBlink) item.kitchenBlink = fields[bohIds.kitchenBlink] === true;
      if (bohIds.flairBlink) item.flairBlink = fields[bohIds.flairBlink] === true;
      if (bohIds.deliveryBlink) item.deliveryBlink = fields[bohIds.deliveryBlink] === true;
      if (bohIds.opsChiefBlink) item.opsChiefBlink = fields[bohIds.opsChiefBlink] === true;
      if (bohIds.eventChangeRequested) item.eventChangeRequested = fields[bohIds.eventChangeRequested] === true;
      if (bohIds.changeConfirmedByBOH) item.changeConfirmedByBOH = fields[bohIds.changeConfirmedByBOH] === true;
      if (bohIds.productionFrozen) item.productionFrozen = fields[bohIds.productionFrozen] === true;
    }
    return item;
  });
};

/** Parse Airtable time value (seconds number or ISO dateTime string) to seconds since midnight. */
function parseTimeToSecondsSinceMidnight(
  value: number | string | null | undefined,
  eventDateYyyyMmDd: string
): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number" && !isNaN(value)) {
    return value >= 0 && value < 24 * 3600 ? value : value % (24 * 3600);
  }
  if (typeof value === "string") {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    const y = parseInt(eventDateYyyyMmDd.slice(0, 4), 10);
    const m = parseInt(eventDateYyyyMmDd.slice(5, 7), 10) - 1;
    const day = parseInt(eventDateYyyyMmDd.slice(8, 10), 10);
    const localD = new Date(y, m, day, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
    return localD.getHours() * 3600 + localD.getMinutes() * 60 + localD.getSeconds();
  }
  return null;
}

export type OpsChiefDayItem = {
  id: string;
  eventName: string;
  eventDate: string;
  eventType: "delivery" | "pickup" | "full-service";
  venue: string;
  venueAddress: string;
  /** Current dispatch time (seconds since midnight), if set */
  dispatchTimeSeconds: number | null;
  /** Event/delivery start time (seconds since midnight) */
  eventStartTimeSeconds: number | null;
  /** Staff/venue arrival (seconds since midnight) for full-service */
  arrivalTimeSeconds: number | null;
  /** Suggested dispatch (seconds since midnight); formula-based */
  suggestedDispatchSeconds: number | null;
  /** Human-readable reason for suggestion */
  suggestedReason: string;
  /** Whether delivery has hot items (affects buffer); not yet from Airtable in this load */
  foodMustGoHot?: boolean;
};

const DEFAULT_DRIVE_MINUTES = 30;
const FULL_SERVICE_READY_BEFORE_ARRIVAL_MINUTES = 90;
const DELIVERY_HOT_BUFFER_MINUTES = 15;

/** Load events for a given date (YYYY-MM-DD) for Ops Chief: job # ordering and suggested dispatch times.
 * Full-service: suggested = arrival − 1.5 hr. Delivery/pickup: suggested = delivery time − drive time − (hot buffer if applicable). */
export async function loadEventsForOpsChiefDate(
  dateYyyyMmDd: string
): Promise<OpsChiefDayItem[] | AirtableErrorResult> {
  const table = getEventsTable();
  if (typeof table !== "string") return table;

  const fwArrivalId = await getFoodwerxArrivalFieldId();
  const params = new URLSearchParams();
  params.set("pageSize", "100");
  params.set("cellFormat", "json");
  params.set("returnFieldsByFieldId", "true");
  params.append("fields[]", FIELD_IDS.EVENT_NAME);
  params.append("fields[]", FIELD_IDS.EVENT_DATE);
  params.append("fields[]", FIELD_IDS.DISPATCH_TIME);
  params.append("fields[]", FIELD_IDS.EVENT_TYPE);
  params.append("fields[]", FIELD_IDS.EVENT_START_TIME);
  params.append("fields[]", FIELD_IDS.VENUE_ARRIVAL_TIME);
  params.append("fields[]", FIELD_IDS.VENUE);
  params.append("fields[]", FIELD_IDS.VENUE_ADDRESS);
  if (fwArrivalId) params.append("fields[]", fwArrivalId);

  const formula = `DATESTR({Event Date}) = '${dateYyyyMmDd}'`;
  params.set("filterByFormula", formula);

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(`/${table}?${params.toString()}`);
  if (isErrorResult(data)) return data;

  const eventTypeToCategory = (raw: string): "delivery" | "pickup" | "full-service" => {
    const lower = (raw || "").toLowerCase();
    if (lower.includes("pick") || lower.includes("pickup")) return "pickup";
    if (lower.includes("full") || lower.includes("service")) return "full-service";
    return "delivery";
  };

  const records = data.records.filter((record) => {
    const fields = record.fields ?? {};
    const eventType = (asSingleSelectName(fields[FIELD_IDS.EVENT_TYPE]) || asString(fields[FIELD_IDS.EVENT_TYPE]) || "").toLowerCase();
    return eventType.includes("delivery") || eventType.includes("pick") || eventType.includes("full");
  });

  const items: OpsChiefDayItem[] = records.map((record) => {
    const fields = record.fields ?? {};
    const eventDate = typeof fields[FIELD_IDS.EVENT_DATE] === "string" ? (fields[FIELD_IDS.EVENT_DATE] as string).slice(0, 10) : dateYyyyMmDd;
    const eventTypeRaw = asSingleSelectName(fields[FIELD_IDS.EVENT_TYPE]) || asString(fields[FIELD_IDS.EVENT_TYPE]) || "";
    const eventType = eventTypeToCategory(eventTypeRaw);

    const dispatchTimeSeconds = parseTimeToSecondsSinceMidnight(fields[FIELD_IDS.DISPATCH_TIME], eventDate);
    const eventStartTimeSeconds = parseTimeToSecondsSinceMidnight(fields[FIELD_IDS.EVENT_START_TIME], eventDate);
    const venueArrivalSeconds = parseTimeToSecondsSinceMidnight(fields[FIELD_IDS.VENUE_ARRIVAL_TIME], eventDate);
    const fwArrivalSeconds = fwArrivalId ? parseTimeToSecondsSinceMidnight(fields[fwArrivalId], eventDate) : null;
    const arrivalTimeSeconds = fwArrivalSeconds ?? venueArrivalSeconds;

    let suggestedDispatchSeconds: number | null = null;
    let suggestedReason = "";

    if (eventType === "full-service") {
      if (arrivalTimeSeconds != null) {
        suggestedDispatchSeconds = Math.max(0, arrivalTimeSeconds - FULL_SERVICE_READY_BEFORE_ARRIVAL_MINUTES * 60);
        suggestedReason = `Ready 1.5 hr before staff/venue arrival`;
      } else {
        suggestedReason = "Set staff/venue arrival to suggest dispatch";
      }
    } else {
      if (eventStartTimeSeconds != null) {
        const driveSec = DEFAULT_DRIVE_MINUTES * 60;
        suggestedDispatchSeconds = Math.max(0, eventStartTimeSeconds - driveSec);
        suggestedReason = `Delivery time − ${DEFAULT_DRIVE_MINUTES} min drive`;
      } else {
        suggestedReason = "Set delivery/event start time to suggest dispatch";
      }
    }

    return {
      id: record.id,
      eventName: asString(fields[FIELD_IDS.EVENT_NAME]) || "Untitled",
      eventDate,
      eventType,
      venue: asString(fields[FIELD_IDS.VENUE]) || "—",
      venueAddress: asString(fields[FIELD_IDS.VENUE_ADDRESS]) || "—",
      dispatchTimeSeconds,
      eventStartTimeSeconds,
      arrivalTimeSeconds,
      suggestedDispatchSeconds,
      suggestedReason,
    };
  });

  items.sort((a, b) => {
    const aSec = a.suggestedDispatchSeconds ?? a.dispatchTimeSeconds ?? 999999;
    const bSec = b.suggestedDispatchSeconds ?? b.dispatchTimeSeconds ?? 999999;
    return aSec - bSec;
  });

  return items;
}

export type OpsChiefExceptionItem = {
  id: string;
  eventName: string;
  eventDate: string;
  eventType: string;
  venue: string;
  dispatchTimeDisplay: string;
  specialNotes: string;
  dietaryNotes: string;
  beoNotes: string;
  opsExceptions: string;
  /** True if any of the note fields have content */
  hasAnyNote: boolean;
};

/** Load events in date range for Ops Chief exceptions/special-instructions view. Includes note fields. */
export async function loadEventsWithExceptionsForRange(
  startYyyyMmDd: string,
  endYyyyMmDd: string
): Promise<OpsChiefExceptionItem[] | AirtableErrorResult> {
  const table = getEventsTable();
  if (typeof table !== "string") return table;

  const params = new URLSearchParams();
  params.set("pageSize", "100");
  params.set("cellFormat", "json");
  params.set("returnFieldsByFieldId", "true");
  params.append("fields[]", FIELD_IDS.EVENT_NAME);
  params.append("fields[]", FIELD_IDS.EVENT_DATE);
  params.append("fields[]", FIELD_IDS.DISPATCH_TIME);
  params.append("fields[]", FIELD_IDS.EVENT_TYPE);
  params.append("fields[]", FIELD_IDS.VENUE);
  params.append("fields[]", FIELD_IDS.SPECIAL_NOTES);
  params.append("fields[]", FIELD_IDS.DIETARY_NOTES);
  params.append("fields[]", FIELD_IDS.BEO_NOTES);
  params.append("fields[]", FIELD_IDS.OPS_EXCEPTIONS_SPECIAL_HANDLING);

  const formula = `AND(DATESTR({Event Date}) >= '${startYyyyMmDd}', DATESTR({Event Date}) <= '${endYyyyMmDd}')`;
  params.set("filterByFormula", formula);

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(`/${table}?${params.toString()}`);
  if (isErrorResult(data)) return data;

  const { secondsTo12HourString } = await import("../../utils/timeHelpers");

  const items: OpsChiefExceptionItem[] = data.records.map((record) => {
    const fields = record.fields ?? {};
    const eventDate = typeof fields[FIELD_IDS.EVENT_DATE] === "string" ? (fields[FIELD_IDS.EVENT_DATE] as string).slice(0, 10) : "";
    const rawDispatch = fields[FIELD_IDS.DISPATCH_TIME];
    let dispatchTimeDisplay = "—";
    if (typeof rawDispatch === "number" && !isNaN(rawDispatch)) {
      dispatchTimeDisplay = secondsTo12HourString(rawDispatch);
    } else if (typeof rawDispatch === "string") {
      dispatchTimeDisplay = rawDispatch;
    }
    const specialNotes = asString(fields[FIELD_IDS.SPECIAL_NOTES]) || "";
    const dietaryNotes = asString(fields[FIELD_IDS.DIETARY_NOTES]) || "";
    const beoNotes = asString(fields[FIELD_IDS.BEO_NOTES]) || "";
    const opsExceptions = asString(fields[FIELD_IDS.OPS_EXCEPTIONS_SPECIAL_HANDLING]) || "";
    const hasAnyNote = !!(specialNotes.trim() || dietaryNotes.trim() || beoNotes.trim() || opsExceptions.trim());

    return {
      id: record.id,
      eventName: asString(fields[FIELD_IDS.EVENT_NAME]) || "Untitled",
      eventDate,
      eventType: asSingleSelectName(fields[FIELD_IDS.EVENT_TYPE]) || asString(fields[FIELD_IDS.EVENT_TYPE]) || "—",
      venue: asString(fields[FIELD_IDS.VENUE]) || "—",
      dispatchTimeDisplay,
      specialNotes,
      dietaryNotes,
      beoNotes,
      opsExceptions,
      hasAnyNote,
    };
  });

  items.sort((a, b) => {
    const d = a.eventDate.localeCompare(b.eventDate);
    if (d !== 0) return d;
    return a.dispatchTimeDisplay.localeCompare(b.dispatchTimeDisplay);
  });

  return items;
}

/** Load today's dispatch items (delivery, pickup, full-service) for autopopulation.
 * Server name: use serverNameFieldId when set, else CAPTAIN. Van #: use vanNumberFieldId when set.
 */
export async function loadDispatchItems(
  serverNameFieldId?: string,
  vanNumberFieldId?: string
): Promise<Array<{
  id: string;
  eventName: string;
  jobNumber: string;
  client: string;
  type: "delivery" | "pickup" | "full-service";
  venue: string;
  venueAddress: string;
  distanceFromKitchen: string;
  estimatedDriveTime: number;
  guestCount: number;
  dispatchTime: string;
  eventStartTime: string;
  eventDate: string;
  assignedDriver: string;
  assignedVehicle: string;
  status: "staged" | "loaded" | "en-route" | "delivered" | "picked-up" | "conflict";
  requiresExpeditor: boolean;
  panCount: number;
}> | AirtableErrorResult> {
  const table = getEventsTable();
  if (typeof table !== "string") return table;

  const today = new Date().toISOString().slice(0, 10);
  const params = new URLSearchParams();
  params.set("pageSize", "100");
  params.set("cellFormat", "json");
  params.set("returnFieldsByFieldId", "true");
  params.append("fields[]", FIELD_IDS.EVENT_NAME);
  params.append("fields[]", FIELD_IDS.EVENT_DATE);
  params.append("fields[]", FIELD_IDS.DISPATCH_TIME);
  params.append("fields[]", FIELD_IDS.EVENT_START_TIME);
  params.append("fields[]", FIELD_IDS.EVENT_TYPE);
  params.append("fields[]", FIELD_IDS.VENUE);
  params.append("fields[]", FIELD_IDS.VENUE_ADDRESS);
  params.append("fields[]", FIELD_IDS.GUEST_COUNT);
  params.append("fields[]", FIELD_IDS.CAPTAIN);

  if (serverNameFieldId) params.append("fields[]", serverNameFieldId);
  if (vanNumberFieldId) params.append("fields[]", vanNumberFieldId);

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(`/${table}?${params.toString()}`);
  if (isErrorResult(data)) return data;

  const { secondsTo12HourString } = await import("../../utils/timeHelpers");

  const records = data.records.filter((record) => {
    const fields = record.fields ?? {};
    const eventDate = typeof fields[FIELD_IDS.EVENT_DATE] === "string" ? (fields[FIELD_IDS.EVENT_DATE] as string).slice(0, 10) : "";
    const eventType = (asSingleSelectName(fields[FIELD_IDS.EVENT_TYPE]) || asString(fields[FIELD_IDS.EVENT_TYPE]) || "").toLowerCase();
    const isDispatchType = eventType.includes("delivery") || eventType.includes("pick") || eventType.includes("full");
    return eventDate === today && isDispatchType;
  });

  return records.map((record) => {
    const fields = record.fields ?? {};
    const eventTypeRaw = (asSingleSelectName(fields[FIELD_IDS.EVENT_TYPE]) || asString(fields[FIELD_IDS.EVENT_TYPE]) || "").toLowerCase();
    let type: "delivery" | "pickup" | "full-service" = "delivery";
    if (eventTypeRaw.includes("pick") || eventTypeRaw.includes("pickup")) type = "pickup";
    else if (eventTypeRaw.includes("full") || eventTypeRaw.includes("service")) type = "full-service";

    const eventName = asString(fields[FIELD_IDS.EVENT_NAME]) || "Untitled";
    const parts = eventName.split(/\s*[–—-]\s*/);
    const client = parts[0]?.trim() || "—";

    const rawDispatch = fields[FIELD_IDS.DISPATCH_TIME];
    let dispatchTime = "—";
    if (typeof rawDispatch === "number" && !isNaN(rawDispatch)) {
      dispatchTime = secondsTo12HourString(rawDispatch);
    } else if (typeof rawDispatch === "string") {
      dispatchTime = rawDispatch;
    }

    const rawEventStart = fields[FIELD_IDS.EVENT_START_TIME];
    let eventStartTime = "—";
    if (typeof rawEventStart === "number" && !isNaN(rawEventStart)) {
      eventStartTime = secondsTo12HourString(rawEventStart);
    } else if (typeof rawEventStart === "string") {
      eventStartTime = rawEventStart;
    }

    const eventDate = typeof fields[FIELD_IDS.EVENT_DATE] === "string" ? (fields[FIELD_IDS.EVENT_DATE] as string).slice(0, 10) : "";

    const serverName = serverNameFieldId ? asString(fields[serverNameFieldId]) : undefined;
    const vanNumber = vanNumberFieldId ? asString(fields[vanNumberFieldId]) : undefined;
    const captain = asString(fields[FIELD_IDS.CAPTAIN]);

    const serverVal = type === "full-service" ? (serverName || captain || "—") : "—";
    const vanVal = type === "full-service" ? (vanNumber || "—") : "—";

    return {
      id: record.id,
      eventName,
      jobNumber: record.id.slice(-6).toUpperCase(),
      client,
      type,
      venue: asString(fields[FIELD_IDS.VENUE]) || "—",
      venueAddress: asString(fields[FIELD_IDS.VENUE_ADDRESS]) || "—",
      distanceFromKitchen: "—",
      estimatedDriveTime: 0,
      guestCount: typeof fields[FIELD_IDS.GUEST_COUNT] === "number" ? (fields[FIELD_IDS.GUEST_COUNT] as number) : 0,
      dispatchTime,
      eventStartTime,
      eventDate,
      assignedDriver: serverVal,
      assignedVehicle: vanVal,
      status: "staged",
      requiresExpeditor: false,
      panCount: 0,
    };
  });
}

export const loadSingleSelectOptions = async (
  fieldIds: string[]
): Promise<Record<string, SingleSelectOption[]> | AirtableErrorResult> => {
  const tableKey = getEventsTable();
  if (typeof tableKey !== "string") return tableKey;

  const data = await airtableMetaFetch<AirtableTablesResponse>("");
  if (isErrorResult(data)) return data;

  const table = data.tables.find((item) => item.id === tableKey || item.name === tableKey);
  if (!table) {
    return { error: true, message: "Events table not found in Airtable metadata." };
  }

  const optionsMap: Record<string, SingleSelectOption[]> = {};
  fieldIds.forEach((fieldId) => {
    const field = table.fields.find((item) => item.id === fieldId);
    if (field?.type === "singleSelect" || field?.type === "multipleSelects") {
      optionsMap[fieldId] = field.options?.choices?.map((choice) => ({ id: choice.id, name: choice.name })) ?? [];
    } else {
      optionsMap[fieldId] = [];
    }
  });

  return optionsMap;
};

/** Call from browser console to find FoodWerx Arrival / timeline field IDs */
export async function logEventsTableFieldsForTimeline(): Promise<void> {
  const tableKey = getEventsTable();
  if (typeof tableKey !== "string") {
    console.error("No Events table configured");
    return;
  }
  const data = await airtableMetaFetch<AirtableTablesResponse>("");
  if (isErrorResult(data)) {
    console.error("Failed to fetch schema:", data);
    return;
  }
  const table = data.tables.find((t) => t.id === tableKey || t.name === tableKey);
  if (!table) {
    console.error("Events table not found. Tables:", data.tables.map((t) => ({ id: t.id, name: t.name })));
    return;
  }
  const timelineFields = table.fields.filter(
    (f) => /arrival|dispatch|timeline|foodwerx|staff|fw/i.test(f.name)
  );
  console.log("📋 Timeline/arrival fields (use 'id' for FOODWERX_ARRIVAL):", timelineFields.map((f) => ({ id: f.id, name: f.name, type: f.type })));
}

/** Call from browser console to find Bar Service field ID: window.__logBarServiceFieldId?.() */
export async function logEventsTableFieldsForBarService(): Promise<void> {
  const tableKey = getEventsTable();
  if (typeof tableKey !== "string") {
    console.error("No Events table configured");
    return;
  }
  const data = await airtableMetaFetch<AirtableTablesResponse>("");
  if (isErrorResult(data)) {
    console.error("Failed to fetch schema:", data);
    return;
  }
  const table = data.tables.find((t) => t.id === tableKey || t.name === tableKey);
  if (!table) {
    console.error("Events table not found. Tables:", data.tables.map((t) => ({ id: t.id, name: t.name })));
    return;
  }
  const barRelated = table.fields.filter(
    (f) => /bar|beverage|drink|mixer|garnish|signature/i.test(f.name)
  );
  console.log("📋 Bar-related fields in Events table (use the 'id' for BAR_SERVICE):", barRelated.map((f) => ({ id: f.id, name: f.name, type: f.type })));
  if (barRelated.length === 0) {
    console.log("All fields:", table.fields.map((f) => ({ id: f.id, name: f.name })));
  }
}

// STRICT WHITELIST: Only these field IDs are ever sent to Airtable PATCH.
// Anything not in this list is dropped. Add new IDs here after confirming they are NOT formula/rollup/lookup.
const SAVE_WHITELIST = new Set([
  "fldFYaE7hI27R3PsX",   // EVENT_DATE
  "fldtqnvD7M8xbc0Xb",   // EVENT_TYPE
  "fldVBvZ2m6zQ5xd2D",   // EVENT_OCCASION (Wedding, Bar/Bat Mitzvah, etc.)
  "fldqnW1ulcchcQ05t",   // SERVICE_STYLE
  "fldjgqDUxVxaJ7Y9V",   // GUEST_COUNT
  "fldtCOxi4Axjfjt0V",   // VENUE (main venue name)
  "fldJsajSl1l6marzw",   // VENUE_ADDRESS (venue street address)
  "fldNToCnV799eggiD",   // VENUE_CITY
  "fldxCz5cPLwCetb0C",   // VENUE_STATE
  "fldWehIaLQd5sHDts",   // VENUE_ZIP
  "fldFAspB1ds9Yn0Kl",   // CLIENT_FIRST_NAME
  "fldeciZmsIY3c2T1v",   // CLIENT_LAST_NAME
  "fldm6SwoGe6pS7Uam",   // BUSINESS_NAME
  "fldT5lcdCL5ndh84D",   // CLIENT_EMAIL
  "fldnw1VGIi3oXM4g3",   // CLIENT_PHONE
  "fldUyi7xzG60H1ML4",   // CLIENT_STREET
  "fldoYWmGny8pkCKJQ",   // CLIENT_CITY
  "fldffsjG72MWzrCjl",   // CLIENT_STATE
  "fldBuaBTjAkwmtd0J",   // CLIENT_ZIP
  "fldmsFPsl2gAtiSCD",   // PRIMARY_CONTACT_NAME
  "fld4OK9zVwr16qMIt",   // PRIMARY_CONTACT_PHONE
  // NOTE: fld9LnsDlMBTl7C1G is "Client Name Autofill - LEGACY" (formula) - READ ONLY, never write
  "fldMTRGNFa4pHbjY5",   // PRIMARY_CONTACT_ROLE
  "fld7m8eBhiJ58glyZ",   // DISPATCH_TIME (core field only; Print fldbbHmaWqOBNUlJP is formula — do not write)
  "fldDwDE87M9kFAIDn",   // EVENT_START_TIME
  "fld7xeCnV751pxmWz",   // EVENT_END_TIME
  "fld807MPvraEV8QvN",   // VENUE_ARRIVAL_TIME
  // FOODWERX_ARRIVAL resolved dynamically via getFoodwerxArrivalFieldId() — not in whitelist
  "fldc75GFDDO1vv5rK",   // LOAD_IN_NOTES
  "fldCGIJmP74Vk8ViQ",   // TIMELINE
  "fldkmY1Y9b5ToJFsg",   // PARKING_NOTES
  "fldlc2oZdkJDtk1Mh",   // VENUE_NOTES
  "fld1rsHIkn06rYh9H",   // KITCHEN_ACCESS_NOTES
  "fldzlZ54PL1WQ5glw",   // POWER_NOTES
  "fldNmAssiLj9iYKx9",   // TIMELINE_NOTES
  "fldYmHWaoDv6OL7Mo",   // EQUIPMENT_NOTES
  "fldSN2TvT87Nuhc0X",   // STAIRS_STEPS
  "fldbbYSVAn7ewQKOR",   // ELEVATORS_AVAILABLE
  "fldUFLWnKGtt3TDXZ",   // ANIMALS_PETS
  "fldTecWfMr6IZoXKQ",   // FOOD_SETUP_LOCATION
  "fldT1y9bQdjAyjOlr",   // EVENT_PURPOSE
  "fldCHZQBr3uffLjzp",   // FOOD_SERVICE_FLOW
  "fldkEYTytozApTWxo",   // CLIENT_SUPPLIED_FOOD
  "fldL0tIU2I5oFI1gr",   // RELIGIOUS_RESTRICTIONS
  "fldhGj51bQQWLJSX0",   // DIETARY_NOTES
  // DIETARY_SUMMARY (fldN3z0LgsiM8eE5C) — not in whitelist: add to SAVE_WHITELIST once the field exists in your Airtable base
  "fldlTlYgvPTIUzzMn",   // SPECIAL_NOTES
  "fld3C67SAUsTxCS8E",   // SERVICE_WARE
  "fldMKe8NjFvQABy5j",   // RENTALS
  "fldv5sitKjwsIleEK",   // RENTAL_ITEMS
  "fldKFjPzm1w9OoqOD",   // RENTALS_NEEDED
  "fldlPI3Ix1UTuGrCf",   // SERVICE_WARE_SOURCE
  // BAR_SERVICE resolved dynamically via getBarServiceFieldId() — not in whitelist
  "fldfNln4oe566nENv",   // HYDRATION_STATION_PROVIDED
  "fldxa3VSW1gNPqRQ0",   // HYDRATION_STATION_DRINK_OPTIONS
  "fldZA0JhJF50PFiwM",   // HYDRATION_STATION_NOTES
  "fldyzrU3YnO8dzxbd",   // INFUSED_WATER (legacy)
  "fldRxshZ4GqXGrJnu",   // INFUSION_INGREDIENTS (legacy)
  "fldlDyMCzOTpzAPEh",   // DISPENSER_COUNT (legacy)
  "fldKlKX0HEGX3NTcR",   // COFFEE_SERVICE_NEEDED
  "fldCoffeeMugTypeTODO",   // COFFEE_MUG_TYPE
  "fldWkHPhynjxyecq7",   // STAFF
  "fldN2W8ITqFotKUF4",   // CAPTAIN (linked Staff directory)
  "fld7SuoE1E5XcfEyT",   // FW_STAFF_SUMMARY (Long text — free-form BEO staff line)
  "fldTXOxU0iNUD7pKK",   // STAFFING_CONFIRMED_NOWSTA (checkbox)
  "fld4QUBWxoSu6o29l",   // SERVERS
  "fldox9emNqGoemhz0",   // UTILITY
  "flddTPAvICJSztxrj",   // STATION_CREW
  "fldmROaYyanyZi77Z",   // CHEF
  "fldHgVYksw8YsGX8f",   // BARTENDERS
  "fldJUrDnCSnw31wan",   // DISPLAY_DESIGN
  "fldaT7wcJglqPr8dA",   // DINING_CREW
  "fldSpUlS9qEQ5ly6T",   // KITCHEN_ON_SITE
  "fldm6U2EI3fZ4x6fB",   // NO_KITCHEN_RESOLUTION
  "fldMenuPrintTheme",   // MENU_PRINT_THEME (Single Select) — update if different from Airtable
  "fldJFB69mmB5T4Ysp",   // FOOD_MUST_GO_HOT
  "fldnGtJVWf4u39SHI",   // BEO_NOTES
  "fld6Z6xw9ciygqyff",   // BEO_TIMELINE
  "fld5raG6Afilj1wDo",   // THEME_COLOR_SCHEME
  "fldpprTRRFNydiV1m",   // PASSED_APPETIZERS
  "fldwku49gGffnnAOV",   // PRESENTED_APPETIZERS
  "fldgi4mL7kyhpQzsy",   // BUFFET_METAL
  "fldtpY6zR1KCag3mI",   // BUFFET_CHINA
  "flddPGfYJQxixWRq9",   // DESSERTS
  "fldowVMZrulZLR8X5",   // DELIVERY_HOT (Entrées)
  "fldKRlrDNIJjxg9jn",   // DELIVERY_DELI (Deli)
  "fld5YbZaLNHvaBlKx",   // CUSTOM_DELIVERY_DELI
  "fldDV1mhz6i2ODDUE",   // FULL_SERVICE_DELI (DELI - China/Metal)
  "fldyf5pQRMIzYW0aj",   // CUSTOM_FULL_SERVICE_DELI
  "fldRb454yd3EQhcbo",   // BEVERAGES
  "fld7n9gmBURwXzrnB",   // MENU_ITEMS
  "fldX9ayAyjMqYT2Oi",   // MENU_ITEM_SPECS
  // SPEC_OVERRIDE (fldoMjEaGZek6pgXG) — add back when you create "Spec – Override" Long text field in Airtable
  "fldwdqfHaKXmqObE2",   // STATUS
  "fldUfOemMR4gpALQR",   // BOOKING_STATUS
  "fld84akZRtjijhCHQ",   // PAYMENT_STATUS
  "fldfHa7vpohlikzaM",   // PAYMENT_TYPE
  "flduHZcyV31cdfl6h",   // CONTRACT_SENT
  "fldUMBfmLyRTtR1t1",   // CONTRACT_SIGNED
  "fldtWmLeBbuecOeCi",   // INVOICE_SENT
  "fldi2FjcfMFmOCV82",   // INVOICE_PAID
  "fldL35sEiLnkyftFa",   // OPS_EXCEPTIONS_SPECIAL_HANDLING
  "fldRYDTj6V7L1xRP3",   // CLIENT (linked record)
  "fldDbT9eLZUoJUnmS",   // CUSTOM_PASSED_APP
  "fldsIaND0Bp3ByW1c",   // CUSTOM_PRESENTED_APP
  "fldm1qYJE55QVjYsd",   // CUSTOM_BUFFET_METAL
  "fldtquSPyLWUEYX6P",   // CUSTOM_BUFFET_CHINA
  "fld95NEZsIfHpVvAk",   // CUSTOM_DESSERTS
  "fldXm91QjyvVKbiyO",   // BAR_SERVICE / BAR_SERVICE_NEEDED — confirmed Airtable field ID (Single Select)
  "fldcry8vpUBY3fkHk",   // BAR_SIGNATURE_DRINK_YES_NO
  "fldZSIBTkzcEmG7bt",   // BAR_SIGNATURE_DRINK_NAME
  "fld1sg6vQi7lziPDz",   // BAR_SIGNATURE_DRINK_INGREDIENTS (Recipe & Ingredients)
  "fldoek1mpdi2ESyzu",   // BAR_SIGNATURE_DRINK_MIXERS_SUPPLIER (Who is supplying signature drink mixers and garnishes)
  "fldXL37gOon7wyQss",   // BAR_MIXERS
  "flduv4RtRR0lLm4vY",   // BAR_GARNISHES
  "fldWc6PpHh5w2nl6l",   // CHINA_PAPER_GLASSWARE
  "fldQK1G8pE7VvDhoC",   // SERVICE_WARE_SOURCE_ALT
  "fldpKcEoqYiHypHD3",   // PLATES_LIST
  "fld0bZAToUEOodhA2",   // CUTLERY_LIST
  "fldNrnnkggmvbOGSU",   // GLASSWARE_LIST
  "fldBmeHBiI5K7VuXc",   // SERVICEWARE_NOTES
  "fldTApRuNzh7uNWi2",   // SERVICEWARE_SOURCE
  "fldorT4tCcxnBXxgj",   // SERVICEWARE_PAPER_TYPE
  // CARAFES_PER_TABLE: add real field ID here and to SAVE_WHITELIST when created in Airtable
  "fld8C7fjOqVtYmnCi",   // EVENT_DOCUMENTS (attachments)
  "fld5cENFzJ2DkL3yk",   // INVOICE_PDF (attachments)
  "fldi3Q1KcYTMoDDxr",   // GENERATED_BEO_PDF (attachments)
  "fldC1hp7tQH1AXLpr",   // BBS
  "fldm4fQK7mV5WuPZg",   // LARGE_PLATES
  "fld7Jk0HF0P1uqVmk",   // SALAD_PLATES
  "fld8pWDC3b0zuMZto",   // PAPER_TYPE
  "fldQ8sJ6BzzbZDQ7v",   // HYDRATION_BOTTLED_WATER
  "fldhJq2wz89p8ByQy",   // HYDRATION_UNSWEET_TEA
  "fldI8bUs0r9kF0R2d",   // HYDRATION_SWEET_TEA
  "fldvM9UQdP3yQxTi6",   // HYDRATION_SODA_SELECTION
  "fldWjQ9vqN3zDhy7X",   // HYDRATION_OTHER
  "fld91JcDezV20RarF",   // HYDRATION_BOTTLED_TEA
  "fldGUB8Thl42pJcx6",   // HYDRATION_DIET_TEA
  "fldV6XXkMe5S0zyEV",   // HYDRATION_MIXTURE
  "fldbbDlpheiUGQbKu",   // STATIONS
  "fld1373dtkeXhufoL",   // ROOM_TEMP_DISPLAY
  "fld9Yesa5cazu27W2",   // DISPLAYS
]);

export const EDITABLE_FIELD_IDS = SAVE_WHITELIST;

/** Strip to whitelist only. Call before setFields to avoid sending computed fields. */
const PLACEHOLDER_FIELD_IDS = new Set([
  "fldCarafesPerTableTODO",
  "fldCoffeeMugTypeTODO",
  "fldCustomRoomTempTODO",
]);

export function filterToEditableOnly(fields: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (PLACEHOLDER_FIELD_IDS.has(key)) continue;
    if (!SAVE_WHITELIST.has(key) && !additionalAllowedFieldIds.has(key)) continue;
    if (value === undefined) continue;
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null && "url" in (value[0] as object)) continue;
    result[key] = value;
  }
  return result;
}

// dateTime fields: convert seconds → ISO. (Event Start/End are duration—send seconds as-is.)
const DATE_TIME_FIELD_IDS = new Set([
  FIELD_IDS.DISPATCH_TIME,
  FIELD_IDS.VENUE_ARRIVAL_TIME,
  FIELD_IDS.FOODWERX_ARRIVAL,
]);

// Field IDs Airtable rejects — strip before PATCH (Bar Service now resolved dynamically by name)
const STRIP_FIELD_IDS = new Set<string>([]);

// Single-select fields that REQUIRE { name } format: normalize value to { name } or null before PATCH/CREATE.
// ⚠️ DO NOT add BAR_SERVICE or EVENT_TYPE here — this base rejects { name } format for those
// and returns "Cannot parse value". Plain string or null is the correct format for both.
const SINGLE_SELECT_FIELD_IDS = new Set<string>([
  // EVENT_TYPE removed: send plain string "Full Service" etc. to avoid parse error
]);

/** Convert seconds (from midnight) + date string → ISO datetime for Airtable */
function secondsAndDateToIso(seconds: number, dateStr: string): string {
  const [y, m, d] = dateStr ? dateStr.split("-").map(Number) : [];
  const base = y && m && d ? new Date(Date.UTC(y, m - 1, d)) : new Date();
  const h = Math.floor(seconds / 3600);
  const min = Math.floor((seconds % 3600) / 60);
  const sec = Math.floor(seconds % 60);
  base.setUTCHours(h, min, sec, 0);
  return base.toISOString();
}

export const updateEventMultiple = async (
  recordId: string,
  updatesObject: Record<string, unknown>
): Promise<{ success: true } | AirtableErrorResult> => {
  const table = getEventsTable();
  if (typeof table !== "string") return table;

  const obj = { ...updatesObject };
  const barServiceFieldId = await getBarServiceFieldId();
  const foodwerxArrivalFieldId = await getFoodwerxArrivalFieldId();
  const filteredFields: Record<string, unknown> = {};
  const blockedFields: string[] = [];
  let eventDate = asString(obj[FIELD_IDS.EVENT_DATE]) || "";
  if (eventDate && eventDate.length > 10) eventDate = eventDate.slice(0, 10);

  for (const [key, value] of Object.entries(obj)) {
    if (STRIP_FIELD_IDS.has(key)) {
      blockedFields.push(key);
      continue;
    }
    if (!SAVE_WHITELIST.has(key) && !additionalAllowedFieldIds.has(key)) {
      blockedFields.push(key);
      continue;
    }
    // Skip non-whitelisted attachment-like arrays (attachment fields are whitelisted for remove/update)
    const isAttachmentArray = Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null && "url" in (value[0] as object);
    const isAttachmentField = key === FIELD_IDS.EVENT_DOCUMENTS || key === FIELD_IDS.INVOICE_PDF || key === FIELD_IDS.GENERATED_BEO_PDF;
    if (isAttachmentArray && !isAttachmentField) {
      blockedFields.push(key);
      continue;
    }
    if (value === undefined) continue;

    // dateTime fields: convert seconds (number) → ISO string for Airtable (incl. FOODWERX_ARRIVAL)
    const isDateTimeField = DATE_TIME_FIELD_IDS.has(key) || key === FIELD_IDS.FOODWERX_ARRIVAL || (foodwerxArrivalFieldId && key === foodwerxArrivalFieldId);
    if (isDateTimeField && typeof value === "number" && !isNaN(value)) {
      filteredFields[key] = secondsAndDateToIso(value, eventDate);
    } else if (key === FIELD_IDS.EVENT_DATE && typeof value === "string" && value.length > 10) {
      filteredFields[key] = value.slice(0, 10);
    } else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) && !isDateTimeField) {
      blockedFields.push(key);
      continue;
    } else if (SINGLE_SELECT_FIELD_IDS.has(key)) {
      if (value === null || value === "") {
        filteredFields[key] = null;
      } else if (typeof value === "object" && value !== null && "name" in value && typeof (value as { name?: string }).name === "string") {
        filteredFields[key] = { name: (value as { name: string }).name };
      } else if (typeof value === "string" && value.trim()) {
        filteredFields[key] = { name: value.trim() };
      } else {
        filteredFields[key] = null;
      }
    } else if ((barServiceFieldId && key === barServiceFieldId) || key === FIELD_IDS.BAR_SERVICE) {
      // Bar Service Needed: Airtable multi-select expects an array of option names. Single string → [string].
      if (Array.isArray(value)) {
        filteredFields[key] = value.filter((v) => typeof v === "string" && v.trim()).map((v) => String(v).trim());
      } else if (value === null || value === "") {
        filteredFields[key] = [];
      } else if (typeof value === "string" && value.trim()) {
        filteredFields[key] = [value.trim()];
      } else {
        filteredFields[key] = [];
      }
    } else if (key === FIELD_IDS.VENUE_STATE || key === FIELD_IDS.CLIENT_STATE) {
      // Single-select: "" makes Airtable try to add an empty option (422 / permissions).
      if (value === null || value === "" || (typeof value === "string" && !value.trim())) {
        filteredFields[key] = null;
      } else if (typeof value === "string") {
        filteredFields[key] = value.trim();
      } else {
        filteredFields[key] = value;
      }
    } else if (key === FIELD_IDS.CAPTAIN) {
      // CAPTAIN is linked records; free-text staff line must go to FW_STAFF_SUMMARY_FIELD_ID or be skipped.
      if (Array.isArray(value)) {
        filteredFields[key] = value;
      } else if (typeof value === "string") {
        const trimmed = value.trim();
        filteredFields[FW_STAFF_SUMMARY_FIELD_ID] = trimmed === "" ? null : trimmed;
      } else {
        filteredFields[key] = value;
      }
    } else {
      filteredFields[key] = value;
    }
  }

  if (blockedFields.length > 0) {
    const stripped = blockedFields.filter((k) => STRIP_FIELD_IDS.has(k));
    if (stripped.length > 0) {
      console.warn("⚠️ STRIPPED (Airtable unknown field):", stripped, "→ Get correct ID from Airtable API docs and update FIELD_IDS");
    }
    console.warn("⚠️ BLOCKED:", blockedFields.length, "fields");
  }
  const MENU_LINKED_FIELD_IDS = new Set([
    FIELD_IDS.PASSED_APPETIZERS,
    FIELD_IDS.PRESENTED_APPETIZERS,
    FIELD_IDS.BUFFET_METAL,
    FIELD_IDS.BUFFET_CHINA,
    FIELD_IDS.DESSERTS,
    FIELD_IDS.FULL_SERVICE_DELI,
    FIELD_IDS.DELIVERY_DELI,
    FIELD_IDS.ROOM_TEMP_DISPLAY,
  ]);
  const keys = Object.keys(filteredFields);
  const allMenuFields = keys.length > 0 && keys.every((k) => MENU_LINKED_FIELD_IDS.has(k));
  const allEmptyArrays = keys.every((k) => Array.isArray(filteredFields[k]) && (filteredFields[k] as unknown[]).length === 0);
  if (allMenuFields && allEmptyArrays) {
    console.log("⏭️ Skipping updateEventMultiple: all menu fields are empty arrays (likely race before state loaded)");
    return { success: true };
  }

  console.log("✅ updateEventMultiple - AFTER filter:", JSON.stringify(filteredFields, null, 2));

  if (Object.keys(filteredFields).length === 0) {
    console.log("⏭️ No fields to update after filtering");
    return { success: true };
  }

  const data = await airtableFetch(`/${table}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [{ id: recordId, fields: filteredFields }],
    }),
  });

  if (isErrorResult(data)) {
    console.error("❌ updateEventMultiple ERROR:", data);
    return data;
  }
  return { success: true };
};

/** Prepare fields for create: resolve FOODWERX_ARRIVAL, convert dateTime fields (seconds) → ISO strings, normalize single-select to { name } */
async function prepareFieldsForCreate(fields: Record<string, unknown>): Promise<Record<string, unknown>> {
  const obj = { ...fields };
  // Resolve FOODWERX_ARRIVAL: replace placeholder with real field ID (fld598p was invalid)
  if (obj[FIELD_IDS.FOODWERX_ARRIVAL] !== undefined) {
    const resolvedId = await getFoodwerxArrivalFieldId();
    if (resolvedId) {
      obj[resolvedId] = obj[FIELD_IDS.FOODWERX_ARRIVAL];
    }
    delete obj[FIELD_IDS.FOODWERX_ARRIVAL];
  }

  const eventDate = asString(obj[FIELD_IDS.EVENT_DATE]) || "";
  const foodwerxArrivalFieldId = await getFoodwerxArrivalFieldId();
  // Linked-record CAPTAIN rejects strings on create; map text to FW Staff Summary Long text field.
  if (typeof obj[FIELD_IDS.CAPTAIN] === "string") {
    obj[FW_STAFF_SUMMARY_FIELD_ID] = obj[FIELD_IDS.CAPTAIN];
    delete obj[FIELD_IDS.CAPTAIN];
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    const isDateTimeField = DATE_TIME_FIELD_IDS.has(key) || (foodwerxArrivalFieldId && key === foodwerxArrivalFieldId);
    if (isDateTimeField && typeof value === "number" && !isNaN(value)) {
      result[key] = secondsAndDateToIso(value, eventDate);
    } else if (SINGLE_SELECT_FIELD_IDS.has(key)) {
      if (value === null || value === "") {
        result[key] = null;
      } else if (typeof value === "object" && value !== null && "name" in value && typeof (value as { name?: string }).name === "string") {
        result[key] = { name: (value as { name: string }).name };
      } else if (typeof value === "string" && value.trim()) {
        result[key] = { name: value.trim() };
      } else {
        result[key] = null;
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

export const createEvent = async (
  fields: Record<string, unknown>
): Promise<{ id: string; fields: Record<string, unknown> } | AirtableErrorResult> => {
  const table = getEventsTable();
  if (typeof table !== "string") return table;

  const prepared = await prepareFieldsForCreate(fields);
  const params = getReturnFieldsParams();
  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${table}?${params.toString()}`,
    {
      method: "POST",
      body: JSON.stringify({
        records: [
          {
            fields: prepared,
          },
        ],
      }),
    }
  );

  if (isErrorResult(data)) return data;

  const record = data.records?.[0];
  if (!record) {
    return { error: true, message: "Failed to create event" };
  }

  return { id: record.id, fields: record.fields ?? {} };
};

export const deleteEvent = async (recordId: string): Promise<{ success: true } | AirtableErrorResult> => {
  const table = getEventsTable();
  if (typeof table !== "string") return table;

  const data = await airtableFetch<{ deleted: boolean }>(`/${table}/${recordId}`, {
    method: "DELETE",
  });

  if (isErrorResult(data)) return data;
  return { success: true };
};

export const updateEventField = async (
  recordId: string,
  fieldId: string,
  value: unknown
): Promise<{ success: true } | AirtableErrorResult> => updateEventMultiple(recordId, { [fieldId]: value });

export const uploadAttachment = async (
  recordId: string,
  fieldId: string,
  file: File
): Promise<{ success: true; attachments: AttachmentItem[] } | AirtableErrorResult> => {
  const table = getEventsTable();
  if (typeof table !== "string") return table;

  const formData = new FormData();
  formData.append("file", file);

  const uploadResponse = await fetch(
    `/api/airtable/upload?recordId=${encodeURIComponent(recordId)}&fieldId=${encodeURIComponent(fieldId)}`,
    {
      method: "POST",
      body: formData,
    }
  );

  const uploadData = (await uploadResponse.json()) as { attachments?: AttachmentItem[] } & {
    error?: { message?: string };
  };

  if (!uploadResponse.ok || uploadData.error) {
    return {
      error: true,
      message: uploadData.error?.message || `Attachment upload failed: ${uploadResponse.status}`,
    };
  }

  const attachments = Array.isArray(uploadData.attachments) ? uploadData.attachments : [];
  return { success: true, attachments };
};

export type ClientDetails = {
  clientFirstName: string;
  clientLastName: string;
  clientBusinessName: string;
  clientEmail: string;
  clientPhone: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactRole: string;
};

export const getClientDetails = async (
  recordId: string
): Promise<ClientDetails | AirtableErrorResult> => {
  const data = await loadEvent(recordId);
  if (isErrorResult(data)) return data;

  const fields = data.fields;
  return {
    clientFirstName: asString(fields[FIELD_IDS.CLIENT_FIRST_NAME]),
    clientLastName: asString(fields[FIELD_IDS.CLIENT_LAST_NAME]),
    clientBusinessName: asString(fields[FIELD_IDS.CLIENT_BUSINESS_NAME]),
    clientEmail: asString(fields[FIELD_IDS.CLIENT_EMAIL]),
    clientPhone: asString(fields[FIELD_IDS.CLIENT_PHONE]),
    primaryContactName: asString(fields[FIELD_IDS.PRIMARY_CONTACT_NAME]),
    primaryContactPhone: asString(fields[FIELD_IDS.PRIMARY_CONTACT_PHONE]),
    primaryContactRole: asSingleSelectName(fields[FIELD_IDS.PRIMARY_CONTACT_ROLE]),
  };
};

export type EventDetails = {
  eventName: string;
  eventDate: string;
  eventType: string;
  serviceStyle: string;
  guestCount: string;
  venue: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
};

export const getEventDetails = async (
  recordId: string
): Promise<EventDetails | AirtableErrorResult> => {
  const data = await loadEvent(recordId);
  if (isErrorResult(data)) return data;

  const fields = data.fields;
  return {
    eventName: asString(fields[FIELD_IDS.EVENT_NAME]),
    eventDate: asString(fields[FIELD_IDS.EVENT_DATE]),
    eventType: asSingleSelectName(fields[FIELD_IDS.EVENT_TYPE]),
    serviceStyle: asSingleSelectName(fields[FIELD_IDS.SERVICE_STYLE]),
    guestCount: fields[FIELD_IDS.GUEST_COUNT] !== undefined ? String(fields[FIELD_IDS.GUEST_COUNT]) : "",
    venue: asString(fields[FIELD_IDS.VENUE]),
    venueAddress: asString(fields[FIELD_IDS.VENUE_ADDRESS]),
    venueCity: asString(fields[FIELD_IDS.VENUE_CITY]),
    venueState: asSingleSelectName(fields[FIELD_IDS.VENUE_STATE]),
  };
};

export type MenuItemRecord = {
  id: string;
  name: string;
};

export type MenuSelections = {
  passedAppetizers: string[];
  presentedAppetizers: string[];
  buffetMetal: string[];
  buffetChina: string[];
  desserts: string[];
  beverages: string[];
  menuItems: string[];
  menuItemSpecs: string[];
};

export const getMenuSelections = async (
  recordId: string
): Promise<MenuSelections | AirtableErrorResult> => {
  const data = await loadEvent(recordId);
  if (isErrorResult(data)) return data;

  const fields = data.fields;
  return {
    passedAppetizers: asLinkedRecordIds(fields[FIELD_IDS.PASSED_APPETIZERS]),
    presentedAppetizers: asLinkedRecordIds(fields[FIELD_IDS.PRESENTED_APPETIZERS]),
    buffetMetal: asLinkedRecordIds(fields[FIELD_IDS.BUFFET_METAL]),
    buffetChina: asLinkedRecordIds(fields[FIELD_IDS.BUFFET_CHINA]),
    desserts: asLinkedRecordIds(fields[FIELD_IDS.DESSERTS]),
    beverages: asLinkedRecordIds(fields[FIELD_IDS.BEVERAGES]),
    menuItems: asLinkedRecordIds(fields[FIELD_IDS.MENU_ITEMS]),
    menuItemSpecs: asLinkedRecordIds(fields[FIELD_IDS.MENU_ITEM_SPECS]),
  };
};

export type BarServiceDetails = {
  barServiceNeeded: string;
  infusedWater: string;
  infusionIngredients: string;
  dispenserCount: string;
};

export const getBarServiceDetails = async (
  recordId: string
): Promise<BarServiceDetails | AirtableErrorResult> => {
  const data = await loadEvent(recordId);
  if (isErrorResult(data)) return data;

  const fields = data.fields;
  return {
    barServiceNeeded: asBarServicePrimary(fields[FIELD_IDS.BAR_SERVICE_NEEDED]),
    infusedWater: asSingleSelectName(fields[FIELD_IDS.INFUSED_WATER]),
    infusionIngredients: asString(fields[FIELD_IDS.INFUSION_INGREDIENTS]),
    dispenserCount:
      fields[FIELD_IDS.DISPENSER_COUNT] !== undefined ? String(fields[FIELD_IDS.DISPENSER_COUNT]) : "",
  };
};

export type CoffeeServiceDetails = {
  coffeeServiceNeeded: boolean;
};

export const getCoffeeServiceDetails = async (
  recordId: string
): Promise<CoffeeServiceDetails | AirtableErrorResult> => {
  const data = await loadEvent(recordId);
  if (isErrorResult(data)) return data;

  const raw = data.fields[FIELD_IDS.COFFEE_SERVICE_NEEDED];
  return {
    coffeeServiceNeeded: raw === true || (typeof raw === "string" && raw === "Yes"),
  };
};

export type HydrationStationDetails = {
  bottledWater: string;
  unsweetenedIcedTea: boolean;
  sweetTea: boolean;
  sodaSelection: string[];
  hydrationOther: string;
  bottledIcedTea: boolean;
  dietIcedTea: boolean;
  mixtureOfTeasAndSodas: boolean;
};

export type BeveragesDetails = {
  bottledWater: boolean;
  unsweetenedIcedTea: boolean;
  sweetTea: boolean;
  coke: boolean;
  dietCoke: boolean;
  gingerAle: boolean;
  sprite: boolean;
  otherSoda: boolean;
  bottledIcedTea: boolean;
  dietIcedTea: boolean;
  mixture: boolean;
};

export const getBeveragesDetails = async (
  recordId: string
): Promise<BeveragesDetails | AirtableErrorResult> => {
  const data = await loadEvent(recordId);
  if (isErrorResult(data)) return data;

  const fields = data.fields;
  return {
    bottledWater: asBoolean(fields[FIELD_IDS.LEGACY_BOTTLED_WATER]),
    unsweetenedIcedTea: asBoolean(fields[FIELD_IDS.LEGACY_UNSWEETENED_TEA]),
    sweetTea: asBoolean(fields[FIELD_IDS.LEGACY_SWEET_TEA]),
    coke: asBoolean(fields[FIELD_IDS.LEGACY_COKE]),
    dietCoke: asBoolean(fields[FIELD_IDS.LEGACY_DIET_COKE]),
    gingerAle: asBoolean(fields[FIELD_IDS.LEGACY_GINGER_ALE]),
    sprite: asBoolean(fields[FIELD_IDS.LEGACY_SPRITE]),
    otherSoda: asBoolean(fields[FIELD_IDS.LEGACY_OTHER_SODA]),
    bottledIcedTea: asBoolean(fields[FIELD_IDS.LEGACY_BOTTLED_TEA]),
    dietIcedTea: asBoolean(fields[FIELD_IDS.LEGACY_DIET_TEA]),
    mixture: asBoolean(fields[FIELD_IDS.LEGACY_MIXTURE]),
  };
};

export const getHydrationStationDetails = async (
  recordId: string
): Promise<HydrationStationDetails | AirtableErrorResult> => {
  const data = await loadEvent(recordId);
  if (isErrorResult(data)) return data;

  const fields = data.fields;
  return {
    bottledWater: asSingleSelectName(fields[FIELD_IDS.HYDRATION_BOTTLED_WATER]),
    unsweetenedIcedTea: asBoolean(fields[FIELD_IDS.HYDRATION_UNSWEET_TEA]),
    sweetTea: asBoolean(fields[FIELD_IDS.HYDRATION_SWEET_TEA]),
    sodaSelection: asStringArray(fields[FIELD_IDS.HYDRATION_SODA_SELECTION]),
    hydrationOther: asString(fields[FIELD_IDS.HYDRATION_OTHER]),
    bottledIcedTea: asBoolean(fields[FIELD_IDS.HYDRATION_BOTTLED_TEA]),
    dietIcedTea: asBoolean(fields[FIELD_IDS.HYDRATION_DIET_TEA]),
    mixtureOfTeasAndSodas: asBoolean(fields[FIELD_IDS.HYDRATION_MIXTURE]),
  };
};

export type StaffingSelections = {
  staff: string[];
  captain: string;
  servers: string[];
  utility: string[];
  stationCrew: string[];
  chef: string[];
  bartenders: string[];
  displayDesign: string[];
  diningCrew: string[];
};

export const getStaffingSelections = async (
  recordId: string
): Promise<StaffingSelections | AirtableErrorResult> => {
  const data = await loadEvent(recordId);
  if (isErrorResult(data)) return data;

  const fields = data.fields;
  return {
    staff: asLinkedRecordIds(fields[FIELD_IDS.STAFF]),
    captain: asString(fields[FIELD_IDS.CAPTAIN]),
    servers: asLinkedRecordIds(fields[FIELD_IDS.SERVERS]),
    utility: asLinkedRecordIds(fields[FIELD_IDS.UTILITY]),
    stationCrew: asLinkedRecordIds(fields[FIELD_IDS.STATION_CREW]),
    chef: asLinkedRecordIds(fields[FIELD_IDS.CHEF]),
    bartenders: asLinkedRecordIds(fields[FIELD_IDS.BARTENDERS]),
    displayDesign: asLinkedRecordIds(fields[FIELD_IDS.DISPLAY_DESIGN]),
    diningCrew: asLinkedRecordIds(fields[FIELD_IDS.DINING_CREW]),
  };
};

export type NotesDetails = {
  dietaryNotes: string;
  specialNotes: string;
  themeColorScheme: string;
};

export const getNotesDetails = async (
  recordId: string
): Promise<NotesDetails | AirtableErrorResult> => {
  const data = await loadEvent(recordId);
  if (isErrorResult(data)) return data;

  const fields = data.fields;
  return {
    dietaryNotes: asString(fields[FIELD_IDS.DIETARY_NOTES]),
    specialNotes: asString(fields[FIELD_IDS.SPECIAL_NOTES]),
    themeColorScheme: asString(fields[FIELD_IDS.THEME_COLOR_SCHEME]),
  };
};

export type AttachmentsDetails = {
  eventDocuments: AttachmentItem[];
  invoicePdf: AttachmentItem[];
  generatedBeoPdf: AttachmentItem[];
};

export const getAttachmentsDetails = async (
  recordId: string
): Promise<AttachmentsDetails | AirtableErrorResult> => {
  const data = await loadEvent(recordId);
  if (isErrorResult(data)) return data;

  const fields = data.fields;
  return {
    eventDocuments: asAttachments(fields[FIELD_IDS.EVENT_DOCUMENTS]),
    invoicePdf: asAttachments(fields[FIELD_IDS.INVOICE_PDF]),
    generatedBeoPdf: asAttachments(fields[FIELD_IDS.GENERATED_BEO_PDF]),
  };
};

export type StatusDetails = {
  status: string;
  bookingStatus: string;
  paymentStatus: string;
  paymentType: string;
  contractSent: boolean;
  contractSigned: boolean;
  invoiceSent: boolean;
  invoicePaid: boolean;
};

export const getStatusDetails = async (
  recordId: string
): Promise<StatusDetails | AirtableErrorResult> => {
  const data = await loadEvent(recordId);
  if (isErrorResult(data)) return data;

  const fields = data.fields;
  return {
    status: asSingleSelectName(fields[FIELD_IDS.STATUS]),
    bookingStatus: asSingleSelectName(fields[FIELD_IDS.BOOKING_STATUS]),
    paymentStatus: asSingleSelectName(fields[FIELD_IDS.PAYMENT_STATUS]),
    paymentType: asSingleSelectName(fields[FIELD_IDS.PAYMENT_TYPE]),
    contractSent: asBoolean(fields[FIELD_IDS.CONTRACT_SENT]),
    contractSigned: asBoolean(fields[FIELD_IDS.CONTRACT_SIGNED]),
    invoiceSent: asBoolean(fields[FIELD_IDS.INVOICE_SENT]),
    invoicePaid: asBoolean(fields[FIELD_IDS.INVOICE_PAID]),
  };
};

export type RentalsDetails = {
  rentals: string[];
  rentalItems: string[];
  rentalsNeeded: string[];
  serviceWare: string[];
  serviceWareSource: string;
  linensOverlaysNeeded: string;
};

export const getRentalsDetails = async (
  recordId: string
): Promise<RentalsDetails | AirtableErrorResult> => {
  const data = await loadEvent(recordId);
  if (isErrorResult(data)) return data;

  const fields = data.fields;
  return {
    rentals: asLinkedRecordIds(fields[FIELD_IDS.RENTALS]),
    rentalItems: asLinkedRecordIds(fields[FIELD_IDS.RENTAL_ITEMS]),
    rentalsNeeded: asLinkedRecordIds(fields[FIELD_IDS.RENTALS_NEEDED]),
    serviceWare: asLinkedRecordIds(fields[FIELD_IDS.SERVICE_WARE]),
    serviceWareSource: asSingleSelectName(fields[FIELD_IDS.SERVICE_WARE_SOURCE]),
    linensOverlaysNeeded: asString(fields[FIELD_IDS.LINENS_OVERLAYS]),
  };
};

export type TimelineDetails = {
  dispatchTime: string;
  eventStartTime: string;
  eventEndTime: string;
  foodwerxArrival: string;
  timeline: string;
  parkingAccess: string;
  parkingNotes: string;
  opsExceptionsSpecialHandling: string;
};

export const getTimelineDetails = async (
  recordId: string
): Promise<TimelineDetails | AirtableErrorResult> => {
  const data = await loadEvent(recordId);
  if (isErrorResult(data)) return data;

  const fields = data.fields;
  return {
    dispatchTime: asString(fields[FIELD_IDS.DISPATCH_TIME]),
    eventStartTime: fields[FIELD_IDS.EVENT_START_TIME] !== undefined ? String(fields[FIELD_IDS.EVENT_START_TIME]) : "",
    eventEndTime: fields[FIELD_IDS.EVENT_END_TIME] !== undefined ? String(fields[FIELD_IDS.EVENT_END_TIME]) : "",
    foodwerxArrival:
      fields[FIELD_IDS.FOODWERX_ARRIVAL] !== undefined ? String(fields[FIELD_IDS.FOODWERX_ARRIVAL]) : "",
    timeline: asString(fields[FIELD_IDS.TIMELINE]),
    parkingAccess: asString(fields[FIELD_IDS.PARKING_ACCESS]),
    parkingNotes: asString(fields[FIELD_IDS.PARKING_NOTES]),
    opsExceptionsSpecialHandling: asString(fields[FIELD_IDS.OPS_EXCEPTIONS_SPECIAL_HANDLING]),
  };
};

export type DietaryAllergiesDetails = {
  dietaryNotes: string;
  allergiesPrint: string;
  dietarySummary: string;
};

export const getDietaryAllergiesDetails = async (
  recordId: string
): Promise<DietaryAllergiesDetails | AirtableErrorResult> => {
  const data = await loadEvent(recordId);
  if (isErrorResult(data)) return data;

  const fields = data.fields;
  return {
    dietaryNotes: asString(fields[FIELD_IDS.DIETARY_NOTES]),
    allergiesPrint: asString(fields[FIELD_IDS.ALLERGIES_PRINT]),
    dietarySummary: asString(fields[FIELD_IDS.DIETARY_SUMMARY]),
  };
};

export type BeoPrintDetails = {
  printEventHeader: string;
  printEventDetails: string;
  printClientBlock: string;
  printAddressBlock: string;
};

export const getBeoPrintDetails = async (
  recordId: string
): Promise<BeoPrintDetails | AirtableErrorResult> => {
  const data = await loadEvent(recordId);
  if (isErrorResult(data)) return data;

  const fields = data.fields;
  return {
    printEventHeader: asString(fields[FIELD_IDS.PRINT_EVENT_HEADER]),
    printEventDetails: asString(fields[FIELD_IDS.PRINT_EVENT_DETAILS]),
    printClientBlock: asString(fields[FIELD_IDS.PRINT_CLIENT_BLOCK]),
    printAddressBlock: asString(fields[FIELD_IDS.PRINT_ADDRESS_BLOCK]),
  };
};

export type ServicewareDetails = {
  chinaPaperGlassware: string[];
  serviceWareSource: string;
  bAndBs: string;
  largePlates: string;
  saladPlates: string;
  paperType: string;
};

export const getServicewareDetails = async (
  recordId: string
): Promise<ServicewareDetails | AirtableErrorResult> => {
  const data = await loadEvent(recordId);
  if (isErrorResult(data)) return data;

  const fields = data.fields;
  return {
    chinaPaperGlassware: asStringArray(fields[FIELD_IDS.CHINA_PAPER_GLASSWARE]),
    serviceWareSource: asSingleSelectName(fields[FIELD_IDS.SERVICE_WARE_SOURCE_ALT]),
    bAndBs: fields[FIELD_IDS.BBS] !== undefined ? String(fields[FIELD_IDS.BBS]) : "",
    largePlates: fields[FIELD_IDS.LARGE_PLATES] !== undefined ? String(fields[FIELD_IDS.LARGE_PLATES]) : "",
    saladPlates: fields[FIELD_IDS.SALAD_PLATES] !== undefined ? String(fields[FIELD_IDS.SALAD_PLATES]) : "",
    paperType: asSingleSelectName(fields[FIELD_IDS.PAPER_TYPE]),
  };
};
