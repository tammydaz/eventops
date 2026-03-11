import { useState } from "react";
import "./MissingFieldsModal.css";

type MissingFieldsModalProps = {
  open: boolean;
  onClose: () => void;
  missingFields: { fieldId: string; label: string }[];
  onConfirm: (dueDate: string) => Promise<void>;
};

export function MissingFieldsModal({
  open,
  onClose,
  missingFields,
  onConfirm,
}: MissingFieldsModalProps) {
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!dueDate.trim()) {
      setError("Due date is required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(dueDate.trim());
      setDueDate("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create tasks");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setDueDate("");
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="missing-fields-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="missing-fields-title"
    >
      <div className="missing-fields-modal" onClick={(e) => e.stopPropagation()}>
        <div className="missing-fields-header">
          <h2 id="missing-fields-title">Cannot Complete BEO</h2>
          <button type="button" className="missing-fields-close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="missing-fields-message">
          The following required fields are empty. Please fill them before sending to BOH, or create follow-up tasks.
        </p>
        <ul className="missing-fields-list">
          {missingFields.map(({ label }) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
        <label className="missing-fields-label">
          Due date for follow-up tasks (required)
        </label>
        <input
          type="date"
          className="missing-fields-date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        {error && <div className="missing-fields-error">{error}</div>}
        <div className="missing-fields-actions">
          <button type="button" className="missing-fields-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            className="missing-fields-confirm"
            onClick={handleConfirm}
            disabled={submitting || !dueDate.trim()}
          >
            {submitting ? "Creating…" : "Create Tasks & Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
