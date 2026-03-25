/**
 * Intake/FOH — two-row top chrome matching dashboard command bar:
 * Werx + nav (Clients, Calendar, Tasks, Reports) + utilities, then search + filter dropdowns.
 * Does not include "Command View" (per product request).
 */
import { useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEventStore } from "../state/eventStore";
import { useAuthStore } from "../state/authStore";
import { listPrimaryLabel } from "../lib/eventListRowMeta";
import { useIntakeFOHCommandFilters } from "../context/IntakeFOHCommandContext";
import "../pages/DashboardPage.css";

function userInitials(name: string | undefined): string {
  if (!name?.trim()) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
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

type SearchRow = {
  id: string;
  name: string;
  client: string;
  venue: string;
  time: string;
  guests: number;
  category: string;
};

type Props = {
  onOpenMobileMenu: () => void;
};

export function IntakeFOHCommandTop({ onOpenMobileMenu }: Props) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { events: rawEvents, loadEvents, selectEvent } = useEventStore();
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [newTaskMenuOpen, setNewTaskMenuOpen] = useState(false);
  const commandSearchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const newTaskWrapRef = useRef<HTMLDivElement>(null);

  const filters = useIntakeFOHCommandFilters();
  if (!filters) {
    throw new Error("IntakeFOHCommandTop must be used inside IntakeFOHCommandProvider");
  }
  const { barClientFilter, setBarClientFilter, barVenueFilter, setBarVenueFilter, barStatusFilter, setBarStatusFilter } =
    filters;

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

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
    if (!newTaskMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (newTaskWrapRef.current && !newTaskWrapRef.current.contains(e.target as Node)) setNewTaskMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [newTaskMenuOpen]);

  const eventDataList = useMemo((): SearchRow[] => {
    return rawEvents.map((e) => {
      const parts = (e.eventName ?? "").split(/\s*[–—-]\s*/);
      return {
        id: e.id,
        name: e.eventName ?? "Untitled",
        client: parts[0]?.trim() || "—",
        venue: parts[1]?.trim() || "—",
        time: formatEventDate(e.eventDate),
        guests: e.guestCount ?? 0,
        category: e.eventType ?? e.eventOccasion ?? "—",
      };
    });
  }, [rawEvents]);

  const clientOptions = useMemo(() => {
    const s = new Set<string>();
    eventDataList.forEach((e) => {
      if (e.client && e.client !== "—") s.add(e.client);
    });
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [eventDataList]);

  const venueOptions = useMemo(() => {
    const s = new Set<string>();
    eventDataList.forEach((e) => {
      if (e.venue && e.venue !== "—") s.add(e.venue);
    });
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [eventDataList]);

  const searchResults = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return eventDataList.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.client.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [eventDataList, deferredSearchQuery]);

  const handleSelectEvent = (evt: SearchRow) => {
    setSearchQuery("");
    navigate(`/event/${evt.id}`);
    setTimeout(() => selectEvent(evt.id), 0);
  };

  return (
    <div className="dp-command-top">
      <nav className="dp-command-nav-row dp-command-nav-primary" aria-label="Primary">
        <button type="button" className="dp-mobile-hamburger dp-command-hamburger" onClick={onOpenMobileMenu} aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
        <div className="dp-command-brand">
          <span className="dp-command-werx">Werx</span>
          <span className="dp-command-tagline">The engine behind the excellence!</span>
        </div>
        <div className="dp-command-nav-center">
          <NavLink className={({ isActive }) => `dp-command-nav-text ${isActive ? "active" : ""}`} to="/foh/leads">
            Clients
          </NavLink>
          <NavLink end className={({ isActive }) => `dp-command-nav-text ${isActive ? "active" : ""}`} to="/intake-foh">
            Calendar
          </NavLink>
          <NavLink className={({ isActive }) => `dp-command-nav-text ${isActive ? "active" : ""}`} to="/watchtower">
            Tasks
          </NavLink>
          <NavLink className={({ isActive }) => `dp-command-nav-text ${isActive ? "active" : ""}`} to="/profit/">
            Reports
          </NavLink>
        </div>
        <div className="dp-command-nav-utilities">
          <button
            type="button"
            className="dp-command-icon-btn"
            aria-label="Search"
            onClick={() => commandSearchInputRef.current?.focus()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3-3" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" className="dp-command-icon-btn dp-command-bell-wrap" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" />
            </svg>
            <span className="dp-command-bell-badge">3</span>
          </button>
          <Link className="dp-command-icon-btn" to="/admin" aria-label="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
            </svg>
          </Link>
          <div className="dp-command-avatar" aria-hidden title={user?.name ?? "User"}>
            {userInitials(user?.name)}
          </div>
        </div>
      </nav>
      <div className="dp-command-nav-divider" aria-hidden="true" />
      <div className="dp-command-nav-row dp-command-nav-filters">
        <div className="dp-command-filters-left">
          <div className="dp-search-wrap dp-command-search-wrap" ref={searchWrapRef}>
            <span className="dp-command-search-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" strokeLinecap="round" />
              </svg>
            </span>
            <input
              ref={commandSearchInputRef}
              className="dp-search dp-command-search-input"
              placeholder="Search events, clients, venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
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
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectEvent(evt);
                      }}
                    >
                      <span className="dp-search-item-name">{listPrimaryLabel(evt.client)}</span>
                      <span className="dp-search-item-meta">
                        {evt.time} · {evt.guests} guests
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="dp-command-select-wrap">
            <span className="dp-command-select-icon" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
              </svg>
            </span>
            <select
              className="dp-command-select"
              aria-label="Filter by client"
              value={barClientFilter}
              onChange={(e) => setBarClientFilter(e.target.value)}
            >
              <option value="all">All Clients</option>
              {clientOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="dp-command-select-wrap">
            <span className="dp-command-select-icon" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18M3 9h18" />
              </svg>
            </span>
            <select className="dp-command-select" aria-label="Filter by venue" value={barVenueFilter} onChange={(e) => setBarVenueFilter(e.target.value)}>
              <option value="all">All Venues</option>
              {venueOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="dp-command-select-wrap dp-command-select-wrap--status">
            <span className="dp-command-select-icon dp-command-select-icon--teal" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 21v-1a6 6 0 0112 0v1" strokeLinecap="round" />
              </svg>
            </span>
            <select
              className="dp-command-select"
              aria-label="Filter by status"
              value={barStatusFilter}
              onChange={(e) => setBarStatusFilter(e.target.value as "all" | "confirmed" | "setup")}
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="setup">Setup</option>
            </select>
          </div>
        </div>
        <div className="dp-command-filters-right">
          <button type="button" className="dp-command-btn-secondary" onClick={() => navigate("/event/new")}>
            + New Client
          </button>
          <div className="dp-command-split" ref={newTaskWrapRef}>
            <button type="button" className="dp-command-split-main" onClick={() => navigate("/watchtower")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M9 11H5a2 2 0 00-2 2v7a2 2 0 002 2h4m0-11V9a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6m6 0v7a2 2 0 01-2 2h-4m4-9h-4" strokeLinecap="round" />
              </svg>
              New Task
            </button>
            <button type="button" className="dp-command-split-chevron" aria-expanded={newTaskMenuOpen} aria-label="Task actions" onClick={() => setNewTaskMenuOpen((o) => !o)}>
              ▾
            </button>
            {newTaskMenuOpen && (
              <div className="dp-command-split-menu" role="menu">
                <Link to="/watchtower" className="dp-command-split-menu-item" role="menuitem" onClick={() => setNewTaskMenuOpen(false)}>
                  Open Watchtower
                </Link>
                <Link to="/feedback-issues" className="dp-command-split-menu-item" role="menuitem" onClick={() => setNewTaskMenuOpen(false)}>
                  Feedback & issues
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
