// @ts-nocheck
export * from "./airtable";

export type ClientDetails = {
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactRole: string;
};

export const getClientDetails = async (recordId: string): Promise<ClientDetails> => {
  const table = getEventsTable();
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");

  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  const fields = data.fields;
  const roleValue = fields[PRIMARY_CONTACT_ROLE_FIELD_ID];

  return {
    clientFirstName: String(fields[CLIENT_FIRST_NAME_FIELD_ID] ?? ""),
    clientLastName: String(fields[CLIENT_LAST_NAME_FIELD_ID] ?? ""),
    clientEmail: String(fields[CLIENT_EMAIL_FIELD_ID] ?? ""),
    clientPhone: String(fields[CLIENT_PHONE_FIELD_ID] ?? ""),
    primaryContactName: String(fields[PRIMARY_CONTACT_NAME_FIELD_ID] ?? ""),
    primaryContactPhone: String(fields[PRIMARY_CONTACT_PHONE_FIELD_ID] ?? ""),
    primaryContactRole:
      typeof roleValue === "string" ? roleValue : (roleValue as { name?: string })?.name ?? "",
  };
};

export type ClientDetailsUpdate = Partial<ClientDetails>;

export const updateClientDetails = async (
  recordId: string,
  update: ClientDetailsUpdate
): Promise<void> => {
  const table = getEventsTable();
  const fields: Record<string, unknown> = {};

  if (update.clientFirstName !== undefined) fields[CLIENT_FIRST_NAME_FIELD_ID] = update.clientFirstName;
  if (update.clientLastName !== undefined) fields[CLIENT_LAST_NAME_FIELD_ID] = update.clientLastName;
  if (update.clientEmail !== undefined) fields[CLIENT_EMAIL_FIELD_ID] = update.clientEmail;
  if (update.clientPhone !== undefined) fields[CLIENT_PHONE_FIELD_ID] = update.clientPhone;
  if (update.primaryContactName !== undefined) fields[PRIMARY_CONTACT_NAME_FIELD_ID] = update.primaryContactName;
  if (update.primaryContactPhone !== undefined) fields[PRIMARY_CONTACT_PHONE_FIELD_ID] = update.primaryContactPhone;
  if (update.primaryContactRole !== undefined) fields[PRIMARY_CONTACT_ROLE_FIELD_ID] = update.primaryContactRole;

  await airtableFetch(`/${table}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    }),
  });
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

export const getEventDetails = async (recordId: string): Promise<EventDetails> => {
  const table = getEventsTable();
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");

  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  const fields = data.fields;
  const eventType = fields[EVENT_TYPE_FIELD_ID];
  const serviceStyle = fields[SERVICE_STYLE_FIELD_ID];
  const venueState = fields[VENUE_STATE_FIELD_ID];

  return {
    eventName: String(fields[EVENT_NAME_FIELD_ID] ?? ""),
    eventDate: String(fields[EVENT_DATE_FIELD_ID] ?? ""),
    eventType: typeof eventType === "string" ? eventType : (eventType as { name?: string })?.name ?? "",
    serviceStyle:
      typeof serviceStyle === "string" ? serviceStyle : (serviceStyle as { name?: string })?.name ?? "",
    guestCount: fields[GUEST_COUNT_FIELD_ID] !== undefined ? String(fields[GUEST_COUNT_FIELD_ID]) : "",
    venue: String(fields[VENUE_FIELD_ID] ?? ""),
    venueAddress: String(fields[VENUE_ADDRESS_FIELD_ID] ?? ""),
    venueCity: String(fields[VENUE_CITY_FIELD_ID] ?? ""),
    venueState: typeof venueState === "string" ? venueState : (venueState as { name?: string })?.name ?? "",
    venueFullAddress: String(fields[VENUE_FULL_ADDRESS_FIELD_ID] ?? ""),
  };
};

export type EventDetailsUpdate = Partial<EventDetails>;

export const updateEventDetails = async (
  recordId: string,
  update: EventDetailsUpdate
): Promise<void> => {
  const table = getEventsTable();
  const fields: Record<string, unknown> = {};

  if (update.eventDate !== undefined) fields[EVENT_DATE_FIELD_ID] = update.eventDate || null;
  if (update.eventType !== undefined) fields[EVENT_TYPE_FIELD_ID] = update.eventType || null;
  if (update.serviceStyle !== undefined) fields[SERVICE_STYLE_FIELD_ID] = update.serviceStyle || null;
  if (update.guestCount !== undefined) {
    const numeric = update.guestCount === "" ? null : Number(update.guestCount);
    fields[GUEST_COUNT_FIELD_ID] = Number.isNaN(numeric) ? null : numeric;
  }
  if (update.venue !== undefined) fields[VENUE_FIELD_ID] = update.venue;
  if (update.venueAddress !== undefined) fields[VENUE_ADDRESS_FIELD_ID] = update.venueAddress;
  if (update.venueCity !== undefined) fields[VENUE_CITY_FIELD_ID] = update.venueCity;
  if (update.venueState !== undefined) fields[VENUE_STATE_FIELD_ID] = update.venueState || null;

  await airtableFetch(`/${table}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    }),
  });
};

