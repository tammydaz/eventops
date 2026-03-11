/**
 * LeadCard — matches Event card style with priority-based glow border.
 * Urgent=red, High=orange, Medium=yellow, Low=green.
 */
import type { LeadListItem } from "../../services/airtable/leads";
import type { FollowUpPriority } from "../../services/airtable/leads";
import "../../pages/DashboardPage.css";

const PRIORITY_GLOW: Record<FollowUpPriority, { border: string; glow: string; neon: string }> = {
  Urgent: { border: "#ef4444", glow: "rgba(239,68,68,0.5)", neon: "rgba(239,68,68,0.6)" },
  High: { border: "#f97316", glow: "rgba(249,115,22,0.5)", neon: "rgba(249,115,22,0.6)" },
  Medium: { border: "#eab308", glow: "rgba(234,179,8,0.5)", neon: "rgba(234,179,8,0.6)" },
  Low: { border: "#22c55e", glow: "rgba(34,197,94,0.5)", neon: "rgba(34,197,94,0.6)" },
};

function formatDate(d?: string): string {
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

type LeadCardProps = {
  lead: LeadListItem;
  onSelect: () => void;
};

export function LeadCard({ lead, onSelect }: LeadCardProps) {
  const priority = lead.followUpPriority ?? "Medium";
  const style = PRIORITY_GLOW[priority] ?? PRIORITY_GLOW.Medium;
  const hasNotes = Boolean((lead.notes ?? lead.fohNotes ?? "").trim());
  const proposalSent = lead.proposalSent === true;

  return (
    <article
      className="dp-card dp-card-clickable dp-card-production"
      data-production={priority.toLowerCase()}
      style={{
        background: `linear-gradient(135deg, rgba(45,45,45,0.85), rgba(35,35,35,0.65))`,
        borderColor: style.border,
        boxShadow: `0 15px 35px rgba(0,0,0,0.4), 0 0 20px ${style.glow}`,
      }}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
    >
      <div className="dp-card-neon-top" style={{ background: `linear-gradient(90deg, transparent, ${style.neon}, transparent)` }} />
      <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6, alignItems: "center" }}>
        {proposalSent && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#22c55e",
              backgroundColor: "rgba(34,197,94,0.2)",
              padding: "2px 8px",
              borderRadius: 6,
              border: "1px solid rgba(34,197,94,0.4)",
            }}
          >
            Proposal Sent
          </span>
        )}
        {hasNotes && (
          <span
            title={lead.fohNotes || lead.notes}
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "rgba(168,85,247,0.35)",
              border: "1px solid rgba(168,85,247,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
            }}
          >
            📝
          </span>
        )}
      </div>
      <div className="dp-card-header dp-card-header-tight">
        <div className="dp-card-client" style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
          {formatDate(lead.inquiryDate)}
        </div>
        <div className="dp-card-name">{lead.leadName}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, alignItems: "center" }}>
        <span
          className="dp-list-pill"
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.85)",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          {lead.leadStatus}
        </span>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
        Next: {formatDate(lead.nextFollowUpDate)}
      </div>
    </article>
  );
}
