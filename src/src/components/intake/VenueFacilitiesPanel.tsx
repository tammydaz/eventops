import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString, asBoolean } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

type VenueFacilitiesDetails = {
  kitchenOnSite: boolean;
  ovenAvailable: boolean;
  refrigerationAvailable: boolean;
  electricAvailable: boolean;
  parkingLoadInNotes: string;
};

const emptyDetails: VenueFacilitiesDetails = {
  kitchenOnSite: false,
  ovenAvailable: false,
  refrigerationAvailable: false,
  electricAvailable: false,
  parkingLoadInNotes: "",
};

export const VenueFacilitiesPanel = () => {
  const { selectedEventId, selectedEventData, setFields, saveError } = useEventStore();
  const [details, setDetails] = useState<VenueFacilitiesDetails>(emptyDetails);
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
      kitchenOnSite: asBoolean(selectedEventData["Kitchen On-Site?"]),
      ovenAvailable: asBoolean(selectedEventData["Oven Available"]),
      refrigerationAvailable: asBoolean(selectedEventData["Refrigeration Available"]),
      electricAvailable: asBoolean(selectedEventData["Electric Available"]),
      parkingLoadInNotes: asString(selectedEventData[FIELD_IDS.PARKING_NOTES]),
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

  const handleChange = <K extends keyof VenueFacilitiesDetails>(key: K, value: VenueFacilitiesDetails[K]) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="bg-gradient-to-r from-gray-900 to-black border-2 border-red-900 rounded-xl p-5 mb-3 hover:border-red-600 transition-all shadow-lg shadow-red-900/50">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3">
          <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">▶ Venue Facilities</h2>
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
            <div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={details.kitchenOnSite}
                  disabled={!canEdit}
                  onChange={(event) => {
                    handleChange("kitchenOnSite", event.target.checked);
                    saveField("Kitchen On-Site?", event.target.checked);
                  }}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-red-600 cursor-pointer"
                />
                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Kitchen On-Site?
                </label>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={details.ovenAvailable}
                  disabled={!canEdit}
                  onChange={(event) => {
                    handleChange("ovenAvailable", event.target.checked);
                    saveField("Oven Available", event.target.checked);
                  }}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-red-600 cursor-pointer"
                />
                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Oven Available
                </label>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={details.refrigerationAvailable}
                  disabled={!canEdit}
                  onChange={(event) => {
                    handleChange("refrigerationAvailable", event.target.checked);
                    saveField("Refrigeration Available", event.target.checked);
                  }}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-red-600 cursor-pointer"
                />
                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Refrigeration Available
                </label>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={details.electricAvailable}
                  disabled={!canEdit}
                  onChange={(event) => {
                    handleChange("electricAvailable", event.target.checked);
                    saveField("Electric Available", event.target.checked);
                  }}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-red-600 cursor-pointer"
                />
                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Electric Available
                </label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-gray-400">Parking / Load-In / Notes</label>
              <textarea
                rows={4}
                value={details.parkingLoadInNotes}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("parkingLoadInNotes", event.target.value);
                  saveField(FIELD_IDS.PARKING_NOTES, event.target.value);
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
