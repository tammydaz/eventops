# Viva La Pasta — Station Components for Airtable

Use this list to configure the **Station Components** table in Airtable so the Viva La Pasta station picker shows the correct options.

**Note:** The app normalizes "Proteins" → "Protein" (and similar plurals) so both singular and plural Component Type values in Airtable will work.

---

## Picker Layout (3 Sections)

1. **PICK 3 SAUCES** — 3 dropdown slots + custom sauce input
2. **PICK TWO PASTAS** — 2 dropdown slots + custom pasta input
3. **INCLUDED** — Vegetables, Toppings, Proteins (editable, deletable) + custom condiment input

**Auto-Fill defaults:** Sunday Gravy / Bolognese, Vodka, Alfredo (sauces); **Penne and Tortellini** (pastas); all vegetables, toppings, proteins (included).

---

## Component List by Type

| Component Name | Component Type |
|----------------|----------------|
| Penne | Starch |
| Rigatoni | Starch |
| Bowtie | Starch |
| Linguine | Starch |
| Fettuccine | Starch |
| Cavatappi | Starch |
| Tortellini | Starch *(add for Auto-Fill default with Penne)* |
| Alfredo | Sauce |
| Pesto Cream | Sauce |
| Parmesan Cream | Sauce |
| Garlic Cream | Sauce |
| Lemon Butter Cream | Sauce |
| Marinara | Sauce |
| Vodka | Sauce |
| Sunday Gravy / Bolognese | Sauce |
| Garlic & Oil | Sauce |
| Mushrooms | Vegetable |
| Broccoli | Vegetable |
| Olives | Vegetable |
| Tomatoes | Vegetable |
| Spinach | Vegetable |
| Parmesan Cheese | Topping |
| Bacon | Protein |
| Sausage | Protein |
| Grilled Chicken | Protein |
| Shrimp | Protein |

---

## Airtable Setup

### Station Components Table

1. Create records with **Component Name** and **Component Type** as above.
2. **Component Type** must be one of: `Starch`, `Protein`, `Sauce`, `Vegetable`, `Topping`, `Other`.
3. Link each component to the **Viva La Pasta** preset via:
   - **Station Preset** (or Station Presets) field on the component record, **or**
   - **Default Components** (or Components) field on the Station Presets record.

### Station Presets Table

- Ensure a preset named **Viva La Pasta** exists.
- Link the components above to it (via Default Components or via Station Preset on each component).

### Station Options Table (for pick limits)

Configure options so the app enforces:

- **Starch**: Pick 2
- **Protein**: Pick 1
- **Vegetable**, **Topping**: A la carte (or set limits as needed)

---

## Display Order

The app displays components in this order when the preset name includes "pasta" or "viva":

- **Sauce:** Alfredo, Pesto Cream, Parmesan Cream, Garlic Cream, Lemon Butter Cream, Marinara, Vodka, Sunday Gravy / Bolognese, Garlic & Oil
- **Starch:** Penne, Rigatoni, Bowtie, Linguine, Fettuccine, Cavatappi, Tortellini
- **Protein:** Bacon, Sausage, Grilled Chicken, Shrimp
- **Vegetable:** Mushrooms, Broccoli, Olives, Tomatoes, Spinach
- **Topping:** Parmesan Cheese
