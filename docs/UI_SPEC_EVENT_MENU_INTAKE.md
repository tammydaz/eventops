# Event Menu Intake — UI Form (Speed First → Precision Second)

**Rules:** Click → see result immediately. User only thinks when customizing. No changes to app code; this is the target UI shape.

---

## SCREEN 1 — EVENT MENU PAGE (MAIN INTAKE)

**Layout: top to bottom**

```
┌─────────────────────────────────────────────────────────────────┐
│  EVENT HEADER                                                    │
│  (event name, date, venue, etc.)                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐
│  + Add Item     │ │  + Add Station   │ │  + Add Boxed Lunch      │
└─────────────────┘ └─────────────────┘ └─────────────────────────┘

───────────────────────────────────────────────────────────────────
  PASSED APPS
───────────────────────────────────────────────────────────────────
  (list of lines)

───────────────────────────────────────────────────────────────────
  PRESENTED APPS
───────────────────────────────────────────────────────────────────
  (list)

───────────────────────────────────────────────────────────────────
  DELI
───────────────────────────────────────────────────────────────────
  (list)

───────────────────────────────────────────────────────────────────
  BUFFET – METAL
───────────────────────────────────────────────────────────────────
  (list)

───────────────────────────────────────────────────────────────────
  BUFFET – CHINA
───────────────────────────────────────────────────────────────────
  (list)

───────────────────────────────────────────────────────────────────
  DESSERTS
───────────────────────────────────────────────────────────────────
  (list)
```

---

## STEP 1 — ADD ITEM (FAST PATH)

**User clicks:** `+ Add Item`  
**Modal opens:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Add Item                                                    [×] │
├─────────────────────────────────────────────────────────────────┤
│  [ Passed ] [ Presented ] [ Buffet ] [ Deli ] [ Dessert ]        │  ← Category tabs (section filter)
│                                                                  │
│  [ 🔍 Search...                                              ]   │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Filtered items (only for selected section)               │  │
│  │  • Buffalo Chicken Meatballs                              │  │
│  │  • Swedish Meatballs                                       │  │
│  │  • ...                                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**User clicks an item (e.g. Buffalo Chicken Meatballs)**  
→ **IMMEDIATE RESULT:** that line appears in the correct section. **No confirmation modal, no extra questions.**

---

## STEP 2 — DEFAULT STATE (CRITICAL)

**After add, the line looks like this only:**

```
  Buffalo Chicken Meatballs
  [ Customize ]   [ Remove ]
```

**Nothing else shown:** no sauces, no specs, no components. User sees result; no thinking required.

---

## STEP 3 — CUSTOMIZE (ONLY IF NEEDED)

**User clicks:** `Customize`  
**Expands INLINE (not a modal):**

```
  Buffalo Chicken Meatballs

  Sauce:
  (Default ▼)   [ Change Sauce ]

  Components:
  • Meatballs
  • Buffalo Sauce
  • Garnish
  [ Remove toggle per item ]

  [ + Add Component ]

  Spec:
  (Auto-filled)   [ Override ]

  [ Done ]
```

Collapsed again after **Done** → back to one line with a “modified” hint:

```
  Buffalo Chicken Meatballs (Modified)
  [ Customize ]   [ Remove ]
```

---

## STEP 4 — SAUCE LOGIC (LOCK THIS)

**User clicks:** `Change Sauce`  
**Dropdown shows ONLY:**

```
  Buffalo
  BBQ
  Honey Garlic
  Other...
```

**Source:** Allowed Sauces (Menu Items) for that item — **not** full menu.

---

## STEP 5 — ADD COMPONENT

**User clicks:** `+ Add Component`  
**Dropdown shows ONLY allowed components, e.g.:**

```
  Blue Cheese Crumbles
  Scallions
  Celery
```

---

## STEP 6 — REMOVE COMPONENT

**User toggles:** e.g. `Buffalo Sauce` → ❌ removed  

**Back-end:** Event Menu Components → `Is Removed = true` for that component.

---

## STEP 8 — STATIONS (DIFFERENT FLOW)

**User clicks:** `+ Add Station`  
**Modal:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Add Station                                                 [×] │
├─────────────────────────────────────────────────────────────────┤
│  [ Station Type ]                                                │
│                                                                  │
│  • Viva La Pasta                                                 │
│  • Taco Bar                                                      │
│  • Slider Station                                                │
└─────────────────────────────────────────────────────────────────┘
```

**User selects:** e.g. **Viva La Pasta**  
→ **AUTO BUILDS LINE:**

```
  Viva La Pasta Station
  • Pasta
  • Marinara
  • Alfredo
  • Vodka
  • Parmesan
  • Garlic Bread
  [ Customize ]
