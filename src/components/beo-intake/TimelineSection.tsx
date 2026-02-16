import { useEffect, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";
import type { TimelineFields } from "./types";
import { secondsToTimeString, timeStringToSeconds } from "../../utils/timeHelpers";

export const TimelineSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<TimelineFields>({
    dispatchTime: "",
    eventStartTime: "",
    eventEndTime: "",
    eventArrivalTime: "",
    opsExceptions: "",
  });

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails({
        dispatchTime: "",
        eventStartTime: "",
        eventEndTime: "",
        eventArrivalTime: "",
        opsExceptions: "",
      });
      return;
    }

    setDetails({
      dispatchTime: secondsToTimeString(selectedEventData[FIELD_IDS.DISPATCH_TIME] as number),
      eventStartTime: secondsToTimeString(selectedEventData[FIELD_IDS.EVENT_START_TIME] as number),
      eventEndTime: secondsToTimeString(selectedEventData[FIELD_IDS.EVENT_END_TIME] as number),
      eventArrivalTime: secondsToTimeString(selectedEventData[FIELD_IDS.VENUE_ARRIVAL_PRINT] as number),
      opsExceptions: asString(selectedEventData[FIELD_IDS.OPS_EXCEPTIONS_SPECIAL_HANDLING]),
    });
  }, [selectedEventId, selectedEventData]);

  const handleFieldChange = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const handleChange = <K extends keyof TimelineFields>(key: K, value: TimelineFields[K]) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const canEdit = Boolean(selectedEventId);

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #444",
    backgroundColor: "#1a1a1a",
    color: "#e0e0e0",
    fontSize: "14px",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    color: "#999",
    marginBottom: "6px",
    fontWeight: "600",
  };

  return (
    <FormSection title="Event Timeline (Optional)" icon="⏰">
      <div>
        <label style={labelStyle}>Dispatch Time</label>
        <input
          type="time"
          value={details.dispatchTime}
          disabled={!canEdit}
          onChange={(e) => {
            handleChange("dispatchTime", e.target.value);
            handleFieldChange(FIELD_IDS.DISPATCH_TIME, timeStringToSeconds(e.target.value));
          }}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Event Start Time</label>
        <input
          type="time"
          value={details.eventStartTime}
          disabled={!canEdit}
          onChange={(e) => {
            handleChange("eventStartTime", e.target.value);
            handleFieldChange(FIELD_IDS.EVENT_START_TIME, timeStringToSeconds(e.target.value));
          }}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Event End Time</label>
        <input
          type="time"
          value={details.eventEndTime}
          disabled={!canEdit}
          onChange={(e) => {
            handleChange("eventEndTime", e.target.value);
            handleFieldChange(FIELD_IDS.EVENT_END_TIME, timeStringToSeconds(e.target.value));
          }}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Event Arrival Time</label>
        <input
          type="time"
          value={details.eventArrivalTime}
          disabled={!canEdit}
          placeholder="-- : --"
          onChange={(e) => {
            handleChange("eventArrivalTime", e.target.value);
            handleFieldChange(FIELD_IDS.VENUE_ARRIVAL_PRINT, timeStringToSeconds(e.target.value));
          }}
          style={inputStyle}
        />
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Kitchen Notes / Ops Exceptions</label>
        <textarea
          rows={3}
          value={details.opsExceptions}
          disabled={!canEdit}
          onChange={(e) => {
            handleChange("opsExceptions", e.target.value);
            handleFieldChange(FIELD_IDS.OPS_EXCEPTIONS_SPECIAL_HANDLING, e.target.value);
          }}
          style={{
            ...inputStyle,
            resize: "vertical",
            fontFamily: "inherit",
          }}
          placeholder="Special instructions, exceptions..."
        />
      </div>
    </FormSection>
  );
};
