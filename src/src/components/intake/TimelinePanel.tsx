import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS, type TimelineDetails } from "../../services/airtable/events";
import { asString } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

const emptyDetails: TimelineDetails = {
  dispatchTime: "",
  eventStartTime: "",
  eventEndTime: "",
  foodwerxArrival: "",
  timeline: "",
  parkingAccess: "",
  parkingNotes: "",
};

export const TimelinePanel = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<TimelineDetails>(emptyDetails);
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
      dispatchTime: asString(selectedEventData[FIELD_IDS.DISPATCH_TIME]),
      eventStartTime:
        selectedEventData[FIELD_IDS.EVENT_START_TIME] !== undefined
          ? String(selectedEventData[FIELD_IDS.EVENT_START_TIME])
          : "",
      eventEndTime:
        selectedEventData[FIELD_IDS.EVENT_END_TIME] !== undefined
          ? String(selectedEventData[FIELD_IDS.EVENT_END_TIME])
          : "",
      foodwerxArrival:
        selectedEventData[FIELD_IDS.FOODWERX_ARRIVAL] !== undefined
          ? String(selectedEventData[FIELD_IDS.FOODWERX_ARRIVAL])
          : "",
      timeline: asString(selectedEventData[FIELD_IDS.TIMELINE]),
      parkingAccess: asString(selectedEventData[FIELD_IDS.PARKING_ACCESS]),
      parkingNotes: asString(selectedEventData[FIELD_IDS.PARKING_NOTES]),
    });
  }, [selectedEventId, selectedEventData]);

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const saveField = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const handleChange = <K extends keyof TimelineDetails>(key: K, value: TimelineDetails[K]) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="bg-gray-900 border-2 border-gray-800 rounded-xl p-5 mb-3 hover:border-red-600 transition-all shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3">
          <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">▶ Timeline & Logistics</h2>
        </button>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {isOpen ? (
        <>
          {error ? <div className="text-sm text-red-400 mb-4">{error}</div> : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Dispatch Time</label>
          <input
            type="time"
            value={details.dispatchTime}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("dispatchTime", event.target.value);
              saveField(FIELD_IDS.DISPATCH_TIME, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Event Start Time</label>
          <input
            type="time"
            value={details.eventStartTime}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("eventStartTime", event.target.value);
              saveField(FIELD_IDS.EVENT_START_TIME, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Event End Time</label>
          <input
            type="time"
            value={details.eventEndTime}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("eventEndTime", event.target.value);
              saveField(FIELD_IDS.EVENT_END_TIME, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">FoodWerx Arrival Time</label>
          <input
            type="time"
            value={details.foodwerxArrival}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("foodwerxArrival", event.target.value);
              saveField(FIELD_IDS.FOODWERX_ARRIVAL, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-widest text-gray-400">Timeline</label>
          <textarea
            rows={3}
            value={details.timeline}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("timeline", event.target.value);
              saveField(FIELD_IDS.TIMELINE, event.target.value);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-widest text-gray-400">
            Parking / Load-In / Kitchen Access
          </label>
          <textarea
            rows={3}
            value={details.parkingAccess}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("parkingAccess", event.target.value);
              saveField(FIELD_IDS.PARKING_ACCESS, event.target.value);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-widest text-gray-400">Parking / Load-In / Notes</label>
          <textarea
            rows={3}
            value={details.parkingNotes}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("parkingNotes", event.target.value);
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
