# Airtable Save Fix – Computed Fields Blocklist

Use this to fix the "field is computed" 422 errors when saving events.

---

## 1. Strict save whitelist (nuclear option)

Replace the save logic so we **only** send fields from an explicit whitelist. Add this to `src/services/airtable/events.ts`:

```typescript
// STRICT WHITELIST: Only these field IDs are ever sent to Airtable PATCH.
// Add any new field ID here after confirming it is NOT a formula/rollup/lookup.
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
]);
```

Then in `updateEventMultiple`, change the filter to use `SAVE_WHITELIST` instead of `EDITABLE_FIELD_IDS`:

```typescript
for (const [key, value] of Object.entries(updatesObject)) {
  if (!SAVE_WHITELIST.has(key)) {
    blockedFields.push(key);
    continue;
  }
  // ... rest of loop
}
```

And in `filterToEditableOnly`:

```typescript
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
```

---

## 2. Blocklist (computed fields – never send)

These field IDs are known to be computed:

```
fldZuHc9D29Wcj60h   EVENT_NAME
fld4YxQOjzPyyBIHL   CLIENT_BUSINESS_NAME
fldOKQTp8Zf6a462f   VENUE_FULL_ADDRESS
flddestyZNoX9sKGE   EVENT_LOCATION_FINAL_PRINT
fldJsajSl1l6marzw   PRINT_VENUE_ADDRESS
fldN2W8ITqFotKUF4   CAPTAIN
fldvw5CWBUc7fRQlW   Total Staff Count
fldTB3YI8QDoc6SFr   Total Rental Cost
fldU6abOKs9ZEpeb2   Total Rental Cost (rollup)
fld6MiOYE49IFgY71   Kitchen Flag
fldt1L664TcVKyCra   Expediting Flag
flduN9rV1Hm8uJTSc   Captain Flag
flduvl7yt3kqf7FIO   Print_Allergies
fld8vx9rXXYQ1hHN5   TEST
fldMYjGf8dQPNiY4Y   Client Name Autofill - LEGACY
fldLyuDJTQ6bXQY3X   LINENS_OVERLAYS
fldMzNI4UGTkg9r0u   PARKING_ACCESS (packout formula)
fldqC8ojaYB5RJiWM   PRINT_EVENT_HEADER
fld0W6FZxATCOa8oP   ALLERGIES_PRINT
fldN3z0LgsiM8eE5C   DIETARY_SUMMARY
```

---

## 3. Finding more computed fields

Airtable returns 422 with `"field is computed"` and the field name. Use that name to:

1. Open Airtable base → table → field settings.
2. Copy the field ID.
3. Add it to the blocklist or remove it from the whitelist.
