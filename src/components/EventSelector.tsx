import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useEventStore } from "../state/eventStore";

const EVENT_SELECTOR_PLACEHOLDER = "Search and select an event...";
const EVENT_SEARCH_PLACEHOLDER = "Type event name...";
const EVENT_EMPTY_STATE = "No events found.";
const EVENT_LOADING_STATE = "Loading events...";
const EVENT_ERROR_PREFIX = "Error loading events:";

const beoStyles = {
  wrap: { marginBottom: 0 },
  trigger: {
    minWidth: "220px",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "2px solid #666",
    background: "#1a1a1a",
    color: "#e0e0e0",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "border-color 0.2s",
  },
  triggerPlaceholder: { color: "#888" },
  dropdown: {
    position: "absolute" as const,
    top: "calc(100% + 8px)",
    right: 0,
    minWidth: "100%",
    width: "360px",
    maxWidth: "100vw",
    background: "#1a1a1a",
    border: "2px solid #666",
    borderRadius: "8px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.8)",
    zIndex: 1000,
    maxHeight: "380px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
  },
  searchWrap: { padding: "10px 12px", borderBottom: "1px solid #444" },
  searchInput: {
    width: "100%",
    padding: "10px 12px 10px 36px",
    border: "2px solid #666",
    borderRadius: "6px",
    background: "#0a0a0a",
    color: "#e0e0e0",
    fontSize: "14px",
    outline: "none",
  },
  searchIcon: {
    position: "absolute" as const,
    left: 20,
    top: "50%",
    transform: "translateY(-50%)",
    width: 16,
    height: 16,
    color: "#ff3333",
  },
  list: { maxHeight: "300px", overflowY: "auto" as const },
  item: {
    width: "100%",
    padding: "12px 16px",
    border: "none",
    borderBottom: "1px solid #333",
    background: "transparent",
    color: "#e0e0e0",
    fontSize: "14px",
    fontWeight: 600,
    textAlign: "left" as const,
    cursor: "pointer",
    transition: "background 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemHover: { background: "#2a0a0a" },
  itemSelected: { background: "#ff3333", color: "#fff" },
  empty: { padding: 24, textAlign: "center" as const, color: "#888", fontSize: 13 },
};

type EventSelectorProps = { variant?: "default" | "beo-header" };

export const EventSelector = ({ variant = "default" }: EventSelectorProps) => {
  const { events, eventsLoading, eventsError, selectedEventId, selectEvent } = useEventStore();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDropdownRect(null);
      return;
    }
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 320),
    });
  }, [isOpen]);

  const filteredEvents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return events;
    return events.filter((event) => (event.eventName ?? "").toLowerCase().includes(normalized));
  }, [events, query]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const toggleOpen = () => setIsOpen((v) => !v);

  const handleSelect = (eventId: string) => {
    selectEvent(eventId).catch(() => null);
    window.history.pushState({}, "", `/beo-intake/${eventId}`);
    setIsOpen(false);
  };

  const isBeo = variant === "beo-header";

  // beo-header: dropdown rendered in PORTAL so nothing can block clicks
  if (isBeo) {
    const portalDropdown = isOpen && dropdownRect && createPortal(
      <>
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99998,
          }}
          onClick={() => setIsOpen(false)}
        />
        <div
          style={{
            position: "fixed",
            top: dropdownRect.top,
            left: dropdownRect.left,
            width: Math.min(dropdownRect.width, 360),
            maxWidth: "calc(100vw - 24px)",
            background: "#1a1a1a",
            border: "2px solid #666",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.8)",
            zIndex: 99999,
            maxHeight: 380,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
              <div style={{ ...beoStyles.searchWrap, position: "relative" }}>
                <svg
                  style={beoStyles.searchIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Type client name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={beoStyles.searchInput}
                  autoFocus
                />
              </div>
              <div style={beoStyles.list}>
                {eventsLoading && (
                  <div style={beoStyles.empty}>{EVENT_LOADING_STATE}</div>
                )}
                {eventsError && (
                  <div style={{ ...beoStyles.empty, color: "#f44" }}>
                    {EVENT_ERROR_PREFIX} {eventsError}
                  </div>
                )}
                {!eventsLoading && !eventsError && filteredEvents.length === 0 && (
                  <div style={beoStyles.empty}>{EVENT_EMPTY_STATE}</div>
                )}
                {!eventsLoading && !eventsError &&
                  filteredEvents.map((event) => {
                    const isSelected = event.id === selectedEventId;
                    return (
                      <div
                        key={event.id}
                        role="button"
                        tabIndex={0}
                        style={{
                          ...beoStyles.item,
                          ...(isSelected ? beoStyles.itemSelected : {}),
                        }}
                        onClick={() => {
                          selectEvent(event.id).catch(() => null);
                          window.history.pushState({}, "", `/beo-intake/${event.id}`);
                          setIsOpen(false);
                          setQuery("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            selectEvent(event.id).catch(() => null);
                            window.history.pushState({}, "", `/beo-intake/${event.id}`);
                            setIsOpen(false);
                            setQuery("");
                          }
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "#2a0a0a";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <span style={{ fontWeight: isSelected ? 700 : 600 }}>
                          {event.eventName || event.eventDate || event.id}
                        </span>
                        {isSelected && (
                          <span style={{ marginLeft: "auto" }}>✓</span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
      </>,
      document.body
    );

    return (
      <div style={beoStyles.wrap}>
        <div style={{ position: "relative" }}>
          <div
            ref={triggerRef}
            role="button"
            tabIndex={0}
            onClick={toggleOpen}
            onKeyDown={(e) => e.key === "Enter" && toggleOpen()}
            style={{
              ...beoStyles.trigger,
              ...(selectedEvent ? {} : beoStyles.triggerPlaceholder),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ff3333";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#666";
            }}
          >
            <span>
              {selectedEvent ? (selectedEvent.eventName || selectedEvent.id) : EVENT_SELECTOR_PLACEHOLDER}
            </span>
            <span style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              ▼
            </span>
          </div>
          {portalDropdown}
        </div>
      </div>
    );
  }

  // Default (grey) variant – unchanged behavior
  return (
    <div className="mb-0">
      <label className="block text-xs font-bold text-gray-400 mb-2 tracking-widest">
        SELECT EVENT
      </label>
      <div className="relative">
        <button
          type="button"
          className="w-full px-4 py-3 border-2 border-gray-700 rounded-md bg-gray-800 text-gray-100 cursor-pointer flex items-center justify-between hover:border-red-600 transition"
          onClick={toggleOpen}
        >
          <span className={selectedEvent ? "text-gray-100" : "text-gray-500"}>
            {selectedEvent ? (selectedEvent.eventName || selectedEvent.id) : EVENT_SELECTOR_PLACEHOLDER}
          </span>
          <svg className="w-5 h-5 text-red-600 transition" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>

        {isOpen ? (
          <div className="absolute z-10 w-full mt-2 bg-gray-800 border-2 border-gray-700 rounded-md shadow-xl max-h-80 overflow-hidden">
            <div className="p-2 border-b border-gray-700">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="text"
                  placeholder={EVENT_SEARCH_PLACEHOLDER}
                  className="w-full pl-9 pr-3 py-2 border-2 border-gray-700 rounded-md bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent placeholder-gray-600"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {eventsLoading ? (
                <div className="px-4 py-3 text-gray-400">{EVENT_LOADING_STATE}</div>
              ) : null}
              {eventsError ? (
                <div className="px-4 py-3 text-red-400">
                  {EVENT_ERROR_PREFIX} {eventsError}
                </div>
              ) : null}
              {!eventsLoading && !eventsError && filteredEvents.length === 0 ? (
                <div className="px-4 py-3 text-gray-400">{EVENT_EMPTY_STATE}</div>
              ) : null}
              {!eventsLoading && !eventsError &&
                filteredEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className="w-full px-4 py-3 text-left text-gray-100 border-b border-gray-700 bg-gray-800 hover:bg-gray-700"
                    onClick={() => handleSelect(event.id)}
                  >
                    <div className="text-gray-100 font-semibold">{event.eventName}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {event.eventType ? `Type: ${event.eventType}` : ""}
                      {event.serviceStyle ? ` • Style: ${event.serviceStyle}` : ""}
                      {event.guestCount !== undefined ? ` • Guests: ${event.guestCount}` : ""}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
