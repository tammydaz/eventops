/**
 * Seed Demo Event Page
 * Creates a sample event with Wedding/Bar Mitzvah data so you can preview
 * how it appears on Kitchen BEO and Server 2nd page.
 */
import { useState } from "react";
import { createEvent, FIELD_IDS, loadEvents } from "../services/airtable/events";
import { useEventStore } from "../state/eventStore";
import { isErrorResult } from "../services/airtable/selectors";

const DEMO_FIELDS: Record<string, unknown> = {
  [FIELD_IDS.EVENT_DATE]: "2025-03-15",
  [FIELD_IDS.GUEST_COUNT]: 120,
  [FIELD_IDS.EVENT_TYPE]: "Full Service",
  [FIELD_IDS.EVENT_OCCASION]: "Wedding",
  [FIELD_IDS.SERVICE_STYLE]: "Buffet",
  [FIELD_IDS.CLIENT_FIRST_NAME]: "Sarah",
  [FIELD_IDS.CLIENT_LAST_NAME]: "Mitchell",
  [FIELD_IDS.CLIENT_PHONE]: "(555) 123-4567",
  [FIELD_IDS.CLIENT_EMAIL]: "sarah.mitchell@example.com",
  [FIELD_IDS.PRIMARY_CONTACT_NAME]: "Mike Mitchell",
  [FIELD_IDS.PRIMARY_CONTACT_PHONE]: "(555) 987-6543",
  [FIELD_IDS.PRIMARY_CONTACT_ROLE]: "Client Rep",
  [FIELD_IDS.VENUE]: "The Grand Ballroom at Riverside",
  [FIELD_IDS.VENUE_ADDRESS]: "450 River Drive",
  [FIELD_IDS.VENUE_CITY]: "Philadelphia",
  [FIELD_IDS.VENUE_STATE]: "PA",
  [FIELD_IDS.KITCHEN_ON_SITE]: "Yes",
  [FIELD_IDS.BEO_TIMELINE]: `5:00 PM – Grand Entrance
5:30 PM – Cocktail Hour End
6:00 PM – Dinner Service
7:00 PM – First Dance
7:30 PM – Cake Cutting
8:00 PM – Parent Dances
8:30 PM – Toasts / Speeches`,
  [FIELD_IDS.DIETARY_NOTES]: "Shellfish allergy (2 guests), gluten-free options needed",
  // Bar fields omitted — Bar Service field ID (fldOisfjYPDeBwM1B) may not exist in your base
  [FIELD_IDS.HYDRATION_STATION_PROVIDED]: "Yes",
  [FIELD_IDS.COFFEE_SERVICE_NEEDED]: "Yes",
  [FIELD_IDS.PARKING_NOTES]: "Valet at main entrance. Self-park in Lot B.",
  [FIELD_IDS.LOAD_IN_NOTES]: "Load at rear dock, elevator to 2nd floor ballroom.",
  [FIELD_IDS.EVENT_PURPOSE]: "Wedding reception for Sarah & James",
};

const DELIVERY_DEMO_FIELDS: Record<string, unknown> = {
  ...DEMO_FIELDS,
  [FIELD_IDS.EVENT_TYPE]: "Delivery",
  [FIELD_IDS.EVENT_OCCASION]: "Corporate",
  [FIELD_IDS.CLIENT_FIRST_NAME]: "ABC",
  [FIELD_IDS.CLIENT_LAST_NAME]: "Corporation",
  [FIELD_IDS.VENUE]: "ABC Corp – Conference Center",
  [FIELD_IDS.VENUE_ADDRESS]: "100 Business Park Dr",
  [FIELD_IDS.VENUE_CITY]: "Philadelphia",
  [FIELD_IDS.VENUE_STATE]: "PA",
  [FIELD_IDS.LOAD_IN_NOTES]: "CALL MARLENE UPON ARRIVAL\nSEND WITH ORDER #1",
  [FIELD_IDS.DISPATCH_TIME]: 9 * 3600 + 45 * 60, // 9:45 AM (seconds for Airtable dateTime field)
  [FIELD_IDS.SPECIAL_NOTES]: "Deliver to loading dock. Contact Mike at ext 123.",
};

