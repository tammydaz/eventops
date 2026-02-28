import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { extractTextFromPdf, parseInvoiceText, type ParsedInvoice } from "../services/invoiceParser";
import { createEvent, uploadAttachment, FIELD_IDS } from "../services/airtable/events";
import { isErrorResult } from "../services/airtable/selectors";
import { useEventStore } from "../state/eventStore";
import { parsedInvoiceToFields } from "../utils/invoiceToEventFields";

type Step = "idle" | "processing" | "creating" | "duplicate" | "done" | "error";
type DuplicateEvent = { id: string; eventName: string; eventDate?: string };

function findSimilarEvent(
  events: { id: string; eventName: string; eventDate?: string }[],
  parsed: ParsedInvoice
): DuplicateEvent | null {
  const date = parsed.eventDate?.trim();
  const clientName = [parsed.clientFirstName, parsed.clientLastName].filter(Boolean).join(" ").toLowerCase();
  const venue = (parsed.venueName ?? "").toLowerCase();
  if (!date && !clientName && !venue) return null;

  for (const ev of events) {
    const evDate = ev.eventDate?.slice(0, 10);
    const sameDate = date && evDate && evDate === date;
    const evNameLower = (ev.eventName ?? "").toLowerCase();
    const hasClient = clientName && evNameLower.includes(clientName.split(" ")[0] ?? "");
    const hasVenue = venue && evNameLower.includes(venue.split(" ")[0] ?? "");
    const similar = sameDate && (hasClient || hasVenue);
    if (similar) return ev;
  }
  return null;
}

