import { useEffect, useRef, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asSingleSelectName, asString } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";
import type { EventCore } from "./types";
import { secondsToTimeString, MINUTE_INCREMENTS } from "../../utils/timeHelpers";

const EVENT_TYPE_OPTIONS = [
  "Full Service",
  "Delivery",
  "Pickup",
  "Grazing Display / Interactive Station",
  "Tasting",
];

const EVENT_OCCASION_OPTIONS = [
  "Wedding",
  "Bar/Bat Mitzvah",
  "Corporate",
  "Social",
  "Birthday",
  "Other",
];

const SERVICE_STYLE_OPTIONS = [
  "Buffet",
  "Cocktail / Passed Apps Only",
  "Hybrid (Cocktail + Buffet)",
  "Family Style",
  "Plated",
];

export const EventCoreSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const isUpdatingRef = useRef(false);
  const [details, setDetails] = useState<EventCore>({
    eventType: "",
    eventOccasion: "",
    serviceStyle: "",
    eventDate: "",
    guestCount: null,
    dispatchTime: "",
    eventStartTime: "",
    eventEndTime: "",
    eventArrivalTime: "",
    opsExceptions: "",
  });

  useEffect(() => {
    if (isUpdatingRef.current) return;
    if (!selectedEventId || !selectedEventData) {
      setDetails({
        eventType: "",
        eventOccasion: "",
        serviceStyle: "",
        eventDate: "",
        guestCount: null,
        dispatchTime: "",
        eventStartTime: "",
        eventEndTime: "",
        eventArrivalTime: "",
        opsExceptions: "",
      });
      return;
    }

    setDetails({
      eventType: asSingleSelectName(selectedEventData[FIELD_IDS.EVENT_TYPE]),
      eventOccasion: asSingleSelectName(selectedEventData[FIELD_IDS.EVENT_OCCASION]),
      serviceStyle: asSingleSelectName(selectedEventData[FIELD_IDS.SERVICE_STYLE]),
      eventDate: asString(selectedEventData[FIELD_IDS.EVENT_DATE]),
      guestCount: selectedEventData[FIELD_IDS.GUEST_COUNT] !== undefined
        ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT])
        : null,
      dispatchTime: secondsToTimeString(selectedEventData[FIELD_IDS.DISPATCH_TIME]),
      eventStartTime: secondsToTimeString(selectedEventData[FIELD_IDS.EVENT_START_TIME]),
      eventEndTime: secondsToTimeString(selectedEventData[FIELD_IDS.EVENT_END_TIME]),
      eventArrivalTime: secondsToTimeString(selectedEventData[FIELD_IDS.FOODWERX_ARRIVAL]),
      opsExceptions: asString(selectedEventData[FIELD_IDS.OPS_EXCEPTIONS_SPECIAL_HANDLING]),
    });
  }, [selectedEventId, selectedEventData]);

  const canEdit = Boolean(selectedEventId);

  const handleTimeChange = (stateKey: keyof EventCore, timeValue: string) => {
    setDetails(prev => ({ ...prev, [stateKey]: timeValue }));
  };

  const handleTimeSelectChange = (stateKey: keyof EventCore, fieldId: string, hour: number, minute: number) => {
    const timeValue = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    setDetails(prev => ({ ...prev, [stateKey]: timeValue }));
    if (selectedEventId) {
      const seconds = hour * 3600 + minute * 60;
      setFields(selectedEventId, { [fieldId]: seconds });
    }
  };

  const saveField = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    isUpdatingRef.current = true;
    try {
      await setFields(selectedEventId, { [fieldId]: value });
    } finally {
      isUpdatingRef.current = false;
    }
  };

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
    <FormSection title="Event Details" icon="🎉">
      <div>
        <label style={labelStyle}>Event Date</label>
        <input
          type="date"
          value={details.eventDate}
          disabled={!canEdit}
          onChange={async (e) => {
            const value = e.target.value;
            setDetails(prev => ({ ...prev, eventDate: value }));
            if (selectedEventId) {
              await saveField(FIELD_IDS.EVENT_DATE, value || null);
            }
          }}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Guest Count</label>
        <input
          type="number"
          value={details.guestCount ?? ""}
          disabled={!canEdit}
          onChange={(e) => {
            const value = e.target.value === "" ? null : Number(e.target.value);
            setDetails(prev => ({ ...prev, guestCount: value }));
          }}
          onBlur={async (e) => {
            const value = e.target.value === "" ? null : Number(e.target.value);
            if (selectedEventId) {
              await saveField(FIELD_IDS.GUEST_COUNT, value);
            }
          }}
          style={inputStyle}
          placeholder="Number of guests"
          min="0"
        />
      </div>

      <div>
        <label style={labelStyle}>Event Type</label>
        <select
          value={details.eventType}
          disabled={!canEdit}
          onChange={async (e) => {
            const value = e.target.value;
            setDetails(prev => ({ ...prev, eventType: value }));
            if (selectedEventId) {
              await saveField(FIELD_IDS.EVENT_TYPE, value || null);
            }
          }}
          style={inputStyle}
        >
          <option value="">Select event type...</option>
          {EVENT_TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Event Occasion</label>
        <select
          value={details.eventOccasion}
          disabled={!canEdit}
          onChange={async (e) => {
            const value = e.target.value;
            setDetails(prev => ({ ...prev, eventOccasion: value }));
            if (selectedEventId) {
              await saveField(FIELD_IDS.EVENT_OCCASION, value || null);
            }
          }}
          style={inputStyle}
        >
          <option value="">Select occasion...</option>
          {EVENT_OCCASION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div style={{ fontSize: "11px", color: "#666", marginTop: "6px", lineHeight: 1.4 }}>
          Wedding & Bar/Bat Mitzvah show extra timeline prompts below.
        </div>
      </div>

      <div>
        <label style={labelStyle}>Service Style (kitchen banner)</label>
        <select
          value={details.serviceStyle}
          disabled={!canEdit}
          onChange={async (e) => {
            const value = e.target.value;
            setDetails(prev => ({ ...prev, serviceStyle: value }));
            if (selectedEventId) {
              await saveField(FIELD_IDS.SERVICE_STYLE, value || null);
            }
          }}
          style={inputStyle}
        >
          <option value="">Select style...</option>
          {SERVICE_STYLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div style={{ fontSize: "11px", color: "#666", marginTop: "6px", lineHeight: 1.4 }}>
          Buffet vs plated/cocktail/etc. When not buffet, a banner warns the kitchen. (Different from Food Service Flow in Site Visit—that one is for servers.)
        </div>
      </div>

      {(["dispatchTime", "eventStartTime", "eventEndTime", "eventArrivalTime"] as const).map((key) => {
        const fieldIdMap = {
          dispatchTime: FIELD_IDS.DISPATCH_TIME,
          eventStartTime: FIELD_IDS.EVENT_START_TIME,
          eventEndTime: FIELD_IDS.EVENT_END_TIME,
          eventArrivalTime: FIELD_IDS.FOODWERX_ARRIVAL,
        };
        const labelMap = {
          dispatchTime: "Dispatch Time",
          eventStartTime: "Event Start Time",
          eventEndTime: "Event End Time",
          eventArrivalTime: "Event Arrival Time",
        };
        const raw = details[key];
        const hasValue = raw && raw !== "—";
        const [h, m] = hasValue ? raw.split(":").map(Number) : [12, 0];
        const hour24 = isNaN(h) ? 12 : Math.max(0, Math.min(23, h));
        const minute = (() => {
          const mNum = isNaN(m) ? 0 : m;
          return MINUTE_INCREMENTS.reduce((prev, curr) =>
            Math.abs(curr - mNum) < Math.abs(prev - mNum) ? curr : prev
          );
        })();
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const isPM = hour24 >= 12;
        const handleHourChange = (newHour12: number, newIsPM: boolean) => {
          const newHour24 = newHour12 === 12 ? (newIsPM ? 12 : 0) : (newIsPM ? newHour12 + 12 : newHour12);
          handleTimeSelectChange(key, fieldIdMap[key], newHour24, minute);
        };
        const handleMinuteChange = (newMinute: number) => {
          handleTimeSelectChange(key, fieldIdMap[key], hour24, newMinute);
        };
        return (
          <div key={key}>
            <label style={labelStyle}>{labelMap[key]}</label>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={hour12}
                disabled={!canEdit}
                onChange={(e) => handleHourChange(Number(e.target.value), isPM)}
                style={{ ...inputStyle, flex: 1, minWidth: 70 }}
              >
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
              <span style={{ color: "#999", fontSize: 14 }}>:</span>
              <select
                value={minute}
                disabled={!canEdit}
                onChange={(e) => handleMinuteChange(Number(e.target.value))}
                style={{ ...inputStyle, flex: 1, minWidth: 70 }}
              >
                {MINUTE_INCREMENTS.map((m) => (
                  <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                ))}
              </select>
              <select
                value={isPM ? "PM" : "AM"}
                disabled={!canEdit}
                onChange={(e) => handleHourChange(hour12, e.target.value === "PM")}
                style={{ ...inputStyle, flex: 1, minWidth: 60 }}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        );
      })}

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Kitchen Notes / Ops Exceptions</label>
        <textarea
          rows={3}
          value={details.opsExceptions}
          disabled={!canEdit}
          onChange={(e) => setDetails(prev => ({ ...prev, opsExceptions: e.target.value }))}
          onBlur={async (e) => {
            if (selectedEventId) {
              await saveField(FIELD_IDS.OPS_EXCEPTIONS_SPECIAL_HANDLING, e.target.value);
            }
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
