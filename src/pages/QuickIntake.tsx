import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FIELD_IDS, createEvent } from "../services/airtable/events";
import { isErrorResult } from "../services/airtable/selectors";
import { useEventStore } from "../state/eventStore";
import { inputStyle, labelStyle } from "../components/beo-intake/FormSection";
import "./QuickIntake.css";
import { DASHBOARD_CALENDAR_TO } from "../lib/dashboardRoutes";

/** Only these four event types; sent to Airtable as plain string. */
const EVENT_TYPES = [
  { id: "Full Service", name: "Full Service", color: "#00bcd4" },   // turquoise — full service app-wide
  { id: "Delivery",     name: "Delivery",     color: "#eab308" },   // yellow
  { id: "Pickup",       name: "Pickup",       color: "#a855f7" },   // purple
  { id: "Tasting",      name: "Tasting",      color: "#ec4899" },   // pink
] as const;

const initialForm = { clientFirstName: "", clientLastName: "", clientPhone: "", eventDate: "", eventTypeId: "" };

export const QuickIntake = () => {
  const navigate = useNavigate();
  const { loadEvents } = useEventStore();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasType = Boolean(form.eventTypeId);
  const canSubmit = useMemo(
    () => form.clientFirstName.trim().length > 0 && form.clientLastName.trim().length > 0 && form.clientPhone.trim().length > 0 && hasType,
    [form, hasType]
  );
  const accentColor = EVENT_TYPES.find((t) => t.id === form.eventTypeId)?.color ?? "#444";

  const set = (f: keyof typeof initialForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;
    const selected = EVENT_TYPES.find((o) => o.id === form.eventTypeId);
    if (!selected) { setError("Please select an event type."); return; }
    setIsSubmitting(true);
    const fields: Record<string, unknown> = {
      [FIELD_IDS.CLIENT_FIRST_NAME]: form.clientFirstName.trim(),
      [FIELD_IDS.CLIENT_LAST_NAME]:  form.clientLastName.trim(),
      [FIELD_IDS.CLIENT_PHONE]:      form.clientPhone.trim(),
      [FIELD_IDS.EVENT_TYPE]:        selected.name, // plain string for Airtable
    };
    if (form.eventDate) fields[FIELD_IDS.EVENT_DATE] = form.eventDate;
    const result = await createEvent(fields);
    if (isErrorResult(result)) {
      setError(result.message ?? "Unable to create event.");
      setIsSubmitting(false);
      return;
    }
    loadEvents();
    navigate(`/event/${result.id}`);
  };

  /* Same page background and card style as BEO intake / form sections */
  const pageBg = "linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0f0a15 100%)";
  const cardBorder = hasType ? accentColor : "#00bcd4";
  const cardShadow = hasType
    ? `0 15px 35px rgba(0,0,0,0.4), 0 0 20px ${accentColor}40, inset 0 0 0 1px rgba(255,255,255,0.04)`
    : "0 15px 35px rgba(0,0,0,0.4), 0 0 20px rgba(0,188,212,0.25), inset 0 0 0 1px rgba(255,255,255,0.04)";

  return (
    <div className="quick-intake-page" style={{ minHeight: "100vh", background: pageBg, color: "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 500 }}>
        {/* Card — same section look as IntakePage (cyan/turquoise panels) */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(10, 20, 30, 0.92), rgba(15, 18, 28, 0.9))",
            border: `2px solid ${cardBorder}`,
            borderRadius: 12,
            padding: 28,
            boxShadow: cardShadow,
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        >
          {/* Logo / wordmark */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#00bcd4", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>Werx</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>New Event</h1>
            <p style={{ margin: "5px 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Name · Phone · Event Type — everything else in the BEO</p>
          </div>

          {/* Form card inner */}
          <div
            style={{
              backgroundColor: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "24px 22px",
            }}
          >
          <form onSubmit={handleSubmit}>

            {/* Error */}
            {error && (
              <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid #ff6b6b", borderRadius: 7, padding: "9px 13px", color: "#ff6b6b", fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
                {error}
              </div>
            )}

            {/* Name row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={labelStyle}>First Name *</label>
                <input type="text" placeholder="First" value={form.clientFirstName} onChange={set("clientFirstName")} style={inputStyle} autoFocus />
              </div>
              <div>
                <label style={labelStyle}>Last Name *</label>
                <input type="text" placeholder="Last" value={form.clientLastName} onChange={set("clientLastName")} style={inputStyle} />
              </div>
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>Phone *</label>
              <input type="tel" placeholder="(555) 123-4567" value={form.clientPhone} onChange={set("clientPhone")} style={inputStyle} />
            </div>

            {/* Event Type — each button shaded with its color (same system as rest of app) */}
            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>Event Type *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                {EVENT_TYPES.map((opt) => {
                  const active = form.eventTypeId === opt.id;
                  const color = opt.color;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, eventTypeId: opt.id }))}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: active ? `2px solid ${color}` : `1px solid ${color}66`,
                        background: active ? `${color}28` : `${color}18`,
                        color: active ? color : `${color}dd`,
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {opt.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date — optional */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ ...labelStyle, color: "rgba(255,255,255,0.3)" }}>
                Event Date <span style={{ fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="date"
                value={form.eventDate}
                onChange={set("eventDate")}
                style={{ ...inputStyle, color: form.eventDate ? "#e0e0e0" : "rgba(255,255,255,0.25)" }}
              />
            </div>

            {/* Submit — same accent as rest of forms; neutral when disabled (no red) */}
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: canSubmit ? `2px solid ${accentColor}` : "1px solid rgba(255,255,255,0.12)",
                background: canSubmit ? `${accentColor}28` : "rgba(255,255,255,0.05)",
                color: canSubmit ? accentColor : "rgba(255,255,255,0.4)",
                fontSize: 14,
                fontWeight: 700,
                cursor: canSubmit && !isSubmitting ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                marginBottom: 8,
                letterSpacing: "0.03em",
                boxShadow: canSubmit ? `0 2px 12px ${accentColor}40` : "none",
              }}
            >
              {isSubmitting ? "Creating…" : hasType ? "Create Event →" : "Pick an event type above"}
            </button>

            <button
              type="button"
              onClick={() => navigate(DASHBOARD_CALENDAR_TO)}
              style={{ width: "100%", padding: "9px", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 12, cursor: "pointer" }}
            >
              Back to Dashboard
            </button>

          </form>
        </div>
        </div>
      </div>
    </div>
  );
};
