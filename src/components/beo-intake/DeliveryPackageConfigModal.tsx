/**
 * DeliveryPackageConfigModal
 *
 * Guided "Pick N" modal for delivery packages that have choice groups —
 * e.g. "It's Your Choice Breakfast (Pick 2 Meats)", "Classic Sandwich Platter (Pick 5)".
 *
 * Pattern mirrors StationComponentsConfigModal / BoxedLunchSection:
 *   - Each group shows as a labelled section with checkboxes
 *   - pickCount enforced: once limit reached, unselected options are disabled
 *   - Auto-included items shown as locked grey lines
 *   - Save blocked until every group with pickCount > 0 is satisfied
 */
import React, { useState, useMemo } from "react";
import {
  type DeliveryPackagePreset,
  type DeliveryPickGroup,
  formatDeliveryPackagePicksAsLines,
} from "../../config/deliveryPackagePresets";

interface Props {
  preset: DeliveryPackagePreset;
  itemName: string;
  onConfirm: (customLines: string[]) => void;
  onCancel: () => void;
}

// ── Dark theme ────────────────────────────────────────────────────────────────

const BG_PANEL   = "#111827";
const BG_CARD    = "#1e2736";
const BG_HEADER  = "#111827";
const BORDER     = "rgba(255,255,255,0.1)";
const TEXT_PRI   = "#f0f4f8";
const TEXT_MUT   = "rgba(255,255,255,0.45)";

// ── Styles ────────────────────────────────────────────────────────────────────

const OVERLAY: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.72)",
  zIndex: 9000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

const MODAL: React.CSSProperties = {
  background: BG_PANEL,
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  width: "100%",
  maxWidth: 560,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
  display: "flex",
  flexDirection: "column",
};

const HEADER: React.CSSProperties = {
  padding: "20px 24px 14px",
  borderBottom: `1px solid ${BORDER}`,
  position: "sticky",
  top: 0,
  background: BG_HEADER,
  zIndex: 1,
};

const BODY: React.CSSProperties = {
  padding: "16px 24px",
  flex: 1,
};

const FOOTER: React.CSSProperties = {
  padding: "14px 24px",
  borderTop: `1px solid ${BORDER}`,
  display: "flex",
  gap: 10,
  justifyContent: "flex-end",
  position: "sticky",
  bottom: 0,
  background: BG_PANEL,
};

const GROUP_BOX: React.CSSProperties = {
  marginBottom: 18,
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  overflow: "hidden",
};

