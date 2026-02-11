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
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0a 0%, #0a1a0a 50%, #0f0a15 100%)",
      color: "#e0e0e0",
      position: "relative",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    }}>
      {/* Background overlay */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "radial-gradient(circle at 20% 50%, rgba(255, 51, 51, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 193, 7, 0.05) 0%, transparent 50%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />
      
      <div style={{ position: "relative", zIndex: 10 }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
          background: "linear-gradient(180deg, rgba(20, 10, 10, 0.8), rgba(15, 10, 15, 0.6))",
          borderBottom: "1px solid rgba(255, 51, 51, 0.15)",
          backdropFilter: "blur(10px)",
        }}>
          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none",
              color: "#a0a0a0",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.3s ease",
            }}
            onClick={() => {
              window.location.href = "/";
            }}
          >
            <div style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #cc0000, #ff3333)",
              transform: "rotate(45deg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              boxShadow: "0 0 20px rgba(204, 0, 0, 0.4)",
            }}>
              <span style={{
                transform: "rotate(-45deg)",
                color: "#fff",
                fontWeight: "900",
                fontSize: "20px",
              }}>←</span>
            </div>
            <span>Back to Dashboard</span>
          </button>
          
          <div style={{ textAlign: "center" }}>
            <h1 style={{
              fontSize: "28px",
              fontWeight: "900",
              color: "#ffffff",
              marginBottom: "6px",
              textShadow: "-2px -2px 0 #ff3333, 2px -2px 0 #ff3333, -2px 2px 0 #ff3333, 2px 2px 0 #ff3333",
            }}>BEO INTAKE</h1>
            <p style={{
              fontSize: "12px",
              color: "#ffc107",
              fontWeight: "600",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}>Event Operations Form</p>
          </div>

          <div style={{ minWidth: "150px" }}>
            {isLoading ? (
              <div style={{ color: "#888", fontSize: "14px" }}>Loading events...</div>
            ) : (
              <select
                value={selectedEventId || ""}
                onChange={(e) => {
                  if (e.target.value) {
                    selectEvent(e.target.value);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "2px solid #ff3333",
                  background: "linear-gradient(135deg, rgba(255, 51, 51, 0.1), rgba(255, 51, 51, 0.05))",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  backdropFilter: "blur(5px)",
                  outline: "none",
                }}
              >
                <option value="">Select Event...</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.eventName} {event.eventDate ? `• ${event.eventDate}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          position: "relative",
          zIndex: 1,
          padding: "30px 40px",
          minHeight: "calc(100vh - 100px)",
        }}>
          {selectedEventId ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "400px",
              textAlign: "center",
            }}>
              <div>
                <div style={{
                  fontSize: "48px",
                  marginBottom: "20px",
                }}>📋</div>
                <h2 style={{
                  fontSize: "24px",
                  fontWeight: "900",
                  color: "#ff3333",
                  marginBottom: "10px",
                }}>Select an Event to Begin</h2>
                <p style={{
                  fontSize: "16px",
                  color: "#888",
                  marginBottom: "20px",
                }}>Choose an event from the dropdown above to access the BEO intake form</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
