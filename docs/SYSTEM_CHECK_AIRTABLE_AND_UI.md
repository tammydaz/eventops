# System Check: Airtable ↔ UI — What Syncs, What’s Local Only

This doc is a single reference to confirm that the UI and Airtable “shake hands” and to flag anything that is **only** stored locally (no Airtable sync).

---

## 1. What **does** talk to Airtable (source of truth)

| Area | How it syncs | Where in code |
|------|----------------|----------------|
| **Events table (main record)** | All intake form fields → `setFields` → `updateEvent` → `filterToEditableOnly` → `updateEventMultiple` (PATCH). Only field IDs in `SAVE_WHITELIST` are sent. | `src/state/eventStore.tsx`, `src/services/airtable/events.ts` |
| **Event list** | `loadEvents()` / `loadEventData(id)` read from Airtable. | `eventStore`, `events.ts` |
| **Stations** | Create/update via `createStation`, `createStationFromPreset`, PATCH in `linkedRecords.ts`. | `src/services/airtable/linkedRecords.ts`, `MenuSection.tsx` |
| **Boxed Lunch Orders** | Create via `createBoxedLunchOrderFromRows`; read via `loadBoxedLunchOrdersByEventId`. | `src/services/airtable/boxedLunchOrders.ts`, `MenuSection.tsx` |
| **Station presets / components** | Loaded from Airtable (presets, component names). | `stationComponents.ts`, `linkedRecords.ts` |
| **Menu Items (names, children)** | Fetched by ID from Menu Items table for display and pickers. | `airtableFetch` in `MenuSection`, `BeoPrintPage`, etc. |
| **Bar Service** | Field ID resolved by name via Meta API; value read/written via `setFields` (in whitelist). | `events.ts` `getBarServiceFieldId`, `BarServiceSection.tsx` |
| **BEO lockout / production flags** | Checkboxes (Guest Count Confirmed, Menu Accepted, etc.) written via `setFields` when IDs are in whitelist. | `BeoPrintPage`, `DashboardPage`, `events.ts` lockout/BOH IDs |

So: **event record fields**, **stations**, and **boxed lunch** are the main writable shapes; everything else is either read from Airtable or derived from those.

---

## 2. What is **local-only** (does not sync to Airtable)

These are stored only in `localStorage` (or in-memory). Different devices/users will not see the same data.

| Data | Storage key / place | Impact |
|------|----------------------|--------|
| **Platter orders** (sandwich platter configs) | `eventops-platter-orders` → `{ [eventId]: PlatterRow[] }` | Only the person on this browser sees platter picks; BEO print/kitchen merge from here. |
| **Sauce overrides** (per-item “Default” / “None” / custom) | `beo-sauce-overrides-{eventId}` | Same device only. |
| **BEO spec overrides** | `beo-spec-overrides-{eventId}` (same key used in intake and BEO print via `beoSpecStorage.ts`) | Intake and BEO print read/write this locally; Airtable has a field but app does not write to it (see below). |
| **BEO pack-out edits** | `beo-packout-edits-{eventId}` | Local only. |
| **BEO check state** (checkboxes) | `beo-check-state-{eventId}` | Local only; multiple people won’t see same checks. |
| **FOH questions** (Ask FOH) | questionStore (persisted to localStorage) | Local only; can be moved to Airtable/API later. |
| **Feedback “last seen resolved”** | `feedback-last-seen-resolved` | UI-only; OK to keep local. |

So: **platter orders**, **sauce overrides**, **spec overrides**, **pack-out edits**, and **BEO check state** are the event-related pieces that do **not** currently “shake hands” with Airtable for writing.

---

## 3. Gaps that affect “everything syncs with Airtable”

### 3.1 Spec Override field (read but not written)

- **Airtable:** Events table has a Long Text field **Spec – Override** (`fldoMjEaGZek6pgXG`).
- **Code:** `FIELD_IDS.SPEC_OVERRIDE` is defined and used when **reading** (e.g. `MenuSection`, `BeoPrintPage` merge Airtable value with localStorage).
- **Gap:** `SPEC_OVERRIDE` is **not** in `SAVE_WHITELIST` in `events.ts` (comment says “add back when you create … in Airtable”). So:
  - The app **never** writes spec overrides to Airtable.
  - All spec override edits are persisted only to `beo-spec-overrides-{eventId}` in localStorage.
