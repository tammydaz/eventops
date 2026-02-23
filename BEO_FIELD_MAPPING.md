# BEO Field Mapping Reference

## Overview
This document maps all field IDs used in the BEO (Banquet Event Order) system between the Airtable Events table and Menu Items table.

All field ID constants are centralized in **`src/config/beoFieldIds.ts`** and **`src/services/airtable/events.ts`**.

---

## Airtable Table IDs

| Table | ID |
|---|---|
| Events | `VITE_AIRTABLE_EVENTS_TABLE` (env var) |
| Menu Items | `tbl0aN33DGG6R1sPZ` |

---

## Events Table — BEO Header Fields

| Constant | Field ID | Type | Notes |
|---|---|---|---|
| `BEO_EVENTS.JOB_NUMBER` | `fldZuHc9D29Wcj60h` | Formula | READ ONLY – event display name used as job # |
| `BEO_EVENTS.CLIENT_DISPLAY` | `fldFAspB1ds9Yn0Kl` | Single line | Client first name |
| `BEO_EVENTS.CLIENT_LAST_NAME` | `fldeciZmsIY3c2T1v` | Single line | Client last name |
| `BEO_EVENTS.CLIENT_PHONE` | `fldnw1VGIi3oXM4g3` | Phone | |
| `BEO_EVENTS.VENUE_NAME` | `fldK8j9JRu0VYCFV9` | Single line | Venue name |
| `BEO_EVENTS.EVENT_LOCATION` | `fldJsajSl1l6marzw` | Single line | Event address |
| `BEO_EVENTS.VENUE_FULL_ADDRESS` | `fldOKQTp8Zf6a462f` | Formula | READ ONLY – VenuePrint formula |
| `BEO_EVENTS.VENUE_CITY` | `fldNToCnV799eggiD` | Single line | Venue city |
| `BEO_EVENTS.EVENT_DATE` | `fldFYaE7hI27R3PsX` | Date | |
| `BEO_EVENTS.GUEST_COUNT` | `fldjgqDUxVxaJ7Y9V` | Number | |
| `BEO_EVENTS.EVENT_START_TIME` | `fldDwDE87M9kFAIDn` | Text | |
| `BEO_EVENTS.EVENT_END_TIME` | `fld7xeCnV751pxmWz` | Text | |
| `BEO_EVENTS.EVENT_ARRIVAL_TIME` | `fldMYjGf8dQPNiY4Y` | Text | FoodWerx arrival |
| `BEO_EVENTS.DISPATCH_TIME` | `fldbbHmaWqOBNUlJP` | Text | |
| `BEO_EVENTS.SERVICE_STYLE` | `fldO8D4thzfEmQwzv` | Single select | |
| `BEO_EVENTS.DIETARY_NOTES` | `fldhGj51bQQWLJSX0` | Long text | Triggers allergy banner |
| `BEO_EVENTS.SPECIAL_NOTES` | `fldlTlYgvPTIUzzMn` | Long text | |

---

## Events Table — Menu Selection Fields

| Constant | Field ID | Links To | Section |
|---|---|---|---|
| `BEO_MENU_FIELDS.PASSED_APPETIZERS` | `fldpprTRRFNydiV1m` | Menu Items | Passed Apps |
| `BEO_MENU_FIELDS.PRESENTED_APPETIZERS` | `fldwku49gGffnnAOV` | Menu Items | Presented Apps |
| `BEO_MENU_FIELDS.BUFFET_METAL` | `fldgi4mL7kyhpQzsy` | Menu Items | Buffet – Metal |
| `BEO_MENU_FIELDS.BUFFET_CHINA` | `fldtpY6zR1KCag3mI` | Menu Items | Buffet – China |
| `BEO_MENU_FIELDS.DESSERTS` | `flddPGfYJQxixWRq9` | Menu Items | Desserts |
| `BEO_MENU_FIELDS.BEVERAGES` | `fldRb454yd3EQhcbo` | Menu Items | Beverages |

### Custom Free-Text Fields (per section)

| Constant | Field ID |
|---|---|
| `BEO_MENU_FIELDS.CUSTOM_PASSED_APP` | `fldDbT9eLZUoJUnmS` |
| `BEO_MENU_FIELDS.CUSTOM_PRESENTED_APP` | `fldsIaND0Bp3ByW1c` |
| `BEO_MENU_FIELDS.CUSTOM_BUFFET_METAL` | `fldm1qYJE55QVjYsd` |
| `BEO_MENU_FIELDS.CUSTOM_BUFFET_CHINA` | `fldtquSPyLWUEYX6P` |
| `BEO_MENU_FIELDS.CUSTOM_DESSERTS` | `fld95NEZsIfHpVvAk` |