export type MenuItemRecord = {
  id: string;
  name: string;
};

const listLinkedTableItems = async (tableId: string, nameFieldId: string): Promise<MenuItemRecord[]> => {
  const params = new URLSearchParams();
  params.set("maxRecords", "500");
  params.set("cellFormat", "json");
  params.set("returnFieldsByFieldId", "true");
  params.append("fields[]", nameFieldId);

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${tableId}?${params.toString()}`
  );

  return data.records.map((record) => {
    const nameValue = record.fields[nameFieldId];
    return {
      id: record.id,
      name: typeof nameValue === "string" ? nameValue : String(nameValue ?? record.id),
    };
  });
};

export const listMenuItems = async (): Promise<MenuItemRecord[]> =>
  listLinkedTableItems(MENU_ITEMS_TABLE_ID, MENU_ITEMS_NAME_FIELD_ID);

export const listMenuItemSpecs = async (): Promise<MenuItemRecord[]> =>
  listLinkedTableItems(MENU_ITEM_SPECS_TABLE_ID, MENU_ITEM_SPECS_NAME_FIELD_ID);

export type MenuSelections = {
  passedAppetizers: string[];
  presentedAppetizers: string[];
  buffetItems: string[];
  desserts: string[];
  beverages: string[];
  menuItems: string[];
  menuItemSpecs: string[];
};

export const getMenuSelections = async (recordId: string): Promise<MenuSelections> => {
  const table = getEventsTable();
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");
  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  const fields = data.fields;
  const toArray = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);

  return {
    passedAppetizers: toArray(fields[PASSED_APPETIZERS_FIELD_ID]),
    presentedAppetizers: toArray(fields[PRESENTED_APPETIZERS_FIELD_ID]),
    buffetItems: toArray(fields[BUFFET_ITEMS_FIELD_ID]),
    desserts: toArray(fields[DESSERTS_FIELD_ID]),
    beverages: toArray(fields[BEVERAGES_FIELD_ID]),
    menuItems: toArray(fields[MENU_ITEMS_FIELD_ID]),
    menuItemSpecs: toArray(fields[MENU_ITEM_SPECS_FIELD_ID]),
  };
};

export type MenuSelectionsUpdate = Partial<MenuSelections>;

export const updateMenuSelections = async (
  recordId: string,
  update: MenuSelectionsUpdate
): Promise<void> => {
  const table = getEventsTable();
  const fields: Record<string, unknown> = {};

  if (update.passedAppetizers !== undefined) fields[PASSED_APPETIZERS_FIELD_ID] = update.passedAppetizers;
  if (update.presentedAppetizers !== undefined)
    fields[PRESENTED_APPETIZERS_FIELD_ID] = update.presentedAppetizers;
  if (update.buffetItems !== undefined) fields[BUFFET_ITEMS_FIELD_ID] = update.buffetItems;
  if (update.desserts !== undefined) fields[DESSERTS_FIELD_ID] = update.desserts;
  if (update.beverages !== undefined) fields[BEVERAGES_FIELD_ID] = update.beverages;
  if (update.menuItems !== undefined) fields[MENU_ITEMS_FIELD_ID] = update.menuItems;
  if (update.menuItemSpecs !== undefined) fields[MENU_ITEM_SPECS_FIELD_ID] = update.menuItemSpecs;

  await airtableFetch(`/${table}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    }),
  });
};

