import { EventCard, type HealthStatus, type ViewMode } from "./EventCard";

interface TenDayEvent {
  id: string;
  eventName: string;
  dateTime: string;
  eventType: string;
  client: string;
  venue: string;
  guests: number;
  healthLightFOH: HealthStatus;
  healthLightBOH: HealthStatus;
  dayLabel: string;       // e.g. "Mon Feb 10"
}

const SAMPLE_10DAY: TenDayEvent[] = [
  { id: "t1", eventName: "Henderson Rehearsal",  dateTime: "Sat • 4:00 PM",  eventType: "Wedding",    client: "Henderson Family", venue: "Riverside Chapel",  guests: 60,  healthLightFOH: "green",  healthLightBOH: "green",  dayLabel: "Sat Feb 8" },
  { id: "t2", eventName: "Marcus Birthday Bash",  dateTime: "Sun • 6:00 PM",  eventType: "Social",     client: "Marcus Bell",      venue: "The Loft",          guests: 100, healthLightFOH: "yellow", healthLightBOH: "green",  dayLabel: "Sun Feb 9" },
  { id: "t3", eventName: "Apex Tech Summit",      dateTime: "Mon • 9:00 AM",  eventType: "Corporate",  client: "Apex Digital",     venue: "Convention Center", guests: 350, healthLightFOH: "green",  healthLightBOH: "yellow", dayLabel: "Mon Feb 10" },
  { id: "t4", eventName: "Rivera Quinceañera",    dateTime: "Tue • 5:00 PM",  eventType: "Celebration", client: "Rivera Family",   venue: "Bella Vista Hall",  guests: 200, healthLightFOH: "red",    healthLightBOH: "yellow", dayLabel: "Tue Feb 11" },
  { id: "t5", eventName: "FWX Chef's Table",      dateTime: "Wed • 7:00 PM",  eventType: "Tasting",    client: "FoodWerx VIP",     venue: "FWX Studio",        guests: 30,  healthLightFOH: "green",  healthLightBOH: "green",  dayLabel: "Wed Feb 12" },
  { id: "t6", eventName: "Harvest Gala",           dateTime: "Thu • 6:30 PM",  eventType: "Fundraiser", client: "Harvest Foundation", venue: "Grand Pavilion",  guests: 280, healthLightFOH: "yellow", healthLightBOH: "red",    dayLabel: "Thu Feb 13" },
  { id: "t7", eventName: "Clarke Anniversary",     dateTime: "Fri • 7:00 PM",  eventType: "Celebration", client: "Clarke Family",   venue: "Magnolia Estate",   guests: 150, healthLightFOH: "green",  healthLightBOH: "green",  dayLabel: "Fri Feb 14" },
  { id: "t8", eventName: "Park Wedding",           dateTime: "Sat • 4:30 PM",  eventType: "Wedding",    client: "Sarah Park",       venue: "Lakeside Gardens",  guests: 220, healthLightFOH: "yellow", healthLightBOH: "yellow", dayLabel: "Sat Feb 15" },
  { id: "t9", eventName: "DEF Corp Lunch",         dateTime: "Mon • 11:30 AM", eventType: "Corporate",  client: "DEF Corp",         venue: "Skyline Tower",     guests: 80,  healthLightFOH: "green",  healthLightBOH: "green",  dayLabel: "Mon Feb 17" },
];

/* ── Group events by day ── */
function groupByDay(events: TenDayEvent[]): Map<string, TenDayEvent[]> {
  const map = new Map<string, TenDayEvent[]>();
  for (const e of events) {
    const arr = map.get(e.dayLabel) ?? [];
    arr.push(e);
    map.set(e.dayLabel, arr);
  }
  return map;
}

export function TenDayPanel({ viewMode }: { viewMode: ViewMode }) {
  const grouped = groupByDay(SAMPLE_10DAY);

  return (
    <div className="space-y-10">
      {Array.from(grouped.entries()).map(([dayLabel, events]) => (
        <div key={dayLabel}>
          {/* Day header */}
          <div className="flex items-center gap-4 mb-5">
            <h3
              className="text-sm font-bold uppercase tracking-[0.2em]"
              style={{ color: "#d99b66", textShadow: "0 0 8px rgba(217,155,102,0.3)" }}
            >
              {dayLabel}
            </h3>
            <div
              className="flex-1 h-px"
              style={{
                background: "linear-gradient(90deg, rgba(217,155,102,0.4), transparent 80%)",
              }}
            />
            <span className="text-[11px] text-gray-600 font-medium">
              {events.length} event{events.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {events.map((evt) => (
              <EventCard
                key={evt.id}
                eventName={evt.eventName}
                dateTime={evt.dateTime}
                eventType={evt.eventType}
                client={evt.client}
                venue={evt.venue}
                guests={evt.guests}
                healthLightFOH={evt.healthLightFOH}
                healthLightBOH={evt.healthLightBOH}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
