/**
 * Station Components Config Modal — uses Station Presets, Station Components, Station Options.
 * Does NOT touch Menu Items, menu pickers, spec engine, or BEO rendering.
 */
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  loadAllComponentsForPreset,
  loadStationOptionsForPreset,
  type StationComponent,
  type StationOption,
} from "../../services/airtable/stationComponents";
import { isErrorResult } from "../../services/airtable/selectors";

const COMPONENT_TYPE_ORDER = ["Starch (Pasta)", "Protein", "Sauce", "Vegetable", "Topping", "Other"];

function groupByComponentType(components: StationComponent[]): Map<string, StationComponent[]> {
  const map = new Map<string, StationComponent[]>();
  for (const c of components) {
    const type = c.componentType || "Other";
    const list = map.get(type) ?? [];
    list.push(c);
    map.set(type, list);
  }
  return map;
}

export function StationComponentsConfigModal(props: {
  isOpen: boolean;
  presetId: string | null;
  presetName: string;
  stationNotes: string;
  initialComponentIds: string[];
  initialCustomItems: string;
  onConfirm: (params: { componentIds: string[]; customItems: string }) => void;
  onCancel: () => void;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
  /** When "edit", use initialComponentIds/initialCustomItems; when "create", autopopulate defaults. */
  mode?: "create" | "edit";
  submitLabel?: string;
}) {
  const {
    isOpen,
    presetId,
    presetName,
    stationNotes,
    initialComponentIds,
    initialCustomItems,
    onConfirm,
    onCancel,
    inputStyle,
    labelStyle,
    buttonStyle,
    mode = "create",
    submitLabel,
  } = props;

  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState("");
  const [allComponents, setAllComponents] = useState<StationComponent[]>([]);
  const [options, setOptions] = useState<StationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [otherInput, setOtherInput] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    loadStationPresets().then((result) => {
      if (!isErrorResult(result)) setPresets(result);
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !presetId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      loadDefaultComponentsForPreset(presetId),
      loadAllComponentsForPreset(presetId),
      loadStationOptionsForPreset(presetId),
    ]).then(([defaults, all, opts]) => {
      if (cancelled) return;
      if (!isErrorResult(all)) setAllComponents(all);
      if (!isErrorResult(opts)) setOptions(opts);
      if (!isErrorResult(defaults) && defaults.length > 0) {
        setSelectedComponentIds(defaults.map((d) => d.id));
      } else {
        setSelectedComponentIds(initialComponentIds);
      }
      setCustomItems(initialCustomItems);
      setOtherInput("");
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [isOpen, presetId, initialComponentIds, initialCustomItems, mode]);

  const getLimitForType = useCallback(
    (componentType: string): number => {
      const opt = options.find((o) => o.componentType === componentType);
      return opt?.numberOfSelectionsAllowed ?? 999;
    },
    [options]
  );

  const canAddComponent = useCallback(
    (componentId: string): boolean => {
      if (selectedComponentIds.includes(componentId)) return false;
      const comp = allComponents.find((c) => c.id === componentId);
      if (!comp) return true;
      const limit = getLimitForType(comp.componentType);
      const currentInType = selectedComponentIds.filter((id) => {
        const c = allComponents.find((x) => x.id === id);
        return c?.componentType === comp.componentType;
      }).length;
      return currentInType < limit;
    },
    [selectedComponentIds, allComponents, getLimitForType]
  );

  const addComponent = useCallback(
    (componentId: string) => {
      if (!canAddComponent(componentId)) return;
      const comp = allComponents.find((c) => c.id === componentId);
      if (!comp) return;
      const limit = getLimitForType(comp.componentType);
      const currentInType = selectedComponentIds.filter((id) => {
        const c = allComponents.find((x) => x.id === id);
        return c?.componentType === comp.componentType;
      });
      let next: string[];
      if (currentInType.length >= limit) {
        const toRemove = currentInType[0];
        next = selectedComponentIds.filter((id) => id !== toRemove);
        next = [...next, componentId];
      } else {
        next = [...selectedComponentIds, componentId];
      }
      setSelectedComponentIds(next);
    },
    [selectedComponentIds, allComponents, getLimitForType, canAddComponent]
  );

  const removeComponent = useCallback((componentId: string) => {
    setSelectedComponentIds((prev) => prev.filter((id) => id !== componentId));
  }, []);

  const handleConfirm = () => {
    const customText = otherInput.trim() ? `${customItems ? customItems + "\n" : ""}${otherInput.trim()}` : customItems;
    onConfirm({ componentIds: selectedComponentIds, customItems: customText });
  };

  const grouped = groupByComponentType(allComponents);
  const selectedSet = new Set(selectedComponentIds);

  if (!isOpen) return null;

  const content = (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.85)" }} onClick={onCancel} aria-hidden="true" />
      <div
        role="dialog"
        style={{
          position: "relative",
          zIndex: 1,
          backgroundColor: "#1a1a1a",
          borderRadius: 12,
          border: "2px solid #ff6b6b",
          maxWidth: 640,
          width: "100%",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: 16, borderBottom: "1px solid #444", flexShrink: 0 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: "#e0e0e0" }}>
            Configure Station {presetName || "(Select Preset)"}
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: "#999" }}>
            Components grouped by type. Remove, add, or enter custom items.
          </p>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {loading ? (
            <div style={{ color: "#999", padding: 24, textAlign: "center" }}>Loading…</div>
          ) : presetId ? (
            <>
              {COMPONENT_TYPE_ORDER.map((type) => {
                const comps = grouped.get(type) ?? [];
                const selectedInType = selectedComponentIds.filter((id) => {
                  const c = allComponents.find((x) => x.id === id);
                  return c?.componentType === type;
                });
                const limit = getLimitForType(type);
                return (
                  <div key={type} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#ff6b6b", marginBottom: 8 }}>
                      {type} {limit < 999 && `(Pick ${limit})`}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {selectedInType.map((id) => {
                        const comp = allComponents.find((c) => c.id === id);
                        const name = comp?.name ?? id;
                        const isOther = comp?.isOther ?? name.toLowerCase() === "other";
                        return (
                          <div
                            key={id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 10px",
                              backgroundColor: "#2a2a2a",
                              borderRadius: 6,
                              border: "1px solid #444",
                            }}
                          >
                            {isOther ? (
                              <input
                                type="text"
                                value={otherInput}
                                onChange={(e) => setOtherInput(e.target.value)}
                                placeholder="Enter custom..."
                                style={{ ...inputStyle, padding: 4, fontSize: 12, minWidth: 120 }}
                              />
                            ) : (
                              <span style={{ color: "#e0e0e0", fontSize: 13 }}>{name}</span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeComponent(id)}
                              style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14 }}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                      {comps
                        .filter((c) => !selectedSet.has(c.id))
                        .slice(0, 8)
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => addComponent(c.id)}
                            disabled={!canAddComponent(c.id)}
                            style={{
                              padding: "6px 10px",
                              fontSize: 12,
                              background: canAddComponent(c.id) ? "rgba(255,107,107,0.2)" : "#333",
                              color: canAddComponent(c.id) ? "#ff6b6b" : "#666",
                              border: `1px solid ${canAddComponent(c.id) ? "#ff6b6b" : "#444"}`,
                              borderRadius: 6,
                              cursor: canAddComponent(c.id) ? "pointer" : "not-allowed",
                            }}
                          >
                            + {c.name}
                          </button>
                        ))}
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Custom Items (text)</label>
                <textarea
                  rows={2}
                  value={customItems}
                  onChange={(e) => setCustomItems(e.target.value)}
                  placeholder="Additional custom items..."
                  style={{ ...inputStyle, width: "100%", resize: "vertical" }}
                />
              </div>
            </>
          ) : (
            <div style={{ color: "#999", fontSize: 14 }}>Select a Station Preset to configure components.</div>
          )}
        </div>
        <div style={{ padding: 16, borderTop: "1px solid #444", display: "flex", gap: 12, justifyContent: "flex-end", flexShrink: 0 }}>
          <button type="button" onClick={onCancel} style={{ padding: "10px 20px", background: "#444", color: "#e0e0e0", border: "none", borderRadius: 8, cursor: "pointer" }}>
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={loading || !presetId} style={buttonStyle}>
            {submitLabel ?? (mode === "edit" ? "Save Changes" : "Confirm & Add Station")}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