export type BarServiceDetails = {
  barServiceNeeded: string;
  infusedWater: string;
  infusionIngredients: string;
  dispenserCount: string;
};

export const getBarServiceDetails = async (recordId: string): Promise<BarServiceDetails> => {
  const table = getEventsTable();
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");

  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  const fields = data.fields;
  const infusedWater = fields[INFUSED_WATER_FIELD_ID];
  const barService = fields[BAR_SERVICE_NEEDED_FIELD_ID];

  return {
    barServiceNeeded:
      typeof barService === "string" ? barService : (barService as { name?: string })?.name ?? "",
    infusedWater:
      typeof infusedWater === "string" ? infusedWater : (infusedWater as { name?: string })?.name ?? "",
    infusionIngredients: String(fields[INFUSION_INGREDIENTS_FIELD_ID] ?? ""),
    dispenserCount: fields[DISPENSER_COUNT_FIELD_ID] !== undefined ? String(fields[DISPENSER_COUNT_FIELD_ID]) : "",
  };
};

export type BarServiceUpdate = Partial<BarServiceDetails>;

export const updateBarServiceDetails = async (
  recordId: string,
  update: BarServiceUpdate
): Promise<void> => {
  const table = getEventsTable();
  const fields: Record<string, unknown> = {};

  if (update.barServiceNeeded !== undefined)
    fields[BAR_SERVICE_NEEDED_FIELD_ID] = update.barServiceNeeded || null;
  if (update.infusedWater !== undefined) fields[INFUSED_WATER_FIELD_ID] = update.infusedWater || null;
  if (update.infusionIngredients !== undefined)
    fields[INFUSION_INGREDIENTS_FIELD_ID] = update.infusionIngredients;
  if (update.dispenserCount !== undefined) {
    const numeric = update.dispenserCount === "" ? null : Number(update.dispenserCount);
    fields[DISPENSER_COUNT_FIELD_ID] = Number.isNaN(numeric) ? null : numeric;
  }
  await airtableFetch(`/${table}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    }),
  });
};

export type CoffeeServiceDetails = {
  coffeeServiceNeeded: boolean;
};

export const getCoffeeServiceDetails = async (recordId: string): Promise<CoffeeServiceDetails> => {
  const table = getEventsTable();
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");
  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  const fields = data.fields;
  return {
    coffeeServiceNeeded: Boolean(fields[COFFEE_SERVICE_NEEDED_FIELD_ID] ?? false),
  };
};

export type CoffeeServiceUpdate = Partial<CoffeeServiceDetails>;

export const updateCoffeeServiceDetails = async (
  recordId: string,
  update: CoffeeServiceUpdate
): Promise<void> => {
  const table = getEventsTable();
  const fields: Record<string, unknown> = {};

  if (update.coffeeServiceNeeded !== undefined)
    fields[COFFEE_SERVICE_NEEDED_FIELD_ID] = update.coffeeServiceNeeded;

  await airtableFetch(`/${table}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    }),
  });
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

export const getBeveragesDetails = async (recordId: string): Promise<BeveragesDetails> => {
  const table = getEventsTable();
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");

  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  const fields = data.fields;

  return {
    bottledWater: Boolean(fields[BOTTLED_WATER_FIELD_ID] ?? false),
    unsweetenedIcedTea: Boolean(fields[UNSWEETENED_TEA_FIELD_ID] ?? false),
    sweetTea: Boolean(fields[SWEET_TEA_FIELD_ID] ?? false),
    coke: Boolean(fields[COKE_FIELD_ID] ?? false),
    dietCoke: Boolean(fields[DIET_COKE_FIELD_ID] ?? false),
    gingerAle: Boolean(fields[GINGER_ALE_FIELD_ID] ?? false),
    sprite: Boolean(fields[SPRITE_FIELD_ID] ?? false),
    otherSoda: Boolean(fields[OTHER_SODA_FIELD_ID] ?? false),
    bottledIcedTea: Boolean(fields[BOTTLED_TEA_FIELD_ID] ?? false),
    dietIcedTea: Boolean(fields[DIET_TEA_FIELD_ID] ?? false),
    mixture: Boolean(fields[MIXTURE_FIELD_ID] ?? false),
  };
};

export type BeveragesUpdate = Partial<BeveragesDetails>;

