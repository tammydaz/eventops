import { useEffect, useState, useCallback } from "react";
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
import { ReopenLockedModal } from "../components/ReopenLockedModal";
import { isDeliveryOrPickup } from "../lib/deliveryHelpers";
import { asSingleSelectName, asString } from "../services/airtable/selectors";
import { FIELD_IDS, getLockoutFieldIds } from "../services/airtable/events";
import "./IntakePage.css";

export const BeoIntakePage = () => {
  const { loadEvents, selectedEventId, selectEvent, setSelectedEventId, setFields, loadEventData, eventDataLoading, selectedEventData } = useEventStore();
  const [lockoutIds, setLockoutIds] = useState<Awaited<ReturnType<typeof getLockoutFieldIds>>>(null);
  const [showReopenModal, setShowReopenModal] = useState(false);
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

  useEffect(() => {
    getLockoutFieldIds().then(setLockoutIds);
  }, []);

  const isLocked =
    lockoutIds &&
    selectedEventId &&
    selectedEventData &&
    selectedEventData[lockoutIds.guestCountConfirmed] === true &&
    selectedEventData[lockoutIds.menuAcceptedByKitchen] === true;

  const eventName = selectedEventData ? asString(selectedEventData[FIELD_IDS.EVENT_NAME]) || "This event" : "This event";

  const handleReopen = useCallback(
    async (_initials: string) => {
      if (!selectedEventId || !lockoutIds) return;
      await setFields(selectedEventId, {
        [lockoutIds.guestCountConfirmed]: false,
        [lockoutIds.menuAcceptedByKitchen]: false,
      });
      loadEventData();
      setShowReopenModal(false);
    },
    [selectedEventId, lockoutIds, setFields, loadEventData]
  );

  const handleFormInteraction = useCallback(() => {
    if (isLocked) {
      setShowReopenModal(true);
    }
  }, [isLocked]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".beo-pill")) {
        window.dispatchEvent(new CustomEvent("beo-collapse-all-pills"));
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  const accentColor = isDelivery ? "#22c55e" : "#ff6b6b";
  const accentGlow = isDelivery ? "rgba(34,197,94,0.3)" : "rgba(255,107,107,0.3)";

  return (
    <div className="beo-intake-page" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0f0a15 100%)", color: "#e0e0e0", position: "relative", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif" }}>
      <div style={{ position: "relative", zIndex: 10 }}>
        <div className="beo-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid rgba(204,0,0,0.25)", backdropFilter: "blur(10px)" }}>
          <button type="button" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => { window.location.pathname = "/"; }}>
            <div style={{ width: "40px", height: "40px", background: "rgba(204,0,0,0.2)", border: "1px solid rgba(204,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", fontSize: "18px", color: "#e0e0e0" }}>←</div>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", fontWeight: "500", letterSpacing: "0.5px" }}>Back to Dashboard</span>
          </button>
          <div style={{ textAlign: "center", flex: 1 }}>
            <h1 style={{ fontSize: "24px", fontWeight: "600", color: "#fff", margin: "0 0 4px 0", letterSpacing: "0.5px" }}>
              {isDelivery ? "Delivery BEO Intake" : "BEO Intake"}
            </h1>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: 0, letterSpacing: "0.3px" }}>
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
              background: "linear-gradient(90deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))",
              borderBottom: "1px solid rgba(34,197,94,0.3)",
              padding: "10px 24px",
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
        <div className="beo-content" style={{ position: "relative", zIndex: 1, padding: "20px 24px", minHeight: "calc(100vh - 100px)", paddingBottom: "140px", maxWidth: "1400px", margin: "0 auto", color: "#e0e0e0" }}>
          {selectedEventId && eventDataLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>⏳</div>
                <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#ff6b6b", marginBottom: "8px" }}>Loading event...</h2>
              </div>
            </div>
          ) : selectedEventId ? (
            <div key={selectedEventId} className="beo-sections-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", alignItems: "start", maxWidth: "700px", margin: "0 auto" }}>
              <div style={{ position: "relative", gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", alignItems: "start" }}>
                {isLocked && (
                  <div
                    className="beo-locked-overlay"
                    onClick={handleFormInteraction}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleFormInteraction()}
                    aria-label="Event is locked. Click to reopen for editing."
                  />
                )}
                <ClientAndContactSection />
                <EventCoreSection isDelivery={isDelivery} />
                <VenueDetailsSection />
                <MenuAndBeveragesSection isDelivery={isDelivery} />
                {!isDelivery && <KitchenAndServicewareSection />}
                {!isDelivery && <TimelineSection />}
                {!isDelivery && <SiteVisitLogisticsSection />}
              </div>
              <ApprovalsLockoutSection eventId={selectedEventId} eventName={eventName} />
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>📋</div>
                <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#ff6b6b", marginBottom: "10px" }}>Select an Event to Begin</h2>
                <p style={{ fontSize: "16px", color: "#888", marginBottom: "20px" }}>Choose an event from the dropdown above to access the BEO intake form</p>
              </div>
            </div>
          )}
          <ReopenLockedModal
            open={showReopenModal}
            onClose={() => setShowReopenModal(false)}
            eventName={eventName}
            onReopen={handleReopen}
          />
        </div>
      </div>
      
      <BeoIntakeActionBar
        eventId={selectedEventId}
        isLocked={isLocked}
        onReopenRequest={isLocked ? () => setShowReopenModal(true) : undefined}
      />
    </div>
  );
};
