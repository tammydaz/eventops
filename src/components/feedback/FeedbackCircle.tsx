import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../../state/authStore";
import {
  listFeedback,
  resolveFeedback,
  createFeedback,
  FEEDBACK_LABELS,
  type FeedbackRecord,
  type FeedbackType,
} from "../../services/feedbackApi";
import { useFeedback } from "./FeedbackContext";

const SCREEN_NAMES: Record<string, string> = {
  "/": "Dashboard",
  "/home": "Dashboard",
  "/beo-intake": "BEO Intake",
  "/foh": "FOH Landing",
  "/watchtower": "Today's tasks",
  "/invoice-intake": "Invoice Intake",
  "/kitchen-prep": "Kitchen Prep",
  "/delivery-command": "Delivery Command",
  "/beo-print": "BEO Print",
  "/spec-engine": "Spec Engine",
  "/profit": "Profit",
  "/health": "Health",
};

function getScreenName(pathname: string): string {
  const sorted = Object.entries(SCREEN_NAMES).sort((a, b) => b[0].length - a[0].length);
  for (const [path, name] of sorted) {
    if (pathname === path || (path !== "/" && pathname.startsWith(path))) return name;
  }
  return pathname || "Unknown";
}

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

export default function FeedbackCircle() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const { openSubmitModal } = useFeedback();
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [resolveModalId, setResolveModalId] = useState<string | null>(null);
  const [quickMessage, setQuickMessage] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  const isAdmin = user?.role === "ops_admin";
  const screenName = getScreenName(pathname);

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
    if (open) load();
  }, [open, load]);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    const result = await resolveFeedback(id, resolveNote);
    setResolvingId(null);
    setResolveModalId(null);
    setResolveNote("");
    if (result.error) setError(result.error);
    else load();
  };

  const handleQuickSubmit = async () => {
    const msg = quickMessage.trim();
    if (!msg) return;
    setQuickSubmitting(true);
    const result = await createFeedback({
      type: "issue",
      screen: screenName,
      url: window.location.href,
      message: msg,
    });
    setQuickSubmitting(false);
    if (result.error) setError(result.error);
    else {
      setQuickMessage("");
      load();
    }
  };

  const openItems = records.filter((r) => r.status === "open");
  const resolvedItems = records.filter((r) => r.status === "resolved");

  return (
    <>
      {/* Floating circle — always visible, no permissions needed */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="feedback-circle-btn no-print"
        aria-label="Open feedback & issues"
        title="Questions, issues & ideas — everyone can see"
      >
        <span className="feedback-circle-icon">💬</span>
        {openItems.length > 0 && (
          <span className="feedback-circle-badge">{openItems.length}</span>
        )}
      </button>

      {/* Slide-out panel */}
      {open && (
        <>
          <div
            className="feedback-circle-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="feedback-circle-panel no-print">
            <div className="feedback-circle-panel-header">
              <h3>Questions & Issues</h3>
              <p className="feedback-circle-panel-sub">Everyone sees everything — transparent</p>
              <button
                type="button"
                className="feedback-circle-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Quick report — no need to leave the page */}
            <div className="feedback-circle-quick">
              <p className="feedback-circle-quick-label">
                Report from <strong>{screenName}</strong> — right here
              </p>
              <div className="feedback-circle-quick-row">
                <input
                  type="text"
                  placeholder="Type your question or issue…"
                  value={quickMessage}
                  onChange={(e) => setQuickMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickSubmit()}
                  disabled={quickSubmitting}
                />
                <button
                  type="button"
                  onClick={handleQuickSubmit}
                  disabled={!quickMessage.trim() || quickSubmitting}
                >
                  {quickSubmitting ? "…" : "Send"}
                </button>
              </div>
              <button
                type="button"
                className="feedback-circle-more"
                onClick={() => openSubmitModal?.("issue")}
              >
                Or right-click anywhere → Report Issue / Bug / Idea
              </button>
            </div>

            {error && (
              <div className="feedback-circle-error">{error}</div>
            )}

            <div className="feedback-circle-list">
              {loading ? (
                <p className="feedback-circle-loading">Loading…</p>
              ) : records.length === 0 ? (
                <p className="feedback-circle-empty">No feedback yet. Add one above or right-click anywhere.</p>
              ) : (
                <>
                  {openItems.length > 0 && (
                    <section>
                      <h4>Open ({openItems.length})</h4>
                      {openItems.map((r) => (
                        <IssueCard
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
                    <section>
                      <h4>Resolved ({resolvedItems.length})</h4>
                      {resolvedItems.map((r) => (
                        <IssueCard key={r.id} record={r} isAdmin={isAdmin} resolved />
                      ))}
                    </section>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Resolve modal */}
      {resolveModalId && (
        <div
          className="feedback-modal-backdrop"
          style={{ zIndex: 10002 }}
          onClick={() => setResolveModalId(null)}
        >
          <div
            className="feedback-modal"
            style={{ minWidth: 360 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Mark resolved</h3>
            <textarea
              placeholder="Resolution note (optional)"
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
                {resolvingId ? "…" : "Resolve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function IssueCard({
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
    <div className={`feedback-circle-card ${resolved ? "resolved" : ""}`}>
      <div className="feedback-circle-card-row">
        <div className="feedback-circle-card-body">
          <div className="feedback-circle-card-meta">
            <span className="feedback-circle-card-type">{typeLabel}</span>
            <span className="feedback-circle-card-screen">{record.screen}</span>
            {resolved && <span className="feedback-circle-card-status">✓ Resolved</span>}
          </div>
          <p className="feedback-circle-card-msg">{record.message}</p>
          <div className="feedback-circle-card-by">
            {record.userName}
            {isAdmin && record.userEmail && ` · ${record.userEmail}`}
            {" · "}
            {formatDate(record.createdTime)}
            {resolved && record.resolvedBy && (
              <> · Resolved by {record.resolvedBy} {record.resolvedAt && formatDate(record.resolvedAt)}</>
            )}
          </div>
          {resolved && record.resolutionNote && (
            <p className="feedback-circle-card-note">{record.resolutionNote}</p>
          )}
        </div>
        {onResolve && !resolved && (
          <button
            type="button"
            className="feedback-circle-resolve-btn"
            onClick={onResolve}
            disabled={resolving}
          >
            {resolving ? "…" : "Resolve"}
          </button>
        )}
      </div>
    </div>
  );
}
