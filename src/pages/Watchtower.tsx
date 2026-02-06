
import React from "react";
import EventPicker from "../components/EventPicker";
import WatchtowerSidebar from "../components/WatchtowerSidebar";
import { useEventStore } from "../state/eventStore";

type EventListItem = {
  id: string;
  eventName: string;
  eventDate?: string;
  eventType?: string;
  serviceStyle?: string;
  guestCount?: number | string;
};


const Watchtower = () => {
  const { selectedEventId, setSelectedEventId, eventData, events } = useEventStore() as {
    selectedEventId: string | null;
    setSelectedEventId: React.Dispatch<React.SetStateAction<string | null>>;
    eventData: Record<string, any>;
    events: EventListItem[];
  };
  const selectedEvent: EventListItem | null = selectedEventId
    ? (events as EventListItem[]).find((e) => e.id === selectedEventId) || null
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-900 to-black flex flex-col items-center justify-center">
      <div className="text-4xl font-extrabold text-red-500 mb-2">Papa Chulo Watchtower</div>
      <div className="text-lg text-gray-300 mb-10">Select an event to begin command operations.</div>
      <div className="w-full max-w-md flex flex-col items-center">
        <EventPicker onSelect={() => {}} />
      </div>
      {selectedEventId && selectedEvent && (
        <WatchtowerSidebar event={Object.assign({}, selectedEvent, eventData)} onClose={() => setSelectedEventId(null)} />
      )}
    </div>
  );
};

export default Watchtower;
