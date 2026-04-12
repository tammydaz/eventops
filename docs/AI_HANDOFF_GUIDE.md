# AI Handoff Guide — EventOps / FoodWerx BEO System

> **Read this entire document before touching any code.**
> This project has strict architecture rules. Violating them breaks live events.

---

## 0. START HERE — CRITICAL RULES

1. **There are TWO separate systems. NEVER merge them.**
   - **System 1: Shadow Menu System** — full-service BEO (Passed Apps, Presented Apps, Buffet Metal, Buffet China, Desserts, Deli, Stations)
   - **System 2: Corporate / Boxed Lunch System** — delivery orders (Boxed Lunch Orders, Sandwich Platters, packages)
   - They share a UI but NEVER share data logic.

2. **Three files are completely locked — do NOT modify their core logic:**
   - `src/components/beo-intake/StationComponentsConfigModal.tsx` — Viva La Pasta validation
   - `src/pages/BeoPrintPage.tsx` — Passed Appetizers section
   - `src/components/beo-intake/MenuSection.tsx` — Passed Apps wiring

3. **Always use the Legacy Menu Items table** (`tbl0aN33DGG6R1sPZ`). The Menu_Lab table (`tbl6gXRT2FPpTdf0J`) is staging only. The env variable `VITE_AIRTABLE_MENU_CATALOG_SCHEMA` is NOT set to `menu_lab` in production.

4. **filterByFormula always uses field NAMES, not field IDs**, even when `returnFieldsByFieldId=true`. This is an Airtable API rule.

---

## 1. AIRTABLE REFERENCE

### Base ID
```
appMLgdc3QpV2pwoz
```

### Key Tables
| Table Name | Table ID |
|---|---|
| Events | (see `.env.example` for `VITE_AIRTABLE_EVENTS_TABLE`) |
| **Menu Items (Legacy — USE THIS)** | `tbl0aN33DGG6R1sPZ` |
| Menu_Lab (staging — do not use) | `tbl6gXRT2FPpTdf0J` |
| Event Menu (Shadow) | (see `VITE_AIRTABLE_EVENT_MENU_TABLE`) |
| Boxed Lunch Orders | (see `VITE_AIRTABLE_BOXED_LUNCH_ORDERS_TABLE`) |

### Critical Menu Items Field IDs (Legacy Table)
| Field Name | Field ID | Notes |
|---|---|---|
| Item Name | `fldW5gfSlHRTl01v1` | What the app displays |
| Category | `fldM7lWvjH8S0YNSX` | Single-select — controls which picker it shows in |
| Description (long text) | `fldtN2hxy9TS559Rm` | Write descriptions HERE (not Description Name which is formula/read-only) |
| Description Name/Formula | `fldQ83gpgOmMxNMQw` | **READ-ONLY formula field — never write to this** |
| Child Items | `fldIu6qmlUwAEn2W9` | Linked records to child items |
| Parent Item | `fldBzB941q8TDeqm3` | Linked back to parent |
| Sauces | `fldCUjK7oBckAuNNa` | Long text |
| Vessel | `fldZCnfKzWijIDaeV` | Single-select |
| Service Type | `fld2EhDP5GRalZJzQ` | Single-select |
| Section | `fldwl2KIn0xOW1TR3` | NOT used by picker — Category is used |
| Boxed Lunch Category | `fldrFw4Puy2WURVs3` | For boxed lunch logic only |

---

## 2. HOW THE MENU PICKER WORKS

### Full-Service BEO (e.g., "Buffet Metal" picker)
1. User clicks `+ Buffet Metal` button in BeoIntakePage.tsx
2. `openPicker("buffet_metal", "buffetMetal", "Buffet – Metal")` is called
3. `MenuPickerModal` opens, calls `fetchMenuItemsByCategory("buffet_metal")`
4. That function looks up `CATEGORY_MAP["buffet_metal"]` in `src/constants/menuCategories.ts`
5. Builds formula: `OR({Category}="Buffet Metal", {Category}="Buffet", ...)`
6. Queries Airtable Legacy table, returns matching items
7. User selects item → `handlePickerAdd` is called with `routeTargetField = "buffetMetal"`
8. `targetFieldToSection("buffetMetal")` maps → `"Buffet – Metal"` (Event Menu Shadow section name)
9. A row is created in the Event Menu (Shadow) table

