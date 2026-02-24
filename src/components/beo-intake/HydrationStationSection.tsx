import { useEffect, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";

export const HydrationStationSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState({ infusedWater: "", infusionIngredients: "", dispenserCount: "", bottledWater: "", unsweetTea: "", sweetTea: "", sodaSelection: "", other: "" });

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails({ infusedWater: "", infusionIngredients: "", dispenserCount: "", bottledWater: "", unsweetTea: "", sweetTea: "", sodaSelection: "", other: "" });
      return;
    }
    
    const newDetails = {
      infusedWater: asString(selectedEventData[FIELD_IDS.INFUSED_WATER]),
      infusionIngredients: asString(selectedEventData[FIELD_IDS.INFUSION_INGREDIENTS]),
      dispenserCount: selectedEventData[FIELD_IDS.DISPENSER_COUNT] !== undefined ? String(selectedEventData[FIELD_IDS.DISPENSER_COUNT]) : "",
      bottledWater: asString(selectedEventData[FIELD_IDS.HYDRATION_BOTTLED_WATER]),
      unsweetTea: asString(selectedEventData[FIELD_IDS.HYDRATION_UNSWEET_TEA]),
      sweetTea: asString(selectedEventData[FIELD_IDS.HYDRATION_SWEET_TEA]),
      sodaSelection: asString(selectedEventData[FIELD_IDS.HYDRATION_SODA_SELECTION]),
      other: asString(selectedEventData[FIELD_IDS.HYDRATION_OTHER]),
    };
    
    // Only update if the values are actually different to prevent cursor jumping
    setDetails(prev => {
      if (prev.infusedWater === newDetails.infusedWater &&
          prev.infusionIngredients === newDetails.infusionIngredients &&
          prev.dispenserCount === newDetails.dispenserCount &&
          prev.bottledWater === newDetails.bottledWater &&
          prev.unsweetTea === newDetails.unsweetTea &&
          prev.sweetTea === newDetails.sweetTea &&
          prev.sodaSelection === newDetails.sodaSelection &&
          prev.other === newDetails.other) {
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
    <FormSection title="Hydration Station" icon="💧">
      <div>
        <label style={labelStyle}>Infused Water</label>
        <input 
          type="text" 
          value={details.infusedWater} 
          disabled={!canEdit} 
          onChange={(e) => setDetails(p => ({ ...p, infusedWater: e.target.value }))} 
          onBlur={(e) => handleBlur(FIELD_IDS.INFUSED_WATER, e.target.value)}
          style={inputStyle} 
          placeholder="e.g. Cucumber, Lemon" 
        />
      </div>
      <div>
        <label style={labelStyle}>Infusion Ingredients</label>
        <input 
          type="text" 
          value={details.infusionIngredients} 
          disabled={!canEdit} 
          onChange={(e) => setDetails(p => ({ ...p, infusionIngredients: e.target.value }))} 
          onBlur={(e) => handleBlur(FIELD_IDS.INFUSION_INGREDIENTS, e.target.value)}
          style={inputStyle} 
          placeholder="Ingredients list" 
        />
      </div>
      <div>
        <label style={labelStyle}>Dispenser Count</label>
        <input 
          type="number" 
          value={details.dispenserCount} 
          disabled={!canEdit} 
          onChange={(e) => setDetails(p => ({ ...p, dispenserCount: e.target.value }))} 
          onBlur={(e) => handleBlur(FIELD_IDS.DISPENSER_COUNT, e.target.value === "" ? null : Number(e.target.value))}
          style={inputStyle} 
          placeholder="Number of dispensers" 
        />
      </div>
      <div>
        <label style={labelStyle}>Bottled Water</label>
        <input 
          type="text" 
          value={details.bottledWater} 
          disabled={!canEdit} 
          onChange={(e) => setDetails(p => ({ ...p, bottledWater: e.target.value }))} 
          onBlur={(e) => handleBlur(FIELD_IDS.HYDRATION_BOTTLED_WATER, e.target.value)}
          style={inputStyle} 
          placeholder="Quantity" 
        />
      </div>
      <div>
        <label style={labelStyle}>Unsweet Tea</label>
        <input 
          type="text" 
          value={details.unsweetTea} 
          disabled={!canEdit} 
          onChange={(e) => setDetails(p => ({ ...p, unsweetTea: e.target.value }))} 
          onBlur={(e) => handleBlur(FIELD_IDS.HYDRATION_UNSWEET_TEA, e.target.value)}
          style={inputStyle} 
          placeholder="Quantity" 
        />
      </div>
      <div>
        <label style={labelStyle}>Sweet Tea</label>
        <input 
          type="text" 
          value={details.sweetTea} 
          disabled={!canEdit} 
          onChange={(e) => setDetails(p => ({ ...p, sweetTea: e.target.value }))} 
          onBlur={(e) => handleBlur(FIELD_IDS.HYDRATION_SWEET_TEA, e.target.value)}
          style={inputStyle} 
          placeholder="Quantity" 
        />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Soda Selection</label>
        <input 
          type="text" 
          value={details.sodaSelection} 
          disabled={!canEdit} 
          onChange={(e) => setDetails(p => ({ ...p, sodaSelection: e.target.value }))} 
          onBlur={(e) => handleBlur(FIELD_IDS.HYDRATION_SODA_SELECTION, e.target.value)}
          style={inputStyle} 
          placeholder="e.g. Coke, Diet Coke, Sprite" 
        />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Other</label>
        <textarea 
          rows={2} 
          value={details.other} 
          disabled={!canEdit} 
          onChange={(e) => setDetails(p => ({ ...p, other: e.target.value }))} 
          onBlur={(e) => handleBlur(FIELD_IDS.HYDRATION_OTHER, e.target.value)}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} 
          placeholder="Other hydration items..." 
        />
      </div>
    </FormSection>
  );
};
