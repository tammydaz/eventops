<!-- Purpose: Tracks the current development phase, completed features, work in progress, and next steps. -->

# Build State

## Current Development Phase

EventOps is in active development with a mature BEO intake and print workflow. Core event management, intake, and operational dashboards are functional. Several features have placeholder field IDs or mock data pending Airtable schema updates.

## Completed Features

- **Dashboard** — Main dashboard with Live / Upcoming / Completed / Archive; role-based navigation
- **BEO Intake** — Full intake at `/beo-intake/:eventId` (EventCore, Menu, Venue, Client, Contact, Bar, Timeline, Logistics, Dietary, Serviceware, Beverages, etc.)
- **BEO Print** — Client BEO (`/beo-print/:eventId`) with 3 views: Kitchen, Spec, Pack-Out
- **Kitchen BEO Print** — `/kitchen-beo-print/:eventId`
- **Quick Intake** — Create event → redirect to BEO Full Intake
- **Invoice Intake** — Import invoice → create event
- **Spec Engine** — Spec algorithm, data fetch from Events + linked tables
- **Watchtower** — Command center; filter by week, event cards
- **Auth** — Login, password set/clear; role-based access
- **Feedback/Issues** — Feedback submission
- **Ops Chief Dashboard** — `/ops-chief`
- **Kitchen Prep** — `/kitchen-prep`
- **Delivery Command** — `/delivery-command`
- **Returned Equipment** — `/returned-equipment` (uses mock data)
- **Post-Event Debrief** — `/post-event-debrief`
- **Site Visit** — `/site-visit`
- **FOH Landing** — `/foh`

## Work in Progress / TODOs

### Placeholder Airtable Field IDs

These fields need real IDs created in Airtable and added to `FIELD_IDS` in `events.ts`:

| Constant | Placeholder | Notes |
|----------|-------------|-------|
| `CUSTOM_DELIVERY_DELI` | `fldCustomDeliTODO` | Create Long Text in Airtable |
| `CUSTOM_ROOM_TEMP_DISPLAY` | `fldCustomRoomTempTODO` | Create Long Text in Airtable |
| `COFFEE_MUG_TYPE` | `fldCoffeeMugTypeTODO` | Single Select: Standard / Premium / Irish |
| `CARAFES_PER_TABLE` | `fldCarafesPerTableTODO` | Number field for China |
| `SPEC_READY` | — | Add to FIELD_IDS (BeoIntakeActionBar) |
| `Spec_Tier_0_40` | `Spec_Tier_0_40` | specEngine/airtableFields.ts — add fldXXX when available |

### Component TODOs

- **EventSummaryCard** — FOH/BOH health fields: derive from Airtable when available; placeholder: default green
- **HealthLightModal** — Update correct field or open relevant section (match Matt's system)
- **ReturnedEquipmentPage** — Replace mock data with real Airtable integration
- **Watchtower** — Email integration

### Deprecated

- `src/components/intake/` — Old intake system; DEPRECATED. Use `/beo-intake/:eventId` only.

## Next Steps

1. Create missing Airtable fields and replace placeholder IDs in `FIELD_IDS`
2. Add `SPEC_READY` field ID to `events.ts` and wire in BeoIntakeActionBar
3. Implement FOH/BOH health fields for EventSummaryCard
4. Replace ReturnedEquipmentPage mock data with Airtable
5. Add Watchtower email integration
