import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS, type NotesDetails } from "../../services/airtable/events";
import { asString } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

const emptyDetails: NotesDetails = {
  dietaryNotes: "",
  specialNotes: "",
  themeColorScheme: "",
};

export const NotesPanel = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<NotesDetails>(emptyDetails);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails(emptyDetails);
      return;
    }
    setIsLoading(false);
    setError(null);
    setDetails({
      dietaryNotes: asString(selectedEventData[FIELD_IDS.DIETARY_NOTES]),
      specialNotes: asString(selectedEventData[FIELD_IDS.SPECIAL_NOTES]),
      themeColorScheme: asString(selectedEventData[FIELD_IDS.THEME_COLOR_SCHEME]),
    });
  }, [selectedEventId, selectedEventData]);

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const saveField = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const handleChange = <K extends keyof NotesDetails>(key: K, value: NotesDetails[K]) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="bg-gray-900 border-2 border-gray-800 rounded-xl p-5 mb-3 hover:border-red-600 transition-all shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3">
          <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">▶ Notes</h2>
        </button>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {isOpen ? (
        <>
          {error ? <div className="text-sm text-red-400 mb-4">{error}</div> : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-widest text-gray-400">Dietary Notes</label>
          <textarea
            rows={4}
            value={details.dietaryNotes}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("dietaryNotes", event.target.value);
              saveField(FIELD_IDS.DIETARY_NOTES, event.target.value);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-widest text-gray-400">Special Notes</label>
          <textarea
            rows={4}
            value={details.specialNotes}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("specialNotes", event.target.value);
              saveField(FIELD_IDS.SPECIAL_NOTES, event.target.value);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-widest text-gray-400">Theme / Color Scheme</label>
          <textarea
            rows={3}
            value={details.themeColorScheme}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("themeColorScheme", event.target.value);
              saveField(FIELD_IDS.THEME_COLOR_SCHEME, event.target.value);
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