export const SeedDemoEventPage = () => {
  const [status, setStatus] = useState<"idle" | "creating" | "success" | "error">("idle");
  const [eventId, setEventId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const { selectEvent, loadEvents: refreshEvents } = useEventStore();

  const handleCreate = async (isDelivery = false) => {
    setStatus("creating");
    setErrorMsg("");
    const fields = isDelivery ? DELIVERY_DEMO_FIELDS : DEMO_FIELDS;
    const result = await createEvent(fields);
    if (isErrorResult(result)) {
      setStatus("error");
      setErrorMsg(result.message ?? "Failed to create event");
      return;
    }
    setEventId(result.id);
    await refreshEvents();
    await selectEvent(result.id);
    setStatus("success");
  };

  const handleGoToIntake = () => {
    if (eventId) window.location.href = `/beo-intake/${eventId}`;
  };

  const handleGoToKitchenBEO = () => {
    if (eventId) window.location.href = `/kitchen-beo-print/${eventId}`;
  };

  const handleGoToServerBEO = () => {
    if (eventId) window.location.href = `/beo-print/${eventId}`;
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#1a1a1a",
      color: "#e0e0e0",
      padding: 40,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, marginBottom: 8, color: "#ff6b6b" }}>🌱 Seed Demo Event</h1>
        <p style={{ color: "#888", marginBottom: 24 }}>
          Creates a sample event so you can preview Kitchen BEO and Server 2nd page. Choose Full Service (Wedding) or Delivery.
        </p>

        {status === "idle" && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => handleCreate(false)}
              style={{
                padding: "14px 28px",
                fontSize: 16,
                fontWeight: 600,
                backgroundColor: "#ff6b6b",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Create Full Service Demo
            </button>
            <button
              onClick={() => handleCreate(true)}
              style={{
                padding: "14px 28px",
                fontSize: 16,
                fontWeight: 600,
                backgroundColor: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Create Delivery Demo
            </button>
          </div>
        )}

        {status === "creating" && (
          <div style={{ color: "#94a3b8" }}>Creating event in Airtable…</div>
        )}

        {status === "error" && (
          <div style={{ color: "#f87171", marginBottom: 16 }}>
            Error: {errorMsg}
          </div>
        )}

        {status === "success" && eventId && (
          <div style={{
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            border: "1px solid #22c55e",
            borderRadius: 8,
            padding: 20,
            marginBottom: 24,
          }}>
            <div style={{ color: "#22c55e", fontWeight: 600, marginBottom: 12 }}>✅ Demo event created</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={handleGoToIntake}
                style={{
                  padding: 12,
                  backgroundColor: "#2a2a2a",
                  color: "#ff6b6b",
                  border: "2px solid #ff6b6b",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                📋 Open BEO Intake
              </button>
              <button
                onClick={handleGoToKitchenBEO}
                style={{
                  padding: 12,
                  backgroundColor: "#2a2a2a",
                  color: "#22c55e",
                  border: "2px solid #22c55e",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                🍳 Open Kitchen BEO Print
              </button>
              <button
                onClick={handleGoToServerBEO}
                style={{
                  padding: 12,
                  backgroundColor: "#2a2a2a",
                  color: "#3b82f6",
                  border: "2px solid #3b82f6",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                📄 Open Server BEO (2nd Page)
              </button>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 16 }}>
              The event is selected. Use the tabs on Beo Print to view Kitchen BEO, Server 2nd Page, etc.
            </p>
          </div>
        )}

        <div style={{ marginTop: 32, fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
          <strong>Full Service:</strong> Wedding, 120 guests, buffet, timeline, dietary notes, hydration & coffee.
          <br />
          <strong>Delivery:</strong> Corporate, delivery time 9:45–10AM, delivery notes, load-in instructions.
        </div>

        <a
          href="/"
          style={{ display: "inline-block", marginTop: 24, color: "#94a3b8", fontSize: 14 }}
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
};
