# Proposal: Event Menu System — 3 Layers (UI ↔ Airtable)

**Goal:** Start structured (prebuilt stations, platters, boxed lunches) but allow **controlled chaos** — every line editable (change sauce, remove/swap/add component, add custom item). **BEO output is king:** Item → children → clean lines. No blobs, no paragraphs. **Dropdowns context-aware:** e.g. Sauce shows only sauces for that item. You need **3 layers** (Menu Items + Event Menu + Event Menu Components).

---

## 0. The System You Actually Need (3 Layers)

| Layer | Table / concept | Role |
|-------|-----------------|------|
| **Layer 1** | **Menu Items** (master library) | Defines Item → Child Items + **Allowed Variations**: **Allowed Components** and **Allowed Sauces**. This is what **controls dropdowns** (no full menu list, no random junk). |
| **Layer 2** | **Event Menu** | Each row = one line on the BEO. **Resolved Components** per line: when user selects e.g. Charcuterie Board, system auto-loads default components from catalog; user can then remove/swap/add via Layer 3. |
| **Layer 3** | **Event Menu Components** (new table) | Per-line mutations: which components are removed, added, or have sauce overridden. Without this you cannot cleanly modify boxed lunches, charcuterie, vegan swaps, or chef sauces. |

**Why one row is not enough:** Storing "Meatballs w/ no sauce but add vegan sauce and remove cheese" in a single row becomes unreadable. The correct model:

- **Event Menu Line** (Meatballs)
  - **Components:** Sunday Gravy (removed), Vegan Tomato Sauce (added)

So: **Item → children (from Event Menu Components) → clean lines** on the BEO.

### 0.1 Layer 1 — Menu Items (Master Library)

You already have Menu Items. **Add** the following so dropdowns are context-aware:

| Concept | Meaning | Example |
|--------|--------|--------|
| **Allowed Sauces** | For this catalog item, which sauces can be chosen (sauce override / swap). | Meatballs → Sunday Gravy, Vodka Sauce, BBQ Sauce. |
| **Allowed Components** | For this catalog item, which components can be added/removed/swapped. | Charcuterie → Prosciutto, Soppressata, Cheddar, Brie, Olives, Crostini. |

This is what **controls dropdowns**: when user clicks "Change sauce" → only **allowed sauces for that item** show; when user clicks "Add component" → only **allowed components for that item** show. No full menu list, no unrelated items.

### 0.2 Layer 3 — Event Menu Components (New Table)

This is the missing piece. Each row = one component tied to one Event Menu line, with mutation flags.

| Field | Type | Meaning |
|-------|------|--------|
| **Event Menu Line** | Linked record → Event Menu | Parent line on the BEO. |
| **Component Item** | Linked record → Menu Items | The component (sauce, meat, cheese, etc.). |
| **Is Removed** | Checkbox | Component was default but user removed it. |
| **Is Added** | Checkbox | User added this component (not in default set). |
| **Override Sauce** | Single select or link | Optional; when this component is a sauce swap. |

BEO output: for each Event Menu line, resolve children from Event Menu Components (exclude Is Removed; include defaults + Is Added; apply Override Sauce where present). Print **Item → children → clean lines**.

### 0.3 UI Behavior

1. **When user clicks an item (e.g. Charcuterie Board):**
   - **Step 1 — Autofill:** Load default components from catalog (Menu Items Child Items / allowed set).
   - **Step 2 — Editable list:** Show list with: toggle remove, change sauce (dropdown), add component (button + dropdown).
2. **Dropdown behavior:**
   - **"Change sauce"** → show only **Allowed Sauces** for that catalog item.
   - **"Add component"** → show only **Allowed Components** for that catalog item.
3. **Mutations** are written to **Event Menu Components** (Is Removed, Is Added, Override Sauce), so BEO stays clean and line-based.

---

## 1. Current Pain

