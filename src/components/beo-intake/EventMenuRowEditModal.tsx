/**
 * EventMenuRowEditModal — edit customText, sauceOverride for an Event Menu row.
 * Child overrides shown as read-only summary; full editor TBD.
 */
import { useState, useEffect } from "react";
import { inputStyle, labelStyle } from "./FormSection";
import {
  updateEventMenuRow,
  deleteEventMenuRow,
  syncShadowToEvent,
  type EventMenuRow,
  type UpdateEventMenuRowPatch,
} from "../../services/airtable/eventMenu";
import { isErrorResult } from "../../services/airtable/selectors";

type EventMenuRowEditModalProps = {
  open: boolean;
  row: EventMenuRow & { catalogItemName: string } | null;
  eventId: string | null;
  onClose: () => void;
  onSaved: () => void;
  canEdit: boolean;
};

const SAUCE_OPTIONS = ["Default", "None", "Other"];

export function EventMenuRowEditModal({
  open,
  row,
  eventId,
  onClose,
  onSaved,
  canEdit,
}: EventMenuRowEditModalProps) {
  const [customText, setCustomText] = useState("");
  const [sauceOverride, setSauceOverride] = useState<string | null>(null);
  const [customSauce, setCustomSauce] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (row) {
      setCustomText(row.customText ?? "");
      const so = row.sauceOverride?.trim();
      if (so && !SAUCE_OPTIONS.includes(so)) {
        setSauceOverride("Other");
        setCustomSauce(so);
      } else {
        setSauceOverride(so || "Default");
        setCustomSauce("");
      }
    }
  }, [row]);

  if (!open) return null;

  const displayName = row?.customText?.trim() || row?.catalogItemName || "—";

  const handleSave = async () => {
    if (!row?.id || !eventId || !canEdit) return;
    setIsSaving(true);
    setError(null);
    const patch: UpdateEventMenuRowPatch = {
      customText: customText.trim() || null,
      sauceOverride:
        sauceOverride === "Other"
          ? (customSauce.trim() || null)
          : sauceOverride === "Default" || sauceOverride === "None"
            ? sauceOverride
            : null,
    };
    const result = await updateEventMenuRow(row.id, patch);
    if (isErrorResult(result)) {
      setError(result.message ?? "Failed to save");
      setIsSaving(false);
      return;
    }
    await syncShadowToEvent(eventId);
    onSaved();
    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!row?.id || !eventId || !canEdit) return;
    if (!window.confirm(`Remove "${displayName}" from the menu?`)) return;
    setIsDeleting(true);
    setError(null);
    const result = await deleteEventMenuRow(row.id);
    if (isErrorResult(result)) {
      setError(result.message ?? "Failed to delete");
      setIsDeleting(false);
      return;
    }
    await syncShadowToEvent(eventId);
    onSaved();
    setIsDeleting(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-menu-row-edit-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #444",
          borderRadius: 12,
          padding: 24,
          minWidth: 360,
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="event-menu-row-edit-title" style={{ margin: "0 0 16px", fontSize: 18, color: "#fff" }}>
          Edit menu item
        </h2>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#aaa" }}>
          {row?.catalogItemName || "—"}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Custom display text (overrides catalog name)</label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              disabled={!canEdit}
              placeholder={row?.catalogItemName ?? ""}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Sauce override</label>
            <select
              value={sauceOverride ?? "Default"}
              onChange={(e) => setSauceOverride(e.target.value || null)}
              disabled={!canEdit}
              style={inputStyle}
            >
              <option value="Default">Default</option>
              <option value="None">None</option>
              <option value="Other">Other…</option>
            </select>
            {(sauceOverride === "Other") && (
              <input
                type="text"
                value={customSauce}
                onChange={(e) => setCustomSauce(e.target.value)}
                disabled={!canEdit}
                placeholder="Enter sauce name"
                style={{ ...inputStyle, marginTop: 8 }}
              />
            )}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: 10, background: "rgba(220,38,38,0.2)", borderRadius: 6, color: "#fca5a5", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canEdit || isDeleting}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #dc2626",
              background: "rgba(220,38,38,0.2)",
              color: "#f87171",
              fontSize: 13,
              fontWeight: 600,
              cursor: canEdit && !isDeleting ? "pointer" : "not-allowed",
              opacity: canEdit && !isDeleting ? 1 : 0.5,
            }}
          >
            {isDeleting ? "Removing…" : "Remove"}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #444",
                background: "transparent",
                color: "#aaa",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canEdit || isSaving}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #00bcd4",
                background: "rgba(0,188,212,0.2)",
                color: "#00bcd4",
                fontSize: 13,
                fontWeight: 600,
                cursor: canEdit && !isSaving ? "pointer" : "not-allowed",
                opacity: canEdit && !isSaving ? 1 : 0.5,
              }}
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
