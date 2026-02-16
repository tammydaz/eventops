# How the Menu Picker Code Works - For Airtable/Omni

## What We're Building
A menu item picker in a React app that lets users select menu items for different food categories:
- Passed Appetizers
- Presented Appetizers  
- Buffet – Metal
- Buffet – China
- Desserts

## How the Code Categorizes Menu Items

### Step 1: Fetching Data from Airtable
The code fetches menu items from the **Menu Items table** (`tbl0aN33DGG6R1sPZ`) with these fields:

```javascript
// Field IDs we're using:
MENU_ITEMS_DISPLAY_NAME_FIELD_ID = "fldQ83gpgOmMxNMQw"  // "Description Name/Formula" field
MENU_ITEMS_CATEGORY_FIELD_ID = "fldM7lWvjH8S0YNSX"      // "Category" field (multi-select)
MENU_ITEMS_SERVICE_TYPE_FIELD_ID = "fld2EhDP5GRalZJzQ"  // "Service Type" field (single-select)
MENU_ITEMS_VESSEL_TYPE_FIELD_ID = "fldZCnfKzWijIDaeV"   // "Vessel Type" field (single-select)
```

### Step 2: Category Mapping Logic
Once we have the data, we categorize each menu item using this logic:

#### Primary Rules (using Service Type field):
- **Passed Appetizers** → Service Type includes "passed"
- **Presented Appetizers** → Service Type includes "room temp" OR "display"
- **Buffet-Metal** → Service Type includes "buffet" OR "entrée" + (Vessel Type = "metal"/"full pan" OR empty)
- **Buffet-China** → Service Type includes "buffet" OR "entrée" + (Vessel Type includes "china")
- **Desserts** → Service Type includes "dessert"

#### Fallback Rules (when Service Type is empty, use Category field):
- **Category = "Appetizer"** → Passed Appetizers
- **Category = "Entrée"** → Buffet-Metal
- **Category = "Buffet Item"** → Buffet-Metal
- **Category = "Display"** → Presented Appetizers
- **Category = "Dessert"** → Desserts

### Step 3: Filtering in the Picker
When user clicks "+ Add Passed Appetizer":
1. Modal opens
2. Code filters ALL menu items to only show items that match "Passed Appetizers" category
3. If user types in search box, further filter within those results
4. Display the filtered list

## Current Issues

### What the Code Expects from Airtable:
For each menu item, we need these fields populated:

1. **Description Name/Formula** (fldQ83gpgOmMxNMQw)
   - Should contain: Emoji + Item Name + Sauce
   - Example: "🍤 Mozzarella Sticks – Marinara Sauce"
   - This is what displays in the picker

2. **Service Type** (fld2EhDP5GRalZJzQ) - PREFERRED for categorization
   - Should be one of: "Passed App", "Room Temp Display", "Buffet", "Buffet – Hot", "Entrée", "Dessert"
   - This is the PRIMARY way we categorize items

3. **Category** (fldM7lWvjH8S0YNSX) - FALLBACK for categorization
   - Should be one of: "Appetizer", "Entrée", "Buffet Item", "Display", "Dessert"
   - Used ONLY if Service Type is empty

4. **Vessel Type** (fldZCnfKzWijIDaeV) - Used to distinguish Metal vs China for buffet items
   - Examples: "Metal – Hot", "Full Pan (Hot)", "China – Cold / Display", "China – Room Temp"

## Questions for Omni/Airtable

1. **Are all menu items supposed to have a Service Type set?**
   - Currently many items have empty Service Type fields
   - Should we rely on Category field instead?

2. **How do you distinguish between Buffet-Metal and Buffet-China items?**
   - Currently using Vessel Type field
   - Is there a better field to use?

3. **What's the authoritative field for categorizing menu items?**
   - Service Type?
   - Category?
   - Some other field?

4. **Should "Presented Appetizers" = "Room Temp Display" items?**
   - Or is there a different Service Type we should look for?

## What Data Looks Like Currently (Sample from Airtable)

From our test query of 30 items:

| Item Name | Service Type | Category | Vessel Type | Our Categorization |
|-----------|-------------|----------|-------------|-------------------|
| Mozzarella Sticks | Passed App | Appetizer | Metal – Hot | ✅ Passed Appetizers |
| Fig & Goat Cheese Crostini | (empty) | Appetizer | (empty) | ✅ Passed Appetizers (fallback) |
| Beef Brisket | Entrée | Entrée | (empty) | ✅ Buffet-Metal |
| White Chocolate Apples | Dessert | Dessert | China – Cold | ✅ Desserts |
| Grande Charcuterie | Room Temp Display | Display | China – Room Temp | ✅ Presented Appetizers |
| Roasted Potatoes | (empty) | Buffet Item | (empty) | ✅ Buffet-Metal (fallback) |

**Result**: All 30 items successfully categorized into one of the 5 pickers.

## Current Code Behavior

### What Works:
- ✅ Fetches menu items from Airtable
- ✅ Displays formatted names with emojis
- ✅ Filters items by category
- ✅ Search within category works
- ✅ Saves selections back to Airtable

### What Might Be Wrong:
- ❓ Items showing in wrong category pickers?
- ❓ Not all items appearing?
- ❓ Names not displaying correctly?

## How Selections Are Saved

When user selects menu items, we save them as **linked records** back to the Events table:

```javascript
// We save to these fields in the Events table:
PASSED_APPETIZERS field → Array of Menu Item record IDs
PRESENTED_APPETIZERS field → Array of Menu Item record IDs
BUFFET_ITEMS field → Array of Menu Item record IDs (both Metal and China)
DESSERTS field → Array of Menu Item record IDs
```

**Note**: Buffet-Metal and Buffet-China both save to the same `BUFFET_ITEMS` field. They're only separated in the UI for clarity during selection.

## What We Need from Airtable

To make this work perfectly, we need:

1. **Consistent Service Type values** across all menu items
2. **Clear distinction** between Buffet-Metal and Buffet-China items
3. **Formatted display names** in the "Description Name/Formula" field with emojis

If the current field structure doesn't support this categorization clearly, we may need to:
- Add a new field specifically for UI category?
- Use a different existing field?
- Change our categorization logic?

---

**Question for Omni**: Based on the FoodWerx Airtable structure, what's the best way to categorize menu items into these 5 categories for the picker?
