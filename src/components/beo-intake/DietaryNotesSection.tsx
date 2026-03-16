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
    opsExceptions: "",
  });
  const lastEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only update when event ID changes, not on every data update
    if (selectedEventId !== lastEventIdRef.current) {
      lastEventIdRef.current = selectedEventId;
      
      if (!selectedEventId || !selectedEventData) {
        setDetails({ dietaryNotes: "", specialNotes: "", beoNotes: "", opsExceptions: "" });
        return;
      }
      
      setDetails({
        dietaryNotes: asString(selectedEventData[FIELD_IDS.DIETARY_NOTES]),
        specialNotes: asString(selectedEventData[FIELD_IDS.SPECIAL_NOTES]),
        beoNotes: asString(selectedEventData[FIELD_IDS.BEO_NOTES]),
        opsExceptions: asString(selectedEventData[FIELD_IDS.OPS_EXCEPTIONS_SPECIAL_HANDLING]),
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
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>
          Outside Sourcing / Ops Exceptions
          <span style={{ fontWeight: 400, color: "#888", marginLeft: 8 }}>
            — items sourced externally or requiring Ops Chief notification
          </span>
        </label>
        <textarea 
          rows={3} 
          value={details.opsExceptions} 
          disabled={!canEdit} 
          onChange={(e) => setDetails(p => ({ ...p, opsExceptions: e.target.value }))} 
          onBlur={(e) => handleBlur(FIELD_IDS.OPS_EXCEPTIONS_SPECIAL_HANDLING, e.target.value)}
          style={textareaStyle} 
          placeholder="e.g. Wedding cake pickup — arrive by 3pm · Sushi from Nobu — driver must confirm · Sig drink ingredients needed — notify Ops Chief · Client-supplied ingredients for pasta station..." 
        />
      </div>
    </FormSection>
  );
};
