# Items to Fix in Airtable — Exact Locations

**Table:** Menu Items (`tbl0aN33DGG6R1sPZ`)  
**How to find:** In Airtable, open the Menu Items table and search by record ID (e.g. `rec6DRVdXgPN2ke87`) or by Item Name.

**Direct link format:** `https://airtable.com/[YOUR_BASE_ID]/tbl0aN33DGG6R1sPZ/[RECORD_ID]`  
(Replace YOUR_BASE_ID with your base ID from .env)

---

## 1. EMPTY CATEGORY (19 items) — Set Category or Delete Duplicates

### ⚠️ DUPLICATES — Delete these (already exist with category or sauce elsewhere)

**Passed App duplicates (no sauce)** — Run `npm run delete:duplicate-passed-apps` to remove via API.

The script now uses the **display name** (has " – Sauce" in the name) as the source of truth, NOT the Child Items link. It fetches fresh data and deletes only records where the name has no sauce (e.g. "Coconut Shrimp – " with trailing dash).

**Empty-category duplicates** — Delete manually in Airtable:

| Record ID | Item Name | Duplicate Of | Action |
|-----------|-----------|---------------|--------|
| **recO0E5PCIogBeiqr** | Stuffed Grape Leaves | rec5e396kE7s8i8D3 (Presented App) | **DELETE** |
| **recRMBFxnanQUWFh6** | Spanakopita | recHXEtoO9jKsfC5X (Appetizer), recbq8Y90kAZKcZex (Component) | **DELETE** |
| **recWBL7vvGUQBSyfc** | Mini Jumbo Lump Crab Cakes | rec977VeZ5cn3BOiF (Appetizer) | **DELETE** |

### Assign Category (16 unique items)

| Record ID | Item Name | Section | Suggested Category |
|-----------|-----------|---------|-------------------|
| rec6DRVdXgPN2ke87 | Roasted Garlic Cloves | Presented Apps | Presented App |
| rec6P5FirEH00FYv2 | Jumbo Grilled and Chilled Shrimp | (empty) | Passed App |
| rec9VzLrVK5vnmwIe | *(empty name)* | (empty) | Delete or fix name + assign |
| recA34aaW5YrL4FOW | Herbed Crostini | Presented Apps | Presented App |
| recNejyJqP8ID7PDL | Antipasto Items | Stations | Station Item |
| recPw7r7HOFlTJZVW | Whole Roasted Turkey - Carved | (empty) | Buffet Metal |
| recTodDwaGN9RSQnP | Fresh Vegetables (Crudité) | Presented Apps | Presented App |
| recUfKUzggvsUAVdV | Whipped Ricotta Bruschetta | Presented Apps | Presented App |
| recWcdqL4G9MwjFcx | *(empty name)* | (empty) | Delete or fix name + assign |
| recYwLS4n4Sn1VJoA | Honey | Presented Apps | Presented App |
| reccqVt6X0nODYRKx | Roasted Pepper Bruschetta | Presented Apps | Presented App |
| reccvTxcksWYYQ4Vo | Curated Cheeses | Presented Apps | Presented App |
| receNiwy1WQVVVDZ7 | *(empty name)* | (empty) | Delete or fix name + assign |
| recqs2dGo6SH1Wi78 | Tomato-Basil Bruschetta | Presented Apps | Presented App |
| rectKIGx2dlPhiuad | Crackers | Presented Apps | Presented App |
| recy0YqAq9Mw3iNIw | Caramelized Onions | Stations | Station Item |

---

## 2. BEVERAGE (16 items) — No menu picker for these

These won't show in the current Menu & Beverages pickers (that section uses different fields). **No change needed** unless you add a Beverage menu picker. For reference:

| Record ID | Item Name |
|-----------|-----------|
| rec4uw5MGrAWtcP1g | *(empty — fix name)* |
| rec75Icu7rO6Hw1cp | Coffee & Tea Service |
| rec8kAFwVf7KdpNet | *(empty — fix name)* |
| recAdeNpCrAMpZR7b | *(empty — fix name)* |
| recGQG3tVKBGdBl9I | *(empty — fix name)* |
| recKoOo3YdIU79zVA | Juices |
| recV8CIcvHue7cmQA | Infused Waters |
| recX3hBHRrIDmgcAX | Foodwerx Bottled Water |
| recaItsm2kb2ybvGo | Mixers |
| recd4Ym4hhVpoQoQJ | *(empty — fix name)* |
| reciKVQkpA80gviWg | Soft Drinks |
| recnIL1TNRXndB4ps | Garnishes |
| recoXlCscyk0J49yU | *(empty — fix name)* |
| rectMEfE6z9lmPT8b | *(empty — fix name)* |
| rectbVsioFIgmqCE3 | Signature Cocktails |
| recuzc9pTJdMEPr9P | *(empty — fix name)* |

---

## 3. SAUCE (4 items) — Usually child items

These are likely toppings/sauces. If they should appear as selectable items, change Category to **Component** (already in Buffet pickers). If they're only child items, leave as-is.

| Record ID | Item Name | Suggested |
|-----------|-----------|------------|
| recS3h1pvuvIeo4jr | Provolone Sauce | Component (or leave if child only) |
| rectRoFSgU22e8DNh | Sunday Gravy | Component (or leave if child only) |
| recvHaPO3otFfNig3 | Sour Cream | Component (or leave if child only) |
| recvN8osmMfLwSyco | Ginger Sesame Dip | Component (or leave if child only) |

---

## 4. BAR / BEVERAGE COMPONENT (3 items)

| Record ID | Item Name | Suggested |
|-----------|-----------|------------|
| recOi3RzbH9hW4Eex | Oranges - Bar Garnish; Infused Water | Leave as-is or Beverage |
| recgZHymGFrPzS7Cb | Sliced Limes - Bar Garnish; Signature Drink | Leave as-is or Beverage |
| recyaaSB9hUuIdXs8 | Sliced Lemons - Infused Water; Coffee Station; Bar Garnish | Leave as-is or Beverage |

---

## 5. DESCRIPTION (1 item) — Template/garbage record

| Record ID | Item Name | Action |
|-----------|-----------|--------|
| recCfhIEFUAMK6HvU | Item Name – Notes | **Delete** — appears to be a template/placeholder |

---

## Quick fix priority

1. **Empty category (19)** — Assign Category; use Section as a guide.
2. **Empty name (several)** — Fill Item Name or delete if unused.
3. **recCfhIEFUAMK6HvU** — Delete (template record).
4. **Beverage / Bar / Sauce** — Optional; they don't break the menu pickers.
