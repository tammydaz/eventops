import { useEffect, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";

export const DietaryNotesSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState({ dietaryNotes: "", specialNotes: "" });

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails({ dietaryNotes: "", specialNotes: "" });
      return;
    }
    setDetails({
      dietaryNotes: asString(selectedEventData[FIELD_IDS.DIETARY_NOTES]),
      specialNotes: asString(selectedEventData[FIELD_IDS.SPECIAL_NOTES]),
    });
  }, [selectedEventId, selectedEventData]);

  const handleFieldChange = async (fieldId: string, value: unknown) => {
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
    resize: "vertical" as const,
    fontFamily: "inherit",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    color: "#999",
    marginBottom: "6px",
    fontWeight: "600",
  };

  return (
    <FormSection title="Dietary & Special Notes (Optional)" icon="⚠️">
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Dietary Notes</label>
        <textarea rows={4} value={details.dietaryNotes} disabled={!canEdit} onChange={(e) => { setDetails(p => ({ ...p, dietaryNotes: e.target.value })); handleFieldChange(FIELD_IDS.DIETARY_NOTES, e.target.value); }} style={inputStyle} placeholder="Allergies, dietary restrictions, special requirements..." />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Special Notes</label>
        <textarea rows={4} value={details.specialNotes} disabled={!canEdit} onChange={(e) => { setDetails(p => ({ ...p, specialNotes: e.target.value })); handleFieldChange(FIELD_IDS.SPECIAL_NOTES, e.target.value); }} style={inputStyle} placeholder="Any other special notes or considerations..." />
      </div>
    </FormSection>
  );
};