- **To fix:** Add `"fldoMjEaGZek6pgXG"` to `SAVE_WHITELIST` in `src/services/airtable/events.ts`, and have intake (and optionally BEO print) write the merged spec-override object to that field on save so Airtable is the source of truth.

### 3.2 “Spec Ready” flag

- **Code:** `BeoIntakeActionBar.tsx` calls `setFields(eventId, { "fldSpecReady": true })`.
- **Gap:** `fldSpecReady` is not in `FIELD_IDS` and not in `SAVE_WHITELIST`, so this patch is stripped by `filterToEditableOnly` and **never** sent to Airtable. The action is local/UI only.
- **To fix:** If “Spec Ready” should be in Airtable, add the real field ID to `FIELD_IDS` and `SAVE_WHITELIST` and use it in the action bar.

### 3.3 Placeholder field IDs (intentionally not written)

These are in `FIELD_IDS` but in `PLACEHOLDER_FIELD_IDS` and/or not in `SAVE_WHITELIST`, so the app **does not** send them to Airtable (avoids 404 or invalid field errors):

- `fldCustomRoomTempTODO` — Custom Room Temp Display
- `fldCoffeeMugTypeTODO` — Coffee Mug Type
- `fldCarafesPerTableTODO` — Carafes Per Table

Once you create these fields in Airtable, replace the IDs in `events.ts` and add the real IDs to `SAVE_WHITELIST` (and remove from `PLACEHOLDER_FIELD_IDS` if present) so the UI can persist them.

---

## 4. Quick verification checklist

Use this to confirm “UI and Airtable shake hands” and “nothing important is solely local”:

- [ ] **Events table:** Saving from BEO intake updates the correct event in Airtable (only whitelisted fields are sent).
- [ ] **Stations:** Creating/editing stations creates/updates records in the Stations table and links to the event.
- [ ] **Boxed Lunch:** Creating boxed lunch orders creates records in Airtable and links to the event.
- [ ] **Bar Service / Beverages:** Selections are written to the Events table (Bar Service field ID resolved by name).
- [ ] **No event-critical data only in localStorage:** If you need platter orders, sauce overrides, spec overrides, pack-out edits, or BEO check state to be shared across users/devices, they must be moved to Airtable (or another backend) and the UI wired to read/write them there.
- [ ] **SPEC_OVERRIDE:** If you want spec overrides to sync, add the field ID to `SAVE_WHITELIST` and persist from intake (and optionally BEO print).
- [ ] **Spec Ready:** If this should be stored in Airtable, add the real field ID and whitelist it.
- [ ] **Placeholder fields:** Replace TODO IDs with real Airtable field IDs when those fields exist, and add them to `SAVE_WHITELIST` so the UI can persist them.

---

## 5. Where the “single source of truth” lives

| Topic | Doc / code |
|--------|------------|
| **Events – every field the app knows** | `src/services/airtable/events.ts` → `FIELD_IDS`, comments (Formula / READ ONLY, etc.) |
| **Which fields are safe to write** | `src/services/airtable/events.ts` → `SAVE_WHITELIST`, `filterToEditableOnly` |
| **Placeholder / not-yet-in-Airtable fields** | `src/services/airtable/events.ts` → `PLACEHOLDER_FIELD_IDS`, comments on TODO IDs |
| **All localStorage usage** | `docs/LOCALSTORAGE_AND_AIRTABLE_AUDIT.md` + this doc |
| **Stations / Boxed Lunch / Menu Items schema** | `linkedRecords.ts`, `boxedLunchOrders.ts`, `stationComponents.ts`; docs in `docs/` (e.g. `AIRTABLE_MENU_ITEMS_SCHEMA.md`, `AIRTABLE_FULL_SERVICE_DELI_AND_PLATTERS.md`) |

---

**Summary:** The UI **does** talk to Airtable for events (whitelist), stations, and boxed lunch. Several BEO-related and event-related pieces (platter orders, sauce overrides, spec overrides, pack-out edits, check state, FOH questions) are **only** stored locally today. To have “nothing solely stored locally” for event data, those need to be moved to Airtable (or a backend) and the app updated to read/write them there; the biggest fix for “spec overrides sync” is adding `SPEC_OVERRIDE` to `SAVE_WHITELIST` and persisting it on save.

---

# FIELD VERIFICATION (WORKING — DO NOT TRUST YET)

## TIME & DATE SYSTEM RULE (GLOBAL)

