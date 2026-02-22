# FoodWerx EventOps - Menu Structure & System Reference

> **Instructions:** This file serves as the permanent reference for all AI assistants working on this codebase. Paste the complete information from Airtable Omni and menu data below.

---

## Airtable Menu Items Table - Field Audit

**PASTE OMNI'S FIELD AUDIT HERE**

Ask Omni in Airtable:
"Please provide a complete field audit for my Menu Items table. For each field, list: 1) Field name (exact spelling), 2) Field type, 3) If it's a select field: list ALL the options, 4) If it's a formula field: mark it as READ ONLY"

Example format:
- Item Name: Single line text
- Service Type: Single select (Passed App, Presented App, Buffet - Metal, Buffet - China, Dessert)
- Temperature: Single select (Hot, Cold, Room Temp, Either)
- etc.

---

## Complete Menu Items List

**PASTE ALL MENU ITEMS HERE (grouped by category)**

Include:
- Item names
- Service type for each
- Temperature requirements
- Vessel type (if applicable)
- Any special notes

---

## Menu Picker Rules

- Items WITHOUT a Service Type are INVISIBLE in the picker
- Sacred placement order: Passed Apps → Presented Apps → Buffet Metal → Buffet China → Desserts
- Filtering: Users should be able to filter by Service Type and Temperature
- Display: Show items grouped by category with clear visual separation

---

## Auto-Spec Engine Rules

**PASTE SPEC CALCULATION RULES HERE**

Document:
- How quantities are calculated based on guest count
- Different rules for different service types
- Override behavior (manual spec entry)
- Edge cases and exceptions

---

## BEO Print Requirements

- 3 views: Kitchen BEO, Spec View, Pack-Out View
- Kitchen BEO: 2 columns (Spec | Item Name), no designer notes
- Spec View: 3 columns (Auto-spec | Item Name | Editable override)
- Pack-Out View: 2 columns (Item Name | Editable pack-out items)
- Header: Date top-left, Client/Phone/Address left, Guests/Start/End/Arrival right
- Color-coded section borders: green=apps, orange=buffet-metal+desserts, blue=buffet-china
- One item per line ALWAYS. Sauces indented under parent.

---

## Known Issues & Bugs

**TRACK ISSUES HERE AS THEY COME UP**

Example:
- [ ] Menu picker only shows 4 items instead of all items
- [ ] Time picker doesn't work properly
- [ ] etc.

---

## Important Notes for AI Assistants

When starting a new chat session with any AI:
1. Say: "Read .github/copilot-instructions.md from tammydaz/eventops"
2. Say: "Read MENU_STRUCTURE.md from tammydaz/eventops"
3. Ask the AI to summarize what it understands
4. If it's missing information, point it back to these files

DO NOT start building until the AI has read and confirmed understanding of both files.
