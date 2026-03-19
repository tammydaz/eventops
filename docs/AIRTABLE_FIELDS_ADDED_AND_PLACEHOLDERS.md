# Airtable Fields — What’s in the Code vs Placeholders

**Why use Airtable fields:** So everyone (home + office) sees the same data. Nothing critical lives only in the app or localStorage. See `docs/LOCALSTORAGE_AND_AIRTABLE_AUDIT.md` for the full scan.

---

## Fields already in Airtable and in code

These are in `src/services/airtable/events.ts` with **real field IDs** and in **SAVE_WHITELIST** (so the app reads and writes them).

| Purpose | FIELD_IDS key | Notes |
|--------|----------------|-------|
| **Custom Delivery DELI** | `CUSTOM_DELIVERY_DELI` | Long Text on Events |
| **Full-Service DELI** | `FULL_SERVICE_DELI` | Linked to Menu Items |
| **Custom Full-Service DELI** | `CUSTOM_FULL_SERVICE_DELI` | Long Text |
| **Bar service** | `BAR_SERVICE` / `BAR_SERVICE_NEEDED`, signature drink, mixers, garnishes | Confirmed IDs |
| **Hydration** | `HYDRATION_STATION_*`, drink options, notes | New hydration pills |
| **Menu sections** | Passed, Presented, Buffet Metal/China, Desserts, DELI (full + delivery) | All in SAVE_WHITELIST |

The “scan” that identified what to add is reflected in:

- **FIELD_IDS** — real IDs for DELI, bar, hydration, etc.
- **SAVE_WHITELIST** — same IDs so saves go to Airtable.
- **Docs:** `AIRTABLE_FULL_SERVICE_DELI_AND_PLATTERS.md`, `LOCALSTORAGE_AND_AIRTABLE_AUDIT.md`, `CURSOR_AIRTABLE_FIELD_REFERENCE.md`.

---

## Placeholders (create in Airtable, then replace in code)

These are in **PLACEHOLDER_FIELD_IDS** and are **stripped on save** until you add the field in Airtable and put the real ID in the code.

| FIELD_IDS key | Current value | In Airtable: create… |
|---------------|----------------|----------------------|
| `CUSTOM_ROOM_TEMP_DISPLAY` | `fldCustomRoomTempTODO` | Long Text on Events (e.g. “Custom Room Temp Display”) |
| `COFFEE_MUG_TYPE` | `fldCoffeeMugTypeTODO` | Single Select: Standard / Premium / Irish (or your options) |
| `CARAFES_PER_TABLE` | `fldCarafesPerTableTODO` | Number (e.g. for China service) |

After creating each field:

1. In `events.ts`: replace the `fld...TODO` value with the real field ID.
2. Add that ID to **SAVE_WHITELIST**.
3. Remove the placeholder from **PLACEHOLDER_FIELD_IDS**.

---

## Quick check “is it only on the app?”

- **Event/menu/bar data** the app saves → must be in **SAVE_WHITELIST** and backed by real Airtable fields so office and home see the same data.
- **Still only on the app** until you migrate: platter orders (localStorage), sauce overrides (localStorage), BEO spec overrides / pack-out edits / check state (localStorage). See `LOCALSTORAGE_AND_AIRTABLE_AUDIT.md` for the list and migration options.
