import { useState, useRef, useEffect, type ReactNode } from "react";
import { useEventStore } from "../../state/eventStore";
import { useBeoIntakeView } from "./BeoIntakeViewContext";

/** Hex #RRGGBB → rgba for section accents (matches menu “+ Section” buttons). */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6 || Number.isNaN(parseInt(h, 16))) return `rgba(0, 188, 212, ${alpha})`;
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** BEO intake type scale: section title > field label > input > helper. One muted color for secondary. */
export const INPUT_FONT_SIZE = 14;
export const LABEL_FONT_SIZE = 13;
export const HELPER_FONT_SIZE = 11;
export const SECTION_TITLE_SIZE = 16;
/** BEO intake collapsible pills: max width so they don’t span the full page */
export const BEO_FORM_SECTION_MAX_WIDTH_PX = 560;
/** Cyan outline for all BEO full-intake section pills (black fill, white text, subtle rounded corners — same as Beverage Services strip) */
export const BEO_SECTION_PILL_ACCENT = "#22d3ee";
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
        tabIndex={-1}
        aria-expanded={isOpen}
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
  /** Accent color for border, title, and gradient fill (same palette as menu + buttons, e.g. #FBC02D, #4DD0E1). */
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
  titleAlign = "center",
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
  const accent = dotColor?.trim() || null;
  const isBeoPillChrome = accent?.toUpperCase() === BEO_SECTION_PILL_ACCENT.toUpperCase();
  /** Delivery/pickup: yellow “dispatch” theme must win over the default cyan BEO pill chrome. */
  const borderColor = isDelivery
    ? "#eab308"
    : isBeoPillChrome
      ? BEO_SECTION_PILL_ACCENT
      : accent
        ? hexToRgba(accent, 0.55)
        : "#00bcd4";
  const glowColor = isDelivery
    ? "rgba(234,179,8,0.22)"
    : isBeoPillChrome
      ? "rgba(59, 130, 246, 0.2)"
      : accent
        ? hexToRgba(accent, 0.28)
        : "rgba(0,188,212,0.2)";
  const titleAccent = isDelivery ? "#fffbeb" : isBeoPillChrome ? "#ffffff" : accent ?? "#fff";
  const cardBackground = isDelivery
    ? "linear-gradient(160deg, rgba(234,179,8,0.16) 0%, rgba(90,70,12,0.1) 40%, rgba(0,0,0,0.55) 100%)"
    : isBeoPillChrome
      ? "#000000"
      : accent
        ? `linear-gradient(145deg, ${hexToRgba(accent, 0.16)}, ${hexToRgba(accent, 0.04)})`
        : "rgba(30,15,15,0.6)";

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
        width: "100%",
        /* BEO pills: use full main column width so long titles stay visible */
        maxWidth: isBeoPillChrome ? "100%" : `min(100%, ${BEO_FORM_SECTION_MAX_WIDTH_PX}px)`,
        marginLeft: "auto",
        marginRight: "auto",
        background: cardBackground,
        borderRadius: isBeoPillChrome ? 12 : 10,
        padding: isBeoPillChrome ? (isOpen ? "14px 16px" : "8px 20px") : isOpen ? "12px 14px" : "10px 12px",
        border: `1px solid ${borderColor}`,
        boxShadow: isBeoPillChrome
          ? `0 2px 16px rgba(0,0,0,0.35), 0 0 20px ${glowColor}`
          : `0 2px 12px rgba(0,0,0,0.25), 0 0 12px ${glowColor}`,
        transition: "all 0.25s ease",
        boxSizing: "border-box",
      }}
    >
      {/* Section Header — tabIndex -1 so Tab goes to fields inside; Space/Enter insert text in inputs, not toggle header */}
      <button
        type="button"
        tabIndex={-1}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: titleAlign === "center" ? "center" : "flex-start",
          gap: "2px",
          marginBottom: isOpen ? "12px" : "0",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: titleAlign === "center" ? "center" : "flex-start",
            gap: "8px",
            width: "100%",
            flexWrap: "wrap",
          }}
        >
          <h2
            style={{
              fontSize: `${SECTION_TITLE_SIZE}px`,
              fontWeight: isBeoPillChrome ? "700" : "600",
              color: titleAccent,
              textTransform: "none",
              letterSpacing: "0.2px",
              flex: "0 1 auto",
              maxWidth: "100%",
              textAlign: titleAlign === "center" ? "center" : "left",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <span
            style={{
              color: isBeoPillChrome ? MUTED_COLOR : accent ? hexToRgba(accent, 0.95) : MUTED_COLOR,
              fontSize: `${HELPER_FONT_SIZE}px`,
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
              flexShrink: 0,
            }}
          >
            ▶
          </span>
        </div>
        {!isOpen && subtitle && (
          <span
            style={{
              fontSize: `${LABEL_FONT_SIZE}px`,
              color: isBeoPillChrome ? "rgba(255,255,255,0.88)" : MUTED_COLOR,
              fontWeight: 400,
              marginTop: 2,
              textAlign: titleAlign === "center" ? "center" : "left",
              display: "block",
              width: "100%",
            }}
          >
            {subtitle}
          </span>
        )}
      </button>

      {/* Section content: keep mounted when collapsed so portaled modals (Hydration Station, etc.) are not unmounted mid-click. */}
      <div
        style={{
          display: isOpen ? "grid" : "none",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        {children}
      </div>
      {selectedEventId && isOpen && (
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
              border: `1px solid ${
                isDelivery
                  ? "rgba(234,179,8,0.55)"
                  : isBeoPillChrome
                    ? hexToRgba(BEO_SECTION_PILL_ACCENT, 0.55)
                    : accent
                      ? hexToRgba(accent, 0.45)
                      : "rgba(255,107,107,0.5)"
              }`,
              background: isSaving
                ? "rgba(255,255,255,0.04)"
                : isDelivery
                  ? "rgba(234,179,8,0.14)"
                  : isBeoPillChrome
                    ? hexToRgba(BEO_SECTION_PILL_ACCENT, 0.1)
                    : accent
                      ? hexToRgba(accent, 0.12)
                      : "rgba(255,107,107,0.15)",
              color: isDelivery ? "#fef08a" : isBeoPillChrome ? "#fff" : accent ? titleAccent : "#ff6b6b",
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
};
