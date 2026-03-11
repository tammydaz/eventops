/**
 * LeadOverviewModal — matches EventOverviewModal design.
 * Sections: Lead Identity, Contact, Event Basics, Follow-Up Engine, Proposal Tracking,
 * Lead Notes Timeline, Convert To Event.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadLead,
  updateLead,
  convertLeadToEvent,
  parseLeadNotesTimeline,
  type LeadDetail,
  type FollowUpPriority,
} from "../../services/airtable/leads";
import { isErrorResult } from "../../services/airtable/selectors";
import "./LeadOverviewModal.css";

const SECTION_COLORS = {
  identity: { accent: "#ff6b6b", border: "rgba(204,0,0,0.35)" },
  contact: { accent: "#3b82f6", border: "rgba(59,130,246,0.35)" },
  event: { accent: "#00bcd4", border: "rgba(0,188,212,0.35)" },
  followUp: { accent: "#eab308", border: "rgba(234,179,8,0.35)" },
  proposal: { accent: "#a855f7", border: "rgba(168,85,247,0.35)" },
  notes: { accent: "#22c55e", border: "rgba(34,197,94,0.35)" },
} as const;

const LEAD_STATUS_OPTIONS = ["New", "Contacted", "Qualified", "Hot Lead", "Proposal Sent", "Negotiating", "Booked", "Lost"];
const FOLLOW_UP_PRIORITY_OPTIONS: FollowUpPriority[] = ["Urgent", "High", "Medium", "Low"];

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

type LeadOverviewModalProps = {
  leadId: string;
  onClose: () => void;
  onUpdated: () => void;
};

export function LeadOverviewModal({ leadId, onClose, onUpdated }: LeadOverviewModalProps) {
  const navigate = useNavigate();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  const [localStatus, setLocalStatus] = useState("");
  const [localNextFollowUp, setLocalNextFollowUp] = useState("");
  const [localPriority, setLocalPriority] = useState<FollowUpPriority>("Medium");
  const [localFollowUpNotes, setLocalFollowUpNotes] = useState("");
  const [localProposalNeeded, setLocalProposalNeeded] = useState(false);
  const [localProposalSent, setLocalProposalSent] = useState(false);
  const [localProposalDate, setLocalProposalDate] = useState("");
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadLead(leadId).then((result) => {
      if (cancelled) return;
      if (isErrorResult(result)) {
        setError(result.message ?? "Failed to load lead");
        setLead(null);
      } else {
        const d = result as LeadDetail;
        setLead(d);
        setLocalStatus(d.leadStatus || "New");
        setLocalNextFollowUp(d.nextFollowUpDate ?? "");
        setLocalPriority(d.followUpPriority ?? "Medium");
        setLocalFollowUpNotes(d.followUpNotes ?? d.fohNotes ?? "");
        setLocalProposalNeeded(d.proposalNeeded ?? false);
        setLocalProposalSent(d.proposalSent ?? false);
        setLocalProposalDate(d.proposalDate ?? "");
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [leadId]);

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    const result = await updateLead(lead.id, {
      leadStatus: localStatus,
      nextFollowUpDate: localNextFollowUp || undefined,
      followUpPriority: localPriority,
      followUpNotes: localFollowUpNotes,
      proposalNeeded: localProposalNeeded,
      proposalSent: localProposalSent,
      proposalDate: localProposalDate || undefined,
    });
    setSaving(false);
    if (!isErrorResult(result)) {
      onUpdated();
      setLead((prev) => prev ? { ...prev, leadStatus: localStatus, nextFollowUpDate: localNextFollowUp, followUpPriority: localPriority, followUpNotes: localFollowUpNotes, proposalNeeded: localProposalNeeded, proposalSent: localProposalSent, proposalDate: localProposalDate || undefined } : null);
    }
  };

  const handleConvertToEvent = async () => {
    if (!lead) return;
    setConverting(true);
    const result = await convertLeadToEvent(lead);
    setConverting(false);
    if (isErrorResult(result)) {
      setError(result.message ?? "Failed to convert lead to event");
      return;
    }
    onClose();
    onUpdated();
    navigate(`/event/${result.eventId}`);
  };

  const handleAddNote = async () => {
    if (!lead || !newNote.trim()) return;
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}/${String(today.getFullYear()).slice(-2)}`;
    const appended = (lead.followUpHistory ?? "").trim()
      ? `${lead.followUpHistory}\n${dateStr} – ${newNote.trim()}`
      : `${dateStr} – ${newNote.trim()}`;
    setSaving(true);
    const result = await updateLead(lead.id, { followUpHistory: appended });
    setSaving(false);
    if (!isErrorResult(result)) {
      setLead((prev) => prev ? { ...prev, followUpHistory: appended } : null);
      setNewNote("");
      onUpdated();
    }
  };

  if (loading) {
    return (
      <div className="lead-overview-overlay" onClick={onClose}>
        <div className="lead-overview-modal" onClick={(e) => e.stopPropagation()}>
          <div className="lead-overview-loading">Loading lead…</div>
        </div>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="lead-overview-overlay" onClick={onClose}>
        <div className="lead-overview-modal" onClick={(e) => e.stopPropagation()}>
          <div className="lead-overview-header">
            <h2>Lead Overview</h2>
            <button type="button" className="lead-overview-close" onClick={onClose} aria-label="Close">×</button>
          </div>
          <div className="lead-overview-error">{error}</div>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  const timelineEntries = parseLeadNotesTimeline(lead.followUpHistory, lead.notes);
  const s = SECTION_COLORS;

  return (
    <div className="lead-overview-overlay" onClick={onClose}>
      <div className="lead-overview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lead-overview-header">
          <h2>Lead Overview</h2>
          <button type="button" className="lead-overview-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="lead-overview-scroll lead-overview-grid">
          {/* Row 1: Identity | Contact | Event Basics */}
          <section className="lead-overview-section" style={{ borderColor: s.identity.border }}>
            <h3 style={{ color: s.identity.accent }}>Lead Identity</h3>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Lead Name</span>
              <span className="lead-overview-value">{lead.leadName}</span>
            </div>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Inquiry Date</span>
              <span className="lead-overview-value">{formatDate(lead.inquiryDate)}</span>
            </div>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Source</span>
              <span className="lead-overview-value">{lead.source || "—"}</span>
            </div>
          </section>

          <section className="lead-overview-section" style={{ borderColor: s.contact.border }}>
            <h3 style={{ color: s.contact.accent }}>Contact</h3>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Client First Name / Last Name</span>
              <span className="lead-overview-value">
                {[lead.clientFirstName, lead.clientLastName].filter(Boolean).join(" ") || lead.contactInfo?.split("\n")[0] || "—"}
              </span>
            </div>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Phone</span>
              <span className="lead-overview-value">{lead.phone || lead.contactInfo || "—"}</span>
            </div>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Email</span>
              <span className="lead-overview-value">{lead.email || "—"}</span>
            </div>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Preferred Contact Method</span>
              <span className="lead-overview-value">{lead.preferredContactMethod || "—"}</span>
            </div>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Best Time to Reach</span>
              <span className="lead-overview-value">{lead.bestTimeToReach || "—"}</span>
            </div>
          </section>

          <section className="lead-overview-section" style={{ borderColor: s.event.border }}>
            <h3 style={{ color: s.event.accent }}>Event Basics</h3>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Estimated Event Date</span>
              <span className="lead-overview-value">{formatDate(lead.estimatedEventDate) || "—"}</span>
            </div>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Event Type</span>
              <span className="lead-overview-value">{lead.eventType || "—"}</span>
            </div>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Estimated Guest Count</span>
              <span className="lead-overview-value">{lead.estimatedGuestCount ?? "—"}</span>
            </div>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Venue</span>
              <span className="lead-overview-value">{lead.venue || "—"}</span>
            </div>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Budget Range</span>
              <span className="lead-overview-value">{lead.budgetRange || "—"}</span>
            </div>
          </section>

          {/* Row 2: Follow-Up Engine | Proposal Tracking */}
          <section className="lead-overview-section" style={{ borderColor: s.followUp.border }}>
            <h3 style={{ color: s.followUp.accent }}>Follow-Up Engine</h3>
            <div className="lead-overview-field">
              <label>Lead Status</label>
              <select
                value={localStatus}
                onChange={(e) => setLocalStatus(e.target.value)}
                className="lead-overview-input"
              >
                {LEAD_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="lead-overview-field">
              <label>Next Follow-Up Date</label>
              <input
                type="date"
                value={localNextFollowUp}
                onChange={(e) => setLocalNextFollowUp(e.target.value)}
                className="lead-overview-input"
              />
            </div>
            <div className="lead-overview-field">
              <label>Follow-Up Priority</label>
              <select
                value={localPriority}
                onChange={(e) => setLocalPriority(e.target.value as FollowUpPriority)}
                className="lead-overview-input"
              >
                {FOLLOW_UP_PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Last Contact Date</span>
              <span className="lead-overview-value">{formatDate(lead.lastContact) || "—"}</span>
            </div>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Times Contacted</span>
              <span className="lead-overview-value">{lead.timesContacted ?? "—"}</span>
            </div>
            <div className="lead-overview-field">
              <label>Follow-Up Notes</label>
              <textarea
                value={localFollowUpNotes}
                onChange={(e) => setLocalFollowUpNotes(e.target.value)}
                className="lead-overview-textarea"
                rows={2}
                placeholder="Add follow-up notes…"
              />
            </div>
          </section>

          <section className="lead-overview-section" style={{ borderColor: s.proposal.border }}>
            <h3 style={{ color: s.proposal.accent }}>Proposal Tracking</h3>
            <div className="lead-overview-field lead-overview-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={localProposalNeeded}
                  onChange={(e) => setLocalProposalNeeded(e.target.checked)}
                />
                Proposal Needed?
              </label>
            </div>
            <div className="lead-overview-field lead-overview-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={localProposalSent}
                  onChange={(e) => setLocalProposalSent(e.target.checked)}
                />
                Proposal Sent?
              </label>
            </div>
            <div className="lead-overview-field">
              <label>Proposal Date</label>
              <input
                type="date"
                value={localProposalDate}
                onChange={(e) => setLocalProposalDate(e.target.value)}
                className="lead-overview-input"
              />
            </div>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Estimated Price Range</span>
              <span className="lead-overview-value">{lead.estimatedPriceRange || "—"}</span>
            </div>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Menu Ideas / Requested Concepts</span>
              <span className="lead-overview-value">{lead.menuIdeas || "—"}</span>
            </div>
            <div className="lead-overview-row">
              <span className="lead-overview-label">Special Requests</span>
              <span className="lead-overview-value">{lead.specialRequests || "—"}</span>
            </div>
          </section>

          <section className="lead-overview-section lead-overview-notes-full" style={{ borderColor: s.notes.border }}>
            <h3 style={{ color: s.notes.accent }}>Lead Notes Timeline</h3>
            <div className="lead-overview-notes-add">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="lead-overview-textarea"
                rows={1}
                placeholder="Add a new note…"
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={!newNote.trim() || saving}
                className="lead-overview-btn-secondary"
              >
                Add Note
              </button>
            </div>
            <div className="lead-overview-timeline">
              {timelineEntries.length > 0 ? (
                timelineEntries.map((entry, i) => (
                  <div key={i} className="lead-overview-note-item">
                    <strong>{entry.date || "—"}</strong>
                    {entry.date && entry.text ? " – " : ""}
                    {entry.text}
                  </div>
                ))
              ) : (
                <div className="lead-overview-empty">No notes yet.</div>
              )}
            </div>
          </section>

          <section className="lead-overview-actions">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="lead-overview-btn-secondary"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleConvertToEvent}
              disabled={converting}
              className="lead-overview-btn-convert"
            >
              {converting ? "Converting…" : "Convert To Event"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
