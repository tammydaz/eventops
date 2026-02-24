# ✅ VENUE ADDRESS / "VenuePrint" FIX — COMPLETE

## The Problem

**Error:** `Field "VenuePrint" cannot accept a value because the field is computed`

**Root Cause:**  
`FIELD_IDS.VENUE_ADDRESS` was pointing to the **computed formula field** (`fldJsajSl1l6marzw`) instead of the **writable user input field** (`fldj02emPUYZWau2m`).

Every time a user typed in the venue address field in the BEO Intake forms, the code was attempting to write to a READ-ONLY formula field, causing the Airtable API to reject the request.

---

## The Fix

### Changed in `src/services/airtable/events.ts`:

#### BEFORE (BROKEN):
```typescript
VENUE_ADDRESS: "fldJsajSl1l6marzw",  // ❌ This was the COMPUTED field!
```

#### AFTER (FIXED):
```typescript
VENUE_ADDRESS: "fldj02emPUYZWau2m",  // ✅ WRITABLE user input field

// Added explicit computed field constants:
VENUE_FULL_ADDRESS: "fldOKQTp8Zf6a462f",       // Formula: "Venue Full Address (Clean)"
EVENT_LOCATION_FINAL_PRINT: "flddestyZNoX9sKGE", // Formula: "Event Location (Final Print)"
PRINT_VENUE_ADDRESS: "fldJsajSl1l6marzw",      // Formula: "VenuePrint" - THE BUG!
PRINT_ADDRESS_BLOCK: "fldJsajSl1l6marzw",      // Formula (same as above) - READ ONLY
```

#### Updated Computed Field Filter:
```typescript
const COMPUTED_FIELD_IDS = new Set([
  "fldZuHc9D29Wcj60h",  // EVENT_NAME
  "fld4YxQOjzPyyBIHL",  // CLIENT_BUSINESS_NAME
  "fldOKQTp8Zf6a462f",  // VENUE_FULL_ADDRESS (Venue Full Address Clean)
  "flddestyZNoX9sKGE",  // EVENT_LOCATION_FINAL_PRINT
  "fldJsajSl1l6marzw",  // PRINT_VENUE_ADDRESS (VenuePrint) - THE REAL CULPRIT!
]);
```

### Also updated in `src/airtable.js` (legacy file):

```javascript
const COMPUTED_FIELDS = [
  "fldZuHc9D29Wcj60h",  // EVENT_NAME
  "fld4YxQOjzPyyBIHL",  // CLIENT_BUSINESS_NAME
  "fldOKQTp8Zf6a462f",  // VENUE_FULL_ADDRESS
  "flddestyZNoX9sKGE",  // EVENT_LOCATION_FINAL_PRINT
  "fldJsajSl1l6marzw",  // PRINT_VENUE_ADDRESS (VenuePrint)
];
```

---

## FoodWerx Venue Address Field Map (Golden Reference)

### ✅ WRITABLE Fields (User Input):
| Field Name     | Field ID            | Used In          |
|----------------|---------------------|------------------|
| Venue Name     | `fldK8j9JRu0VYCFV9` | Intake Forms     |
| Venue Address  | `fldj02emPUYZWau2m` | Intake Forms ✅  |
| Venue City     | `fldNToCnV799eggiD` | Intake Forms     |
| Venue State    | `fldxCz5cPLwCetb0C` | Intake Forms     |

### 🔒 READ-ONLY Fields (Computed/Formula):
| Field Name                      | Field ID            | Used In       |
|---------------------------------|---------------------|---------------|
| Venue Full Address (Clean)      | `fldOKQTp8Zf6a462f` | Print Pages   |
| Event Location (Final Print)    | `flddestyZNoX9sKGE` | Print Pages   |
| VenuePrint / PRINT_ADDRESS_BLOCK| `fldJsajSl1l6marzw` | Print Pages   |

---

## Impact

All forms using `FIELD_IDS.VENUE_ADDRESS` now write to the **correct writable field**.  
The computed "VenuePrint" field is **blocked** from write operations in both:
- `updateEventMultiple()` in `src/services/airtable/events.ts`
- `updateEvent()` in `src/airtable.js`

---

## Testing

Test the venue address input in:
1. ✅ **Quick Client Intake** (`/quick-intake`)
2. ✅ **BEO Full Intake** — Venue Details Section (`/beo-intake`)

Both should now save venue address changes without errors.

---

**Fixed:** 2026-02-16  
**Root Cause:** Field ID mismatch (writable vs computed)  
**Status:** ✅ RESOLVED
