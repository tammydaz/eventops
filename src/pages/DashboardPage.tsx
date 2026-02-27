import { useState } from "react";
import { Link } from "react-router-dom";
import "./DashboardPage.css";
import type { ViewMode, HealthStatus } from "../components/dashboard/EventCard";

/* ═══════════════════════════════════════════
   PLACEHOLDER DATA
   ═══════════════════════════════════════════ */
interface EventData {
  id: string;
  name: string;
  time: string;
  client: string;
  venue: string;
  guests: number;
  category: string;
  healthFOH: HealthStatus;
  healthBOH: HealthStatus;
}

const TODAYS_EVENTS: EventData[] = [
  { id: "evt-1", name: "Holloway Wedding",      time: "Saturday • 5:30 PM",  client: "Mia Holloway",   venue: "Magnolia Estate",   guests: 180, category: "Wedding",     healthFOH: "green",  healthBOH: "green" },
  { id: "evt-2", name: "Laurel Corporate Gala",  time: "Friday • 7:00 PM",   client: "Laurel Tech",    venue: "Harbor Hall",        guests: 240, category: "Corporate",   healthFOH: "yellow", healthBOH: "green" },
  { id: "evt-3", name: "Ava Bridal Shower",      time: "Sunday • 11:00 AM",  client: "Ava Daniels",    venue: "Rosewood Loft",      guests: 60,  category: "Social",      healthFOH: "green",  healthBOH: "yellow" },
  { id: "evt-4", name: "Chef Preview Dinner",    time: "Thursday • 6:00 PM", client: "FoodWerx VIP",   venue: "FWX Studio",         guests: 40,  category: "Tasting",     healthFOH: "red",    healthBOH: "red" },
  { id: "evt-5", name: "Donovan Anniversary",    time: "Saturday • 8:00 PM", client: "Donovan Family",  venue: "Skyline Terrace",   guests: 120, category: "Celebration", healthFOH: "green",  healthBOH: "yellow" },
  { id: "evt-6", name: "Civic Fundraiser",       time: "Wednesday • 7:30 PM", client: "Civic Partners", venue: "Downtown Atrium",   guests: 300, category: "Fundraiser",  healthFOH: "yellow", healthBOH: "green" },
];

const UPCOMING_EVENTS: EventData[] = [
  { id: "u1", name: "Henderson Rehearsal",   time: "Sat Feb 8 • 4:00 PM",  client: "Henderson Family", venue: "Riverside Chapel",  guests: 60,  category: "Wedding",     healthFOH: "green",  healthBOH: "green" },
  { id: "u2", name: "Marcus Birthday Bash",  time: "Sun Feb 9 • 6:00 PM",  client: "Marcus Bell",      venue: "The Loft",          guests: 100, category: "Social",      healthFOH: "yellow", healthBOH: "green" },
  { id: "u3", name: "Apex Tech Summit",      time: "Mon Feb 10 • 9:00 AM", client: "Apex Digital",     venue: "Convention Center", guests: 350, category: "Corporate",   healthFOH: "green",  healthBOH: "yellow" },
  { id: "u4", name: "Rivera Quinceañera",    time: "Tue Feb 11 • 5:00 PM", client: "Rivera Family",    venue: "Bella Vista Hall",  guests: 200, category: "Celebration", healthFOH: "red",    healthBOH: "yellow" },
  { id: "u5", name: "FWX Chef's Table",      time: "Wed Feb 12 • 7:00 PM", client: "FoodWerx VIP",     venue: "FWX Studio",        guests: 30,  category: "Tasting",     healthFOH: "green",  healthBOH: "green" },
  { id: "u6", name: "Harvest Gala",          time: "Thu Feb 13 • 6:30 PM", client: "Harvest Foundation", venue: "Grand Pavilion",  guests: 280, category: "Fundraiser",  healthFOH: "yellow", healthBOH: "red" },
  { id: "u7", name: "Clarke Anniversary",    time: "Fri Feb 14 • 7:00 PM", client: "Clarke Family",    venue: "Magnolia Estate",   guests: 150, category: "Celebration", healthFOH: "green",  healthBOH: "green" },
  { id: "u8", name: "Park Wedding",          time: "Sat Feb 15 • 4:30 PM", client: "Sarah Park",       venue: "Lakeside Gardens",  guests: 220, category: "Wedding",     healthFOH: "yellow", healthBOH: "yellow" },
];

/* ── Health color map ── */
const HEALTH = {
  green:  { bg: "#22c55e", glow: "rgba(34,197,94,0.6)",  label: "Healthy" },
  yellow: { bg: "#eab308", glow: "rgba(234,179,8,0.6)",  label: "Watch" },
  red:    { bg: "#ef4444", glow: "rgba(239,68,68,0.6)",  label: "At Risk" },
} as const;

