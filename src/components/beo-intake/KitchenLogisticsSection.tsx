import { useEffect, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asSingleSelectName } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";

// Display label → Airtable stored value
const KITCHEN_OPTIONS: { label: string; value: string }[] = [
  { label: "Yes — Kitchen available on site",          value: "Yes" },
  { label: "No — No kitchen on site (action required)", value: "No"  },
  { label: "N/A — Not applicable",                     value: "None" },
];

const NO_KITCHEN_RESOLUTIONS = [
  "Send small oven on truck",
  "Deliver food hot (dispatch adjusted)",
  "Rent ovens - rental order required",
  "Server picks up hot - cambros on arrival",
] as const;

type NoKitchenResolution = typeof NO_KITCHEN_RESOLUTIONS[number] | "";

const RESOLUTION_META: Record<string, { color: string; flag: string; note: string }> = {
  "Send small oven on truck": {
    color: "#f97316",
    flag: "PACKOUT",
    note: "Notify packout — small oven must be loaded on truck.",
  },
  "Deliver food hot (dispatch adjusted)": {
    color: "#ef4444",
    flag: "DISPATCH + DRIVERS",
    note: "Dispatch time changes. Expeditor and drivers must be notified.",
  },
  "Rent ovens - rental order required": {
    color: "#a855f7",
    flag: "RENTAL + PACKOUT",
    note: "Rental order required. Confirm with rental company and notify packout.",
  },
  "Server picks up hot - cambros on arrival": {
    color: "#eab308",
    flag: "CAPTAIN",
    note: "Captain picks up food hot on arrival. Cambros must be ready.",
  },
};

type KitchenLogisticsSectionProps = { embedded?: boolean };

export const KitchenLogisticsSection = ({ embedded = false }: KitchenLogisticsSectionProps) => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [kitchenOnSite, setKitchenOnSite] = useState("");
  const [noKitchenResolution, setNoKitchenResolution] = useState<NoKitchenResolution>("");

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setKitchenOnSite("");
      setNoKitchenResolution("");
      return;
    }
    setKitchenOnSite(asSingleSelectName(selectedEventData[FIELD_IDS.KITCHEN_ON_SITE]) || "");
    setNoKitchenResolution(
      (asSingleSelectName(selectedEventData[FIELD_IDS.NO_KITCHEN_RESOLUTION]) || "") as NoKitchenResolution
    );
  }, [selectedEventId, selectedEventData]);

  const handleFieldChange = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const canEdit = Boolean(selectedEventId);

  const inputStyle: React.CSSProperties = {
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

  const meta = noKitchenResolution ? RESOLUTION_META[noKitchenResolution] : null;

  const content = (
    <>
      <div>
        <label style={labelStyle}>Kitchen On-Site?</label>
        <select
          value={kitchenOnSite}
          disabled={!canEdit}
          onChange={(e) => {
            const v = e.target.value || null;
            setKitchenOnSite(v || "");
            handleFieldChange(FIELD_IDS.KITCHEN_ON_SITE, v);
            // Clear resolution if switching away from "No"
            if (v !== "No") {
              setNoKitchenResolution("");
              handleFieldChange(FIELD_IDS.NO_KITCHEN_RESOLUTION, null);
            }
          }}
          style={{
            ...inputStyle,
            borderColor: kitchenOnSite === "No" ? "#ff6b6b" : kitchenOnSite === "Yes" ? "#22c55e" : "#444",
          }}
        >
          <option value="">-- Select --</option>
          {KITCHEN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {kitchenOnSite === "No" && !noKitchenResolution && (
          <div style={{ marginTop: 4, fontSize: 11, color: "#ff6b6b", fontWeight: 600 }}>
            ⬇ Select a resolution below — required before BEO can be finalized
          </div>
        )}
      </div>

      {kitchenOnSite === "No" && (
        <div style={{ marginTop: 4 }}>
          <label style={{ ...labelStyle, color: "#ff6b6b", fontSize: "12px" }}>
            ⚠️ NO KITCHEN ON SITE — How will hot food be handled?
          </label>
          <select
            value={noKitchenResolution}
            disabled={!canEdit}
            onChange={(e) => {
              const v = e.target.value as NoKitchenResolution;
              setNoKitchenResolution(v);
              handleFieldChange(FIELD_IDS.NO_KITCHEN_RESOLUTION, v || null);
            }}
            style={{
              ...inputStyle,
              border: noKitchenResolution ? `2px solid ${meta?.color ?? "#ff6b6b"}` : "2px solid #ff6b6b",
              color: noKitchenResolution ? (meta?.color ?? "#e0e0e0") : "#ff6b6b",
              fontWeight: 700,
            }}
          >
            <option value="">— Select resolution (required) —</option>
            {NO_KITCHEN_RESOLUTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          {meta && (
            <div
              style={{
                marginTop: 8,
                padding: "10px 14px",
                borderRadius: 8,
                background: "#1e1e1e",
                border: `1px solid ${meta.color}`,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <span
                style={{
                  background: meta.color,
                  color: "#fff",
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  marginTop: 1,
                }}
              >
                {meta.flag}
              </span>
              <span style={{ color: "#ccc", fontSize: 13 }}>{meta.note}</span>
            </div>
          )}

          {!noKitchenResolution && (
            <div style={{ marginTop: 6, color: "#ff6b6b", fontSize: 12, fontWeight: 600 }}>
              ⚠️ A resolution must be selected — this affects packout, dispatch, and/or rentals.
            </div>
          )}
        </div>
      )}
    </>
  );

  return embedded ? content : (
    <FormSection title="Kitchen & Hot Food Logic">
      {content}
    </FormSection>
  );
};
