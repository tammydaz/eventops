# Delivery Utensils — Add to Airtable

These items appear in delivery BEOs and should be available for selection/auto-fill. Add them to your Events table or a linked Delivery Utensils table as needed.

## Paper Products (already in PLATES_LIST, CUTLERY_LIST, GLASSWARE_LIST)

- Small Plates – Standard (app + dessert)
- Large Plates – Standard (dinner)
- Forks – Standard
- Knives – Standard
- Spoons – Standard
- FW Napkins – Standard
- Cocktail Napkins – Standard
- Large Cups – Standard
- Small Cups – Standard

## Other Utensils (add to CUTLERY_LIST or new field)

| Item Name | Typical Qty | Notes |
|-----------|-------------|-------|
| Plastic Tongs | 3–9 | Per BEO; scale with guest count |
| Serving Spoons | 1–4 | For buffet serving |
| Teaspoons | 1–12 | Premium plastic (silver) |
| Wire Chafing Frame w/ Water Pan | 1–3 | For hot items |
| Wire Racks | 3–5 | For chafing setup |
| Water Pans | 1–3 | With wire chafing |
| Sternos | 4–10 | Fuel for chafing |
| Roll Ups (napkin/utensil) | guest count + buffer | Napkin + fork/knife wrapped |
| White Disposable Table Cover | 1–2 | For display tables |
| Bowls | guest count | For salads/soups |

## Suggested Airtable Setup

**Option A — Use existing fields**

Store utensils in `CUTLERY_LIST` (long text) using the same format as plates/cutlery:

```
• Plastic Tongs (FoodWerx Standard) – 3
• Serving Spoons (FoodWerx Standard) – 2
• Wire Chafing Frame w/ Water Pan (FoodWerx Standard) – 1
• Sternos (FoodWerx Standard) – 6
```

**Option B — New field for delivery utensils**

Create a long text field `DELIVERY_UTENSILS_LIST` on the Events table. Same format as above. The app can be updated to parse and display it in the Paper Products section.

## Auto-fill defaults (in DeliveryPaperProductsSection)

When user clicks "Auto-fill for N guests", the section populates:

- Standard paper products (plates, cutlery, napkins, cups) — qty = guest count + 15
- Plastic Tongs — 3
- Serving Spoons — 2
- Wire Chafing Frame w/ Water Pan — 1
- Sternos — 4
- Roll Ups — guest count + 15

Users can edit quantities and add/remove items.
