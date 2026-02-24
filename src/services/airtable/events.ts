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
  SERVICE_STYLE: "fldqnW1ulcchcQ05t",  // Service Style (was wrong: fldR0ljDqgPKtRenQ is Ice Needed?)
  GUEST_COUNT: "fldjgqDUxVxaJ7Y9V",
  STATUS: "fldwdqfHaKXmqObE2",

  // ── Venue & Address ──
  VENUE: "fldfQoT3yhCBXzHWT",                    // 🔴 WAS WRONG
  VENUE_NAME: "fldK8j9JRu0VYCFV9",
  VENUE_ADDRESS: "fldtCOxi4Axjfjt0V",
  VENUE_CITY: "fldNToCnV799eggiD",
  VENUE_STATE: "fldxCz5cPLwCetb0C",
  VENUE_FULL_ADDRESS_CLEAN: "fldJsajSl1l6marzw",
  
  // ── Computed Address Fields (READ ONLY - Never write to these) ──
  VENUE_FULL_ADDRESS: "fldOKQTp8Zf6a462f",       // Formula: "Venue Full Address (Clean)"
  EVENT_LOCATION_FINAL_PRINT: "flddestyZNoX9sKGE", // Formula: "Event Location (Final Print)"
  PRINT_VENUE_ADDRESS: "fldJsajSl1l6marzw",      // Formula: "VenuePrint" - THIS WAS THE BUG!

  // ── Client ──
  CLIENT: "fldRYDTj6V7L1xRP3",                   // Linked record
  CLIENT_FIRST_NAME: "fldFAspB1ds9Yn0Kl",
  CLIENT_LAST_NAME: "fldeciZmsIY3c2T1v",
  CLIENT_BUSINESS_NAME: "fld4YxQOjzPyyBIHL",     // Formula - READ ONLY
  CLIENT_EMAIL: "fldT5lcdCL5ndh84D",
  CLIENT_PHONE: "fldnw1VGIi3oXM4g3",

  // ── Primary Contact (Day-Of Person) ──
  PRIMARY_CONTACT_NAME: "fldmsFPsl2gAtiSCD",
  PRIMARY_CONTACT_PHONE: "fld4OK9zVwr16qMIt",
  CONTACT_FIRST_NAME: "fld9LnsDlMBTl7C1G",
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

  // ── Bar & Beverage ──
  BAR_SERVICE_NEEDED: "fldOisfjYPDeBwM1B",       // 🔴 WAS WRONG
  BAR_SERVICE: "fldXm91QjyvVKbiyO",              // Single select
  BAR_SIG_DRINK: "fldcry8vpUBY3fkHk",            // Single select: Yes/No
  BAR_DRINK_NAME: "fldZSIBTkzcEmG7bt",           // Text
  BAR_RECIPE: "fld1sg6vQi7lziPDz",               // Long text
  BAR_WHO_SUPPLIES: "fldoek1mpdi2ESyzu",         // Single select: Foodwerx/Client
  BAR_MIXERS: "fldXL37gOon7wyQss",               // Text
  BAR_GARNISHES: "flduv4RtRR0lLm4vY",            // Text

  // ── Hydration ──
  INFUSED_WATER: "fldyzrU3YnO8dzxbd",            // 🔴 WAS WRONG (was using STATUS field ID!)
  INFUSION_INGREDIENTS: "fldRxshZ4GqXGrJnu",     // 🔴 WAS WRONG
  DISPENSER_COUNT: "fldlDyMCzOTpzAPEh",          // 🔴 WAS WRONG

  // ── Coffee/Tea ──
  COFFEE_SERVICE_NEEDED: "fldWIMlTc0Za6BTYk",    // 🔴 WAS WRONG

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
  DIETARY_NOTES: "fldhGj51bQQWLJSX0",
  SPECIAL_NOTES: "fldlTlYgvPTIUzzMn",
  OPS_EXCEPTIONS_SPECIAL_HANDLING: "fldL35sEiLnkyftFa",  // 🔴 WAS PLACEHOLDER

  // ── Serviceware ──
  SERVICE_WARE: "fld3C67SAUsTxCS8E",
  RENTALS: "fldMKe8NjFvQABy5j",
  RENTAL_ITEMS: "fldv5sitKjwsIleEK",
  RENTALS_NEEDED: "fldKFjPzm1w9OoqOD",

  // ── Timeline & Logistics ──
  DISPATCH_TIME: "fldbbHmaWqOBNUlJP",  // was wrong: flddmE3MvGNzCbt8K doesn't exist in Events
  EVENT_START_TIME: "fldDwDE87M9kFAIDn",  // duration (seconds) - was wrong ID
  EVENT_END_TIME: "fld7xeCnV751pxmWz",     // duration (seconds) - was wrong ID
  FOODWERX_ARRIVAL: "fldMYjGf8dQPNiY4Y",
  VENUE_ARRIVAL_TIME: "fld807MPvraEV8QvN",
  PARKING_LOAD_IN_NOTES: "fldqXqiwryBHhJmUc",

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

  // ── Logistics Detail ──
  TIMELINE: "fldCGIJmP74Vk8ViQ",  // was wrong: flduvl7yt3kqf7FIO is Print_Allergies (formula)
  PARKING_ACCESS: "fldMzNI4UGTkg9r0u",
  PARKING_NOTES: "fldWVHbtnZ5unHdHA",
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
  serviceStyle?: string;
  guestCount?: number;
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
  const table = data.tables.find((t) => t.id === tableId);
  const createdField = table?.fields.find((f) => f.type === "createdTime");
  cachedCreatedTimeFieldId = createdField?.id ?? null;
  return cachedCreatedTimeFieldId;
}

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
  params.append("fields[]", FIELD_IDS.EVENT_TYPE);
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
    return {
      id: record.id,
      eventName: asString(fields[FIELD_IDS.EVENT_NAME]),
      eventDate:
        typeof fields[FIELD_IDS.EVENT_DATE] === "string"
          ? (fields[FIELD_IDS.EVENT_DATE] as string)
          : undefined,
      eventType: asSingleSelectName(fields[FIELD_IDS.EVENT_TYPE]) || undefined,
      serviceStyle: asSingleSelectName(fields[FIELD_IDS.SERVICE_STYLE]) || undefined,
      guestCount: typeof fields[FIELD_IDS.GUEST_COUNT] === "number" ? (fields[FIELD_IDS.GUEST_COUNT] as number) : undefined,
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
    if (field?.type === "singleSelect") {
      optionsMap[fieldId] = field.options?.choices?.map((choice) => ({ id: choice.id, name: choice.name })) ?? [];
    } else {
      optionsMap[fieldId] = [];
    }
  });

  return optionsMap;
};

