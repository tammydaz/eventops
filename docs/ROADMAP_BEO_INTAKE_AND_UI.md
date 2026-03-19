# Roadmap: BEO Like Old BEOs + Simple UI + Everything Editable (Full Intake, Delivery, Pickup)

**Goal:**  
(1) **All menu items and options** render on the BEO like the old BEOs (main line + indented children, sections, DELI, etc.).  
(2) **UI** is a simple flow, easy to understand.  
(3) **Everything** in the full BEO intake (and delivery/pickup) can be **added, modified, and deleted** so you can print a **completed BEO with correct information**.

This doc is your “where do I go from here.” It breaks the work into tracks, orders them, and points to existing docs so you’re not reinventing.

---

## North star (in one sentence)

**Every piece of data that should appear on the BEO lives in Airtable, is editable in the intake UI (add/modify/delete), and prints in the same format as the old BEOs — for full service, delivery, and pickup.**

---

## Workstreams (what needs to happen)

### Track A: Data in Airtable (shared, not localStorage)

**Why first:** So home + office see the same data. Nothing “only on one computer.”

| Item | Current | Target | Doc / code |
|------|--------|--------|------------|
| Platter orders | localStorage | Platter Orders table (or field) in Airtable | `AIRTABLE_FULL_SERVICE_DELI_AND_PLATTERS.md`, `platterOrdersStore.ts` |
| Full-service DELI items | No field | Events: “DELI (Full Service)” linked to Menu Items + optional Custom DELI Long Text | Same doc |
| Custom Delivery DELI | Placeholder ID | Real Long Text field on Events; replace placeholder in code | `events.ts` PLACEHOLDER_FIELD_IDS |
| Sauce overrides | localStorage | Airtable (e.g. per-event overrides or Menu Item Specs) if you want them shared | `LOCALSTORAGE_AND_AIRTABLE_AUDIT.md` |
| Spec overrides / pack-out edits / BEO check state | localStorage | Airtable (or backend) if multiple people need same state | Same doc |

**Concrete first steps:**  
1. In Airtable: create **Custom Delivery DELI** (Long Text), **DELI (Full Service)** (linked to Menu Items), **Custom DELI (Full Service)** (Long Text). Replace placeholder IDs in `events.ts` and add new IDs to `SAVE_WHITELIST`.  
2. Decide on **Platter Orders**: new table linked to Events, or Long Text on Events. Create it, then add a small Airtable client and switch the app from `platterOrdersStore` to Airtable.  
3. Optionally: add fields (or table) for sauce overrides and BEO worksheet state; wire app to read/write them.

---

### Track B: BEO rendering (match old BEOs)

**Why second:** So whatever is in Airtable (and intake) actually prints correctly.

| Item | Current | Target | Doc / code |
|------|--------|--------|------------|
| Menu items with children | Parent + indented children (already) | Keep; ensure **all** such items use same rule (main line + indented children) | `BeoPrintPage.tsx` `expandItemToRows`, `BEO_FULL_SERVICE_STATIONS_AND_PICKERS.md` |
| Stations | Encoded as one synthetic item, split into header + components | Same; optionally **per-station section header** (e.g. PRESENTED APP STATION - [Name] - CHINA/METAL) | Same doc |
| DELI on full-service BEO | No DELI section | Add **DELI** (or DELI - CHINA/METAL) section after Presented Appetizers, before Buffet; fill from full-service DELI field(s) + platter orders from Airtable | `BeoPrintPage.tsx`, `KitchenBEOPrintPage.tsx` |
| Platters on full-service BEO | Not printed | Print in DELI section: platter name + indented sub-items (same format as delivery) | Platter data from Airtable when migrated |
| Delivery / pickup BEO | DELI - DISPOSABLE exists; platters from localStorage | Same layout; platters from Airtable once migrated | Already structured; just data source change |

