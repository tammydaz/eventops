/**
 * Ops Chief: "Fired" vs "Not yet fired" for the next 7 days.
 * Fired = BEO Sent to BOH (beoSentToBOH === true). Not yet fired = same window, not sent.
 */
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useEventStore } from "../state/eventStore";
import type { EventListItem } from "../services/airtable/events";

function formatDate(d?: string): string {
  if (!d) return "—";
  try {
    const [y, m, day] = d.split("-").map(Number);
    const date = new Date(y, m - 1, day);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${days[date.getDay()]} ${months[date.getMonth()]} ${day}`;
  } catch {
    return d;
  }
}

export function OpsChiefFiredView() {
  const { events: rawEvents, loadEvents, eventsLoading, eventsError } = useEventStore();

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const { today, endDate10 } = useMemo(() => {
    const t = new Date().toISOString().slice(0, 10);
    const end = new Date(t);
    end.setDate(end.getDate() + 10);
    return { today: t, endDate10: end.toISOString().slice(0, 10) };
  }, []);

  const { fired, notFired } = useMemo(() => {
    const list = (rawEvents as EventListItem[]).filter((e) => {
      const d = e.eventDate ?? "";
      return d >= today && d <= endDate10;
    });
    const firedList = list.filter((e) => e.beoSentToBOH === true).sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""));
    const notFiredList = list.filter((e) => e.beoSentToBOH !== true).sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""));
    return { fired: firedList, notFired: notFiredList };
  }, [rawEvents, today, endDate10]);

  if (eventsLoading) {
    return (
      <div style={{ padding: 16, color: "#9ca3af" }}>
        Loading events…
      </div>
    );
  }
  if (eventsError) {
    return (
      <div style={{ padding: 16, color: "#ef4444" }}>
        {eventsError}
      </div>
    );
  }

  const listStyles: React.CSSProperties = {
    listStyle: "none",
    margin: 0,
    padding: 0,
  };
  const itemStyles: React.CSSProperties = {
    padding: "8px 12px",
    borderBottom: "1px solid #374151",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  };
  const linkStyles: React.CSSProperties = {
    color: "#60a5fa",
    textDecoration: "none",
    fontWeight: 500,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, height: "100%" }}>
      <section>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#9ca3af", textTransform: "uppercase" }}>
          Fired (Sent to BOH) — next 7 days
        </h3>
        <ul style={listStyles}>
          {fired.length === 0 ? (
            <li style={itemStyles}>None</li>
          ) : (
            fired.map((e) => (
              <li key={e.id} style={itemStyles}>
                <Link to={`/beo-intake/${e.id}`} style={linkStyles}>
                  {e.eventName ?? e.id}
                </Link>
                <span style={{ color: "#6b7280", fontSize: 12 }}>{formatDate(e.eventDate)}</span>
              </li>
            ))
          )}
        </ul>
      </section>
      <section style={{ flex: 1, minHeight: 0 }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#f59e0b", textTransform: "uppercase" }}>
          Not yet fired — next 7 days
        </h3>
        <ul style={listStyles}>
          {notFired.length === 0 ? (
            <li style={itemStyles}>None</li>
          ) : (
            notFired.map((e) => (
              <li key={e.id} style={itemStyles}>
                <Link to={`/beo-intake/${e.id}`} style={linkStyles}>
                  {e.eventName ?? e.id}
                </Link>
                <span style={{ color: "#6b7280", fontSize: 12 }}>{formatDate(e.eventDate)}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
