import { useState } from "react";
import "./DashboardPage.css";
import { EventCard, type ViewMode, type HealthStatus } from "../components/dashboard/EventCard";
import { DepartmentRing } from "../components/dashboard/DepartmentRing";
import { TenDayPanel } from "../components/dashboard/TenDayPanel";

/* ═══════════════════════════════════════════
   PLACEHOLDER DATA – Today's Events
   ═══════════════════════════════════════════ */
interface PlaceholderEvent {
  id: string;
  eventName: string;
  dateTime: string;
  eventType: string;
  client: string;
  venue: string;
  guests: number;
  healthLightFOH: HealthStatus;
  healthLightBOH: HealthStatus;
}

const TODAYS_EVENTS: PlaceholderEvent[] = [
  {
    id: "evt-1",
    eventName: "Holloway Wedding",
    dateTime: "Saturday • 5:30 PM",
    eventType: "Wedding",
    client: "Mia Holloway",
    venue: "Magnolia Estate",
    guests: 180,
    healthLightFOH: "green",
    healthLightBOH: "green",
  },
  {
    id: "evt-2",
    eventName: "Laurel Corporate Gala",
    dateTime: "Friday • 7:00 PM",
    eventType: "Corporate",
    client: "Laurel Tech",
    venue: "Harbor Hall",
    guests: 240,
    healthLightFOH: "yellow",
    healthLightBOH: "green",
  },
  {
    id: "evt-3",
    eventName: "Ava Bridal Shower",
    dateTime: "Sunday • 11:00 AM",
    eventType: "Social",
    client: "Ava Daniels",
    venue: "Rosewood Loft",
    guests: 60,
    healthLightFOH: "green",
    healthLightBOH: "yellow",
  },
  {
    id: "evt-4",
    eventName: "Chef Preview Dinner",
    dateTime: "Thursday • 6:00 PM",
    eventType: "Tasting",
    client: "FoodWerx VIP",
    venue: "FWX Studio",
    guests: 40,
    healthLightFOH: "red",
    healthLightBOH: "red",
  },
  {
    id: "evt-5",
    eventName: "Donovan Anniversary",
    dateTime: "Saturday • 8:00 PM",
    eventType: "Celebration",
    client: "Donovan Family",
    venue: "Skyline Terrace",
    guests: 120,
    healthLightFOH: "green",
    healthLightBOH: "yellow",
  },
  {
    id: "evt-6",
    eventName: "Civic Fundraiser",
    dateTime: "Wednesday • 7:30 PM",
    eventType: "Fundraiser",
    client: "Civic Partners",
    venue: "Downtown Atrium",
    guests: 300,
    healthLightFOH: "yellow",
    healthLightBOH: "green",
  },
];

/* ── Quick stat counts ── */
function getStats(events: PlaceholderEvent[]) {
  let green = 0, yellow = 0, red = 0;
  for (const e of events) {
    // Worst of the two
    const worst = [e.healthLightFOH, e.healthLightBOH].includes("red")
      ? "red"
      : [e.healthLightFOH, e.healthLightBOH].includes("yellow")
      ? "yellow"
      : "green";
    if (worst === "green") green++;
    else if (worst === "yellow") yellow++;
    else red++;
  }
  return { total: events.length, green, yellow, red, guests: events.reduce((s, e) => s + e.guests, 0) };
}

/* ═══════════════════════════════════════════
   DASHBOARD PAGE
   ═══════════════════════════════════════════ */
