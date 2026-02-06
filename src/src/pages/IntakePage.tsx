import { useState, useEffect } from "react";
import { useEventStore } from "../state/eventStore";
import { ClientSection } from "../components/intake/ClientSection";
import { EventDetailsSection } from "../components/intake/EventDetailsSection";
import { MenuSection } from "../components/intake/MenuSection";
import { BarServiceSection } from "../components/intake/BarServiceSection";
import { HotColdBeveragesSection } from "../components/intake/HotColdBeveragesSection";
import { ServicewareNewSection } from "../components/intake/ServicewareNewSection";
import { GlasswareSection } from "../components/intake/GlasswareSection";
import { DecorNotesSection } from "../components/intake/DecorNotesSection";
import { VenueFacilitiesSection } from "../components/intake/VenueFacilitiesSection";
import "./IntakePage.css";

export const IntakePage = () => {
  const { events, loadEvents, selectedEventId, selectEvent } = useEventStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await loadEvents();
      setIsLoading(false);
    };
    load();
  }, [loadEvents]);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-black relative">
      {/* Animated background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black via-gray-950 to-black"></div>
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-red-900/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-1">
      {/* Header - Simple and Clean */}
      <div className="border-b-2 border-red-600 sticky top-0 z-10" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-3 py-2 rounded-md border-2 border-red-600 text-gray-400 hover:bg-red-600 hover:text-gray-200 transition text-sm font-semibold"
              style={{ backgroundColor: '#2d2d2d' }}
              onClick={() => {
                window.location.href = "/";
              }}
            >
              ← Back
            </button>
            
            <div className="flex-1">
              {isLoading ? (
                <div className="text-gray-400 py-3 text-center">Loading...</div>
              ) : (
                <select
                  value={selectedEventId || ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      selectEvent(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-3 rounded-md border-2 focus:outline-none transition font-semibold cursor-pointer"
                  style={{
                    backgroundColor: '#2d2d2d',
                    borderColor: '#cc0000',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ff5555';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#cc0000';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Select an event...</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.eventName} {event.eventDate ? `• ${event.eventDate}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      {selectedEventId ? (
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div data-panel-index="0"><ClientSection /></div>
          <div data-panel-index="1"><EventDetailsSection /></div>
          <div data-panel-index="2"><MenuSection /></div>
          <div data-panel-index="3"><BarServiceSection /></div>
          <div data-panel-index="4"><HotColdBeveragesSection /></div>
          <div data-panel-index="5"><ServicewareNewSection /></div>
          <div data-panel-index="6"><GlasswareSection /></div>
          <div data-panel-index="7"><DecorNotesSection /></div>
          <div data-panel-index="8"><VenueFacilitiesSection /></div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <p className="text-gray-500 text-base">Select an event above to begin editing</p>
        </div>
      )}
      </div>
    </div>
  );
};
