import { useState, useRef, useEffect, type ReactNode } from "react";
import { useEventStore } from "../../state/eventStore";

/** Helper text below form fields — prominent and readable on dark backgrounds */
export const helperStyle = {
  fontSize: "13px",
  color: "#c4b5fd",
  marginTop: "8px",
  lineHeight: 1.5,
  fontWeight: 500,
} as const;

export function Helper({ children }: { children: React.ReactNode }) {
  return <div style={helperStyle}>{children}</div>;
}

type CollapsibleSubsectionProps = {
  title: string;
  icon?: string;
  summary?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** When true, use green delivery styling for header */
  isDelivery?: boolean;
};

export const CollapsibleSubsection = ({
  title,
  icon = "▶",
  summary,
  children,
  defaultOpen = false,
  isDelivery = false,
}: CollapsibleSubsectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const accentColor = isDelivery ? "#22c55e" : "#ff6b6b";

  // Sync open state when defaultOpen changes (e.g. when a service is picked)
  const prevDefaultOpen = useRef(defaultOpen);
  useEffect(() => {
    if (prevDefaultOpen.current !== defaultOpen) {
      prevDefaultOpen.current = defaultOpen;
      setIsOpen(defaultOpen);
    }
  }, [defaultOpen]);

  return (
    <div style={{ gridColumn: "1 / -1" }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginTop: 16,
          marginBottom: isOpen ? 12 : 0,
          paddingBottom: 8,
          borderBottom: `1px solid ${isDelivery ? "#22c55e" : "#444"}`,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: "12px", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.3s ease", color: accentColor }}>
          {icon}
        </span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: accentColor,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {title}
        </span>
        {summary && (
          <span style={{ fontSize: 12, color: "#888", fontWeight: 400, marginLeft: 8 }}>
            — {summary}
          </span>
        )}
      </button>
      {isOpen && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

type FormSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: string;
  /** Dot color for section header (e.g. #22c55e green, #a855f7 purple, #eab308 yellow, #3b82f6 blue) */
  dotColor?: string;
  /** When true, use green delivery theme (border, glow) */
  isDelivery?: boolean;
};

export const FormSection = ({
  title,
  children,
  defaultOpen = false,
  icon = "📋",
  dotColor,
  isDelivery = false,
}: FormSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const prevDefaultOpen = useRef(defaultOpen);
  const selectedEventId = useEventStore((s) => s.selectedEventId);
  const saveCurrentEvent = useEventStore((s) => s.saveCurrentEvent);

  useEffect(() => {
    if (prevDefaultOpen.current !== defaultOpen) {
      prevDefaultOpen.current = defaultOpen;
      setIsOpen(defaultOpen);
    }
  }, [defaultOpen]);
  const borderColor = isDelivery ? "#22c55e" : "#00bcd4";
  const glowColor = isDelivery ? "rgba(34,197,94,0.2)" : "rgba(0,188,212,0.2)";

  const handleSave = async () => {
    if (!selectedEventId) return;
    setIsSaving(true);
    const ok = await saveCurrentEvent(selectedEventId);
    setIsSaving(false);
    if (ok) {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#2a2a2a",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        border: `2px solid ${borderColor}`,
        boxShadow: `0 15px 35px rgba(0,0,0,0.4), 0 0 20px ${glowColor}, inset -2px -2px 8px rgba(0,0,0,0.2), inset 2px 2px 8px rgba(255,255,255,0.04)`,
        transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      {/* Section Header - Collapsible */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: isOpen ? "20px" : "0",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {!dotColor && <span style={{ fontSize: "20px", color: "#dc2626" }}>{icon}</span>}
        <h2
          style={{
            fontSize: "13px",
            fontWeight: "bold",
            color: "#dc2626",
            textTransform: "uppercase",
            letterSpacing: "1px",
            flex: 1,
            textAlign: "left",
            margin: 0,
          }}
        >
          {title}
        </h2>
        <span
          style={{
            color: "#dc2626",
            fontSize: "12px",
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        >
          ▶
        </span>
      </button>

      {/* Section Content with Grid */}
      {isOpen && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {children}
          </div>
          {selectedEventId && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${borderColor}40` }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  padding: "8px 20px",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  borderRadius: "8px",
                  border: `2px solid ${isDelivery ? "#22c55e" : "#ff6b6b"}`,
                  background: isSaving ? "rgba(255,255,255,0.05)" : (isDelivery ? "#22c55e" : "#ff6b6b"),
                  color: "#fff",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {showSaved ? "Saved ✓" : isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
