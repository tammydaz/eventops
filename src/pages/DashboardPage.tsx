import { useState, useEffect, useMemo, useRef, useDeferredValue, useCallback } from "react";
import { Link, NavLink, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { DASHBOARD_CALENDAR_TO } from "../lib/dashboardRoutes";
import "./DashboardPage.css";
import type { ViewMode, HealthStatus } from "../components/dashboard/EventCard";
import { useEventStore } from "../state/eventStore";
import { useAuthStore } from "../state/authStore";
import { canAccessRoute, ROLE_DEPARTMENTS } from "../lib/auth";
import { getProductionColor, getProductionColorHex, getHealthBOH, shouldBlink, shouldBlinkForDepartment, needsChangeConfirmation, isProductionFrozen, PRODUCTION_COLORS, type DepartmentKey } from "../lib/productionHelpers";
import type { QuestionTargetDepartment } from "../state/questionStore";
import type { EventListItem } from "../services/airtable/events";
import { AcceptTransferModal } from "../components/AcceptTransferModal";
import { AskFOHPopover } from "../components/AskFOHPopover";
import { StaffingAttentionBadge } from "../components/StaffingAttentionBadge";
import { EventListByDay } from "../components/EventListByDay";
import { EventListDetailSidebar } from "../components/EventListDetailSidebar";
import { listPrimaryLabel } from "../lib/eventListRowMeta";
import { weekRangeMondaySunday } from "../lib/weekRange";

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
  guestCountChangeRequested?: boolean;
  menuChangeRequested?: boolean;
  beoSentToBOH?: boolean;
  productionColor?: string;
  kitchenBlink?: boolean;
  flairBlink?: boolean;
  deliveryBlink?: boolean;
  opsChiefBlink?: boolean;
  productionFrozen?: boolean;
  eventChangeRequested?: boolean;
  changeConfirmedByBOH?: boolean;
  isDemo?: boolean;
  staffingConfirmedInNowsta?: boolean;
  fwStaffSummaryPresent?: boolean;
  phone?: string;
  dispatchTimeSeconds?: number;
  beoFiredToBOH?: boolean;
  speckComplete?: boolean;
  beoNotes?: string;
  timelineRaw?: string;
  paymentStatus?: string;
  invoicePaid?: boolean;
}

/* ── Demo events for Week View (fill when sparse) ── */
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
  const healthBOH = getHealthBOH(e);
  const phone =
    [e.primaryContactPhone, e.clientPhone].map((x) => (x ?? "").trim()).find((p) => p.length > 0) ?? "";
  return {
    id: e.id,
    eventDate: e.eventDate,
    name: e.eventName ?? "Untitled",
    time: formatEventDate(e.eventDate),
    client,
    venue,
    phone,
    guests: e.guestCount ?? 0,
    category: e.eventType ?? e.eventOccasion ?? "—",
    eventType: e.eventType ?? "—",
    serviceStyle: e.serviceStyle ?? "—",
    healthFOH: "green",
    healthBOH,
    guestCountConfirmed: e.guestCountConfirmed,
    menuAcceptedByKitchen: e.menuAcceptedByKitchen,
    guestCountChangeRequested: e.guestCountChangeRequested,
    menuChangeRequested: e.menuChangeRequested,
    productionAccepted: e.productionAccepted,
    productionAcceptedFlair: e.productionAcceptedFlair,
    productionAcceptedDelivery: e.productionAcceptedDelivery,
    productionAcceptedOpsChief: e.productionAcceptedOpsChief,
    beoSentToBOH: e.beoSentToBOH,
    productionColor: e.productionColor,
    kitchenBlink: e.kitchenBlink,
    flairBlink: e.flairBlink,
    deliveryBlink: e.deliveryBlink,
    opsChiefBlink: e.opsChiefBlink,
    productionFrozen: e.productionFrozen,
    eventChangeRequested: e.eventChangeRequested,
    changeConfirmedByBOH: e.changeConfirmedByBOH,
    staffingConfirmedInNowsta: e.staffingConfirmedInNowsta,
    fwStaffSummaryPresent: e.fwStaffSummaryPresent,
    dispatchTimeSeconds: e.dispatchTimeSeconds,
    beoFiredToBOH: e.beoFiredToBOH,
    speckComplete: e.speckComplete,
    beoNotes: e.beoNotes,
    timelineRaw: e.timelineRaw,
    paymentStatus: e.paymentStatus,
    invoicePaid: e.invoicePaid,
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
        dispatchTimeSeconds: 18 * 3600 + i * 1800,
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
  { label: "Dashboard", href: DASHBOARD_CALENDAR_TO },
  { label: "Add Event", href: "/event/new" },
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
  { id: "intake",    label: "Central Command Center", href: "/event/new" },
  { id: "intake_foh", label: "Intake/FOH",            href: "/intake-foh" },
  { id: "flair",     label: "Flair/Equipment",       href: "/flair" },
  { id: "feedback",  label: "Suggestions / Questions / Bugs", href: "/feedback-issues" },
];

