import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS, type MenuSelections } from "../../services/airtable/events";
import {
  loadMenuItemSpecs,
  loadMenuItems,
  type LinkedRecordItem,
} from "../../services/airtable/linkedRecords";
import { asLinkedRecordIds, asString, isErrorResult } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";
import { MENU_SECTIONS, type MenuCategoryKey } from "../../constants/menuCategories";
import { MenuPickerModal, type MenuItemRecord } from "../MenuPickerModal";

const emptySelections: MenuSelections = {
  passedAppetizers: [],
  presentedAppetizers: [],
  buffetMetal: [],
  buffetChina: [],
  desserts: [],
  beverages: [],
  menuItems: [],
  menuItemSpecs: [],
};

type CustomFields = {
  customPassedApp: string;
  customPresentedApp: string;
  customBuffetMetal: string;
  customBuffetChina: string;
  customDessert: string;
};

const emptyCustomFields: CustomFields = {
  customPassedApp: "",
  customPresentedApp: "",
  customBuffetMetal: "",
  customBuffetChina: "",
  customDessert: "",
};

type PickerState = {
  isOpen: boolean;
  categoryKey: MenuCategoryKey | null;
  fieldName: string;
  label: string;
};

export const MenuItemsPanel = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [menuItems, setMenuItems] = useState<LinkedRecordItem[]>([]);
  const [menuItemSpecs, setMenuItemSpecs] = useState<LinkedRecordItem[]>([]);
  const [selections, setSelections] = useState<MenuSelections>(emptySelections);
  const [customFields, setCustomFields] = useState<CustomFields>(emptyCustomFields);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pickerState, setPickerState] = useState<PickerState>({
    isOpen: false,
    categoryKey: null,
    fieldName: "",
    label: "",
  });

  useEffect(() => {
    let active = true;
    const loadLists = async () => {
      try {
        const items = await loadMenuItems();
        if (isErrorResult(items)) {
          if (active) {
            setError(items.message ?? "Failed to load menu items.");
          }
          return;
        }
        const specs = await loadMenuItemSpecs();
        if (isErrorResult(specs)) {
          if (active) {
            setError(specs.message ?? "Failed to load menu item specs.");
          }
          return;
        }
        if (active) {
          console.log("📦 Menu items loaded:", items.length);
          console.log("Sample items:", items.slice(0, 3));
          setMenuItems(items);
          setMenuItemSpecs(specs);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      }
    };

    loadLists();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setSelections(emptySelections);
      setCustomFields(emptyCustomFields);
      return;
    }
    setIsLoading(false);
    setError(null);
    setSelections({
      passedAppetizers: asLinkedRecordIds(selectedEventData[FIELD_IDS.PASSED_APPETIZERS]),
      presentedAppetizers: asLinkedRecordIds(selectedEventData[FIELD_IDS.PRESENTED_APPETIZERS]),
      buffetMetal: asLinkedRecordIds(selectedEventData[FIELD_IDS.BUFFET_METAL]),
      buffetChina: asLinkedRecordIds(selectedEventData[FIELD_IDS.BUFFET_CHINA]),
      desserts: asLinkedRecordIds(selectedEventData[FIELD_IDS.DESSERTS]),
      beverages: asLinkedRecordIds(selectedEventData[FIELD_IDS.BEVERAGES]),
      menuItems: asLinkedRecordIds(selectedEventData[FIELD_IDS.MENU_ITEMS]),
      menuItemSpecs: asLinkedRecordIds(selectedEventData[FIELD_IDS.MENU_ITEM_SPECS]),
    });
    setCustomFields({
      customPassedApp: asString(selectedEventData[FIELD_IDS.CUSTOM_PASSED_APP]),
      customPresentedApp: asString(selectedEventData[FIELD_IDS.CUSTOM_PRESENTED_APP]),
      customBuffetMetal: asString(selectedEventData[FIELD_IDS.CUSTOM_BUFFET_METAL]),
      customBuffetChina: asString(selectedEventData[FIELD_IDS.CUSTOM_BUFFET_CHINA]),
      customDessert: asString(selectedEventData[FIELD_IDS.CUSTOM_DESSERTS]),
    });
  }, [selectedEventId, selectedEventData]);

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const fieldIdByKey: Record<keyof MenuSelections, string> = {
    passedAppetizers: FIELD_IDS.PASSED_APPETIZERS,
    presentedAppetizers: FIELD_IDS.PRESENTED_APPETIZERS,
    buffetMetal: FIELD_IDS.BUFFET_METAL,
    buffetChina: FIELD_IDS.BUFFET_CHINA,
    desserts: FIELD_IDS.DESSERTS,
    beverages: FIELD_IDS.BEVERAGES,
    menuItems: FIELD_IDS.MENU_ITEMS,
    menuItemSpecs: FIELD_IDS.MENU_ITEM_SPECS,
  };

  const saveCustomField = async (fieldName: string, value: string) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldName]: value });
  };

  const openPicker = (categoryKey: MenuCategoryKey, fieldName: string, label: string) => {
    console.log("OPEN PICKER:", { categoryKey, fieldName, menuItemsCount: menuItems.length });
    setPickerState({ isOpen: true, categoryKey, fieldName, label });
  };

  const closePicker = () => {
    setPickerState({ isOpen: false, categoryKey: null, fieldName: "", label: "" });
  };

  const handleSelectItem = async (item: MenuItemRecord) => {
    if (!selectedEventId || !pickerState.fieldName) return;

    const fieldName = pickerState.fieldName as keyof MenuSelections;
    const currentIds = selections[fieldName];

    // Toggle selection
    const newIds = currentIds.includes(item.id)
      ? currentIds.filter((id) => id !== item.id)
      : [...currentIds, item.id];

    setSelections((prev) => ({ ...prev, [fieldName]: newIds }));

    const linkedRecords = newIds.map((id) => ({ id }));
    await setFields(selectedEventId, { [fieldIdByKey[fieldName]]: linkedRecords });
  };

  const removeMenuItem = async (fieldName: keyof MenuSelections, itemId: string) => {
    if (!selectedEventId) return;

    const newItems = selections[fieldName].filter((id) => id !== itemId);
    setSelections((prev) => ({ ...prev, [fieldName]: newItems }));

    const linkedRecords = newItems.map((id) => ({ id }));
    await setFields(selectedEventId, { [fieldIdByKey[fieldName]]: linkedRecords });
  };

  const getItemName = (itemId: string) => {
    const item = menuItems.find((i) => i.id === itemId);
    return item?.name || itemId;
  };

  const currentlySelectedItems = useMemo(() => {
    if (!pickerState.fieldName) return [];
    const fieldName = pickerState.fieldName as keyof MenuSelections;
    const selectedIds = selections[fieldName];
    return menuItems.filter((item) => selectedIds.includes(item.id));
  }, [pickerState.fieldName, selections, menuItems]);

  // Map custom field names to FIELD_IDS
  const customFieldIdMap: Record<string, string> = {
    customPassedApp: FIELD_IDS.CUSTOM_PASSED_APP,
    customPresentedApp: FIELD_IDS.CUSTOM_PRESENTED_APP,
    customBuffetMetal: FIELD_IDS.CUSTOM_BUFFET_METAL,
    customBuffetChina: FIELD_IDS.CUSTOM_BUFFET_CHINA,
    customDessert: FIELD_IDS.CUSTOM_DESSERTS,
  };

  return (
    <section
      className="border-2 border-red-600 rounded-xl p-5 mb-3 transition-all backdrop-blur-sm"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 10, 10, 0.8), rgba(25, 10, 15, 0.6))',
        boxShadow:
          '0 15px 35px rgba(0, 0, 0, 0.4), 0 0 20px rgba(204, 0, 0, 0.25), inset -2px -2px 8px rgba(0, 0, 0, 0.2), inset 2px 2px 8px rgba(255, 255, 255, 0.05)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3"
        >
          <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">
            ▶ Menu Items & Food Sections
          </h2>
        </button>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {isOpen ? (
        <>
          {error ? <div className="text-sm text-red-400 mb-4">{error}</div> : null}
          <div className="space-y-6">
            {MENU_SECTIONS.map((section) => {
              const selectedIds = selections[section.fieldName as keyof MenuSelections] || [];
              const customValue = customFields[section.customFieldName as keyof CustomFields] || "";

              return (
                <div key={section.categoryKey} className="border border-gray-800 rounded-lg p-4 bg-black">
                  <div className="text-sm font-semibold text-gray-200 mb-3">{section.label}</div>
                  <div className="space-y-2 mb-3">
                    {selectedIds.map((itemId) => (
                      <div
                        key={itemId}
                        className="flex items-center justify-between bg-gray-900 border border-red-600 rounded-md px-3 py-2"
                      >
                        <span className="text-sm text-gray-300">{getItemName(itemId)}</span>
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => removeMenuItem(section.fieldName as keyof MenuSelections, itemId)}
                          className="text-red-400 hover:text-red-600 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => openPicker(section.categoryKey, section.fieldName, section.label)}
                      className="w-full py-2 border-2 border-dashed border-red-600 rounded-md text-red-400 hover:bg-red-900 hover:text-gray-300 transition"
                    >
                      + Add {section.label}
                    </button>
                  </div>
                  {section.customFieldName ? (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Custom {section.label}</label>
                    <textarea
                      rows={2}
                      value={customValue}
                      disabled={!canEdit}
                      onChange={(e) => {
                        setCustomFields((prev) => ({
                          ...prev,
                          [section.customFieldName]: e.target.value,
                        }));
                        saveCustomField(customFieldIdMap[section.customFieldName], e.target.value);
                      }}
                      className="w-full rounded-md bg-gray-950 border border-gray-800 text-gray-300 px-3 py-2"
                      placeholder={`Enter custom ${section.label.toLowerCase()}...`}
                    />
                  </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Picker Modal */}
          <MenuPickerModal
            isOpen={pickerState.isOpen}
            categoryKey={pickerState.categoryKey}
            label={pickerState.label}
            menuItems={menuItems}
            currentlySelected={currentlySelectedItems}
            onSelect={handleSelectItem}
            onClose={closePicker}
          />
        </>
      ) : null}
    </section>
  );
};
