# Omni Blueprint Reference — Where to Look & What to Build

**Purpose:** This doc is the bridge between the EventOps codebase and Omni's Airtable setup. Use it to understand the full build blueprint and where everything lives.

**Source of truth for menu structure:** The **client-facing menu** — i.e., how the client orders. We align with the [foodwerx Corporate Catering Menu PDF](https://foodwerx.com/wp-content/uploads/2024/11/foodwerx-Corporate-Menu.pdf).

---

## 1. The Big Picture

```
Client orders (foodwerx menu) → Airtable (Menu Items, Boxed Lunch Orders) → EventOps app → BEO print + Spec engine
```

**Principle:** Structure everything the way the **client** sees and orders it. The BEO prints what the client ordered; the spec engine uses guest count and menu items.

---

## 2. Where to Look in the Codebase

### Menu structure & categories
| File | What it does |
|------|--------------|
| `src/constants/menuCategories.ts` | Maps Airtable Category values to BEO sections. `deli` includes `Deli/Sandwiches`, `Deli/Breads`, etc. Add `Boxed Lunch` here if Airtable uses it. |
| `src/constants/menuCategories.ts` → `MENU_SECTIONS` | Defines Passed, Presented, Buffet Metal, Buffet China, Desserts, Stations. Delivery uses different sections (HOT, DELI, KITCHEN, SALADS, DESSERTS). |

### Event fields (what links to menu items)
| File | What it does |
|------|--------------|
| `src/services/airtable/events.ts` | `FIELD_IDS` — all Airtable field IDs. Key for delivery: `DELIVERY_DELI`, `DELIVERY_HOT`, `DELIVERY_KITCHEN`, `DELIVERY_SALADS`, `DELIVERY_DESSERTS`. Full-service: `PASSED_APPETIZERS`, `PRESENTED_APPETIZERS`, `BUFFET_METAL`, `BUFFET_CHINA`, `DESSERTS`, `STATIONS`. |

### BEO print layout
| File | What it does |
|------|--------------|
| `src/pages/KitchenBEOPrintPage.tsx` | Kitchen BEO — builds sections (HOT, DELI, KITCHEN, SALADS, DESSERTS for delivery). **Boxed lunch merge goes here** — call `loadBoxedLunchOrdersByEventId`, add items to DELI. |
| `src/pages/BeoPrintPage.tsx` | Client-facing BEO — buffet menu signs, delivery BEO. Same merge logic for boxed lunches when delivery. |
| `KITCHEN_BEO_PRINT_LAYOUT_FULL.md` (project root) | Full BEO section layout spec. |

### Boxed lunch integration
| File | What it does |
|------|--------------|
| `src/services/airtable/boxedLunchOrders.ts` | `loadBoxedLunchOrdersByEventId(eventId)` — fetches Boxed Lunch Orders linked to Event, expands Order Items (type + quantity). |
| `docs/OMNI_BOXED_LUNCH_SCHEMA.md` | Full schema, table IDs, field IDs, sample data. |
| `docs/OMNI_TABLE_SETUP_DELI.md` | Platters and boxed lunches currently in Menu Items (Omni's prior mapping). |

### Spec engine (quantities / tiering)
| File | What it does |
|------|--------------|
| `src/lib/airtable.ts` | `fetchEvent` — gets menu item IDs from event section fields + stations. Does **not** yet include DELIVERY_DELI or boxed lunch orders. |
| `src/services/specEngine/specDataFetch.ts` | Fetches menu items, guest count, Master Menu Specs. Uses **guest count** for tier-based spec values. No per-item quantity yet. |

### Intake (where clients pick menu items)
| File | What it does |
|------|--------------|
| `src/components/beo-intake/MenuSection.tsx` | Menu picker for Passed, Presented, Buffet Metal/China, Desserts, Stations. |
| `src/pages/BeoIntakePage.tsx` | Main intake page — maps sections to event fields. |

---

## 3. BEO Section Mapping (How Items Land on the BEO)

### Delivery BEO (pickup/drop-off)
| Section | What goes here | Airtable / Category |
|---------|----------------|---------------------|
| HOT | Hot entrees, hot sides | `DELIVERY_HOT` / Hot items |
| DELI | Sandwiches, platters, **boxed lunches** | `DELIVERY_DELI` + Boxed Lunch Orders |
| KITCHEN | Kitchen prep items | `DELIVERY_KITCHEN` |
| SALADS | Salads | `DELIVERY_SALADS` |
| DESSERTS | Desserts | `DELIVERY_DESSERTS` |

All delivery sections print as **DISPOSABLE**.

### Full-service BEO (seated events)
| Section | What goes here |
|---------|----------------|
| Passed Appetizers | Passed apps (locked — do not modify) |
| Presented Appetizers | Presented apps, stations with `beoPlacement="Presented Appetizer Metal/China"` |
| Buffet – Metal | Hot buffet items, stations with `beoPlacement="Buffet Metal/China"` |
| Buffet – China | Cold buffet, salads, platters |
| Desserts | Desserts |
| Stations | Stations without matching beoPlacement |

---

## 4. Menu Structure — Client-Facing (foodwerx PDF)

Use the **foodwerx Corporate Catering Menu** as the client-facing source. Menu Items in Airtable should match these names and groupings.

### Boxed lunches (from PDF)
| foodwerx name | Price | Notes |
|---------------|-------|-------|
| Super Saver werx | $12 | Classic sandwich, pasta salad, fruit, cookie |
| Premium werx | $15 | Gourmet sandwich or wrap, pasta salad, fruit salad, brownie, chips |
| Executive werx | $18 | Trio of flank steak, chicken, shrimp with greens, potato salad, roll, brownie |
| Basic Saladwerx | $14 | Garden/Caesar/Greek/Funky + grilled chicken, roll, pasta salad, fruit, cookie |
| Premium Saladwerx | $16 | Country Cobb with roast beef, turkey, egg, bacon, avocado, etc. |
| Executive Saladwerx | $22 | Tenderloin, shrimp, grilled vegetables atop greens, roll, pasta salad, chocolate dipped fruit, cannoli |

### Sandwich platters (from PDF)
- Classic Sandwich Platter
- Signature Specialty Platter
- Signature Wrap Platter
- Philadelphia Hoagie Platter
- Pressed Panini Platter
- Combination Platter

### Individual sandwiches / wraps (for platter components)
- Acapulco Turkey BLT, Spa Turkey, Italiano, Biggie Beef, Cheezie Veg, etc.
- Crunch Chicken Wrap, Grilled Vegetable Wrap, Turkey Club Wrap, Buffalo Chicken Wrap, Caesar Wrap

---

## 5. What Omni Needs to Ensure

1. **Menu Items** — Names match the foodwerx PDF (client-facing). Categories: `Deli/Sandwiches`, `Boxed Lunch`, `Buffet Item`, or `Other` as appropriate.
2. **Boxed Lunch Orders** — Linked to Event via `Client/Event`. Order Items have Boxed Lunch Type (→ Menu Items) + Quantity.
3. **Box Customizations** — Optional; for swaps/special requests per box.
4. **Events** — Has `DELIVERY_DELI` (and other delivery fields) for direct menu links. Boxed Lunch Orders are separate (queried by Event ID).

---

## 6. Quick Links Summary

| Topic | Doc / File |
|------|------------|
| foodwerx menu (client-facing) | [foodwerx Corporate Menu PDF](https://foodwerx.com/wp-content/uploads/2024/11/foodwerx-Corporate-Menu.pdf) |
| Boxed lunch schema & IDs | `docs/OMNI_BOXED_LUNCH_SCHEMA.md` |
| Deli/platter setup | `docs/OMNI_TABLE_SETUP_DELI.md` |
| Event field IDs | `src/services/airtable/events.ts` (FIELD_IDS) |
| BEO section build | `src/pages/KitchenBEOPrintPage.tsx` |
| Menu categories | `src/constants/menuCategories.ts` |
| Passed Appetizers (locked) | `.cursor/rules/passed-appetizers-locked.mdc` — do not modify |

---

## 7. Communication Flow

```
You (middleman) ←→ Omni (Airtable) ←→ This doc + codebase (EventOps)
```

When Omni has questions about:
- **Menu structure** → Point to foodwerx PDF + this doc §4
- **Where items land on BEO** → Point to this doc §3
- **Table/field IDs** → Point to `OMNI_BOXED_LUNCH_SCHEMA.md`
- **What the app expects** → Point to the files in §2
