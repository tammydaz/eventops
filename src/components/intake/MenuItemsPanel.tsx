import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS, type MenuSelections } from "../../services/airtable/events";
import {
  loadMenuItemSpecs,
  loadMenuItems,
  type LinkedRecordItem,
} from "../../services/airtable/linkedRecords";
import { asLinkedRecordIds, asString, isErrorResult } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

const emptySelections: MenuSelections = {
  passedAppetizers: [],
  presentedAppetizers: [],
  buffetItems: [],
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

type SectionConfig = {
  key: keyof MenuSelections;
  label: string;
  source: "menuItems" | "menuItemSpecs";
};

const SECTIONS: SectionConfig[] = [
  { key: "passedAppetizers", label: "Passed Appetizers", source: "menuItems" },
  { key: "presentedAppetizers", label: "Presented Appetizers", source: "menuItems" },
  { key: "buffetItems", label: "Buffet Items", source: "menuItems" },
  { key: "desserts", label: "Desserts", source: "menuItems" },
  { key: "beverages", label: "Beverages", source: "menuItems" },
  { key: "menuItems", label: "Menu Items", source: "menuItems" },
  { key: "menuItemSpecs", label: "Menu Item Specs", source: "menuItemSpecs" },
];

type PickerState = {
  isOpen: boolean;
  section: keyof MenuSelections | null;
  title: string;
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
  const [pickerState, setPickerState] = useState<PickerState>({ isOpen: false, section: null, title: "" });
  const [pickerSearch, setPickerSearch] = useState("");

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
      buffetItems: asLinkedRecordIds(selectedEventData[FIELD_IDS.BUFFET_ITEMS]),
      desserts: asLinkedRecordIds(selectedEventData[FIELD_IDS.DESSERTS]),
      beverages: asLinkedRecordIds(selectedEventData[FIELD_IDS.BEVERAGES]),
      menuItems: asLinkedRecordIds(selectedEventData[FIELD_IDS.MENU_ITEMS]),
      menuItemSpecs: asLinkedRecordIds(selectedEventData[FIELD_IDS.MENU_ITEM_SPECS]),
    });
    setCustomFields({
      customPassedApp: asString(selectedEventData["Custom Passed App"]),
      customPresentedApp: asString(selectedEventData["Custom Presented App"]),
      customBuffetMetal: asString(selectedEventData["custom buffet metal"]),
      customBuffetChina: asString(selectedEventData["Custom Buffet China"]),
      customDessert: asString(selectedEventData["Custom Dessert Item"]),
    });
  }, [selectedEventId, selectedEventData]);

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const getOptions = (source: SectionConfig["source"]) => {
    const base = source === "menuItems" ? menuItems : menuItemSpecs;
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return base.filter((option) => option.name.toLowerCase().includes(term));
  };

  const fieldIdByKey: Record<keyof MenuSelections, string> = {
    passedAppetizers: FIELD_IDS.PASSED_APPETIZERS,
    presentedAppetizers: FIELD_IDS.PRESENTED_APPETIZERS,
    buffetItems: FIELD_IDS.BUFFET_ITEMS,
    desserts: FIELD_IDS.DESSERTS,
    beverages: FIELD_IDS.BEVERAGES,
    menuItems: FIELD_IDS.MENU_ITEMS,
    menuItemSpecs: FIELD_IDS.MENU_ITEM_SPECS,
  };

  const toggleSelection = async (key: keyof MenuSelections, id: string) => {
    if (!selectedEventId) return;
    setSelections((prev) => {
      const current = prev[key];
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      return { ...prev, [key]: next };
    });

    const nextValue = selections[key].includes(id)
      ? selections[key].filter((item) => item !== id)
      : [...selections[key], id];

    // Convert string IDs to linked record format: [{ id: "recXXX" }]
    const linkedRecords = nextValue.map(recId => ({ id: recId }));

    await setFields(selectedEventId, { [fieldIdByKey[key]]: linkedRecords });
  };

  const saveCustomField = async (fieldName: string, value: string) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldName]: value });
  };

  const openPicker = (section: keyof MenuSelections, title: string) => {
    setPickerState({ isOpen: true, section, title });
    setPickerSearch("");
  };

  const closePicker = () => {
    setPickerState({ isOpen: false, section: null, title: "" });
    setPickerSearch("");
  };

  const addMenuItem = async (itemId: string) => {
    if (!selectedEventId || !pickerState.section) return;
    
    const section = pickerState.section;
    const currentItems = selections[section];
    
    // Only add if not already selected
    if (currentItems.includes(itemId)) {
      closePicker();
      return;
    }

    const newItems = [...currentItems, itemId];
    setSelections(prev => ({ ...prev, [section]: newItems }));
    
    const linkedRecords = newItems.map(id => ({ id }));
    await setFields(selectedEventId, { [fieldIdByKey[section]]: linkedRecords });
    
    closePicker();
  };

  const removeMenuItem = async (section: keyof MenuSelections, itemId: string) => {
    if (!selectedEventId) return;
    
    const newItems = selections[section].filter(id => id !== itemId);
    setSelections(prev => ({ ...prev, [section]: newItems }));
    
    const linkedRecords = newItems.map(id => ({ id }));
    await setFields(selectedEventId, { [fieldIdByKey[section]]: linkedRecords });
  };

  const getItemName = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
    return item?.name || itemId;
  };

  const filteredPickerItems = pickerSearch.trim()
    ? menuItems.filter(item => item.name.toLowerCase().includes(pickerSearch.toLowerCase()))
    : menuItems;

  return (
    <section className="border-2 border-red-600 rounded-xl p-5 mb-3 transition-all backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(30, 10, 10, 0.8), rgba(25, 10, 15, 0.6))', boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4), 0 0 20px rgba(204, 0, 0, 0.25), inset -2px -2px 8px rgba(0, 0, 0, 0.2), inset 2px 2px 8px rgba(255, 255, 255, 0.05)' }}>
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3">
          <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">▶ Menu Items & Food Sections</h2>
        </button>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {isOpen ? (
        <>
          {error ? <div className="text-sm text-red-400 mb-4">{error}</div> : null}
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search menu items..."
              className="w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
            />
          </div>
          <div className="space-y-6">
            {/* Passed Appetizers */}
            <div className="border border-gray-800 rounded-lg p-4 bg-black">
              <div className="text-sm font-semibold text-gray-200 mb-3">Passed Appetizers</div>
              <div className="space-y-2 mb-3">
                {selections.passedAppetizers.map((itemId) => (
                  <div key={itemId} className="flex items-center justify-between bg-gray-900 border border-red-600 rounded-md px-3 py-2">
                    <span className="text-sm text-gray-300">{getItemName(itemId)}</span>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => removeMenuItem("passedAppetizers", itemId)}
                      className="text-red-400 hover:text-red-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => openPicker("passedAppetizers", "Passed Appetizers")}
                  className="w-full py-2 border-2 border-dashed border-red-600 rounded-md text-red-400 hover:bg-red-900 hover:text-gray-300 transition"
                >
                  + Add Passed Appetizer
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Custom Passed Appetizer</label>
                <textarea
                  rows={2}
                  value={customFields.customPassedApp}
                  disabled={!canEdit}
                  onChange={(e) => {
                    setCustomFields(prev => ({ ...prev, customPassedApp: e.target.value }));
                    saveCustomField("Custom Passed App", e.target.value);
                  }}
                  className="w-full rounded-md bg-gray-950 border border-gray-800 text-gray-300 px-3 py-2"
                  placeholder="Enter custom passed appetizer..."
                />
              </div>
            </div>

            {/* Presented Appetizers */}
            <div className="border border-gray-800 rounded-lg p-4 bg-black">
              <div className="text-sm font-semibold text-gray-200 mb-3">Presented Appetizers</div>
              <div className="space-y-2 mb-3">
                {selections.presentedAppetizers.map((itemId) => (
                  <div key={itemId} className="flex items-center justify-between bg-gray-900 border border-red-600 rounded-md px-3 py-2">
                    <span className="text-sm text-gray-300">{getItemName(itemId)}</span>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => removeMenuItem("presentedAppetizers", itemId)}
                      className="text-red-400 hover:text-red-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => openPicker("presentedAppetizers", "Presented Appetizers")}
                  className="w-full py-2 border-2 border-dashed border-red-600 rounded-md text-red-400 hover:bg-red-900 hover:text-gray-300 transition"
                >
                  + Add Presented Appetizer
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Custom Presented Appetizer</label>
                <textarea
                  rows={2}
                  value={customFields.customPresentedApp}
                  disabled={!canEdit}
                  onChange={(e) => {
                    setCustomFields(prev => ({ ...prev, customPresentedApp: e.target.value }));
                    saveCustomField("Custom Presented App", e.target.value);
                  }}
                  className="w-full rounded-md bg-gray-950 border border-gray-800 text-gray-300 px-3 py-2"
                  placeholder="Enter custom presented appetizer..."
                />
              </div>
            </div>

            {/* Buffet - Metal */}
            <div className="border border-gray-800 rounded-lg p-4 bg-black">
              <div className="text-sm font-semibold text-gray-200 mb-3">Buffet - Metal</div>
              <div className="space-y-2 mb-3">
                {selections.buffetItems.map((itemId) => (
                  <div key={itemId} className="flex items-center justify-between bg-gray-900 border border-red-600 rounded-md px-3 py-2">
                    <span className="text-sm text-gray-300">{getItemName(itemId)}</span>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => removeMenuItem("buffetItems", itemId)}
                      className="text-red-400 hover:text-red-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => openPicker("buffetItems", "Buffet - Metal")}
                  className="w-full py-2 border-2 border-dashed border-red-600 rounded-md text-red-400 hover:bg-red-900 hover:text-gray-300 transition"
                >
                  + Add Buffet Item (Metal)
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Custom Buffet Metal</label>
                <textarea
                  rows={2}
                  value={customFields.customBuffetMetal}
                  disabled={!canEdit}
                  onChange={(e) => {
                    setCustomFields(prev => ({ ...prev, customBuffetMetal: e.target.value }));
                    saveCustomField("custom buffet metal", e.target.value);
                  }}
                  className="w-full rounded-md bg-gray-950 border border-gray-800 text-gray-300 px-3 py-2"
                  placeholder="Enter custom buffet metal item..."
                />
              </div>
            </div>

            {/* Buffet - China */}
            <div className="border border-gray-800 rounded-lg p-4 bg-black">
              <div className="text-sm font-semibold text-gray-200 mb-3">Buffet - China</div>
              <div className="space-y-2 mb-3">
                {selections.buffetItems.map((itemId) => (
                  <div key={itemId} className="flex items-center justify-between bg-gray-900 border border-red-600 rounded-md px-3 py-2">
                    <span className="text-sm text-gray-300">{getItemName(itemId)}</span>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => removeMenuItem("buffetItems", itemId)}
                      className="text-red-400 hover:text-red-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => openPicker("buffetItems", "Buffet - China")}
                  className="w-full py-2 border-2 border-dashed border-red-600 rounded-md text-red-400 hover:bg-red-900 hover:text-gray-300 transition"
                >
                  + Add Buffet Item (China)
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Custom Buffet China</label>
                <textarea
                  rows={2}
                  value={customFields.customBuffetChina}
                  disabled={!canEdit}
                  onChange={(e) => {
                    setCustomFields(prev => ({ ...prev, customBuffetChina: e.target.value }));
                    saveCustomField("Custom Buffet China", e.target.value);
                  }}
                  className="w-full rounded-md bg-gray-950 border border-gray-800 text-gray-300 px-3 py-2"
                  placeholder="Enter custom buffet china item..."
                />
              </div>
            </div>

            {/* Desserts */}
            <div className="border border-gray-800 rounded-lg p-4 bg-black">
              <div className="text-sm font-semibold text-gray-200 mb-3">Desserts</div>
              <div className="space-y-2 mb-3">
                {selections.desserts.map((itemId) => (
                  <div key={itemId} className="flex items-center justify-between bg-gray-900 border border-red-600 rounded-md px-3 py-2">
                    <span className="text-sm text-gray-300">{getItemName(itemId)}</span>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => removeMenuItem("desserts", itemId)}
                      className="text-red-400 hover:text-red-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => openPicker("desserts", "Desserts")}
                  className="w-full py-2 border-2 border-dashed border-red-600 rounded-md text-red-400 hover:bg-red-900 hover:text-gray-300 transition"
                >
                  + Add Dessert
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Custom Dessert</label>
                <textarea
                  rows={2}
                  value={customFields.customDessert}
                  disabled={!canEdit}
                  onChange={(e) => {
                    setCustomFields(prev => ({ ...prev, customDessert: e.target.value }));
                    saveCustomField("Custom Dessert Item", e.target.value);
                  }}
                  className="w-full rounded-md bg-gray-950 border border-gray-800 text-gray-300 px-3 py-2"
                  placeholder="Enter custom dessert..."
                />
              </div>
            </div>
          </div>

          {/* Picker Modal */}
          {pickerState.isOpen && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
              <div className="bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border-2 border-red-600">
                <div className="border-b border-red-600 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-300">{pickerState.title}</h3>
                    <button onClick={closePicker} className="text-red-400 hover:text-red-600 text-xl font-bold">
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="w-full rounded-md bg-gray-800 border border-gray-700 text-gray-300 px-3 py-2"
                    autoFocus
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {filteredPickerItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addMenuItem(item.id)}
                      className="w-full text-left px-4 py-3 bg-gray-800 border border-gray-700 rounded-md hover:bg-red-900 hover:border-red-600 text-gray-300 transition"
                    >
                      {item.name}
                    </button>
                  ))}
                  {filteredPickerItems.length === 0 && (
                    <div className="text-center py-8 text-gray-400">No items found</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
};