const GROUP_HEADER: React.CSSProperties = {
  padding: "8px 12px",
  background: BG_CARD,
  borderBottom: `1px solid ${BORDER}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const GROUP_LABEL: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 12,
  color: "rgba(255,255,255,0.7)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const OPTION_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 12px",
  cursor: "pointer",
  transition: "background 0.1s",
};

const AUTO_ROW: React.CSSProperties = {
  padding: "6px 12px",
  fontSize: 13,
  color: "rgba(255,255,255,0.5)",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

function pill(count: number, needed: number) {
  const done = count >= needed;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 99,
        background: done ? "#dcfce7" : "#fef3c7",
        color: done ? "#15803d" : "#92400e",
      }}
    >
      {count}/{needed}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DeliveryPackageConfigModal({ preset, itemName, onConfirm, onCancel }: Props) {
  // picks[groupLabel] = array of selected option strings
  const [picks, setPicks] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const g of preset.groups) init[g.label] = [];
    return init;
  });

  function toggle(group: DeliveryPickGroup, option: string) {
    setPicks((prev) => {
      const current = prev[group.label] ?? [];
      if (current.includes(option)) {
        return { ...prev, [group.label]: current.filter((o) => o !== option) };
      }
      if (current.length >= group.pickCount) {
        // Replace last selection if already at limit (single-pick behaviour)
        if (group.pickCount === 1) {
          return { ...prev, [group.label]: [option] };
        }
        return prev; // at limit, ignore
      }
      return { ...prev, [group.label]: [...current, option] };
    });
  }

  const validation = useMemo(() => {
    const missing: string[] = [];
    for (const g of preset.groups) {
      const selected = picks[g.label] ?? [];
      if (selected.length < g.pickCount) missing.push(g.label);
    }
    return missing;
  }, [picks, preset.groups]);

  function handleConfirm() {
    if (validation.length > 0) {
      alert(`Please complete the following sections before saving:\n\n• ${validation.join("\n• ")}`);
      return;
    }
    const lines = formatDeliveryPackagePicksAsLines(preset, picks);
    onConfirm(lines);
  }

  return (
    <div style={OVERLAY} onClick={onCancel}>
      <div style={MODAL} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={HEADER}>
          <div style={{ fontSize: 10, fontWeight: 700, color: TEXT_MUT, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            Delivery Package
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: TEXT_PRI }}>{itemName}</div>
          <div style={{ fontSize: 13, color: TEXT_MUT, marginTop: 4 }}>
            Make selections for each section below, then save.
          </div>
        </div>

        {/* Choice groups */}
        <div style={BODY}>
          {preset.groups.map((group) => {
            const selected = picks[group.label] ?? [];
            const atLimit = selected.length >= group.pickCount;
            const done = selected.length >= group.pickCount;

            return (
              <div key={group.label} style={GROUP_BOX}>
                <div style={GROUP_HEADER}>
                  <span style={GROUP_LABEL}>{group.label}</span>
                  {pill(selected.length, group.pickCount)}
                </div>
                {group.options.map((opt) => {
                  const checked = selected.includes(opt);
                  const disabled = !checked && atLimit;
                  return (
                    <div
                      key={opt}
                      style={{
                        ...OPTION_ROW,
                        background: checked ? "rgba(59,130,246,0.15)" : "transparent",
                        opacity: disabled ? 0.4 : 1,
                        cursor: disabled ? "not-allowed" : "pointer",
                      }}
                      onClick={() => !disabled && toggle(group, opt)}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: group.pickCount === 1 ? "50%" : 4,
                          border: checked ? "none" : `2px solid rgba(255,255,255,0.25)`,
                          background: checked ? "#2563eb" : "rgba(255,255,255,0.07)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {checked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: 14, color: TEXT_PRI }}>{opt}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Auto-included section */}
          {(preset.autoIncluded ?? []).length > 0 && (
            <div style={{ ...GROUP_BOX, borderColor: "rgba(34,197,94,0.25)" }}>
              <div style={{ ...GROUP_HEADER, background: "rgba(34,197,94,0.1)" }}>
                <span style={{ ...GROUP_LABEL, color: "#4ade80" }}>Always Included</span>
                <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>✓ Auto</span>
              </div>
              {(preset.autoIncluded ?? []).map((item) => (
                <div key={item} style={AUTO_ROW}>
                  <span style={{ color: "#16a34a", fontSize: 14 }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Validation summary */}
          {validation.length > 0 && (
            <div
              style={{
                background: "rgba(234,179,8,0.12)",
                border: "1px solid rgba(234,179,8,0.4)",
                borderRadius: 8,
                padding: "10px 14px",
                marginTop: 8,
                fontSize: 13,
                color: "#fde047",
              }}
            >
              <strong>Still needed:</strong> {validation.join(", ")}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={FOOTER}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "9px 20px",
              borderRadius: 6,
              border: `1px solid ${BORDER}`,
              background: "rgba(255,255,255,0.06)",
              fontSize: 14,
              cursor: "pointer",
              color: TEXT_PRI,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={validation.length > 0}
            style={{
              padding: "9px 20px",
              borderRadius: 6,
              border: "none",
              background: validation.length > 0 ? "#374151" : "#2563eb",
              color: validation.length > 0 ? "rgba(255,255,255,0.35)" : "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: validation.length > 0 ? "not-allowed" : "pointer",
            }}
          >
            Add to BEO
          </button>
        </div>
      </div>
    </div>
  );
}
