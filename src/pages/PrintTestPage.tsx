import { useState } from "react";
import { useEventStore } from "../state/eventStore";

/**
 * Quick test page for Kitchen BEO Print Engine
 * Navigate to /print-test to select an event and preview
 */
export default function PrintTestPage() {
  const { events, selectedEventId, selectEvent } = useEventStore();
  const [testEventId, setTestEventId] = useState(selectedEventId || "");

  const handleSelectEvent = (eventId: string) => {
    setTestEventId(eventId);
    selectEvent(eventId);
  };

  const handlePreview = () => {
    if (testEventId) {
      window.open(`/beo-print/${testEventId}`, "_blank");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1a1a1a",
        color: "#fff",
        padding: "40px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "900",
            color: "#ff3333",
            marginBottom: "10px",
          }}
        >
          🖨️ Kitchen BEO Print Test
        </h1>
        <p style={{ color: "#888", marginBottom: "40px" }}>
          Select an event to preview the Kitchen BEO (Page 1)
        </p>

        <div style={{ marginBottom: "30px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "600",
              color: "#fff",
              marginBottom: "10px",
            }}
          >
            Select Event:
          </label>
          <select
            value={testEventId}
            onChange={(e) => handleSelectEvent(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "14px",
              background: "#2a2a2a",
              color: "#fff",
              border: "2px solid #444",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            <option value="">— Select an event —</option>
            {events.map((event: any) => (
              <option key={event.id} value={event.id}>
                {event.eventName} {event.eventDate ? `(${event.eventDate})` : ""}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handlePreview}
          disabled={!testEventId}
          style={{
            padding: "14px 28px",
            fontSize: "14px",
            fontWeight: "700",
            background: testEventId
              ? "linear-gradient(135deg, #ff3333, #cc0000)"
              : "#444",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: testEventId ? "pointer" : "not-allowed",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            boxShadow: testEventId
              ? "0 4px 15px rgba(255, 51, 51, 0.3)"
              : "none",
          }}
        >
          Open Print Preview →
        </button>

        <div
          style={{
            marginTop: "40px",
            padding: "20px",
            background: "#2a2a2a",
            borderRadius: "8px",
            border: "1px solid #444",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "#ffc107",
              marginBottom: "12px",
              textTransform: "uppercase",
            }}
          >
            Kitchen BEO Features:
          </h3>
          <ul
            style={{
              fontSize: "13px",
              color: "#aaa",
              lineHeight: "1.8",
              paddingLeft: "20px",
            }}
          >
            <li>Header with Client/Contact collapse logic</li>
            <li>Golden Address Rule (Venue Full Address priority)</li>
            <li>Collapsible Allergy Banner</li>
            <li>Collapsible "No Buffet" Banner</li>
            <li>3-Column Layout: Spec | Item | Nick's Spec</li>
            <li>Auto-Spec Engine (pattern-based)</li>
            <li>Sections: Passed Apps, Presented Apps, Buffet-Metal, Buffet-China, Desserts</li>
            <li>Footer with key event info</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
