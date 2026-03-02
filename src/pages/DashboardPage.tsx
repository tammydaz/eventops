import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./DashboardPage.css";
import type { ViewMode, HealthStatus } from "../components/dashboard/EventCard";
import { useEventStore } from "../state/eventStore";
import { useAuthStore } from "../state/authStore";
import { canAccessRoute, ROLE_DEPARTMENTS } from "../lib/auth";
import type { EventListItem } from "../services/airtable/events";

/* ═══════════════════════════════════════════
   EVENT DATA (from Airtable)
   ═══════════════════════════════════════════ */
interface EventData {
  id: string;
  eventDate?: string;
  name: string;
  time: string;
  client: string;
  venue: string;
  guests: number;
  category: string;
  healthFOH: HealthStatus;
  healthBOH: HealthStatus;
}

function formatEventDate(d?: string): string {
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

function listItemToEventData(e: EventListItem): EventData {
  const parts = (e.eventName ?? "").split(/\s*[–—-]\s*/);
  const client = parts[0]?.trim() || "—";
  const venue = parts[1]?.trim() || "—";
  return {
    id: e.id,
    eventDate: e.eventDate,
    name: e.eventName ?? "Untitled",
    time: formatEventDate(e.eventDate),
    client,
    venue,
    guests: e.guestCount ?? 0,
    category: e.eventType ?? e.eventOccasion ?? "—",
    healthFOH: "green",
    healthBOH: "green",
  };
}

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
  { label: "My Issues", href: "/feedback-issues" },
];

/* ── Department circles data ── */
const DEPARTMENTS = [
  { id: "kitchen",   label: "Kitchen",                icon: "🍳", cls: "bubble-1", hasSubmenu: true },
  { id: "logistics", label: "Delivery/Fleet Command Center", icon: "🚚", cls: "bubble-5", hasSubmenu: true },
  { id: "intake",    label: "CENTRAL COMMAND CENTER", icon: "📝", cls: "bubble-2", hasSubmenu: true },
  { id: "flair",     label: "Flair/Equipment Command Center", icon: "✨", cls: "bubble-3", hasSubmenu: true },
];