export default function InvoiceIntakePage() {
  const navigate = useNavigate();
  const { selectEvent, loadEvents } = useEventStore();
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastEventName, setLastEventName] = useState<string | null>(null);
  const [duplicateState, setDuplicateState] = useState<{
    parsed: ParsedInvoice;
    file: File;
    duplicateEvent: DuplicateEvent;
  } | null>(null);

  const doCreateEvent = useCallback(
    async (parsed: ParsedInvoice, file: File) => {
      setStep("creating");
      setError(null);
      try {
        const fields = parsedInvoiceToFields(parsed);
        const result = await createEvent(fields);
        if (isErrorResult(result)) {
          setError(result.message ?? "Failed to create event.");
          setStep("error");
          return;
        }
        await loadEvents();
        await selectEvent(result.id);
        const uploadResult = await uploadAttachment(result.id, FIELD_IDS.INVOICE_PDF, file);
        if (isErrorResult(uploadResult)) {
          console.warn("[InvoiceIntake] PDF attach failed:", uploadResult.message);
        }
        const name =
          [parsed.clientFirstName, parsed.clientLastName].filter(Boolean).join(" ") ||
          parsed.clientOrganization ||
          parsed.venueName ||
          "Invoice import";
        setLastEventName(name);
        setStep("done");
        navigate(`/beo-intake/${result.id}`);
      } catch (err) {
        console.error("[InvoiceIntake]", err);
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg.includes("OPENAI") || msg.includes("API key") ? "OpenAI key missing." : msg.slice(0, 150));
        setStep("error");
      }
    },
    [loadEvents, selectEvent, navigate]
  );

  const processFile = useCallback(
    async (file: File) => {
      if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
        setError("Please drop or select a PDF invoice.");
        return;
      }
      setStep("processing");
      setError(null);
      setDuplicateState(null);
      try {
        const text = await extractTextFromPdf(file);
        const parsed = await parseInvoiceText(text);
        if (!parsed || (!parsed.clientEmail && !parsed.clientOrganization && !parsed.venueName && !parsed.eventDate)) {
          setError("Could not extract enough data from this invoice. Try a different file or add details manually in BEO Intake.");
          setStep("error");
          return;
        }
        const freshEvents = await loadEvents();
        const similar = freshEvents ? findSimilarEvent(freshEvents, parsed) : null;
        if (similar) {
          setDuplicateState({ parsed, file, duplicateEvent: similar });
          setStep("duplicate");
          return;
        }
        await doCreateEvent(parsed, file);
      } catch (err) {
        console.error("[InvoiceIntake]", err);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("OPENAI") || msg.includes("API key")) {
          setError("OpenAI key missing. Using rule-based parsing—if extraction failed, add VITE_OPENAI_API_KEY to .env for better results.");
        } else {
          setError(msg.slice(0, 150));
        }
        setStep("error");
      }
    },
    [loadEvents, doCreateEvent]
  );

  const handleOpenExisting = useCallback(async () => {
    if (!duplicateState) return;
    setStep("creating");
    setError(null);
    const { duplicateEvent, file } = duplicateState;
    try {
      await selectEvent(duplicateEvent.id);
      const uploadResult = await uploadAttachment(duplicateEvent.id, FIELD_IDS.INVOICE_PDF, file);
      if (isErrorResult(uploadResult)) {
        console.warn("[InvoiceIntake] PDF attach failed:", uploadResult.message);
      }
      setDuplicateState(null);
      navigate(`/beo-intake/${duplicateEvent.id}`);
    } catch (err) {
      console.error("[InvoiceIntake]", err);
      setError("Could not open event.");
      setStep("duplicate");
    }
  }, [duplicateState, selectEvent, navigate]);

  const handleCreateAnyway = useCallback(async () => {
    if (!duplicateState) return;
    const { parsed, file } = duplicateState;
    setDuplicateState(null);
    await doCreateEvent(parsed, file);
  }, [duplicateState, doCreateEvent]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a0808 40%, #0f0a15 100%)",
        color: "#e0e0e0",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
          borderBottom: "2px solid rgba(204,0,0,0.3)",
          background: "rgba(0,0,0,0.5)",
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#888",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: "24px" }}>←</span>
          Back to Dashboard
        </Link>
        <h1 style={{ margin: 0, fontSize: "24px", color: "#ff6b6b", fontWeight: 700 }}>
          📄 Invoice → Event
        </h1>
        <div style={{ width: 120 }} />
      </header>

      <main
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "48px 24px",
        }}
      >
        <p
          style={{
            fontSize: "14px",
            color: "#888",
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          Drag & drop an invoice PDF, or click to browse. It will automatically create an event and open BEO Intake.
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById("invoice-file-input")?.click()}
          style={{
            border: `3px dashed ${isDragging ? "#ff6b6b" : "#444"}`,
            borderRadius: 16,
            padding: "48px 24px",
            textAlign: "center",
            cursor: step === "processing" || step === "creating" ? "wait" : step === "duplicate" ? "default" : "pointer",
            background: isDragging ? "rgba(255,107,107,0.08)" : "rgba(0,0,0,0.2)",
            transition: "all 0.2s ease",
          }}
        >
          <input
            id="invoice-file-input"
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            style={{ display: "none" }}
          />
          {step === "processing" && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#ff6b6b" }}>
                Extracting data from invoice…
              </div>
            </>
          )}
          {step === "creating" && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#22c55e" }}>
                Creating event & opening BEO Intake…
              </div>
            </>
          )}
          {step === "duplicate" && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#fcd34d" }}>
                Similar event found — choose an option below
              </div>
            </>
          )}
          {(step === "idle" || step === "error") && (
            <>
              <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.9 }}>📥</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                Drop PDF here or click to upload
              </div>
              <div style={{ fontSize: 13, color: "#666" }}>
                Works with Hospitality Management Services / FoodWerx invoices
              </div>
            </>
          )}
        </div>

        {step === "duplicate" && duplicateState && (
          <div
            style={{
              marginTop: 24,
              padding: 20,
              background: "rgba(251,191,36,0.15)",
              border: "1px solid rgba(251,191,36,0.5)",
              borderRadius: 12,
              color: "#fcd34d",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              ⚠️ Similar event already exists
            </div>
            <div style={{ fontSize: 14, marginBottom: 16 }}>
              {duplicateState.duplicateEvent.eventName}
              {duplicateState.duplicateEvent.eventDate ? ` (${duplicateState.duplicateEvent.eventDate})` : ""}
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleOpenExisting}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  background: "rgba(251,191,36,0.3)",
                  border: "1px solid rgba(251,191,36,0.6)",
                  color: "#fcd34d",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Open existing & attach PDF
              </button>
              <button
                type="button"
                onClick={handleCreateAnyway}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  background: "rgba(107,114,128,0.3)",
                  border: "1px solid rgba(107,114,128,0.5)",
                  color: "#d1d5db",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Create new anyway
              </button>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: 8,
              color: "#fca5a5",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {lastEventName && step === "done" && (
          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.4)",
              borderRadius: 8,
              color: "#86efac",
              fontSize: 14,
            }}
          >
            ✓ Event created: {lastEventName}. Redirecting to BEO Intake…
          </div>
        )}
      </main>
    </div>
  );
}
