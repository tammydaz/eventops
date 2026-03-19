import { useState, useRef, useEffect, type ReactNode } from "react";
import { useEventStore } from "../../state/eventStore";
import { useBeoIntakeView } from "./BeoIntakeViewContext";

/** BEO intake type scale: section title > field label > input > helper. One muted color for secondary. */
export const INPUT_FONT_SIZE = 14;
export const LABEL_FONT_SIZE = 13;
export const HELPER_FONT_SIZE = 11;
export const SECTION_TITLE_SIZE = 16;
export const MUTED_COLOR = "rgba(255,255,255,0.5)";
export const LABEL_COLOR = "rgba(255,255,255,0.9)";
export const ACCENT_LINK = "#00bcd4";

/** Shared input styling for BEO intake forms */
export const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid rgba(255,255,255,0.12)",
  backgroundColor: "rgba(0,0,0,0.25)",
  color: "#e0e0e0",
  fontSize: `${INPUT_FONT_SIZE}px`,
} as const;

/** For textareas - extends inputStyle with resize */
export const textareaStyle = {
  ...inputStyle,
  resize: "vertical" as const,
  fontFamily: "inherit",
};

/** Field label — prominent so users scan easily */
export const labelStyle = {
  display: "block" as const,
  fontSize: `${LABEL_FONT_SIZE}px`,
  color: LABEL_COLOR,
  marginBottom: "4px",
  fontWeight: "600" as const,
};

/** Helper / secondary text — smaller, muted, never competes with labels */
export const helperStyle = {
  fontSize: `${HELPER_FONT_SIZE}px`,
  color: MUTED_COLOR,
  marginTop: "4px",
  lineHeight: 1.4,
  fontWeight: 400,
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
  /** Accent color for border and title (e.g. #ff6b6b, #a855f7) */
  accentColor?: string;
  /** When "center", heading and summary are centered */
  titleAlign?: "left" | "center";
};

