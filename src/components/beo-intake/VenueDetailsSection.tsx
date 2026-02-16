import { useEffect, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asSingleSelectName, asString } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";
import type { VenueDetails } from "./types";

const VENUE_STATE_OPTIONS = ["NJ", "PA", "DE", "NY"];

export const VenueDetailsSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<VenueDetails>({
    venue: "",
    venueAddress: "",
    venueCity: "",
    venueState: "",
    venueFullAddress: "",
  });

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails({
        venue: "",
        venueAddress: "",
        venueCity: "",
        venueState: "",
        venueFullAddress: "",
      });
      return;
    }

    setDetails({
      venue: asString(selectedEventData[FIELD_IDS.VENUE]),
      venueAddress: asString(selectedEventData[FIELD_IDS.VENUE_ADDRESS]),
      venueCity: asString(selectedEventData[FIELD_IDS.VENUE_CITY]),
      venueState: asSingleSelectName(selectedEventData[FIELD_IDS.VENUE_STATE]),
      venueFullAddress: asString(selectedEventData[FIELD_IDS.VENUE_FULL_ADDRESS]),
    });
  }, [selectedEventId, selectedEventData]);

  const handleFieldChange = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const handleChange = <K extends keyof VenueDetails>(key: K, value: VenueDetails[K]) => {
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
    <FormSection title="Venue (Optional)" icon="📍">
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Venue Name</label>
        <input
          type="text"
          value={details.venue}
          disabled={!canEdit}
          onChange={(e) => {
            handleChange("venue", e.target.value);
            handleFieldChange(FIELD_IDS.VENUE, e.target.value);
          }}
          style={inputStyle}
          placeholder="e.g. The Grand Ballroom"
        />
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Venue Address</label>
        <input
          type="text"
          value={details.venueAddress}
          disabled={!canEdit}
          onChange={(e) => {
            handleChange("venueAddress", e.target.value);
            handleFieldChange(FIELD_IDS.VENUE_ADDRESS, e.target.value);
          }}
          style={inputStyle}
          placeholder="e.g. 123 Main St"
        />
      </div>

      <div>
        <label style={labelStyle}>City</label>
        <input
          type="text"
          value={details.venueCity}
          disabled={!canEdit}
          onChange={(e) => {
            handleChange("venueCity", e.target.value);
            handleFieldChange(FIELD_IDS.VENUE_CITY, e.target.value);
          }}
          style={inputStyle}
          placeholder="City"
        />
      </div>

      <div>
        <label style={labelStyle}>State</label>
        <select
          value={details.venueState}
          disabled={!canEdit}
          onChange={(e) => {
            handleChange("venueState", e.target.value);
            handleFieldChange(FIELD_IDS.VENUE_STATE, e.target.value || null);
          }}
          style={inputStyle}
        >
          <option value="">Select state</option>
          {VENUE_STATE_OPTIONS.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Full Address (Auto-Generated)</label>
        <input
          type="text"
          value={details.venueFullAddress}
          disabled
          readOnly
          style={{
            ...inputStyle,
            backgroundColor: "#0f0f0f",
            color: "#666",
            cursor: "not-allowed",
            border: "1px solid #333",
          }}
          placeholder="Computed from address fields"
        />
      </div>
    </FormSection>
  );
};
