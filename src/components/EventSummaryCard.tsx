import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useEventStore } from "../state/eventStore";
import { HealthLightModal } from "./HealthLightModal";

type EventRecord = Record<string, any>;

function asLabel(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "object" && v != null && "name" in v) return (v as { name: string }).name;
  return String(v);
}

function hasVal(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string" && v.trim() === "") return false;
  return true;
}

// TODO: Derive from Airtable when FOH/BOH health fields exist. Placeholder: default green, no problems.
function getFohProblems(_evt: EventRecord): { id: string; text: string }[] {
  return [];
}
function getBohProblems(_evt: EventRecord): { id: string; text: string }[] {
  return [];
}

type EventSummaryCardProps = {
  event: EventRecord;
  showSidePanel?: boolean;
  onEditEvent?: (evt: EventRecord) => void;
  onEmailClient?: (evt: EventRecord) => void;
  onPreviewPrintBeo?: (eventId: string) => void;
  onAddAnotherEvent?: (evt: EventRecord) => void;
};

export function EventSummaryCard({
  event,
  showSidePanel = true,
  onEditEvent,
  onEmailClient,
  onPreviewPrintBeo,
  onAddAnotherEvent,
}: EventSummaryCardProps) {
  const { openBeoPreview } = useEventStore();
  const [healthModal, setHealthModal] = useState<{ type: "foh" | "boh" } | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const name = event["Event Name"] ?? "(Untitled Event)";
  const date = event["Event Date"];
  const eventType = asLabel(event["Event Type"]);
  const serviceStyle = asLabel(event["Service Style"]);
  const guestCount = event["Guest Count"];
  const venue = event["Venue"] ?? event["fldtCOxi4Axjfjt0V"];
  // TODO: Map Airtable fields to FOH/BOH health when available. Placeholder.
  const fohProblems = getFohProblems(event);
  const bohProblems = getBohProblems(event);
  const fohStatus = fohProblems.length === 0 ? "green" : fohProblems.length > 2 ? "red" : "yellow";
  const bohStatus = bohProblems.length === 0 ? "green" : bohProblems.length > 2 ? "red" : "yellow";
  // TODO: Critical Alerts / Time-Sensitive Warnings from event or linked logic.
  const criticalAlerts: string[] = [];
  const timeWarnings: string[] = [];

  const card = (
    <div
      className="event-summary-card"
      style={{
        position: "relative",
        background: "linear-gradient(135deg, rgba(30,10,10,0.85), rgba(25,10,15,0.75))",
        border: "2px solid rgba(0,188,212,0.35)",
        borderRadius: "12px",
        padding: "20px",
        backdropFilter: "blur(8px)",
      }}
      onMouseEnter={() => showSidePanel && setPanelOpen(true)}
      onMouseLeave={() => setPanelOpen(false)}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 16px", alignItems: "center", marginBottom: "12px" }}>
        {hasVal(name) && (
          <span style={{ fontWeight: "700", fontSize: "18px", color: "#fff" }}>{name}</span>
        )}
        {hasVal(date) && (
          <span style={{ color: "#aaa", fontSize: "14px" }}>
            {new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", marginBottom: "10px" }}>
        {hasVal(eventType) && (
          <span style={{ color: "#b0b0b0", fontSize: "13px" }}><strong>Event Type:</strong> {eventType}</span>
        )}
        {hasVal(serviceStyle) && (
          <span style={{ color: "#b0b0b0", fontSize: "13px" }}><strong>Service Style:</strong> {serviceStyle}</span>
        )}
        {hasVal(guestCount) && (
          <span style={{ color: "#b0b0b0", fontSize: "13px" }}><strong>Guest Count:</strong> {guestCount}</span>
        )}
        {hasVal(venue) && (
          <span style={{ color: "#b0b0b0", fontSize: "13px" }}><strong>Venue:</strong> {venue}</span>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px", alignItems: "center" }}>
        <button
          type="button"
          className="health-pill-foh"
          style={{ cursor: "pointer", border: "none" }}
          onClick={() => setHealthModal({ type: "foh" })}
          title="FOH Health"
        >
          FOH
        </button>
        <button
          type="button"
          className="health-pill-boh"
          style={{ cursor: "pointer", border: "none" }}
          onClick={() => setHealthModal({ type: "boh" })}
          title="BOH Health"
        >
          BOH
        </button>
      </div>
      {criticalAlerts.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <span className="health-pill-critical" style={{ marginRight: "6px" }}>Critical</span>
          {criticalAlerts.map((a, i) => (
            <span key={i} style={{ color: "#ef5350", fontSize: "12px", marginRight: "8px" }}>{a}</span>
          ))}
        </div>
      )}
      {timeWarnings.length > 0 && (
        <div style={{ marginTop: "6px" }}>
          <span className="health-pill-warning" style={{ marginRight: "6px" }}>Warning</span>
          {timeWarnings.map((w, i) => (
            <span key={i} style={{ color: "#ffca28", fontSize: "12px", marginRight: "8px" }}>{w}</span>
          ))}
        </div>
      )}

      {showSidePanel && panelOpen && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "200px",
            background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.6))",
            borderRadius: "0 12px 12px 0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "6px",
            padding: "12px",
          }}
          onMouseEnter={() => setPanelOpen(true)}
          onMouseLeave={() => setPanelOpen(false)}
        >
          <Link
            to={`/beo-intake/${event.id}`}
            style={{ ...actionBtnStyle, textDecoration: "none", color: "#fff" }}
            onClick={() => onEditEvent?.(event)}
          >
            Edit Event
          </Link>
          <button type="button" style={actionBtnStyle} onClick={() => onEmailClient?.(event)}>
            Email Client
          </button>
          <button type="button" style={actionBtnStyle} onClick={() => openBeoPreview(event.id)}>
            Preview BEO
          </button>
          <Link to={`/beo-print/${event.id}`} target="_blank" rel="noopener noreferrer" style={{ ...actionBtnStyle, textDecoration: "none", color: "#e0e0e0" }}>
            Print BEO
          </Link>
          <button type="button" style={actionBtnStyle} onClick={() => onAddAnotherEvent?.(event)}>
            Add Another Event
          </button>
        </div>
      )}

      <HealthLightModal
        open={healthModal !== null}
        onClose={() => setHealthModal(null)}
        type={healthModal?.type ?? "foh"}
        eventName={name}
        eventId={event.id}
        problems={healthModal?.type === "boh" ? bohProblems : fohProblems}
      />
    </div>
  );

  return card;
}

const actionBtnStyle: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: "600",
  background: "rgba(255,51,51,0.2)",
  border: "1px solid rgba(255,51,51,0.4)",
  borderRadius: "6px",
  color: "#e0e0e0",
  cursor: "pointer",
  textAlign: "left",
};
