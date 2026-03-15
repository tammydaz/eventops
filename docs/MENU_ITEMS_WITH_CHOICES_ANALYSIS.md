# foodwerx Corporate Menu — Items Requiring Choice Config

**Source:** foodwerx Corporate Catering Menu PDF (Fall/Winter 2024)  
**Purpose:** Identify all stations, platters, and boxed lunches that need "Pick 1", "Pick 2", "Choose X", "Your choice of" config modals (like Viva la Pasta or Boxed Lunch).

---

## Summary: Items Needing Config Modals

| Category | Item | Choice Language | Pick Count | Action |
|----------|------|-----------------|------------|--------|
| **Breakfast** | Open-Face Tartines | "Select 2", "Pick 1", "Pick 2" | Pick 1 or Pick 2 | Config modal |
| **Breakfast** | English Muffin & Wrap Sandwiches | "Select 3" | 3 | Config modal |
| **Breakfast** | "One Hand Pick Up" | "Select 3" | 3 | Config modal |
| **Breakfast** | "It's your Choice" Breakfast | "(Pick 2)" proteins | 2 | Config modal |
| **Breakfast** | Create Your Own Omelet Bar | "your choice of" toppings | Multiple | Config modal |
| **Breakfast** | Breakfast Box | "Choices include..." | 1 of 3 | Config modal |
| **Lunch** | Classic Sandwiches Platter | "pick up to 5 selections" | 5 | Config modal |
| **Lunch** | Signature Specialty Platter | "pick up to 5 selections" | 5 | Config modal |
| **Lunch** | Signature Wraps Platter | "pick up to 5 selections" | 5 | Config modal |
| **Lunch** | Gourmet Specialty Sandwich & Wrap Platter | "Select your favorites" | 5 (implied) | Config modal |
| **Lunch** | Panini Press | "pick up to 2 selections for every 10 guests" | 2 per 10 | Config modal |
| **Lunch** | Philadelphia Hoagie Platter | Assortment (6 options) | 5 (implied) | Config modal |
| **Lunch** | Combination Platter | Mix of all | 5 (implied) | Config modal |
| **Lunch** | Heart Healthy Lettuce Wraps | "Choice of 1 foodwerx salad" | 1 | Config modal |
| **Lunch** | werx Salad Stand | "Choice of 3 Salads", "Choice of 1" | 3 + 1 | Config modal |
| **Lunch** | "Built by You" Sandwich Builder | "create your own" | Build | Config modal |
| **Lunch** | "Built by You" Executive Sandwich & Salad Builder | "create your own" | Build | Config modal |
| **Lunch** | Box Lunch (Super Saver, Premium, etc.) | "Choice of" | Pick 1 + Pick 2 | ✅ Done |
| **Lunch** | Saladwerx Box | "Garden, Caesar, Greek or Funky" | 1 | ✅ In boxedLunchConfig |
| **Lunch** | Caesar Out Side of the Box | "Your choice of grilled chicken, flank steak, shrimp or vegetables" | 1 | Config modal |
| **Lunch** | "Built by You" foodwerx Salad Bar | "Greens ~ Pick 3", "Proteins ~ Pick 3", "Crunch ~ Pick 3", "Cheese ~ Pick 2", "Sweet ~ Pick 1", "Fruit ~ Pick 1", "Dressings ~ Pick 3" | Multiple | Config modal (like Viva la Pasta) |
| **Hot Lunch** | Crispy Fried Chicken / Sliders / Philly / Taco / Fajita | "Choice of 1 foodwerx salad" | 1 | Config modal |
| **Hot Lunch** | Taco Time / Fajita Festival | "beef or chicken" or "beef & chicken" | 1 or 2 | Config modal |
| **Hot Lunch** | Philly Cheesesteak | "Beef or chicken or both" | 1 or 2 | Config modal |
| **Ambient** | Slammin' Sliders | "(Pick 2)" angus beef, carolina pork, crispy chicken, etc. | 2 | Config modal |
| **Breaks** | Penny Candy Treats | "(Pick 3)" | 3 | Config modal |
| **Breaks** | Make Your Own Trail Mix | "add m&m'S, raisins, etc." | Build | Config modal |
| **Stations** | Viva La Pasta | "Pick 2 pastas", "Pick 3 sauces" | 2 + 3 | ✅ Done |
| **Stations** | Tex-Mex | "Choose 2 proteins" | 2 | Config modal |
| **Stations** | Carving Station | "Choose 2" | 2 | Config modal |
| **Stations** | Street Food Station | "Choose 4" | 4 | Config modal |
| **Stations** | BarWerx / Philly Jawn | "Choose 4" | 4 | Config modal |
| **Stations** | Iced Raw Bar / Grande Charcuterie | "Choose 1" | 1 | Config modal |
| **Stations** | Hi Bachi Station | "Choose 2" | 2 | Config modal |

