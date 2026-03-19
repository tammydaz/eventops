# localStorage Audit + Where Your Airtable Setup Is Documented

You don’t have to “recall” how you set everything up. The app and docs already encode most of it. This file is your **single scan**: what’s in localStorage (and what should move to Airtable for multi-user), and **where** the tables/fields/links are documented so you’re not digging from memory.

---

## Part 1: Everything That Uses localStorage

Here’s **every** place the app uses localStorage, what it stores, and whether it’s **shared event data** (needs to sync across people/devices) vs **UI/worksheet state** (per-device, less critical but still only on that browser).

| Where in code | What’s stored | Key pattern | Shared? | Notes |
|---------------|----------------|-------------|--------|--------|
| **platterOrdersStore.ts** | Sandwich platter orders (platter type, qty, picks) per event | `eventops-platter-orders` → `{ [eventId]: PlatterRow[] }` | **Yes** | **Must move to Airtable** for home + office. Right now only the person on this computer sees these platters. |
| **sauceOverrideStore.ts** | Per-item sauce overrides (“Default” / “None” / “Other” + custom text) per event | `beo-sauce-overrides-{eventId}` | **Yes** | Event data. Ideally in Airtable (e.g. Menu Item Specs or an overrides field) so everyone sees same sauces. |
| **BeoPrintPage.tsx** | Spec overrides, pack-out edits, check state (checkboxes) per event | `beo-spec-overrides-{eventId}`, `beo-packout-edits-{eventId}`, `beo-check-state-{eventId}` | **Yes** | BEO worksheet state. If multiple people print/check the BEO, they won’t see each other’s overrides/checks unless this moves to Airtable (or a backend). |
| **KitchenBEOPrintPage.tsx** | Check state (checkboxes) per event | Same check key as above (CHECK_STORAGE_KEY(selectedEventId)) | **Yes** | Same as above — BEO checklist. |
| **FeedbackIssuesPage.tsx** | “Last seen resolved” timestamp for feedback UI | `feedback-last-seen-resolved` | **No** | Purely UI (when to show “new” resolved items). Fine to keep in localStorage. |

**Summary**

- **Must fix for multi-user / work-from-home:**  
  - **Platter orders** → move to Airtable (Platter Orders table or similar).  
  - **Sauce overrides** → move to Airtable if you want them shared (e.g. per-event overrides table or field).  
  - **Spec overrides, pack-out edits, BEO check state** → move to Airtable (or another shared store) if more than one person needs to see the same overrides and checkboxes.
- **OK to leave in localStorage for now:**  
  - **Feedback “last seen”** — UI-only, not event data.

So you’re not scanning the whole app blindly: there are **5 places** that use localStorage. **4 of them** are event-related and don’t sync across devices; **1** is harmless UI state.

---

## Part 2: Where Your Airtable Setup Is Documented (So You Don’t Have to “Recall”)

You don’t have to remember every table and formula. It’s already written down here and in the code.

### In the codebase

| What | Where | What it tells you |
|------|--------|-------------------|
| **Events table – every field the app knows** | `src/services/airtable/events.ts` → `FIELD_IDS` | Field IDs and comments like `// Formula - READ ONLY` or `// Linked to Menu Items`. So you can see which fields are formulas (don’t write) and which are links. |
| **Which fields are safe to write to** | Same file → `SAVE_WHITELIST` | Only these field IDs are sent on PATCH. If it’s not here, the app won’t save to it (or it’s stripped). |
| **Placeholder fields (not in Airtable yet)** | Same file → `PLACEHOLDER_FIELD_IDS` | e.g. `fldCustomDeliTODO`, `fldCoffeeMugTypeTODO` — create these in Airtable and replace the ID. |
| **Menu Items table** | Same file → `FIELD_IDS.MENU_ITEM_*`; also `src/constants/menuCategories.ts` | Field IDs for name, category, child items, etc. Categories that drive pickers. |
| **Stations table** | `src/services/airtable/linkedRecords.ts` (and client) → `getStationsTable()`, `getStationsFieldIds()` | Stations table name/ID and field IDs (Event, Station Type, Station Items, etc.). |
| **Boxed Lunch** | `src/services/airtable/boxedLunchOrders.ts` | Table IDs and field IDs for Boxed Lunch Orders + Boxed Lunch Order Items; link to Events via `clientEvent`. |
| **Station Presets / Station Components** | `src/services/airtable/stationComponents.ts`, `linkedRecords.ts` | Presets and components tables and how they’re used. |

So: **tables and links** are encoded in the client and in these service files. **Formulas** are mostly identified by comments in `FIELD_IDS` (e.g. “Formula - READ ONLY”). If you need the exact formula text, that lives in Airtable; the app only cares “don’t write here.”

### In the docs folder

| Doc | What it covers |
|-----|-----------------|
| **CURSOR_AIRTABLE_FIELD_REFERENCE.md** | Fields the app reads, Menu Items + Stations + Events menu fields, categories for pickers. |
| **AIRTABLE_MENU_ITEMS_SCHEMA.md** | Menu Items table (fields, parent/child), Bar Components, Station Components, Station Presets, Stations. |
| **OMNI_BOXED_LUNCH_SCHEMA.md** | Boxed Lunch Orders + Order Items + Customizations; links to Events; how it fits with Menu Items. |
| **AIRTABLE_FULL_SERVICE_DELI_AND_PLATTERS.md** | What to add in Airtable for full-service DELI and platters (fields, optional Platter Orders table). |
| **OMNI_TABLE_SETUP_DELI.md** | DELI/sandwich/platter setup in Airtable (if present). |
| **FEEDBACK_SETUP.md** / **FEEDBACK_TABLE_OMNI_PROMPT.md** | Feedback table setup. |
| **AIRTABLE_STATION_SCHEMA_FIXES.md**, **STATION_CONFIG_WIP.md**, **OMNI_PROMPT_STATION_SETUP.md** | Station-related schema and setup. |

So: **you don’t have to “recall” how you set up most of it.** Use this list and the code as the source of truth. When in doubt: open `events.ts` for Events fields and read-only vs writable; open the service file for the feature (e.g. boxedLunchOrders, linkedRecords) for that table’s structure and links.

### How to see formulas and links in Airtable itself

- **Links:** In Airtable, open the table → click a linked field → you see the target table name and which field is used for the link. The app’s field IDs point to these same fields.
- **Formulas:** In Airtable, open the field configuration; the formula is there. The app only needs to know “this field is formula — don’t write to it,” which is already in `FIELD_IDS` comments.
- **Full schema export (optional):** You can use Airtable’s **Metadata API** (base schema) to dump tables and fields and their types; that gives you a list of every field and whether it’s formula, link, etc., without clicking through the UI.

---

## Part 3: Quick Checklist So Nothing’s Only in localStorage

- [ ] **Platter orders** — Move to Airtable (Platter Orders table or Events field). Highest impact for “same data at home and in office.”
- [ ] **Sauce overrides** — Decide: shared or per-device? If shared, add field/table in Airtable and wire the app.
- [ ] **Spec overrides / pack-out edits / BEO check state** — Same: if multiple people need to see the same state, move to Airtable (or backend).
- [ ] **Feedback “last seen”** — Can stay in localStorage (UI-only).

You’re not sick — you just needed one place that says “here’s every localStorage use” and “here’s where the Airtable setup is already written down.” This file is that place.