export const CollapsibleSubsection = ({
  title,
  icon = "▶",
  summary,
  children,
  defaultOpen = false,
  isDelivery = false,
  accentColor,
  titleAlign = "left",
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

  const borderColor = accentColor ?? (isDelivery ? "#22c55e" : "rgba(0,188,212,0.3)");
  const titleColor = accentColor ?? "#fff";

  return (
    <div style={{ gridColumn: "1 / -1" }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: titleAlign === "center" ? "center" : "flex-start",
          gap: "6px",
          marginTop: 10,
          marginBottom: isOpen ? 8 : 0,
          paddingBottom: 4,
          borderBottom: `1px solid ${borderColor}`,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          textAlign: titleAlign === "center" ? "center" : "left",
        }}
      >
        <span style={{ fontSize: "12px", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.3s ease", color: accentColor ?? "rgba(255,255,255,0.6)" }}>
          {icon}
        </span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: titleColor,
            textTransform: "none",
            letterSpacing: "0.3px",
          }}
        >
          {title}
        </span>
        {summary && (
          <span style={{ fontSize: 12, color: "#888", fontWeight: 400, marginLeft: titleAlign === "center" ? 0 : 8 }}>
            — {summary}
          </span>
        )}
      </button>
      {isOpen && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
            padding: accentColor ? 12 : 0,
            borderRadius: accentColor ? 8 : 0,
            backgroundColor: accentColor ? "rgba(0,0,0,0.15)" : undefined,
            boxShadow: accentColor ? `0 4px 16px ${accentColor}40` : undefined,
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
  /** Hint shown on the pill (e.g. "If different from client address") */
  subtitle?: string;
  /** Dot color for section header (e.g. #22c55e green, #a855f7 purple, #eab308 yellow, #3b82f6 blue) */
  dotColor?: string;
  /** When true, use green delivery theme (border, glow) */
  isDelivery?: boolean;
  /** Unique ID for jump-to navigation */
  sectionId?: string;
  /** When "center", section title and subtitle are centered */
  titleAlign?: "left" | "center";
};

export const FormSection = ({
  title,
  children,
  defaultOpen = false,
  icon = "📋",
  subtitle,
  dotColor,
  isDelivery = false,
  sectionId,
  titleAlign = "left",
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
  const borderColor = isDelivery ? "#eab308" : "#00bcd4";
  const glowColor = isDelivery ? "rgba(234,179,8,0.15)" : "rgba(0,188,212,0.2)";

  const handleSave = async () => {
    if (!selectedEventId) return;
    setIsSaving(true);
    const ok = await saveCurrentEvent(selectedEventId);
    setIsSaving(false);
    if (ok) {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
      setIsOpen(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("input, select, textarea, button")) return;
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const collapse = () => setIsOpen(false);
    window.addEventListener("beo-collapse-all-pills", collapse);
    return () => window.removeEventListener("beo-collapse-all-pills", collapse);
  }, []);

  useEffect(() => {
    if (!sectionId) return;
    const expand = (e: Event) => {
      if ((e as CustomEvent).detail === sectionId) setIsOpen(true);
    };
    window.addEventListener("beo-jump-to-section", expand);
    return () => window.removeEventListener("beo-jump-to-section", expand);
  }, [sectionId]);

  const beoView = useBeoIntakeView();
  const effectiveOpen = beoView.inBeoView && beoView.controlledOpen !== undefined
    ? beoView.controlledOpen
    : isOpen;

  if (beoView.inBeoView && beoView.controlledOpen !== undefined) {
    if (!effectiveOpen) return null;
    return (
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {children}
        </div>
        {selectedEventId && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: "6px 14px",
                fontSize: "11px",
                fontWeight: 600,
                borderRadius: "6px",
                border: "1px solid rgba(255,107,107,0.5)",
                background: isSaving ? "rgba(255,255,255,0.04)" : "rgba(255,107,107,0.15)",
                color: "#ff6b6b",
                cursor: isSaving ? "not-allowed" : "pointer",
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {showSaved ? "Saved ✓" : isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      id={sectionId}
      className="beo-pill"
      data-beo-pill
      onDoubleClick={handleDoubleClick}
      title={isOpen ? "Double-click to collapse" : "Double-click to expand"}
      style={{
        gridColumn: isOpen ? "1 / -1" : undefined,
        backgroundColor: "rgba(30,15,15,0.6)",
        borderRadius: "10px",
        padding: isOpen ? "16px 22px" : "14px 18px",
        border: `1px solid ${borderColor}`,
        boxShadow: `0 2px 12px rgba(0,0,0,0.25), 0 0 1px ${glowColor}`,
        transition: "all 0.25s ease",
      }}
    >
      {/* Section Header - Collapsible */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: titleAlign === "center" ? "center" : "flex-start",
          gap: "2px",
          marginBottom: isOpen ? "16px" : "0",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: titleAlign === "center" ? "center" : "flex-start", gap: "8px", width: "100%" }}>
          <h2
            style={{
              fontSize: `${SECTION_TITLE_SIZE}px`,
              fontWeight: "600",
              color: "#fff",
              textTransform: "none",
              letterSpacing: "0.2px",
              flex: titleAlign === "center" ? undefined : 1,
              textAlign: titleAlign === "center" ? "center" : "left",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <span
            style={{
              color: MUTED_COLOR,
              fontSize: `${HELPER_FONT_SIZE}px`,
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          >
            ▶
          </span>
        </div>
        {!isOpen && subtitle && (
          <span style={{ fontSize: `${LABEL_FONT_SIZE}px`, color: MUTED_COLOR, fontWeight: 400, marginTop: 2, textAlign: titleAlign === "center" ? "center" : "left", display: "block", width: "100%" }}>
            {subtitle}
          </span>
        )}
      </button>

      {/* Section Content with Grid */}
      {isOpen && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            {children}
          </div>
          {selectedEventId && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  padding: "6px 14px",
                  fontSize: `${LABEL_FONT_SIZE}px`,
                  fontWeight: 600,
                  textTransform: "none",
                  letterSpacing: "0.2px",
                  borderRadius: "6px",
                  border: `1px solid ${isDelivery ? "rgba(234,179,8,0.5)" : "rgba(255,107,107,0.5)"}`,
                  background: isSaving ? "rgba(255,255,255,0.04)" : (isDelivery ? "rgba(234,179,8,0.15)" : "rgba(255,107,107,0.15)"),
                  color: isDelivery ? "#eab308" : "#ff6b6b",
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