| Issue | Today |
|-------|--------|
| **Many fields per event** | Events has 6+ linked fields (PASSED_APPETIZERS, PRESENTED_APPETIZERS, BUFFET_METAL, BUFFET_CHINA, DESSERTS, FULL_SERVICE_DELI, DELIVERY_DELI, …) plus 6+ custom long-text fields. |
| **Section = field name** | Adding a section means a new Events field + code everywhere. |
| **Order is implicit** | BEO order is hardcoded in app (Passed → Presented → DELI → Metal → China → Desserts). Airtable doesn't store order within a section. |
| **Custom vs catalog mixed** | Custom lines live in separate long-text fields; app merges at read time. |
| **Overrides are local** | Spec override, sauce override, pack-out edits are localStorage; no single "line" record to attach them to. |
| **Platters outside Airtable** | Platter orders are localStorage; not first-class lines. |

---

## 2. Target: Event Menu (Layer 2) + Event Menu Components (Layer 3)

**Idea:** **Event Menu** — one table where **each row = one line on the event menu** (one item in one section). Events has one link to Event Menu. **Resolved Components** per line: defaults from catalog (Layer 1); user mutations (remove/swap/add/sauce override) in **Event Menu Components** (Layer 3). BEO prints Item → children as clean lines.

### 2.1 Table: **Event Menu** (or "Event Menu Lines")

| Field | Type | Purpose |
|-------|------|---------|
| **Event** | Linked record → Events | Which event this line belongs to. |
| **Section** | Single select | BEO section this line appears under. Drives intake grouping and print order. |
| **Sort Order** | Number | Order within section (1, 2, 3…). Enables "move up/down" and stable BEO order. |
| **Line Type** | Single select | `Catalog` \| `Custom` \| `Platter` \| `Boxed Lunch` |
| **Catalog Item** | Linked record → Menu Items | When Line Type = Catalog; optional otherwise. |
| **Display Name** | Single line text (or formula) | For Catalog: rollup/lookup from Menu Items. For Custom: user types here. For Platter: from platter config or text. Lets BEO read "name" without joining every time. |
| **Custom Text** | Long text | When Line Type = Custom (or "notes" for catalog lines). Replaces CUSTOM_PASSED_APP etc. |
| **Platter Type** | Single select or link | When Line Type = Platter (e.g. "Classic Sandwiches", "Signature Wrap Platter"). Options from your platter config. |
| **Platter Selections** | Long text or JSON | Which sandwich/wrap options chosen (if you want this in Airtable). |
| **Spec Override** | Long text | Per-line spec (replaces localStorage keyed by section:itemId:rowIdx). |
| **Sauce Override** | Single select | Default \| None \| Other. |
| **Sauce Custom** | Single line | When Sauce Override = Other. |
| **Pack-Out Notes** | Long text | Per-line pack-out (replaces pack-out edits in localStorage). |
| **Loaded** | Checkbox | Kitchen check-off (optional; or keep local). |
| **Vegan Swap / Swap To** | Linked record → Menu Items (or single line text) | Per-line substitution (e.g. vegan option). Fully editable. |
| **Breakdown / Components** | Long text or from Layer 3 | Charcuterie (and similar): can be editable long text **or** resolved from Event Menu Components (Layer 3). BEO prints as sub-lines. |
| **Chef Sauces** | Long text | Multiple sauces per line (e.g. Viva La Pasta, Chicken & Waffle). One per line or comma-separated; editable. |

**Resolved Components:** For items with allowed components (Layer 1), the system auto-loads defaults and stores user changes (remove/add/sauce override) in **Event Menu Components**. BEO resolves each line's children from that table → clean lines.

**Boxed lunch customization** (when Line Type = Boxed Lunch, or keep separate Boxed Lunch Orders table — see below):

