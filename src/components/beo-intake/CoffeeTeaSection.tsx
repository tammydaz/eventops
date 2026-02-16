import { useEffect, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";
import type { CoffeeTea } from "./types";

export const CoffeeTeaSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<CoffeeTea>({
    coffeeServiceNeeded: "",
  });

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails({ coffeeServiceNeeded: "" });
      return;
    }

    setDetails({
      coffeeServiceNeeded: asString(selectedEventData[FIELD_IDS.COFFEE_SERVICE_NEEDED]),
    });
  }, [selectedEventId, selectedEventData]);

  const handleFieldChange = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const handleChange = <K extends keyof CoffeeTea>(key: K, value: CoffeeTea[K]) => {
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
    <FormSection title="Coffee / Tea Service (Optional)" icon="☕">
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Coffee Service Needed</label>
        <textarea
          rows={3}
          value={details.coffeeServiceNeeded}
          disabled={!canEdit}
          onChange={(e) => {
            handleChange("coffeeServiceNeeded", e.target.value);
            handleFieldChange(FIELD_IDS.COFFEE_SERVICE_NEEDED, e.target.value);
          }}
          style={inputStyle}
          placeholder="Describe coffee/tea service requirements (regular/decaf, hot/iced tea, service style, etc.)"
        />
      </div>
    </FormSection>
  );
};
