# EventOps — Master TODO List

**Purpose:** Single source of truth for what needs to be done. No drift. Recall this when picking up work.

---

## OMNI — Keep Her Flow (Priority)

Omni is cooperating. These items keep momentum with her.

### With Omni

| # | Task | Who | Status | Notes |
|---|------|-----|--------|-------|
| 1 | **Add Deli menu items to Airtable** — 6 Sandwich Platters, 5 Boxed Lunches, 10 Individual Signature Sandwiches | Omni | ✅ Done | Omni confirmed: Menu Items populated. Category = "Boxed Lunch" or "Sandwich Platter" |
| 2 | **Extend Menu Items table** — Type, Category, Menu Category etc. | Omni | ✅ Done | Per Omni setup review |
| 3 | **Confirm Boxed Lunch Orders field name** — "Client/Event" | Omni | ✅ Confirmed | fldUnkvbaJhny05V3 — field name "Client/Event" |
| 4 | **Create Boxed Lunch Orders** — When clients order, create records in Boxed Lunch Orders + Order Items, linked to Event | Omni / External UI | Pending | Tables ready. Sample structure in `docs/OMNI_BOXED_LUNCH_SCHEMA.md` |

### Code (Omni Integration)

| # | Task | File(s) | Status | Notes |
|---|------|---------|--------|-------|
| 5 | **BEO merge: Boxed lunches on Kitchen BEO** — Call `loadBoxedLunchOrdersByEventId`, add items to DELI section for delivery events | `KitchenBEOPrintPage.tsx` | ✅ Done | Merges into DELI - DISPOSABLE |
| 6 | **BEO merge: Boxed lunches on BeoPrintPage** — Same for delivery BEO if it has a DELI section | `BeoPrintPage.tsx` | ✅ Done | Merges into DELI - DISPOSABLE |
| 6b | **Debug: Boxed lunches not showing** — If DELI is empty, check: (1) Event Type = Delivery/Pick Up, (2) Boxed Lunch Order linked via Client/Event in Airtable, (3) Airtable filter formula `FIND(eventId, ARRAYJOIN({Client/Event}))` | `boxedLunchOrders.ts` | Verify | See "Where are boxed lunches?" below |
| 7 | **menuCategories: Deli** — Ensure "Deli" (from Omni) matches `deli` in `menuCategories.ts` | `menuCategories.ts` | Verify | Current: `["Deli/Sandwhiches", "Deli/Sandwiches", "Deli/Breads"]` — may need "Deli" |

---

## STATION CONFIG — Verify Section by Section

User reported: "made shit up on some stations, missing shit on others." Need to verify each station against source of truth.

### Your Part

| # | Station | Task | Status | Notes |
|---|---------|------|--------|-------|
| 8 | Tex-Mex | Go through config modal; verify Shell, Proteins, Included match FoodWerx/Airtable | Pending | |
| 9 | Ramen | Same | Pending | |
| 10 | All-American | Same | Pending | |
| 11 | Street Food | Same | Pending | |
| 12 | Raw Bar | Same | Pending | |
| 13 | Carving | Same | Pending | |
| 14 | Hibachi | Same | Pending | |
| 15 | Late Night | Same | Pending | |
| 16 | Chicken & Waffle | Same | Pending | |
| 17 | Simple stations (vegetable, spreads-breads, charcuterie, pasta-flight, farmers-fruit, fishermans-corner, barwerx, philly-jawn) | Same | Pending | |

### Code (After You Verify)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 18 | Fix each station based on your feedback | Pending | You provide corrections; we update `stationPresets.ts` and `StationComponentsConfigModal.tsx` |

---

## BEO / PRINT — Remaining

| # | Task | File(s) | Status | Notes |
|---|------|---------|--------|-------|
| 19 | **BeoPrintPage buffet menu signs** — Add stations with beoPlacement to Presented/Buffet sections | `BeoPrintPage.tsx` | Pending | Kitchen BEO is done; buffet menu signs (tent cards) may still need this |
| 20 | **Print routing** — Kitchen BEO stations by beoPlacement | `KitchenBEOPrintPage.tsx` | ✅ Done | Presented → PRESENTED APPETIZERS, Buffet → BUFFET – METAL |

---

## OPS CHIEF — Signature Drink Non-Standard Items

Bar/Signature Drink intake and server BEO are done (pills, alcohol vs mixers & garnish, in-speck highlighting, non-standard banner on BEO). Ops Chief view still needs to surface these so expediter doesn’t miss events that need sig drink items sourced.

| # | Task | File(s) | Status | Notes |
|---|------|---------|--------|-------|
| 21 | **Surface signature drink non-standard items in Ops Chief** — When an event has a signature drink, Foodwerx supplies mixers/garnish, and any item is *not* in the standard bar speck, show an alert/card so Ops Chief sees “needs sourcing” | `OpsChiefDashboard.tsx`, `BeoPrintPage.tsx` (reference) | Pending | Logic already in place: `getNonStandardBarItems(mixers + garnishes)`; banner shows on Server BEO 2nd page. Reuse same logic in Ops Chief when wiring to real event data. See TODO in `getCriticalAlerts` and next to `nonStandardSigDrinkItems` in `BeoPrintPage.tsx`. |

---

## VERIFY WHEN YOU SWITCH BACK (recent changes)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 22 | **Verify Hydration Station + Mimosa Bar** — Confirm in UI: (1) Hydration/Coffee/Ice pills show and collapse as expected, (2) "Mimosa Bar" appears in hydration drink options and selecting it prints MIMOSA BAR section on server BEO with mango-peach, cranberry-pineapple-OJ, pineapple-strawberry-raspberry-blueberry rows | Pending | Added Mimosa Bar to `HydrationStationModal` fallback options; BEO outputs mimosa rows when selected. Quick smoke test: create event, set Hydration = Yes, open options, select Mimosa Bar, save, print server BEO. |

