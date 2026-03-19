# Booking Process Blueprint — Office Staff Full Journey

**Purpose:** Map how EventOps supports the **entire booking process** from first contact to a complete BEO and automations, so nothing falls through the cracks.

---

## 1. Where Things Live Today

| Place | Route | What it does |
|-------|--------|----------------|
| **Dashboard** | `/` | Tabs, pipeline, event cards, Add Event (quick intake). |
| **New Event (Quick Intake)** | Modal from Dashboard or `/quick-intake` | Capture: client name, phone, event type, optional date → creates event → opens BEO Intake. |
| **Intake / FOH** | `/intake-foh` | Department landing: Add Event, Open Event, Leads, **Events** (10-day pipeline). |
| **Event Overview** | `/event/:id` | **Command center for one event:** summary, FOH steps (static), actions (questionnaire, reminder, notes), documents upload, tasks, BEO notes. Link to “Open Full Intake”. |
| **BEO Full Intake** | `/beo-intake/:id` | All event details: client, venue, menu, beverages, serviceware, timeline, notes. Data flows to BEO print and departments. |
| **Invoice Intake** | `/invoice-intake` | Upload invoice PDF → create/link event. |
| **BEO Print** | `/beo-print/:id` | Kitchen / Server / Pack-out views. |
| **Tasks** | Airtable + Event Overview | Follow-ups, reminders; load by event, create/complete from Event Overview. |

---

## 2. Intended Booking Pipeline (Step-by-Step)

The office should be able to **track each step** and have the system **force visibility** so nothing is missed. Information is captured at each step; the BEO is filled over time, not in one shot.

| Step | What happens | Where info lives | Where to do it in the app |
|------|----------------|------------------|----------------------------|
| **1. Initial contact** | Client name, phone, event type, date. | Events (Quick Intake). | New Event modal → BEO Intake (minimal). |
| **2. Send invoice** | Invoice sent to client. | `INVOICE_SENT` (checkbox), `INVOICE_PDF` (attachment). | Event Overview: “Send invoice” action + doc upload; step shows ✓ when sent. |
| **3. Secure deposit** | Deposit received / recorded. | Future: e.g. `DEPOSIT_RECEIVED` or payment fields. | Event Overview: “Record deposit” → mark step done (when field exists). |
| **4. Contract** | Contract sent / signed. | `CONTRACT_SENT`, `CONTRACT_SIGNED`. | Event Overview: actions + step checkmarks. |
| **5. BEO questions to client** | Send only **unanswered** BEO questions (e.g. by email) for client to fill. | Events (same BEO fields); “questionnaire sent” = task or new field. | Event Overview: “Send questionnaire” → create task; later: “Email BEO form” (link to form or pre-filled link). BEO Intake = where staff (or client) fill answers. |
| **6. Rentals (Ocean Tent)** | Order rentals. | `RENTALS`, `RENTAL_ITEMS`, `RENTALS_NEEDED` (linked records). | Event Overview: “Order rentals” → link to Ocean Tent (URL or future integration); BEO Intake / Serviceware for what’s needed. |
| **7. Reminders / follow-ups** | Force office to set and check status. | **Tasks** (by event): due date, type (e.g. Follow-up, Deposit, Questionnaire). | Event Overview: “Add reminder” / “Follow up” on tasks; list of outstanding tasks. |
| **8. BEO complete** | All required fields filled; ready for production. | Events + lockout/readiness fields. | BEO Intake: complete all sections → “Send to BOH” / “Fire Event”. |
| **9. Automations** | Kitchen, Flair, Delivery, Ops get the event. | Same Events data; automations trigger when BEO is finalized. | After “Fire Event” (or equivalent): automations run; departments see event in their views. |

---

## 3. Event Overview as the “Command Center”

**Event Overview** (`/event/:id`) should be the **single place** where office staff:

