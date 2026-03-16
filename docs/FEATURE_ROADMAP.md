# Foodwerx EventOps — Full Feature Roadmap
*Captured from owner vision session. Every item below came directly from the owner's operational experience. Address one at a time.*

---

## How to Use This Document
Each feature is numbered. Work through them in phase order. Nothing gets built until the BEO analysis findings are reviewed first where relevant.

---

## PHASE 1 — BEO Core (In Progress)
> The foundation everything else builds on. Must be solid before adding layers.

- [x] BEO Intake (menu sections, stations, serviceware)
- [x] Kitchen BEO Print
- [x] Full Service BEO Print
- [x] Station config modals (Viva La Pasta, Chicken & Waffle, etc.)
- [x] Hard print order (Passed → Presented → Buffet Metal → Buffet China → Dessert)
- [ ] BEO print section headers inside station blocks (Sauces:, Pastas:, etc.)
- [ ] Spec engine wired to BEO placement (Presented App = lighter, Buffet = heavier)
- [ ] Build Your Own Sliders station
- [ ] BEO analysis findings review (from BEO_ANALYSIS.md — address one by one)

---

## PHASE 2 — Lead & CRM System (FOH / Intake Department)
> First point of contact through handoff to BOH.

### 2.1 Lead Tracker
- Track every potential client from first contact through signed/booked
- Fields: lead source, initial contact date, follow-up dates, status, notes, assigned rep
- Statuses: New Inquiry → Quoted → Proposal Sent → Deposit Received → Booked

### 2.2 Health Light System — Pre-Handoff (FOH)
- Color indicator per event/lead showing completeness:
  - 🔴 Red = critical info missing (date, guest count, venue, menu not started)
  - 🟡 Yellow = partially complete (menu started, serviceware not filled, staff not assigned)
  - 🟢 Green = ready for handoff (all required fields complete, BEO locked)
- Visible on the event landing page at a glance

### 2.3 Health Light System — Post-Handoff (BOH)
- Separate color track after handoff:
  - 🔴 Red = kitchen not confirmed, rentals not ordered, staff not dispatched
  - 🟡 Yellow = some departments confirmed, others pending
  - 🟢 Green = all departments confirmed, event is "out the door"

### 2.4 Handoff Lock + Audit Trail
- Once event is handed off to BOH, intake fields lock
- To reopen: must enter initials + reason (creates a timestamped audit log entry)
- All departments that could be affected must be notified of any post-handoff change
- Notification log: who was notified, when, and what changed

---

## PHASE 3 — Smart Booking Alerts (At Intake Time)
> Catch problems at booking before they become day-of problems.

### 3.1 Staff Count vs. Guest Count Alert
- If staff count entered is below minimum threshold for guest count → flag in red
- Industry rule of thumb: 1 server per 8-10 guests (full service), adjust for event type
- Alert: "⚠️ Staff count may be too low for [N] guests. Consider adding [X] more."

### 3.2 Utility Person Alert
- Triggered automatically when ANY of the following are present:
  - China serviceware
  - Glassware
  - 3+ courses
  - 40+ guests
  - Off-premise venue
- Alert: "⚠️ Event complexity suggests a utility person is needed. None currently assigned."

### 3.3 General Complexity Score
- Score each event based on: guest count, course count, venue type, serviceware type, stations count
- Surface the score visually so intake staff can see "this is a heavy event" at a glance

---

## PHASE 4 — Event Dashboard (Color-Coded Landing Page)
> The home screen. At a glance, anyone can see what's happening.

### 4.1 Full Service vs. Delivery Split View
- Two tabs or two columns: Full Service | Delivery & Pickup
- Each event card shows: client name, date, venue, guest count, status light, assigned captain

### 4.2 Timeline View
- Week view and day view of all events
- Color coded by type (FS, Delivery, Pickup) and status

### 4.3 Red Alert / Blinking Red Alert (Kitchen)
- Manual trigger: kitchen or captain can flag "KITCHEN BEHIND" on an active event
- Dashboard shows blinking red on that event card
- Watchtower (owner) sees it immediately
- Auto-clears when kitchen marks themselves caught up

---

## PHASE 5 — Kitchen Prep System
> The kitchen is always behind and always forgetting to order. This fixes that.

### 5.1 Weekly Prep List
- Auto-generated from all events scheduled in the week
- Groups by ingredient/item across all events
- "You need 45 lbs of chicken across 4 events this week"

### 5.2 Daily Prep List
- Same concept but just for today's events
- Prioritized by event start time and kitchen arrival time
- Printable

