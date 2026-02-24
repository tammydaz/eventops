import { useEffect, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";
import type { ClientDetails } from "./types";

export const ClientDetailsSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<ClientDetails>({
    clientFirstName: "",
    clientLastName: "",
    clientBusinessName: "",
    clientEmail: "",
    clientPhone: "",
  });

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails({
        clientFirstName: "",
        clientLastName: "",
        clientBusinessName: "",
        clientEmail: "",
        clientPhone: "",
      });
      return;
    }

    const newDetails = {
      clientFirstName: asString(selectedEventData[FIELD_IDS.CLIENT_FIRST_NAME]),
      clientLastName: asString(selectedEventData[FIELD_IDS.CLIENT_LAST_NAME]),
      clientBusinessName: asString(selectedEventData[FIELD_IDS.CLIENT_BUSINESS_NAME]),
      clientEmail: asString(selectedEventData[FIELD_IDS.CLIENT_EMAIL]),
      clientPhone: asString(selectedEventData[FIELD_IDS.CLIENT_PHONE]),
    };
    
    // Only update if the values are actually different to prevent cursor jumping
    setDetails(prev => {
      if (prev.clientFirstName === newDetails.clientFirstName &&
          prev.clientLastName === newDetails.clientLastName &&
          prev.clientBusinessName === newDetails.clientBusinessName &&
          prev.clientEmail === newDetails.clientEmail &&
          prev.clientPhone === newDetails.clientPhone) {
        return prev;
      }
      return newDetails;
    });
  }, [selectedEventId, selectedEventData]);

  const handleChange = <K extends keyof ClientDetails>(key: K, value: ClientDetails[K]) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const handleBlur = async (fieldId: string, value: string) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const canEdit = Boolean(selectedEventId);

  return (
    <FormSection title="Client Information" icon="👤">
      <div>
        <label style={{ display: "block", fontSize: "11px", color: "#999", marginBottom: "6px", fontWeight: "600" }}>
          Client First Name *
        </label>
        <input
          type="text"
          value={details.clientFirstName}
          disabled={!canEdit}
          onChange={(e) => handleChange("clientFirstName", e.target.value)}
          onBlur={(e) => handleBlur(FIELD_IDS.CLIENT_FIRST_NAME, e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #444",
            backgroundColor: "#1a1a1a",
            color: "#e0e0e0",
            fontSize: "14px",
          }}
          placeholder="e.g. John"
        />
      </div>

      <div>
        <label style={{ display: "block", fontSize: "11px", color: "#999", marginBottom: "6px", fontWeight: "600" }}>
          Client Last Name *
        </label>
        <input
          type="text"
          value={details.clientLastName}
          disabled={!canEdit}
          onChange={(e) => handleChange("clientLastName", e.target.value)}
          onBlur={(e) => handleBlur(FIELD_IDS.CLIENT_LAST_NAME, e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #444",
            backgroundColor: "#1a1a1a",
            color: "#e0e0e0",
            fontSize: "14px",
          }}
          placeholder="e.g. Smith"
        />
      </div>

      <div>
        <label style={{ display: "block", fontSize: "11px", color: "#999", marginBottom: "6px", fontWeight: "600" }}>
          Client Phone *
        </label>
        <input
          type="tel"
          value={details.clientPhone}
          disabled={!canEdit}
          onChange={(e) => handleChange("clientPhone", e.target.value)}
          onBlur={(e) => handleBlur(FIELD_IDS.CLIENT_PHONE, e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #444",
            backgroundColor: "#1a1a1a",
            color: "#e0e0e0",
            fontSize: "14px",
          }}
          placeholder="e.g. (555) 123-4567"
        />
      </div>

      <div>
        <label style={{ display: "block", fontSize: "11px", color: "#999", marginBottom: "6px", fontWeight: "600" }}>
          Client Email
        </label>
        <input
          type="email"
          value={details.clientEmail}
          disabled={!canEdit}
          onChange={(e) => handleChange("clientEmail", e.target.value)}
          onBlur={(e) => handleBlur(FIELD_IDS.CLIENT_EMAIL, e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #444",
            backgroundColor: "#1a1a1a",
            color: "#e0e0e0",
            fontSize: "14px",
          }}
          placeholder="client@example.com"
        />
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={{ display: "block", fontSize: "11px", color: "#999", marginBottom: "6px", fontWeight: "600" }}>
          Client Business Name (Auto-Generated)
        </label>
        <input
          type="text"
          value={details.clientBusinessName}
          disabled
          readOnly
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #333",
            backgroundColor: "#0f0f0f",
            color: "#666",
            fontSize: "14px",
            cursor: "not-allowed",
          }}
          placeholder="Computed from client name"
        />
      </div>
    </FormSection>
  );
};
