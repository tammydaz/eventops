import { useState, useCallback, useEffect } from "react";
import { useAuthStore } from "../../state/authStore";
import { useEventStore } from "../../state/eventStore";

type EventActionButtonProps = {
  label: string;
  allowedRoles: string[];
  updates: Record<string, unknown>;
  eventId: string;
};

export function EventActionButton({ label, allowedRoles, updates, eventId }: EventActionButtonProps) {
  const { user } = useAuthStore();
  const { setFields, loadEventData } = useEventStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const role = user?.role ?? null;
  const isAuthorized = role && allowedRoles.includes(role);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.type === "success" ? 2500 : 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleClick = useCallback(async () => {
    if (!eventId || !isAuthorized) return;
    setLoading(true);
    setToast(null);
    setSuccess(false);
    const ok = await setFields(eventId, updates);
    setLoading(false);
    if (ok) {
      setSuccess(true);
      loadEventData();
      setToast({ type: "success", message: "Saved successfully" });
      setTimeout(() => setSuccess(false), 2500);
    } else {
      setToast({ type: "error", message: "Failed to save" });
    }
  }, [eventId, isAuthorized, updates, setFields, loadEventData]);

  if (!isAuthorized) return null;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            border: "1px solid #444",
            backgroundColor: success ? "#166534" : loading ? "#374151" : "#1f2937",
            color: "#e0e0e0",
            fontSize: "14px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
            width: "100%",
            maxWidth: "320px",
          }}
        >
          {loading ? "..." : success ? "✓ Done" : label}
        </button>
      </div>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            backgroundColor: toast.type === "success" ? "#166534" : "#b91c1c",
            color: "#fff",
          }}
        >
          {toast.type === "success" ? "✓ " : "✗ "}{toast.message}
        </div>
      )}
    </>
  );
}
