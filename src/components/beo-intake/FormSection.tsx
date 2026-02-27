import { useState, useRef, useEffect, type ReactNode } from "react";

type CollapsibleSubsectionProps = {
  title: string;
  icon?: string;
  summary?: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export const CollapsibleSubsection = ({
  title,
  icon = "▶",
  summary,
  children,
  defaultOpen = false,
}: CollapsibleSubsectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

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
          borderBottom: "1px solid #444",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: "12px", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.3s ease", color: "#ff6b6b" }}>
          {icon}
        </span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#ff6b6b",
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
};

export const FormSection = ({
  title,
  children,
  defaultOpen = false,
  icon = "📋",
  dotColor,
}: FormSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        backgroundColor: "#2a2a2a",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        border: "2px solid #00bcd4",
        boxShadow: "0 15px 35px rgba(0,0,0,0.4), 0 0 20px rgba(0,188,212,0.2), inset -2px -2px 8px rgba(0,0,0,0.2), inset 2px 2px 8px rgba(255,255,255,0.04)",
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
        {dotColor && (
          <>
            <span style={{ color: dotColor, fontSize: "20px", lineHeight: 0 }}>●</span>
            <span style={{ color: dotColor, fontSize: "20px", lineHeight: 0 }}>●</span>
          </>
        )}
        {!dotColor && <span style={{ fontSize: "20px" }}>{icon}</span>}
        <h2
          style={{
            fontSize: "13px",
            fontWeight: "bold",
            color: dotColor || "#ff6b6b",
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
            color: "#ff6b6b",
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
