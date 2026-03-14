# Omni Boxed Lunch Schema — Integration Analysis

**Purpose:** Support boxed lunch ordering with integration for an external UI. Schema separates boxed lunch definitions, orders, and customizations.

**Status:** Omni has confirmed setup complete. Tables, fields, relationships in place. Menu Items populated with boxed lunch and sandwich platter items.

**CONFIRMED (no drift):** Every sandwich platter and boxed lunch from the FoodWerx Corporate Catering Menu is in Menu Items. Categorized "Deli/Sandwiches" and/or "Buffet Item" or "Other". See `docs/OMNI_TABLE_SETUP_DELI.md` for full list.

---

## Omni's Proposed Schema

### Menu Items Table (extended)
**Purpose:** Stores all menu items, including boxed lunch types and individual components.

| Field | Type | Notes |
|-------|------|-------|
| Name | Single line text | Name of menu item or boxed lunch type |
| Type | Single select | e.g., Boxed Lunch, Sandwich, Side, Dessert, Drink |
| Boxed Lunch Type | Single select | Standard, Premium, Vegetarian, etc. |
| Customizable | Checkbox | Indicates if item can be customized |
| Swap Options | Linked record → Menu Items | Alternative items that can be swapped in |

### Boxed Lunch Orders Table (NEW)
**Purpose:** Tracks each boxed lunch order (e.g., client order for 30 boxes).

| Field | Type | Notes |
|-------|------|-------|
| Order Name/ID | Single line text or autonumber | |
| Client/Event | Linked record → Events or Clients | **Links to Event** |
| Order Date | Date | |
| Boxed Lunch Selections | Linked record → Boxed Lunch Order Items | Connects to each box type and quantity/customizations |

### Boxed Lunch Order Items Table (NEW)
**Purpose:** Line items for each boxed lunch type in an order.

| Field | Type | Notes |
|-------|------|-------|
| Order | Linked record → Boxed Lunch Orders | |
| Boxed Lunch Type | Linked record → Menu Items | Filtered to boxed lunch types |
| Quantity | Number | |
| Customizations | Linked record → Box Customizations | Details for swaps or special requests |

### Box Customizations Table (NEW)
**Purpose:** Tracks customizations or swaps for individual boxes.

| Field | Type | Notes |
|-------|------|-------|
| Order Item | Linked record → Boxed Lunch Order Items | |
| Box Number | Number | If tracking individual boxes |
| Swapped Item | Linked record → Menu Items | What was swapped in/out |
| Special Requests | Long text | |

### Relationships
```
Menu Items ── defines all possible boxed lunch types and components
Boxed Lunch Orders ── parent order (links to Event)
Boxed Lunch Order Items ── line items (type + quantity per order)
Box Customizations ── per-box swaps/requests (linked to order items)
```

---

## Compatibility with Current EventOps Build

### What We Have
- **Events** table with linked menu fields: `DELIVERY_DELI`, `BUFFET_METAL`, `BUFFET_CHINA`, etc.
- **Menu Items** table with Item Name, Child Items, Category (Deli, Buffet Metal, etc.)
- **Delivery BEO** sections: HOT, **DELI - DISPOSABLE**, KITCHEN, SALADS, DESSERTS
- **Full-service BEO** sections: Passed, Presented, Buffet Metal, Buffet China, Desserts, Stations
- **menuCategories.ts** — `deli: ["Deli/Sandwhiches", "Deli/Sandwiches", "Deli/Breads"]`

### How It Fits
1. **Menu Items extension** — Adding Type, Boxed Lunch Type, Customizable, Swap Options is additive. Existing items stay; new boxed lunch items (Classic Boxed Lunch, Signature Boxed Lunch, etc.) get `Type: Boxed Lunch`.

2. **Boxed Lunch Orders → Event** — The `Client/Event` link is the bridge. When building the BEO for an event, we can:
   - Read Event's direct menu links (current flow: DELIVERY_DELI, etc.)
   - **Also** query Boxed Lunch Orders where Event = this event
   - Expand Boxed Lunch Order Items to get quantities and types
   - Render on BEO

3. **Delivery vs full-service** — User said "most will be deliveries but we must be able to do both":
   - **Delivery:** Boxed lunches → DELI - DISPOSABLE section (or a dedicated BOXED LUNCHES section)
   - **Full-service:** Boxed lunches → Buffet China or a custom section when used at a seated event

