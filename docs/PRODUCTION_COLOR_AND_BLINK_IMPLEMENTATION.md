# Production Color & Blink Implementation Plan

When an event is hard-locked (ready for production), it should turn its type color and blink until the department accepts it by clicking. Once accepted, it stops blinking and stays at that color.

---

## 1. State Model

| State | Condition | Appearance |
|-------|-----------|------------|
| **Default** | Not ready for production | Grey everywhere |
| **Pending acceptance** | Hard locked, not yet accepted | Color + blinking |
| **Accepted** | Hard locked + department accepted | Color, no blink |

**Ready for production** = `guestCountConfirmed === true` AND `menuAcceptedByKitchen === true` (what Hard Lock sets today).

**Accepted by department** = new checkbox `Production Accepted` (or similar) in Airtable.

---

## 2. Color Mapping (when ready for production)

| Event Type | Color | Hex |
|------------|-------|-----|
| Full-service | Blue | `#3b82f6` |
| Delivery | Yellow | `#eab308` |
| Pickup | Purple | `#a855f7` |

---

## 3. Airtable Changes

### New field in Events table

- **Name:** `Production Accepted` (or `Accepted by Department`)
- **Type:** Checkbox
- **Default:** unchecked

**Create via script:**
```bash
npm run schema ensure-production-accepted
```

The script creates the field if it doesn't exist. Checkbox fields require `options: { icon: 'check', color: 'greenBright' }` in the Airtable API.

Add to `LockoutFieldIds` (or a similar lookup) in `src/services/airtable/events.ts` so it can be:
- Fetched in `loadEvents`
- Written when the department clicks to accept

---

## 4. Backend / Data Layer

### `src/services/airtable/events.ts`

1. **Extend `LockoutFieldIds`** (or add a new field resolver):
   ```ts
   productionAccepted: string;  // "Production Accepted" field ID
   ```

2. **Fetch lockout fields in `loadEvents`**  
   - Resolve lockout field IDs (including `productionAccepted`)  
   - Add them to the `fields[]` param  
   - Map into `EventListItem`

3. **Extend `EventListItem`**:
   ```ts
   guestCountConfirmed?: boolean;
   menuAcceptedByKitchen?: boolean;
   productionAccepted?: boolean;
   ```

4. **Add to `SAVE_WHITELIST`** (or `additionalAllowedFieldIds`) so `setFields` can write `productionAccepted`.

---

## 5. Helper Functions

### `src/lib/productionHelpers.ts` (new file)

```ts
import { isDelivery, isPickup } from "./deliveryHelpers";

export type ProductionColor = "grey" | "blue" | "yellow" | "purple";

export function isReadyForProduction(item: {
  guestCountConfirmed?: boolean;
  menuAcceptedByKitchen?: boolean;
}): boolean {
  return item.guestCountConfirmed === true && item.menuAcceptedByKitchen === true;
}

export function shouldBlink(item: {
  guestCountConfirmed?: boolean;
  menuAcceptedByKitchen?: boolean;
  productionAccepted?: boolean;
}): boolean {
  return isReadyForProduction(item) && item.productionAccepted !== true;
}

export function getProductionColor(
  item: { eventType?: string; guestCountConfirmed?: boolean; menuAcceptedByKitchen?: boolean }
): ProductionColor {
  if (!isReadyForProduction(item)) return "grey";
  const et = (item.eventType ?? "").toLowerCase();
  if (isDelivery({ eventType: et })) return "yellow";
  if (isPickup({ eventType: et })) return "purple";
  return "blue";  // full-service
}

export const PRODUCTION_COLORS: Record<ProductionColor, string> = {
  grey: "#6b7280",
  blue: "#3b82f6",
  yellow: "#eab308",
  purple: "#a855f7",
};
```

---

## 6. UI Changes by View

### 6.1 Dashboard — List View

