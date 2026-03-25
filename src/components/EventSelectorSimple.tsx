/**
 * EventSelectorSimple — Native browser select + filter input.
 * Uses React Router navigate() so URL and store stay in sync (App.tsx effect reads pathname).
 * Optional onBeforeSelectEvent: if returns false, switch is blocked (e.g. for unsaved-changes prompt).
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useEventStore } from "../state/eventStore";

type EventSelectorSimpleProps = {
  /** If provided and returns false (or promise resolves to false), the event switch is not performed. */
  onBeforeSelectEvent?: (newEventId: string) => boolean | Promise<boolean>;
};

export function EventSelectorSimple({ onBeforeSelectEvent }: EventSelectorSimpleProps = {}) {
  const navigate = useNavigate();
  const { events, eventsLoading, selectedEventId } = useEventStore();
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = q ? events.filter((e) => (e.eventName ?? "").toLowerCase().includes(q)) : events;
    if (!selectedEventId || list.some((e) => e.id === selectedEventId)) return list;
    const current = events.find((e) => e.id === selectedEventId);
    return current ? [current, ...list] : list;
  }, [events, filter, selectedEventId]);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    if (onBeforeSelectEvent) {
      const allow = await Promise.resolve(onBeforeSelectEvent(id));
      if (!allow) {
        e.target.value = selectedEventId ?? "";
        return;
      }
    }
    navigate(`/beo-intake/${id}`, { replace: false });
  };

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <input
        type="text"
        placeholder="Filter..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{
          width: 110,
          padding: "8px 10px",
          borderRadius: 6,
          border: "1px solid #444",
          background: "#0a0a0a",
          color: "#e0e0e0",
          fontSize: 12,
          outline: "none",
        }}
      />
      <select
        value={selectedEventId ?? ""}
        onChange={handleChange}
        disabled={eventsLoading}
        style={{
          padding: "8px 10px",
          borderRadius: 6,
          border: "1px solid #444",
          background: "#111",
          color: selectedEventId ? "#e0e0e0" : "#666",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          minWidth: 200,
          maxWidth: 320,
        }}
      >
        <option value="" disabled>
          {eventsLoading ? "Loading..." : "— pick an event —"}
        </option>
        {filtered.map((event) => (
          <option key={event.id} value={event.id}>
            {event.eventName || event.id}
          </option>
        ))}
      </select>
    </div>
  );
}
