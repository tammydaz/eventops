# FoodWerx EventOps — Custom UI Description for Airtable Workspace

This document describes the custom React UI that sits on top of the FoodWerx EventOps Airtable base. It is intended for UI/UX audit, comparison to the underlying Airtable schema, and alignment with industry best practices.

---

## 1. Overview

- **Stack**: React (Vite), React Router, Zustand (eventStore, authStore, pickerStore, beoPrintStore, etc.), Tailwind-style utilities + custom CSS.
- **Data**: Primary data lives in Airtable. The app uses a **server proxy** (`/api/airtable/proxy`, `/api/airtable/meta`) so API keys stay server-side. Table/field IDs are configured via env: `VITE_AIRTABLE_BASE_ID`, `VITE_AIRTABLE_EVENTS_TABLE`, and optional tables for Leads, Tasks, Menu Items, Stations, etc.
- **Auth**: Role-based access (ops_admin, kitchen, logistics, intake, flair, foh). Routes and department visibility are gated by `lib/auth.ts` (`canAccessRoute`, `ROLE_ROUTES`, `ROLE_DEPARTMENTS`).

---

## 2. Navigation Structure and User Flows

### 2.1 Top-Level Routes

| Path | Page | Purpose |
|------|------|--------|
| `/`, `/home` | DashboardPage | Main dashboard: 10-day pipeline, today, upcoming, completed; grid/list/calendar; event cards with production state |
| `/event/new` | EventOverviewPage (new-event flow) | Create minimal event (name, phone, event type, optional date) then redirect to overview or BEO intake |
| `/event/:id` | EventOverviewPage | Event overview: summary, steps, “during the call,” post-call actions, documents, tasks, notes |
| `/lead/:id` | FOHLeadOverview | Lead detail (FOH) |
| `/beo-intake`, `/beo-intake/:eventId` | BeoIntakePage | Full BEO intake form: header, event core, venue, menu, bar, serviceware, timeline, notes; jump nav; send to BOH |
| `/beo-print/:eventId` | BeoPrintPage | Full BEO packet: Kitchen BEO, Meeting BEO Notes, Full BEO Packet, Buffet Menu Signs, Server BEO 2nd page; left checklist; print-optimized |
| `/kitchen-beo-print/:eventId` | KitchenBEOPrintPage | Kitchen-focused BEO (condensed header, sections for hot/deli/paper/timeline) |
| `/quick-intake` | Redirect | Redirects to `/event/new` |
| `/intake-foh` | IntakeFOHLandingPage | Intake/FOH hub: pipeline (events) or “Add Event” / “Open BEO Intake” / “Leads” |
| `/foh/leads` | LeadsLandingPage (via IntakeFOHLandingPage) | FOH leads pipeline |
| `/foh/leads/new` | LeadIntakePage | New lead intake |
| `/foh` | FOHLandingPage | FOH landing |
| `/kitchen` | KitchenLandingPage | Kitchen landing |
| `/kitchen-prep` | KitchenPrepPage | Kitchen prep (DepartmentLayout) |
| `/flair` | FlairLandingPage | Flair landing |
| `/returned-equipment` | ReturnedEquipmentPage | Flair/equipment returned (DepartmentLayout) |
| `/delivery-command` | DeliveryLandingPage | Delivery landing |
| `/delivery-command/dispatch` | DeliveryCommandPage | Dispatch (DepartmentLayout) |
| `/ops-chief` | OpsChiefLandingPage | Ops Chief landing |
| `/ops-chief/alerts` | OpsChiefDashboard | Alerts dashboard (DepartmentLayout) |
| `/watchtower` | Watchtower | Papa Chulo Watchtower |
| `/post-event-debrief` | PostEventDebriefPage | Post-event debrief |
| `/feedback-issues` | FeedbackIssuesPage | Dev/feedback hub |
| `/admin` | AdminPage | Admin |
| `/invoice-intake` | InvoiceIntakePage | Invoice intake (lazy) |
| `/site-visit` | SiteVisitPage | Site visit |
| `/seed-demo` | SeedDemoEventPage | Seed demo event |
| `/print-test` | PrintTestPage | Print test |
| `/early-event-sections` | EarlyEventSections | Early event sections |

### 2.2 Shell and Event Selector

