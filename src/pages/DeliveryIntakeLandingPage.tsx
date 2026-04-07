import React, { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEventStore } from "../state/eventStore";
import { buildIntakeClientDropdownOptions, parseIntakeClientDropdownValue } from "../lib/intakeClientNavigation";
import { DASHBOARD_CALENDAR_TO } from "../lib/dashboardRoutes";

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #0a0f0a 0%, #0a0a12 45%, #0f0808 100%)",
    color: "#e5e5e5",
    padding: 28,
    fontFamily: "system-ui, sans-serif",
  },
  inner: { maxWidth: 720, margin: "0 auto" },
  back: { color: "#94a3b8", textDecoration: "none", fontSize: 13, display: "inline-block", marginBottom: 20 },
  h1: { fontSize: 26, fontWeight: 800, margin: "0 0 8px", color: "#fff" },
  lead: { fontSize: 15, color: "#94a3b8", lineHeight: 1.55, marginBottom: 28 },
  grid: { display: "grid", gap: 16 },
  card: {
    background: "rgba(18,22,18,0.92)",
    border: "1px solid rgba(34,197,94,0.35)",
    borderRadius: 12,
    padding: 22,
  },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#86efac", marginBottom: 8 },
  cardBody: { fontSize: 13, color: "#a3a3a3", lineHeight: 1.5, marginBottom: 16 },
  btn: {
    display: "inline-block",
    padding: "11px 18px",
    borderRadius: 8,
    border: "1px solid rgba(34,197,94,0.5)",
    background: "rgba(34,197,94,0.18)",
    color: "#bbf7d0",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  search: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.35)",
    color: "#e5e5e5",
    fontSize: 14,
    marginBottom: 10,
    boxSizing: "border-box" as const,
  },
  list: { maxHeight: 280, overflowY: "auto" as const, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" },
  row: {
    display: "block",
    width: "100%",
    padding: "11px 14px",
    border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "transparent",
    color: "#e5e5e5",
    textAlign: "left" as const,
    cursor: "pointer",
    fontSize: 14,
  },
  muted: { fontSize: 12, color: "#64748b", marginTop: 12 },
};

/**
 * Staff entry for delivery intake: always creates a **new** event; client is chosen explicitly; menu is never implicit.
 */
export default function DeliveryIntakeLandingPage() {
  const navigate = useNavigate();
  const events = useEventStore((s) => s.events);
  const eventsLoading = useEventStore((s) => s.eventsLoading);
  const [query, setQuery] = useState("");

  const options = useMemo(
    () =>
      buildIntakeClientDropdownOptions(
        events.map((e) => ({
          id: e.id,
          eventName: e.eventName,
          eventDate: e.eventDate,
          linkedClientRecordId: e.linkedClientRecordId,
        }))
      ),
    [events]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const goNewDelivery = useCallback(() => {
    navigate("/event/new", { state: { deliveryFlow: true } });
  }, [navigate]);

  const onPickClient = useCallback(
    (value: string) => {
      const parsed = parseIntakeClientDropdownValue(value);
      if (!parsed) return;
      if (parsed.kind === "client") {
        navigate(`/client/${parsed.id}?flow=delivery`);
        return;
      }
      navigate(`/event/${parsed.id}`);
    },
    [navigate]
  );

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <Link to="/delivery-command" style={styles.back}>
          ← Delivery command
        </Link>
        <Link to={DASHBOARD_CALENDAR_TO} style={{ ...styles.back, marginLeft: 16 }}>
          Dashboard
        </Link>

        <h1 style={styles.h1}>Delivery intake</h1>
        <p style={styles.lead}>
          Start here so client details and menu choices don&apos;t get mixed up. Every run is a <strong>new event</strong>.
          Use <strong>Start new order</strong> for fresh food, or <strong>Reuse previous order</strong> only when you mean to
          copy the last menu.
        </p>

        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>New delivery</div>
            <p style={styles.cardBody}>
              Create a brand-new event. You&apos;ll enter or confirm the client on the next screen. The menu starts empty.
            </p>
            <button type="button" style={styles.btn} onClick={goNewDelivery}>
              New delivery (new event)
            </button>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Load existing client</div>
            <p style={styles.cardBody}>
              Pick a client that&apos;s already linked in the calendar. You&apos;ll see their snapshot, then choose{' '}
              <strong>Start new order</strong> or <strong>Reuse previous order</strong>.
            </p>
            <input
              type="search"
              style={styles.search}
              placeholder={eventsLoading ? "Loading clients…" : "Search client name…"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={eventsLoading}
              autoComplete="off"
            />
            {filtered.length === 0 ? (
              <p style={styles.muted}>
                {eventsLoading ? "Loading…" : options.length === 0 ? "No linked clients in the loaded events list." : "No matches."}
              </p>
            ) : (
              <div style={styles.list}>
                {filtered.map((o) => (
                  <button key={o.value} type="button" style={styles.row} onClick={() => onPickClient(o.value)}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
            <p style={styles.muted}>
              Don&apos;t see them? Create a new event first from <strong>New delivery</strong>, then link Client Intake on
              the event.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
