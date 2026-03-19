import { useEffect, useMemo, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asSingleSelectName, asString } from "../../services/airtable/selectors";
import { isDeliveryOrPickup } from "../../lib/deliveryHelpers";
import { FormSection, inputStyle, labelStyle, textareaStyle } from "./FormSection";
import type { VenueDetails } from "./types";

const VENUE_STATE_OPTIONS = ["NJ", "PA", "DE", "NY"];

const pillBase: React.CSSProperties = {
  padding: "4px 14px",
  borderRadius: 20,
  border: "1px solid #444",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s",
};
const pillActive: React.CSSProperties = { ...pillBase, background: "#2563eb", borderColor: "#2563eb", color: "#fff" };
const pillInactive: React.CSSProperties = { ...pillBase, background: "transparent", color: "#777" };

type VenueMode = "same_as_client" | "add_venue";

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
  const [venueMode, setVenueMode] = useState<VenueMode>("same_as_client");

  const eventType = selectedEventData ? asSingleSelectName(selectedEventData[FIELD_IDS.EVENT_TYPE]) : "";
  const isDelivery = isDeliveryOrPickup(eventType);

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
    const hasVenueData = !!(newDetails.venue?.trim() || newDetails.venueAddress?.trim() || newDetails.venueCity?.trim());
    setVenueMode(hasVenueData ? "add_venue" : "same_as_client");
  }, [selectedEventId, selectedEventData]);

  const handleChange = <K extends keyof VenueDetails>(key: K, value: VenueDetails[K]) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const handleBlur = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const canEdit = Boolean(selectedEventId);

  const venueSummary = useMemo(() => {
    const parts = [details.venue, details.venueCity].filter(Boolean);
    return parts.length ? parts.join("  ·  ") : undefined;
  }, [details.venue, details.venueCity]);

  // Copy client address into venue (event location). BEO shows venue when set; otherwise client.
  const clientStreet = selectedEventData ? asString(selectedEventData[FIELD_IDS.CLIENT_STREET]) : "";
  const clientCity = selectedEventData ? asString(selectedEventData[FIELD_IDS.CLIENT_CITY]) : "";
  const clientState = selectedEventData ? asString(selectedEventData[FIELD_IDS.CLIENT_STATE]) : "";
  const clientZip = selectedEventData ? asString(selectedEventData[FIELD_IDS.CLIENT_ZIP]) : "";
  const hasClientAddress = !!(clientStreet?.trim() || clientCity?.trim() || clientState?.trim() || clientZip?.trim());

  const copyFromClientAddress = async () => {
    if (!selectedEventId) return;
    setVenueMode("same_as_client");
    const updates: Record<string, string> = {
      [FIELD_IDS.VENUE_ADDRESS]: clientStreet?.trim() ?? "",
      [FIELD_IDS.VENUE_CITY]: clientCity?.trim() ?? "",
      [FIELD_IDS.VENUE_STATE]: clientState?.trim() ?? "",
      [FIELD_IDS.VENUE_ZIP]: clientZip?.trim() ?? "",
    };
    if (!details.venue?.trim()) {
      updates[FIELD_IDS.VENUE] = "Residence";
    }
    await setFields(selectedEventId, updates);
    setDetails((prev) => ({
      ...prev,
      venueAddress: updates[FIELD_IDS.VENUE_ADDRESS],
      venueCity: updates[FIELD_IDS.VENUE_CITY],
      venueState: updates[FIELD_IDS.VENUE_STATE],
      venue: updates[FIELD_IDS.VENUE] ?? prev.venue,
    }));
  };

  return (
    <FormSection 
      title={isDelivery ? "Delivery Location" : "Event location"} 
      subtitle={venueSummary ?? (venueMode === "same_as_client" ? "Same as client address" : "Where the event is taking place — shows on BEO")}
      sectionId="beo-section-venue"
      isDelivery={isDelivery}
    >
      {/* Pills: Same as client | Add venue — venue fields drop down only when Add venue */}
      <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid #222" }}>
        <button
          type="button"
          style={venueMode === "same_as_client" ? pillActive : pillInactive}
          onClick={async () => {
            setVenueMode("same_as_client");
            if (hasClientAddress) await copyFromClientAddress();
          }}
        >
          Same as client
        </button>
        <button
          type="button"
          style={venueMode === "add_venue" ? pillActive : pillInactive}
          onClick={() => setVenueMode("add_venue")}
        >
          Add venue
        </button>
      </div>

      {venueMode === "same_as_client" && (
        <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
          Event location on the BEO will use the client address.
          {hasClientAddress && (
            <button
              type="button"
              onClick={copyFromClientAddress}
              style={{
                marginLeft: 10,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 6,
                border: "1px solid rgba(0,188,212,0.5)",
                background: "rgba(0,188,212,0.12)",
                color: "#00bcd4",
                cursor: "pointer",
              }}
            >
              Copy from client now
            </button>
          )}
        </div>
      )}

      {venueMode === "add_venue" && (
      <>
      <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: 8 }}>
        <div>
          <label style={labelStyle}>
            {isDelivery ? "Business / Location Name" : "Venue name"}
          </label>
          <input
            type="text"
            value={details.venue}
            disabled={!canEdit}
            onChange={(e) => handleChange("venue", e.target.value)}
            onBlur={(e) => handleBlur(FIELD_IDS.VENUE, e.target.value)}
            autoComplete="off"
            style={inputStyle}
            placeholder={isDelivery ? "e.g. ABC Corporation or The Merion" : "e.g. The Merion – Palazzo Room"}
          />
        </div>
        <div>
          <label style={labelStyle}>Address</label>
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
      </div>

      <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
      </div>

      {isDelivery && (
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Delivery Notes</label>
          <textarea
            rows={2}
            value={deliveryNotes}
            disabled={!canEdit}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            onBlur={() => handleBlur(FIELD_IDS.LOAD_IN_NOTES, deliveryNotes)}
            style={textareaStyle}
            placeholder="Loading dock, call on arrival, etc."
          />
        </div>
      )}
      </>
      )}
    </FormSection>
  );
};
