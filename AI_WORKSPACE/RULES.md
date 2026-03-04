<!-- Purpose: Contains strict architecture rules and constraints for the EventOps system (ex: Events table is the brain, never guess Airtable field IDs, respect human placement of menu items). -->

# Rules

## Events Table Is the Brain

The **Events table** in Airtable is the central source of truth. All event data flows through it. Event selection, creation, updates, deletion, and linked records (Menu Items, Stations, Client, Staff, Rentals) are all driven by the Events table.

## Airtable Field IDs

- **ALL field IDs** live in `src/services/airtable/events.ts` → `FIELD_IDS` object
- **NEVER** use raw field ID strings — always use `FIELD_IDS.CONSTANT_NAME`
- **NEVER** guess Airtable field IDs or structure
- **NEVER** assign new field names or create Airtable fields without permission
- When a field ID is unknown or missing → use a placeholder (e.g. `fldCoffeeMugTypeTODO`) and document; do not invent IDs

## Computed / Formula Fields — READ ONLY

- **GOLDEN RULE:** Never write to computed fields. Any field ending in `Print` is a formula — read-only.
- Examples: `VenuePrint`, `EventLocationPrint`, `ClientNamePrint`, `ContactPrint`, `EVENT_NAME`, `CLIENT_BUSINESS_NAME`, `VENUE_FULL_ADDRESS`
- Only write to source fields (Venue, Client Address, City/State, etc.). Print fields calculate automatically.
- `updateEventMultiple()` must filter these out before PATCH (via `filterToEditableOnly` and `SAVE_WHITELIST`)

## Human Placement Is Gospel

- The Spec Engine and menu logic read: Passed Appetizers → Presented Appetizers → Buffet Metal → Buffet China → Desserts
- **NEVER** move items between sections, reinterpret placement, infer placement, or change vessel type
- If placement is unclear → output **UNKNOWN** — requires human decision
- **Overrides are sacred** — if a human has entered quantity, vessel, or notes, leave it untouched; never recalc or normalize

## Respect Human Placement of Menu Items

- Menu Items table: `tbl0aN33DGG6R1sPZ`
- Items **without** Service Type are **invisible** in the picker
- Sacred placement order: Passed Apps → Presented Apps → Buffet Metal → Buffet China → Desserts
- Human placement is gospel; never infer placement

## One Intake System

- **ONLY** use `/beo-intake/:eventId` → `src/components/beo-intake/*`
- Old intake at `src/components/intake/` is **DEPRECATED** — do not use
- Quick Intake creates event → redirects to BEO Full Intake

## Input Pattern — Mandatory

- **Text inputs:** Local state + `onBlur` save. **NEVER** save on every keystroke (causes cursor jumping + Airtable spam)
- **Dropdowns, checkboxes, time pickers:** Save on `onChange`

## BEO Print

- **DO NOT** add designer notes to BEO print
- Kitchen BEO: 2 columns (Spec | Item Name), no designer notes
- One item per line always; sauces indented under parent

## DO NOT

- Assign new field names
- Create new Airtable fields without permission
- Write to Print/formula fields
- Use raw field ID strings (use `FIELD_IDS`)
- Maintain two intake systems
- Add designer notes to BEO print
- Guess field IDs or structure
- Move or reinterpret menu item placement

## System Alignment Protocol

When the user says:

"Let's get everyone aligned"

This means the following synchronization procedure:

1. Update documentation files if architecture changed:
   • RULES.md
   • BUILD_STATE.md
   • EVENTOPS_ARCHITECTURE.md

2. Run codebase alignment check in Cursor:

Prompt:
Review the AI_WORKSPACE files and confirm they match the current codebase and Airtable schema.

3. Run schema alignment check in Airtable Omni:

Prompt:
Re-run schema audit and verify architecture alignment with EVENTOPS_ARCHITECTURE.md

Purpose:
Ensure the three system layers remain synchronized:

• Airtable database schema  
• EventOps application code  
• AI_WORKSPACE architecture documentation
