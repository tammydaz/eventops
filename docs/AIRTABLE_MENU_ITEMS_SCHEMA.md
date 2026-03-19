# Airtable Menu Items & Food/Drink Schema (saved for Cursor/developers)

Reference for Menu Items table, picker filtering, and parent/child rendering. Use this when fixing menu pickers or adding new categories.

---

## 1. Menu Items Table (tbl0aN33DGG6R1sPZ)

**Purpose:** Central catalog for all food and beverage items, parent/child relationships, and operational metadata.

### Key Fields

| Field | ID | Type | Purpose |
|-------|-----|------|---------|
| Item Name | fldW5gfSlHRTl01v1 | Single line text | Display name |
| Category | fldM7lWvjH8S0YNSX | Single select | Grouping (Appetizer, Entrée, Dessert, Beverage, Bar/Beverage Component, etc.) |
| Menu Category | fldPdKsDzE82qVhT5 | Single select | **Used for filtering/picking in UI** (e.g., Dessert, Beverage, Sauce, Station Component, Sandwich) |
| Section | fldwl2KIn0xOW1TR3 | Single select | Further grouping for UI pickers (e.g., Desserts, Appetizers, Presented Apps) |
| Parent Item | fldBzB941q8TDeqm3 | Linked record (self-link) | Parent of this item (e.g. child "Sliced Oranges" → parent "Mimosa Bar") |
| Child Items | fldIu6qmlUwAEn2W9 | Linked record (self-link) | Children of this item |
| Description/Client Facing | fldtN2hxy9TS559Rm | Long text | Client-facing copy |
| Photo | fldkH1xblF2gKHuHM | Attachment | UI images |
| Service Type | fld2EhDP5GRalZJzQ | Single select | Operational grouping (Passed App, Buffet, Beverage) |
| Vessel Type | fldZCnfKzWijIDaeV | Single select | Kitchen/pack-out |
| Allergen Icons | fldUSr1QgzP4nv9vs | Multiple select | Dietary display |
| Print Line | fld3yFasXPIoo6MO3 | Formula | Formatted print output |
| Auto Spec Line | flde49Dsoent8UCjx | Formula | Kitchen print |
| Menu Item Specs | fldZnoSeoS5lK69qP | Linked → Menu Item Specs | Spec lines |

### Parent/Child

- **Parent Item** and **Child Items** are inverse: parent has Child Items populated; children have Parent Item populated.
- UI should show parents as expandable; children nested underneath.
- Filter by **Category**, **Menu Category**, or **Section** as appropriate so items appear in the right picker.

---

## 2. Bar Components Table (tblzV4q0lQgF3ryxu)

- Component Name, Component Type (Mixer, Garnish, Other), Spec/Print Line, Pack-Out Category, Unit Type.
- Events link via Mixer Items / Garnish Items.

---

## 3. Station Components Table (tblQuBGWfASBz5zfe)

- Component Name, Component Type, Menu Item (linked), Station (linked), Active/Inactive, Print Notes.

---

## 4. Station Presets Table (tbl6HdKHF8f9OEadE)

- Station Type, Line 1/2 Defaults (Menu Items), Default Components, Available Options.

---

## 5. Stations Table (tblhFwUfREbpfFXhv)

- Station Items (Menu Items), Station Components, Custom/Added/Removed Components.

---

## 6. Menu Item Specs Table (tblGeCmzJscnocs1T)

- Menu Item, Spec Override/Final/Default, Print Line.

---

## Picker / concept mapping (from your workspace)

| Concept | Table(s) | Key fields for UI | Notes |
|---------|----------|--------------------|--------|
| Sandwiches | Menu Items | Category = Deli/Sandwiches, Menu Category = Sandwich, Child Items | Nest children |
| Creation Stations | Menu Items, Station Presets, Station Components, Stations | Category = Stations, Child Items, Presets | Nest components |
| Boxed Lunches | Menu Items, Boxed Lunch Orders, Boxed Lunch Order Items, Box Customizations | Category/Menu Category for boxed lunch, Child Items | Nest children/customizations |
| Mezze Display (example) | Menu Items | Category: Station Item, Section: Presented Apps, Menu Category: Station | Must include Station / Presented Apps in picker filters |
| Desserts / Mimosa Bar | Menu Items | Category or Menu Category = Dessert, Section = Desserts, Child Items | Parent "Mimosa Bar" with fruit children |

---

## UI rendering guidance

