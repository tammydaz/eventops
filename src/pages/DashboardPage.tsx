import { useState, useEffect, useMemo, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./DashboardPage.css";
import type { ViewMode, HealthStatus } from "../components/dashboard/EventCard";
import { useEventStore } from "../state/eventStore";
import { useAuthStore } from "../state/authStore";
import { canAccessRoute, ROLE_DEPARTMENTS } from "../lib/auth";
import { getProductionColor, shouldBlink, shouldBlinkForDepartment, PRODUCTION_COLORS, type DepartmentKey } from "../lib/productionHelpers";
import type { QuestionTargetDepartment } from "../state/questionStore";
import type { EventListItem } from "../services/airtable/events";
import { AcceptTransferModal } from "../components/AcceptTransferModal";
import { AskFOHPopover } from "../components/AskFOHPopover";

/* ═══════════════════════════════════════════
   EVENT DATA (from Airtable)
   ═══════════════════════════════════════════ */
interface EventData {
  id: string;
  eventDate?: string;
  name: string;
  time: string;
  client: string;
  venue: string;
  guests: number;
  category: string;
  eventType: string;
  serviceStyle: string;
  healthFOH: HealthStatus;
  healthBOH: HealthStatus;
  guestCountConfirmed?: boolean;
  menuAcceptedByKitchen?: boolean;
  productionAccepted?: boolean;
  productionAcceptedFlair?: boolean;
  productionAcceptedDelivery?: boolean;
  productionAcceptedOpsChief?: boolean;
  isDemo?: boolean;
}

/* ── Demo events for 10-Day Pipeline (fill when sparse) ── */
const DEMO_TEMPLATES: Array<Omit<EventData, "eventDate" | "time" | "id"> & { dayOffset: number }> = [
  { dayOffset: 0, name: "Smith Wedding – Riverside Manor", client: "Smith Family", venue: "Riverside Manor", guests: 180, category: "Wedding", eventType: "Full Service", serviceStyle: "Plated", healthFOH: "green", healthBOH: "green", isDemo: true },
  { dayOffset: 0, name: "TechCorp Q1 Summit – Convention Center", client: "TechCorp", venue: "Convention Center", guests: 320, category: "Corporate", eventType: "Full Service", serviceStyle: "Buffet", healthFOH: "green", healthBOH: "green", isDemo: true },
  { dayOffset: 1, name: "Holloway Anniversary – The Grand Ballroom", client: "Holloway Family", venue: "The Grand Ballroom", guests: 120, category: "Celebration", eventType: "Full Service", serviceStyle: "Plated", healthFOH: "green", healthBOH: "green", isDemo: true },
  { dayOffset: 2, name: "Green Acres Box Lunch – Barn Venue", client: "Green Acres Org", venue: "Barn Venue", guests: 85, category: "Corporate", eventType: "Delivery", serviceStyle: "Drop-off", healthFOH: "green", healthBOH: "green", isDemo: true, guestCountConfirmed: true, menuAcceptedByKitchen: true, productionAcceptedDelivery: true },
  { dayOffset: 3, name: "Rivera Quinceañera – La Fiesta Hall", client: "Rivera Family", venue: "La Fiesta Hall", guests: 200, category: "Celebration", eventType: "Full Service", serviceStyle: "Buffet", healthFOH: "green", healthBOH: "green", isDemo: true },
  { dayOffset: 4, name: "Office Luncheon – Downtown Tower", client: "Downtown Corp", venue: "Downtown Tower", guests: 55, category: "Corporate", eventType: "Delivery", serviceStyle: "Drop-off", healthFOH: "green", healthBOH: "green", isDemo: true, guestCountConfirmed: true, menuAcceptedByKitchen: true, productionAcceptedDelivery: false },
  { dayOffset: 5, name: "Apex Digital Awards – Hotel Grand", client: "Apex Digital", venue: "Hotel Grand", guests: 250, category: "Corporate", eventType: "Full Service", serviceStyle: "Plated", healthFOH: "green", healthBOH: "green", isDemo: true },
  { dayOffset: 6, name: "Johnson Birthday – Private Residence", client: "Johnson Family", venue: "Private Residence", guests: 45, category: "Birthday", eventType: "Delivery", serviceStyle: "Drop-off", healthFOH: "green", healthBOH: "green", isDemo: true, guestCountConfirmed: true, menuAcceptedByKitchen: true, productionAcceptedDelivery: false },
  { dayOffset: 7, name: "Spring Gala Fundraiser – Museum of Art", client: "Museum Foundation", venue: "Museum of Art", guests: 400, category: "Fundraiser", eventType: "Full Service", serviceStyle: "Stations", healthFOH: "green", healthBOH: "green", isDemo: true },
  { dayOffset: 9, name: "Williams Rehearsal Dinner – Vineyard Estate", client: "Williams Family", venue: "Vineyard Estate", guests: 60, category: "Wedding", eventType: "Full Service", serviceStyle: "Plated", healthFOH: "green", healthBOH: "green", isDemo: true },
];

const MIN_EVENTS_TO_FILL = 6;

function formatEventDate(d?: string): string {
  if (!d) return "—";
  try {
    const [y, m, day] = d.split("-").map(Number);
    const date = new Date(y, m - 1, day);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${days[date.getDay()]} ${months[date.getMonth()]} ${day}`;
  } catch {
    return d;
  }
}

function listItemToEventData(e: EventListItem): EventData {
  const parts = (e.eventName ?? "").split(/\s*[–—-]\s*/);
  const client = parts[0]?.trim() || "—";
  const venue = parts[1]?.trim() || "—";
  return {
    id: e.id,
    eventDate: e.eventDate,
    name: e.eventName ?? "Untitled",
    time: formatEventDate(e.eventDate),
    client,
    venue,
    guests: e.guestCount ?? 0,
    category: e.eventType ?? e.eventOccasion ?? "—",
    eventType: e.eventType ?? "—",
    serviceStyle: e.serviceStyle ?? "—",
    healthFOH: "green",
    healthBOH: "green",
    guestCountConfirmed: e.guestCountConfirmed,
    menuAcceptedByKitchen: e.menuAcceptedByKitchen,
    productionAccepted: e.productionAccepted,
    productionAcceptedFlair: e.productionAcceptedFlair,
    productionAcceptedDelivery: e.productionAcceptedDelivery,
    productionAcceptedOpsChief: e.productionAcceptedOpsChief,
  };
}

function getDemoEventsForPipeline(today: string, endDate: string, excludeIds: Set<string>): EventData[] {
  const start = new Date(today);
  return DEMO_TEMPLATES
    .filter((_, i) => !excludeIds.has(`demo_${i + 1}`))
    .map((t, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + t.dayOffset);
      const eventDate = d.toISOString().slice(0, 10);
      if (eventDate > endDate) return null;
      return {
        id: `demo_${i + 1}`,
        eventDate,
        name: t.name,
        time: formatEventDate(eventDate),
        client: t.client,
        venue: t.venue,
        guests: t.guests,
        category: t.category,
        eventType: t.eventType,
        serviceStyle: t.serviceStyle,
        healthFOH: t.healthFOH,
        healthBOH: t.healthBOH,
        isDemo: true,
        guestCountConfirmed: t.guestCountConfirmed,
        menuAcceptedByKitchen: t.menuAcceptedByKitchen,
        productionAccepted: t.productionAccepted,
        productionAcceptedFlair: t.productionAcceptedFlair,
        productionAcceptedDelivery: t.productionAcceptedDelivery,
        productionAcceptedOpsChief: t.productionAcceptedOpsChief,
      } as EventData;
    })
    .filter((e): e is EventData => e !== null);
}

/* ── Health color map ── */
const HEALTH = {
  green:  { bg: "#22c55e", glow: "rgba(34,197,94,0.6)",  label: "Healthy" },
  yellow: { bg: "#eab308", glow: "rgba(234,179,8,0.6)",  label: "Watch" },
  red:    { bg: "#ef4444", glow: "rgba(239,68,68,0.6)",  label: "At Risk" },
} as const;

/* ── Category pill colors ── */
const CAT_COLORS: Record<string, string> = {
  Wedding: "#d99b66", Corporate: "#4dd0e1", Social: "#c084fc",
  Tasting: "#f87171", Celebration: "#fbbf24", Fundraiser: "#4ade80",
};

/* ── Sidebar nav items ── */
type NavItem = { label: string; href: string; expandable?: boolean; subtitle?: string };
const NAV: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Add Event", href: "/quick-intake" },
  { label: "Open Event", href: "/beo-intake" },
  { label: "Departments", href: "#departments", expandable: true },
  { label: "Watchtower", href: "/watchtower", subtitle: "Papa Chulo Watchtower" },
  { label: "Ops Chief", href: "/ops-chief" },
  { label: "Admin", href: "/admin" },
  { label: "Development Hub", href: "/feedback-issues" },
];

/* ── Department sub-items (inside Departments expandable) ── */
const DEPT_ITEMS = [
  { id: "kitchen",   label: "Kitchen",                href: "/kitchen" },
  { id: "logistics", label: "Delivery & Operations Hub", href: "/delivery-command" },
  { id: "intake",    label: "Central Command Center", href: "/quick-intake" },
  { id: "intake_foh", label: "Intake/FOH",            href: "/intake-foh" },
  { id: "flair",     label: "Flair/Equipment",       href: "/flair" },
  { id: "feedback",  label: "Suggestions / Questions / Bugs", href: "/feedback-issues" },
];

/* ═══════════════════════════════════════════
   MAIN DASHBOARD PAGE
   ═══════════════════════════════════════════ */
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { events: rawEvents, loadEvents, selectEvent, setFields, eventsLoading, eventsError } = useEventStore();
  const role = user?.role ?? "ops_admin";
  const allowedDepts = ROLE_DEPARTMENTS[role] ?? [];
  const visibleDeptItems = DEPT_ITEMS.filter((d) => role === "ops_admin" || allowedDepts.includes(d.id) || d.id === "feedback");
  const visibleNav = NAV.filter((item) => item.href.startsWith("#") || canAccessRoute(role, item.href));
  const [departmentsOpen, setDepartmentsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("10-Day Pipeline");
  const viewMode: ViewMode = "owner";
  const [sortBy, setSortBy] = useState<"date" | "client" | "venue" | "eventType" | "serviceStyle">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [eventView, setEventView] = useState<"grid" | "list" | "calendar">("grid");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [taglineSettled, setTaglineSettled] = useState(false);
  const [pendingAcceptEvent, setPendingAcceptEvent] = useState<EventData | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setTaglineSettled(true), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchQuery.trim() && searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchQuery]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const eventDataList = useMemo(() => rawEvents.map(listItemToEventData), [rawEvents]);
  const today = todayStr();
  const endDate10 = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 10);
    return d.toISOString().slice(0, 10);
  }, [today]);
  const filteredEvents = useMemo(() => {
    if (activeTab === "Today's Events") return eventDataList.filter((e) => e.eventDate === today);
    if (activeTab === "10-Day Pipeline") {
      const real = eventDataList.filter((e) => {
        const d = e.eventDate ?? "";
        return d >= today && d <= endDate10;
      });
      const realIds = new Set(real.map((e) => e.id));
      const demos = getDemoEventsForPipeline(today, endDate10, realIds);
      const combined = [...real, ...demos].sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""));
      if (combined.length >= MIN_EVENTS_TO_FILL) return combined;
      const usedIds = new Set(combined.map((e) => e.id));
      const extra = getDemoEventsForPipeline(today, endDate10, usedIds).slice(0, MIN_EVENTS_TO_FILL - combined.length);
      return [...combined, ...extra].sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""));
    }
    if (activeTab === "Upcoming Events") return eventDataList.filter((e) => (e.eventDate ?? "") >= today);
    if (activeTab === "Completed" || activeTab === "Archive") return eventDataList.filter((e) => (e.eventDate ?? "") < today);
    return eventDataList;
  }, [eventDataList, activeTab, today, endDate10]);

  const events = useMemo(() => {
    const arr = [...filteredEvents];
    const mult = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") cmp = (a.eventDate ?? "").localeCompare(b.eventDate ?? "");
      else if (sortBy === "client") cmp = a.client.localeCompare(b.client);
      else if (sortBy === "venue") cmp = a.venue.localeCompare(b.venue);
      else if (sortBy === "eventType") cmp = a.eventType.localeCompare(b.eventType);
      else if (sortBy === "serviceStyle") cmp = a.serviceStyle.localeCompare(b.serviceStyle);
      return mult * cmp;
    });
    return arr;
  }, [filteredEvents, sortBy, sortDir]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return eventDataList.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.client.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [eventDataList, searchQuery]);

  const dashboardDept: DepartmentKey | null = role === "kitchen" ? "kitchen" : role === "flair" ? "flair" : role === "logistics" ? "delivery" : null;
  const viewingDepartment: QuestionTargetDepartment | null = dashboardDept ?? (role === "intake" || role === "foh" ? "intake_foh" : null);
  const handleSelectEvent = (evt: EventData) => {
    if (evt.isDemo) return;
    const blink = dashboardDept ? shouldBlinkForDepartment(evt, dashboardDept) : shouldBlink(evt);
    if (blink) {
      setPendingAcceptEvent(evt);
      return;
    }
    selectEvent(evt.id);
    setSearchQuery("");
    navigate("/beo-intake");
  };

  const handleAcceptTransfer = async (initials: string) => {
    if (!pendingAcceptEvent) return;
    const { getLockoutFieldIds } = await import("../services/airtable/events");
    const ids = await getLockoutFieldIds();
    if (ids) {
      const userRole = user?.role ?? "ops_admin";
      const fieldId = userRole === "kitchen" ? ids.productionAccepted
        : userRole === "flair" ? ids.productionAcceptedFlair
        : userRole === "logistics" ? ids.productionAcceptedDelivery
        : ids.productionAccepted; // ops_admin defaults to kitchen
      if (fieldId) {
        await setFields(pendingAcceptEvent.id, { [fieldId]: true });
        await loadEvents();
      }
    }
    selectEvent(pendingAcceptEvent.id);
    setSearchQuery("");
    setPendingAcceptEvent(null);
    const userRole = user?.role ?? "ops_admin";
    if (userRole === "kitchen") {
      navigate(`/beo-print/${pendingAcceptEvent.id}`);
    } else if (userRole === "flair") {
      navigate(`/beo-print/${pendingAcceptEvent.id}`);
    } else {
      navigate("/beo-intake");
    }
  };

  return (
    <div className="dp-container">
      <AcceptTransferModal
        open={!!pendingAcceptEvent}
        onClose={() => setPendingAcceptEvent(null)}
        eventName={pendingAcceptEvent?.name ?? ""}
        onAccept={handleAcceptTransfer}
      />
      {/* ═══ SIDEBAR ═══ */}
      <aside className="dp-sidebar">
        <div className="dp-logo-section">
          <div className="dp-logo-diamond">
            <span className="dp-logo-letter">W</span>
          </div>
          <div>
            <div className="dp-logo-title dp-logo-werx">Werx</div>
            <div className="dp-logo-subtitle">The engine behind the excellence!!</div>
          </div>
        </div>

        <ul className="dp-nav">
          {visibleNav.map((item) => (
            <li key={item.label}>
              {item.expandable ? (
                <>
                  <button
                    type="button"
                    className={`dp-nav-link dp-nav-expandable ${departmentsOpen ? "open" : ""}`}
                    onClick={() => setDepartmentsOpen(!departmentsOpen)}
                  >
                    <span className="dp-nav-dot" />
                    {item.label}
                    <span className="dp-nav-chevron">{departmentsOpen ? "▾" : "▸"}</span>
                  </button>
                  {departmentsOpen && (
                    <ul className="dp-nav-sub">
                      {visibleDeptItems.map((dept) => (
                        <li key={dept.id}>
                          <Link
                            to={dept.href}
                            className="dp-nav-sub-link"
                          >
                            {dept.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.href}
                  className={({ isActive }) => `dp-nav-link ${isActive ? "active" : ""}`}
                >
                  <span className="dp-nav-dot" />
                  {item.label}
                  {item.subtitle && <span className="dp-nav-subtitle">{item.subtitle}</span>}
                </NavLink>
              )}
            </li>
          ))}
        </ul>

        {user && (
          <div className="dp-user-section">
            <span className="dp-user-role">{user.name}</span>
            <button type="button" onClick={() => { logout(); window.location.href = "/login"; }} className="dp-signout">
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* ═══ MOBILE NAV DRAWER (visible only on small screens) ═══ */}
      <div className={`dp-mobile-nav-overlay ${mobileNavOpen ? "open" : ""}`} onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
      <aside className={`dp-mobile-nav-drawer ${mobileNavOpen ? "open" : ""}`}>
        <div className="dp-mobile-nav-header">
          <div className="dp-logo-section">
            <div className="dp-logo-diamond"><span className="dp-logo-letter">W</span></div>
            <div><div className="dp-logo-title dp-logo-werx">Werx</div><div className="dp-logo-subtitle">The engine behind the excellence!!</div></div>
          </div>
          <button type="button" className="dp-mobile-nav-close" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">✕</button>
        </div>
        <ul className="dp-nav">
          {visibleNav.map((item) => (
            <li key={item.label}>
              {item.expandable ? (
                <>
                  <button
                    type="button"
                    className={`dp-nav-link dp-nav-expandable ${departmentsOpen ? "open" : ""}`}
                    onClick={() => setDepartmentsOpen(!departmentsOpen)}
                  >
                    <span className="dp-nav-dot" />
                    {item.label}
                    <span className="dp-nav-chevron">{departmentsOpen ? "▾" : "▸"}</span>
                  </button>
                  {departmentsOpen && (
                    <ul className="dp-nav-sub">
                      {visibleDeptItems.map((dept) => (
                        <li key={dept.id}>
                          <Link to={dept.href} className="dp-nav-sub-link" onClick={() => setMobileNavOpen(false)}>
                            {dept.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <NavLink to={item.href} className={({ isActive }) => `dp-nav-link ${isActive ? "active" : ""}`} onClick={() => setMobileNavOpen(false)}>
                  <span className="dp-nav-dot" />
                  {item.label}
                  {item.subtitle && <span className="dp-nav-subtitle">{item.subtitle}</span>}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
        {user && (
          <div className="dp-user-section">
            <span className="dp-user-role">{user.name}</span>
            <button type="button" onClick={() => { logout(); window.location.href = "/login"; }} className="dp-signout">Sign out</button>
          </div>
        )}
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <main className="dp-main">
        {/* ── Header ── */}
        <header className="dp-header">
          <div className="dp-header-top">
            <span className="dp-header-copyright">System Designed & Engineered by © Tammy Daddazio — All Rights Reserved</span>
          </div>
          <div className="dp-header-main">
          <div className="dp-header-left">
          <button type="button" className="dp-mobile-hamburger" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>
          <div className="dp-search-wrap" ref={searchWrapRef}>
            <input
              className="dp-search"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery.trim().length > 0 && (
              <div className="dp-search-dropdown">
                {searchResults.length === 0 ? (
                  <div className="dp-search-item dp-search-empty">No events match</div>
                ) : (
                  searchResults.slice(0, 8).map((evt) => (
                    <button
                      key={evt.id}
                      type="button"
                      className="dp-search-item"
                      onMouseDown={(e) => { e.preventDefault(); handleSelectEvent(evt); }}
                    >
                      <span className="dp-search-item-name">{evt.name}</span>
                      <span className="dp-search-item-meta">{evt.time} · {evt.guests} guests</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          </div>
          <div className="dp-header-title dp-werx-brand">
            <span className="dp-werx-logo">Werx</span>
            <span className={`dp-werx-tagline ${taglineSettled ? "dp-werx-tagline-settled" : ""}`}>The engine behind the excellence!!</span>
          </div>
          <div className="dp-header-spacer" aria-hidden="true" />
          </div>
        </header>

        {/* ── Filter + Sort (left) + View options (right) ── */}
        <div className="dp-tabs-toolbar">
          <div className="dp-tabs-left">
            <div className="dp-toolbar-sort">
              <label htmlFor="dp-view-select" className="dp-toolbar-label">View</label>
              <select
                id="dp-view-select"
                className="dp-toolbar-select"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
              >
                <option value="Today's Events">Today's Events</option>
                <option value="10-Day Pipeline">10 Day View</option>
                <option value="Upcoming Events">Upcoming Events</option>
                <option value="Completed">Completed</option>
                <option value="Archive">Archive</option>
              </select>
            </div>
            <div className="dp-toolbar-sort">
              <label htmlFor="dp-sort-select" className="dp-toolbar-label">Sort by</label>
              <select
                id="dp-sort-select"
                className="dp-toolbar-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="date">Date</option>
                <option value="client">Client</option>
                <option value="venue">Venue</option>
                <option value="eventType">Event Type</option>
                <option value="serviceStyle">Service Style</option>
              </select>
              <button
                type="button"
                className="dp-toolbar-sort-dir"
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                title={sortDir === "asc" ? "Ascending (click for descending)" : "Descending (click for ascending)"}
              >
                {sortDir === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
          <div className="dp-tabs-right">
            <div className="dp-toolbar-view">
              <span className="dp-toolbar-view-label">View</span>
              <button
                type="button"
                className={`dp-toolbar-view-btn ${eventView === "grid" ? "active" : ""}`}
                onClick={() => setEventView("grid")}
                title="Grid view"
                aria-pressed={eventView === "grid"}
              >
                ⊞ Grid
              </button>
              <button
                type="button"
                className={`dp-toolbar-view-btn ${eventView === "list" ? "active" : ""}`}
                onClick={() => setEventView("list")}
                title="List view"
                aria-pressed={eventView === "list"}
              >
                ☰ List
              </button>
              <button
                type="button"
                className={`dp-toolbar-view-btn ${eventView === "calendar" ? "active" : ""}`}
                onClick={() => setEventView("calendar")}
                title="Calendar view"
                aria-pressed={eventView === "calendar"}
              >
                📅 Calendar
              </button>
            </div>
            <div className="dp-tab-stats">
              <span className="dp-stat-count">{events.length} events</span>
              <span className="dp-stat-guests">{events.reduce((s, e) => s + e.guests, 0).toLocaleString()} guests</span>
            </div>
          </div>
        </div>

        {/* ── Events Grid / List / Calendar ── */}
        <div className="dp-events-area">
          {eventsError && (
            <div className="dp-events-error">
              <span>{eventsError}</span>
              <button type="button" className="dp-events-retry" onClick={() => loadEvents()}>
                Retry
              </button>
            </div>
          )}
          {eventsLoading && (
            <div className="dp-events-loading">Loading events…</div>
          )}
          {!eventsLoading && !eventsError && (
            eventView === "grid" ? (
              <div className="dp-events-grid">
                {events.length === 0 ? (
                  <div className="dp-events-empty">
                    <p>No events in &quot;{activeTab}&quot;</p>
                    <p className="dp-events-empty-hint">
                      {activeTab === "Today's Events" && "Try the 10-Day Pipeline or Upcoming Events, or add an event."}
                      {(activeTab === "10-Day Pipeline" || activeTab === "Upcoming Events") && "Add an event via Quick Intake or Upload Invoice."}
                      {(activeTab === "Completed" || activeTab === "Archive") && "Past events will appear here."}
                    </p>
                  </div>
                ) : (
                  events.map((evt) => (
                    <PremiumCard key={evt.id} event={evt} viewMode={viewMode} departmentKey={dashboardDept} viewingDepartment={viewingDepartment} onSelect={evt.isDemo ? undefined : () => handleSelectEvent(evt)} />
                  ))
                )}
              </div>
            ) : eventView === "calendar" ? (
              (() => {
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const firstDay = new Date(calendarYear, calendarMonth, 1);
                const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
                const startOffset = firstDay.getDay();
                const daysInMonth = lastDay.getDate();
                const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
                const cells: { day: number | null; dateStr: string | null }[] = [];
                for (let i = 0; i < startOffset; i++) cells.push({ day: null, dateStr: null });
                for (let d = 1; d <= daysInMonth; d++) {
                  const m = String(calendarMonth + 1).padStart(2, "0");
                  const day = String(d).padStart(2, "0");
                  cells.push({ day: d, dateStr: `${calendarYear}-${m}-${day}` });
                }
                while (cells.length < totalCells) cells.push({ day: null, dateStr: null });
                const eventsInMonth = events.filter((e) => {
                  const d = e.eventDate ?? "";
                  return d.startsWith(`${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}`);
                });
                const byDate = eventsInMonth.reduce<Record<string, EventData[]>>((acc, evt) => {
                  const d = evt.eventDate ?? "";
                  if (!acc[d]) acc[d] = [];
                  acc[d].push(evt);
                  return acc;
                }, {});
                const goPrev = () => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear((y) => y - 1);
                  } else setCalendarMonth((m) => m - 1);
                };
                const goNext = () => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear((y) => y + 1);
                  } else setCalendarMonth((m) => m + 1);
                };
                return (
                  <div className="dp-events-calendar">
                    <div className="dp-calendar-header">
                      <button type="button" className="dp-calendar-nav" onClick={goPrev} aria-label="Previous month">
                        ‹
                      </button>
                      <h2 className="dp-calendar-title">{monthNames[calendarMonth]} {calendarYear}</h2>
                      <button type="button" className="dp-calendar-nav" onClick={goNext} aria-label="Next month">
                        ›
                      </button>
                    </div>
                    <div className="dp-calendar-month">
                      <div className="dp-calendar-weekdays">
                        {dayNames.map((d) => (
                          <div key={d} className="dp-calendar-weekday">{d}</div>
                        ))}
                      </div>
                      <div className="dp-calendar-days">
                        {cells.map((cell, i) => (
                          <div key={i} className={`dp-calendar-cell ${cell.day === null ? "empty" : ""}`}>
                                {cell.day !== null && (
                              <>
                                <div className="dp-calendar-day-num">{cell.day}</div>
                                {cell.dateStr && byDate[cell.dateStr] && (
                                  <div className="dp-calendar-day-events">
                                    {byDate[cell.dateStr].map((evt) => {
                                      const prodColor = getProductionColor(evt);
                                      const canSelect = !evt.isDemo;
                                      return (
                                        <div
                                          key={evt.id}
                                          className={`dp-calendar-event ${!evt.isDemo && (dashboardDept ? shouldBlinkForDepartment(evt, dashboardDept) : shouldBlink(evt)) ? "dp-calendar-event-blink" : ""} ${evt.isDemo ? "dp-calendar-event-demo" : ""}`}
                                          data-production={prodColor}
                                          role={canSelect ? "button" : undefined}
                                          tabIndex={canSelect ? 0 : undefined}
                                          onClick={() => canSelect && handleSelectEvent(evt)}
                                          onKeyDown={(e) => canSelect && (e.key === "Enter" || e.key === " ") && handleSelectEvent(evt)}
                                        >
                                          {evt.name}
                                          {evt.isDemo && <span className="dp-calendar-event-demo-badge">Demo</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="dp-events-list">
                {events.length === 0 ? (
                  <div className="dp-events-empty">
                    <p>No events in &quot;{activeTab}&quot;</p>
                    <p className="dp-events-empty-hint">
                      {activeTab === "Today's Events" && "Try the 10-Day Pipeline or Upcoming Events, or add an event."}
                      {(activeTab === "10-Day Pipeline" || activeTab === "Upcoming Events") && "Add an event via Quick Intake or Upload Invoice."}
                      {(activeTab === "Completed" || activeTab === "Archive") && "Past events will appear here."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="dp-list-header">
                      <div className="dp-list-col dp-list-col-date">Date</div>
                      <div className="dp-list-col dp-list-col-name">Event</div>
                      <div className="dp-list-col dp-list-col-client">Client</div>
                      <div className="dp-list-col dp-list-col-venue">Venue</div>
                      <div className="dp-list-col dp-list-col-guests">Guests</div>
                      <div className="dp-list-col dp-list-col-category">Category</div>
                    </div>
                        {events.map((evt) => {
                      const prodColor = getProductionColor(evt);
                      const colorHex = PRODUCTION_COLORS[prodColor];
                      const canSelect = !evt.isDemo;
                      return (
                        <div
                          key={evt.id}
                          className={`dp-list-row ${canSelect && (dashboardDept ? shouldBlinkForDepartment(evt, dashboardDept) : shouldBlink(evt)) ? "dp-list-row-blink" : ""} ${evt.isDemo ? "dp-list-row-demo" : ""}`}
                          data-production={prodColor}
                          role={canSelect ? "button" : undefined}
                          tabIndex={canSelect ? 0 : undefined}
                          onClick={() => canSelect && handleSelectEvent(evt)}
                          onKeyDown={(e) => canSelect && (e.key === "Enter" || e.key === " ") && handleSelectEvent(evt)}
                        >
                          <div className="dp-list-col dp-list-col-date">{evt.time}</div>
                          <div className="dp-list-col dp-list-col-name">{evt.name}</div>
                          <div className="dp-list-col dp-list-col-client">{evt.client}</div>
                          <div className="dp-list-col dp-list-col-venue">{evt.venue}</div>
                          <div className="dp-list-col dp-list-col-guests">{evt.guests}</div>
                          <div className="dp-list-col dp-list-col-category">
                            <span
                              className="dp-list-pill"
                              style={{
                                color: colorHex,
                                backgroundColor: `${colorHex}18`,
                                borderColor: `${colorHex}40`,
                              }}
                            >
                              {evt.category}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PREMIUM EVENT CARD (INLINE)
   ═══════════════════════════════════════════ */
function PremiumCard({ event, viewMode, onSelect, departmentKey, viewingDepartment }: { event: EventData; viewMode: ViewMode; onSelect?: () => void; departmentKey?: DepartmentKey | null; viewingDepartment?: QuestionTargetDepartment | null }) {
  const prodColor = getProductionColor(event);
  const blinking = !event.isDemo && (departmentKey ? shouldBlinkForDepartment(event, departmentKey) : shouldBlink(event));

  return (
    <AskFOHPopover eventId={event.id} eventName={event.name} viewingDepartment={viewingDepartment ?? null} disabled={event.isDemo}>
      <article
        className={`dp-card dp-card-production dp-card-${prodColor} ${blinking ? "dp-card-blink" : ""} ${onSelect ? "dp-card-clickable" : ""} ${event.isDemo ? "dp-card-demo" : ""}`}
        data-production={prodColor}
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={onSelect}
        onKeyDown={(e) => onSelect && (e.key === "Enter" || e.key === " ") && onSelect()}
      >
        {/* Top neon line */}
        <div className="dp-card-neon-top" />

        {/* Client + Event name */}
        <div className="dp-card-header dp-card-header-tight">
          <div className="dp-card-client">{event.client}</div>
          <div className="dp-card-name">{event.name}</div>
        </div>

        {/* Health Lights */}
        <div className="dp-card-health">
          {(viewMode === "owner" || viewMode === "foh") && (
            <HealthLight status={event.healthFOH} label={viewMode === "owner" ? "FOH" : HEALTH[event.healthFOH].label} />
          )}
          {(viewMode === "owner" || viewMode === "boh") && (
            <HealthLight status={event.healthBOH} label={viewMode === "owner" ? "BOH" : HEALTH[event.healthBOH].label} />
          )}
        </div>
      </article>
    </AskFOHPopover>
  );
}

/* ── Animated health dot ── */
function HealthLight({ status, label }: { status: HealthStatus; label: string }) {
  const c = HEALTH[status];
  return (
    <div className="dp-health-dot-wrap">
      <span className="dp-health-dot-ping" style={{ backgroundColor: c.bg }} />
      <span className="dp-health-dot" style={{ backgroundColor: c.bg, boxShadow: `0 0 8px ${c.glow}` }} />
      <span className="dp-health-label">{label}</span>
    </div>
  );
}
