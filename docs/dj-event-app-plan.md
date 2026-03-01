# Event & DJ Management App — Plan

## Executive Summary

A web application for an entertainment company to manage trivia nights, DJ performances, and private events. The app covers the full lifecycle: lead capture → booking → staffing → execution → payment → social promotion.

---

## 1. Tech Stack Recommendation

| Layer | Recommendation | Rationale |
|-------|----------------|-----------|
| **Frontend** | React + TypeScript + Vite | Fast, type-safe, familiar (matches eventops) |
| **Styling** | Tailwind CSS | Rapid UI development, consistent design |
| **State** | TanStack Query + Zustand | Server state + lightweight client state |
| **Backend** | Airtable (existing) or Supabase | Airtable if base exists; Supabase for more control |
| **Auth** | Clerk or Auth0 | Simple setup, team/role support |
| **Hosting** | Vercel | Easy deploys, serverless, good DX |

**Alternative:** If the company already uses Airtable for this base, build a React frontend that consumes the Airtable API. Migrate to Supabase/Postgres later if needed.

---

## 2. App Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Web Application                           │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard  │  Events  │  DJs  │  Payments  │  Leads  │  Social  │
│  (Home)    │  (Core)  │       │            │  (CRM)  │  (Queue) │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   API Layer       │
                    │   (REST/GraphQL)  │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌─────▼─────┐         ┌────▼────┐
   │ Airtable│          │  Supabase  │         │  Clerk  │
   │   API   │     OR   │ (Postgres) │         │  Auth   │
   └─────────┘          └────────────┘         └─────────┘
```

---

## 3. Module Breakdown

### 3.1 Dashboard (Home)

**Purpose:** At-a-glance view of the business.

| Widget | Data Source | Key Metrics |
|--------|-------------|-------------|
| Upcoming Events | Events | Next 7–14 days, by type |
| Revenue This Month | Payments | Collected vs. pending |
| Open Leads | Leads | Count by pipeline stage |
| DJ Assignments | Events + DJs | Who’s working when |
| Social Queue | Social Content | Posts pending, overdue |
| Venue Health | Recurring Events Terms | Alerts for renegotiation |

**Views:** Calendar preview, quick-add event, recent activity feed.

---

### 3.2 Events Module

**Purpose:** Central hub for all events.

**Features:**
- **List/Calendar View** — Toggle between list and calendar
- **Filters** — Type (Trivia, DJ, Private, Social), status, date range, DJ
- **Event Detail** — Full record with linked DJ, payments, social content, trivia rounds
- **Create/Edit** — Form with recurrence (weekly, bi-weekly, monthly)
- **Trivia-Specific** — Winner/runner-up, attendance, linked rounds
- **Status Workflow** — Planned → Upcoming → Completed → Paid

**Relationships surfaced:**
- Assigned DJ (with contact)
- Linked payments
- Social posts
- Trivia rounds (for trivia events)

---

### 3.3 DJs Module

**Purpose:** Staff roster and scheduling.

**Features:**
- **DJ Directory** — Searchable list with contact info
- **DJ Profile** — Contact, pay rate, payment method (Venmo, Zelle, Check)
- **Event History** — Past and upcoming assignments
- **Payment History** — What they’ve been paid
- **Availability** — Optional: simple availability calendar

**Quick Actions:** Assign to event, record payment, send message.

---

### 3.4 Payments Module

**Purpose:** Track money in and out.

**Features:**
- **Payment List** — Filter by date, event, DJ, status
- **Outstanding** — Pending deposits, unpaid DJs
- **Record Payment** — Amount, type, date, linked event/DJ
- **Check Photos** — Upload and attach to check records
- **Summary Views** — Revenue by month, by venue, by DJ

**Status:** Pending → Received → Deposited → DJ Paid.

---

### 3.5 Leads / Sales (CRM) Module

**Purpose:** Manage sales pipeline.

**Features:**
- **Pipeline View** — Kanban: New → Contacted → Quoted → Booked → Dead
- **Lead Card** — Venue, contact, type, source, notes
- **Convert to Event** — One-click to create event from booked lead
- **Filters** — Type (Weekly Trivia, One-Off DJ, Private Event), source (Referral, Social, Website)

**Fields:** Venue name, contact name/email/phone, lead type, source, status, notes, created/updated.

---

### 3.6 Social Content Module

**Purpose:** Plan and track social posts.

**Features:**
- **Content Queue** — List/calendar of posts
- **Post Editor** — Caption, photos, platform selection (FB, IG, Twitter, LinkedIn, Website)
- **Caption Templates** — Dropdown by type (Winners, Crowd, DJ Shoutout)
- **AI Caption** — Optional: generate from template + event context
- **Status** — Draft → Scheduled → Posted
- **Event Link** — Associate post with event

**Bulk Actions:** Schedule multiple, mark as posted.

---

### 3.7 Trivia Manager Module

**Purpose:** Question bank and round building.

**Features:**
- **Question Bank** — Browse/search by category, difficulty, round type
- **Add Question** — Text, answer, category, difficulty, round type
- **Round Builder** — Create round, drag-and-drop questions, set order
- **Assign to Event** — Link round(s) to trivia event
- **Usage Tracking** — When/where questions were used

**Categories:** General, Sports, Music, Movies, etc.  
**Round Types:** Warm-Up, Regular, Final.

---

### 3.8 Venue / Contract Health Module

**Purpose:** Monitor recurring venue relationships.

**Features:**
- **Contract List** — Venues with recurring terms
- **Contract Detail** — Dates, terms, review schedule
- **Turnout Trends** — Attendance over time
- **Recommended Actions** — Continue, Renegotiate, Consider Ending
- **Alerts** — Upcoming reviews, declining turnout

---

## 4. Data Model (Normalized)

If building on Postgres/Supabase instead of Airtable:

```sql
-- Core entities
events (id, name, type, venue_id, date, time, status, dj_id, recurrence, ...)
djs (id, name, email, phone, pay_rate, payment_method, ...)
venues (id, name, address, contact_name, ...)

