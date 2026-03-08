# Omni Prompt — Pull All Menu Data for Cursor Analysis

Use this to export your Menu Items from Airtable so Cursor can analyze and help clean up your menu table.

---

## Step 1: Run the Export Script

From your project root:

```bash
node scripts/exportMenuItemsForAnalysis.js
```

**Requirements:**
- `.env` must have `VITE_AIRTABLE_API_KEY` and `VITE_AIRTABLE_BASE_ID`
- Optional: `VITE_AIRTABLE_MENU_ITEMS_TABLE` (default: `tbl0aN33DGG6R1sPZ`)

**Output:**
- Creates `menu-items-export.json` in the project root
- Prints a category summary to the console

---

## Step 2: Share the Data with Cursor

**Option A — Paste the file contents**
1. Open `menu-items-export.json`
2. Copy its contents
3. Paste into the Cursor chat with a message like: *"Here is my Menu Items export. Analyze it and tell me what needs to be fixed."*

**Option B — Reference the file**
1. In Cursor chat, type: `@menu-items-export.json`
2. Add: *"Analyze this Menu Items export and tell me what needs to be fixed."*

---

## What the Export Contains

| Field | Description |
|-------|-------------|
| `id` | Airtable record ID |
| `name` | Display name (Description Name/Formula or Item Name) |
| `itemName` | Raw Item Name |
| `category` | Category value (what Cursor filters on) |
| `stationType` | Station Type |
| `serviceType` | Service Type |
| `section` | Section |
| `childItemIds` | Linked Child Item record IDs |
| `parentItemId` | Parent Item record ID (if child) |
| `hasChildItems` | Whether item has Child Items linked |
| `hasParentItem` | Whether item has a Parent Item |

Plus a **categorySummary** that counts how many items each category has.

---

## What Cursor Can Do With This

1. **Category audit** — Which items are in "problem" categories (Entrée, Appetizer, Component, etc.?
2. **Missing picker** — Which items won't show in any picker?
3. **Reassignment plan** — Suggest which category each item should have
4. **Child Items check** — Which parents have/don't have Child Items linked?
5. **Duplicate detection** — Items with similar names
6. **Empty/missing** — Items with no name or no category

---

## Quick Copy-Paste Prompt for Cursor

After running the export:

```
I ran the export script. Here is my menu-items-export.json:

[paste file contents here]

Please analyze:
1. Which items are in categories that won't show in any picker?
2. What should each item's category be reassigned to?
3. Which items have Child Items missing?
4. Give me a cleanup plan (or a CSV I can use to bulk update in Airtable).
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Missing VITE_AIRTABLE_API_KEY` | Add to `.env` from Airtable token |
| `403 Forbidden` | Token needs `data.records:read` scope |
| `Table not found` | Check `VITE_AIRTABLE_MENU_ITEMS_TABLE` in `.env` |
| `ENOENT` / path error | Run from project root: `cd c:/eventops` then run script |
