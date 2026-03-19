# Full-Service BEO: Stations, DELI, and How to Pick/Render (Analysis + UI Plan)

This doc is based on analyzing the real BEOs (including the **PRESENTED APP STATION - ALL AMERICAN STATION** + **DELI** excerpt you shared) and the codebase. Goal: one clear pattern for how the BEO is broken down when there are stations, and how the UI should let you pick and render **stations, platters, displays, boards** and anything with **multiple child items or options** — full service only; deliveries later.

---

## 1. Where “DELI” Comes From on the BEO

On the real BEO, **DELI** is not a random label. When there is a **station** (e.g. a Presented App Station), the BEO is structured like this:

1. **Section header** (e.g. yellow bar): **PRESENTED APP STATION - ALL AMERICAN STATION - CHINA/METAL**
2. **Station / creation item** (e.g. “Build Your Own Sliders”) with **indented child lines** underneath (quantities + components: 72 Angus Beef Sliders, 72 Regular Slider Rolls, PLATTER Lettuce & Tomato, Pickles, Ketchup, etc.).
3. **Other individual items** in that same section (e.g. 2 HOTEL Crispy Boardwalk Potato Wedges, 50 Garden Salad Shooters…).
4. **Next section** (e.g. blue bar): **DELI**
5. **Items under DELI**: e.g. 60 Artisan Rolls, 2 Infused Butter.

So **DELI** is the name of the **next section** that follows the station(s). It’s where supporting items (rolls, butter, and on other BEOs possibly sandwich platters) live. The word “DELI” comes from that **section breakdown**, not from “sandwiches” only.

---

## 2. How Old BEOs List Creation Stations: Appetizer vs Buffet

From the BEO dump and your sample:

### When the creation station is part of the **appetizer** (Presented App)

- **Section header** is station-specific:  
  **PRESENTED APP STATION - [STATION NAME] - CHINA/METAL**  
  Examples: “PRESENTED APP STATION - ALL AMERICAN STATION - CHINA/METAL”, “PRESENTED APP STATION 1 - PASTA FLIGHT - CHINA/METAL”.
- Under that header:
  - **Creation station name** (e.g. “Build Your Own Sliders”) as the **main line**.
  - **Child items** listed **indented** below: quantities (72 Sliders, 72 Rolls), components (PLATTER Lettuce & Tomato, Pickles, Ketchup, etc.).
- After that block of items, the next section is often **DELI** (Artisan Rolls, Infused Butter, etc.), then **BUFFET - METAL** / **BUFFET - CHINA** as applicable.

So: **Appetizer creation station** = under a **PRESENTED APP STATION - [Name] - CHINA/METAL** section, with **one main line + indented child lines**.

### When the creation station is part of the **buffet**

- **Section header** is the generic buffet section: **BUFFET - METAL** or **BUFFET - CHINA**.
- The creation station is **listed inside that section** the same way: **main line** (e.g. “Build Your Own” Slider Bar, “Build Your Own” Yogurt Sundae) and **indented child lines** (components, quantities).
- No separate “BUFFET STATION - [Name]” header in the dump; the station sits under **BUFFET - METAL** or **BUFFET - CHINA** with the rest of the buffet items.

So: **Buffet creation station** = under **BUFFET - METAL** or **BUFFET - CHINA**, same **main line + indented children** format.

**Summary**

| Placement              | BEO section header                          | Creation station rendering                    |
|------------------------|---------------------------------------------|-----------------------------------------------|
| **Presented Appetizer**| PRESENTED APP STATION - [Name] - CHINA/METAL| One main line + indented child lines          |
| **Buffet Metal**       | BUFFET - METAL                              | One main line + indented child lines          |
| **Buffet China**       | BUFFET - CHINA                              | One main line + indented child lines          |

---

## 3. One Format for Anything With Multiple Child Items / Options

On the BEO, the same pattern is used for:

- **Creation stations** (Build Your Own Sliders, Yogurt Sundae, etc.)
- **Stations** with components (e.g. Pasta Flight with pasta + toppings)
- **Platters** (platter name + sub-items)
- **Displays / boards** (display name + components)

So we should use **one consistent format** everywhere:

- **Main line**: the station / platter / display / board name (and quantity if applicable).
- **Child lines**: indented; each child is a component, option, or sub-item (with quantity or “PLATTER” etc. as on the BEO).

The app already does this for:

- **Stations**: `expandItemToRows` with `station-hdr-` items (header line + components from `\n`-encoded name).
- **Menu items with `childIds`**: parent name line + indented child names (and sauce/description as needed).

So the **BEO render rule** is: **anything that has multiple child items or a list of options uses the same pattern as creation station items: one main line, then indented child lines.**

---

## 4. How the UI Should Be Laid Out (Full Service)

So you’re not overwhelmed and the pickers aren’t “jacked up,” the UI should mirror the BEO:

### 4.1 Picking

- **Stations**  
  - Picked by **placement** (Presented Appetizer / Buffet Metal / Buffet China).  
  - Each station is **one group**: station type/name + components (station items + station notes).  
  - Same pattern as today’s Creation Station: one card per station, with a way to open a **sub-menu** to edit components, delete, or add.

- **Platters (e.g. sandwich platters)**  
  - Each platter = **one group**: platter name + quantity + list of picks (child items).  
  - **Sub-menu** on that group: modify picks, delete platter, add more.  
  - So: same “grouped card + sub-menu” pattern as creation stations.

