import { useEffect, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asSingleSelectName, asString } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";
import type { PrimaryContact } from "./types";

const ROLE_OPTIONS = ["Planner", "Venue Manager", "Mother of Bride", "Father of Groom", "Client Rep", "Other"];

export const PrimaryContactSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<PrimaryContact>({ primaryContactName: "", primaryContactPhone: "", primaryContactRole: "" });

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails({ primaryContactName: "", primaryContactPhone: "", primaryContactRole: "" });
      return;
    }
    setDetails({
      primaryContactName: asString(selectedEventData[FIELD_IDS.PRIMARY_CONTACT_NAME]),
      primaryContactPhone: asString(selectedEventData[FIELD_IDS.PRIMARY_CONTACT_PHONE]),
      primaryContactRole: asSingleSelectName(selectedEventData[FIELD_IDS.PRIMARY_CONTACT_ROLE]),
    });
  }, [selectedEventId, selectedEventData]);

  const handleFieldChange = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const handleChange = <K extends keyof PrimaryContact>(key: K, value: PrimaryContact[K]) => {
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
    <FormSection title="Primary Contact (Optional)" icon="☎️">
      <div>
        <label style={labelStyle}>Primary Contact Name</label>
        <input type="text" value={details.primaryContactName} disabled={!canEdit} onChange={(e) => { handleChange("primaryContactName", e.target.value); handleFieldChange(FIELD_IDS.PRIMARY_CONTACT_NAME, e.target.value); }} style={inputStyle} placeholder="Contact person name" />
      </div>
      <div>
        <label style={labelStyle}>Primary Contact Phone</label>
        <input type="tel" value={details.primaryContactPhone} disabled={!canEdit} onChange={(e) => { handleChange("primaryContactPhone", e.target.value); handleFieldChange(FIELD_IDS.PRIMARY_CONTACT_PHONE, e.target.value); }} style={inputStyle} placeholder="(555) 555-5555" />
      </div>
      <div>
        <label style={labelStyle}>Primary Contact Role</label>
        <select value={details.primaryContactRole} disabled={!canEdit} onChange={(e) => { handleChange("primaryContactRole", e.target.value); handleFieldChange(FIELD_IDS.PRIMARY_CONTACT_ROLE, e.target.value || null); }} style={inputStyle}>
          <option value="">Select role</option>
          {ROLE_OPTIONS.map((role) => (<option key={role} value={role}>{role}</option>))}
        </select>
      </div>
    </FormSection>
  );
};
