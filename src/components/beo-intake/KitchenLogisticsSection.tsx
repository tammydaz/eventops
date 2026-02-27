import { useEffect, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asSingleSelectName, asBoolean } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";

const KITCHEN_OPTIONS = ["Yes", "No"];

type KitchenLogisticsSectionProps = { embedded?: boolean };

export const KitchenLogisticsSection = ({ embedded = false }: KitchenLogisticsSectionProps) => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [kitchenOnSite, setKitchenOnSite] = useState("");
  const [foodMustGoHot, setFoodMustGoHot] = useState(false);

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setKitchenOnSite("");
      setFoodMustGoHot(false);
      return;
    }
    setKitchenOnSite(asSingleSelectName(selectedEventData[FIELD_IDS.KITCHEN_ON_SITE]));
    setFoodMustGoHot(asBoolean(selectedEventData[FIELD_IDS.FOOD_MUST_GO_HOT]));
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
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    color: "#999",
    marginBottom: "6px",
    fontWeight: "600",
  };

  const content = (
    <>
      <div>
        <label style={labelStyle}>Kitchen On-Site?</label>
        <select
          value={kitchenOnSite}
          disabled={!canEdit}
          onChange={(e) => {
            setKitchenOnSite(e.target.value);
            handleFieldChange(FIELD_IDS.KITCHEN_ON_SITE, e.target.value ? { name: e.target.value } : null);
          }}
          style={inputStyle}
        >
          <option value="">-- Select --</option>
          {KITCHEN_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {kitchenOnSite === "No" && (
        <div>
          <label style={{ ...labelStyle, color: "#ff6b6b" }}>⚠️ Food Must Go Hot?</label>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0" }}>
            <input
              type="checkbox"
              checked={foodMustGoHot}
              disabled={!canEdit}
              onChange={(e) => {
                setFoodMustGoHot(e.target.checked);
                handleFieldChange(FIELD_IDS.FOOD_MUST_GO_HOT, e.target.checked);
              }}
              style={{ width: "20px", height: "20px", accentColor: "#ff6b6b" }}
            />
            <span style={{ color: foodMustGoHot ? "#ff6b6b" : "#999", fontWeight: 700, fontSize: "14px" }}>
              {foodMustGoHot
                ? "YES — All food must go hot in cambros"
                : "No — Standard wrap & number"}
            </span>
          </div>
        </div>
      )}
    </>
  );

  return embedded ? content : (
    <FormSection title="Kitchen & Hot Food Logic" icon="🔥">
      {content}
    </FormSection>
  );
};
