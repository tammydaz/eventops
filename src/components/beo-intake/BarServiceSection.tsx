import { useEffect, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asSingleSelectName, asString } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";

export const BarServiceSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState({ barService: "", sigDrink: "", drinkName: "", recipe: "", whoSupplies: "", mixers: "", garnishes: "" });

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails({ barService: "", sigDrink: "", drinkName: "", recipe: "", whoSupplies: "", mixers: "", garnishes: "" });
      return;
    }
    
    const newDetails = {
      barService: asSingleSelectName(selectedEventData[FIELD_IDS.BAR_SERVICE]),
      sigDrink: asSingleSelectName(selectedEventData[FIELD_IDS.BAR_SIG_DRINK]),
      drinkName: asString(selectedEventData[FIELD_IDS.BAR_DRINK_NAME]),
      recipe: asString(selectedEventData[FIELD_IDS.BAR_RECIPE]),
      whoSupplies: asSingleSelectName(selectedEventData[FIELD_IDS.BAR_WHO_SUPPLIES]),
      mixers: asString(selectedEventData[FIELD_IDS.BAR_MIXERS]),
      garnishes: asString(selectedEventData[FIELD_IDS.BAR_GARNISHES]),
    };
    
    // Only update if the values are actually different to prevent cursor jumping
    setDetails(prev => {
      if (prev.barService === newDetails.barService &&
          prev.sigDrink === newDetails.sigDrink &&
          prev.drinkName === newDetails.drinkName &&
          prev.recipe === newDetails.recipe &&
          prev.whoSupplies === newDetails.whoSupplies &&
          prev.mixers === newDetails.mixers &&
          prev.garnishes === newDetails.garnishes) {
        return prev;
      }
      return newDetails;
    });
  }, [selectedEventId, selectedEventData]);

  const save = async (fid: string, val: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fid]: val });
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
    <FormSection title="Bar Service" icon="🍹">
      <div>
        <label style={labelStyle}>Bar Service Needed</label>
        <select value={details.barService} disabled={!canEdit} onChange={(e) => { setDetails(p => ({ ...p, barService: e.target.value })); save(FIELD_IDS.BAR_SERVICE, e.target.value || null); }} style={inputStyle}>
          <option value="">Select</option>
          <option value="None">None</option>
          <option value="Full Bar Package">Full Bar Package</option>
          <option value="Foodwerx bartender only">Foodwerx bartender only</option>
          <option value="Foodwerx Mixers Only">Foodwerx Mixers Only</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Signature Drink</label>
        <select value={details.sigDrink} disabled={!canEdit} onChange={(e) => { setDetails(p => ({ ...p, sigDrink: e.target.value })); save(FIELD_IDS.BAR_SIG_DRINK, e.target.value || null); }} style={inputStyle}>
          <option value="">Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
      {details.sigDrink === "Yes" && (
        <>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Drink Name</label>
            <input type="text" value={details.drinkName} disabled={!canEdit} onChange={(e) => { setDetails(p => ({ ...p, drinkName: e.target.value })); save(FIELD_IDS.BAR_DRINK_NAME, e.target.value); }} style={inputStyle} placeholder="Name of signature drink" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Recipe</label>
            <textarea rows={3} value={details.recipe} disabled={!canEdit} onChange={(e) => { setDetails(p => ({ ...p, recipe: e.target.value })); save(FIELD_IDS.BAR_RECIPE, e.target.value); }} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} placeholder="Recipe instructions..." />
          </div>
          <div>
            <label style={labelStyle}>Who Supplies Mixers/Garnishes</label>
            <select value={details.whoSupplies} disabled={!canEdit} onChange={(e) => { setDetails(p => ({ ...p, whoSupplies: e.target.value })); save(FIELD_IDS.BAR_WHO_SUPPLIES, e.target.value || null); }} style={inputStyle}>
              <option value="">Select</option>
              <option value="Foodwerx">Foodwerx</option>
              <option value="Client">Client</option>
            </select>
          </div>
          {details.whoSupplies === "Foodwerx" && (
            <>
              <div>
                <label style={labelStyle}>Mixers</label>
                <input type="text" value={details.mixers} disabled={!canEdit} onChange={(e) => { setDetails(p => ({ ...p, mixers: e.target.value })); save(FIELD_IDS.BAR_MIXERS, e.target.value); }} style={inputStyle} placeholder="e.g. Tonic, Ginger Beer" />
              </div>
              <div>
                <label style={labelStyle}>Garnishes</label>
                <input type="text" value={details.garnishes} disabled={!canEdit} onChange={(e) => { setDetails(p => ({ ...p, garnishes: e.target.value })); save(FIELD_IDS.BAR_GARNISHES, e.target.value); }} style={inputStyle} placeholder="e.g. Limes, Mint, Olives" />
              </div>
            </>
          )}
        </>
      )}
    </FormSection>
  );
};
