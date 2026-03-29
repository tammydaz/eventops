# MENU STRUCTURED DATA — PHASE 2
# Source: AI_WORKSPACE/MENU_RAW_SOURCE.md
# Phase: 2 — Structured Data Extraction (NO execution/display type assigned)
# Rule: No renaming, no cleanup, no typo fixes, no merging, no inference beyond explicit text

---

## SECTION: Breakfast & Brunch — Curated Combos

---

ITEM: LOWER EAST SIDE

Parent:
LOWER EAST SIDE

min_guests: 10

Children:
- bagels | type: included
- nova lox | type: included
- scrambled eggs | type: included
- whitefish salad | type: included
- cream cheese | type: included
- red onion | type: included
- foodwerx home fried potatoes | type: included
- rugalach | type: included
- [Blintz Choice] | type: choice_required | select: 1
  - cheese blintzes with sour cream
  - cherry blintzes with sour cream

Notes:
- "sour cream" is paired with both blintz options as written; not broken out separately

---

ITEM: BISTRO BRUNCH

Parent:
BISTRO BRUNCH

min_guests: 10

Children:
- [Quiche Choice] | type: choice_required | select: 1
  - Lorraine
  - broccoli & cheddar
  - Florentine
- grilled tomatoes with Gruyere | type: included
- selection of breakfast pastries | type: included
- [Bacon Choice] | type: choice_required | select: 1
  - turkey bacon
  - pork bacon
- French toast casserole with warm maple syrup | type: included
- Greek yogurt cups with seasonal berries | type: included

Notes:
- "bacon (turkey or pork)" interpreted as a pick-1 choice as written; no quantity specified beyond "bacon"

---

ITEM: JERSEY DINER

Parent:
JERSEY DINER

min_guests: 10

Children:
- [Breakfast Meats] | type: choice_required | select: 2
  - bacon
  - turkey bacon
  - sausage
  - turkey sausage
  - Canadian bacon
  - honey-smoked ham
- [Scrambled Eggs] | type: choice_required | select: 1
  - scrambled eggs with cheese
  - scrambled eggs without cheese
- foodwerx home fried potatoes | type: included
- silver dollar pancakes with warm maple syrup | type: included
- fruit salad | type: included
- selection of breads & mini muffins | type: included

Notes:
- "select 2" is explicitly stated in source text

---

ITEM: CHEF'S SPECIAL

Parent:
CHEF'S SPECIAL

min_guests: 10

Children:
- Cinnamon cornflake crusted challah French toast | type: included
- [Loaded Pancakes Flavor] | type: choice_required | select: 1
  - banana-chocolate
  - mixed berries
  - cinnamon-apple-walnut
- whipped cream | type: included
- fruit kabobs with yogurt dip | type: included
- [Breakfast Meat] | type: choice_required | select: 1
  - bacon
  - turkey bacon
  - sausage
  - turkey sausage
  - Canadian bacon
  - honey-smoked ham

Notes:
- Source text spells "challah" as "challa" — preserved as-is per Phase 1 typo rule; flagging here for awareness
- Breakfast meat options confirmed by owner 2026-03-29; same options as JERSEY DINER

---

ITEM: CREATE YOUR OWN OMELTTE BAR

Parent:
CREATE YOUR OWN OMELTTE BAR

min_guests: 20

Children:
- whole eggs & egg whites | type: included
- [Protein Choice] | type: choice_required | select: any
  - bacon
  - sausage (pork or turkey)
  - porkroll
- broccoli | type: included
- mixed peppers | type: included
- mushrooms | type: included
- onions | type: included
- diced tomatoes | type: included
- spinach | type: included
- cheddar & mozzarella cheeses | type: included
- foodwerx home fried potatoes | type: included
- bagels with whipped butter & cream cheese | type: included
- fruit salad | type: included

Notes:
- Protein = select any (no limit); confirmed by owner 2026-03-29
- Egg base: both whole eggs and egg whites are included — not a choice field; confirmed by owner 2026-03-29
- Source text spells "OMELTTE" — preserved as-is per Phase 1 typo rule
- Vegetables and cheeses treated as included (available at the bar) per context; text does not frame them as a pick list
