# BEO Print Engine Specification

## Overview

The BEO Print Engine (`src/pages/BeoPrintPage.tsx`) provides three view modes for the Banquet Event Order document.

---

## View Modes

### 🍳 Kitchen BEO (Print Mode)
**Purpose:** Clean 2-column layout for kitchen use.

```
[FINAL SPEC]         [FOOD DESCRIPTION + ALLERGENS]
     LEFT                        CENTER

40 pieces        Chicken Satay 🌾
                 📝 Note: Extra crispy
1.5 qt               – peanut sauce 🥜
```

- LEFT: Final spec (override if set, auto-spec otherwise, `—` if empty)
- CENTER: Item name + allergen icons inline
- RIGHT column: hidden
- Child items indented with `–` prefix, no blank line between parent and child
- Blank line (4px spacer) after each parent-child block

### 📐 Spec View (Edit Mode)
**Purpose:** 3-column layout for spec entry and overrides.

```
[AUTO SPEC]    [FOOD DESCRIPTION + ALLERGENS]    [SPEC OVERRIDE]
    LEFT                  CENTER                      RIGHT

36 pieces    Chicken Satay 🌾                   [input: override qty]
1 qt             – peanut sauce 🥜              [input: override qty]
```

- LEFT: Auto-calculated `Print – Spec Line` (formula from Menu Items)
- CENTER: Item name + allergen icons
- RIGHT: Editable input for `Qty (Nick Spec)` — **saves on blur**, never on keystroke
- Override value replaces auto-spec in Kitchen/Print mode when locked
- RIGHT column hidden when printing

### 📦 Pack-Out View
**Purpose:** Layout for pack-out preparation.

```
[FOOD DESCRIPTION]    [EDITABLE PACK-OUT ITEMS]
       LEFT                    RIGHT

Chicken Satay 🌾     [input: chafer, tongs…]
– peanut sauce 🥜    [input: sauce boat…]
```

---

## Layout Specifications

### 3-Column Grid
```css
grid-template-columns: 160px 1fr 200px;
```

### Child Item Indentation
- Padding-left: 32px (doubled from parent's 16px)
- Background: `#fafafa` (slightly lighter)
- Font size: 12px (vs 13px for parent)
- Name prefix: `– ` (en-dash + space)

### No Blank Lines Between Parent and Child
Parent and child rows are adjacent in the DOM. A 4px spacer `<div>` is placed only **after** the complete parent+children block.

---

## Header Layout

```
DATE: [date]                              GUESTS: [count]
CLIENT: [first] [last]                    START: [time]
PHONE: [phone]                            END: [time]
VENUE: [name], [address]                  ARRIVAL: [time]
─────────────────────────────────────────────────────────
          BANQUET EVENT ORDER
    DISPATCH: [time] | JOB #: [job number]
```

- Date in top-left
- Client/phone/venue on left
- Guests/times on right
- Bold horizontal rule below
- BEO title centered in grey band
- Dispatch + Job # centered large font

---

## Banners

### Allergy Banner (red)
- Shown when `DIETARY_NOTES` has content
- Background: `#ff0000`, white text
- Position: under BANQUET EVENT ORDER title
- Repeated in footer

### Service Style Banner (orange)
- Shown when service style is NOT buffet / full service
- Background: `#f97316`, white text
- Position: under allergy banner

---

## Section Headers

Sections display in **sacred order**:
1. Passed Appetizers — green `#22c55e` border
2. Presented Appetizers — green `#22c55e` border
3. Buffet – Metal — orange `#f97316` border
4. Buffet – China — blue `#3b82f6` border
5. Desserts — orange `#f97316` border
6. Beverages — purple `#8b5cf6` border

Each section header has:
- Black background, white bold text
- Colored circle dot matching the border color
- Left border stripe in section color
- Empty sections show "No [section name] items" in italic grey

---

## Footer (Single Line)

```
[grey filled band with black outline]
CLIENT: [name] | VENUE: [name], [addr] | DISPATCH: [time] | GUESTS: [n] | JOB #: [num]
```

- `display: flex`, centered with pipe `|` separators
- Grey background `#e5e7eb` with `1px solid #000` border
- Font: 11px bold

---

## Button Bar (Toolbar)

```
[🍳 Kitchen BEO] [📐 Spec View] [📦 Pack-Out View] [💾 Save Progress] [🔒 Lock Specs] [🖨️ Print] [← Back]
```

| Button | Color | Behavior |
|---|---|---|
| Kitchen BEO | Red `#ff6b6b` when active | Switches to kitchen view mode |
| Spec View | Red `#ff6b6b` when active | Switches to spec edit mode (disabled when locked) |
| Pack-Out View | Red `#ff6b6b` when active | Switches to pack-out mode |
| Save Progress | Green `#22c55e` | Saves all current overrides, stays in edit mode |
| Lock Specs | Orange `#f97316` | Saves overrides + switches to kitchen mode + locks editing |
| Print | Blue `#2d8cf0` | `window.print()` |
| Back | Grey `#555` | `window.history.back()` |

### Save Status Indicator
Displayed below toolbar, disappears after 2 seconds:
- Saving… (neutral)
- ✅ Saved (success)
- ❌ Save failed (error)

---

## State Management

```typescript
viewMode: BeoViewMode       // "kitchen" | "spec" | "packout"
locked: boolean             // true after Lock Specs
beoData: BeoData | null     // loaded BEO data
overrides: Record<string, SpecOverrides>  // local override values
saveStatus: SaveStatus      // "idle" | "saving" | "saved" | "error"
```

### Override Input Pattern
- Uses local state + `onBlur` save (NEVER saves on keystroke)
- `useEffect` syncs from props when `currentOverrides?.qty` changes

---

## Print Behavior

When `window.print()` is called:
- `.no-print` elements hidden (toolbar, override inputs, save status)
- `.spec-override-col` hidden (right column) regardless of view mode
- Clean 2-column output

---

## Parent-Child Tree Building

```
fetchBeoData(eventId)
  → loadEvent(eventId)           // get raw fields
  → fetchMenuItemsForEvent(ids)  // fetch parent items
  → fetchChildItems(parentIds)   // fetch children via PARENT_ITEM field
  → attach children to parents
  → build per-section MenuItem arrays
```

**Stand-alone sauces** (`STAND_ALONE_SAUCE = true`) are NOT attached to their parent — they display as standalone items.

---

## Allergen Icons

Displayed inline after item name, pulled from `ALLERGEN_ICONS` multiple-select field:

| Icon | Allergen |
|---|---|
| 🌾 | Gluten |
| 🌱 | Vegan/Vegetarian |
| 🦐 | Shellfish |
| 🥛 | Dairy |
| 🥚 | Egg |
| 🥜 | Peanut/Tree nut |
| 🐷 | Pork |
| 🧀 | Cheese |