- All user-facing fields must separate Date and Time:
  - Date fields store date only
  - Time fields store time-of-day only (no date)

- Datetime fields are allowed ONLY when:
  - Representing a true moment (e.g., system timestamps, logs)
  - OR explicitly required for operational logic

- UI is responsible for combining Date + Time when needed for display or logic.

⚠️ Do not introduce new datetime fields for user-facing inputs unless absolutely required.

---

## Event Address Resolution Rule (FINAL)

The BEO must display the event address using the following priority:

1. Print – Event Address (formatted formula field)
2. Venue Address (if venue is provided)
3. Client Address (fallback only when no venue exists)

RULE:
- Venue address overrides client address
- Client address is only used when no venue is defined
- This logic must be consistent across:
  - BEO print
  - UI display
  - Any automation or export

⚠️ This rule is REQUIRED behavior, not optional or inferred.

**Verification (3 cases):**
- **Case 1 — No venue:** BEO must show client address. Code: `BeoPrintPage.tsx` and `KitchenBEOPrintPage.tsx` resolve address as `PRINT_EVENT_ADDRESS || VENUE_FULL_ADDRESS || constructed venue || client address`. With no venue fields, constructed venue is `""`, so result is client address. ✓
- **Case 2 — Add venue:** BEO must switch to venue. Once any of Print – Event Address, Venue Full Address, or venue components (Address, City, State, ZIP) are set, that value wins; client is not used. ✓
- **Case 3 — Remove venue:** BEO must revert to client. Clearing venue fields makes venue branch falsy again, so fallback is client address. ✓

⚠️ IMPLEMENTATION NOTE:

BeoPrintPage and KitchenBEOPrintPage use slightly different address resolution logic:

- BeoPrintPage:
  PRINT_EVENT_ADDRESS → VENUE_FULL_ADDRESS → constructed venue fields → client fallback

- KitchenBEOPrintPage:
  PRINT_EVENT_ADDRESS → VENUE_FULL_ADDRESS → VENUE_ADDRESS → client fallback

These paths currently produce the same correct result in tested scenarios, but are not identical.

Any future changes to address fields or formatting must ensure both paths remain aligned.

---

## CLIENT & PRIMARY CONTACT — GOLDEN FIELDS AND RULES

**FINAL LOCK (this is the ONLY one that stands)**

✅ **CLIENT — GOLDEN (LIVE SYSTEM)**  
CLIENT FIRST NAME → fldFAspB1ds9Yn0Kl  
CLIENT LAST NAME  → fldeciZmsIY3c2T1v  
CLIENT PHONE      → fldnw1VGIi3oXM4g3  

✅ **PRIMARY CONTACT — GOLDEN (LIVE SYSTEM)**  
PRIMARY CONTACT NAME  → fldmsFPsl2gAtiSCD  
PRIMARY CONTACT PHONE → fld4OK9zVwr16qMIt  
PRIMARY CONTACT ROLE  → fldMTRGNFa4pHbjY5  

❌ **EXPLICITLY NOT GOLDEN (kill the confusion)**  
fld396V  
fld397b  
fldultFUJ6hi3YbDv  

### 2. CLIENT vs CONTACT — PRINT RULE (locked)

- **CLIENT row** = CLIENT FIRST + LAST
- **CONTACT row** = PRIMARY CONTACT NAME
- **PHONE** = PRIMARY CONTACT PHONE → fallback CLIENT PHONE

### 3. COLLAPSE RULE (required — not yet enforced)

**IF:** PRIMARY CONTACT NAME == CLIENT FULL NAME  

**THEN:**
- Hide CONTACT row on BEO
- Show single clean name

👉 If this is not enforced later, BEOs will look amateur. Enforce in code when building BEO header.

### 4. Implementation order

- **STEP 1** — Crown golden fields (above)
- **STEP 2** — Ignore everything else for now
- **STEP 3** — Build logic ONLY against golden fields
- **STEP 4** — Clean legacy later (with audit)

---

## Event Date
UI: Event Date
Airtable: EVENT DATE (fldFYaE7hI27R3PsX)
BEO: EVENT DATE
Cursor: FIELD_IDS.EVENT_DATE → fldFYaE7hI27R3PsX
Status: CLEAN

---

