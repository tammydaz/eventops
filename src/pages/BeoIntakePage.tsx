import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
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
import { ConfirmSendToBOHModal } from "../components/ConfirmSendToBOHModal";
import { SubmitChangeRequestModal } from "../components/SubmitChangeRequestModal";
import { MissingFieldsModal } from "../components/MissingFieldsModal";
import { useAuthStore } from "../state/authStore";
import { isDeliveryOrPickup } from "../lib/deliveryHelpers";
import { isChangeRequested, allBOHConfirmedChange } from "../lib/productionHelpers";
import { asSingleSelectName, asString, asLinkedRecordIds } from "../services/airtable/selectors";
import { FIELD_IDS, getLockoutFieldIds, getBOHProductionFieldIds } from "../services/airtable/events";
import { createTask } from "../services/airtable/tasks";
import { MenuPickerModal } from "../components/MenuPickerModal";
import { usePickerStore } from "../state/usePickerStore";
import "./IntakePage.css";

/** Required BEO fields for Send to BOH. Empty or falsy = missing. */
const REQUIRED_BEO_FIELDS: { fieldId: string; label: string }[] = [
  { fieldId: FIELD_IDS.EVENT_DATE, label: "Event Date" },
  { fieldId: FIELD_IDS.GUEST_COUNT, label: "Guest Count" },
  { fieldId: FIELD_IDS.VENUE, label: "Venue" },
  { fieldId: FIELD_IDS.CLIENT_FIRST_NAME, label: "Client First Name" },
  { fieldId: FIELD_IDS.CLIENT_LAST_NAME, label: "Client Last Name" },
  { fieldId: FIELD_IDS.PRIMARY_CONTACT_NAME, label: "Primary Contact Name" },
  { fieldId: FIELD_IDS.EVENT_TYPE, label: "Event Type" },
];

function getMissingRequiredFields(data: Record<string, unknown> | undefined): { fieldId: string; label: string }[] {
  if (!data) return REQUIRED_BEO_FIELDS;
  return REQUIRED_BEO_FIELDS.filter(({ fieldId }) => {
    const v = data[fieldId];
    if (v === undefined || v === null) return true;
    if (typeof v === "string") return !v.trim();
    if (typeof v === "number") return isNaN(v) || v <= 0;
    return true;
  });
}

/** Maps picker targetField to Airtable field ID */
const TARGET_FIELD_TO_FIELD_ID: Record<string, string> = {
  passedApps: FIELD_IDS.PASSED_APPETIZERS,
  presentedApps: FIELD_IDS.PRESENTED_APPETIZERS,
  buffetMetal: FIELD_IDS.BUFFET_METAL,
  buffetChina: FIELD_IDS.BUFFET_CHINA,
  desserts: FIELD_IDS.DESSERTS,
  deliveryDeli: FIELD_IDS.DELIVERY_DELI,
  roomTempDisplay: FIELD_IDS.ROOM_TEMP_DISPLAY,
  displays: FIELD_IDS.DISPLAYS,
  beverageService: FIELD_IDS.BEVERAGES,
  barService: FIELD_IDS.BAR_MIXER_ITEMS,
};