### CATEGORY_MAP — The Master Routing Table
File: `src/constants/menuCategories.ts`

This is the SINGLE SOURCE OF TRUTH for which Airtable Category values show in which picker.

```
buffet_metal:  ["Buffet Metal", "Buffet", "Buffet Item", "Side", "Entrée", "Protein (Entrée)",
                "Pasta (Entrée)", "Pasta (Side)", "Starch (Side)", "Vegetable (Side)",
                "Full Service Hot Lunch", "Happy Hour", "Hot Breakfast", "Hot Lunch Delivery"]

buffet_china:  ["Buffet China", "Salad", "Bread", "Side", "Ambient Display",
                "Classic Salad", "Signature Salad", "Breakfast Room Temp", "Snack"]

desserts:      ["Dessert", "Dessert/Metal", "Dessert/China", "Dessert (Display)", "Dessert (Individual)"]

deli:          ["Deli/Sandwhiches", "Deli/Breads", "Deli/Sandwiches", "Deli",
                "Gourmet Sandwich", "Classic Sandwich", "Wrap", "Panini", "Hoagie"]

passed:        ["Passed App", "Presented App", "Appetizer", "Passed", "App"]
presented:     ["Presented App", "Appetizer", "Display", "Station Item", "Station"]
```

**To add a new Category so it appears in a picker: add it to CATEGORY_MAP in that file.**

### Delivery Intake Picker Sections
File: `src/services/airtable/menuCatalogConfig.ts` — `DELIVERY_INTAKE_SECTIONS` array

Each section has:
- `id`: the picker type key (e.g., `"disposable_hot"`)
- `legacyCategoryValues`: which Airtable Category values to show
- `legacyRouteTarget`: where the item saves to (`"buffetMetal"`, `"buffetChina"`, `"deliveryDeli"`)

Current delivery sections:
| Button Label | Section ID | Shows Categories | Routes To |
|---|---|---|---|
| 🔥 Hot | `disposable_hot` | Hot Breakfast, Hot Lunch Delivery, Full Service Hot Lunch, Happy Hour | buffetMetal |
| 🍽️ Ready | `disposable_ready` | Breakfast Room Temp | buffetMetal |
| 🥗 Bulk | `disposable_bulk` | Salad, Classic Salad, Signature Salad | buffetChina |
| 🥪 Display | `disposable_display` | Deli, Gourmet Sandwich, Wrap, Panini, Snack, Display | deliveryDeli |
| 🍰 Desserts | `desserts` | Dessert, Dessert (Display), Dessert (Individual), Ambient Display | deliveryDeli |

---

## 3. HOW TO ADD MENU ITEMS TO AIRTABLE

### Method: Write a Node.js script

Pattern (see `scripts/loadMissingCorporateMenu.cjs` as the best example):

```javascript
const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE    = "appMLgdc3QpV2pwoz";
const TABLE   = "tbl0aN33DGG6R1sPZ"; // Legacy Menu Items

const ITEM_NAME_FIELD   = "fldW5gfSlHRTl01v1";
const CATEGORY_FIELD    = "fldM7lWvjH8S0YNSX";
const DESCRIPTION_FIELD = "fldtN2hxy9TS559Rm"; // writable long text

const ITEMS = [
  { name: "Item Name Here", category: "Buffet Metal", desc: "Description text" },
  // ... more items
];

// Script fetches existing items, deduplicates by name (case-insensitive), adds only missing ones
// Rate limit: await 220ms between creates (Airtable = 5 req/sec)
```

