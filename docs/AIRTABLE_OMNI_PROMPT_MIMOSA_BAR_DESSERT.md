# Airtable Omni prompt: Mimosa Bar in Dessert picker with child fruits

Use this prompt with **Omni** (or your Airtable AI assistant) so that **Mimosa Bar** appears in the **Dessert picker** in EventOps and shows the correct fruit for the kitchen to cut.

---

## What EventOps expects

- **Menu Items** table: items that appear in the BEO Intake pickers.
- **Dessert picker** shows items whose **Category** is one of: `Dessert`, `Dessert/Metal`, `Dessert/China`, `Dessert (Display)`, `Dessert (Individual)`.
- A **parent** menu item can have **Child Items** (linked records to other Menu Items). The app shows parent name and can show child names; the Kitchen BEO can use these for prep (e.g. fruit to cut for Mimosa Bar).

---

## Prompt to give Omni

Copy and paste the following (adjust table/field names if yours differ):

```
In the Menu Items table:

1) Create one parent record:
   - Item Name (or Description/Client Facing name): Mimosa Bar
   - Category: Dessert
   So that "Mimosa Bar" appears in the Desserts picker in our app.

2) Create 5 child menu item records (each with Item Name exactly as below):
   - Pineapple
   - Oranges
   - Strawberry
   - Blueberry
   - Raspberry

3) Link these 5 child records to the "Mimosa Bar" parent:
   - On the Mimosa Bar record, set the "Child Items" field (linked record to Menu Items) to those 5 records.
   - On each of the 5 child records, set the "Parent Item" field (linked record) to the Mimosa Bar record, if your schema has a Parent Item field.

Result: When we select "Mimosa Bar" in the Dessert picker for an event, the Kitchen BEO will show that the kitchen needs to cut fruit for the mimosa bar. The child items (Pineapple, Oranges, Strawberry, Blueberry, Raspberry) should be the fruit list the kitchen preps.
```

---

## If your base uses different field names

- **Menu Items table** might be named differently (e.g. "Menu Items", "Items").
- **Item Name** might be "Name", "Description", or "Description/Client Facing" (formula).
- **Category** must be one of: `Dessert`, `Dessert/Metal`, `Dessert/China`, `Dessert (Display)`, `Dessert (Individual)` so the item appears in the Desserts picker.
- **Child Items** is the field on the parent that links to child Menu Item records.
- **Parent Item** (if present) is the field on child records that links back to the parent.

After Omni creates these, **Mimosa Bar** will appear when you click "+ Add" under DESSERTS in the BEO Intake; selecting it and saving the event will show the mimosa fruit on the Kitchen BEO (when Bar Service also includes "Mimosa Bar").