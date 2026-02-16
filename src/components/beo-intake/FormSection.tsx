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
  defaultOpen = true,
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
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
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