- **App.tsx**: For most routes (dashboard, BEO intake, BEO print, etc.) the app shows an **AuthGuard** and **Router**. For BEO Intake, the global **header with EventSelector** is hidden; elsewhere a header shows “Back to Dashboard” and **EventSelector** (dropdown to search/select event; selection updates URL to `/beo-intake/:id` and store).
- **EventSelector** (and **EventSelectorSimple**): Data from `useEventStore().events` (list from Airtable). Filtering: client-side by search string (event name). Max 50 items rendered for performance. Two variants: default (grey), `beo-header` (red accent, portal dropdown).

### 2.3 Role-Based Landing and Access

- **ROLE_LANDING**: ops_admin → `/`, kitchen → `/kitchen`, logistics → `/delivery-command`, intake → `/`, flair → `/flair`, foh → `/intake-foh`.
- **ROLE_ROUTES**: Each role has an allowlist of path prefixes (e.g. kitchen: `/`, `/home`, `/beo-intake`, `/quick-intake`, `/invoice-intake`, `/kitchen-prep`, `/kitchen-beo-print`, `/kitchen`, `/print-test`, `/feedback-issues`). ops_admin has `*`.
- **Department circles**: Dashboard and department landings show department circles (home/DepartmentCircles); visibility by `ROLE_DEPARTMENTS`.

### 2.4 Key User Flows

1. **Create event**: Dashboard “Add Event” or Intake/FOH “Add Event” → NewEventModal (first/last name, phone, event type) or EventOverviewPage NewEventForm (name, phone, event type, optional date) → creates record in Events table → navigate to BEO intake or event overview.
2. **BEO intake**: Select event from dashboard or EventSelector → BeoIntakePage with sections (Header, Event Details, Venue, Menu, Beverage Services, Serviceware, Timeline, Notes). Save on blur; “Send to BOH” after required fields; optional “Submit Change Request.” Unsaved changes trigger UnsavedChangesModal on leave/switch.
3. **Department view**: Kitchen/Flair/Delivery/Intake-FOH land on department page → EventsPipeline (same view logic as dashboard: view tabs, sort, grid/list/calendar). Clicking an event can open AcceptTransferModal (accept transfer / confirm change) then navigate to Kitchen BEO or Full BEO Print or BEO Intake depending on role.
4. **Print**: From dashboard or department, open event → BeoPrintPage or KitchenBEOPrintPage; choose top tab (Kitchen BEO, Meeting BEO Notes, Full BEO Packet, etc.); use left checklist (beoPrintStore); print via browser.

---

## 3. UI Components

### 3.1 Menus and Navigation

- **Dashboard sidebar** (DashboardPage): Logo “Werx”, nav list (Dashboard, Add Event, Open Event, Departments expandable, Watchtower, Ops Chief, Admin, Development Hub). Departments expand to Kitchen, Delivery & Operations Hub, Central Command Center, Intake/FOH, Flair/Equipment, Suggestions/Questions/Bugs. Role-filtered.
- **DepartmentLayout**: Wraps department pages with title and nav items (e.g. Delivery: Delivery Home, Dispatch, Kitchen BEO; Kitchen: Kitchen Home, Kitchen Prep; Flair: Flair Home, Returned Equipment, Full BEO Packet; Ops Chief: Ops Chief Home, Alerts Dashboard; Intake/FOH: Add Event, Event Overview, Open BEO Intake, Leads).
- **BeoJumpToNav**: Floating “Jump to section” for BEO Intake; sections: Event details/Header, Event Details, Menu, Beverage Services, Plates/Serviceware, Timeline, Notes/Logistics. Scroll-spy and keyboard (Ctrl+J, Escape).
- **Mobile**: Dashboard has mobile hamburger, overlay, and drawer with same nav; resize to desktop closes drawer.

### 3.2 Pickers and Modals

- **MenuPickerModal**: Opens from menu sections (passed/presented/buffet metal/buffet china/desserts/deli/displays/beverage/bar). Uses `usePickerStore` (isOpen, pickerType, pickerTitle). Fetches items via `fetchMenuItemsByCategory(pickerType)` from Menu Items table (filterByFormula from CATEGORY_MAP). Search filter client-side; “prefer most descriptive” grouping by base name; onAdd writes to event field via TARGET_FIELD_TO_FIELD_ID (e.g. passedApps → PASSED_APPETIZERS).
- **NewEventModal**: First/Last name, Phone, Event type (from Airtable single-select options or FALLBACK_EVENT_TYPES). Creates event via createEvent(FIELD_IDS…).
- **ConfirmSendToBOHModal**, **SubmitChangeRequestModal**, **MissingFieldsModal**, **UnsavedChangesModal**, **AcceptTransferModal**, **ReopenLockedModal**, **ConfirmLockModal**: Contextual confirmations and lock/transfer flows.
- **BeoPreviewModal**, **HealthLightModal**: BEO preview and health light detail.
- **LeadOverviewModal**, **FollowUpModal**: Lead and follow-up flows.
- **StationComponentsConfigModal**, **SandwichPlatterConfigModal**, **BoxedLunchConfigModal**, **HydrationStationModal**: Section-specific config modals (stations, platters, boxed lunch, hydration). Station Components and Passed Appetizers behavior are **locked** per .cursor rules.