---

## Menu Items Table — Display & Spec Fields

| Constant | Field ID | Type | Notes |
|---|---|---|---|
| `BEO_MENU_ITEM_FIELDS.DISPLAY_NAME` | `fldQ83gpgOmMxNMQw` | Formula | READ ONLY – primary display name |
| `BEO_MENU_ITEM_FIELDS.SERVICE_TYPE` | `fld2EhDP5GRalZJzQ` | Single select | Used for picker filtering |
| `BEO_MENU_ITEM_FIELDS.VESSEL_TYPE` | `fldZCnfKzWijIDaeV` | Single select | Metal vs China for buffet |
| `BEO_MENU_ITEM_FIELDS.SECTION` | `fldSection` | Single select | Passed Apps, Presented Apps, etc. |
| `BEO_MENU_ITEM_FIELDS.PRINT_SPEC_LINE` | `fldRgW3KjM6Z9y7Bc` | Formula | READ ONLY – auto-calculated spec |
| `BEO_MENU_ITEM_FIELDS.QTY_NICK_SPEC` | `fldTfI1ioj7D7EPqI` | Single line | Manual quantity override |
| `BEO_MENU_ITEM_FIELDS.PAN_TYPE_NICK_SPEC` | `fldT3IZ9AQRrxAxwp` | Single select | Manual pan type override |
| `BEO_MENU_ITEM_FIELDS.SERVING_VESSEL_NICK_SPEC` | `fldZ2zRh6ShjGq6nK` | Single select | Manual vessel override |
| `BEO_MENU_ITEM_FIELDS.NOTES_NICK` | `fldb5DLnr89VMOwmY` | Long text | Prep notes |
| `BEO_MENU_ITEM_FIELDS.ALLERGEN_ICONS` | `fldUSr1QgzP4nv9vs` | Multiple select | 🌾🌱🦐🥛🥚🥜🐷🧀 |
| `BEO_MENU_ITEM_FIELDS.IS_SAUCE` | `fldLUONoixU3VLfQb` | Single select | "Yes" = sauce |
| `BEO_MENU_ITEM_FIELDS.STAND_ALONE_SAUCE` | `fldjcjafusageAI8W` | Checkbox | If true: not indented under parent |
| `BEO_MENU_ITEM_FIELDS.KITCHEN_TASKS` | `fldSa6PbZ8fIA3YXq` | Long text | Prep task notes |
| `BEO_MENU_ITEM_FIELDS.PARENT_ITEM` | `fldParentItem` | Linked record | Self-referential – parent for child items |

---

## Section → Service Type Filter Mapping

The MenuSection picker uses the `SERVICE_TYPE` field on Menu Items to filter by category.

| Section | Service Type Values |
|---|---|
| Passed Appetizers | `Passed App` |
| Presented Appetizers | `Room Temp Display`, `Presented App` |
| Buffet – Metal | `Buffet – Hot`, `Buffet` |
| Buffet – China | `Buffet – Cold`, `Buffet` |
| Desserts | `Dessert` |
| Beverages | `Beverage` |

---

## Data Flow

```
User selects item in MenuSection picker
      ↓
Selection saved to Events table linked record field
      ↓
BeoPrintPage.fetchBeoData(eventId)
      ↓
Load Event record → extract MenuSelectionIds
      ↓
fetchMenuItemsForEvent(allIds) → fetch parent MenuItem records
      ↓
fetchChildItems(parentIds) → fetch child items (sauces / components)
      ↓
Attach children to parents → build tree
      ↓
Render sections in sacred order
```

---

## Rules

- **NEVER** use raw field ID strings — always use constants from `beoFieldIds.ts` or `FIELD_IDS`
- **NEVER** write to formula/READ ONLY fields
- `EVENT_NAME`, `CLIENT_BUSINESS_NAME`, `VENUE_FULL_ADDRESS`, `PRINT_SPEC_LINE`, `DISPLAY_NAME` are all formulas
- Stand-alone sauces (`STAND_ALONE_SAUCE = true`) should NOT be indented under their parent
