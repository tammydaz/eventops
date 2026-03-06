import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../state/authStore";
import {
  listFeedback,
  resolveFeedback,
  FEEDBACK_LABELS,
  type FeedbackRecord,
  type FeedbackType,
} from "../services/feedbackApi";

function formatDate(s?: string): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

export default function FeedbackIssuesPage() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [resolveModalId, setResolveModalId] = useState<string | null>(null);
  const [newlyResolvedCount, setNewlyResolvedCount] = useState(0);

  const isAdmin = user?.role === "ops_admin";

  const load = async () => {
    setLoading(true);
    setError(null);
    const result = await listFeedback();
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setRecords(result.records || []);
  };

  useEffect(() => {
    load();
  }, []);

  // Track newly resolved issues for notification
  useEffect(() => {
    const lastSeen = localStorage.getItem("feedback-last-seen-resolved");
    const resolved = records.filter((r) => r.status === "resolved");
    if (lastSeen && resolved.length > 0) {
      const lastSeenTime = new Date(lastSeen).getTime();
      const newlyResolved = resolved.filter(
        (r) => r.resolvedAt && new Date(r.resolvedAt).getTime() > lastSeenTime
      );
      setNewlyResolvedCount(newlyResolved.length);
    } else {
      setNewlyResolvedCount(0);
    }
    // Update last seen when user visits (so next time we know what's "new")
    localStorage.setItem("feedback-last-seen-resolved", new Date().toISOString());
  }, [records]);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    const result = await resolveFeedback(id, resolveNote);
    setResolvingId(null);
    setResolveModalId(null);
    setResolveNote("");
    if (result.error) {
      setError(result.error);
      return;
    }
    load();
  };

  const open = records.filter((r) => r.status === "open");
  const resolved = records.filter((r) => r.status === "resolved");

  return (
    <div className="feedback-issues-page" style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            to="/"
            style={{ color: "#94a3b8", textDecoration: "none", fontSize: 14 }}
          >
            ← Dashboard
          </Link>
          <h1 style={{ margin: 0, fontSize: 22, color: "#e2e8f0" }}>
            {isAdmin ? "All Feedback & Issues" : "My Issues"}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            background: "#334155",
            border: "1px solid #475569",
            borderRadius: 6,
            color: "#e2e8f0",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {newlyResolvedCount > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #22c55e22, #16a34a22)",
            border: "1px solid #22c55e66",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 20,
            color: "#86efac",
          }}
        >
          ✓ {newlyResolvedCount} issue{newlyResolvedCount !== 1 ? "s" : ""} resolved since your last visit
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#7f1d1d33",
            border: "1px solid #ef444466",
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
            color: "#fca5a5",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Loading…</p>
      ) : records.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>
          No feedback yet. Right-click anywhere to report an issue, idea, or bug.
        </p>
      ) : (
        <>
          {open.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 16, color: "#a78bfa", marginBottom: 12 }}>
                Open ({open.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {open.map((r) => (
                  <IssueCard
                    key={r.id}
                    record={r}
                    isAdmin={isAdmin}
                    onResolve={isAdmin ? () => setResolveModalId(r.id) : undefined}
                    resolving={resolvingId === r.id}
                  />
                ))}
              </div>
            </section>
          )}

          {resolved.length > 0 && (
            <section>
              <h2 style={{ fontSize: 16, color: "#22c55e", marginBottom: 12 }}>
                Resolved ({resolved.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {resolved.map((r) => (
                  <IssueCard key={r.id} record={r} isAdmin={isAdmin} resolved />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {resolveModalId && (
        <div
          className="feedback-modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => setResolveModalId(null)}
        >
          <div
            style={{
              background: "#1e1e1e",
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: "90%",
              border: "1px solid #444",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 12px", color: "#e2e8f0" }}>Resolve issue</h3>
            <textarea
              placeholder="Resolution note (optional)"
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #444",
                background: "#0f0f0f",
                color: "#e2e8f0",
                marginBottom: 16,
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setResolveModalId(null)}
                style={{
                  padding: "8px 16px",
                  background: "#333",
                  border: "none",
                  borderRadius: 8,
                  color: "#e2e8f0",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => resolveModalId && handleResolve(resolveModalId)}
                disabled={resolvingId !== null}
                style={{
                  padding: "8px 16px",
                  background: "#22c55e",
                  border: "none",
                  borderRadius: 8,
                  color: "#111",
                  fontWeight: 600,
                  cursor: resolvingId ? "wait" : "pointer",
                }}
              >
                {resolvingId ? "Resolving…" : "Mark Resolved"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
    <div
      style={{
        background: resolved ? "#0f0f0f" : "#1a1a1a",
        border: `1px solid ${resolved ? "#22c55e44" : "#444"}`,
        borderRadius: 8,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#a78bfa",
                textTransform: "uppercase",
              }}
            >
              {typeLabel}
            </span>
            <span style={{ fontSize: 12, color: "#64748b" }}>·</span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{record.screen}</span>
            {resolved && (
              <span
                style={{
                  fontSize: 11,
                  color: "#22c55e",
                  fontWeight: 600,
                }}
              >
                ✓ Resolved
              </span>
            )}
          </div>
          <p style={{ margin: "0 0 8px", color: "#e2e8f0", fontSize: 14, lineHeight: 1.5 }}>
            {record.message}
          </p>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            {record.userName}
            {isAdmin && record.userEmail && ` · ${record.userEmail}`}
            {" · "}
            {formatDate(record.createdTime)}
            {resolved && record.resolvedBy && (
              <> · Resolved by {record.resolvedBy} {record.resolvedAt && formatDate(record.resolvedAt)}</>
            )}
          </div>
          {resolved && record.resolutionNote && (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#86efac" }}>
              {record.resolutionNote}
            </p>
          )}
        </div>
        {onResolve && !resolved && (
          <button
            type="button"
            onClick={onResolve}
            disabled={resolving}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              background: "#22c55e",
              border: "none",
              borderRadius: 6,
              color: "#111",
              fontWeight: 600,
              cursor: resolving ? "wait" : "pointer",
              flexShrink: 0,
            }}
          >
            {resolving ? "…" : "Resolve"}
          </button>
        )}
      </div>
    </div>
  );
}
