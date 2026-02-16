# Menu Picker Fix - Code Reference

## 📁 Files Changed

### 1. src/services/airtable/linkedRecords.ts

#### Changes Made:
- Updated `LinkedRecordItem` type to include `serviceType` and `vesselType`
- Added correct Airtable field IDs
- Modified `loadMenuItems()` to fetch additional fields

#### Key Code Sections:

```typescript
// Updated type definition
export type LinkedRecordItem = {
  id: string;
  name: string;
  category?: string; // Airtable Category field
  serviceType?: string; // NEW: Service Type field
  vesselType?: string; // NEW: Vessel Type field
};

// Added field IDs
const MENU_ITEMS_SERVICE_TYPE_FIELD_ID = "fld2EhDP5GRalZJzQ";
const MENU_ITEMS_VESSEL_TYPE_FIELD_ID = "fldZCnfKzWijIDaeV";

// Updated loadMenuItems() function
export const loadMenuItems = async () => {
  // ... fetch additional fields
  params.append("fields[]", MENU_ITEMS_SERVICE_TYPE_FIELD_ID);
  params.append("fields[]", MENU_ITEMS_VESSEL_TYPE_FIELD_ID);
  
  return data.records.map((record) => ({
    id: record.id,
    name: asString(record.fields[MENU_ITEMS_NAME_FIELD_ID]),
    category: asSingleSelectName(record.fields[MENU_ITEMS_CATEGORY_FIELD_ID]),
    serviceType: asString(record.fields[MENU_ITEMS_SERVICE_TYPE_FIELD_ID]), // NEW
    vesselType: asString(record.fields[MENU_ITEMS_VESSEL_TYPE_FIELD_ID]), // NEW
  }));
};
```

---

### 2. src/utils/menuCategories.ts (NEW FILE)

#### Purpose:
Maps Airtable menu item data to UI categories

#### Key Functions:

```typescript
export type MenuCategory =
  | "Passed Appetizers"
  | "Presented Appetizers"
  | "Buffet-Metal"
  | "Buffet-China"
  | "Desserts";

/**
 * Maps Airtable data to UI category
 */
export function getMenuItemCategory(item: LinkedRecordItem): MenuCategory | null {
  const serviceType = item.serviceType?.toLowerCase() || "";
  const vesselType = item.vesselType?.toLowerCase() || "";

  if (serviceType.includes("dessert")) return "Desserts";
  if (serviceType.includes("passed")) return "Passed Appetizers";
  if (serviceType.includes("room temp") || serviceType.includes("display")) {
    return "Presented Appetizers";
  }
  if (serviceType.includes("buffet")) {
    if (vesselType.includes("metal")) return "Buffet-Metal";
    if (vesselType.includes("china")) return "Buffet-China";
    return "Buffet-Metal"; // default
  }
  return null;
}

/**
 * Filters menu items by category
 */
export function filterMenuItemsByCategory(
  items: LinkedRecordItem[],
  category: MenuCategory
): LinkedRecordItem[] {
  return items.filter(item => getMenuItemCategory(item) === category);
}
```

---

### 3. src/components/intake/MenuItemsPanel.tsx

#### Major Changes:

##### A. Import Statement
```typescript
import { type MenuCategory, filterMenuItemsByCategory } from "../../utils/menuCategories";
```

##### B. Updated PickerState Type
```typescript
type PickerState = {
  isOpen: boolean;
  section: keyof MenuSelections | null;
  category: MenuCategory | null; // NEW: Added category
  title: string;
};
```

##### C. State Initialization
```typescript
const [pickerState, setPickerState] = useState<PickerState>({ 
  isOpen: false, 
  section: null, 
  category: null, // NEW
  title: "" 
});
// REMOVED: tempSelections state
```

##### D. openPicker Function
```typescript
const openPicker = (
  section: keyof MenuSelections, 
  category: MenuCategory, // NEW: category parameter
  title: string
) => {
  setPickerState({ isOpen: true, section, category, title });
  setPickerSearch("");
};
```

##### E. closePicker Function
```typescript
const closePicker = () => {
  setPickerState({ isOpen: false, section: null, category: null, title: "" });
  setPickerSearch("");
};
```

##### F. New addMenuItem Function
```typescript
const addMenuItem = async (itemId: string) => {
  if (!selectedEventId || !pickerState.section) return;
  
  const section = pickerState.section;
  
  // Duplicate prevention
  if (selections[section].includes(itemId)) {
    closePicker();
    return;
  }
  
  // Append item
  const newItems = [...selections[section], itemId];
  setSelections(prev => ({ ...prev, [section]: newItems }));
  
  // Save to Airtable
  const linkedRecords = newItems.map(id => ({ id }));
  await setFields(selectedEventId, { [fieldIdByKey[section]]: linkedRecords });
  
  // Close immediately
  closePicker();
};

// REMOVED: toggleTempSelection() function
// REMOVED: savePickerSelections() function
```

##### G. Updated filteredPickerItems
```typescript
const filteredPickerItems = useMemo(() => {
  if (!pickerState.category) return [];
  
  // First filter by category
  let filtered = filterMenuItemsByCategory(menuItems, pickerState.category);
  
  // Then filter by search term
  if (pickerSearch.trim()) {
    const term = pickerSearch.toLowerCase();
    filtered = filtered.filter(item => item.name.toLowerCase().includes(term));
  }
  
  return filtered;
}, [menuItems, pickerState.category, pickerSearch]);
```

