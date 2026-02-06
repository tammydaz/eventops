import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString, asBoolean } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

type BeveragesDetails = {
  hydrationStationNotes: string;
  infusedWater: boolean;
  infusionIngredients: string;
  coffeeServiceNeeded: boolean;
  coffeeServiceNotes: string;
};

const emptyDetails: BeveragesDetails = {
  hydrationStationNotes: "",
  infusedWater: false,
  infusionIngredients: "",
  coffeeServiceNeeded: false,
  coffeeServiceNotes: "",
};

export const BeveragesPanel = () => {
  const { selectedEventId, selectedEventData, setFields, saveError } = useEventStore();
  const [details, setDetails] = useState<BeveragesDetails>(emptyDetails);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails(emptyDetails);
      return;
    }
    setIsLoading(false);
    setError(null);
    setDetails({
      hydrationStationNotes: asString(selectedEventData["Hydration Station Notes"]),
      infusedWater: asBoolean(selectedEventData[FIELD_IDS.INFUSED_WATER]),
      infusionIngredients: asString(selectedEventData[FIELD_IDS.INFUSION_INGREDIENTS]),
      coffeeServiceNeeded: asBoolean(selectedEventData[FIELD_IDS.COFFEE_SERVICE_NEEDED]),
      coffeeServiceNotes: asString(selectedEventData["Coffee Service Notes"]),
    });
  }, [selectedEventId, selectedEventData]);

  useEffect(() => {
    if (saveError) {
      setError(saveError);
      setSaveSuccess(false);
    } else if (selectedEventId) {
      setError(null);
    }
  }, [saveError, selectedEventId]);

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const saveField = async (fieldIdOrName: string, value: unknown) => {
    if (!selectedEventId) return;
    setError(null);
    setSaveSuccess(false);
    await setFields(selectedEventId, { [fieldIdOrName]: value });
    if (!saveError) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleChange = <K extends keyof BeveragesDetails>(key: K, value: BeveragesDetails[K]) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="bg-gray-900 border-2 border-gray-800 rounded-xl p-5 mb-3 hover:border-red-600 transition-all shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3">
          <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">▶ Beverages</h2>
        </button>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {isOpen ? (
        <>
          {error || saveError ? (
            <div className="text-sm text-red-400 mb-4">
              {error || saveError}
            </div>
          ) : null}
          {saveSuccess && !error && !saveError ? (
            <div className="text-sm text-green-400 mb-4">✓ Saved to Airtable</div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-gray-400">Hydration Station Notes</label>
              <textarea
                rows={3}
                value={details.hydrationStationNotes}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("hydrationStationNotes", event.target.value);
                  saveField("Hydration Station Notes", event.target.value);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={details.infusedWater}
                  disabled={!canEdit}
                  onChange={(event) => {
                    handleChange("infusedWater", event.target.checked);
                    saveField(FIELD_IDS.INFUSED_WATER, event.target.checked);
                  }}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-red-600 cursor-pointer"
                />
                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Infused Water?
                </label>
              </div>
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
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={details.coffeeServiceNeeded}
                  disabled={!canEdit}
                  onChange={(event) => {
                    handleChange("coffeeServiceNeeded", event.target.checked);
                    saveField(FIELD_IDS.COFFEE_SERVICE_NEEDED, event.target.checked);
                  }}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-red-600 cursor-pointer"
                />
                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Coffee Service Needed
                </label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-gray-400">Coffee Service Notes</label>
              <textarea
                rows={2}
                value={details.coffeeServiceNotes}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("coffeeServiceNotes", event.target.value);
                  saveField("Coffee Service Notes", event.target.value);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
};
