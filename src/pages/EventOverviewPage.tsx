import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import "./EventOverviewPage.css";
import { useEventStore } from "../state/eventStore";
import { FIELD_IDS, uploadAttachment, createEvent } from "../services/airtable/events";
import { asString, asSingleSelectName, asAttachments, asBoolean, isErrorResult, asLinkedRecordIds } from "../services/airtable/selectors";
import type { AttachmentItem } from "../services/airtable/events";
import {
  loadTasksForEvent,
  sortOutstandingTasks,
  updateTask,
  createTask,
  type Task,
} from "../services/airtable/tasks";

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
import { FollowUpModal, type FollowUpResult } from "../components/FollowUpModal";
import { DASHBOARD_CALENDAR_TO } from "../lib/dashboardRoutes";
import { loadClientIntakeRecord } from "../services/airtable/clientIntake";

const SECTION_COLORS = {
  summary: { accent: "#ff6b6b", border: "rgba(204,0,0,0.35)", bg: "rgba(204,0,0,0.06)", btnBg: "rgba(204,0,0,0.12)" },
  steps: { accent: "#3b82f6", border: "rgba(59,130,246,0.35)", bg: "rgba(59,130,246,0.06)", btnBg: "rgba(59,130,246,0.12)" },
  actions: { accent: "#22c55e", border: "rgba(34,197,94,0.35)", bg: "rgba(34,197,94,0.06)", btnBg: "rgba(34,197,94,0.12)" },
  documents: { accent: "#00bcd4", border: "rgba(0,188,212,0.35)", bg: "rgba(0,188,212,0.06)", btnBg: "rgba(0,188,212,0.12)" },
  tasks: { accent: "#eab308", border: "rgba(234,179,8,0.35)", bg: "rgba(234,179,8,0.06)", btnBg: "rgba(234,179,8,0.12)" },
  notes: { accent: "#a855f7", border: "rgba(168,85,247,0.35)", bg: "rgba(168,85,247,0.06)", btnBg: "rgba(168,85,247,0.12)" },
} as const;

/** Event types for new-event form (minimal create; rest filled in Header on BEO intake) */
const NEW_EVENT_TYPES = [
  { id: "Full Service", name: "Full Service", color: "#00bcd4" },
  { id: "Delivery", name: "Delivery", color: "#eab308" },
  { id: "Pickup", name: "Pickup", color: "#a855f7" },
  { id: "Tasting", name: "Tasting", color: "#ec4899" },
] as const;