## Guest Count
UI: Guest Count
Airtable: GUEST COUNT (fldjgqDUxVxaJ7Y9V)
BEO: GUESTS
Cursor: FIELD_IDS.GUEST_COUNT → fldjgqDUxVxaJ7Y9V
Status: CLEAN (label drift on BEO)

---

## Venue
UI: Venue name, Address, City, State, ZIP
Airtable: 
- VENUE (fldtCOxi4Axjfjt0V)
- Venue Address (fldJsajSl1l6marzw)
- Venue City (fldNToCnV799eggiD)
- Venue State (fldxCz5cPLwCetb0C)
- Venue ZIP (fldWehIaLQd5sHDts)
- Venue Full Address (fld0oRsZp6YCUsOki)
BEO: 
- VENUE → VenuePrint → VENUE
- ADDRESS → Print – Event Address → Venue Full Address → constructed
Cursor:
- eventLocation = VENUE_PRINT || VENUE
- venueAddress = PRINT_EVENT_ADDRESS || VENUE_FULL_ADDRESS || constructed
Status: COMPLEX (multi-field, fallback-driven, no single final field)

---

## Client Name
UI: First name, Last name (Client & Contact section); Header shows CLIENT
Airtable:
- Client First Name (fldFAspB1ds9Yn0Kl)
- Client Last Name (fldeciZmsIY3c2T1v)
- Client Full Name (Print) (fldijM3uOW2uS4JeA) [formula, not used by BEO]
- BEO HEADER (fldvaTTERrdFgB3ps) [formula, not used by BEO]
- Client Business Name (fld4YxQOjzPyyBIHL) [formula, not used by BEO]
- Client Full Name (Display) (fld4asRrkhva9rEg0) [formula]
- DISPLAY NAME FOR INTERFACE (fldxXmSyCU5XVSZFV) [formula]
- Client Name - LEGACY – DO NOT USE (fldlZrse1co9DV45j)
- Client Name Autofill - LEGACY – DO NOT USE (fld9LnsDlMBTl7C1G)
BEO:
- CLIENT → First Name + Last Name (constructed in code)
Cursor:
- clientName = CLIENT_FIRST_NAME + CLIENT_LAST_NAME
Status: NOT CLEAN (Airtable formulas exist but are bypassed; code is source of truth)

---

## Event Type
UI: Event Type (single select; options: Full Service, Delivery, Pickup, Grazing Display / Interactive Station, Tasting)
Airtable:
- EVENT TYPE (fldtqnvD7M8xbc0Xb)
BEO:
- Not shown on main BEO header
- Kitchen BEO shows label "EVENT TYPE" but value = Event Occasion (mismatch)
Cursor:
- FIELD_IDS.EVENT_TYPE → fldtqnvD7M8xbc0Xb
- Read via asSingleSelectName(...)
- Written via setFields(..., { EVENT_TYPE: "Full Service" | "Delivery" | ... })
Status: CLEAN (single-field wire) with OUTPUT BUG (Kitchen BEO label/value mismatch)

---

## Dispatch Time
UI: Shown in **Header** (BEO intake): same row as JOB # — “JOB #: … — DISPATCH TIME: [time picker or read-only text]”. When editable: hour/minute/AM-PM dropdowns in that row. Editable only by ops_admin (`canEditDispatch`); otherwise “(read-only)”. For delivery events, also appears in **Event Core** section as “Dispatch Time” with same picker/read-only behavior.

Airtable:
- DISPATCH TIME (fld7m8eBhiJ58glyZ) → CORE FIELD (source of truth)
- Dispatch Time (Print) (fldbbHmaWqOBNUlJP) → FORMULA (display only)

BEO:
- Uses Dispatch Time (Print) for formatted output
- Drives:
  - “DISPATCH TIME”
  - “Dispatch”
  - Kitchen: “FOOD MUST BE READY”

Cursor:
- FIELD_IDS.DISPATCH_TIME → fld7m8eBhiJ58glyZ (MUST reference core field)
- HeaderSection: first row of header table; `dispatchTimePicker` when canEditDispatch, else `dispatchTimeDisplay` (from BeoIntakePage: secondsTo12HourString(selectedEventData[DISPATCH_TIME]))
- EventCoreSection: “Dispatch Time” in time keys when delivery or when header fields not hidden
- Stored as ISO datetime (EVENT DATE + time) for core field
- Write restricted to ops_admin (patch stripped for others in eventStore)

