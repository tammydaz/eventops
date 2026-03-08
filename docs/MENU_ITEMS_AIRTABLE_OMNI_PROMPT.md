# Airtable Setup Omni Prompt — Complete Reference

Single reference for configuring Airtable and the BEO intake app. Covers **Apps and Displays** first; Buffet items will be added in a later section.

---

# PART 1 — APPS AND DISPLAYS

---

## 1.1 UI Flow & Behavior

### Passed App Section
1. User opens **Passed App** section.
2. Option: **Individual Items**.
3. Choosing it shows the full list of passed app items (from Airtable).
4. User selects items. **"Other"** field for anything not in the list.
5. Every item appears individually — including items that are also part of stations/displays — so clients can substitute.

### Display/Station Section
1. User opens **Display/Station** section.
2. List of display/station names (Grande Charcuterie, Pasta Flight, Carving Station, etc.).
3. User picks one (e.g., Carving Station).
4. Section **expands** (does NOT auto-add yet) with:
   - Instruction (e.g., "Choose 2")
   - Default items with replace/remove (Serviceware style)
   - **"Other"** field
5. User can keep defaults or make changes.
6. User clicks **"Add Station"** to confirm — only then is it added.
7. **Stations are always offered** — no event-type logic to hide them.

### "Other" at Every Layer
- Passed App items → Other field
- Station items (e.g., Carving Station choices) → Other field
- Every selection layer has an "Other" option for custom entries.

### Confirmation Flow (Like Serviceware)
- Picking a station **opens** it with defaults — does NOT add it.
- User reviews, replaces, or removes items.
- User must click **"Add Station"** to confirm.
- Child items (sauces, etc.) auto-populate with each parent and have replace/remove.

---

## 1.2 Passed Appetizers — Full Menu Item List

**Category = `Passed App`** for every item below. Each must exist as its own Menu Item record.

### POULTRY
- Sesame Chicken on Bamboo
- Chicken Florentine Stuffed Mushrooms
- Korean Fried Chicken on a Stick
- Peking Duck Egg Roll
- Thanksgiving Eggrolls with Turkey, Stuffing & Dried Cranberries
- Chicken Mango Quesadilla
- Sliced Duck Breast atop a Raisin Walnut Crostini with Fig Jam
- Nashville Hot Chicken Skewer
- Fried Chicken & Waffle Bites with Maple Syrup Drizzle
- Chicken Empanadas

### BEEF, LAMB & PORK
- Mini Beef Wellington with a Horseradish Crema
- Mongolian Sticky Beef Satay
- Quilted Franks with Dusseldorf Mustard
- Cheesesteak Dumplings with Spicy Ketchup
- Braised Beef Shortribs atop a Crispy Potato Pancake
- Chorizo Stuffed Mushrooms
- Figs Stuffed with Gorgonzola & Wrapped with Applewood Smoked Bacon
- Beef Tenderloin atop a Crostini with Dijon Horseradish, Arugula & Frizzled Onions
- Crispy BBQ Pork Belly atop a Crispy Plantain
- Sour Cherry Glazed Lamb Lollipops

### VEGETABLE
- Spanakopita
- Mexican Cheese Cigars
- Edamame Quesadillas
- Vegetable Stuffed Mushrooms
- Vegetable Spring Rolls
- Mac & Cheese Melts
- Wild Mushroom & Goat Cheese Tartlet
- Petite Grilled Vegetable Kabob

### SEAFOOD
- Jumbo Lump Mini Crab Cakes
- Coconut Shrimp
- Tuna Ceviche atop an English Cucumber Cup and Topped with Wonton Threads
- Bacon Wrapped Sea Scallops
- Smoked Salmon on a Toasted Black Bread Crostini with Caper Cream Cheese and Dill
- Tuna & Avocado Poke Presented in an Edible Cone
- Chili Glazed Grilled & Chilled Shrimp
- Crispy Fish Mini Taco with Chipotle Aioli
- Sesame Seared Ahi Tuna with Seaweed Slaw, Wasabi Cream & Wonton Shell
- Potato Wrapped Shrimp

### SAVORY
- Savory Brie & Raspberry Purse
- Goat Cheese, Fig Jam & Grilled Pear Crostini
- Candied Bacon Spoon with Crunchy Caramel Chocolate Goo
- Seedless Grapes Rolled with Boursin and Pistachio Crumbs
- Watermelon, Basil & Feta Skewer
- Sweet Cream Cheese Tartlet with Pears, Toasted Almonds & Hot Honey Drizzle
- Brie & Date Stuffed Mushrooms Topped with Candied Pecans
- Caramel Apple Tartlets with Sugared Raisin
- Proscuitto, Brie, Fig Jam, Caramelized Shallots & Sour Cherry Salsa Flatbread Squares

### VEGAN
- Vegan Vegetable Potstickers
- Crispy Tempura Tofu
- Mini Falafel
- Harissa Glazed Cauliflower Florets
- Eggplant Tapenade Stuffed Mushrooms
- Quinoa Stuffed Mini Peppers
- Vietnamese Style Vegetable Spring Rolls
- Orzo Stuffed Cherry Tomatoes
- White Bean Crostini with Veggies
- Zesty Tabbouleh atop an Eggplant Chip