- See **status of every step** (done vs not done), driven by real data.
- **Do the next action**: send invoice, record deposit, send questionnaire, add reminder, order rentals, open full intake.
- See **outstanding tasks** and follow up.
- Upload **documents** (invoice, contract, etc.).
- Open **BEO Full Intake** when it’s time to fill or complete the BEO.

So:

- **FOH Required Steps** on Event Overview should be **dynamic**: each line = one step, checkbox ✓ or ⬜ from Airtable (and tasks where relevant).
- **Actions** = buttons that do the thing (e.g. “Send questionnaire” creates a task; “Record deposit” toggles a field when it exists) and/or link out (e.g. Ocean Tent).
- **Nothing falls through** = staff are forced to see the list and the next due task/step.

---

## 4. Data Already in Airtable (Relevant to Booking)

- **Invoice:** `INVOICE_SENT`, `INVOICE_PAID`, `INVOICE_PDF`.
- **Contract:** `CONTRACT_SENT`, `CONTRACT_SIGNED`.
- **Rentals:** `RENTALS`, `RENTAL_ITEMS`, `RENTALS_NEEDED`.
- **Tasks:** Tasks table (by event) — follow-ups, reminders.
- **Documents:** `EVENT_DOCUMENTS`.
- **BEO:** All BEO intake fields; lockout/readiness when implemented.

**Not yet (optional next):**

- Deposit received (e.g. `DEPOSIT_RECEIVED` or use payment status).
- “Questionnaire sent” / “Client BEO link sent” (field or task type).
- Ocean Tent: link or API (e.g. “Order rentals” opens Ocean Tent with event context).

---

## 5. Flow in Plain Language

1. **Initial contact** → Quick Intake (name, phone, type, date) → event created → open BEO Intake to capture basics.
2. **Event Overview** = home base for this event: see steps (invoice sent? deposit? contract? questionnaire? rentals? reminders?).
3. **Each step** = either an action in the app (upload invoice, mark sent, create task) or a link (e.g. Ocean Tent).
4. **BEO questions** not yet answered can be sent to client (email with link to form or pre-filled form); answers flow into same BEO fields.
5. **Rentals** = order via Ocean Tent (link/integration); what’s needed can be in BEO Intake / Serviceware.
6. **Reminders** = tasks; office must check Event Overview and follow up until step is done.
7. When **all steps and BEO are complete** → “Fire Event” (or Send to BOH) → BEO is final, automations run, departments get the event and a complete BEO is auto-populated for each.

---

## 6. Implementation Order (Suggested)

1. **Event Overview steps driven by data** — FOH Required Steps read from `INVOICE_SENT`, `INVOICE_PAID`, `CONTRACT_SENT`, `CONTRACT_SIGNED`, and optionally task counts, so ✓/⬜ reflect reality.
2. **Actions that update state** — “Send invoice” / “Record deposit” (when field exists) / “Contract sent” etc. toggle the right fields so steps turn to ✓.
3. **Questionnaire** — “Send questionnaire” creates a task; later add “Email BEO form” (link or form) and track “questionnaire sent”.
4. **Rentals** — “Order rentals” button → link to Ocean Tent (URL; later API if needed).
5. **Reminders** — Already have tasks; add “Add reminder” that creates a task with due date; show overdue clearly on Event Overview.
6. **BEO complete → automations** — “Fire Event” (or equivalent) validates required fields, locks event, triggers automations; departments see event and complete BEO.

---

## 7. Quick Reference: Routes and Entry Points

- **Start a booking:** Dashboard → Add Event (New Event modal) or Invoice Intake (upload).
- **Track a booking:** Intake/FOH → Events pipeline → click event → **Event Overview** (`/event/:id`).
- **Fill BEO:** Event Overview → “Open Full Intake” → BEO Intake (`/beo-intake/:id`).
- **Print / production:** BEO Intake → Send to BOH; then Kitchen/Flair/Delivery/Ops see the event and printed BEO.

This keeps the **entire booking process** in one mental model: Event Overview = status and next actions; BEO Intake = where the actual BEO is filled; automations run when the booking is finalized.
