# How Bar Mixers and Garnishes Write-Back and Show on Output

## Write-back (Intake → Airtable)

1. **Intake UI**  
   - **Full Bar → Signature Drink** (Foodwerx supplying): user types in two **text inputs**:
     - **Mixers** → saved to `FIELD_IDS.BAR_MIXERS` (`fldXL37gOon7wyQss`)
     - **Garnish** → saved to `FIELD_IDS.BAR_GARNISHES` (`flduv4RtRR0lLm4vY`)
   - On every change: `saveSingle(FIELD_IDS.BAR_MIXERS, e.target.value)` and `saveSingle(FIELD_IDS.BAR_GARNISHES, e.target.value)`.

2. **Store**  
   - `saveSingle(fid, val)` calls `save({ [fid]: val })` → `setFields(selectedEventId, patch)`.

3. **Event store**  
   - `setFields` → `updateEvent(eventId, patch)` → `filterToEditableOnly(patch)` then `updateEventMultiple(eventId, filtered)`.

4. **Airtable API**  
   - In `updateEventMultiple`, `BAR_MIXERS` and `BAR_GARNISHES` are **not** single-select or dateTime, so they fall through to:
     - `filteredFields[key] = value;`
   - The **exact string** (including any characters you type) is sent in the PATCH body:
     - `{ records: [{ id: recordId, fields: { [fieldId]: value } }] }`
   - Airtable stores that string in the Long text field as-is (no app-side formatting or parsing).

So: **whatever you type in the Mixers and Garnish inputs is written verbatim to the two Events long-text fields.** There is no comma splitting, no newline handling, and no other transformation on write.

---

## Read-back and output (Airtable → BEO)

1. **Loading event data**  
   - `loadEventData` fetches the record; Airtable returns `fields[BAR_MIXERS]` and `fields[BAR_GARNISHES]` as strings (same as stored).

2. **BEO print pages**  
   - They read:
     - `signatureDrinkMixers = asString(eventData[FIELD_IDS.BAR_MIXERS])`
     - `signatureDrinkGarnishes = asString(eventData[FIELD_IDS.BAR_GARNISHES])`
   - `asString()` returns the stored string (or `""` if missing).

3. **How they’re shown**
   - **Server BEO (BeoPrintPage, page 2)**  
     - One row per field, label + full string, uppercased:
     - `SIGNATURE MIXERS: ${signatureDrinkMixers.toUpperCase()}`
     - `SIGNATURE GARNISHES: ${signatureDrinkGarnishes.toUpperCase()}`
   - **Kitchen BEO (KitchenBEOPrintPage)**  
     - In the BEVERAGES — MIXERS section, one line per field:
     - `Signature Mixers: ${sigDrinkMixers.trim()}`
     - `Signature Garnishes: ${sigDrinkGarnishes.trim()}`

So: **the output shows exactly the string stored in Airtable**, but each field is always rendered as **one line** (one row on the Server BEO, one line in the Kitchen BEO section). Newlines in the stored string are **not** split into multiple rows/lines; they would appear as literal line breaks in the printed text if the field contained newlines (and the intake currently uses `<input type="text">`, so users typically don’t enter newlines).

---

## Summary

| Step | What happens |
|------|------------------|
| **Intake** | User types in Mixers and Garnish **text inputs** → value is the raw string. |
| **Save** | `setFields(eventId, { BAR_MIXERS: value, BAR_GARNISHES: value })` → `updateEventMultiple` → PATCH to Airtable with that string. |
| **Airtable** | Long text fields store the string exactly as received. |
| **BEO** | Values read with `asString(...)` and printed as one line each: “SIGNATURE MIXERS: …” and “SIGNATURE GARNISHES: …” (Server) or “Signature Mixers: …” / “Signature Garnishes: …” (Kitchen). |

So mixers and garnishes **do** show up on the output exactly as stored in Airtable — same characters, same order — but each field is displayed as a **single line**. If you want multiple lines on the BEO (e.g. one item per line), you’d either:

- Use a **textarea** in the intake and split the stored string by newlines on the print side, rendering each line as its own row, or  
- Keep a single line and use a delimiter (e.g. comma) in the string; the app does not currently split on commas for display (it’s one string per field).