---

## Detailed Breakdown by Section

### 1. SANDWICH PLATTERS (Lunch)

| Platter | PDF Text | Choices to Configure |
|---------|----------|----------------------|
| **Classic Sandwiches** | "Please pick up to 5 selections per order" | Honey ham, Turkey, Roast beef, Grilled chicken, Tuna, White grape chicken salad, Genoa salami |
| **Signature Specialty Platter** | "Please pick up to 5 selections per order" | All gourmet signature sandwiches (Turkey, Chicken, Beef, Ham, Seafood, Vegetarian, Wraps) |
| **Signature Wrap Platter** | "Please pick up to 5 selections per order" | Cuban Chicken, Porta-mato-luscious, Buffalo Chicken, + wrap options from signature |
| **Gourmet Specialty Sandwich & Wrap Platter** | "Select your favorites from both" | Combined list from Signature Sandwiches + Signature Wraps |
| **Panini Press** | "Please pick up to 2 selections for every 10 guests" | Italiano, Biggie Beef, Turkey, Cheezie Veg, Honey Roasted Ham & Brie |
| **Philadelphia Hoagie Platter** | Assortment of 6 hoagies | Italian, Roast Beef, Simple Ham & Cheese, Turkey, Tuna, Chicken Cutlet, Vegetarian |
| **Combination Platter** | Mix of all | Gourmet Sandwiches + Wraps + Hoagies + Panini |

### 2. BOXED LUNCHES — ✅ Already Configured

- Super Saver werx, Premium werx, Executive werx: Pick 1 (sandwich) + Pick 2 (format)
- Basic/Premium/Executive Saladwerx: Pick 1 (salad type)

### 3. STATIONS — Partially Configured

| Station | Current | Needs |
|---------|---------|-------|
| Viva La Pasta | ✅ Full config (Pick 3 sauces, Pick 2 pastas, Included) | — |
| Tex-Mex | "Choose 2 proteins" in mapping | Full config modal with protein choices |
| Carving Station | "Choose 2" | Config with carving options |
| Street Food Station | "Choose 4" | Config with street food options |
| BarWerx Appetizer Sampler | "Choose 4" | Config with sampler options |
| The Philly Jawn | "Choose 4" | Config with Philly options |
| Iced Raw Bar | "Choose 1" | Config with raw bar options |
| Grande Charcuterie Display | "Choose 1" | Config with charcuterie options |
| Hi Bachi Station | "Choose 2" | Config with hibachi options |
| Make Your Own Ramen | "Build your own" | Config (broth, noodles, toppings) |
| "Built by You" Salad Bar | Pick 3 Greens, Pick 3 Proteins, Pick 3 Crunch, Pick 2 Cheese, Pick 1 Sweet, Pick 1 Fruit, Pick 3 Dressings | Full config like Viva la Pasta |

### 4. BREAKFAST ITEMS