Run with:
```powershell
$env:AIRTABLE_API_KEY = "your_key_here"
node scripts/yourScript.cjs
```

### Category Values That Work (Airtable single-select options)
These are the EXACT strings that exist in the Category field. Use these only:
```
Passed App | Presented App | Appetizer | Passed App/metal | Presented App/china |
Buffet Metal | Buffet China | Buffet | Buffet Item | Side |
Entrée | Protein (Entrée) | Pasta (Entrée) | Pasta (Side) | Starch (Side) | Vegetable (Side) |
Deli | Deli/Sandwhiches | Deli/Breads | Salad |
Dessert | Dessert (Display) | Dessert (Individual) | Dessert/Metal | Dessert/China |
Station | Station Item | Stations |
Display | Ambient Display | Snack | Beverage | Bar / Beverage Component |
Classic Salad | Signature Salad | Bread | Dressing | Sauce | Component |
Full Service Hot Lunch | Hot Breakfast | Hot Lunch Delivery | Breakfast Room Temp |
Happy Hour | Gourmet Sandwich | Classic Sandwich | Wrap | Panini | Hoagie
```

**If you use a Category value not in this list, Airtable will reject the record** (422 error). You'd need to add it to the single-select options in Airtable first.

---

## 4. HOW PACKAGES WORK

### Package Presets (Choice Packages)
File: `src/config/deliveryPackagePresets.ts`

A package preset is shown in the 📦 Packages panel. When staff clicks it:
- If it has `groups` (pick choices) → config modal opens for staff to record client's choices
- If `groups: []` with `autoIncluded` → shows fixed components, staff confirms

```typescript
export const MY_NEW_PACKAGE: DeliveryPackagePreset = {
  key: "my-new-package",                          // unique slug
  displayName: "My New Package",                  // must match EXACT Airtable Item Name
  panelCategory: "hot_lunch",                     // which panel section to show in
  routeTargetField: "buffetMetal",                // where it saves on BEO
  matchPatterns: ["my new package"],              // lowercase match strings
  groups: [                                       // [] = no choices (fixed)
    {
      label: "Choose Your Protein — Pick 1",
      pickCount: 1,
      options: ["Option A", "Option B", "Option C"],
    },
  ],
  autoIncluded: ["Item always included"],         // shown as locked/pre-selected lines
};
```

Then add it to `ALL_DELIVERY_PACKAGE_PRESETS` array at the bottom of the file.

### Panel Categories Available
```
"breakfast" | "lunch_platter" | "hot_lunch" | "ambient_display" | "happy_hour" | "lunch_premium" | "desserts"
```

### routeTargetField Values and What They Mean
| Value | Maps To Shadow Section | Use For |
|---|---|---|
| `"passedApps"` | Passed Appetizers | passed apps |
| `"presentedApps"` | Presented Appetizers | presented apps |
| `"buffetMetal"` | Buffet – Metal | hot food, buffet, breakfast hot |
| `"buffetChina"` | Buffet – China | ambient displays, salads, room temp |
| `"fullServiceDeli"` | Deli | full-service deli/sandwiches |
| `"deliveryDeli"` | Deli | delivery display/desserts/deli |
| `"desserts"` | Desserts | desserts (full-service) |

---

## 5. HOW THE BEO PRINT WORKS

File: `src/pages/BeoPrintPage.tsx`

Key function: `expandItemToRows(item, eventMenuByCatalogId, catalogData)`

- Regular items: renders name as one row. Children (linked items) render as indented sub-rows.
- Package items: if `emRow.customText` exists (from package config modal), renders parent name as bold header, then each line of customText as `• bullet` child rows.
- The `leftCheck` state controls the view mode: `"spec"`, `"kitchen"`, `"packout"`, `"expeditor"`, `"server"`
- In spec mode: left column is a directly editable `<input>` (no right-side override column)

**Do NOT modify the Passed Appetizers rendering in BeoPrintPage.tsx.**

