import { useState } from "react";
import "./ConfirmSendToBOHModal.css";

type ConfirmSendToBOHModalProps = {
  open: boolean;
  onClose: () => void;
  eventName: string;
  onConfirm: (initials: string) => void | Promise<void>;
};

export function ConfirmSendToBOHModal({
  open,
  onClose,
  eventName,
  onConfirm,
}: ConfirmSendToBOHModalProps) {
  const [initials, setInitials] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!initials.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm(initials.trim());
      setInitials("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setInitials("");
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="confirm-lock-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-send-boh-title"
    >
      <div
        className="confirm-lock-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-lock-header">
          <h2 id="confirm-send-boh-title">Send to BOH</h2>
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
          This will send the event to BOH departments (Kitchen, Flair, Delivery) and the event will be locked. Enter your initials to confirm.
        </p>
        <label htmlFor="confirm-send-boh-initials" className="confirm-lock-label">
          Initials
        </label>
        <input
          id="confirm-send-boh-initials"
          type="text"
          className="confirm-lock-initials"
          placeholder="e.g. JD"
          value={initials}
          onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 6))}
          maxLength={6}
          autoFocus
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
            disabled={!initials.trim() || submitting}
          >
            {submitting ? "Sending…" : "Send to BOH"}
          </button>
        </div>
      </div>
    </div>
  );
}
