import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useEventStore } from "../state/eventStore";

type ViewMode = "owner" | "foh" | "boh";

type EventListItem = {
  id: string;
  eventName: string;
  eventDate?: string;
  eventType?: string;
  serviceStyle?: string;
  guestCount?: number | string;
};

const VIEW_CONFIG = {
  owner: { label: "Owner (Nick)", icon: "👑", color: "#d99b66", glow: "rgba(217,155,102,0.5)" },
  foh:   { label: "Front of House", icon: "🎯", color: "#4dd0e1", glow: "rgba(0,188,212,0.5)" },
  boh:   { label: "Back of House", icon: "🔥", color: "#ff6b6b", glow: "rgba(239,68,68,0.5)" },
} as const;

const ACTION_BUTTONS = [
  { icon: "📋", label: "Spec Food Items", path: (id: string) => `/spec-engine/${id}` },
  { icon: "🖨️", label: "Print BEO",       path: (id: string) => `/beo-print/${id}` },
  { icon: "💰", label: "Profit Margin",    path: (id: string) => `/profit/${id}` },
  { icon: "🚦", label: "Health Light",     path: (id: string) => `/health/${id}` },
  { icon: "📝", label: "BEO Intake",       path: (id: string) => `/beo-intake/${id}` },
];

const Watchtower = () => {
  const { selectedEventId, setSelectedEventId, eventData, events, eventsLoading } = useEventStore() as {
    selectedEventId: string | null;
    setSelectedEventId: React.Dispatch<React.SetStateAction<string | null>>;
    eventData: Record<string, any>;
    events: EventListItem[];
    eventsLoading: boolean;
  };
  const [viewMode, setViewMode] = useState<ViewMode>("owner");
  const activeView = VIEW_CONFIG[viewMode];

  const selectedEvent: EventListItem | null = selectedEventId
    ? events.find((e) => e.id === selectedEventId) || null
    : null;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a0808 40%, #0f0a15 100%)" }}
    >
      {/* ── Ambient glows ── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 25% 20%, rgba(204,0,0,0.08) 0%, transparent 60%), radial-gradient(ellipse at 75% 80%, rgba(0,188,212,0.06) 0%, transparent 60%)",
      }} />

      {/* ── Top bar ── */}
      <header
        className="relative z-10 flex items-center justify-between px-8 py-4"
        style={{
          background: "linear-gradient(180deg, rgba(15,8,8,0.9), rgba(10,5,10,0.6))",
          borderBottom: "1px solid rgba(204,0,0,0.2)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link
          to="/"
          className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors duration-300"
        >
          <div
            className="w-8 h-8 flex items-center justify-center rounded-sm flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #cc0000, #ff3333)",
              transform: "rotate(45deg)",
              boxShadow: "0 0 14px rgba(204,0,0,0.4)",
            }}
          >
            <span className="text-white font-bold text-sm" style={{ transform: "rotate(-45deg)" }}>F</span>
          </div>
          <span className="text-xs font-semibold tracking-widest uppercase">Dashboard</span>
        </Link>

        {/* View mode toggles */}
        <div className="flex items-center gap-2">
          {(["owner", "foh", "boh"] as ViewMode[]).map((mode) => {
            const cfg = VIEW_CONFIG[mode];
            const isActive = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${cfg.glow.replace("0.5", "0.2")}, ${cfg.glow.replace("0.5", "0.06")})`
                    : "rgba(255,255,255,0.03)",
                  border: isActive ? `1px solid ${cfg.glow}` : "1px solid rgba(255,255,255,0.06)",
                  color: isActive ? cfg.color : "#555",
                  boxShadow: isActive ? `0 0 16px ${cfg.glow.replace("0.5", "0.2")}` : "none",
                }}
              >
                {cfg.icon} {mode === "owner" ? "Nick" : mode.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Active view badge */}
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: activeView.color, boxShadow: `0 0 8px ${activeView.glow}` }}
          />
          <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: activeView.color }}>
            {activeView.label}
          </span>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <div className="relative z-10 flex flex-col items-center pt-16 pb-10">
        {/* Pulsing diamond icon */}
        <div
          className="w-20 h-20 flex items-center justify-center mb-6"
          style={{
            background: "linear-gradient(135deg, #00bcd4, #4dd0e1)",
            transform: "rotate(45deg)",
            boxShadow: "0 0 50px rgba(0,188,212,0.6), 0 0 100px rgba(0,188,212,0.2)",
            animation: "diamond-pulse 3s ease-in-out infinite",
          }}
        >
          <span className="text-2xl" style={{ transform: "rotate(-45deg)" }}>👁️</span>
        </div>

        <h1
          className="text-3xl font-black tracking-wider mb-2"
          style={{
            background: "linear-gradient(135deg, #ffffff, #cc0000)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "none",
          }}
        >
          PAPA CHULO
        </h1>
        <p
          className="text-sm font-semibold tracking-[0.3em] uppercase mb-1"
          style={{ color: "#00bcd4" }}
        >
          WATCHTOWER
        </p>
        <p className="text-xs text-gray-600 mt-1">Command & Control Center</p>
      </div>

      {/* ── Event Picker ── */}
      <div className="relative z-10 flex justify-center mb-12">
        <div
          className="w-full max-w-lg rounded-xl p-6"
          style={{
            background: "linear-gradient(135deg, rgba(25,10,10,0.9), rgba(18,8,14,0.7))",
            border: "1px solid rgba(0,188,212,0.2)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,188,212,0.08)",
            backdropFilter: "blur(10px)",
          }}
        >
          <label className="block text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase mb-3">
            SELECT EVENT
          </label>
          <select
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold outline-none transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(40,15,15,0.8), rgba(30,10,18,0.6))",
              border: "1px solid rgba(204,0,0,0.3)",
              color: selectedEventId ? "#fff" : "#888",
              boxShadow: "inset 0 2px 6px rgba(0,0,0,0.3)",
            }}
            value={selectedEventId ?? ""}
            onChange={(e) => {
              if (e.target.value) setSelectedEventId(e.target.value as any);
            }}
            disabled={eventsLoading}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,188,212,0.6)";
              e.currentTarget.style.boxShadow = "inset 0 2px 6px rgba(0,0,0,0.3), 0 0 12px rgba(0,188,212,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(204,0,0,0.3)";
              e.currentTarget.style.boxShadow = "inset 0 2px 6px rgba(0,0,0,0.3)";
            }}
          >
            <option value="">{eventsLoading ? "Loading events..." : "— Choose an event —"}</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>{evt.eventName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Selected Event Panel ── */}
      {selectedEventId && selectedEvent && (
        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
          {/* Event info card */}
          <div
            className="rounded-xl p-8 mb-8"
            style={{
              background: "linear-gradient(135deg, rgba(28,10,10,0.9), rgba(20,8,16,0.7))",
              border: "1px solid rgba(0,188,212,0.25)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 24px rgba(0,188,212,0.1)",
            }}
          >
            {/* Top neon line */}
            <div
              className="absolute top-0 left-8 right-8 h-[1px]"
              style={{ background: "linear-gradient(90deg, transparent, rgba(0,188,212,0.5), transparent)" }}
            />

            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{selectedEvent.eventName}</h2>
                <div className="flex items-center gap-4 text-sm">
                  {selectedEvent.eventDate && (
                    <span style={{ color: "#cc0000" }} className="font-semibold">{selectedEvent.eventDate}</span>
                  )}
                  {selectedEvent.eventType && (
                    <span
                      className="px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        background: "rgba(0,188,212,0.12)",
                        color: "#4dd0e1",
                        border: "1px solid rgba(0,188,212,0.3)",
                      }}
                    >
                      {selectedEvent.eventType}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedEventId(null as any)}
                className="text-gray-600 hover:text-white transition-colors text-lg px-2"
              >
                ✕
              </button>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <QuickStat label="Service" value={selectedEvent.serviceStyle || "—"} />
              <QuickStat label="Guests" value={String(selectedEvent.guestCount || "—")} />
              <QuickStat label="View Mode" value={activeView.label} accent={activeView.color} />
            </div>

            {/* Separator */}
            <div
              className="h-px mb-6"
              style={{ background: "linear-gradient(90deg, transparent, rgba(204,0,0,0.25), transparent)" }}
            />

            {/* Action buttons grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ACTION_BUTTONS.map((btn) => (
                <Link
                  key={btn.label}
                  to={btn.path(selectedEventId)}
                  className="group flex items-center gap-3 rounded-lg px-5 py-4 transition-all duration-300"
                  style={{
                    background: "linear-gradient(135deg, rgba(40,15,15,0.6), rgba(30,10,18,0.4))",
                    border: "1px solid rgba(204,0,0,0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(204,0,0,0.5)";
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(204,0,0,0.15), rgba(60,15,20,0.5))";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(204,0,0,0.15), 0 0 12px rgba(204,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(204,0,0,0.2)";
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(40,15,15,0.6), rgba(30,10,18,0.4))";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span className="text-xl">{btn.icon}</span>
                  <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                    {btn.label}
                  </span>
                </Link>
              ))}

              {/* Airtable link */}
              <a
                href={`https://airtable.com/${selectedEventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-lg px-5 py-4 transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, rgba(40,15,15,0.6), rgba(30,10,18,0.4))",
                  border: "1px solid rgba(204,0,0,0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(204,0,0,0.5)";
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(204,0,0,0.15), rgba(60,15,20,0.5))";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(204,0,0,0.15), 0 0 12px rgba(204,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(204,0,0,0.2)";
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(40,15,15,0.6), rgba(30,10,18,0.4))";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span className="text-xl">📁</span>
                <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                  Open in Airtable
                </span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!selectedEventId && (
        <div className="relative z-10 flex flex-col items-center mt-4">
          <div className="flex items-center gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{
                  background: i === 0 ? "#22c55e" : i === 1 ? "#eab308" : "#ef4444",
                  boxShadow: `0 0 12px ${i === 0 ? "rgba(34,197,94,0.5)" : i === 1 ? "rgba(234,179,8,0.5)" : "rgba(239,68,68,0.5)"}`,
                  animation: `pulse-light ${2 + i * 0.3}s ease-in-out infinite`,
                }}
              />
            ))}
          </div>
          <p className="text-xs text-gray-700 mt-4 tracking-wider">Awaiting event selection...</p>
        </div>
      )}

      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes diamond-pulse {
          0%, 100% { box-shadow: 0 0 50px rgba(0,188,212,0.6), 0 0 100px rgba(0,188,212,0.2); }
          50%      { box-shadow: 0 0 70px rgba(0,188,212,0.8), 0 0 120px rgba(0,188,212,0.3); }
        }
        @keyframes pulse-light {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};

/* ── Quick stat helper ── */
function QuickStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      className="rounded-lg px-4 py-3"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <p className="text-[10px] text-gray-600 font-bold tracking-[0.15em] uppercase mb-1">{label}</p>
      <p className="text-sm font-bold" style={{ color: accent || "#ccc" }}>{value}</p>
    </div>
  );
}

export default Watchtower;