```

**Customize** works like items, but **multiple sauces allowed** for this line.

---

## STEP 9 — BOXED LUNCH (STRICT FLOW)

**User clicks:** `+ Add Boxed Lunch`  
**Modal = FORM (not item picker):**

```
┌─────────────────────────────────────────────────────────────────┐
│  Add Boxed Lunch                                             [×] │
├─────────────────────────────────────────────────────────────────┤
│  Box Type:     [ Sandwich Box ▼ ]                                │
│  Pick 1:       [ Turkey | Ham | Veggie ]                         │
│  Pick 2:       [ Chips | Salad | Fruit | Other ]                 │
│  If Other:     [ ________________________ ]                      │
│  Vegan Swap:   [ dropdown ]                                      │
│  Special:      [ text ]                                          │
│  Quantity:     [ 12 ]                                            │
│                                                                  │
│  [ Add ]                                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Output line (read-only summary):**

```
  Sandwich Box
  • Turkey
  • Chips
  • Vegan Swap: Veggie
  • Notes: No mayo
  Qty: 12
```

**No** component editing, **no** sauce logic for boxed lunch.

---

## STEP 10 — REORDERING

**In list:** Drag-and-drop **or** ↑ / ↓ buttons per line.  
**Back-end:** Updates **Sort Order**.

---

## STEP 11 — REMOVE ITEM

**User clicks:** `Remove`  
→ Deletes the Event Menu row (and related Event Menu Components as needed).

---

## STEP 12 — BEO OUTPUT (WHAT THIS PRODUCES)

**Clean, structured, no paragraphs:**

```
  Buffalo Chicken Meatballs
    - Meatballs
    - BBQ Sauce
    - Scallions

  Viva La Pasta Station
    - Pasta
    - Marinara
    - Vodka Sauce
    - Parmesan

  Sandwich Box
    - Turkey
    - Chips
    - Vegan Swap: Veggie
```

---

## TROUBLESHOOTING — "No items yet" after adding

If **EVENT MENU (FROM SHADOW TABLE)** stays empty after you pick items:

1. **Use the table ID (no spaces)**  
   In Airtable, open the base → **Event Menu (SHADOW SYSTEM)** table. The table ID is in the URL or in the API docs (starts with `tbl`).  
   In your project `.env` add:
   ```bash
   VITE_AIRTABLE_EVENT_MENU_SHADOW_TABLE=tblYourActualTableId
   ```
   Restart the dev server so the env is picked up.

2. **Check the browser console (F12 → Console)**  
   When you click an item you should see:
   - `[Event Menu] handlePickerAdd` with `selectedEventId`, `targetField`, `itemId`
   - Either `[Event Menu] create succeeded, refreshing list` or an error message.  
   When the page loads you should see:
   - `[Event Menu] loadShadowMenu: loaded N rows for event ...`  
   If you see `loadShadowMenu: no rows or error` then the **read** is failing (wrong table, wrong base, or formula). If create fails you’ll get an alert and a console error.

3. **Restart the API proxy**  
   If you run a local proxy for Airtable, restart it so path encoding for table names with spaces is applied.

4. **Confirm table and fields**  
   The **Event Menu (SHADOW SYSTEM)** table must have at least: **Event** (link to Events), **Section**, **Catalog Item** (link to Menu Items), **Sort Order**, **Line Type**, **Mode**. Field names must match exactly.

5. **Section field must accept the values we send**  
   Go to **Airtable → Event Menu (SHADOW SYSTEM)** → click the **Section** field header → field options.  
   Do **one** of these:
   - **Option A (fastest / safest):** Turn **ON** “Allow new options”. Done.
   - **Option B (cleaner):** Manually add this exact option: **presentedApps** (and any other section values your app sends, e.g. Passed Appetizers, Presented Appetizers, Buffet – Metal, Buffet – China, Desserts, Deli, Room Temp).

---

## WHAT YOU MUST NOT DO

- Do **not** show all fields upfront.
- Do **not** allow free typing everywhere.
- Do **not** let users build items from scratch.
- Do **not** mix boxed lunch with item/component logic.
- Do **not** show full menu in dropdowns (only Allowed Sauces / Allowed Components per item).

---

*Doc reflects the flow you specified; no app code changed.*
