import { useEffect, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";
import type { DesignerNotes } from "./types";

export const DesignerNotesSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<DesignerNotes>({
    themeColorScheme: "",
  });

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails({ themeColorScheme: "" });
      return;
    }

    setDetails({
      themeColorScheme: asString(selectedEventData[FIELD_IDS.THEME_COLOR_SCHEME]),
    });
  }, [selectedEventId, selectedEventData]);

  const handleFieldChange = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const handleChange = <K extends keyof DesignerNotes>(key: K, value: DesignerNotes[K]) => {
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
    <FormSection title="Designer Notes (Optional)" icon="🎨">
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Theme / Color Scheme</label>
        <textarea
          rows={3}
          value={details.themeColorScheme}
          disabled={!canEdit}
          onChange={(e) => {
            handleChange("themeColorScheme", e.target.value);
            handleFieldChange(FIELD_IDS.THEME_COLOR_SCHEME, e.target.value);
          }}
          style={inputStyle}
          placeholder="Describe theme, colors, decor vision..."
        />
      </div>
    </FormSection>
  );
};
