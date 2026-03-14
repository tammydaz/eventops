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
| 5 | **BEO merge: Boxed lunches on Kitchen BEO** — Call `loadBoxedLunchOrdersByEventId`, add items to DELI section for delivery events | `KitchenBEOPrintPage.tsx` | Pending | Render rows like "Classic Boxed Lunch — 30" |
| 6 | **BEO merge: Boxed lunches on BeoPrintPage** — Same for delivery BEO if it has a DELI section | `BeoPrintPage.tsx` | Pending | Check delivery section config |
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

## LOCKED — Do Not Modify

- **Passed Appetizers** — `.cursor/rules/passed-appetizers-locked.mdc` — Do not touch logic, rendering, or data wiring for Passed Apps.

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

1. **Omni flow:** Start with items 1–4 (with Omni) and 5–7 (code).
2. **Stations:** When ready, go through items 8–17 (you verify), then 18 (we fix).
3. **Buffet menu signs:** Item 19 when stations are solid.
