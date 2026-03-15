/**
 * Boxed Lunch Config Modal — Pick 1 (sandwich), Pick 2 (format), quantity per row.
 * Auto-calculates total. Pattern matches Viva la Pasta / station config.
 */
import React, { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  BOXED_LUNCH_TYPES_WITH_PICKS,
  BOXED_LUNCH_SANDWICH_OPTIONS,
  FORMAT_OPTIONS,
  type BoxedLunchRow,
  type FormatValue,
} from "../../config/boxedLunchConfig";

const accentColor = "#22c55e";
const accentBg = "rgba(34, 197, 94, 0.15)";

function generateId() {
  return `bl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type BoxedLunchConfigModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (rows: BoxedLunchRow[]) => void;
  initialRows?: BoxedLunchRow[];
  /** When true, render inline in the page instead of as a modal overlay */
  inline?: boolean;
};

export function BoxedLunchConfigModal({
  open,
  onClose,
  onConfirm,
  initialRows = [],
  inline = false,
}: BoxedLunchConfigModalProps) {
  const [rows, setRows] = useState<BoxedLunchRow[]>(() =>
    initialRows.length > 0
      ? initialRows.map((r) => ({ ...r, id: r.id || generateId() }))
      : [{ id: generateId(), boxedLunchType: "Premium werx", pick1: "", pick2: "Sandwich", quantity: 1 }]
  );

  const total = rows.reduce((sum, r) => sum + (r.quantity || 0), 0);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id: generateId(),
        boxedLunchType: "Premium werx",
        pick1: "",
        pick2: "Sandwich" as FormatValue,
        quantity: 1,
      },
    ]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRow = useCallback((id: string, patch: Partial<BoxedLunchRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }, []);

  const handleConfirm = useCallback(() => {
    const valid = rows.filter((r) => r.pick1 && r.quantity > 0);
    onConfirm(valid);
    onClose();
  }, [rows, onConfirm, onClose]);

  const handleClearAll = useCallback(() => {
    setRows([{ id: generateId(), boxedLunchType: "Premium werx", pick1: "", pick2: "Sandwich", quantity: 1 }]);
  }, []);

  if (!open) return null;

  const formContent = (
    <div
      style={{
        ...(inline
          ? { width: "100%", maxWidth: "100%", marginTop: 12 }
          : {
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(560px, 95vw)",
              maxHeight: "85vh",
              zIndex: 99999,
            }),
        background: "#1a1a1a",
        border: `2px solid ${accentColor}`,
        borderRadius: 12,
        boxShadow: inline ? "none" : "0 12px 40px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      {...(inline ? {} : { onClick: (e: React.MouseEvent) => e.stopPropagation() })}
    >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#e0e0e0" }}>
            Boxed Lunch — Pick 1 + Pick 2
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              fontSize: 24,
              cursor: "pointer",
              padding: "0 8px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
            <strong>Pick 1</strong> — Customer chooses 1 sandwich. <strong>Pick 2</strong> — Format (wrap, GF roll, etc.) when they want it on a wrap or GF roll. Add rows for each variation; total auto-calculates.
          </p>

          {rows.map((row) => {
            const sandwichOpts = BOXED_LUNCH_SANDWICH_OPTIONS[row.boxedLunchType] ?? [];
            return (
              <div
                key={row.id}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  background: "#252525",
                  borderRadius: 8,
                  border: "1px solid #333",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 70px 40px",
                    gap: 10,
                    alignItems: "end",
                  }}
                >
                  <div>
                    <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 4 }}>Type</label>
                    <select
                      value={row.boxedLunchType}
                      onChange={(e) => updateRow(row.id, { boxedLunchType: e.target.value, pick1: "" })}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        fontSize: 13,
                        borderRadius: 6,
                        border: "1px solid #444",
                        background: "#1a1a1a",
                        color: "#e0e0e0",
                      }}
                    >
                      {BOXED_LUNCH_TYPES_WITH_PICKS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 4 }}>Pick 1 — Choice of 1 sandwich</label>
                    <select
                      value={row.pick1}
                      onChange={(e) => updateRow(row.id, { pick1: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        fontSize: 13,
                        borderRadius: 6,
                        border: "1px solid #444",
                        background: "#1a1a1a",
                        color: "#e0e0e0",
                      }}
                    >
                      <option value="">— Select —</option>
                      {sandwichOpts.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 4 }}>Pick 2 — Format (wrap, GF roll, etc.)</label>
                    <select
                      value={row.pick2}
                      onChange={(e) => updateRow(row.id, { pick2: e.target.value as FormatValue })}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        fontSize: 13,
                        borderRadius: 6,
                        border: "1px solid #444",
                        background: "#1a1a1a",
                        color: "#e0e0e0",
                      }}
                    >
                      {FORMAT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 4 }}>Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={row.quantity || ""}
                      onChange={(e) => updateRow(row.id, { quantity: parseInt(e.target.value, 10) || 0 })}
                      style={{
                        width: "100%",
                        padding: "8px 6px",
                        fontSize: 13,
                        borderRadius: 6,
                        border: "1px solid #444",
                        background: "#1a1a1a",
                        color: "#e0e0e0",
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: 18,
                      padding: "4px 8px",
                      alignSelf: "center",
                    }}
                    title="Remove row"
                  >
                    ✕
                  </button>
                </div>
                {row.pick2 === "Other" && (
                  <div style={{ marginTop: 8 }}>
                    <input
                      type="text"
                      placeholder="Specify format (e.g. lettuce wrap, croissant)"
                      value={row.pick2Other ?? ""}
                      onChange={(e) => updateRow(row.id, { pick2Other: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        fontSize: 12,
                        borderRadius: 6,
                        border: "1px solid #444",
                        background: "#1a1a1a",
                        color: "#e0e0e0",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addRow}
            style={{
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: `2px solid ${accentColor}`,
              background: accentBg,
              color: accentColor,
              cursor: "pointer",
              marginBottom: 16,
            }}
          >
            + Add row
          </button>

          {/* Breakdown: each variation with qty */}
          {rows.filter((r) => r.pick1 && r.quantity > 0).length > 0 && (
            <div style={{ marginBottom: 12, padding: 12, background: "#1a1a1a", borderRadius: 8, border: "1px solid #333" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Variations (auto-calculated)</div>
              {rows
                .filter((r) => r.pick1 && r.quantity > 0)
                .map((row) => {
                  const formatLabel = row.pick2 === "Other" ? (row.pick2Other || "Other") : row.pick2;
                  return (
                    <div key={row.id} style={{ fontSize: 12, color: "#c0c0c0", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                      <span>{row.pick1} — {formatLabel}</span>
                      <span style={{ fontWeight: 600, color: accentColor }}>× {row.quantity}</span>
                    </div>
                  );
                })}
            </div>
          )}

          <div
            style={{
              padding: "12px 16px",
              background: "#0a0a0a",
              borderRadius: 8,
              border: `2px solid ${accentColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e0e0e0" }}>Total boxes</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: accentColor }}>{total}</span>
          </div>
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid #333", display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={handleClearAll}
            style={{
              padding: "10px 16px",
              fontSize: 13,
              borderRadius: 8,
              border: "1px solid #555",
              background: "transparent",
              color: "#888",
              cursor: "pointer",
            }}
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 16px",
              fontSize: 13,
              borderRadius: 8,
              border: "1px solid #555",
              background: "transparent",
              color: "#e0e0e0",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={total === 0}
            style={{
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: "none",
              background: total > 0 ? accentColor : "#444",
              color: "#fff",
              cursor: total > 0 ? "pointer" : "not-allowed",
            }}
          >
            Done
          </button>
        </div>
    </div>
  );

  const fullContent = inline ? (
    formContent
  ) : (
    <>
      <div
        role="presentation"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          zIndex: 99998,
        }}
        onClick={onClose}
      />
      {formContent}
    </>
  );

  return inline ? fullContent : createPortal(fullContent, document.body);
}