- **Displays / boards**  
  - Same idea: one card per display/board, with **child items** (components).  
  - Sub-menu to edit/delete/add.

- **Any menu item with multiple options/children**  
  - Shown as **main item + children** (like creation station items).  
  - Picking/editing exposes the list of options/children in one place (e.g. sub-menu or inline list).

So the **UI layout rule** is: **one pattern for all “multi-child” things: grouped card (main line + list of children) + sub-menu to modify/delete/add**, matching how they render on the BEO.

### 4.2 Rendering on the BEO (Full Service)

- **Section order** (already in place): Passed Appetizers → Presented Appetizers → Buffet Metal → Buffet China → Desserts.  
- **When there are stations under Presented Appetizer:**  
  - Option A (match old BEOs exactly): use a **per-station section header** like **PRESENTED APP STATION - [Station Name] - CHINA/METAL**, then list that station’s items (main + indented children), then other presented items, then **DELI** (see below).  
  - Option B (simpler): keep one “PRESENTED APPETIZERS” section; list each station as **main line + indented children** (already done), then add a **DELI** section when there are presented stations (or when DELI items exist).  
- **DELI section:**  
  - When the BEO has a station block (or when we have “DELI” items for full service), add a **DELI** (or **DELI - CHINA/METAL**) section **after** the presented-app (and station) block, before Buffet.  
  - Contents: supporting items (e.g. Artisan Rolls, Infused Butter) and/or sandwich platters (platter name + indented sub-items), same main + children format.

So:

- **Creation station (appetizer)** → under PRESENTED APP STATION - [Name] - CHINA/METAL (or under PRESENTED APPETIZERS with DELI after).  
- **Creation station (buffet)** → under BUFFET - METAL or BUFFET - CHINA, main + indented children.  
- **Platters / displays / boards** → same main + indented children; section depends on placement (e.g. DELI for sandwich platters, or existing Buffet/Presented sections).

---

## 5. What’s Missing Today (Full Service Only)

| Piece | Current state | Target |
|-------|----------------|--------|
| **DELI section** | No DELI on full-service BEO. | Add **DELI** (or DELI - CHINA/METAL) section when there are stations or DELI/platter items; place after Presented App(s), before Buffet. |
| **Section header for stations** | We use “PRESENTED APPETIZERS” and mix stations with items. | Optionally use **PRESENTED APP STATION - [Name] - CHINA/METAL** per station to match old BEOs. |
| **Stations / platters / boards in UI** | Creation station has one modal; platters have one modal. No per-item grouped cards with sub-menu. | **Grouped cards** for each station, platter, display, board, with **sub-menu** to modify/delete/add (same pattern as creation station items). |
| **Picker consistency** | Different flows for stations vs platters vs regular items. | **One pattern**: anything with multiple child items = pick as a group, show main + children, edit via sub-menu. |
| **Components missing on items** | Many food items that should have “child” options (toppings, sides, etc.) don’t show them. | Identify which items on the BEO have components and ensure they have **childIds** or equivalent and render (and pick) with the same main + indented children format. |

---

## 6. Suggested Next Steps (Full Service Only)

1. **BEO rendering**  
   - Add a **DELI** section to the full-service BEO when: (a) there are presented-app stations, or (b) there are full-service DELI/platter items.  
   - Populate DELI with: Artisan Rolls / Infused Butter (or from event data) and/or sandwich platters (platter name + indented sub-items).  
   - Keep using **expandItemToRows** so every “multi-child” item (stations, platters, items with childIds) prints as **main line + indented child lines**.

2. **UI: one pattern for multi-child things**  
   - Refactor so **stations, platters, displays, boards** all use:  
     - **Grouped card** (title + list of children).  
     - **Sub-menu** (edit / delete / add) on that card.  
   - Keep creation station items as the **reference implementation** for this pattern.

3. **Creation station on BEO**  
   - **Appetizer:** Render under a presented-app block; if we add per-station headers, use **PRESENTED APP STATION - [Station Name] - CHINA/METAL**, then main + children.  
   - **Buffet:** Keep rendering under **BUFFET - METAL** or **BUFFET - CHINA** with main + indented children (no change in format).

4. **Components on food items**  
   - From BEOs, list items that have “child” options (e.g. sliders + rolls + lettuce, pasta + toppings).  
   - Ensure they’re modeled with **childIds** (or equivalent) and that the picker shows them as one group with editable children, and that **expandItemToRows** already handles them (it does for childIds).

5. **Deliveries**  
   - Tackle after full-service flow and BEO layout are consistent.

---

## 7. Short Summary

- **DELI** on the BEO = the **section that follows the station(s)** (e.g. after PRESENTED APP STATION - ALL AMERICAN STATION), not “sandwiches” only.  
- **Creation station (appetizer)** = under **PRESENTED APP STATION - [Name] - CHINA/METAL** with main + indented children.  
- **Creation station (buffet)** = under **BUFFET - METAL** or **BUFFET - CHINA** with main + indented children.  
- **One format** for stations, platters, displays, boards, and any item with multiple options: **main line + indented child lines** on the BEO, and **grouped card + sub-menu** in the UI.  
- **Full service:** Add DELI section, optionally per-station headers, and align all “multi-child” picking and rendering to this pattern; then handle deliveries.

This gives you a single, consistent pattern so the BEO and the UI stay in sync and you can avoid the confusion from multiple different picker flows.
