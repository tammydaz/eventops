# 📍 Where to Paste Code - Installation Guide

## ✅ GOOD NEWS: All Code Already Applied!

The fix has been automatically applied to your codebase. No manual copy-pasting needed!

---

## 📁 Files That Were Modified

### 1. ✅ `src/services/airtable/linkedRecords.ts`
**Status**: UPDATED
**Changes**:
- Added `serviceType` and `vesselType` to `LinkedRecordItem` type
- Added correct Airtable field IDs
- Updated `loadMenuItems()` function

**Location**: Line 4-13 (type definition) and Line 56-83 (function)

---

### 2. ✅ `src/utils/menuCategories.ts`
**Status**: NEW FILE CREATED
**Purpose**: Category mapping utility
**Contains**:
- `MenuCategory` type definition
- `getMenuItemCategory()` function
- `filterMenuItemsByCategory()` function

**Location**: Entire file (60 lines)

---

### 3. ✅ `src/components/intake/MenuItemsPanel.tsx`
**Status**: UPDATED
**Changes**:
- Imported `MenuCategory` and `filterMenuItemsByCategory`
- Updated `PickerState` type
- Modified `openPicker()` and `closePicker()`
- Replaced multi-select logic with `addMenuItem()`
- Updated `filteredPickerItems` with category filtering
- Updated all 5 "+ Add Item" buttons
- Simplified picker modal UI

**Location**: Multiple sections throughout the file (517 lines total)

---

## 🔍 How to Verify Installation

### Method 1: Check File Timestamps
```bash
# In PowerShell/Command Prompt
cd C:\eventops
dir src\utils\menuCategories.ts
# Should show today's date
```

### Method 2: Check Imports
Open `src/components/intake/MenuItemsPanel.tsx` and look for line 11:
```typescript
import { type MenuCategory, filterMenuItemsByCategory } from "../../utils/menuCategories";
```
✅ If this line exists, the fix is installed.

### Method 3: Check Function Signature
Open `src/components/intake/MenuItemsPanel.tsx` and search for `openPicker`:
```typescript
const openPicker = (section: keyof MenuSelections, category: MenuCategory, title: string) => {
```
✅ If it has 3 parameters (including `category`), the fix is installed.

### Method 4: Run TypeScript Check
```bash
npm run build
# or
npx tsc --noEmit
```
✅ If no errors, installation is correct.

---

## 🚀 Next Steps

### 1. Test in Browser
```bash
# Start dev server (if not running)
npm run dev

# Open browser to:
http://localhost:5173/intake
```

### 2. Follow Test Guide
Open: `MENU_PICKER_QUICK_TEST.md`
Run all 7 tests (takes ~7 minutes)

### 3. Verify Behavior
- Each category shows ONLY relevant items
- Clicking an item adds it immediately
- Modal closes automatically
- Search respects category filter

---

## 🆘 If Something Went Wrong

### Option 1: Re-run the Fix
If you need to manually apply the changes:

1. **For `linkedRecords.ts`**:
   - Locate the file: `src/services/airtable/linkedRecords.ts`
   - Check lines 4-13 for the `LinkedRecordItem` type
   - Check lines 10-12 for the field ID constants
   - Check lines 56-83 for the `loadMenuItems()` function

2. **For `menuCategories.ts`**:
   - Check if file exists: `src/utils/menuCategories.ts`
   - If not, create it and copy content from `MENU_PICKER_CODE_REFERENCE.md`

3. **For `MenuItemsPanel.tsx`**:
   - Locate the file: `src/components/intake/MenuItemsPanel.tsx`
   - Check line 11 for the import statement
   - Check line 55-60 for the `PickerState` type
   - Check line 173-181 for `openPicker()` and `closePicker()`
   - Check line 183-201 for `addMenuItem()`
   - Check line 218-231 for `filteredPickerItems`

### Option 2: Review Changes in Git
```bash
git status
# Shows modified files

git diff src/services/airtable/linkedRecords.ts
# Shows changes to linkedRecords.ts

git diff src/components/intake/MenuItemsPanel.tsx
# Shows changes to MenuItemsPanel.tsx
```

### Option 3: Check Console for Errors
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. If you see TypeScript errors, run: `npm run build`

---

## 📋 Quick Checklist

Before testing, verify these files exist and have been modified:

- [ ] `src/services/airtable/linkedRecords.ts` - Modified today
- [ ] `src/utils/menuCategories.ts` - Created today (NEW)
- [ ] `src/components/intake/MenuItemsPanel.tsx` - Modified today
- [ ] No TypeScript errors when running `npm run build`
- [ ] No console errors in browser
- [ ] Dev server is running (`npm run dev`)

---

## 🎯 What to Expect

After installation, when you:

1. **Click "+ Add Passed Appetizer"**
   - Modal shows ~20 passed appetizer items
   - NO desserts, NO buffet items

2. **Click an item**
   - Modal closes immediately
   - Item appears in the list

3. **Search "chicken"**
   - Results filtered to current category only
   - If in Passed Apps, only shows passed appetizer chicken items

4. **Try to add duplicate**
   - Modal closes, item not duplicated

5. **Refresh page**
   - All items still there (data persists)

---

## 📞 Support

If you encounter issues:

1. **Check Documentation**:
   - `MENU_PICKER_FIX_SUMMARY.md` - Overview
   - `MENU_PICKER_CODE_REFERENCE.md` - Detailed code
   - `MENU_PICKER_QUICK_TEST.md` - Testing guide
   - `MENU_PICKER_BEFORE_AFTER.md` - Visual comparison

2. **Check Console**:
   - Browser DevTools Console (F12)
   - Look for TypeScript or JavaScript errors

3. **Verify Field IDs**:
   - Open `src/services/airtable/linkedRecords.ts`
   - Verify field IDs match your Airtable base
   - If different, update the constants

---

## ✅ Installation Complete!

The Menu Items Picker fix is now installed and ready to test.

**Next**: Open `MENU_PICKER_QUICK_TEST.md` and run the test suite.
