# Code for Handoff — Copy Below

---

## 1. Station Components Config Modal (broken / needs review)

**File:** `src/components/beo-intake/StationComponentsConfigModal.tsx`

```tsx
/**
 * Station Components Config Modal — uses Station Presets, Station Components, Station Options.
 * Does NOT touch Menu Items, menu pickers, spec engine, or BEO rendering.
 * UX aligned with Plates section: collapsed sections, row-style items, Add opens a dropdown picker.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  loadAllComponentsForPreset,
  loadDefaultComponentsForPreset,
  loadStationOptionsForPreset,
  type StationComponent,
  type StationOption,
} from "../../services/airtable/stationComponents";
import { isErrorResult } from "../../services/airtable/selectors";
import { CollapsibleSubsection } from "./FormSection";

/** Airtable uses "Starch"; we display "Starch (Pasta)" for pasta stations. */
const TYPE_DISPLAY: Record<string, string> = {
  Starch: "Starch (Pasta)",
  Protein: "Protein",
  Sauce: "Sauce",
  Vegetable: "Vegetable",
  Topping: "Topping",
  Other: "Other",
};
const COMPONENT_TYPE_ORDER = ["Starch", "Protein", "Sauce", "Vegetable", "Topping", "Other"];

function groupByComponentType(components: StationComponent[]): Map<string, StationComponent[]> {
  const map = new Map<string, StationComponent[]>();
  for (const c of components) {
    const type = (c.componentType || "Other").trim();
    const list = map.get(type) ?? [];
    list.push(c);
    map.set(type, list);
  }
  return map;
}

function displayType(type: string): string {
  return TYPE_DISPLAY[type] ?? type;
}

/** Directive guidance for each section — matches menu language for pasta stations. */
function getSectionGuidance(type: string, limit: number, presetName: string): string {
  const name = (presetName || "").toLowerCase();
  const isPasta = name.includes("pasta") || name.includes("viva");

  if (isPasta) {
    switch (type) {
      case "Starch":
        return limit === 2 ? "PICK TWO PASTAS !!" : limit === 1 ? "PICK ONE PASTA" : `PICK ${limit} PASTAS`;
      case "Protein":
        return limit === 1 ? "PICK ONE PROTEIN" : `PICK ${limit} PROTEINS`;
      case "Topping":
      case "Other":
        return "A LA CARTE TOPPINGS — mushrooms, broccoli, olives, tomatoes, spinach, parmesan, bacon, sausage, chicken, shrimp";
      case "Sauce":
        return limit === 1 ? "PICK ONE SAUCE" : limit < 999 ? `PICK ${limit} SAUCES` : "SELECT SAUCES";
      case "Vegetable":
        return limit < 999 ? `PICK ${limit}` : "SELECT VEGETABLES";
      default:
        break;
    }
  }

  // Generic guidance for non-pasta stations
  if (limit < 999) {
    const noun = displayType(type);
    return limit === 1 ? `PICK ONE ${noun.toUpperCase()}` : `PICK ${limit} ${noun.toUpperCase()}S`;
  }
  return `SELECT ${displayType(type).toUpperCase()}S`;
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
  mode?: "create" | "edit";
  submitLabel?: string;
  guestCount?: number;
}) {
  const {
    isOpen,
    presetId,
    presetName,
    initialComponentIds,
    initialCustomItems,
    onConfirm,
    onCancel,
    inputStyle,
    labelStyle,
    buttonStyle,
    mode = "create",
    submitLabel,
    guestCount = 0,
  } = props;

  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState("");
  const [allComponents, setAllComponents] = useState<StationComponent[]>([]);
  const [options, setOptions] = useState<StationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [otherInput, setOtherInput] = useState("");
  const [sectionsExpanded, setSectionsExpanded] = useState(false);
  const [addDropdownType, setAddDropdownType] = useState<string | null>(null);
  const addDropdownRef = useRef<HTMLDivElement>(null);

  const applyAutoFill = useCallback(
    (defaults: StationComponent[], all: StationComponent[], opts: StationOption[]) => {
      const grouped = groupByComponentType(all);
      const getLimit = (t: string) => opts.find((o) => o.componentType === t)?.numberOfSelectionsAllowed ?? 999;
      const ids = new Set<string>(defaults.map((d) => d.id));
      for (const type of COMPONENT_TYPE_ORDER) {
        const limit = getLimit(type);
        const comps = grouped.get(type) ?? [];
        const currentInType = [...ids].filter((id) => all.find((x) => x.id === id)?.componentType === type);
        let need = limit - currentInType.length;
        if (need > 0) {
          for (const c of comps) {
            if (need <= 0) break;
            if (!ids.has(c.id)) {
              ids.add(c.id);
              need--;
            }
          }
        }
      }
      return [...ids];
    },
    []
  );

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
      if (mode === "create") {
        if (!isErrorResult(defaults) && !isErrorResult(all) && !isErrorResult(opts)) {
          const filled = applyAutoFill(defaults, all, opts);
          setSelectedComponentIds(filled.length > 0 ? filled : initialComponentIds);
        } else {
          setSelectedComponentIds(initialComponentIds);
        }
      } else {
        setSelectedComponentIds(initialComponentIds);
      }
      setCustomItems(initialCustomItems);
      setOtherInput("");
      setSectionsExpanded(false);
      setAddDropdownType(null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [isOpen, presetId, initialComponentIds, initialCustomItems, mode, applyAutoFill]);

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

  const handleAutoFill = useCallback(() => {
    if (!presetId) return;
    setLoading(true);
    Promise.all([
      loadDefaultComponentsForPreset(presetId),
      loadAllComponentsForPreset(presetId),
      loadStationOptionsForPreset(presetId),
    ]).then(([defaults, all, opts]) => {
      if (!isErrorResult(defaults) && !isErrorResult(all) && !isErrorResult(opts)) {
        setSelectedComponentIds(applyAutoFill(defaults, all, opts));
        setSectionsExpanded(true);
      }
      setLoading(false);
    });
  }, [presetId, applyAutoFill]);

  const handleClearAll = useCallback(() => {
    setSelectedComponentIds([]);
    setCustomItems("");
    setOtherInput("");
    setAddDropdownType(null);
  }, []);

  useEffect(() => {
    if (!addDropdownType) return;
    const handler = (e: MouseEvent) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target as Node)) {
        setAddDropdownType(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [addDropdownType]);

  const handleConfirm = () => {
    const customText = otherInput.trim() ? `${customItems ? customItems + "\n" : ""}${otherInput.trim()}` : customItems;
    onConfirm({ componentIds: selectedComponentIds, customItems: customText });
  };

  const grouped = groupByComponentType(allComponents);
  const selectedSet = new Set(selectedComponentIds);

  if (!isOpen) return null;

  const content = (
    <div className="station-config-modal" style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div className="station-config-modal-backdrop" style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.85)" }} onClick={onCancel} aria-hidden="true" />
      <div role="dialog" style={{ position: "relative", zIndex: 1, backgroundColor: "#1a1a1a", borderRadius: 12, border: "2px solid #ff6b6b", maxWidth: 640, width: "100%", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 16, borderBottom: "1px solid #444", flexShrink: 0 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: "#e0e0e0" }}>Configure Station {presetName || "(Select Preset)"}</h3>
          <p style={{ margin: 0, fontSize: 13, color: "#ff6b6b", fontWeight: 600 }}>Follow the instructions in each section — pick the required number of items.</p>
        </div>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #333", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <button type="button" onClick={handleAutoFill} disabled={loading || !presetId} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #ff6b6b", background: "rgba(255,107,107,0.15)", color: "#ff6b6b", fontSize: 12, fontWeight: 600, cursor: loading || !presetId ? "not-allowed" : "pointer", opacity: loading || !presetId ? 0.5 : 1 }}>Auto-Fill FoodWerx Defaults</button>
          <button type="button" onClick={handleClearAll} disabled={loading || selectedComponentIds.length === 0} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #666", background: "rgba(160,160,160,0.1)", color: "#a0a0a0", fontSize: 12, fontWeight: 600, cursor: loading || selectedComponentIds.length === 0 ? "not-allowed" : "pointer", opacity: loading || selectedComponentIds.length === 0 ? 0.5 : 1 }}>Clear All & Start Over</button>
          {guestCount > 0 && <span style={{ marginLeft: 8, fontSize: 12, color: "#888" }}>({guestCount} guests)</span>}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {loading ? <div style={{ color: "#999", padding: 24, textAlign: "center" }}>Loading…</div> : presetId ? (
            <>
              {COMPONENT_TYPE_ORDER.map((type) => {
                const comps = grouped.get(type) ?? [];
                const selectedInType = selectedComponentIds.filter((id) => allComponents.find((x) => x.id === id)?.componentType === type);
                const limit = getLimitForType(type);
                const availableToAdd = comps.filter((c) => !selectedSet.has(c.id));
                const guidance = getSectionGuidance(type, limit, presetName);
                const sectionTitle = displayType(type);
                const isAddOpen = addDropdownType === type;
                return (
                  <CollapsibleSubsection key={type} title={sectionTitle} icon="▶" defaultOpen={sectionsExpanded || selectedInType.length > 0}>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ marginBottom: 10, padding: "8px 10px", backgroundColor: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.4)", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#ff6b6b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{guidance}</div>
                      {selectedInType.map((id) => {
                        const comp = allComponents.find((c) => c.id === id);
                        const name = comp?.name ?? id;
                        const isOther = comp?.isOther ?? name.toLowerCase() === "other";
                        return (
                          <div key={id} style={{ display: "grid", gridTemplateColumns: "1fr 26px", gap: 6, alignItems: "center", marginBottom: 6 }}>
                            {isOther ? <input type="text" value={otherInput} onChange={(e) => setOtherInput(e.target.value)} placeholder="Enter custom..." style={{ ...inputStyle, padding: "5px 8px", fontSize: 12, minWidth: 0 }} /> : <span style={{ color: "#e0e0e0", fontSize: 13 }}>{name}</span>}
                            <button type="button" onClick={() => removeComponent(id)} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#ff6b6b", fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                          </div>
                        );
                      })}
                      <div ref={addDropdownType === type ? addDropdownRef : undefined} style={{ position: "relative" }}>
                        <button type="button" onClick={() => setAddDropdownType(isAddOpen ? null : type)} disabled={availableToAdd.length === 0 || selectedInType.length >= limit} style={{ padding: "6px 12px", fontSize: 12, background: "rgba(255,107,107,0.2)", color: "#ff6b6b", border: "1px solid #ff6b6b", borderRadius: 6, cursor: availableToAdd.length > 0 && selectedInType.length < limit ? "pointer" : "not-allowed", opacity: availableToAdd.length === 0 || selectedInType.length >= limit ? 0.5 : 1 }}>+ Add {displayType(type)}</button>
                        {isAddOpen && availableToAdd.length > 0 && (
                          <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, minWidth: 180, maxHeight: 200, overflowY: "auto", backgroundColor: "#1a1a1a", border: "1px solid #444", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.5)", zIndex: 10 }}>
                            {availableToAdd.map((c) => (
                              <button key={c.id} type="button" onClick={() => { addComponent(c.id); setAddDropdownType(null); }} disabled={!canAddComponent(c.id)} style={{ display: "block", width: "100%", padding: "8px 12px", textAlign: "left", fontSize: 12, background: "none", border: "none", color: canAddComponent(c.id) ? "#e0e0e0" : "#666", cursor: canAddComponent(c.id) ? "pointer" : "not-allowed" }}>{c.name}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleSubsection>
                );
              })}
              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Custom Items (text)</label>
                <textarea rows={2} value={customItems} onChange={(e) => setCustomItems(e.target.value)} placeholder="Additional custom items..." style={{ ...inputStyle, width: "100%", resize: "vertical" }} />
              </div>
            </>
          ) : <div style={{ color: "#999", fontSize: 14 }}>Select a Station Preset to configure components.</div>}
        </div>
        <div style={{ padding: 16, borderTop: "1px solid #444", display: "flex", gap: 12, justifyContent: "flex-end", flexShrink: 0 }}>
          <button type="button" onClick={onCancel} style={{ padding: "10px 20px", background: "#444", color: "#e0e0e0", border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={handleConfirm} disabled={loading || !presetId} style={buttonStyle}>{submitLabel ?? (mode === "edit" ? "Save Changes" : "Confirm & Add Station")}</button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
```

