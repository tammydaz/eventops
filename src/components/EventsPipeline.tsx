/**
 * EventsPipeline — Full pipeline view matching DashboardPage.
 * Used on all department landing pages. Shows View dropdown, Sort options,
 * Grid/List/Calendar toggles. Uses productionHelpers for blink & color logic.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useEventStore } from "../state/eventStore";
import { useAuthStore } from "../state/authStore";
import {
  getProductionColor,
  getProductionColorForFOH,
  getHealthBOH,
  shouldBlink,
  shouldBlinkForDepartment,
  needsChangeConfirmation,
  isProductionFrozen,
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
import { StaffingAttentionBadge } from "./StaffingAttentionBadge";
import { EventListByDay } from "./EventListByDay";
import { addDaysToIso, weekRangeMondaySunday } from "../lib/weekRange";
import { displayAddressForListItem, listPrimaryLabel, venueDisplayFromListItem } from "../lib/eventListRowMeta";
import { useIntakeFOHCommandFilters } from "../context/IntakeFOHCommandContext";
import { EventListDetailSidebar } from "./EventListDetailSidebar";

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
  staffingConfirmedInNowsta?: boolean;
  fwStaffSummaryPresent?: boolean;
  phone?: string;
  /** Seconds since midnight — for list row time range */
  dispatchTimeSeconds?: number;
  /** FOH: BEO fired to BOH (Airtable checkbox) */
  beoFiredToBOH?: boolean;
  /** FOH: Speck complete (Airtable checkbox) */
  speckComplete?: boolean;
  beoNotes?: string;
  timelineRaw?: string;
  paymentStatus?: string;
  invoicePaid?: boolean;
  /** Formatted street + city/state from Airtable (header / client or venue) */
  addressDisplay?: string;
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
  const venue = venueDisplayFromListItem(e);
  const addressDisplay = displayAddressForListItem(e);
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
    addressDisplay,
    phone,
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

/* ── Demo event templates (dates shifted to window) ── */
const DEMO_TEMPLATES: Array<Omit<EventData, "eventDate" | "time" | "id"> & { dayOffset: number }> = [
  { dayOffset: 0, name: "Smith Wedding – Riverside Manor", client: "Smith Family", venue: "Riverside Manor", guests: 180, category: "Wedding", eventType: "Full Service", serviceStyle: "Plated", isDemo: true },
  { dayOffset: 0, name: "TechCorp Q1 Summit – Convention Center", client: "TechCorp", venue: "Convention Center", guests: 320, category: "Corporate", eventType: "Full Service", serviceStyle: "Buffet", isDemo: true },
  { dayOffset: 1, name: "Holloway Anniversary – The Grand Ballroom", client: "Holloway Family", venue: "The Grand Ballroom", guests: 120, category: "Celebration", eventType: "Full Service", serviceStyle: "Plated", isDemo: true },
  { dayOffset: 2, name: "Green Acres Box Lunch – Barn Venue", client: "Green Acres Org", venue: "Barn Venue", guests: 85, category: "Corporate", eventType: "Delivery", serviceStyle: "Drop-off", isDemo: true, guestCountConfirmed: true, menuAcceptedByKitchen: true, productionAcceptedDelivery: true },
  { dayOffset: 3, name: "Rivera Quinceañera – La Fiesta Hall", client: "Rivera Family", venue: "La Fiesta Hall", guests: 200, category: "Celebration", eventType: "Full Service", serviceStyle: "Buffet", isDemo: true },
  { dayOffset: 4, name: "Office Luncheon – Downtown Tower", client: "Downtown Corp", venue: "Downtown Tower", guests: 55, category: "Corporate", eventType: "Delivery", serviceStyle: "Drop-off", isDemo: true, guestCountConfirmed: true, menuAcceptedByKitchen: true, productionAcceptedDelivery: false },
  { dayOffset: 5, name: "Apex Digital Awards – Hotel Grand", client: "Apex Digital", venue: "Hotel Grand", guests: 250, category: "Corporate", eventType: "Full Service", serviceStyle: "Plated", isDemo: true },
  { dayOffset: 6, name: "Johnson Birthday – Private Residence", client: "Johnson Family", venue: "Private Residence", guests: 45, category: "Birthday", eventType: "Pickup", serviceStyle: "Pick-up", isDemo: true, guestCountConfirmed: true, menuAcceptedByKitchen: true, productionAcceptedDelivery: false },
  { dayOffset: 7, name: "Spring Gala Fundraiser – Museum of Art", client: "Museum Foundation", venue: "Museum of Art", guests: 400, category: "Fundraiser", eventType: "Full Service", serviceStyle: "Stations", isDemo: true },
  { dayOffset: 9, name: "Williams Rehearsal Dinner – Vineyard Estate", client: "Williams Family", venue: "Vineyard Estate", guests: 60, category: "Wedding", eventType: "Pick-up", serviceStyle: "Plated", isDemo: true },
];

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
        beoSentToBOH: false,
        phone: `(555) 201-${String(1000 + i).padStart(4, "0")}`,
        dispatchTimeSeconds: t.dispatchTimeSeconds ?? (18 * 3600 + (i % 5) * 3600),
        addressDisplay: "—",
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