export const updateBeveragesDetails = async (
  recordId: string,
  update: BeveragesUpdate
): Promise<void> => {
  const table = getEventsTable();
  const fields: Record<string, unknown> = {};

  if (update.bottledWater !== undefined) fields[BOTTLED_WATER_FIELD_ID] = update.bottledWater;
  if (update.unsweetenedIcedTea !== undefined)
    fields[UNSWEETENED_TEA_FIELD_ID] = update.unsweetenedIcedTea;
  if (update.sweetTea !== undefined) fields[SWEET_TEA_FIELD_ID] = update.sweetTea;
  if (update.coke !== undefined) fields[COKE_FIELD_ID] = update.coke;
  if (update.dietCoke !== undefined) fields[DIET_COKE_FIELD_ID] = update.dietCoke;
  if (update.gingerAle !== undefined) fields[GINGER_ALE_FIELD_ID] = update.gingerAle;
  if (update.sprite !== undefined) fields[SPRITE_FIELD_ID] = update.sprite;
  if (update.otherSoda !== undefined) fields[OTHER_SODA_FIELD_ID] = update.otherSoda;
  if (update.bottledIcedTea !== undefined) fields[BOTTLED_TEA_FIELD_ID] = update.bottledIcedTea;
  if (update.dietIcedTea !== undefined) fields[DIET_TEA_FIELD_ID] = update.dietIcedTea;
  if (update.mixture !== undefined) fields[MIXTURE_FIELD_ID] = update.mixture;

  await airtableFetch(`/${table}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    }),
  });
};

export type StaffRecord = {
  id: string;
  name: string;
};

export const listStaff = async (): Promise<StaffRecord[]> =>
  listLinkedTableItems(STAFF_TABLE_ID, STAFF_NAME_FIELD_ID);

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

export const getStaffingSelections = async (recordId: string): Promise<StaffingSelections> => {
  const table = getEventsTable();
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");
  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  const fields = data.fields;
  const toArray = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);
  const toSingle = (value: unknown) => (Array.isArray(value) ? (value[0] ? String(value[0]) : "") : "");

  return {
    staff: toArray(fields[STAFF_FIELD_ID]),
    captain: toSingle(fields[CAPTAIN_FIELD_ID]),
    servers: toArray(fields[SERVERS_FIELD_ID]),
    utility: toArray(fields[UTILITY_FIELD_ID]),
    stationCrew: toArray(fields[STATION_CREW_FIELD_ID]),
    chef: toArray(fields[CHEF_FIELD_ID]),
    bartenders: toArray(fields[BARTENDERS_FIELD_ID]),
    displayDesign: toArray(fields[DISPLAY_DESIGN_FIELD_ID]),
    diningCrew: toArray(fields[DINING_CREW_FIELD_ID]),
  };
};

export type StaffingUpdate = Partial<StaffingSelections>;

export const updateStaffingSelections = async (
  recordId: string,
  update: StaffingUpdate
): Promise<void> => {
  const table = getEventsTable();
  const fields: Record<string, unknown> = {};

  if (update.staff !== undefined) fields[STAFF_FIELD_ID] = update.staff;
  if (update.captain !== undefined) fields[CAPTAIN_FIELD_ID] = update.captain ? [update.captain] : [];
  if (update.servers !== undefined) fields[SERVERS_FIELD_ID] = update.servers;
  if (update.utility !== undefined) fields[UTILITY_FIELD_ID] = update.utility;
  if (update.stationCrew !== undefined) fields[STATION_CREW_FIELD_ID] = update.stationCrew;
  if (update.chef !== undefined) fields[CHEF_FIELD_ID] = update.chef;
  if (update.bartenders !== undefined) fields[BARTENDERS_FIELD_ID] = update.bartenders;
  if (update.displayDesign !== undefined) fields[DISPLAY_DESIGN_FIELD_ID] = update.displayDesign;
  if (update.diningCrew !== undefined) fields[DINING_CREW_FIELD_ID] = update.diningCrew;

  await airtableFetch(`/${table}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    }),
  });
};

export type NotesDetails = {
  dietaryNotes: string;
  specialNotes: string;
  themeColorScheme: string;
};

