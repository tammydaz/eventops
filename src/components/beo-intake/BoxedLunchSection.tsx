/**
 * Boxed lunch — office: box type + sandwich counts only. Kitchen: bulk sides/dessert derived at print.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  BOX_TYPES,
  SANDWICH_NAME_SUGGESTIONS,
  getBoxTypeById,
  isSaladBoxedLunchBox,
  mergeBoxTypesWithAirtable,
  SALAD_BOXED_LUNCH_ENTREE_CHOICES,
  totalBoxesFromSandwiches,
  type BoxType,
} from "../../config/boxedLunchBeo";
import { loadBoxedLunchOrdersByEventId, upsertBoxedLunchOrderV2 } from "../../services/airtable/boxedLunchOrders";
import { fetchBoxedLunchBoxMenuItems } from "../../services/airtable/menuItems";
import { isErrorResult } from "../../services/airtable/selectors";

function rowId() {
  return `sand-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type SandwichRow = { id: string; name: string; qty: number };

function buildSaladRowsFromLoaded(loaded: Array<{ name: string; qty: number }>): SandwichRow[] {
  return SALAD_BOXED_LUNCH_ENTREE_CHOICES.map((name, i) => {
    const hit = loaded.find((l) => l.name.trim() === name);
    return { id: `salad-row-${i}`, name, qty: hit != null ? Math.max(0, Math.floor(hit.qty)) : 0 };
  });
}

type Props = {
  eventId: string | null;
  canEdit: boolean;
};

function ensureBoxTypeInList(merged: BoxType[], boxTypeId: string, v2: { boxSnapshot?: { name: string; sides: string[]; dessert: string } }): BoxType[] {
  if (getBoxTypeById(boxTypeId, merged)) return merged;
  if (v2.boxSnapshot) {
    return [
      ...merged,
      {
        id: boxTypeId,
        name: v2.boxSnapshot.name,
        sides: v2.boxSnapshot.sides,
        dessert: v2.boxSnapshot.dessert,
      },
    ];
  }
  return [...merged, { id: boxTypeId, name: boxTypeId, sides: [], dessert: "—" }];
}

export function BoxedLunchSection({ eventId, canEdit }: Props) {
  const [boxTypeId, setBoxTypeId] = useState(BOX_TYPES[0]?.id ?? "");
  const [sandwiches, setSandwiches] = useState<SandwichRow[]>([{ id: rowId(), name: "", qty: 1 }]);
  const [mergedBoxTypes, setMergedBoxTypes] = useState<BoxType[]>(BOX_TYPES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const [menuRes, orderRes] = await Promise.all([
        fetchBoxedLunchBoxMenuItems(),
        loadBoxedLunchOrdersByEventId(eventId),
      ]);

      let merged = mergeBoxTypesWithAirtable(BOX_TYPES, menuRes);

      if (isErrorResult(orderRes)) {
        setError(orderRes.message ?? "Failed to load boxed lunch");
        setMergedBoxTypes(merged);
        return;
      }

      const v2 = orderRes.find((o) => o.v2)?.v2;
      if (v2?.boxTypeId) {
        merged = ensureBoxTypeInList(merged, v2.boxTypeId, v2);
      }
      setMergedBoxTypes(merged);

      if (v2?.boxTypeId && getBoxTypeById(v2.boxTypeId, merged)) {
        const loadedBox = getBoxTypeById(v2.boxTypeId, merged);
        setBoxTypeId(v2.boxTypeId);
        if (isSaladBoxedLunchBox(v2.boxTypeId, loadedBox)) {
          setSandwiches(buildSaladRowsFromLoaded(v2.sandwiches));
        } else {
          setSandwiches(
            v2.sandwiches.length > 0
              ? v2.sandwiches.map((s) => ({ id: rowId(), name: s.name, qty: s.qty }))
              : [{ id: rowId(), name: "", qty: 1 }]
          );
        }
      } else {
        setBoxTypeId(merged[0]?.id ?? BOX_TYPES[0]?.id ?? "");
        setSandwiches([{ id: rowId(), name: "", qty: 1 }]);
      }
      setDirty(false);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const box = getBoxTypeById(boxTypeId, mergedBoxTypes);
  const saladBoxMode = isSaladBoxedLunchBox(boxTypeId, box);
  const totalBoxes = totalBoxesFromSandwiches(
    sandwiches.map((s) => ({ name: s.name, qty: s.qty }))
  );

  const updateRow = (id: string, patch: Partial<SandwichRow>) => {
    setDirty(true);
    setSandwiches((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setDirty(true);
    setSandwiches((prev) => [...prev, { id: rowId(), name: "", qty: 1 }]);
  };

  const removeRow = (id: string) => {
    setDirty(true);
    setSandwiches((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const handleSaveBoxedLunch = async () => {
    if (!canEdit) return;

    const selectedEventId = eventId;
    const selectedBoxType = boxTypeId;
    const sandwichRows = sandwiches;

    if (!selectedEventId) {
      return;
    }

    if (!selectedBoxType) {
      return;
    }

    if (!sandwichRows || sandwichRows.length === 0) {
      return;
    }

    const lines = sandwichRows
      .map((s) => ({ name: s.name.trim(), qty: Math.max(0, Math.floor(Number(s.qty) || 0)) }))
      .filter((s) => s.name && s.qty > 0);

    if (lines.length === 0) {
      setError(saladBoxMode ? "Enter at least one quantity for an entrée salad." : "Add at least one sandwich line with quantity.");
      return;
    }

    const selectedBox = getBoxTypeById(selectedBoxType, mergedBoxTypes);
    const boxSnapshot =
      selectedBox != null
        ? { name: selectedBox.name, sides: selectedBox.sides, dessert: selectedBox.dessert }
        : undefined;

    setError(null);
    try {
      // V2: orderName holds FWX_BOXED_V2 JSON — matches loadBoxedLunchOrdersByEventId + print pages.
      const result = await upsertBoxedLunchOrderV2(selectedEventId, {
        boxTypeId: selectedBoxType,
        sandwiches: lines,
        ...(boxSnapshot ? { boxSnapshot } : {}),
      });
      if (isErrorResult(result)) {
        setError(result.message ?? "Save failed");
        return;
      }
      setDirty(false);
      // Do not call load() here — Airtable read can lag and return [] briefly, which resets the form.
      setBoxTypeId(selectedBoxType);
      if (selectedBox && isSaladBoxedLunchBox(selectedBoxType, selectedBox)) {
        setSandwiches(buildSaladRowsFromLoaded(lines));
      } else {
        setSandwiches(lines.map((s) => ({ id: rowId(), name: s.name, qty: s.qty })));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setError(msg);
    }
  };

  if (!eventId) return null;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 640,
        marginTop: 12,
        marginBottom: 16,
        padding: "14px 16px",
        borderRadius: 10,
        border: "1px solid rgba(34, 197, 94, 0.45)",
        background: "rgba(34, 197, 94, 0.06)",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fefce8", marginBottom: 4 }}>Boxed lunches</div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: "0 0 12px", lineHeight: 1.45 }}>
        {saladBoxMode
          ? "Salad Boxed Lunch: enter how many of each entrée salad (includes roll, cookie & water per box). Bulk add-ons print on the kitchen BEO."
          : "Pick a box type (defines sides + dessert for every box). Enter sandwich counts only — bulk components are calculated for the kitchen BEO."}
      </p>

      {loading ? (
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Loading…</div>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#e5e7eb", display: "block", marginBottom: 6 }}>Box type</label>
            <select
              value={boxTypeId}
              disabled={!canEdit}
              onChange={(e) => {
                setDirty(true);
                const nextId = e.target.value;
                const prevSalad = saladBoxMode;
                const nextBox = getBoxTypeById(nextId, mergedBoxTypes);
                const nextSalad = isSaladBoxedLunchBox(nextId, nextBox);
                setBoxTypeId(nextId);
                if (nextSalad) {
                  setSandwiches(buildSaladRowsFromLoaded(sandwiches.map((s) => ({ name: s.name, qty: s.qty }))));
                } else if (prevSalad && !nextSalad) {
                  setSandwiches([{ id: rowId(), name: "", qty: 1 }]);
                }
              }}
              style={{
                width: "100%",
                maxWidth: 400,
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.35)",
                color: "#fff",
                fontSize: 14,
              }}
            >
              {mergedBoxTypes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {box && (
            <div style={{ marginBottom: 14, fontSize: 12, color: "rgba(253,224,71,0.9)" }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Includes (every box):</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {box.sides.map((s) => (
                  <li key={s}>{s}</li>
                ))}
                <li>{box.dessert}</li>
              </ul>
            </div>
          )}

          <div style={{ fontSize: 12, fontWeight: 600, color: "#e5e7eb", marginBottom: 8 }}>
            {saladBoxMode ? "Entrée salad counts" : "Sandwich breakdown"}
          </div>
          {saladBoxMode ? (
            <div style={{ marginBottom: 12 }}>
              {sandwiches.map((row) => (
                <div
                  key={row.id}
                  style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}
                >
                  <span
                    style={{
                      flex: "1 1 200px",
                      minWidth: 160,
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(0,0,0,0.2)",
                      color: "#e5e7eb",
                      fontSize: 14,
                    }}
                  >
                    {row.name}
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Qty"
                    value={row.qty === 0 ? "" : row.qty}
                    disabled={!canEdit}
                    onChange={(e) => updateRow(row.id, { qty: parseInt(e.target.value, 10) || 0 })}
                    style={{
                      width: 72,
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(0,0,0,0.35)",
                      color: "#fff",
                      fontSize: 14,
                    }}
                  />
                </div>
              ))}
            </div>
          )
            : sandwiches.map((row) => (
                <div key={row.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                  <input
                    type="text"
                    list="boxed-sandwich-suggestions"
                    placeholder="Sandwich name"
                    value={row.name}
                    disabled={!canEdit}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    style={{
                      flex: "1 1 200px",
                      minWidth: 160,
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(0,0,0,0.35)",
                      color: "#fff",
                      fontSize: 14,
                    }}
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Qty"
                    value={row.qty === 0 ? "" : row.qty}
                    disabled={!canEdit}
                    onChange={(e) => updateRow(row.id, { qty: parseInt(e.target.value, 10) || 0 })}
                    style={{
                      width: 72,
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(0,0,0,0.35)",
                      color: "#fff",
                      fontSize: 14,
                    }}
                  />
                  <button
                    type="button"
                    disabled={!canEdit || sandwiches.length <= 1}
                    onClick={() => removeRow(row.id)}
                    style={{
                      padding: "6px 10px",
                      fontSize: 12,
                      borderRadius: 6,
                      border: "1px solid rgba(239,68,68,0.5)",
                      background: "transparent",
                      color: "#f87171",
                      cursor: canEdit && sandwiches.length > 1 ? "pointer" : "default",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
          {!saladBoxMode && (
            <>
              <datalist id="boxed-sandwich-suggestions">
                {SANDWICH_NAME_SUGGESTIONS.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>

              <button
                type="button"
                disabled={!canEdit}
                onClick={addRow}
                style={{
                  marginBottom: 12,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "1px solid rgba(34,197,94,0.5)",
                  background: "rgba(34,197,94,0.12)",
                  color: "#86efac",
                  cursor: canEdit ? "pointer" : "default",
                }}
              >
                + Add sandwich
              </button>
            </>
          )}

          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid rgba(234,179,8,0.45)",
              background: "rgba(0,0,0,0.25)",
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "#fef9c3" }}>Total boxes</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#facc15" }}>{totalBoxes}</span>
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "#fca5a5", marginBottom: 8 }}>{error}</div>
          )}

          {/* Save: async busy-state removed; only canEdit disables this button */}
          <button
            type="button"
            disabled={!canEdit}
            onClick={handleSaveBoxedLunch}
            style={{
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: "none",
              background: canEdit ? "#22c55e" : "#444",
              color: "#fff",
              cursor: canEdit ? "pointer" : "not-allowed",
            }}
          >
            Save boxed lunch
          </button>
        </>
      )}
    </div>
  );
}
