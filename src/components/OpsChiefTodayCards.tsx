import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { loadEventsWithExceptionsForRange, type OpsChiefExceptionItem } from "../services/airtable/events";
import { isErrorResult } from "../services/airtable/selectors";

const styles: Record<string, React.CSSProperties> = {
  wrap: { marginTop: "8px" },
  controls: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", marginBottom: "20px" },
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
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "linear-gradient(135deg, rgba(30,30,30,0.95), rgba(20,20,20,0.9))",
    border: "1px solid #333",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  cardTitle: { fontSize: "15px", fontWeight: 700, color: "#e0e0e0", margin: 0 },
  cardMeta: { fontSize: "12px", color: "#94a3b8" },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 600,
    background: "rgba(234, 179, 8, 0.2)",
    color: "#eab308",
  },
  link: { fontSize: "13px", color: "#38bdf8", textDecoration: "underline", marginTop: "4px" },
  empty: { color: "#94a3b8", fontSize: "14px" },
  error: { color: "#f87171", fontSize: "13px" },
};

export function OpsChiefTodayCards() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<OpsChiefExceptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await loadEventsWithExceptionsForRange(date, date);
    setLoading(false);
    if (isErrorResult(result)) {
      setError(result.message ?? "Failed to load");
      setItems([]);
      return;
    }
    setItems(result);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={styles.wrap}>
      <div style={styles.controls}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.dateInput} />
        <button type="button" onClick={load} disabled={loading} style={styles.loadBtn}>
          {loading ? "Loading…" : "Load day"}
        </button>
        {error && <span style={styles.error}>{error}</span>}
      </div>
      {items.length === 0 && !loading && !error && (
        <p style={styles.empty}>No events on this date. Pick another day and Load.</p>
      )}
      <div style={styles.grid}>
        {items.map((item) => (
          <div key={item.id} style={styles.card}>
            <h3 style={styles.cardTitle}>{item.eventName}</h3>
            <span style={styles.cardMeta}>
              {item.eventDate} · {item.eventType} · {item.venue}
            </span>
            {item.dispatchTimeDisplay !== "—" && (
              <span style={styles.cardMeta}>Dispatch {item.dispatchTimeDisplay}</span>
            )}
            {item.hasAnyNote && <span style={styles.badge}>Has notes</span>}
            <Link to={`/beo-intake/${item.id}`} style={styles.link}>
              Open BEO →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