Status: CLEAN — dual-field pattern (core + print)
⚠️ Critical rule (lock this in your brain)
NEVER write to a (Print) field

Print fields = output layer only

Core fields = logic + automation + writes

If you ever see code writing to:

fldbbHmaWqOBNUlJP

👉 that's a bug

---

## Event Start
UI: EventCoreSection "Event Start Time" (hour/minute); HeaderSection table "EVENT START" with time dropdown. Shown when not delivery and when header fields visible.
Airtable:
- Event Start Time (fldDwDE87M9kFAIDn) — duration (seconds). In SAVE_WHITELIST; sent as seconds (not ISO).
BEO:
- Row "EVENT START"; HeaderFieldWithDivider "Event Start". Value: secondsTo12HourString(EVENT_START_TIME).
Cursor:
- FIELD_IDS.EVENT_START_TIME → fldDwDE87M9kFAIDn. Read/display: secondsTo12HourString / secondsToTimeString. Write: handleTimeSelectChange → seconds as-is.
Status: CLEAN

---

## Event End
UI: EventCoreSection "Event End Time"; HeaderSection table "EVENT END" with time dropdown. Same visibility as Event Start.
Airtable:
- Event End Time (fld7xeCnV751pxmWz) — duration (seconds). In SAVE_WHITELIST; sent as seconds (not ISO).
BEO:
- Row "EVENT END"; HeaderFieldWithDivider "Event End". Value: secondsTo12HourString(EVENT_END_TIME).
Cursor:
- FIELD_IDS.EVENT_END_TIME → fld7xeCnV751pxmWz. Same read/display/write pattern as Event Start.
Status: CLEAN

---

## FW Arrival / Event Arrival
UI: EventCoreSection "Event Arrival Time"; HeaderSection table "EVENT ARRIVAL" with time dropdown. Same visibility as Event Start/End (not delivery, header fields visible). Backed by FoodWerx Staff Arrival when that field exists in Airtable.
Airtable:
- Venue Arrival Time (fld807MPvraEV8QvN) — fixed ID; in SAVE_WHITELIST and DATE_TIME_FIELD_IDS (ISO on write).
- FoodWerx Staff Arrival / FW Arrival Time — ID resolved at runtime by name via getFoodwerxArrivalFieldId() (Meta API); resolved ID in additionalAllowedFieldIds.
- Code uses: resolved FW Arrival ID if present, else VENUE_ARRIVAL_TIME.
BEO:
- Row "EVENT ARRIVAL"; HeaderFieldWithDivider "Event Arrival". Value: secondsTo12HourString(FOODWERX_ARRIVAL) || VENUE_ARRIVAL_TIME. Kitchen: staffArrival from same.
Cursor:
- FIELD_IDS.FOODWERX_ARRIVAL = placeholder; load/save use resolved ID from getFoodwerxArrivalFieldId(). FIELD_IDS.VENUE_ARRIVAL_TIME → fld807MPvraEV8QvN. arrivalFieldId = fwArrivalFieldId ?? VENUE_ARRIVAL_TIME. Write: time-select flow, ISO for resolved/VENUE_ARRIVAL.
Status: CLEAN (dual-source: FW Arrival when resolved, else Venue Arrival)

INAL LOCK — TIME SYSTEM (FOODWERX)
🧱 DEFINITIONS (non-negotiable)
DISPATCH TIME = when food must be fully ready, packed, and leaving the kitchen
EVENT START   = when the event begins for guests
ARRIVAL       = when staff arrives on-site (setup / execution)
⚙️ SOURCE OF TRUTH (what actually drives dispatch)
1) FULL SERVICE
Dispatch = Arrival - 90 minutes

Uses: FOODWERX_ARRIVAL → fallback VENUE_ARRIVAL_TIME

Meaning: kitchen must be ready 1.5 hours before crew hits site

2) DELIVERY / PICKUP
Dispatch = Event Start - 30 minutes

Uses: EVENT_START_TIME

Meaning: leave kitchen 30 min before serve time

3) HARD GUARD
Dispatch >= 0 (never negative)
🧠 PRECEDENCE (this is the real rule)
DISPATCH TIME ALWAYS WINS

Kitchen → Dispatch

Pack-out → Dispatch

Timeline anchor → Dispatch

🖨️ BEO DISPLAY RULE
Dispatch → printed as "FOOD MUST BE READY"
Start    → printed as event time
Arrival  → printed for staff reference

