import "./ConfirmSendToBOHModal.css";

type UnsavedChangesModalProps = {
  open: boolean;
  onSave: () => void | Promise<void>;
  onDontSave: () => void;
  onCancel: () => void;
  /** Optional: "Switch event" vs "Leave page" */
  title?: string;
};

export function UnsavedChangesModal({
  open,
  onSave,
  onDontSave,
  onCancel,
  title = "Unsaved changes",
}: UnsavedChangesModalProps) {
  if (!open) return null;

  const handleSave = async () => {
    await onSave();
  };

  return (
    <div
      className="confirm-lock-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
    >
      <div
        className="confirm-lock-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-lock-header">
          <h2 id="unsaved-changes-title">{title}</h2>
          <button
            type="button"
            className="confirm-lock-close"
            onClick={onCancel}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
          Do you want to save your changes before leaving?
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            type="button"
            className="confirm-lock-btn confirm-lock-btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="confirm-lock-btn confirm-lock-btn-secondary"
            onClick={onDontSave}
          >
            Don&apos;t save
          </button>
          <button
            type="button"
            className="confirm-lock-btn confirm-lock-btn-primary"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