| Item | Choice | Options |
|------|--------|---------|
| Open-Face Tartines | Pick 1 or Pick 2 | 5 tartine options |
| English Muffin & Wrap Sandwiches | Select 3 | 5 sandwich options |
| "One Hand Pick Up" | Select 3 | 5 options |
| "It's your Choice" Breakfast | Pick 2 proteins | Bacon, sausage, country ham, turkey sausage |
| Create Your Own Omelet Bar | Your choice of | Bacon, sausage, pork roll, broccoli, peppers, mushrooms, onions, tomatoes, spinach, cheddar, mozzarella |
| Breakfast Box | Choices include | 3 box options |

### 5. LUNCH BUILDER / SALAD STANDS

| Item | Choice | Options |
|------|--------|---------|
| werx Salad Stand | Choice of 3 Salads + Choice of 1 | 6 salad options |
| "Built by You" Sandwich Builder | Create your own | Proteins, cheeses, veggies, spreads, dressings, breads |
| "Built by You" Executive Sandwich & Salad Builder | Create your own | Proteins, greens, toppers, spreads, dressings, breads |
| "Built by You" foodwerx Salad Bar | Pick 3 Greens, Pick 3 Proteins, Pick 3 Crunch, Pick 2 Cheese, Pick 1 Sweet, Pick 1 Fruit, Pick 3 Dressings | Full component list |

### 6. HOT LUNCH / AMBIENT

| Item | Choice | Options |
|------|--------|---------|
| Various hot lunches | "Choice of 1 foodwerx salad" | Salad list |
| Taco Time | "beef or chicken" or "beef & chicken" | Protein choice |
| Fajita Festival | "chicken or beef" or "chicken & beef" | Protein choice |
| Philly Cheesesteak | "Beef or chicken or both" | Protein choice |
| Slammin' Sliders | "(Pick 2)" | Angus beef, Carolina pork, crispy chicken, chipotle chicken, grilled vegetable |

### 7. BREAKS & SNACKS

| Item | Choice | Options |
|------|--------|---------|
| Penny Candy Treats | "(Pick 3)" | Twizzlers, Swedish fish, Hershey kisses, peanut chews, Mary Janes, Jolly Ranchers |
| Make Your Own Trail Mix | Add from list | Granola + m&m's, raisins, blueberries, almonds, chocolate chips, sunflower seeds |

---

## Implementation Priority

1. **Sandwich Platters** — High (DELI section, delivery + full-service)
2. **Stations** (Tex-Mex, Carving, Street Food, etc.) — High (already have STATION_INSTRUCTIONS)
3. **"Built by You" Salad Bar** — High (complex like Viva la Pasta)
4. **Breakfast items** — Medium (if breakfast ordering is in scope)
5. **Hot lunch salad choice** — Lower (simpler: 1 salad dropdown)
6. **Breaks (Pick 3 candy, Trail Mix)** — Lower

---

## Implementation Status

### ✅ Done
- **Sandwich Platters** — `sandwichPlatterConfig.ts` + `SandwichPlatterConfigModal` — Classic, Signature Specialty, Signature Wrap, Gourmet Specialty, Panini, Philadelphia Hoagie, Combination. Wired to DELI section. Stored in localStorage; merged into BEO print.
- **Boxed Lunches** — Already done (Pick 1 + Pick 2)
- **Stations** — Tex-Mex, Carving, Street Food, Raw Bar, Ramen, Hibachi, Chicken & Waffle, Late Night already have configs in `StationComponentsConfigModal` + `stationPresets.ts`
- **Salad Bar** — Added `SALAD_BAR` config to `stationPresets.ts`; skip Airtable and use custom items for now. Full Pick 3/2/1 UI can be added later.

### Next Steps
1. Add full Salad Bar UI (Pick 3 Greens, Pick 3 Proteins, etc.) to StationComponentsConfigModal
2. Migrate platter orders from localStorage to Airtable (Platter Orders table) when Omni creates it
3. Add breakfast/breaks configs if needed
