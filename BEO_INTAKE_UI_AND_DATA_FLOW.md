# EventOps BEO Full Intake — UI Structure & Data Flow for DaddyGPT

This document describes the BEO Full Intake UI, its Airtable field mappings, and data flow so a Dropbox parser can populate events correctly.

---

## 1. BEO Full Intake UI Structure

The BEO Intake page (`BeoIntakePage.tsx`, route `/beo-intake`) is a single-page form. When an event is selected from the EventSelector dropdown, the following sections render in order:

### Section Order (Full Service)

1. **ClientAndContactSection** — Client info + Primary Contact
2. **EventCoreSection** — Event type, date, guest count, times
3. **VenueDetailsSection** — Venue name, address, city, state, zip
4. **MenuAndBeveragesSection** — Contains:
   - **MenuSection** — Passed Apps, Presented Apps, Buffet Metal, Buffet China, Desserts, Stations, Room Temp Display, Displays (Full Service) OR HOT, Deli, Desserts (Delivery)
   - **BeverageServicesSection** — Bar, Hydration, Coffee/Tea, Ice
   - **DeliveryPaperProductsSection** — (Delivery only) Paper products & utensils
5. **KitchenAndServicewareSection** — Contains:
   - **KitchenLogisticsSection** — Kitchen On-Site?, Food Must Go Hot?
   - **ServicewareSection** — Plates, Cutlery, Glassware, Source, Paper Type
6. **TimelineSection** — BEO Timeline (long text)
7. **SiteVisitLogisticsSection** — Parking, Load-In, Venue Notes, Kitchen Access, Power, Stairs, Elevators, Animals, Food Setup, Event Purpose, Client-Supplied Food, Religious Restrictions, Dietary, Special Notes, BEO Notes, Theme Color Scheme
8. **ApprovalsLockoutSection** — Guest Count / Menu lockout buttons (role-gated)

### Delivery vs Full Service

- **Delivery**: Event type "Delivery" or "Pickup" → simplified layout (no Kitchen/Serviceware, no Timeline, no Site Visit; Menu shows HOT, Deli, Desserts; Paper Products section shown)
- **Full Service**: All sections visible

---

## 2. Component Organization by Section

### ClientAndContactSection
- **Layout**: Grid of text inputs and one single-select
- **Fields**: Client First Name, Last Name, Business Name (delivery), Email, Phone, Street, City, State, Zip; Primary Contact Name, Phone, Role
- **Behavior**: `onBlur` saves; Primary Contact Role uses `loadSingleSelectOptions` for dropdown choices

### EventCoreSection
- **Layout**: Dropdowns + number input + time pickers
- **Fields**: Event Type, Event Occasion, Service Style, Event Date, Guest Count, Dispatch Time, Event Start, Event End, FoodWerx Arrival (or Venue Arrival)
- **Behavior**: Time fields stored as **seconds since midnight** (number). EVENT_START_TIME, EVENT_END_TIME are duration fields. DISPATCH_TIME, VENUE_ARRIVAL_TIME, FOODWERX_ARRIVAL are dateTime → converted to ISO when saving

### VenueDetailsSection
- **Layout**: Text inputs, single-select for State
- **Fields**: Venue, Venue Address, City, State, Venue Full Address; Load-In Notes (delivery)

### MenuSection
- **Layout**: Each menu lane has:
  - **Linked records** — Array of Menu Item record IDs (from Menu Items table `tbl0aN33DGG6R1sPZ`)
  - **Custom text** — Long text for items not in the Menu Items catalog
- **Full Service lanes**: Passed Appetizers, Presented Appetizers, Buffet Metal, Buffet China, Desserts, Room Temp Display, Displays, Creation Stations (STATIONS)
- **Delivery lanes**: Passed Appetizers (reused), Deli (DELIVERY_DELI), Desserts, Room Temp Display
- **Stations**: Separate linked table "Stations" — each station has Station Type, Station Items (linked to Menu Items), Station Notes
- **Behavior**: Picker opens modal to select from `loadMenuItems()`; selections saved as `["recXXX", "recYYY"]`. Custom fields are plain strings.

