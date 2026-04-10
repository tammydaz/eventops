/**
 * Boxed lunch section — compact 3-step picker:
 * 1. Choose box type (dropdown + included items summary)
 * 2. Pick sandwiches/salads from a catalog list
 * 3. Review totals + save
 *
 * Replaces the old per-sandwich expanded card form.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BOX_TYPES,
  displayBoxTypeLabelForUi,
  getBoxTypeById,
  isClassicBoxedLunchBoxType,
  isExecutiveWerxBox,
  isSaladBoxedLunchBox,
  mergeBoxTypesWithAirtable,
  SALAD_BOXED_LUNCH_ENTREE_CHOICES,
  totalBoxesFromSandwiches,
  type BoxType,
  type BoxedLunchSandwichLine,
} from "../../config/boxedLunchBeo";
import {
  BOXED_LUNCH_BREAD_TYPES,
  coalesceBoxedSandwichLines,
} from "../../config/boxedLunchCustomization";
import { loadBoxedLunchOrdersByEventId, upsertBoxedLunchOrderV2 } from "../../services/airtable/boxedLunchOrders";
import { BOXED_LUNCH_MISSING_BREAD_ERROR } from "../../utils/boxedLunchPrint";
import {
  fetchBoxedLunchBoxMenuItems,
  fetchClassicBoxedLunchSandwichesByCategory,
  fetchMenuItemsByBoxLunchType,
  type BoxLunchTypeValue,
  type MenuItemRecord,
} from "../../services/airtable/menuItems";
import { isErrorResult } from "../../services/airtable/selectors";
import { getAllowedBoxLunchTypesForBox } from "../../config/boxedLunchSandwichAllowlist";
import { useEventStore } from "../../state/eventStore";

// ── Types ─────────────────────────────────────────────────────────────────────

const TAB_KEYS = ["classic", "gourmet", "wrap"] as const;
type TabKey = (typeof TAB_KEYS)[number];
const TAB_CONFIG: Record<TabKey, { label: string; airtableValue: BoxLunchTypeValue }> = {
  classic: { label: "Classic", airtableValue: "Classic Sandwich" },
  gourmet: { label: "Gourmet", airtableValue: "Gourmet Sandwich" },
  wrap: { label: "Wrap", airtableValue: "Wrap" },
};

type SandwichLineUi = {
  id: string;
  menuItemId: string;
  name: string;
  qty: number;
  breadType: string;
  customNotes: string;
};

type SaladRow = { id: string; name: string; qty: number };

function rowId() {
  return `bl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyLine(name = "", menuItemId = ""): SandwichLineUi {
  return { id: rowId(), menuItemId, name, qty: 1, breadType: "", customNotes: "" };
}

function v2ToUi(rows: BoxedLunchSandwichLine[]): SandwichLineUi[] {
  return rows.map((r) => ({
    id: rowId(),
    menuItemId: r.menuItemId ?? "",
    name: r.name,
    qty: Math.max(1, Math.floor(r.qty) || 1),
    breadType: r.breadType ?? "",
    customNotes: r.customNotes ?? "",
  }));
}

function buildSaladRows(loaded: Array<{ name: string; qty: number }>): SaladRow[] {
  return SALAD_BOXED_LUNCH_ENTREE_CHOICES.map((name, i) => {
    const hit = loaded.find((l) => l.name.trim() === name);
    return { id: `salad-${i}`, name, qty: hit ? Math.max(0, Math.floor(hit.qty)) : 0 };
  });
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  section: {
    width: "100%",
    maxWidth: 620,
    marginTop: 12,
    marginBottom: 16,
    padding: "14px 16px",
    borderRadius: 10,
    border: "1px solid rgba(34, 197, 94, 0.45)",
    background: "rgba(34, 197, 94, 0.06)",
  } as React.CSSProperties,
  label: { fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4, display: "block" } as React.CSSProperties,
  select: {
    padding: "7px 10px",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    fontSize: 13,
  } as React.CSSProperties,
  input: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    fontSize: 13,
  } as React.CSSProperties,
  tab: (active: boolean): React.CSSProperties => ({
    padding: "5px 14px",
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 6,
    border: `1px solid ${active ? "rgba(34,197,94,0.6)" : "rgba(255,255,255,0.12)"}`,
    background: active ? "rgba(34,197,94,0.18)" : "transparent",
    color: active ? "#86efac" : "rgba(255,255,255,0.5)",
    cursor: "pointer",
  }),
  catalogItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "7px 10px",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.18)",
    marginBottom: 4,
  } as React.CSSProperties,
  addBtn: {
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 5,
    border: "1px solid rgba(34,197,94,0.5)",
    background: "rgba(34,197,94,0.12)",
    color: "#86efac",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
  selectedLine: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid rgba(34,197,94,0.25)",
    background: "rgba(34,197,94,0.07)",
    marginBottom: 4,
    flexWrap: "wrap" as const,
  } as React.CSSProperties,
  removeBtn: {
    padding: "3px 8px",
    fontSize: 11,
    borderRadius: 4,
    border: "1px solid rgba(239,68,68,0.4)",
    background: "transparent",
    color: "#f87171",
    cursor: "pointer",
  } as React.CSSProperties,
  saveBtn: (canEdit: boolean): React.CSSProperties => ({
    padding: "10px 22px",
    fontSize: 13,
    fontWeight: 700,
    borderRadius: 8,
    border: "none",
    background: canEdit ? "#22c55e" : "#444",
    color: "#fff",
    cursor: canEdit ? "pointer" : "not-allowed",
  }),
};

// ── Async helpers ─────────────────────────────────────────────────────────────

async function loadClassicCatalog(
  boxTypeId: string,
  merged: BoxType[]
): Promise<{ rows: MenuItemRecord[]; err: string | null }> {
  const b = getBoxTypeById(boxTypeId, merged);
  if (isSaladBoxedLunchBox(boxTypeId, b) || isExecutiveWerxBox(boxTypeId, b)) {
    return { rows: [], err: null };
  }
  if (isClassicBoxedLunchBoxType(boxTypeId, b)) {
    const { rows, airtableError } = await fetchClassicBoxedLunchSandwichesByCategory();
    if (airtableError) return { rows: [], err: `Could not load Classic sandwiches: ${airtableError}` };
    return { rows, err: null };
  }
  const rows = await fetchMenuItemsByBoxLunchType("Classic Sandwich");
  return { rows, err: null };
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  eventId: string | null;
  canEdit: boolean;
  /** Called after a successful save — lets parent refresh preview / print view. */
  onSaved?: () => void;
  /** Called to collapse the section (after save, or via Done button). */
  onDone?: () => void;
};