---

## 2. Paper Products / Plates • Cutlery • Glassware (working reference)

**File:** `src/components/beo-intake/ServicewareSection.tsx`

**Flow:** User picks **Serviceware Source** (FoodWerx / Client / Rentals / Mixed) and **Paper Type** (Standard / Premium / China), then clicks **Auto-Fill FoodWerx Defaults** or **Auto-Fill Client Defaults** to generate plates, cutlery, glassware.

**Key pieces:**
- `SERVICEWARE_SOURCE_OPTIONS` — who supplies
- `PAPER_TYPE_OPTIONS` — Standard Paper, Premium Paper, China
- `autoFillServiceware()` — FoodWerx defaults (lines 93–176)
- `autoFillClientServiceware()` — Client defaults (lines 179–237)
- `handleAutoFill` — wired to "Auto-Fill FoodWerx Defaults" (lines 489–512)
- `handleAutoFillClient` — wired to "Auto-Fill Client Defaults" (lines 521–541)
- `ItemRow` — qty | supplier dropdown | item name | X
- Collapsible subsections for Plates, Cutlery, Glassware

Full file is 846 lines. Key UI block (Serviceware Source + Paper Type + Auto-Fill buttons):

```tsx
// Serviceware Source dropdown
<select value={servicewareSource} onChange={(e) => { setServicewareSource(e.target.value); saveSourceAndPaperType(e.target.value, paperType); }}>
  <option value="">Select...</option>
  {SERVICEWARE_SOURCE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
</select>

// Paper Type dropdown
<select value={paperType} onChange={(e) => { setPaperType(e.target.value); saveSourceAndPaperType(servicewareSource, e.target.value); }}>
  <option value="">Select...</option>
  {PAPER_TYPE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
</select>

// Auto-Fill buttons
<button onClick={handleAutoFill} disabled={isAutoFillDisabled}>Auto-Fill FoodWerx Defaults</button>
<button onClick={handleAutoFillClient} disabled={isAutoFillClientDisabled}>Auto-Fill Client Defaults</button>
<button onClick={handleClearAll}>Clear All & Start Over</button>
```