### 3.3 Tables and Lists

- **EventsPipeline**: Same data and filtering as Dashboard (events from store, view tabs, sort by date/client/venue/eventType/serviceStyle, asc/desc, grid/list/calendar). Used on Intake-FOH, Kitchen, Flair, Delivery landings. Can show “Today’s Events,” “10-Day Pipeline,” “Upcoming,” “Completed,” “Archive.” 10-Day can inject demo events to fill minimum cards.
- **Dashboard event grid/list/calendar**: Event cards (PremiumCard) with client, name, health lights (FOH/BOH), production color, blink state, “BEO Updated — Acceptance Required.” List view: columns Date, Event, Client, Venue, Guests, Category. Calendar: month navigation, events per day.
- **LeadsLandingPage**: Lead cards/list from Leads table (or demo data); status, follow-up, proposal status.
- **Task lists**: EventOverviewPage and pipeline areas load tasks via `loadTasksForEvent`, `sortOutstandingTasks`; update/create via tasks API.

### 3.4 Forms and Sections (BEO Intake)

All sections use `selectedEventData` and `setFields` from eventStore; field IDs from `FIELD_IDS` in `services/airtable/events.ts`.

- **HeaderSection**: Client (Individual/Business), Primary Contact, Venue (same as client or custom), Event Date, Guests, Dispatch/Start/End/FW Arrival, Staff summary (Captain, Servers, Chef, etc.). Maps to FIELD_IDS: CLIENT_*, PRIMARY_CONTACT_*, VENUE_*, EVENT_DATE, GUEST_COUNT, DISPATCH_TIME, EVENT_START_TIME, EVENT_END_TIME, FOODWERX_ARRIVAL, CAPTAIN, SERVERS, etc.
- **EventCoreSection**: Event Type, Occasion, Service Style; delivery: Food Must Go Hot, Delivery Notes. FIELD_IDS: EVENT_TYPE, EVENT_OCCASION, SERVICE_STYLE, FOOD_MUST_GO_HOT, etc.
- **ClientAndContactSection** / **VenueDetailsSection**: Client and venue address details.
- **MenuAndBeveragesSection** / **MenuSection**: Passed Appetizers, Presented Appetizers, Buffet Metal/China, Desserts, Stations, Deli, Room Temp Display, Displays. Each lane: linked record field + optional custom long-text field; add via MenuPickerModal (category from CATEGORY_MAP). Passed Appetizers logic is **locked**.
- **BeverageServicesSection**, **BarServiceSection**: Bar service (single select), signature drink, mixers/garnishes (multi-select or linked Bar Components), hydration, coffee/tea. FIELD_IDS: BAR_SERVICE, BAR_SIGNATURE_*, BAR_MIXERS, BAR_GARNISHES, HYDRATION_*, COFFEE_*.
- **KitchenAndServicewareSection**, **ServicewareSection**: Serviceware source, plates/cutlery/glassware lists, rentals. FIELD_IDS: SERVICE_WARE_*, RENTALS_*, PLATES_LIST, CUTLERY_LIST, GLASSWARE_LIST, etc.
- **TimelineSection**: Timeline notes, dispatch/start/end times (often in Header).
- **SiteVisitLogisticsSection**, **LogisticsSection**, **DietaryNotesSection**, **DesignerNotesSection**: Parking, load-in, venue notes, dietary, ops exceptions, etc. FIELD_IDS: PARKING_*, LOAD_IN_*, VENUE_*, DIETARY_*, OPS_EXCEPTIONS_*.
- **ApprovalsLockoutSection**: Lockout/approval state (guest count confirmed, menu accepted, production accepted by dept, change requested/confirmed).
- **FormSection**: Shared wrapper (label, helper, input styles, MUTED_COLOR, etc.).

