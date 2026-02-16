# 🔍 Extracted Working Menu Picker Code

## Source File
`c:\eventops\src\components\intake\MenuItemsPanel.tsx`

This component has a **working multi-select menu picker** with checkboxes, search, and proper modal behavior.

---

## 🎯 Key Working Features

### 1. **Multi-Select Checkbox Modal**
- Opens with category-specific items
- Uses checkboxes (not click-to-add)
- Has search functionality
- "Add Selected" button to confirm
- Uses React Portal to prevent z-index issues

### 2. **Temporary Selection Pattern**
```typescript
const [tempSelections, setTempSelections] = useState<string[]>([]);

// When opening picker
const openPicker = (section, title) => {
  setTempSelections(selections[section]); // Load current
  setPickerState({ isOpen: true, section, title });
};

// Toggle temp selection
const toggleTempSelection = (itemId: string) => {
  setTempSelections(prev => 
    prev.includes(itemId)
      ? prev.filter(id => id !== itemId) // Uncheck
      : [...prev, itemId]                // Check
  );
};

// Save when clicking "Add Selected"
const savePickerSelections = async () => {
  setSelections(prev => ({ ...prev, [section]: tempSelections }));
  const linkedRecords = tempSelections.map(id => ({ id }));
  await setFields(selectedEventId, { [fieldId]: linkedRecords });
  closePicker();
};
```

### 3. **Search Within Category**
```typescript
const filteredPickerItems = useMemo(() => {
  if (!pickerSearch.trim()) return menuItems;
  const term = pickerSearch.toLowerCase();
  return menuItems.filter(item => item.name.toLowerCase().includes(term));
}, [menuItems, pickerSearch]);
```

### 4. **Portal Modal Structure**
```typescript
{pickerState.isOpen && createPortal(
  <div className="fixed inset-0 z-[99998] bg-black bg-opacity-70" onClick={closePicker}>
    <div className="bg-gray-900 rounded-lg" onClick={(e) => e.stopPropagation()}>
      {/* Header with search */}
      <div className="border-b border-red-600 p-4">
        <input type="text" placeholder="Search..." />
      </div>
      
      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredPickerItems.map((item) => (
          <div onClick={() => toggleTempSelection(item.id)}>
            <Checkbox checked={tempSelections.includes(item.id)} />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
      
      {/* Footer with buttons */}
      <div className="border-t p-4">
        <button onClick={closePicker}>Cancel</button>
        <button onClick={savePickerSelections}>
          Add Selected ({tempSelections.length})
        </button>
      </div>
    </div>
  </div>,
  document.body
)}
```

---

## ⚠️ What's Missing (Why It Doesn't Filter by Category)

The current implementation **does NOT filter by category**. It shows ALL menu items for every section.

**The issue:**
```typescript
// Line 220-224 in MenuItemsPanel.tsx
const filteredPickerItems = useMemo(() => {
  if (!pickerSearch.trim()) return menuItems; // ❌ Shows ALL items
  const term = pickerSearch.toLowerCase();
  return menuItems.filter(item => item.name.toLowerCase().includes(term));
}, [menuItems, pickerSearch]);
```

**What's needed:**
```typescript
const filteredPickerItems = useMemo(() => {
  // First filter by category
  let filtered = menuItems.filter(item => item.category === pickerState.category);
  
  // Then filter by search
  if (pickerSearch.trim()) {
    const term = pickerSearch.toLowerCase();
    filtered = filtered.filter(item => item.name.toLowerCase().includes(term));
  }
  
  return filtered;
}, [menuItems, pickerState.category, pickerSearch]);
```

---

## 🔑 Key Code Sections to Reuse

### A. Picker State Management
```typescript
type PickerState = {
  isOpen: boolean;
  section: keyof MenuSelections | null;
  title: string;
};

const [pickerState, setPickerState] = useState<PickerState>({ 
  isOpen: false, 
  section: null, 
  title: "" 
});
```

### B. Temporary Selection Array
```typescript
const [tempSelections, setTempSelections] = useState<string[]>([]);
```

### C. Open/Close Functions
```typescript
const openPicker = (section: keyof MenuSelections, title: string) => {
  setPickerState({ isOpen: true, section, title });
  setPickerSearch("");
  setTempSelections(selections[section]); // Pre-fill with current
};

const closePicker = () => {
  setPickerState({ isOpen: false, section: null, title: "" });
  setPickerSearch("");
  setTempSelections([]);
};
```

### D. Toggle Checkbox
```typescript
const toggleTempSelection = (itemId: string) => {
  setTempSelections(prev => 
    prev.includes(itemId)
      ? prev.filter(id => id !== itemId)
      : [...prev, itemId]
  );
};
```

### E. Save Button
```typescript
const savePickerSelections = async () => {
  if (!selectedEventId || !pickerState.section) return;
  
  const section = pickerState.section;
  setSelections(prev => ({ ...prev, [section]: tempSelections }));
  
  const linkedRecords = tempSelections.map(id => ({ id }));
  await setFields(selectedEventId, { [fieldIdByKey[section]]: linkedRecords });
  
  closePicker();
};
```

### F. Checkbox Component (Inline)
```typescript
<div style={{
  width: "20px",
  height: "20px",
  border: "2px solid #666",
  borderRadius: "4px",
  background: isChecked ? "#ff3333" : "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}}>
  {isChecked && (
    <svg style={{ width: "14px", height: "14px", color: "#fff" }} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  )}
</div>
```

---

## 🔧 What Needs to Be Added

To make this work with **category filtering**, you need:

1. **Add category prop to picker state:**
```typescript
type PickerState = {
  isOpen: boolean;
  section: keyof MenuSelections | null;
  category: string | null; // ← ADD THIS
  title: string;
};
```

2. **Pass category when opening:**
```typescript
openPicker("passedAppetizers", "Passed Appetizers", "Passed Appetizers");
//         ↑ section key     ↑ category value    ↑ title
```

3. **Filter by category in the memo:**
```typescript
const filteredPickerItems = useMemo(() => {
  let filtered = menuItems;
  
  // Filter by category
  if (pickerState.category) {
    filtered = filtered.filter(item => item.category === pickerState.category);
  }
  
  // Filter by search
  if (pickerSearch.trim()) {
    const term = pickerSearch.toLowerCase();
    filtered = filtered.filter(item => item.name.toLowerCase().includes(term));
  }
  
  return filtered;
}, [menuItems, pickerState.category, pickerSearch]);
```

---

## 📋 Complete Working Pattern Summary

**The OLD working code uses:**
- ✅ Multi-select with checkboxes (not click-to-add)
- ✅ Temporary selection array
- ✅ "Add Selected" confirmation button
- ✅ React Portal for modal
- ✅ Search functionality
- ❌ **Missing:** Category filtering

**To make it work for BEO Intake:**
1. Copy the multi-select checkbox pattern
2. Add category filtering to the `useMemo`
3. Pass category prop when opening picker
4. Keep the "Add Selected" button workflow

---

## 🎯 Your Choice

Would you like me to:

**Option A:** Update the new BEO Intake MenuSection to use the **multi-select checkbox pattern** from the working code?

**Option B:** Keep the click-to-add single-select but fix the category filtering?

The old working version uses **checkboxes + "Add Selected" button**, not click-to-add. Let me know which pattern you prefer!