/* ═══════════════════════════════════════════
   MAIN DASHBOARD PAGE
   ═══════════════════════════════════════════ */
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { events: rawEvents, loadEvents, selectEvent, eventsLoading, eventsError } = useEventStore();
  const role = user?.role ?? "ops_admin";
  const allowedDepts = ROLE_DEPARTMENTS[role] ?? [];
  const visibleDepartments = DEPARTMENTS.filter((d) => allowedDepts.includes(d.id));
  const visibleNav = NAV.filter((item) => item.href.startsWith("#") || canAccessRoute(role, item.href));
  const [activeTab, setActiveTab] = useState("Upcoming");
  const viewMode: ViewMode = "owner";
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [kitchenOpen, setKitchenOpen] = useState(false);
  const [logisticsOpen, setLogisticsOpen] = useState(false);
  const [flairOpen, setFlairOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addEventOpen, setAddEventOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const addEventRef = useRef<HTMLDivElement>(null);

  const tabs = ["Live Events", "Upcoming", "Completed", "Archive"];

  useEffect(() => {
    if (!addEventOpen) return;
    const handler = (e: MouseEvent) => {
      if (addEventRef.current && !addEventRef.current.contains(e.target as Node)) {
        setAddEventOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [addEventOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchQuery.trim() && searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchQuery]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const eventDataList = useMemo(() => rawEvents.map(listItemToEventData), [rawEvents]);
  const today = todayStr();
  const events = useMemo(() => {
    if (activeTab === "Live Events") return eventDataList.filter((e) => e.eventDate === today);
    if (activeTab === "Upcoming") return eventDataList.filter((e) => (e.eventDate ?? "") >= today);
    if (activeTab === "Completed" || activeTab === "Archive") return eventDataList.filter((e) => (e.eventDate ?? "") < today);
    return eventDataList;
  }, [eventDataList, activeTab, today]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return eventDataList.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.client.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [eventDataList, searchQuery]);

  const handleSelectEvent = (id: string) => {
    selectEvent(id);
    setSearchQuery("");
    navigate("/beo-intake");
  };

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
          {visibleNav.map((item) => (
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

        {user && (
          <div className="dp-user-section">
            <span className="dp-user-role">{user.name}</span>
            <button type="button" onClick={() => { logout(); window.location.href = "/login"; }} className="dp-signout">
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <main className="dp-main">
        {/* ── Header ── */}
        <header className="dp-header">
          <div className="dp-search-wrap" ref={searchWrapRef}>
            <input
              className="dp-search"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery.trim().length > 0 && (
              <div className="dp-search-dropdown">
                {searchResults.length === 0 ? (
                  <div className="dp-search-item dp-search-empty">No events match</div>
                ) : (
                  searchResults.slice(0, 8).map((evt) => (
                    <button
                      key={evt.id}
                      type="button"
                      className="dp-search-item"
                      onMouseDown={(e) => { e.preventDefault(); handleSelectEvent(evt.id); }}
                    >
                      <span className="dp-search-item-name">{evt.name}</span>
                      <span className="dp-search-item-meta">{evt.time} · {evt.guests} guests</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="dp-header-title">FoodWerx EventOps</div>
          <div className="dp-header-right">
            <div className="dp-notif" title="Notifications" />
            <div className="dp-header-right-inner">
            {(canAccessRoute(role, "/quick-intake") || canAccessRoute(role, "/invoice-intake")) && (
            <div className="dp-add-event-wrap" ref={addEventRef}>
              <button
                type="button"
                className="dp-add-btn"
                onClick={() => setAddEventOpen(!addEventOpen)}
                aria-expanded={addEventOpen}
                aria-haspopup="true"
              >
                Add Event ▾
              </button>
              {addEventOpen && (
                <div className="dp-add-event-dropdown">
                  {canAccessRoute(role, "/quick-intake") && (
                    <Link
                      to="/quick-intake"
                      className="dp-add-event-item"
                      onClick={() => setAddEventOpen(false)}
                    >
                      New Event (Quick Intake)
                    </Link>
                  )}
                  {canAccessRoute(role, "/invoice-intake") && (
                    <Link
                      to="/invoice-intake"
                      className="dp-add-event-item"
                      onClick={() => setAddEventOpen(false)}
                    >
                      Upload Invoice PDF
                    </Link>
                  )}
                </div>
              )}
            </div>
            )}
            {user && (
              <span className="dp-user-badge">{user.name}</span>
            )}
            <div className="dp-user">FWX</div>
            </div>
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
          {eventsError && (
            <div className="dp-events-error">
              <span>{eventsError}</span>
              <button type="button" className="dp-events-retry" onClick={() => loadEvents()}>
                Retry
              </button>
            </div>
          )}
          {eventsLoading && (
            <div className="dp-events-loading">Loading events…</div>
          )}
          {!eventsLoading && !eventsError && (
            <div className="dp-events-grid">
              {events.length === 0 ? (
                <div className="dp-events-empty">
                  <p>No events in &quot;{activeTab}&quot;</p>
                  <p className="dp-events-empty-hint">
                    {activeTab === "Live Events" && "Try the Upcoming tab, or add an event."}
                    {activeTab === "Upcoming" && "Add an event via Quick Intake or Upload Invoice."}
                    {(activeTab === "Completed" || activeTab === "Archive") && "Past events will appear here."}
                  </p>
                </div>
              ) : (
                events.map((evt) => (
                  <PremiumCard key={evt.id} event={evt} viewMode={viewMode} onSelect={() => handleSelectEvent(evt.id)} />
                ))
              )}
            </div>
          )}

          {/* ── Department Command Ring ── */}
          <section
            className="dp-dept-section"
            id="departments"
            onClick={() => {
              setIntakeOpen(false);
              setKitchenOpen(false);
              setLogisticsOpen(false);
              setFlairOpen(false);
            }}
          >
            {role === "ops_admin" && (
              <>
                <div
                  className="dp-diamond dp-diamond-left"
                  role="button"
                  tabIndex={0}
                  onClick={() => (window.location.href = "/ops-chief")}
                  onKeyDown={(e) => { if (e.key === "Enter") window.location.href = "/ops-chief"; }}
                >
                  <span>Ops Chief<br />Command Post</span>
                </div>
                <div
                  className="dp-diamond dp-diamond-right"
                  role="button"
                  tabIndex={0}
                  onClick={() => (window.location.href = "/watchtower")}
                  onKeyDown={(e) => { if (e.key === "Enter") window.location.href = "/watchtower"; }}
                >
                  <span>Papa Chulo<br />Watchtower</span>
                </div>
              </>
            )}

            <h2 className="dp-dept-title">Department Command Ring</h2>

            <div className="dp-dept-grid">
              {visibleDepartments.map((dept) => {
                const isIntake = dept.id === "intake";
                const isKitchen = dept.id === "kitchen";
                const isLogistics = dept.id === "logistics";
                const isFlair = dept.id === "flair";
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
                        if (isFlair) setFlairOpen(!flairOpen);
                        if (isVault) setVaultOpen(!vaultOpen);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          if (isIntake) setIntakeOpen(!intakeOpen);
                          if (isKitchen) setKitchenOpen(!kitchenOpen);
                          if (isLogistics) setLogisticsOpen(!logisticsOpen);
                          if (isFlair) setFlairOpen(!flairOpen);
                          if (isVault) setVaultOpen(!vaultOpen);
                        }
                      }}
                    >
                      <div className="dp-bubble-icon">{dept.icon}</div>
                      <div className="dp-bubble-label">{dept.label}</div>
                    </div>

                    {/* Submenus: ops_admin sees full options; employees see only Add Event + Open BEO Full Intake */}
                    {isKitchen && kitchenOpen && (
                      <div className="dp-submenu">
                        <a href="/quick-intake" className="dp-submenu-item">➕ Add Event</a>
                        <a href="/beo-intake" className="dp-submenu-item">📋 Open BEO Full Intake</a>
                        {role === "ops_admin" && (
                          <>
                            <a href="/kitchen-prep" className="dp-submenu-item">🔪 Kitchen Prep Timeline</a>
                            <div className="dp-submenu-item">📦 Pack-Out Checklist</div>
                            <div className="dp-submenu-item">🍽️ Menu Specs</div>
                            <div className="dp-submenu-item">🧊 Inventory</div>
                          </>
                        )}
                      </div>
                    )}

                    {isLogistics && logisticsOpen && (
                      <div className="dp-submenu">
                        <a href="/quick-intake" className="dp-submenu-item">➕ Add Event</a>
                        <a href="/beo-intake" className="dp-submenu-item">📋 Open BEO Full Intake</a>
                        {role === "ops_admin" && (
                          <>
                            <a href="/delivery-command" className="dp-submenu-item">🚛 Delivery & Dispatch Command</a>
                            <div className="dp-submenu-item">🗺️ Route Planning</div>
                            <div className="dp-submenu-item">📍 Vehicle Tracking</div>
                            <div className="dp-submenu-item">⚙️ Fleet Management</div>
                          </>
                        )}
                      </div>
                    )}

                    {isIntake && intakeOpen && (
                      <div className="dp-submenu">
                        <a href="/quick-intake" className="dp-submenu-item">➕ Add Event</a>
                        <a href="/beo-intake" className="dp-submenu-item">📋 Open BEO Full Intake</a>
                        {role === "ops_admin" && (
                          <>
                            <a href="/quick-intake" className="dp-submenu-item">Quick Client Intake</a>
                            <a href="/seed-demo" className="dp-submenu-item">🌱 Seed Demo Event</a>
                            <div className="dp-submenu-item">Rentals</div>
                            <div className="dp-submenu-item">Ops Vault</div>
                            <a href="/invoice-intake" className="dp-submenu-item">Upload Invoice</a>
                          </>
                        )}
                      </div>
                    )}

                    {isFlair && flairOpen && (
                      <div className="dp-submenu">
                        <a href="/quick-intake" className="dp-submenu-item">➕ Add Event</a>
                        <a href="/beo-intake" className="dp-submenu-item">📋 Open BEO Full Intake</a>
                        {role === "ops_admin" && (
                          <>
                            <div className="dp-submenu-item">✨ Flair Inventory</div>
                            <div className="dp-submenu-item">🔧 Equipment Tracking</div>
                            <div className="dp-submenu-item">📦 Pack-Out</div>
                          </>
                        )}
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
function PremiumCard({ event, viewMode, onSelect }: { event: EventData; viewMode: ViewMode; onSelect?: () => void }) {
  const pillColor = CAT_COLORS[event.category] ?? "#ff9999";

  return (
    <article
      className={`dp-card ${onSelect ? "dp-card-clickable" : ""}`}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => onSelect && (e.key === "Enter" || e.key === " ") && onSelect()}
    >
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