### 5.3 Order Alert / Low Stock Flag
- Flag when an item is needed across multiple events and hasn't been confirmed ordered
- Eventually: connect to vendor/supplier for direct ordering

---

## PHASE 6 — Staff Management (Internal Nowsta Replacement)
> Replace Nowsta with a built-in system.

### 6.1 Staff Directory
- List of all staff: name, role (server, bartender, captain, kitchen, utility), contact, availability

### 6.2 Event Staffing
- Assign staff to each event directly from the event card
- See who's available vs. already booked on that date
- Track confirmed vs. pending responses

### 6.3 Cut Cards (Per-Person Event Briefing)
- Auto-generated from BEO data
- One card per staff member assigned to event
- Shows: event name, date, time, venue, address, their section, their section duties
- Separate template for bartenders (bar setup, pour list, glassware needs)
- Eliminates "everyone asking the captain the same questions" problem
- Printable and/or text-sendable

### 6.4 Staff Alerts
- Alert if staff total < required minimum for event complexity
- Alert if no captain assigned
- Alert if no bartender assigned when bar service is Yes

---

## PHASE 7 — Rental Integration (Ocean Rental)
> Auto-order rentals directly through Ocean Rental portal.

### 7.1 Rental Line Items in BEO
- When serviceware/rentals are marked in BEO intake, capture item + quantity
- Separate "Rentals" section in intake that maps directly to Ocean Rental catalog

### 7.2 Auto-Submit to Ocean Rental
- On handoff (or manual trigger), submit rental order directly to Ocean Rental portal
- Confirmation number saved back to event record
- Alert if rental order fails or isn't confirmed

---

## PHASE 8 — Client Portal (Split BEO Intake)
> Split intake into what staff gets and what clients fill out themselves.

### 8.1 Required Staff Section (Internal)
- Intake fields that staff must capture: dates, guest count, venue, budget, dietary restrictions, service type, handoff readiness

### 8.2 Client Self-Fill Section
- Fields that can be sent to client via a link:
  - Music preferences / DJ info
  - Floral / décor vendor contacts
  - Parking/load-in instructions
  - Special requests or allergies
  - Cake/dessert details (client-provided)
  - Preferred timeline/arrival time preferences
  - Any notes for the team
- Client fills it out, it flows directly into the event record
- No more phone tag on the small stuff

---

## PHASE 9 — Watchtower (Owner Dashboard)
> The owner sees everything from one screen.

### 9.1 All Events at a Glance
- Every active event with its status light, department confirmations, and staff count
- Drill down into any event with one click

### 9.2 Profit Margin per Event
- Revenue entered at booking (or pulled from quote)
- Costs: food cost (from spec engine), labor (hours × rate), rentals, packaging
- Shows gross margin per event and across the week/month

### 9.3 Over-Spec Tracker (Real-Time Waste)
- During or after an event, on-site servers log leftover pans via a simple mobile-friendly form
- Each logged leftover: calculates food cost wasted
- Dashboard shows: total over-spec cost this month, cost per event, worst offenders by menu item

### 9.4 Packaging Cost Tracker
- Every leftover gets a container. Track containers used per event.
- Calculate cost: containers × container price
- Show monthly packaging waste cost

### 9.5 Staff Time Waste on Leftovers
- Track time logged by staff to box/handle leftovers (self-reported on the cutcard or end-of-event form)
- Calculate: hours × hourly rate = dollar cost of leftover handling
- Compare to industry benchmark (leftovers should take < 15 min total)

---

## PHASE 10 — Advanced / Future
> Things to revisit once core is solid.

- AI intake: paste in a client email → auto-draft a BEO
- Mobile app for on-site staff
- Real-time event tracking (staff check-in, kitchen status, course timing)
- Vendor management (preferred vendors, contact info, order history)
- Multi-location support if Foodwerx expands

---

## Notes on Architecture
> For the developer (you, with AI assistance).

- All phases build on the existing React + Airtable foundation
- Phases 2-4 can be built without touching existing BEO logic
- Staff management (Phase 6) is the largest standalone build — similar scope to what's already built
- Client portal (Phase 8) requires a public-facing URL with read/write access (doable with Vercel + Airtable)
- Rental integration (Phase 7) requires checking if Ocean Rental has an API or form submission endpoint
- Watchtower (Phase 9) is read-only aggregation — pulls from existing data, no new data entry needed

---

## Reminder: Things to Address After BEO Analysis Returns
- Option B: Build Your Own Sliders as a station
- BEO print section headers inside station blocks
- Spec engine wired to BEO placement
- Any missing menu items / child items found in old BEOs
- Any structural changes to delivery BEO based on patterns found
