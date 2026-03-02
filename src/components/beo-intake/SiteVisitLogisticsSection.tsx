import { useEffect, useState, useCallback } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS, loadSingleSelectOptions, type SingleSelectOption } from "../../services/airtable/events";
import { asString, asSingleSelectName } from "../../services/airtable/selectors";
import { FormSection, CollapsibleSubsection, Helper } from "./FormSection";

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
  fontWeight: "600" as const,
};

const STAIRS_FALLBACK = ["None", "1–2 steps", "3–5 steps", "Full flight", "Multiple floors"];
const ELEVATORS_FALLBACK = ["Yes", "No", "Freight elevator only"];

export const SiteVisitLogisticsSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();

  const [stairsSteps, setStairsSteps] = useState("");
  const [elevatorsAvailable, setElevatorsAvailable] = useState("");
  const [stairsOptions, setStairsOptions] = useState<string[]>([]);
  const [elevatorsOptions, setElevatorsOptions] = useState<string[]>([]);

  const [notes, setNotes] = useState({
    parkingNotes: "",
    loadInNotes: "",
    venueNotes: "",
    kitchenAccessNotes: "",
    powerNotes: "",
    timelineNotes: "",
    equipmentNotes: "",
    animalsPets: "",
    foodSetupLocation: "",
    eventPurpose: "",
    clientSuppliedFood: "",
    allergiesDietary: "",
    religiousRestrictions: "",
    specialNotes: "",
    beoNotes: "",
    themeColorScheme: "",
  });

  useEffect(() => {
    let cancelled = false;
    loadSingleSelectOptions([FIELD_IDS.STAIRS_STEPS, FIELD_IDS.ELEVATORS_AVAILABLE]).then((result) => {
      if (cancelled) return;
      if ("error" in result) {
        setStairsOptions(STAIRS_FALLBACK);
        setElevatorsOptions(ELEVATORS_FALLBACK);
        return;
      }
      const stairs = (result[FIELD_IDS.STAIRS_STEPS] ?? []).map((o: SingleSelectOption) => o.name);
      const elevators = (result[FIELD_IDS.ELEVATORS_AVAILABLE] ?? []).map((o: SingleSelectOption) => o.name);
      setStairsOptions(stairs.length > 0 ? stairs : STAIRS_FALLBACK);
      setElevatorsOptions(elevators.length > 0 ? elevators : ELEVATORS_FALLBACK);
    });
    return () => { cancelled = true; };
  }, []);

  const loadFromStore = useCallback(() => {
    if (!selectedEventId || !selectedEventData) {
      setNotes({
        parkingNotes: "",
        loadInNotes: "",
        venueNotes: "",
        kitchenAccessNotes: "",
        powerNotes: "",
        timelineNotes: "",
        equipmentNotes: "",
        animalsPets: "",
        foodSetupLocation: "",
        eventPurpose: "",
        clientSuppliedFood: "",
        allergiesDietary: "",
        religiousRestrictions: "",
        specialNotes: "",
        beoNotes: "",
        themeColorScheme: "",
      });
      setStairsSteps("");
      setElevatorsAvailable("");
      return;
    }
    const d = selectedEventData;
    setNotes({
      parkingNotes: asString(d[FIELD_IDS.PARKING_NOTES]),
      loadInNotes: asString(d[FIELD_IDS.LOAD_IN_NOTES]),
      venueNotes: asString(d[FIELD_IDS.VENUE_NOTES]),
      kitchenAccessNotes: asString(d[FIELD_IDS.KITCHEN_ACCESS_NOTES]),
      powerNotes: asString(d[FIELD_IDS.POWER_NOTES]),
      timelineNotes: asString(d[FIELD_IDS.TIMELINE_NOTES]),
      equipmentNotes: asString(d[FIELD_IDS.EQUIPMENT_NOTES]),
      animalsPets: asString(d[FIELD_IDS.ANIMALS_PETS]),
      foodSetupLocation: asString(d[FIELD_IDS.FOOD_SETUP_LOCATION]),
      eventPurpose: asString(d[FIELD_IDS.EVENT_PURPOSE]),
      clientSuppliedFood: asString(d[FIELD_IDS.CLIENT_SUPPLIED_FOOD]),
      allergiesDietary: asString(d[FIELD_IDS.DIETARY_NOTES]),
      religiousRestrictions: asString(d[FIELD_IDS.RELIGIOUS_RESTRICTIONS]),
      specialNotes: asString(d[FIELD_IDS.SPECIAL_NOTES]),
      beoNotes: asString(d[FIELD_IDS.BEO_NOTES]),
      themeColorScheme: asString(d[FIELD_IDS.THEME_COLOR_SCHEME]),
    });
    setStairsSteps(asSingleSelectName(d[FIELD_IDS.STAIRS_STEPS]));
    setElevatorsAvailable(asSingleSelectName(d[FIELD_IDS.ELEVATORS_AVAILABLE]));
  }, [selectedEventId, selectedEventData]);

  useEffect(() => {
    loadFromStore();
  }, [loadFromStore]);

  const handleBlur = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const canEdit = Boolean(selectedEventId);
  const textareaStyle = { ...inputStyle, resize: "vertical" as const, fontFamily: "inherit" };

  return (
    <FormSection title="Site Visit / Logistics" dotColor="#f59e0b" defaultOpen>
      <CollapsibleSubsection title="Parking & Load-In" icon="🚗" defaultOpen={true}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Parking Notes</label>
          <textarea
            rows={3}
            value={notes.parkingNotes}
            disabled={!canEdit}
            onChange={(e) => setNotes((p) => ({ ...p, parkingNotes: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.PARKING_NOTES, e.target.value)}
            style={textareaStyle}
            placeholder="e.g. Garage on level B2, validation at front desk"
          />
          <Helper>Off-site? Note if parking is in a garage, on street, or lot. Include valet info, validation, or restrictions.</Helper>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Load-In Notes</label>
          <textarea
            rows={3}
            value={notes.loadInNotes}
            disabled={!canEdit}
            onChange={(e) => setNotes((p) => ({ ...p, loadInNotes: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.LOAD_IN_NOTES, e.target.value)}
            style={textareaStyle}
            placeholder="e.g. Load at rear dock, elevator to 3rd floor"
          />
          <Helper>Where to load/unload. If loading dock is at a different location than the event space, note it here.</Helper>
        </div>
        <div>
          <label style={labelStyle}>Stairs / Steps</label>
          <select
            value={stairsSteps}
            disabled={!canEdit}
            onChange={(e) => {
              const v = e.target.value;
              setStairsSteps(v);
              handleBlur(FIELD_IDS.STAIRS_STEPS, v || null);
            }}
            style={inputStyle}
          >
            <option value="">Select...</option>
            {[...new Set([...stairsOptions, stairsSteps].filter(Boolean))].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <Helper>Any stairs or steps crew need to navigate with equipment?</Helper>
        </div>
        <div>
          <label style={labelStyle}>Elevators Available</label>
          <select
            value={elevatorsAvailable}
            disabled={!canEdit}
            onChange={(e) => {
              const v = e.target.value;
              setElevatorsAvailable(v);
              handleBlur(FIELD_IDS.ELEVATORS_AVAILABLE, v || null);
            }}
            style={inputStyle}
          >
            <option value="">Select...</option>
            {[...new Set([...elevatorsOptions, elevatorsAvailable].filter(Boolean))].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <Helper>Is there an elevator for load-in? Critical for heavy equipment.</Helper>
        </div>
      </CollapsibleSubsection>

      <CollapsibleSubsection title="Venue & Setup" icon="🏠">
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Venue Notes</label>
          <textarea
            rows={2}
            value={notes.venueNotes}
            disabled={!canEdit}
            onChange={(e) => setNotes((p) => ({ ...p, venueNotes: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.VENUE_NOTES, e.target.value)}
            style={textareaStyle}
            placeholder="General venue notes..."
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Kitchen Access Notes</label>
          <textarea
            rows={3}
            value={notes.kitchenAccessNotes}
            disabled={!canEdit}
            onChange={(e) => setNotes((p) => ({ ...p, kitchenAccessNotes: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.KITCHEN_ACCESS_NOTES, e.target.value)}
            style={textareaStyle}
            placeholder="Oven, refrigerator access, kitchen availability..."
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Food Setup Location</label>
          <textarea
            rows={2}
            value={notes.foodSetupLocation}
            disabled={!canEdit}
            onChange={(e) => setNotes((p) => ({ ...p, foodSetupLocation: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.FOOD_SETUP_LOCATION, e.target.value)}
            style={textareaStyle}
            placeholder="Where food will be set up..."
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Power Notes</label>
          <textarea
            rows={2}
            value={notes.powerNotes}
            disabled={!canEdit}
            onChange={(e) => setNotes((p) => ({ ...p, powerNotes: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.POWER_NOTES, e.target.value)}
            style={textareaStyle}
            placeholder="Electric source for heat lamps, outlets..."
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Animals / Pets</label>
          <textarea
            rows={2}
            value={notes.animalsPets}
            disabled={!canEdit}
            onChange={(e) => setNotes((p) => ({ ...p, animalsPets: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.ANIMALS_PETS, e.target.value)}
            style={textareaStyle}
            placeholder="Pets to be aware of, close doors so they don't get out..."
          />
        </div>
      </CollapsibleSubsection>

      <CollapsibleSubsection title="Event & Service" icon="📋">
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Event Purpose</label>
          <textarea
            rows={2}
            value={notes.eventPurpose}
            disabled={!canEdit}
            onChange={(e) => setNotes((p) => ({ ...p, eventPurpose: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.EVENT_PURPOSE, e.target.value)}
            style={textareaStyle}
            placeholder="e.g. 50th birthday party, corporate awards dinner"
          />
          <Helper>What is the event for? Helps crew understand context and tone.</Helper>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Client-Supplied Food</label>
          <textarea
            rows={2}
            value={notes.clientSuppliedFood}
            disabled={!canEdit}
            onChange={(e) => setNotes((p) => ({ ...p, clientSuppliedFood: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.CLIENT_SUPPLIED_FOOD, e.target.value)}
            style={textareaStyle}
            placeholder="e.g. Client bringing cake, charcuterie board"
          />
          <Helper>What is the client supplying? (e.g. cake, appetizers, desserts)</Helper>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Equipment Notes</label>
          <textarea
            rows={2}
            value={notes.equipmentNotes}
            disabled={!canEdit}
            onChange={(e) => setNotes((p) => ({ ...p, equipmentNotes: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.EQUIPMENT_NOTES, e.target.value)}
            style={textareaStyle}
            placeholder="e.g. Need extra chafers, cake stand, sternos"
          />
          <Helper>Extra equipment requested beyond standard pack-out. (e.g. heat lamps, cake stand, sternos)</Helper>
        </div>
      </CollapsibleSubsection>

      <CollapsibleSubsection title="Dietary & Restrictions" icon="⚠️">
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Allergies / Dietary</label>
          <textarea
            rows={3}
            value={notes.allergiesDietary}
            disabled={!canEdit}
            onChange={(e) => setNotes((p) => ({ ...p, allergiesDietary: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.DIETARY_NOTES, e.target.value)}
            style={textareaStyle}
            placeholder="e.g. Shellfish allergy, gluten-free, vegetarian options needed"
          />
          <Helper>Allergies and dietary restrictions. This appears on the BEO allergy banner—be specific.</Helper>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Religious Restrictions</label>
          <textarea
            rows={2}
            value={notes.religiousRestrictions}
            disabled={!canEdit}
            onChange={(e) => setNotes((p) => ({ ...p, religiousRestrictions: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.RELIGIOUS_RESTRICTIONS, e.target.value)}
            style={textareaStyle}
            placeholder="e.g. Kosher, halal, no pork"
          />
          <Helper>Religious food restrictions (e.g. kosher, halal, no pork).</Helper>
        </div>
      </CollapsibleSubsection>

      <CollapsibleSubsection title="Designer / Theme" icon="🎨" defaultOpen={false}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Theme / Color Scheme</label>
          <textarea
            rows={3}
            value={notes.themeColorScheme}
            disabled={!canEdit}
            onChange={(e) => setNotes((p) => ({ ...p, themeColorScheme: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.THEME_COLOR_SCHEME, e.target.value)}
            style={textareaStyle}
            placeholder="Describe theme, colors, decor vision..."
          />
          <Helper>Theme, color palette, and decor vision for the event.</Helper>
        </div>
      </CollapsibleSubsection>

      <CollapsibleSubsection title="Other Notes" icon="📝">
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Special Notes</label>
          <textarea
            rows={3}
            value={notes.specialNotes}
            disabled={!canEdit}
            onChange={(e) => setNotes((p) => ({ ...p, specialNotes: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.SPECIAL_NOTES, e.target.value)}
            style={textareaStyle}
            placeholder="e.g. Client prefers low-sodium, VIP table needs extra attention"
          />
          <Helper>Any other special notes or considerations that don't fit elsewhere.</Helper>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>BEO Notes (Kitchen)</label>
          <textarea
            rows={3}
            value={notes.beoNotes}
            disabled={!canEdit}
            onChange={(e) => setNotes((p) => ({ ...p, beoNotes: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.BEO_NOTES, e.target.value)}
            style={textareaStyle}
            placeholder="e.g. Kitchen notes, special handling, venue setup instructions"
          />
          <Helper>Any special food items that need to be ordered or picked up outside of normal business.</Helper>
        </div>
      </CollapsibleSubsection>

      <CollapsibleSubsection title="Timeline" icon="⏱️" defaultOpen={false}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Timeline / Flow Notes</label>
          <textarea
            rows={4}
            value={notes.timelineNotes}
            disabled={!canEdit}
            onChange={(e) => setNotes((p) => ({ ...p, timelineNotes: e.target.value }))}
            onBlur={(e) => handleBlur(FIELD_IDS.TIMELINE_NOTES, e.target.value)}
            style={textareaStyle}
            placeholder="e.g. Apps first, dinner buffet-style whenever ready, dessert after"
          />
          <Helper>For informal events only — all formal events must use formal timeline at bottom of page.</Helper>
        </div>
      </CollapsibleSubsection>
    </FormSection>
  );
};
