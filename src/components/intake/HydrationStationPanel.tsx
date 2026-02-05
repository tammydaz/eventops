import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS, type HydrationStationDetails } from "../../services/airtable/events";
import { asBoolean, asSingleSelectName, asString, asStringArray } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

const BOTTLED_WATER_OPTIONS = ["YES", "NO"];
const SODA_OPTIONS = ["Coke", "Diet Coke", "Sprite", "Ginger Ale", "Other"];

const emptyDetails: HydrationStationDetails = {
  bottledWater: "",
  unsweetenedIcedTea: false,
  sweetTea: false,
  sodaSelection: [],
  hydrationOther: "",
  bottledIcedTea: false,
  dietIcedTea: false,
  mixtureOfTeasAndSodas: false,
};

export const HydrationStationPanel = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<HydrationStationDetails>(emptyDetails);
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
      bottledWater: asSingleSelectName(selectedEventData[FIELD_IDS.HYDRATION_BOTTLED_WATER]),
      unsweetenedIcedTea: asBoolean(selectedEventData[FIELD_IDS.HYDRATION_UNSWEET_TEA]),
      sweetTea: asBoolean(selectedEventData[FIELD_IDS.HYDRATION_SWEET_TEA]),
      sodaSelection: asStringArray(selectedEventData[FIELD_IDS.HYDRATION_SODA_SELECTION]),
      hydrationOther: asString(selectedEventData[FIELD_IDS.HYDRATION_OTHER]),
      bottledIcedTea: asBoolean(selectedEventData[FIELD_IDS.HYDRATION_BOTTLED_TEA]),
      dietIcedTea: asBoolean(selectedEventData[FIELD_IDS.HYDRATION_DIET_TEA]),
      mixtureOfTeasAndSodas: asBoolean(selectedEventData[FIELD_IDS.HYDRATION_MIXTURE]),
    });
  }, [selectedEventId, selectedEventData]);

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const saveField = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const toggleSoda = (value: string) => {
    const next = details.sodaSelection.includes(value)
      ? details.sodaSelection.filter((item) => item !== value)
      : [...details.sodaSelection, value];
    setDetails((prev) => ({
      ...prev,
      sodaSelection: next,
    }));
    saveField(FIELD_IDS.HYDRATION_SODA_SELECTION, next);
  };

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left">
          <h2 className="text-lg font-bold text-red-500">Hydration Station</h2>
        </button>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {isOpen ? (
        <>
          {error ? <div className="text-sm text-red-400 mb-4">{error}</div> : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Bottled Water</label>
          <select
            value={details.bottledWater}
            disabled={!canEdit}
            onChange={(event) => {
              setDetails((prev) => ({ ...prev, bottledWater: event.target.value }));
              saveField(FIELD_IDS.HYDRATION_BOTTLED_WATER, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
          >
            <option value="">Select</option>
            {BOTTLED_WATER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="hydration-unsweet-tea"
            type="checkbox"
            checked={details.unsweetenedIcedTea}
            disabled={!canEdit}
            onChange={(event) => {
              setDetails((prev) => ({ ...prev, unsweetenedIcedTea: event.target.checked }));
              saveField(FIELD_IDS.HYDRATION_UNSWEET_TEA, event.target.checked);
            }}
            className="h-4 w-4"
          />
          <label htmlFor="hydration-unsweet-tea" className="text-xs uppercase tracking-widest text-gray-400">
            Unsweetened Iced Tea
          </label>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="hydration-sweet-tea"
            type="checkbox"
            checked={details.sweetTea}
            disabled={!canEdit}
            onChange={(event) => {
              setDetails((prev) => ({ ...prev, sweetTea: event.target.checked }));
              saveField(FIELD_IDS.HYDRATION_SWEET_TEA, event.target.checked);
            }}
            className="h-4 w-4"
          />
          <label htmlFor="hydration-sweet-tea" className="text-xs uppercase tracking-widest text-gray-400">
            Sweet Tea
          </label>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="hydration-bottled-tea"
            type="checkbox"
            checked={details.bottledIcedTea}
            disabled={!canEdit}
            onChange={(event) => {
              setDetails((prev) => ({ ...prev, bottledIcedTea: event.target.checked }));
              saveField(FIELD_IDS.HYDRATION_BOTTLED_TEA, event.target.checked);
            }}
            className="h-4 w-4"
          />
          <label htmlFor="hydration-bottled-tea" className="text-xs uppercase tracking-widest text-gray-400">
            Bottled Iced Tea
          </label>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="hydration-diet-tea"
            type="checkbox"
            checked={details.dietIcedTea}
            disabled={!canEdit}
            onChange={(event) => {
              setDetails((prev) => ({ ...prev, dietIcedTea: event.target.checked }));
              saveField(FIELD_IDS.HYDRATION_DIET_TEA, event.target.checked);
            }}
            className="h-4 w-4"
          />
          <label htmlFor="hydration-diet-tea" className="text-xs uppercase tracking-widest text-gray-400">
            Diet Iced Tea
          </label>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="hydration-mixture"
            type="checkbox"
            checked={details.mixtureOfTeasAndSodas}
            disabled={!canEdit}
            onChange={(event) => {
              setDetails((prev) => ({ ...prev, mixtureOfTeasAndSodas: event.target.checked }));
              saveField(FIELD_IDS.HYDRATION_MIXTURE, event.target.checked);
            }}
            className="h-4 w-4"
          />
          <label htmlFor="hydration-mixture" className="text-xs uppercase tracking-widest text-gray-400">
            Mixture of Teas and Sodas
          </label>
        </div>
      </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-gray-200 mb-3">Cans or 2-Liter – Soda Selection</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SODA_OPTIONS.map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-2 text-sm text-gray-200 border border-gray-800 rounded-md px-3 py-2 cursor-pointer ${
                    details.sodaSelection.includes(option) ? "border-red-500" : "hover:border-gray-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={details.sodaSelection.includes(option)}
                    disabled={!canEdit}
                    onChange={() => toggleSoda(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <label className="text-xs uppercase tracking-widest text-gray-400">Hydration – Other</label>
            <input
              type="text"
              value={details.hydrationOther}
              disabled={!canEdit}
              onChange={(event) => {
                setDetails((prev) => ({ ...prev, hydrationOther: event.target.value }));
                saveField(FIELD_IDS.HYDRATION_OTHER, event.target.value);
              }}
              className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
            />
          </div>
        </>
      ) : null}
    </section>
  );
};