| Field | Type | Purpose |
|-------|------|---------|
| **Boxed Lunch Type** | Linked → Menu Items | Which box type (same as today). |
| **Quantity** | Number | Per line. |
| **Pick 1** | Single line or Single select | First customization (e.g. sandwich choice). |
| **Pick 2** | Single line or Single select | Second customization. |
| **Pick 2 Other** | Single line | When Pick 2 = "Other". |
| **Vegan Swap** | Linked → Menu Items | Swap to vegan option; same as Box Customizations.swappedItem. |
| **Special Requests** | Long text | Free-form; same as Box Customizations.specialRequests. |

All of these are **editable** so intake and BEO both read/write the same source. For "clean BEO output," one Event Menu row (or one Boxed Lunch Order Item + Box Customization) = one printed line with customization text (Pick 1 \| Pick 2, vegan swap, special requests) under it.

**Section options (Single select)** — aligned with BEO and intake:

- Passed Appetizers  
- Presented Appetizers  
- Deli  
- Buffet – Metal  
- Buffet – China  
- Desserts  
- Room Temp / Display  
- (Optional later: Station – Viva La Pasta, etc., if you want stations as lines.)

**Print order** is defined once (e.g. in app config): list of Section values in the order they appear on the BEO. Records are filtered by Event and sorted by (Section order, Sort Order).

---

## 3. Events Table Change

- **Remove (or stop using):**  
  PASSED_APPETIZERS, CUSTOM_PASSED_APP, PRESENTED_APPETIZERS, CUSTOM_PRESENTED_APP, BUFFET_METAL, CUSTOM_BUFFET_METAL, BUFFET_CHINA, CUSTOM_BUFFET_CHINA, DESSERTS, CUSTOM_DESSERTS, FULL_SERVICE_DELI, CUSTOM_FULL_SERVICE_DELI, DELIVERY_DELI, CUSTOM_DELIVERY_DELI, ROOM_TEMP_DISPLAY, CUSTOM_ROOM_TEMP_DISPLAY, DELIVERY_HOT, etc.
- **Add one:**  
  **Event Menu** (Linked record → Event Menu table).  
  All "menu lines" for the event are rows in Event Menu with `Event = this record`.

---

## 4. How the UI Would Use It

### Intake

1. **Load event** → load **Event Menu** where Event = eventId.  
2. **Group by Section** (using your fixed BEO section order). Within each section, sort by Sort Order.  
3. **Display:** One block per section; each block lists lines (Display Name + optional Custom Text, spec/sauce/pack-out if you show them in intake).  
4. **Add catalog item:** Picker still uses **Menu Items** (filtered by category for that section). On "Add": create **Event Menu** row with Event, Section, Line Type = Catalog, Catalog Item = chosen record, Sort Order = next number. Optionally set Display Name from lookup or leave as formula.  
5. **Add custom line:** Create row with Line Type = Custom, Section, Custom Text, Sort Order.  
6. **Add platter:** Create row with Line Type = Platter, Section = Deli, Platter Type, Platter Selections; Display Name from platter type or formula.  
7. **Reorder:** Update Sort Order on two rows (swap or renumber).  
8. **Remove:** Delete Event Menu row.  
9. **Spec / sauce / pack-out:** Edit Spec Override, Sauce Override, Sauce Custom, Pack-Out Notes on that row. No more localStorage for these.
10. **Component mutations:** When user edits components (remove/swap/add/sauce), read/write **Event Menu Components** for that Event Menu line; dropdowns filtered by Layer 1 (Allowed Sauces / Allowed Components) for the line's Catalog Item.

### BEO (and Kitchen BEO)

1. **Load event** → load **Event Menu** where Event = eventId.  
2. **For each line with components:** load **Event Menu Components** where Event Menu Line = that row; resolve children (defaults − Is Removed + Is Added; apply Override Sauce).  
3. **Sort** by (Section order, Sort Order).  
4. **Print:** One section header per Section value; under each, one line per row.  
   - **Name:** Display Name (or Custom Text for custom lines).  
   - **Children:** From Event Menu Components (or Breakdown long text if not using Layer 3 for that line).  
   - **Spec:** Spec Override if present, else from Spec Engine / catalog.  
   - **Sauce:** Sauce Override + Sauce Custom.  
   - **Pack-out:** Pack-Out Notes.  
   - **Loaded:** Checkbox if you store it here.