---

## 1.3 Cocktail Displays — Section 2

| Display | Instruction | Items to Create in Menu Items | Station Preset |
|---------|-------------|------------------------------|----------------|
| **Vegetable** | Choose 1 | Marinated Grilled Seasonal Vegetables & Fresh Crudite (with Balsamic Sherry Reduction, Sundried Tomato Ranch, Flatbreads, Crackers, Roasted Garlic Hummus, Herbed Oil) | Link parent item(s) |
| **Spreads & Breads** | Choose 1 | House-Made Roasted Red Pepper Hummus, Smoked Salmon Dip, Traditional Bruschetta & Spinach and Artichoke Dip (with Crostinis, Baguettes, Toasted Pita) | Link parent item(s) |
| **Grande Charcuterie Display** | Choose 1 | Artisinal blend of cheeses, meats, nuts, manicured vegetables (with Crackers, Crostini, Dried & Fresh Fruit, Olives, Nuts) | Link parent item(s); each component can be individual |
| **Pasta Flight Presentation** | All 3 | Penne a la Vodka with Red Pepper Jam • Bruschetta Pasta Primavera • Bowties with Grilled Chicken, Basil Pesto, Yellow Peppers & Sun Dried Tomatoes | Pick Count: 3; link all 3 pastas |

---

## 1.4 Cocktail Displays — Section 3

| Display | Instruction | Items to Create in Menu Items | Station Preset |
|---------|-------------|------------------------------|----------------|
| **Farmers' Market Fruit** | Choose 1 | Fresh Seasonal Fruit Display with Duo of Dips | Link parent item |
| **Cravin' Asian** | Choose 1 | Tuna Ceviche with English Cucumber Petals & Crispy Wontons • Chicken or Shrimp Lo Mein in Mini Chinese Take-Out Containers • Pacific Rim Oriental Chicken or Pork Potstickers • Vegetable Spring Rolls | Pick Count: 1; link all 4 as options |

---

## 1.5 Cocktail Boosts

| Boost | Instruction | Items to Create | Add-on | Station Preset |
|-------|-------------|-----------------|--------|----------------|
| **BarWerx Appetizer Sampler** | Choose 4 | Cheesy Potato Skins with Bacon & Sour Cream • Cheese Quesadillas with House Made Salsa • Classic Boneless Buffalo Wings • Mozzarella Sticks | +$8/person | Pick Count: 4 |
| **The Philly Jawn** | Choose 4 | Mini Roast Pork Sandwiches with House Made Roasted Peppers • Nonna's Meatballs with Sunday Gravy Sliders • Philly Cheesesteak Dumplings with Spicy Ketchup • Philly Soft Pretzels with Mustard & Warm Cheese | +$15/person | Pick Count: 4 |
| **Iced Raw Bar** | Choose 1 | Shrimp, Crab Claws, Middle Neck Clams, Oysters (display) | +$20/person | Pick Count: 1 |

---

## 1.6 Creation Stations — Section 4

| Station | Instruction | Items to Create | Station Preset |
|---------|-------------|-----------------|----------------|
| **Viva La Pasta** | **Pick 2** pastas | Penne a la Vodka • Bruschetta Pasta Primavera • Bowties with Grilled Chicken (toppings: mushrooms, broccoli, olives, tomatoes, spinach, parmesan, bacon, sausage, chicken, shrimp — as child items) | Pick Count: 2 |
| **Tex-Mex** | **Choose 2** proteins | Chicken • Beef • Pork • Shrimp (toppings as child items) | Pick Count: 2 |
| **Make Your Own Ramen Noodle Bar** | Build your own | Pork Stock • Miso Stock • Chicken/Pork/Shrimp • Egg, Cilantro, Scallions, Bok Choy, Corn, Carrots, Snow Peas, Mushrooms, Jalapeno, Ginger • Sriracha, Lime, Soy | Pick Count: varies |
| **All-American** | Choose items | Mini Angus Beef Burgers • Braised Brisket • Pulled Pork • Boardwalk Potato Wedges • Baked Potato Salad • Honey Hot Chicken Tenders | Pick Count: varies |

---

## 1.7 Creation Stations — Section 5 (Street Food Station)

| Instruction | Items to Create | Station Preset |
|-------------|-----------------|----------------|
| **Choose 4** | Mini Sliders with Aged White Cheddar, Caramelized Onions & Garlic Aioli • Crispy Cod Street Tacos or Beef Street Tacos • Carolina BBQ Pork on Bao Bun • Thai Sesame Noodles • Grilled Chimichurri Beef Kebob • Adult Mac & Cheese • Chicken Parm Slivers • Korean Fried Chicken Nuggets • Margarita & BBQ Chicken Flatbreads | Pick Count: 4 |

---

## 1.8 Creation Stations — Section 6