export const getNotesDetails = async (recordId: string): Promise<NotesDetails> => {
  const table = getEventsTable();
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");
  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  const fields = data.fields;
  return {
    dietaryNotes: String(fields[DIETARY_NOTES_FIELD_ID] ?? ""),
    specialNotes: String(fields[SPECIAL_NOTES_FIELD_ID] ?? ""),
    themeColorScheme: String(fields[THEME_COLOR_SCHEME_FIELD_ID] ?? ""),
  };
};

export type NotesUpdate = Partial<NotesDetails>;

export const updateNotesDetails = async (
  recordId: string,
  update: NotesUpdate
): Promise<void> => {
  const table = getEventsTable();
  const fields: Record<string, unknown> = {};

  if (update.dietaryNotes !== undefined) fields[DIETARY_NOTES_FIELD_ID] = update.dietaryNotes;
  if (update.specialNotes !== undefined) fields[SPECIAL_NOTES_FIELD_ID] = update.specialNotes;
  if (update.themeColorScheme !== undefined) fields[THEME_COLOR_SCHEME_FIELD_ID] = update.themeColorScheme;

  await airtableFetch(`/${table}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    }),
  });
};

export type AttachmentItem = {
  id?: string;
  url?: string;
  filename?: string;
};

export type AttachmentsDetails = {
  eventDocuments: AttachmentItem[];
  invoicePdf: AttachmentItem[];
  generatedBeoPdf: AttachmentItem[];
};

export const getAttachmentsDetails = async (recordId: string): Promise<AttachmentsDetails> => {
  const table = getEventsTable();
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");
  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  const fields = data.fields;
  const toAttachments = (value: unknown) => (Array.isArray(value) ? (value as AttachmentItem[]) : []);

  return {
    eventDocuments: toAttachments(fields[EVENT_DOCUMENTS_FIELD_ID]),
    invoicePdf: toAttachments(fields[INVOICE_PDF_FIELD_ID]),
    generatedBeoPdf: toAttachments(fields[GENERATED_BEO_PDF_FIELD_ID]),
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

export const getStatusDetails = async (recordId: string): Promise<StatusDetails> => {
  const table = getEventsTable();
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");
  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  const fields = data.fields;
  const toSelect = (value: unknown) =>
    typeof value === "string" ? value : (value as { name?: string })?.name ?? "";

  return {
    status: toSelect(fields[STATUS_FIELD_ID]),
    bookingStatus: toSelect(fields[BOOKING_STATUS_FIELD_ID]),
    paymentStatus: toSelect(fields[PAYMENT_STATUS_FIELD_ID]),
    paymentType: toSelect(fields[PAYMENT_TYPE_FIELD_ID]),
    contractSent: Boolean(fields[CONTRACT_SENT_FIELD_ID] ?? false),
    contractSigned: Boolean(fields[CONTRACT_SIGNED_FIELD_ID] ?? false),
    invoiceSent: Boolean(fields[INVOICE_SENT_FIELD_ID] ?? false),
    invoicePaid: Boolean(fields[INVOICE_PAID_FIELD_ID] ?? false),
  };
};

export type StatusUpdate = Partial<StatusDetails>;

export const updateStatusDetails = async (
  recordId: string,
  update: StatusUpdate
): Promise<void> => {
  const table = getEventsTable();
  const fields: Record<string, unknown> = {};

  if (update.status !== undefined) fields[STATUS_FIELD_ID] = update.status || null;
  if (update.bookingStatus !== undefined) fields[BOOKING_STATUS_FIELD_ID] = update.bookingStatus || null;
  if (update.paymentStatus !== undefined) fields[PAYMENT_STATUS_FIELD_ID] = update.paymentStatus || null;
  if (update.paymentType !== undefined) fields[PAYMENT_TYPE_FIELD_ID] = update.paymentType || null;
  if (update.contractSent !== undefined) fields[CONTRACT_SENT_FIELD_ID] = update.contractSent;
  if (update.contractSigned !== undefined) fields[CONTRACT_SIGNED_FIELD_ID] = update.contractSigned;
  if (update.invoiceSent !== undefined) fields[INVOICE_SENT_FIELD_ID] = update.invoiceSent;
  if (update.invoicePaid !== undefined) fields[INVOICE_PAID_FIELD_ID] = update.invoicePaid;

  await airtableFetch(`/${table}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    }),
  });
};

export type RentalsItemRecord = {
  id: string;
  name: string;
};

