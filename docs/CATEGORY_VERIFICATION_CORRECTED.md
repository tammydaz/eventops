# Category Verification — Cursor Code vs ChatGPT vs Your Airtable

ChatGPT’s summary is **partially wrong**. Here’s what the Cursor code actually expects.

---

## What the Code Actually Has (`src/constants/menuCategories.ts`)

| Picker | Cursor Code Expects | ChatGPT Said |
|--------|---------------------|--------------|
| Passed Appetizers | `Passed App` only | ✓ Correct |
| Presented Appetizers | `Presented App` only | ❌ Wrong — said Presented App/metal, Presented App/china |
| Buffet - Metal | Buffet Metal, Buffet, Buffet Item, Side, Vegetable (Side), Starch (Side), Pasta (Side) | ✓ Correct |
| Buffet - China | Buffet China, Salad, Bread, Side, Vegetable (Side) | ✓ Correct |
| Desserts | `Dessert` only | ❌ Wrong — said Dessert, Dessert/Metal, Dessert/China |
| Stations | `Station` only (singular) | ❌ Wrong — said "Stations" (plural) |
| Deli | Deli/Sandwhiches, Deli/Breads, Deli/Sandwiches, Deli, Sandwich, Wrap | ✓ Correct |
| Room Temp / Displays | Room Temp Display, Display, Buffet China | ✓ Correct |

---

## Mismatches With Your Airtable

### 1. Presented Appetizers

- **Your Airtable:** `Presented App/metal`, `Presented App/china`, `Presented App`
- **Cursor code:** Only `Presented App`
- **Effect:** Items with `Presented App/metal` or `Presented App/china` do **not** show in the Presented Appetizers picker.
- **Fix:** Add `Presented App/metal` and `Presented App/china` to the code, or change those items in Airtable to `Presented App`.

### 2. Desserts

- **Your Airtable:** `Dessert/Metal`, `Dessert/China`, `Dessert`
- **Cursor code:** Only `Dessert`
- **Effect:** Items with `Dessert/Metal` or `Dessert/China` do **not** show in the Desserts picker.
- **Fix:** Add `Dessert/Metal` and `Dessert/China` to the code, or change those items in Airtable to `Dessert`.

### 3. Stations

- **Your Airtable:** `Stations` (plural)
- **Cursor code:** `Station` (singular)
- **Effect:** Items with `Stations` do **not** show in the Stations picker.
- **Fix:** Add `Stations` to the code, or change those items in Airtable to `Station`.

### 4. Station Item, Component, Display, etc.

- **Your Airtable:** `Station Item`, `Component`, `Display`, `Entrée`, `Appetizer`, etc.
- **Cursor code:** None of these are in any picker’s category list.
- **Effect:** Items with these categories do **not** show in any picker.
- **Fix:** Either:
  - Reassign items in Airtable to one of the supported categories, or
  - Add the needed categories to the code for the appropriate pickers.

---

## Corrected “Cursor Category Contract”

This matches the **current** Cursor code:

| Picker | Categories the Code Accepts |
|--------|----------------------------|
| **Passed Appetizers** | `Passed App` |
| **Presented Appetizers** | `Presented App` *(not* Presented App/metal *or* Presented App/china) |
| **Buffet - Metal** | Buffet Metal, Buffet, Buffet Item, Side, Vegetable (Side), Starch (Side), Pasta (Side) |
| **Buffet - China** | Buffet China, Salad, Bread, Side, Vegetable (Side) |
| **Desserts** | `Dessert` *(not* Dessert/Metal *or* Dessert/China) |
| **Stations** | `Station` *(singular, not* Stations) |
| **Deli** | Deli/Sandwhiches, Deli/Breads, Deli/Sandwiches, Deli, Sandwich, Wrap |
| **Room Temp / Displays** | Room Temp Display, Display, Buffet China |

---

## Recommended Next Step

To align with your Airtable, the Cursor code should be updated to include:

1. **Presented:** `Presented App/metal`, `Presented App/china`
2. **Desserts:** `Dessert/Metal`, `Dessert/China`
3. **Stations:** `Stations`, `Station Item` (so station components show)

I can propose the exact code changes for `menuCategories.ts` if you want to proceed.
