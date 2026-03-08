import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FIELD_IDS } from "../../services/airtable/events";
import { CATEGORY_MAP, type MenuCategoryKey } from "../../constants/menuCategories";
import {
  loadMenuItems,
  type LinkedRecordItem,
} from "../../services/airtable/linkedRecords";
import { asLinkedRecordIds, asString, isErrorResult } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";
import { FormSection, CollapsibleSubsection, inputStyle, labelStyle, textareaStyle } from "./FormSection";
import { CustomFoodItemsBlock } from "./CustomFoodItemsBlock";
import { sanitizeForHeader } from "../../utils/httpHeaders";
import { cleanDisplayName } from "../../utils/displayName";
import { getPickerLabel } from "../../utils/pickerLabel";

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

type MenuSectionProps = { embedded?: boolean; isDelivery?: boolean };

export const MenuSection = ({ embedded = false, isDelivery = false }: MenuSectionProps) => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [menuItems, setMenuItems] = useState<LinkedRecordItem[]>([]);
  const [menuItemNames, setMenuItemNames] = useState<Record<string, string>>({});
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
  const [pickerState, setPickerState] = useState<PickerState>({
    isOpen: false,
    categoryKey: null,
    fieldKey: null,
    title: "",
  });
  const [pickerSearch, setPickerSearch] = useState("");
  const [showDressingPicker, setShowDressingPicker] = useState(false);
  const [dressingPickerSearch, setDressingPickerSearch] = useState("");

  // Lock body scroll when picker modal is open to prevent scroll jumping between modal and background
  useEffect(() => {
    if (pickerState.isOpen || showDressingPicker) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [pickerState.isOpen, showDressingPicker]);

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
    const apiKey = (import.meta.env.VITE_AIRTABLE_API_KEY as string)?.trim();
    const baseId = (import.meta.env.VITE_AIRTABLE_BASE_ID as string)?.trim();
    if (!recordIds?.length || !apiKey || !baseId) return;

    const uniqueIds = [...new Set(recordIds.filter((id) => typeof id === "string" && id.startsWith("rec")))];
    const allNames: Record<string, string> = {};

    for (let i = 0; i < uniqueIds.length; i += 10) {
      if (eventId && useEventStore.getState().selectedEventId !== eventId) return;
      const chunk = uniqueIds.slice(i, i + 10);
      const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
      const params = new URLSearchParams();
      params.set("filterByFormula", formula);
      params.set("returnFieldsByFieldId", "true");
      params.append("fields[]", MENU_NAME_FIELD_ID);

      try {
        const response = await fetch(
          `https://api.airtable.com/v0/${baseId}/${MENU_TABLE_ID}?${params.toString()}`,
          { headers: { Authorization: `Bearer ${sanitizeForHeader(apiKey)}` } }
        );
        const data = (await response.json()) as { records?: Array<{ id: string; fields: Record<string, unknown> }> };
        data.records?.forEach((rec) => {
          const name = rec.fields[MENU_NAME_FIELD_ID];
          const raw = typeof name === "string" ? name : rec.id;
          allNames[rec.id] = cleanDisplayName(raw);
        });
      } catch (err) {
        console.error("Failed to fetch item names:", err);
      }
    }
    if (eventId && useEventStore.getState().selectedEventId !== eventId) return;
    setMenuItemNames((prev) => ({ ...prev, ...allNames }));
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

  const openPicker = (categoryKey: MenuCategoryKey | null, fieldKey: keyof MenuSelections, title: string) => {
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
    const item = menuItems.find((i) => i.id === itemId);
    if (item) return getPickerLabel(item);
    return menuItemNames[itemId] || "Loading...";
  };

  const categoryKey = pickerState.categoryKey;
  const allowedCategories = categoryKey ? (CATEGORY_MAP[categoryKey] || []) : [];

  const searchLower = pickerSearch.trim().toLowerCase();

  // X = filtered items (what you actually show) — category + search (null = show all)
  const categoryFiltered = !categoryKey
    ? menuItems
    : menuItems.filter((item) => {
        const raw = item.category ?? (item as Record<string, unknown>)["fldM7lWvjH8S0YNSX"];
        const cats = Array.isArray(raw) ? raw : raw ? [raw] : [];
        return cats.some((cat) => allowedCategories.includes(String(cat)));
      });

  // If category filter returns nothing, show all items (items may not have Category set in Airtable yet)
  const fallbackCategories = ["deli", "room_temp", "displays", "passed", "presented", "stations"];
  const effectiveCategoryFiltered =
    categoryFiltered.length === 0 && categoryKey && fallbackCategories.includes(categoryKey)
      ? menuItems
      : categoryFiltered;

  const filteredPickerItems = !searchLower
    ? effectiveCategoryFiltered
    : effectiveCategoryFiltered.filter((item) => getPickerLabel(item).toLowerCase().includes(searchLower));

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
    : dressingCategoryFiltered.filter((item) => getPickerLabel(item).toLowerCase().includes(dressingSearchLower));

  // Y = total items (for "X of Y")
  const categoryFilteredCount = menuItems.length;

  const shownCount = filteredPickerItems.length;

  const buttonStyle = {
    width: "100%",
    padding: "8px",
    border: "1px dashed rgba(255,107,107,0.5)",
    borderRadius: "6px",
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
          <CollapsibleSubsection title="HOT - DISPOSABLE" defaultOpen isDelivery>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Passed Appetizers</label>
              <div style={{ marginBottom: "6px" }}>
                {selections.passedAppetizers.map((itemId) => (
                  <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.2)", border: deliveryItemBorder, borderRadius: "6px", padding: "6px 10px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
                    <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("passedAppetizers", itemId)} style={{ background: "none", border: "none", color: deliveryRemoveColor, cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
                  </div>
                ))}
              </div>
              <button type="button" disabled={!canEdit} onClick={() => openPicker("passed", "passedAppetizers", "Select Passed Appetizers")} style={deliveryButtonStyle}>+ Add Passed Appetizer</button>
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
              <div style={{ marginTop: "8px" }}>
                <label style={labelStyle}>Presented Appetizers</label>
                <div style={{ marginBottom: "6px" }}>
                  {selections.presentedAppetizers.map((itemId) => (
                    <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.2)", border: deliveryItemBorder, borderRadius: "6px", padding: "6px 10px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
                      <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("presentedAppetizers", itemId)} style={{ background: "none", border: "none", color: deliveryRemoveColor, cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
                    </div>
                  ))}
                </div>
                <button type="button" disabled={!canEdit} onClick={() => openPicker("presented", "presentedAppetizers", "Select Presented Appetizers")} style={deliveryButtonStyle}>+ Add Presented Appetizer</button>
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
              <div style={{ marginTop: "8px" }}>
                <label style={labelStyle}>Buffet – Metal (hot items)</label>
                <div style={{ marginBottom: "6px" }}>
                  {selections.buffetMetal.map((itemId) => (
                    <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.2)", border: deliveryItemBorder, borderRadius: "6px", padding: "6px 10px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
                      <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("buffetMetal", itemId)} style={{ background: "none", border: "none", color: deliveryRemoveColor, cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
                    </div>
                  ))}
                </div>
                <button type="button" disabled={!canEdit} onClick={() => openPicker("buffet_metal", "buffetMetal", "Select Hot Buffet Items")} style={deliveryButtonStyle}>+ Add Hot Buffet Item</button>
              </div>
            </div>
          </CollapsibleSubsection>

          <CollapsibleSubsection title="DELI - DISPOSABLE" defaultOpen isDelivery>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Sandwiches & Wraps</label>
              <div style={{ marginBottom: "6px" }}>
                {selections.deliveryDeli.map((itemId) => (
                  <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.2)", border: deliveryItemBorder, borderRadius: "6px", padding: "6px 10px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
                    <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("deliveryDeli", itemId)} style={{ background: "none", border: "none", color: deliveryRemoveColor, cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
                  </div>
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

          <CollapsibleSubsection title="KITCHEN - DISPOSABLE" defaultOpen={false} isDelivery>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Buffet – China (cold/kitchen items)</label>
              <div style={{ marginBottom: "6px" }}>
                {selections.buffetChina.map((itemId) => (
                  <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.2)", border: deliveryItemBorder, borderRadius: "6px", padding: "6px 10px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
                    <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("buffetChina", itemId)} style={{ background: "none", border: "none", color: deliveryRemoveColor, cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
                  </div>
                ))}
              </div>
              <button type="button" disabled={!canEdit} onClick={() => openPicker("buffet_china", "buffetChina", "Select Kitchen Items")} style={deliveryButtonStyle}>+ Add Kitchen Item</button>
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

          <CollapsibleSubsection title="SALADS - DISPOSABLE" defaultOpen={false} isDelivery>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Room Temp Display / Salads</label>
              <div style={{ marginBottom: "6px" }}>
                {selections.roomTempDisplay.map((itemId) => (
                  <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.2)", border: deliveryItemBorder, borderRadius: "6px", padding: "6px 10px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
                    <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("roomTempDisplay", itemId)} style={{ background: "none", border: "none", color: deliveryRemoveColor, cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
                  </div>
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

          <CollapsibleSubsection title="DESSERTS - DISPOSABLE" defaultOpen={false} isDelivery>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Desserts</label>
              <div style={{ marginBottom: "6px" }}>
                {selections.desserts.map((itemId) => (
                  <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.2)", border: deliveryItemBorder, borderRadius: "6px", padding: "6px 10px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
                    <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("desserts", itemId)} style={{ background: "none", border: "none", color: deliveryRemoveColor, cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
                  </div>
                ))}
              </div>
              <button type="button" disabled={!canEdit} onClick={() => openPicker("desserts", "desserts", "Select Desserts")} style={deliveryButtonStyle}>+ Add Dessert</button>
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
        <div style={{ marginBottom: "6px" }}>
          {selections.passedAppetizers.map((itemId) => (
            <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#2a2a2a", border: "1px solid #ff6b6b", borderRadius: "6px", padding: "8px 12px", marginBottom: "6px" }}>
              <span style={{ fontSize: "13px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
              <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("passedAppetizers", itemId)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" disabled={!canEdit} onClick={() => openPicker("passed", "passedAppetizers", "Select Passed Appetizers")} style={buttonStyle}>
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
        <div style={{ marginBottom: "6px" }}>
          {selections.presentedAppetizers.map((itemId) => (
            <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#2a2a2a", border: "1px solid #ff6b6b", borderRadius: "6px", padding: "8px 12px", marginBottom: "6px" }}>
              <span style={{ fontSize: "13px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
              <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("presentedAppetizers", itemId)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" disabled={!canEdit} onClick={() => openPicker("presented", "presentedAppetizers", "Select Presented Appetizers")} style={buttonStyle}>
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

      {/* Buffet - Metal */}
      <CollapsibleSubsection title="Buffet – Metal" icon="▶" defaultOpen={false}>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Buffet – Metal</label>
        <div style={{ marginBottom: "6px" }}>
          {selections.buffetMetal.map((itemId) => (
            <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#2a2a2a", border: "1px solid #ff6b6b", borderRadius: "6px", padding: "8px 12px", marginBottom: "6px" }}>
              <span style={{ fontSize: "13px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
              <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("buffetMetal", itemId)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" disabled={!canEdit} onClick={() => openPicker("buffet_metal", "buffetMetal", "Select Buffet Items (Metal)")} style={buttonStyle}>
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
        <div style={{ marginBottom: "6px" }}>
          {selections.buffetChina.map((itemId) => (
            <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#2a2a2a", border: "1px solid #ff6b6b", borderRadius: "6px", padding: "8px 12px", marginBottom: "6px" }}>
              <span style={{ fontSize: "13px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
              <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("buffetChina", itemId)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
            </div>
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
        <div style={{ marginBottom: "6px" }}>
          {selections.desserts.map((itemId) => (
            <div key={itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#2a2a2a", border: "1px solid #ff6b6b", borderRadius: "6px", padding: "8px 12px", marginBottom: "6px" }}>
              <span style={{ fontSize: "13px", color: "#e0e0e0" }}>{getItemName(itemId)}</span>
              <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("desserts", itemId)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" disabled={!canEdit} onClick={() => openPicker("desserts", "desserts", "Select Desserts")} style={buttonStyle}>
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

      {/* Picker Modal */}
      {pickerState.isOpen &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100000,
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
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", padding: "16px" }}>
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
                      <span>{getPickerLabel(item)}</span>
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
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", padding: "16px" }}>
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
                      <span>{getPickerLabel(item)}</span>
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
    <FormSection title="Menu Sections">
      {content}
    </FormSection>
  );
};
