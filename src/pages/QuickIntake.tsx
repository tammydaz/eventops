import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FIELD_IDS, createEvent, loadSingleSelectOptions, type SingleSelectOption } from "../services/airtable/events";
import { isErrorResult } from "../services/airtable/selectors";
import { useEventStore } from "../state/eventStore";

const initialForm = {
  clientFirstName: "",
  clientLastName: "",
  clientPhone: "",
  eventDate: "",
  eventTypeId: "",
};

export const QuickIntake = () => {
  const { loadEvents, selectEvent } = useEventStore();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [eventTypeOptions, setEventTypeOptions] = useState<SingleSelectOption[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOptions = async () => {
      const result = await loadSingleSelectOptions([FIELD_IDS.EVENT_TYPE]);
      if (!isMounted) return;
      if (isErrorResult(result)) {
        const msg = result.message ?? "Unable to load select options.";
        // Meta API 403: token has records access but lacks schema.bases:read — don't alarm staff, just use empty options
        const isSchemaScope = msg.includes("Invalid permissions") || msg.includes("model was not found");
        if (!isSchemaScope) setOptionsError(msg);
        return;
      }
      setEventTypeOptions(result[FIELD_IDS.EVENT_TYPE] ?? []);
    };

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const canSubmit = useMemo(
    () =>
      form.clientFirstName.trim().length > 0 &&
      form.clientLastName.trim().length > 0 &&
      form.clientPhone.trim().length > 0 &&
      form.eventTypeId.trim().length > 0,
    [form.clientFirstName, form.clientLastName, form.clientPhone, form.eventTypeId]
  );


  const handleChange = (field: keyof typeof initialForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const validateForm = () => {
    if (!form.clientFirstName.trim()) {
      setError("Client First Name is required");
      return false;
    }
    if (!form.clientLastName.trim()) {
      setError("Client Last Name is required");
      return false;
    }
    if (!form.clientPhone.trim()) {
      setError("Client Phone is required");
      return false;
    }
    if (!form.eventTypeId.trim()) {
      setError("Event Type is required. Please select an event type.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitMessage(null);
    setCreatedId(null);

    if (!validateForm()) return;

    const selectedOption = eventTypeOptions.find((opt) => opt.id === form.eventTypeId);
    if (!selectedOption || !form.eventTypeId?.trim()) {
      setError("Event Type is required. You must select an event type before creating the event.");
      return;
    }

    setIsSubmitting(true);

    const fields: Record<string, unknown> = {};

    // Required fields
    fields[FIELD_IDS.CLIENT_FIRST_NAME] = form.clientFirstName.trim();
    fields[FIELD_IDS.CLIENT_LAST_NAME] = form.clientLastName.trim();
    fields[FIELD_IDS.CLIENT_PHONE] = form.clientPhone.trim();
    fields[FIELD_IDS.EVENT_TYPE] = selectedOption.name;

    // Optional fields
    if (form.eventDate && form.eventDate.trim()) {
      fields[FIELD_IDS.EVENT_DATE] = form.eventDate;
    }

    console.log("📤 Fields being sent to Airtable:", JSON.stringify(fields, null, 2));

    const result = await createEvent(fields);
    console.log("📤 Create Event Request:", fields);
    if (isErrorResult(result)) {
      console.error("❌ Create Event Error:", result);
      setError(result.message ?? "Unable to create event.");
      setIsSubmitting(false);
      return;
    }
    console.log("✅ Create Event Success:", result);

    setSubmitMessage("✅ Event created successfully!");
    setCreatedId(result.id);
    setOptionsError(null);
    setForm(initialForm);
    await loadEvents();
    setIsSubmitting(false);
  };

  const handleOpenFullIntake = async () => {
    if (!createdId) return;
    await selectEvent(createdId);
    window.location.href = `/beo-intake/${createdId}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#1a1a1a",
        padding: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ maxWidth: "600px", width: "100%", backgroundColor: "#1a1a1a" }}>
        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
            borderBottom: "3px solid #ff6b6b",
            paddingBottom: "24px",
          }}
        >
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              color: "#ff6b6b",
              margin: "0 0 8px 0",
            }}
          >
            🎯 Quick Intake
          </h1>
          <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>
            Get your event into the system in 60 seconds
          </p>
          <Link
            to="/invoice-intake"
            style={{
              display: "inline-block",
              marginTop: 12,
              fontSize: 13,
              color: "#4ade80",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            📄 Or upload an invoice PDF instead →
          </Link>
        </div>

        <div
          style={{
            backgroundColor: "#2d2d2d",
            border: "2px solid #ff6b6b",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "20px",
          }}
        >
          {optionsError ? (
            <div
              style={{
                backgroundColor: "rgba(255, 193, 7, 0.1)",
                border: "2px solid #ffc107",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "16px",
                color: "#ffc107",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              {optionsError}
            </div>
          ) : null}
          {error ? (
            <div
              style={{
                backgroundColor: "rgba(255, 107, 107, 0.1)",
                border: "2px solid #ff6b6b",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "16px",
                color: "#ff6b6b",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              {error}
            </div>
          ) : null}

          {submitMessage ? (
            <div
              style={{
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                border: "2px solid #4caf50",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "16px",
                color: "#4caf50",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              {submitMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div
              style={{
                marginBottom: "24px",
                paddingBottom: "20px",
                borderBottom: "1px solid #444",
              }}
            >
              <h3
                style={{
                  color: "#ff6b6b",
                  fontSize: "14px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  margin: "0 0 16px 0",
                }}
              >
                👤 Client Information (Required)
              </h3>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ff6b6b",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Client First Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. John"
                  value={form.clientFirstName}
                  onChange={handleChange("clientFirstName")}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "2px solid #ff6b6b",
                    backgroundColor: "#1a1a1a",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ff6b6b",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Client Last Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Smith"
                  value={form.clientLastName}
                  onChange={handleChange("clientLastName")}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "2px solid #ff6b6b",
                    backgroundColor: "#1a1a1a",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "0" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ff6b6b",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Client Phone *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. (555) 123-4567"
                  value={form.clientPhone}
                  onChange={handleChange("clientPhone")}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "2px solid #ff6b6b",
                    backgroundColor: "#1a1a1a",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                marginBottom: "24px",
                paddingBottom: "20px",
                borderBottom: "1px solid #444",
              }}
            >
              <h3
                style={{
                  color: "#ff6b6b",
                  fontSize: "14px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  margin: "0 0 16px 0",
                }}
              >
                🎉 Event Type (Required – must be filled out)
              </h3>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ff6b6b",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Event Type *
                </label>
                <p style={{ color: "#888", fontSize: "12px", margin: "0 0 8px 0" }}>
                  This field must be filled out before creating the event.
                </p>
                <select
                  value={form.eventTypeId}
                  onChange={handleChange("eventTypeId")}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "2px solid #ff6b6b",
                    backgroundColor: "#1a1a1a",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="" style={{ backgroundColor: "#2d2d2d", color: "#fff" }}>
                    Select event type (required)...
                  </option>
                  {eventTypeOptions.map((option) => (
                    <option key={option.id} value={option.id} style={{ backgroundColor: "#2d2d2d", color: "#fff" }}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "0" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#d4a574",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Event Date (optional)
                </label>
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={handleChange("eventDate")}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "2px solid #d4a574",
                    backgroundColor: "#1a1a1a",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: "#ff6b6b",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: isSubmitting || !canSubmit ? "not-allowed" : "pointer",
                opacity: isSubmitting || !canSubmit ? 0.6 : 1,
                marginTop: "24px",
                marginBottom: "16px",
              }}
            >
              {isSubmitting ? "⏳ Creating Event..." : "✅ Create Event"}
            </button>
          </form>

          {createdId ? (
            <button
              type="button"
              onClick={handleOpenFullIntake}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#2d2d2d",
                color: "#ff6b6b",
                border: "2px solid #ff6b6b",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                marginBottom: "16px",
              }}
            >
              Open Full BEO Intake
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "transparent",
              color: "#888",
              border: "1px solid #444",
              borderRadius: "8px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Back to Dashboard
          </button>

          <p
            style={{
              textAlign: "center",
              color: "#666",
              fontSize: "12px",
              margin: "16px 0 0 0",
            }}
          >
            * = Required field (Client Name, Phone, and Event Type must be filled out)
          </p>
        </div>
      </div>
    </div>
  );
};