---

## Making Boxed Lunches Show on the BEO

### Approach
When building BEO sections for an event:

1. **Query** `Boxed Lunch Orders` where `Event` = current event ID
2. **Expand** `Boxed Lunch Order Items` for each order (Boxed Lunch Type, Quantity, Customizations)
3. **Render** as BEO rows, e.g.:
   - "Classic Boxed Lunch — 30"
   - "Signature Boxed Lunch — 10"
   - "VIP Boxed Lunch — 5" (with customizations if any)
4. **Section placement:**
   - Delivery BEO: Add to DELI - DISPOSABLE (or new BOXED LUNCHES - DISPOSABLE)
   - Full-service BEO: Add to Buffet China or appropriate section

### Code Changes Needed (when schema is live)
- **linkedRecords.ts** or new `boxedLunchOrders.ts`: `loadBoxedLunchOrdersByEventId(eventId)`
- **KitchenBEOPrintPage** `buildSectionsFromEvent`: For delivery, merge boxed lunch order items into DELI section (or new section)
- **BeoPrintPage** (if delivery BEO there): Same merge logic
- **MenuSection** intake: May need a "Boxed Lunches" sub-section or integration with the external UI that creates Boxed Lunch Orders

---

## Summary

| Question | Answer |
|----------|--------|
| Does Omni's schema work with our build? | **Yes** — It's additive. Menu Items gets new fields; new tables link to Events. |
| Will we understand how to show them on BEO? | **Yes** — Query Boxed Lunch Orders by Event → expand Order Items → render in DELI (delivery) or Buffet (full-service) section. |
| Delivery vs full-service? | **Both supported** — Delivery: DELI - DISPOSABLE. Full-service: Buffet China or custom section. |

---

## Airtable IDs (Ready for Integration)

### 1. Boxed Lunch Orders
| Element | ID | Type | Links To |
|---------|-----|------|----------|
| Table | `tbldRHfhjCY4x2Hyy` | — | — |
| Order Name/ID | `fldBWaqX8nmvYjiDg` | Single line text (Primary) | — |
| Client/Event | `fldUnkvbaJhny05V3` | Linked record | Events (tblYfaWh67Ag4ydXq) |
| Order Date | `fldRUiayIsWpqEkXT` | Date | — |
| Boxed Lunch Selections | `fldfltt8RGxBtW2cj` | Linked record | Boxed Lunch Order Items (tblbkSAnNpUkjWtsa) |

### 2. Boxed Lunch Order Items
| Element | ID | Type | Links To |
|---------|-----|------|----------|
| Table | `tblbkSAnNpUkjWtsa` | — | — |
| Order Item ID | `fldoN8vRP7B9kmOrA` | Autonumber (Primary) | — |
| Order | `fld4nC951QmByIOsJ` | Linked record | Boxed Lunch Orders (tbldRHfhjCY4x2Hyy) |
| Boxed Lunch Type | `fld0u5GkL3lnvXNg5` | Linked record | Menu Items (tbl0aN33DGG6R1sPZ) |
| Quantity | `fld9Cs3tcmJT6vqcY` | Number (integer) | — |
| Customizations | `fldqiy52e9uzckXCd` | Linked record | Box Customizations (tblAulNkoIFgNhJxw) |

### 3. Box Customizations
| Element | ID | Type | Links To |
|---------|-----|------|----------|
| Table | `tblAulNkoIFgNhJxw` | — | — |
| Box Customization ID | `fldawzpQMD9qZx7AQ` | Autonumber (Primary) | — |
| Order Item | `fldAEfP10RiN8mRSf` | Linked record | Boxed Lunch Order Items (tblbkSAnNpUkjWtsa) |
| Box Number | `fldPzCQ0NlObQgpGI` | Number (integer) | — |
| Swapped Item | `fldx7BTghnsdGJFbP` | Linked record | Menu Items (tbl0aN33DGG6R1sPZ) |
| Special Requests | `fld7eYwx4pMNttLJ8` | Long text | — |

### 4. Events Table — Boxed Lunch Orders Link
| Element | ID | Links To |
|---------|-----|----------|
| Boxed Lunch Orders (on Events) | `fldHCcFbEH7bEwwkb` | Boxed Lunch Orders (tbldRHfhjCY4x2Hyy) |