### BeverageServicesSection
- **Layout**: Collapsible subsections — Bar Service, Hydration Station, Coffee/Tea, Ice
- **Bar**: Bar Service (single-select, resolved by name), Signature Drink Yes/No, Name, Ingredients, Mixers Supplier, Mixers, Garnishes
- **Hydration**: Provided (Yes/No), Drink Options (multi-select), Notes
- **Coffee**: Service Needed (Yes/No), Mug Type (single-select)
- **Ice**: Provided By (single-select)

### KitchenLogisticsSection
- **Layout**: Single-select (Kitchen On-Site: Yes/No/None), checkbox (Food Must Go Hot)

### ServicewareSection
- **Layout**: Three long-text areas (Plates, Cutlery, Glassware) with structured line format: `• Item Name (Supplier) – Qty`
- **Format**: Each line = `• {item} ({supplier}) – {qty}` or `• {item} ({supplier}) – Provided by host`
- **Also**: Servicware Source, Paper Type (single-selects)

### TimelineSection
- **Layout**: Single textarea
- **Field**: BEO_TIMELINE (long text)

### SiteVisitLogisticsSection
- **Layout**: Many textareas and two single-selects (Stairs/Steps, Elevators Available)
- **Fields**: Parking Notes, Load-In Notes, Venue Notes, Kitchen Access, Power Notes, Timeline Notes, Equipment Notes, Animals/Pets, Food Setup Location, Event Purpose, Client-Supplied Food, Religious Restrictions, Dietary Notes, Special Notes, BEO Notes, Theme Color Scheme

### DietaryNotesSection
- **Note**: Dietary, Special Notes, BEO Notes appear in SiteVisitLogisticsSection; there is also a separate DietaryNotesSection in some flows (check exports). Primary mapping: DIETARY_NOTES, SPECIAL_NOTES, BEO_NOTES.

---

## 3. Airtable Field IDs — Full Mapping

All writes use **field IDs** (e.g. `fldFYaE7hI27R3PsX`), not field names. The app uses `FIELD_IDS` in `src/services/airtable/events.ts`.

### Event Core
| UI Field | Airtable Field ID | Data Type | Notes |
|----------|-------------------|-----------|-------|
| Event Date | fldFYaE7hI27R3PsX | string (YYYY-MM-DD) | |
| Event Type | fldtqnvD7M8xbc0Xb | single-select | Full Service, Delivery, Pickup, etc. |
| Event Occasion | fldVBvZ2m6zQ5xd2D | single-select | Wedding, Bar/Bat Mitzvah, Corporate, etc. |
| Service Style | fldqnW1ulcchcQ05t | single-select | Buffet, Cocktail, Hybrid, Family Style, Plated |
| Guest Count | fldjgqDUxVxaJ7Y9V | number | |
| Dispatch Time | fldbbHmaWqOBNUlJP | dateTime | Sent as ISO string; UI uses seconds since midnight |
| Event Start Time | fldDwDE87M9kFAIDn | number (seconds) | Duration field |
| Event End Time | fld7xeCnV751pxmWz | number (seconds) | Duration field |
| Venue Arrival Time | fld807MPvraEV8QvN | dateTime | ISO string |
| FoodWerx Arrival | (resolved at runtime) | dateTime | Field ID from Meta API by name |

### Client & Contact
| UI Field | Airtable Field ID | Data Type |
|----------|-------------------|-----------|
| Client First Name | fldFAspB1ds9Yn0Kl | string |
| Client Last Name | fldeciZmsIY3c2T1v | string |
| Business Name | fldm6SwoGe6pS7Uam | string |
| Client Email | fldT5lcdCL5ndh84D | string |
| Client Phone | fldnw1VGIi3oXM4g3 | string |
| Client Street | fldUyi7xzG60H1ML4 | string |
| Client City | fldoYWmGny8pkCKJQ | string |
| Client State | fldffsjG72MWzrCjl | string |
| Client ZIP | fldBuaBTjAkwmtd0J | string |
| Primary Contact Name | fldmsFPsl2gAtiSCD | string |
| Primary Contact Phone | fld4OK9zVwr16qMIt | string |
| Primary Contact Role | fldMTRGNFa4pHbjY5 | single-select |

