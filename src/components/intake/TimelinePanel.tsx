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
  const [isOpen, setIsOpen] = useState(true);

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
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left">
          <h2 className="text-lg font-bold text-red-500">Timeline & Logistics</h2>
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
            type="datetime-local"
            value={details.dispatchTime}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("dispatchTime", event.target.value);
              saveField(FIELD_IDS.DISPATCH_TIME, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Event Start Time (seconds)</label>
          <input
            type="number"
            value={details.eventStartTime}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("eventStartTime", event.target.value);
              const numeric = event.target.value === "" ? null : Number(event.target.value);
              saveField(FIELD_IDS.EVENT_START_TIME, Number.isNaN(numeric) ? null : numeric);
            }}
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Event End Time (seconds)</label>
          <input
            type="number"
            value={details.eventEndTime}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("eventEndTime", event.target.value);
              const numeric = event.target.value === "" ? null : Number(event.target.value);
              saveField(FIELD_IDS.EVENT_END_TIME, Number.isNaN(numeric) ? null : numeric);
            }}
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">FoodWerx Arrival Time (seconds)</label>
          <input
            type="number"
            value={details.foodwerxArrival}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("foodwerxArrival", event.target.value);
              const numeric = event.target.value === "" ? null : Number(event.target.value);
              saveField(FIELD_IDS.FOODWERX_ARRIVAL, Number.isNaN(numeric) ? null : numeric);
            }}
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
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
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
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
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
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
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
          />
        </div>
          </div>
        </>
      ) : null}
    </section>
  );
};
