# Menu Section Recovery Checklist

## How To Use This
Recover one section at a time.

Do not bulk-load the whole menu and hope the filters are right. For each section:

1. confirm the production picker source
2. confirm the legacy field that controls visibility
3. add or repair only that section's rows
4. verify intake
5. verify `Kitchen BEO`
6. move to the next section

## Production Safety Rules
- Production edits go in legacy `Menu Items`
- `Menu_Lab` is staging/reference only during recovery
- Do not rename or delete working legacy rows casually
- Do not switch the app back to `Menu_Lab` while auditing

## Section Order For Recovery
Recommended recovery order:

1. full-service passed appetizers
2. full-service presented appetizers
3. full-service buffet metal
4. full-service buffet china
5. full-service deli
6. full-service desserts
7. delivery hot / tin
8. delivery ready / display
9. delivery ready / cold
10. delivery ready / bulk
11. delivery sandwich trays
12. delivery individual wrapped
13. boxed lunches

This order keeps the most foundational intake/print lanes stable first.

## Checklist Template Per Section
For each section, verify:

- the correct legacy `Category` values exist on the intended rows
- the intended rows are parent rows, not child-only rows
- `Item Name` is the name you actually want printed
- `Child Items` are linked if you expect indented BEO sub-lines
- the item appears in intake
- the item saves to the expected `Events` field
- the item appears in the expected `Kitchen BEO` section

## Full-Service Sections
### Passed Appetizers
- visibility driver: legacy `Category`
- verify categories match `passed` in `src/constants/menuCategories.ts`
- verify print lands in `PASSED APPETIZERS`

### Presented Appetizers
- visibility driver: legacy `Category`
- verify presented rows are not accidentally only tagged as generic buffet items
- verify print lands in `PRESENTED APPETIZERS`

### Buffet Metal
- visibility driver: legacy `Category`
- hot buffet and entrée items must be classified here intentionally
- verify print lands in `BUFFET – METAL`

### Buffet China
- visibility driver: legacy `Category`
- cold buffet / salad / bread items must be classified here intentionally
- verify print lands in `BUFFET – CHINA`

### Deli
- visibility driver: legacy `Category`
- verify deli rows are not only present in staging tables
- verify print lands in `DELI`

### Desserts
- visibility driver: legacy `Category`
- verify display vs individual desserts still route correctly
- verify print lands in `DESSERTS`

## Delivery Sections
### Hot / Tin
- verify legacy-safe items still show through the current delivery fallback
- verify print lands in `HOT / TIN`

### Ready / Display
- verify room-temp/display legacy rows are correctly classified
- verify print lands in `READY / DISPLAY`

### Ready / Cold
- verify cold display items land in the cold lane and not bulk
- verify print lands in `READY / COLD`

### Ready / Bulk
- verify bulk side items are intentionally separated from display/cold items
- verify print lands in `READY / BULK`

### Sandwich Trays
- verify deli legacy rows show in the picker
- verify print lands in `SANDWICH TRAYS`

### Individual Wrapped
- legacy recovery warning: this path currently needs special attention because the current legacy fallback is weak
- verify intake visibility before bulk loading this section
- verify print lands in `INDIVIDUAL WRAPPED`

## Boxed Lunches
- boxed lunches use their own tables, not shadow/event menu
- menu item links still depend on legacy `Menu Items`
- verify:
  - box products exist in legacy
  - sandwich choices exist in legacy
  - boxed-lunch fields are populated where the picker expects them
  - `Kitchen BEO` renders only when boxed-lunch data exists

## Menu_Lab Bridge Later
Do not migrate while recovering sections.

Bridge work belongs later, after production stability is restored:

- exact name matching between `Menu_Lab` and legacy
- field-by-field mapping
- explicit decision about which `Menu_Lab` tags are authoritative
- controlled sync or migration process

Until then, use this checklist to stabilize what the production system already depends on.
