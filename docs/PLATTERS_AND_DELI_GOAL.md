# Platters & Deli — What You’re Trying To Do (and where things are now)

## What you want (in one place)

1. **Platters grouped for full service**  
   When someone picks sandwich platters for a **full-service** event, those platters should appear **grouped together** (same as on the BEOs: e.g. “Petite Cut Gourmet Sandwiches” with the chosen sandwiches listed under it), and the service team should see them in a clear “when/where” section.

2. **Sub-menu to modify / delete / add**  
   For each platter (and maybe for individual sandwich items), you want a **sub-menu that pops up** so the user can:
   - **Modify** what’s on that platter (change picks),
   - **Delete** the platter or an item,
   - **Add** more items or more platters.

3. **Same names as the BEOs**  
   The platter names and sandwich options should match what’s on the BEOs (e.g. “Petite Cut Gourmet Sandwiches”, “foodwerx Classic Sandwiches - Topped w/ Sliced Roma Tomato & Green Leaf Lettuce”). You think those items might **already be in the picker** but in the **wrong spot** — so the job is to show them in the right place and group them correctly.

---

## Does this make sense?

Yes. In short you want:

- **Full service:** Platters (and possibly individual deli items) to appear in a **dedicated, grouped** place (like “DELI - CHINA/METAL” on the BEO), not mixed into Passed App / Presented App / Buffet.
- **UI:** Platters shown as **groups** (one block per platter), each with a way to **open a sub-menu** to edit (modify/delete/add) the contents of that platter.
- **Naming:** Use the **same names as on the BEOs**; and if those items already exist in the app, surface them in the **right section** (platters/deli for full service), not “in the wrong spot.”

---

## Where things are today (“wrong spot” / gaps)

### 1. Full-service BEO has no DELI section

- **Delivery/pick:** The app has a **DELI - DISPOSABLE** section. Individual deli items (from the menu picker) and **platters** (from “Add Sandwich Platter”) both print there, grouped (platter name + sub-items).
- **Full service:** The Kitchen BEO only has: Passed Appetizers, Presented Appetizers, Buffet Metal, Buffet China, Desserts. There is **no DELI - CHINA/METAL** (or similar) section.
- So when you configure “Sandwich Platters” for a **full-service** event (in the “SANDWICH PLATTERS” block at the bottom of the menu), that data is **saved** (in localStorage) but **never printed** on the full-service BEO. Service never sees those platters on the sheet.

So for full service, platters are “in the wrong spot” in the sense that they’re **not on the BEO at all**.

### 2. Where the sandwich/platter items actually live

- **Individual sandwiches/wraps:** In the **Deli** menu picker (category “deli”) — only used when the event is **delivery/pick**. So for delivery, you have “+ Add Deli Item” and the picker shows menu items with Category = Deli (or Deli/Sandwiches, etc.). Those are the same names that can appear on the BEO.
- **Platter types and options:** In **sandwich platter config** (`src/config/sandwichPlatterConfig.ts`): platter type names (e.g. “Petite Cut Gourmet Sandwiches”, “Classic Sandwiches”) and the list of options per platter. These are **not** coming from the Menu Items table; they’re fixed in code. So the “same names as the BEOs” are already there for **platters**; individual sandwich names in the **picker** come from Airtable Menu Items (Category = deli).

So:
- **Platter names** = in config; we already added BEO-style names.
- **Individual sandwich names** = in Airtable (deli category); they appear in the picker only for **delivery** (under DELI - DISPOSABLE). For **full service** there is no deli picker and no DELI section on the BEO, so they’re “in the wrong spot” for full service in that they’re not available in a full-service deli/platter context.

### 3. Sub-menu to modify/delete/add

- Today, **platters** are edited in one **Sandwich Platter** modal: you see all platter rows, each with platter type, qty, and dropdowns for picks. There’s no “grouped card per platter” on the main menu view with a **pop-up sub-menu** to edit just that platter (modify/delete/add).
- So the desired behavior — **grouped platters** with a **sub-menu** to modify/delete/add — is only partly there: you can edit in the modal, but not via a “click this platter → sub-menu pops up.”

---

## What would need to change (high level)

1. **Full-service BEO: add a DELI (or “Sandwich Platters”) section**  
   For full-service events, add a section (e.g. **DELI - CHINA/METAL**) to the Kitchen BEO (and Server BEO if applicable) and fill it with:
   - Platter orders from localStorage (same as delivery: platter name + sub-items), and  
   - Optionally, individual deli/sandwich items from a full-service deli field (if you add one).

2. **Full-service menu UI: one place for “Deli / Platters”**  
   So it’s not “wrong spot”: either  
   - Show the same “Sandwich Platters” block in a more visible, logical place for full service (e.g. near Buffet or in its own “Deli / Sandwiches” section), and/or  
   - Add a full-service “Deli” section that lists both individual sandwiches (from a picker) and platters, so everything is grouped together.

3. **Platters shown as groups, with a sub-menu**  
   In the menu UI, show each platter as a **grouped card** (e.g. “Petite Cut Gourmet Sandwiches × 2” with the picks listed). Each card has a control (e.g. “Edit” or click) that opens a **sub-menu/popover** to:
   - **Modify** picks for that platter,
   - **Delete** that platter,
   - **Add** more picks or more platters (or go to “Add platter” flow).

4. **Keep using the same names as the BEOs**  
   Already done for platter types. Individual items stay from the deli picker (Airtable); when you add full-service deli, use the same deli category so the same names appear.

---

## Summary

- You want **platters grouped** for full service and a **sub-menu** to **modify/delete/add**; and you want the **same names as the BEOs**, with nothing “in the wrong spot.”
- Right now: platters for full service **don’t print** (no DELI section on full-service BEO), and the UI doesn’t show platters as grouped cards with a pop-up sub-menu. Individual sandwich items are in the deli picker but only used for delivery.
- Making it all make sense means: (1) adding a full-service DELI section to the BEO and (2) showing platters as grouped cards with an edit sub-menu; optionally (3) a clearer single “Deli / Platters” place for full service so nothing feels in the wrong spot.

If you want to tackle this in code next, the first step is usually: **add DELI - CHINA/METAL (or “Sandwich Platters”) to the full-service BEO** so platters configured for full service actually show on the sheet. Then we can add the grouped cards and sub-menu in the UI.
