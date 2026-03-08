# Menu Items Audit Report — 616 Records

Generated from `menu-items-export.json`

---

## Category Summary

| Category | Count | Shows in Picker? | Picker |
|----------|-------|------------------|--------|
| Appetizer | 64 | ❌ No | — |
| Deli | 52 | ✅ Yes | Deli |
| Component | 55 | ❌ No | — |
| Buffet | 41 | ✅ Yes | Buffet - Metal |
| Buffet Item | 35 | ✅ Yes | Buffet - Metal |
| Station Item | 36 | ✅ Yes | Stations |
| Entrée | 40 | ❌ No | — |
| Dessert | 41 | ✅ Yes | Desserts |
| Protein (Entrée) | 26 | ❌ No | — |
| Vegetable (Side) | 31 | ✅ Yes | Buffet Metal, Buffet China |
| Starch (Side) | 24 | ✅ Yes | Buffet - Metal |
| (empty) | 19 | ❌ No | — |
| Dressing | 18 | ✅ Yes | Dressing |
| Passed App | 18 | ✅ Yes | Passed Appetizers |
| Presented App | 18 | ✅ Yes | Presented Appetizers |
| Beverage | 16 | ❌ No | — |
| Display | 15 | ✅ Yes | Room Temp / Displays |
| Salad | 14 | ✅ Yes | Buffet - China |
| Side | 12 | ✅ Yes | Buffet Metal, Buffet China |
| Bread | 9 | ✅ Yes | Buffet - China |
| Dessert (Individual) | 8 | ❌ No | — |
| Pasta (Entrée) | 6 | ❌ No | — |
| Pasta (Side) | 6 | ✅ Yes | Buffet - Metal |
| Sauce | 4 | ❌ No | — |
| Dessert (Display) | 4 | ❌ No | — |
| Bar / Beverage Component | 3 | ❌ No | — |
| Description | 1 | ❌ No | — |

---

## Problem Categories — 283 Items Won't Show

These categories are **not** in any Cursor picker. Items need reassignment or we add them to the code.

| Category | Count | Suggested Fix |
|----------|-------|----------------|
| **Appetizer** | 64 | Reassign to `Passed App` or `Presented App` (check Section field) |
| **Component** | 55 | Reassign to parent's category, or add "Component" to relevant pickers |
| **Entrée** | 40 | Reassign to `Buffet Metal` or `Buffet China` |
| **Protein (Entrée)** | 26 | Reassign to `Buffet Metal` or `Buffet China` |
| **(empty)** | 19 | Assign a category |
| **Beverage** | 16 | Add Beverage picker, or reassign if not used |
| **Dessert (Individual)** | 8 | Add to code for Desserts picker |
| **Pasta (Entrée)** | 6 | Reassign to `Buffet Metal` or `Pasta (Side)` |
| **Sauce** | 4 | Usually child items — may be fine as-is |
| **Dessert (Display)** | 4 | Add to code for Desserts picker |
| **Bar / Beverage Component** | 3 | Add to Beverage picker if you have one |
| **Description** | 1 | Fix — likely a bad/malformed record |

---

## Quick Fix Options

### Option A — Add Missing Categories to Code (Fastest)

I can add these to `menuCategories.ts` so items show without Airtable changes:

- **Desserts:** `Dessert (Individual)`, `Dessert (Display)`
- **Passed Appetizers:** `Appetizer` (if Section = Passed Apps)
- **Buffet Metal:** `Entrée`, `Protein (Entrée)`, `Pasta (Entrée)`, `Component` (broad — may show in wrong picker)

**Risk:** Some items might appear in pickers where they don't belong. Better to reassign in Airtable when possible.

### Option B — Reassign in Airtable (Cleanest)

Bulk update in Airtable:

- Appetizer + Section "Passed Apps" → `Passed App`
- Appetizer + Section "Presented Apps" → `Presented App`
- Entrée, Protein (Entrée), Pasta (Entrée) → `Buffet Metal` (or Buffet China for salads/sides)
- Dessert (Individual), Dessert (Display) → `Dessert`
- Component → depends on context (or add to code)
- (empty) → assign based on item type

### Option C — Hybrid

1. Add `Dessert (Individual)` and `Dessert (Display)` to code (12 items, low risk).
2. Reassign Appetizer, Entrée, Protein (Entrée), etc. in Airtable for accuracy.

---

## Items with Empty Name

Some records have empty or near-empty `itemName` (e.g. "🧀  – "). Worth cleaning in Airtable.

---

## Child Items

Items with `hasChildItems: true` are set up correctly for sauce auto-populate. The export shows many Passed App items have Child Items linked — good.

---

## Next Step

Tell me which you prefer:

1. **Add Dessert (Individual) and Dessert (Display) to code** (12 items fixed)
2. **Add Appetizer to Passed App picker** (64 items — but some might be Presented)
3. **Generate a CSV** for bulk reassignment in Airtable (record ID, current category, suggested new category)
4. **Something else**
