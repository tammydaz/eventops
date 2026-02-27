import { useEffect, useState, useRef } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString, asSingleSelectName } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";

const WEDDING_KEY_MOMENTS = [
  "Grand Entrance",
  "Cocktail Hour End",
  "Dinner Service",
  "First Dance",
  "Cake Cutting",
  "Parent Dances",
  "Toasts / Speeches",
];

const BAR_MITZVAH_KEY_MOMENTS = [
  "Grand Entrance",
  "Hora",
  "Motzi / Hamotzi",
  "Kiddush",
  "Dinner Service",
  "Cake Cutting",
];

const helperStyle = {
  fontSize: "11px",
  color: "#666",
  marginTop: "6px",
  lineHeight: 1.4,
} as const;

export const TimelineSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [beoTimeline, setBeoTimeline] = useState("");
  const lastEventIdRef = useRef<string | null>(null);

  const eventOccasion = asSingleSelectName(selectedEventData?.[FIELD_IDS.EVENT_OCCASION]) ?? "";
  const isWedding = eventOccasion === "Wedding";
  const isBarMitzvah = eventOccasion === "Bar/Bat Mitzvah";
  const showKeyMoments = isWedding || isBarMitzvah;

  useEffect(() => {
    if (selectedEventId !== lastEventIdRef.current) {
      lastEventIdRef.current = selectedEventId;
      if (!selectedEventId || !selectedEventData) {
        setBeoTimeline("");
        return;
      }
      setBeoTimeline(asString(selectedEventData[FIELD_IDS.BEO_TIMELINE]));
    }
  }, [selectedEventId, selectedEventData]);

  const handleBlur = async (value: string) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [FIELD_IDS.BEO_TIMELINE]: value });
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

  const keyMoments = isWedding ? WEDDING_KEY_MOMENTS : BAR_MITZVAH_KEY_MOMENTS;
  const suggestedPlaceholder = keyMoments
    .map((m, i) => `${["6:00", "6:30", "7:00", "7:30", "8:00", "8:30", "9:00"][i] ?? "—"} ${m}`)
    .join(" / ");

  return (
    <FormSection title="Timeline" dotColor="#3b82f6">
      {showKeyMoments && (
        <div style={{ gridColumn: "1 / -1", marginBottom: 16, padding: 12, backgroundColor: "rgba(59,130,246,0.08)", borderRadius: 8, border: "1px solid rgba(59,130,246,0.3)" }}>
          <div style={{ fontSize: 12, color: "#93c5fd", marginBottom: 8, fontWeight: 600 }}>
            {isWedding ? "💒 Wedding" : "✡️ Bar/Bat Mitzvah"} — Key moments to capture
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
            {keyMoments.join(" • ")}
          </div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            Use the timeline below to enter times for each. This appears on the printed BEO.
          </div>
        </div>
      )}

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>
          {showKeyMoments ? "BEO Timeline (printed schedule)" : "BEO Timeline (printed schedule)"}
        </label>
        <textarea
          rows={showKeyMoments ? 5 : 4}
          value={beoTimeline}
          disabled={!canEdit}
          onChange={(e) => setBeoTimeline(e.target.value)}
          onBlur={(e) => handleBlur(e.target.value)}
          style={inputStyle}
          placeholder={
            showKeyMoments
              ? suggestedPlaceholder
              : "10:30AM Staff Arrival / 12:00PM Event Begins / 4:00PM Load Out..."
          }
        />
        <div style={helperStyle}>
          {showKeyMoments
            ? "For events with a strict schedule. This appears on the printed BEO. Include all key moments above."
            : "For events with a strict schedule (bar/bat mitzvahs, weddings, large corporate). Leave blank if no formal timeline."}
        </div>
      </div>
    </FormSection>
  );
};