**Concrete first steps:**  
1. Add **DELI** section to full-service Kitchen BEO and Server BEO; populate from `FULL_SERVICE_DELI` and `CUSTOM_FULL_SERVICE_DELI` (after you add those fields).  
2. When platter orders are in Airtable, merge them into DELI for full service (same as delivery: platter name + sub-items).  
3. Audit menu items: any that should have child lines on the BEO must have `childIds` (or equivalent) and be rendered via the same **main + indented children** logic.

---

### Track C: Intake UI — one pattern (simple flow, add/modify/delete)

**Why third:** So the flow is easy and every block can be completed correctly.

| Item | Current | Target | Doc / code |
|------|--------|--------|------------|
| “Multi-child” things (stations, platters, displays, boards) | Different modals/flows | **One pattern:** grouped card (main name + list of children) + **sub-menu** (modify / delete / add) | `BEO_FULL_SERVICE_STATIONS_AND_PICKERS.md` §4 |
| Menu sections (Passed App, Presented App, Buffet, etc.) | Pills + picker; some edit/delete | Every section: **add** (picker or “Add X”), **modify** (edit in place or sub-menu), **delete** (per item or per group) so BEO can be complete | `MenuSection.tsx`, `BeoIntakePage.tsx` |
| Full-service DELI in UI | No dedicated block | When DELI fields exist: a **DELI** block (or inside menu) where user can add/edit/delete items and platters; same add/modify/delete pattern | New or extend `MenuSection.tsx` |
| Delivery / pickup intake | Same form, delivery-specific sections | Same principle: every option and item can be added, modified, deleted; flow simple and clear | Same components, delivery branch |

**Concrete first steps:**  
1. Define the **grouped card + sub-menu** component (or reuse/refactor from creation station); use it for stations, then platters, then displays/boards.  
2. For each menu section (and later DELI): ensure there is an explicit **Add**, **Edit**, **Delete** path for every item that can appear on the BEO.  
3. Simplify picker entry points and labels so the flow is “pick section → add/edit/delete” without confusion.

---

### Track D: Full intake form — every section complete

**Why fourth:** So the BEO isn’t just “menu” — it’s header, venue, timeline, serviceware, bar, notes, etc., and all of it editable.

| Area | What must be true |
|------|-------------------|
| **Header / Event core** | Venue, client, contact, date, guest count, event type, etc.: all editable; save to Airtable; print on BEO. |
| **Menu & beverages** | All menu sections + stations + platters + DELI (when added): add/modify/delete; all in Airtable; render on BEO per Track B. |
| **Beverage / bar** | Bar service, signature drink, mixers, garnishes, hydration, coffee: editable; save to Airtable; print correctly. |
| **Kitchen & serviceware** | Serviceware source, rentals, linens, etc.: editable; save to Airtable; print on BEO. |
| **Timeline** | Dispatch, start, end, venue arrival, timeline notes: editable; save; print. |
| **Site / logistics** | Parking, load-in, kitchen access, power, stairs, elevators, etc.: editable; save; print where relevant. |
| **Approvals / lockout** | Read-only or controlled by workflow; no “missing” editable path if it’s supposed to be user-editable. |

**Concrete first steps:**  
1. **Audit** each section of `BeoIntakePage` (HeaderSection, EventCoreSection, MenuAndBeveragesSection, KitchenAndServicewareSection, TimelineSection, SiteVisitLogisticsSection, BeverageServicesSection, etc.): list every field that should appear on the BEO.  
2. For each: confirm it’s **editable** (add/modify/delete as applicable), **saved to Airtable** (and in `SAVE_WHITELIST` if on Events), and **printed** in the right place on Kitchen/Server BEO (and delivery BEO if applicable).  
3. Fix gaps: add missing fields to intake, or wire existing fields to print, or add delete/custom-line options where the old BEO had them.

---

### Track E: Delivery and pickup parity

**Why last:** Full-service flow and data model first; then apply same ideas to delivery/pickup.

