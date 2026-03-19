import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FIELD_IDS, createEvent, loadSingleSelectOptions, type SingleSelectOption } from "../services/airtable/events";
import { isErrorResult } from "../services/airtable/selectors";
import { useEventStore } from "../state/eventStore";
import { inputStyle, labelStyle } from "./beo-intake/FormSection";

const FALLBACK_EVENT_TYPES: SingleSelectOption[] = [
  { id: "Full Service",                              name: "Full Service" },
  { id: "Delivery",                                  name: "Delivery" },
  { id: "Pickup",                                    name: "Pickup" },
  { id: "Grazing Display / Interactive Station",     name: "Grazing / Station" },
  { id: "Tasting",                                   name: "Tasting" },
];

const TYPE_COLOR: Record<string, string> = {
  "Full Service":                          "#00bcd4",
  "Delivery":                              "#eab308",
  "Pickup":                                "#eab308",
  "Grazing Display / Interactive Station": "#a855f7",
  "Tasting":                               "#f97316",
};

const TYPE_LABEL: Record<string, string> = {
  "Grazing Display / Interactive Station": "Grazing / Station",
};

const initialForm = { clientFirstName: "", clientLastName: "", clientPhone: "", eventDate: "", eventTypeId: "" };

type Props = {
  onClose: () => void;
};

export const NewEventModal = ({ onClose }: Props) => {
  const navigate = useNavigate();
  const { loadEvents } = useEventStore();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventTypeOptions, setEventTypeOptions] = useState<SingleSelectOption[]>(FALLBACK_EVENT_TYPES);

  useEffect(() => {
    loadSingleSelectOptions([FIELD_IDS.EVENT_TYPE]).then((result) => {
      if (!isErrorResult(result)) {
        const opts = result[FIELD_IDS.EVENT_TYPE] ?? [];
        if (opts.length > 0) setEventTypeOptions(opts);
      }
    });
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const canSubmit = useMemo(
    () => form.clientFirstName.trim().length > 0 && form.clientLastName.trim().length > 0 && form.clientPhone.trim().length > 0 && form.eventTypeId.trim().length > 0,
    [form]
  );

  const accentColor = TYPE_COLOR[form.eventTypeId] ?? "#444";
  const hasType = Boolean(form.eventTypeId);

  const set = (f: keyof typeof initialForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;
    const selected = eventTypeOptions.find((o) => o.id === form.eventTypeId);
    if (!selected) { setError("Please select an event type."); return; }
    setIsSubmitting(true);
    const fields: Record<string, unknown> = {
      [FIELD_IDS.CLIENT_FIRST_NAME]: form.clientFirstName.trim(),
      [FIELD_IDS.CLIENT_LAST_NAME]:  form.clientLastName.trim(),
      [FIELD_IDS.CLIENT_PHONE]:      form.clientPhone.trim(),
      [FIELD_IDS.EVENT_TYPE]:        selected.name,
    };
    if (form.eventDate) fields[FIELD_IDS.EVENT_DATE] = form.eventDate;
    const result = await createEvent(fields);
    if (isErrorResult(result)) {
      setError(result.message ?? "Unable to create event.");
      setIsSubmitting(false);
      return;
    }
    loadEvents();
    onClose();
    navigate(`/beo-intake/${result.id}`);
  };

  return (
    // Backdrop
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      {/* Modal card */}
      <div
        style={{
          width: "100%", maxWidth: 440,
          backgroundColor: "rgba(18,10,10,0.98)",
          border: `1px solid ${hasType ? accentColor : "rgba(255,255,255,0.1)"}`,
          borderRadius: 12,
          padding: "28px 24px 22px",
          boxShadow: hasType
            ? `0 4px 40px rgba(0,0,0,0.6), 0 0 20px ${accentColor}22`
            : "0 4px 40px rgba(0,0,0,0.6)",
          transition: "border-color 0.2s, box-shadow 0.2s",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
          aria-label="Close"
        >
          ✕
        </button>

        <div style={{ marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f0f0f0" }}>New Event</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#555" }}>Name · Phone · Type — fill the rest in the BEO</p>
        </div>

        <form onSubmit={handleSubmit}>

          {error && (
            <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid #ff6b6b", borderRadius: 7, padding: "8px 12px", color: "#ff6b6b", fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
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
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Phone *</label>
            <input type="tel" placeholder="(555) 123-4567" value={form.clientPhone} onChange={set("clientPhone")} style={inputStyle} />
          </div>

          {/* Event Type — shaded color pills */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Event Type *</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 6 }}>
              {eventTypeOptions.map((opt) => {
                const active = form.eventTypeId === opt.id;
                const color  = TYPE_COLOR[opt.id] ?? "#888";
                const label  = TYPE_LABEL[opt.id] ?? opt.name;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, eventTypeId: opt.id }))}
                    style={{
                      padding: "6px 13px",
                      borderRadius: 7,
                      border: active ? `1px solid ${color}` : "1px solid rgba(255,255,255,0.1)",
                      background: active ? `${color}22` : "rgba(255,255,255,0.04)",
                      color: active ? color : "#666",
                      fontSize: 12,
                      fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date — optional */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ ...labelStyle, color: "rgba(255,255,255,0.25)" }}>
              Event Date <span style={{ fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="date"
              value={form.eventDate}
              onChange={set("eventDate")}
              style={{ ...inputStyle, color: form.eventDate ? "#e0e0e0" : "rgba(255,255,255,0.2)" }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 8,
              border: canSubmit ? `1px solid ${accentColor}88` : "1px solid rgba(255,255,255,0.07)",
              background: canSubmit ? `${accentColor}22` : "rgba(255,255,255,0.03)",
              color: canSubmit ? accentColor : "#444",
              fontSize: 14,
              fontWeight: 700,
              cursor: canSubmit && !isSubmitting ? "pointer" : "not-allowed",
              transition: "all 0.15s",
              letterSpacing: "0.02em",
            }}
          >
            {isSubmitting ? "Creating…" : "Create Event →"}
          </button>

        </form>
      </div>
    </div>
  );
};
