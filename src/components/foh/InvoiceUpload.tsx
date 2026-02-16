import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { extractTextFromPdf, parseInvoiceText, type ParsedInvoice } from "../../services/invoiceParser";
import { createEvent, FIELD_IDS, uploadAttachment } from "../../services/airtable/events";
import { isErrorResult } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

type Props = {
  onClose: () => void;
};

/** Parse military or common time string to HH:mm; returns null if unparseable. */
function parseTimeString(s: string): { hours: number; minutes: number } | null {
  const raw = String(s).trim();
  if (!raw) return null;
  // Military: "14:00", "14:30", "09:00", "9:00", or "1400", "0930"
  const militaryMatch = raw.match(/^(\d{1,2}):?(\d{2})\s*$/);
  if (militaryMatch) {
    const hours = parseInt(militaryMatch[1], 10);
    const minutes = parseInt(militaryMatch[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) return { hours, minutes };
  }
  const fourDigit = raw.replace(/\D/g, "");
  if (fourDigit.length >= 3) {
    const h = fourDigit.length === 3 ? parseInt(fourDigit.slice(0, 1), 10) : parseInt(fourDigit.slice(0, 2), 10);
    const m = parseInt(fourDigit.slice(-2), 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return { hours: h, minutes: m };
  }
  // 12-hour: "2:00 PM", "9:00 AM"
  const amPmMatch = raw.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)$/i);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = amPmMatch[2] ? parseInt(amPmMatch[2], 10) : 0;
    const pm = /pm/i.test(amPmMatch[3]);
    if (pm && hours !== 12) hours += 12;
    if (!pm && hours === 12) hours = 0;
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) return { hours, minutes };
  }
  return null;
}

/** Build ISO 8601 dateTime for Airtable from date (YYYY-MM-DD) and time string (military or HH:mm). */
function toAirtableDateTime(dateStr: string, timeStr: string): string | null {
  const d = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const t = parseTimeString(timeStr);
  if (!t) return null;
  const { hours, minutes } = t;
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return `${d}T${hh}:${mm}:00.000Z`;
}

function parsedInvoiceToFields(parsed: ParsedInvoice): Record<string, unknown> {
  // Event Name is computed in Airtable (formula) — do not set it here
  const fields: Record<string, unknown> = {};
  if (parsed.eventDate) fields[FIELD_IDS.EVENT_DATE] = parsed.eventDate;
  if (parsed.guestCount != null) fields[FIELD_IDS.GUEST_COUNT] = parsed.guestCount;
  if (parsed.clientFirstName) fields[FIELD_IDS.CLIENT_FIRST_NAME] = parsed.clientFirstName;
  if (parsed.clientLastName) fields[FIELD_IDS.CLIENT_LAST_NAME] = parsed.clientLastName;
  // Client Business Name is computed in Airtable — do not set it
  if (parsed.clientEmail) fields[FIELD_IDS.CLIENT_EMAIL] = parsed.clientEmail;
  if (parsed.clientPhone) fields[FIELD_IDS.CLIENT_PHONE] = parsed.clientPhone;
  if (parsed.venueName) fields[FIELD_IDS.VENUE] = parsed.venueName;
  const eventDate = parsed.eventDate?.trim() ?? "";
  if (eventDate && parsed.eventStartTime) {
    const startIso = toAirtableDateTime(eventDate, parsed.eventStartTime);
    if (startIso) fields[FIELD_IDS.EVENT_START_TIME] = startIso;
  }
  if (eventDate && parsed.eventEndTime) {
    const endIso = toAirtableDateTime(eventDate, parsed.eventEndTime);
    if (endIso) fields[FIELD_IDS.EVENT_END_TIME] = endIso;
  }
  const notes = [parsed.notes, parsed.menuText].filter(Boolean).join("\n\n");
  if (notes) fields[FIELD_IDS.SPECIAL_NOTES] = notes;
  return fields;
}