### Venue
| UI Field | Airtable Field ID | Data Type |
|----------|-------------------|-----------|
| Venue | fldtCOxi4Axjfjt0V | string |
| Venue Address | fldJsajSl1l6marzw | string |
| Venue City | fldNToCnV799eggiD | string |
| Venue State | fldxCz5cPLwCetb0C | string |
| Venue ZIP | fldWehIaLQd5sHDts | string |
| Venue Full Address | fld0oRsZp6YCUsOki | string |

### Menu (Linked Records = array of record IDs)
| UI Field | Airtable Field ID | Data Type |
|----------|-------------------|-----------|
| Passed Appetizers | fldpprTRRFNydiV1m | linked records (string[]) |
| Presented Appetizers | fldwku49gGffnnAOV | linked records (string[]) |
| Buffet Metal | fldgi4mL7kyhpQzsy | linked records (string[]) |
| Buffet China | fldtpY6zR1KCag3mI | linked records (string[]) |
| Desserts | flddPGfYJQxixWRq9 | linked records (string[]) |
| Room Temp Display | fld1373dtkeXhufoL | linked records (string[]) |
| Displays | fld9Yesa5cazu27W2 | linked records (string[]) |
| Delivery Deli | fldKRlrDNIJjxg9jn | linked records (string[]) |
| Stations | fldbbDlpheiUGQbKu | linked records (string[]) — links to Stations table |

### Menu (Custom Long Text — raw strings)
| UI Field | Airtable Field ID | Data Type |
|----------|-------------------|-----------|
| Custom Passed App | fldDbT9eLZUoJUnmS | string (long text) |
| Custom Presented App | fldsIaND0Bp3ByW1c | string (long text) |
| Custom Buffet Metal | fldm1qYJE55QVjYsd | string (long text) |
| Custom Buffet China | fldtquSPyLWUEYX6P | string (long text) |
| Custom Desserts | fld95NEZsIfHpVvAk | string (long text) |
| Custom Delivery Deli | fldCustomDeliTODO | placeholder — create in Airtable |
| Custom Room Temp Display | fldCustomRoomTempTODO | placeholder — create in Airtable |

### Bar & Beverage
| UI Field | Airtable Field ID | Data Type |
|----------|-------------------|-----------|
| Bar Service | (resolved by name) | single-select |
| Signature Drink Yes/No | fldcry8vpUBY3fkHk | single-select |
| Signature Drink Name | fldZSIBTkzcEmG7bt | string |
| Signature Drink Ingredients | fld1sg6vQi7lziPDz | string |
| Signature Drink Mixers Supplier | fldoek1mpdi2ESyzu | single-select |
| Bar Mixers | fldXL37gOon7wyQss | string |
| Bar Garnishes | flduv4RtRR0lLm4vY | string |
| Hydration Station Provided | fldfNln4oe566nENv | single-select |
| Hydration Station Drink Options | fldxa3VSW1gNPqRQ0 | multiple-select (string[]) |
| Hydration Station Notes | fldZA0JhJF50PFiwM | string |
| Coffee Service Needed | fldKlKX0HEGX3NTcR | single-select |
| Coffee Mug Type | fldCoffeeMugTypeTODO | placeholder |
| Ice Provided By | fldlPI3Ix1UTuGrCf | single-select |

### Kitchen & Serviceware
| UI Field | Airtable Field ID | Data Type |
|----------|-------------------|-----------|
| Kitchen On-Site | fldSpUlS9qEQ5ly6T | single-select (Yes/No/None) |
| Food Must Go Hot | fldJFB69mmB5T4Ysp | checkbox (boolean) |
| Plates List | fldpKcEoqYiHypHD3 | string (long text) |
| Cutlery List | fld0bZAToUEOodhA2 | string (long text) |
| Glassware List | fldNrnnkggmvbOGSU | string (long text) |
| Serviceware Notes | fldBmeHBiI5K7VuXc | string |
| Serviceware Source | fldTApRuNzh7uNWi2 | single-select |
| Serviceware Paper Type | fldorT4tCcxnBXxgj | single-select |

