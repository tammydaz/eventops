import { useState } from "react";

type SubmitChangeRequestModalProps = {
  open: boolean;
  onClose: () => void;
  eventName: string;
  onConfirm: (changeNotes: string) => void | Promise<void>;
};

export function SubmitChangeRequestModal({
  open,
  onClose,
  eventName,
  onConfirm,
}: SubmitChangeRequestModalProps) {
  const [changeNotes, setChangeNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(changeNotes.trim());
      setChangeNotes("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setChangeNotes("");
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="confirm-lock-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-change-request-title"
    >
      <div
        className="confirm-lock-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-lock-header">
          <h2 id="submit-change-request-title">Submit a Change Request</h2>
          <button
            type="button"
            className="confirm-lock-close"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="confirm-lock-event">{eventName}</p>
        <p className="confirm-lock-message">
          This will unlock the event and send a change request to BOH. Kitchen, Flair, and Delivery will see a warning and must confirm receipt before production resumes. Describe the change below.
        </p>
        <label htmlFor="submit-change-notes" className="confirm-lock-label">
          Describe the change
        </label>
        <textarea
          id="submit-change-notes"
          className="confirm-lock-initials"
          placeholder="e.g. Guest count increased from 100 to 120, added vegetarian option to Station 3"
          value={changeNotes}
          onChange={(e) => setChangeNotes(e.target.value)}
          rows={4}
          style={{ resize: "vertical", minHeight: 80, letterSpacing: "normal" }}
        />
        <div className="confirm-lock-actions">
          <button
            type="button"
            className="confirm-lock-cancel"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="confirm-lock-confirm"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit Change Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
