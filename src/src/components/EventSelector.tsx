import { useMemo, useState } from "react";
import { useEventStore } from "../state/eventStore";

const EVENT_SELECTOR_LABEL = "SELECT EVENT";
const EVENT_SELECTOR_PLACEHOLDER = "Search and select an event...";
const EVENT_SEARCH_PLACEHOLDER = "Type event name...";
const EVENT_EMPTY_STATE = "No events found.";
const EVENT_LOADING_STATE = "Loading events...";
const EVENT_ERROR_PREFIX = "Error loading events:";
const EVENT_UNKNOWN_ERROR = "Unknown error";

export const EventSelector = () => {
  const { events, eventsLoading, eventsError, selectedEventId, selectEvent } = useEventStore();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredEvents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return events;
    }
    return events.filter((event) => event.eventName.toLowerCase().includes(normalized));
  }, [events, query]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const toggleOpen = () => setIsOpen((value) => !value);

  const handleSelect = (eventId: string) => {
    selectEvent(eventId).catch(() => null);
    window.history.pushState({}, "", `/beo-intake/${eventId}`);
    setIsOpen(false);
  };

  return (
    <div className="mb-0">
      <label className="block text-xs font-bold text-gray-400 mb-2 tracking-widest">
        {EVENT_SELECTOR_LABEL}
      </label>
      <div className="relative">
        <button
          type="button"
          className="w-full px-4 py-3 border-2 border-gray-700 rounded-md bg-gray-800 text-gray-100 cursor-pointer flex items-center justify-between hover:border-red-600 transition"
          onClick={toggleOpen}
        >
          <span className={selectedEvent ? "text-gray-100" : "text-gray-500"}>
            {selectedEvent ? selectedEvent.eventName : EVENT_SELECTOR_PLACEHOLDER}
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
                  onChange={(event) => setQuery(event.target.value)}
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
              {!eventsLoading && !eventsError
                ? filteredEvents.map((event) => (
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
                  ))
                : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