export const listRentals = async (): Promise<RentalsItemRecord[]> =>
  listLinkedTableItems(RENTALS_TABLE_ID, RENTALS_NAME_FIELD_ID);

export const listRentalItems = async (): Promise<RentalsItemRecord[]> =>
  listLinkedTableItems(RENTAL_ITEMS_TABLE_ID, RENTAL_ITEMS_NAME_FIELD_ID);

export const listServiceWare = async (): Promise<RentalsItemRecord[]> =>
  listLinkedTableItems(SERVICE_WARE_TABLE_ID, SERVICE_WARE_NAME_FIELD_ID);

export type RentalsDetails = {
  rentals: string[];
  rentalItems: string[];
  rentalsNeeded: string[];
  serviceWare: string[];
  serviceWareSource: string;
  linensOverlaysNeeded: string;
};

export const getRentalsDetails = async (recordId: string): Promise<RentalsDetails> => {
  const table = getEventsTable();
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");
  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  const fields = data.fields;
  const toArray = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);
  const toSelect = (value: unknown) =>
    typeof value === "string" ? value : (value as { name?: string })?.name ?? "";

  return {
    rentals: toArray(fields[RENTALS_FIELD_ID]),
    rentalItems: toArray(fields[RENTAL_ITEMS_FIELD_ID]),
    rentalsNeeded: toArray(fields[RENTALS_NEEDED_FIELD_ID]),
    serviceWare: toArray(fields[SERVICE_WARE_FIELD_ID]),
    serviceWareSource: toSelect(fields[SERVICE_WARE_SOURCE_FIELD_ID]),
    linensOverlaysNeeded: String(fields[LINENS_OVERLAYS_FIELD_ID] ?? ""),
  };
};

export type RentalsUpdate = Partial<RentalsDetails>;

export const updateRentalsDetails = async (
  recordId: string,
  update: RentalsUpdate
): Promise<void> => {
  const table = getEventsTable();
  const fields: Record<string, unknown> = {};

  if (update.rentals !== undefined) fields[RENTALS_FIELD_ID] = update.rentals;
  if (update.rentalItems !== undefined) fields[RENTAL_ITEMS_FIELD_ID] = update.rentalItems;
  if (update.rentalsNeeded !== undefined) fields[RENTALS_NEEDED_FIELD_ID] = update.rentalsNeeded;
  if (update.serviceWare !== undefined) fields[SERVICE_WARE_FIELD_ID] = update.serviceWare;
  if (update.serviceWareSource !== undefined)
    fields[SERVICE_WARE_SOURCE_FIELD_ID] = update.serviceWareSource || null;
  if (update.linensOverlaysNeeded !== undefined)
    fields[LINENS_OVERLAYS_FIELD_ID] = update.linensOverlaysNeeded;

  await airtableFetch(`/${table}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    }),
  });
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

export const getTimelineDetails = async (recordId: string): Promise<TimelineDetails> => {
  const table = getEventsTable();
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");
  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  const fields = data.fields;
  return {
    dispatchTime: String(fields[DISPATCH_TIME_FIELD_ID] ?? ""),
    eventStartTime: fields[EVENT_START_TIME_FIELD_ID] !== undefined ? String(fields[EVENT_START_TIME_FIELD_ID]) : "",
    eventEndTime: fields[EVENT_END_TIME_FIELD_ID] !== undefined ? String(fields[EVENT_END_TIME_FIELD_ID]) : "",
    foodwerxArrival: fields[FOODWERX_ARRIVAL_FIELD_ID] !== undefined ? String(fields[FOODWERX_ARRIVAL_FIELD_ID]) : "",
    timeline: String(fields[TIMELINE_FIELD_ID] ?? ""),
    parkingAccess: String(fields[PARKING_ACCESS_FIELD_ID] ?? ""),
    parkingNotes: String(fields[PARKING_NOTES_FIELD_ID] ?? ""),
  };
};

export type TimelineUpdate = Partial<TimelineDetails>;

export const updateTimelineDetails = async (
  recordId: string,
  update: TimelineUpdate
): Promise<void> => {
  const table = getEventsTable();
  const fields: Record<string, unknown> = {};

  if (update.dispatchTime !== undefined) fields[DISPATCH_TIME_FIELD_ID] = update.dispatchTime || null;
  if (update.eventStartTime !== undefined) {
    const numeric = update.eventStartTime === "" ? null : Number(update.eventStartTime);
    fields[EVENT_START_TIME_FIELD_ID] = Number.isNaN(numeric) ? null : numeric;
  }
  if (update.eventEndTime !== undefined) {
    const numeric = update.eventEndTime === "" ? null : Number(update.eventEndTime);
    fields[EVENT_END_TIME_FIELD_ID] = Number.isNaN(numeric) ? null : numeric;
  }
  if (update.foodwerxArrival !== undefined) {
    const numeric = update.foodwerxArrival === "" ? null : Number(update.foodwerxArrival);
    fields[FOODWERX_ARRIVAL_FIELD_ID] = Number.isNaN(numeric) ? null : numeric;
  }
  if (update.timeline !== undefined) fields[TIMELINE_FIELD_ID] = update.timeline;
  if (update.parkingAccess !== undefined) fields[PARKING_ACCESS_FIELD_ID] = update.parkingAccess;
  if (update.parkingNotes !== undefined) fields[PARKING_NOTES_FIELD_ID] = update.parkingNotes;

  await airtableFetch(`/${table}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    }),
  });
};