### 3.5 Dashboards

- **DashboardPage**: Main home: sidebar, header (search, Werx branding), View dropdown (Today’s Events, 10-Day Pipeline, Upcoming Events, Completed, Archive), Sort by (date, client, venue, eventType, serviceStyle) + direction, View toggles (Grid, List, Calendar), event count/guest sum. Production colors and blink from productionHelpers (getProductionColor, shouldBlink, shouldBlinkForDepartment, isProductionFrozen, needsChangeConfirmation).
- **OpsChiefDashboard**: Alerts dashboard (department layout).
- **EventOverviewPage**: Sections Summary, Steps, During the Call (links to BEO intake with ?section=menu|bar|serviceware|timeline|notes), Post-Call Actions, Documents, Tasks, Notes. Color-coded blocks (SECTION_COLORS).

### 3.6 Print Views

- **BeoPrintPage**: Top tabs: Kitchen BEO, Meeting BEO Notes, Full BEO Packet, Buffet Menu Signs, Server BEO 2nd Page. Left column: checklist (beoPrintStore leftCheckMode). Content: header block (venue, client, contact, date, guests, times, staff), then section blocks. **Full-service section config**: PASSED APPETIZERS, PRESENTED APPETIZERS, DELI, BUFFET METAL, BUFFET CHINA, DESSERTS, STATIONS (each with fieldId, linkedFieldId, customFieldId). **Delivery section config**: HOT-DISPOSABLE (BUFFET_METAL + PASSED_APPETIZERS + PRESENTED_APPETIZERS), DELI-DISPOSABLE (DELIVERY_DELI), KITCHEN-DISPOSABLE (BUFFET_CHINA). Sections use FIELD_IDS for linked + custom text; parseMenuItems + filterHidden; parent/child rows from Menu Items + Child Items. Bar: full bar package constants, signature cocktail, mixers/garnishes. Print CSS: @media print, color-adjust exact, page breaks.
- **KitchenBEOPrintPage**: Condensed Kitchen BEO: client, contact, address, times, guest count, sections (hot/deli/paper products/beverages/timeline/notes), same Events + Menu Items + Boxed Lunch + Stations data. Delivery vs full-service branch for section set.

### 3.7 Other Components

- **EventSelector** / **EventSelectorSimple**: Event dropdown (see 2.2).
- **DepartmentCircles** (home): Department circles with links.
- **FeedbackHubPanel**, **FeedbackCircle**, **FeedbackProvider**: Feedback/issues UI.
- **InvoiceUpload** (foh): Invoice intake.
- **DispatchMap** (delivery): Dispatch map.
- **SpecBlock**, **SpecLine** (beo): Spec engine display.
- **EventCard** (dashboard): Card with health and production state; used in pipeline.
- **AskFOHPopover**: FOH question popover on event cards.

---

## 4. Data Sources and Field Mapping

### 4.1 Airtable Tables (Env-Constrained)

| Logical name | Env / default | Usage |
|-------------|----------------|--------|
| Events | VITE_AIRTABLE_EVENTS_TABLE | All event CRUD, list, BEO intake, print |
| Menu Items | VITE_AIRTABLE_MENU_ITEMS_TABLE / tbl0aN33DGG6R1sPZ | Menu picker, spec resolution, print lines |
| Master Menu Specs | VITE_AIRTABLE_MASTER_MENU_SPECS_TABLE / tblGeCmzJscnocs1T | Spec engine |
| Stations | VITE_AIRTABLE_STATIONS_TABLE / "Stations" | Station builder, print |
| Leads | VITE_AIRTABLE_LEADS_TABLE | FOH leads pipeline (optional; demo if unset) |
| Tasks | VITE_AIRTABLE_TASKS_TABLE | Event tasks (optional; demo if unset) |
| Boxed Lunch Orders | tbldRHfhjCY4x2Hyy (hardcoded) | Boxed lunch orders per event |
| Boxed Lunch Order Items | tblbkSAnNpUkjWtsa | |
| Box Customizations | tblAulNkoIFgNhJxw | |
| Staff | tblOkDtiCmyfiBGxa | Linked from events |
| Rentals | tblD34B6aycmrJC3B | |
| Rental Items | tbljC4fD9RyTVQ216 | |
| Service Ware | tblQ6zrEDOGXKFso9 | |

### 4.2 Events Table — Field ID Mapping (Summary)

