# Airtable Station Schema — Required Fixes for Omni

The EventOps app needs these Airtable schema changes to work correctly with Creation Stations.

---

## 1. Stations Table (tblhFwUfREbpfFXhv)

### ADD: Station Preset(s)
- **Field name:** `Station Preset` or `Station Presets`
- **Type:** Linked record → Station Presets table
- **Purpose:** Links a station to its preset (e.g. Viva La Pasta, Tex-Mex). Required for preset-based stations.

### ADD: BEO Placement
- **Field name:** `BEO Placement` (or `Placement` or `BEO Section`)
- **Type:** Single select
- **Options (exactly):**
  - `Presented Appetizer Metal/China`
  - `Buffet Metal/China`
- **Purpose:** Determines where the station appears on the BEO print.

### ADD (if loadStationsByEventId returns empty): Event Record ID lookup
- **Field name:** `Event Record ID` (or similar)
- **Type:** Lookup or formula
- **Purpose:** The app queries Stations where Event = eventId. Airtable formulas cannot filter linked records by record ID directly. If the app gets no stations, add a lookup: in Events table create formula `RECORD_ID()`, then in Stations create lookup from Event that pulls that formula. Filter by `FIND('recXXX', {Event Record ID}) > 0`.

### Already correct
- Station Type ✓
- Event ✓
- Station Items ✓
- Station Notes ✓
- Station Components ✓
- Additional Components (used as Custom Items) ✓

---

## 2. Events Table

### OPTIONAL: Stations field (Events.Stations)
- **Field name:** `Stations` or `Creation Stations`
- **Type:** Linked record → Stations table
- **Purpose:** Airtable may auto-populate this when stations are created with `Event` linked. The app **does not require** this field. Stations are loaded by querying `Stations` where `Event` = event ID. Keeping stations separate from events is the preferred architecture.

**Action:** No action required. If the field exists, Airtable may maintain it for bidirectional linking. The app does not read or write it.

---

## 3. Station Presets Table (tbl6HdKHF8f9OEadE)

### Already correct
- Name field: `Station Type` ✓ (app looks for Preset Name, Name, or Station Type)

### ADD: Missing presets
Ensure these presets exist (exact or similar names; app matches by substring):

| Preset Name |
|-------------|
| Viva La Pasta |
| Tex-Mex |
| Make Your Own Ramen Noodle Bar |
| All-American |
| Street Food Station |
| Iced Raw Bar |
| Carving Station |
| Hibachi Station |
| Chicken & Waffle Station |
| Late Night Bites |
| Vegetable (or Marinated Grilled Seasonal Vegetables) |
| Spreads & Breads |
| Grande Charcuterie Display |
| Pasta Flight Presentation |
| Farmers' Market Fruit |
| Fisherman's Corner |
| Barwerx Appetizer Sampler |
| The Philly Jawn |

---

## 4. Station Components Table (tblQuBGWfASBz5zfe)

### Already correct
- Component Name ✓
- Component Type ✓
- Station Presets (link) ✓

### ADD: Missing Viva La Pasta components (if not present)
- **Topping:** Mozzarella Cheese, Cheddar Cheese
- **Starch:** Cheese Tortellini (if different from Tortellini)

---

## App Fallbacks (Already Implemented)

If BEO Placement or Station Preset fields are missing, the app will:

1. **BEO Placement:** Store in the Additional Components (Custom Items) field as `BEO Placement: Presented Appetizer Metal/China` or `BEO Placement: Buffet Metal/China` and parse it when loading.
2. **Station Preset:** Resolve the preset by matching Station Type to the preset name when the link is missing.

These fallbacks allow the app to work before schema changes are complete, but adding the proper fields is recommended for cleaner data and reporting.