export type DietaryAllergiesDetails = {
  dietaryNotes: string;
  allergiesPrint: string;
  dietarySummary: string;
};

export const getDietaryAllergiesDetails = async (
  recordId: string
): Promise<DietaryAllergiesDetails> => {
  const table = getEventsTable();
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");
  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  const fields = data.fields;
  return {
    dietaryNotes: String(fields[DIETARY_NOTES_FIELD_ID] ?? ""),
    allergiesPrint: String(fields[ALLERGIES_PRINT_FIELD_ID] ?? ""),
    dietarySummary: String(fields[DIETARY_SUMMARY_FIELD_ID] ?? ""),
  };
};

export type DietaryAllergiesUpdate = Partial<Pick<DietaryAllergiesDetails, "dietaryNotes">>;

export const updateDietaryAllergiesDetails = async (
  recordId: string,
  update: DietaryAllergiesUpdate
): Promise<void> => {
  const table = getEventsTable();
  const fields: Record<string, unknown> = {};

  if (update.dietaryNotes !== undefined) fields[DIETARY_NOTES_FIELD_ID] = update.dietaryNotes;

  await airtableFetch(`/${table}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    }),
  });
};

export type BeoPrintDetails = {
  printEventHeader: string;
  printEventDetails: string;
  printClientBlock: string;
  printAddressBlock: string;
};

export const getBeoPrintDetails = async (recordId: string): Promise<BeoPrintDetails> => {
  const table = getEventsTable();
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");
  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  const fields = data.fields;
  return {
    printEventHeader: String(fields[PRINT_EVENT_HEADER_FIELD_ID] ?? ""),
    printEventDetails: String(fields[PRINT_EVENT_DETAILS_FIELD_ID] ?? ""),
    printClientBlock: String(fields[PRINT_CLIENT_BLOCK_FIELD_ID] ?? ""),
    printAddressBlock: String(fields[PRINT_ADDRESS_BLOCK_FIELD_ID] ?? ""),
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

export const getServicewareDetails = async (recordId: string): Promise<ServicewareDetails> => {
  const table = getEventsTable();
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");
  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  const fields = data.fields;
  const toArray = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);
  const toSelect = (value: unknown) =>
    typeof value === "string" ? value : (value as { name?: string })?.name ?? "";

  return {
    chinaPaperGlassware: toArray(fields[CHINA_PAPER_GLASSWARE_FIELD_ID]),
    serviceWareSource: toSelect(fields[SERVICE_WARE_SOURCE_ALT_FIELD_ID]),
    bAndBs: fields[BBS_FIELD_ID] !== undefined ? String(fields[BBS_FIELD_ID]) : "",
    largePlates: fields[LARGE_PLATES_FIELD_ID] !== undefined ? String(fields[LARGE_PLATES_FIELD_ID]) : "",
    saladPlates: fields[SALAD_PLATES_FIELD_ID] !== undefined ? String(fields[SALAD_PLATES_FIELD_ID]) : "",
    paperType: toSelect(fields[PAPER_TYPE_FIELD_ID]),
  };
};

export type ServicewareUpdate = Partial<ServicewareDetails>;

export const updateServicewareDetails = async (
  recordId: string,
  update: ServicewareUpdate
): Promise<void> => {
  const table = getEventsTable();
  const fields: Record<string, unknown> = {};

  if (update.chinaPaperGlassware !== undefined)
    fields[CHINA_PAPER_GLASSWARE_FIELD_ID] = update.chinaPaperGlassware;
  if (update.serviceWareSource !== undefined)
    fields[SERVICE_WARE_SOURCE_ALT_FIELD_ID] = update.serviceWareSource || null;
  if (update.bAndBs !== undefined) {
    const numeric = update.bAndBs === "" ? null : Number(update.bAndBs);
    fields[BBS_FIELD_ID] = Number.isNaN(numeric) ? null : numeric;
  }
  if (update.largePlates !== undefined) {
    const numeric = update.largePlates === "" ? null : Number(update.largePlates);
    fields[LARGE_PLATES_FIELD_ID] = Number.isNaN(numeric) ? null : numeric;
  }
  if (update.saladPlates !== undefined) {
    const numeric = update.saladPlates === "" ? null : Number(update.saladPlates);
    fields[SALAD_PLATES_FIELD_ID] = Number.isNaN(numeric) ? null : numeric;
  }
  if (update.paperType !== undefined) fields[PAPER_TYPE_FIELD_ID] = update.paperType || null;

  await airtableFetch(`/${table}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    }),
  });
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

