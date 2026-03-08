# Omni Prompt: Load Station Names and Components for BEO Intake Picker

Use this prompt with Omni in Airtable to configure the Creation Station picker so it shows the correct items for each station type.

---

## What the App Needs

The BEO intake app has a **Creation Station** section. When a user picks a station type (e.g. "Viva La Pasta"), the app must show **only that station's components** — not items from other stations.

The app loads data in two ways:

1. **Station Presets table** (optional): Looks up a preset by name and uses Line 1 Defaults, Line 2 Defaults, Individual Defaults (linked to Menu Items).
2. **Menu Items.Station Type**: Filters Menu Items where the Station Type field equals the selected station name (e.g. "Viva La Pasta").

---

## Your Task

Configure Airtable so that:

### 1. Stations Table — Station Type Options

The **Stations** table has a **Station Type** single-select field. Ensure these options exist (exact spelling):

- Viva La Pasta
- Tex-Mex
- Make Your Own Ramen Noodle Bar
- All-American
- Street Food Station
- Carving Station
- Hi Bachi Station
- Chicken & Waffle Station

(Add any other station names from your menu. The app uses these for the dropdown.)

---

### 2. Menu Items Table — Station Type Field

The **Menu Items** table has a **Station Type** field (field ID: `fldBSOxpjxcVnIYhK`). This field links each menu item to the station(s) it belongs to.

**For each Menu Item record that is a component of a station, set Station Type to the exact station name.**

Example mappings:

| Station Name | Menu Items to Set Station Type = This |
|--------------|--------------------------------------|
| **Viva La Pasta** | Penne a la Vodka, Bruschetta Pasta Primavera, Bowties with Grilled Chicken, Basil Pesto, Yellow Peppers & Sun Dried Tomatoes |
| **Tex-Mex** | Chicken, Beef, Pork, Shrimp (the protein options) |
| **Carving Station** | Pork Tenderloin with Mushroom Duxelle en Croute, Roasted Turkey with Orange Compote & Gravy, Dr. Pepper Marinated Flank Steak, Spiral Ham with Honey Mustard Glaze |
| **Street Food Station** | Mini Sliders with Aged White Cheddar..., Crispy Cod Street Tacos, Beef Street Tacos, Carolina BBQ Pork on Bao Bun, Thai Sesame Noodles, Grilled Chimichurri Beef Kebob, Adult Mac & Cheese, Chicken Parm Slivers, Korean Fried Chicken Nuggets, Margarita & BBQ Chicken Flatbreads |
| **All-American** | Mini Angus Beef Burgers, Braised Brisket, Pulled Pork, Boardwalk Potato Wedges, Baked Potato Salad, Honey Hot Chicken Tenders |
| **Hi Bachi Station** | Chicken, Steak, Shrimp, Tofu |
| **Chicken & Waffle Station** | Powdered Sugar, Whipped Cream, Maple Bourbon Syrup, Fresh Fruit, Cinnamon, Classic Fried Chicken Tenders, Honey Hot Fried Chicken Tenders, Herb-Infused Whipped Butter, Bacon Crumbles, Fried Pickles |
| **Make Your Own Ramen Noodle Bar** | Pork Stock, Miso Stock, Chicken, Pork, Shrimp, Soft Boiled Egg, Cilantro, Scallions, Baby Bok Choy, etc. |

**Important:** Only parent/main items go in Station Type. Toppings and sauces (child items) are linked via Child Items on the parent — do not set Station Type on child items, or set it to match the parent's station if your schema requires it.

---

### 3. Station Presets Table (Optional but Recommended)

Create or use a **Station Presets** table with:

- **Preset Name** (or **Station Type**) — single line text or single select, must match station names exactly
- **Line 1 Defaults** — linked to Menu Items (primary options)
- **Line 2 Defaults** — linked to Menu Items (secondary options)
- **Individual Defaults** — linked to Menu Items (additional options)
- **Pick Count** — number (e.g. 2 for "Choose 2")

For each station, create one preset record and link the correct Menu Items to Line 1, Line 2, and/or Individual Defaults. This gives the app default selections when a user picks that station type.

---

## Summary

1. **Stations.Station Type** — Add all station names as single-select options.
2. **Menu Items.Station Type** — Set each station component's Station Type to its station name (e.g. "Viva La Pasta" for Penne a la Vodka, Bruschetta Pasta Primavera, Bowties).
3. **Station Presets** (optional) — Create preset records with correct Line 1/Line 2/Individual Defaults linked to Menu Items.

When this is correct, the picker will show only the right items for each station (e.g. pasta options for Viva La Pasta, carving options for Carving Station).
