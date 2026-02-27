import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FIELD_IDS } from "../../services/airtable/events";
import { CATEGORY_MAP, type MenuCategoryKey } from "../../constants/menuCategories";
import { STATION_TYPE_OPTIONS } from "../../constants/stations";
import {
  loadMenuItems,
  loadStationsByRecordIds,
  createStation,
  updateStationItems,
  getStationTypeOptions,
  type LinkedRecordItem,
} from "../../services/airtable/linkedRecords";
import { asLinkedRecordIds, asString, isErrorResult } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";
import { FormSection, CollapsibleSubsection } from "./FormSection";

/** Picker to add a menu item to a station. */
function StationItemPicker(props: {
  stationId: string;
  existingIds: string[];
  menuItems: LinkedRecordItem[];
  onSelect: (itemId: string) => void;
  buttonStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
}) {
  const { existingIds, menuItems, onSelect, buttonStyle } = props;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = !search.trim()
    ? menuItems.filter((m) => !existingIds.includes(m.id))
    : menuItems.filter((m) => !existingIds.includes(m.id) && m.name.toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={{ ...buttonStyle, padding: "6px 10px", fontSize: 12 }}>
        + Add Item
      </button>
      {open &&
        createPortal(
          <div style={{ position: "fixed", inset: 0, zIndex: 99998, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setOpen(false)}>
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
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
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
  const { setFields, selectedEventData } = useEventStore();
  const [stations, setStations] = useState<Array<{ id: string; stationType: string; stationItems: string[]; stationNotes: string }>>([]);
  const [stationTypeOptions, setStationTypeOptions] = useState<string[]>([]);
  const [newStationType, setNewStationType] = useState("");
  const [newStationNotes, setNewStationNotes] = useState("");
  const stationIds = asLinkedRecordIds(selectedEventData?.[FIELD_IDS.STATIONS]) ?? [];

  useEffect(() => {
    getStationTypeOptions().then((opts) => setStationTypeOptions(opts.length > 0 ? opts : [...STATION_TYPE_OPTIONS]));
  }, []);

  useEffect(() => {
    if (!stationIds?.length) {
      setStations([]);
      return;
    }
    let active = true;
    loadStationsByRecordIds(stationIds).then((result) => {
      if (active && !isErrorResult(result)) {
        setStations(result);
        const allStationItemIds = result.flatMap((s) => s.stationItems).filter((id) => id.startsWith("rec"));
        if (allStationItemIds.length > 0) {
          fetchItemNames(allStationItemIds);
        }
      }
    });
    return () => { active = false; };
  }, [stationIds?.join(","), fetchItemNames]);

  const addStation = async () => {
    if (!selectedEventId || !newStationType.trim()) return;
    const result = await createStation({
      stationType: newStationType.trim(),
      stationItems: [],
      stationNotes: newStationNotes.trim(),
      eventId: selectedEventId,
    });
    if (isErrorResult(result)) {
      console.error("Failed to create station:", result);
      return;
    }
    setStations((prev) => [...prev, { id: result.id, stationType: newStationType.trim(), stationItems: [], stationNotes: newStationNotes.trim() }]);
    setNewStationType("");
    setNewStationNotes("");
    const updatedIds = [...stationIds, result.id];
    await setFields(selectedEventId, { [FIELD_IDS.STATIONS]: updatedIds });
  };

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
    fetchItemNames([itemId]);
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
              <label style={labelStyle}>Station Items</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                {st.stationItems.map((id) => (
                  <span key={id} style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#2a2a2a", borderRadius: 4 }}>{getItemName(id)}</span>
                ))}
                {st.stationItems.length === 0 && <span style={{ color: "#666", fontSize: 12 }}>No items</span>}
                {canEdit && (
                  <StationItemPicker
                    stationId={st.id}
                    existingIds={st.stationItems}
                    menuItems={props.menuItems}
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
            <div>
              <label style={labelStyle}>Station Type</label>
              <select value={newStationType} onChange={(e) => setNewStationType(e.target.value)} disabled={!canEdit} style={selectStyle}>
                <option value="">Select type</option>
                {(stationTypeOptions.length > 0 ? stationTypeOptions : STATION_TYPE_OPTIONS).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Station Notes</label>
              <textarea rows={2} value={newStationNotes} onChange={(e) => setNewStationNotes(e.target.value)} disabled={!canEdit} style={inputStyle} placeholder="Special instructions or notes..." />
            </div>
            <button type="button" disabled={!canEdit || !newStationType.trim()} onClick={addStation} style={buttonStyle}>
              + Add Station
            </button>
          </div>
        </div>
      )}
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
};

type CustomFields = {
  customPassedApp: string;
  customPresentedApp: string;
  customBuffetMetal: string;
  customBuffetChina: string;
  customDessert: string;
};

type PickerState = {
  isOpen: boolean;
  categoryKey: MenuCategoryKey | null;
  fieldKey: keyof MenuSelections | null;
  title: string;
};

type MenuItemRecord = {
  id: string;
  name: string;
  category?: string | string[] | null;
  serviceType?: string | string[] | null;
  dietaryTags?: string;
};

const MENU_TABLE_ID = "tbl0aN33DGG6R1sPZ";
const MENU_NAME_FIELD_ID = "fldQ83gpgOmMxNMQw";

type MenuSectionProps = { embedded?: boolean };

export const MenuSection = ({ embedded = false }: MenuSectionProps) => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [menuItems, setMenuItems] = useState<LinkedRecordItem[]>([]);
  const [menuItemNames, setMenuItemNames] = useState<Record<string, string>>({});
  const [selections, setSelections] = useState<MenuSelections>({
    passedAppetizers: [],
    presentedAppetizers: [],
    buffetMetal: [],
    buffetChina: [],
    desserts: [],
  });
  const [customFields, setCustomFields] = useState<CustomFields>({
    customPassedApp: "",
    customPresentedApp: "",
    customBuffetMetal: "",
    customBuffetChina: "",
    customDessert: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pickerState, setPickerState] = useState<PickerState>({
    isOpen: false,
    categoryKey: null,
    fieldKey: null,
    title: "",
  });
  const [pickerSearch, setPickerSearch] = useState("");
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

  // Fetch item names from Airtable when event data has linked record IDs
  const fetchItemNames = useCallback(async (recordIds: string[]) => {
    const apiKey = (import.meta.env.VITE_AIRTABLE_API_KEY as string)?.trim();
    const baseId = (import.meta.env.VITE_AIRTABLE_BASE_ID as string)?.trim();
    if (!recordIds?.length || !apiKey || !baseId) return;

    const uniqueIds = [...new Set(recordIds.filter((id) => typeof id === "string" && id.startsWith("rec")))];

    for (let i = 0; i < uniqueIds.length; i += 10) {
      const chunk = uniqueIds.slice(i, i + 10);
      const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
      const params = new URLSearchParams();
      params.set("filterByFormula", formula);
      params.set("returnFieldsByFieldId", "true");
      params.append("fields[]", MENU_NAME_FIELD_ID);

      try {
        const response = await fetch(
          `https://api.airtable.com/v0/${baseId}/${MENU_TABLE_ID}?${params.toString()}`,
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );
        const data = (await response.json()) as { records?: Array<{ id: string; fields: Record<string, unknown> }> };
        const names: Record<string, string> = {};
        data.records?.forEach((rec) => {
          const name = rec.fields[MENU_NAME_FIELD_ID];
          names[rec.id] = typeof name === "string" ? name : rec.id;
        });
        setMenuItemNames((prev) => ({ ...prev, ...names }));
      } catch (err) {
        console.error("Failed to fetch item names:", err);
      }
    }
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
    };
    setSelections(newSelections);

    const allRecordIds: string[] = [
      ...newSelections.passedAppetizers,
      ...newSelections.presentedAppetizers,
      ...newSelections.buffetMetal,
      ...newSelections.buffetChina,
      ...newSelections.desserts,
    ];
    if (allRecordIds.length > 0) {
      fetchItemNames(allRecordIds);
    }

    setCustomFields({
      customPassedApp: asString(selectedEventData[FIELD_IDS.CUSTOM_PASSED_APP]),
      customPresentedApp: asString(selectedEventData[FIELD_IDS.CUSTOM_PRESENTED_APP]),
      customBuffetMetal: asString(selectedEventData[FIELD_IDS.CUSTOM_BUFFET_METAL]),
      customBuffetChina: asString(selectedEventData[FIELD_IDS.CUSTOM_BUFFET_CHINA]),
      customDessert: asString(selectedEventData[FIELD_IDS.CUSTOM_DESSERTS]),
    });
  }, [selectedEventId, selectedEventData, fetchItemNames]);

  const canEdit = Boolean(selectedEventId);

  const fieldIdMap: Record<keyof MenuSelections, string> = {
    passedAppetizers: FIELD_IDS.PASSED_APPETIZERS,
    presentedAppetizers: FIELD_IDS.PRESENTED_APPETIZERS,
    buffetMetal: FIELD_IDS.BUFFET_METAL,
    buffetChina: FIELD_IDS.BUFFET_CHINA,
    desserts: FIELD_IDS.DESSERTS,
  };

  const openPicker = (categoryKey: MenuCategoryKey, fieldKey: keyof MenuSelections, title: string) => {
    setPickerState({ isOpen: true, categoryKey, fieldKey, title });
    setPickerSearch("");
  };

  const closePicker = () => {
    setPickerState({ isOpen: false, categoryKey: null, fieldKey: null, title: "" });
    setPickerSearch("");
  };

  const addMenuItem = async (itemId: string) => {
    if (!selectedEventId || !pickerState.fieldKey) return;

    const fieldKey = pickerState.fieldKey;
    const currentItems = selections[fieldKey];

    if (currentItems.includes(itemId)) {
      closePicker();
      return;
    }

    const newItems = [...currentItems, itemId];
    setSelections((prev) => ({ ...prev, [fieldKey]: newItems }));

    await setFields(selectedEventId, { [fieldIdMap[fieldKey]]: newItems });

    const selectedItem = menuItems.find((i) => i.id === itemId);
    const isSalad = selectedItem?.category?.includes("Salad");
    const isBuffetChina = fieldKey === "buffetChina";

    if (isSalad && isBuffetChina) {
      closePicker();
      setDressingPickerSearch("");
      setShowDressingPicker(true);
    } else {
      closePicker();
    }
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

  const saveCustomField = async (fieldName: string, value: string) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldName]: value });
  };

  const getItemName = (itemId: string) => {
    return menuItemNames[itemId] || menuItems.find((i) => i.id === itemId)?.name || "Loading...";
  };

  const categoryKey = pickerState.categoryKey;
  const allowedCategories = categoryKey ? (CATEGORY_MAP[categoryKey] || []) : [];

  const searchLower = pickerSearch.trim().toLowerCase();

  // X = filtered items (what you actually show) — category + search
  const categoryFiltered = !categoryKey
    ? menuItems
    : menuItems.filter((item) => {
        const raw = item.category ?? (item as Record<string, unknown>)["fldM7lWvjH8S0YNSX"];
        const cats = Array.isArray(raw) ? raw : raw ? [raw] : [];
        return cats.some((cat) => allowedCategories.includes(String(cat)));
      });

  const filteredPickerItems = !searchLower
    ? categoryFiltered
    : categoryFiltered.filter((item) => item.name.toLowerCase().includes(searchLower));

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

  // Y = total items (for "X of Y")
  const categoryFilteredCount = menuItems.length;

  const shownCount = filteredPickerItems.length;

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

  const content = (
    <>
      {error && (
        <div style={{ gridColumn: "1 / -1", color: "#ff6b6b", fontSize: "14px", marginBottom: "12px" }}>
          {error}
        </div>
      )}

      {/* Passed Appetizers */}
      <CollapsibleSubsection title="Passed Appetizers" icon="▶" defaultOpen={false}>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Passed Appetizers</label>
        <div style={{ marginBottom: "8px" }}>
          {selections.passedAppetizers.map((itemId) => (
            <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#2a2a2a", border: "1px solid #ff6b6b", borderRadius: "6px", padding: "8px 12px", marginBottom: "6px" }}>
              <span style={{ fontSize: "14px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
              <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("passedAppetizers", itemId)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" disabled={!canEdit} onClick={() => openPicker("passed", "passedAppetizers", "Select Passed Appetizers")} style={buttonStyle}>
          + Add Passed Appetizer
        </button>
        <div style={{ marginTop: "12px" }}>
          <label style={labelStyle}>Custom Passed Appetizers (free text)</label>
          <textarea 
            rows={2} 
            value={customFields.customPassedApp} 
            disabled={!canEdit} 
            onChange={(e) => setCustomFields((p) => ({ ...p, customPassedApp: e.target.value }))} 
            onBlur={(e) => saveCustomField(FIELD_IDS.CUSTOM_PASSED_APP, e.target.value)}
            style={inputStyle} 
            placeholder="Enter custom passed appetizers..." 
          />
        </div>
      </div>
      </CollapsibleSubsection>

      {/* Presented Appetizers */}
      <CollapsibleSubsection title="Presented Appetizers" icon="▶" defaultOpen={false}>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Presented Appetizers</label>
        <div style={{ marginBottom: "8px" }}>
          {selections.presentedAppetizers.map((itemId) => (
            <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#2a2a2a", border: "1px solid #ff6b6b", borderRadius: "6px", padding: "8px 12px", marginBottom: "6px" }}>
              <span style={{ fontSize: "14px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
              <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("presentedAppetizers", itemId)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" disabled={!canEdit} onClick={() => openPicker("presented", "presentedAppetizers", "Select Presented Appetizers")} style={buttonStyle}>
          + Add Presented Appetizer
        </button>
        <div style={{ marginTop: "12px" }}>
          <label style={labelStyle}>Custom Presented Appetizers (free text)</label>
          <textarea 
            rows={2} 
            value={customFields.customPresentedApp} 
            disabled={!canEdit} 
            onChange={(e) => setCustomFields((p) => ({ ...p, customPresentedApp: e.target.value }))} 
            onBlur={(e) => saveCustomField(FIELD_IDS.CUSTOM_PRESENTED_APP, e.target.value)}
            style={inputStyle} 
            placeholder="Enter custom presented appetizers..." 
          />
        </div>
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
        <button type="button" disabled={!canEdit} onClick={() => openPicker("buffet_metal", "buffetMetal", "Select Buffet Items (Metal)")} style={buttonStyle}>
          + Add Buffet Item (Metal)
        </button>
        <div style={{ marginTop: "12px" }}>
          <label style={labelStyle}>Custom Buffet Metal (free text)</label>
          <textarea 
            rows={2} 
            value={customFields.customBuffetMetal} 
            disabled={!canEdit} 
            onChange={(e) => setCustomFields((p) => ({ ...p, customBuffetMetal: e.target.value }))} 
            onBlur={(e) => saveCustomField(FIELD_IDS.CUSTOM_BUFFET_METAL, e.target.value)}
            style={inputStyle} 
            placeholder="Enter custom buffet metal items..." 
          />
        </div>
      </div>
      </CollapsibleSubsection>

      {/* Buffet - China */}
      <CollapsibleSubsection title="Buffet – China" icon="▶" defaultOpen={false}>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Buffet – China</label>
        <div style={{ marginBottom: "8px" }}>
          {selections.buffetChina.map((itemId) => (
            <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#2a2a2a", border: "1px solid #ff6b6b", borderRadius: "6px", padding: "8px 12px", marginBottom: "6px" }}>
              <span style={{ fontSize: "14px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
              <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("buffetChina", itemId)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" disabled={!canEdit} onClick={() => openPicker("buffet_china", "buffetChina", "Select Buffet Items (China)")} style={buttonStyle}>
          + Add Buffet Item (China)
        </button>
        <div style={{ marginTop: "12px" }}>
          <label style={labelStyle}>Custom Buffet China (free text)</label>
          <textarea 
            rows={2} 
            value={customFields.customBuffetChina} 
            disabled={!canEdit} 
            onChange={(e) => setCustomFields((p) => ({ ...p, customBuffetChina: e.target.value }))} 
            onBlur={(e) => saveCustomField(FIELD_IDS.CUSTOM_BUFFET_CHINA, e.target.value)}
            style={inputStyle} 
            placeholder="Enter custom buffet china items..." 
          />
        </div>
      </div>
      </CollapsibleSubsection>

      {/* Desserts */}
      <CollapsibleSubsection title="Desserts" icon="▶" defaultOpen={false}>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Desserts</label>
        <div style={{ marginBottom: "8px" }}>
          {selections.desserts.map((itemId) => (
            <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#2a2a2a", border: "1px solid #ff6b6b", borderRadius: "6px", padding: "8px 12px", marginBottom: "6px" }}>
              <span style={{ fontSize: "14px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
              <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("desserts", itemId)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" disabled={!canEdit} onClick={() => openPicker("desserts", "desserts", "Select Desserts")} style={buttonStyle}>
          + Add Dessert
        </button>
        <div style={{ marginTop: "12px" }}>
          <label style={labelStyle}>Custom Desserts (free text)</label>
          <textarea 
            rows={2} 
            value={customFields.customDessert} 
            disabled={!canEdit} 
            onChange={(e) => setCustomFields((p) => ({ ...p, customDessert: e.target.value }))} 
            onBlur={(e) => saveCustomField(FIELD_IDS.CUSTOM_DESSERTS, e.target.value)}
            style={inputStyle} 
            placeholder="Enter custom desserts..." 
          />
        </div>
      </div>
      </CollapsibleSubsection>

      {/* Picker Modal */}
      {pickerState.isOpen &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99998,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={closePicker}
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
                  <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#e0e0e0", margin: 0 }}>{pickerState.title}</h3>
                  <button onClick={closePicker} style={{ background: "none", border: "none", color: "#ff6b6b", fontSize: "24px", cursor: "pointer", fontWeight: "bold" }}>✕</button>
                </div>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
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
                  {shownCount} of {categoryFilteredCount} items
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px" }}>
                {filteredPickerItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => addMenuItem(item.id)}
                    style={{
                      padding: "12px",
                      marginBottom: "8px",
                      backgroundColor: "#2a2a2a",
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
                      e.currentTarget.style.backgroundColor = "#2a2a2a";
                      e.currentTarget.style.borderColor = "#444";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{item.name}</span>
                      {item.category && (
                        <span style={{ fontSize: "11px", color: "#777" }}>{item.category}</span>
                      )}
                    </div>
                  </div>
                ))}
                {filteredPickerItems.length === 0 && (
                  <div style={{ textAlign: "center", padding: "32px", color: "#999" }}>
                    <div>No items found</div>
                    <div style={{ fontSize: "11px", marginTop: "8px" }}>Check browser console (F12) for debug output</div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
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
