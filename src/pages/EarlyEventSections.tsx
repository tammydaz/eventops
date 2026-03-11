import React, { useState } from "react";

const sections = [
  { id: "client", label: "Client & Day-of Contact" },
  { id: "eventDetails", label: "Event Details" },
  { id: "venue", label: "Venue" },
  { id: "menu", label: "Menu & Beverages" },
  { id: "plates", label: "Plates • Cutlery • Glassware" },
  { id: "timeline", label: "Timeline" },
  { id: "logistics", label: "Notes / Onsite Event Logistics" },
  { id: "approvals", label: "Approvals & Lockout Controls" },
];

export default function EarlyEventSections() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({
    client: "",
    eventDetails: "",
    venue: "",
    menu: "",
    plates: "",
    timeline: "",
    logistics: "",
    approvals: "",
  });

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#1a0f0f",
        color: "white",
        padding: "30px",
      }}
    >
      {/* LEFT PANEL — section content */}
      <div
        style={{
          flex: 1,
          border: "1px solid #333",
          marginRight: "20px",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        {!activeSection && (
          <div style={{ opacity: 0.6 }}>Click a section to begin…</div>
        )}

        {activeSection && (
          <div>
            <h2 style={{ marginBottom: "10px" }}>
              {sections.find((s) => s.id === activeSection)?.label}
            </h2>

            {/* STRUCTURED QUESTIONS — placeholder */}
            <div
              style={{
                padding: "15px",
                border: "1px solid #444",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <strong>Structured Inputs Placeholder</strong>
              <p style={{ opacity: 0.6 }}>
                (Dropdowns, yes/no choices, menu picker, etc.)
              </p>
            </div>

            {/* NOTES AREA */}
            <div>
              <strong>Add Quick Notes:</strong>
              <textarea
                value={notes[activeSection]}
                onChange={(e) =>
                  setNotes({ ...notes, [activeSection]: e.target.value })
                }
                style={{
                  width: "100%",
                  height: "180px",
                  marginTop: "10px",
                  borderRadius: "10px",
                  padding: "10px",
                  background: "#0f0a0a",
                  color: "white",
                  border: "1px solid #333",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL — clickable sections */}
      <div
        style={{
          width: "380px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        {sections.map((s) => (
          <div
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              border: "1px solid #00d4ff",
              padding: "18px 22px",
              borderRadius: "10px",
              cursor: "pointer",
              background:
                activeSection === s.id
                  ? "rgba(0,212,255,0.12)"
                  : "rgba(0,212,255,0.05)",
            }}
          >
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
