# Airtable Setup: Full-Service DELI & Platters

So the app can **save and load** full-service DELI (and platters) correctly, you need the right fields and—optionally—tables in Airtable. Below is what to create and where to plug the IDs into the code.

---

## 1. Already in Airtable (no change)

- **Stations** — Stored in the **Stations** table; each station links to an Event. BEO Placement (Presented Appetizer / Buffet Metal / Buffet China) is on the station record. No Events-table change needed.
- **Delivery DELI** — Events has **Deli** (`fldKRlrDNIJjxg9jn`), linked to Menu Items. That’s used for delivery/pick BEO. It’s in the save whitelist.

---

## 2. What to Add in Airtable

### 2.1 Custom Delivery DELI (placeholder today)

The app has a **placeholder** for custom deli text on delivery events:

- **Field:** Long Text on **Events**
- **Suggested name:** `Custom Deli` or `Custom Delivery DELI`
- **Purpose:** Free-text lines that print under DELI - DISPOSABLE when there’s no linked Menu Item for them.

**In code:** Replace the placeholder ID in `src/services/airtable/events.ts`:

- `CUSTOM_DELIVERY_DELI: "fldCustomDeliTODO"` → use the **real** field ID from Airtable (e.g. `fldXXXXXXXXXXXXXX`).
- Add that same ID to `SAVE_WHITELIST` (it’s not there yet because the placeholder is in `PLACEHOLDER_FIELD_IDS` and is stripped on save).
- Remove `"fldCustomDeliTODO"` from `PLACEHOLDER_FIELD_IDS` in the same file.

---

### 2.2 Full-Service DELI (new)

So the **DELI** section on the full-service BEO has a source of truth in Airtable:

**On the Events table, add:**

| Field name (suggestion) | Type | Purpose |
|-------------------------|------|--------|
| **DELI (Full Service)** or **DELI – China/Metal** | Linked to **Menu Items** (multiple) | Same idea as Delivery Deli: link menu items (rolls, butter, sandwich items, etc.) that print under the DELI section on the full-service BEO. |
| **Custom DELI (Full Service)** | Long Text | Optional. Free-form lines that print under DELI when not coming from Menu Items. |

**In code (after you create the fields):**

1. In `src/services/airtable/events.ts`:
   - Add to `FIELD_IDS`:
     - `FULL_SERVICE_DELI: "fldXXXXXXXXXXXXXX",   // DELI (Full Service) — linked to Menu Items`
     - `CUSTOM_FULL_SERVICE_DELI: "fldYYYYYYYYYYYYYY",   // Custom DELI (Full Service) — Long Text`
   - Add both field IDs to `SAVE_WHITELIST`.
   - In the BEO fetch/params that need to read menu sections for full service, include `FIELD_IDS.FULL_SERVICE_DELI` and `FIELD_IDS.CUSTOM_FULL_SERVICE_DELI` so the app loads and displays them.

2. In the full-service BEO build (e.g. `BeoPrintPage.tsx` / Kitchen BEO): add a **DELI** (or **DELI - CHINA/METAL**) section for full service, and fill it from:
   - `eventData[FIELD_IDS.FULL_SERVICE_DELI]` (linked menu item names/specs), and  
   - `eventData[FIELD_IDS.CUSTOM_FULL_SERVICE_DELI]` (custom lines),  
   in the same order you use for other sections (e.g. after Presented Appetizers, before Buffet).

Then the app can read/write full-service DELI in Airtable and print it on the BEO.

---

### 2.3 Platter orders (sandwich platters) — optional, when you’re ready

Right now **platter orders** (platter type, quantity, picks) are stored only in **localStorage** (`platterOrdersStore.ts`). The code has a TODO: *“Migrate to Airtable (Platter Orders table) when Omni creates it.”*

When you want them in Airtable, you have two options:

**Option A – Platter Orders table (recommended, like Boxed Lunch)**

1. **Table: Platter Orders**
   - **Event** — Linked to Events (single or multiple).
   - **Order name** (optional) — e.g. “Sandwich Platters” or event name.

2. **Table: Platter Order Items** (child table)
   - **Platter Order** — Linked to Platter Orders.
   - **Platter type** — Single line or Single select (e.g. “Petite Cut Gourmet Sandwiches”, “foodwerx Classic Sandwiches”).
   - **Quantity** — Number.
   - **Picks / Selections** — Long Text or linked records (e.g. one line per pick: “Turkey”, “Ham”, “Veggie”). If you use a fixed list, Single select or Multi select can work.

Then in the app we’d:
- Add a small Airtable client for Platter Orders (like `boxedLunchOrders.ts`): create/update/delete order and line items by event.
- Replace `platterOrdersStore` reads/writes with that client, and keep the same UI (modal, grouped cards, etc.).

**Option B – Store on Events**

- Add a **Long Text** field on Events, e.g. **Platter Orders (JSON)** or **Sandwich Platter Config**, and store a JSON array of `{ platterType, quantity, picks }` (same shape as `PlatterRow`).
- Simpler (no new table), but harder to report on in Airtable and no native “records” for each platter line.

**In code (when you have Option A):**

- Add something like `src/services/airtable/platterOrders.ts` with table/field IDs and CRUD.
- In the BEO and menu UI, load platter orders from Airtable by event instead of `getPlatterOrdersByEventId` from localStorage. Save/update/delete through the new client.

---

## 3. Checklist

| Item | In Airtable | In code |
|------|-------------|--------|
| Custom Delivery DELI | Create Long Text on Events, copy field ID | Replace `fldCustomDeliTODO` with real ID; add to SAVE_WHITELIST; remove from PLACEHOLDER_FIELD_IDS |
| Full-Service DELI | Add “DELI (Full Service)” linked to Menu Items + optional “Custom DELI (Full Service)” Long Text | Add FIELD_IDS; add to SAVE_WHITELIST; add DELI section to full-service BEO and read from these fields |
| Platter orders | (Later) Platter Orders + Platter Order Items tables, or Long Text on Events | (Later) New Airtable client and switch from platterOrdersStore to Airtable |

---

## 4. Summary

- **Yes — you need to put it in Airtable correctly:** full-service DELI and (eventually) platter orders should live in Airtable so they’re saved per event and the BEO can read from them.
- **Stations** are already in Airtable (Stations table); no Events changes for stations.
- **Delivery DELI** is already in Airtable; only fix the **Custom Delivery DELI** placeholder.
- **Full-service DELI:** Add the two Events fields above, then add the field IDs and DELI section logic in the app.
- **Platters:** Keep using localStorage until you create the Platter Orders table (or the Long Text field); then we can wire the app to read/write Airtable instead.

Once the full-service DELI fields exist and the IDs are in the code, the app can save and load full-service DELI in Airtable and print the DELI section on the BEO correctly.