All writable fields are in `FIELD_IDS` in `services/airtable/events.ts`. **Golden rule**: never write to formula/“Print” fields; only to source fields.

- **Event core**: EVENT_NAME (formula, read-only), EVENT_DATE, EVENT_TYPE, EVENT_OCCASION, SERVICE_STYLE, GUEST_COUNT, STATUS.
- **Venue**: VENUE, VENUE_ADDRESS, VENUE_CITY, VENUE_STATE, VENUE_ZIP, VENUE_FULL_ADDRESS; VenuePrint/PRINT_* are formula.
- **Client**: CLIENT (linked), CLIENT_FIRST_NAME, CLIENT_LAST_NAME, CLIENT_BUSINESS_NAME (formula), BUSINESS_NAME, CLIENT_EMAIL, CLIENT_PHONE, CLIENT_STREET, CLIENT_CITY, CLIENT_STATE, CLIENT_ZIP.
- **Primary contact**: PRIMARY_CONTACT_NAME, PRIMARY_CONTACT_PHONE, PRIMARY_CONTACT_ROLE.
- **Menu lanes**: PASSED_APPETIZERS, CUSTOM_PASSED_APP, PRESENTED_APPETIZERS, CUSTOM_PRESENTED_APP, BUFFET_METAL, CUSTOM_BUFFET_METAL, BUFFET_CHINA, CUSTOM_BUFFET_CHINA, DESSERTS, CUSTOM_DESSERTS, STATIONS, DISPLAYS, ROOM_TEMP_DISPLAY, BEVERAGES, DELIVERY_HOT, DELIVERY_DELI, FULL_SERVICE_DELI, CUSTOM_*, BOXED_LUNCH_ORDERS, MENU_ITEMS, MENU_ITEM_SPECS.
- **Bar**: BAR_SERVICE (single select), BAR_SIGNATURE_DRINK_*, BAR_MIXERS, BAR_GARNISHES, BAR_MIXER_ITEMS, BAR_GARNISH_ITEMS (linked Bar Components).
- **Hydration**: HYDRATION_STATION_*, HYDRATION_JSON (read-only), INFUSED_WATER, DISPENSER_COUNT.
- **Coffee/Ice**: COFFEE_SERVICE_NEEDED, ICE_PROVIDED_BY (shared with SERVICE_WARE_SOURCE in some bases).
- **Staff**: STAFF, CAPTAIN, SERVERS, UTILITY, STATION_CREW, CHEF, BARTENDERS, DISPLAY_DESIGN, DINING_CREW.
- **Dietary/notes**: DIETARY_NOTES, SPECIAL_NOTES, OPS_EXCEPTIONS_SPECIAL_HANDLING.
- **Site visit / logistics**: PARKING_*, LOAD_IN_*, VENUE_*, KITCHEN_ACCESS_*, POWER_*, TIMELINE_*, EQUIPMENT_*, STAIRS_*, ELEVATORS_*, etc.
- **Serviceware**: SERVICE_WARE, RENTALS, RENTAL_ITEMS, PLATES_LIST, CUTLERY_LIST, GLASSWARE_LIST, SERVICEWARE_*, CHINA_PAPER_GLASSWARE, SERVICE_WARE_SOURCE, BBS, LARGE_PLATES, SALAD_PLATES, PAPER_TYPE.
- **Timeline**: DISPATCH_TIME, EVENT_START_TIME, EVENT_END_TIME, FOODWERX_ARRIVAL (resolved by name), VENUE_ARRIVAL_TIME, TIMELINE.
- **Kitchen**: KITCHEN_ON_SITE, FOOD_MUST_GO_HOT, NO_KITCHEN_RESOLUTION.
- **Booking**: BOOKING_STATUS, PAYMENT_*, CONTRACT_*, INVOICE_*.
- **Lockout/production**: Resolved by name (Guest Count Confirmed, Menu Accepted by Kitchen, Production Accepted, Production Accepted Flair/Delivery/Ops Chief, etc.; BOH: beoSentToBOH, productionColor, kitchenBlink, flairBlink, deliveryBlink, opsChiefBlink, productionFrozen, changeConfirmedByBOH).
- **Spec/print**: SPEC_DEFAULT (read-only), SPEC_OVERRIDE, THEME_COLOR_SCHEME, MENU_PRINT_THEME, EVENT_DOCUMENTS, BEO_NOTES, BEO_TIMELINE, ALLERGIES_PRINT, DIETARY_SUMMARY, etc.