No more merging multiple Events fields and custom text in code; no more section-specific field IDs. Same API shape for both full-service and delivery; delivery is just a different **set of Section values** (e.g. HOT - DISPOSABLE, DELI - DISPOSABLE, …) or the same sections with different labels.

---

## 5. Menu Items Table (Layer 1) — Add Allowed Variations

- **Keep** Menu Items as the catalog: Item Name, Child Items, Category, Section, Vessel Type, etc.  
- **Add (required for context-aware dropdowns):**
  - **Allowed Sauces** — linked records or multi-select of Menu Items (or a Sauces table). For this item, only these sauces appear in "Change sauce."
  - **Allowed Components** — linked records or multi-select of Menu Items. For this item, only these components appear in "Add component."
- **Use it for:** Picker options (filter by Category/Section), Display Name lookup, Spec Engine input, **and** filtering sauce/component dropdowns per line (Layer 1 drives Layer 2/3 UI).  
- Events only links to **Event Menu**. Event Menu links to Menu Items (Catalog Item). Event Menu Components links to Event Menu + Menu Items.

---

## 6. Optional: Delivery vs Full-Service Sections

- **Option A:** Same Section options for both; app decides which sections to show or print based on Event Type (e.g. hide "Buffet – Metal" for delivery, or map to "HOT - DISPOSABLE").  
- **Option B:** Two sets of Section options (e.g. "Full-Service Sections" vs "Delivery Sections") and a field on Event or Event Menu: "Service Type" so you filter sections by event type.  
- **Simplest:** One list of sections; BEO print order and section labels are configurable in app (e.g. for delivery, "Buffet – Metal" prints under "HOT - DISPOSABLE"). No second table.

---

## 7. What This Buys You

| Before | After |
|--------|--------|
| 12+ Events fields for menu | 1 Events field: Event Menu (link) |
| Section = field name in code | Section = value in data; add section = add option, no new field |
| Order implicit in app | Order explicit (Sort Order + section order) |
| Spec/sauce/pack-out in localStorage | Spec/sauce/pack-out on the line (Airtable) |
| Platters in localStorage | Platters as Line Type = Platter with Platter Type (+ optional Selections) |
| Custom text in separate Events fields | Custom text in Event Menu.Custom Text per line |
| Different code paths for full-service vs delivery | Same "Event Menu" table; only section set or labels differ |
| One-row "garbage" for component changes | Event Menu Components (Layer 3): remove/add/sauce override per component, clean BEO |
| Dropdowns = full menu or unrelated | Dropdowns = Allowed Sauces / Allowed Components for that item (Layer 1) |

---

## 8. Your Requirements — Explicit Coverage

These are designed in so the new table and UI support them end-to-end.