👉 None of these derive from each other at print time
👉 They display whatever is stored

⚠️ CRITICAL CLARITY (this is where systems break)
Arrival DOES NOT control production
Start   DOES NOT control production
ONLY Dispatch controls production
🧱 MENTAL MODEL (burn this in)
Dispatch = KITCHEN CLOCK
Start    = CLIENT CLOCK
Arrival  = CREW CLOCK

---

# Spec Engine & Pack-Out — ACTUAL SYSTEM (CURRENT STATE + INTENDED MODEL)

## Spec Engine & Pack-Out — FoodWerx EventOps (Current + Target Behavior)

### 1. Core Truth (System Reality)

The system currently operates in a **hybrid state**:

- Spec Engine = calculation layer (read-only, not persisted)
- BEO Spec Column = manual + local override driven
- Pack-Out = partially derived + partially manual + partially local

This is intentional during build phase but must be understood clearly.

---

### 2. Spec Engine (Calculation Layer)

**Source Data (Read Only):**
- Events (Guest Count, Menu Items, Event Type)
- Menu Items (structure, child items, categories)
- Master Menu Specs (tier-based quantities)

**Behavior:**
- Calculates theoretical quantities (pans, counts, etc.)
- Used by:
  - PackOutModal (preview)
  - packOutService.buildPackOutList()

**Critical Rule:**
- Spec Engine does NOT write to Airtable
- Spec Engine does NOT directly control BEO output

---

### 3. BEO Spec Column (What Actually Prints)

**Source Priority:**
1. Local Spec Override (localStorage)
2. Airtable Spec Override (fldoMjEaGZek6pgXG, read-only)
3. Item-level spec / speck field
4. Fallback: "—"

**Important:**
- Spec column is NOT driven by Spec Engine
- Spec is currently a **human-controlled display layer**

**Implication:**
- Kitchen-facing numbers are controlled manually, not algorithmically

---

### 4. Spec Override System

**Storage:**
- LocalStorage key: `beo-spec-overrides-{eventId}`

**Key Structure:**
- `${fieldId}:${itemId}:${rowIdx}`

**Airtable Field:**
- Spec – Override (fldoMjEaGZek6pgXG)
  - Read only in current system
  - NOT written by app (not in SAVE_WHITELIST)

**Critical Gap:**
- Overrides are NOT persisted back to Airtable
- System is currently **local-first for overrides**

---

### 5. Pack-Out System (Current Behavior)

#### A. Pack-Out Generation (Engine-Driven)

- Source: `calculateSpecsForEvent`
- Built via: `packOutService.buildPackOutList(eventId)`

Produces:
- Derived equipment
- Derived containers
- Derived quantities

#### B. Pack-Out Storage (Partial)

- Intended field: `PACK_OUT_JSON`
- Written via: `generateAndWritePackOut(eventId)`
- Only writes if field is empty

**Current Issue:**
- FIELD_IDS.PACK_OUT_JSON is not defined in events.ts
- Therefore Airtable persistence may be incomplete or inactive

---

### 6. Pack-Out on BEO (What Staff Actually Uses)

**Source:**
- LocalStorage only

**Storage Key:**
- `beo-packout-edits-{eventId}`

**Behavior:**
- Editable per item
- Not synced to Airtable
- Overrides any generated pack-out logic

**Critical Reality:**
- The BEO pack-out column is **NOT the engine output**
- It is a **manual, local checklist layer**

---

### 7. System Separation (Very Important)

```text
Spec Engine = math (not visible directly)
BEO Spec    = human-controlled display
Pack-Out    = hybrid (engine + manual + local)
```

### 8. Operational Truth (How the System Actually Runs)

- Spec Engine suggests quantities
- Humans confirm / override spec values
- Pack-Out is generated from spec logic
- Staff edits pack-out directly on BEO
- Final execution is based on human-adjusted pack-out, not raw engine output

---

### 9. Target State (Future — NOT CURRENT)

The intended final system:

- Spec Engine → writes validated spec to Airtable
- Spec Override → persists to Airtable
- Pack-Out → fully derived from spec + menu logic
- BEO → reflects engine + approved overrides (not local-only)

This is NOT yet implemented.

---

### 10. Non-Negotiable Rules

- Never overwrite manual overrides
- Never assume Spec Engine output is final
- Never treat localStorage as permanent data
- Events table remains the single source of truth (once persistence is completed)
