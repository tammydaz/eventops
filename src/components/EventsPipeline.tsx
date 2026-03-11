/**
 * EventsPipeline — Full pipeline view matching DashboardPage.
 * Used on all department landing pages. Shows View dropdown, Sort options,
 * Grid/List/Calendar toggles. Uses productionHelpers for blink & color logic.
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useEventStore } from "../state/eventStore";
import { useAuthStore } from "../state/authStore";
import {
  getProductionColor,
  getProductionColorHex,
  getProductionColorForFOH,
  getHealthBOH,
  shouldBlink,
  shouldBlinkForDepartment,
  needsChangeConfirmation,
  isProductionFrozen,
  PRODUCTION_COLORS,
  type DepartmentKey,
} from "../lib/productionHelpers";
import { loadTodaysTasks, sortOutstandingTasks, updateTask, createTask, type Task } from "../services/airtable/tasks";
import { FollowUpModal, type FollowUpResult } from "./FollowUpModal";
import { loadEvent, FIELD_IDS, getLockoutFieldIds, getBOHProductionFieldIds } from "../services/airtable/events";
import { asString } from "../services/airtable/selectors";
import type { HealthStatus } from "./dashboard/EventCard";
import type { EventListItem } from "../services/airtable/events";
import { AcceptTransferModal } from "./AcceptTransferModal";
import { AskFOHPopover } from "./AskFOHPopover";
import { useQuestionStore } from "../state/questionStore";
import type { QuestionTargetDepartment } from "../state/questionStore";
import "../pages/DashboardPage.css";
import "./EventsPipeline.css";

/* ── Event data shape (matches Dashboard) ── */
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
  healthFOH?: "green" | "yellow" | "red";
  healthBOH?: "green" | "yellow" | "red";
}

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
    isDemo: false,
    healthFOH: "green",
    healthBOH,
  };
}

/* ── Demo event templates (dates shifted to window) ── */
const DEMO_TEMPLATES: Array<Omit<EventData, "eventDate" | "time" | "id"> & { dayOffset: number }> = [
  { dayOffset: 0, name: "Smith Wedding – Riverside Manor", client: "Smith Family", venue: "Riverside Manor", guests: 180, category: "Wedding", eventType: "Full Service", serviceStyle: "Plated", isDemo: true },
  { dayOffset: 0, name: "TechCorp Q1 Summit – Convention Center", client: "TechCorp", venue: "Convention Center", guests: 320, category: "Corporate", eventType: "Full Service", serviceStyle: "Buffet", isDemo: true },
  { dayOffset: 1, name: "Holloway Anniversary – The Grand Ballroom", client: "Holloway Family", venue: "The Grand Ballroom", guests: 120, category: "Celebration", eventType: "Full Service", serviceStyle: "Plated", isDemo: true },
  { dayOffset: 2, name: "Green Acres Box Lunch – Barn Venue", client: "Green Acres Org", venue: "Barn Venue", guests: 85, category: "Corporate", eventType: "Delivery", serviceStyle: "Drop-off", isDemo: true, guestCountConfirmed: true, menuAcceptedByKitchen: true, productionAcceptedDelivery: true },
  { dayOffset: 3, name: "Rivera Quinceañera – La Fiesta Hall", client: "Rivera Family", venue: "La Fiesta Hall", guests: 200, category: "Celebration", eventType: "Full Service", serviceStyle: "Buffet", isDemo: true },
  { dayOffset: 4, name: "Office Luncheon – Downtown Tower", client: "Downtown Corp", venue: "Downtown Tower", guests: 55, category: "Corporate", eventType: "Delivery", serviceStyle: "Drop-off", isDemo: true, guestCountConfirmed: true, menuAcceptedByKitchen: true, productionAcceptedDelivery: false },
  { dayOffset: 5, name: "Apex Digital Awards – Hotel Grand", client: "Apex Digital", venue: "Hotel Grand", guests: 250, category: "Corporate", eventType: "Full Service", serviceStyle: "Plated", isDemo: true },
  { dayOffset: 6, name: "Johnson Birthday – Private Residence", client: "Johnson Family", venue: "Private Residence", guests: 45, category: "Birthday", eventType: "Delivery", serviceStyle: "Drop-off", isDemo: true, guestCountConfirmed: true, menuAcceptedByKitchen: true, productionAcceptedDelivery: false },
  { dayOffset: 7, name: "Spring Gala Fundraiser – Museum of Art", client: "Museum Foundation", venue: "Museum of Art", guests: 400, category: "Fundraiser", eventType: "Full Service", serviceStyle: "Stations", isDemo: true },
  { dayOffset: 9, name: "Williams Rehearsal Dinner – Vineyard Estate", client: "Williams Family", venue: "Vineyard Estate", guests: 60, category: "Wedding", eventType: "Full Service", serviceStyle: "Plated", isDemo: true },
];

