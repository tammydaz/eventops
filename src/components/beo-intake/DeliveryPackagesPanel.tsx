/**
 * DeliveryPackagesPanel
 *
 * Full-screen overlay panel — the single "Packages" entry point for delivery events.
 * Shows three sections:
 *   1. Delivery Packages — grouped by panelCategory, each button opens DeliveryPackageConfigModal
 *   2. Boxed Lunches    — button scrolls to / reveals the BoxedLunchSection below
 *   3. Sandwich Platters — button opens SandwichPlatterConfigModal
 *
 * Replaces the standalone "+ Boxed Lunches" and "+ Sandwich Platters" buttons.
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

// ── Styles ────────────────────────────────────────────────────────────────────

const OVERLAY: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.65)",
  zIndex: 8500,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

const PANEL: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  width: "100%",
  maxWidth: 640,
  maxHeight: "92vh",
  overflowY: "auto",
  boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
  display: "flex",
  flexDirection: "column",
};

const HEADER: React.CSSProperties = {
  padding: "20px 24px 16px",
  borderBottom: "1px solid #f0f0f0",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  position: "sticky",
  top: 0,
  background: "#fff",
  zIndex: 1,
};

const BODY: React.CSSProperties = {
  padding: "16px 24px 24px",
  flex: 1,
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "#6b7280",
  marginBottom: 10,
  marginTop: 20,
  paddingBottom: 6,
  borderBottom: "1px solid #f3f4f6",
};

const PKG_GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
};

const CATEGORY_COLORS: Record<DeliveryPanelCategory, { bg: string; border: string; text: string; dot: string }> = {
  breakfast: { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", dot: "#f97316" },
  lunch_platter: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", dot: "#3b82f6" },
  hot_lunch: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c", dot: "#ef4444" },
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
  const hasChoices = preset.groups.length > 0;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: "11px 14px",
        textAlign: "left",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        opacity: disabled ? 0.5 : 1,
        transition: "box-shadow 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.3 }}>
          {preset.displayName}
        </span>
      </div>
      {hasChoices && (
        <div style={{ fontSize: 11, color: "#9ca3af", paddingLeft: 13 }}>
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
  color,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  sublabel: string;
  color: string;
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
        border: `1px solid ${color}40`,
        background: `${color}10`,
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        opacity: disabled ? 0.5 : 1,
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 28, lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{label}</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{sublabel}</div>
      </div>
      <span style={{ fontSize: 18, color: color, fontWeight: 700 }}>→</span>
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const CATEGORY_ORDER: DeliveryPanelCategory[] = ["breakfast", "lunch_platter", "hot_lunch"];

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
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>
              Delivery
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>📦 Packages</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 22, color: "#9ca3af", cursor: "pointer", lineHeight: 1, padding: 4 }}
          >
            ✕
          </button>
        </div>

        <div style={BODY}>
          {/* Delivery Package presets */}
          {byCategory.map(({ cat, presets }) => (
            presets.length === 0 ? null : (
              <div key={cat}>
                <div style={SECTION_LABEL}>{PANEL_CATEGORY_LABELS[cat]}</div>
                <div style={PKG_GRID}>
                  {presets.map((preset) => (
                    <PackageButton
                      key={preset.key}
                      preset={preset}
                      disabled={disabled}
                      onClick={() => {
                        onClose();
                        onSelectPackage(preset);
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          ))}

          {/* Divider */}
          <div style={{ borderTop: "2px solid #f3f4f6", margin: "24px 0 20px" }} />

          {/* Boxed Lunches & Sandwich Platters */}
          <div style={{ ...SECTION_LABEL, marginTop: 0 }}>🥡 Order Builders</div>

          <BigActionButton
            icon="🥡"
            label="Boxed Lunches"
            sublabel="Individual boxes — classic, executive, or salad"
            color="#22c55e"
            disabled={disabled}
            onClick={() => {
              onClose();
              onOpenBoxedLunches();
            }}
          />
          <BigActionButton
            icon="🥪"
            label="Sandwich Platters"
            sublabel="Classic or gourmet sandwich trays"
            color="#f97316"
            disabled={disabled}
            onClick={() => {
              onClose();
              onOpenSandwichPlatters();
            }}
          />
        </div>
      </div>
    </div>
  );
}
