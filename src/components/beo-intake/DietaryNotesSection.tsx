import { useEffect, useState, useRef } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString } from "../../services/airtable/selectors";
import { FormSection, labelStyle, textareaStyle } from "./FormSection";

export const DietaryNotesSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState({ 
    dietaryNotes: "", 
    specialNotes: "", 
    beoNotes: "", 
  });
  const lastEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only update when event ID changes, not on every data update
    if (selectedEventId !== lastEventIdRef.current) {
      lastEventIdRef.current = selectedEventId;
      
      if (!selectedEventId || !selectedEventData) {
        setDetails({ dietaryNotes: "", specialNotes: "", beoNotes: "" });
        return;
      }
      
      setDetails({
        dietaryNotes: asString(selectedEventData[FIELD_IDS.DIETARY_NOTES]),
        specialNotes: asString(selectedEventData[FIELD_IDS.SPECIAL_NOTES]),
        beoNotes: asString(selectedEventData[FIELD_IDS.BEO_NOTES]),
      });
    }
  }, [selectedEventId, selectedEventData]);

  const handleBlur = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const canEdit = Boolean(selectedEventId);

  return (
    <FormSection title="Notes" dotColor="#00bcd4">
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Dietary Notes</label>
        <textarea 
          rows={4} 
          value={details.dietaryNotes} 
          disabled={!canEdit} 
          onChange={(e) => setDetails(p => ({ ...p, dietaryNotes: e.target.value }))} 
          onBlur={(e) => handleBlur(FIELD_IDS.DIETARY_NOTES, e.target.value)}
          style={textareaStyle} 
          placeholder="Allergies, dietary restrictions, special requirements..." 
        />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Special Notes</label>
        <textarea 
          rows={4} 
          value={details.specialNotes} 
          disabled={!canEdit} 
          onChange={(e) => setDetails(p => ({ ...p, specialNotes: e.target.value }))} 
          onBlur={(e) => handleBlur(FIELD_IDS.SPECIAL_NOTES, e.target.value)}
          style={textareaStyle} 
          placeholder="Any other special notes or considerations..." 
        />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>BEO Notes (Kitchen)</label>
        <textarea 
          rows={4} 
          value={details.beoNotes} 
          disabled={!canEdit} 
          onChange={(e) => setDetails(p => ({ ...p, beoNotes: e.target.value }))} 
          onBlur={(e) => handleBlur(FIELD_IDS.BEO_NOTES, e.target.value)}
          style={textareaStyle} 
          placeholder="Kitchen notes, special handling, venue setup instructions..." 
        />
      </div>
    </FormSection>
  );
};
