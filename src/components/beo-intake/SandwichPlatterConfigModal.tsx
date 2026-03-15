/**
 * Sandwich Platter Config Modal — Pick X from list (e.g. "Pick up to 5 selections").
 * Same pattern as Boxed Lunch / Viva la Pasta.
 */
import React, { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  PLATTER_CHOICES,
  PLATTER_TYPES,
  type PlatterRow,
} from "../../config/sandwichPlatterConfig";

const accentColor = "#f97316";
const accentBg = "rgba(249, 115, 22, 0.15)";

function generateId() {
  return `platter-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type SandwichPlatterConfigModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (rows: PlatterRow[]) => void;
  initialRows?: PlatterRow[];
  inline?: boolean;
};

export function SandwichPlatterConfigModal({
  open,
  onClose,
  onConfirm,
  initialRows = [],
  inline = false,
}: SandwichPlatterConfigModalProps) {
  const [rows, setRows] = useState<PlatterRow[]>(() =>
    initialRows.length > 0
      ? initialRows.map((r) => ({ ...r, id: r.id || generateId() }))
      : [{ id: generateId(), platterType: "Classic Sandwiches", picks: [], quantity: 1 }]
  );

  const total = rows.reduce((sum, r) => sum + (r.quantity || 0), 0);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      { id: generateId(), platterType: "Classic Sandwiches", picks: [], quantity: 1 },
    ]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRow = useCallback((id: string, patch: Partial<PlatterRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const togglePick = useCallback(
    (rowId: string, option: string) => {
      const row = rows.find((r) => r.id === rowId);
      if (!row) return;
      const config = PLATTER_CHOICES[row.platterType];
      if (!config) return;
      const has = row.picks.includes(option);
      if (has) {
        updateRow(rowId, { picks: row.picks.filter((p) => p !== option) });
      } else if (row.picks.length < config.maxPick) {
        updateRow(rowId, { picks: [...row.picks, option] });
      }
    },
    [rows, updateRow]
  );

  const handleConfirm = useCallback(() => {
    const valid = rows.filter((r) => r.picks.length > 0 && r.quantity > 0);
    onConfirm(valid);
    onClose();
  }, [rows, onConfirm, onClose]);

  const handleClearAll = useCallback(() => {
    setRows([{ id: generateId(), platterType: "Classic Sandwiches", picks: [], quantity: 1 }]);
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
              width: "min(600px, 95vw)",
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
          Sandwich Platter — Pick your selections
        </h3>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#888", fontSize: 24, cursor: "pointer", padding: "0 8px", lineHeight: 1 }}>×</button>
      </div>

      <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
          Select your choices for each platter. Most platters allow up to 5 selections; Panini allows 2 per 10 guests.
        </p>

        {rows.map((row) => {
          const config = PLATTER_CHOICES[row.platterType];
          if (!config) return null;
          return (
            <div
              key={row.id}
              style={{ marginBottom: 16, padding: 12, background: "#252525", borderRadius: 8, border: "1px solid #333" }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 4 }}>Platter type</label>
                  <select
                    value={row.platterType}
                    onChange={(e) => updateRow(row.id, { platterType: e.target.value, picks: [] })}
                    style={{ width: "100%", padding: "8px 10px", fontSize: 13, borderRadius: 6, border: "1px solid #444", background: "#1a1a1a", color: "#e0e0e0" }}
                  >
                    {PLATTER_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div style={{ width: 80 }}>
                  <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 4 }}>Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={row.quantity || ""}
                    onChange={(e) => updateRow(row.id, { quantity: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: "100%", padding: "8px 6px", fontSize: 13, borderRadius: 6, border: "1px solid #444", background: "#1a1a1a", color: "#e0e0e0" }}
                  />
                </div>
                <button type="button" onClick={() => removeRow(row.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, padding: "4px 8px" }} title="Remove row">✕</button>
              </div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>
                {config.instruction} — {row.picks.length} of {config.maxPick} selected
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {config.options.map((opt) => {
                  const checked = row.picks.includes(opt);
                  const disabled = !checked && row.picks.length >= config.maxPick;
                  return (
                    <label
                      key={opt}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: checked ? accentBg : "#1a1a1a",
                        border: `1px solid ${checked ? accentColor : "#444"}`,
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.5 : 1,
                        fontSize: 12,
                        color: "#e0e0e0",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePick(row.id, opt)}
                        disabled={disabled}
                        style={{ accentColor }}
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addRow}
          style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: `2px solid ${accentColor}`, background: accentBg, color: accentColor, cursor: "pointer", marginBottom: 16 }}
        >
          + Add platter
        </button>

        {rows.filter((r) => r.picks.length > 0 && r.quantity > 0).length > 0 && (
          <div style={{ marginBottom: 12, padding: 12, background: "#1a1a1a", borderRadius: 8, border: "1px solid #333" }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Summary</div>
            {rows
              .filter((r) => r.picks.length > 0 && r.quantity > 0)
              .map((row) => (
                <div key={row.id} style={{ fontSize: 12, color: "#c0c0c0", marginBottom: 4 }}>
                  <strong>{row.platterType}</strong> × {row.quantity}: {row.picks.join(", ")}
                </div>
              ))}
          </div>
        )}

        <div style={{ padding: "12px 16px", background: "#0a0a0a", borderRadius: 8, border: `2px solid ${accentColor}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#e0e0e0" }}>Total platters</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: accentColor }}>{total}</span>
        </div>
      </div>

      <div style={{ padding: "16px 20px", borderTop: "1px solid #333", display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button type="button" onClick={handleClearAll} style={{ padding: "10px 16px", fontSize: 13, borderRadius: 8, border: "1px solid #555", background: "transparent", color: "#888", cursor: "pointer" }}>Clear all</button>
        <button type="button" onClick={onClose} style={{ padding: "10px 16px", fontSize: 13, borderRadius: 8, border: "1px solid #555", background: "transparent", color: "#e0e0e0", cursor: "pointer" }}>Cancel</button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={total === 0}
          style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", background: total > 0 ? accentColor : "#444", color: "#fff", cursor: total > 0 ? "pointer" : "not-allowed" }}
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
      <div role="presentation" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99998 }} onClick={onClose} />
      {formContent}
    </>
  );

  return inline ? fullContent : createPortal(fullContent, document.body);
}