##### H. Updated Button Calls
```typescript
// Passed Appetizers
<button onClick={() => openPicker("passedAppetizers", "Passed Appetizers", "Passed Appetizers")}>
  + Add Passed Appetizer
</button>

// Presented Appetizers
<button onClick={() => openPicker("presentedAppetizers", "Presented Appetizers", "Presented Appetizers")}>
  + Add Presented Appetizer
</button>

// Buffet - Metal
<button onClick={() => openPicker("buffetItems", "Buffet-Metal", "Buffet - Metal")}>
  + Add Buffet Item (Metal)
</button>

// Buffet - China
<button onClick={() => openPicker("buffetItems", "Buffet-China", "Buffet - China")}>
  + Add Buffet Item (China)
</button>

// Desserts
<button onClick={() => openPicker("desserts", "Desserts", "Desserts")}>
  + Add Dessert
</button>
```

##### I. Updated Modal UI
```typescript
<div className="flex-1 overflow-y-auto p-4">
  {filteredPickerItems.map((item) => (
    <div
      key={item.id}
      onClick={() => addMenuItem(item.id)} // NEW: Direct add on click
      className="flex items-center gap-3 px-4 py-3 mb-2 bg-gray-800 border border-gray-700 rounded-md hover:bg-red-900 hover:border-red-600 cursor-pointer transition"
    >
      <span className="text-gray-300">{item.name}</span>
    </div>
  ))}
  {filteredPickerItems.length === 0 && (
    <div className="text-center py-8 text-gray-400">No items found</div>
  )}
</div>
<div className="border-t border-red-600 p-4 flex items-center justify-between">
  <span className="text-sm text-gray-400">
    {filteredPickerItems.length} item{filteredPickerItems.length !== 1 ? 's' : ''} available
  </span>
  <button onClick={closePicker} className="px-4 py-2 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-800 transition">
    Close
  </button>
</div>

// REMOVED: Checkbox UI
// REMOVED: "Add Selected" button
```

---

## 🔍 Where to Find Components

### In the App:
1. Navigate to: `/intake` or `/beo-intake`
2. Select an event from the dropdown
3. Scroll to: **"Menu Items & Food Sections"** panel
4. Click any "+ Add Item" button

### In the Codebase:
- **Component**: `src/components/intake/MenuItemsPanel.tsx`
- **Used in**: `src/pages/IntakePage.tsx`
- **Route**: Defined in `src/router.tsx`

---

## 🎯 Key Behavioral Changes

| Action | Before | After |
|--------|--------|-------|
| Open picker | Shows ALL items | Shows ONLY category-filtered items |
| Click item | Checkbox toggles | Item added + modal closes |
| Add multiple | Select all, then "Add" | Click each item individually |
| Search | Searches all items | Searches within category |
| Close modal | Manual click | Auto-close on selection OR manual |
| Duplicates | Could add duplicates | Prevented automatically |

---

## 🧪 Testing Checklist

- [ ] Category filtering works for all 5 sections
- [ ] Search filters within category only
- [ ] Clicking an item adds it immediately
- [ ] Modal closes after adding
- [ ] Can add unlimited items
- [ ] Duplicate prevention works
- [ ] Remove button works
- [ ] Data persists after page refresh
- [ ] No console errors
- [ ] No TypeScript errors

---

## 📊 Data Flow Diagram

```
User Action: Click "+ Add Passed Appetizer"
              ↓
openPicker("passedAppetizers", "Passed Appetizers", "Passed Appetizers")
              ↓
Modal Opens → pickerState = { 
  isOpen: true,
  section: "passedAppetizers",
  category: "Passed Appetizers",
  title: "Passed Appetizers"
}
              ↓
filteredPickerItems = useMemo(() => {
  1. filterMenuItemsByCategory(menuItems, "Passed Appetizers")
     → Returns only items where serviceType.includes("passed")
  2. Filter by search term (if any)
  3. Return filtered array
})
              ↓
User sees: ~20 Passed App items (no desserts, no buffet)
              ↓
User clicks "Mozzarella Sticks"
              ↓
addMenuItem("rec0MnkolhUFBvHF3")
              ↓
Check: Is it already in selections.passedAppetizers?
  - No → Continue
  - Yes → Close modal, don't add
              ↓
newItems = [...selections.passedAppetizers, "rec0MnkolhUFBvHF3"]
              ↓
setSelections({ ...prev, passedAppetizers: newItems })
              ↓
Save to Airtable: setFields(eventId, { 
  [FIELD_IDS.PASSED_APPETIZERS]: newItems.map(id => ({ id }))
})
              ↓
closePicker() → Modal closes
              ↓
UI Updates → "Mozzarella Sticks" appears in Passed Appetizers list
```

---

## 🛠️ Troubleshooting

### Issue: Items not filtering correctly
**Check**: Verify Airtable field IDs are correct in `linkedRecords.ts`
**Solution**: Run diagnostic script to check field values

### Issue: Modal not closing on selection
**Check**: Verify `addMenuItem()` calls `closePicker()` at the end
**Solution**: Ensure no async/await issues

### Issue: Duplicate items appearing
**Check**: Verify duplicate prevention logic in `addMenuItem()`
**Solution**: Check if `selections[section].includes(itemId)` is working

### Issue: Search not respecting category
**Check**: Verify `filteredPickerItems` filters by category BEFORE search
**Solution**: Ensure `filterMenuItemsByCategory()` is called first

---

## ✅ Completion Checklist

- [x] Airtable field IDs added
- [x] LinkedRecordItem type updated
- [x] loadMenuItems() updated
- [x] menuCategories.ts created
- [x] Category filtering implemented
- [x] Immediate add & close implemented
- [x] Search scoped to category
- [x] Duplicate prevention added
- [x] All buttons updated with categories
- [x] Modal UI simplified
- [x] No TypeScript errors
- [x] No linter errors
- [x] Documentation created
- [x] Test plan provided