/** Minimal form to create an event. No Individual/Business/Contact here — that’s all in the Header section on BEO intake. */
function NewEventForm({
  onCreated,
  onBack,
  defaultEventTypeId,
}: {
  onCreated: (eventId: string) => void;
  onBack: () => void;
  /** Preselect event type pill when starting from delivery intake (`Delivery`, `Pickup`, etc.) */
  defaultEventTypeId?: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [eventTypeId, setEventTypeId] = useState(() => defaultEventTypeId ?? "");
  const [eventDate, setEventDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && phone.trim().length > 0 && eventTypeId.length > 0;
  const accent = NEW_EVENT_TYPES.find((t) => t.id === eventTypeId)?.color ?? "#00bcd4";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;
    const selected = NEW_EVENT_TYPES.find((o) => o.id === eventTypeId);
    if (!selected) return;
    setIsSubmitting(true);
    const fields: Record<string, unknown> = {
      [FIELD_IDS.CLIENT_FIRST_NAME]: name.trim(),
      [FIELD_IDS.CLIENT_LAST_NAME]: "",
      [FIELD_IDS.CLIENT_PHONE]: phone.trim(),
      [FIELD_IDS.EVENT_TYPE]: selected.name,
    };
    if (eventDate) fields[FIELD_IDS.EVENT_DATE] = eventDate;
    const result = await createEvent(fields);
    if (isErrorResult(result)) {
      setError(result.message ?? "Unable to create event.");
      setIsSubmitting(false);
      return;
    }
    onCreated(result.id);
  };

  return (
    <div style={styles.container}>
      <div style={{ ...styles.card, maxWidth: 520 }}>
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ ...styles.title, margin: 0 }}>New event</h1>
          <button type="button" className="ev-overview-back" style={{ ...styles.backLink, background: "none", border: "none", cursor: "pointer", font: "inherit" }} onClick={onBack}>← Back</button>
        </div>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>
          Add the minimum to create the event. Then open <strong>Event Overview</strong> and use <strong>Header</strong> (or BEO Intake) to fill client type, venue, date, guests, times, and staff in one place.
        </p>
        {defaultEventTypeId === "Delivery" ? (
          <p style={{ fontSize: 13, color: "rgba(234,179,8,0.95)", marginBottom: 20, lineHeight: 1.45 }}>
            Delivery intake: this event starts with an <strong>empty menu</strong>. Link the Client Intake record on the event when you have it, so repeat visits stay consistent.
          </p>
        ) : null}
        <div style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${accent}44`, borderRadius: 10, padding: 24 }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid #ff6b6b", borderRadius: 7, padding: "9px 13px", color: "#ff6b6b", fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
                {error}
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4, fontWeight: 600 }}>Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Person or business name"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.25)", color: "#e0e0e0", fontSize: 14 }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4, fontWeight: 600 }}>Phone *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.25)", color: "#e0e0e0", fontSize: 14 }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 6, fontWeight: 600 }}>Event type *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {NEW_EVENT_TYPES.map((opt) => {
                  const active = eventTypeId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEventTypeId(opt.id)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: active ? `2px solid ${opt.color}` : `1px solid ${opt.color}66`,
                        background: active ? `${opt.color}28` : `${opt.color}18`,
                        color: opt.color,
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {opt.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4, fontWeight: 600 }}>Event date <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.25)", color: "#e0e0e0", fontSize: 14 }}
              />
            </div>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: canSubmit ? `2px solid ${accent}` : "1px solid rgba(255,255,255,0.12)",
                background: canSubmit ? `${accent}28` : "rgba(255,255,255,0.05)",
                color: canSubmit ? accent : "rgba(255,255,255,0.4)",
                fontSize: 14,
                fontWeight: 700,
                cursor: canSubmit && !isSubmitting ? "pointer" : "not-allowed",
              }}
            >
              {isSubmitting ? "Creating…" : "Create event →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0f0a15 100%)",
    color: "#e0e0e0",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 1400,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#fff",
    margin: 0,
    letterSpacing: 0.5,
  },
  tagline: {
    textAlign: "center",
    margin: "0 0 28px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  taglineWerx: {
    fontFamily: "'Great Vibes', cursive",
    fontSize: 32,
    color: "#fff",
    textShadow: "0 0 12px rgba(255,255,255,0.9), 0 0 24px rgba(255,255,255,0.6)",
  },
  taglineText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.5,
  },
  section: {
    flex: "1 1 280px",
    minWidth: 260,
    padding: 20,
    borderRadius: 10,
    border: "1px solid",
    display: "flex",
    flexDirection: "column",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  row: {
    marginBottom: 10,
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  label: {
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    marginRight: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    display: "inline-block",
    marginRight: 8,
    verticalAlign: "middle",
  },
  statusComplete: { backgroundColor: "#22c55e" },
  statusAwaiting: { backgroundColor: "#eab308" },
  statusOther: { backgroundColor: "#ef4444" },
  step: {
    marginBottom: 8,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  buttonGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  button: (bg: string, accent: string, border: string) => ({
    background: bg,
    border: `1px solid ${border}`,
    padding: "10px 16px",
    borderRadius: 8,
    color: accent,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.2s",
  }),
  textarea: (border: string) => ({
    width: "100%",
    padding: 12,
    borderRadius: 8,
    background: "#1a1a1a",
    border: `1px solid ${border}`,
    color: "#e0e0e0",
    fontSize: 14,
    resize: "vertical",
    minHeight: 72,
  }),
  noteItem: (border: string) => ({
    padding: 10,
    marginTop: 8,
    background: "rgba(30,30,30,0.6)",
    border: `1px solid ${border}`,
    borderRadius: 8,
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
  }),
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "rgba(255,255,255,0.7)",
    textDecoration: "none",
    fontSize: 13,
    marginBottom: 20,
  },
  loading: {
    padding: 40,
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  notFound: {
    padding: 40,
    textAlign: "center",
    color: "#ff6b6b",
    fontSize: 16,
  },
};

function formatNoteTimestamp(): string {
  const d = new Date();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const y = String(d.getFullYear()).slice(-2);
  return `${m}/${day}/${y}`;
}

const EventOverviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const deliveryFlow =
    (location.state as { deliveryFlow?: boolean } | null)?.deliveryFlow === true ||
    new URLSearchParams(location.search).get("delivery") === "1";
  const { selectEvent, selectedEventId, selectedEventData, eventDataLoading, setFields, loadEventData, loadEvents } = useEventStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [followUpTask, setFollowUpTask] = useState<Task | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  /** After event load: if this id is a Client Intake row (wrong URL), redirect once — avoids "Event not found" for `/event/recClientId`. */
  const clientIntakeFallbackAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    clientIntakeFallbackAttemptedRef.current = null;
  }, [id]);

  useEffect(() => {
    if (id && id !== "new") selectEvent(id);
  }, [id, selectEvent]);

  useEffect(() => {
    if (!id || id === "new") return;
    setTasksLoading(true);
    loadTasksForEvent(id).then((result) => {
      setTasksLoading(false);
      if (Array.isArray(result)) {
        setTasks(sortOutstandingTasks(result));
      }
    });
  }, [id]);

  const beoNotesFromStore = asString(selectedEventData?.[FIELD_IDS.BEO_NOTES]) || "";
  useEffect(() => {
    setNoteDraft(beoNotesFromStore);
  }, [beoNotesFromStore]);

  const handleFollowUpSave = useCallback(
    async (result: FollowUpResult) => {
      if (!id || !followUpTask) return;
      const currentNotes = asString(selectedEventData?.[FIELD_IDS.BEO_NOTES]) || "";
      if (result.note) {
        const ts = formatNoteTimestamp();
        const line = `[${ts}] [task ${followUpTask.taskId}] ${result.note}`;
        const updated = currentNotes ? `${line}\n${currentNotes}` : line;
        await setFields(id, { [FIELD_IDS.BEO_NOTES]: updated });
      }
      if (result.markComplete) {
        await updateTask(followUpTask.taskId, { status: "Completed" });
        setTasks((prev) => prev.filter((t) => t.taskId !== followUpTask.taskId));
      } else if (result.newDueDate) {
        await updateTask(followUpTask.taskId, { status: "Completed" });
        await createTask({
          eventId: id,
          taskName: followUpTask.taskName,
          taskType: followUpTask.taskType,
          dueDate: result.newDueDate,
          status: "Pending",
        });
        const refreshed = await loadTasksForEvent(id);
        if (Array.isArray(refreshed)) {
          setTasks(sortOutstandingTasks(refreshed));
        }
      }
      loadEventData();
      setFollowUpTask(null);
    },
    [id, followUpTask, selectedEventData, setFields, loadEventData]
  );

  const isCorrectEvent = selectedEventId === id;
  const isLoading = eventDataLoading || (id && !isCorrectEvent);
  const hasData = isCorrectEvent && selectedEventData && Object.keys(selectedEventData).length > 0;

  useEffect(() => {
    if (!id || id === "new") return;
    if (!id.startsWith("rec")) return;
    if (isLoading) return;
    if (hasData) return;
    if (clientIntakeFallbackAttemptedRef.current === id) return;
    let cancelled = false;
    void (async () => {
      const clientRes = await loadClientIntakeRecord(id);
      if (cancelled) return;
      clientIntakeFallbackAttemptedRef.current = id;
      if (!isErrorResult(clientRes)) {
        const q = deliveryFlow ? "?flow=delivery" : "";
        navigate(`/client/${id}${q}`, { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isLoading, hasData, navigate, deliveryFlow]);

  if (!id) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.notFound}>Event ID is required.</div>
          <Link to={DASHBOARD_CALENDAR_TO} className="ev-overview-back" style={styles.backLink}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  // New event: show minimal create form; no client/contact/business/individual — that's all in Header on BEO intake
  if (id === "new") {
    return (
      <NewEventForm
        defaultEventTypeId={deliveryFlow ? "Delivery" : undefined}
        onCreated={(eventId) => {
          loadEvents();
          navigate(`/event/${eventId}`);
        }}
        onBack={() => navigate(deliveryFlow ? "/delivery/intake" : DASHBOARD_CALENDAR_TO)}
      />
    );
  }

  if (isLoading && !hasData) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loading}>Loading event…</div>
          <Link to={DASHBOARD_CALENDAR_TO} className="ev-overview-back" style={styles.backLink}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const eventData = selectedEventData;
  if (!eventData || !hasData) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.notFound}>
            Event not found.
            {id?.startsWith("rec") ? (
              <p style={{ marginTop: 16, fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.65)", maxWidth: 420, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
                If this is a <strong>Client Intake</strong> id, open{" "}
                <Link to={`/client/${id}${deliveryFlow ? "?flow=delivery" : ""}`} style={{ color: "#93c5fd" }}>
                  Client overview
                </Link>{" "}
                instead of Event overview.
              </p>
            ) : null}
          </div>
          <Link to={DASHBOARD_CALENDAR_TO} className="ev-overview-back" style={styles.backLink}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const clientFirst = asString(eventData[FIELD_IDS.CLIENT_FIRST_NAME]);
  const clientLast = asString(eventData[FIELD_IDS.CLIENT_LAST_NAME]);
  const eventDate = asString(eventData[FIELD_IDS.EVENT_DATE])?.slice(0, 10) ?? "";
  const eventType = asSingleSelectName(eventData[FIELD_IDS.EVENT_TYPE]);
  const guestCount = typeof eventData[FIELD_IDS.GUEST_COUNT] === "number"
    ? eventData[FIELD_IDS.GUEST_COUNT]
    : Number(eventData[FIELD_IDS.GUEST_COUNT]) || 0;
  const eventName = asString(eventData[FIELD_IDS.EVENT_NAME]) || "Untitled Event";
  const linkedClientRecordId = asLinkedRecordIds(eventData[FIELD_IDS.CLIENT])[0]?.trim() || "";

  // Derive FOH status from lockout fields if available
  const fohStatus = "Awaiting Questionnaire"; // Placeholder — wire to real status when available

  const getStatusStyle = () => {
    if (fohStatus === "Complete") return styles.statusComplete;
    if (fohStatus === "Awaiting Questionnaire") return styles.statusAwaiting;
    return styles.statusOther;
  };

  const documents = asAttachments(eventData[FIELD_IDS.EVENT_DOCUMENTS]);

  const invoiceSent = asBoolean(eventData[FIELD_IDS.INVOICE_SENT]);
  const invoicePaid = asBoolean(eventData[FIELD_IDS.INVOICE_PAID]);
  const contractSent = asBoolean(eventData[FIELD_IDS.CONTRACT_SENT]);
  const contractSigned = asBoolean(eventData[FIELD_IDS.CONTRACT_SIGNED]);
  const hasQuestionnaireTask = tasks.some((t) => t.taskName?.toLowerCase().includes("questionnaire"));
  const bookingSteps = [
    { label: "Send invoice", done: invoiceSent, fieldId: FIELD_IDS.INVOICE_SENT },
    { label: "Secure deposit / payment", done: invoicePaid, fieldId: FIELD_IDS.INVOICE_PAID },
    { label: "Contract sent", done: contractSent, fieldId: FIELD_IDS.CONTRACT_SENT },
    { label: "Contract signed", done: contractSigned, fieldId: FIELD_IDS.CONTRACT_SIGNED },
    { label: "Send client questionnaire", done: hasQuestionnaireTask, fieldId: null },
    { label: "Confirm contact details", done: false, fieldId: null },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadError(null);
    setUploading(true);
    const result = await uploadAttachment(id, FIELD_IDS.EVENT_DOCUMENTS, file);
    if ("error" in result) {
      setUploadError(result.message ?? "Upload failed");
    } else {
      await setFields(id, { [FIELD_IDS.EVENT_DOCUMENTS]: result.attachments });
      loadEventData();
    }
    setUploading(false);
    e.target.value = "";
  };

  const noteLines = beoNotesFromStore.split(/\r?\n/).filter(Boolean);

  const s = SECTION_COLORS;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <Link to={DASHBOARD_CALENDAR_TO} className="ev-overview-back" style={styles.backLink}>← Back to Dashboard</Link>
          <h1 style={styles.title}>Event Overview</h1>
        </div>
        <div style={styles.tagline}>
          <span style={styles.taglineWerx}>Werx</span>
          <span style={styles.taglineText}>— the engine behind the excellence</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
          {/* Event Summary */}
          <div style={{ ...styles.section, borderColor: s.summary.border, background: s.summary.bg }}>
            <h2 style={{ ...styles.sectionTitle, color: s.summary.accent }}>Event Summary</h2>
            <div style={styles.row}>
              <span style={styles.label}>Client:</span>
              {clientFirst} {clientLast}
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Event:</span>
              {eventName}
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Event Date:</span>
              {eventDate}
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Event Type:</span>
              {eventType}
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Guest Count:</span>
              {guestCount}
            </div>
            <div style={{ ...styles.row, display: "flex", alignItems: "center", marginTop: 16 }}>
              <span style={styles.label}>FOH Status:</span>
              <span style={{ ...styles.statusDot, ...getStatusStyle() }} />
              {fohStatus}
            </div>
            {linkedClientRecordId ? (
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: `1px solid ${s.summary.border}`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: s.summary.accent, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
                  Same client — new job
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.45, margin: "0 0 12px" }}>
                  Opens the <strong>client hub</strong> (Delivery intake). There you can start a <strong>new delivery</strong> or a{" "}
                  <strong>new full service</strong> event—each with an empty menu and Client Intake defaults—not from this event’s
                  menu.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <Link
                    to={`/client/${linkedClientRecordId}?flow=delivery`}
                    state={{ autoCreate: "delivery" as const }}
                    style={{
                      display: "inline-block",
                      padding: "10px 16px",
                      borderRadius: 8,
                      border: "1px solid rgba(234,179,8,0.5)",
                      background: "rgba(234,179,8,0.15)",
                      color: "#fde047",
                      fontWeight: 700,
                      fontSize: 13,
                      textDecoration: "none",
                    }}
                  >
                    New delivery order
                  </Link>
                  <Link
                    to={`/client/${linkedClientRecordId}?flow=delivery`}
                    state={{ autoCreate: "fullservice" as const }}
                    style={{
                      display: "inline-block",
                      padding: "10px 16px",
                      borderRadius: 8,
                      border: "1px solid rgba(0,188,212,0.45)",
                      background: "rgba(0,188,212,0.12)",
                      color: "#67e8f9",
                      fontWeight: 700,
                      fontSize: 13,
                      textDecoration: "none",
                    }}
                  >
                    New full service order
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          {/* Booking steps — driven by Airtable so nothing falls through */}
          <div style={{ ...styles.section, borderColor: s.steps.border, background: s.steps.bg }}>
            <h2 style={{ ...styles.sectionTitle, color: s.steps.accent }}>Booking Steps</h2>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>Track each step; mark done when complete.</p>
            {bookingSteps.map((step) => (
              <div key={step.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
                <span style={styles.step}>
                  {step.done ? "✅" : "⬜"} {step.label}
                </span>
                {step.fieldId && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!id) return;
                      await setFields(id, { [step.fieldId!]: !step.done });
                      loadEventData();
                    }}
                    style={{
                      padding: "4px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: `1px solid ${s.steps.border}`,
                      background: step.done ? "rgba(34,197,94,0.2)" : s.steps.btnBg,
                      color: step.done ? "#22c55e" : s.steps.accent,
                      cursor: "pointer",
                    }}
                  >
                    {step.done ? "Undo" : "Mark done"}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ ...styles.section, borderColor: s.actions.border, background: s.actions.bg }}>
            <h2 style={{ ...styles.sectionTitle, color: s.actions.accent }}>Actions</h2>
            <div style={{ ...styles.buttonGroup, flexDirection: "column" }}>
              <button
                type="button"
                className="ev-overview-btn ev-overview-btn-green"
                style={styles.button(s.actions.btnBg, s.actions.accent, s.actions.border)}
                onClick={async () => {
                  if (id) {
                    await createTask({
                      eventId: id,
                      taskName: "Follow up on questionnaire",
                      taskType: "Follow-up",
                      dueDate: addDays(new Date(), 3),
                      status: "Pending",
                    });
                    const refreshed = await loadTasksForEvent(id);
                    if (Array.isArray(refreshed)) setTasks(sortOutstandingTasks(refreshed));
                  }
                }}
              >
                Send Questionnaire
              </button>
              <button type="button" className="ev-overview-btn ev-overview-btn-green" style={styles.button(s.actions.btnBg, s.actions.accent, s.actions.border)}>
                Add Reminder
              </button>
              <button type="button" className="ev-overview-btn ev-overview-btn-green" style={styles.button(s.actions.btnBg, s.actions.accent, s.actions.border)}>
                Log Call Note
              </button>
              <Link to={`/beo-intake/${id}`} className="ev-overview-btn ev-overview-btn-green" style={{ ...styles.button(s.actions.btnBg, s.actions.accent, s.actions.border), textDecoration: "none", display: "inline-block", textAlign: "center" }}>
                Open Full Intake
              </Link>
            </div>
          </div>

          {/* Documents */}
          <div style={{ ...styles.section, borderColor: s.documents.border, background: s.documents.bg }}>
            <h2 style={{ ...styles.sectionTitle, color: s.documents.accent }}>Documents</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="ev-overview-btn"
              style={styles.button(s.documents.btnBg, s.documents.accent, s.documents.border)}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "📄 Upload Document"}
            </button>
            {uploadError && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>{uploadError}</div>}
            {documents.length > 0 && (
              <ul style={{ marginTop: 12, padding: 0, listStyle: "none", fontSize: 13 }}>
                {documents.map((doc: AttachmentItem, i: number) => (
                  <li key={doc.id ?? i} style={{ marginBottom: 6 }}>
                    <a href={doc.url} target="_blank" rel="noreferrer" style={{ color: s.documents.accent, textDecoration: "none" }}>
                      {doc.filename ?? "Document"}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

        {/* Outstanding Tasks — above Event Notes */}
        <div style={{ marginTop: 24, width: "100%", ...styles.section, borderColor: s.tasks.border, background: s.tasks.bg }}>
          <h2 style={{ ...styles.sectionTitle, color: s.tasks.accent }}>Outstanding Tasks</h2>
          {tasksLoading ? (
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Loading tasks…</div>
          ) : tasks.length === 0 ? (
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>No outstanding tasks.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tasks.map((t) => (
                <div
                  key={t.taskId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    background: "rgba(30,30,30,0.5)",
                    borderRadius: 8,
                    border: "1px solid rgba(234,179,8,0.2)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "#fff", marginBottom: 4 }}>{t.taskName}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                      Due: {t.dueDate || "—"} · {t.status}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFollowUpTask(t)}
                    style={styles.button(s.tasks.btnBg, s.tasks.accent, s.tasks.border)}
                  >
                    Follow Up
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Event Notes — full width at bottom */}
        <div style={{ marginTop: 24, width: "100%", ...styles.section, borderColor: s.notes.border, background: s.notes.bg }}>
          <h2 style={{ ...styles.sectionTitle, color: s.notes.accent }}>Event Notes</h2>
          <textarea
            style={styles.textarea(s.notes.border)}
            placeholder="Add a new note…"
            rows={3}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={async () => {
              if (noteDraft !== beoNotesFromStore && id) {
                await setFields(id, { [FIELD_IDS.BEO_NOTES]: noteDraft });
                loadEventData();
              }
            }}
          />
          {noteLines.length > 0 &&
            noteLines.map((line, i) => (
              <div key={i} style={styles.noteItem(s.notes.border)}>
                {line}
              </div>
            ))}
        </div>

        <FollowUpModal
          open={!!followUpTask}
          onClose={() => setFollowUpTask(null)}
          taskName={followUpTask?.taskName ?? ""}
          eventName={eventName}
          currentDueDate={followUpTask?.dueDate ?? ""}
          onSave={handleFollowUpSave}
        />
      </div>
    </div>
  );
};

export default EventOverviewPage;