| Requirement | How it's covered |
|-------------|------------------|
| **✔ Boxed lunch customization** | Either (a) **Event Menu** line type = Boxed Lunch with Pick 1, Pick 2, Pick 2 Other, Vegan Swap (link to Menu Items), Special Requests, Quantity — all on the same row and editable — or (b) keep **Boxed Lunch Orders + Box Customizations** and ensure every customization field is editable (swappedItem, specialRequests, and in create flow: pick1, pick2, pick2Other). BEO reads one place; intake writes the same. Option (a) gives one table for "all menu lines" including boxed lunch. |
| **✔ Charcuterie breakdown** | **Breakdown / Components** (long text) on Event Menu **or** resolved from **Event Menu Components** (Layer 3). One line per component. Intake: editable list (filtered by Allowed Components for that item). BEO: print as sub-lines under the parent item. |
| **✔ Vegan swaps** | **Vegan Swap / Swap To** on Event Menu: link to Menu Items (or single line text). Per line, editable. BEO prints "Swap: [name]" or similar when present. Works for catalog lines and boxed lunch (same field or Box Customizations.swappedItem). |
| **✔ Chef custom sauces** | **Sauce Override** (Default / None / Other) + **Sauce Custom** (single line) per line, plus **Chef Sauces** (long text) for multi-sauce lines (Viva La Pasta, Chicken & Waffle). All editable. **Event Menu Components** can store per-component sauce overrides. BEO prints from these fields so output is clean and consistent. |
| **✔ Clean BEO output** | One Event Menu row = one logical BEO line (or one parent + sub-lines from Event Menu Components / Breakdown / Chef Sauces). No merging of 6+ Events fields in code. Display Name, Spec Override, Sauce, Pack-Out, children (from Layer 3), customizations all on the row or one lookup. Print order = Section order + Sort Order. |
| **✔ Fast intake** | **Single query:** load all Event Menu rows where Event = eventId. Group by Section in memory; sort by Sort Order. **Single-record updates:** add = create one row; edit = PATCH one row; reorder = PATCH Sort Order on two rows. No loading many linked fields + custom text from Events. Inline edit wherever possible (spec, sauce, breakdown, customizations) without opening modals. **Context-aware dropdowns** (Allowed Sauces / Allowed Components) keep choices small and relevant. |
| **✔ Everything (just about) editable** | Every line-level attribute is a writable field: Section, Sort Order, Line Type, Catalog Item, Display Name (if not formula), Custom Text, Platter Type, Platter Selections, Spec Override, Sauce Override, Sauce Custom, Chef Sauces, Pack-Out Notes, Loaded, Vegan Swap, Breakdown, and for boxed lunch: Pick 1, Pick 2, Pick 2 Other, Vegan Swap, Special Requests, Quantity. **Event Menu Components** stores remove/add/sauce override per component. Only **formula/rollup** from catalog (e.g. Display Name from Menu Items when Line Type = Catalog) is read-only. Everything else is editable so intake and BEO stay in sync. |

---

## 9. Migration sketch

1. Create **Event Menu** table and **Event Menu** link field on Events.  
2. Create **Event Menu Components** table (Event Menu Line, Component Item, Is Removed, Is Added, Override Sauce).  
3. **Menu Items:** Add **Allowed Sauces** and **Allowed Components** (linked or multi-select to Menu Items or dedicated tables).  
4. **One-time script:** For each event, read existing linked + custom fields (PASSED_APPETIZERS, CUSTOM_PASSED_APP, …), create Event Menu rows (Section, Catalog Item or Custom Text, Sort Order). Link Event Menu to Event.  
5. **App:** Switch intake and BEO to read/write Event Menu (+ Event Menu Components for component mutations) instead of the old fields.  
6. **Later:** Remove or hide old Events menu fields; optionally move platter options into Airtable (single select or separate Platter Types table).

---

## 10. Minimal "First Version" of Event Menu

If you want the smallest useful step:

- **Event** (link to Events)  
- **Section** (single select: Passed Appetizers, Presented Appetizers, Deli, Buffet Metal, Buffet China, Desserts, Room Temp)  
- **Sort Order** (number)  
- **Catalog Item** (link to Menu Items) — optional  
- **Custom Text** (long text) — optional  

Rule: each row has either Catalog Item or Custom Text (or both); Display Name can be a formula (IF Catalog Item, lookup name; else Custom Text). Omit platter/spec/sauce/pack-out in v1 and add them once the single-table flow is in place. **Layer 3 (Event Menu Components)** and **Layer 1 (Allowed Sauces / Allowed Components)** can be added in a second phase once the single Event Menu table is live.

---

This structure gives you **three layers** (Menu Items with allowed variations → Event Menu lines → Event Menu Components for mutations) so the app can talk to Airtable in one consistent way, with context-aware dropdowns and clean BEO output (Item → children → clean lines).
