/**
 * THE LEAD SHEET — What FOH sees when they click a lead card.
 * Three-column layout: Identity | Pipeline | Actions, plus Lead Notes Timeline.
 */
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./EventOverviewPage.css";
import {
  loadLead,
  getLeadUrgency,
  parseLeadNotesTimeline,
  type LeadDetail,
} from "../services/airtable/leads";

const SECTION_COLORS = {
  identity: { accent: "#ff6b6b", border: "rgba(204,0,0,0.35)", bg: "rgba(204,0,0,0.06)", btnBg: "rgba(204,0,0,0.12)" },
  pipeline: { accent: "#3b82f6", border: "rgba(59,130,246,0.35)", bg: "rgba(59,130,246,0.06)", btnBg: "rgba(59,130,246,0.12)" },
  actions: { accent: "#22c55e", border: "rgba(34,197,94,0.35)", bg: "rgba(34,197,94,0.06)", btnBg: "rgba(34,197,94,0.12)" },
  notes: { accent: "#a855f7", border: "rgba(168,85,247,0.35)", bg: "rgba(168,85,247,0.06)", btnBg: "rgba(168,85,247,0.12)" },
} as const;

const PRIORITY_COLORS = {
  high: { color: "#ef4444", bg: "rgba(239,68,68,0.2)" },
  medium: { color: "#eab308", bg: "rgba(234,179,8,0.2)" },
  low: { color: "#22c55e", bg: "rgba(34,197,94,0.2)" },
} as const;

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0f0a15 100%)",
    color: "#e0e0e0",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    padding: 24,
  },
  card: { width: "100%", maxWidth: 1400, margin: "0 auto" },
  header: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24, gap: 16 },
  headerTop: { display: "flex", width: "100%", justifyContent: "flex-start" },
  title: { fontSize: 28, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: 0.5 },
  column: {
    flex: "1 1 280px",
    minWidth: 260,
    padding: 20,
    borderRadius: 10,
    border: "1px solid",
    display: "flex",
    flexDirection: "column",
  },
  sectionTitle: { fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 },
  row: { marginBottom: 10, fontSize: 14, color: "rgba(255,255,255,0.9)" },
  label: { fontWeight: 600, color: "rgba(255,255,255,0.7)", marginRight: 8 },
  input: (border: string) => ({
    width: "100%",
    padding: "8px 12px",
    borderRadius: 6,
    background: "#1a1a1a",
    border: `1px solid ${border}`,
    color: "#e0e0e0",
    fontSize: 14,
  }),
  select: (border: string) => ({
    width: "100%",
    padding: "8px 12px",
    borderRadius: 6,
    background: "#1a1a1a",
    border: `1px solid ${border}`,
    color: "#e0e0e0",
    fontSize: 14,
    cursor: "pointer",
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
  btn: (bg: string, accent: string, border: string) => ({
    background: bg,
    border: `1px solid ${border}`,
    padding: "10px 16px",
    borderRadius: 8,
    color: accent,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.2s",
    width: "100%",
    textAlign: "center" as const,
  }),
  btnGreen: {
    background: "rgba(34,197,94,0.2)",
    border: "1px solid rgba(34,197,94,0.5)",
    padding: "14px 20px",
    borderRadius: 8,
    color: "#22c55e",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    transition: "all 0.2s",
    width: "100%",
    textAlign: "center" as const,
  },
  noteItem: (border: string) => ({
    padding: 10,
    marginTop: 8,
    background: "rgba(30,30,30,0.6)",
    border: `1px solid ${border}`,
    borderRadius: 8,
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    whiteSpace: "pre-wrap" as const,
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
  loading: { padding: 40, textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: 14 },
  notFound: { padding: 40, textAlign: "center", color: "#ff6b6b", fontSize: 16 },
};

function formatDate(d?: string): string {
  if (!d) return "—";
  try {
    const [y, m, day] = d.split("-").map(Number);
    const date = new Date(y, m - 1, day);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${day}, ${String(y).slice(-2)}`;
  } catch {
    return d;
  }
}

const LEAD_STATUS_OPTIONS = ["New", "Contacted", "Qualified", "Proposal Sent", "Negotiating", "Won", "Lost"];
const FOLLOW_UP_PRIORITY_OPTIONS = ["High", "Medium", "Low"] as const;

const FOHLeadOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState("");
  const [localNextFollowUp, setLocalNextFollowUp] = useState("");
  const [localFollowUpNotes, setLocalFollowUpNotes] = useState("");
  const [localPriority, setLocalPriority] = useState<"High" | "Medium" | "Low">("Medium");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadLead(id).then((result) => {
      if (cancelled) return;
      if (typeof result === "object" && "error" in result) {
        setError(result.message ?? "Lead not found");
        setLead(null);
      } else {
        const d = result as LeadDetail;
        setLead(d);
        setLocalStatus(d.leadStatus || "New");
        setLocalNextFollowUp(d.nextFollowUpDate ?? "");
        setLocalFollowUpNotes(d.followUpNotes ?? d.fohNotes ?? "");
        setLocalPriority(
          (d.nextFollowUpDate && getLeadUrgency(d.nextFollowUpDate) === "overdue") ? "High" :
          (d.nextFollowUpDate && getLeadUrgency(d.nextFollowUpDate) === "due_today") ? "Medium" : "Low"
        );
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  const handleConvertToEvent = () => {
    navigate("/quick-intake");
  };

  if (!id) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.notFound}>Lead ID is required.</div>
          <Link to="/intake-foh" className="ev-overview-back" style={styles.backLink}>← Back to FOH</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loading}>Loading lead…</div>
          <Link to="/intake-foh" className="ev-overview-back" style={styles.backLink}>← Back to FOH</Link>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.notFound}>{error ?? "Lead not found."}</div>
          <Link to="/intake-foh" className="ev-overview-back" style={styles.backLink}>← Back to FOH</Link>
        </div>
      </div>
    );
  }

  const urgency = getLeadUrgency(localNextFollowUp || lead.nextFollowUpDate);
  const priorityStyle = PRIORITY_COLORS[localPriority.toLowerCase() as keyof typeof PRIORITY_COLORS] ?? PRIORITY_COLORS.medium;
  const timelineEntries = parseLeadNotesTimeline(lead.followUpHistory, lead.notes);
  const s = SECTION_COLORS;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <Link to="/intake-foh" className="ev-overview-back" style={styles.backLink}>← Back to FOH</Link>
          </div>
          <h1 style={styles.title}>Lead Overview</h1>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "stretch" }}>
          {/* LEFT COLUMN — Identity + Contact */}
          <div style={{ ...styles.column, borderColor: s.identity.border, background: s.identity.bg }}>
            <h2 style={{ ...styles.sectionTitle, color: s.identity.accent }}>Identity & Contact</h2>
            <div style={styles.row}>
              <span style={styles.label}>Lead Name</span>
            </div>
            <div style={{ ...styles.row, marginTop: -4, fontSize: 18, fontWeight: 600 }}>{lead.leadName || "—"}</div>
            <div style={{ ...styles.row, marginTop: 16 }}>
              <span style={styles.label}>Client Details</span>
            </div>
            <pre style={{ margin: "0 0 12px 0", fontSize: 13, whiteSpace: "pre-wrap", fontFamily: "inherit", color: "rgba(255,255,255,0.9)" }}>
              {lead.contactInfo || "—"}
            </pre>
            <div style={styles.row}>
              <span style={styles.label}>Inquiry Date</span>
              {formatDate(lead.inquiryDate)}
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Source</span>
              {lead.source || "—"}
            </div>
          </div>

          {/* MIDDLE COLUMN — Pipeline */}
          <div style={{ ...styles.column, borderColor: s.pipeline.border, background: s.pipeline.bg }}>
            <h2 style={{ ...styles.sectionTitle, color: s.pipeline.accent }}>Pipeline</h2>
            <div style={styles.row}>
              <span style={styles.label}>Lead Status</span>
            </div>
            <select
              value={localStatus}
              onChange={(e) => setLocalStatus(e.target.value)}
              style={styles.select(s.pipeline.border)}
            >
              {LEAD_STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <div style={{ ...styles.row, marginTop: 12 }}>
              <span style={styles.label}>Times Contacted</span>
              {lead.timesContacted ?? "—"}
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Last Contact</span>
              {formatDate(lead.lastContact) || "—"}
            </div>
            <div style={{ ...styles.row, marginTop: 12 }}>
              <span style={styles.label}>Next Follow-Up Date</span>
            </div>
            <input
              type="date"
              value={localNextFollowUp}
              onChange={(e) => setLocalNextFollowUp(e.target.value)}
              style={styles.input(s.pipeline.border)}
            />
            <div style={{ ...styles.row, marginTop: 12 }}>
              <span style={styles.label}>Follow-Up Priority</span>
            </div>
            <select
              value={localPriority}
              onChange={(e) => setLocalPriority(e.target.value as "High" | "Medium" | "Low")}
              style={{
                ...styles.select(s.pipeline.border),
                color: priorityStyle.color,
                borderColor: priorityStyle.color,
              }}
            >
              {FOLLOW_UP_PRIORITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <div style={{ ...styles.row, marginTop: 12 }}>
              <span style={styles.label}>Follow-Up Notes</span>
            </div>
            <textarea
              value={localFollowUpNotes}
              onChange={(e) => setLocalFollowUpNotes(e.target.value)}
              placeholder="Add follow-up notes…"
              rows={3}
              style={styles.textarea(s.pipeline.border)}
            />
          </div>

          {/* RIGHT COLUMN — Actions */}
          <div style={{ ...styles.column, borderColor: s.actions.border, background: s.actions.bg }}>
            <h2 style={{ ...styles.sectionTitle, color: s.actions.accent }}>Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button type="button" className="ev-overview-btn" style={styles.btn(s.actions.btnBg, s.actions.accent, s.actions.border)}>
                Send Proposal
              </button>
              <button type="button" className="ev-overview-btn" style={styles.btn(s.actions.btnBg, s.actions.accent, s.actions.border)}>
                Log Call / Email
              </button>
              <button type="button" className="ev-overview-btn" style={styles.btn(s.actions.btnBg, s.actions.accent, s.actions.border)}>
                Add Reminder
              </button>
              <button
                type="button"
                className="ev-overview-btn ev-overview-btn-green"
                style={styles.btnGreen}
                onClick={handleConvertToEvent}
              >
                Convert to Event
              </button>
              <button type="button" className="ev-overview-btn" style={{ ...styles.btn(s.actions.btnBg, "#ef4444", "rgba(239,68,68,0.35)") }}>
                Mark Lead Lost
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM — Lead Notes Timeline (matches Event Notes style) */}
        <div style={{ marginTop: 24, width: "100%", ...styles.column, borderColor: s.notes.border, background: s.notes.bg }}>
          <h2 style={{ ...styles.sectionTitle, color: s.notes.accent }}>Lead Notes Timeline</h2>
          <textarea
            placeholder="Add a new note…"
            rows={2}
            style={styles.textarea(s.notes.border)}
          />
          {timelineEntries.length > 0 ? (
            timelineEntries.map((entry, i) => (
              <div key={i} style={styles.noteItem(s.notes.border)}>
                <strong>{entry.date || "—"}</strong>
                {entry.date && entry.text ? " – " : ""}
                {entry.text}
              </div>
            ))
          ) : (
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 8 }}>
              No notes yet. Add entries in format: M/D/YY – Note text
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FOHLeadOverview;