### Timeline & Notes
| UI Field | Airtable Field ID | Data Type |
|----------|-------------------|-----------|
| BEO Timeline | fld6Z6xw9ciygqyff | string (long text) |
| Dietary Notes | fldhGj51bQQWLJSX0 | string |
| Special Notes | fldlTlYgvPTIUzzMn | string |
| BEO Notes | fldnGtJVWf4u39SHI | string |
| Theme Color Scheme | fld5raG6Afilj1wDo | string |

### Site Visit / Logistics
| UI Field | Airtable Field ID | Data Type |
|----------|-------------------|-----------|
| Parking Notes | fldkmY1Y9b5ToJFsg | string |
| Load-In Notes | fldc75GFDDO1vv5rK | string |
| Venue Notes | fldlc2oZdkJDtk1Mh | string |
| Kitchen Access Notes | fld1rsHIkn06rYh9H | string |
| Power Notes | fldzlZ54PL1WQ5glw | string |
| Timeline Notes | fldNmAssiLj9iYKx9 | string |
| Equipment Notes | fldYmHWaoDv6OL7Mo | string |
| Animals/Pets | fldUFLWnKGtt3TDXZ | string |
| Food Setup Location | fldTecWfMr6IZoXKQ | string |
| Event Purpose | fldT1y9bQdjAyjOlr | string |
| Food Service Flow | fldCHZQBr3uffLjzp | single-select |
| Client-Supplied Food | fldkEYTytozApTWxo | string |
| Religious Restrictions | fldL0tIU2I5oFI1gr | string |

---

## 4. How Data Is Sent to Airtable

### Update Function
- **Function**: `updateEventMultiple(recordId, updatesObject)` in `src/services/airtable/events.ts`
- **Called via**: `eventStore.setFields(eventId, patch)` → `eventStore.updateEvent` → `updateEventMultiple`

### Payload Shape
- **Input**: `Record<string, unknown>` where keys are **Airtable field IDs** and values are the raw values
- **Example**: `{ "fldjgqDUxVxaJ7Y9V": 150, "fldtCOxi4Axjfjt0V": "Grand Ballroom" }`
- **API**: `PATCH https://api.airtable.com/v0/{baseId}/{eventsTableId}` with body:
  ```json
  { "records": [{ "id": "<recordId>", "fields": { "<fieldId>": <value>, ... } }] }
  ```

### Transformations Before Send
1. **Whitelist**: Only field IDs in `SAVE_WHITELIST` or `additionalAllowedFieldIds` are sent. All others are dropped.
2. **dateTime fields**: DISPATCH_TIME, VENUE_ARRIVAL_TIME, FOODWERX_ARRIVAL — if value is number (seconds since midnight), it is converted to ISO datetime using EVENT_DATE.
3. **Single-select**: Some fields expect plain string (option name). The app sends strings directly; Airtable accepts `"Yes"` or `{ "name": "Yes" }` depending on base config. Current code sends plain strings for most.
4. **Linked records**: Send as `["recXXX", "recYYY"]` — array of record IDs (strings).
5. **Checkbox**: Send `true` or `false`.

### No Transform
- Strings, numbers, long text → sent as-is
- Arrays of record IDs → sent as-is

---

## 5. How Data Is Loaded from Airtable

### API Call
- **Function**: `loadEvent(recordId)` in `src/services/airtable/events.ts`
- **Request**: `GET https://api.airtable.com/v0/{baseId}/{eventsTableId}/{recordId}?returnFieldsByFieldId=true&cellFormat=json`
- **No `fields[]`** → Airtable returns **all fields** for the record

### State Injection
- **Store**: Zustand `eventStore` — `selectedEventData` holds `Record<string, unknown>` keyed by field ID
- **Flow**: `selectEvent(id)` → `loadEventData()` → `fetchEventById(id)` → `loadEvent(id)` → `set({ selectedEventData: result.fields })`
- **Alias**: FOODWERX_ARRIVAL is resolved at runtime; the resolved field's value is copied into `fields[FIELD_IDS.FOODWERX_ARRIVAL]` for UI consumption

