# EventOps Verification Checklist

Use this checklist to verify that production colors, accept flows, and department dashboards are working correctly.

---

## 1. Production Colors

| Check | Expected | Status |
|-------|---------|--------|
| Event not ready for production (guest count or menu not accepted) | Grey color | [ ] |
| Full-service event, ready for production, not yet accepted | Blue color | [ ] |
| Delivery event, ready for production, not yet accepted | Yellow color | [ ] |
| Pickup event, ready for production, not yet accepted | Purple color | [ ] |
| Event accepted by all relevant departments | No blink, color may remain | [ ] |
| Colors appear correctly in **Grid view** | [ ] |
| Colors appear correctly in **List view** | [ ] |
| Colors appear correctly in **Calendar view** | [ ] |
| Colors appear on **department landing pages** (Kitchen, Flair, Delivery, Ops Chief) | [ ] |

---

## 2. Accept Flows

### Kitchen

| Check | Expected | Status |
|-------|----------|--------|
| Click blinking event on Kitchen page | Accept Transfer modal opens | [ ] |
| Enter initials and Accept | Event stops blinking, navigates to Kitchen BEO | [ ] |
| Kitchen acceptance field set in Airtable | `Production Accepted` = true | [ ] |

### Flair / Equipment

| Check | Expected | Status |
|-------|----------|--------|
| Click blinking event on Flair page | Accept Transfer modal opens | [ ] |
| Enter initials and Accept | Event stops blinking, navigates to Full BEO Packet | [ ] |
| Flair acceptance field set in Airtable | `Production Accepted (Flair)` = true | [ ] |

### Delivery / Expediting

| Check | Expected | Status |
|-------|----------|--------|
| Click blinking event on Delivery page | Accept Transfer modal opens | [ ] |
| Enter initials and Accept | Event stops blinking, navigates to BEO Intake | [ ] |
| Delivery acceptance field set in Airtable | `Production Accepted (Delivery)` = true | [ ] |

### Ops Chief

| Check | Expected | Status |
|-------|----------|--------|
| Click blinking event on Ops Chief page | Accept Transfer modal opens | [ ] |
| Enter initials and Accept | Event stops blinking, navigates to BEO Intake | [ ] |
| Ops Chief acceptance field set in Airtable | `Production Accepted (Ops Chief)` = true | [ ] |

### Main Dashboard (by role)

| Check | Expected | Status |
|-------|----------|--------|
| Kitchen user accepts blinking event | Sets Kitchen acceptance, navigates to Kitchen BEO | [ ] |
| Flair user accepts blinking event | Sets Flair acceptance, navigates to Full BEO Packet | [ ] |
| Logistics user accepts blinking event | Sets Delivery acceptance, navigates to BEO Intake | [ ] |

### Per-Department Independence

| Check | Expected | Status |
|-------|----------|--------|
| Kitchen accepts event | Event still blinks for Flair until Flair accepts | [ ] |
| Kitchen accepts event | Event still blinks for Delivery until Delivery accepts | [ ] |
| Kitchen accepts event | Event still blinks for Ops Chief until Ops Chief accepts | [ ] |
| Each department accepts independently | Event stops blinking only for that department’s view | [ ] |

---

## 3. Department Dashboards

### Kitchen (`/kitchen`)

| Check | Expected | Status |
|-------|----------|--------|
| Landing page shows 10-day pipeline | Grid of event cards | [ ] |
| Left panel visible | Links: Kitchen Home, Kitchen Prep, Kitchen BEO | [ ] |
| Cards show client, event name, health lights | No venue, guests, category pill | [ ] |
| Demo events fill when &lt; 6 real events | Demo badge, non-clickable | [ ] |
| Click non-blinking event | Navigates to Kitchen BEO | [ ] |

### Flair / Equipment (`/flair`)

| Check | Expected | Status |
|-------|----------|--------|
| Landing page shows 10-day pipeline | Grid of event cards | [ ] |
| Left panel visible | Links: Flair Home, Returned Equipment, Full BEO Packet | [ ] |
| Same card layout as Kitchen | Client, event name, health lights | [ ] |
| Click non-blinking event | Navigates to Full BEO Packet | [ ] |

### Deliveries / Expediting (`/delivery-command`)

| Check | Expected | Status |
|-------|----------|--------|
| Landing page shows 10-day pipeline | Grid of event cards | [ ] |
| Left panel visible | Links: Delivery Home, Dispatch | [ ] |
| Same card layout as other departments | Client, event name, health lights | [ ] |
| Click Dispatch | Navigates to `/delivery-command/dispatch` | [ ] |

### Ops Chief (`/ops-chief`)

| Check | Expected | Status |
|-------|----------|--------|
| Landing page shows 10-day pipeline | Grid of event cards | [ ] |
| Left panel visible | Links: Ops Chief Home, Alerts Dashboard | [ ] |
| Same card layout as other departments | Client, event name, health lights | [ ] |
| Click Alerts Dashboard | Navigates to `/ops-chief/alerts` | [ ] |

### Main Dashboard (`/`)

| Check | Expected | Status |
|-------|----------|--------|
| View dropdown on left | Today's Events, 10 Day View, Upcoming Events, Completed, Archive | [ ] |
| Sort by dropdown on left | Date, Client, Venue, Event Type, Service Style | [ ] |
| View buttons on right | Grid, List, Calendar | [ ] |
| Event stats on right | X events, X guests | [ ] |

---

## 4. Airtable Setup

| Check | Expected | Status |
|-------|----------|--------|
| Run `npm run schema ensure-department-acceptance` | Creates Flair, Delivery, Ops Chief acceptance fields if missing | [ ] |
| Fields exist in Events table | Production Accepted, Production Accepted (Flair), Production Accepted (Delivery), Production Accepted (Ops Chief) | [ ] |

---

## 5. Auth & Routing

| Check | Expected | Status |
|-------|----------|--------|
| Kitchen user login | Lands on `/kitchen` | [ ] |
| Flair user login | Lands on `/flair` | [ ] |
| Logistics user login | Lands on `/delivery-command` | [ ] |
| Ops Admin user | Can access all department pages | [ ] |

---

## Notes

- **Ready for production:** Guest Count Confirmed + Menu Accepted by Kitchen (both checkboxes in Airtable)
- **Blink:** Event blinks when ready for production and that department has not yet accepted
- **Hard Lock:** Triggers Confirm Lock modal; after lock, event turns color and blinks for departments
- **Reopen:** Editing a locked event shows Reopen Locked modal with initials
