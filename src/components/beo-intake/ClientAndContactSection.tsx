import { useEffect, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString, asSingleSelectName } from "../../services/airtable/selectors";
import { isDeliveryOrPickup } from "../../lib/deliveryHelpers";
import { FormSection, Helper, inputStyle, labelStyle, textareaStyle } from "./FormSection";
import type { ClientDetails, PrimaryContact } from "./types";

export const ClientAndContactSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [client, setClient] = useState<ClientDetails & { businessName: string }>({
    clientFirstName: "",
    clientLastName: "",
    clientBusinessName: "",
    businessName: "",
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
  const [contactNotes, setContactNotes] = useState("");

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
      setContactNotes("");
      return;
    }

    const newClient = {
      clientFirstName: asString(selectedEventData[FIELD_IDS.CLIENT_FIRST_NAME]),
      clientLastName: asString(selectedEventData[FIELD_IDS.CLIENT_LAST_NAME]),
      clientBusinessName: asString(selectedEventData[FIELD_IDS.CLIENT_BUSINESS_NAME]),
      businessName: asString(selectedEventData[FIELD_IDS.BUSINESS_NAME]),
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
    const newContactNotes = asString(selectedEventData[FIELD_IDS.SPECIAL_NOTES]);

    setClient((prev) => {
      if (
        prev.clientFirstName === newClient.clientFirstName &&
        prev.clientLastName === newClient.clientLastName &&
        prev.clientBusinessName === newClient.clientBusinessName &&
        prev.businessName === newClient.businessName &&
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
    setContactNotes((prev) => (prev === newContactNotes ? prev : newContactNotes));
  }, [selectedEventId, selectedEventData]);

  const handleBlur = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const canEdit = Boolean(selectedEventId);
  const eventType = selectedEventData ? asSingleSelectName(selectedEventData[FIELD_IDS.EVENT_TYPE]) : "";
  const isDelivery = isDeliveryOrPickup(eventType);

  return (
    <FormSection title="Client & Day-of Contact" isDelivery={isDelivery}>
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

      {isDelivery && (
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Business Name</label>
          <input
            type="text"
            value={client.businessName}
            disabled={!canEdit}
            onChange={(e) => setClient((p) => ({ ...p, businessName: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.BUSINESS_NAME, e.target.value)}
            style={inputStyle}
            placeholder="e.g. ABC Corporation"
          />
          <Helper>For delivery to a business: company or location name. Leave blank for delivery to client residence.</Helper>
        </div>
      )}

      <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label style={labelStyle}>Street</label>
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
          <label style={labelStyle}>City</label>
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
      </div>
      <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <div>
          <label style={labelStyle}>State</label>
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
          <label style={labelStyle}>ZIP</label>
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
        <div>
          <label style={labelStyle}>Email</label>
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
      </div>

      {/* Primary contact (day-of) */}
      <div style={{ marginTop: "40px", gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
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
          <Helper>Person on-site day-of (planner, venue manager, client rep). Used for BEO and day-of contact.</Helper>
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
      </div>

      <div style={{ gridColumn: "1 / -1", marginTop: "16px" }}>
        <label style={labelStyle}>Notes</label>
        <textarea
          value={contactNotes}
          disabled={!canEdit}
          onChange={(e) => setContactNotes(e.target.value)}
          onBlur={(e) => handleBlur(FIELD_IDS.SPECIAL_NOTES, e.target.value)}
          style={textareaStyle}
          placeholder="e.g. call contact upon arrival; surprise party — call contact not client"
          rows={3}
        />
        <Helper>e.g. call contact upon arrival; surprise party — call contact not client</Helper>
      </div>
    </FormSection>
  );
};
