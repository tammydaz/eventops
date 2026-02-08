import { useState } from "react";

export interface TicketProps {
  id: number;
  eventName: string;
  eventDate: string;
  clientName: string;
  guestCount: number;
  fohHealth: "green" | "yellow" | "red";
  rentalsStatus: "ok" | "pending";
  signatureDrinkStatus: "done" | "pending";
  dietaryStatus: "ok" | "pending";
  timelineStatus: "ok" | "pending";
}

/* ── Health config ── */
const HEALTH = {
  green:  { bg: "#22c55e", glow: "rgba(34,197,94,0.6)",  label: "On Track",  ring: "rgba(34,197,94,0.25)" },
  yellow: { bg: "#eab308", glow: "rgba(234,179,8,0.6)",  label: "Watch",     ring: "rgba(234,179,8,0.25)" },
  red:    { bg: "#ef4444", glow: "rgba(239,68,68,0.6)",  label: "At Risk",   ring: "rgba(239,68,68,0.25)" },
} as const;

/* ── Status icon helper ── */
function StatusChip({ label, status }: { label: string; status: "ok" | "done" | "pending" }) {
  const isDone = status === "ok" || status === "done";
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200"
      style={{
        background: isDone ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
        border: isDone ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(239,68,68,0.2)",
        color: isDone ? "#4ade80" : "#f87171",
      }}
    >
      <span className="text-xs">{isDone ? "✓" : "○"}</span>
      {label}
    </div>
  );
}

export default function EventTicketCard(props: TicketProps) {
  const [hovered, setHovered] = useState(false);
  const h = HEALTH[props.fohHealth];

  /* Format date nicely */
  const dateObj = new Date(props.eventDate + "T00:00:00");
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
  const monthDay = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative cursor-pointer"
      style={{
        background: hovered
          ? "linear-gradient(135deg, rgba(40,15,15,0.95), rgba(30,12,22,0.85))"
          : "linear-gradient(135deg, rgba(28,10,10,0.85), rgba(22,8,16,0.65))",
        border: `2px solid ${hovered ? "rgba(0,188,212,0.6)" : "rgba(0,188,212,0.25)"}`,
        borderRadius: 14,
        padding: "22px 24px",
        overflow: "hidden",
        transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        transform: hovered ? "translateY(-8px) scale(1.01)" : "translateY(0) scale(1)",
        boxShadow: hovered
          ? `0 20px 48px rgba(0,0,0,0.5), 0 0 30px rgba(0,188,212,0.2), 0 0 60px ${h.ring}`
          : `0 10px 28px rgba(0,0,0,0.4), 0 0 14px rgba(0,188,212,0.1)`,
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Top neon line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${h.glow}, transparent)`,
          opacity: hovered ? 1 : 0.3,
          transition: "opacity 0.4s ease",
        }}
      />

      {/* ── Header row: Name + Health light ── */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-[16px] font-bold text-white truncate tracking-wide leading-tight">
            {props.eventName}
          </h3>
          <p className="text-[12px] font-semibold mt-1" style={{ color: "#cc0000" }}>
            {dayName} • {monthDay}
          </p>
        </div>

        {/* Animated health dot */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
          <div className="relative">
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ backgroundColor: h.bg, opacity: 0.3 }}
            />
            <span
              className="relative block w-4 h-4 rounded-full"
              style={{ backgroundColor: h.bg, boxShadow: `0 0 10px ${h.glow}, 0 0 20px ${h.glow}` }}
            />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: h.bg }}>
            {h.label}
          </span>
        </div>
      </div>

      {/* ── Client + Guests ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-[12px]">
          <span className="text-gray-500 font-medium">Client </span>
          <span className="text-gray-200 font-semibold">{props.clientName}</span>
        </div>
        <div
          className="px-3 py-1 rounded-full text-[11px] font-bold"
          style={{
            background: "rgba(217,155,102,0.1)",
            border: "1px solid rgba(217,155,102,0.25)",
            color: "#d99b66",
          }}
        >
          {props.guestCount} guests
        </div>
      </div>

      {/* ── Separator ── */}
      <div
        className="h-px mb-4"
        style={{ background: "linear-gradient(90deg, transparent, rgba(204,0,0,0.15), transparent)" }}
      />

      {/* ── Status chips ── */}
      <div className="grid grid-cols-2 gap-2">
        <StatusChip label="Rentals" status={props.rentalsStatus} />
        <StatusChip label="Sig. Drink" status={props.signatureDrinkStatus} />
        <StatusChip label="Dietary" status={props.dietaryStatus} />
        <StatusChip label="Timeline" status={props.timelineStatus} />
      </div>

      {/* Bottom neon line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(204,0,0,0.35), transparent)",
          opacity: hovered ? 1 : 0.2,
          transition: "opacity 0.4s ease",
        }}
      />
    </article>
  );
}
