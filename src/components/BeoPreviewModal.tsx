import React, { useEffect, useState } from "react";
import { useEventStore } from "../state/eventStore";
import { loadEvent } from "../services/airtable/events";
import { isErrorResult } from "../services/airtable/selectors";

export function BeoPreviewModal() {
  const { beoPreviewEventId, closeBeoPreview } = useEventStore();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!beoPreviewEventId) {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    loadEvent(beoPreviewEventId).then((result) => {
      setLoading(false);
      if (isErrorResult(result)) {
        setError(result.message ?? "Failed to load event");
        setData(null);
        return;
      }
      setData(result);
    });
  }, [beoPreviewEventId]);

  const openPrintView = () => {
    if (beoPreviewEventId) window.open(`/beo-print/${beoPreviewEventId}`, "_blank");
  };

  const open = Boolean(beoPreviewEventId);
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
      }}
      onClick={closeBeoPreview}
    >
      <div
        className="beo-preview-print-area"
        style={{
          background: "#0a0a0a",
          border: "2px solid rgba(255,51,51,0.3)",
          borderRadius: "12px",
          maxWidth: "800px",
          maxHeight: "90vh",
          overflow: "auto",
          padding: "24px",
          color: "#e0e0e0",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", color: "#ff3333" }}>BEO Preview</h2>
          <button
            type="button"
            onClick={closeBeoPreview}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              fontSize: "24px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
        {loading && <p style={{ color: "#aaa" }}>Loading event...</p>}
        {error && <p style={{ color: "#ef5350" }}>{error}</p>}
        {data && !loading && (
          <>
            <div style={{ marginBottom: "16px" }}>
              <strong style={{ color: "#888" }}>Event Name:</strong>{" "}
              {(data["Event Name"] ?? data["fldZuHc9D29Wcj60h"]) as string ?? "—"}
            </div>
            <div style={{ marginBottom: "16px" }}>
              <strong style={{ color: "#888" }}>Event Date:</strong>{" "}
              {data["Event Date"] ?? data["fldFYaE7hI27R3PsX"] ? new Date((data["Event Date"] ?? data["fldFYaE7hI27R3PsX"]) as string).toLocaleDateString() : "—"}
            </div>
            <div style={{ marginBottom: "16px" }}>
              <strong style={{ color: "#888" }}>Venue:</strong>{" "}
              {(data["Venue"] ?? data["fldtCOxi4Axjfjt0V"]) as string ?? "—"}
            </div>
            <div style={{ marginBottom: "16px" }}>
              <strong style={{ color: "#888" }}>Guest Count:</strong>{" "}
              {data["Guest Count"] ?? data["fldjgqDUxVxaJ7Y9V"] ?? "—"}
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
          <button
            type="button"
            onClick={openPrintView}
            style={{
              padding: "10px 20px",
              background: "linear-gradient(135deg, #cc0000, #ff3333)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Print BEO
          </button>
          <button
            type="button"
            onClick={closeBeoPreview}
            style={{
              padding: "10px 20px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "8px",
              color: "#e0e0e0",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
