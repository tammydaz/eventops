import { useEffect, useMemo, useState } from "react";
import { type AttachmentItem, uploadAttachment } from "../../services/airtable/events";
import { asAttachments } from "../../services/airtable/selectors";
import { FIELD_IDS, type AttachmentsDetails } from "../../services/airtable/events";
import { useEventStore } from "../../state/eventStore";

const emptyDetails: AttachmentsDetails = {
  eventDocuments: [],
  invoicePdf: [],
  generatedBeoPdf: [],
};

type AttachmentGroup = {
  label: string;
  items: AttachmentItem[];
};

export const AttachmentsPanel = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<AttachmentsDetails>(emptyDetails);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails(emptyDetails);
      return;
    }
    setIsLoading(false);
    setError(null);
    setDetails({
      eventDocuments: asAttachments(selectedEventData[FIELD_IDS.EVENT_DOCUMENTS]),
      invoicePdf: asAttachments(selectedEventData[FIELD_IDS.INVOICE_PDF]),
      generatedBeoPdf: asAttachments(selectedEventData[FIELD_IDS.GENERATED_BEO_PDF]),
    });
  }, [selectedEventId, selectedEventData]);

  const groups = useMemo<AttachmentGroup[]>(
    () => [
      { label: "Event Documents", items: details.eventDocuments },
      { label: "Invoice PDF", items: details.invoicePdf },
      { label: "Generated BEO PDF", items: details.generatedBeoPdf },
    ],
    [details]
  );

  const uploadForField = async (fieldId: string, file: File) => {
    if (!selectedEventId) return;
    const result = await uploadAttachment(selectedEventId, fieldId, file);
    if ("error" in result) {
      setError(result.message ?? "Upload failed");
      return;
    }
    await setFields(selectedEventId, { [fieldId]: result.attachments });
  };

  const removeAttachment = async (fieldId: string, itemToRemove: AttachmentItem) => {
    if (!selectedEventId) return;
    const raw = selectedEventData[fieldId];
    const arr = Array.isArray(raw) ? raw : [];
    const remaining = arr.filter(
      (a: { url?: string; filename?: string }) =>
        !(a?.url === itemToRemove.url && a?.filename === itemToRemove.filename)
    );
    await setFields(selectedEventId, { [fieldId]: remaining });
  };

  return (
    <section className="bg-gray-900 border-2 border-gray-800 rounded-xl p-5 mb-3 hover:border-red-600 transition-all shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3">
          <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">▶ Attachments</h2>
        </button>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {isOpen ? (
        <>
          {error ? <div className="text-sm text-red-400 mb-4">{error}</div> : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group) => (
          <div key={group.label} className="bg-gray-950 border border-gray-800 rounded-md p-4">
            <div className="text-sm font-semibold text-gray-200 mb-3">{group.label}</div>
            {selectedEventId ? (
              <div className="mb-3">
                <input
                  type="file"
                  className="text-xs text-gray-300"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const fieldId =
                      group.label === "Event Documents"
                        ? FIELD_IDS.EVENT_DOCUMENTS
                        : group.label === "Invoice PDF"
                        ? FIELD_IDS.INVOICE_PDF
                        : FIELD_IDS.GENERATED_BEO_PDF;
                    uploadForField(fieldId, file);
                  }}
                />
              </div>
            ) : null}
            {group.items.length === 0 ? (
              <div className="text-xs text-gray-500">No attachments</div>
            ) : (
              <ul className="space-y-2">
                {group.items.map((item, index) => (
                  <li key={`${group.label}-${item.id ?? index}`} className="flex items-center justify-between gap-2">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-red-400 hover:text-red-300 truncate"
                      >
                        {item.filename ?? item.url}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400 truncate">{item.filename ?? "Attachment"}</span>
                    )}
                    {selectedEventId && (
                      <button
                        type="button"
                        onClick={() => {
                          const fieldId =
                            group.label === "Event Documents"
                              ? FIELD_IDS.EVENT_DOCUMENTS
                              : group.label === "Invoice PDF"
                              ? FIELD_IDS.INVOICE_PDF
                              : FIELD_IDS.GENERATED_BEO_PDF;
                          removeAttachment(fieldId, item);
                        }}
                        className="text-xs text-gray-500 hover:text-red-400 px-1"
                        title="Remove attachment"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
          </div>
        </>
      ) : null}
    </section>
  );
};
