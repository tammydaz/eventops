# Legacy Menu Visibility And Placement Audit

## Purpose
This file documents which legacy `Menu Items` fields currently control:

- picker visibility
- intake placement
- `Kitchen BEO` placement
- boxed-lunch visibility

Use this before bulk menu loading so items do not silently disappear or land in the wrong section.

## Legacy Field Reality Check
Live legacy field counts from the current base:

### `Category`
- `Buffet China`: 361
- `Entrée`: 299
- `Deli`: 82
- `Component`: 77
- `Appetizer`: 74
- `Dessert`: 74
- `Buffet`: 41
- `Station Item`: 37
- `Presented App`: 25
- `Buffet Metal`: 25
- `Passed App`: 17
- `Deli/Sandwhiches`: 17
- `<blank>`: 12

### `Service Type`
- `<blank>`: 1148
- `Buffet`: 47
- `Buffet – Hot`: 28
- `Passed App`: 26
- `Dessert`: 16
- `Entrée`: 16
- `Room Temp Display`: 11

### `Menu Section`
- `<blank>`: 1129
- `Buffet`: 43
- `Desserts`: 42
- `Stations`: 41
- `Presented Apps`: 33
- `Passed Apps`: 25

### `Vessel Type`
- `<blank>`: 1173
- `Metal – Hot`: 66
- `China – Cold / Display`: 38
- `China – Room Temp`: 11

### Boxed Lunch Fields
- `Boxed Lunch Category`: 1306 blank, 7 `Classic`
- `Box Lunch Type`: 1297 blank, 7 `Classic Sandwich`, 5 `Wrap`, 4 `Gourmet Sandwich`

## Full-Service Picker Visibility
Full-service picker visibility currently comes from:

- code: `fetchMenuItemsByCategory()` in `src/services/airtable/menuItems.ts`
- source map: `CATEGORY_MAP` in `src/constants/menuCategories.ts`

### Category Keys Used In Code
- `passed`
- `presented`
- `buffet_metal`
- `buffet_china`
- `desserts`
- `stations`
- `deli`
- `room_temp`
- `displays`
- beverage/service variants

### Legacy Categories That Drive Those Pickers
From `src/constants/menuCategories.ts`:

- `passed` uses `Passed App`, `Presented App`, `Appetizer`, `Passed`, `App`
- `presented` uses appetizer categories plus `Station Item`, `Station`
- `buffet_metal` uses `Buffet Metal`, `Buffet`, `Buffet Item`, `Side`, `Entrée`, `Protein (Entrée)`, `Pasta (Entrée)`, `Pasta (Side)`, `Starch (Side)`, `Vegetable (Side)`
- `buffet_china` uses `Buffet China`, `Salad`, `Bread`, `Side`
- `desserts` uses `Dessert`, `Dessert/Metal`, `Dessert/China`, `Dessert (Display)`, `Dessert (Individual)`
- `stations` uses `Station`, `Stations`, `Station Item`
- `deli` uses `Deli/Sandwhiches`, `Deli/Breads`, `Deli/Sandwiches`, `Deli`
- `room_temp` uses `Room Temp Display`, `Display`, `Buffet China`

### Practical Meaning
For full-service menu visibility, `Category` is the main field that matters today.

`Service Type`, `Menu Section`, and `Vessel Type` are too sparse to be trusted as the primary visibility driver in legacy.

## Delivery Picker Visibility
Delivery picker visibility currently depends on two different code paths:

### Legacy-safe fallback path
When the catalog is legacy, `fetchDeliveryMenuPickerItems()` falls back to `fetchMenuItemsByCategory()` for most sections:

- `delivery_ready_display` -> `room_temp`
- `delivery_bulk_sides` -> `buffet_china`
- `delivery_sandwich_trays` -> `deli`
- generic fallback -> `fetchMenuItemsByCategory(pickerType)`

### Important gap
`delivery_individual_wrapped` returns an empty list in legacy mode right now.

That means if local/dev production is frozen back to legacy, individually wrapped delivery items need an explicit recovery pass.

## Delivery Placement Rules
Delivery print placement is controlled in:

- `src/config/deliverySectionConfig.ts`
- `deliveryItemBelongsInSection()`
- `routeTargetFieldFromExecutionTokens()` in `src/services/airtable/menuItems.ts`

### Delivery section logic in code
- `CHAFER HOT` -> `buffetMetal` -> `HOT / TIN`
- `CHAFER READY` -> `buffetMetal` -> `READY / TIN`
- `ROOM TEMP` -> `roomTempDisplay` -> `READY / DISPLAY`
- `COLD DISPLAY` -> `buffetChina` -> `READY / COLD`
- `BULK SIDES` -> `buffetChina` -> `READY / BULK`
- `INDIVIDUAL PACKS` -> `deliveryDeli` -> `INDIVIDUAL WRAPPED`
- deli default -> `deliveryDeli` -> `SANDWICH TRAYS`

### Practical Meaning
For delivery, placement depends on execution/routing logic in code much more than on legacy field richness.

If the app is frozen to legacy for production stability, you must verify which delivery sections still rely on `Menu_Lab` execution tags and which have safe legacy fallbacks.

## Full-Service Kitchen Placement
Full-service `Kitchen BEO` section order currently comes from `MENU_SECTION_CONFIG` in `src/pages/KitchenBEOPrintPage.tsx`:

- `PASSED APPETIZERS`
- `PRESENTED APPETIZERS`
- `DELI`
- `BUFFET – METAL`
- `BUFFET – CHINA`
- `DESSERTS`

Notes:

- `ROOM TEMP / DISPLAY` does not get its own full-service kitchen section
- stations only print when their BEO placement is one of:
  - `Presented Appetizer`
  - `Buffet Metal`
  - `Buffet China`

## Boxed-Lunch Visibility
Boxed-lunch intake and print are their own system, but the menu library still depends on legacy `Menu Items`.

Fields that matter:

- `Boxed Lunch Category` (`fldrFw4Puy2WURVs3`)
- `Box Lunch Type` (`fld3QYpCSZaLTU2rg`)

Current live state:

- these fields are populated only on a very small number of rows
- they are not broadly usable as a complete catalog classifier yet

## Minimum Legacy Data Needed For An Item To Behave
### Full-service picker
- valid legacy record
- correct `Category`
- parent/child relationships if sub-lines matter

### Delivery picker
- valid legacy record
- correct fallback `Category` for legacy-safe sections
- execution/routing support if the section depends on delivery execution logic

### Kitchen BEO / print
- valid legacy record ID linked from `Events`
- readable `Item Name`
- `Child Items` linked correctly when components should print beneath the parent

### Boxed lunch
- correct boxed-lunch fields when used in boxed-lunch pickers
- or explicit code fallback when those fields are incomplete

## Immediate Recovery Use
Before adding or repairing any menu section, check:

1. Which picker code path loads that section today
2. Which legacy field decides visibility
3. Which print section the item is expected to land in
4. Whether that section currently has a legacy-safe path or still depends on `Menu_Lab` logic
