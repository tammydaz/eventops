import { useEventStore } from "../state/eventStore";

export default function EventPicker({ onSelect }) {
  const { events, eventsLoading, setSelectedEventId } = useEventStore();

  return (
    <div className="event-selector">
      <label>Select Event:</label>
      <select
        onChange={e => {
          const evt = events.find(ev => ev.id === e.target.value);
          if (evt) {
            setSelectedEventId(evt.id);
            onSelect && onSelect(evt);
          }
        }}
        disabled={eventsLoading}
      >
        <option value="">-- Choose event --</option>
        {events.map(evt => (
          <option key={evt.id} value={evt.id}>
            {evt.eventName}
          </option>
        ))}
      </select>
    </div>
  );
}