---

## 6. KEY FILE MAP

```
src/
├── pages/
│   ├── BeoIntakePage.tsx          ← Main BEO intake UI (full-service + delivery)
│   ├── BeoPrintPage.tsx           ← Printable BEO document
│   ├── KitchenBEOPrintPage.tsx    ← Kitchen version of BEO print
│   └── EventOverviewPage.tsx      ← Event list/overview
├── components/
│   ├── MenuPickerModal.tsx         ← Standard section picker modal
│   ├── GlobalSearchPickerModal.tsx ← Search-all-items picker (new)
│   ├── beo-intake/
│   │   ├── DeliveryIntakeMenuAddRow.tsx    ← Delivery picker buttons row
│   │   ├── DeliveryPackagesPanel.tsx       ← 📦 Packages panel
│   │   ├── DeliveryPackageConfigModal.tsx  ← Choice modal for packages
│   │   ├── BoxedLunchSection.tsx           ← Boxed lunch builder
│   │   ├── SandwichPlatterConfigModal.tsx  ← Sandwich platter builder
│   │   └── StationComponentsConfigModal.tsx ← LOCKED — Viva La Pasta etc.
├── config/
│   └── deliveryPackagePresets.ts   ← ALL package preset definitions
├── constants/
│   └── menuCategories.ts           ← CATEGORY_MAP (picker → Airtable categories)
├── services/airtable/
│   ├── menuCatalogConfig.ts        ← DELIVERY_INTAKE_SECTIONS, field IDs
│   ├── menuItems.ts                ← All menu item fetch functions
│   ├── eventMenu.ts                ← Shadow menu table operations, targetFieldToSection()
│   ├── events.ts                   ← FIELD_IDS for Events table, loadEvent()
│   └── client.ts                   ← Airtable fetch wrapper, env var readers
├── state/
│   ├── eventStore.tsx              ← Global event state
│   ├── usePickerStore.ts           ← openPicker() / closePicker() state
│   └── platterOrdersStore.ts       ← Boxed lunch / platter orders state
└── scripts/ (Node.js — run with node, not vite)
    ├── loadMissingCorporateMenu.cjs  ← Best example of adding menu items
    └── hideDemoEvents.cjs            ← Example of Airtable bulk operations
```

---

## 7. COMMON TASKS — STEP BY STEP

### Task A: Add more menu items from the corporate menu

1. Open `scripts/loadMissingCorporateMenu.cjs` as a reference template
2. Create a new script `scripts/loadMoreItems.cjs`
3. Pick the right `category` from the list in Section 3 above
4. Run: `$env:AIRTABLE_API_KEY = "key"; node scripts/loadMoreItems.cjs`
5. No code changes needed — items automatically appear in the picker for that category

### Task B: Add a new package preset (with choices)

1. Open `src/config/deliveryPackagePresets.ts`
2. Copy an existing preset like `ITS_YOUR_CHOICE_BREAKFAST` as a template
3. Make sure `displayName` **exactly matches** the Airtable Item Name for that item
4. Add `groups` for each "Pick N" choice the client makes
5. Add to `ALL_DELIVERY_PACKAGE_PRESETS` array
6. Also make sure the item exists in Airtable with the right Category

### Task C: Add a new fixed package (no choices, just shows components)

1. Same as Task B but use `groups: []` and populate `autoIncluded` with the component descriptions
2. Example: `SOUTH_OF_BORDER_MIXED_GRILL` in `deliveryPackagePresets.ts`

### Task D: Make a menu item show in a different picker section

1. In Airtable, update the item's `Category` field to the correct value
2. OR add the item's current Category to `CATEGORY_MAP` in `src/constants/menuCategories.ts`
3. For delivery sections, also check `DELIVERY_INTAKE_SECTIONS` in `menuCatalogConfig.ts`

### Task E: Add a new delivery intake section/button

