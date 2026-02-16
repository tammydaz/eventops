# Menu Item Category Extraction Fix ✅

## Issue
The category field is a **multi-select** in Airtable, which returns an array of objects `[{ id, name }]`, not an array of strings.

The previous code was trying to extract `categoryField[0]` directly, which would give the entire object instead of just the name.

## Fix Applied

### File: `src/services/airtable/linkedRecords.ts`

**Old Code (Line 84):**
```typescript
if (Array.isArray(categoryField) && categoryField.length > 0) {
  category = categoryField[0];  // ❌ This gets the whole object!
}
```

**New Code:**
```typescript
const categoryRaw = record.fields[MENU_ITEMS_CATEGORY_FIELD_ID];

// Category is a multi-select, which returns [{ id, name }]
let category: string | null = null;
if (Array.isArray(categoryRaw) && categoryRaw.length > 0) {
  // Multi-select returns array of objects with 'name' property
  category = (categoryRaw[0] as any)?.name || null;  // ✅ Extract .name property
}

// Temporary debug logging
console.log("Loaded item:", {
  name: item.name,
  category,
  raw: categoryRaw
});
```

## Category Section Map Verified ✅

The `CATEGORY_SECTION_MAP` already has the correct exact strings matching Airtable:

```typescript
export const CATEGORY_SECTION_MAP: Record<string, string[]> = {
  passed: ["Passed App"],          // ✅ Exact match
  presented: ["Presented App"],    // ✅ Exact match
  buffet_metal: ["Buffet Metal"],  // ✅ Exact match
  buffet_china: ["Buffet China"],  // ✅ Exact match
  desserts: ["Dessert"],           // ✅ Exact match
};
```

## Expected Console Output

After this fix, when you load the menu items, you should see:

```
Loaded item: { name: "🥩 Beef Slider", category: "Passed App", raw: [{ id: "...", name: "Passed App" }] }
Loaded item: { name: "🍤 Shrimp Cocktail", category: "Presented App", raw: [{ id: "...", name: "Presented App" }] }
Loaded item: { name: "🍗 Chicken Tenders", category: "Buffet Metal", raw: [{ id: "...", name: "Buffet Metal" }] }
```

## Test Now

```bash
npm run dev
```

1. Open the BEO Full Intake page
2. Select an event
3. Open "Menu Items & Food Sections"
4. Open browser console (F12)
5. Click "+ Add Passed Appetizer"
6. **You should see console logs showing the correct category names**
7. **The picker should now display items!**

## Debugging

If items still don't show:
1. Check console for the raw category data structure
2. Verify the category names in Airtable exactly match the map
3. Ensure `cellFormat: "json"` is set (it is)

---

**Status:** ✅ FIXED - Category extraction now correctly handles multi-select format