/* Demo mini cards for FOH dock — always grey, show "sent to BOH" layout */
function getDemoDockItems(): EventData[] {
  const d = new Date().toISOString().slice(0, 10);
  return [
    { id: "demo_dock_1", eventDate: d, name: "Smith Wedding – Riverside Manor", time: "—", client: "Smith Family", venue: "—", guests: 0, category: "—", eventType: "Full Service", serviceStyle: "—", isDemo: true, healthFOH: "green", healthBOH: "green" },
    { id: "demo_dock_2", eventDate: d, name: "TechCorp Q1 Summit – Convention Center", time: "—", client: "TechCorp", venue: "—", guests: 0, category: "—", eventType: "Full Service", serviceStyle: "—", isDemo: true, healthFOH: "green", healthBOH: "green" },
    { id: "demo_dock_3", eventDate: d, name: "Green Acres Box Lunch – Barn Venue", time: "—", client: "Green Acres Org", venue: "—", guests: 0, category: "—", eventType: "Delivery", serviceStyle: "—", isDemo: true, healthFOH: "green", healthBOH: "green" },
  ];
}

function getDemoEventsForWindow(startDate: string, endDate: string, excludeIds: Set<string>): EventData[] {
  const start = new Date(startDate);
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
        isDemo: true,
        healthFOH: "green",
        healthBOH: "green",
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

const MIN_EVENTS_TO_FILL = 6;

type EventsPipelineProps = {
  /** Optional title shown above the pipeline */
  title?: string;
  /** Optional compact mode (e.g. for embedding in smaller layouts) */
  compact?: boolean;
  /** When set, routes to this department's doc and uses department-specific blink/accept */
  departmentContext?: "kitchen" | "flair" | "delivery" | "ops_chief" | "intake_foh";
};

export function EventsPipeline({ title = "10-Day Pipeline", compact = false, departmentContext }: EventsPipelineProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { events: rawEvents, loadEvents, selectEvent, setFields, eventsLoading, eventsError } = useEventStore();
  const [pendingAcceptEvent, setPendingAcceptEvent] = useState<EventData | null>(null);

  const [activeTab, setActiveTab] = useState("10-Day Pipeline");
  const [sortBy, setSortBy] = useState<"date" | "client" | "venue" | "eventType" | "serviceStyle">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [eventView, setEventView] = useState<"grid" | "list" | "calendar">("grid");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [todaysTasksOpen, setTodaysTasksOpen] = useState(false);
  const [todaysTasksLoading, setTodaysTasksLoading] = useState(false);
  const [followUpTask, setFollowUpTask] = useState<Task | null>(null);

  const isFOH = departmentContext === "intake_foh";

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!isFOH) return;
    setTodaysTasksLoading(true);
    const eventNamesById = Object.fromEntries(
      rawEvents.map((e) => [e.id, e.eventName ?? ""])
    );
    loadTodaysTasks(eventNamesById).then((result) => {
      setTodaysTasksLoading(false);
      if (Array.isArray(result)) {
        setTodaysTasks(sortOutstandingTasks(result));
      }
    });
  }, [isFOH, rawEvents]);

  const eventDataList = useMemo(() => rawEvents.map(listItemToEventData), [rawEvents]);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
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
      const demos = getDemoEventsForWindow(today, endDate10, realIds);
      const combined = [...real, ...demos].sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""));
      if (combined.length >= MIN_EVENTS_TO_FILL) return combined;
      const usedIds = new Set(combined.map((e) => e.id));
      const extra = getDemoEventsForWindow(today, endDate10, usedIds).slice(0, MIN_EVENTS_TO_FILL - combined.length);
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

  const { mainEvents, dockEvents } = useMemo(() => {
    if (!isFOH) return { mainEvents: events, dockEvents: [] as EventData[] };
    const main = events.filter((e) => !e.beoSentToBOH || e.isDemo);
    const dock = events
      .filter((e) => !e.isDemo && e.beoSentToBOH === true && (e.eventDate ?? "") >= today)
      .sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""));
    return { mainEvents: main, dockEvents: dock };
  }, [events, isFOH, today]);

  const deptKey: DepartmentKey | null =
    departmentContext && departmentContext !== "intake_foh" ? departmentContext : null;
  const viewingDepartment: QuestionTargetDepartment | null = departmentContext ?? null;

  const handleFollowUpSave = async (result: FollowUpResult) => {
    if (!followUpTask) return;
    const eventId = followUpTask.eventId;
    if (result.note && eventId) {
      const eventData = await loadEvent(eventId);
      if (!("error" in eventData)) {
        const currentNotes = asString(eventData.fields[FIELD_IDS.BEO_NOTES]) || "";
        const d = new Date();
        const ts = `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;
        const line = `[${ts}] [task ${followUpTask.taskId}] ${result.note}`;
        const updated = currentNotes ? `${line}\n${currentNotes}` : line;
        await setFields(eventId, { [FIELD_IDS.BEO_NOTES]: updated });
      }
    }
    if (result.markComplete) {
      await updateTask(followUpTask.taskId, { status: "Completed" });
      setTodaysTasks((prev) => prev.filter((t) => t.taskId !== followUpTask.taskId));
    } else if (result.newDueDate) {
      await updateTask(followUpTask.taskId, { status: "Completed" });
      await createTask({
        eventId,
        taskName: followUpTask.taskName,
        taskType: followUpTask.taskType,
        dueDate: result.newDueDate,
        status: "Pending",
      });
      const eventNamesById = Object.fromEntries(rawEvents.map((e) => [e.id, e.eventName ?? ""]));
      const refreshed = await loadTodaysTasks(eventNamesById);
      if (Array.isArray(refreshed)) {
        setTodaysTasks(sortOutstandingTasks(refreshed));
      }
    }
    setFollowUpTask(null);
  };

  const getTargetRoute = (eventId: string) => {
    if (departmentContext === "kitchen") return `/kitchen-beo-print/${eventId}`;
    if (departmentContext === "flair") return `/beo-print/${eventId}`;
    if (departmentContext === "intake_foh") return `/event/${eventId}`;
    if (departmentContext === "delivery" || departmentContext === "ops_chief") return `/beo-intake/${eventId}`;
    const userRole = user?.role ?? "ops_admin";
    if (userRole === "kitchen") return `/kitchen-beo-print/${eventId}`;
    if (userRole === "flair") return `/beo-print/${eventId}`;
    return `/beo-intake/${eventId}`;
  };

  const handleSelectEvent = (evt: EventData) => {
    if (evt.isDemo) return;
    const frozen = isProductionFrozen(evt);
    const blink = deptKey ? shouldBlinkForDepartment(evt, deptKey) : false;
    const needsConfirm = deptKey && needsChangeConfirmation(evt, deptKey);
    if (deptKey && (frozen || blink || needsConfirm)) {
      setPendingAcceptEvent(evt);
      return;
    }
    selectEvent(evt.id);
    navigate(getTargetRoute(evt.id));
  };

  const getAcceptFieldId = async () => {
    const ids = await getLockoutFieldIds();
    if (!ids) return null;
    switch (departmentContext) {
      case "kitchen": return ids.productionAccepted ?? null;
      case "flair": return ids.productionAcceptedFlair ?? null;
      case "delivery": return ids.productionAcceptedDelivery ?? null;
      case "ops_chief": return ids.productionAcceptedOpsChief ?? null;
      default: return ids.productionAccepted ?? null;
    }
  };

  const handleAcceptTransfer = async (initials: string) => {
    if (!pendingAcceptEvent) return;
    const eventId = pendingAcceptEvent.id;
    const frozen = isProductionFrozen(pendingAcceptEvent);
    if (frozen) {
      const bohIds = await getBOHProductionFieldIds();
      if (bohIds?.changeConfirmedByBOH) {
        await setFields(eventId, { [bohIds.changeConfirmedByBOH]: true });
        await loadEvents();
      }
    } else {
      const fieldId = await getAcceptFieldId();
      if (fieldId) {
        await setFields(eventId, { [fieldId]: true });
        await loadEvents();
      }
    }
    selectEvent(eventId);
    setPendingAcceptEvent(null);
    navigate(getTargetRoute(eventId));
  };

  const goPrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else setCalendarMonth((m) => m - 1);
  };

  const goNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else setCalendarMonth((m) => m + 1);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="pipeline-view" style={{ padding: compact ? 16 : 24, width: "100%" }}>
      <AcceptTransferModal
        open={!!pendingAcceptEvent}
        onClose={() => setPendingAcceptEvent(null)}
        eventName={pendingAcceptEvent?.name ?? ""}
        onAccept={handleAcceptTransfer}
        isChangeConfirmation={!!pendingAcceptEvent && !!deptKey && (isProductionFrozen(pendingAcceptEvent) || needsChangeConfirmation(pendingAcceptEvent, deptKey))}
        isProductionFrozen={!!pendingAcceptEvent && isProductionFrozen(pendingAcceptEvent)}
      />
      {title && !isFOH && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 4px 0" }}>{title}</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0 }}>
            {today} – {endDate10} · {events.length} events
          </p>
        </div>
      )}

      {/* ── Toolbar: View dropdown, Sort, Grid/List/Calendar (matches DashboardPage) ── */}
      <div className="dp-tabs-toolbar">
        <div className="dp-tabs-left">
          <div className="dp-toolbar-sort">
            <label htmlFor="ep-view-select" className="dp-toolbar-label">View</label>
            <select
              id="ep-view-select"
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
            <label htmlFor="ep-sort-select" className="dp-toolbar-label">Sort by</label>
            <select
              id="ep-sort-select"
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
          {isFOH && (
            <div className="dp-todays-tasks-toggle">
              <button
                type="button"
                className={`dp-todays-tasks-btn ${todaysTasksOpen ? "open" : ""}`}
                onClick={() => setTodaysTasksOpen((o) => !o)}
                aria-expanded={todaysTasksOpen}
              >
                <span>Today&apos;s Tasks ({todaysTasks.length})</span>
                <span className="dp-todays-tasks-caret">{todaysTasksOpen ? "▾" : "▸"}</span>
              </button>
            </div>
          )}
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
            <span className="dp-stat-count">{(isFOH ? mainEvents : events).length} events</span>
            <span className="dp-stat-guests">{(isFOH ? mainEvents : events).reduce((s, e) => s + e.guests, 0).toLocaleString()} guests</span>
          </div>
        </div>
      </div>

      {/* ── Today's Tasks (FOH only, collapsible) ── */}
      {isFOH && todaysTasksOpen && (
        <div className="dp-todays-tasks-panel">
          {todaysTasksLoading ? (
            <div className="dp-todays-tasks-loading">Loading tasks…</div>
          ) : todaysTasks.length === 0 ? (
            <div className="dp-todays-tasks-empty">No tasks due today.</div>
          ) : (
            <div className="dp-todays-tasks-list">
              {todaysTasks.map((t) => (
                <div key={t.taskId} className="dp-todays-tasks-row">
                  <Link
                    to={`/event/${t.eventId}`}
                    className="dp-todays-tasks-event"
                    onClick={() => selectEvent(t.eventId)}
                  >
                    {t.eventName || "Event"}
                  </Link>
                  <span className="dp-todays-tasks-name">{t.taskName}</span>
                  <span className="dp-todays-tasks-due">{t.dueDate}</span>
                  <button
                    type="button"
                    className="dp-todays-tasks-followup"
                    onClick={() => setFollowUpTask(t)}
                  >
                    Follow Up
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <FollowUpModal
        open={!!followUpTask}
        onClose={() => setFollowUpTask(null)}
        taskName={followUpTask?.taskName ?? ""}
        eventName={followUpTask?.eventName}
        currentDueDate={followUpTask?.dueDate ?? ""}
        onSave={handleFollowUpSave}
      />

      {/* ── Events area ── */}
      <div className="dp-events-area">
        {eventsError && (
          <div className="dp-events-error" style={{ marginBottom: 16 }}>
            <span>{eventsError}</span>
            <button type="button" className="dp-events-retry" onClick={() => loadEvents()}>
              Retry
            </button>
          </div>
        )}
        {eventsLoading && <div className="dp-events-loading">Loading events…</div>}
        {!eventsLoading && !eventsError && (
          eventView === "grid" ? (
            <div className="dp-events-grid">
              {(isFOH ? mainEvents : events).length === 0 ? (
                <div className="dp-events-empty">
                  <p>No events in &quot;{activeTab}&quot;</p>
                  <p className="dp-events-empty-hint">
                    {activeTab === "Today's Events" && "Try the 10-Day Pipeline or Upcoming Events, or add an event."}
                    {(activeTab === "10-Day Pipeline" || activeTab === "Upcoming Events") && "Add an event via Quick Intake or Upload Invoice."}
                    {(activeTab === "Completed" || activeTab === "Archive") && "Past events will appear here."}
                  </p>
                </div>
              ) : (
                (isFOH ? mainEvents : events).map((evt) => (
                  <PipelineCard
                    key={evt.id}
                    event={evt}
                    departmentKey={deptKey}
                    viewingDepartment={viewingDepartment}
                    isFOH={isFOH}
                    onSelect={evt.isDemo ? undefined : () => handleSelectEvent(evt)}
                  />
                ))
              )}
            </div>
          ) : eventView === "calendar" ? (
            <CalendarView
              events={isFOH ? mainEvents : events}
              calendarMonth={calendarMonth}
              calendarYear={calendarYear}
              monthNames={monthNames}
              dayNames={dayNames}
              deptKey={deptKey}
              isFOH={isFOH}
              onSelectEvent={handleSelectEvent}
              goPrev={goPrevMonth}
              goNext={goNextMonth}
            />
          ) : (
            <ListView
              events={isFOH ? mainEvents : events}
              activeTab={activeTab}
              deptKey={deptKey}
              isFOH={isFOH}
              onSelectEvent={handleSelectEvent}
            />
          )
        )}
      </div>

      {/* FOH Bottom Dock — mini grey cards (sent to BOH) + demo cards */}
      {isFOH && (
        <FOHBottomDock
          events={[...dockEvents, ...getDemoDockItems()]}
          viewingDepartment={viewingDepartment}
          onSelectEvent={handleSelectEvent}
        />
      )}
    </div>
  );
}

function FOHBottomDock({
  events,
  viewingDepartment,
  onSelectEvent,
}: {
  events: EventData[];
  viewingDepartment: QuestionTargetDepartment | null;
  onSelectEvent: (evt: EventData) => void;
}) {
  return (
    <div className="foh-dock">
      <div className="foh-dock-inner">
        {events.map((evt) => (
          <FOHMiniCard
            key={evt.id}
            event={evt}
            viewingDepartment={viewingDepartment}
            onSelect={() => onSelectEvent(evt)}
          />
        ))}
      </div>
    </div>
  );
}

function FOHMiniCard({
  event,
  viewingDepartment,
  onSelect,
}: {
  event: EventData;
  viewingDepartment: QuestionTargetDepartment | null;
  onSelect: () => void;
}) {
  const kitchenBlink = event.kitchenBlink === true;
  const deliveryBlink = event.deliveryBlink === true;
  const flairBlink = event.flairBlink === true;
  const opsBlink = event.opsChiefBlink === true;
  const fohStatus = event.healthFOH ?? "green";

  return (
    <AskFOHPopover eventId={event.id} eventName={event.name} viewingDepartment={viewingDepartment} disabled={event.isDemo}>
      <article
        className="foh-mini-card"
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
      >
        <span className="foh-mini-client">{event.client}</span>
        <div className="foh-mini-lights">
          <MiniLight status={fohStatus} label="FOH" />
          <MiniLight status={kitchenBlink ? "yellow" : "green"} label="K" />
          <MiniLight status={deliveryBlink ? "yellow" : "green"} label="D" />
          <MiniLight status={flairBlink ? "yellow" : "green"} label="F" />
          <MiniLight status={opsBlink ? "yellow" : "green"} label="O" />
        </div>
      </article>
    </AskFOHPopover>
  );
}

function MiniLight({ status, label }: { status: "green" | "yellow" | "red"; label: string }) {
  const colors: Record<string, string> = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };
  const c = colors[status] ?? "#6b7280";
  return (
    <span className="foh-mini-light" title={label} style={{ backgroundColor: c }}>
      {label}
    </span>
  );
}

function CalendarView({
  events,
  calendarMonth,
  calendarYear,
  monthNames,
  dayNames,
  deptKey,
  isFOH,
  onSelectEvent,
  goPrev,
  goNext,
}: {
  events: EventData[];
  calendarMonth: number;
  calendarYear: number;
  monthNames: string[];
  dayNames: string[];
  deptKey: DepartmentKey | null;
  isFOH?: boolean;
  onSelectEvent: (evt: EventData) => void;
  goPrev: () => void;
  goNext: () => void;
}) {
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

  const hasUnacknowledgedForDepartment = useQuestionStore((s) => s.hasUnacknowledgedForDepartment);

  return (
    <div className="dp-events-calendar">
      <div className="dp-calendar-header">
        <button type="button" className="dp-calendar-nav" onClick={goPrev} aria-label="Previous month">‹</button>
        <h2 className="dp-calendar-title">{monthNames[calendarMonth]} {calendarYear}</h2>
        <button type="button" className="dp-calendar-nav" onClick={goNext} aria-label="Next month">›</button>
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
                        const prodColor = isFOH ? getProductionColorForFOH(evt) : getProductionColor(evt);
                        const canSelect = !evt.isDemo;
                        const blink = canSelect && (
                          isFOH ? hasUnacknowledgedForDepartment(evt.id, "intake_foh") : (deptKey ? shouldBlinkForDepartment(evt, deptKey) : shouldBlink(evt))
                        );
                        return (
                          <div
                            key={evt.id}
                            className={`dp-calendar-event ${blink ? "dp-calendar-event-blink" : ""} ${evt.isDemo ? "dp-calendar-event-demo" : ""}`}
                            data-production={prodColor}
                            role={canSelect ? "button" : undefined}
                            tabIndex={canSelect ? 0 : undefined}
                            onClick={() => canSelect && onSelectEvent(evt)}
                            onKeyDown={(e) => canSelect && (e.key === "Enter" || e.key === " ") && onSelectEvent(evt)}
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
}

function ListView({
  events,
  activeTab,
  deptKey,
  isFOH,
  onSelectEvent,
}: {
  events: EventData[];
  activeTab: string;
  deptKey: DepartmentKey | null;
  isFOH?: boolean;
  onSelectEvent: (evt: EventData) => void;
}) {
  const hasUnacknowledgedForDepartment = useQuestionStore((s) => s.hasUnacknowledgedForDepartment);
  return (
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
            const prodColor = isFOH ? getProductionColorForFOH(evt) : getProductionColor(evt);
            const colorHex = isFOH ? (PRODUCTION_COLORS[prodColor]) : getProductionColorHex(evt);
            const canSelect = !evt.isDemo;
            const blink = canSelect && (
              isFOH ? hasUnacknowledgedForDepartment(evt.id, "intake_foh") : (deptKey ? shouldBlinkForDepartment(evt, deptKey) : shouldBlink(evt))
            );
            const frozen = canSelect && isProductionFrozen(evt);
            return (
              <div
                key={evt.id}
                className={`dp-list-row ${blink ? "dp-list-row-blink" : ""} ${frozen ? "dp-list-row-frozen" : ""} ${evt.isDemo ? "dp-list-row-demo" : ""}`}
                data-production={prodColor}
                role={canSelect ? "button" : undefined}
                tabIndex={canSelect ? 0 : undefined}
                onClick={() => canSelect && onSelectEvent(evt)}
                onKeyDown={(e) => canSelect && (e.key === "Enter" || e.key === " ") && onSelectEvent(evt)}
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
  );
}

function PipelineCard({ event, departmentKey, viewingDepartment, isFOH, onSelect }: { event: EventData; departmentKey: DepartmentKey | null; viewingDepartment?: QuestionTargetDepartment | null; isFOH?: boolean; onSelect?: () => void }) {
  const hasUnacknowledgedForDepartment = useQuestionStore((s) => s.hasUnacknowledgedForDepartment);
  const prodColor = isFOH ? getProductionColorForFOH(event) : getProductionColor(event);
  const blinking = !event.isDemo && (
    isFOH
      ? hasUnacknowledgedForDepartment(event.id, "intake_foh")
      : (departmentKey ? shouldBlinkForDepartment(event, departmentKey) : shouldBlink(event))
  );
  const needsChangeConfirm = !event.isDemo && departmentKey && needsChangeConfirmation(event, departmentKey);
  const frozen = !event.isDemo && isProductionFrozen(event);

  return (
    <AskFOHPopover eventId={event.id} eventName={event.name} viewingDepartment={viewingDepartment ?? null} disabled={event.isDemo}>
      <article
        className={`dp-card dp-card-production dp-card-${prodColor} ${blinking ? "dp-card-blink" : ""} ${needsChangeConfirm ? "dp-card-beo-updated" : ""} ${frozen ? "dp-card-frozen" : ""} ${onSelect ? "dp-card-clickable" : ""} ${event.isDemo ? "dp-card-demo" : ""}`}
        data-production={prodColor}
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={onSelect}
        onKeyDown={(e) => onSelect && (e.key === "Enter" || e.key === " ") && onSelect()}
      >
        <div className="dp-card-neon-top" />
        {needsChangeConfirm && (
          <div className="dp-card-beo-updated-badge">BEO Updated — Acceptance Required</div>
        )}
        <div className="dp-card-header dp-card-header-tight">
          <div className="dp-card-client">{event.client}</div>
          <div className="dp-card-name">{event.name}</div>
        </div>
        <div className="dp-card-health">
          <HealthLight status={event.healthFOH ?? "green"} label="FOH" />
          <HealthLight status={event.healthBOH ?? "green"} label="BOH" />
        </div>
      </article>
    </AskFOHPopover>
  );
}

const HEALTH: Record<HealthStatus, { bg: string; glow: string }> = {
  green: { bg: "#22c55e", glow: "rgba(34,197,94,0.6)" },
  yellow: { bg: "#eab308", glow: "rgba(234,179,8,0.6)" },
  red: { bg: "#ef4444", glow: "rgba(239,68,68,0.6)" },
};

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
