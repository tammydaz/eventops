# Station Config — Work in Progress

**Last updated:** Session before user signed off for the night.

## Completed

### 1. Print routing fix (KitchenBEOPrintPage)
- Stations with `beoPlacement="Presented Appetizer Metal/China"` now appear in **PRESENTED APPETIZERS** section
- Stations with `beoPlacement="Buffet Metal/China"` now appear in **BUFFET – METAL** section
- Stations without matching beoPlacement stay in **STATIONS** section

### 2. Station config modal layouts
- Tex-Mex, Ramen, All-American, Street Food, Raw Bar, Carving, Hibachi, Late Night, Chicken & Waffle all have Viva-style layouts (Pick sections, Included blocks, X buttons, +Add Component)

## Remaining / To verify

1. **Station config accuracy** — User reported "made shit up on some stations, missing shit on others." Need to verify each station section-by-section against source of truth (FoodWerx defaults, Airtable, or docs). User will go through each station one by one.

2. **BeoPrintPage buffet menu signs** — May need stations with beoPlacement added to Presented/Buffet sections. Kitchen BEO is fixed; buffet menu signs (tent cards) may still need wiring.

## Locked (do not modify)
- Passed Appetizers — see `.cursor/rules/passed-appetizers-locked.mdc`