- **Text color:** Use `getProductionColor()` → grey when not ready, blue/yellow/purple when ready.
- **Category pill:** Same color logic.
- **Blink:** Add `.dp-list-row-blink` when `shouldBlink()`.
- **Click handler:** If `shouldBlink()`, call `setFields(eventId, { [productionAcceptedFieldId]: true })`, then `loadEvents()` (or optimistic update), then proceed with normal select.

### 6.2 Dashboard — Grid View (cards)

- **Card border/glow:** Use `getProductionColor()`.
- **Blink:** Add `.dp-card-blink` when `shouldBlink()`.
- **Click handler:** Same as list view.

### 6.3 Dashboard — Calendar View

- **Event box color:** Use `getProductionColor()`.
- **Blink:** Add `.dp-calendar-event-blink` when `shouldBlink()`.
- **Click handler:** Same as list view.

### 6.4 BEO Intake Page

- **Outlines:** When event is full-service and ready → blue outlines.
- No blink needed here (intake is FOH; blink is for kitchen/departments).

### 6.5 Delivery BEO Page (Kitchen BEO / Delivery Command)

- **Outlines:** When event is delivery and ready → yellow outlines.
- **Pickup:** Purple outlines when pickup and ready.

---

## 7. Blink Animation (CSS)

```css
@keyframes dp-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.dp-list-row-blink,
.dp-card-blink,
.dp-calendar-event-blink {
  animation: dp-blink 1.2s ease-in-out infinite;
}
```

---

## 8. Click-to-Accept Flow

When the user clicks an event (list row, grid card, or calendar event):

1. If `shouldBlink(event)`:
   - Call `eventStore.setFields(eventId, { [productionAcceptedFieldId]: true })`
   - Optimistically update local `events` (or refetch) so the blink stops immediately
   - Then run the normal click behavior (e.g. `handleSelectEvent`, open BEO, etc.)
2. If not blinking, just run the normal click behavior.

---

## 9. Data Flow for `EventListItem`

`loadEvents` currently fetches: `EVENT_NAME`, `EVENT_DATE`, `DISPATCH_TIME`, `EVENT_TYPE`, `EVENT_OCCASION`, `SERVICE_STYLE`, `GUEST_COUNT`.

**Add to fetch:**
- Lockout field IDs (resolved via `getLockoutFieldIds()`)
- `productionAccepted` field ID (new field)

**Map into `EventListItem`:**
```ts
guestCountConfirmed: fields[ids.guestCountConfirmed] === true,
menuAcceptedByKitchen: fields[ids.menuAcceptedByKitchen] === true,
productionAccepted: fields[ids.productionAccepted] === true,
```

---

## 10. Implementation Order

1. **Airtable:** Create `Production Accepted` checkbox in Events table.
2. **events.ts:** Add field resolution, extend `EventListItem`, fetch in `loadEvents`, allow in save whitelist.
3. **productionHelpers.ts:** Add helpers.
4. **DashboardPage:** Wire list/grid/calendar to use `getProductionColor`, `shouldBlink`, and click-to-accept.
5. **DashboardPage.css:** Add blink animation and production color classes.
6. **EventCard / PremiumCard:** Use production color and blink.
7. **BEO Intake:** Blue outlines when full-service + ready.
8. **Delivery BEO / Kitchen BEO:** Yellow (delivery) / purple (pickup) outlines when ready.

---

## 11. Role Considerations

- **Hard Lock:** Already restricted to `ops_admin` (ApprovalsLockoutSection).
- **Accept (click):** Likely any user who can see the event (kitchen, delivery, etc.). If you want to restrict to kitchen only for full-service, that can be added later.

---

## 12. Summary

| Before Hard Lock | After Hard Lock (pending) | After Accept |
|------------------|--------------------------|--------------|
| Grey | Color + blink | Color, no blink |
| List: grey text | List: colored text + blink | List: colored text |
| Grid: grey card | Grid: colored card + blink | Grid: colored card |
| Calendar: grey event | Calendar: colored event + blink | Calendar: colored event |
| BEO Intake: neutral | BEO Intake: blue (full-service) | Same |
| Delivery BEO: neutral | Delivery BEO: yellow (delivery) / purple (pickup) | Same |
