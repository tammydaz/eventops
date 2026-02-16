import React from "react";

export type HealthLightType = "foh" | "boh";

type ProblemItem = {
  id: string;
  text: string;
  fieldId?: string;
  sectionId?: string;
};

type HealthLightModalProps = {
  open: boolean;
  onClose: () => void;
  type: HealthLightType;
  eventName: string;
  eventId: string;
  problems: ProblemItem[];
};

export function HealthLightModal({
  open,
  onClose,
  type,
  eventName,
  eventId,
  problems,
}: HealthLightModalProps) {
  if (!open) return null;

  const handleFix = () => {
    // TODO: Update the correct field or open the relevant section (match Matt's system).
    // Option A: navigate to /beo-intake/:eventId and scroll to section
    // Option B: call store setField / updateEvent
    window.location.href = `/beo-intake/${eventId}`;
    onClose();
  };

  const label = type === "foh" ? "FOH Health" : "BOH Health";
  const pillClass = type === "foh" ? "health-pill-foh" : "health-pill-boh";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(135deg, rgba(20,10,10,0.98), rgba(15,10,15,0.98))",
          border: "2px solid rgba(255,51,51,0.3)",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "420px",
          width: "90%",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <span className={pillClass} style={{ margin: 0 }}>{label}</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              fontSize: "20px",
              cursor: "pointer",
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
        <h3 style={{ color: "#fff", fontSize: "16px", marginBottom: "12px" }}>{eventName}</h3>
        {problems.length === 0 ? (
          <p style={{ color: "#aaa", fontSize: "14px" }}>No specific problems recorded.</p>
        ) : (
          <ul style={{ margin: "0 0 16px 0", paddingLeft: "20px", color: "#ccc", fontSize: "14px" }}>
            {problems.map((p) => (
              <li key={p.id}>{p.text}</li>
            ))}
          </ul>
        )}
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
              color: "#ccc",
              cursor: "pointer",
            }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleFix}
            style={{
              padding: "8px 16px",
              background: "linear-gradient(135deg, #cc0000, #ff3333)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            FIX
          </button>
        </div>
      </div>
    </div>
  );
}