**Auto-Fill logic:**
- `handleAutoFill` calls `autoFillServiceware(paperType, guestCount, hasAppetizersAndDesserts, carafes)` → sets plates, cutlery, glassware with FoodWerx supplier
- `handleAutoFillClient` calls `autoFillClientServiceware(...)` → sets items with "Client" supplier
- Both set `sectionsExpanded = true` so Plates/Cutlery/Glassware subsections open

**Dependencies:** `useEventStore`, `FIELD_IDS`, `FormSection`, `CollapsibleSubsection`, `Helper`, `inputStyle`, `labelStyle`, `textareaStyle`

---

## Full ServicewareSection.tsx (Paper Products — 846 lines)

<details>
<summary>Click to expand full file</summary>

See `src/components/beo-intake/ServicewareSection.tsx` in the project. Key structure:

1. **Lines 77–78:** `SERVICEWARE_SOURCE_OPTIONS`, `PAPER_TYPE_OPTIONS`
2. **Lines 93–176:** `autoFillServiceware()` — FoodWerx
3. **Lines 179–237:** `autoFillClientServiceware()` — Client
4. **Lines 239–327:** `ItemRow` component
5. **Lines 329–341:** State (servicewareSource, paperType, plates, cutlery, glassware, etc.)
6. **Lines 489–512:** `handleAutoFill` (FoodWerx)
7. **Lines 521–541:** `handleAutoFillClient` (Client)
8. **Lines 419–451:** Serviceware Source + Paper Type dropdowns
9. **Lines 451–498:** Auto-Fill FoodWerx, Auto-Fill Client, Clear All buttons
10. **Lines 556–621:** CollapsibleSubsection for Plates, Cutlery, Glassware with ItemRow + Add button

</details>
