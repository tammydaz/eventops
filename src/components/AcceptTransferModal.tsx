import { useState } from "react";

type AcceptTransferModalProps = {
  open: boolean;
  onClose: () => void;
  eventName: string;
  onAccept: (initials: string) => void | Promise<void>;
};

export function AcceptTransferModal({
  open,
  onClose,
  eventName,
  onAccept,
}: AcceptTransferModalProps) {
  const [initials, setInitials] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!initials.trim()) return;
    setSubmitting(true);
    try {
      await onAccept(initials.trim());
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
      className="accept-transfer-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="accept-transfer-title"
    >
      <div
        className="accept-transfer-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="accept-transfer-header">
          <h2 id="accept-transfer-title">Accept Transfer</h2>
          <button
            type="button"
            className="accept-transfer-close"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="accept-transfer-event">{eventName}</p>
        <label htmlFor="accept-transfer-initials" className="accept-transfer-label">
          Initials
        </label>
        <input
          id="accept-transfer-initials"
          type="text"
          className="accept-transfer-initials"
          placeholder="e.g. JD"
          value={initials}
          onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 6))}
          maxLength={6}
          autoFocus
        />
        <div className="accept-transfer-actions">
          <button
            type="button"
            className="accept-transfer-cancel"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="accept-transfer-confirm"
            onClick={handleAccept}
            disabled={!initials.trim() || submitting}
          >
            {submitting ? "Accepting…" : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