### Value Formatting (Reading)
- **Linked records**: Airtable returns `["recXXX", "recYYY"]` or `[{ id: "recXXX" }, ...]`. The app uses `asLinkedRecordIds()` to normalize to `string[]`.
- **Single-select**: Airtable may return `"Yes"` or `{ name: "Yes" }`. The app uses `asSingleSelectName()` to get the string.
- **Strings**: `asString()` for text fields
- **Numbers**: Used directly (Guest Count, seconds)
- **Checkbox**: `asBoolean()`

---

## 6. Required Sections for Event Completion

The app does **not** enforce required fields for "completion." The BeoIntakeActionBar has:
- **Update Event** — saves all dirty fields
- **Ready for Spec** — sets a spec-ready flag
- **Print / View BEO** — saves then navigates to BEO print
- **Delete Event**

There is no client-side validation that blocks save or print. For a Dropbox parser, the following are typically needed for a usable BEO:

### Minimum for a Complete Event
- **Event Core**: EVENT_DATE, EVENT_TYPE, GUEST_COUNT, EVENT_START_TIME, EVENT_END_TIME (or at least DISPATCH_TIME)
- **Client**: CLIENT_FIRST_NAME, CLIENT_LAST_NAME (or BUSINESS_NAME for delivery), CLIENT_PHONE or PRIMARY_CONTACT_PHONE
- **Venue**: VENUE, VENUE_ADDRESS (or full address fields)
- **Menu**: At least one of PASSED_APPETIZERS, PRESENTED_APPETIZERS, BUFFET_METAL, BUFFET_CHINA, DESSERTS (or custom equivalents) — or for delivery: DELIVERY_DELI, DELIVERY_HOT

### Recommended
- PRIMARY_CONTACT_NAME, PRIMARY_CONTACT_PHONE
- BEO_TIMELINE
- DIETARY_NOTES, SPECIAL_NOTES
- SERVICE_STYLE, EVENT_OCCASION

---

## 7. Menu Items: Linked Table vs Raw Strings

### The UI Expects BOTH

1. **Linked records (Menu Items table)**
   - Fields: PASSED_APPETIZERS, PRESENTED_APPETIZERS, BUFFET_METAL, BUFFET_CHINA, DESSERTS, ROOM_TEMP_DISPLAY, DISPLAYS, DELIVERY_DELI, STATIONS
   - **Value**: Array of record IDs from the **Menu Items** table (`tbl0aN33DGG6R1sPZ`)
   - **To populate**: Either create/link existing Menu Item records and pass their IDs, or use custom fields

2. **Custom long text (raw strings)**
   - Fields: CUSTOM_PASSED_APP, CUSTOM_PRESENTED_APP, CUSTOM_BUFFET_METAL, CUSTOM_BUFFET_CHINA, CUSTOM_DESSERTS, CUSTOM_DELIVERY_DELI, CUSTOM_ROOM_TEMP_DISPLAY
   - **Value**: Plain string (long text) — freeform, e.g. "Custom item 1\nCustom item 2"
   - **To populate**: Dropbox parser can write directly. No need for Menu Items table.

### Dropbox Parser Strategy
- **Option A**: Match item names to Menu Items table, create records if needed, link IDs → best for consistency and spec engine
- **Option B**: Put everything in custom fields as raw text → simpler, works for display and print
- **Option C**: Hybrid — known items as linked records, unknowns in custom text

---

## 8. Serviceware / Plates / Cutlery / Glassware Format

Stored as long text. Line format:
```
• Item Name (Supplier) – Qty
• Another Item (Client) – Provided by host
```

- Each line starts with `•` (optional; parser strips it)
- Pattern: `(Supplier)` and optional `– Qty` or `– Provided by host`
- Parsed by `parseLines()` in ServicewareSection and DeliveryPaperProductsSection

---

## 9. Summary Table for DaddyGPT — Dropbox → Airtable Mapping

