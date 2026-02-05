import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS, type BarServiceDetails } from "../../services/airtable/events";
import { asSingleSelectName, asString } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

const BAR_SERVICE_OPTIONS = [
  "None",
  "Full Bar Package",
  "Foodwerx bartender only",
  "Foodwerx Mixers Only",
];

const INFUSED_WATER_OPTIONS = ["YES", "NO"];

const emptyDetails: BarServiceDetails = {
  barServiceNeeded: "",
  infusedWater: "",
  infusionIngredients: "",
  dispenserCount: "",
};

export const BarServicePanel = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<BarServiceDetails>(emptyDetails);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails(emptyDetails);
      return;
    }
    setIsLoading(false);
    setError(null);
    setDetails({
      barServiceNeeded: asSingleSelectName(selectedEventData[FIELD_IDS.BAR_SERVICE_NEEDED]),
      infusedWater: asSingleSelectName(selectedEventData[FIELD_IDS.INFUSED_WATER]),
      infusionIngredients: asString(selectedEventData[FIELD_IDS.INFUSION_INGREDIENTS]),
      dispenserCount:
        selectedEventData[FIELD_IDS.DISPENSER_COUNT] !== undefined
          ? String(selectedEventData[FIELD_IDS.DISPENSER_COUNT])
          : "",
    });
  }, [selectedEventId, selectedEventData]);

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const saveField = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const handleChange = <K extends keyof BarServiceDetails>(key: K, value: BarServiceDetails[K]) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left">
          <h2 className="text-lg font-bold text-red-500">Bar Service</h2>
        </button>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {isOpen ? (
        <>
          {error ? <div className="text-sm text-red-400 mb-4">{error}</div> : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Bar Service Needed</label>
          <select
            value={details.barServiceNeeded}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("barServiceNeeded", event.target.value);
              saveField(FIELD_IDS.BAR_SERVICE_NEEDED, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
          >
            <option value="">Select option</option>
            {BAR_SERVICE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Infused Water?</label>
          <select
            value={details.infusedWater}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("infusedWater", event.target.value);
              saveField(FIELD_IDS.INFUSED_WATER, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
          >
            <option value="">Select</option>
            {INFUSED_WATER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Infusion Ingredients</label>
          <input
            type="text"
            value={details.infusionIngredients}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("infusionIngredients", event.target.value);
              saveField(FIELD_IDS.INFUSION_INGREDIENTS, event.target.value);
            }}
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Dispenser Count</label>
          <input
            type="number"
            value={details.dispenserCount}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("dispenserCount", event.target.value);
              const numeric = event.target.value === "" ? null : Number(event.target.value);
              saveField(FIELD_IDS.DISPENSER_COUNT, Number.isNaN(numeric) ? null : numeric);
            }}
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
          />
        </div>
          </div>
        </>
      ) : null}
    </section>
  );
};