export function BoxedLunchSection({ eventId, canEdit, onSaved, onDone }: Props) {
  const { notifyBoxedLunchSaved } = useEventStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [mergedBoxTypes, setMergedBoxTypes] = useState<BoxType[]>(BOX_TYPES);
  const [boxTypeId, setBoxTypeId] = useState(BOX_TYPES[0]?.id ?? "");

  // Sandwich picker state
  const [activeTab, setActiveTab] = useState<TabKey>("classic");
  const [catalogItems, setCatalogItems] = useState<Record<TabKey, MenuItemRecord[]>>({
    classic: [],
    gourmet: [],
    wrap: [],
  });
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedLines, setSelectedLines] = useState<SandwichLineUi[]>([]);

  // Salad box state
  const [saladRows, setSaladRows] = useState<SaladRow[]>(buildSaladRows([]));

  // Derived
  const box = getBoxTypeById(boxTypeId, mergedBoxTypes);
  const saladMode = isSaladBoxedLunchBox(boxTypeId, box);
  const executiveMode = isExecutiveWerxBox(boxTypeId, box);
  const allowedTypes = useMemo(
    () => (saladMode || executiveMode ? [] : getAllowedBoxLunchTypesForBox(boxTypeId, box?.name)),
    [saladMode, executiveMode, boxTypeId, box?.name]
  );
  const allowedTabs = useMemo(
    () => TAB_KEYS.filter((k) => allowedTypes.includes(TAB_CONFIG[k].airtableValue)),
    [allowedTypes]
  );

  const catalogForTab = useMemo(() => {
    if (!allowedTabs.includes(activeTab)) return [];
    const raw = catalogItems[activeTab];
    if (!catalogSearch.trim()) return raw;
    const q = catalogSearch.toLowerCase();
    return raw.filter((it) => it.name.toLowerCase().includes(q));
  }, [activeTab, allowedTabs, catalogItems, catalogSearch]);

  const totalBoxes = saladMode
    ? totalBoxesFromSandwiches(saladRows.map((r) => ({ name: r.name, qty: r.qty })))
    : selectedLines.reduce((n, l) => n + Math.max(0, l.qty), 0);

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const [menuRes, orderRes, gourmetRes, wrapRes] = await Promise.all([
        fetchBoxedLunchBoxMenuItems(),
        loadBoxedLunchOrdersByEventId(eventId),
        fetchMenuItemsByBoxLunchType("Gourmet Sandwich"),
        fetchMenuItemsByBoxLunchType("Wrap"),
      ]);

      const merged = mergeBoxTypesWithAirtable(BOX_TYPES, menuRes);
      setMergedBoxTypes(merged);

      const v2 = isErrorResult(orderRes)
        ? null
        : orderRes.find((o) => o.v2)?.v2 ?? null;

      const effectiveBoxId = v2?.boxTypeId ?? merged[0]?.id ?? BOX_TYPES[0]?.id ?? "";
      setBoxTypeId(effectiveBoxId);

      const effectiveBox = getBoxTypeById(effectiveBoxId, merged);
      const isSalad = isSaladBoxedLunchBox(effectiveBoxId, effectiveBox);
      const isExec = isExecutiveWerxBox(effectiveBoxId, effectiveBox);

      // Load classic catalog for the initial box type
      let classicRows: MenuItemRecord[] = [];
      if (!isSalad && !isExec) {
        const { rows } = await loadClassicCatalog(effectiveBoxId, merged);
        classicRows = rows;
      }

      setCatalogItems({ classic: classicRows, gourmet: gourmetRes, wrap: wrapRes });

      if (v2?.sandwiches && v2.sandwiches.length > 0) {
        if (isSalad) {
          setSaladRows(buildSaladRows(v2.sandwiches));
        } else if (!isExec) {
          setSelectedLines(v2ToUi(v2.sandwiches.filter((s) => s.name && s.qty > 0)));
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!savedMsg) return;
    const t = setTimeout(() => setSavedMsg(null), 3000);
    return () => clearTimeout(t);
  }, [savedMsg]);

  // Keep active tab valid when box type changes
  useEffect(() => {
    if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0]);
    }
  }, [allowedTabs, activeTab]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBoxTypeChange = async (nextId: string) => {
    const nextBox = getBoxTypeById(nextId, mergedBoxTypes);
    const nextSalad = isSaladBoxedLunchBox(nextId, nextBox);
    const nextExec = isExecutiveWerxBox(nextId, nextBox);
    setBoxTypeId(nextId);
    setSelectedLines([]);
    setSaladRows(buildSaladRows([]));
    setCatalogSearch("");
    if (nextSalad || nextExec) {
      setCatalogItems((p) => ({ ...p, classic: [] }));
      return;
    }
    const { rows } = await loadClassicCatalog(nextId, mergedBoxTypes);
    setCatalogItems((p) => ({ ...p, classic: rows }));
  };

  const addToOrder = (item: MenuItemRecord) => {
    setSelectedLines((prev) => {
      const existing = prev.find((l) => l.menuItemId === item.id);
      if (existing) {
        return prev.map((l) => l.menuItemId === item.id ? { ...l, qty: l.qty + 1 } : l);
      }
      return [...prev, emptyLine(item.name, item.id)];
    });
  };

  const updateLine = (id: string, patch: Partial<SandwichLineUi>) => {
    setSelectedLines((prev) => prev.map((l) => l.id === id ? { ...l, ...patch } : l));
  };

  const removeLine = (id: string) => {
    setSelectedLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateSaladQty = (id: string, qty: number) => {
    setSaladRows((prev) => prev.map((r) => r.id === id ? { ...r, qty: Math.max(0, qty) } : r));
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!canEdit || !eventId) return;
    setError(null);

    let lines: BoxedLunchSandwichLine[] = [];

    if (saladMode) {
      lines = saladRows
        .filter((r) => r.qty > 0)
        .map((r) => ({ name: r.name, qty: r.qty }));
      if (lines.length === 0) {
        setError("Enter at least one salad quantity.");
        return;
      }
    } else if (executiveMode) {
      // Executive: no sandwich choice — save a placeholder with total qty
      const total = totalBoxes;
      if (total <= 0) {
        setError("Enter the number of Executive Werx Boxes.");
        return;
      }
      // breadType "fixed" bypasses missing-bread validation on print
      lines = [{ name: "Executive Trio", qty: total, breadType: "fixed" }];
    } else {
      const candidates = selectedLines.filter((l) => l.qty > 0 && l.menuItemId);
      for (const l of candidates) {
        if (!l.breadType.trim()) {
          setError(`Please select a bread for: ${l.name}`);
          return;
        }
      }
      const raw: BoxedLunchSandwichLine[] = candidates.map((l) => ({
        name: l.name,
        qty: Math.max(1, Math.floor(l.qty)),
        menuItemId: l.menuItemId,
        breadType: l.breadType,
        ...(l.customNotes.trim() ? { customNotes: l.customNotes.trim() } : {}),
      }));
      lines = coalesceBoxedSandwichLines(raw);
      if (lines.length === 0) {
        setError("Add at least one sandwich.");
        return;
      }
    }

    const selectedBox = getBoxTypeById(boxTypeId, mergedBoxTypes);
    const boxSnapshot = selectedBox
      ? { name: selectedBox.name, sides: selectedBox.sides, dessert: selectedBox.dessert }
      : undefined;

    try {
      const result = await upsertBoxedLunchOrderV2(eventId, {
        boxTypeId,
        sandwiches: lines,
        ...(boxSnapshot ? { boxSnapshot } : {}),
      });
      if (isErrorResult(result)) {
        setError(result.message ?? "Save failed");
        return;
      }
      setSavedMsg("Saved!");
      notifyBoxedLunchSaved();
      onSaved?.();
      onDone?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  if (!eventId) return null;

  return (
    <div style={S.section}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fefce8", marginBottom: 12 }}>
        Boxed Lunches
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Loading…</div>
      ) : (
        <>
          {/* ── Step 1: Box type ─────────────────────────────────────── */}
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Box type</label>
            <select
              value={boxTypeId}
              disabled={!canEdit}
              onChange={(e) => { void handleBoxTypeChange(e.target.value); }}
              style={{ ...S.select, width: "100%", maxWidth: 380 }}
            >
              {mergedBoxTypes.map((b) => (
                <option key={b.id} value={b.id}>
                  {displayBoxTypeLabelForUi(b)}
                </option>
              ))}
            </select>

            {box && (
              <div style={{ marginTop: 8, fontSize: 12, color: "rgba(253,224,71,0.85)", lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600 }}>Every box includes: </span>
                {[...box.sides, box.dessert].join(" · ")}
              </div>
            )}
          </div>

          {/* ── Step 2: Picker ───────────────────────────────────────── */}

          {/* SALAD mode */}
          {saladMode && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e5e7eb", marginBottom: 8 }}>
                How many of each entrée salad?
              </div>
              {saladRows.map((row) => (
                <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ flex: 1, fontSize: 13, color: "#e5e7eb" }}>{row.name}</span>
                  <input
                    type="number"
                    min={0}
                    value={row.qty === 0 ? "" : row.qty}
                    disabled={!canEdit}
                    onChange={(e) => updateSaladQty(row.id, parseInt(e.target.value, 10) || 0)}
                    style={{ ...S.input, width: 70, textAlign: "center" }}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          )}

          {/* EXECUTIVE mode (fixed trio, just needs a count) */}
          {executiveMode && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 8, lineHeight: 1.5 }}>
                Executive Werx is a fixed menu (flank steak, grilled chicken & shrimp trio). Enter total guest count:
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: "#e5e7eb" }}>Executive Trio</span>
                <input
                  type="number"
                  min={0}
                  value={totalBoxes === 0 ? "" : totalBoxes}
                  disabled={!canEdit}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value, 10) || 0;
                    if (qty > 0) {
                      setSelectedLines([{ id: "exec-fixed", menuItemId: "executive-trio-fixed", name: "Executive Trio", qty, breadType: "fixed", customNotes: "" }]);
                    } else {
                      setSelectedLines([]);
                    }
                  }}
                  style={{ ...S.input, width: 80, textAlign: "center" }}
                  placeholder="0"
                />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>guests</span>
              </div>
            </div>
          )}

          {/* SANDWICH mode */}
          {!saladMode && !executiveMode && (
            <div style={{ marginBottom: 14 }}>
              {/* Tabs */}
              {allowedTabs.length > 1 && (
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {allowedTabs.map((tab) => (
                    <button key={tab} type="button" onClick={() => { setActiveTab(tab); setCatalogSearch(""); }} style={S.tab(activeTab === tab)}>
                      {TAB_CONFIG[tab].label}
                    </button>
                  ))}
                </div>
              )}

              {/* Search */}
              {allowedTabs.length > 0 && catalogForTab.length > 5 && (
                <input
                  type="text"
                  placeholder="Search sandwiches…"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  style={{ ...S.input, width: "100%", marginBottom: 8, fontSize: 12 }}
                />
              )}

              {/* Catalog list */}
              {allowedTabs.length > 0 ? (
                <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 10 }}>
                  {catalogForTab.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#fca5a5", padding: "6px 0" }}>
                      No {TAB_CONFIG[activeTab]?.label} sandwiches found in Airtable.
                    </div>
                  ) : (
                    catalogForTab.map((item) => {
                      const alreadyAdded = selectedLines.some((l) => l.menuItemId === item.id);
                      return (
                        <div key={item.id} style={S.catalogItem}>
                          <span style={{ fontSize: 13, color: "#e5e7eb" }}>{item.name}</span>
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => addToOrder(item)}
                            style={{
                              ...S.addBtn,
                              opacity: alreadyAdded ? 0.6 : 1,
                            }}
                          >
                            {alreadyAdded ? "＋ More" : "＋ Add"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>
                  No sandwich picker available for this box type.
                </div>
              )}

              {/* Selected lines */}
              {selectedLines.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 6 }}>
                    ORDER SUMMARY
                  </div>
                  {selectedLines.map((line) => (
                    <div key={line.id} style={S.selectedLine}>
                      <span style={{ flex: "1 1 160px", fontSize: 13, color: "#e5e7eb", minWidth: 120 }}>
                        {line.name}
                      </span>

                      {/* Bread */}
                      <select
                        value={line.breadType}
                        disabled={!canEdit}
                        onChange={(e) => updateLine(line.id, { breadType: e.target.value })}
                        style={{ ...S.select, fontSize: 12, flex: "0 0 auto" }}
                      >
                        <option value="">— Bread —</option>
                        {BOXED_LUNCH_BREAD_TYPES.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>

                      {/* Qty */}
                      <input
                        type="number"
                        min={1}
                        value={line.qty}
                        disabled={!canEdit}
                        onChange={(e) => updateLine(line.id, { qty: parseInt(e.target.value, 10) || 1 })}
                        style={{ ...S.input, width: 56, textAlign: "center", fontSize: 13 }}
                      />

                      {/* Notes (compact) */}
                      <input
                        type="text"
                        placeholder="Notes…"
                        value={line.customNotes}
                        disabled={!canEdit}
                        onChange={(e) => updateLine(line.id, { customNotes: e.target.value })}
                        style={{ ...S.input, flex: "1 1 100px", minWidth: 80, fontSize: 12 }}
                      />

                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => removeLine(line.id)}
                        style={S.removeBtn}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Total + Save ──────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: "#fef9c3" }}>
              Total boxes: <span style={{ fontSize: 20, fontWeight: 800, color: "#facc15" }}>{totalBoxes}</span>
            </div>
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => { void handleSave(); }}
              style={S.saveBtn(canEdit)}
            >
              Save &amp; Close
            </button>
            {onDone && (
              <button
                type="button"
                onClick={onDone}
                style={{
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.65)",
                  cursor: "pointer",
                }}
              >
                Done (no save)
              </button>
            )}
            {savedMsg && <span style={{ fontSize: 12, color: "#86efac" }}>{savedMsg}</span>}
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 8 }}>{error}</div>
          )}
        </>
      )}
    </div>
  );
}
