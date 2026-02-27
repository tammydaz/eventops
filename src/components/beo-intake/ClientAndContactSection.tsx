import { useEffect, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS, loadSingleSelectOptions, type SingleSelectOption } from "../../services/airtable/events";
import { asString, asSingleSelectName } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";
import type { ClientDetails, PrimaryContact } from "./types";

const ROLE_OPTIONS_FALLBACK = ["Planner", "Venue Manager", "Mother of Bride", "Father of Groom", "Client Rep", "Other"];

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
  display: "block" as const,
  fontSize: "11px",
  color: "#999",
  marginBottom: "6px",
  fontWeight: "600" as const,
};

export const ClientAndContactSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [roleOptions, setRoleOptions] = useState<string[]>(ROLE_OPTIONS_FALLBACK);
  const [client, setClient] = useState<ClientDetails>({
    clientFirstName: "",
    clientLastName: "",
    clientBusinessName: "",
    clientEmail: "",
    clientPhone: "",
    clientStreet: "",
    clientCity: "",
    clientState: "",
    clientZip: "",
  });
  const [contact, setContact] = useState<PrimaryContact>({
    primaryContactName: "",
    primaryContactPhone: "",
    primaryContactRole: "",
  });

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setClient({
        clientFirstName: "",
        clientLastName: "",
        clientBusinessName: "",
        clientEmail: "",
        clientPhone: "",
        clientStreet: "",
        clientCity: "",
        clientState: "",
        clientZip: "",
      });
      setContact({ primaryContactName: "", primaryContactPhone: "", primaryContactRole: "" });
      return;
    }

    const newClient = {
      clientFirstName: asString(selectedEventData[FIELD_IDS.CLIENT_FIRST_NAME]),
      clientLastName: asString(selectedEventData[FIELD_IDS.CLIENT_LAST_NAME]),
      clientBusinessName: asString(selectedEventData[FIELD_IDS.CLIENT_BUSINESS_NAME]),
      clientEmail: asString(selectedEventData[FIELD_IDS.CLIENT_EMAIL]),
      clientPhone: asString(selectedEventData[FIELD_IDS.CLIENT_PHONE]),
      clientStreet: asString(selectedEventData[FIELD_IDS.CLIENT_STREET]),
      clientCity: asString(selectedEventData[FIELD_IDS.CLIENT_CITY]),
      clientState: asString(selectedEventData[FIELD_IDS.CLIENT_STATE]),
      clientZip: asString(selectedEventData[FIELD_IDS.CLIENT_ZIP]),
    };
    const newContact = {
      primaryContactName: asString(selectedEventData[FIELD_IDS.PRIMARY_CONTACT_NAME]),
      primaryContactPhone: asString(selectedEventData[FIELD_IDS.PRIMARY_CONTACT_PHONE]),
      primaryContactRole: asSingleSelectName(selectedEventData[FIELD_IDS.PRIMARY_CONTACT_ROLE]),
    };

    setClient((prev) => {
      if (
        prev.clientFirstName === newClient.clientFirstName &&
        prev.clientLastName === newClient.clientLastName &&
        prev.clientBusinessName === newClient.clientBusinessName &&
        prev.clientEmail === newClient.clientEmail &&
        prev.clientPhone === newClient.clientPhone &&
        prev.clientStreet === newClient.clientStreet &&
        prev.clientCity === newClient.clientCity &&
        prev.clientState === newClient.clientState &&
        prev.clientZip === newClient.clientZip
      ) {
        return prev;
      }
      return newClient;
    });
    setContact((prev) => {
      if (
        prev.primaryContactName === newContact.primaryContactName &&
        prev.primaryContactPhone === newContact.primaryContactPhone &&
        prev.primaryContactRole === newContact.primaryContactRole
      ) {
        return prev;
      }
      return newContact;
    });
  }, [selectedEventId, selectedEventData]);

  useEffect(() => {
    let cancelled = false;
    loadSingleSelectOptions([FIELD_IDS.PRIMARY_CONTACT_ROLE]).then((result) => {
      if (cancelled || "error" in result) return;
      const opts = (result[FIELD_IDS.PRIMARY_CONTACT_ROLE] ?? []).map((o: SingleSelectOption) => o.name);
      if (opts.length > 0) setRoleOptions(opts);
    });
    return () => { cancelled = true; };
  }, []);

  const handleBlur = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const canEdit = Boolean(selectedEventId);
  const eventType = selectedEventData ? asSingleSelectName(selectedEventData[FIELD_IDS.EVENT_TYPE]) : "";
  const isDelivery = eventType === "Delivery";

  return (
    <FormSection title="Client & Day-of Contact" icon="👤">
      {/* Client info */}
      <div>
        <label style={labelStyle}>Client First Name *</label>
        <input
          type="text"
          value={client.clientFirstName}
          disabled={!canEdit}
          onChange={(e) => setClient((p) => ({ ...p, clientFirstName: e.target.value }))}
          onBlur={(e) => handleBlur(FIELD_IDS.CLIENT_FIRST_NAME, e.target.value)}
          style={inputStyle}
          placeholder="e.g. John"
        />
      </div>
      <div>
        <label style={labelStyle}>Client Last Name *</label>
        <input
          type="text"
          value={client.clientLastName}
          disabled={!canEdit}
          onChange={(e) => setClient((p) => ({ ...p, clientLastName: e.target.value }))}
          onBlur={(e) => handleBlur(FIELD_IDS.CLIENT_LAST_NAME, e.target.value)}
          style={inputStyle}
          placeholder="e.g. Smith"
        />
      </div>
      <div>
        <label style={labelStyle}>Client Phone *</label>
        <input
          type="tel"
          value={client.clientPhone}
          disabled={!canEdit}
          onChange={(e) => setClient((p) => ({ ...p, clientPhone: e.target.value }))}
          onBlur={(e) => handleBlur(FIELD_IDS.CLIENT_PHONE, e.target.value)}
          style={inputStyle}
          placeholder="e.g. (555) 123-4567"
        />
      </div>
      <div>
        <label style={labelStyle}>Client Email</label>
        <input
          type="email"
          value={client.clientEmail}
          disabled={!canEdit}
          onChange={(e) => setClient((p) => ({ ...p, clientEmail: e.target.value }))}
          onBlur={(e) => handleBlur(FIELD_IDS.CLIENT_EMAIL, e.target.value)}
          style={inputStyle}
          placeholder="client@example.com"
        />
      </div>

      {/* Primary contact (day-of) */}
      <div>
        <label style={labelStyle}>Primary Contact Name (day-of)</label>
        <input
          type="text"
          value={contact.primaryContactName}
          disabled={!canEdit}
          onChange={(e) => setContact((p) => ({ ...p, primaryContactName: e.target.value }))}
          onBlur={(e) => handleBlur(FIELD_IDS.PRIMARY_CONTACT_NAME, e.target.value)}
          style={inputStyle}
          placeholder="Contact person name"
        />
      </div>
      <div>
        <label style={labelStyle}>Primary Contact Phone</label>
        <input
          type="tel"
          value={contact.primaryContactPhone}
          disabled={!canEdit}
          onChange={(e) => setContact((p) => ({ ...p, primaryContactPhone: e.target.value }))}
          onBlur={(e) => handleBlur(FIELD_IDS.PRIMARY_CONTACT_PHONE, e.target.value)}
          style={inputStyle}
          placeholder="(555) 555-5555"
        />
      </div>
      <div>
        <label style={labelStyle}>Primary Contact Role</label>
        <select
          value={contact.primaryContactRole}
          disabled={!canEdit}
          onChange={(e) => {
            const v = e.target.value;
            setContact((p) => ({ ...p, primaryContactRole: v }));
            handleBlur(FIELD_IDS.PRIMARY_CONTACT_ROLE, v || null);
          }}
          style={inputStyle}
        >
          <option value="">Select role</option>
          {[...new Set([...roleOptions, contact.primaryContactRole].filter(Boolean))].map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {isDelivery && (
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Client Business Name (Auto-Generated)</label>
          <input
            type="text"
            value={client.clientBusinessName}
            disabled
            readOnly
            style={{
              ...inputStyle,
              backgroundColor: "#0f0f0f",
              color: "#666",
              cursor: "not-allowed",
              border: "1px solid #333",
            }}
            placeholder="Computed from client name"
          />
        </div>
      )}

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Client Street</label>
        <input
          type="text"
          value={client.clientStreet}
          disabled={!canEdit}
          onChange={(e) => setClient((p) => ({ ...p, clientStreet: e.target.value }))}
          onBlur={(e) => handleBlur(FIELD_IDS.CLIENT_STREET, e.target.value)}
          style={inputStyle}
          placeholder="e.g. 123 Main St"
        />
      </div>
      <div>
        <label style={labelStyle}>Client City</label>
        <input
          type="text"
          value={client.clientCity}
          disabled={!canEdit}
          onChange={(e) => setClient((p) => ({ ...p, clientCity: e.target.value }))}
          onBlur={(e) => handleBlur(FIELD_IDS.CLIENT_CITY, e.target.value)}
          style={inputStyle}
          placeholder="City"
        />
      </div>
      <div>
        <label style={labelStyle}>Client State</label>
        <input
          type="text"
          value={client.clientState}
          disabled={!canEdit}
          onChange={(e) => setClient((p) => ({ ...p, clientState: e.target.value }))}
          onBlur={(e) => handleBlur(FIELD_IDS.CLIENT_STATE, e.target.value)}
          style={inputStyle}
          placeholder="e.g. NJ"
        />
      </div>
      <div>
        <label style={labelStyle}>Client ZIP</label>
        <input
          type="text"
          value={client.clientZip}
          disabled={!canEdit}
          onChange={(e) => setClient((p) => ({ ...p, clientZip: e.target.value }))}
          onBlur={(e) => handleBlur(FIELD_IDS.CLIENT_ZIP, e.target.value)}
          style={inputStyle}
          placeholder="e.g. 08001"
        />
      </div>

      <div style={{ gridColumn: "1 / -1", fontSize: "10px", color: "#666", marginTop: "-8px" }}>
        Client address used when venue is blank; venue address takes precedence for event location.
      </div>
    </FormSection>
  );
};