export default function InvoiceUpload({ onClose }: Props) {
  const navigate = useNavigate();
  const { selectEvent, loadEvents, addEventToList } = useEventStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedInvoice | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] || null;
    setFile(next);
    setPreview(null);
    setError(null);
  };

  const handleProcess = async () => {
    if (!file) {
      setError("Please choose a PDF invoice first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const text = await extractTextFromPdf(file);
      const parsed = await parseInvoiceText(text);
      if (!parsed) {
        setError("Unable to parse invoice. Please try again or enter data manually.");
      } else {
        setPreview(parsed);
      }
    } catch (err) {
      console.error("[InvoiceUpload] Process error:", err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("OPENAI") || message.includes("API key") || message.includes("401") || message.includes("Bearer")) {
        setError("OpenAI API key is missing or invalid. Add VITE_OPENAI_API_KEY to .env.");
      } else if (message.includes("worker") || message.includes("pdf") || message.includes("getDocument")) {
        setError("Could not read the PDF. Try a different file or check the console for details.");
      } else {
        setError(`Something went wrong: ${message.slice(0, 120)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!preview) return;
    setCreating(true);
    setError(null);
    try {
      const fields = parsedInvoiceToFields(preview);
      const result = await createEvent(fields);
      if (isErrorResult(result)) {
        setError(result.message ?? "Failed to create event.");
        setCreating(false);
        return;
      }
      await loadEvents();
      const name = [preview.clientFirstName, preview.clientLastName].filter(Boolean).join(" ") || preview.clientOrganization || "Invoice import";
      const eventName = preview.venueName ? `${name} – ${preview.venueName}` : name;
      addEventToList({
        id: result.id,
        eventName,
        eventDate: preview.eventDate ?? undefined,
        guestCount: preview.guestCount,
      });
      await selectEvent(result.id);
      if (file) {
        const uploadResult = await uploadAttachment(result.id, FIELD_IDS.INVOICE_PDF, file);
        if (isErrorResult(uploadResult)) {
          console.warn("[InvoiceUpload] PDF attach failed:", uploadResult.message);
        }
      }
      onClose();
      navigate(`/beo-intake/${result.id}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong creating the event.");
    } finally {
      setCreating(false);
    }
  };

  const modal = (
    <div
      className="invoice-upload-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-invoice-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.75)",
        padding: "1rem",
      }}
    >
      <div className="dp-card" style={{ width: "100%", maxWidth: "32rem", margin: 0 }}>
        <div className="dp-card-neon-top" />
        <div className="dp-card-header" style={{ marginBottom: "1rem" }}>
          <div className="dp-card-info">
            <div className="dp-card-name" id="upload-invoice-title">Upload Invoice</div>
            <div className="dp-card-time" style={{ marginTop: 2 }}>PDF → BEO</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="dp-card-menu"
            style={{ fontSize: 18 }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="dp-card-details" style={{ marginBottom: 0 }}>
          <div className="dp-card-row" style={{ marginBottom: 12 }}>
            <span className="dp-card-label">Invoice PDF</span>
          </div>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-xs text-gray-300 file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-red-700/70 file:text-white hover:file:bg-red-600/80"
            style={{ marginBottom: 12 }}
          />

          {error && (
            <div className="text-xs text-red-400 bg-red-900/40 border border-red-700/60 rounded px-3 py-2" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={loading || !file}
            onClick={handleProcess}
            className="dp-card-pill"
            style={{ display: "block", width: "100%", marginBottom: 12, borderColor: "rgba(204,0,0,0.5)", background: "rgba(204,0,0,0.15)", color: "#fecaca", cursor: loading || !file ? "not-allowed" : "pointer", opacity: loading || !file ? 0.6 : 1 }}
          >
            {loading ? "Processing…" : "Analyze & Extract Fields"}
          </button>

          {preview && (
            <div className="dp-card-row" style={{ marginBottom: 12, flexDirection: "column", alignItems: "stretch" }}>
              <span className="dp-card-label" style={{ marginBottom: 4 }}>Parsed preview</span>
              <pre className="whitespace-pre-wrap break-words text-[11px] bg-black/40 rounded p-2 max-h-40 overflow-auto border border-gray-700/50" style={{ color: "#a0a0a0" }}>
                {JSON.stringify(preview, null, 2)}
              </pre>
            </div>
          )}

          <div className="dp-card-health" style={{ borderTop: "1px solid rgba(204,0,0,0.1)", paddingTop: 12, marginTop: 12, justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              className="dp-card-pill"
              style={{ borderColor: "rgba(204,0,0,0.3)", background: "transparent", color: "#a0a0a0" }}
            >
              Close
            </button>
            <button
              type="button"
              disabled={!preview || creating}
              onClick={handleCreateEvent}
              className="dp-card-pill"
              style={{ borderColor: "rgba(34,197,94,0.5)", background: "rgba(34,197,94,0.2)", color: "#86efac", cursor: !preview || creating ? "not-allowed" : "pointer", opacity: !preview || creating ? 0.5 : 1 }}
            >
              {creating ? "Creating…" : "Create Event from Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" && document.body
    ? createPortal(modal, document.body)
    : modal;
}

