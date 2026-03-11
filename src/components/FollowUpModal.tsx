import { useState } from "react";
import "./FollowUpModal.css";

export type FollowUpResult = {
  note?: string;
  markComplete: boolean;
  newDueDate?: string;
};

type FollowUpModalProps = {
  open: boolean;
  onClose: () => void;
  taskName: string;
  eventName?: string;
  currentDueDate: string;
  onSave: (result: FollowUpResult) => Promise<void>;
};

export function FollowUpModal({
  open,
  onClose,
  taskName,
  eventName,
  currentDueDate,
  onSave,
}: FollowUpModalProps) {
  const [note, setNote] = useState("");
  const [markComplete, setMarkComplete] = useState(false);
  const [newDueDate, setNewDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!markComplete && !newDueDate.trim()) {
      setError("Set a new due date or mark as complete.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSave({
        note: note.trim() || undefined,
        markComplete,
        newDueDate: newDueDate.trim() || undefined,
      });
      setNote("");
      setMarkComplete(false);
      setNewDueDate("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setNote("");
    setMarkComplete(false);
    setNewDueDate("");
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="follow-up-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="follow-up-modal-title"
    >
      <div className="follow-up-modal" onClick={(e) => e.stopPropagation()}>
        <div className="follow-up-header">
          <h2 id="follow-up-modal-title">Follow Up</h2>
          <button
            type="button"
            className="follow-up-close"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="follow-up-task">{taskName}</div>
        {eventName && (
          <div className="follow-up-event">Event: {eventName}</div>
        )}
        <div className="follow-up-due">Due: {currentDueDate || "—"}</div>

        <label className="follow-up-label">Add Note (saved to Event Notes)</label>
        <textarea
          className="follow-up-textarea"
          placeholder="Add a note…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />

        <div className="follow-up-options">
          <label className="follow-up-check">
            <input
              type="checkbox"
              checked={markComplete}
              onChange={(e) => setMarkComplete(e.target.checked)}
            />
            Mark task complete
          </label>
          {!markComplete && (
            <>
              <label className="follow-up-label">New follow-up date (required if not marking complete)</label>
              <input
                type="date"
                className="follow-up-date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </>
          )}
        </div>

        {error && <div className="follow-up-error">{error}</div>}

        <div className="follow-up-actions">
          <button type="button" className="follow-up-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            className="follow-up-confirm"
            onClick={handleSave}
            disabled={submitting || (!markComplete && !newDueDate.trim())}
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