/** Opt-in preview: append `?calendarBusyDemo=1` to the URL to show 10 demo events on one day (calendar view). */
function buildBusyDayDemoEvents(calendarYear: number, calendarMonth: number): EventData[] {
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const dayNum = Math.min(15, lastDay);
  const m = String(calendarMonth + 1).padStart(2, "0");
  const d = String(dayNum).padStart(2, "0");
  const dateStr = `${calendarYear}-${m}-${d}`;
  const time = formatEventDate(dateStr);
  const names = [
    "Corporate Gala — City Hall",
    "Wedding Reception — Riverside Manor",
    "Birthday Celebration — Private Residence",
    "Tech Summit — Convention Center",
    "Fundraising Dinner — Museum of Art",
    "Office Luncheon — Downtown Tower",
    "Anniversary Party — Grand Ballroom",
    "Box Lunch Drop-off — Barn Venue",
    "Rehearsal Dinner — Vineyard Estate",
    "Spring Brunch — Garden Terrace",
  ];
  return names.map((name, i) => ({
    id: `__calendar_busy_demo_${i}`,
    eventDate: dateStr,
    name,
    time,
    client: `Demo Client ${i + 1}`,
    venue: `Venue ${i + 1}`,
    guests: 40 + i * 15,
    category: "Preview",
    eventType: "Full Service",
    serviceStyle: "Plated",
    isDemo: true,
    healthFOH: "green",
    healthBOH: "green",
    beoSentToBOH: false,
    phone: `(555) 555-${String(4300 + i).padStart(4, "0")}`,
    dispatchTimeSeconds: 17 * 3600 + i * 450,
    addressDisplay: "—",
  }));
}