Event list API returns records; front-end normalizes to `EventListItem` (eventName, eventDate, eventType, serviceStyle, guestCount, dispatchTimeSeconds, lockout/production flags, productionColor, blink flags). `filterToEditableOnly` can restrict list by role.

### 4.3 Menu Items Table

- **Table**: getMenuItemsTable() (default tbl0aN33DGG6R1sPZ).
- **Picker**: fetchMenuItemsByCategory(categoryKey) uses CATEGORY_MAP to build OR(FIND("Passed App", {Category}), …). Fields: Description Name/Formula (fldQ83gpgOmMxNMQw), Child Items (fldIu6qmlUwAEn2W9). Results normalized to MenuItemRecord (id, name, childItems). Vessel type can be updated via updateMenuItemVesselType.

### 4.4 Leads Table

- **Fields (expected)**: Lead Name, Inquiry Date, Lead Status, Next Follow-Up Date, Contact Info, Follow-Up History, Proposal Status, Notes, FOH Notes. Field IDs resolved by name via Meta API when table is set. When unset or fetch fails, demo data is used.

### 4.5 Tasks Table

- **Fields**: Task Name, Event, Task Type, Due Date, Status, Notes, Created At, Updated At. Resolved by name. Demo data when table unset.

### 4.6 Boxed Lunch / Stations / Linked Records

- **Boxed Lunch**: loadBoxedLunchOrdersByEventId(eventId) from Boxed Lunch Orders table; linked to Events. getPlatterOrdersByEventId from platterOrdersStore.
- **Stations**: loadStationsByEventId(eventId), loadStationComponentNamesByIds; Stations table + Station Components.
- **Linked records**: linkedRecords.ts and stationComponents.ts for resolving names and loading by event.

---

## 5. Filtering, Sorting, and Grouping

### 5.1 Events (Dashboard and Pipeline)

- **View tabs**: “Today’s Events” (eventDate === today), “10-Day Pipeline” (eventDate in [today, today+10], with optional demo fill), “Upcoming Events” (eventDate >= today), “Completed” / “Archive” (eventDate < today).
- **Sort**: Client-side sort by date | client | venue | eventType | serviceStyle; direction asc | desc.
- **Search**: Header search filters event list by name, client, venue, category (deferred value); dropdown shows up to 8 matches; selection navigates and selects event.
- **Role**: filterToEditableOnly(events, role) can restrict list; department view uses same list with role-based navigation on click.

### 5.2 Menu Picker

- **Filter**: Airtable filterByFormula from CATEGORY_MAP (e.g. passed → Passed App, Presented App, Appetizer, etc.). Then client-side search by display label (name + child lines). Grouping: preferMostDescriptive groups by “base name” (before dash) and keeps longest label per group.

### 5.3 Leads

- **Filter/sort**: By lead status, follow-up date, proposal status (implementation in LeadsLandingPage / lead services). Demo mode when no table.

### 5.4 Tasks

- **Filter**: By event (loadTasksForEvent); sortOutstandingTasks for ordering. Status: Pending, Completed, Overdue, Due Today.

---

## 6. Custom Logic, Automations, and Conditional Rendering

### 6.1 Production and Lockout

- **getProductionColor**, **getProductionColorHex**: From productionHelpers; uses beoSentToBOH, productionAccepted*, changeRequested, changeConfirmedByBOH, productionFrozen to derive color (e.g. grey/yellow/green/red).
- **shouldBlink**, **shouldBlinkForDepartment**: Event “blinks” for a department until that department accepts (productionAccepted*).
- **needsChangeConfirmation**: Event shows “BEO Updated — Acceptance Required” when change requested and not all BOH confirmed.
- **isProductionFrozen**: When change requested and not yet confirmed; can block direct open and show AcceptTransferModal.
- **AcceptTransferModal**: Accept transfer (set production accepted or change confirmed) then navigate to department destination (kitchen → kitchen-beo-print, flair → beo-print, logistics → kitchen-beo-print, else beo-intake).

### 6.2 Send to BOH and Required Fields

- **REQUIRED_BEO_FIELDS**: Event Date, Guest Count, Venue, Client First/Last Name, Primary Contact Name, Event Type. Missing fields block Send to BOH and open MissingFieldsModal.
- **createTask**: Sending to BOH can create a task (e.g. “BEO sent”) via tasks API when Tasks table is configured.

