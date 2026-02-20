# FoodWerx EventOps — Copilot Context

## System Architecture
- Vite + React + TypeScript app
- Airtable backend (Events table: `tblYfaWh67Ag4ydXq`, Menu Items table: `tbl0aN33DGG6R1sPZ`)
- Zustand state management (`src/state/eventStore.tsx`)
- Deployed on Vercel

## ONE Intake System
- **ONLY** use `/beo-intake/:eventId` → `src/components/beo-intake/*`
- Old intake at `src/components/intake/` is DEPRECATED — do not use
- Quick Intake creates event → redirects to BEO Full Intake

## Field IDs — Source of Truth
- ALL field IDs live in `src/services/airtable/events.ts` → `FIELD_IDS` object
- NEVER use raw field ID strings — always use `FIELD_IDS.CONSTANT_NAME`
- NEVER write to computed/formula fields

## Computed Fields — READ ONLY, NEVER WRITE
- `EVENT_NAME` (`fldZuHc9D29Wcj60h`) — Formula
- `CLIENT_BUSINESS_NAME` (`fld4YxQOjzPyyBIHL`) — Formula
- `VENUE_FULL_ADDRESS` (`fldOKQTp8Zf6a462f`) — Formula (VenuePrint)
- ANY field ending in "Print" is a formula — NEVER write to it
- `updateEventMultiple()` must filter these out before PATCH

## Menu Items — How They Work
- Menu Items table: `tbl0aN33DGG6R1sPZ`
- Display name field: `fldQ83gpgOmMxNMQw` (Description Name/Formula)
- Service Type field: `fld2EhDP5GRalZJzQ` (determines picker category)
- Vessel Type field: `fldZCnfKzWijIDaeV` (Metal vs China for buffet)
- Items WITHOUT Service Type are INVISIBLE in the picker
- Sacred placement order: Passed Apps → Presented Apps → Buffet Metal → Buffet China → Desserts

## BEO Print Page — 3 Views
- Route: `/beo-print/:eventId`
- 🍳 Kitchen BEO: 2 columns (Spec | Item Name), no designer notes
- 📐 Spec View: 3 columns (Auto-spec | Item Name | Editable override)
- 📦 Pack-Out View: 2 columns (Item Name | Editable pack-out items)
- Header: Date top-left, Client/Phone/Address left, Guests/Start/End/Arrival right
- Dispatch + Job # centered large font between header and allergy banner
- Color-coded section borders: green=apps, orange=buffet-metal+desserts, blue=buffet-china
- One item per line ALWAYS. Sauces indented under parent.

## Kitchen Logic
- `Kitchen On-Site?` (`fldSpUlS9qEQ5ly6T`) — Single select: Yes/No
- `Food Must Go Hot` (`fldJFB69mmB5T4Ysp`) — Checkbox
- When No Kitchen + Hot checked → "ALL FOOD MUST GO HOT" banner on BEO

## Timeline Fields
- `DISPATCH_TIME`: `fldbbHmaWqOBNUlJP`
- `EVENT_START_TIME`: `fldDwDE87M9kFAIDn`
- `EVENT_END_TIME`: `fld7xeCnV751pxmWz`
- `FOODWERX_ARRIVAL`: `fldMYjGf8dQPNiY4Y`

## BEO Extra Fields
- `BEO_NOTES`: `fldnGtJVWf4u39SHI` (Long text)
- `BEO_TIMELINE`: `fld6Z6xw9ciygqyff` (Long text)
- `PARKING_LOAD_IN_NOTES`: `fldqXqiwryBHhJmUc` (Long text)

## Input Pattern — MANDATORY
- All text inputs use LOCAL STATE + onBlur save
- NEVER save on every keystroke (causes cursor jumping + Airtable spam)
- Dropdowns, checkboxes, and time pickers save on onChange (that's fine)

## Delivery Events
- When Event Type = "Delivery", venue section labels change:
  - "Venue Name" → "Business / Location Name"
  - "Venue Address" → "Delivery Address"
  - Show Delivery Notes textarea
- Same Airtable fields underneath — only labels change

## Job # Logic
- Auto-generated from dispatch time, resets daily
- Format: clientName + " – " + eventDate (temporary)
- Future: MMDDYY-sequence based on dispatch order

## DO NOT
- Assign new field names
- Create new Airtable fields without permission
- Write to Print/formula fields
- Use raw field ID strings (use FIELD_IDS)
- Maintain two intake systems
- Add designer notes to BEO print
- Guess field IDs or structure