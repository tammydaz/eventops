import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FIELD_IDS } from "../../services/airtable/events";
import { CATEGORY_MAP, type MenuCategoryKey } from "../../constants/menuCategories";
import { usePickerStore } from "../../state/usePickerStore";
import { STATION_TYPE_OPTIONS } from "../../constants/stations";
import {
  loadMenuItems,
  loadMenuItemsByStationType,
  loadStationPreset,
  loadStationsByEventId,
  createStation,
  createStationFromPreset,
  updateStationItems,
  updateStationComponents,
  getStationTypeOptions,
  type LinkedRecordItem,
} from "../../services/airtable/linkedRecords";
import { airtableFetch } from "../../services/airtable/client";
import { loadStationPresets, loadStationComponentNamesByIds } from "../../services/airtable/stationComponents";
import { StationComponentsConfigModal } from "./StationComponentsConfigModal";
import { asLinkedRecordIds, asString, isErrorResult } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";
import { FormSection, CollapsibleSubsection } from "./FormSection";
import { CustomFoodItemsBlock } from "./CustomFoodItemsBlock";
import { getSauceOverrides, setSauceOverride, type SauceOverride, type SauceOverrideValue } from "../../state/sauceOverrideStore";

const MENU_ITEM_SAUCE_FIELD_ID = "fldCUjK7oBckAuNNa"; // Menu Items.Sauces (Long text)

