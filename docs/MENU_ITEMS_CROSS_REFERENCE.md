# Menu Items Cross-Reference: Airtable vs App

Use this to compare your Airtable Menu Items against your list when food items aren't pulling properly.

---

## Table: Menu Items

| Table ID | `tbl0aN33DGG6R1sPZ` |
|----------|---------------------|
| Table name | Menu Items |

---

## Critical Fields for Filtering

### 1. **Category** (fldM7lWvjH8S0YNSX) — **PRIMARY FILTER**

This is the field the app uses to decide which items show in each section picker.  
**Exact string match required.** Case and spelling must match.

| App Section | App expects (Category value) | In your Airtable? |
|-------------|-----------------------------|-------------------|
| **Passed Appetizers** | `Passed App` | ✓ `Passed App` |
| **Presented Appetizers** | `Presented App` | ✓ `Presented App` (also `Presented App/metal`, `Presented App/china`) |
| **Buffet - Metal** | `Buffet Metal`, `Buffet`, `Buffet Item`, `Side`, `Vegetable (Side)`, `Starch (Side)`, `Pasta (Side)` | ✓ All exist |
| **Buffet - China** | `Buffet China`, `Salad`, `Bread`, `Side`, `Vegetable (Side)` | ✓ All exist |
| **Desserts** | `Dessert` | ✓ `Dessert` (also `Dessert/Metal`, `Dessert/China`, etc.) |
| **Stations** | `Station` | ⚠️ Airtable has `Stations` and `Station Item` — **NOT** `Station` |
| **Deli** | `Deli/Sandwhiches`, `Deli/Breads`, `Deli/Sandwiches`, `Deli`, `Sandwich`, `Wrap` | ⚠️ Airtable has `Deli/Sandwhiches`, `Deli/Breads`, `Deli` — no `Sandwich` or `Wrap` in Category |
| **Room Temp Display** | `Room Temp Display`, `Display`, `Buffet China` | ⚠️ Airtable has `Display`, `Buffet China` — **no** `Room Temp Display` in Category |
| **Dressing** | `Dressing` | ✓ `Dressing` |
| **Displays** | `Display`, `Buffet China` | ✓ Both exist |

### 2. **Display Name** (fldQ83gpgOmMxNMQw)

The app shows items using **Description Name/Formula** (a formula field), not "Item Name".  
If items show as blank or wrong, check that this formula returns a valid string.

### 3. **Item Name** (fldW5gfSlHRTl01v1)

Raw text — often used as input to the Description formula.

---

## Full Category Options in Your Airtable

Your Menu Items **Category** field (single-select) currently has:

```
Presented App/metal | Presented App/china | Passed App | Buffet Metal | Buffet China |
Deli/Sandwhiches | Deli/Breads | Dessert/Metal | Dessert/China | Stations |
Category | Appetizer | Entrée | Side | Dessert | Beverage | Display |
Bar / Beverage Component | Buffet Item | Presented App | Buffet | Description |
Sauce | Component | Station Item | Salad | Bread | Protein (Entrée) |
Pasta (Entrée) | Pasta (Side) | Starch (Side) | Vegetable (Side) |
Dessert (Individual) | Dessert (Display) | Dressing | Deli
```

---

## Section Options (Alternative Field)

The **Section** field (fldwl2KIn0xOW1TR3) has different values — the app does **not** use this for the BEO intake picker; it uses **Category**:

```
Passed Apps | Presented Apps | Buffet – China | Buffet – Metal | Desserts |
Appetizers | Buffet | Stations | Presented App – China (Display) |
Passed App – China (Cold) | Buffet – China (Cold) | Room Temp Display
```

---

## Common Fixes When Items Don't Pull

1. **Wrong Category value**  
   - Item must have Category = one of the exact strings in `CATEGORY_MAP` for that section.  
   - Example: For Passed Appetizers, Category must be `Passed App` (not "Passed Apps" or "passed app").

2. **Stations mismatch**  
   - App expects `Station` but Airtable has `Stations` and `Station Item`.  
   - Fix: Add `Station` to Category options, or update `menuCategories.ts` to include `Stations` and `Station Item`.

3. **Deli items**  
   - App expects `Sandwich` and `Wrap` in Category.  
   - If missing, add those options or map your existing values in `menuCategories.ts`.

4. **Room Temp Display**  
   - App expects `Room Temp Display` in Category.  
   - Airtable may only have it in Section. Add `Room Temp Display` to Category if needed.

5. **Blank or wrong names**  
   - Check the **Description Name/Formula** field — the app uses this for display.  
   - Ensure the formula returns a non-empty string for each record.

---

## Quick Checklist for Your List

For each food item on your list:

- [ ] Exists as a record in Menu Items table
- [ ] **Category** = one of the allowed values for the section you want
- [ ] **Description Name/Formula** (or Item Name) is not empty
- [ ] No typos in Category (e.g. `Deli/Sandwhiches` vs `Deli/Sandwiches`)

---

## App Source of Truth

The mapping lives in: `src/constants/menuCategories.ts`

```ts
export const CATEGORY_MAP: Record<string, string[]> = {
  passed:       ['Passed App'],
  presented:    ['Presented App'],
  buffet_metal: ["Buffet Metal", "Buffet", "Buffet Item", "Side", ...],
  buffet_china: ["Buffet China", "Salad", "Bread", "Side", ...],
  desserts:     ['Dessert'],
  stations:     ['Station'],        // ← Airtable has "Stations", "Station Item"
  deli:         ['Deli/Sandwhiches', 'Deli/Breads', 'Deli/Sandwiches', 'Deli', 'Sandwich', 'Wrap'],
  room_temp:    ['Room Temp Display', 'Display', 'Buffet China'],
  ...
};
```

If your Airtable uses different Category values, either:
- Update Airtable to match these, or
- Add your Airtable values to `CATEGORY_MAP` in `menuCategories.ts`.
