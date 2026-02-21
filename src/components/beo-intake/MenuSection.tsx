import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FIELD_IDS } from "../../services/airtable/events";
import {
  loadMenuItems,
  type LinkedRecordItem,
} from "../../services/airtable/linkedRecords";
import { asLinkedRecordIds, asString, isErrorResult } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";
import { FormSection } from "./FormSection";

// ============================================================
// CATEGORY KEY → Airtable "Category" values (fldM7lWvjH8S0YNSX)
// These are the EXACT strings from your Airtable Category single-select field.
// ============================================================
const SERVICE_TYPE_MAP: Record<string, string[]> = {
  passed:       ['Appetizer'],
  presented:    ['Appetizer'],
  buffet_metal: ['Entr\u00e9e', 'Side'],
  buffet_china: ['Entr\u00e9e', 'Side'],
  desserts:     ['Dessert'],
  beverages:    ['Beverage'],
};

type CategoryKey = keyof typeof SERVICE_TYPE_MAP;

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
  categoryKey: CategoryKey | null;
  fieldKey: keyof MenuSelections | null;
  title: string;
};

export const MenuSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [menuItems, setMenuItems] = useState<LinkedRecordItem[]>([]);
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
        if (active) {
          console.log("📦 Menu items loaded:", items.length);
          // Log unique categories so we can verify the mapping
          const uniqueCategories = [...new Set(items.map((i) => i.category))];
          console.log("📋 Unique category values:", uniqueCategories);
          setMenuItems(items);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unknown error");
      }
    };
    loadItems();
    return () => { active = false; };
  }, []);

  // Load selections from event data
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

    setSelections({
      passedAppetizers: asLinkedRecordIds(selectedEventData[FIELD_IDS.PASSED_APPETIZERS]),
      presentedAppetizers: asLinkedRecordIds(selectedEventData[FIELD_IDS.PRESENTED_APPETIZERS]),
      buffetMetal: asLinkedRecordIds(selectedEventData[FIELD_IDS.BUFFET_METAL]),
      buffetChina: asLinkedRecordIds(selectedEventData[FIELD_IDS.BUFFET_CHINA]),
      desserts: asLinkedRecordIds(selectedEventData[FIELD_IDS.DESSERTS]),
    });

    setCustomFields({
      customPassedApp: asString(selectedEventData[FIELD_IDS.CUSTOM_PASSED_APP]),
      customPresentedApp: asString(selectedEventData[FIELD_IDS.CUSTOM_PRESENTED_APP]),
      customBuffetMetal: asString(selectedEventData[FIELD_IDS.CUSTOM_BUFFET_METAL]),
      customBuffetChina: asString(selectedEventData[FIELD_IDS.CUSTOM_BUFFET_CHINA]),
      customDessert: asString(selectedEventData[FIELD_IDS.CUSTOM_DESSERTS]),
    });
  }, [selectedEventId, selectedEventData]);

  const canEdit = Boolean(selectedEventId);

  const fieldIdMap: Record<keyof MenuSelections, string> = {
    passedAppetizers: FIELD_IDS.PASSED_APPETIZERS,
    presentedAppetizers: FIELD_IDS.PRESENTED_APPETIZERS,
    buffetMetal: FIELD_IDS.BUFFET_METAL,
    buffetChina: FIELD_IDS.BUFFET_CHINA,
    desserts: FIELD_IDS.DESSERTS,
  };

  const openPicker = (categoryKey: CategoryKey, fieldKey: keyof MenuSelections, title: string) => {
    console.log("OPEN PICKER:", { categoryKey, fieldKey, menuItemsCount: menuItems.length });
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

    const linkedRecords = newItems.map((id) => ({ id }));
    await setFields(selectedEventId, { [fieldIdMap[fieldKey]]: linkedRecords });

    closePicker();
  };

  const removeMenuItem = async (fieldKey: keyof MenuSelections, itemId: string) => {
    if (!selectedEventId) return;

    const newItems = selections[fieldKey].filter((id) => id !== itemId);
    setSelections((prev) => ({ ...prev, [fieldKey]: newItems }));

    const linkedRecords = newItems.map((id) => ({ id }));
    await setFields(selectedEventId, { [fieldIdMap[fieldKey]]: linkedRecords });
  };

  const saveCustomField = async (fieldName: string, value: string) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldName]: value });
  };

  const getItemName = (itemId: string) => {
    const item = menuItems.find((i) => i.id === itemId);
    return item?.name || itemId;
  };

  // ============================================================
  // THE FIXED FILTER — uses category field for comparison
  // ============================================================
  const filteredPickerItems = useMemo(() => {
    if (!pickerState.categoryKey) return [];

    const allowedCategories = SERVICE_TYPE_MAP[pickerState.categoryKey];
    if (!allowedCategories) {
      console.log("⚠️ No SERVICE_TYPE_MAP entry for:", pickerState.categoryKey);
      return [];
    }

    console.log("🔎 FILTER DEBUG:", {
      categoryKey: pickerState.categoryKey,
      allowedCategories,
      totalMenuItems: menuItems.length,
    });

    const filtered = menuItems.filter((item) => {
      const itemCategory = item.category || "";
      if (!itemCategory) return false;

      const matchesCategory = allowedCategories.includes(itemCategory);
      const matchesSearch =
        pickerSearch.trim() === "" ||
        item.name.toLowerCase().includes(pickerSearch.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    console.log(`  ✅ Filtered: ${filtered.length} / ${menuItems.length}`);

    if (filtered.length === 0) {
      const uniqueCategories = [...new Set(menuItems.map((i) => i.category))];
      console.log("  🚨 0 RESULTS — unique category values:", uniqueCategories);
      console.log("  🚨 0 RESULTS — allowed categories:", allowedCategories);
    }

    return filtered;
  }, [menuItems, pickerState.categoryKey, pickerSearch]);

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

  return (
    <FormSection title="Menu Sections (Optional)" icon="🍽️">
      {error && (
        <div style={{ gridColumn: "1 / -1", color: "#ff6b6b", fontSize: "14px", marginBottom: "12px" }}>
          {error}
        </div>
      )}

      {/* Passed Appetizers */}
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
          <textarea rows={2} value={customFields.customPassedApp} disabled={!canEdit} onChange={(e) => { setCustomFields((p) => ({ ...p, customPassedApp: e.target.value })); saveCustomField(FIELD_IDS.CUSTOM_PASSED_APP, e.target.value); }} style={inputStyle} placeholder="Enter custom passed appetizers..." />
        </div>
      </div>

      {/* Presented Appetizers */}
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
          <textarea rows={2} value={customFields.customPresentedApp} disabled={!canEdit} onChange={(e) => { setCustomFields((p) => ({ ...p, customPresentedApp: e.target.value })); saveCustomField(FIELD_IDS.CUSTOM_PRESENTED_APP, e.target.value); }} style={inputStyle} placeholder="Enter custom presented appetizers..." />
        </div>
      </div>

      {/* Buffet - Metal */}
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
          <textarea rows={2} value={customFields.customBuffetMetal} disabled={!canEdit} onChange={(e) => { setCustomFields((p) => ({ ...p, customBuffetMetal: e.target.value })); saveCustomField(FIELD_IDS.CUSTOM_BUFFET_METAL, e.target.value); }} style={inputStyle} placeholder="Enter custom buffet metal items..." />
        </div>
      </div>

      {/* Buffet - China */}
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
          <textarea rows={2} value={customFields.customBuffetChina} disabled={!canEdit} onChange={(e) => { setCustomFields((p) => ({ ...p, customBuffetChina: e.target.value })); saveCustomField(FIELD_IDS.CUSTOM_BUFFET_CHINA, e.target.value); }} style={inputStyle} placeholder="Enter custom buffet china items..." />
        </div>
      </div>

      {/* Desserts */}
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
          <textarea rows={2} value={customFields.customDessert} disabled={!canEdit} onChange={(e) => { setCustomFields((p) => ({ ...p, customDessert: e.target.value })); saveCustomField(FIELD_IDS.CUSTOM_DESSERTS, e.target.value); }} style={inputStyle} placeholder="Enter custom desserts..." />
        </div>
      </div>

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
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ borderBottom: "1px solid #ff6b6b", padding: "16px" }}>
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
                  {filteredPickerItems.length} of {menuItems.length} items
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
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
                      <div>
                        <span>{item.name}</span>
                        {item.dietaryTags && (
                          <span style={{ display: "block", fontSize: "11px", color: "#777" }}>{item.dietaryTags}</span>
                        )}
                      </div>
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
    </FormSection>
  );
};
