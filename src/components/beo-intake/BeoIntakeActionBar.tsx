import { useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";

type BeoIntakeActionBarProps = {
  eventId: string | null;
};

export const BeoIntakeActionBar = ({ eventId }: BeoIntakeActionBarProps) => {
  const { setFields } = useEventStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpdate = async () => {
    if (!eventId) return;
    setIsSaving(true);
    
    // Trigger a save - in practice, fields are already saved instantly
    // This provides user feedback that changes are persisted
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleReadyForSpec = async () => {
    if (!eventId) return;
    setIsSaving(true);
    
    // TODO: Add SPEC_READY field ID to FIELD_IDS in events.ts
    // For now, using a placeholder - update this with the actual field ID
    await setFields(eventId, { "fldSpecReady": true });
    
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handlePrintBeo = () => {
    if (!eventId) return;
    window.location.href = `/beo-print/${eventId}`;
  };

  const handleReturnToDashboard = () => {
    window.location.href = "/";
  };

  if (!eventId) return null;

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <button
          style={{
            ...styles.button,
            ...styles.buttonPrimary,
            ...(isSaving ? styles.buttonDisabled : {}),
          }}
          onClick={handleUpdate}
          disabled={isSaving}
        >
          {showSuccess ? "Saved ✓" : isSaving ? "Saving..." : "Update Event"}
        </button>

        <button
          style={{
            ...styles.button,
            ...styles.buttonSpec,
            ...(isSaving ? styles.buttonDisabled : {}),
          }}
          onClick={handleReadyForSpec}
          disabled={isSaving}
        >
          Ready for Spec
        </button>

        <button
          style={{
            ...styles.button,
            ...styles.buttonSecondary,
          }}
          onClick={handlePrintBeo}
        >
          Print / View BEO
        </button>

        <button
          style={{
            ...styles.button,
            ...styles.buttonBack,
          }}
          onClick={handleReturnToDashboard}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: "rgba(0, 0, 0, 0.95)",
    borderTop: "3px solid #ff3333",
    backdropFilter: "blur(10px)",
    boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.5)",
  },
  inner: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "16px 20px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  button: {
    padding: "12px 24px",
    fontSize: "13px",
    fontWeight: "700",
    borderRadius: "8px",
    border: "2px solid transparent",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    whiteSpace: "nowrap",
    minWidth: "160px",
  },
  buttonPrimary: {
    background: "linear-gradient(135deg, #ff3333, #cc0000)",
    color: "#fff",
    border: "2px solid #ff3333",
    boxShadow: "0 4px 15px rgba(255, 51, 51, 0.3)",
  },
  buttonSpec: {
    background: "linear-gradient(135deg, #ffc107, #ff9800)",
    color: "#000",
    border: "2px solid #ffc107",
    boxShadow: "0 4px 15px rgba(255, 193, 7, 0.3)",
  },
  buttonSecondary: {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
    color: "#fff",
    border: "2px solid rgba(255, 255, 255, 0.2)",
  },
  buttonBack: {
    background: "transparent",
    color: "#888",
    border: "2px solid #444",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};
