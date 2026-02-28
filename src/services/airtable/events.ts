/**
 * ⚠️ GOLDEN RULE: NEVER write to computed fields.
 * Any Airtable field ending in "Print" is a FORMULA — read-only.
 * Examples: VenuePrint, EventLocationPrint, ClientNamePrint, ContactPrint
 * Only write to source fields (Venue, Client Address, City/State, etc.)
 * Print fields calculate automatically from source fields.
 */

export async function fetchEvents() {
  const response = await fetch("/api/events");
  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`);
  }
  return await response.json();
}
import {
  airtableFetch,
  airtableMetaFetch,
  getEventsTable,
  type AirtableListResponse,
  type AirtableRecord,
  type AirtableErrorResult,
} from "./client";
import { sanitizeForHeader } from "../../utils/httpHeaders";
import {
  asAttachments,
  asBoolean,
  asLinkedRecordIds,
  asSingleSelectName,
  asString,
  asStringArray,
  isErrorResult,
  type AttachmentItem,
} from "./selectors";

export type { AttachmentItem } from "./selectors";

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
  ROOM_TEMP_DISPLAY: "fld1373dtkeXhufoL",
  STATIONS: "fldbbDlpheiUGQbKu",
  BEVERAGES: "fldRb454yd3EQhcbo",
  MENU_ITEMS: "fld7n9gmBURwXzrnB",
  MENU_ITEM_SPECS: "fldX9ayAyjMqYT2Oi",
  LOADED: "fldrKmicpgzVJRGjp",

  // ── Menu Items table (tbl0aN33DGG6R1sPZ) ──
  MENU_ITEM_NAME: "fldW5gfSlHRTl01v1",       // Item Name (single line)
  MENU_ITEM_CHILD_ITEMS: "fldIu6qmlUwAEn2W9", // Child Items (linked records)
  MENU_ITEM_DESCRIPTION: "fldtN2hxy9TS559Rm", // Description/Client Facing (long text)
  MENU_ITEM_DIETARY_TAGS: "fldUSr1QgzP4nv9vs", // Dietary tags / allergen icons

  // ── Bar & Beverage ──
  BAR_SERVICE: "fldOisfjYPDeBwM1B",              // Bar Service Needed (Single select)
  BAR_SIGNATURE_DRINK_YES_NO: "fldcry8vpUBY3fkHk", // Signature Drink? (Yes/No) — shown when Full Bar
  BAR_SIGNATURE_DRINK_NAME: "fldZSIBTkzcEmG7bt",  // Signature Drink Name
  BAR_SIGNATURE_DRINK_INGREDIENTS: "fld1sg6vQi7lziPDz", // Signature Drink Recipe & Ingredients
  BAR_SIGNATURE_DRINK_MIXERS_SUPPLIER: "fldoek1mpdi2ESyzu", // Who is supplying signature drink mixers and garnishes (Foodwerx, Client)
  BAR_SERVICE_NEEDED: "fldOisfjYPDeBwM1B",       // Alias for BAR_SERVICE
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
  ICE_PROVIDED_BY: "fldlPI3Ix1UTuGrCf",         // Single Select: Ice Provided By (options from Airtable)

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
  DISPATCH_TIME: "fldbbHmaWqOBNUlJP",  // was wrong: flddmE3MvGNzCbt8K doesn't exist in Events
  EVENT_START_TIME: "fldDwDE87M9kFAIDn",  // duration (seconds) - was wrong ID
  EVENT_END_TIME: "fld7xeCnV751pxmWz",     // duration (seconds) - was wrong ID
  FOODWERX_ARRIVAL: "fld598p",  // FoodWerx Staff Arrival / FW Arrival Time
  VENUE_ARRIVAL_TIME: "fld807MPvraEV8QvN",
  // PARKING_LOAD_IN_NOTES deprecated — use LOAD_IN_NOTES (fldc75GFDDO1vv5rK)

  // ── Kitchen / Hot Food Logic ──
  KITCHEN_ON_SITE: "fldSpUlS9qEQ5ly6T",        // Single select: Yes/No/None
  FOOD_MUST_GO_HOT: "fldJFB69mmB5T4Ysp",       // Checkbox

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
  const data = await airtableMetaFetch<AirtableTablesResponse>("/tables");
  if (isErrorResult(data)) {
    cachedCreatedTimeFieldId = null;
    return null;
  }
  const table = data.tables.find((t) => t.id === tableId || t.name === tableId);
  const createdField = table?.fields.find((f) => f.type === "createdTime");
  cachedCreatedTimeFieldId = createdField?.id ?? null;
  return cachedCreatedTimeFieldId;
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
  const data = await airtableMetaFetch<AirtableTablesResponse>("/tables");
  if (isErrorResult(data)) {
    cachedBarServiceFieldId = null;
    return null;
  }
  const table = data.tables.find((t) => t.id === tableKey || t.name === tableKey);
  const barServiceFields = table?.fields.filter(
    (f) => f.type === "singleSelect" && /bar\s*service/i.test(f.name)
  ) ?? [];
  const field = barServiceFields.find((f) => /needed/i.test(f.name)) ?? barServiceFields[0];
  cachedBarServiceFieldId = field?.id ?? null;
  if (cachedBarServiceFieldId) {
    additionalAllowedFieldIds.add(cachedBarServiceFieldId);
    SINGLE_SELECT_FIELD_IDS.add(cachedBarServiceFieldId);
    console.log("✅ Bar Service field resolved:", cachedBarServiceFieldId, field?.name);
  } else {
    console.warn("⚠️ Bar Service Needed field not found in Events table. Fields:", table?.fields.map((f) => f.name) ?? []);
  }
  return cachedBarServiceFieldId;
}

/** Field IDs resolved at runtime (e.g. Bar Service by name) — allowed in PATCH */
const additionalAllowedFieldIds = new Set<string>();

export const loadEvent = async (recordId: string): Promise<EventRecordData | AirtableErrorResult> => {
  const table = getEventsTable();
  if (typeof table !== "string") return table;

  const params = getReturnFieldsParams();
  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  if (isErrorResult(data)) return data;

  return {
    id: data.id,
    fields: data.fields ?? {},
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
  const createdTimeFieldId = await getCreatedTimeFieldId();
  if (createdTimeFieldId) {
    params.append("sort[0][field]", createdTimeFieldId);
    params.append("sort[0][direction]", "desc");
  }

  type ListResponse = AirtableListResponse<Record<string, unknown>> & { offset?: string };
  let offset: string | undefined;
  let allRecords: AirtableRecord<Record<string, unknown>>[] = [];

  do {
    const pageParams = new URLSearchParams(params);
    if (offset) pageParams.set("offset", offset);
    const data = await airtableFetch<ListResponse>(`/${table}?${pageParams.toString()}`);
    if (isErrorResult(data)) return data;
    allRecords.push(...data.records);
    offset = data.offset;
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
    return {
      id: record.id,
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
    };
  });
};

export const loadSingleSelectOptions = async (
  fieldIds: string[]
): Promise<Record<string, SingleSelectOption[]> | AirtableErrorResult> => {
  const tableKey = getEventsTable();
  if (typeof tableKey !== "string") return tableKey;

  const data = await airtableMetaFetch<AirtableTablesResponse>("/tables");
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

/** Call from browser console to find Bar Service field ID: window.__logBarServiceFieldId?.() */
export async function logEventsTableFieldsForBarService(): Promise<void> {
  const tableKey = getEventsTable();
  if (typeof tableKey !== "string") {
    console.error("No Events table configured");
    return;
  }
  const data = await airtableMetaFetch<AirtableTablesResponse>("/tables");
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
  "fldbbHmaWqOBNUlJP",   // DISPATCH_TIME
  "fldDwDE87M9kFAIDn",   // EVENT_START_TIME
  "fld7xeCnV751pxmWz",   // EVENT_END_TIME
  "fld807MPvraEV8QvN",   // VENUE_ARRIVAL_TIME
  "fld598p",   // FOODWERX_ARRIVAL (FoodWerx Staff Arrival / FW Arrival Time)
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
  "fldN2W8ITqFotKUF4",   // CAPTAIN (FW staff from invoice: "2 Server, 1 Bartender")
  "fld4QUBWxoSu6o29l",   // SERVERS
  "fldox9emNqGoemhz0",   // UTILITY
  "flddTPAvICJSztxrj",   // STATION_CREW
  "fldmROaYyanyZi77Z",   // CHEF
  "fldHgVYksw8YsGX8f",   // BARTENDERS
  "fldJUrDnCSnw31wan",   // DISPLAY_DESIGN
  "fldaT7wcJglqPr8dA",   // DINING_CREW
  "fldSpUlS9qEQ5ly6T",   // KITCHEN_ON_SITE
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
  "fldRb454yd3EQhcbo",   // BEVERAGES
  "fld7n9gmBURwXzrnB",   // MENU_ITEMS
  "fldX9ayAyjMqYT2Oi",   // MENU_ITEM_SPECS
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
]);

export const EDITABLE_FIELD_IDS = SAVE_WHITELIST;

/** Strip to whitelist only. Call before setFields to avoid sending computed fields. */
const PLACEHOLDER_FIELD_IDS = new Set([
  "fldCarafesPerTableTODO",
  "fldCoffeeMugTypeTODO",
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
  FIELD_IDS.FOODWERX_ARRIVAL,
  FIELD_IDS.DISPATCH_TIME,
  FIELD_IDS.VENUE_ARRIVAL_TIME,
]);

// Field IDs Airtable rejects — strip before PATCH (Bar Service now resolved dynamically by name)
const STRIP_FIELD_IDS = new Set<string>([]);

// Single Select fields: Airtable REST API accepts string, but some bases require { name: "..." } format
const SINGLE_SELECT_FIELD_IDS = new Set([
  FIELD_IDS.BAR_SIGNATURE_DRINK_YES_NO,
  FIELD_IDS.BAR_SIGNATURE_DRINK_MIXERS_SUPPLIER,
  FIELD_IDS.EVENT_TYPE,
  FIELD_IDS.EVENT_OCCASION,
  FIELD_IDS.SERVICE_STYLE,
  FIELD_IDS.KITCHEN_ON_SITE,
  FIELD_IDS.SERVICE_WARE_SOURCE,
  FIELD_IDS.STAIRS_STEPS,
  FIELD_IDS.ELEVATORS_AVAILABLE,
  FIELD_IDS.FOOD_SERVICE_FLOW,
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

  const filteredFields: Record<string, unknown> = {};
  const blockedFields: string[] = [];
  const eventDate = asString(updatesObject[FIELD_IDS.EVENT_DATE]) || "";

  for (const [key, value] of Object.entries(updatesObject)) {
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

    // dateTime fields: convert seconds (number) → ISO string for Airtable
    if (DATE_TIME_FIELD_IDS.has(key) && typeof value === "number" && !isNaN(value)) {
      filteredFields[key] = secondsAndDateToIso(value, eventDate);
    } else if (SINGLE_SELECT_FIELD_IDS.has(key) && (value === null || value === "")) {
      filteredFields[key] = null;
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

/** Prepare fields for create: convert dateTime fields (seconds) → ISO strings */
function prepareFieldsForCreate(fields: Record<string, unknown>): Record<string, unknown> {
  const eventDate = asString(fields[FIELD_IDS.EVENT_DATE]) || "";
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (DATE_TIME_FIELD_IDS.has(key) && typeof value === "number" && !isNaN(value)) {
      result[key] = secondsAndDateToIso(value, eventDate);
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

  const prepared = prepareFieldsForCreate(fields);
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

  const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID as string | undefined;
  const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY as string | undefined;
  if (!baseId || !apiKey) {
    return { error: true, message: "Missing Airtable env vars" };
  }

  const formData = new FormData();
  formData.append("file", file);

  const uploadResponse = await fetch(
    `https://content.airtable.com/v0/${baseId}/${recordId}/${fieldId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sanitizeForHeader(apiKey)}`,
      },
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
    barServiceNeeded: asSingleSelectName(fields[FIELD_IDS.BAR_SERVICE_NEEDED]),
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
