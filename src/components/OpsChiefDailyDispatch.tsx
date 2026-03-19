import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { loadEventsForOpsChiefDate, updateEventMultiple, FIELD_IDS, type OpsChiefDayItem } from "../services/airtable/events";
import { secondsTo12HourString } from "../utils/timeHelpers";
import { isErrorResult } from "../services/airtable/selectors";

const todayYyyyMmDd = () => new Date().toISOString().slice(0, 10);

const styles: Record<string, React.CSSProperties> = {
  section: {
    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.04))",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  title: {
    fontSize: "18px",
    fontWeight: 700,
    margin: 0,
    color: "#e0e0e0",
  },
  subtitle: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: 500,
  },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  dateInput: {
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #444",
    borderRadius: "8px",
    background: "#1e1e1e",
    color: "#e0e0e0",
  },
  loadButton: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: 600,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  error: { color: "#f87171", fontSize: "13px" },
  tableWrap: { overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    textAlign: "left",
    padding: "10px 8px",
    borderBottom: "2px solid #374151",
    color: "#94a3b8",
    fontWeight: 700,
  },
  td: {
    padding: "8px",
    borderBottom: "1px solid #2a2a2a",
    color: "#e0e0e0",
  },
  tdReason: {
    padding: "8px",
    borderBottom: "1px solid #2a2a2a",
    color: "#94a3b8",
    fontSize: "12px",
    maxWidth: "200px",
  },
  applyButton: {
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 600,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginRight: "8px",
  },
  beoLink: {
    color: "#38bdf8",
    fontSize: "12px",
    textDecoration: "underline",
  },
};

export function OpsChiefDailyDispatch() {
  const [dispatchDate, setDispatchDate] = useState<string>(todayYyyyMmDd());
  const [dayItems, setDayItems] = useState<OpsChiefDayItem[]>([]);
  const [dayLoading, setDayLoading] = useState<boolean>(false);
  const [dayError, setDayError] = useState<string | null>(null);
  const [savingDispatchId, setSavingDispatchId] = useState<string | null>(null);

  const loadDay = useCallback(async () => {
    setDayLoading(true);
    setDayError(null);
    const result = await loadEventsForOpsChiefDate(dispatchDate);
    setDayLoading(false);
    if (isErrorResult(result)) {
      setDayError(result.message ?? "Failed to load day");
      setDayItems([]);
      return;
    }
    setDayItems(result);
  }, [dispatchDate]);

  useEffect(() => {
    loadDay();
  }, [loadDay]);

  const applySuggestedDispatch = useCallback(async (item: OpsChiefDayItem) => {
    if (item.suggestedDispatchSeconds == null) return;
    setSavingDispatchId(item.id);
    const result = await updateEventMultiple(item.id, {
      [FIELD_IDS.EVENT_DATE]: item.eventDate,
      [FIELD_IDS.DISPATCH_TIME]: item.suggestedDispatchSeconds,
    });
    setSavingDispatchId(null);
    if (isErrorResult(result)) {
      setDayError(result.message ?? "Failed to save dispatch time");
      return;
    }
    setDayItems((prev) =>
      prev.map((r) =>
        r.id === item.id ? { ...r, dispatchTimeSeconds: item.suggestedDispatchSeconds } : r
      )
    );
  }, []);

  return (
    <section style={styles.section}>
      <div style={styles.header}>
        <h2 style={styles.title}>📅 Daily Dispatch — Job # & Dispatch Times</h2>
        <span style={styles.subtitle}>Pick a day • first→last by dispatch • auto-suggested times</span>
      </div>
      <div style={styles.controls}>
        <input
          type="date"
          value={dispatchDate}
          onChange={(e) => setDispatchDate(e.target.value)}
          style={styles.dateInput}
        />
        <button type="button" onClick={loadDay} disabled={dayLoading} style={styles.loadButton}>
          {dayLoading ? "Loading…" : "Load day"}
        </button>
        {dayError && <span style={styles.error}>{dayError}</span>}
      </div>
      {dayItems.length === 0 && !dayLoading && !dayError && (
        <p style={{ color: "#94a3b8", fontSize: 14 }}>No events/deliveries for this date. Change the date and load.</p>
      )}
      {dayItems.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Job #</th>
                <th style={styles.th}>Event</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Venue</th>
                <th style={styles.th}>Current dispatch</th>
                <th style={styles.th}>Suggested</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dayItems.map((item, idx) => (
                <tr key={item.id}>
                  <td style={styles.td}>{String(idx + 1).padStart(3, "0")}</td>
                  <td style={styles.td}>{item.eventName}</td>
                  <td style={styles.td}>{item.eventType}</td>
                  <td style={styles.td}>{item.venue}</td>
                  <td style={styles.td}>
                    {item.dispatchTimeSeconds != null ? secondsTo12HourString(item.dispatchTimeSeconds) : "—"}
                  </td>
                  <td style={styles.td}>
                    {item.suggestedDispatchSeconds != null ? secondsTo12HourString(item.suggestedDispatchSeconds) : "—"}
                  </td>
                  <td style={styles.tdReason}>{item.suggestedReason}</td>
                  <td style={styles.td}>
                    <button
                      type="button"
                      disabled={item.suggestedDispatchSeconds == null || savingDispatchId === item.id}
                      onClick={() => applySuggestedDispatch(item)}
                      style={styles.applyButton}
                    >
                      {savingDispatchId === item.id ? "Saving…" : "Apply suggested"}
                    </button>
                    <Link to={`/beo-intake/${item.id}`} style={styles.beoLink}>BEO</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
