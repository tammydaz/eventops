import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS, type TimelineDetails } from "../../services/airtable/events";
import { asString } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";
import { useAuthStore } from "../../state/authStore";
import { secondsToTimeString, timeStringToSeconds } from "../../utils/timeHelpers";

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
  const { user } = useAuthStore();
  const [details, setDetails] = useState<TimelineDetails>(emptyDetails);
  const canEditDispatchTime = user?.role === "ops_admin";
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
      dispatchTime: secondsToTimeString(selectedEventData[FIELD_IDS.DISPATCH_TIME] as number),
      eventStartTime: secondsToTimeString(selectedEventData[FIELD_IDS.EVENT_START_TIME] as number),
      eventEndTime: secondsToTimeString(selectedEventData[FIELD_IDS.EVENT_END_TIME] as number),
      foodwerxArrival: secondsToTimeString(selectedEventData[FIELD_IDS.FOODWERX_ARRIVAL] as number),
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
          <label className="text-xs uppercase tracking-widest text-gray-400">
            Dispatch Time{!canEditDispatchTime ? " (read-only)" : ""}
          </label>
          <input
            type="time"
            value={details.dispatchTime === "—" || !details.dispatchTime ? "" : details.dispatchTime}
            disabled={!canEdit || !canEditDispatchTime}
            onChange={(event) => {
              const val = event.target.value;
              handleChange("dispatchTime", val);
              const sec = timeStringToSeconds(val);
              saveField(FIELD_IDS.DISPATCH_TIME, sec ?? null);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Event Start Time</label>
          <input
            type="time"
            value={details.eventStartTime === "—" || !details.eventStartTime ? "" : details.eventStartTime}
            disabled={!canEdit}
            onChange={(event) => {
              const val = event.target.value;
              handleChange("eventStartTime", val);
              const sec = timeStringToSeconds(val);
              if (sec != null) saveField(FIELD_IDS.EVENT_START_TIME, sec);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Event End Time</label>
          <input
            type="time"
            value={details.eventEndTime === "—" || !details.eventEndTime ? "" : details.eventEndTime}
            disabled={!canEdit}
            onChange={(event) => {
              const val = event.target.value;
              handleChange("eventEndTime", val);
              const sec = timeStringToSeconds(val);
              saveField(FIELD_IDS.EVENT_END_TIME, sec ?? null);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">FoodWerx Arrival Time</label>
          <input
            type="time"
            value={details.foodwerxArrival === "—" || !details.foodwerxArrival ? "" : details.foodwerxArrival}
            disabled={!canEdit}
            onChange={(event) => {
              const val = event.target.value;
              handleChange("foodwerxArrival", val);
              const sec = timeStringToSeconds(val);
              saveField(FIELD_IDS.FOODWERX_ARRIVAL, sec ?? null);
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