| Station | Instruction | Items to Create | Station Preset |
|---------|-------------|-----------------|----------------|
| **Carving Station** | **Choose 2** | Pork Tenderloin with Mushroom Duxelle en Croute • Roasted Turkey with Orange Compote & Gravy • Dr. Pepper Marinated Flank Steak • Spiral Ham with Honey Mustard Glaze | Pick Count: 2; link all 4; each has child items (sauces, gravies) |
| **Hi Bachi Station** | **Choose 2** | Chicken • Steak • Shrimp • Tofu (Substitute: Filet Mignon +$5/pp, Lobster Tail +$10/pp) | Pick Count: 2 |

---

## 1.9 Creation Stations — Section 7 (Chicken & Waffle Station)

| Category | Items to Create |
|----------|-----------------|
| **Somethin' Sweet** | Powdered Sugar • Whipped Cream • Maple Bourbon Syrup • Fresh Fruit (Strawberries, Blueberries, Bananas) • Cinnamon |
| **Savory & Delish** | Classic or Honey Hot Fried Chicken Tenders • Regular or Herb-Infused Whipped Butter • Bacon Crumbles • Fried Pickles |

---

# PART 2 — AIRTABLE STRUCTURE

---

## 2.1 Menu Items Table — Core Fields

| Field Name | Field ID | Type | Purpose |
|------------|----------|------|---------|
| **Description Name/Formula** | fldQ83gpgOmMxNMQw | Formula (primary) | Display name in pickers |
| **Item Name** | fldW5gfSlHRTl01v1 | Single line text | Raw name |
| **Category** | fldM7lWvjH8S0YNSX | Single select | Which picker(s) item appears in |
| **Child Items** | fldIu6qmlUwAEn2W9 | Linked to Menu Items | Sauces, toppings, etc. that auto-populate |
| **Parent Item** | fldBzB941q8TDeqm3 | Linked to Menu Items | Reverse link (child → parent) |

### Category Values (exact spelling)

| Category | Use For |
|----------|---------|
| `Passed App` | Passed appetizers |
| `Presented App` | Presented appetizers |
| `Buffet Metal` | Buffet – Metal |
| `Buffet China` | Buffet – China |
| `Dessert` | Desserts |
| `Station` or `Stations` | Station items |
| `Display` | Display items |
| `Deli` | Deli items |
| `Room Temp Display` | Room temp display |
| `Sauce` or `Component` | Child items (sauces, garnishes) — if used |

---

## 2.2 Child Items (Sauces, Toppings) — Auto-Populate

- **Parent record**: Set **Child Items** = [linked child IDs].
- **Child records**: Each sauce/topping is its own Menu Item; link from parent.
- When a parent or station loads, the app fetches **Child Items** and shows them with replace/remove.
- **Station Presets**: Link only **parent** items in Line 1/Line 2 Defaults. Children come from each parent's Child Items field.

### Examples

| Parent Item | Child Items (linked) |
|-------------|----------------------|
| Smoked Salmon on Black Bread Crostini | Caper Cream Cheese, Dill |
| Tuna Ceviche | Wonton Threads, Cucumber Cup |
| Pork Tenderloin | Mushroom Duxelle |
| Roasted Turkey | Orange Compote, Gravy |
| Pasta (Viva La Pasta) | Mushrooms, Broccoli, Olives, Tomatoes, Spinach, Parmesan, Bacon, Sausage, Chicken, Shrimp |

---

## 2.3 Station Presets Table

| Field Name | Type | Purpose |
|------------|------|---------|
| **Station Type** or **Preset Name** | Single line text or Single select | Name (e.g., "Carving Station", "Grande Charcuterie Display") |
| **Line 1 Defaults** | Linked to Menu Items | Parent items only |
| **Line 2 Defaults** | Linked to Menu Items | Additional parent items |
| **Pick Count** | Number or Single select | 1, 2, 4, etc. |

---

## 2.4 Stations Table (Event-level)

| Field ID | Purpose |
|----------|---------|
| fldQ1bGDg8jhJvqmJ | Station Type |
| fldoOaZsMyXiSNKTc | Event link |
| fldRo8xgmoIR2yecn | Station Items |
| fldEsD59DRXA2HjGa | Additional Components |
| fldCf9uvjWQdtJkZs | Notes |
| fldq0re2ySITrbZEq | Last Autopopulate |

---

# PART 3 — CHECKLISTS

---

## 3.1 Passed Appetizers Setup

- [ ] Every item in Section 1.2 exists as a Menu Item record.
- [ ] Each has **Category** = `Passed App`.
- [ ] Each has **Item Name** or **Description** filled.
- [ ] Items with sauces: **Child Items** linked.

---

## 3.2 Displays & Stations Setup

- [ ] Every display/station in Sections 1.3–1.9 has a Station Preset record.
- [ ] Each preset has **Line 1 Defaults** = parent Menu Items.
- [ ] Each preset has **Pick Count** set (1, 2, 4, etc.).
- [ ] Each component exists as a Menu Item (Category = Display or Station).
- [ ] Parents with sauces: **Child Items** linked.

---

## 3.3 Child Items Setup

- [ ] Each sauce/topping/child exists as a Menu Item.
- [ ] Parent has **Child Items** = [linked child IDs].
- [ ] Each child has **Item Name** or **Description** filled.

---

# PART 4 — BUFFET ITEMS

*(To be added — next section)*
