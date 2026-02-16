import { useEffect, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asSingleSelectName, asString } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";
import type { EventCore } from "./types";

const EVENT_TYPE_OPTIONS = [
  "Full Service",
  "Delivery",
  "Pickup",
  "Grazing Display / Interactive Station",
  "Tasting",
];

const SERVICE_STYLE_OPTIONS = [
  "Buffet",
  "Cocktail / Passed Apps Only",
  "Plated Meal",
  "Hybrid (Cocktail + Buffet)",
  "Displays Only (Grazing)",
  "Family Style",
  "Plated",
  "Grazing",
];

export const EventCoreSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<EventCore>({
    eventType: "",
    serviceStyle: "",
    eventDate: "",
    guestCount: null,
  });

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails({
        eventType: "",
        serviceStyle: "",
        eventDate: "",
        guestCount: null,
      });
      return;
    }

    setDetails({
      eventType: asSingleSelectName(selectedEventData[FIELD_IDS.EVENT_TYPE]),
      serviceStyle: asSingleSelectName(selectedEventData[FIELD_IDS.SERVICE_STYLE]),
      eventDate: asString(selectedEventData[FIELD_IDS.EVENT_DATE]),
      guestCount: selectedEventData[FIELD_IDS.GUEST_COUNT] !== undefined
        ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT])
        : null,
    });
  }, [selectedEventId, selectedEventData]);

  const handleFieldChange = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const handleChange = <K extends keyof EventCore>(key: K, value: EventCore[K]) => {
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
    <FormSection title="Event Details (Optional)" icon="🎉">
      <div>
        <label style={labelStyle}>Event Date</label>
        <input
          type="date"
          value={details.eventDate}
          disabled={!canEdit}
          onChange={(e) => {
            handleChange("eventDate", e.target.value);
            handleFieldChange(FIELD_IDS.EVENT_DATE, e.target.value || null);
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
            handleChange("guestCount", value);
            handleFieldChange(FIELD_IDS.GUEST_COUNT, value);
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
          onChange={(e) => {
            handleChange("eventType", e.target.value);
            handleFieldChange(FIELD_IDS.EVENT_TYPE, e.target.value || null);
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
        <label style={labelStyle}>Service Style</label>
        <select
          value={details.serviceStyle}
          disabled={!canEdit}
          onChange={(e) => {
            handleChange("serviceStyle", e.target.value);
            handleFieldChange(FIELD_IDS.SERVICE_STYLE, e.target.value || null);
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
      </div>
    </FormSection>
  );
};
