import { useEffect, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";
import type { Logistics } from "./types";

export const LogisticsSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<Logistics>({
    parkingAccess: "",
    parkingNotes: "",
  });

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails({
        parkingAccess: "",
        parkingNotes: "",
      });
      return;
    }

    const newDetails = {
      parkingAccess: asString(selectedEventData[FIELD_IDS.PARKING_ACCESS]),
      parkingNotes: asString(selectedEventData[FIELD_IDS.PARKING_NOTES]),
    };
    
    // Only update if the values are actually different to prevent cursor jumping
    setDetails(prev => {
      if (prev.parkingAccess === newDetails.parkingAccess &&
          prev.parkingNotes === newDetails.parkingNotes) {
        return prev;
      }
      return newDetails;
    });
  }, [selectedEventId, selectedEventData]);

  const handleChange = <K extends keyof Logistics>(key: K, value: Logistics[K]) => {
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
    <FormSection title="Logistics & Access" icon="🚚">
      <div>
        <label style={labelStyle}>Parking Access</label>
        <input
          type="text"
          value={details.parkingAccess}
          disabled={!canEdit}
          onChange={(e) => handleChange("parkingAccess", e.target.value)}
          onBlur={(e) => handleBlur(FIELD_IDS.PARKING_ACCESS, e.target.value)}
          style={inputStyle}
          placeholder="Describe parking situation"
        />
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Parking / Load-In / Kitchen Access Notes</label>
        <textarea
          rows={4}
          value={details.parkingNotes}
          disabled={!canEdit}
          onChange={(e) => handleChange("parkingNotes", e.target.value)}
          onBlur={(e) => handleBlur(FIELD_IDS.PARKING_NOTES, e.target.value)}
          style={{
            ...inputStyle,
            resize: "vertical",
            fontFamily: "inherit",
          }}
          placeholder="Loading dock details, kitchen access, parking restrictions, etc..."
        />
      </div>
    </FormSection>
  );
};
