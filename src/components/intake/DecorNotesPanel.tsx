import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

type DecorNotesDetails = {
  themeColorScheme: string;
  decorNotes: string;
  dietaryNotes: string;
  eventNotes: string;
  decorPullItems: string;
  decorPullNotes: string;
  beoNotes: string;
  beoTimeline: string;
};

const emptyDetails: DecorNotesDetails = {
  themeColorScheme: "",
  decorNotes: "",
  dietaryNotes: "",
  eventNotes: "",
  decorPullItems: "",
  decorPullNotes: "",
  beoNotes: "",
  beoTimeline: "",
};

export const DecorNotesPanel = () => {
  const { selectedEventId, selectedEventData, setFields, saveError } = useEventStore();
  const [details, setDetails] = useState<DecorNotesDetails>(emptyDetails);
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
      themeColorScheme: asString(selectedEventData[FIELD_IDS.THEME_COLOR_SCHEME]),
      decorNotes: asString(selectedEventData["decor notes"]),
      dietaryNotes: asString(selectedEventData[FIELD_IDS.DIETARY_NOTES]),
      eventNotes: asString(selectedEventData["Event Notes"]),
      decorPullItems: asString(selectedEventData["Decor Pull Items"]),
      decorPullNotes: asString(selectedEventData["Decor Pull Notes"]),
      beoNotes: asString(selectedEventData["BEO – Notes"]),
      beoTimeline: asString(selectedEventData["BEO – Timeline"]),
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

  const handleChange = <K extends keyof DecorNotesDetails>(key: K, value: DecorNotesDetails[K]) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="border-2 border-cyan-500 rounded-xl p-5 mb-3 transition-all backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(10, 20, 30, 0.8), rgba(10, 15, 25, 0.6))', boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 188, 212, 0.25), inset -2px -2px 8px rgba(0, 0, 0, 0.2), inset 2px 2px 8px rgba(255, 255, 255, 0.05)' }}>
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3">
          <h2 className="text-lg font-black text-cyan-400 tracking-wider uppercase">▶ Decor & Notes</h2>
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
              <label className="text-xs uppercase tracking-widest text-gray-400">Theme/Color Scheme</label>
              <input
                type="text"
                value={details.themeColorScheme}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("themeColorScheme", event.target.value);
                  saveField(FIELD_IDS.THEME_COLOR_SCHEME, event.target.value);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-gray-400">Decor Notes</label>
              <textarea
                rows={3}
                value={details.decorNotes}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("decorNotes", event.target.value);
                  saveField("decor notes", event.target.value);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-gray-400">Dietary Notes</label>
              <textarea
                rows={3}
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
              <label className="text-xs uppercase tracking-widest text-gray-400">Event Notes</label>
              <textarea
                rows={3}
                value={details.eventNotes}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("eventNotes", event.target.value);
                  saveField("Event Notes", event.target.value);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Decor Pull Items</label>
              <textarea
                rows={2}
                value={details.decorPullItems}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("decorPullItems", event.target.value);
                  saveField("Decor Pull Items", event.target.value);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Decor Pull Notes</label>
              <textarea
                rows={2}
                value={details.decorPullNotes}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("decorPullNotes", event.target.value);
                  saveField("Decor Pull Notes", event.target.value);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-gray-400">BEO Notes</label>
              <textarea
                rows={3}
                value={details.beoNotes}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("beoNotes", event.target.value);
                  saveField("BEO – Notes", event.target.value);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-gray-400">BEO Timeline</label>
              <textarea
                rows={4}
                value={details.beoTimeline}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("beoTimeline", event.target.value);
                  saveField("BEO – Timeline", event.target.value);
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
