import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS, type MenuSelections } from "../../services/airtable/events";
import {
  loadMenuItemSpecs,
  loadMenuItems,
  type LinkedRecordItem,
} from "../../services/airtable/linkedRecords";
import { asLinkedRecordIds, isErrorResult } from "../../services/airtable/selectors";
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

export const MenuItemsPanel = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [menuItems, setMenuItems] = useState<LinkedRecordItem[]>([]);
  const [menuItemSpecs, setMenuItemSpecs] = useState<LinkedRecordItem[]>([]);
  const [selections, setSelections] = useState<MenuSelections>(emptySelections);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

    await setFields(selectedEventId, { [fieldIdByKey[key]]: nextValue });
  };

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left">
          <h2 className="text-lg font-bold text-red-500">Menu Items & Food Sections</h2>
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
              className="w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
            />
          </div>
          {!searchTerm.trim() ? (
            <div className="text-sm text-gray-400">Type to search menu items.</div>
          ) : null}
          <div className="space-y-6">
        {SECTIONS.map((section) => {
          const options = getOptions(section.source);
          const selected = selections[section.key];
          return (
            <div key={section.key} className="border border-gray-800 rounded-lg p-4 bg-black">
              <div className="text-sm font-semibold text-gray-200 mb-3">{section.label}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center gap-2 text-sm text-gray-200 border border-gray-800 rounded-md px-3 py-2 cursor-pointer ${
                      selected.includes(option.id) ? "border-red-500" : "hover:border-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(option.id)}
                      disabled={!canEdit}
                      onChange={() => toggleSelection(section.key, option.id)}
                    />
                    <span>{option.name}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
          </div>
        </>
      ) : null}
    </section>
  );
};
