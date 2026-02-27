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
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Determine if this is a delivery event
  const eventType = selectedEventData ? asSingleSelectName(selectedEventData[FIELD_IDS.EVENT_TYPE]) : "";
  const isDelivery = eventType === "Delivery";

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails({
        venue: "",
        venueAddress: "",
        venueCity: "",
        venueState: "",
        venueFullAddress: "",
      });
      setDeliveryNotes("");
      return;
    }

    const newDetails = {
      venue: asString(selectedEventData[FIELD_IDS.VENUE]),
      venueAddress: asString(selectedEventData[FIELD_IDS.VENUE_ADDRESS]),
      venueCity: asString(selectedEventData[FIELD_IDS.VENUE_CITY]),
      venueState: asSingleSelectName(selectedEventData[FIELD_IDS.VENUE_STATE]),
      venueFullAddress: asString(selectedEventData[FIELD_IDS.VENUE_FULL_ADDRESS]),
    };
    const newDeliveryNotes = asString(selectedEventData[FIELD_IDS.LOAD_IN_NOTES]);
    
    // Only update if the values are actually different to prevent cursor jumping
    setDetails(prev => {
      if (prev.venue === newDetails.venue &&
          prev.venueAddress === newDetails.venueAddress &&
          prev.venueCity === newDetails.venueCity &&
          prev.venueState === newDetails.venueState &&
          prev.venueFullAddress === newDetails.venueFullAddress) {
        return prev;
      }
      return newDetails;
    });
    
    setDeliveryNotes(prev => prev === newDeliveryNotes ? prev : newDeliveryNotes);
  }, [selectedEventId, selectedEventData]);

  const handleChange = <K extends keyof VenueDetails>(key: K, value: VenueDetails[K]) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const handleBlur = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
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
    <FormSection 
      title={isDelivery ? "Delivery Location" : "Venue"} 
      icon="📍"
    >
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>
          {isDelivery ? "Business / Location Name" : "Venue Name"}
        </label>
        <input
          type="text"
          value={details.venue}
          disabled={!canEdit}
          onChange={(e) => handleChange("venue", e.target.value)}
          onBlur={(e) => handleBlur(FIELD_IDS.VENUE, e.target.value)}
          autoComplete="off"
          style={inputStyle}
          placeholder={isDelivery ? "e.g. ABC Corporation" : "e.g. The Merion – Palazzo Room"}
        />
        <div style={{ fontSize: "10px", color: "#888", marginTop: "4px" }}>
          {isDelivery 
            ? "💡 Enter the business name if delivering to a company/organization"
            : "💡 Only fill this if the event is at a venue different from the client's residence"
          }
        </div>
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>
          {isDelivery ? "Delivery Address" : "Venue Address"}
        </label>
        <input
          type="text"
          value={details.venueAddress}
          disabled={!canEdit}
          onChange={(e) => handleChange("venueAddress", e.target.value)}
          onBlur={(e) => handleBlur(FIELD_IDS.VENUE_ADDRESS, e.target.value)}
          autoComplete="off"
          style={inputStyle}
          placeholder={isDelivery ? "e.g. 456 Business Blvd" : "e.g. 123 Main St"}
        />
      </div>

      <div>
        <label style={labelStyle}>City</label>
        <input
          type="text"
          value={details.venueCity}
          disabled={!canEdit}
          onChange={(e) => handleChange("venueCity", e.target.value)}
          onBlur={(e) => handleBlur(FIELD_IDS.VENUE_CITY, e.target.value)}
          autoComplete="off"
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
            handleBlur(FIELD_IDS.VENUE_STATE, e.target.value || null);
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

      {/* READ-ONLY: Full Address (Computed by Airtable) */}
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>
          Full Address (Auto-Computed) ⚙️
        </label>
        <input
          type="text"
          value={details.venueFullAddress}
          disabled={true}
          readOnly={true}
          style={{
            ...inputStyle,
            backgroundColor: "#2a2a2a",
            cursor: "not-allowed",
            color: "#888",
            fontStyle: "italic",
          }}
          placeholder="Auto-computed from venue or client address"
        />
        <div style={{ fontSize: "10px", color: "#666", marginTop: "4px" }}>
          ⚙️ This field is automatically computed by Airtable and cannot be edited
        </div>
      </div>

      {isDelivery && (
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Delivery Notes</label>
          <textarea
            rows={3}
            value={deliveryNotes}
            disabled={!canEdit}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            onBlur={() => handleBlur(FIELD_IDS.LOAD_IN_NOTES, deliveryNotes)}
            style={{
              ...inputStyle,
              resize: "vertical" as const,
              fontFamily: "inherit",
            }}
            placeholder="Loading dock, call upon arrival, leave at front desk, etc."
          />
        </div>
      )}
    </FormSection>
  );
};
