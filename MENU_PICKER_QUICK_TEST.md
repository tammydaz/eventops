# 🚀 Menu Picker - Quick Test Guide

## How to Test the Fix

### Step 1: Open the App
```
1. Start the development server (if not running)
2. Navigate to: http://localhost:5173/intake
   (or your configured URL)
```

### Step 2: Select an Event
```
1. Click the "Select Event" dropdown at the top
2. Choose any event with an event date
3. Wait for event data to load
```

### Step 3: Open Menu Items Section
```
1. Scroll down to find: "▶ MENU ITEMS & FOOD SECTIONS"
2. Click to expand the section
3. You should see 5 subsections:
   - Passed Appetizers
   - Presented Appetizers
   - Buffet – Metal
   - Buffet – China
   - Desserts
```

---

## ✅ Test 1: Category Filtering (2 minutes)

### Passed Appetizers
```
1. Click: "+ Add Passed Appetizer"
2. ✓ Modal opens
3. ✓ Title shows: "Passed Appetizers"
4. ✓ Items shown should be appetizers only (e.g., "Mozzarella Sticks")
5. ✗ Should NOT show desserts or buffet items
6. Click "Close" or X to close modal
```

### Desserts
```
1. Click: "+ Add Dessert"
2. ✓ Modal opens
3. ✓ Title shows: "Desserts"
4. ✓ Items shown should be desserts only
5. ✗ Should NOT show appetizers or buffet items
6. Click "Close" to close modal
```

### Repeat for Other Categories
```
- Presented Appetizers → Should show display/room temp items
- Buffet – Metal → Should show buffet items with metal vessels
- Buffet – China → Should show buffet items with china vessels
```

**PASS CRITERIA**: Each category shows ONLY relevant items

---

## ✅ Test 2: Immediate Add & Close (1 minute)

```
1. Click: "+ Add Passed Appetizer"
2. Click any item (e.g., "Mozzarella Sticks")
3. ✓ Modal closes IMMEDIATELY
4. ✓ "Mozzarella Sticks" appears in Passed Appetizers list
5. No additional clicks needed
```

**PASS CRITERIA**: One click = item added + modal closed

---

## ✅ Test 3: Unlimited Additions (1 minute)

```
1. Click: "+ Add Passed Appetizer"
2. Add item #1
3. Click: "+ Add Passed Appetizer" again
4. Add item #2
5. Repeat 3-5 times
6. ✓ All items appear in the list
7. ✗ No items should be overwritten
```

**PASS CRITERIA**: Multiple items can be added without overwriting

---

## ✅ Test 4: Search Within Category (1 minute)

```
1. Click: "+ Add Passed Appetizer"
2. Type "chicken" in search box
3. ✓ Results show ONLY Passed App items with "chicken"
4. ✗ Should NOT show chicken desserts
5. ✗ Should NOT show chicken buffet items
6. Clear search or click "Close"
```

**PASS CRITERIA**: Search respects category filter

---

## ✅ Test 5: Duplicate Prevention (30 seconds)

```
1. Add "Mozzarella Sticks" to Passed Appetizers
2. Try to add "Mozzarella Sticks" again
3. ✓ Modal closes
4. ✓ "Mozzarella Sticks" appears only ONCE in the list
```

**PASS CRITERIA**: Duplicate items are prevented

---

## ✅ Test 6: Remove Items (30 seconds)

```
1. Click the "✕" button next to any item
2. ✓ Item disappears from the list
3. Refresh the page and check event
4. ✓ Removed item should not reappear
```

**PASS CRITERIA**: Remove button works correctly

---

## ✅ Test 7: Data Persistence (1 minute)

```
1. Add 3 items to Passed Appetizers
2. Add 2 items to Desserts
3. Refresh the page (F5 or Ctrl+R)
4. Select the same event
5. Expand "Menu Items & Food Sections"
6. ✓ All 5 items should still be there
```

**PASS CRITERIA**: Data persists after refresh

---

## 🎯 Quick Visual Check

### BEFORE (Broken)
```
Click "+ Add Passed Appetizer"
Modal shows:
├─ 🍤 Mozzarella Sticks           ← Correct
├─ 🍤 Buffalo Wings                ← Correct
├─ 🍰 Chocolate Cake              ← WRONG (dessert!)
├─ 🥗 Caesar Salad Buffet         ← WRONG (buffet!)
├─ 🍤 Shrimp Cocktail             ← Correct
└─ ... 195 more items             ← Too many!
```

### AFTER (Fixed)
```
Click "+ Add Passed Appetizer"
Modal shows:
├─ 🍤 Mozzarella Sticks           ← Correct
├─ 🍤 Buffalo Wings                ← Correct
├─ 🍤 Shrimp Cocktail             ← Correct
├─ 🍤 Chicken Skewers             ← Correct
└─ ... 16 more passed apps        ← Perfect!
```

---

## ❌ Known Issues (Report if Found)

### Issue: No items showing in picker
**Possible Cause**: Menu items not loaded yet
**Solution**: Wait a few seconds, or check console for errors

### Issue: All items still showing (not filtered)
**Possible Cause**: Airtable field IDs incorrect
**Solution**: Check `linkedRecords.ts` field IDs

### Issue: Modal not closing on click
**Possible Cause**: JavaScript error
**Solution**: Check browser console for errors

---

## 📊 Test Results Template

```
Date: _____________
Tester: _____________

Test 1 - Category Filtering:       [ ] PASS  [ ] FAIL
Test 2 - Immediate Add & Close:    [ ] PASS  [ ] FAIL
Test 3 - Unlimited Additions:      [ ] PASS  [ ] FAIL
Test 4 - Search Within Category:   [ ] PASS  [ ] FAIL
Test 5 - Duplicate Prevention:     [ ] PASS  [ ] FAIL
Test 6 - Remove Items:             [ ] PASS  [ ] FAIL
Test 7 - Data Persistence:         [ ] PASS  [ ] FAIL

Notes:
_________________________________________
_________________________________________
_________________________________________
```

---

## 🎉 Expected Result

After all tests pass, you should be able to:
- ✅ See ONLY relevant items in each picker
- ✅ Add items with one click
- ✅ Add unlimited items
- ✅ Search within categories
- ✅ Prevent duplicates automatically
- ✅ Remove items easily
- ✅ Have data persist correctly

**Total Test Time**: ~7-8 minutes
