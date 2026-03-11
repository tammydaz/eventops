import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { CollapsibleSubsection } from "./FormSection";
import { airtableFetch, getStationsTable, getBaseId, getApiKey } from "../../services/airtable/client";
import { isErrorResult, asLinkedRecordIds, asString } from "../../services/airtable/selectors";
import { getPickerLabel } from "../../utils/pickerLabel";

/** Airtable Stations table field IDs (per spec). */
const STATION_FIELD_IDS = {
  stationType: "fldQ1bGDg8jhJvqmJ",
  event: "fldoOaZsMyXiSNKTc",
  stationItems: "fldRo8xgmoIR2yecn",
  notes: "fldCf9uvjWQdtJkZs",
  additionalComponents: "fldEsD59DRXA2HjGa",
  lastAutopopulate: "fldq0re2ySITrbZEq",
} as const;

const STATIONS_TABLE_ID = "tblhFwUfREbpfFXhv";

const DISPLAY_TYPE_OPTIONS = [
  "Single Board / Platter",
  "Multiple Boards / Platters",
  "Separate Components",
  "Build-Your-Own Station",
] as const;

const SOURCE_OPTIONS = ["FoodWerx", "Client", "Rental"] as const;

type StationItemRow = {
  id: string;
  quantity: number;
  source: "FoodWerx" | "Client" | "Rental";
  itemId: string;
};

type MenuItemWithParent = {
  id: string;
  name: string;
  category?: string | null;
  parentItem?: { id: string };
  childItems?: string[];
};

type PresetItem = { id: string };
type Preset = {
  stationType: string;
  line1Defaults?: PresetItem[];
  line2Defaults?: PresetItem[];
  line1?: string[];
  line2?: string[];
};

export interface StationBuilderProps {
  stationRecord: any;
  menuItems: MenuItemWithParent[];
  presets: Preset[];
  onChange: (updated: { mainItems: StationItemRow[]; components: StationItemRow[] }) => void;
  /** Required when creating a new station (stationRecord has no id). */
  eventId?: string;
}