export function EventsPipeline({ title = "Weekly Pipeline", compact = false, departmentContext }: EventsPipelineProps) {
  const isFOH = departmentContext === "intake_foh";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const calendarBusyDemo = searchParams.get("calendarBusyDemo") === "1";
  const { user } = useAuthStore();
  const { events: rawEvents, loadEvents, selectEvent, setFields, eventsLoading, eventsError } = useEventStore();
  const [pendingAcceptEvent, setPendingAcceptEvent] = useState<EventData | null>(null);

  const [activeTab, setActiveTab] = useState("Weekly");
  const [sortBy, setSortBy] = useState<"date" | "client" | "venue" | "eventType" | "serviceStyle">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [eventView, setEventViewState] = useState<"grid" | "list" | "calendar">(() => {
    const p = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("eventView") : null;
    if (p === "grid" || p === "list" || p === "calendar") return p;
    return "calendar";
  });

  const setEventView = useCallback(
    (v: "grid" | "list" | "calendar") => {
      setEventViewState(v);
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.set("eventView", v);
          return n;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    const ev = searchParams.get("eventView");
    if (ev === "grid" || ev === "list" || ev === "calendar") {
      setEventViewState(ev);
    }
  }, [searchParams]);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [todaysTasksOpen, setTodaysTasksOpen] = useState(false);
  const [todaysTasksLoading, setTodaysTasksLoading] = useState(false);
  const [followUpTask, setFollowUpTask] = useState<Task | null>(null);
  const [newClientHelpOpen, setNewClientHelpOpen] = useState(false);
  const [listDetailEventId, setListDetailEventId] = useState<string | null>(null);

  const intakeCmd = useIntakeFOHCommandFilters();

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
  /** Events table BEO notes — Today's Tasks rows only had task-record fields before. */
  const beoNotesByEventId = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of rawEvents) {
      const n = e.beoNotes?.trim();
      if (n) m.set(e.id, n);
    }
    return m;
  }, [rawEvents]);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { monday: weekMonday, sunday: weekSunday } = useMemo(() => weekRangeMondaySunday(today), [today]);

  const filteredEvents = useMemo(() => {
    if (activeTab === "Today's Events") return eventDataList.filter((e) => e.eventDate === today);
    if (activeTab === "Weekly") {
      const real = eventDataList.filter((e) => {
        const d = e.eventDate ?? "";
        return d >= weekMonday && d <= weekSunday;
      });
      const realIds = new Set(real.map((e) => e.id));
      const demos = getDemoEventsForWindow(weekMonday, weekSunday, realIds);
      const combined = [...real, ...demos].sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""));
      if (combined.length >= MIN_EVENTS_TO_FILL) return combined;
      const usedIds = new Set(combined.map((e) => e.id));
      const extra = getDemoEventsForWindow(weekMonday, weekSunday, usedIds).slice(0, MIN_EVENTS_TO_FILL - combined.length);
      return [...combined, ...extra].sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""));
    }
    if (activeTab === "Upcoming Events") return eventDataList.filter((e) => (e.eventDate ?? "") >= today);
    if (activeTab === "Completed" || activeTab === "Archive") return eventDataList.filter((e) => (e.eventDate ?? "") < today);
    return eventDataList;
  }, [eventDataList, activeTab, today, weekMonday, weekSunday]);

  const afterIntakeCommandFilters = useMemo(() => {
    let arr = filteredEvents;
    if (!isFOH || !intakeCmd) return arr;
    if (intakeCmd.barClientFilter !== "all") arr = arr.filter((e) => e.client === intakeCmd.barClientFilter);
    if (intakeCmd.barVenueFilter !== "all") arr = arr.filter((e) => e.venue === intakeCmd.barVenueFilter);
    if (intakeCmd.barStatusFilter === "confirmed") arr = arr.filter((e) => e.beoSentToBOH === true);
    if (intakeCmd.barStatusFilter === "setup") arr = arr.filter((e) => e.beoSentToBOH !== true);
    return arr;
  }, [filteredEvents, isFOH, intakeCmd]);

  const events = useMemo(() => {
    const arr = [...afterIntakeCommandFilters];
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
  }, [afterIntakeCommandFilters, sortBy, sortDir]);

  const listDetailEvent = useMemo(() => events.find((e) => e.id === listDetailEventId) ?? null, [events, listDetailEventId]);

  useEffect(() => {
    /* Intake/FOH: keep the right panel when switching grid/list/calendar (first click = panel, second = overview). */
    if (isFOH) return;
    if (eventView !== "list") setListDetailEventId(null);
  }, [eventView, isFOH]);

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
    if (departmentContext === "delivery") return `/kitchen-beo-print/${eventId}`;
    if (departmentContext === "ops_chief") return `/beo-intake/${eventId}`;
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

  /** Intake/FOH: first click opens the right action panel; second click on the same event opens Event Overview. */
  const handleFOHEventClick = useCallback(
    (evt: EventData) => {
      if (evt.isDemo) return;
      if (listDetailEventId === evt.id) {
        handleSelectEvent(evt);
      } else {
        selectEvent(evt.id);
        setListDetailEventId(evt.id);
      }
    },
    [listDetailEventId]
  );

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

  const pipelineIntakeFohClass =
    departmentContext === "intake_foh"
      ? `pipeline-view--intake-foh${eventView === "list" ? " pipeline-view--intake-foh-list-fit" : ""}`
      : "";

  return (
    <div
      className={`pipeline-view ${pipelineIntakeFohClass}`.trim()}
      style={{
        padding: compact ? 16 : departmentContext === "intake_foh" ? 0 : 24,
        width: "100%",
      }}
    >
      <AcceptTransferModal
        open={!!pendingAcceptEvent}
        onClose={() => setPendingAcceptEvent(null)}
        eventName={pendingAcceptEvent?.name ?? ""}
        onAccept={handleAcceptTransfer}
        isChangeConfirmation={!!pendingAcceptEvent && !!deptKey && (isProductionFrozen(pendingAcceptEvent) || needsChangeConfirmation(pendingAcceptEvent, deptKey))}
        isProductionFrozen={!!pendingAcceptEvent && isProductionFrozen(pendingAcceptEvent)}
      />
      {title && departmentContext !== "intake_foh" && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 4px 0" }}>{title}</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0 }}>
            {activeTab === "Weekly"
              ? `${weekMonday} – ${weekSunday}`
              : `${today} – ${addDaysToIso(today, 6)}`} · {events.length} events
          </p>
        </div>
      )}

      {/* ── Toolbar: View dropdown, Sort, Grid/List/Calendar (matches DashboardPage) ── */}
      <div className={`dp-tabs-toolbar ${isFOH ? "dp-tabs-toolbar--intake-foh-top" : ""}`.trim()}>
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
              <option value="Weekly">Week View</option>
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
            <>
              <div className="dp-todays-tasks-toggle">
                <button
                  type="button"
                  className={`dp-new-client-help-btn ${newClientHelpOpen ? "open" : ""}`}
                  onClick={() => setNewClientHelpOpen((o) => !o)}
                  aria-expanded={newClientHelpOpen}
                >
                  <span>New client? Show steps</span>
                  <span className="dp-todays-tasks-caret">{newClientHelpOpen ? "▾" : "▸"}</span>
                </button>
              </div>
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
            </>
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
            <span className="dp-stat-count">{events.length} events</span>
            <span className="dp-stat-guests">{events.reduce((s, e) => s + e.guests, 0).toLocaleString()} guests</span>
          </div>
        </div>
      </div>

      {/* ── New client step-by-step (FOH only, collapsible) — visible in app when showing staff ── */}
      {isFOH && newClientHelpOpen && (
        <div className="dp-todays-tasks-panel dp-new-client-help-panel">
          <ol className="dp-new-client-help-steps">
            <li>Use <strong>Add Event</strong> from Quick Intake or your bookmarks.</li>
            <li>Enter <strong>first name</strong>, <strong>last name</strong>, <strong>phone</strong>, <strong>event type</strong>, and <strong>date</strong> (optional).</li>
            <li>Click <strong>Create Event →</strong>. You’ll be taken to <strong>BEO Intake</strong> for that event.</li>
            <li>From BEO Intake, click <strong>Event Overview</strong> in the header to track <strong>invoice</strong>, <strong>deposit</strong>, <strong>contract</strong>, <strong>questionnaire</strong>, and <strong>reminders</strong>.</li>
            <li>Fill the rest of the BEO as you get info. When it’s complete, use <strong>Send to BOH</strong> so the event is finalized.</li>
          </ol>
        </div>
      )}

      {/* ── Today's Tasks (FOH only, collapsible) ── */}
      {isFOH && todaysTasksOpen && (
        <div className="dp-todays-tasks-panel">
          {todaysTasksLoading ? (
            <div className="dp-todays-tasks-loading">Loading tasks…</div>
          ) : todaysTasks.length === 0 ? (
            <div className="dp-todays-tasks-empty">No tasks due today.</div>
          ) : (
            <div className="dp-todays-tasks-list">
              {todaysTasks.map((t) => {
                const beoNote = beoNotesByEventId.get(t.eventId);
                return (
                  <div key={t.taskId} className="dp-todays-tasks-row">
                    <div className="dp-todays-tasks-row-head">
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
                    {beoNote ? (
                      <div className="dp-todays-tasks-row-beo">
                        <span className="dp-todays-tasks-beo-label">BEO notes</span>
                        <div className="dp-todays-tasks-beo-text">{beoNote}</div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
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
              events={events}
              busyDayDemo={calendarBusyDemo}
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
            <div className="dp-events-list-with-sidebar">
              <div className="dp-events-area-inner-fill">
                <EventListByDay
                  events={events}
                  activeTab={activeTab}
                  today={today}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  isFOH={isFOH}
                  deptKey={deptKey}
                  selectedEventId={listDetailEventId}
                  onSelectDetail={(evt) => setListDetailEventId(evt.id)}
                  onOpenEvent={handleSelectEvent}
                />
              </div>
              {listDetailEvent && (
                <EventListDetailSidebar
                  event={listDetailEvent}
                  isFOH={isFOH}
                  compactLayout={isFOH}
                  onClose={() => setListDetailEventId(null)}
                  onOpenEvent={() => handleSelectEvent(listDetailEvent)}
                />
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function CalendarView({
  events,
  busyDayDemo,
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
  /** When true, merges 10 demo events onto day 15 (or last day if shorter month) for layout preview. */
  busyDayDemo?: boolean;
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
  const eventsForCalendar = useMemo(() => {
    if (!busyDayDemo) return events;
    return [...events, ...buildBusyDayDemoEvents(calendarYear, calendarMonth)];
  }, [events, busyDayDemo, calendarYear, calendarMonth]);

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

  const eventsInMonth = eventsForCalendar.filter((e) => {
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
      {busyDayDemo && (
        <p className="dp-calendar-busy-demo-hint">
          Preview: 10 demo events on one day — clear <code>?calendarBusyDemo=1</code> from the URL when done
        </p>
      )}
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
    <AskFOHPopover eventId={event.id} eventName={listPrimaryLabel(event.client)} viewingDepartment={viewingDepartment ?? null} disabled={event.isDemo}>
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
        <StaffingAttentionBadge event={event} className="dp-staffing-attention-badge dp-card-staffing-badge" />
        <div className="dp-card-header dp-card-header-tight">
          <div className="dp-card-name dp-card-name--primary">{listPrimaryLabel(event.client)}</div>
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
