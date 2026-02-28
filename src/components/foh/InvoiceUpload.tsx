import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { extractTextFromPdf, parseInvoiceText, type ParsedInvoice } from "../../services/invoiceParser";
import { createEvent, FIELD_IDS, uploadAttachment } from "../../services/airtable/events";
import { parsedInvoiceToFields } from "../../utils/invoiceToEventFields";
import { isErrorResult } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

type Props = {
  onClose: () => void;
};

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

export default function InvoiceUpload({ onClose }: Props) {
  const navigate = useNavigate();
  const { selectEvent, loadEvents, addEventToList } = useEventStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedInvoice | null>(null);
  const [duplicateEvent, setDuplicateEvent] = useState<DuplicateEvent | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] || null;
    setFile(next);
    setPreview(null);
    setError(null);
    setDuplicateEvent(null);
  };

  const handleOpenExisting = async () => {
    if (!duplicateEvent || !file) return;
    setCreating(true);
    setError(null);
    try {
      await selectEvent(duplicateEvent.id);
      const uploadResult = await uploadAttachment(duplicateEvent.id, FIELD_IDS.INVOICE_PDF, file);
      if (isErrorResult(uploadResult)) {
        console.warn("[InvoiceUpload] PDF attach failed:", uploadResult.message);
      }
      onClose();
      navigate(`/beo-intake/${duplicateEvent.id}`);
    } catch (err) {
      console.error(err);
      setError("Could not open event.");
    } finally {
      setCreating(false);
      setDuplicateEvent(null);
    }
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

  const handleCreateEvent = async (forceCreate = false) => {
    if (!preview) return;
    setError(null);
    setDuplicateEvent(null);

    if (!forceCreate) {
      const freshEvents = await loadEvents();
      const similar = freshEvents ? findSimilarEvent(freshEvents, preview) : null;
      if (similar) {
        setDuplicateEvent(similar);
        return;
      }
    }

    setCreating(true);
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

          {duplicateEvent && (
            <div className="text-xs bg-amber-900/50 border border-amber-600/60 rounded px-3 py-2 mb-3" style={{ color: "#fcd34d" }}>
              <strong>Similar event already exists:</strong> {duplicateEvent.eventName}
              {duplicateEvent.eventDate ? ` (${duplicateEvent.eventDate})` : ""}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleOpenExisting}
                  disabled={creating}
                  className="px-2 py-1 rounded bg-amber-700/70 hover:bg-amber-600/80 text-white text-xs"
                >
                  Open existing & attach PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateEvent(true)}
                  disabled={creating}
                  className="px-2 py-1 rounded bg-gray-700/70 hover:bg-gray-600/80 text-gray-300 text-xs"
                >
                  Create new anyway
                </button>
              </div>
            </div>
          )}

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
              onClick={() => handleCreateEvent(false)}
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

