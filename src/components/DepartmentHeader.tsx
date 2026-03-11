/**
 * DepartmentHeader — Shared header for all department landing pages.
 * Left: Logo, Werx, tagline, search. Center: Large Werx + tagline. Right: Copyright.
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEventStore } from "../state/eventStore";
import "./DepartmentHeader.css";

type DepartmentContext = "kitchen" | "flair" | "delivery" | "ops_chief" | "intake_foh";

type DepartmentHeaderProps = {
  /** Department context for search result navigation */
  departmentContext?: DepartmentContext;
  /** Optional actions to show on the right (e.g. Sign out, Upload Invoice) */
  rightActions?: React.ReactNode;
  /** When true, render inside main area (Dashboard-style) instead of full-width bar */
  embedded?: boolean;
  /** Optional left slot (e.g. mobile hamburger) */
  leftSlot?: React.ReactNode;
};

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

export function DepartmentHeader({ departmentContext, rightActions, embedded, leftSlot }: DepartmentHeaderProps) {
  const navigate = useNavigate();
  const { events: rawEvents, loadEvents, selectEvent } = useEventStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [taglineSettled, setTaglineSettled] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setTaglineSettled(true), 120000); // 2 minutes
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const eventDataList = useMemo(() => {
    return rawEvents.map((e) => ({
      id: e.id,
      name: e.eventName ?? "Untitled",
      client: (e.eventName ?? "").split(/\s*[–—-]\s*/)[0]?.trim() || "—",
      venue: (e.eventName ?? "").split(/\s*[–—-]\s*/)[1]?.trim() || "—",
      time: formatEventDate(e.eventDate),
      guests: e.guestCount ?? 0,
      category: e.eventType ?? e.eventOccasion ?? "—",
    }));
  }, [rawEvents]);

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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchQuery.trim() && searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [searchQuery]);

  const getTargetRoute = (eventId: string) => {
    if (departmentContext === "kitchen") return `/kitchen-beo-print/${eventId}`;
    if (departmentContext === "flair") return `/beo-print/${eventId}`;
    if (departmentContext === "intake_foh") return `/event/${eventId}`;
    return `/beo-intake/${eventId}`;
  };

  const handleSelectEvent = (evt: { id: string }) => {
    selectEvent(evt.id);
    setSearchQuery("");
    navigate(getTargetRoute(evt.id));
  };

  if (embedded) {
    return (
      <header className="dp-header">
        <div className="dp-header-top" style={{ gap: 12 }}>
          {rightActions}
          <span className="dp-header-copyright">
            System Designed & Engineered by © Tammy Daddario — All Rights Reserved
          </span>
        </div>
        <div className="dp-header-main">
          <div className="dp-header-left">
            {leftSlot}
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
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectEvent(evt);
                        }}
                      >
                        <span className="dp-search-item-name">{evt.name}</span>
                        <span className="dp-search-item-meta">{evt.time} · {evt.guests} guests</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="dp-header-title dp-werx-brand">
            <span className="dp-werx-logo">Werx</span>
            <span className={`dp-werx-tagline ${taglineSettled ? "dp-werx-tagline-settled" : ""}`}>The engine behind the excellence!!</span>
          </div>
          <div className="dp-header-spacer" aria-hidden="true" />
        </div>
      </header>
    );
  }

  return (
    <header className="dept-header">
      <div className="dept-header-inner">
        <div className="dept-header-left">
          <Link to="/" className="dept-header-logo-link">
            <div className="dept-header-logo-diamond">
              <span className="dept-header-logo-letter">W</span>
            </div>
            <div className="dept-header-brand-small">
              <span className="dept-header-werx-small">Werx</span>
              <span className="dept-header-tagline-small">The engine behind the excellence!!</span>
            </div>
          </Link>
          <div className="dept-header-search-wrap" ref={searchWrapRef}>
            <input
              className="dept-header-search"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery.trim().length > 0 && (
              <div className="dept-header-search-dropdown">
                {searchResults.length === 0 ? (
                  <div className="dept-header-search-item dept-header-search-empty">No events match</div>
                ) : (
                  searchResults.slice(0, 8).map((evt) => (
                    <button
                      key={evt.id}
                      type="button"
                      className="dept-header-search-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectEvent(evt);
                      }}
                    >
                      <span className="dept-header-search-item-name">{evt.name}</span>
                      <span className="dept-header-search-item-meta">{evt.time} · {evt.guests} guests</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="dept-header-center">
          <span className="dept-header-werx-large">Werx</span>
          <span className="dept-header-tagline-large">The engine behind the excellence!!</span>
        </div>
        <div className="dept-header-right">
          {rightActions}
          <span className="dept-header-copyright">
            System Designed & Engineered by © Tammy Daddario — All Rights Reserved
          </span>
        </div>
      </div>
    </header>
  );
}