/** Menu item card with sauce override dropdown (Default / None / Other…) */
function MenuItemCard(props: {
  itemId: string;
  itemName: string;
  defaultSauce: string | null;
  sauceOverrides: Record<string, SauceOverride>;
  onSauceChange: (itemId: string, override: SauceOverride) => void;
  onRemove: () => void;
  canEdit: boolean;
  removeColor: string;
  itemBorder: string;
}) {
  const { itemId, itemName, defaultSauce, sauceOverrides, onSauceChange, onRemove, canEdit, removeColor, itemBorder } = props;
  const override = sauceOverrides[itemId] ?? { sauceOverride: "Default" as SauceOverrideValue, customSauce: null };
  const showCustomInput = override.sauceOverride === "Other";

  const defaultLabel = defaultSauce?.trim() ? defaultSauce.trim() : "Default (none)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, backgroundColor: "#2a2a2a", border: itemBorder, borderRadius: "6px", padding: "8px 12px", marginBottom: "6px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "14px", color: "#e0e0e0" }}>{itemName}</span>
        <button type="button" disabled={!canEdit} onClick={onRemove} style={{ background: "none", border: "none", color: removeColor, cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", flexShrink: 0 }}>Sauce:</label>
          <select
            value={override.sauceOverride}
            onChange={(e) => {
              const v = e.target.value as SauceOverrideValue;
              onSauceChange(itemId, { sauceOverride: v, customSauce: v === "Other" ? override.customSauce : null });
            }}
            disabled={!canEdit}
            style={{
              flex: 1,
              padding: "6px 10px",
              fontSize: 12,
              borderRadius: 6,
              border: "1px solid #444",
              background: "#1a1a1a",
              color: "#e0e0e0",
              cursor: canEdit ? "pointer" : "default",
            }}
          >
            <option value="Default">{defaultLabel}</option>
            <option value="None">None</option>
            <option value="Other">Other…</option>
          </select>
        </div>
        {showCustomInput && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", flexShrink: 0 }}>Custom Sauce:</label>
            <input
              type="text"
              value={override.customSauce ?? ""}
              onChange={(e) => onSauceChange(itemId, { ...override, customSauce: e.target.value || null })}
              placeholder="Enter sauce name"
              disabled={!canEdit}
              style={{
                flex: 1,
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
    </div>
  );
}

/** Inline replace button — opens picker to swap one station item for another. */
function StationItemReplaceButton(props: {
  stationId: string;
  stationType: string;
  currentId: string;
  stationItems: string[];
  getItemName: (id: string) => string;
  onReplaced: (newItems: string[]) => void;
  updateStationItems: (stationId: string, items: string[]) => Promise<unknown>;
  isErrorResult: (r: unknown) => r is { error: true };
  buttonStyle: React.CSSProperties;
}) {
  const { stationId, stationType, currentId, stationItems, onReplaced, updateStationItems, isErrorResult, buttonStyle } = props;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuItems, setMenuItems] = useState<LinkedRecordItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stationType?.trim()) return;
    setLoading(true);
    loadMenuItemsByStationType(stationType)
      .then((result) => {
        if (!isErrorResult(result)) setMenuItems(result);
        else setMenuItems([]);
      })
      .catch(() => setMenuItems([]))
      .finally(() => setLoading(false));
  }, [stationType]);

  const hasStationType = Boolean(stationType?.trim());
  const filtered = !search.trim()
    ? menuItems.filter((m) => m.id !== currentId)
    : menuItems.filter((m) => m.id !== currentId && m.name.toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={!hasStationType} style={{ ...buttonStyle, padding: "2px 6px", fontSize: 10, opacity: hasStationType ? 1 : 0.5, cursor: hasStationType ? "pointer" : "not-allowed" }} title={hasStationType ? "Replace" : "Replace (requires station type)"}>↔</button>
      {open &&
        createPortal(
          <div style={{ position: "fixed", inset: 0, zIndex: 99998, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setOpen(false)}>
            <div style={{ backgroundColor: "#1a1a1a", borderRadius: 12, border: "2px solid #ff6b6b", maxWidth: 400, width: "100%", maxHeight: "70vh", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: 12, borderBottom: "1px solid #444" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#e0e0e0" }}>Replace with</h4>
                <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #444", background: "#2a2a2a", color: "#e0e0e0", fontSize: 13 }} autoFocus />
              </div>
              <div style={{ maxHeight: 200, overflowY: "auto", padding: 12 }}>
                {loading ? (
                  <div style={{ color: "#999", fontSize: 13 }}>Loading items…</div>
                ) : (
                  <>
                    {filtered.map((item) => (
                      <div key={item.id} onClick={async () => { const idx = stationItems.indexOf(currentId); if (idx >= 0) { const newItems = [...stationItems]; newItems[idx] = item.id; const r = await updateStationItems(stationId, newItems); if (!isErrorResult(r)) onReplaced(newItems); setOpen(false); } }} style={{ padding: 10, marginBottom: 6, fontSize: 13, color: "#e0e0e0", background: "#2a2a2a", borderRadius: 6, cursor: "pointer" }}>{item.name}</div>
                    ))}
                    {filtered.length === 0 && <div style={{ color: "#666", fontSize: 13 }}>No other items</div>}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/** Picker to add a menu item to a station. */
function StationItemPicker(props: {
  stationId: string;
  stationType: string;
  existingIds: string[];
  onSelect: (itemId: string) => void;
  buttonStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  /** Use higher z-index when picker is inside another modal (e.g. StationItemsConfigModal) */
  portalZIndex?: number;
}) {
  const { existingIds, onSelect, buttonStyle, portalZIndex = 99998 } = props;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuItems, setMenuItems] = useState<LinkedRecordItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!props.stationType?.trim()) return;
    setLoading(true);
    loadMenuItemsByStationType(props.stationType)
      .then((result) => {
        if (!isErrorResult(result)) setMenuItems(result);
        else setMenuItems([]);
      })
      .catch(() => setMenuItems([]))
      .finally(() => setLoading(false));
  }, [props.stationType]);

  const hasStationType = Boolean(props.stationType?.trim());
  const filtered = !search.trim()
    ? menuItems.filter((m) => !existingIds.includes(m.id))
    : menuItems.filter((m) => !existingIds.includes(m.id) && m.name.toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={!hasStationType} style={{ ...buttonStyle, padding: "6px 10px", fontSize: 12, opacity: hasStationType ? 1 : 0.5, cursor: hasStationType ? "pointer" : "not-allowed" }} title={hasStationType ? "Add item" : "Add item (requires station type)"}>
        + Add Item
      </button>
      {open &&
        createPortal(
          <div style={{ position: "fixed", inset: 0, zIndex: portalZIndex, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setOpen(false)}>
            <div style={{ backgroundColor: "#1a1a1a", borderRadius: 12, border: "2px solid #ff6b6b", maxWidth: 500, width: "100%", maxHeight: "80vh", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: 16, borderBottom: "1px solid #444" }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: 16, color: "#e0e0e0" }}>Add menu item to station</h3>
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #444", background: "#2a2a2a", color: "#e0e0e0", fontSize: 14 }}
                  autoFocus
                />
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto", padding: 16 }}>
                {loading ? (
                  <div style={{ color: "#999", fontSize: 14 }}>Loading items…</div>
                ) : (
                  <>
                    {filtered.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelect(item.id);
                          setOpen(false);
                        }}
                        style={{ padding: 12, marginBottom: 8, fontSize: 14, color: "#e0e0e0", background: "#2a2a2a", borderRadius: 6, cursor: "pointer" }}
                      >
                        {item.name}
                      </div>
                    ))}
                    {filtered.length === 0 && <div style={{ color: "#999", fontSize: 14 }}>No items found</div>}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/** Modal to configure station items when adding a station. Shows items for that station type with Replace/Remove options. */
function StationItemsConfigModal(props: {
  isOpen: boolean;
  stationType: string;
  stationNotes: string;
  getItemName: (id: string) => string;
  onConfirm: (itemIds: string[]) => void;
  onCancel: () => void;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
}) {
  const { isOpen, stationType, stationNotes, getItemName, onConfirm, onCancel, inputStyle, labelStyle, buttonStyle } = props;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<LinkedRecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [replaceIdx, setReplaceIdx] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isOpen || !stationType.trim()) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      const [preset, typeResult] = await Promise.all([
        loadStationPreset(stationType.trim()),
        loadMenuItemsByStationType(stationType.trim()),
      ]);

      if (!cancelled) {
        if (!isErrorResult(typeResult)) {
          setMenuItems(typeResult);
        } else {
          setMenuItems([]);
        }

        if (preset) {
          const combined = [...preset.line1, ...preset.line2, ...preset.individuals];
          setSelectedIds(combined);
        } else if (!isErrorResult(typeResult)) {
          setSelectedIds(typeResult.map((r) => r.id));
        } else {
          setSelectedIds([]);
        }
      }

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [isOpen, stationType]);

  if (!isOpen) return null;

  const removeItem = (idx: number) => {
    setSelectedIds((prev) => prev.filter((_, i) => i !== idx));
    if (replaceIdx !== null && replaceIdx >= idx) setReplaceIdx((r) => (r > idx ? r - 1 : null));
  };

  const replaceItem = (idx: number, newId: string) => {
    setSelectedIds((prev) => prev.map((id, i) => (i === idx ? newId : id)));
    setReplaceIdx(null);
  };

  const addItem = (itemId: string) => {
    if (!selectedIds.includes(itemId)) setSelectedIds((prev) => [...prev, itemId]);
  };

  const filteredForReplace = !search.trim()
    ? menuItems.filter((m) => !selectedIds.includes(m.id) || (replaceIdx !== null && selectedIds[replaceIdx] === m.id))
    : menuItems.filter((m) => (!selectedIds.includes(m.id) || (replaceIdx !== null && selectedIds[replaceIdx] === m.id)) && m.name.toLowerCase().includes(search.trim().toLowerCase()));

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "auto" }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", pointerEvents: "auto" }} onClick={onCancel} aria-hidden="true" />
      <div role="dialog" style={{ position: "relative", zIndex: 1, backgroundColor: "#1a1a1a", borderRadius: 12, border: "2px solid #ff6b6b", maxWidth: 560, width: "100%", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #444", flexShrink: 0 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: "#e0e0e0" }}>Configure {stationType}</h3>
          <p style={{ margin: 0, fontSize: 12, color: "#999" }}>Review items, replace, or remove. Then confirm.</p>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {loading ? (
            <div style={{ color: "#999", padding: 24, textAlign: "center" }}>Loading items…</div>
          ) : (
            <>
              <label style={labelStyle}>Station items</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {selectedIds.map((id, idx) => (
                  <div key={`${id}-${idx}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, backgroundColor: "#2a2a2a", borderRadius: 8, border: "1px solid #444" }}>
                    <span style={{ flex: 1, color: "#e0e0e0", fontSize: 14 }}>{getItemName(id)}</span>
                    {replaceIdx === idx ? (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                        <input
                          type="text"
                          placeholder="Search to replace..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          style={{ ...inputStyle, padding: 8, fontSize: 12 }}
                          autoFocus
                        />
                        <div style={{ maxHeight: 120, overflowY: "auto" }}>
                          {filteredForReplace.map((item) => (
                            <div key={item.id} onClick={() => replaceItem(idx, item.id)} style={{ padding: 8, fontSize: 12, color: "#e0e0e0", cursor: "pointer", background: "#1a1a1a", borderRadius: 4, marginBottom: 4 }}>{item.name}</div>
                          ))}
                          {filteredForReplace.length === 0 && <div style={{ color: "#666", fontSize: 12 }}>No other items</div>}
                        </div>
                        <button type="button" onClick={() => setReplaceIdx(null)} style={{ ...buttonStyle, padding: 6, fontSize: 12 }}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={() => setReplaceIdx(idx)} style={{ ...buttonStyle, padding: "6px 10px", fontSize: 11 }}>Replace</button>
                        <button type="button" onClick={() => removeItem(idx)} style={{ padding: "6px 10px", fontSize: 11, background: "#444", color: "#e0e0e0", border: "1px solid #666", borderRadius: 6, cursor: "pointer" }}>Remove</button>
                      </>
                    )}
                  </div>
                ))}
                {selectedIds.length === 0 && !loading && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: "#666", fontSize: 13, marginBottom: 8 }}>No items for this station type. Click items below to add:</div>
                    <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                      {menuItems.slice(0, 100).map((item) => (
                        <div key={item.id} onClick={() => addItem(item.id)} style={{ padding: 8, fontSize: 13, color: "#e0e0e0", cursor: "pointer", background: "#2a2a2a", borderRadius: 6, border: "1px solid #444" }}>{item.name}</div>
                      ))}
                      {menuItems.length > 100 && <div style={{ color: "#666", fontSize: 12 }}>… or use + Add Item for full list</div>}
                    </div>
                  </div>
                )}
              </div>
              <label style={labelStyle}>Add more items</label>
              <StationItemPicker
                stationId=""
                stationType={stationType}
                existingIds={selectedIds}
                onSelect={(id) => { addItem(id); }}
                buttonStyle={buttonStyle}
                labelStyle={labelStyle}
                portalZIndex={100001}
              />
            </>
          )}
        </div>
        <div style={{ padding: 16, borderTop: "1px solid #444", display: "flex", gap: 12, justifyContent: "flex-end", flexShrink: 0 }}>
          <button type="button" onClick={onCancel} style={{ padding: "10px 20px", background: "#444", color: "#e0e0e0", border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={() => onConfirm(selectedIds)} disabled={loading} style={buttonStyle}>Save</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Creation Station subsection — Station Type, Station Items, Station Notes. */
function CreationStationContent(props: {
  selectedEventId: string | null;
  canEdit: boolean;
  menuItems: LinkedRecordItem[];
  menuItemNames: Record<string, string>;
  getItemName: (id: string) => string;
  fetchItemNames: (recordIds: string[]) => void;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
}) {
  const { selectedEventId, canEdit, getItemName, fetchItemNames, inputStyle, labelStyle, buttonStyle } = props;
  const { selectedEventData } = useEventStore();
  const [stations, setStations] = useState<Array<{ id: string; stationType: string; stationItems: string[]; stationNotes: string; stationPresetId?: string; stationComponents?: string[]; customItems?: string; beoPlacement?: "Presented Appetizer Metal/China" | "Buffet Metal/China" }>>([]);
  const [stationTypeOptions, setStationTypeOptions] = useState<string[]>([]);
  const [stationPresets, setStationPresets] = useState<Array<{ id: string; name: string }>>([]);
  const [newStationType, setNewStationType] = useState("");
  const [newStationPresetId, setNewStationPresetId] = useState("");
  const [newStationNotes, setNewStationNotes] = useState("");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showComponentsModal, setShowComponentsModal] = useState(false);
  const [editingStationId, setEditingStationId] = useState<string | null>(null);
  const [componentNames, setComponentNames] = useState<Record<string, string>>({});
  useEffect(() => {
    getStationTypeOptions().then((opts) => setStationTypeOptions(opts.length > 0 ? opts : [...STATION_TYPE_OPTIONS]));
  }, []);

  useEffect(() => {
    loadStationPresets().then((result) => {
      if (!isErrorResult(result) && result.length > 0) setStationPresets(result);
    });
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setStations([]);
      return;
    }
    let active = true;
    loadStationsByEventId(selectedEventId, asLinkedRecordIds(selectedEventData?.[FIELD_IDS.STATIONS])).then((result) => {
      if (active && !isErrorResult(result)) {
        setStations(result);
        const allStationItemIds = result.flatMap((s) => s.stationItems).filter((id) => id.startsWith("rec"));
        if (allStationItemIds.length > 0 && selectedEventId) {
          fetchItemNames(selectedEventId, allStationItemIds);
        }
        const allComponentIds = result.flatMap((s) => s.stationComponents ?? []).filter((id) => id?.startsWith("rec"));
        if (allComponentIds.length > 0) {
          loadStationComponentNamesByIds(allComponentIds).then((names) => {
            if (active && !isErrorResult(names)) setComponentNames(names);
          });
        } else {
          setComponentNames({});
        }
      }
    });
    return () => { active = false; };
  }, [selectedEventId, selectedEventData, fetchItemNames]);

  const usePresetFlow = stationPresets.length > 0;
  const selectedPreset = stationPresets.find((p) => p.id === newStationPresetId);

  const openAddStationModal = () => {
    if (usePresetFlow) {
      if (!newStationPresetId || !selectedPreset) return;
      setShowComponentsModal(true);
    } else {
      if (!newStationType.trim()) return;
      setShowConfigModal(true);
    }
  };

  const confirmAddStation = async (itemIds: string[]) => {
    if (!selectedEventId || !newStationType.trim()) return;
    const result = await createStation({
      stationType: newStationType.trim(),
      stationItems: itemIds,
      stationNotes: newStationNotes.trim(),
      eventId: selectedEventId,
    });
    if (isErrorResult(result)) {
      console.error("Failed to create station:", result);
      return;
    }
    setStations((prev) => [...prev, { id: result.id, stationType: newStationType.trim(), stationItems: itemIds, stationNotes: newStationNotes.trim() }]);
    setNewStationType("");
    setNewStationNotes("");
    setShowConfigModal(false);
    if (itemIds.length > 0 && selectedEventId) fetchItemNames(selectedEventId, itemIds);
  };

  const confirmAddStationFromPreset = async (params: { componentIds: string[]; customItems: string; beoPlacement?: "Presented Appetizer Metal/China" | "Buffet Metal/China" }) => {
    if (!selectedEventId || !newStationPresetId || !selectedPreset) return;
    const result = await createStationFromPreset({
      presetId: newStationPresetId,
      presetName: selectedPreset.name,
      stationComponents: params.componentIds,
      customItems: params.customItems || undefined,
      stationNotes: newStationNotes.trim(),
      eventId: selectedEventId,
      beoPlacement: params.beoPlacement,
    });
    if (isErrorResult(result)) {
      console.error("Failed to create station:", result);
      return;
    }
    setStations((prev) => [
      ...prev,
      { id: result.id, stationType: selectedPreset.name, stationItems: [], stationNotes: newStationNotes.trim(), stationPresetId: newStationPresetId, stationComponents: params.componentIds, customItems: params.customItems, beoPlacement: params.beoPlacement },
    ]);
    setNewStationPresetId("");
    setNewStationNotes("");
    setShowComponentsModal(false);
  };

  const confirmEditStationComponents = async (stationId: string, params: { componentIds: string[]; customItems: string; beoPlacement?: "Presented Appetizer Metal/China" | "Buffet Metal/China" }) => {
    const result = await updateStationComponents(stationId, { stationComponents: params.componentIds, customItems: params.customItems || undefined, beoPlacement: params.beoPlacement });
    if (isErrorResult(result)) {
      console.error("Failed to update station components:", result);
      return;
    }
    setStations((prev) =>
      prev.map((s) => (s.id === stationId ? { ...s, stationComponents: params.componentIds, customItems: params.customItems, beoPlacement: params.beoPlacement } : s))
    );
    setEditingStationId(null);
    loadStationComponentNamesByIds(params.componentIds).then((names) => {
      if (!isErrorResult(names)) setComponentNames((prev) => ({ ...prev, ...names }));
    });
  };

  const getComponentName = (id: string) => componentNames[id] ?? id;

  const addStationItem = async (stationId: string, itemId: string) => {
    const st = stations.find((s) => s.id === stationId);
    if (!st || st.stationItems.includes(itemId)) return;
    const newItems = [...st.stationItems, itemId];
    const result = await updateStationItems(stationId, newItems);
    if (isErrorResult(result)) {
      console.error("Failed to update station items:", result);
      return;
    }
    setStations((prev) => prev.map((s) => (s.id === stationId ? { ...s, stationItems: newItems } : s)));
    if (selectedEventId) fetchItemNames(selectedEventId, [itemId]);
  };

  const selectStyle = { ...inputStyle, cursor: canEdit ? "pointer" : "not-allowed" };

  return (
    <div style={{ gridColumn: "1 / -1" }}>
      {stations.map((st) => (
        <div key={st.id} style={{ marginBottom: 16, padding: 12, backgroundColor: "#1a1a1a", borderRadius: 8, border: "1px solid #444" }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <div>
              <label style={labelStyle}>Station Type</label>
              <div style={{ color: "#e0e0e0", fontSize: 14 }}>{st.stationType || "—"}</div>
            </div>
            <div>
              <label style={labelStyle}>{st.stationPresetId || (st.stationComponents && st.stationComponents.length > 0) ? "Station Components" : "Station Items"}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                {st.stationPresetId || (st.stationComponents && st.stationComponents.length > 0) ? (
                  <>
                    {(st.stationComponents ?? []).map((id) => (
                      <span key={id} style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#2a2a2a", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {getComponentName(id)}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              const newComponents = (st.stationComponents ?? []).filter((cid) => cid !== id);
                              updateStationComponents(st.id, { stationComponents: newComponents }).then((r) => {
                                if (!isErrorResult(r)) setStations((prev) => prev.map((s) => (s.id === st.id ? { ...s, stationComponents: newComponents } : s)));
                              });
                            }}
                            style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 10 }}
                            title="Remove"
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    ))}
                    {st.customItems?.trim() && (
                      <span style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#2a2a2a", borderRadius: 4, color: "#999" }} title={st.customItems}>
                        Custom: {st.customItems.split("\n")[0]?.slice(0, 30)}{st.customItems.length > 30 ? "…" : ""}
                      </span>
                    )}
                    {(st.stationComponents ?? []).length === 0 && !st.customItems?.trim() && <span style={{ color: "#666", fontSize: 12 }}>No components</span>}
                    {canEdit && st.stationPresetId && (
                      <button type="button" onClick={() => setEditingStationId(st.id)} style={{ ...buttonStyle, padding: "6px 10px", fontSize: 12 }}>
                        Edit Components
                      </button>
                    )}
                  </>
                ) : st.stationType === "Grande Charcuterie Display" ? (
                  (() => {
                    const line1 = st.stationItems.slice(0, 5);
                    const line2 = st.stationItems.slice(5, 9);
                    const individuals = st.stationItems.slice(9);
                    return (
                      <>
                        {line1.length > 0 && (
                          <div style={{ width: "100%", fontSize: 12, color: "#e0e0e0", marginBottom: 4 }}>
                            Line 1: {line1.map((id) => getItemName(id)).join(", ")}
                          </div>
                        )}
                        {line2.length > 0 && (
                          <div style={{ width: "100%", fontSize: 12, color: "#e0e0e0", marginBottom: 4 }}>
                            Line 2: {line2.map((id) => getItemName(id)).join(", ")}
                          </div>
                        )}
                        {individuals.map((id) => (
                            <span key={id} style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#2a2a2a", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              {getItemName(id)}
                              {canEdit && (
                                <>
                                  <button type="button" onClick={() => { const idx = st.stationItems.indexOf(id); if (idx >= 0) { const newItems = st.stationItems.filter((_, i) => i !== idx); updateStationItems(st.id, newItems).then((r) => { if (!isErrorResult(r)) setStations((prev) => prev.map((s) => (s.id === st.id ? { ...s, stationItems: newItems } : s))); }); } }} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 10 }} title="Remove">✕</button>
                                  <StationItemReplaceButton stationId={st.id} stationType={st.stationType} currentId={id} stationItems={st.stationItems} getItemName={getItemName} onReplaced={(newItems) => { setStations((prev) => prev.map((s) => (s.id === st.id ? { ...s, stationItems: newItems } : s))); if (selectedEventId) fetchItemNames(selectedEventId, newItems); }} updateStationItems={updateStationItems} isErrorResult={isErrorResult} buttonStyle={buttonStyle} />
                                </>
                              )}
                            </span>
                          ))}
                      </>
                    );
                  })()
                ) : (
                  <>
                    {st.stationItems.map((id) => (
                      <span key={id} style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#2a2a2a", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {getItemName(id)}
                        {canEdit && (
                          <>
                            <button type="button" onClick={() => { const idx = st.stationItems.indexOf(id); if (idx >= 0) { const newItems = st.stationItems.filter((_, i) => i !== idx); updateStationItems(st.id, newItems).then((r) => { if (!isErrorResult(r)) setStations((prev) => prev.map((s) => (s.id === st.id ? { ...s, stationItems: newItems } : s))); }); } }} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 10 }} title="Remove">✕</button>
                            <StationItemReplaceButton stationId={st.id} stationType={st.stationType} currentId={id} stationItems={st.stationItems} getItemName={getItemName} onReplaced={(newItems) => { setStations((prev) => prev.map((s) => (s.id === st.id ? { ...s, stationItems: newItems } : s))); if (selectedEventId) fetchItemNames(selectedEventId, newItems); }} updateStationItems={updateStationItems} isErrorResult={isErrorResult} buttonStyle={buttonStyle} />
                          </>
                        )}
                      </span>
                    ))}
                  </>
                )}
                {!(st.stationPresetId || (st.stationComponents && st.stationComponents.length > 0)) && st.stationItems.length === 0 && (
                  <span style={{ color: "#666", fontSize: 12 }}>No items</span>
                )}
                {canEdit && !(st.stationPresetId || (st.stationComponents && st.stationComponents.length > 0)) && (
                  <StationItemPicker
                    stationId={st.id}
                    stationType={st.stationType}
                    existingIds={st.stationItems}
                    onSelect={(itemId) => addStationItem(st.id, itemId)}
                    buttonStyle={buttonStyle}
                    labelStyle={labelStyle}
                  />
                )}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Station Notes</label>
              <div style={{ color: "#e0e0e0", fontSize: 13, whiteSpace: "pre-wrap" }}>{st.stationNotes || "—"}</div>
            </div>
          </div>
        </div>
      ))}
      {canEdit && (
        <div style={{ marginTop: 16, padding: 12, border: "2px dashed #444", borderRadius: 8 }}>
          <label style={labelStyle}>Add Creation Station</label>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {usePresetFlow ? (
              <div>
                <label style={labelStyle}>Station Preset</label>
                <select value={newStationPresetId} onChange={(e) => setNewStationPresetId(e.target.value)} disabled={!canEdit} style={selectStyle}>
                  <option value="">Select preset</option>
                  {stationPresets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label style={labelStyle}>Station Type</label>
                <select value={newStationType} onChange={(e) => setNewStationType(e.target.value)} disabled={!canEdit} style={selectStyle}>
                  <option value="">Select type</option>
                  {(stationTypeOptions.length > 0 ? stationTypeOptions : STATION_TYPE_OPTIONS).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Station Notes</label>
              <textarea rows={2} value={newStationNotes} onChange={(e) => setNewStationNotes(e.target.value)} disabled={!canEdit} style={inputStyle} placeholder="Special instructions or notes..." />
            </div>
            <button
              type="button"
              disabled={!canEdit || (usePresetFlow ? !newStationPresetId : !newStationType.trim())}
              onClick={openAddStationModal}
              style={buttonStyle}
            >
              + Add Station
            </button>
          </div>
        </div>
      )}
      <StationItemsConfigModal
        isOpen={showConfigModal}
        stationType={newStationType}
        stationNotes={newStationNotes}
        getItemName={getItemName}
        onConfirm={confirmAddStation}
        onCancel={() => setShowConfigModal(false)}
        inputStyle={inputStyle}
        labelStyle={labelStyle}
        buttonStyle={buttonStyle}
      />
      {selectedPreset && (
        <StationComponentsConfigModal
          isOpen={showComponentsModal}
          presetId={newStationPresetId}
          presetName={selectedPreset.name}
          stationNotes={newStationNotes}
          initialComponentIds={[]}
          initialCustomItems=""
          initialBeoPlacement={undefined}
          onConfirm={confirmAddStationFromPreset}
          onCancel={() => setShowComponentsModal(false)}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
          buttonStyle={buttonStyle}
          mode="create"
          guestCount={selectedEventData?.[FIELD_IDS.GUEST_COUNT] != null ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT]) : 0}
        />
      )}
      {(() => {
        const editingStation = editingStationId ? stations.find((s) => s.id === editingStationId) : null;
        const resolvedPreset = stationPresets.find((p) => p.id === editingStation?.stationPresetId) ?? stationPresets.find((p) => p.name === editingStation?.stationType);
        const editPresetId = resolvedPreset?.id ?? "";
        const editPreset = resolvedPreset ?? (editingStation ? { id: "", name: editingStation.stationType } : null);
        return editingStation && (editPresetId || editingStation.stationType) ? (
          <StationComponentsConfigModal
            isOpen={!!editingStationId}
            presetId={editPresetId}
            presetName={editPreset.name}
            stationNotes={editingStation.stationNotes}
            initialComponentIds={editingStation.stationComponents ?? []}
            initialCustomItems={editingStation.customItems ?? ""}
            initialBeoPlacement={editingStation.beoPlacement}
            onConfirm={(params) => confirmEditStationComponents(editingStationId!, params)}
            onCancel={() => setEditingStationId(null)}
            inputStyle={inputStyle}
            labelStyle={labelStyle}
            buttonStyle={buttonStyle}
            mode="edit"
            guestCount={selectedEventData?.[FIELD_IDS.GUEST_COUNT] != null ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT]) : 0}
          />
        ) : null;
      })()}
    </div>
  );
}

function norm(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D\-]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

type MenuSelections = {
  passedAppetizers: string[];
  presentedAppetizers: string[];
  buffetMetal: string[];
  buffetChina: string[];
  desserts: string[];
  deliveryDeli: string[];
  roomTempDisplay: string[];
  displays: string[];
};

type CustomFields = {
  customPassedApp: string;
  customPresentedApp: string;
  customBuffetMetal: string;
  customBuffetChina: string;
  customDessert: string;
  customDeli: string;
  customRoomTemp: string;
};

type MenuItemRecord = {
  id: string;
  name: string;
  category?: string | string[] | null;
  serviceType?: string | string[] | null;
  dietaryTags?: string;
};

const MENU_TABLE_ID = "tbl0aN33DGG6R1sPZ";
const MENU_ITEM_NAME_FIELD_ID = "fldW5gfSlHRTl01v1"; // Item Name (not Description Name)
const MENU_ITEMS_CHILD_ITEMS_FIELD_ID = "fldIu6qmlUwAEn2W9"; // Child Items (linked)

type MenuSectionProps = { embedded?: boolean; isDelivery?: boolean };

export const MenuSection = ({ embedded = false, isDelivery = false }: MenuSectionProps) => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [menuItems, setMenuItems] = useState<LinkedRecordItem[]>([]);
  const [menuItemNames, setMenuItemNames] = useState<Record<string, string>>({});
  const [menuItemSauce, setMenuItemSauce] = useState<Record<string, string>>({});
  const [sauceOverrides, setSauceOverridesState] = useState<Record<string, SauceOverride>>({});
  const [selections, setSelections] = useState<MenuSelections>({
    passedAppetizers: [],
    presentedAppetizers: [],
    buffetMetal: [],
    buffetChina: [],
    desserts: [],
    deliveryDeli: [],
    roomTempDisplay: [],
    displays: [],
  });
  const [customFields, setCustomFields] = useState<CustomFields>({
    customPassedApp: "",
    customPresentedApp: "",
    customBuffetMetal: "",
    customBuffetChina: "",
    customDessert: "",
    customDeli: "",
    customRoomTemp: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showDressingPicker, setShowDressingPicker] = useState(false);
  const [dressingPickerSearch, setDressingPickerSearch] = useState("");

  // Load menu items on mount
  useEffect(() => {
    let active = true;
    const loadItems = async () => {
      try {
        const items = await loadMenuItems();
        if (isErrorResult(items)) {
          if (active) setError(items.message ?? "Failed to load menu items.");
          return;
        }
        if (active) setMenuItems(items);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unknown error");
      }
    };
    loadItems();
    return () => { active = false; };
  }, []);

  // Fetch item names from Airtable when event data has linked record IDs.
  // Batches all fetches and applies a single setState to avoid re-render storm when switching events.
  // Skips update if event changed during fetch (cancellation).
  const fetchItemNames = useCallback(async (eventId: string | null, recordIds: string[]) => {
    const baseId = (import.meta.env.VITE_AIRTABLE_BASE_ID as string)?.trim();
    if (!recordIds?.length || !baseId) return;

    const uniqueIds = [...new Set(recordIds.filter((id) => typeof id === "string" && id.startsWith("rec")))];
    const allNames: Record<string, string> = {};
    const allSauce: Record<string, string> = {};
    const allRecords: Array<{ id: string; fields: Record<string, unknown> }> = [];

    for (let i = 0; i < uniqueIds.length; i += 10) {
      if (eventId && useEventStore.getState().selectedEventId !== eventId) return;
      const chunk = uniqueIds.slice(i, i + 10);
      const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
      const params = new URLSearchParams();
      params.set("filterByFormula", formula);
      params.set("returnFieldsByFieldId", "true");
      params.append("fields[]", MENU_ITEM_NAME_FIELD_ID);
      params.append("fields[]", MENU_ITEM_SAUCE_FIELD_ID);
      params.append("fields[]", MENU_ITEMS_CHILD_ITEMS_FIELD_ID);

      try {
        const data = await airtableFetch<{ records?: Array<{ id: string; fields: Record<string, unknown> }> }>(
          `/${MENU_TABLE_ID}?${params.toString()}`
        );
        if (!isErrorResult(data) && data?.records) allRecords.push(...data.records);
      } catch (err) {
        console.error("Failed to fetch item names:", err);
      }
    }
    if (eventId && useEventStore.getState().selectedEventId !== eventId) return;

    for (const rec of allRecords) {
      const name = rec.fields[MENU_ITEM_NAME_FIELD_ID];
      allNames[rec.id] = typeof name === "string" ? name : rec.id;
    }

    const childIdsToFetch = new Set<string>();
    const recordsNeedingChild: Array<{ recId: string; firstChildId: string }> = [];
    for (const rec of allRecords) {
      const sauceRaw = rec.fields[MENU_ITEM_SAUCE_FIELD_ID];
      const sauce = typeof sauceRaw === "string" ? sauceRaw.trim() : "";
      if (sauce) {
        allSauce[rec.id] = sauce;
      } else {
        const childIds = asLinkedRecordIds(rec.fields[MENU_ITEMS_CHILD_ITEMS_FIELD_ID]).filter((id) => id?.startsWith("rec"));
        const firstChildId = childIds[0];
        if (firstChildId) {
          recordsNeedingChild.push({ recId: rec.id, firstChildId });
          if (!allNames[firstChildId]) childIdsToFetch.add(firstChildId);
        }
      }
    }

    if (childIdsToFetch.size > 0) {
      const childIds = [...childIdsToFetch];
      for (let i = 0; i < childIds.length; i += 10) {
        if (eventId && useEventStore.getState().selectedEventId !== eventId) return;
        const chunk = childIds.slice(i, i + 10);
        const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
        const params = new URLSearchParams();
        params.set("filterByFormula", formula);
        params.set("returnFieldsByFieldId", "true");
        params.append("fields[]", MENU_ITEM_NAME_FIELD_ID);
        try {
          const data = await airtableFetch<{ records?: Array<{ id: string; fields: Record<string, unknown> }> }>(
            `/${MENU_TABLE_ID}?${params.toString()}`
          );
          if (!isErrorResult(data) && data?.records) {
            data.records.forEach((rec) => {
              const name = rec.fields[MENU_ITEM_NAME_FIELD_ID];
              allNames[rec.id] = typeof name === "string" ? name : rec.id;
            });
          }
        } catch (err) {
          console.error("Failed to fetch child item names:", err);
        }
      }
    }
    if (eventId && useEventStore.getState().selectedEventId !== eventId) return;

    for (const { recId, firstChildId } of recordsNeedingChild) {
      const firstChildName = allNames[firstChildId]?.trim();
      if (firstChildName) allSauce[recId] = firstChildName;
    }

    setMenuItemNames((prev) => ({ ...prev, ...allNames }));
    setMenuItemSauce((prev) => ({ ...prev, ...allSauce }));
  }, []);

  // Load selections from event data whenever selectedEventData changes
  // (e.g. after save, after navigating back from print, or when event loads)
  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setSelections({
        passedAppetizers: [],
        presentedAppetizers: [],
        buffetMetal: [],
        buffetChina: [],
        desserts: [],
        deliveryDeli: [],
        roomTempDisplay: [],
        displays: [],
      });
      setCustomFields({
        customPassedApp: "",
        customPresentedApp: "",
        customBuffetMetal: "",
        customBuffetChina: "",
        customDessert: "",
      });
      return;
    }

    const newSelections = {
      passedAppetizers: asLinkedRecordIds(selectedEventData[FIELD_IDS.PASSED_APPETIZERS]),
      presentedAppetizers: asLinkedRecordIds(selectedEventData[FIELD_IDS.PRESENTED_APPETIZERS]),
      buffetMetal: asLinkedRecordIds(selectedEventData[FIELD_IDS.BUFFET_METAL]),
      buffetChina: asLinkedRecordIds(selectedEventData[FIELD_IDS.BUFFET_CHINA]),
      desserts: asLinkedRecordIds(selectedEventData[FIELD_IDS.DESSERTS]),
      deliveryDeli: asLinkedRecordIds(selectedEventData[FIELD_IDS.DELIVERY_DELI]),
      roomTempDisplay: asLinkedRecordIds(selectedEventData[FIELD_IDS.ROOM_TEMP_DISPLAY]),
      displays: asLinkedRecordIds(selectedEventData[FIELD_IDS.DISPLAYS]),
    };
    setSelections(newSelections);

    const allRecordIds: string[] = [
      ...newSelections.passedAppetizers,
      ...newSelections.presentedAppetizers,
      ...newSelections.buffetMetal,
      ...newSelections.buffetChina,
      ...newSelections.desserts,
      ...newSelections.deliveryDeli,
      ...newSelections.roomTempDisplay,
      ...newSelections.displays,
    ];
    if (allRecordIds.length > 0) {
      fetchItemNames(selectedEventId, allRecordIds);
    }

    setSauceOverridesState(getSauceOverrides(selectedEventId));

    setCustomFields({
      customPassedApp: asString(selectedEventData[FIELD_IDS.CUSTOM_PASSED_APP]),
      customPresentedApp: asString(selectedEventData[FIELD_IDS.CUSTOM_PRESENTED_APP]),
      customBuffetMetal: asString(selectedEventData[FIELD_IDS.CUSTOM_BUFFET_METAL]),
      customBuffetChina: asString(selectedEventData[FIELD_IDS.CUSTOM_BUFFET_CHINA]),
      customDessert: asString(selectedEventData[FIELD_IDS.CUSTOM_DESSERTS]),
      customDeli: asString(selectedEventData[FIELD_IDS.CUSTOM_DELIVERY_DELI]),
      customRoomTemp: asString(selectedEventData[FIELD_IDS.CUSTOM_ROOM_TEMP_DISPLAY]),
    });
  }, [selectedEventId, selectedEventData, fetchItemNames]);

  const canEdit = Boolean(selectedEventId);
  const { openPicker } = usePickerStore();

  const fieldIdMap: Record<keyof MenuSelections, string> = {
    passedAppetizers: FIELD_IDS.PASSED_APPETIZERS,
    presentedAppetizers: FIELD_IDS.PRESENTED_APPETIZERS,
    buffetMetal: FIELD_IDS.BUFFET_METAL,
    buffetChina: FIELD_IDS.BUFFET_CHINA,
    desserts: FIELD_IDS.DESSERTS,
    deliveryDeli: FIELD_IDS.DELIVERY_DELI,
    roomTempDisplay: FIELD_IDS.ROOM_TEMP_DISPLAY,
    displays: FIELD_IDS.DISPLAYS,
  };

  const addDressingItem = async (itemId: string) => {
    if (!selectedEventId) return;

    const currentItems = selections.buffetChina;
    if (currentItems.includes(itemId)) return;

    const newItems = [...currentItems, itemId];
    setSelections((prev) => ({ ...prev, buffetChina: newItems }));
    await setFields(selectedEventId, { [FIELD_IDS.BUFFET_CHINA]: newItems });
  };

  const closeDressingPicker = () => {
    setShowDressingPicker(false);
    setDressingPickerSearch("");
  };

  const removeMenuItem = async (fieldKey: keyof MenuSelections, itemId: string) => {
    if (!selectedEventId) return;

    const newItems = selections[fieldKey].filter((id) => id !== itemId);
    setSelections((prev) => ({ ...prev, [fieldKey]: newItems }));

    await setFields(selectedEventId, { [fieldIdMap[fieldKey]]: newItems });
  };

  const handleSauceChange = (itemId: string, override: SauceOverride) => {
    if (!selectedEventId) return;
    setSauceOverride(selectedEventId, itemId, override);
    setSauceOverridesState((prev) => ({ ...prev, [itemId]: override }));
  };

  const saveCustomField = async (fieldName: string, value: string) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldName]: value });
  };

  const getItemName = (itemId: string) => {
    return menuItemNames[itemId] || menuItems.find((i) => i.id === itemId)?.name || "Loading...";
  };

  // Dressing picker filtered items (categoryKey = "dressing")
  const dressingAllowed = CATEGORY_MAP.dressing || [];
  const dressingSearchLower = dressingPickerSearch.trim().toLowerCase();
  const dressingCategoryFiltered = menuItems.filter((item) => {
    const raw = item.category ?? (item as Record<string, unknown>)["fldM7lWvjH8S0YNSX"];
    const cats = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return cats.some((cat) => dressingAllowed.includes(String(cat)));
  });
  const dressingFilteredItems = !dressingSearchLower
    ? dressingCategoryFiltered
    : dressingCategoryFiltered.filter((item) => item.name.toLowerCase().includes(dressingSearchLower));

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #444",
    backgroundColor: "#1a1a1a",
    color: "#e0e0e0",
    fontSize: "14px",
    resize: "vertical" as const,
    fontFamily: "inherit",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    color: "#999",
    marginBottom: "6px",
    fontWeight: "600" as const,
  };

  const buttonStyle = {
    width: "100%",
    padding: "10px",
    border: "2px dashed #ff6b6b",
    borderRadius: "8px",
    backgroundColor: "transparent",
    color: "#ff6b6b",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const deliveryButtonStyle = { ...buttonStyle, borderColor: "#22c55e", color: "#22c55e" };
  const deliveryItemBorder = "1px solid #22c55e";
  const deliveryRemoveColor = "#22c55e";

  const content = (
    <>
      {error && (
        <div style={{ gridColumn: "1 / -1", color: "#ff6b6b", fontSize: "14px", marginBottom: "12px" }}>
          {error}
        </div>
      )}

      {isDelivery ? (
        /* ── DELIVERY: HOT, DELI, KITCHEN, SALADS, DESSERTS ── */
        <>
          <CollapsibleSubsection title="HOT - DISPOSABLE" icon="🔥" defaultOpen={false} isDelivery>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Passed Appetizers</label>
              <div style={{ marginBottom: "8px" }}>
                {selections.passedAppetizers.map((itemId) => (
                  <MenuItemCard
                    key={itemId}
                    itemId={itemId}
                    itemName={getItemName(itemId)}
                    defaultSauce={menuItemSauce[itemId] ?? null}
                    sauceOverrides={sauceOverrides}
                    onSauceChange={handleSauceChange}
                    onRemove={() => removeMenuItem("passedAppetizers", itemId)}
                    canEdit={canEdit}
                    removeColor={deliveryRemoveColor}
                    itemBorder={deliveryItemBorder}
                  />
                ))}
              </div>
              <button type="button" disabled={!canEdit} onClick={() => openPicker("passed", "passedApps", "Passed Appetizers")} style={deliveryButtonStyle}>+ Add Passed Appetizer</button>
              <CustomFoodItemsBlock
                value={customFields.customPassedApp}
                fieldId={FIELD_IDS.CUSTOM_PASSED_APP}
                placeholder="Item name"
                notesPlaceholder="Notes (optional)"
                canEdit={canEdit}
                onSave={saveCustomField}
                label="Custom (not in menu)"
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                buttonStyle={deliveryButtonStyle}
              />
              <div style={{ marginTop: "12px" }}>
                <label style={labelStyle}>Presented Appetizers</label>
                <div style={{ marginBottom: "8px" }}>
                  {selections.presentedAppetizers.map((itemId) => (
                    <MenuItemCard
                      key={itemId}
                      itemId={itemId}
                      itemName={getItemName(itemId)}
                      defaultSauce={menuItemSauce[itemId] ?? null}
                      sauceOverrides={sauceOverrides}
                      onSauceChange={handleSauceChange}
                      onRemove={() => removeMenuItem("presentedAppetizers", itemId)}
                      canEdit={canEdit}
                      removeColor={deliveryRemoveColor}
                      itemBorder={deliveryItemBorder}
                    />
                  ))}
                </div>
                <button type="button" disabled={!canEdit} onClick={() => openPicker("presented", "presentedApps", "Presented Appetizers")} style={deliveryButtonStyle}>+ Add Presented Appetizer</button>
                <CustomFoodItemsBlock
                  value={customFields.customPresentedApp}
                  fieldId={FIELD_IDS.CUSTOM_PRESENTED_APP}
                  placeholder="Item name"
                  notesPlaceholder="Notes (optional)"
                  canEdit={canEdit}
                  onSave={saveCustomField}
                  label="Custom (not in menu)"
                  inputStyle={inputStyle}
                  labelStyle={labelStyle}
                  buttonStyle={deliveryButtonStyle}
                />
              </div>
              <div style={{ marginTop: "12px" }}>
                <label style={labelStyle}>Buffet – Metal (hot items)</label>
                <div style={{ marginBottom: "8px" }}>
                {selections.buffetMetal.map((itemId) => (
                  <MenuItemCard
                    key={itemId}
                    itemId={itemId}
                    itemName={getItemName(itemId)}
                    defaultSauce={menuItemSauce[itemId] ?? null}
                    sauceOverrides={sauceOverrides}
                    onSauceChange={handleSauceChange}
                    onRemove={() => removeMenuItem("buffetMetal", itemId)}
                    canEdit={canEdit}
                    removeColor={deliveryRemoveColor}
                    itemBorder={deliveryItemBorder}
                  />
                ))}
                </div>
                <button type="button" disabled={!canEdit} onClick={() => openPicker("buffet_metal", "buffetMetal", "Select Hot Buffet Items")} style={deliveryButtonStyle}>+ Add Hot Buffet Item</button>
              </div>
            </div>
          </CollapsibleSubsection>

          <CollapsibleSubsection title="DELI - DISPOSABLE" icon="🥪" defaultOpen={false} isDelivery>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Sandwiches & Wraps</label>
              <div style={{ marginBottom: "8px" }}>
                {selections.deliveryDeli.map((itemId) => (
                  <MenuItemCard
                    key={itemId}
                    itemId={itemId}
                    itemName={getItemName(itemId)}
                    defaultSauce={menuItemSauce[itemId] ?? null}
                    sauceOverrides={sauceOverrides}
                    onSauceChange={handleSauceChange}
                    onRemove={() => removeMenuItem("deliveryDeli", itemId)}
                    canEdit={canEdit}
                    removeColor={deliveryRemoveColor}
                    itemBorder={deliveryItemBorder}
                  />
                ))}
              </div>
              <button type="button" disabled={!canEdit} onClick={() => openPicker("deli", "deliveryDeli", "Select Deli Items (Sandwiches & Wraps)")} style={deliveryButtonStyle}>+ Add Deli Item</button>
              <CustomFoodItemsBlock
                value={customFields.customDeli}
                fieldId={FIELD_IDS.CUSTOM_DELIVERY_DELI}
                placeholder="Sandwich or wrap name"
                notesPlaceholder="Notes (optional)"
                canEdit={canEdit}
                onSave={saveCustomField}
                label="+ Add Custom (not in menu)"
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                buttonStyle={deliveryButtonStyle}
              />
            </div>
          </CollapsibleSubsection>

          <CollapsibleSubsection title="KITCHEN - DISPOSABLE" icon="🍳" defaultOpen={false} isDelivery>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Buffet – China (cold/kitchen items)</label>
              <div style={{ marginBottom: "8px" }}>
                {selections.buffetChina.map((itemId) => (
                  <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#2a2a2a", border: deliveryItemBorder, borderRadius: "6px", padding: "8px 12px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "14px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
                    <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("buffetChina", itemId)} style={{ background: "none", border: "none", color: deliveryRemoveColor, cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
                  </div>
                ))}
              </div>
              <button type="button" disabled={!canEdit} onClick={() => openPicker("buffet_china", "buffetChina", "Buffet – China")} style={deliveryButtonStyle}>+ Add Kitchen Item</button>
              <CustomFoodItemsBlock
                value={customFields.customBuffetChina}
                fieldId={FIELD_IDS.CUSTOM_BUFFET_CHINA}
                placeholder="Item name"
                notesPlaceholder="Notes (optional)"
                canEdit={canEdit}
                onSave={saveCustomField}
                label="+ Add Custom (not in menu)"
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                buttonStyle={deliveryButtonStyle}
              />
            </div>
          </CollapsibleSubsection>

          <CollapsibleSubsection title="SALADS - DISPOSABLE" icon="🥗" defaultOpen={false} isDelivery>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Room Temp Display / Salads</label>
              <div style={{ marginBottom: "8px" }}>
                {selections.roomTempDisplay.map((itemId) => (
                  <MenuItemCard
                    key={itemId}
                    itemId={itemId}
                    itemName={getItemName(itemId)}
                    defaultSauce={menuItemSauce[itemId] ?? null}
                    sauceOverrides={sauceOverrides}
                    onSauceChange={handleSauceChange}
                    onRemove={() => removeMenuItem("roomTempDisplay", itemId)}
                    canEdit={canEdit}
                    removeColor={deliveryRemoveColor}
                    itemBorder={deliveryItemBorder}
                  />
                ))}
              </div>
              <button type="button" disabled={!canEdit} onClick={() => openPicker("room_temp", "roomTempDisplay", "Select Room Temp / Salad Items")} style={deliveryButtonStyle}>+ Add Salad Item</button>
              <CustomFoodItemsBlock
                value={customFields.customRoomTemp}
                fieldId={FIELD_IDS.CUSTOM_ROOM_TEMP_DISPLAY}
                placeholder="Salad or display item"
                notesPlaceholder="Notes (optional)"
                canEdit={canEdit}
                onSave={saveCustomField}
                label="+ Add Custom (not in menu)"
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                buttonStyle={deliveryButtonStyle}
              />
            </div>
          </CollapsibleSubsection>

          <CollapsibleSubsection title="DESSERTS - DISPOSABLE" icon="🍰" defaultOpen={false} isDelivery>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Desserts</label>
              <div style={{ marginBottom: "8px" }}>
                {selections.desserts.map((itemId) => (
                  <MenuItemCard
                    key={itemId}
                    itemId={itemId}
                    itemName={getItemName(itemId)}
                    defaultSauce={menuItemSauce[itemId] ?? null}
                    sauceOverrides={sauceOverrides}
                    onSauceChange={handleSauceChange}
                    onRemove={() => removeMenuItem("desserts", itemId)}
                    canEdit={canEdit}
                    removeColor={deliveryRemoveColor}
                    itemBorder={deliveryItemBorder}
                  />
                ))}
              </div>
              <button type="button" disabled={!canEdit} onClick={() => openPicker("desserts", "desserts", "Desserts")} style={deliveryButtonStyle}>+ Add Dessert</button>
              <CustomFoodItemsBlock
                value={customFields.customDessert}
                fieldId={FIELD_IDS.CUSTOM_DESSERTS}
                placeholder="Dessert name"
                notesPlaceholder="Notes (optional)"
                canEdit={canEdit}
                onSave={saveCustomField}
                label="Custom Desserts (not in menu)"
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                buttonStyle={deliveryButtonStyle}
              />
            </div>
          </CollapsibleSubsection>
        </>
      ) : (
        /* ── FULL SERVICE: Passed, Presented, Stations, Buffet Metal, Buffet China, Desserts ── */
        <>
      {/* Passed Appetizers */}
      <CollapsibleSubsection title="Passed Appetizers" icon="▶" defaultOpen={false}>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Passed Appetizers</label>
        <div style={{ marginBottom: "8px" }}>
          {selections.passedAppetizers.map((itemId) => (
            <MenuItemCard
              key={itemId}
              itemId={itemId}
              itemName={getItemName(itemId)}
              defaultSauce={menuItemSauce[itemId] ?? null}
              sauceOverrides={sauceOverrides}
              onSauceChange={handleSauceChange}
              onRemove={() => removeMenuItem("passedAppetizers", itemId)}
              canEdit={canEdit}
              removeColor="#ff6b6b"
              itemBorder="1px solid #ff6b6b"
            />
          ))}
        </div>
        <button type="button" disabled={!canEdit} onClick={() => openPicker("passed", "passedApps", "Passed Appetizers")} style={buttonStyle}>
          + Add Passed Appetizer
        </button>
        <CustomFoodItemsBlock
          value={customFields.customPassedApp}
          fieldId={FIELD_IDS.CUSTOM_PASSED_APP}
          placeholder="Item name"
          notesPlaceholder="Notes (optional)"
          canEdit={canEdit}
          onSave={saveCustomField}
          label="Custom Passed Appetizers (not in menu)"
          inputStyle={inputStyle}
          labelStyle={labelStyle}
          buttonStyle={buttonStyle}
        />
      </div>
      </CollapsibleSubsection>

      {/* Presented Appetizers */}
      <CollapsibleSubsection title="Presented Appetizers" icon="▶" defaultOpen={false}>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Presented Appetizers</label>
        <div style={{ marginBottom: "8px" }}>
          {selections.presentedAppetizers.map((itemId) => (
            <MenuItemCard
              key={itemId}
              itemId={itemId}
              itemName={getItemName(itemId)}
              defaultSauce={menuItemSauce[itemId] ?? null}
              sauceOverrides={sauceOverrides}
              onSauceChange={handleSauceChange}
              onRemove={() => removeMenuItem("presentedAppetizers", itemId)}
              canEdit={canEdit}
              removeColor="#ff6b6b"
              itemBorder="1px solid #ff6b6b"
            />
          ))}
        </div>
        <button type="button" disabled={!canEdit} onClick={() => openPicker("presented", "presentedApps", "Presented Appetizers")} style={buttonStyle}>
          + Add Presented Appetizer
        </button>
        <CustomFoodItemsBlock
          value={customFields.customPresentedApp}
          fieldId={FIELD_IDS.CUSTOM_PRESENTED_APP}
          placeholder="Item name"
          notesPlaceholder="Notes (optional)"
          canEdit={canEdit}
          onSave={saveCustomField}
          label="Custom Presented Appetizers (not in menu)"
          inputStyle={inputStyle}
          labelStyle={labelStyle}
          buttonStyle={buttonStyle}
        />
      </div>
      </CollapsibleSubsection>

      {/* Creation Station */}
      <CollapsibleSubsection title="Creation Station" icon="▶" defaultOpen={false}>
        <CreationStationContent
          selectedEventId={selectedEventId}
          canEdit={canEdit}
          menuItems={menuItems}
          menuItemNames={menuItemNames}
          getItemName={getItemName}
          fetchItemNames={fetchItemNames}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
          buttonStyle={buttonStyle}
        />
      </CollapsibleSubsection>

      {/* Buffet - Metal */}
      <CollapsibleSubsection title="Buffet – Metal" icon="▶" defaultOpen={false}>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Buffet – Metal</label>
        <div style={{ marginBottom: "8px" }}>
          {selections.buffetMetal.map((itemId) => (
            <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#2a2a2a", border: "1px solid #ff6b6b", borderRadius: "6px", padding: "8px 12px", marginBottom: "6px" }}>
              <span style={{ fontSize: "14px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
              <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("buffetMetal", itemId)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" disabled={!canEdit} onClick={() => openPicker("buffet_metal", "buffetMetal", "Buffet – Metal")} style={buttonStyle}>
          + Add Buffet Item (Metal)
        </button>
        <CustomFoodItemsBlock
          value={customFields.customBuffetMetal}
          fieldId={FIELD_IDS.CUSTOM_BUFFET_METAL}
          placeholder="Item name"
          notesPlaceholder="Notes (optional)"
          canEdit={canEdit}
          onSave={saveCustomField}
          label="Custom Buffet Metal (not in menu)"
          inputStyle={inputStyle}
          labelStyle={labelStyle}
          buttonStyle={buttonStyle}
        />
      </div>
      </CollapsibleSubsection>

      {/* Buffet - China */}
      <CollapsibleSubsection title="Buffet – China" icon="▶" defaultOpen={false}>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Buffet – China</label>
        <div style={{ marginBottom: "8px" }}>
          {selections.buffetChina.map((itemId) => (
            <MenuItemCard
              key={itemId}
              itemId={itemId}
              itemName={getItemName(itemId)}
              defaultSauce={menuItemSauce[itemId] ?? null}
              sauceOverrides={sauceOverrides}
              onSauceChange={handleSauceChange}
              onRemove={() => removeMenuItem("buffetChina", itemId)}
              canEdit={canEdit}
              removeColor="#ff6b6b"
              itemBorder="1px solid #ff6b6b"
            />
          ))}
        </div>
        <button type="button" disabled={!canEdit} onClick={() => openPicker("buffet_china", "buffetChina", "Select Buffet Items (China)")} style={buttonStyle}>
          + Add Buffet Item (China)
        </button>
        <CustomFoodItemsBlock
          value={customFields.customBuffetChina}
          fieldId={FIELD_IDS.CUSTOM_BUFFET_CHINA}
          placeholder="Item name"
          notesPlaceholder="Notes (optional)"
          canEdit={canEdit}
          onSave={saveCustomField}
          label="Custom Buffet China (not in menu)"
          inputStyle={inputStyle}
          labelStyle={labelStyle}
          buttonStyle={buttonStyle}
        />
      </div>
      </CollapsibleSubsection>

      {/* Desserts */}
      <CollapsibleSubsection title="Desserts" icon="▶" defaultOpen={false}>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Desserts</label>
        <div style={{ marginBottom: "8px" }}>
          {selections.desserts.map((itemId) => (
            <MenuItemCard
              key={itemId}
              itemId={itemId}
              itemName={getItemName(itemId)}
              defaultSauce={menuItemSauce[itemId] ?? null}
              sauceOverrides={sauceOverrides}
              onSauceChange={handleSauceChange}
              onRemove={() => removeMenuItem("desserts", itemId)}
              canEdit={canEdit}
              removeColor="#ff6b6b"
              itemBorder="1px solid #ff6b6b"
            />
          ))}
        </div>
        <button type="button" disabled={!canEdit} onClick={() => openPicker("desserts", "desserts", "Desserts")} style={buttonStyle}>
          + Add Dessert
        </button>
        <CustomFoodItemsBlock
          value={customFields.customDessert}
          fieldId={FIELD_IDS.CUSTOM_DESSERTS}
          placeholder="Dessert name"
          notesPlaceholder="Notes (optional)"
          canEdit={canEdit}
          onSave={saveCustomField}
          label="Custom Desserts (not in menu)"
          inputStyle={inputStyle}
          labelStyle={labelStyle}
          buttonStyle={buttonStyle}
        />
      </div>
      </CollapsibleSubsection>

        </>
      )}

      {/* ── Dressing Picker (pops up when salad selected in Buffet China) ── */}
      {showDressingPicker &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={closeDressingPicker}
          >
            <div
              style={{
                backgroundColor: "#1a1a1a",
                borderRadius: "12px",
                border: "2px solid #ff6b6b",
                maxWidth: "600px",
                width: "100%",
                maxHeight: "80vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ borderBottom: "1px solid #ff6b6b", padding: "16px", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#e0e0e0", margin: 0 }}>Select Dressings</h3>
                  <button onClick={closeDressingPicker} style={{ background: "none", border: "none", color: "#ff6b6b", fontSize: "24px", cursor: "pointer", fontWeight: "bold" }}>✕</button>
                </div>
                <input
                  type="text"
                  placeholder="Search dressings..."
                  value={dressingPickerSearch}
                  onChange={(e) => setDressingPickerSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #444",
                    backgroundColor: "#2a2a2a",
                    color: "#e0e0e0",
                    fontSize: "14px",
                  }}
                  autoFocus
                />
                <div style={{ fontSize: "11px", color: "#999", marginTop: "8px" }}>
                  {dressingFilteredItems.length} of {dressingCategoryFiltered.length} dressings
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px" }}>
                {dressingFilteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => addDressingItem(item.id)}
                    style={{
                      padding: "12px",
                      marginBottom: "8px",
                      backgroundColor: selections.buffetChina.includes(item.id) ? "#3a2a2a" : "#2a2a2a",
                      border: "1px solid #444",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#e0e0e0",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#3a3a3a";
                      e.currentTarget.style.borderColor = "#ff6b6b";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = selections.buffetChina.includes(item.id) ? "#3a2a2a" : "#2a2a2a";
                      e.currentTarget.style.borderColor = "#444";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{item.name}</span>
                      {selections.buffetChina.includes(item.id) && (
                        <span style={{ fontSize: "11px", color: "#22c55e" }}>✓ Added</span>
                      )}
                    </div>
                  </div>
                ))}
                {dressingFilteredItems.length === 0 && (
                  <div style={{ textAlign: "center", padding: "32px", color: "#999" }}>
                    <div>No dressings found</div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );

  return embedded ? content : (
    <FormSection title="Menu Sections" icon="🍽️">
      {content}
    </FormSection>
  );
};
