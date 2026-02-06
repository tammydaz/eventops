export type EventCardData = {
  id: string;
  name: string;
  time: string;
  client: string;
  venue: string;
  guests: number;
  category: string;
  health: "green" | "yellow" | "red";
};

const healthLabels: Record<EventCardData["health"], string> = {
  green: "Healthy",
  yellow: "Watch",
  red: "At Risk",
};

export const EventCard = ({ event }: { event: EventCardData }) => {
  return (
    <article className="event-card">
      <div className="event-card-header">
        <div className="event-avatar" />
        <div className="event-info">
          <div className="event-name">{event.name}</div>
          <div className="event-time">{event.time}</div>
        </div>
        <div className="event-menu">⋮</div>
      </div>

      <div className="event-category">{event.category}</div>

      <div className="event-details">
        <div className="event-detail-item">
          <span className="event-detail-label">Client:</span>{" "}
          <span className="event-detail-value">{event.client}</span>
        </div>
        <div className="event-detail-item">
          <span className="event-detail-label">Venue:</span>{" "}
          <span className="event-detail-value">{event.venue}</span>
        </div>
        <div className="event-detail-item">
          <span className="event-detail-label">Guests:</span>{" "}
          <span className="event-detail-value">{event.guests}</span>
        </div>
      </div>

      <div className="health-lights">
        <div className={`health-light ${event.health}`} />
        <span className="health-label">{healthLabels[event.health]}</span>
      </div>
    </article>
  );
};
