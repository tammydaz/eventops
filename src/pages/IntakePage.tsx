import { useEffect } from "react";
import { useEventStore } from "../state/eventStore";
import { EventSelector } from "../components/EventSelector";
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
  const { loadEvents, selectedEventId, selectEvent, setSelectedEventId } = useEventStore();

  // Sync store from URL: form loads on direct link or refresh
  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname.startsWith("/beo-intake/")) {
      const eventIdFromUrl = pathname.split("/beo-intake/")[1]?.split("/")[0]?.trim();
      if (eventIdFromUrl && eventIdFromUrl !== selectedEventId) {
        selectEvent(eventIdFromUrl);
      }
    }
  }, [selectedEventId, selectEvent]);

  useEffect(() => {
    const onPopState = () => {
      const pathname = window.location.pathname;
      if (pathname.startsWith("/beo-intake/")) {
        const eventIdFromUrl = pathname.split("/beo-intake/")[1]?.split("/")[0]?.trim();
        if (eventIdFromUrl) selectEvent(eventIdFromUrl);
      } else {
        setSelectedEventId(null);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [selectEvent, setSelectedEventId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0a 0%, #0a1a0a 50%, #0f0a15 100%)",
      color: "#e0e0e0",
      position: "relative",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    }}>
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
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
            onClick={() => window.history.pushState({}, "", "/")}
          >
            <div style={{
              width: "48px",
              height: "48px",
              background: "linear-gradient(135deg, #ff3333 0%, #cc0000 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "12px",
              fontSize: "24px",
              boxShadow: "0 4px 12px rgba(255, 51, 51, 0.3)",
            }}>
              ←
            </div>
            <span style={{
              fontSize: "14px",
              color: "#e0e0e0",
              fontWeight: "600",
            }}>Back to Dashboard</span>
          </button>

          <div style={{ textAlign: "center", flex: 1 }}>
            <h1 style={{
              fontSize: "32px",
              fontWeight: "900",
              color: "#ff3333",
              letterSpacing: "4px",
              textTransform: "uppercase",
              margin: 0,
            }}>BEO Intake</h1>
            <p style={{
              fontSize: "10px",
              color: "#ffc107",
              fontWeight: "600",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}>Event Operations Form</p>
          </div>

          <div style={{ minWidth: "220px", maxWidth: "320px" }}>
            <EventSelector variant="beo-header" />
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