export const BeoIntakePage = () => {
  const { loadEvents, selectedEventId, selectEvent, setSelectedEventId, setFields, loadEventData, eventDataLoading, selectedEventData } = useEventStore();
  const [lockoutIds, setLockoutIds] = useState<Awaited<ReturnType<typeof getLockoutFieldIds>>>(null);
  const [bohIds, setBohIds] = useState<Awaited<ReturnType<typeof getBOHProductionFieldIds>>>(null);
  const [showSendToBOHModal, setShowSendToBOHModal] = useState(false);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
  const { user } = useAuthStore();
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

  useEffect(() => {
    getBOHProductionFieldIds().then(setBohIds);
  }, []);

  const beoSentToBOH = bohIds?.beoSentToBOH && selectedEventData ? selectedEventData[bohIds.beoSentToBOH] === true : false;
  const isLocked =
    selectedEventId &&
    selectedEventData &&
    (beoSentToBOH ||
      (lockoutIds &&
        selectedEventData[lockoutIds.guestCountConfirmed] === true &&
        selectedEventData[lockoutIds.menuAcceptedByKitchen] === true));

  const eventName = selectedEventData ? asString(selectedEventData[FIELD_IDS.EVENT_NAME]) || "This event" : "This event";

  const role = user?.role ?? null;
  const canSubmitChangeRequest = role === "foh" || role === "intake" || role === "ops_admin";

  const handleSubmitChangeRequest = useCallback(
    async (_changeNotes: string) => {
      if (!selectedEventId || !lockoutIds) return;
      const updates: Record<string, unknown> = {
        [lockoutIds.guestCountConfirmed]: false,
        [lockoutIds.menuAcceptedByKitchen]: false,
        [lockoutIds.menuChangeRequested]: true,
      };
      if (lockoutIds.productionAccepted) updates[lockoutIds.productionAccepted] = false;
      if (lockoutIds.productionAcceptedFlair) updates[lockoutIds.productionAcceptedFlair] = false;
      if (lockoutIds.productionAcceptedDelivery) updates[lockoutIds.productionAcceptedDelivery] = false;
      if (lockoutIds.productionAcceptedOpsChief) updates[lockoutIds.productionAcceptedOpsChief] = false;
      await setFields(selectedEventId, updates);
      loadEventData();
      setShowChangeRequestModal(false);
    },
    [selectedEventId, lockoutIds, setFields, loadEventData]
  );

  const handleSendToBOH = useCallback(
    async (_initials: string) => {
      if (!selectedEventId) return;
      const patch: Record<string, unknown> = {};
      if (bohIds?.beoSentToBOH) {
        patch[bohIds.beoSentToBOH] = true;
        if (bohIds.eventChangeRequested) patch[bohIds.eventChangeRequested] = false;
        if (bohIds.changeConfirmedByBOH) patch[bohIds.changeConfirmedByBOH] = false;
      }
      if (lockoutIds) {
        if (lockoutIds.productionAccepted) patch[lockoutIds.productionAccepted] = false;
        if (lockoutIds.productionAcceptedFlair) patch[lockoutIds.productionAcceptedFlair] = false;
        if (lockoutIds.productionAcceptedDelivery) patch[lockoutIds.productionAcceptedDelivery] = false;
        if (lockoutIds.productionAcceptedOpsChief) patch[lockoutIds.productionAcceptedOpsChief] = false;
      }
      if (!bohIds?.beoSentToBOH && lockoutIds) {
        patch[lockoutIds.guestCountConfirmed] = true;
        patch[lockoutIds.menuAcceptedByKitchen] = true;
      }
      if (Object.keys(patch).length > 0) {
        await setFields(selectedEventId, patch);
        await loadEvents();
        loadEventData();
      }
      setShowSendToBOHModal(false);
    },
    [selectedEventId, lockoutIds, bohIds, setFields, loadEventData, loadEvents]
  );

  const handleFormInteraction = useCallback(() => {
    if (isLocked && canSubmitChangeRequest) {
      setShowChangeRequestModal(true);
    }
  }, [isLocked, canSubmitChangeRequest]);

  const handleClickSendToBOH = useCallback(() => {
    const missing = getMissingRequiredFields(selectedEventData);
    if (missing.length > 0) {
      setShowMissingFieldsModal(true);
    } else {
      setShowSendToBOHModal(true);
    }
  }, [selectedEventData]);

  const handleMissingFieldsConfirm = useCallback(
    async (dueDate: string) => {
      if (!selectedEventId) return;
      const missing = getMissingRequiredFields(selectedEventData);
      for (const { label } of missing) {
        await createTask({
          eventId: selectedEventId,
          taskName: `Get ${label} from client`,
          taskType: "BEO Missing",
          dueDate,
          status: "Pending",
        });
      }
      setShowMissingFieldsModal(false);
    },
    [selectedEventId, selectedEventData]
  );

  const handlePickerAdd = useCallback(
    async (item: { id: string; name: string }) => {
      const targetField = usePickerStore.getState().targetField;
      if (!selectedEventId || !targetField) return;

      const fieldId = TARGET_FIELD_TO_FIELD_ID[targetField];
      if (!fieldId) return;

      const existing = selectedEventData ? asLinkedRecordIds(selectedEventData[fieldId]) ?? [] : [];
      const merged = [...new Set([...existing, item.id])];

      await setFields(selectedEventId, { [fieldId]: merged });
      loadEventData();
    },
    [selectedEventId, selectedEventData, setFields, loadEventData]
  );

  const targetField = usePickerStore((s) => s.targetField);
  const pickerAlreadyAddedIds =
    targetField && selectedEventData
      ? (asLinkedRecordIds(selectedEventData[TARGET_FIELD_TO_FIELD_ID[targetField] ?? ""]) ?? [])
      : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (usePickerStore.getState().isOpen) return;
      if (usePickerStore.getState().isWithinCloseGrace()) return;
      const target = e.target as HTMLElement;
      if (target.closest(".picker-modal-backdrop") || target.closest(".picker-modal") || target.closest(".picker-done-button") || target.closest(".station-config-modal") || target.closest(".station-picker-modal")) return;
      if (!target.closest(".beo-pill")) {
        window.dispatchEvent(new CustomEvent("beo-collapse-all-pills"));
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  const accentColor = isDelivery ? "#22c55e" : "#ff6b6b";
  const accentGlow = isDelivery ? "rgba(34,197,94,0.3)" : "rgba(255,107,107,0.3)";

  const changeRequestItem = lockoutIds && selectedEventData
    ? {
        guestCountChangeRequested: selectedEventData[lockoutIds.guestCountChangeRequested] === true,
        menuChangeRequested: selectedEventData[lockoutIds.menuChangeRequested] === true,
        productionAccepted: selectedEventData[lockoutIds.productionAccepted] === true,
        productionAcceptedFlair: selectedEventData[lockoutIds.productionAcceptedFlair] === true,
        productionAcceptedDelivery: selectedEventData[lockoutIds.productionAcceptedDelivery] === true,
        productionAcceptedOpsChief: selectedEventData[lockoutIds.productionAcceptedOpsChief] === true,
      }
    : null;
  const showChangeRequestWarning = changeRequestItem && isChangeRequested(changeRequestItem) && !allBOHConfirmedChange(changeRequestItem);

  return (
    <div className="beo-intake-page" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0f0a15 100%)", color: "#e0e0e0", position: "relative", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif" }}>
      <div style={{ position: "relative", zIndex: 10 }}>
        <div className="beo-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid rgba(204,0,0,0.25)", backdropFilter: "blur(10px)", gap: 16, flexWrap: "wrap" }}>
          <div className="beo-header-selector" style={{ minWidth: "220px", maxWidth: "320px" }}>
            <EventSelector variant="beo-header" />
          </div>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #cc0000, #ff3333)", transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, boxShadow: "0 0 20px rgba(204,0,0,0.4)" }}>
              <span style={{ transform: "rotate(-45deg)", fontFamily: "'Great Vibes', cursive", fontSize: 24, color: "#fff", textShadow: "0 0 12px rgba(255,255,255,0.9)" }}>W</span>
            </div>
            <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: 28, fontWeight: 400, color: "#fff", textShadow: "0 0 12px rgba(255,255,255,0.9)" }}>Werx</span>
          </Link>
          <div style={{ minWidth: "220px", maxWidth: "320px", display: "flex", justifyContent: "flex-end" }}>
            {!isDelivery && selectedEventId && (
              <button
                type="button"
                onClick={() => setFields(selectedEventId, { [FIELD_IDS.EVENT_TYPE]: "Delivery" })}
                style={{
                  padding: "8px 14px",
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
        {showChangeRequestWarning && (
          <div
            className="beo-change-request-warning"
            style={{
              background: "linear-gradient(90deg, rgba(234,179,8,0.25), rgba(234,179,8,0.08))",
              borderBottom: "3px solid #eab308",
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "28px" }}>⚠️</span>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#eab308", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                Event details were changed
              </div>
              <div style={{ fontSize: "15px", color: "#fef08a", fontWeight: "600" }}>
                BOH must confirm receipt before production resumes.
              </div>
            </div>
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
                    className={`beo-locked-overlay ${canSubmitChangeRequest ? "beo-locked-foh" : "beo-locked-boh"}`}
                    onClick={handleFormInteraction}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleFormInteraction()}
                    aria-label={canSubmitChangeRequest ? "Event is locked. Click to submit a change request." : "Event is locked. Only FOH can submit a change request to unlock."}
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
          <SubmitChangeRequestModal
            open={showChangeRequestModal}
            onClose={() => setShowChangeRequestModal(false)}
            eventName={eventName}
            onConfirm={handleSubmitChangeRequest}
          />
          <ConfirmSendToBOHModal
            open={showSendToBOHModal}
            onClose={() => setShowSendToBOHModal(false)}
            eventName={eventName}
            onConfirm={handleSendToBOH}
          />
          <MissingFieldsModal
            open={showMissingFieldsModal}
            onClose={() => setShowMissingFieldsModal(false)}
            missingFields={getMissingRequiredFields(selectedEventData)}
            onConfirm={handleMissingFieldsConfirm}
          />
          <MenuPickerModal onAdd={handlePickerAdd} alreadyAddedIds={pickerAlreadyAddedIds} />
        </div>
      </div>
      
      <BeoIntakeActionBar
        eventId={selectedEventId}
        isLocked={isLocked}
        onReopenRequest={isLocked && canSubmitChangeRequest ? () => setShowChangeRequestModal(true) : undefined}
        onSendToBOH={!isDelivery && !isLocked ? handleClickSendToBOH : undefined}
      />
    </div>
  );
};
