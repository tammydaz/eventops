import { useState, useEffect } from "react";
import { useEventStore } from "../../state/eventStore";
import { DASHBOARD_CALENDAR_TO } from "../../lib/dashboardRoutes";
import { syncShadowToEvent } from "../../services/airtable/eventMenu";

type ShadowMenuRow = { id: string; section: string; catalogItemId: string | null; catalogItemName?: string };

type BeoIntakeActionBarProps = {
  eventId: string | null;
  isLocked?: boolean;
  onReopenRequest?: () => void;
  /** Show Send to BOH button (full intake only, when not locked) */
  onSendToBOH?: () => void;
  /** Current shadow menu rows — used to sync to Events before print when load returns 0 */
  shadowMenuRows?: ShadowMenuRow[];
};

export const BeoIntakeActionBar = ({ eventId, isLocked, onReopenRequest, onSendToBOH, shadowMenuRows }: BeoIntakeActionBarProps) => {
  const { setFields, saveCurrentEvent, saveError: storeSaveError, setSaveError: clearStoreError } = useEventStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Show store save errors (e.g. from Bar Service dropdown save)
  useEffect(() => {
    if (storeSaveError) setSaveError(storeSaveError);
  }, [storeSaveError]);

  const handleUpdate = async () => {
    if (!eventId) return;
    if (isLocked && onReopenRequest) {
      onReopenRequest();
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    const succeeded = await saveCurrentEvent(eventId);
    if (!succeeded) {
      const err = useEventStore.getState().saveError;
      setSaveError(err ?? "Failed to save");
    }
    setIsSaving(false);
    if (succeeded) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  const handleReadyForSpec = async () => {
    if (!eventId) return;
    if (isLocked && onReopenRequest) {
      onReopenRequest();
      return;
    }
    setIsSaving(true);
    
    // TODO: Add SPEC_READY field ID to FIELD_IDS in events.ts
    // For now, using a placeholder - update this with the actual field ID
    await setFields(eventId, { "fldSpecReady": true });
    
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handlePrintBeo = async () => {
    if (!eventId) return;
    if (isLocked && onReopenRequest) {
      onReopenRequest();
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    const ok = await saveCurrentEvent(eventId);
    if (!ok) {
      const err = useEventStore.getState().saveError;
      setSaveError(err ?? "Failed to save before opening BEO");
    } else {
      const injectedRows = (shadowMenuRows ?? [])
        .filter((r) => r.section && r.catalogItemId?.startsWith("rec"))
        .map((r) => ({ section: r.section, catalogItemId: r.catalogItemId! }));
      await syncShadowToEvent(eventId, injectedRows.length > 0 ? { injectedRows } : undefined);
      window.location.href = `/beo-print/${eventId}`;
    }
    setIsSaving(false);
  };

  const handleReturnToDashboard = () => {
    window.location.href = DASHBOARD_CALENDAR_TO;
  };

  if (!eventId) return null;

  return (
    <div className="beo-action-bar" style={styles.container}>
      <div style={styles.inner}>
        {saveError && (
          <div style={styles.errorBanner}>
            {saveError}
            <button type="button" onClick={() => { setSaveError(null); clearStoreError(null); }} style={styles.errorDismiss}>✕</button>
          </div>
        )}
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

        {onSendToBOH && !isLocked && (
          <button
            style={{
              ...styles.button,
              ...styles.buttonSendBOH,
              ...(isSaving ? styles.buttonDisabled : {}),
            }}
            onClick={onSendToBOH}
            disabled={isSaving}
          >
            Send to BOH
          </button>
        )}

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
  errorBanner: {
    position: "absolute",
    top: -44,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#b91c1c",
    color: "#fff",
    padding: "8px 36px 8px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  errorDismiss: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontSize: 16,
  },
  container: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: "rgba(10, 10, 15, 0.95)",
    borderTop: "1px solid rgba(204, 0, 0, 0.25)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.4)",
  },
  inner: {
    position: "relative",
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
    padding: "10px 20px",
    fontSize: "13px",
    fontWeight: "600",
    borderRadius: "8px",
    border: "1px solid transparent",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textTransform: "none",
    letterSpacing: "0.3px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    whiteSpace: "nowrap",
    minWidth: "140px",
  },
  buttonPrimary: {
    background: "linear-gradient(135deg, rgba(204, 0, 0, 0.2), rgba(204, 0, 0, 0.08))",
    color: "#ff6b6b",
    border: "1px solid rgba(204, 0, 0, 0.4)",
    boxShadow: "0 0 12px rgba(204, 0, 0, 0.1)",
  },
  buttonSpec: {
    background: "linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(234, 179, 8, 0.08))",
    color: "#fbbf24",
    border: "1px solid rgba(234, 179, 8, 0.4)",
    boxShadow: "0 0 12px rgba(234, 179, 8, 0.1)",
  },
  buttonSendBOH: {
    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.08))",
    color: "#22c55e",
    border: "1px solid rgba(34, 197, 94, 0.4)",
    boxShadow: "0 0 12px rgba(34, 197, 94, 0.1)",
  },
  buttonSecondary: {
    background: "linear-gradient(135deg, rgba(0, 188, 212, 0.12), rgba(0, 188, 212, 0.04))",
    color: "#4dd0e1",
    border: "1px solid rgba(0, 188, 212, 0.3)",
  },
  buttonBack: {
    background: "rgba(255, 255, 255, 0.04)",
    color: "rgba(255, 255, 255, 0.7)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};
