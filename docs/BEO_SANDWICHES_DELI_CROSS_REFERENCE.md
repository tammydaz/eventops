# BEO Sandwiches / Deli: Cross-Reference (UI Picker ↔ Saved Data ↔ Output BEO)

This doc cross-references how sandwiches/deli are handled for **full-service**, **delivery**, and **pick up** against saved BEO samples and the app’s UI and print logic.

---

## 1. Where sandwiches appear on the BEO

**They are not listed under Passed App, Presented App, or Buffet.** In every analyzed BEO, sandwiches/deli have their **own section**:

| Service type   | Section on BEO            | In saved BEO samples |
|----------------|---------------------------|----------------------|
| **Delivery**   | **DELI - DISPOSABLE**     | Yes. "DELI - DISPOSABLE" (or "DELI - ") with rows like "3 \| Honey Ham & Brie", "18 \| Honey Stung Chicken", group headers like "Gourmet Signature Sandwiches" then sub-items. |
| **Pick up**    | **DELI - DISPOSABLE**     | Same as delivery. |
| **Full service** | **DELI - CHINA/METAL** (or "DELI") | Yes in samples (e.g. BEO_RAW_DUMP lines 1544, 1596). The app does **not** yet have a full-service Deli section. |

So the service team knows **where** and **what vessel** from the section title:
- **DELI - DISPOSABLE** → deli/sandwich station, disposable vessels (delivery/pick).
- **DELI - CHINA/METAL** → deli/sandwich station, china or metal (full-service).

**When** to serve is not in the section name: delivery time is in the header (e.g. "11-11:45am DELIVERY"); for full-service, timeline rows elsewhere on the BEO (e.g. "2:30PM", "3PM") give sequence. The DELI section only groups the items and vessel; it does not duplicate Passed App / Presented App / Buffet.

---

## 2. How the UI picker works (delivery / pick only)

- **Location:** BEO Intake → Menu section. When event type is Delivery or Pick Up, the **DELI - DISPOSABLE** block shows:
  - **Sandwiches & Wraps:** list of selected items + **"+ Add Deli Item"** (opens menu picker with `categoryKey: "deli"`).
  - **"+ Add Sandwich Platter"** (SandwichPlatterConfigModal → platter types, stored in localStorage by event).
  - **"+ Add Boxed Lunches"** (Boxed Lunch Orders in Airtable, linked to event).
  - **Custom field:** free text for sandwich/wrap names (saved to `CUSTOM_DELIVERY_DELI` if the field exists in Airtable).
- **Picker:** `openPicker("deli", "deliveryDeli", "Select Deli Items (Sandwiches & Wraps)")` → `fetchMenuItemsByCategory("deli")` → Airtable Menu Items where **Category** is in `CATEGORY_MAP.deli`: `Deli/Sandwhiches`, `Deli/Breads`, `Deli/Sandwiches`, **`Deli`**.
- **Save:** Selections are written to:
  - **DELIVERY_DELI** (field id `fldKRlrDNIJjxg9jn`): linked record IDs (Menu Items).
  - **CUSTOM_DELIVERY_DELI** (currently `fldCustomDeliTODO` — placeholder; replace with real Long Text field ID when created): one line per custom item, optional "Name – Notes" format.

So the **option is saved** as linked Menu Item IDs in **DELIVERY_DELI**; custom lines in **CUSTOM_DELIVERY_DELI** (once wired); platters in localStorage; boxed lunches from Boxed Lunch Orders table.

---

## 3. How the output BEO is built (delivery / pick)

**Kitchen BEO** (`KitchenBEOPrintPage.tsx`):

- Section title: **"DELI - DISPOSABLE"** (from `DELIVERY_MENU_SECTION_CONFIG`).
- Rows come from:
  1. **DELIVERY_DELI** linked records → for each record ID, load Menu Item **Item Name** (fldW5gfSlHRTl01v1) and **Child Items**; `expandItemToRows` builds one row with **parent name** and **child names** as sub-items (indented lines).
  2. **CUSTOM_DELIVERY_DELI** → `customTextToItems()` splits by newline/comma/semicolon; "Item – Notes" becomes name + one sub-item.
  3. **Boxed lunch orders** (for this event) → merged into DELI: "Boxed Lunch" or box type name, qty/spec from order.
  4. **Platter orders** (from localStorage by event) → platter type name, qty × picks.

**Server BEO** (`BeoPrintPage.tsx`):

- Same section title **"DELI - DISPOSABLE"** for delivery/pick.
- Same sources: `DELIVERY_DELI`, custom text, boxed lunches, platters. Uses `parseMenuItems` and menu item names from the same Menu Items table; layout and pagination differ but the **content** (names, specs, quantities) is the same idea.