export const getHydrationStationDetails = async (
  recordId: string
): Promise<HydrationStationDetails> => {
  const table = getEventsTable();
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");
  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${table}/${recordId}?${params.toString()}`
  );

  const fields = data.fields;
  const toSelect = (value: unknown) =>
    typeof value === "string" ? value : (value as { name?: string })?.name ?? "";
  const toArray = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);

  return {
    bottledWater: toSelect(fields[HYDRATION_BOTTLED_WATER_FIELD_ID]),
    unsweetenedIcedTea: Boolean(fields[HYDRATION_UNSWEET_TEA_FIELD_ID] ?? false),
    sweetTea: Boolean(fields[HYDRATION_SWEET_TEA_FIELD_ID] ?? false),
    sodaSelection: toArray(fields[HYDRATION_SODA_SELECTION_FIELD_ID]),
    hydrationOther: String(fields[HYDRATION_OTHER_FIELD_ID] ?? ""),
    bottledIcedTea: Boolean(fields[HYDRATION_BOTTLED_TEA_FIELD_ID] ?? false),
    dietIcedTea: Boolean(fields[HYDRATION_DIET_TEA_FIELD_ID] ?? false),
    mixtureOfTeasAndSodas: Boolean(fields[HYDRATION_MIXTURE_FIELD_ID] ?? false),
  };
};

export type HydrationStationUpdate = Partial<HydrationStationDetails>;

export const updateHydrationStationDetails = async (
  recordId: string,
  update: HydrationStationUpdate
): Promise<void> => {
  const table = getEventsTable();
  const fields: Record<string, unknown> = {};

  if (update.bottledWater !== undefined)
    fields[HYDRATION_BOTTLED_WATER_FIELD_ID] = update.bottledWater || null;
  if (update.unsweetenedIcedTea !== undefined)
    fields[HYDRATION_UNSWEET_TEA_FIELD_ID] = update.unsweetenedIcedTea;
  if (update.sweetTea !== undefined) fields[HYDRATION_SWEET_TEA_FIELD_ID] = update.sweetTea;
  if (update.sodaSelection !== undefined)
    fields[HYDRATION_SODA_SELECTION_FIELD_ID] = update.sodaSelection;
  if (update.hydrationOther !== undefined) fields[HYDRATION_OTHER_FIELD_ID] = update.hydrationOther;
  if (update.bottledIcedTea !== undefined) fields[HYDRATION_BOTTLED_TEA_FIELD_ID] = update.bottledIcedTea;
  if (update.dietIcedTea !== undefined) fields[HYDRATION_DIET_TEA_FIELD_ID] = update.dietIcedTea;
  if (update.mixtureOfTeasAndSodas !== undefined)
    fields[HYDRATION_MIXTURE_FIELD_ID] = update.mixtureOfTeasAndSodas;

  await airtableFetch(`/${table}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    }),
  });
};
