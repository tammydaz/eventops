import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../../state/authStore";
import {
  listFeedback,
  resolveFeedback,
  createFeedback,
  FEEDBACK_LABELS,
  type FeedbackRecord,
  type FeedbackType,
} from "../../services/feedbackApi";

function formatDate(s?: string): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

interface FeedbackHubPanelProps {
  onClose: () => void;
}

export default function FeedbackHubPanel({ onClose }: FeedbackHubPanelProps) {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [resolveModalId, setResolveModalId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("issue");
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === "ops_admin";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await listFeedback();
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setRecords(result.records || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    const result = await resolveFeedback(id, resolveNote);
    setResolvingId(null);
    setResolveModalId(null);
    setResolveNote("");
    if (result.error) setError(result.error);
    else load();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = message.trim();
    if (!msg) return;
    setSubmitting(true);
    const result = await createFeedback({
      type: feedbackType,
      screen: "Dashboard",
      url: window.location.href,
      message: msg,
    });
    setSubmitting(false);
    if (result.error) setError(result.error);
    else {
      setMessage("");
      load();
    }
  };

  const openItems = records.filter((r) => r.status === "open");
  const resolvedItems = records.filter((r) => r.status === "resolved");

  return (
    <>
      <div className="dp-feedback-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="dp-feedback-panel" onClick={(e) => e.stopPropagation()}>
        <div className="dp-feedback-header">
          <h3>Suggestions / Questions / Bugs</h3>
          <p className="dp-feedback-sub">Who added it · What · When · Check when addressed</p>
          <button type="button" className="dp-feedback-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Add form */}
        <form className="dp-feedback-form" onSubmit={handleSubmit}>
          <div className="dp-feedback-form-row">
            <select
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
              className="dp-feedback-select"
            >
              <option value="issue">Issue</option>
              <option value="idea">Suggestion / Idea</option>
              <option value="bug">Bug</option>
              <option value="recommendation">Recommendation</option>
            </select>
            <input
              type="text"
              placeholder="Type your suggestion, question, or bug…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="dp-feedback-input"
              disabled={submitting}
            />
            <button type="submit" className="dp-feedback-submit" disabled={!message.trim() || submitting}>
              {submitting ? "…" : "Add"}
            </button>
          </div>
        </form>

        {error && <div className="dp-feedback-error">{error}</div>}

        <div className="dp-feedback-log">
          {loading ? (
            <p className="dp-feedback-loading">Loading…</p>
          ) : records.length === 0 ? (
            <p className="dp-feedback-empty">No entries yet. Add one above.</p>
          ) : (
            <>
              {openItems.length > 0 && (
                <section className="dp-feedback-section">
                  <h4>Open ({openItems.length})</h4>
                  {openItems.map((r) => (
                    <LogEntry
                      key={r.id}
                      record={r}
                      isAdmin={isAdmin}
                      onResolve={isAdmin ? () => setResolveModalId(r.id) : undefined}
                      resolving={resolvingId === r.id}
                    />
                  ))}
                </section>
              )}
              {resolvedItems.length > 0 && (
                <section className="dp-feedback-section">
                  <h4>Addressed ({resolvedItems.length})</h4>
                  {resolvedItems.map((r) => (
                    <LogEntry key={r.id} record={r} isAdmin={isAdmin} resolved />
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {resolveModalId && (
        <div
          className="feedback-modal-backdrop"
          style={{ zIndex: 10004 }}
          onClick={() => setResolveModalId(null)}
        >
          <div
            className="feedback-modal"
            style={{ minWidth: 360 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Mark as addressed</h3>
            <textarea
              placeholder="What was fixed / resolution note (optional)"
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              rows={3}
              className="feedback-modal-textarea"
            />
            <div className="feedback-modal-actions">
              <button type="button" className="feedback-modal-cancel" onClick={() => setResolveModalId(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="feedback-modal-submit"
                onClick={() => resolveModalId && handleResolve(resolveModalId)}
                disabled={resolvingId !== null}
              >
                {resolvingId ? "…" : "Check ✓"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LogEntry({
  record,
  isAdmin,
  onResolve,
  resolving,
  resolved,
}: {
  record: FeedbackRecord;
  isAdmin: boolean;
  onResolve?: () => void;
  resolving?: boolean;
  resolved?: boolean;
}) {
  const typeLabel = FEEDBACK_LABELS[record.type as FeedbackType] || record.type;
  return (
    <div className={`dp-feedback-entry ${resolved ? "resolved" : ""}`}>
      <div className="dp-feedback-entry-row">
        <div className="dp-feedback-entry-body">
          <div className="dp-feedback-entry-meta">
            <span className="dp-feedback-entry-type">{typeLabel}</span>
            <span className="dp-feedback-entry-who">{record.userName}</span>
            <span className="dp-feedback-entry-when">{formatDate(record.createdTime)}</span>
            {resolved && (
              <span className="dp-feedback-entry-status">
                ✓ Addressed {record.resolvedAt && formatDate(record.resolvedAt)}
              </span>
            )}
          </div>
          <p className="dp-feedback-entry-msg">{record.message}</p>
          {resolved && record.resolutionNote && (
            <p className="dp-feedback-entry-note">→ {record.resolutionNote}</p>
          )}
        </div>
        {onResolve && !resolved && (
          <button
            type="button"
            className="dp-feedback-check-btn"
            onClick={onResolve}
            disabled={resolving}
            title="Mark as addressed"
          >
            {resolving ? "…" : "☐ Check"}
          </button>
        )}
      </div>
    </div>
  );
}