**Name on the BEO:** For linked Menu Items, the print uses the **Item Name** field (fldW5gfSlHRTl01v1), not the "Description Name" formula. So whatever is in **Item Name** in Airtable is what appears as the main line on the BEO; child items are the linked **Child Items** record names (also Item Name). If you want the longer client-facing line (e.g. "Charcuterie Sandwich - Honey-Goat Cheese Spread, Fig Jam...") on the BEO, that would need to come from a formula field (e.g. Print Line or Description Name) and a code change to use that field for print.

---

## 4. Alignment with saved BEO samples

| Sample pattern | App behavior |
|----------------|--------------|
| Section header "DELI - DISPOSABLE" | Yes. Same title. |
| Section header "DELI - " (no vessel) | App always appends " - DISPOSABLE" for delivery. |
| Rows as "qty \| name" with optional sub-lines | Yes. Parent name + child items as sub-items; custom and platter/boxed use qty/name. |
| Group header + sub-items (e.g. "Petite Cut Gourmet Sandwiches" then list) | Supported when the Menu Item has **Child Items**: parent = header, children = sub-lines. |
| "DELI - CHINA/METAL" (full-service) | Not in app. Full-service has no Deli section. |

So for **delivery and pick**, the option is saved as intended (linked records + custom + platter + boxed), and the output format matches the usual BEO pattern (section + qty | name + sub-items). The only structural gap is **full-service Deli** (no section in app).

---

## 5. Recommendations

1. **Full-service Deli:** If full-service events need a "Deli" or "Sandwiches" section (e.g. DELI - CHINA/METAL), add a full-service section config and a corresponding Airtable field (e.g. "Deli" or "Sandwiches" linked to Menu Items) plus UI in the non-delivery menu section.
2. **Custom Deli field:** Replace `CUSTOM_DELIVERY_DELI: "fldCustomDeliTODO"` with the real Long Text field ID once the field exists in Airtable, so custom sandwich lines are saved and appear on the BEO.
3. **Name on BEO:** If you want the printed line to match the longer client description, consider fetching and using the **Print Line** or **Description Name** formula for the main line instead of (or in addition to) Item Name, and document the choice in this file.

---

## 6. Making it easy to pick (same result as BEOs)

The app was updated so users can get the same result as the analyzed BEOs:

1. **DELI section helper text**  
   Under "Sandwiches & Wraps" (delivery/pick): short line explaining to add individual items from the menu or use **Sandwich Platter** for preset groups so the BEO prints like existing BEOs.

2. **Platter output on Kitchen BEO**  
   Platter orders now render as **header + sub-items** (like "Petite Cut Gourmet Sandwiches" with choices underneath): one row with platter name and quantity, then one sub-line per pick. Same structure as the samples.

3. **BEO-style platter type names**  
   In `src/config/sandwichPlatterConfig.ts`:
   - **"foodwerx Classic Sandwiches - Topped w/ Sliced Roma Tomato & Green Leaf Lettuce"** — same options as Classic Sandwiches; matches legacy BEO wording.
   - **"Petite Cut Gourmet Sandwiches"** — options aligned with the sample (Charcuterie Sandwich, Smoked Turkey, Savory & Sweet Flank Steak, etc.); prints as on the BEO.

4. **Deli picker hint**  
   When the Deli picker opens, a line under the title says: "These appear under **DELI - DISPOSABLE** on the BEO. Use Sandwich Platter for grouped options."

**User flow:** For individual sandwiches/wraps → "+ Add Deli Item" and pick from the menu (search works). For grouped platters that match the BEO → "+ Add Sandwich Platter", choose a platter type (e.g. Petite Cut Gourmet Sandwiches or foodwerx Classic Sandwiches), pick selections and quantity; the BEO will show the platter name with choices listed underneath.

---

## 7. File reference

| What | Where |
|------|--------|
| Deli picker (UI) | `src/components/beo-intake/MenuSection.tsx` — delivery block, `deliveryDeli`, `openPicker("deli", "deliveryDeli", ...)` |
| Category allowlist for deli | `src/constants/menuCategories.ts` — `CATEGORY_MAP.deli` |
| Save to Airtable | `FIELD_IDS.DELIVERY_DELI`, `FIELD_IDS.CUSTOM_DELIVERY_DELI` in `src/services/airtable/events.ts` |
| Kitchen BEO DELI section | `KitchenBEOPrintPage.tsx` — `DELIVERY_MENU_SECTION_CONFIG`, `buildSectionsFromEvent(isDelivery)`, boxed lunch + platter merge |
| Server BEO DELI section | `BeoPrintPage.tsx` — `DELIVERY_SECTION_CONFIG`, `menuSections` for delivery, boxed lunch + platter merge |
| Menu item name for print | Kitchen BEO fetches **Item Name** (fldW5gfSlHRTl01v1) and Child Items; `expandItemToRows` in `KitchenBEOPrintPage.tsx` |
| Saved BEO samples | `docs/BEO_RAW_DUMP.txt`, `docs/beo_sample_list.txt`, `docs/beo_file_list.txt` |
