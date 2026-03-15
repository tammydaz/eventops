# Omni Setup Verification Checklist

Use this to confirm Omni's Phase 1 work is correct.

---

## Option A: Quick Check in Airtable (You or Omni)

### 1. Menu Items — Boxed Lunches (6 items)
Go to **Menu Items** table. Filter or search for Category = **Boxed Lunch** (or equivalent).

**Expected names (exact):**
- Super Saver werx
- Premium werx
- Executive werx
- Basic Saladwerx
- Premium Saladwerx
- Executive Saladwerx

✅ All 6 present with correct names?

---

### 2. Menu Items — Sandwich Platters (6 items)
Filter Menu Items by Category = **Deli/Sandwiches** (or similar).

**Expected names (exact):**
- Classic Sandwich Platter
- Signature Specialty Platter
- Signature Wrap Platter
- Philadelphia Hoagie Platter
- Pressed Panini Platter
- Combination Platter

✅ All 6 present with correct names?

---

### 3. Boxed Lunch Order → Event Link
Go to **Boxed Lunch Orders** table.

- Open the test order (e.g., linked to "Jennifer Vincent – 11/23/2026")
- Confirm the **Client/Event** field shows the linked Event

✅ Order links to Event?

---

### 4. Boxed Lunch Order Items
Open the test order. Expand or view **Boxed Lunch Selections** (Order Items).

**Expected:**
- Super Saver werx × 15 (or similar quantity)
- Premium werx × 10 (or similar quantity)
- Each Order Item has: Boxed Lunch Type (→ Menu Item), Quantity

✅ Order Items have correct types and quantities?

---

## Option B: Ultimate Proof — BEO Print Test

Once the app merges boxed lunch orders into the Kitchen BEO:

1. Open **Kitchen BEO** in EventOps
2. Select the event **Jennifer Vincent – 11/23/2026** (or whatever test event Omni used)
3. Ensure the event is set as **Delivery** (Event Type = Delivery or Pick Up)
4. Print or preview the BEO

**Expected:** The **DELI - DISPOSABLE** section shows:
- Super Saver werx — 15
- Premium werx — 10

✅ Boxed lunches appear on the BEO with correct quantities?

---

## What to Ask Omni for (if you can't check Airtable)

> "Can you send:
> 1. A screenshot or list of the 6 boxed lunch Menu Items (names + Category)
> 2. A screenshot or list of the 6 sandwich platter Menu Items
> 3. The Event record ID (starts with rec...) for the test event
> 4. The Boxed Lunch Order record ID for the test order
> 5. A screenshot of the Boxed Lunch Order Items (showing Super Saver × 15, Premium × 10)"

With the Event ID and Order ID, we can verify via the app or API.
