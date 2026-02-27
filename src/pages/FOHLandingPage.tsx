import { useState } from "react";
import { Link } from "react-router-dom";
import EventTicketCard from "../components/foh/EventTicketCard";
import DepartmentRing from "../components/foh/DepartmentRing";
import type { TicketProps } from "../components/foh/EventTicketCard";

/* ═══════════════════════════════════════════
   DEMO TICKET DATA — UI ONLY
   ═══════════════════════════════════════════ */
const TICKETS: TicketProps[] = [
  {
    id: 1,
    eventName: "Black Tie Gala",
    eventDate: "2026-02-08",
    clientName: "Disruptive Technologies LLC",
    guestCount: 180,
    fohHealth: "green",
    rentalsStatus: "ok",
    signatureDrinkStatus: "done",
    dietaryStatus: "pending",
    timelineStatus: "ok",
  },
  {
    id: 2,
    eventName: "Farm-to-Table Brunch",
    eventDate: "2026-02-08",
    clientName: "Green Acres Org",
    guestCount: 54,
    fohHealth: "yellow",
    rentalsStatus: "pending",
    signatureDrinkStatus: "pending",
    dietaryStatus: "ok",
    timelineStatus: "ok",
  },
  {
    id: 3,
    eventName: "Holloway Wedding",
    eventDate: "2026-02-09",
    clientName: "Mia Holloway",
    guestCount: 180,
    fohHealth: "green",
    rentalsStatus: "ok",
    signatureDrinkStatus: "done",
    dietaryStatus: "ok",
    timelineStatus: "ok",
  },
  {
    id: 4,
    eventName: "Corporate Awards Dinner",
    eventDate: "2026-02-10",
    clientName: "Apex Digital",
    guestCount: 320,
    fohHealth: "red",
    rentalsStatus: "pending",
    signatureDrinkStatus: "pending",
    dietaryStatus: "pending",
    timelineStatus: "pending",
  },
  {
    id: 5,
    eventName: "Rivera Quinceañera",
    eventDate: "2026-02-11",
    clientName: "Rivera Family",
    guestCount: 200,
    fohHealth: "yellow",
    rentalsStatus: "ok",
    signatureDrinkStatus: "done",
    dietaryStatus: "pending",
    timelineStatus: "ok",
  },
  {
    id: 6,
    eventName: "Chef's Tasting Night",
    eventDate: "2026-02-12",
    clientName: "FoodWerx VIP",
    guestCount: 30,
    fohHealth: "green",
    rentalsStatus: "ok",
    signatureDrinkStatus: "done",
    dietaryStatus: "ok",
    timelineStatus: "ok",
  },
];

/* ── Quick stat helper ── */
function getStats(tickets: TicketProps[]) {
  let green = 0, yellow = 0, red = 0;
  for (const t of tickets) {
    if (t.fohHealth === "green") green++;
    else if (t.fohHealth === "yellow") yellow++;
    else red++;
  }
  const guests = tickets.reduce((s, t) => s + t.guestCount, 0);
  return { total: tickets.length, green, yellow, red, guests };
}

/* ═══════════════════════════════════════════
   FOH LANDING PAGE
   ═══════════════════════════════════════════ */