1. Add new entry to `DELIVERY_INTAKE_SECTIONS` in `src/services/airtable/menuCatalogConfig.ts`
2. Add new `DeliveryIntakeSectionId` to the type union in the same file
3. Add color to `INTAKE_PILL_COLORS` in `DeliveryIntakeMenuAddRow.tsx`
4. Add label to `SHORT_LABEL` in `DeliveryIntakeMenuAddRow.tsx`

---

## 8. ENVIRONMENT VARIABLES (reference .env.example)

```
VITE_AIRTABLE_API_KEY           — Airtable API key
VITE_AIRTABLE_BASE_ID           — appMLgdc3QpV2pwoz
VITE_AIRTABLE_EVENTS_TABLE      — Events table ID
VITE_AIRTABLE_MENU_ITEMS_TABLE  — tbl0aN33DGG6R1sPZ (legacy — always use this)
VITE_AIRTABLE_EVENT_MENU_TABLE  — Shadow Event Menu table ID
```

---

## 9. WHAT HAS BEEN BUILT (as of April 2026)

### Full-Service BEO
- Section pickers: Passed Apps, Presented Apps, Buffet Metal, Buffet China, Deli, Desserts, Stations
- Shadow menu system: every pick creates a row in Event Menu table
- BEO Print: spec mode (editable spec column), kitchen, packout, expeditor, server views
- Packages button on every section header → opens package panel
- **🔍 Find Any Item** button: search all 1,500+ items, then pick which heading

### Delivery
- 5 category pickers: Hot, Ready, Bulk, Display, Desserts
- 📦 Packages panel with: Breakfast (5), Lunch Platters (5), Hot Lunch (3), Premium (2), Happy Hour (1), Ambient Displays (26), Desserts (8)
- Boxed Lunch builder (separate system)
- Sandwich Platter builder (separate system)
- **🔍 Find Any Item** button: same global search, delivery-aware section routing

### Menu in Airtable (as of April 2026)
- ~1,532 total items across all categories
- All corporate ambient displays (26 items)
- All signature sandwiches S1-S27, wraps W1-W9
- Corporate hot lunches, breakfast packages, happy hour, snacks
- Classic and signature salads (13 + 23 items)

---

## 10. SAFE PATTERNS TO FOLLOW

✅ **Safe: Add items to Airtable via script** — purely additive, nothing breaks  
✅ **Safe: Add new presets to `deliveryPackagePresets.ts`** — purely additive  
✅ **Safe: Add new Category values to `CATEGORY_MAP`** — purely additive  
✅ **Safe: Add new delivery intake sections** — purely additive  
✅ **Safe: Style changes to BeoIntakePage.tsx quick-add buttons** — visual only  

❌ **Dangerous: Modifying `targetFieldToSection()` in eventMenu.ts** — breaks item routing  
❌ **Dangerous: Changing `DELIVERY_INTAKE_SECTIONS` legacyRouteTarget values** — breaks where items save  
❌ **Dangerous: Touching Passed Appetizers logic anywhere** — locked module  
❌ **Dangerous: Writing to the `Description Name/Formula` field** — it's read-only, causes 422 errors  
❌ **Dangerous: Merging Shadow Menu and Corporate systems** — fundamental architecture violation  
❌ **Dangerous: Changing the `filterByFormula` to use field IDs instead of names** — Airtable always requires field names in formulas  

---

## 11. HOW TO RUN LOCALLY

```powershell
# Install dependencies
npm install

# Set API key for scripts (PowerShell)
$env:AIRTABLE_API_KEY = "your_key_here"

# Run dev server
npm run dev

# Run a data script (Node.js, NOT vite)
node scripts/scriptName.cjs
```

**Deploy:** Push to `main` branch on GitHub → Vercel auto-deploys.  
**Repo:** https://github.com/tammydaz/eventops

---

*This document was written by the AI that built the system (April 2026). When in doubt, READ THE CODE before changing it. The existing patterns are intentional.*
