# Use Cursor + Scripts to Do the Legwork (So You Don’t Have to Live in Airtable)

You have Cursor Pro Plus and want to move fast without another 11 months of clicking through Airtable. Here’s how to **minimize** (and in many cases **avoid**) manual table/field work, and how to use **Cursor’s AI** to do most of the implementation.

---

## 1. Create DELI fields without touching the Airtable UI

You already have a **schema script** that talks to Airtable’s Metadata API. It can **create fields on the Events table** for you.

### One command for all three DELI fields

From the project root:

```bash
npm run schema ensure-deli-fields
```

This will:

- Create **Custom Delivery DELI** (Long Text) on Events if it doesn’t exist  
- Create **DELI (Full Service)** (linked to Menu Items) on Events if it doesn’t exist  
- Create **Custom DELI (Full Service)** (Long Text) on Events if it doesn’t exist  
- Print the **new field IDs** and exact lines to add to `src/services/airtable/events.ts`

You do **not** need to open Airtable and add these by hand. You only need to:

1. Run the command (once).
2. Copy the printed IDs into `events.ts` (FIELD_IDS, SAVE_WHITELIST, remove placeholder from PLACEHOLDER_FIELD_IDS).

**Token requirement:** Your Airtable token must have **schema** write access (e.g. **schema.bases:write** or “Create tables and fields” in the token scopes). If the script fails with 403, edit the token at [airtable.com/create/tokens](https://airtable.com/create/tokens) and add that scope.

---

## 2. Other fields: same script, no UI

For **any other new field on the Events table** (single line, long text, number, select, etc.) you can use:

```bash
npm run schema add "Field Name" "fieldType"
```

Examples:

- `npm run schema add "Customer Notes" "multilineText"`
- `npm run schema add "Priority" "singleSelect"` (you may need to add options in Airtable later, or the API may support it)

So: **Events table fields** = script. You only open Airtable when you need something the script can’t do (e.g. a new **table**, or a field type the Metadata API doesn’t support the way you want).

**Linked record fields** beyond DELI: the script’s `ensure-deli-fields` is an example of creating a `multipleRecordLinks` field. If you need another linked field later, you can ask Cursor: “Add a command to updateAirtableSchema.js that creates a field named X linked to table Y” and paste in the script; then run it. No need to memorize the API.

---

## 3. Use Cursor to do the code changes (not you)

Your job: **decide what you want** and **run the script / paste the IDs**. Let Cursor do the implementation.

### What to ask Cursor (Composer or Agent)

- **“Add the DELI section to the full-service BEO using FULL_SERVICE_DELI and CUSTOM_FULL_SERVICE_DELI”**  
  Reference: `docs/ROADMAP_BEO_INTAKE_AND_UI.md`, `docs/BEO_FULL_SERVICE_STATIONS_AND_PICKERS.md`. The AI can wire the new fields into the BEO build and render items in the same “main + indented children” format.

- **“Wire the intake UI to FULL_SERVICE_DELI and CUSTOM_FULL_SERVICE_DELI so we can add/edit/delete DELI items for full-service events”**  
  The AI can add a DELI block (or extend the menu section), use the same picker/save pattern as Delivery DELI, and hook it to the new field IDs.

- **“Implement the grouped card + sub-menu pattern for platters like we have for creation stations”**  
  Reference: `docs/BEO_FULL_SERVICE_STATIONS_AND_PICKERS.md` §4. The AI can refactor platter UI to match.

- **“Add the three DELI field IDs from the schema script output into events.ts (FIELD_IDS, SAVE_WHITELIST, remove fldCustomDeliTODO from PLACEHOLDER_FIELD_IDS)”**  
  You paste the IDs from the script output; the AI does the edits.

- **“Audit BeoIntakePage sections and list every field that should appear on the BEO and whether it’s editable and saved to Airtable”**  
  That gives you a checklist (Track D in the roadmap) without you scanning the whole form by hand.

So: **you** define the goal and run the script; **Cursor** writes the code and follows the existing docs/patterns.

---

## 4. When you *do* need to touch Airtable

Minimize it:

- **New table (e.g. Platter Orders):** The Metadata API can create tables in some plans; if not, you may need to create the table once in the UI (or ask your boss/Omni to create it) and then have the script or Cursor add fields to that table if the API supports it. Everything else (app code, linking, BEO) Cursor can do.
- **Formulas / rollups / lookups:** Usually created in the UI. The app only needs to **not write** to them; the codebase already marks formula fields in FIELD_IDS. So you’re not “redesigning” them every time—you add them once, document the field ID, and the app stays read-only.
- **One-off fixes:** If a field type or option set is wrong, fix it once in Airtable and tell Cursor: “We now have a field X with options A, B, C; update the code that uses it.”

So: **Airtable** = minimal, targeted changes (new table once, formula once, fix once). **Cursor** = all the wiring, BEO logic, and UI.

---

## 5. Suggested flow so “not today chief” doesn’t last forever

1. **Today (or this week)**  
   - Run: `npm run schema ensure-deli-fields`.  
   - Paste the printed IDs into `events.ts` (or ask Cursor to do it: “Here are the three field IDs from the schema script: …; add them to events.ts as in the script instructions”).  
   - Ask Cursor: “Add the DELI section to the full-service Kitchen and Server BEO using FULL_SERVICE_DELI and CUSTOM_FULL_SERVICE_DELI, same format as other menu sections.”  
   - You’re done with DELI on the BEO and in the schema; **no Airtable UI** for those three fields.

2. **Next**  
   - Ask Cursor to add the full-service DELI block to the intake UI and wire it to the new fields.  
   - Use the roadmap for the rest: platters (grouped card + sub-menu), then full intake audit, then delivery/pickup. For each chunk, **you** describe the goal and reference the doc; **Cursor** implements.

3. **Platter Orders table**  
   - If you need a Platter Orders table and want to avoid building it by hand: ask Cursor to “Add a script that creates a Platter Orders table and Platter Order Items table with the right links (to Events / to each other) via the Airtable Metadata API if possible, or output step-by-step instructions for creating them in the UI once.” Then you either run the script or do the UI once and move on.

---

## 6. Summary

- **DELI fields:** One command: `npm run schema ensure-deli-fields`. No Airtable UI.  
- **Other Events fields:** `npm run schema add "Name" "type"`. No UI.  
- **Code and BEO and UI:** Ask Cursor, with references to `ROADMAP_BEO_INTAKE_AND_UI.md`, `BEO_FULL_SERVICE_STATIONS_AND_PICKERS.md`, and the schema script output.  
- **Airtable UI:** Only when you really need a new table or a formula/rollup the API can’t create. Do it once; let Cursor own the rest.

So: you don’t have to “call your boss and say not today”—you can move ASAP by running the script and pointing Cursor at the roadmap and the docs. The script does the Airtable legwork for DELI; Cursor does the implementation legwork.