### 6.3 Delivery vs Full Service

- **isDeliveryOrPickup(eventType)**: Event type Delivery or Pickup. Used to show/hide sections (e.g. delivery-specific lanes, Kitchen BEO sections), delivery section config on print (HOT-DISPOSABLE, DELI-DISPOSABLE, KITCHEN-DISPOSABLE), and KitchenBEOPrintPage layout.

### 6.4 Bar Service

- **Full bar package**: FULL_BAR_PACKAGE, getFullBarPackagePackoutItems, getSignatureCocktailGreeting, getNonStandardBarItems, parseBarItemTokens, isStandardBarItem. Print blocks use BAR_SERVICE_* and bar component linked fields. Bar Service field may be single-select; value sent as plain string (not { name }).

### 6.5 Time Fields

- **DISPATCH_TIME**, **EVENT_START_TIME**, **EVENT_END_TIME**: Stored as duration (seconds since midnight) in Airtable. secondsToTimeString, secondsTo12HourString for display. FOODWERX_ARRIVAL resolved by name via Meta API (getFoodwerxArrivalFieldId). ops_admin can edit dispatch time; other roles cannot (filtered in updateEvent).

### 6.6 Conditional Sections

- **HeaderSection**: Hides venue/date/guests/times when “delivery” and shows delivery-specific fields in EventCore.
- **Menu sections**: Passed Appetizers, Presented Appetizers, Buffet Metal/China, Desserts, Stations, Deli, Room Temp, Displays shown/hidden by event type and product choices. Hydration and Coffee/Tea sections conditional on bar/beverage choices.
- **Print**: Full-service vs delivery section configs; Station sections built from STATIONS linked records and station components.

### 6.7 Approvals Lockout

- **ApprovalsLockoutSection**: Shows lockout state (guest count confirmed, menu accepted, production accepted per dept, change requested/confirmed). Read from lockout/BOH field IDs resolved by name; writes via setFields when user confirms.

---

## 7. Styling, Branding, Accessibility

### 7.1 Branding

