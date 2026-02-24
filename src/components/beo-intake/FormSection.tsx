import { useState, type ReactNode } from "react";

type FormSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: string;
};

export const FormSection = ({
  title,
  children,
  defaultOpen = false,
  icon = "📋",
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
        <span style={{ fontSize: "20px" }}>{icon}</span>
        <h2
          style={{
            fontSize: "13px",
            fontWeight: "bold",
            color: "#ff6b6b",
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
