import React, { useState, useEffect, useCallback } from "react";

const ISSUE_LOG_KEY = "ops-chief-issue-log";

type IssueEntry = {
  id: string;
  date: string;
  eventRef: string;
  issue: string;
  resolved: boolean;
};

function loadIssues(): IssueEntry[] {
  try {
    const raw = localStorage.getItem(ISSUE_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveIssues(issues: IssueEntry[]) {
  try {
    localStorage.setItem(ISSUE_LOG_KEY, JSON.stringify(issues));
  } catch {}
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    background: "linear-gradient(135deg, rgba(248, 113, 113, 0.06), rgba(248, 113, 113, 0.02))",
    border: "1px solid rgba(248, 113, 113, 0.25)",
    borderRadius: "12px",
    padding: "20px",
  },
  title: { fontSize: "18px", fontWeight: 700, margin: "0 0 8px 0", color: "#e0e0e0" },
  subtitle: { fontSize: "13px", color: "#94a3b8", marginBottom: "16px" },
  form: { display: "flex", flexDirection: "column", gap: "10px", maxWidth: "500px", marginBottom: "20px" },
  input: {
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #444",
    borderRadius: "8px",
    background: "#1e1e1e",
    color: "#e0e0e0",
    boxSizing: "border-box",
  },
  textarea: {
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #444",
    borderRadius: "8px",
    background: "#1e1e1e",
    color: "#e0e0e0",
    minHeight: "80px",
    resize: "vertical",
    boxSizing: "border-box",
  },
  btn: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: 600,
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  list: { listStyle: "none", padding: 0, margin: 0 },
  item: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "12px 14px",
    marginBottom: "10px",
    opacity: 1,
  },
  itemResolved: { opacity: 0.65 },
  itemHeader: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" },
  itemDate: { fontSize: "12px", color: "#64748b" },
  itemEvent: { fontSize: "13px", fontWeight: 600, color: "#e0e0e0" },
  itemIssue: { fontSize: "13px", color: "#a0a0a0", whiteSpace: "pre-wrap" },
  checkbox: { width: 18, height: 18, cursor: "pointer", accentColor: "#22c55e" },
};

export function OpsChiefIssueLog() {
  const [issues, setIssues] = useState<IssueEntry[]>([]);
  const [eventRef, setEventRef] = useState("");
  const [issue, setIssue] = useState("");

  useEffect(() => {
    setIssues(loadIssues());
  }, []);

  const persist = useCallback((next: IssueEntry[]) => {
    setIssues(next);
    saveIssues(next);
  }, []);

  const add = () => {
    if (!issue.trim()) return;
    const date = new Date().toISOString().slice(0, 10);
    persist([
      { id: crypto.randomUUID?.() ?? String(Date.now()), date, eventRef: eventRef.trim(), issue: issue.trim(), resolved: false },
      ...issues,
    ]);
    setEventRef("");
    setIssue("");
  };

  const toggleResolved = (id: string) => {
    persist(issues.map((i) => (i.id === id ? { ...i, resolved: !i.resolved } : i)));
  };

  return (
    <section style={styles.section}>
      <h2 style={styles.title}>📋 Event Issue Log</h2>
      <p style={styles.subtitle}>Log issues you hear about from events (servers, FOH, deliveries). Check off when resolved.</p>
      <div style={styles.form}>
        <input
          type="text"
          placeholder="Event name or reference (optional)"
          value={eventRef}
          onChange={(e) => setEventRef(e.target.value)}
          style={styles.input}
        />
        <textarea
          placeholder="What went wrong / what to follow up on..."
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          style={styles.textarea}
        />
        <button type="button" onClick={add} style={styles.btn}>
          Add issue
        </button>
      </div>
      <ul style={styles.list}>
        {issues.map((i) => (
          <li key={i.id} style={{ ...styles.item, ...(i.resolved ? styles.itemResolved : {}) }}>
            <div style={styles.itemHeader}>
              <input
                type="checkbox"
                checked={i.resolved}
                onChange={() => toggleResolved(i.id)}
                style={styles.checkbox}
                title={i.resolved ? "Mark unresolved" : "Mark resolved"}
              />
              <span style={styles.itemDate}>{i.date}</span>
              {i.eventRef && <span style={styles.itemEvent}>{i.eventRef}</span>}
            </div>
            <div style={styles.itemIssue}>{i.issue}</div>
          </li>
        ))}
      </ul>
      {issues.length === 0 && (
        <p style={{ color: "#64748b", fontSize: "14px" }}>No issues logged yet. Add one above.</p>
      )}
    </section>
  );
}
