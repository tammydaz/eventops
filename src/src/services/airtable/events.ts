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
  EVENT_NAME: "fldZuHc9D29Wcj60h",
  EVENT_DATE: "fldFYaE7hI27R3PsX",
  EVENT_TYPE: "fldtqnvD7M8xbc0Xb",
  SERVICE_STYLE: "fldqnW1ulcchcQ05t",
  GUEST_COUNT: "fldjgqDUxVxaJ7Y9V",
  VENUE: "fldtCOxi4Axjfjt0V",
  VENUE_ADDRESS: "fldJsajSl1l6marzw",
  VENUE_CITY: "fldNToCnV799eggiD",
  VENUE_STATE: "fldxCz5cPLwCetb0C",
  VENUE_FULL_ADDRESS: "fldOKQTp8Zf6a462f",

  CLIENT_FIRST_NAME: "fldFAspB1ds9Yn0Kl",
  CLIENT_LAST_NAME: "fldeciZmsIY3c2T1v",
  CLIENT_EMAIL: "fldT5lcdCL5ndh84D",
  CLIENT_PHONE: "fldnw1VGIi3oXM4g3",
  PRIMARY_CONTACT_NAME: "fldmsFPsl2gAtiSCD",
  PRIMARY_CONTACT_PHONE: "fld4OK9zVwr16qMIt",
  PRIMARY_CONTACT_ROLE: "fldMTRGNFa4pHbjY5",

  PASSED_APPETIZERS: "fldpprTRRFNydiV1m",
  PRESENTED_APPETIZERS: "fldwku49gGffnnAOV",
  BUFFET_ITEMS: "fld4LR3nFdqp3MmEf",
  DESSERTS: "flddPGfYJQxixWRq9",
  BEVERAGES: "fldRb454yd3EQhcbo",
  MENU_ITEMS: "fld7n9gmBURwXzrnB",
  MENU_ITEM_SPECS: "fldX9ayAyjMqYT2Oi",

  BAR_SERVICE_NEEDED: "fldXm91QjyvVKbiyO",
  INFUSED_WATER: "fldwdqfHaKXmqObE2",
  INFUSION_INGREDIENTS: "fldh2X9DDVMg6wQju",
  DISPENSER_COUNT: "fldsvVThjvIysL6yA",
  COFFEE_SERVICE_NEEDED: "fldT7fDNhbiAu4JYE",

  LEGACY_BOTTLED_WATER: "fldBOTTLEDWATER",
  LEGACY_UNSWEETENED_TEA: "fldUNSWEETTEA",
  LEGACY_SWEET_TEA: "fldSWEETTEA",
  LEGACY_COKE: "fldCOKE",
  LEGACY_DIET_COKE: "fldDIETCOKE",
  LEGACY_GINGER_ALE: "fldGINGERALE",
  LEGACY_SPRITE: "fldSPRITE",
  LEGACY_OTHER_SODA: "fldOTHER",
  LEGACY_BOTTLED_TEA: "fldBOTTLEDTEA",
  LEGACY_DIET_TEA: "fldDIETTEA",
  LEGACY_MIXTURE: "fldMIXTURE",

  STAFF: "fldWkHPhynjxyecq7",
  CAPTAIN: "fldN2W8ITqFotKUF4",
  SERVERS: "fld4QUBWxoSu6o29l",
  UTILITY: "fldox9emNqGoemhz0",
  STATION_CREW: "flddTPAvICJSztxrj",
  CHEF: "fldmROaYyanyZi77Z",
  BARTENDERS: "fldHgVYksw8YsGX8f",
  DISPLAY_DESIGN: "fldJUrDnCSnw31wan",
  DINING_CREW: "fldaT7wcJglqPr8dA",

  DIETARY_NOTES: "fldhGj51bQQWLJSX0",
  SPECIAL_NOTES: "fldlTlYgvPTIUzzMn",
  THEME_COLOR_SCHEME: "fld5raG6Afilj1wDo",

  EVENT_DOCUMENTS: "fld8C7fjOqVtYmnCi",
  INVOICE_PDF: "fld5cENFzJ2DkL3yk",
  GENERATED_BEO_PDF: "fldi3Q1KcYTMoDDxr",

  STATUS: "fldYQ10cBNuPJtEpN",
  BOOKING_STATUS: "fldUfOemMR4gpALQR",
  PAYMENT_STATUS: "fld84akZRtjijhCHQ",
  PAYMENT_TYPE: "fldfHa7vpohlikzaM",
  CONTRACT_SENT: "flduHZcyV31cdfl6h",
  CONTRACT_SIGNED: "fldUMBfmLyRTtR1t1",
  INVOICE_SENT: "fldtWmLeBbuecOeCi",
  INVOICE_PAID: "fldi2FjcfMFmOCV82",

  RENTALS: "fldMKe8NjFvQABy5j",
  RENTAL_ITEMS: "fldv5sitKjwsIleEK",
  RENTALS_NEEDED: "fldKFjPzm1w9OoqOD",
  SERVICE_WARE: "fld3C67SAUsTxCS8E",
  SERVICE_WARE_SOURCE: "fldlPI3Ix1UTuGrCf",
  LINENS_OVERLAYS: "fldLyuDJTQ6bXQY3X",

  DISPATCH_TIME: "fldbbHmaWqOBNUlJP",
  EVENT_START_TIME: "fldDwDE87M9kFAIDn",
  EVENT_END_TIME: "fld7xeCnV751pxmWz",
  FOODWERX_ARRIVAL: "fldMYjGf8dQPNiY4Y",
  TIMELINE: "flduvl7yt3kqf7FIO",
  PARKING_ACCESS: "fldMzNI4UGTkg9r0u",
  PARKING_NOTES: "fldWVHbtnZ5unHdHA",

  ALLERGIES_PRINT: "fld0W6FZxATCOa8oP",
  DIETARY_SUMMARY: "fldN3z0LgsiM8eE5C",

  PRINT_EVENT_HEADER: "fldqC8ojaYB5RJiWM",
  PRINT_EVENT_DETAILS: "fld8vx9rXXYQ1hHN5",
  PRINT_CLIENT_BLOCK: "fld9LnsDlMBTl7C1G",
  PRINT_ADDRESS_BLOCK: "fldJsajSl1l6marzw",

  CHINA_PAPER_GLASSWARE: "fldWc6PpHh5w2nl6l",
  SERVICE_WARE_SOURCE_ALT: "fldQK1G8pE7VvDhoC",
  BBS: "fldC1hp7tQH1AXLpr",
  LARGE_PLATES: "fldm4fQK7mV5WuPZg",
  SALAD_PLATES: "fld7Jk0HF0P1uqVmk",
  PAPER_TYPE: "fld8pWDC3b0zuMZto",

  HYDRATION_BOTTLED_WATER: "fldQ8sJ6BzzbZDQ7v",
  HYDRATION_UNSWEET_TEA: "fldhJq2wz89p8ByQy",
  HYDRATION_SWEET_TEA: "fldI8bUs0r9kF0R2d",
  HYDRATION_SODA_SELECTION: "fldvM9UQdP3yQxTi6",
  HYDRATION_OTHER: "fldWjQ9vqN3zDhy7X",
  HYDRATION_BOTTLED_TEA: "fld91JcDezV20RarF",
  HYDRATION_DIET_TEA: "fldGUB8Thl42pJcx6",
  HYDRATION_MIXTURE: "fldV6XXkMe5S0zyEV",

  // Exceptions / Special Handling
  EXCEPTIONS_SPECIAL_HANDLING: "flddJ8Q3tlV8FnYue",
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
  return params;
};

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
  params.set("maxRecords", "200");
  params.set("cellFormat", "json");
  params.set("returnFieldsByFieldId", "true");
  params.append("fields[]", FIELD_IDS.EVENT_NAME);
  params.append("fields[]", FIELD_IDS.EVENT_DATE);
  params.append("fields[]", FIELD_IDS.EVENT_TYPE);
  params.append("fields[]", FIELD_IDS.SERVICE_STYLE);
  params.append("fields[]", FIELD_IDS.GUEST_COUNT);

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${table}?${params.toString()}`
  );

  if (isErrorResult(data)) return data;

  return data.records.map((record) => {
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

export const updateEventMultiple = async (
  recordId: string,
  updatesObject: Record<string, unknown>
): Promise<{ success: true } | AirtableErrorResult> => {
  const table = getEventsTable();
  if (typeof table !== "string") return table;

  const data = await airtableFetch(`/${table}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields: updatesObject,
        },
      ],
    }),
  });

  if (isErrorResult(data)) return data;
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
  venueFullAddress: string;
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
    venueFullAddress: asString(fields[FIELD_IDS.VENUE_FULL_ADDRESS]),
  };
};

export type MenuItemRecord = {
  id: string;
  name: string;
};

export type MenuSelections = {
  passedAppetizers: string[];
  presentedAppetizers: string[];
  buffetItems: string[];
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
    buffetItems: asLinkedRecordIds(fields[FIELD_IDS.BUFFET_ITEMS]),
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