// STRICT WHITELIST: Only these field IDs are ever sent to Airtable PATCH.
// Anything not in this list is dropped. Add new IDs here after confirming they are NOT formula/rollup/lookup.
const SAVE_WHITELIST = new Set([
  "fldFYaE7hI27R3PsX",   // EVENT_DATE
  "fldtqnvD7M8xbc0Xb",   // EVENT_TYPE
  "fldqnW1ulcchcQ05t",   // SERVICE_STYLE
  "fldjgqDUxVxaJ7Y9V",   // GUEST_COUNT
  "fldfQoT3yhCBXzHWT",   // VENUE
  "fldK8j9JRu0VYCFV9",   // VENUE_NAME
  "fldtCOxi4Axjfjt0V",   // VENUE_ADDRESS
  "fldNToCnV799eggiD",   // VENUE_CITY
  "fldxCz5cPLwCetb0C",   // VENUE_STATE
  "fldFAspB1ds9Yn0Kl",   // CLIENT_FIRST_NAME
  "fldeciZmsIY3c2T1v",   // CLIENT_LAST_NAME
  "fldT5lcdCL5ndh84D",   // CLIENT_EMAIL
  "fldnw1VGIi3oXM4g3",   // CLIENT_PHONE
  "fldmsFPsl2gAtiSCD",   // PRIMARY_CONTACT_NAME
  "fld4OK9zVwr16qMIt",   // PRIMARY_CONTACT_PHONE
  "fld9LnsDlMBTl7C1G",   // CONTACT_FIRST_NAME
  "fldMTRGNFa4pHbjY5",   // PRIMARY_CONTACT_ROLE
  "fldbbHmaWqOBNUlJP",   // DISPATCH_TIME
  "fldDwDE87M9kFAIDn",   // EVENT_START_TIME
  "fld7xeCnV751pxmWz",   // EVENT_END_TIME
  "fld807MPvraEV8QvN",   // VENUE_ARRIVAL_TIME
  "fldqXqiwryBHhJmUc",   // PARKING_LOAD_IN_NOTES
  "fldCGIJmP74Vk8ViQ",   // TIMELINE
  "fldWVHbtnZ5unHdHA",   // PARKING_NOTES
  "fldhGj51bQQWLJSX0",   // DIETARY_NOTES
  "fldlTlYgvPTIUzzMn",   // SPECIAL_NOTES
  "fld3C67SAUsTxCS8E",   // SERVICE_WARE
  "fldMKe8NjFvQABy5j",   // RENTALS
  "fldv5sitKjwsIleEK",   // RENTAL_ITEMS
  "fldKFjPzm1w9OoqOD",   // RENTALS_NEEDED
  "fldlPI3Ix1UTuGrCf",   // SERVICE_WARE_SOURCE
  "fldOisfjYPDeBwM1B",   // BAR_SERVICE_NEEDED
  "fldXm91QjyvVKbiyO",   // BAR_SERVICE
  "fldyzrU3YnO8dzxbd",   // INFUSED_WATER
  "fldRxshZ4GqXGrJnu",   // INFUSION_INGREDIENTS
  "fldlDyMCzOTpzAPEh",   // DISPENSER_COUNT
  "fldWIMlTc0Za6BTYk",   // COFFEE_SERVICE_NEEDED
  "fldWkHPhynjxyecq7",   // STAFF
  "fld4QUBWxoSu6o29l",   // SERVERS
  "fldox9emNqGoemhz0",   // UTILITY
  "flddTPAvICJSztxrj",   // STATION_CREW
  "fldmROaYyanyZi77Z",   // CHEF
  "fldHgVYksw8YsGX8f",   // BARTENDERS
  "fldJUrDnCSnw31wan",   // DISPLAY_DESIGN
  "fldaT7wcJglqPr8dA",   // DINING_CREW
  "fldSpUlS9qEQ5ly6T",   // KITCHEN_ON_SITE
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
  "fldcry8vpUBY3fkHk",   // BAR_SIG_DRINK
  "fldZSIBTkzcEmG7bt",   // BAR_DRINK_NAME
  "fld1sg6vQi7lziPDz",   // BAR_RECIPE
  "fldoek1mpdi2ESyzu",   // BAR_WHO_SUPPLIES
  "fldXL37gOon7wyQss",   // BAR_MIXERS
  "flduv4RtRR0lLm4vY",   // BAR_GARNISHES
  "fldWc6PpHh5w2nl6l",   // CHINA_PAPER_GLASSWARE
  "fldQK1G8pE7VvDhoC",   // SERVICE_WARE_SOURCE_ALT
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
export function filterToEditableOnly(fields: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!SAVE_WHITELIST.has(key)) continue;
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
    if (!SAVE_WHITELIST.has(key)) {
      blockedFields.push(key);
      continue;
    }
    // Skip attachment fields — they need special handling and can cause PATCH to fail
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null && "url" in (value[0] as object)) {
      blockedFields.push(key);
      continue;
    }
    if (value === undefined) continue;

    // dateTime fields: convert seconds (number) → ISO string for Airtable
    if (DATE_TIME_FIELD_IDS.has(key) && typeof value === "number" && !isNaN(value)) {
      filteredFields[key] = secondsAndDateToIso(value, eventDate);
    } else {
      filteredFields[key] = value;
    }
  }

  if (blockedFields.length > 0) {
    console.warn("⚠️ BLOCKED (whitelist):", blockedFields.length, "fields");
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

export const createEvent = async (
  fields: Record<string, unknown>
): Promise<{ id: string; fields: Record<string, unknown> } | AirtableErrorResult> => {
  const table = getEventsTable();
  if (typeof table !== "string") return table;

  const params = getReturnFieldsParams();
  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${table}?${params.toString()}`,
    {
      method: "POST",
      body: JSON.stringify({
        records: [
          {
            fields,
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
        Authorization: `Bearer ${apiKey}`,
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

  return {
    coffeeServiceNeeded: asBoolean(data.fields[FIELD_IDS.COFFEE_SERVICE_NEEDED]),
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
