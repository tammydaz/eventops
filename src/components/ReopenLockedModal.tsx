import { useState } from "react";

type ReopenLockedModalProps = {
  open: boolean;
  onClose: () => void;
  eventName: string;
  onReopen: (initials: string) => void | Promise<void>;
};

export function ReopenLockedModal({
  open,
  onClose,
  eventName,
  onReopen,
}: ReopenLockedModalProps) {
  const [initials, setInitials] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"confirm" | "initials">("confirm");

  const handleReopen = async () => {
    if (!initials.trim()) return;
    setSubmitting(true);
    try {
      await onReopen(initials.trim());
      setInitials("");
      setStep("confirm");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setInitials("");
    setStep("confirm");
    onClose();
  };

  const handleYes = () => {
    setStep("initials");
  };

  if (!open) return null;

  return (
    <div
      className="reopen-locked-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reopen-locked-title"
    >
      <div
        className="reopen-locked-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="reopen-locked-header">
          <h2 id="reopen-locked-title">
            {step === "confirm" ? "Event Locked" : "Reopen for Editing"}
          </h2>
          <button
            type="button"
            className="reopen-locked-close"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="reopen-locked-event">{eventName}</p>

        {step === "confirm" ? (
          <>
            <p className="reopen-locked-message">
              This event is locked. Do you want to reopen it for editing?
            </p>
            <div className="reopen-locked-actions">
              <button
                type="button"
                className="reopen-locked-no"
                onClick={handleClose}
              >
                No
              </button>
              <button
                type="button"
                className="reopen-locked-yes"
                onClick={handleYes}
              >
                Yes
              </button>
            </div>
          </>
        ) : (
          <>
            <label htmlFor="reopen-locked-initials" className="reopen-locked-label">
              Initials
            </label>
            <input
              id="reopen-locked-initials"
              type="text"
              className="reopen-locked-initials"
              placeholder="e.g. JD"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 6))}
              maxLength={6}
              autoFocus
            />
            <div className="reopen-locked-actions">
              <button
                type="button"
                className="reopen-locked-cancel"
                onClick={() => setStep("confirm")}
              >
                Back
              </button>
              <button
                type="button"
                className="reopen-locked-confirm"
                onClick={handleReopen}
                disabled={!initials.trim() || submitting}
              >
                {submitting ? "Reopening…" : "Reopen"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
