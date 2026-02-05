import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS, type DietaryAllergiesDetails } from "../../services/airtable/events";
import { asString } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

const emptyDetails: DietaryAllergiesDetails = {
  dietaryNotes: "",
  allergiesPrint: "",
  dietarySummary: "",
};

export const DietaryAllergiesPanel = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<DietaryAllergiesDetails>(emptyDetails);
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
      dietaryNotes: asString(selectedEventData[FIELD_IDS.DIETARY_NOTES]),
      allergiesPrint: asString(selectedEventData[FIELD_IDS.ALLERGIES_PRINT]),
      dietarySummary: asString(selectedEventData[FIELD_IDS.DIETARY_SUMMARY]),
    });
  }, [selectedEventId, selectedEventData]);

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const save = async (dietaryNotes: string) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [FIELD_IDS.DIETARY_NOTES]: dietaryNotes });
  };

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-red-500">Dietary & Allergies</h2>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {error ? <div className="text-sm text-red-400 mb-4">{error}</div> : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-widest text-gray-400">Dietary Notes</label>
          <textarea
            rows={4}
            value={details.dietaryNotes}
            disabled={!canEdit}
            onChange={(event) => {
              setDetails((prev) => ({ ...prev, dietaryNotes: event.target.value }));
              save(event.target.value);
            }}
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Allergies (Print)</label>
          <textarea
            rows={3}
            value={details.allergiesPrint}
            disabled
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-500 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Dietary Notes (Summary)</label>
          <textarea
            rows={3}
            value={details.dietarySummary}
            disabled
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-500 px-3 py-2"
          />
        </div>
      </div>
    </section>
  );
};