- **Pickers:** Filter by **Category**, **Menu Category**, or **Section** as appropriate (not all pickers may use the same field).
- **Parents:** Query items where Parent Item is empty for top-level list.
- **Children:** For each parent, use Child Items (or query where Parent Item = parent id) and render nested.
- If items don’t show: check that the picker’s filter includes the **exact** Category / Menu Category / Section values used in Airtable (e.g. "Station Item", "Presented Apps", "Station").

---

## Why some menu items don’t show in the UI (analysis)

### How the app filters today

- **Menu pickers** (Passed Apps, Presented Apps, Buffet Metal, Buffet China, Deli, Room Temp, Desserts) use **`fetchMenuItemsByCategory(categoryKey)`** in `src/services/airtable/menuItems.ts`.
- That function filters **only by the Menu Items field `Category`** (fldM7lWvjH8S0YNSX). It builds a formula: `OR(FIND("Category1", {Category}), FIND("Category2", {Category}), ...)` using the strings in `CATEGORY_MAP` in `src/constants/menuCategories.ts`.
- **Menu Category** (fldPdKsDzE82qVhT5) and **Section** (fldwl2KIn0xOW1TR3) are **not** used by the app. So if an item appears in a picker in Airtable by Section or Menu Category but has a different **Category** value, it will not show in that picker in the UI.

### What is missing and why

| Item / case | Airtable (example) | Picker | Why it doesn’t show |
|-------------|--------------------|--------|----------------------|
| **Mezze Display** | Category: **Station Item**, Section: Presented Apps, Menu Category: Station | Presented Appetizers | `CATEGORY_MAP.presented` only has: Passed App, Presented App, Appetizer, Passed, App. It does **not** include **"Station Item"** or **"Station"**, so any item with Category = "Station Item" is excluded from the Presented Apps picker. |
| Other **station-type items** that should appear under Presented Apps | Category: Station Item (or Station), Section: Presented Apps | Presented Appetizers | Same as above: Category value not in the allowed list for that picker. |
| Items meant for **Desserts** but Category ≠ Dessert | e.g. Category: "Display", Menu Category: "Dessert" | Desserts | App only filters by **Category**; "Display" is not in `desserts` list. |
| Items in **Section** but different **Category** | Any item whose Section matches a picker but Category doesn’t | That picker | Section is never used in the filter; only Category is. |

### Summary

- **Root cause:** The app uses **only the `Category`** field and the allowlists in **`CATEGORY_MAP`**. If an item’s **Category** in Airtable is not in the right `CATEGORY_MAP` entry for that picker, the item will not show.
- **Fix (minimal):** Add the missing **Category** values that exist in Airtable to the right keys in `CATEGORY_MAP` (e.g. add **"Station Item"** and **"Station"** to **presented** so Mezze Display and similar items show in Presented Appetizers).
- **Fix (full):** Optionally extend the app to filter by **Menu Category** and/or **Section** as well (and align with your schema), so items show when they match by any of those fields.

### Cross-reference: Airtable vs UI (what’s still missing)

A script **`scripts/crossReferenceMenuItemsWithUI.js`** compares `menu-items-export.json` (from `node scripts/exportMenuItemsForAnalysis.js`) to **CATEGORY_MAP**. Run it after re-exporting to refresh the list.

**Last run (609 records):**

| Status | Count |
|--------|--------|
| Category in at least one UI picker | 497 |
| Category **not** in any picker (missing from UI) | 112 |

**Categories in Airtable that were NOT in any picker:**

| Category | Item count | Notes / fix |
|----------|------------|-------------|
| **Deli** | 52 | **Fixed.** Added `"Deli"` to `CATEGORY_MAP.deli` so these show in the Deli picker (wraps, sandwiches, etc.). |
| **Component** | 55 | Toppings, dressings, sauces (e.g. Caesar Dressing, Marinara, Hot Fudge). Often used as **child items** of parents; may not need to appear as top-level picks. If they should appear somewhere, add `"Component"` to the right picker key(s) in `menuCategories.ts`. |
| **Sauce** | 4 | Provolone Sauce, Sunday Gravy, Sour Cream, Ginger Sesame Dip. Same as Component—add to a picker if they should be selectable at top level. |
| **Description** | 1 | "Item Name – Notes" (likely a notes/junk record). Can leave unmapped or reassign in Airtable. |

So after adding **Deli**: **52 items** now show in the UI. **59 items** (Component + Sauce + Description) remain missing unless you add those categories to a picker or keep them as child-only.

### Changes made in code

- **Presented Appetizers:** `CATEGORY_MAP.presented` includes **"Station Item"** and **"Station"** so items like Mezze Display show. See `src/constants/menuCategories.ts`.
- **Deli:** `CATEGORY_MAP.deli` includes **"Deli"** so 52 sandwich/wrap items show in the Deli picker.
