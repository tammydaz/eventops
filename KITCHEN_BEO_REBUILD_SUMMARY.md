# 🖨️ Kitchen BEO Print Engine (Page 1) — Rebuild Complete

## ✅ DELIVERABLES

### 1. **Main Component**
- **File**: `src/pages/BeoPrintPage.tsx`
- **Route**: `/beo-print/:eventId`
- **Purpose**: Renders Kitchen BEO (Page 1) following Tammy's FoodWerx blueprint

### 2. **CSS Module**
- **File**: `src/pages/BeoPrintPage.module.css`
- **Style**: FoodWerx cream background (#f5f1e8), soft borders, professional layout
- **Print-ready**: Optimized `@media print` styles included

### 3. **Auto-Spec Engine**
- **File**: `src/utils/beoAutoSpec.ts`
- **Logic**: Pattern-based spec calculations (NOT linear math)
- **Categories**: Passed Apps, Presented Apps, Buffet, Desserts

### 4. **Test Page**
- **File**: `src/pages/PrintTestPage.tsx`
- **Route**: `/print-test`
- **Purpose**: Quick event selection and print preview

---

## 📋 PAGE STRUCTURE (EXACT ORDER)

### 1. **HEADER BLOCK** ✅
**Client vs Contact Collapse Logic:**
- If Client Name ≠ Contact Name → Show BOTH
- If they match → Show Client only
- NO duplicates

**Golden Address Rule:**
- Primary: `VENUE_FULL_ADDRESS`
- Fallback: `CLIENT_FULL_ADDRESS` (if field exists)
- Label: "LOCATION"

**Left Column:**
- CLIENT (with optional business name)
- CONTACT (if different from client)
- PHONE
- VENUE
- LOCATION

**Right Column:**
- DATE
- GUEST COUNT
- DISPATCH TIME
- EVENT ARRIVAL TIME (replaced "Staff Arrival")
- JOB #

---

### 2. **COLLAPSIBLE ALLERGY BANNER** ✅
- **Condition**: Only renders if allergies exist
- **Field**: `FIELD_IDS.ALLERGIES_PRINT`
- **Style**: Red border, collapsible toggle
- **Text**: `⚠️ ALLERGIES / DIETARY RESTRICTIONS: {value}`

---

### 3. **COLLAPSIBLE "NO BUFFET" BANNER** ✅
- **Condition**: Shows if BOTH Buffet-Metal AND Buffet-China are empty
- **Style**: Same as allergy banner
- **Text**: `⚠️ NO BUFFET ITEMS SELECTED`

---

### 4. **MENU SECTIONS (FIXED ORDER)** ✅

Kitchen BEO includes ONLY these sections:
1. **Passed Appetizers**
2. **Presented Appetizers**
3. **Buffet – Metal**
4. **Buffet – China**
5. **Desserts**

**NOT INCLUDED** (these go on Page 2+):
- ❌ Bar
- ❌ Hydration
- ❌ Coffee/Tea
- ❌ Pack-Out
- ❌ Timeline
- ❌ Service Notes

---

### 5. **3-COLUMN LAYOUT** ✅

Every menu item displays on ONE horizontal line:

| **Column 1: Spec Quantities** | **Column 2: Food Item** | **Column 3: Nick's Spec** |
|--------------------------------|-------------------------|---------------------------|
| Auto-calculated quantities     | Item name (bold)        | Dropdown selector         |
| (oz, pans, pieces)             | Sauce (indented italic) | Kitchen prep instructions |

**Column 1 Rules:**
- Passed Apps: `2 oz per guest` (or `1.5 oz` for meatballs/cakes)
- Buffet: Full pan counts using tier-based logic
- Desserts: `1 per guest`
- Flags: `⚠️ Round chafer`, `⚠️ Odd half pan`

**Column 2 Rules:**
- Item name in **bold**
- Sauce lines indented **directly below parent** (no spacing)
- Child never breaks from parent

**Column 3 Rules:**
- Editable dropdown with Nick's approved spec options:
  - Keep warm
  - Heat under lamp
  - Pass with napkins
  - Arrange on platters
  - Pack one dairy-free
  - Display under heat lamp
  - Individual boxes
  - Serve chilled
  - Room temperature
  - Passed butler style
  - Present on risers
  - Keep refrigerated
  - Reheat before service

---

### 6. **FOOTER** ✅
Displays at bottom of Page 1:
- CLIENT
- VENUE
- DISPATCH TIME
- GUEST COUNT
- JOB #

---

## 🔧 AUTO-SPEC ENGINE

### Passed/Presented Appetizers
```
Standard: 2 oz per guest
Meatballs/Cakes: 1.5 oz per guest
```

### Buffet Items (Tier-Based Logic)
```
0-25 guests:   1 half pan
26-50 guests:  1 full pan
51-75 guests:  1 full + 1 half
76-100 guests: 2 full pans
101-150:       3 full pans
151-200:       4 full pans
200+:          1 full pan per 50 guests
```

**Pan Conversion:**
- 2 half pans = 1 full pan
- Odd half pans flagged for review

**Special Flags:**
- Round pans → `⚠️ Round chafer required`
- Odd half pans → `⚠️ Odd half pan`

### Desserts
```
1 piece per guest (no exceptions)
```

---

## 🎯 AIRTABLE FIELD MAPPING

### Header Fields
```typescript
FIELD_IDS.CLIENT_FIRST_NAME
FIELD_IDS.CLIENT_LAST_NAME
FIELD_IDS.CLIENT_BUSINESS_NAME
FIELD_IDS.CLIENT_PHONE
FIELD_IDS.PRIMARY_CONTACT_NAME
FIELD_IDS.PRIMARY_CONTACT_PHONE
FIELD_IDS.VENUE
FIELD_IDS.VENUE_FULL_ADDRESS
FIELD_IDS.EVENT_DATE
FIELD_IDS.GUEST_COUNT
FIELD_IDS.DISPATCH_TIME
FIELD_IDS.FOODWERX_ARRIVAL  // Event Arrival Time
FIELD_IDS.EVENT_NAME         // Used as JOB # (placeholder)
```

### Menu Fields
```typescript
FIELD_IDS.PASSED_APPETIZERS      // Linked records
FIELD_IDS.PRESENTED_APPETIZERS   // Linked records
FIELD_IDS.BUFFET_ITEMS           // Linked records (split Metal/China)
FIELD_IDS.DESSERTS               // Linked records
```

### Banner Fields
```typescript
FIELD_IDS.ALLERGIES_PRINT        // Allergy banner content
```

---

## 🧪 HOW TO TEST

### Method 1: Direct URL
```
Navigate to: /beo-print/:eventId
Replace :eventId with actual Airtable record ID
```

### Method 2: Print Test Page
```
1. Navigate to: /print-test
2. Select event from dropdown
3. Click "Open Print Preview"
4. New tab opens with Kitchen BEO
```

### Method 3: From BEO Intake
```
1. Open BEO Intake page
2. Click "Print / View BEO" button in action bar
3. Opens print page in new tab
```

### Method 4: From Watchtower
```
1. Open Watchtower
2. Hover over event card
3. Click "Print / View BEO" in side panel
```

---

## 📦 FILES CREATED/MODIFIED

### Created
- ✅ `src/pages/BeoPrintPage.tsx` (main component)
- ✅ `src/pages/BeoPrintPage.module.css` (styles)
- ✅ `src/utils/beoAutoSpec.ts` (auto-spec engine)
- ✅ `src/pages/PrintTestPage.tsx` (test page)

### Modified
- ✅ `src/router.tsx` (updated imports and routes)

### Untouched (as required)
- ✅ `src/services/airtable/events.ts` (FIELD_IDS unchanged)
- ✅ `src/services/airtable/linkedRecords.ts` (menu loading unchanged)
- ✅ All existing intake components

---

## ⚠️ NOTES & TODO

### Buffet Split Logic
Currently uses placeholder logic (first half = Metal, second half = China).

**To implement proper split:**
1. Add Buffet category metadata to Menu Items table in Airtable
2. Update `splitBuffetItems()` in `beoAutoSpec.ts` to read category
3. Filter items by category: "Metal" vs "China"

### Job Number Field
Currently uses `EVENT_NAME` as job number.

**To use real job number:**
1. Add `JOB_NUMBER` field ID to `FIELD_IDS` in `events.ts`
2. Update `BeoPrintPage.tsx` line 154:
```typescript
const jobNumber = asString(eventData[FIELD_IDS.JOB_NUMBER]);
```

### Client Full Address
Field `CLIENT_FULL_ADDRESS` not found in current schema.

**If field exists:**
1. Add field ID to `FIELD_IDS`
2. Update Golden Address Rule logic (line 165)

---

## 🖨️ PRINT BEHAVIOR

### Print Styles
- Background changes to white
- Box shadows removed
- Banner toggle buttons hidden
- Clean, professional layout

### Print Command
```
Browser: Ctrl+P (Windows) or Cmd+P (Mac)
Or right-click → Print
```

---

## ✅ REQUIREMENTS MET

- ✅ Client/Contact collapse logic
- ✅ Golden Address Rule
- ✅ Collapsible allergy banner
- ✅ Collapsible "No Buffet" banner
- ✅ 3-column layout (Spec | Item | Nick's Spec)
- ✅ Auto-spec engine (pattern-based, NOT linear)
- ✅ Sections in exact order
- ✅ Child sauce lines stay with parent
- ✅ No invented fields
- ✅ No field name changes
- ✅ FoodWerx styling (cream background, soft borders)
- ✅ Footer with key info
- ✅ Print-optimized CSS
- ✅ Test page for quick preview

---

## 🚀 NEXT STEPS

1. **Test with real event data**
   - Navigate to `/print-test`
   - Select event with menu items
   - Verify all sections render correctly

2. **Verify auto-spec calculations**
   - Check quantities match expected patterns
   - Validate buffet pan calculations
   - Confirm dessert piece counts

3. **Test print output**
   - Use browser print preview
   - Verify layout on paper/PDF
   - Confirm all content is visible

4. **Add missing field IDs** (if needed)
   - JOB_NUMBER
   - CLIENT_FULL_ADDRESS
   - Buffet category metadata

---

## 📞 SUPPORT

If issues arise:
1. Check browser console for errors
2. Verify event has menu items linked
3. Confirm FIELD_IDS match Airtable schema
4. Test with different events (varying guest counts)

**Built following Tammy's exact specifications from the FoodWerx EventOps blueprint.**
