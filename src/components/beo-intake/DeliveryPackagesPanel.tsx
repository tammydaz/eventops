/**
 * DeliveryPackagesPanel
 *
 * Dark-themed overlay panel — the single "Packages" entry point for delivery events.
 * Shows three sections:
 *   1. Delivery Packages — grouped by panelCategory, each button opens DeliveryPackageConfigModal
 *   2. Boxed Lunches    — button reveals the BoxedLunchSection below
 *   3. Sandwich Platters — button opens SandwichPlatterConfigModal
 */
import React from "react";
import {
  ALL_DELIVERY_PACKAGE_PRESETS,
  PANEL_CATEGORY_LABELS,
  type DeliveryPackagePreset,
  type DeliveryPanelCategory,
} from "../../config/deliveryPackagePresets";

interface Props {
  onSelectPackage: (preset: DeliveryPackagePreset) => void;
  onOpenBoxedLunches: () => void;
  onOpenSandwichPlatters: () => void;
  onClose: () => void;
  disabled?: boolean;
}

// ── Dark theme colours (matches SandwichPlatterConfigModal / app dark UI) ──────

const BG_OVERLAY   = "rgba(0,0,0,0.72)";
const BG_PANEL     = "#111827";
const BG_CARD      = "#1e2736";
const BG_SECTION   = "#162032";
const BORDER       = "rgba(255,255,255,0.1)";
const TEXT_PRIMARY = "#f0f4f8";
const TEXT_MUTED   = "rgba(255,255,255,0.45)";
const TEXT_LABEL   = "rgba(255,255,255,0.55)";

// ── Styles ────────────────────────────────────────────────────────────────────

const OVERLAY: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: BG_OVERLAY,
  zIndex: 8500,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

const PANEL: React.CSSProperties = {
  background: BG_PANEL,
  borderRadius: 14,
  width: "100%",
  maxWidth: 640,
  maxHeight: "92vh",
  overflowY: "auto",
  boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
  display: "flex",
  flexDirection: "column",
  border: `1px solid ${BORDER}`,
};

const HEADER: React.CSSProperties = {
  padding: "18px 22px 14px",
  borderBottom: `1px solid ${BORDER}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  position: "sticky",
  top: 0,
  background: BG_PANEL,
  zIndex: 1,
};

const BODY: React.CSSProperties = {
  padding: "14px 22px 24px",
  flex: 1,
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: TEXT_LABEL,
  marginBottom: 9,
  marginTop: 20,
  paddingBottom: 6,
  borderBottom: `1px solid ${BORDER}`,
};

const PKG_GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
};

const CATEGORY_COLORS: Record<DeliveryPanelCategory, { accent: string; dot: string }> = {
  breakfast: { accent: "#f97316", dot: "#fb923c" },
  lunch_platter: { accent: "#3b82f6", dot: "#60a5fa" },
  hot_lunch: { accent: "#ef4444", dot: "#f87171" },
  lunch_premium: { accent: "#a855f7", dot: "#c084fc" },
  happy_hour: { accent: "#f59e0b", dot: "#fbbf24" },
  ambient_display: { accent: "#14b8a6", dot: "#2dd4bf" },
};

function PackageButton({
  preset,
  onClick,
  disabled,
}: {
  preset: DeliveryPackagePreset;
  onClick: () => void;
  disabled?: boolean;
}) {
  const c = CATEGORY_COLORS[preset.panelCategory];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: BG_CARD,
        border: `1px solid ${c.accent}40`,
        borderRadius: 8,
        padding: "11px 13px",
        textAlign: "left",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 5,
        opacity: disabled ? 0.5 : 1,
        transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = c.accent; }}
      onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = `${c.accent}40`; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
          {preset.displayName}
        </span>
      </div>
      {preset.groups.length > 0 && (
        <div style={{ fontSize: 11, color: TEXT_MUTED, paddingLeft: 14 }}>
          {preset.groups.map((g) => `Pick ${g.pickCount}`).join(" · ")}
        </div>
      )}
    </button>
  );
}

function BigActionButton({
  icon,
  label,
  sublabel,
  accent,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  sublabel: string;
  accent: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        borderRadius: 10,
        border: `1px solid ${accent}40`,
        background: BG_CARD,
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        opacity: disabled ? 0.5 : 1,
        marginBottom: 8,
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = accent; }}
      onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = `${accent}40`; }}
    >
      <span style={{ fontSize: 26, lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{label}</div>
        <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{sublabel}</div>
      </div>
      <span style={{ fontSize: 16, color: accent, fontWeight: 700 }}>→</span>
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const CATEGORY_ORDER: DeliveryPanelCategory[] = [
  "breakfast",
  "lunch_platter",
  "hot_lunch",
  "lunch_premium",
  "happy_hour",
  "ambient_display",
];

export function DeliveryPackagesPanel({
  onSelectPackage,
  onOpenBoxedLunches,
  onOpenSandwichPlatters,
  onClose,
  disabled,
}: Props) {
  const byCategory = CATEGORY_ORDER.map((cat) => ({
    cat,
    presets: ALL_DELIVERY_PACKAGE_PRESETS.filter((p) => p.panelCategory === cat),
  }));

  return (
    <div style={OVERLAY} onClick={onClose}>
      <div style={PANEL} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={HEADER}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: TEXT_MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>
              Delivery
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, color: TEXT_PRIMARY }}>📦 Packages</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 22, color: TEXT_MUTED, cursor: "pointer", lineHeight: 1, padding: 4 }}
          >
            ✕
          </button>
        </div>

        <div style={BODY}>

          {/* Delivery Package presets by category */}
          {byCategory.map(({ cat, presets }) =>
            presets.length === 0 ? null : (
              <div key={cat}>
                <div style={SECTION_LABEL}>{PANEL_CATEGORY_LABELS[cat]}</div>
                <div style={PKG_GRID}>
                  {presets.map((preset) => (
                    <PackageButton
                      key={preset.key}
                      preset={preset}
                      disabled={disabled}
                      onClick={() => { onClose(); onSelectPackage(preset); }}
                    />
                  ))}
                </div>
              </div>
            )
          )}

          {/* Order builders divider */}
          <div style={{ borderTop: `1px solid ${BORDER}`, margin: "22px 0 18px" }} />
          <div style={{ ...SECTION_LABEL, marginTop: 0 }}>🥡 Order Builders</div>

          <BigActionButton
            icon="🥡"
            label="Boxed Lunches"
            sublabel="Individual boxes — classic, executive, or salad"
            accent="#22c55e"
            disabled={disabled}
            onClick={() => { onClose(); onOpenBoxedLunches(); }}
          />
          <BigActionButton
            icon="🥪"
            label="Sandwich Platters"
            sublabel="Classic or gourmet sandwich trays"
            accent="#f97316"
            disabled={disabled}
            onClick={() => { onClose(); onOpenSandwichPlatters(); }}
          />
        </div>
      </div>
    </div>
  );
}
