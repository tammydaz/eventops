# Airtable: Bar Service Options and Mixers/Garnish Fields

All of these fields live in your **Events** table (the table ID is set by `VITE_AIRTABLE_EVENTS_TABLE` in your env).

---

## 1. Bar Service options (dropdown)

**Table:** **Events**  
**Field ID in code:** `BAR_SERVICE` / `BAR_SERVICE_NEEDED`  
**Airtable field ID:** `fldXm91QjyvVKbiyO`  
**Typical Airtable name:** “Bar Service Needed” (or similar)

**Type:** Multi-select (so you can choose e.g. Full Bar Package and Mimosa Bar together).

**Where options come from:** The app loads options from Airtable for this field and merges them with a fallback list. To have **Mimosa Bar** (and any other option) appear in the dropdown:

1. In Airtable, open your **Events** table.
2. Find the field whose ID is `fldXm91QjyvVKbiyO` (or the field named like “Bar Service Needed”).
3. Edit that **Single select** field and add **Mimosa Bar** as a new choice.

No other tables or fields are used for the Bar Service dropdown options; they are the choices on this one Single select field in Events.

---

## 2. Signature drink mixers and garnishes (Full Bar / intake)

**Table:** **Events** (same as above)

| Purpose | Code constant | Airtable field ID | Typical name in Airtable |
|--------|----------------|--------------------|---------------------------|
| Signature Drink mixers (free text) | `BAR_MIXERS` | `fldXL37gOon7wyQss` | Signature Drink Mixers |
| Signature Drink garnishes (free text) | `BAR_GARNISHES` | `flduv4RtRR0lLm4vY` | Signature Drink Garnishes |

**Type:** Long text (or similar); the app reads/writes plain text.

These are used when **Bar Service = Full Bar Package** and **Signature Drink = Yes** (Foodwerx supplying). They are **not** used to define the Mimosa Bar juices or fruit garnish; those are fixed in the app in `fullBarPackage.ts`.

---

## 3. Linked-record fields (if you use them)

**Table:** **Events**

| Purpose | Code constant | Airtable field ID | Notes |
|--------|----------------|--------------------|--------|
| Bar mixer items (linked records) | `BAR_MIXER_ITEMS` | `fldWj4wQIwIkz0rjg` | Linked to another table (e.g. Bar Components) |
| Bar garnish items (linked records) | `BAR_GARNISH_ITEMS` | `fldIPOF7dPSZWANg6` | Linked to another table (e.g. Bar Components) |

The app’s **Full Bar** and **Mimosa Bar** mixer/garnish **tables in the UI** (Auto speck | Items | Override) are driven by constants in code (`FULL_BAR_PACKAGE_SPECK_ROWS`, `MIMOSA_BAR_JUICES_ROWS`, `MIMOSA_BAR_FRUIT_GARNISH_ROW`), not by these Airtable fields. So you don’t need to add Mimosa Bar data into Airtable for those tables to work.

---

## 4. Adding Mimosa Bar and making it show on Kitchen BEO

The Bar Service field is **multi-select**. For Mimosa Bar fruit to appear on the **Kitchen BEO** (under DESSERTS), do the following.

### In Airtable (Events table)

1. Open the **Events** table.
2. Find the field **“Bar Service Needed”** (ID `fldXm91QjyvVKbiyO`). It must be **Multi-select** (not Single select).
3. **Field options:** Ensure **“Mimosa Bar”** exists as one of the choices (add it if missing). Spelling/casing can vary; the app matches “mimosa bar” case-insensitively.
4. **Per event:** For each event that has a Mimosa Bar, **select “Mimosa Bar”** in that record’s Bar Service field (you can also select “Full Bar Package”, etc.). The field must have at least “Mimosa Bar” checked for that event.

### In the app (BEO Intake)

1. Open the event in **BEO Intake**.
2. Under **Bar Service**, expand **“Select all that apply”** and **check “Mimosa Bar”**.
3. The app saves the selection to Airtable as a multi-select value (e.g. `["Mimosa Bar"]` or `["Full Bar Package", "Mimosa Bar"]`).

Once the event has **Mimosa Bar** in Bar Service (saved either from the app or directly in Airtable), the **Kitchen BEO** will list the mimosa fruit garnish items (Strawberries, Blueberries, Raspberries, Blackberries, Orange slices) under **DESSERTS**.

---

## 5. Quick reference: Bar-related field IDs (Events table)

| Field ID | Used for |
|----------|----------|
| `fldXm91QjyvVKbiyO` | Bar Service Needed (single select) — **add “Mimosa Bar” here** |
| `fldcry8vpUBY3fkHk` | Signature Drink? (Yes/No) |
| `fldZSIBTkzcEmG7bt` | Signature Drink Name |
| `fld1sg6vQi7lziPDz` | Signature Drink Recipe & Ingredients |
| `fldoek1mpdi2ESyzu` | Who supplies signature drink mixers/garnishes (Foodwerx/Client) |
| `fldXL37gOon7wyQss` | Signature Drink Mixers (free text) |
| `flduv4RtRR0lLm4vY` | Signature Drink Garnishes (free text) |
| `fldQXaTtw94L6AGR0` | Bar Service Print Block (often formula) |
| `fldrziYkLGiUcKHbT` | Bar Service Summary (often formula) |
| `fldXotqfetP6azASU` | Bar Service Kitchen BEO (often formula) |
| `fldWj4wQIwIkz0rjg` | Bar Mixer Items (linked records) |
| `fldIPOF7dPSZWANg6` | Bar Garnish Items (linked records) |

To see your actual field names in Airtable, open the Events table and check the field that has ID `fldXm91QjyvVKbiyO` (you can confirm the ID in the Airtable API docs or by using “Copy field ID” in the field menu if your base supports it).