/* ── Category pill colors ── */
const CAT_COLORS: Record<string, string> = {
  Wedding: "#d99b66", Corporate: "#4dd0e1", Social: "#c084fc",
  Tasting: "#f87171", Celebration: "#fbbf24", Fundraiser: "#4ade80",
};

/* ── Sidebar nav items ── */
const NAV = [
  { label: "Dashboard", href: "/", active: true },
  { label: "Open Event", href: "/beo-intake" },
  { label: "Intake", href: "/invoice-intake" },
  { label: "Watchtower", href: "/watchtower" },
  { label: "Papa Chulo", href: "/papa-chulo" },
  { label: "Departments", href: "#departments" },
  { label: "Print Engine", href: "/print-test" },
];

/* ── Department circles data ── */
const DEPARTMENTS = [
  { id: "kitchen",   label: "Kitchen",                icon: "🍳", cls: "bubble-1", hasSubmenu: true },
  { id: "logistics", label: "Delivery/Fleet Command Center", icon: "🚚", cls: "bubble-5", hasSubmenu: true },
  { id: "intake",    label: "CENTRAL COMMAND CENTER", icon: "📝", cls: "bubble-2", hasSubmenu: true },
];

/* ═══════════════════════════════════════════
   MAIN DASHBOARD PAGE
   ═══════════════════════════════════════════ */
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Live Events");
  const viewMode: ViewMode = "owner";
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [kitchenOpen, setKitchenOpen] = useState(false);
  const [logisticsOpen, setLogisticsOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);

  const tabs = ["Live Events", "Upcoming", "Completed", "Archive"];

  const events = activeTab === "Upcoming" ? UPCOMING_EVENTS : TODAYS_EVENTS;

  return (
    <div className="dp-container">
      {/* ═══ SIDEBAR ═══ */}
      <aside className="dp-sidebar">
        <div className="dp-logo-section">
          <div className="dp-logo-diamond">
            <span className="dp-logo-letter">F</span>
          </div>
          <div>
            <div className="dp-logo-title">FOODWERX</div>
            <div className="dp-logo-subtitle">EVENTOPS</div>
          </div>
        </div>

        <ul className="dp-nav">
          {NAV.map((item) => (
            <li key={item.label}>
              <Link
                to={item.href}
                className={`dp-nav-link ${item.active ? "active" : ""}`}
              >
                <span className="dp-nav-dot" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <main className="dp-main">
        {/* ── Header ── */}
        <header className="dp-header">
          <input className="dp-search" placeholder="Search events..." />
          <div className="dp-header-title">FoodWerx EventOps</div>
          <div className="dp-header-right">
            <div className="dp-notif" title="Notifications" />
            <Link to="/invoice-intake" className="dp-add-btn" style={{ textDecoration: "none", color: "white" }}>+ Add Event</Link>
            <div className="dp-user">FWX</div>
          </div>
        </header>

        {/* ── Tabs ── */}
        <div className="dp-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`dp-tab ${tab === activeTab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}

          {/* Quick health summary on right side of tabs */}
          <div className="dp-tab-stats">
            <span className="dp-stat-count">{events.length} events</span>
            <span className="dp-stat-guests">{events.reduce((s, e) => s + e.guests, 0).toLocaleString()} guests</span>
          </div>
        </div>

        {/* ── Events Grid ── */}
        <div className="dp-events-area">
          <div className="dp-events-grid">
            {events.map((evt) => (
              <PremiumCard key={evt.id} event={evt} viewMode={viewMode} />
            ))}
          </div>

          {/* ── Department Command Ring ── */}
          <section
            className="dp-dept-section"
            id="departments"
            onClick={() => {
              setIntakeOpen(false);
              setKitchenOpen(false);
              setLogisticsOpen(false);
            }}
          >
            {/* Diamond: Ops Chief */}
            <div
              className="dp-diamond dp-diamond-left"
              role="button"
              tabIndex={0}
              onClick={() => (window.location.href = "/ops-chief")}
              onKeyDown={(e) => { if (e.key === "Enter") window.location.href = "/ops-chief"; }}
            >
              <span>Ops Chief<br />Command Post</span>
            </div>
            {/* Diamond: Papa Chulo */}
            <div
              className="dp-diamond dp-diamond-right"
              role="button"
              tabIndex={0}
              onClick={() => (window.location.href = "/watchtower")}
              onKeyDown={(e) => { if (e.key === "Enter") window.location.href = "/watchtower"; }}
            >
              <span>Papa Chulo<br />Watchtower</span>
            </div>

            <h2 className="dp-dept-title">Department Command Ring</h2>

            <div className="dp-dept-grid">
              {DEPARTMENTS.map((dept) => {
                const isIntake = dept.id === "intake";
                const isKitchen = dept.id === "kitchen";
                const isLogistics = dept.id === "logistics";
                const isVault = false;
                return (
                  <div key={dept.id} className="dp-dept-wrap">
                    <div
                      className={`dp-dept-bubble ${dept.cls}`}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isIntake) setIntakeOpen(!intakeOpen);
                        if (isKitchen) setKitchenOpen(!kitchenOpen);
                        if (isLogistics) setLogisticsOpen(!logisticsOpen);
                        if (isVault) setVaultOpen(!vaultOpen);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          if (isIntake) setIntakeOpen(!intakeOpen);
                          if (isKitchen) setKitchenOpen(!kitchenOpen);
                          if (isLogistics) setLogisticsOpen(!logisticsOpen);
                          if (isVault) setVaultOpen(!vaultOpen);
                        }
                      }}
                    >
                      <div className="dp-bubble-icon">{dept.icon}</div>
                      <div className="dp-bubble-label">{dept.label}</div>
                    </div>

                    {/* Kitchen submenu */}
                    {isKitchen && kitchenOpen && (
                      <div className="dp-submenu">
                        <a href="/beo-intake" className="dp-submenu-item">📋 Open Event</a>
                        <a href="/kitchen-prep" className="dp-submenu-item">🔪 Kitchen Prep Timeline</a>
                        <div className="dp-submenu-item">📦 Pack-Out Checklist</div>
                        <div className="dp-submenu-item">🍽️ Menu Specs</div>
                        <div className="dp-submenu-item">🧊 Inventory</div>
                      </div>
                    )}

                    {/* Logistics submenu */}
                    {isLogistics && logisticsOpen && (
                      <div className="dp-submenu">
                        <a href="/beo-intake" className="dp-submenu-item">📋 Open Event</a>
                        <a href="/delivery-command" className="dp-submenu-item">🚛 Delivery & Dispatch Command</a>
                        <div className="dp-submenu-item">🗺️ Route Planning</div>
                        <div className="dp-submenu-item">📍 Vehicle Tracking</div>
                        <div className="dp-submenu-item">⚙️ Fleet Management</div>
                      </div>
                    )}

                    {/* Intake submenu / CENTRAL COMMAND CENTER */}
                    {isIntake && intakeOpen && (
                      <div className="dp-submenu">
                        <a href="/beo-intake" className="dp-submenu-item">📋 Open Event</a>
                        <a href="/quick-intake" className="dp-submenu-item">Quick Client Intake</a>
                        <a href="/seed-demo" className="dp-submenu-item">🌱 Seed Demo Event</a>
                        <div className="dp-submenu-item">Rentals</div>
                        <div className="dp-submenu-item">Ops Vault</div>
                        <a href="/invoice-intake" className="dp-submenu-item">Upload Invoice</a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PREMIUM EVENT CARD (INLINE)
   ═══════════════════════════════════════════ */
function PremiumCard({ event, viewMode }: { event: EventData; viewMode: ViewMode }) {
  const pillColor = CAT_COLORS[event.category] ?? "#ff9999";

  return (
    <article className="dp-card">
      {/* Top neon line */}
      <div className="dp-card-neon-top" />

      {/* Header */}
      <div className="dp-card-header">
        <div className="dp-card-info">
          <div className="dp-card-name">{event.name}</div>
          <div className="dp-card-time">{event.time}</div>
        </div>
        <div className="dp-card-menu">⋮</div>
      </div>

      {/* Category pill */}
      <span
        className="dp-card-pill"
        style={{
          color: pillColor,
          backgroundColor: `${pillColor}18`,
          borderColor: `${pillColor}40`,
        }}
      >
        {event.category}
      </span>

      {/* Details */}
      <div className="dp-card-details">
        <div className="dp-card-row">
          <span className="dp-card-label">Client:</span>
          <span className="dp-card-value">{event.client}</span>
        </div>
        <div className="dp-card-row">
          <span className="dp-card-label">Venue:</span>
          <span className="dp-card-value">{event.venue}</span>
        </div>
        <div className="dp-card-row">
          <span className="dp-card-label">Guests:</span>
          <span className="dp-card-value">{event.guests}</span>
        </div>
      </div>

      {/* Health Lights */}
      <div className="dp-card-health">
        {(viewMode === "owner" || viewMode === "foh") && (
          <HealthLight status={event.healthFOH} label={viewMode === "owner" ? "FOH" : HEALTH[event.healthFOH].label} />
        )}
        {(viewMode === "owner" || viewMode === "boh") && (
          <HealthLight status={event.healthBOH} label={viewMode === "owner" ? "BOH" : HEALTH[event.healthBOH].label} />
        )}
      </div>
    </article>
  );
}

/* ── Animated health dot ── */
function HealthLight({ status, label }: { status: HealthStatus; label: string }) {
  const c = HEALTH[status];
  return (
    <div className="dp-health-dot-wrap">
      <span className="dp-health-dot-ping" style={{ backgroundColor: c.bg }} />
      <span className="dp-health-dot" style={{ backgroundColor: c.bg, boxShadow: `0 0 8px ${c.glow}` }} />
      <span className="dp-health-label">{label}</span>
    </div>
  );
}
