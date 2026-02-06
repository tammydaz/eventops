import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS, type EventDetails } from "../../services/airtable/events";
import { asSingleSelectName, asString } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

const EVENT_TYPE_OPTIONS = [
  "Full Service",
  "Delivery",
  "Pickup",
  "Grazing Display / Interactive Station",
  "Tasting",
  "Event Type (legacy)",
];

const SERVICE_STYLE_OPTIONS = [
  "Buffet",
  "Cocktail / Passed Apps Only",
  "Plated Meal",
  "Hybrid (Cocktail + Buffet)",
  "Displays Only (Grazing)",
  "Service Style (legacy)",
  "Family Style",
  "Plated",
  "Grazing",
];

const VENUE_STATE_OPTIONS = ["NJ", "PA", "DE", "NY"];

const emptyDetails: EventDetails = {
  eventName: "",
  eventDate: "",
  eventType: "",
  serviceStyle: "",
  guestCount: "",
  venue: "",
  venueAddress: "",
  venueCity: "",
  venueState: "",
  venueFullAddress: "",
  dispatchTime: "",
  eventStartTime: "",
  eventEndTime: "",
  foodwerxArrival: "",
  jobNumber: "",
};

export const EventDetailsPanel = () => {
  const { selectedEventId, selectedEventData, setFields, saveError } = useEventStore();
  const [details, setDetails] = useState<EventDetails>(emptyDetails);
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
      eventName: asString(selectedEventData[FIELD_IDS.EVENT_NAME]),
      eventDate: asString(selectedEventData[FIELD_IDS.EVENT_DATE]),
      eventType: asSingleSelectName(selectedEventData[FIELD_IDS.EVENT_TYPE]),
      serviceStyle: asSingleSelectName(selectedEventData[FIELD_IDS.SERVICE_STYLE]),
      guestCount:
        selectedEventData[FIELD_IDS.GUEST_COUNT] !== undefined
          ? String(selectedEventData[FIELD_IDS.GUEST_COUNT])
          : "",
      venue: asString(selectedEventData[FIELD_IDS.VENUE]),
      venueAddress: asString(selectedEventData[FIELD_IDS.VENUE_ADDRESS]),
      venueCity: asString(selectedEventData[FIELD_IDS.VENUE_CITY]),
      venueState: asSingleSelectName(selectedEventData[FIELD_IDS.VENUE_STATE]),
      venueFullAddress: asString(selectedEventData[FIELD_IDS.VENUE_FULL_ADDRESS]),
      dispatchTime: asString(selectedEventData[FIELD_IDS.DISPATCH_TIME]),
      eventStartTime: selectedEventData[FIELD_IDS.EVENT_START_TIME] !== undefined
        ? String(selectedEventData[FIELD_IDS.EVENT_START_TIME])
        : "",
      eventEndTime: selectedEventData[FIELD_IDS.EVENT_END_TIME] !== undefined
        ? String(selectedEventData[FIELD_IDS.EVENT_END_TIME])
        : "",
      foodwerxArrival: selectedEventData[FIELD_IDS.FOODWERX_ARRIVAL] !== undefined
        ? String(selectedEventData[FIELD_IDS.FOODWERX_ARRIVAL])
        : "",
      jobNumber: asString(selectedEventData["Job Number"]),
    });
  }, [selectedEventId, selectedEventData]);

  useEffect(() => {
    if (saveError) {
      setError(saveError);
      setSaveSuccess(false);
    } else if (selectedEventId) {
      // Clear error when saveError is cleared (successful save)
      setError(null);
    }
  }, [saveError, selectedEventId]);

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const saveField = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    setError(null);
    setSaveSuccess(false);
    await setFields(selectedEventId, { [fieldId]: value });
    // Success feedback (saveError will be handled by useEffect)
    if (!saveError) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleChange = <K extends keyof EventDetails>(key: K, value: EventDetails[K]) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="bg-gradient-to-r from-gray-900 to-black border-2 border-cyan-900 rounded-xl p-5 mb-3 hover:border-cyan-500 transition-all shadow-lg shadow-cyan-500/50">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3"
        >
          <h2 className="text-lg font-black text-cyan-400 tracking-wider uppercase">▶ Event Details</h2>
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
          <label className="text-xs uppercase tracking-widest text-gray-400">Event Name</label>
          <input
            type="text"
            value={details.eventName}
            disabled
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-500 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Event Date</label>
          <input
            type="date"
            value={details.eventDate}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("eventDate", event.target.value);
              saveField(FIELD_IDS.EVENT_DATE, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Event Type</label>
          <select
            value={details.eventType}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("eventType", event.target.value);
              saveField(FIELD_IDS.EVENT_TYPE, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          >
            <option value="">Select type</option>
            {EVENT_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Service Style</label>
          <select
            value={details.serviceStyle}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("serviceStyle", event.target.value);
              saveField(FIELD_IDS.SERVICE_STYLE, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          >
            <option value="">Select style</option>
            {SERVICE_STYLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Guest Count</label>
          <input
            type="number"
            value={details.guestCount}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("guestCount", event.target.value);
              const numeric = event.target.value === "" ? null : Number(event.target.value);
              saveField(FIELD_IDS.GUEST_COUNT, Number.isNaN(numeric) ? null : numeric);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Venue</label>
          <input
            type="text"
            value={details.venue}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("venue", event.target.value);
              saveField(FIELD_IDS.VENUE, event.target.value);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Venue Address</label>
          <input
            type="text"
            value={details.venueAddress}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("venueAddress", event.target.value);
              saveField(FIELD_IDS.VENUE_ADDRESS, event.target.value);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Venue City</label>
          <input
            type="text"
            value={details.venueCity}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("venueCity", event.target.value);
              saveField(FIELD_IDS.VENUE_CITY, event.target.value);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Venue State</label>
          <select
            value={details.venueState}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("venueState", event.target.value);
              saveField(FIELD_IDS.VENUE_STATE, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          >
            <option value="">Select state</option>
            {VENUE_STATE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
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
          <label className="text-xs uppercase tracking-widest text-gray-400">Staff Arrival Time</label>
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
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Job Number</label>
          <input
            type="text"
            value={details.jobNumber}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("jobNumber", event.target.value);
              saveField("Job Number", event.target.value);
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