- **“Werx”**: Logo (diamond + “W”), tagline “The engine behind the excellence!!” on dashboard header and sidebar. dp-logo-werx, dp-werx-brand, dp-werx-tagline (tagline can settle after delay).
- **Colors**: Red accent (#ff3333, #ff6b6b) for primary actions and BEO header selector; teal (HEADER_ACCENT #0d9488) for key print header values; production colors (grey/yellow/green/red) for event state; section colors in Event Overview (summary red, steps blue, call orange, etc.). Category pills on list view use CAT_COLORS (Wedding, Corporate, Social, etc.).

### 7.2 CSS and Layout

- **Dashboard**: DashboardPage.css; dp-* classes (dp-container, dp-sidebar, dp-nav, dp-main, dp-header, dp-card, dp-events-grid, dp-list-*, dp-calendar-*, dp-health-dot-*). Print views use inline styles and a large printStyles string (Dancing Script for section headers, @media print, page-break rules).
- **BEO Intake**: IntakePage.css; FormSection provides inputStyle, labelStyle, helperStyle, MUTED_COLOR, LABEL_COLOR, ACCENT_LINK.
- **DepartmentLayout**: Wraps content with department nav and title.

### 7.3 Accessibility

- **Semantics**: Buttons and links for actions; nav with NavLink isActive; aria-label on mobile menu (“Open menu,” “Close menu”), calendar nav (“Previous month,” “Next month”).
- **Keyboard**: EventSelector and cards: tabIndex, Enter/Space to activate. BeoJumpToNav: Ctrl+J to toggle, Escape to close. NewEventModal: Escape to close.
- **Focus**: Picker modal gets autoFocus on search input when open. No systematic focus trap or focus restore documented in the explored files.
- **Screen readers**: Some aria-pressed on view toggles; production state and “BEO Updated” are visible but not always announced via live region.

---

## 8. Known Limitations and Schema Gaps

### 8.1 Formula and Read-Only Fields

- Any field ending in “Print” or used as formula in Airtable (e.g. VenuePrint, EventLocationPrint, ClientNamePrint, ContactPrint, EVENT_NAME, CLIENT_BUSINESS_NAME, SPEC_DEFAULT, BAR_SERVICE_PRINT_BLOCK) must not be written to. UI only writes to source fields. If the schema adds new formulas, the UI may not expose the underlying source fields.

### 8.2 Field IDs and Resolved-by-Name Fields

- Many field IDs are hardcoded in FIELD_IDS. Some (FoodWerx Arrival, Bar Service, Lockout, BOH production) are resolved at runtime via Airtable Meta API by **field name**. If Airtable renames those fields or changes types, the app may fail or fall back to a default ID (e.g. Bar Service fallback fldXm91QjyvVKbiyO). New fields in the base are not automatically reflected until code is updated.

### 8.3 Placeholder and TODO Field IDs

- Comments in events.ts reference placeholders (e.g. COFFEE_MUG_TYPE: "fldCoffeeMugTypeTODO", CARAFES_PER_TABLE: "fldCarafesPerTableTODO", CUSTOM_ROOM_TEMP_DISPLAY: "fldCustomRoomTempTODO", MENU_PRINT_THEME: "fldMenuPrintTheme"). These may not exist in the base or may need to be replaced with real IDs.

### 8.4 Tables Without Env

- Leads and Tasks: when VITE_AIRTABLE_LEADS_TABLE or VITE_AIRTABLE_TASKS_TABLE are unset, the app uses demo data. Some features (e.g. creating a “BEO sent” task) only work when the Tasks table is set.

### 8.5 Menu Categories

- CATEGORY_MAP and MENU_SECTIONS are the single source of truth for picker categories and section labels. If Airtable Category single-select options change, the map must be updated or some items may not appear in the picker.

### 8.6 Passed Appetizers and Station Components

- Per .cursor rules, Passed Appetizers and Station Components Config Modal are **locked**: no refactors to validation, BEO placement, or required counts. The UI may not reflect future Airtable schema changes in those areas without explicit overrides.

### 8.7 Print Section Config

- Full-service and delivery section configs in BeoPrintPage (and KitchenBEOPrintPage) are hardcoded (which Event fields map to which print section titles). Adding a new menu lane in Airtable requires code changes to appear on print.

### 8.8 Event Name

- EVENT_NAME is formula (read-only). The list and cards show “eventName” derived from that formula (often “Client – Venue”). There is no direct “Event Name” writable field in the list; naming is effectively client/venue driven.

### 8.9 Single Select Payload

- Bar Service and some other single-select fields are written as plain string (option name), not { name: "..." }, per base behavior. Other single-selects may use different payloads (SINGLE_SELECT_FIELD_IDS in events.ts).

### 8.10 Server Proxy and Env

- All Airtable access goes through the server proxy. If BASE_ID or EVENTS_TABLE is missing, the app shows errors. No client-side API key; token must be valid on server.

---

## 9. Code References (Key Files)

| Area | Files |
|------|--------|
| Routes | `src/router.tsx`, `src/App.tsx` |
| Auth / roles | `src/lib/auth.ts`, `src/state/authStore.tsx` |
| Event data | `src/state/eventStore.tsx`, `src/services/airtable/events.ts` |
| Field IDs / selectors | `src/services/airtable/events.ts` (FIELD_IDS), `src/services/airtable/selectors.ts` |
| Airtable client / tables | `src/services/airtable/client.ts`, `src/services/airtable/config.ts` |
| Dashboard | `src/pages/DashboardPage.tsx`, `src/pages/DashboardPage.css` |
| Pipeline | `src/components/EventsPipeline.tsx`, `src/components/EventsPipeline.css` |
| BEO Intake | `src/pages/BeoIntakePage.tsx`, `src/components/beo-intake/*` |
| BEO Print | `src/pages/BeoPrintPage.tsx`, `src/pages/KitchenBEOPrintPage.tsx` |
| Menu picker / categories | `src/components/MenuPickerModal.tsx`, `src/constants/menuCategories.ts`, `src/services/airtable/menuItems.ts` |
| Production / lockout | `src/lib/productionHelpers.ts`, lockout/BOH in `events.ts` |
| Leads / Tasks | `src/services/airtable/leads.ts`, `src/services/airtable/tasks.ts` |

---

## 10. Output Format

This document is structured Markdown for:

- **AI/UX audit**: Sections 2–3 (flows, components), 5 (filtering/sort), 7 (accessibility).
- **Schema comparison**: Sections 4 and 8 (tables, field mapping, limitations).
- **Best practices**: Section 7 (a11y), Section 6 (business rules and conditional logic).

Screenshots are not included; add them manually next to the relevant component or flow subsections. Code snippets can be pulled from the files listed in Section 9.
