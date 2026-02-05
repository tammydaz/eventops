import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS, type BeveragesDetails } from "../../services/airtable/events";
import { asBoolean } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

const emptyDetails: BeveragesDetails = {
  bottledWater: false,
  unsweetenedIcedTea: false,
  sweetTea: false,
  coke: false,
  dietCoke: false,
  gingerAle: false,
  sprite: false,
  otherSoda: false,
  bottledIcedTea: false,
  dietIcedTea: false,
  mixture: false,
};

const FIELD_LABELS: Array<{ key: keyof BeveragesDetails; label: string }> = [
  { key: "bottledWater", label: "Bottled Water" },
  { key: "unsweetenedIcedTea", label: "Unsweetened Iced Tea" },
  { key: "sweetTea", label: "Sweet Tea" },
  { key: "coke", label: "Coke (Cans or 2-Liter)" },
  { key: "dietCoke", label: "Diet Coke (Cans or 2-Liter)" },
  { key: "gingerAle", label: "Ginger Ale (Cans or 2-Liter)" },
  { key: "sprite", label: "Sprite (Cans or 2-Liter)" },
  { key: "otherSoda", label: "Other Soda (Cans or 2-Liter)" },
  { key: "bottledIcedTea", label: "Bottled Iced Tea" },
  { key: "dietIcedTea", label: "Diet Iced Tea" },
  { key: "mixture", label: "Mixture of Teas and Sodas" },
];

export const BeveragesPanel = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<BeveragesDetails>(emptyDetails);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails(emptyDetails);
      return;
    }
    setIsLoading(false);
    setError(null);
    setDetails({
      bottledWater: asBoolean(selectedEventData[FIELD_IDS.LEGACY_BOTTLED_WATER]),
      unsweetenedIcedTea: asBoolean(selectedEventData[FIELD_IDS.LEGACY_UNSWEETENED_TEA]),
      sweetTea: asBoolean(selectedEventData[FIELD_IDS.LEGACY_SWEET_TEA]),
      coke: asBoolean(selectedEventData[FIELD_IDS.LEGACY_COKE]),
      dietCoke: asBoolean(selectedEventData[FIELD_IDS.LEGACY_DIET_COKE]),
      gingerAle: asBoolean(selectedEventData[FIELD_IDS.LEGACY_GINGER_ALE]),
      sprite: asBoolean(selectedEventData[FIELD_IDS.LEGACY_SPRITE]),
      otherSoda: asBoolean(selectedEventData[FIELD_IDS.LEGACY_OTHER_SODA]),
      bottledIcedTea: asBoolean(selectedEventData[FIELD_IDS.LEGACY_BOTTLED_TEA]),
      dietIcedTea: asBoolean(selectedEventData[FIELD_IDS.LEGACY_DIET_TEA]),
      mixture: asBoolean(selectedEventData[FIELD_IDS.LEGACY_MIXTURE]),
    });
  }, [selectedEventId, selectedEventData]);

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const toggle = async (key: keyof BeveragesDetails, value: boolean) => {
    if (!selectedEventId) return;
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));

    const fieldMap: Record<keyof BeveragesDetails, string> = {
      bottledWater: FIELD_IDS.LEGACY_BOTTLED_WATER,
      unsweetenedIcedTea: FIELD_IDS.LEGACY_UNSWEETENED_TEA,
      sweetTea: FIELD_IDS.LEGACY_SWEET_TEA,
      coke: FIELD_IDS.LEGACY_COKE,
      dietCoke: FIELD_IDS.LEGACY_DIET_COKE,
      gingerAle: FIELD_IDS.LEGACY_GINGER_ALE,
      sprite: FIELD_IDS.LEGACY_SPRITE,
      otherSoda: FIELD_IDS.LEGACY_OTHER_SODA,
      bottledIcedTea: FIELD_IDS.LEGACY_BOTTLED_TEA,
      dietIcedTea: FIELD_IDS.LEGACY_DIET_TEA,
      mixture: FIELD_IDS.LEGACY_MIXTURE,
    };
    await setFields(selectedEventId, { [fieldMap[key]]: value });
  };

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-red-500">Beverages (Hydration Station)</h2>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {error ? <div className="text-sm text-red-400 mb-4">{error}</div> : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FIELD_LABELS.map((field) => (
          <label
            key={field.key}
            className="flex items-center gap-3 border border-gray-800 rounded-md px-3 py-2 text-sm text-gray-200"
          >
            <input
              type="checkbox"
              checked={details[field.key]}
              disabled={!canEdit}
              onChange={(event) => toggle(field.key, event.target.checked)}
              className="h-4 w-4"
            />
            <span>{field.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
};
