import { useEffect, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";

export const ServicewareSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState({ serviceWare: "", serviceWareSource: "", chinaPaperGlassware: "" });

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails({ serviceWare: "", serviceWareSource: "", chinaPaperGlassware: "" });
      return;
    }
    
    const newDetails = {
      serviceWare: asString(selectedEventData[FIELD_IDS.SERVICE_WARE]),
      serviceWareSource: asString(selectedEventData[FIELD_IDS.SERVICE_WARE_SOURCE]),
      chinaPaperGlassware: asString(selectedEventData[FIELD_IDS.CHINA_PAPER_GLASSWARE]),
    };
    
    // Only update if the values are actually different to prevent cursor jumping
    setDetails(prev => {
      if (prev.serviceWare === newDetails.serviceWare &&
          prev.serviceWareSource === newDetails.serviceWareSource &&
          prev.chinaPaperGlassware === newDetails.chinaPaperGlassware) {
        return prev;
      }
      return newDetails;
    });
  }, [selectedEventId, selectedEventData]);

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
    <FormSection title="Serviceware" icon="🍴">
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Serviceware</label>
        <textarea 
          rows={3} 
          value={details.serviceWare} 
          disabled={!canEdit} 
          onChange={(e) => setDetails(p => ({ ...p, serviceWare: e.target.value }))} 
          onBlur={(e) => handleBlur(FIELD_IDS.SERVICE_WARE, e.target.value)}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} 
          placeholder="Describe serviceware needs..." 
        />
      </div>
      <div>
        <label style={labelStyle}>Serviceware Source</label>
        <input 
          type="text" 
          value={details.serviceWareSource} 
          disabled={!canEdit} 
          onChange={(e) => setDetails(p => ({ ...p, serviceWareSource: e.target.value }))} 
          onBlur={(e) => handleBlur(FIELD_IDS.SERVICE_WARE_SOURCE, e.target.value)}
          style={inputStyle} 
          placeholder="FoodWerx, Client, Rental" 
        />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>China / Paper / Glassware</label>
        <textarea 
          rows={3} 
          value={details.chinaPaperGlassware} 
          disabled={!canEdit} 
          onChange={(e) => setDetails(p => ({ ...p, chinaPaperGlassware: e.target.value }))} 
          onBlur={(e) => handleBlur(FIELD_IDS.CHINA_PAPER_GLASSWARE, e.target.value)}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} 
          placeholder="Details about plates, cups, glassware..." 
        />
      </div>
    </FormSection>
  );
};
