/**
 * Sandwich Platter Config Modal — dropdown-slot pattern (same as station modals).
 * Each platter type shows only its own options; options are scoped to that tier.
 * Available for both delivery and full-service events.
 */
import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  PLATTER_CHOICES,
  PLATTER_TYPES,
  formatPlatterPickForDisplay,
  normalizePlatterRow,
  type PlatterPick,
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

const rowInputStyle: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 5,
  border: "1px solid #444",
  backgroundColor: "#1a1a1a",
  color: "#e0e0e0",
  fontSize: 12,
  minWidth: 0,
};

const MAX_PICK_QTY = 999;

function clampPickQty(q: number): number {
  return Math.max(1, Math.min(MAX_PICK_QTY, Math.floor(Number(q)) || 1));
}

export function SandwichPlatterConfigModal({
  open,
  onClose,
  onConfirm,
  initialRows = [],
  inline = false,
}: SandwichPlatterConfigModalProps) {
  // Each row: platterType, picks (ordered slots w/ qty per type), customPicks (typed extras), quantity
  const [rows, setRows] = useState<(PlatterRow & { customPicks: PlatterPick[] })[]>(() =>
    initialRows.length > 0
      ? initialRows.map((r) => ({
          ...normalizePlatterRow(r),
          id: r.id || generateId(),
          customPicks: [],
        }))
      : [{ id: generateId(), platterType: "Classic Sandwiches", picks: [], quantity: 1, customPicks: [] }]
  );

  // Per-row custom input text
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && initialRows.length > 0) {
      setRows(
        initialRows.map((r) => ({
          ...normalizePlatterRow(r),
          id: r.id || generateId(),
          customPicks: [],
        })),
      );
    }
  }, [open]);

  const total = rows.reduce((sum, r) => sum + (r.quantity || 0), 0);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      { id: generateId(), platterType: "Classic Sandwiches", picks: [], quantity: 1, customPicks: [] as PlatterPick[] },
    ]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updatePlatterType = useCallback((id: string, platterType: string) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, platterType, picks: [], customPicks: [] } : r));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, quantity } : r));
  }, []);

  // Update a specific pick slot index
  const updatePickSlot = useCallback((rowId: string, slotIdx: number, value: string) => {
    setRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r;
      const config = PLATTER_CHOICES[r.platterType];
      if (!config) return r;
      const next = [...r.picks];
      while (next.length <= slotIdx) next.push({ name: "", qty: 1 });
      const prevPick = next[slotIdx] ?? { name: "", qty: 1 };
      next[slotIdx] = { name: value, qty: prevPick.qty };
      return { ...r, picks: next };
    }));
  }, []);

  const updatePickQty = useCallback((rowId: string, slotIdx: number, qty: number) => {
    setRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r;
      const next = [...r.picks];
      while (next.length <= slotIdx) next.push({ name: "", qty: 1 });
      const cur = next[slotIdx] ?? { name: "", qty: 1 };
      next[slotIdx] = { ...cur, qty: clampPickQty(qty) };
      return { ...r, picks: next };
    }));
  }, []);

  // Add an extra slot (up to maxPick)
  const addPickSlot = useCallback((rowId: string) => {
    setRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r;
      const config = PLATTER_CHOICES[r.platterType];
      if (!config || r.picks.length >= config.maxPick) return r;
      return { ...r, picks: [...r.picks, { name: "", qty: 1 }] };
    }));
  }, []);

  const clearPickSlot = useCallback((rowId: string, slotIdx: number) => {
    setRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r;
      const next = [...r.picks];
      next[slotIdx] = { name: "", qty: 1 };
      return { ...r, picks: next };
    }));
  }, []);

  const addCustomPick = useCallback((rowId: string) => {
    const text = (customInputs[rowId] || "").trim();
    if (!text) return;
    setRows((prev) => prev.map((r) => r.id === rowId ? { ...r, customPicks: [...r.customPicks, { name: text, qty: 1 }] } : r));
    setCustomInputs((prev) => ({ ...prev, [rowId]: "" }));
  }, [customInputs]);

  const removeCustomPick = useCallback((rowId: string, idx: number) => {
    setRows((prev) => prev.map((r) => r.id === rowId ? { ...r, customPicks: r.customPicks.filter((_, i) => i !== idx) } : r));
  }, []);

  const updateCustomPickQty = useCallback((rowId: string, idx: number, qty: number) => {
    setRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r;
      const next = [...r.customPicks];
      const cur = next[idx];
      if (!cur) return r;
      next[idx] = { ...cur, qty: clampPickQty(qty) };
      return { ...r, customPicks: next };
    }));
  }, []);

  const handleConfirm = useCallback(() => {
    const valid = rows
      .filter((r) => r.quantity > 0)
      .map((r) => ({
        id: r.id,
        platterType: r.platterType,
        picks: [...r.picks.filter(Boolean), ...r.customPicks],
        quantity: r.quantity,
      }))
      .filter((r) => r.picks.length > 0);
    onConfirm(valid);
    onClose();
  }, [rows, onConfirm, onClose]);

  const handleClearAll = useCallback(() => {
    setRows([{ id: generateId(), platterType: "Classic Sandwiches", picks: [], quantity: 1, customPicks: [] as PlatterPick[] }]);
    setCustomInputs({});
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
              width: "min(660px, 95vw)",
              maxHeight: "88vh",
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
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#e0e0e0" }}>
          Sandwich Platter — Configure selections
        </h3>
        {!inline && (
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#888", fontSize: 24, cursor: "pointer", padding: "0 8px", lineHeight: 1 }}>×</button>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
          Each platter shows only its own options. Use the dropdown slots to pick your selections; use +/− for how many of each type. Or type a custom item at the bottom of each platter.
        </p>

        {rows.map((row) => {
          const config = PLATTER_CHOICES[row.platterType];
          if (!config) return null;
          const filledSlots = row.picks.filter((p) => p.name.trim()).length;
          const totalSelected = filledSlots + row.customPicks.filter((p) => p.name.trim()).length;
          const slotsToShow = Math.max(row.picks.length, Math.min(config.maxPick, 1));

          return (
            <div key={row.id} style={{ marginBottom: 20, padding: 14, background: "#252525", borderRadius: 8, border: "1px solid #333" }}>
              {/* Row header: platter type + qty + remove */}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 12, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 220px" }}>
                  <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 4 }}>Platter type</label>
                  <select
                    value={row.platterType}
                    onChange={(e) => updatePlatterType(row.id, e.target.value)}
                    style={{ ...rowInputStyle, width: "100%", fontSize: 13 }}
                  >
                    {PLATTER_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div style={{ width: 72 }}>
                  <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 4 }}>Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={row.quantity || ""}
                    onChange={(e) => updateQuantity(row.id, parseInt(e.target.value, 10) || 0)}
                    style={{ ...rowInputStyle, width: "100%", fontSize: 13 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  style={{ padding: "6px 10px", fontSize: 11, fontWeight: 600, background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 5, cursor: "pointer", marginBottom: 1 }}
                >
                  ✕ Remove
                </button>
              </div>

              {/* Pick instruction */}
              <div style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>
                {config.instruction} — <span style={{ color: totalSelected > 0 ? accentColor : "#666" }}>{totalSelected} of {config.maxPick} selected</span>
              </div>

              {/* Dropdown slots */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Array.from({ length: slotsToShow }).map((_, slotIdx) => {
                  const pick = row.picks[slotIdx] ?? { name: "", qty: 1 };
                  const slotValue = pick.name;
                  const slotQty = clampPickQty(pick.qty);
                  const takenByOtherSlots = new Set(
                    row.picks.filter((p, i) => i !== slotIdx && p.name.trim()).map((p) => p.name),
                  );
                  const availableOptions = config.options.filter((opt) => !takenByOtherSlots.has(opt));
                  return (
                    <div key={slotIdx} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <select
                        value={slotValue}
                        onChange={(e) => updatePickSlot(row.id, slotIdx, e.target.value)}
                        style={{ ...rowInputStyle, flex: "1 1 160px", fontSize: 12, minWidth: 120 }}
                      >
                        <option value="">Select {config.label} option {slotIdx + 1}...</option>
                        {availableOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        {slotValue && !availableOptions.includes(slotValue) && (
                          <option value={slotValue}>{slotValue}</option>
                        )}
                      </select>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, color: "#666", width: 28 }}>Qty</span>
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updatePickQty(row.id, slotIdx, slotQty - 1)}
                          disabled={slotQty <= 1}
                          style={{
                            width: 28,
                            height: 28,
                            padding: 0,
                            borderRadius: 5,
                            border: "1px solid #555",
                            background: "#333",
                            color: "#e0e0e0",
                            fontSize: 16,
                            lineHeight: 1,
                            cursor: slotQty <= 1 ? "default" : "pointer",
                            opacity: slotQty <= 1 ? 0.4 : 1,
                          }}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={MAX_PICK_QTY}
                          value={slotQty}
                          onChange={(e) => updatePickQty(row.id, slotIdx, parseInt(e.target.value, 10))}
                          style={{ ...rowInputStyle, width: 48, textAlign: "center", padding: "4px 4px" }}
                        />
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updatePickQty(row.id, slotIdx, slotQty + 1)}
                          disabled={slotQty >= MAX_PICK_QTY}
                          style={{
                            width: 28,
                            height: 28,
                            padding: 0,
                            borderRadius: 5,
                            border: "1px solid #555",
                            background: "#333",
                            color: "#e0e0e0",
                            fontSize: 16,
                            lineHeight: 1,
                            cursor: slotQty >= MAX_PICK_QTY ? "default" : "pointer",
                            opacity: slotQty >= MAX_PICK_QTY ? 0.4 : 1,
                          }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => clearPickSlot(row.id, slotIdx)}
                        disabled={!slotValue}
                        style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: accentColor, fontSize: 13, cursor: slotValue ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: slotValue ? 1 : 0.4, flexShrink: 0 }}
                      >✕</button>
                    </div>
                  );
                })}

                {/* Custom picks (typed extras) */}
                {row.customPicks.map((cp, idx) => {
                  const cq = clampPickQty(cp.qty);
                  return (
                    <div key={`custom-${idx}`} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <div style={{ ...rowInputStyle, flex: "1 1 160px", fontSize: 12, color: "#aaa", background: "#1a1a1a", border: "1px solid #555", display: "flex", alignItems: "center", minWidth: 120 }}>
                        {cp.name} <span style={{ marginLeft: 6, fontSize: 10, color: "#666" }}>(custom)</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, color: "#666", width: 28 }}>Qty</span>
                        <button
                          type="button"
                          aria-label="Decrease custom quantity"
                          onClick={() => updateCustomPickQty(row.id, idx, cq - 1)}
                          disabled={cq <= 1}
                          style={{
                            width: 28,
                            height: 28,
                            padding: 0,
                            borderRadius: 5,
                            border: "1px solid #555",
                            background: "#333",
                            color: "#e0e0e0",
                            fontSize: 16,
                            lineHeight: 1,
                            cursor: cq <= 1 ? "default" : "pointer",
                            opacity: cq <= 1 ? 0.4 : 1,
                          }}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={MAX_PICK_QTY}
                          value={cq}
                          onChange={(e) => updateCustomPickQty(row.id, idx, parseInt(e.target.value, 10))}
                          style={{ ...rowInputStyle, width: 48, textAlign: "center", padding: "4px 4px" }}
                        />
                        <button
                          type="button"
                          aria-label="Increase custom quantity"
                          onClick={() => updateCustomPickQty(row.id, idx, cq + 1)}
                          disabled={cq >= MAX_PICK_QTY}
                          style={{
                            width: 28,
                            height: 28,
                            padding: 0,
                            borderRadius: 5,
                            border: "1px solid #555",
                            background: "#333",
                            color: "#e0e0e0",
                            fontSize: 16,
                            lineHeight: 1,
                            cursor: cq >= MAX_PICK_QTY ? "default" : "pointer",
                            opacity: cq >= MAX_PICK_QTY ? 0.4 : 1,
                          }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCustomPick(row.id, idx)}
                        style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#ef4444", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      >✕</button>
                    </div>
                  );
                })}

                {/* Add more slot button */}
                {row.picks.length < config.maxPick && totalSelected < config.maxPick && (
                  <button
                    type="button"
                    onClick={() => addPickSlot(row.id)}
                    style={{ alignSelf: "flex-start", padding: "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: 5, border: `1px solid ${accentColor}`, background: accentBg, color: accentColor, cursor: "pointer" }}
                  >
                    + Add slot
                  </button>
                )}

                {/* Custom text input */}
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <input
                    type="text"
                    value={customInputs[row.id] || ""}
                    onChange={(e) => setCustomInputs((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    placeholder="Type custom item not on list..."
                    style={{ ...rowInputStyle, flex: 1, fontSize: 12 }}
                    onKeyDown={(e) => { if (e.key === "Enter") addCustomPick(row.id); }}
                  />
                  <button
                    type="button"
                    onClick={() => addCustomPick(row.id)}
                    disabled={!(customInputs[row.id] || "").trim()}
                    style={{ padding: "5px 10px", fontSize: 11, fontWeight: 600, borderRadius: 5, border: `1px solid ${accentColor}`, background: accentBg, color: accentColor, cursor: (customInputs[row.id] || "").trim() ? "pointer" : "not-allowed", opacity: (customInputs[row.id] || "").trim() ? 1 : 0.5 }}
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add platter button */}
        <button
          type="button"
          onClick={addRow}
          style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: `2px solid ${accentColor}`, background: accentBg, color: accentColor, cursor: "pointer", marginBottom: 16 }}
        >
          + Add platter
        </button>

        {/* Summary */}
        {rows.some((r) => (r.picks.some((p) => p.name.trim()) || r.customPicks.some((p) => p.name.trim())) && r.quantity > 0) && (
          <div style={{ marginBottom: 12, padding: 12, background: "#1a1a1a", borderRadius: 8, border: "1px solid #333" }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Summary</div>
            {rows
              .filter((r) => (r.picks.some((p) => p.name.trim()) || r.customPicks.some((p) => p.name.trim())) && r.quantity > 0)
              .map((row) => {
                const allPicks = [
                  ...row.picks.filter((p) => p.name.trim()),
                  ...row.customPicks.filter((p) => p.name.trim()),
                ];
                return (
                  <div key={row.id} style={{ fontSize: 12, color: "#c0c0c0", marginBottom: 4 }}>
                    <strong style={{ color: accentColor }}>{row.platterType}</strong> × {row.quantity}:
                    <div style={{ paddingLeft: 12, marginTop: 2 }}>
                      {allPicks.map((p, i) => (
                        <div key={i} style={{ fontSize: 11, color: "#aaa" }}>• {formatPlatterPickForDisplay(p)}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Total */}
        <div style={{ padding: "12px 16px", background: "#0a0a0a", borderRadius: 8, border: `2px solid ${accentColor}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#e0e0e0" }}>Total platters</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: accentColor }}>{total}</span>
        </div>
      </div>

      {/* Footer */}
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
