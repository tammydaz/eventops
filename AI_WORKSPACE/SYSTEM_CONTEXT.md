<!-- Purpose: High-level overview of the EventOps system architecture, core tables, stack, and workflows. -->

# System Context

## Overview

EventOps is a FoodWerx event operations application for managing catering events, BEOs (Banquet Event Orders), intake workflows, and operational dashboards. The **Events table in Airtable is the central source of truth** — all event data flows through it.

## Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite 6 |
| **Routing** | react-router-dom 7 |
| **State** | Zustand 5 |
| **Data Store** | Airtable (primary backend) |
| **Hosting** | Vercel |
| **Serverless** | Vercel Node (auth, feedback APIs) |
| **PDF** | pdfjs-dist |
| **Spreadsheets** | xlsx |

## Project Structure

```
eventops/
├── src/
│   ├── pages/           # Route components (Dashboard, BEO Intake, Watchtower, etc.)
│   ├── components/      # UI components
│   │   ├── beo-intake/  # BEO intake sections (EventCore, Menu, Venue, Client, etc.)
│   │   ├── intake/      # DEPRECATED — do not use
│   │   └── foh/         # Front-of-house components
│   ├── services/        # Airtable, spec engine, pack-out, invoice parsing
│   │   ├── airtable/    # events.ts, client.ts, linkedRecords.ts, selectors.ts
│   │   └── specEngine/  # Spec algorithm, data fetch
│   ├── state/           # Zustand store (eventStore.tsx)
│   ├── api/             # Client-side API helpers
│   ├── constants/       # Stations, menu categories, UI constants
│   ├── lib/             # Auth, utilities, specs, menu helpers
│   └── utils/           # Helpers, time, invoice mapping, BEO auto-spec
├── api/                 # Vercel serverless functions
│   ├── auth/            # login, set-password, clear-password
│   └── feedback/        # Feedback/issues submission
├── scripts/             # Node scripts (schema, seed, import)
└── beo-intake-export/   # BEO intake documentation
```

## Core Airtable Tables

| Table | Env Variable | Default / ID |
|-------|--------------|--------------|
| **Events** | `VITE_AIRTABLE_EVENTS_TABLE` | `Events` (tblYfaWh67Ag4ydXq) |
| **Menu Items** | `VITE_AIRTABLE_MENU_ITEMS_TABLE` | `tbl0aN33DGG6R1sPZ` |
| **Stations** | `VITE_AIRTABLE_STATIONS_TABLE` | `Stations` |
| **Master Menu Specs** | `VITE_AIRTABLE_MASTER_MENU_SPECS_TABLE` | `tblGeCmzJscnocs1T` |

Additional linked tables: Client, Staff, Rentals, Service Ware, etc.

## Field IDs — Source of Truth

All field IDs live in `src/services/airtable/events.ts` → `FIELD_IDS` object. Never use raw field ID strings; always use `FIELD_IDS.CONSTANT_NAME`.

## Data Flow

1. **Events table** — Central store; all event data flows through it.
2. **Zustand** — `useEventStore` for events list, selected event, loading, updates.
3. **Airtable** — Client-side fetches via `airtableFetch` / `airtableMetaFetch` in `services/airtable/client.ts`.
4. **Service layer** — `events.ts` (CRUD, SAVE_WHITELIST, filterToEditableOnly), `linkedRecords.ts` (Menu Items, Stations, Staff, Rentals).

## Key Workflows

- **Dashboard** — `loadEvents()` → Live / Upcoming / Completed / Archive; role-based nav.
- **BEO Intake** — `/beo-intake/:eventId` → `loadEvent()` + `updateEventMultiple()` for sections.
- **BEO Print** — `/beo-print/:eventId` (3 views: Kitchen, Spec, Pack-Out).
- **Quick Intake** — Create event → redirect to BEO Full Intake.
- **Invoice Intake** — Import invoice → create event.
- **Spec Engine** — Event data + specs per event; reads from Events and linked tables.
- **Watchtower** — Filter by week, display event cards.

## Auth & Roles

Roles: `ops_admin`, `kitchen`, `logistics`, `intake`, `flair`, `foh`. Each role has allowed routes and a landing page. `AuthGuard` enforces access; `canAccessRoute()` checks permissions.

## Input Pattern (Mandatory)

- **Text inputs**: Local state + `onBlur` save. Never save on every keystroke (causes cursor jumping + Airtable spam).
- **Dropdowns, checkboxes, time pickers**: Save on `onChange`.
