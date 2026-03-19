import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { loadEventsWithExceptionsForRange, type OpsChiefExceptionItem } from "../services/airtable/events";
import { isErrorResult } from "../services/airtable/selectors";

const STORAGE_KEY = "ops-chief-exceptions-done";

function getStoredDone(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) ?? {};
  } catch {
    return {};
  }
}

function setStoredDone(map: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

function doneKey(item: OpsChiefExceptionItem): string {
  return `${item.id}_${item.eventDate}`;
}

function getStartEnd(view: "day" | "week" | "month", baseDate: Date): { start: string; end: string } {
  const y = baseDate.getFullYear();
  const m = baseDate.getMonth();
  const d = baseDate.getDate();
  if (view === "day") {
    const s = new Date(y, m, d);
    return {
      start: s.toISOString().slice(0, 10),
      end: s.toISOString().slice(0, 10),
    };
  }
  if (view === "week") {
    const dayOfWeek = baseDate.getDay();
    const startOfWeek = new Date(y, m, d - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    return {
      start: startOfWeek.toISOString().slice(0, 10),
      end: endOfWeek.toISOString().slice(0, 10),
    };
  }
  const startOfMonth = new Date(y, m, 1);
  const endOfMonth = new Date(y, m + 1, 0);
  return {
    start: startOfMonth.toISOString().slice(0, 10),
    end: endOfMonth.toISOString().slice(0, 10),
  };
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    background: "linear-gradient(135deg, rgba(234, 179, 8, 0.08), rgba(234, 179, 8, 0.02))",
    border: "1px solid rgba(234, 179, 8, 0.3)",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  title: { fontSize: "18px", fontWeight: 700, margin: 0, color: "#e0e0e0" },
  controls: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", marginBottom: "16px" },
  segment: {
    display: "flex",
    gap: "4px",
    background: "#1e1e1e",
    padding: "4px",
    borderRadius: "8px",
    border: "1px solid #333",
  },
  segmentBtn: {
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: 600,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    background: "transparent",
    color: "#94a3b8",
  },
  segmentBtnActive: { background: "#eab308", color: "#0a0a0a" },
  dateInput: {
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #444",
    borderRadius: "8px",
    background: "#1e1e1e",
    color: "#e0e0e0",
  },
  loadBtn: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: 600,
    background: "#eab308",
    color: "#0a0a0a",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  deliveryHint: {
    padding: "10px 12px",
    marginBottom: "12px",
    borderRadius: "8px",
    background: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    fontSize: "13px",
    color: "#86efac",
  },
  card: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "14px",
    marginBottom: "10px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "8px",
  },
  checkbox: { width: 20, height: 20, cursor: "pointer", accentColor: "#eab308" },
  eventName: { fontWeight: 700, fontSize: "14px", color: "#e0e0e0" },
  meta: { fontSize: "12px", color: "#94a3b8", marginLeft: "30px" },
  notes: { fontSize: "12px", color: "#a0a0a0", marginTop: "8px", marginLeft: "30px", whiteSpace: "pre-wrap" },
  noteLabel: { color: "#eab308", fontWeight: 600, marginRight: "6px" },
  error: { color: "#f87171", fontSize: "13px" },
};

export function OpsChiefExceptionsView() {
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [baseDate, setBaseDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<OpsChiefExceptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>(getStoredDone);

  const load = useCallback(async () => {
    const d = new Date(baseDate + "T12:00:00");
    const { start, end } = getStartEnd(view, d);
    setLoading(true);
    setError(null);
    const result = await loadEventsWithExceptionsForRange(start, end);
    setLoading(false);
    if (isErrorResult(result)) {
      setError(result.message ?? "Failed to load");
      setItems([]);
      return;
    }
    setItems(result);
  }, [view, baseDate]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleDone = useCallback((item: OpsChiefExceptionItem) => {
    const key = doneKey(item);
    setDone((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setStoredDone(next);
      return next;
    });
  }, []);

  const deliveriesInPeriod = items.filter(
    (e) => e.eventType && (e.eventType.toLowerCase().includes("delivery") || e.eventType.toLowerCase().includes("pickup"))
  );

  return (
    <section style={styles.section}>
      <div style={styles.header}>
        <h2 style={styles.title}>⚠️ Exceptions & Special Instructions</h2>
        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
          Full-service special orders · Check off when handled · Use delivery hint to coordinate pickups
        </span>
      </div>
      <div style={styles.controls}>
        <div style={styles.segment}>
          {(["day", "week", "month"] as const).map((v) => (
            <button
              key={v}
              type="button"
              style={{ ...styles.segmentBtn, ...(view === v ? styles.segmentBtnActive : {}) }}
              onClick={() => setView(v)}
            >
              {v === "day" ? "Day" : v === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={baseDate}
          onChange={(e) => setBaseDate(e.target.value)}
          style={styles.dateInput}
        />
        <button type="button" onClick={load} disabled={loading} style={styles.loadBtn}>
          {loading ? "Loading…" : "Load"}
        </button>
        {error && <span style={styles.error}>{error}</span>}
      </div>

      {deliveriesInPeriod.length > 0 && (
        <div style={styles.deliveryHint}>
          <strong>Same-period deliveries / vans:</strong>{" "}
          {deliveriesInPeriod.map((e) => `${e.eventName} (${e.eventDate} ${e.dispatchTimeDisplay})`).join(" · ")}
          {" — "}Consider combining pickups or items with these runs when possible.
        </div>
      )}

      {items.length === 0 && !loading && !error && (
        <p style={{ color: "#94a3b8", fontSize: 14 }}>No events in this range. Change date or view and Load.</p>
      )}

      {items.map((item) => {
        const key = doneKey(item);
        const isDone = done[key];
        const showNotes = item.hasAnyNote;
        return (
          <div key={item.id} style={{ ...styles.card, opacity: isDone ? 0.7 : 1 }}>
            <div style={styles.cardHeader}>
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => toggleDone(item)}
                style={styles.checkbox}
                title={isDone ? "Mark not done" : "Mark done"}
              />
              <span style={styles.eventName}>{item.eventName}</span>
              <span style={styles.meta}>
                {item.eventDate} · {item.eventType} · {item.venue} · Dispatch {item.dispatchTimeDisplay}
              </span>
              <Link to={`/beo-intake/${item.id}`} style={{ fontSize: "12px", color: "#38bdf8", marginLeft: "auto" }}>
                BEO →
              </Link>
            </div>
            {showNotes && (
              <div style={styles.notes}>
                {item.opsExceptions.trim() && (
                  <div>
                    <span style={styles.noteLabel}>Ops / Sourcing:</span>
                    {item.opsExceptions.trim()}
                  </div>
                )}
                {item.specialNotes.trim() && (
                  <div>
                    <span style={styles.noteLabel}>Special:</span>
                    {item.specialNotes.trim()}
                  </div>
                )}
                {item.dietaryNotes.trim() && (
                  <div>
                    <span style={styles.noteLabel}>Dietary:</span>
                    {item.dietaryNotes.trim()}
                  </div>
                )}
                {item.beoNotes.trim() && (
                  <div>
                    <span style={styles.noteLabel}>BEO/Kitchen:</span>
                    {item.beoNotes.trim()}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