| Dropbox Source / Concept | Airtable Field ID | Data Type | Example Value |
|--------------------------|-------------------|-----------|---------------|
| Event date | fldFYaE7hI27R3PsX | string | "2025-06-15" |
| Event type | fldtqnvD7M8xbc0Xb | single-select | "Full Service" or "Delivery" |
| Occasion | fldVBvZ2m6zQ5xd2D | single-select | "Wedding" |
| Service style | fldqnW1ulcchcQ05t | single-select | "Buffet" |
| Guest count | fldjgqDUxVxaJ7Y9V | number | 150 |
| Client first name | fldFAspB1ds9Yn0Kl | string | "Jane" |
| Client last name | fldeciZmsIY3c2T1v | string | "Doe" |
| Business name | fldm6SwoGe6pS7Uam | string | "Acme Corp" |
| Client email | fldT5lcdCL5ndh84D | string | "jane@example.com" |
| Client phone | fldnw1VGIi3oXM4g3 | string | "555-1234" |
| Primary contact name | fldmsFPsl2gAtiSCD | string | "John Smith" |
| Primary contact phone | fld4OK9zVwr16qMIt | string | "555-5678" |
| Venue name | fldtCOxi4Axjfjt0V | string | "Grand Ballroom" |
| Venue address | fldJsajSl1l6marzw | string | "123 Main St" |
| Venue city | fldNToCnV799eggiD | string | "Philadelphia" |
| Venue state | fldxCz5cPLwCetb0C | string | "PA" |
| Venue zip | fldWehIaLQd5sHDts | string | "19103" |
| Passed appetizers (linked) | fldpprTRRFNydiV1m | string[] | ["recXXX","recYYY"] |
| Custom passed apps | fldDbT9eLZUoJUnmS | string | "Item 1\nItem 2" |
| Presented appetizers (linked) | fldwku49gGffnnAOV | string[] | ["recXXX"] |
| Custom presented apps | fldsIaND0Bp3ByW1c | string | "..." |
| Buffet metal (linked) | fldgi4mL7kyhpQzsy | string[] | ["recXXX"] |
| Custom buffet metal | fldm1qYJE55QVjYsd | string | "..." |
| Buffet china (linked) | fldtpY6zR1KCag3mI | string[] | ["recXXX"] |
| Custom buffet china | fldtquSPyLWUEYX6P | string | "..." |
| Desserts (linked) | flddPGfYJQxixWRq9 | string[] | ["recXXX"] |
| Custom desserts | fld95NEZsIfHpVvAk | string | "..." |
| Delivery deli (linked) | fldKRlrDNIJjxg9jn | string[] | ["recXXX"] |
| BEO timeline | fld6Z6xw9ciygqyff | string | "6:00 PM – Cocktails\n7:00 PM – Dinner" |
| Dietary notes | fldhGj51bQQWLJSX0 | string | "Nut allergies" |
| Special notes | fldlTlYgvPTIUzzMn | string | "..." |
| Dispatch time | fldbbHmaWqOBNUlJP | dateTime | "2025-06-15T14:00:00.000Z" |
| Event start | fldDwDE87M9kFAIDn | number | 68400 (7:00 PM = 19*3600) |
| Event end | fld7xeCnV751pxmWz | number | 75600 (9:00 PM) |
| Plates list | fldpKcEoqYiHypHD3 | string | "• Small Plates (FoodWerx Standard) – 300\n• Large Plates (FoodWerx Standard) – 150" |
| Cutlery list | fld0bZAToUEOodhA2 | string | "• Forks (FoodWerx Standard) – 150" |
| Glassware list | fldNrnnkggmvbOGSU | string | "• Large Cups (FoodWerx Standard) – 150" |
| Load-in notes | fldc75GFDDO1vv5rK | string | "..." |
| Kitchen on site | fldSpUlS9qEQ5ly6T | single-select | "Yes" or "No" or "None" |

---

## 10. Important Notes for Parser

1. **Field IDs are required** — Use the IDs above. Field names are not used for writes.
2. **Single-select values** must match Airtable option names exactly (e.g. "Full Service", "Buffet").
3. **Linked records** = array of record IDs. Create Menu Item records first if using linked fields.
4. **Custom fields** accept any string — use for items not in Menu Items table.
5. **Time fields**: Dispatch/Venue Arrival = ISO datetime; Event Start/End = seconds since midnight.
6. **Do not write to formula fields** — e.g. EVENT_NAME, VENUE_PRINT, CLIENT_ADDRESS_PRINT.
7. **Stations** require creating records in the Stations table and linking via STATIONS field.