/* ═══════════════════════════════════════════
   MAIN DASHBOARD PAGE
   ═══════════════════════════════════════════ */
const todayStr = () => new Date().toISOString().slice(0, 10);

function userInitials(name: string | undefined): string {
  if (!name?.trim()) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuthStore();
  const { events: rawEvents, loadEvents, selectEvent, setFields, eventsLoading, eventsError } = useEventStore();
  const role = user?.role ?? "ops_admin";
  const isIntakeFOHRole = role === "intake" || role === "foh";
  const allowedDepts = ROLE_DEPARTMENTS[role] ?? [];
  const visibleDeptItems = DEPT_ITEMS.filter((d) => role === "ops_admin" || allowedDepts.includes(d.id) || d.id === "feedback");
  const visibleNav = NAV.filter((item) => item.href.startsWith("#") || canAccessRoute(role, item.href));
  const [departmentsOpen, setDepartmentsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Weekly");
  const viewMode: ViewMode = "owner";
  const [sortBy, setSortBy] = useState<"date" | "client" | "venue" | "eventType" | "serviceStyle">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [eventView, setEventView] = useState<"grid" | "list" | "calendar">(() => {
    if (typeof window === "undefined") return "calendar";
    const p = new URLSearchParams(window.location.search).get("eventView");
    if (p === "grid" || p === "list" || p === "calendar") return p;
    return "calendar";
  });
  const [barClientFilter, setBarClientFilter] = useState<string>("all");
  const [barVenueFilter, setBarVenueFilter] = useState<string>("all");
  const [barStatusFilter, setBarStatusFilter] = useState<"all" | "confirmed" | "setup">("all");
  const [newTaskMenuOpen, setNewTaskMenuOpen] = useState(false);
  const commandSearchInputRef = useRef<HTMLInputElement>(null);
  const newTaskWrapRef = useRef<HTMLDivElement>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pendingAcceptEvent, setPendingAcceptEvent] = useState<EventData | null>(null);
  const [listDetailEventId, setListDetailEventId] = useState<string | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchQuery.trim() && searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchQuery]);

  // Reset mobile nav overlay when viewport becomes desktop — prevents stuck haze
  useEffect(() => {
    const check = () => {
      if (window.innerWidth > 768) setMobileNavOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const ev = searchParams.get("eventView");
    if (ev === "grid" || ev === "list" || ev === "calendar") setEventView(ev);
  }, [searchParams]);

  useEffect(() => {
    if (!newTaskMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (newTaskWrapRef.current && !newTaskWrapRef.current.contains(e.target as Node)) setNewTaskMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [newTaskMenuOpen]);

  const setEventViewSync = useCallback((v: "grid" | "list" | "calendar") => {
    setEventView(v);
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set("eventView", v);
        return n;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const eventDataList = useMemo(() => rawEvents.map(listItemToEventData), [rawEvents]);
  const today = todayStr();
  const { monday: weekMonday, sunday: weekSunday } = useMemo(() => weekRangeMondaySunday(today), [today]);
  const filteredEvents = useMemo(() => {
    if (activeTab === "Today's Events") return eventDataList.filter((e) => e.eventDate === today);
    if (activeTab === "Weekly") {
      const real = eventDataList.filter((e) => {
        const d = e.eventDate ?? "";
        return d >= weekMonday && d <= weekSunday;
      });
      const realIds = new Set(real.map((e) => e.id));
      const demos = getDemoEventsForPipeline(weekMonday, weekSunday, realIds);
      const combined = [...real, ...demos].sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""));
      if (combined.length >= MIN_EVENTS_TO_FILL) return combined;
      const usedIds = new Set(combined.map((e) => e.id));
      const extra = getDemoEventsForPipeline(weekMonday, weekSunday, usedIds).slice(0, MIN_EVENTS_TO_FILL - combined.length);
      return [...combined, ...extra].sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""));
    }
    if (activeTab === "Upcoming Events") return eventDataList.filter((e) => (e.eventDate ?? "") >= today);
    if (activeTab === "Completed" || activeTab === "Archive") return eventDataList.filter((e) => (e.eventDate ?? "") < today);
    return eventDataList;
  }, [eventDataList, activeTab, today, weekMonday, weekSunday]);

  const clientOptions = useMemo(() => {
    const s = new Set<string>();
    eventDataList.forEach((e) => {
      if (e.client && e.client !== "—") s.add(e.client);
    });
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [eventDataList]);

  const venueOptions = useMemo(() => {
    const s = new Set<string>();
    eventDataList.forEach((e) => {
      if (e.venue && e.venue !== "—") s.add(e.venue);
    });
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [eventDataList]);

  const afterBarFilters = useMemo(() => {
    let arr = filteredEvents;
    if (barClientFilter !== "all") arr = arr.filter((e) => e.client === barClientFilter);
    if (barVenueFilter !== "all") arr = arr.filter((e) => e.venue === barVenueFilter);
    if (barStatusFilter === "confirmed") arr = arr.filter((e) => e.beoSentToBOH === true);
    if (barStatusFilter === "setup") arr = arr.filter((e) => e.beoSentToBOH !== true);
    return arr;
  }, [filteredEvents, barClientFilter, barVenueFilter, barStatusFilter]);

  const events = useMemo(() => {
    const arr = [...afterBarFilters];
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
  }, [afterBarFilters, sortBy, sortDir]);

  const listDetailEvent = useMemo(() => events.find((e) => e.id === listDetailEventId) ?? null, [events, listDetailEventId]);

  useEffect(() => {
    if (eventView !== "list") setListDetailEventId(null);
  }, [eventView]);

  const searchResults = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return eventDataList.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.client.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [eventDataList, deferredSearchQuery]);

  const dashboardDept: DepartmentKey | null = role === "kitchen" ? "kitchen" : role === "flair" ? "flair" : role === "logistics" ? "delivery" : null;
  const viewingDepartment: QuestionTargetDepartment | null = dashboardDept ?? (role === "intake" || role === "foh" ? "intake_foh" : null);
  const handleSelectEvent = (evt: EventData) => {
    if (evt.isDemo) return;
    const frozen = isProductionFrozen(evt);
    const blink = dashboardDept ? shouldBlinkForDepartment(evt, dashboardDept) : false;
    const needsConfirm = dashboardDept && needsChangeConfirmation(evt, dashboardDept);
    if (dashboardDept && (frozen || blink || needsConfirm)) {
      setPendingAcceptEvent(evt);
      return;
    }
    setSearchQuery("");
    if (role === "kitchen") {
      navigate(`/kitchen-beo-print/${evt.id}`);
    } else if (role === "flair") {
      navigate(`/beo-print/${evt.id}`);
    } else if (role === "delivery" || role === "logistics") {
      navigate(`/kitchen-beo-print/${evt.id}`);
    } else {
      navigate(`/beo-intake/${evt.id}`);
    }
    setTimeout(() => selectEvent(evt.id), 0);
  };

  const handleAcceptTransfer = async (initials: string) => {
    if (!pendingAcceptEvent) return;
    const eventId = pendingAcceptEvent.id;
    const frozen = isProductionFrozen(pendingAcceptEvent);
    if (frozen) {
      const { getBOHProductionFieldIds } = await import("../services/airtable/events");
      const bohIds = await getBOHProductionFieldIds();
      if (bohIds?.changeConfirmedByBOH) {
        await setFields(eventId, { [bohIds.changeConfirmedByBOH]: true });
        await loadEvents();
      }
    } else {
      const { getLockoutFieldIds } = await import("../services/airtable/events");
      const ids = await getLockoutFieldIds();
      if (ids) {
        const userRole = user?.role ?? "ops_admin";
        const fieldId = userRole === "kitchen" ? ids.productionAccepted
          : userRole === "flair" ? ids.productionAcceptedFlair
          : userRole === "logistics" ? ids.productionAcceptedDelivery
          : ids.productionAccepted;
        if (fieldId) {
          await setFields(eventId, { [fieldId]: true });
          await loadEvents();
        }
      }
    }
    selectEvent(eventId);
    setSearchQuery("");
    setPendingAcceptEvent(null);
    const userRole = user?.role ?? "ops_admin";
    if (userRole === "kitchen") {
      navigate(`/kitchen-beo-print/${eventId}`);
    } else if (userRole === "flair") {
      navigate(`/beo-print/${eventId}`);
    } else if (userRole === "delivery" || userRole === "logistics") {
      navigate(`/kitchen-beo-print/${eventId}`);
    } else {
      navigate("/beo-intake");
    }
  };

  const isHomePath = location.pathname === "/" || location.pathname.startsWith("/home");
  const dashboardNavActive = isHomePath;
  const isCommandNav = isHomePath && eventView !== "calendar";
  const isCalendarTopNav = isHomePath && eventView === "calendar";
  const isClientsNav = location.pathname.startsWith("/foh");
  const isTasksNav = location.pathname.startsWith("/watchtower");
  const isReportsNav = location.pathname.startsWith("/profit");

  return (
    <div className="dp-container dp-container-command">
      <AcceptTransferModal
        open={!!pendingAcceptEvent}
        onClose={() => setPendingAcceptEvent(null)}
        eventName={pendingAcceptEvent?.name ?? ""}
        onAccept={handleAcceptTransfer}
        isChangeConfirmation={!!pendingAcceptEvent && !!dashboardDept && (isProductionFrozen(pendingAcceptEvent) || needsChangeConfirmation(pendingAcceptEvent, dashboardDept))}
        isProductionFrozen={!!pendingAcceptEvent && isProductionFrozen(pendingAcceptEvent)}
      />
      {/* ═══ COMMAND TOP BARS (mockup) ═══ */}
      <div className="dp-command-top">
        <nav className="dp-command-nav-row dp-command-nav-primary" aria-label="Primary">
          <button type="button" className="dp-mobile-hamburger dp-command-hamburger" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>
          <div className="dp-command-brand">
            <span className="dp-command-werx">Werx</span>
            <span className="dp-command-tagline">The engine behind the excellence!</span>
          </div>
          <div className="dp-command-nav-center">
            <button
              type="button"
              className={`dp-command-nav-pill ${isCommandNav ? "active" : ""}`}
              onClick={() => {
                navigate("/?eventView=grid");
                setEventViewSync("grid");
              }}
            >
              Command View
            </button>
            <Link className={`dp-command-nav-text ${isClientsNav ? "active" : ""}`} to="/foh/leads">
              Clients
            </Link>
            <button
              type="button"
              className={`dp-command-nav-text ${isCalendarTopNav ? "active" : ""}`}
              onClick={() => {
                navigate(DASHBOARD_CALENDAR_TO);
                setEventViewSync("calendar");
              }}
            >
              Calendar
            </button>
            <Link className={`dp-command-nav-text ${isTasksNav ? "active" : ""}`} to="/watchtower">
              Tasks
            </Link>
            <Link className={`dp-command-nav-text ${isReportsNav ? "active" : ""}`} to="/profit/">
              Reports
            </Link>
          </div>
          <div className="dp-command-nav-utilities">
            <button
              type="button"
              className="dp-command-icon-btn"
              aria-label="Search"
              onClick={() => commandSearchInputRef.current?.focus()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" strokeLinecap="round" />
              </svg>
            </button>
            <button type="button" className="dp-command-icon-btn dp-command-bell-wrap" aria-label="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" />
              </svg>
              <span className="dp-command-bell-badge">3</span>
            </button>
            <Link className="dp-command-icon-btn" to="/admin" aria-label="Settings">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
              </svg>
            </Link>
            <div className="dp-command-avatar" aria-hidden title={user?.name ?? "User"}>
              {userInitials(user?.name)}
            </div>
          </div>
        </nav>
        <div className="dp-command-nav-divider" aria-hidden="true" />
        <div className="dp-command-nav-row dp-command-nav-filters">
          <div className="dp-command-filters-left">
            <div className="dp-search-wrap dp-command-search-wrap" ref={searchWrapRef}>
              <span className="dp-command-search-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3-3" strokeLinecap="round" />
                </svg>
              </span>
              <input
                ref={commandSearchInputRef}
                className="dp-search dp-command-search-input"
                placeholder="Search events, clients, venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
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
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectEvent(evt);
                        }}
                      >
                        <span className="dp-search-item-name">{listPrimaryLabel(evt.client)}</span>
                        <span className="dp-search-item-meta">
                          {evt.time} · {evt.guests} guests
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="dp-command-select-wrap">
              <span className="dp-command-select-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
                </svg>
              </span>
              <select
                className="dp-command-select"
                aria-label="Filter by client"
                value={barClientFilter}
                onChange={(e) => setBarClientFilter(e.target.value)}
              >
                <option value="all">All Clients</option>
                {clientOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="dp-command-select-wrap">
              <span className="dp-command-select-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18M3 9h18" />
                </svg>
              </span>
              <select className="dp-command-select" aria-label="Filter by venue" value={barVenueFilter} onChange={(e) => setBarVenueFilter(e.target.value)}>
                <option value="all">All Venues</option>
                {venueOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="dp-command-select-wrap dp-command-select-wrap--status">
              <span className="dp-command-select-icon dp-command-select-icon--teal" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M6 21v-1a6 6 0 0112 0v1" strokeLinecap="round" />
                </svg>
              </span>
              <select className="dp-command-select" aria-label="Filter by status" value={barStatusFilter} onChange={(e) => setBarStatusFilter(e.target.value as typeof barStatusFilter)}>
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="setup">Setup</option>
              </select>
            </div>
          </div>
          <div className="dp-command-filters-right">
            <button type="button" className="dp-command-btn-secondary" onClick={() => navigate("/event/new")}>
              + New Client
            </button>
            <div className="dp-command-split" ref={newTaskWrapRef}>
              <button type="button" className="dp-command-split-main" onClick={() => navigate("/watchtower")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M9 11H5a2 2 0 00-2 2v7a2 2 0 002 2h4m0-11V9a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6m6 0v7a2 2 0 01-2 2h-4m4-9h-4" strokeLinecap="round" />
                </svg>
                New Task
              </button>
              <button type="button" className="dp-command-split-chevron" aria-expanded={newTaskMenuOpen} aria-label="Task actions" onClick={() => setNewTaskMenuOpen((o) => !o)}>
                ▾
              </button>
              {newTaskMenuOpen && (
                <div className="dp-command-split-menu" role="menu">
                  <Link to="/watchtower" className="dp-command-split-menu-item" role="menuitem" onClick={() => setNewTaskMenuOpen(false)}>
                    Open Watchtower
                  </Link>
                  <Link to="/feedback-issues" className="dp-command-split-menu-item" role="menuitem" onClick={() => setNewTaskMenuOpen(false)}>
                    Feedback & issues
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="dp-command-body-row">
      {/* ═══ SIDEBAR ═══ */}
      <aside className="dp-sidebar">
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
                  className={({ isActive }) =>
                    `dp-nav-link ${item.href === DASHBOARD_CALENDAR_TO ? (dashboardNavActive ? "active" : "") : isActive ? "active" : ""}`
                  }
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
        <p className="dp-sidebar-footer-copy">System Designed & Engineered by © Tammy Daddazio — All Rights Reserved</p>
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
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `dp-nav-link ${item.href === DASHBOARD_CALENDAR_TO ? (dashboardNavActive ? "active" : "") : isActive ? "active" : ""}`
                  }
                  onClick={() => setMobileNavOpen(false)}
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
            <button type="button" onClick={() => { logout(); window.location.href = "/login"; }} className="dp-signout">Sign out</button>
          </div>
        )}
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <main className="dp-main">
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
                <option value="Weekly">Week View</option>
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
                onClick={() => setEventViewSync("grid")}
                title="Grid view"
                aria-pressed={eventView === "grid"}
              >
                ⊞ Grid
              </button>
              <button
                type="button"
                className={`dp-toolbar-view-btn ${eventView === "list" ? "active" : ""}`}
                onClick={() => setEventViewSync("list")}
                title="List view"
                aria-pressed={eventView === "list"}
              >
                ☰ List
              </button>
              <button
                type="button"
                className={`dp-toolbar-view-btn ${eventView === "calendar" ? "active" : ""}`}
                onClick={() => setEventViewSync("calendar")}
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
                      {activeTab === "Today's Events" && "Try Week View or Upcoming Events, or add an event."}
                      {(activeTab === "Weekly" || activeTab === "Upcoming Events") && "Add an event via Quick Intake or Upload Invoice."}
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
                                          {listPrimaryLabel(evt.client)}
                                          <StaffingAttentionBadge event={evt} />
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
              <div className="dp-events-list-with-sidebar">
                <div className="dp-events-area-inner-fill">
                  <EventListByDay
                    events={events}
                    activeTab={activeTab}
                    today={today}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    isFOH={isIntakeFOHRole}
                    deptKey={dashboardDept}
                    selectedEventId={listDetailEventId}
                    onSelectDetail={(evt) => setListDetailEventId(evt.id)}
                    onOpenEvent={handleSelectEvent}
                  />
                </div>
                {listDetailEvent && (
                  <EventListDetailSidebar
                    event={listDetailEvent}
                    isFOH={isIntakeFOHRole}
                    onClose={() => setListDetailEventId(null)}
                    onOpenEvent={() => handleSelectEvent(listDetailEvent)}
                  />
                )}
              </div>
            )
          )}
        </div>
      </main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PREMIUM EVENT CARD (INLINE)
   ═══════════════════════════════════════════ */
function PremiumCard({ event, viewMode, onSelect, departmentKey, viewingDepartment }: { event: EventData; viewMode: ViewMode; onSelect?: () => void; departmentKey?: DepartmentKey | null; viewingDepartment?: QuestionTargetDepartment | null }) {
  const prodColor = getProductionColor(event);
  const blinking = !event.isDemo && (departmentKey ? shouldBlinkForDepartment(event, departmentKey) : shouldBlink(event));
  const needsChangeConfirm = !event.isDemo && departmentKey && needsChangeConfirmation(event, departmentKey);
  const frozen = !event.isDemo && isProductionFrozen(event);

  return (
    <AskFOHPopover eventId={event.id} eventName={listPrimaryLabel(event.client)} viewingDepartment={viewingDepartment ?? null} disabled={event.isDemo}>
      <article
        className={`dp-card dp-card-production dp-card-${prodColor} ${blinking ? "dp-card-blink" : ""} ${needsChangeConfirm ? "dp-card-beo-updated" : ""} ${frozen ? "dp-card-frozen" : ""} ${onSelect ? "dp-card-clickable" : ""} ${event.isDemo ? "dp-card-demo" : ""}`}
        data-production={prodColor}
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={onSelect}
        onKeyDown={(e) => onSelect && (e.key === "Enter" || e.key === " ") && onSelect()}
      >
        {/* Top neon line */}
        <div className="dp-card-neon-top" />
        {needsChangeConfirm && (
          <div className="dp-card-beo-updated-badge">BEO Updated — Acceptance Required</div>
        )}
        <StaffingAttentionBadge event={event} className="dp-staffing-attention-badge dp-card-staffing-badge" />

        <div className="dp-card-header dp-card-header-tight">
          <div className="dp-card-name dp-card-name--primary">{listPrimaryLabel(event.client)}</div>
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
