import { useEffect } from "react";
import { useEventStore } from "../state/eventStore";
import { EventSelector } from "../components/EventSelector";
import {
  ClientDetailsSection,
  PrimaryContactSection,
  EventCoreSection,
  VenueDetailsSection,
  TimelineSection,
  MenuSection,
  BarServiceSection,
  HydrationStationSection,
  CoffeeTeaSection,
  ServicewareSection,
  DietaryNotesSection,
  DesignerNotesSection,
  LogisticsSection,
} from "../components/beo-intake";
import { BeoIntakeActionBar } from "../components/beo-intake/BeoIntakeActionBar";
import "./IntakePage.css";

export const BeoIntakePage = () => {
  const { loadEvents, selectedEventId, selectEvent, setSelectedEventId } = useEventStore();

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
    <div style={{ minHeight: "100vh", backgroundColor: "#1a1a1a", color: "#e0e0e0", position: "relative", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif" }}>
      <div style={{ position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "3px solid #ff6b6b", backdropFilter: "blur(10px)" }}>
          <button type="button" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => { window.location.pathname = "/"; }}>
            <div style={{ width: "48px", height: "48px", background: "#ff6b6b", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px", fontSize: "24px", boxShadow: "0 4px 12px rgba(255, 107, 107, 0.3)" }}>←</div>
            <span style={{ fontSize: "14px", color: "#e0e0e0", fontWeight: "600" }}>Back to Dashboard</span>
          </button>
          <div style={{ textAlign: "center", flex: 1 }}>
            <h1 style={{ fontSize: "36px", fontWeight: "bold", color: "#ff6b6b", margin: "0 0 8px 0" }}>🎯 BEO Intake</h1>
            <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>Complete event details for operations</p>
          </div>
          <div style={{ minWidth: "220px", maxWidth: "320px" }}>
            <EventSelector variant="beo-header" />
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1, padding: "40px", minHeight: "calc(100vh - 100px)", paddingBottom: "140px", maxWidth: "1200px", margin: "0 auto" }}>
          {selectedEventId ? (
            <>
              <ClientDetailsSection />
              <PrimaryContactSection />
              <EventCoreSection />
              <VenueDetailsSection />
              <TimelineSection />
              <MenuSection />
              <BarServiceSection />
              <HydrationStationSection />
              <CoffeeTeaSection />
              <ServicewareSection />
              <DietaryNotesSection />
              <DesignerNotesSection />
              <LogisticsSection />
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>📋</div>
                <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#ff6b6b", marginBottom: "10px" }}>Select an Event to Begin</h2>
                <p style={{ fontSize: "16px", color: "#888", marginBottom: "20px" }}>Choose an event from the dropdown above to access the BEO intake form</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <BeoIntakeActionBar eventId={selectedEventId} />
    </div>
  );
};
