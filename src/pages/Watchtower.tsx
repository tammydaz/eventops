import React, { useState } from "react";
import EventPicker from "../components/EventPicker";
import WatchtowerSidebar from "../components/WatchtowerSidebar";
import { useEventStore } from "../state/eventStore";

type ViewMode = "owner" | "foh" | "boh";

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
  const [viewMode, setViewMode] = useState<ViewMode>("owner");

  const selectedEvent: EventListItem | null = selectedEventId
    ? (events as EventListItem[]).find((e) => e.id === selectedEventId) || null
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black flex flex-col items-center pt-12 px-6">
      {/* Header */}
      <div className="text-4xl font-extrabold text-red-500 mb-2 tracking-wide"
        style={{ textShadow: "0 0 30px rgba(204,0,0,0.4)" }}
      >
        Papa Chulo Watchtower
      </div>
      <div className="text-sm text-gray-400 mb-8">Select an event to begin command operations.</div>

      {/* View Mode Toggles */}
      <div className="flex items-center gap-3 mb-8">
        <span className="text-[10px] font-bold text-gray-600 tracking-[0.15em] uppercase mr-2">View</span>
        <button
          onClick={() => setViewMode("owner")}
          className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300"
          style={{
            background: viewMode === "owner"
              ? "linear-gradient(135deg, rgba(217,155,102,0.2), rgba(217,155,102,0.08))"
              : "rgba(255,255,255,0.03)",
            border: viewMode === "owner"
              ? "1px solid rgba(217,155,102,0.5)"
              : "1px solid rgba(255,255,255,0.08)",
            color: viewMode === "owner" ? "#d99b66" : "#666",
            boxShadow: viewMode === "owner" ? "0 0 14px rgba(217,155,102,0.2)" : "none",
          }}
        >
          👑 Nick
        </button>
        <button
          onClick={() => setViewMode("foh")}
          className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300"
          style={{
            background: viewMode === "foh"
              ? "linear-gradient(135deg, rgba(0,188,212,0.2), rgba(0,188,212,0.08))"
              : "rgba(255,255,255,0.03)",
            border: viewMode === "foh"
              ? "1px solid rgba(0,188,212,0.5)"
              : "1px solid rgba(255,255,255,0.08)",
            color: viewMode === "foh" ? "#4dd0e1" : "#666",
            boxShadow: viewMode === "foh" ? "0 0 14px rgba(0,188,212,0.2)" : "none",
          }}
        >
          🎯 FOH
        </button>
        <button
          onClick={() => setViewMode("boh")}
          className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300"
          style={{
            background: viewMode === "boh"
              ? "linear-gradient(135deg, rgba(204,0,0,0.2), rgba(204,0,0,0.08))"
              : "rgba(255,255,255,0.03)",
            border: viewMode === "boh"
              ? "1px solid rgba(204,0,0,0.5)"
              : "1px solid rgba(255,255,255,0.08)",
            color: viewMode === "boh" ? "#ff6b6b" : "#666",
            boxShadow: viewMode === "boh" ? "0 0 14px rgba(204,0,0,0.2)" : "none",
          }}
        >
          🔥 BOH
        </button>
      </div>

      {/* Event Picker */}
      <div className="w-full max-w-md flex flex-col items-center">
        <EventPicker onSelect={() => {}} />
      </div>

      {/* View mode indicator */}
      <div className="mt-6 text-xs text-gray-600 font-semibold tracking-wider uppercase">
        Active View: <span style={{
          color: viewMode === "owner" ? "#d99b66" : viewMode === "foh" ? "#4dd0e1" : "#ff6b6b"
        }}>
          {viewMode === "owner" ? "Owner (Nick)" : viewMode === "foh" ? "Front of House" : "Back of House"}
        </span>
      </div>

      {selectedEventId && selectedEvent && (
        <WatchtowerSidebar event={Object.assign({}, selectedEvent, eventData)} onClose={() => setSelectedEventId(null)} />
      )}
    </div>
  );
};

export default Watchtower;