-- Financial
payments (id, amount, type, date_received, event_id, dj_id, status, ...)

-- CRM
leads (id, venue_id, contact_name, type, source, status, ...)

-- Social
social_content (id, caption, platforms[], event_id, template_id, status, ...)
caption_templates (id, type, text, active)

-- Trivia
questions (id, text, answer, category, difficulty, round_type, ...)
rounds (id, event_id, name, order)
round_questions (round_id, question_id, order)

-- Contracts
recurring_terms (id, venue_id, event_id, start_date, end_date, review_schedule, ...)
```

---

## 5. User Roles (Suggested)

| Role | Access |
|------|--------|
| **Admin** | Full access, settings, user management |
| **Manager** | Events, DJs, payments, leads, social |
| **DJ** | Own assignments, own payment history (read-only) |
| **Staff** | Events (view), social queue (post) |

---

## 6. Implementation Phases

### Phase 1 — Foundation (Weeks 1–2)
- [ ] Project setup (Vite, React, TS, Tailwind)
- [ ] Auth (Clerk/Auth0)
- [ ] Data layer (Airtable client or Supabase)
- [ ] Routing and layout shell
- [ ] Dashboard skeleton with placeholder widgets

### Phase 2 — Core (Weeks 3–5)
- [ ] Events module (list, detail, create, edit)
- [ ] DJs module (list, profile, assign to event)
- [ ] Basic calendar view for events

### Phase 3 — Money & Sales (Weeks 6–7)
- [ ] Payments module (record, list, outstanding)
- [ ] Leads/CRM (pipeline, convert to event)

### Phase 4 — Marketing & Trivia (Weeks 8–10)
- [ ] Social Content (queue, templates, post editor)
- [ ] Trivia Question Bank
- [ ] Trivia Round Builder
- [ ] Link rounds to events

### Phase 5 — Polish (Weeks 11–12)
- [ ] Venue/Contract Health module
- [ ] Dashboard widgets with real data
- [ ] Mobile responsiveness
- [ ] Export/reporting (optional)

---

## 7. UI/UX Notes

- **Navigation:** Sidebar or top nav with modules; Dashboard as default
- **Mobile:** Prioritize Events, Payments, Leads for on-the-go use
- **Print:** BEO-style print views if needed (similar to eventops)
- **Dark Mode:** Optional, useful for evening events
- **Notifications:** Email or in-app for upcoming events, unpaid DJs, lead follow-ups

---

## 8. Open Questions

1. **Data source:** Start with Airtable (if base exists) or build on Supabase from day one?
2. **AI captions:** Integrate OpenAI/Claude for caption generation, or skip for v1?
3. **DJ portal:** Do DJs need a login to see their schedule, or is manager-only sufficient?
4. **Recurring events:** Auto-create future occurrences, or manual copy?
5. **Integrations:** Venmo/Zelle API for payment tracking, or manual entry only?

---

## 9. File Structure (Suggested)

```
dj-event-app/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── events/
│   │   ├── djs/
│   │   ├── payments/
│   │   ├── leads/
│   │   ├── social/
│   │   └── trivia/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   │   ├── api/          # or airtable/
│   │   └── auth/
│   ├── stores/
│   ├── types/
│   └── lib/
├── docs/
└── package.json
```

---

*Plan created for Event & DJ Management System. Adjust phases and scope based on team size and priorities.*
