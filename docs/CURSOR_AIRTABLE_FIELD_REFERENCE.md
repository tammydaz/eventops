# Cursor App — Airtable Field Reference

What the app reads from Airtable and how it filters. Use this to align your Airtable setup.

---

## 1. Fields Cursor Reads from Airtable

### Menu Items Table (`tbl0aN33DGG6R1sPZ`)

| Field Name | Field ID | Used For |
|------------|----------|----------|
| **Description Name/Formula** | fldQ83gpgOmMxNMQw | Display name in pickers (primary/name field) |
| **Item Name** | fldW5gfSlHRTl01v1 | Fallback name (some code paths) |
| **Category** | fldM7lWvjH8S0YNSX | Filtering which picker shows each item |
| **Child Items** | fldIu6qmlUwAEn2W9 | Sauces, toppings that auto-populate with parent |
| **Parent Item** | fldBzB941q8TDeqm3 | Reverse link (child → parent) |
| **Station Type** | fldBSOxpjxcVnIYhK | Filtering items by station (e.g., "Pasta Station") |
| **Service Type** | fld2EhDP5GRalZJzQ | Spec engine / alternate filtering |
| **Allergen Icons** | fldUSr1QgzP4nv9vs | Dietary tags |
| **Vessel Type** | fldZCnfKzWijIDaeV | Buffet Metal vs China |
| **Section** | fldwl2KIn0xOW1TR3 | Alternate section grouping |

### Station Presets Table (`Station Presets` or `VITE_AIRTABLE_STATION_PRESETS_TABLE`)

| Field Name | Used For |
|------------|----------|
| **Preset Name** (or `VITE_AIRTABLE_STATION_PRESETS_NAME_FIELD`) | Lookup key — must match Station Type exactly |
| **Line 1 Defaults** | Linked Menu Item IDs — main/default items |
| **Line 2 Defaults** | Linked Menu Item IDs — secondary items |
| **Individual Defaults** | Linked Menu Item IDs — extra components |

### Stations Table (`tblhFwUfREbpfFXhv`)

| Field Name | Field ID | Used For |
|------------|----------|----------|
| Station Type | fldQ1bGDg8jhJvqmJ | Single-select; options drive preset lookup |
| Event | fldoOaZsMyXiSNKTc | Link to Events |
| Station Items | fldRo8xgmoIR2yecn | Linked Menu Item IDs |
| Additional Components | fldEsD59DRXA2HjGa | Linked Menu Item IDs |
| Station Notes | fldCf9uvjWQdtJkZs | Notes |
| Last Autopopulate | fldq0re2ySITrbZEq | Date |

### Events Table (Menu section fields)

| Field Name | Used For |
|------------|----------|
| Passed Appetizers | fldpprTRRFNydiV1m |
| Custom Passed App | fldDbT9eLZUoJUnmS |
| Presented Appetizers | fldwku49gGffnnAOV |
| Custom Presented App | fldsIaND0Bp3ByW1c |
| Buffet Metal | (from FIELD_IDS) |
| Buffet China | (from FIELD_IDS) |
| Desserts | (from FIELD_IDS) |
| Stations | (from FIELD_IDS) |

---

## 2. Exact Categories Cursor Filters for Each Picker

From `src/constants/menuCategories.ts` — **Category** must match one of these strings exactly.

| Picker Section | Category Values (exact match) |
|----------------|-------------------------------|
| **Passed Appetizers** | `Passed App` |
| **Presented Appetizers** | `Presented App`, `Presented App/metal`, `Presented App/china` |
| **Buffet - Metal** | `Buffet Metal`, `Buffet`, `Buffet Item`, `Side`, `Vegetable (Side)`, `Starch (Side)`, `Pasta (Side)` |
| **Buffet - China** | `Buffet China`, `Salad`, `Bread`, `Side`, `Vegetable (Side)` |
| **Desserts** | `Dessert`, `Dessert/Metal`, `Dessert/China` |
| **Stations** | `Station`, `Stations`, `Station Item` |
| **Dressing** | `Dressing` |
| **Deli** | `Deli/Sandwhiches`, `Deli/Breads`, `Deli/Sandwiches`, `Deli`, `Sandwich`, `Wrap` |
| **Room Temp Display** | `Room Temp Display`, `Display`, `Buffet China` |
| **Displays** | `Display`, `Buffet China` |

**Note:** `stations` picker filters for `Station` only. Your Airtable may use `Stations` or `Station Item` — the app would need a code change to include those.

---

## 3. Station Preset Names Cursor Will Load

Presets are loaded by **name** — the value must match the **Station Type** the user selects.

### Source of Station Type options

1. **Primary:** Fetched from Airtable Stations table (Station Type field single-select options).
2. **Fallback:** `src/constants/stations.ts` — `STATION_TYPE_OPTIONS`:

| Fallback Station Types |
|------------------------|
| Pasta Station |
| Carving Station |
| Taco Station |
| Kids Station |
| Dessert Station |
| Action Station |
| Grazing Display / Interactive Station |
| Other |

### Preset lookup

When a user picks a Station Type (e.g., `"Carving Station"`), the app calls `loadStationPreset("Carving Station")` and looks for a Station Presets record where:

- **Preset Name** (or env-configured name field) = `"Carving Station"`

So the **Preset Name** in Station Presets must match the **Station Type** value exactly.

### Preset names to create (from your menu)

Create Station Presets with these **Preset Name** values so they load correctly:

**Cocktail Displays**
- Vegetable (or full display name)
- Spreads & Breads
- Grande Charcuterie Display
- Pasta Flight Presentation

**Cocktail Displays Section 3**
- Farmers' Market Fruit
- Cravin' Asian

**Cocktail Boosts**
- BarWerx Appetizer Sampler
- The Philly Jawn
- Iced Raw Bar

**Creation Stations**
- Viva La Pasta
- Tex-Mex
- Make Your Own Ramen Noodle Bar
- All-American
- Street Food Station
- Carving Station
- Hi Bachi Station
- Chicken & Waffle Station

**Important:** These names must also exist as options in the **Stations** table **Station Type** field (or be added to the app’s station type list) so they appear in the dropdown. Otherwise users cannot select them.

---

## 4. Env Overrides

| Env Variable | Purpose |
|--------------|---------|
| `VITE_AIRTABLE_STATION_PRESETS_TABLE` | Station Presets table name/ID |
| `VITE_AIRTABLE_STATION_PRESETS_NAME_FIELD` | Field used for preset lookup (default: `Preset Name`) |

---

## 5. Quick Reference

| What | Where | Exact Value |
|------|-------|-------------|
| Passed apps | Menu Items.Category | `Passed App` |
| Presented apps | Menu Items.Category | `Presented App` |
| Station items | Menu Items.Category | `Station` |
| Display items | Menu Items.Category | `Display` or `Buffet China` |
| Preset lookup | Station Presets.Preset Name | Must match Station Type exactly |
| Child items | Menu Items.Child Items | Linked record IDs |
