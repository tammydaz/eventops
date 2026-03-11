import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import "./EventOverviewPage.css";
import { useEventStore } from "../state/eventStore";
import { FIELD_IDS, uploadAttachment } from "../services/airtable/events";
import { asString, asSingleSelectName, asAttachments } from "../services/airtable/selectors";
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

const SECTION_COLORS = {
  summary: { accent: "#ff6b6b", border: "rgba(204,0,0,0.35)", bg: "rgba(204,0,0,0.06)", btnBg: "rgba(204,0,0,0.12)" },
  steps: { accent: "#3b82f6", border: "rgba(59,130,246,0.35)", bg: "rgba(59,130,246,0.06)", btnBg: "rgba(59,130,246,0.12)" },
  actions: { accent: "#22c55e", border: "rgba(34,197,94,0.35)", bg: "rgba(34,197,94,0.06)", btnBg: "rgba(34,197,94,0.12)" },
  documents: { accent: "#00bcd4", border: "rgba(0,188,212,0.35)", bg: "rgba(0,188,212,0.06)", btnBg: "rgba(0,188,212,0.12)" },
  tasks: { accent: "#eab308", border: "rgba(234,179,8,0.35)", bg: "rgba(234,179,8,0.06)", btnBg: "rgba(234,179,8,0.12)" },
  notes: { accent: "#a855f7", border: "rgba(168,85,247,0.35)", bg: "rgba(168,85,247,0.06)", btnBg: "rgba(168,85,247,0.12)" },
} as const;

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
  const { selectEvent, selectedEventId, selectedEventData, eventDataLoading, setFields, loadEventData } = useEventStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [followUpTask, setFollowUpTask] = useState<Task | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    if (id) selectEvent(id);
  }, [id, selectEvent]);

  useEffect(() => {
    if (!id) return;
    setTasksLoading(true);
    loadTasksForEvent(id).then((result) => {
      setTasksLoading(false);
      if (Array.isArray(result)) {
        setTasks(sortOutstandingTasks(result));
      }
    });
  }, [id]);

  const isCorrectEvent = selectedEventId === id;
  const isLoading = eventDataLoading || (id && !isCorrectEvent);
  const hasData = isCorrectEvent && selectedEventData && Object.keys(selectedEventData).length > 0;

  if (!id) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.notFound}>Event ID is required.</div>
          <Link to="/" className="ev-overview-back" style={styles.backLink}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (isLoading && !hasData) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loading}>Loading event…</div>
          <Link to="/" className="ev-overview-back" style={styles.backLink}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const eventData = selectedEventData;
  if (!eventData || !hasData) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.notFound}>Event not found.</div>
          <Link to="/" className="ev-overview-back" style={styles.backLink}>← Back to Dashboard</Link>
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

  // Derive FOH status from lockout fields if available
  const fohStatus = "Awaiting Questionnaire"; // Placeholder — wire to real status when available

  const getStatusStyle = () => {
    if (fohStatus === "Complete") return styles.statusComplete;
    if (fohStatus === "Awaiting Questionnaire") return styles.statusAwaiting;
    return styles.statusOther;
  };

  const documents = asAttachments(eventData[FIELD_IDS.EVENT_DOCUMENTS]);

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

  const handleFollowUpSave = useCallback(
    async (result: FollowUpResult) => {
      if (!id || !followUpTask) return;
      const currentNotes = asString(eventData?.[FIELD_IDS.BEO_NOTES]) || "";
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
    [id, followUpTask, eventData, setFields, loadEventData]
  );

  const beoNotes = asString(eventData?.[FIELD_IDS.BEO_NOTES]) || "";
  const noteLines = beoNotes.split(/\r?\n/).filter(Boolean);

  useEffect(() => {
    setNoteDraft(beoNotes);
  }, [beoNotes]);

  const s = SECTION_COLORS;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <Link to="/" className="ev-overview-back" style={styles.backLink}>← Back to Dashboard</Link>
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
          </div>

          {/* FOH Required Steps */}
          <div style={{ ...styles.section, borderColor: s.steps.border, background: s.steps.bg }}>
            <h2 style={{ ...styles.sectionTitle, color: s.steps.accent }}>FOH Required Steps</h2>
            <div style={styles.step}>⬜ Send Client Questionnaire</div>
            <div style={styles.step}>⬜ Set Follow-Up Reminder</div>
            <div style={styles.step}>⬜ Confirm Contact Details</div>
            <div style={styles.step}>⬜ Send Proposal / Estimate</div>
            <div style={styles.step}>⬜ Record Deposit</div>
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
              if (noteDraft !== beoNotes && id) {
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