export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("owner");
  const [activeTab, setActiveTab] = useState<"today" | "10day">("today");
  const stats = getStats(TODAYS_EVENTS);

  return (
    <div
      className="min-h-screen relative"
      style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #121016 40%, #151515 100%)" }}
    >
      {/* Animated background */}
      <div className="dashboard-bg" />

      {/* ── STICKY HEADER ── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "linear-gradient(180deg, rgba(13,13,13,0.97), rgba(13,13,13,0.85))",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(0,188,212,0.12)",
        }}
      >
        <div className="max-w-[1500px] mx-auto px-6 py-4">
          {/* Top row: branding + view toggles */}
          <div className="flex items-center justify-between mb-3">
            {/* Left: Logo + title */}
            <div className="flex items-center gap-4">
              {/* Diamond logo */}
              <div
                className="w-10 h-10 flex items-center justify-center rounded-sm flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #cc0000, #ff3333)",
                  transform: "rotate(45deg)",
                  boxShadow: "0 0 20px rgba(204,0,0,0.4)",
                }}
              >
                <span
                  className="text-white font-bold text-lg"
                  style={{ transform: "rotate(-45deg)" }}
                >
                  F
                </span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg tracking-wide leading-none">
                  FOODWERX <span style={{ color: "#cc0000" }}>EVENTOPS</span>
                </h1>
                <p className="text-[11px] text-gray-600 font-medium tracking-widest mt-0.5">
                  CATERING COMMAND CENTER
                </p>
              </div>
            </div>

            {/* Right: View mode toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("owner")}
                className={`view-toggle-btn ${viewMode === "owner" ? "active-owner" : ""}`}
              >
                👑 Nick
              </button>
              <button
                onClick={() => setViewMode("foh")}
                className={`view-toggle-btn ${viewMode === "foh" ? "active-foh" : ""}`}
              >
                🎯 FOH
              </button>
              <button
                onClick={() => setViewMode("boh")}
                className={`view-toggle-btn ${viewMode === "boh" ? "active-boh" : ""}`}
              >
                🔥 BOH
              </button>
            </div>
          </div>

          {/* Bottom row: tabs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("today")}
              className={`tab-pill ${activeTab === "today" ? "active" : ""}`}
            >
              Today's Tickets
            </button>
            <button
              onClick={() => setActiveTab("10day")}
              className={`tab-pill ${activeTab === "10day" ? "active" : ""}`}
            >
              10-Day Horizon
            </button>

            {/* Spacer + quick stats */}
            <div className="flex-1" />
            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <span className="text-gray-500">
                {stats.total} Events
              </span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-500">
                {stats.guests.toLocaleString()} Guests
              </span>
              <span className="text-gray-600">|</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" style={{ boxShadow: "0 0 6px rgba(34,197,94,0.5)" }} />
                <span className="text-green-500">{stats.green}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" style={{ boxShadow: "0 0 6px rgba(234,179,8,0.5)" }} />
                <span className="text-yellow-500">{stats.yellow}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" style={{ boxShadow: "0 0 6px rgba(239,68,68,0.5)" }} />
                <span className="text-red-500">{stats.red}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Neon edge line */}
        <div
          className="h-[1px]"
          style={{
            background: "linear-gradient(90deg, transparent 10%, rgba(0,188,212,0.35), rgba(204,0,0,0.25), transparent 90%)",
          }}
        />
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 max-w-[1500px] mx-auto px-6 py-8 dash-scroll">

        {/* ── Stat badges row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatBadge label="Total Events" value={String(stats.total)} accent="#4dd0e1" />
          <StatBadge label="Total Guests" value={stats.guests.toLocaleString()} accent="#d99b66" />
          <StatBadge label="On Track" value={String(stats.green)} accent="#22c55e" />
          <StatBadge label="Needs Attention" value={String(stats.yellow + stats.red)} accent="#ef4444" />
        </div>

        {/* ── Active View ── */}
        <div key={activeTab} className="view-enter">
          {activeTab === "today" ? (
            <>
              {/* Section header */}
              <div className="flex items-center gap-4 mb-6">
                <h2
                  className="text-base font-bold uppercase tracking-[0.15em]"
                  style={{ color: "#ff6b6b", textShadow: "0 0 10px rgba(204,0,0,0.2)" }}
                >
                  Today's Tickets
                </h2>
                <div
                  className="flex-1 h-px"
                  style={{ background: "linear-gradient(90deg, rgba(204,0,0,0.3), transparent 60%)" }}
                />
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {TODAYS_EVENTS.map((evt) => (
                  <EventCard
                    key={evt.id}
                    eventName={evt.eventName}
                    dateTime={evt.dateTime}
                    eventType={evt.eventType}
                    client={evt.client}
                    venue={evt.venue}
                    guests={evt.guests}
                    healthLightFOH={evt.healthLightFOH}
                    healthLightBOH={evt.healthLightBOH}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Section header */}
              <div className="flex items-center gap-4 mb-6">
                <h2
                  className="text-base font-bold uppercase tracking-[0.15em]"
                  style={{ color: "#d99b66", textShadow: "0 0 10px rgba(217,155,102,0.2)" }}
                >
                  10-Day Horizon
                </h2>
                <div
                  className="flex-1 h-px"
                  style={{ background: "linear-gradient(90deg, rgba(217,155,102,0.3), transparent 60%)" }}
                />
              </div>

              <TenDayPanel viewMode={viewMode} />
            </>
          )}
        </div>

        {/* ── Department Ring Footer ── */}
        <div className="mt-16">
          <DepartmentRing />
        </div>
      </main>
    </div>
  );
}

/* ── Stat badge mini component ── */
function StatBadge({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="stat-badge">
      <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p
        className="text-2xl font-bold"
        style={{ color: accent, textShadow: `0 0 10px ${accent}33` }}
      >
        {value}
      </p>
    </div>
  );
}