### Relationship Diagram
```
Events (tblYfaWh67Ag4ydXq)
└──► Boxed Lunch Orders (tbldRHfhjCY4x2Hyy)
     └──► Boxed Lunch Order Items (tblbkSAnNpUkjWtsa)
          ├──► Menu Items (tbl0aN33DGG6R1sPZ) [Boxed Lunch Type]
          └──► Box Customizations (tblAulNkoIFgNhJxw)
               └──► Menu Items (tbl0aN33DGG6R1sPZ) [Swapped Item]
```

### Key Integration Points
| Function | Table | Key Fields |
|----------|-------|------------|
| loadBoxedLunchOrdersByEventId | Boxed Lunch Orders | Filter by Client/Event (`fldUnkvbaJhny05V3`) |
| Get order line items | Boxed Lunch Order Items | Filter by Order (`fld4nC951QmByIOsJ`) |
| Get boxed lunch types | Menu Items | Category = "Boxed Lunch" or "Sandwich Platter" |
| Get/create customizations | Box Customizations | Link via Order Item (`fldAEfP10RiN8mRSf`) |
| BEO merge logic | Events → Boxed Lunch Orders | Use Events field `fldHCcFbEH7bEwwkb` |

---

## Omni Setup Review (Confirmed)

1. **Tables & Fields** — All created per spec. Client/Event links to Events.
2. **Menu Items** — Boxed lunch and sandwich platter items added. Category = "Boxed Lunch" or "Sandwich Platter".
3. **Relationships** — Bidirectional. Compatible with events, menu, stations.
4. **Schema** — No discrepancies. Ready for BEO merge and external UI.

---

## Menu Items Table — Key Fields (for Boxed Lunch Types)

| Field Name | Field ID | Type |
|------------|----------|------|
| Item Name | fldW5gfSlHRTl01v1 | Single line text (Primary) |
| Category | fldM7lWvjH8S0YNSX | Single select (e.g. Boxed Lunch, Sandwich Platter) |
| Description/Client Facing | fldtN2hxy9TS559Rm | Long text |
| Price | fldNfCaB1rN7Mavps | Number |
| Menu Category | fldPdKsDzE82qVhT5 | Single select |

---

## Sample Data Structure (Developer Reference)

```json
{
  "boxedLunchOrder": {
    "id": "recOrder1",
    "fields": {
      "Order Name/ID": "Acme Corp Lunch 3/15",
      "Client/Event": ["recEvent1"],
      "Order Date": "2026-03-15",
      "Boxed Lunch Selections": ["recOrderItem1", "recOrderItem2"]
    }
  },
  "boxedLunchOrderItems": [
    {
      "id": "recOrderItem1",
      "fields": {
        "Order": ["recOrder1"],
        "Boxed Lunch Type": ["recMenuItem1"],
        "Quantity": 12,
        "Customizations": ["recCustomization1", "recCustomization2"]
      }
    },
    {
      "id": "recOrderItem2",
      "fields": {
        "Order": ["recOrder1"],
        "Boxed Lunch Type": ["recMenuItem2"],
        "Quantity": 8,
        "Customizations": []
      }
    }
  ],
  "boxCustomizations": [
    {
      "id": "recCustomization1",
      "fields": {
        "Order Item": ["recOrderItem1"],
        "Box Number": 3,
        "Swapped Item": ["recMenuItem3"],
        "Special Requests": "No mayo"
      }
    },
    {
      "id": "recCustomization2",
      "fields": {
        "Order Item": ["recOrderItem1"],
        "Box Number": 7,
        "Swapped Item": ["recMenuItem4"],
        "Special Requests": "Gluten-free bread"
      }
    }
  ],
  "menuItems": [
    {
      "id": "recMenuItem1",
      "fields": {
        "Item Name": "Classic Boxed Lunch",
        "Category": "Boxed Lunch",
        "Description/Client Facing": "Choice of classic sandwich, chips, cookie, bottled water.",
        "Price": 16,
        "Menu Category": "Boxed Lunch"
      }
    },
    {
      "id": "recMenuItem2",
      "fields": {
        "Item Name": "Vegetarian Boxed Lunch",
        "Category": "Boxed Lunch",
        "Description/Client Facing": "Vegetarian sandwich, chips, cookie, bottled water.",
        "Price": 16,
        "Menu Category": "Boxed Lunch"
      }
    }
  ]
}
```

**Usage:** Linked record fields expect arrays of record IDs. All relationships bidirectional.