---

## INTAKE → BEO PRINT: FLAWLESS FLOW (priority)

**Goal:** Make the flow from intake to BEO print flawless. Use old BEOs as test data: enter each old event as if it were a new client, then compare printed BEO to the original. Fix every glitch, bug, missing food item, and incorrect print.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 23 | **Run old BEOs through intake and compare** — For each old BEO: extract event + menu + bar + hydration + etc., enter into intake (or seed event), generate BEO, diff vs original. Log: missing items, wrong sections, print errors. | Pending | See "How to use old BEOs with an agent" below. |

### How to use old BEOs with an agent

- **Put old BEOs in the repo** so an AI/agent can read them. For example:
  - **Folder:** `docs/old_beos/` or `test_data/old_beos/`
  - **Formats that work best:** (1) **Text or CSV** — e.g. copy-paste from Excel into `.txt` or export to CSV; (2) **Images** — PNG/JPEG of each BEO page (agent can read and describe); (3) **Same format as `BEO_RAW_DUMP.txt`** — if you already have a dump, add more there or as separate files.
- **One file per event** helps: e.g. `old_beos/event_001_clientname.txt` with client name, date, menu sections, bar, hydration, etc. Either structured (headings) or free text the agent can parse.
- **Agent task (when ready):** "For each file in `docs/old_beos/`, extract: client, event date, service style, passed apps, buffet/presented items, stations, bar service, signature drink, hydration options, coffee, ice, dietary, notes. Then either (a) create a seed event or intake checklist for that data, or (b) compare our app's BEO print (for a manually created event matching this data) to the old BEO and list discrepancies (missing line, wrong section, wrong wording)."
- **Limitation:** Full automation (agent creates the event in Airtable and triggers print) would require running the app and/or API. A practical flow: you (or a script) create the event from the extracted data; agent gets the printed BEO output or a saved HTML/PDF and compares it to the old BEO text/image. Or: agent produces a **checklist per old BEO** (what to enter in intake, what should appear on Kitchen BEO, Server BEO, etc.) and you run through and tick off; agent can then help fix any bugs you log.

**Quick start:** Add a few old BEOs (text or images) into `docs/old_beos/`, then in a new chat or agent session: "Use every file in `docs/old_beos/` to validate intake → BEO flow: for each, list what should be entered and what should print; then we'll run one event and fix issues."

---

## LOCKED — Do Not Modify

- **Passed Appetizers** — `.cursor/rules/passed-appetizers-locked.mdc` — Do not touch logic, rendering, or data wiring for Passed Apps.
- **Presented Appetizers** — Same rule; locked with Passed Apps.

## TODO — Lock in Rest of Menu

**We have only locked Passed and Presented Apps.** The rest of the menu (Buffet Metal, Buffet China, Desserts, Stations, Deli, etc.) is **not yet locked** and may change. When ready, create a rule for each section or a combined "menu-sections-locked" rule.

---

## Where Are Boxed Lunches?

Boxed lunches appear in the **DELI - DISPOSABLE** section of the BEO, but **only when**:

1. **Event Type** is **Delivery** or **Pick Up** (otherwise delivery sections don't render).
2. A **Boxed Lunch Order** exists in Airtable and is **linked to the Event** via the **Client/Event** field.
3. The Boxed Lunch Order has **Order Items** (Boxed Lunch Type + Quantity).

**Flow:** `loadBoxedLunchOrdersByEventId(eventId)` → queries Boxed Lunch Orders where `Client/Event` contains the event ID → merges items into DELI section.

**If DELI is empty or missing:** The section is hidden when it has no items. So if there are no DELIVERY_DELI menu items AND no boxed lunch orders, DELI won't appear. Check Airtable: Boxed Lunch Orders table → ensure the test order's Client/Event field links to the event (e.g. Jennifer Vincent).

---

## Reference Docs

| Doc | Contents |
|-----|----------|
| `docs/OMNI_TABLE_SETUP_DELI.md` | Sandwich platters, boxed lunches, individual sandwiches — field values |
| `docs/OMNI_BOXED_LUNCH_SCHEMA.md` | Boxed lunch schema, table/field IDs, integration flow |
| `docs/STATION_CONFIG_WIP.md` | Station config status, what's done vs remaining |
| `src/config/stationPresets.ts` | Station preset options (TEX_MEX, RAMEN, etc.) |
| `src/services/airtable/boxedLunchOrders.ts` | `loadBoxedLunchOrdersByEventId`, constants |

---

## Quick Start When Resuming

1. **Intake → BEO flawless (boss priority):** Item 23 — put old BEOs in `docs/old_beos/`, then use an agent or new chat to validate each: extract data, compare to app print, fix glitches. See "How to use old BEOs with an agent" above.
2. **Verify recent changes:** Item 22 — when you switch back, test Hydration pills and Mimosa Bar (select in options, confirm MIMOSA BAR section on server BEO).
3. **Omni flow:** Items 1–4 (with Omni) and 5–7 (code).
4. **Stations:** When ready, items 8–17 (you verify), then 18 (we fix).
5. **Buffet menu signs:** Item 19 when stations are solid.
6. **Ops Chief — sig drink:** Item 21 when you want expediter to see events with non-standard signature drink items (surface in Ops Chief view).