function generateId() {
  return `sb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Placeholder — Tammy will decide final scaling rule. */
function computeQuantity(_item: PresetItem | { id: string }, numBoards: number): number {
  return numBoards || 1;
}

function getChildItems(
  mainItems: StationItemRow[],
  menuItems: MenuItemWithParent[]
): MenuItemWithParent[] {
  const allIds = mainItems.map((i) => i.itemId);
  return menuItems.filter(
    (mi) => mi.parentItem && allIds.includes(mi.parentItem.id)
  );
}

function getPresetLine1(preset: Preset): PresetItem[] {
  if (preset.line1Defaults?.length) return preset.line1Defaults;
  return (preset.line1 || []).map((id) => ({ id }));
}

function getPresetLine2(preset: Preset): PresetItem[] {
  if (preset.line2Defaults?.length) return preset.line2Defaults;
  return (preset.line2 || []).map((id) => ({ id }));
}

/** ItemPicker — uses full menuItems (unified appetizer universe), no filtering. */
function ItemPicker(props: {
  value: string;
  menuItems: MenuItemWithParent[];
  onChange: (itemId: string) => void;
  getItemName: (id: string) => string;
  inputStyle: React.CSSProperties;
  canEdit: boolean;
}) {
  const { value, menuItems, onChange, getItemName, inputStyle, canEdit } = props;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = !search.trim()
    ? menuItems
    : menuItems.filter((m) =>
        getPickerLabel(m).toLowerCase().includes(search.trim().toLowerCase())
      );

  const displayName = value ? getItemName(value) : "Select item...";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!canEdit}
        style={{
          ...inputStyle,
          textAlign: "left",
          cursor: canEdit ? "pointer" : "default",
          color: value ? "#e0e0e0" : "#666",
        }}
      >
        {displayName}
      </button>
      {open &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99998,
              backgroundColor: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => setOpen(false)}
          >
            <div
              style={{
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                border: "2px solid #ff6b6b",
                maxWidth: 500,
                width: "100%",
                maxHeight: "80vh",
                overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: 16, borderBottom: "1px solid #444" }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: 16, color: "#e0e0e0" }}>
                  Select menu item
                </h3>
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 6,
                    border: "1px solid #444",
                    background: "#2a2a2a",
                    color: "#e0e0e0",
                    fontSize: 14,
                  }}
                  autoFocus
                />
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto", padding: 16 }}>
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onChange(item.id);
                      setOpen(false);
                    }}
                    style={{
                      padding: 12,
                      marginBottom: 8,
                      fontSize: 14,
                      color: "#e0e0e0",
                      background: "#2a2a2a",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    {getPickerLabel(item)}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div style={{ color: "#999", fontSize: 14 }}>No items found</div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function ItemRow(props: {
  item: StationItemRow;
  menuItems: MenuItemWithParent[];
  getItemName: (id: string) => string;
  onUpdate: (id: string, updates: Partial<StationItemRow>) => void;
  onRemove: (id: string) => void;
  canEdit: boolean;
}) {
  const { item, menuItems, getItemName, onUpdate, onRemove, canEdit } = props;

  const inputStyle = {
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #444",
    backgroundColor: "#1a1a1a",
    color: "#e0e0e0",
    fontSize: "13px",
    minWidth: 0,
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "80px 90px 1fr 36px",
        gap: "8px",
        alignItems: "center",
        marginBottom: "8px",
      }}
    >
      <input
        type="number"
        min={1}
        value={item.quantity}
        disabled={!canEdit}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          onUpdate(item.id, { quantity: Number.isNaN(v) ? 1 : Math.max(1, v) });
        }}
        style={inputStyle}
        placeholder="Qty"
      />
      <select
        value={item.source}
        disabled={!canEdit}
        onChange={(e) =>
          onUpdate(item.id, { source: e.target.value as "FoodWerx" | "Client" | "Rental" })
        }
        style={inputStyle}
      >
        {SOURCE_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ItemPicker
        value={item.itemId}
        menuItems={menuItems}
        onChange={(itemId) => onUpdate(item.id, { itemId })}
        getItemName={getItemName}
        inputStyle={inputStyle}
        canEdit={canEdit}
      />
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        disabled={!canEdit}
        style={{
          width: 32,
          height: 32,
          padding: 0,
          borderRadius: "6px",
          border: "1px solid #555",
          background: "#333",
          color: "#ff6b6b",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: canEdit ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ✕
      </button>
    </div>
  );
}

export const StationBuilder = ({
  stationRecord,
  menuItems,
  presets,
  onChange,
  eventId,
}: StationBuilderProps) => {
  const [stationType, setStationType] = useState("");
  const [displayType, setDisplayType] = useState("");
  const [numBoards, setNumBoards] = useState<number>(1);
  const [mainItems, setMainItems] = useState<StationItemRow[]>([]);
  const [components, setComponents] = useState<StationItemRow[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<"success" | "error" | null>(null);

  const canEdit = true;

  // Hydrate from stationRecord when available
  useEffect(() => {
    if (!stationRecord?.fields) return;
    const fields = stationRecord.fields as Record<string, unknown>;
    const st = asString(fields[STATION_FIELD_IDS.stationType]) ||
      (fields[STATION_FIELD_IDS.stationType] as { name?: string })?.name;
    if (st) setStationType(st);
    const notesVal = asString(fields[STATION_FIELD_IDS.notes]);
    if (notesVal) setNotes(notesVal);
    const mainIds = asLinkedRecordIds(fields[STATION_FIELD_IDS.stationItems]);
    const compIds = asLinkedRecordIds(fields[STATION_FIELD_IDS.additionalComponents]);
    if (mainIds.length > 0) {
      setMainItems(
        mainIds.map((id) => ({
          id: generateId(),
          quantity: 1,
          source: "FoodWerx" as const,
          itemId: id,
        }))
      );
    }
    if (compIds.length > 0) {
      setComponents(
        compIds.map((id) => ({
          id: generateId(),
          quantity: 1,
          source: "FoodWerx" as const,
          itemId: id,
        }))
      );
    }
  }, [stationRecord?.id]);

  const getItemName = useCallback(
    (id: string) => {
      const item = menuItems.find((m) => m.id === id);
      return item ? getPickerLabel(item) : id;
    },
    [menuItems]
  );

  const mainItemIds = mainItems.map((i) => i.itemId);
  const componentIds = components.map((i) => i.itemId);

  const autoFillFromPreset = useCallback(() => {
    const preset = presets.find((p) => p.stationType === stationType);
    if (!preset) return;

    const line1 = getPresetLine1(preset);
    const line2 = getPresetLine2(preset);

    const line1Rows: StationItemRow[] = line1.map((item) => ({
      id: generateId(),
      quantity: computeQuantity(item, numBoards),
      source: "FoodWerx",
      itemId: item.id,
    }));

    const line2Rows: StationItemRow[] = line2.map((item) => ({
      id: generateId(),
      quantity: computeQuantity(item, numBoards),
      source: "FoodWerx",
      itemId: item.id,
    }));

    const children = getChildItems(line1Rows, menuItems).map((item) => ({
      id: generateId(),
      quantity: computeQuantity({ id: item.id }, numBoards),
      source: "FoodWerx" as const,
      itemId: item.id,
    }));

    const newMain = line1Rows;
    const newComponents = [...line2Rows, ...children];

    setMainItems(newMain);
    setComponents(newComponents);
    onChange({ mainItems: newMain, components: newComponents });
  }, [presets, stationType, numBoards, menuItems, onChange]);

  const clearAll = useCallback(() => {
    setMainItems([]);
    setComponents([]);
    onChange({ mainItems: [], components: [] });
  }, [onChange]);

  const addCustomItem = useCallback(() => {
    const newRow: StationItemRow = {
      id: generateId(),
      quantity: numBoards || 1,
      source: "FoodWerx",
      itemId: "",
    };
    const updated = [...mainItems, newRow];
    setMainItems(updated);
    onChange({ mainItems: updated, components });
  }, [numBoards, mainItems, components, onChange]);

  const updateMainItem = useCallback(
    (id: string, updates: Partial<StationItemRow>) => {
      const updated = mainItems.map((it) =>
        it.id === id ? { ...it, ...updates } : it
      );
      setMainItems(updated);
      onChange({ mainItems: updated, components });
    },
    [mainItems, components, onChange]
  );

  const removeMainItem = useCallback(
    (id: string) => {
      const updated = mainItems.filter((it) => it.id !== id);
      setMainItems(updated);
      onChange({ mainItems: updated, components });
    },
    [mainItems, components, onChange]
  );

  const updateComponent = useCallback(
    (id: string, updates: Partial<StationItemRow>) => {
      const updated = components.map((it) =>
        it.id === id ? { ...it, ...updates } : it
      );
      setComponents(updated);
      onChange({ mainItems, components: updated });
    },
    [mainItems, components, onChange]
  );

  const removeComponent = useCallback(
    (id: string) => {
      const updated = components.filter((it) => it.id !== id);
      setComponents(updated);
      onChange({ mainItems, components: updated });
    },
    [mainItems, components, onChange]
  );

  const handleSave = useCallback(async () => {
    const baseId = getBaseId();
    const apiKey = getApiKey();
    if (typeof baseId !== "string" || typeof apiKey !== "string") {
      setSaveMessage("error");
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    const stationItems = mainItemIds.filter((id) => id?.startsWith("rec"));
    const additionalComponents = componentIds.filter((id) => id?.startsWith("rec"));
    const recordId = stationRecord?.id;
    const eventLink = recordId
      ? (stationRecord?.fields?.[STATION_FIELD_IDS.event] as string[])?.[0]
      : eventId;

    const fields: Record<string, unknown> = {
      [STATION_FIELD_IDS.stationType]: stationType || null,
      [STATION_FIELD_IDS.stationItems]: stationItems,
      [STATION_FIELD_IDS.additionalComponents]: additionalComponents,
      [STATION_FIELD_IDS.notes]: notes || null,
      [STATION_FIELD_IDS.lastAutopopulate]: new Date().toISOString().split("T")[0],
    };
    if (eventLink) {
      fields[STATION_FIELD_IDS.event] = [eventLink];
    }

    try {
      const tableId = getStationsTable() || STATIONS_TABLE_ID;
      if (recordId) {
        const res = await airtableFetch<{ id: string }>(
          `/${tableId}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              records: [{ id: recordId, fields }],
            }),
          }
        );
        if (isErrorResult(res)) {
          setSaveMessage("error");
        } else {
          setSaveMessage("success");
        }
      } else if (eventId) {
        const res = await airtableFetch<{ id: string }>(`/${tableId}`, {
          method: "POST",
          body: JSON.stringify({ fields }),
        });
        if (isErrorResult(res)) {
          setSaveMessage("error");
        } else {
          setSaveMessage("success");
        }
      } else {
        setSaveMessage("error");
      }
    } catch {
      setSaveMessage("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, [
    stationRecord,
    eventId,
    stationType,
    mainItemIds,
    componentIds,
    notes,
  ]);

  const labelStyle = {
    display: "block" as const,
    fontSize: "11px",
    color: "#999",
    marginBottom: "6px",
    fontWeight: "600" as const,
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #444",
    backgroundColor: "#1a1a1a",
    color: "#e0e0e0",
    fontSize: "14px",
  };

  const addButtonStyle = {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #444",
    background: "rgba(255,107,107,0.15)",
    color: "#ff6b6b",
    fontSize: "12px",
    fontWeight: 600,
    cursor: canEdit ? "pointer" : "default",
    opacity: canEdit ? 1 : 0.6,
  };

  const stationTypeOptions = presets
    .map((p) => p.stationType || (p as { name?: string }).name)
    .filter(Boolean);
  const uniqueStationTypes = [...new Set(stationTypeOptions)];

  return (
    <div style={{ gridColumn: "1 / -1" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <label style={labelStyle}>Station</label>
          <select
            value={stationType}
            onChange={(e) => setStationType(e.target.value)}
            disabled={!canEdit}
            style={inputStyle}
          >
            <option value="">Select...</option>
            {uniqueStationTypes.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Display Type</label>
          <select
            value={displayType}
            onChange={(e) => setDisplayType(e.target.value)}
            disabled={!canEdit}
            style={inputStyle}
          >
            <option value="">Select...</option>
            {DISPLAY_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        {displayType === "Multiple Boards / Platters" && (
          <div>
            <label style={labelStyle}>Number of Boards</label>
            <select
              value={numBoards}
              onChange={(e) => setNumBoards(parseInt(e.target.value, 10) || 1)}
              disabled={!canEdit}
              style={inputStyle}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div
        style={{
          marginBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={autoFillFromPreset}
          disabled={!canEdit || !stationType}
          style={{
            ...addButtonStyle,
            padding: "10px 20px",
            opacity: !canEdit || !stationType ? 0.5 : 1,
            cursor: !canEdit || !stationType ? "not-allowed" : "pointer",
          }}
        >
          Auto-Fill Defaults
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={!canEdit || (mainItems.length === 0 && components.length === 0)}
          style={{
            ...addButtonStyle,
            borderColor: "#666",
            color: "#a0a0a0",
            padding: "10px 20px",
            opacity:
              !canEdit || (mainItems.length === 0 && components.length === 0)
                ? 0.5
                : 1,
            cursor:
              !canEdit || (mainItems.length === 0 && components.length === 0)
                ? "not-allowed"
                : "pointer",
          }}
        >
          Clear All & Start Over
        </button>
        <button
          type="button"
          onClick={addCustomItem}
          disabled={!canEdit}
          style={{
            ...addButtonStyle,
            borderColor: "#22c55e",
            color: "#22c55e",
            background: "rgba(34,197,94,0.15)",
            padding: "10px 20px",
          }}
        >
          + Add Item
        </button>
      </div>

      <CollapsibleSubsection
        title="Main Items (Line 1 Defaults)"
        icon="▶"
        defaultOpen={false}
      >
        <div style={{ gridColumn: "1 / -1" }}>
          {mainItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              menuItems={menuItems}
              getItemName={getItemName}
              onUpdate={updateMainItem}
              onRemove={removeMainItem}
              canEdit={canEdit}
            />
          ))}
        </div>
      </CollapsibleSubsection>

      <CollapsibleSubsection
        title="Components (Line 2 Defaults + Child Items)"
        icon="▶"
        defaultOpen={false}
      >
        <div style={{ gridColumn: "1 / -1" }}>
          {components.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              menuItems={menuItems}
              getItemName={getItemName}
              onUpdate={updateComponent}
              onRemove={removeComponent}
              canEdit={canEdit}
            />
          ))}
        </div>
      </CollapsibleSubsection>

      <CollapsibleSubsection title="Notes" icon="▶" defaultOpen={false}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Station Notes</label>
          <textarea
            rows={3}
            value={notes}
            disabled={!canEdit}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily: "inherit",
            }}
            placeholder="Additional station notes..."
          />
        </div>
      </CollapsibleSubsection>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #444" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "8px 20px",
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            borderRadius: "8px",
            border: "2px solid #ff6b6b",
            background: saving ? "rgba(255,255,255,0.05)" : "#ff6b6b",
            color: "#fff",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saveMessage === "success"
            ? "Saved ✓"
            : saveMessage === "error"
              ? "Error"
              : saving
                ? "Saving…"
                : "Save Station"}
        </button>
      </div>
    </div>
  );
};