export default function FOHLandingPage() {
  const [showTenDay, setShowTenDay] = useState(false);
  const stats = getStats(TICKETS);

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a0808 40%, #0f0a15 100%)" }}
    >
      {/* ── Ambient glow ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(204,0,0,0.06) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(0,188,212,0.04) 0%, transparent 55%)",
        }}
      />

      {/* ═══ HEADER ═══ */}
      <header
        className="relative z-10 flex items-center justify-between px-8 py-5"
        style={{
          background: "linear-gradient(180deg, rgba(15,8,8,0.95), rgba(10,5,10,0.7))",
          borderBottom: "1px solid rgba(204,0,0,0.2)",
          backdropFilter: "blur(14px)",
        }}
      >
        {/* Left: Back + Title */}
        <div className="flex items-center gap-5">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-gray-500 hover:text-white transition-colors duration-300"
          >
            <div
              className="w-8 h-8 flex items-center justify-center rounded-sm flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #cc0000, #ff3333)",
                transform: "rotate(45deg)",
                boxShadow: "0 0 14px rgba(204,0,0,0.35)",
              }}
            >
              <span className="text-white font-bold text-sm" style={{ transform: "rotate(-45deg)" }}>F</span>
            </div>
          </Link>
          <div>
            <h1
              className="text-xl font-black tracking-wide"
              style={{ color: "#ff6b6b", textShadow: "0 0 20px rgba(204,0,0,0.25)" }}
            >
              FOH Dashboard
            </h1>
            <p className="text-[10px] text-gray-600 font-semibold tracking-[0.2em] uppercase">
              Front of House Command
            </p>
          </div>
        </div>

        {/* Center: Quick stats */}
        <div className="hidden md:flex items-center gap-5 text-[11px] font-semibold">
          <span className="text-gray-500">{stats.total} Events</span>
          <span className="text-gray-700">|</span>
          <span className="text-gray-500">{stats.guests.toLocaleString()} Guests</span>
          <span className="text-gray-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" style={{ boxShadow: "0 0 6px rgba(34,197,94,0.5)" }} />
            <span className="text-green-500">{stats.green}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500" style={{ boxShadow: "0 0 6px rgba(234,179,8,0.5)" }} />
            <span className="text-yellow-500">{stats.yellow}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" style={{ boxShadow: "0 0 6px rgba(239,68,68,0.5)" }} />
            <span className="text-red-500">{stats.red}</span>
          </div>
        </div>

        {/* Right: Upload Invoice + 10-Day */}
        <div className="flex items-center gap-3">
          <Link
            to="/invoice-intake"
            className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300"
            style={{
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.4)",
              color: "#4ade80",
              textDecoration: "none",
            }}
          >
            📄 Upload Invoice
          </Link>
          <button
          onClick={() => setShowTenDay(!showTenDay)}
          className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300"
          style={{
            background: showTenDay
              ? "linear-gradient(135deg, rgba(217,155,102,0.2), rgba(217,155,102,0.06))"
              : "rgba(255,255,255,0.03)",
            border: showTenDay
              ? "1px solid rgba(217,155,102,0.5)"
              : "1px solid rgba(217,155,102,0.25)",
            color: "#d99b66",
            boxShadow: showTenDay ? "0 0 16px rgba(217,155,102,0.15)" : "0 4px 12px rgba(0,0,0,0.3)",
          }}
          onMouseEnter={(e) => {
            if (!showTenDay) {
              e.currentTarget.style.boxShadow = "0 0 16px rgba(255,107,107,0.15), 0 4px 16px rgba(0,0,0,0.4)";
              e.currentTarget.style.transform = "scale(1.04)";
            }
          }}
          onMouseLeave={(e) => {
            if (!showTenDay) {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
              e.currentTarget.style.transform = "scale(1)";
            }
          }}
        >
          {showTenDay ? "← Back to Today" : "View 10-Day Panel →"}
        </button>
        </div>
      </header>

      {/* Neon edge */}
      <div
        className="relative z-10 h-px"
        style={{ background: "linear-gradient(90deg, transparent 10%, rgba(0,188,212,0.3), rgba(204,0,0,0.2), transparent 90%)" }}
      />

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="relative z-10 flex-1 px-6 pt-8 pb-6 overflow-y-auto">
        {/* Section title */}
        <div className="max-w-7xl mx-auto mb-6 flex items-center gap-4">
          <h2
            className="text-sm font-bold uppercase tracking-[0.15em]"
            style={{
              color: showTenDay ? "#d99b66" : "#ff6b6b",
              textShadow: `0 0 10px ${showTenDay ? "rgba(217,155,102,0.2)" : "rgba(204,0,0,0.2)"}`,
            }}
          >
            {showTenDay ? "10-Day Horizon" : "Today's Tickets"}
          </h2>
          <div
            className="flex-1 h-px"
            style={{
              background: `linear-gradient(90deg, ${showTenDay ? "rgba(217,155,102,0.3)" : "rgba(204,0,0,0.3)"}, transparent 60%)`,
            }}
          />
        </div>

        {/* Ticket grid */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 max-w-7xl mx-auto">
          {TICKETS.map((ticket) => (
            <EventTicketCard key={ticket.id} {...ticket} />
          ))}
        </div>
      </main>

      {/* ═══ DEPARTMENT RING ═══ */}
      <div className="relative z-10">
        <DepartmentRing />
      </div>
    </div>
  );
}