| Item | Notes |
|------|--------|
| Delivery BEO sections | Already have HOT, DELI, KITCHEN, SALADS, DESSERTS; ensure every option and item is editable and prints. |
| Pickup | Same as delivery for BEO/output; intake flow consistent (add/modify/delete). |
| Data | All delivery/pickup data in Airtable (no critical data in localStorage). |

**Concrete first steps:**  
1. Reuse the same **add/modify/delete** and **grouped card + sub-menu** patterns for delivery menu sections.  
2. Ensure delivery-specific fields (e.g. delivery time, address) are editable and print.  
3. Once platters (and any other shared state) are in Airtable, delivery and pickup use that same source.

---

## Order of work (suggested)

1. **Track A (Airtable)** — Get shared data out of localStorage and add full-service DELI (and optional platter table). Without this, multi-user and “correct BEO” are limited.  
2. **Track B (BEO rendering)** — Add DELI section for full service; ensure all menu items (and stations, platters) use the same “main + indented children” format.  
3. **Track C (UI pattern)** — Introduce the single “grouped card + sub-menu” pattern for stations, platters, displays, boards; ensure every menu section has clear add/modify/delete.  
4. **Track D (Full intake)** — Audit every intake section; ensure every BEO-relevant field is editable and printed.  
5. **Track E (Delivery/pickup)** — Apply the same rendering and UI rules to delivery and pickup.

You can do **A + B in parallel** after the Airtable fields exist (e.g. one person does Airtable + client for platters, another adds DELI section to BEO). **C** depends on having a clear pattern (already described in the stations doc); **D** can be done section by section.

---

## Where things are already documented

- **Stations, DELI, creation stations (appetizer vs buffet), one format for multi-child:** `BEO_FULL_SERVICE_STATIONS_AND_PICKERS.md`  
- **What’s in localStorage and what to move:** `LOCALSTORAGE_AND_AIRTABLE_AUDIT.md`  
- **Airtable setup for full-service DELI and platters:** `AIRTABLE_FULL_SERVICE_DELI_AND_PLATTERS.md`  
- **Platters & DELI goal, “wrong spot”:** `PLATTERS_AND_DELI_GOAL.md`  
- **Events fields, read-only vs writable:** `src/services/airtable/events.ts` (FIELD_IDS, SAVE_WHITELIST, PLACEHOLDER_FIELD_IDS)  
- **Menu Items, categories, pickers:** `CURSOR_AIRTABLE_FIELD_REFERENCE.md`, `AIRTABLE_MENU_ITEMS_SCHEMA.md`  
- **Intake structure:** `BeoIntakePage.tsx` + `components/beo-intake/*` (HeaderSection, EventCoreSection, MenuAndBeveragesSection, KitchenAndServicewareSection, TimelineSection, SiteVisitLogisticsSection, etc.)

---

## Immediate “where do I go from here” (next 1–2 steps)

1. **Airtable:** Create the three Events fields: **Custom Delivery DELI**, **DELI (Full Service)** (linked to Menu Items), **Custom DELI (Full Service)** (Long Text). In code: replace `fldCustomDeliTODO` with the real Custom Delivery DELI ID; add `FULL_SERVICE_DELI` and `CUSTOM_FULL_SERVICE_DELI` to `FIELD_IDS` and `SAVE_WHITELIST`.  
2. **BEO:** Add a **DELI** section to the full-service BEO (Kitchen + Server) that reads from `FULL_SERVICE_DELI` and `CUSTOM_FULL_SERVICE_DELI` and renders items (and later platters) in the same **main + indented children** style as the rest of the menu.

After that, you can either (a) add the Platter Orders table and migrate platters from localStorage, or (b) refine the intake UI (grouped cards + sub-menu) for stations and platters. This roadmap keeps everything in one place so you can fix menu items and the full intake (and delivery/pickup) in a clear order and still print a completed BEO with correct information.
