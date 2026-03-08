import { useState } from "react";
import { isDelivery, isPickup } from "../../lib/deliveryHelpers";

/* ── Health light colors ── */
const HEALTH_COLORS = {
  green:  { bg: "#22c55e", glow: "rgba(34,197,94,0.6)",  label: "On Track" },
  yellow: { bg: "#eab308", glow: "rgba(234,179,8,0.6)",  label: "Watch" },
  red:    { bg: "#ef4444", glow: "rgba(239,68,68,0.6)",  label: "At Risk" },
} as const;

/* ── Event-type pill palette ── */
const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Wedding:     { bg: "rgba(217,155,102,0.15)", text: "#d99b66", border: "rgba(217,155,102,0.35)" },
  Corporate:   { bg: "rgba(0,188,212,0.12)",   text: "#4dd0e1", border: "rgba(0,188,212,0.3)" },
  Social:      { bg: "rgba(168,85,247,0.12)",  text: "#c084fc", border: "rgba(168,85,247,0.3)" },
  Tasting:     { bg: "rgba(239,68,68,0.12)",   text: "#f87171", border: "rgba(239,68,68,0.3)" },
  Celebration: { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  Fundraiser:  { bg: "rgba(34,197,94,0.12)",   text: "#4ade80", border: "rgba(34,197,94,0.3)" },
  default:     { bg: "rgba(204,0,0,0.12)",     text: "#ff9999", border: "rgba(204,0,0,0.25)" },
};

export type ViewMode = "owner" | "foh" | "boh";
export type HealthStatus = "green" | "yellow" | "red";

export interface EventCardProps {
  eventName: string;
  dateTime: string;
  eventType: string;
  client: string;
  venue: string;
  guests: number;
  healthLightFOH: HealthStatus;
  healthLightBOH: HealthStatus;
  viewMode: ViewMode;
  onClick?: () => void;
}

/* ── Animated Health Dot ── */
function HealthDot({ status, label }: { status: HealthStatus; label: string }) {
  const c = HEALTH_COLORS[status];
  return (
    <div className="flex items-center gap-2">
      <span
        className="relative flex h-3 w-3"
        title={`${label}: ${c.label}`}
      >
        {/* pulse ring */}
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
          style={{ backgroundColor: c.bg }}
        />
        {/* solid dot */}
        <span
          className="relative inline-flex h-3 w-3 rounded-full"
          style={{
            backgroundColor: c.bg,
            boxShadow: `0 0 8px ${c.glow}, 0 0 16px ${c.glow}`,
          }}
        />
      </span>
      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

/* ── Main Event Card ── */
export function EventCard({
  eventName,
  dateTime,
  eventType,
  client,
  venue,
  guests,
  healthLightFOH,
  healthLightBOH,
  viewMode,
  onClick,
}: EventCardProps) {
  const [hovered, setHovered] = useState(false);
  const pill = TYPE_COLORS[eventType] ?? TYPE_COLORS.default;
  const outlineType = isDelivery(eventType) ? "delivery" : isPickup(eventType) ? "pickup" : "full-service";
  const borderColor = outlineType === "delivery" ? "#eab308" : outlineType === "pickup" ? "#a855f7" : "#6b7280";
  const glowColor = outlineType === "delivery" ? "rgba(234,179,8,0.3)" : outlineType === "pickup" ? "rgba(168,85,247,0.3)" : "rgba(100,100,100,0.2)";

  return (
    <article
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="event-card-premium group cursor-pointer"
      data-outline={outlineType}
      style={{
        background: hovered
          ? "linear-gradient(135deg, rgba(55,55,55,0.95), rgba(40,40,40,0.85))"
          : "linear-gradient(135deg, rgba(45,45,45,0.85), rgba(35,35,35,0.65))",
        border: `2px solid ${hovered ? (outlineType === "delivery" ? "#facc15" : outlineType === "pickup" ? "#c084fc" : "#9ca3af") : borderColor}`,
        borderRadius: "14px",
        padding: "22px",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.45s cubic-bezier(0.34,1.56,0.64,1)",
        transform: hovered
          ? "translateY(-10px) scale(1.015)"
          : "translateY(0) scale(1)",
        boxShadow: hovered
          ? `0 24px 48px rgba(0,0,0,0.5), 0 0 30px ${glowColor}`
          : `0 12px 28px rgba(0,0,0,0.4), 0 0 12px ${glowColor}`,
        backdropFilter: "blur(8px)",
      }}
    >
      {/* ── Neon edge glow (top) ── */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${outlineType === "delivery" ? "rgba(234,179,8,0.6)" : outlineType === "pickup" ? "rgba(168,85,247,0.6)" : "rgba(150,150,150,0.6)"}, transparent)`,
          opacity: hovered ? 1 : 0.4,
          transition: "opacity 0.4s ease",
        }}
      />

      {/* ── Corner accent ── */}
      <div
        className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
        style={{
          background: `linear-gradient(225deg, ${outlineType === "delivery" ? "rgba(234,179,8,0.08)" : outlineType === "pickup" ? "rgba(168,85,247,0.08)" : "rgba(120,120,120,0.08)"} 0%, transparent 60%)`,
        }}
      />

      {/* ── Header: Name + DateTime ── */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3
            className="text-[15px] font-bold text-white truncate tracking-wide"
            style={{
              textShadow: hovered
                ? "0 0 12px rgba(255,255,255,0.15)"
                : "none",
              transition: "text-shadow 0.3s ease",
            }}
          >
            {eventName}
          </h3>
          <p className="text-[12px] font-semibold mt-0.5" style={{ color: "#9ca3af" }}>
            {dateTime}
          </p>
        </div>
        <div className="text-gray-600 text-lg cursor-pointer hover:text-gray-400 transition-colors">
          &#x22EE;
        </div>
      </div>

      {/* ── Event Type Pill ── */}
      <span
        className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase mb-4"
        style={{
          backgroundColor: pill.bg,
          color: pill.text,
          border: `1px solid ${pill.border}`,
        }}
      >
        {eventType}
      </span>

      {/* ── Detail Rows ── */}
      <div className="space-y-1.5 mb-4">
        <DetailRow label="Client" value={client} />
        <DetailRow label="Venue" value={venue} />
        <DetailRow label="Guests" value={String(guests)} />
      </div>

      {/* ── Health Lights ── */}
      <div
        className="flex items-center gap-4 pt-3"
        style={{ borderTop: `1px solid ${outlineType === "delivery" ? "rgba(234,179,8,0.25)" : outlineType === "pickup" ? "rgba(168,85,247,0.25)" : "rgba(120,120,120,0.25)"}` }}
      >
        {(viewMode === "owner" || viewMode === "foh") && (
          <HealthDot status={healthLightFOH} label="FOH" />
        )}
        {(viewMode === "owner" || viewMode === "boh") && (
          <HealthDot status={healthLightBOH} label="BOH" />
        )}
      </div>

      {/* ── Bottom neon edge ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${outlineType === "delivery" ? "rgba(234,179,8,0.5)" : outlineType === "pickup" ? "rgba(168,85,247,0.5)" : "rgba(120,120,120,0.5)"}, transparent)`,
          opacity: hovered ? 1 : 0.3,
          transition: "opacity 0.4s ease",
        }}
      />
    </article>
  );
}

/* ── Small detail row helper ── */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center text-[12px]">
      <span className="text-gray-500 font-medium w-16">{label}</span>
      <span className="text-gray-200 font-semibold truncate">{value}</span>
    </div>
  );
}
