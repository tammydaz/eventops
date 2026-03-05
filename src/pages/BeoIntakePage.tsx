import { useEffect } from "react";
import { useEventStore } from "../state/eventStore";
import { EventSelector } from "../components/EventSelector";
import {
  ClientAndContactSection,
  EventCoreSection,
  VenueDetailsSection,
  TimelineSection,
  MenuAndBeveragesSection,
  KitchenAndServicewareSection,
  SiteVisitLogisticsSection,
} from "../components/beo-intake";
import { ApprovalsLockoutSection } from "../components/beo-intake/ApprovalsLockoutSection";
import { BeoIntakeActionBar } from "../components/beo-intake/BeoIntakeActionBar";
import { isDeliveryOrPickup } from "../lib/deliveryHelpers";
import { asSingleSelectName } from "../services/airtable/selectors";
import { FIELD_IDS } from "../services/airtable/events";
import "./IntakePage.css";

export const BeoIntakePage = () => {
  const { loadEvents, selectedEventId, selectEvent, setSelectedEventId, setFields, eventDataLoading, selectedEventData } = useEventStore();
  const eventType = selectedEventData ? asSingleSelectName(selectedEventData[FIELD_IDS.EVENT_TYPE]) : "";
  const isDelivery = isDeliveryOrPickup(eventType);

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

  const accentColor = isDelivery ? "#22c55e" : "#ff6b6b";
  const accentGlow = isDelivery ? "rgba(34,197,94,0.3)" : "rgba(255,107,107,0.3)";

  return (
    <div className="beo-intake-page" style={{ minHeight: "100vh", backgroundColor: "#1a1a1a", color: "#e0e0e0", position: "relative", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif" }}>
      <div style={{ position: "relative", zIndex: 10 }}>
        <div className="beo-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: `3px solid ${accentColor}`, backdropFilter: "blur(10px)" }}>
          <button type="button" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => { window.location.pathname = "/"; }}>
            <div style={{ width: "48px", height: "48px", background: accentColor, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px", fontSize: "24px", boxShadow: `0 4px 12px ${accentGlow}` }}>←</div>
            <span style={{ fontSize: "14px", color: "#e0e0e0", fontWeight: "600" }}>Back to Dashboard</span>
          </button>
          <div style={{ textAlign: "center", flex: 1 }}>
            <h1 style={{ fontSize: "36px", fontWeight: "bold", color: accentColor, margin: "0 0 8px 0" }}>
              {isDelivery ? "🚚 Delivery BEO Intake" : "🎯 BEO Intake"}
            </h1>
            <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
              {isDelivery ? "Delivery order — simplified intake (all disposable)" : "Complete event details for operations"}
            </p>
            {!isDelivery && selectedEventId && (
              <button
                type="button"
                onClick={() => setFields(selectedEventId, { [FIELD_IDS.EVENT_TYPE]: "Delivery" })}
                style={{
                  marginTop: 8,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "2px solid #22c55e",
                  background: "transparent",
                  color: "#22c55e",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Switch to Delivery
              </button>
            )}
          </div>
          <div className="beo-header-selector" style={{ minWidth: "220px", maxWidth: "320px" }}>
            <EventSelector variant="beo-header" />
          </div>
        </div>
        {isDelivery && selectedEventId && (
          <div
            className="beo-delivery-banner"
            style={{
              background: "linear-gradient(90deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))",
              borderBottom: "2px solid #22c55e",
              padding: "12px 40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px" }}>🚚</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#22c55e", textTransform: "uppercase", letterSpacing: "1px" }}>
                Delivery Order — Kitchen sees green theme
              </span>
              <span style={{ fontSize: "12px", color: "#86efac" }}>No metal/china/serviceware — all disposable</span>
            </div>
            <button
              type="button"
              onClick={() => setFields(selectedEventId, { [FIELD_IDS.EVENT_TYPE]: "Full Service" })}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "2px solid #ff6b6b",
                background: "transparent",
                color: "#ff6b6b",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Switch to Full Service
            </button>
          </div>
        )}
        <div className="beo-content" style={{ position: "relative", zIndex: 1, padding: "40px", minHeight: "calc(100vh - 100px)", paddingBottom: "140px", maxWidth: "1200px", margin: "0 auto" }}>
          {selectedEventId && eventDataLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>⏳</div>
                <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#ff6b6b", marginBottom: "8px" }}>Loading event...</h2>
              </div>
            </div>
          ) : selectedEventId ? (
            <>
              <ClientAndContactSection />
              <EventCoreSection isDelivery={isDelivery} />
              <VenueDetailsSection />
              <MenuAndBeveragesSection isDelivery={isDelivery} />
              {!isDelivery && <KitchenAndServicewareSection />}
              {!isDelivery && <TimelineSection />}
              {!isDelivery && <SiteVisitLogisticsSection />}
              <ApprovalsLockoutSection eventId={selectedEventId} />
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
