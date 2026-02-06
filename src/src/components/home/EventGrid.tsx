import { EventCard, type EventCardData } from "./EventCard";

export const EventGrid = ({ events }: { events: EventCardData[] }) => {
  return (
    <div className="events-grid">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};
