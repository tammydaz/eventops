import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createEvent,
  loadEvent,
  loadEventsForClientLinkedRecord,
  FIELD_IDS,
  HOUSE_ORDER_NUMBER_FIELD_ID,
  computeNextHouseOrderNumber,
  type EventForClientOverview,
} from "../services/airtable/events";
import { isErrorResult, asString, asSingleSelectName } from "../services/airtable/selectors";
import { loadClientIntakeRecord, type ClientIntakeSnapshot } from "../services/airtable/clientIntake";
import { cloneEventMenuShadowRowsFromEvent, syncShadowToEvent } from "../services/airtable/eventMenu";
import { cloneBoxedLunchOrdersToEvent } from "../services/airtable/boxedLunchOrders";
import { useEventStore } from "../state/eventStore";
import { DASHBOARD_CALENDAR_TO } from "../lib/dashboardRoutes";
import {
  getDemoClientOverviewData,
  isDemoClientOverviewClient,
} from "../lib/clientOverviewDemo";
import "./ClientOverviewPage.css";

const styles = {
  container: { minHeight: "100vh", background: "#0a0a0a", color: "#e5e5e5", padding: 24 },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1fr) minmax(320px, 1.4fr) minmax(240px, 0.9fr)",
    gap: 20,
    maxWidth: 1400,
    margin: "0 auto",
    alignItems: "start",
  },
  card: {
    background: "rgba(20,20,20,0.9)",
    border: "1px solid #333",
    borderRadius: 10,
    padding: 20,
  },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#fafafa" },
  label: { fontSize: 11, textTransform: "uppercase" as const, color: "#888", marginBottom: 4 },
  value: { fontSize: 14, marginBottom: 12 },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: 8,
    padding: "10px 8px",
    borderBottom: "1px solid #2a2a2a",
    cursor: "pointer" as const,
    borderRadius: 6,
  },
  mostRecentLabel: {
    display: "inline-block",
    fontSize: 9,
    fontWeight: 700 as const,
    letterSpacing: "0.04em",
    color: "#7dd3fc",
    marginBottom: 4,
    opacity: 0.95,
  },
  btn: {
    display: "block",
    width: "100%",
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid #444",
    background: "rgba(59,130,246,0.12)",
    color: "#93c5fd",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    marginBottom: 10,
  },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" as const },
  btnFirstEvent: {
    display: "inline-block",
    width: "auto",
    padding: "12px 20px",
    marginBottom: 0,
  },
  eventHistoryEmpty: { textAlign: "center" as const, padding: "28px 12px" },
  eventHistoryScroll: { maxHeight: "70vh", overflowY: "auto" as const },
  back: { color: "#94a3b8", textDecoration: "none", fontSize: 13, display: "inline-block", marginBottom: 16 },
  err: { color: "#fca5a5", fontSize: 13, marginTop: 8 },
  muted: { color: "#888", fontSize: 13 },
};

function hasAnySnapshot(s: ClientIntakeSnapshot | null): boolean {
  if (!s) return false;
  return Boolean(s.clientName || s.companyName || s.phone || s.email);
}

export default function ClientOverviewPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const loadEvents = useEventStore((s) => s.loadEvents);
  const [snapshot, setSnapshot] = useState<ClientIntakeSnapshot | null>(null);
  const [clientSectionNote, setClientSectionNote] = useState<string | null>(null);
  const [events, setEvents] = useState<EventForClientOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [invalidIdError, setInvalidIdError] = useState<string | null>(null);
  const [eventsLoadError, setEventsLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"new" | "repeat" | null>(null);
  const firstRowRef = useRef<HTMLAnchorElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (events.length > 0 && listRef.current && firstRowRef.current) {
      const run = () => {
        if (!listRef.current || !firstRowRef.current) return;
        const container = listRef.current;
        const row = firstRowRef.current;

        const containerRect = container.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();

        const offset = rowRect.top - containerRect.top;
        const scrollTo =
          container.scrollTop + offset - container.clientHeight / 2 + row.clientHeight / 2;

        container.scrollTo({
          top: Math.max(0, scrollTo),
          behavior: "smooth",
        });
      };
      setTimeout(run, 0);
    }
  }, [events]);

  useEffect(() => {
    if (!clientId?.startsWith("rec")) {
      setInvalidIdError("Invalid client id.");
      setLoading(false);
      return;
    }
    setInvalidIdError(null);

    const demo = clientId ? getDemoClientOverviewData(clientId) : null;
    if (demo) {
      setEventsLoadError(null);
      setClientSectionNote(null);
      setSnapshot(demo.snapshot);
      setEvents(demo.events);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setEventsLoadError(null);
      setClientSectionNote(null);
      const [snapRes, evRes] = await Promise.all([
        loadClientIntakeRecord(clientId),
        loadEventsForClientLinkedRecord(clientId),
      ]);
      if (cancelled) return;

      if (isErrorResult(evRes)) {
        setEventsLoadError(evRes.message ?? "Failed to load events.");
        setEvents([]);
      } else {
        setEvents(evRes);
      }

      if (isErrorResult(snapRes)) {
        setSnapshot(null);
        setClientSectionNote(snapRes.message ?? "Couldn't load client record.");
      } else {
        setSnapshot(snapRes.snapshot);
        setClientSectionNote(null);
      }

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const handleNewEvent = useCallback(async () => {
    if (!clientId) return;
    if (isDemoClientOverviewClient(clientId)) {
      setActionError("Demo client — create event is disabled.");
      return;
    }
    setActionError(null);
    setBusy("new");
    try {
      const created = await createEvent({ [FIELD_IDS.CLIENT]: [clientId] });
      if (isErrorResult(created)) {
        setActionError(created.message ?? "Could not create event.");
        return;
      }
      await loadEvents();
      navigate(`/event/${created.id}`);
    } finally {
      setBusy(null);
    }
  }, [clientId, navigate, loadEvents]);

  const handleRepeatLastOrder = useCallback(async () => {
    if (!clientId) return;
    if (isDemoClientOverviewClient(clientId)) {
      setActionError("Demo client — repeat order is disabled.");
      return;
    }
    setActionError(null);
    setBusy("repeat");
    try {
      const rows = await loadEventsForClientLinkedRecord(clientId);
      if (isErrorResult(rows)) {
        setActionError(rows.message ?? "Failed to load events.");
        return;
      }
      if (rows.length === 0) {
        setActionError("No prior events for this client — nothing to repeat.");
        return;
      }
      const sourceEventId = rows[0].id;
      const sourceRes = await loadEvent(sourceEventId);
      if (isErrorResult(sourceRes)) {
        setActionError(sourceRes.message ?? "Failed to load source event.");
        return;
      }
      const sourceFields = sourceRes.fields;
      const fields: Record<string, unknown> = {
        [FIELD_IDS.CLIENT]: [clientId],
      };
      const et = asSingleSelectName(sourceFields[FIELD_IDS.EVENT_TYPE]);
      if (et) {
        fields[FIELD_IDS.EVENT_TYPE] = et;
      }

      if (HOUSE_ORDER_NUMBER_FIELD_ID) {
        const existingNums = rows.map((r) => r.houseOrder).filter((x): x is string => Boolean(x?.trim()));
        const sourceHouse = asString(sourceFields[HOUSE_ORDER_NUMBER_FIELD_ID]) ?? "";
        const nextHouse = computeNextHouseOrderNumber(sourceHouse, [...existingNums, sourceHouse]);
        if (nextHouse) {
          fields[HOUSE_ORDER_NUMBER_FIELD_ID] = nextHouse;
        }
      }

      const created = await createEvent(fields);
      if (isErrorResult(created)) {
        setActionError(created.message ?? "Could not create event.");
        return;
      }
      const newId = created.id;

      const menuClone = await cloneEventMenuShadowRowsFromEvent(sourceEventId, newId);
      if (isErrorResult(menuClone)) {
        setActionError(menuClone.message ?? "Failed to copy menu.");
        navigate(`/event/${newId}`);
        return;
      }
      const syncRes = await syncShadowToEvent(newId);
      if (isErrorResult(syncRes)) {
        setActionError(syncRes.message ?? "Failed to sync menu.");
        navigate(`/event/${newId}`);
        return;
      }
      const bl = await cloneBoxedLunchOrdersToEvent(sourceEventId, newId);
      if (isErrorResult(bl)) {
        setActionError(bl.message ?? "Failed to copy boxed lunch.");
        navigate(`/event/${newId}`);
        return;
      }
      await loadEvents();
      navigate(`/event/${newId}`);
    } finally {
      setBusy(null);
    }
  }, [clientId, navigate, loadEvents]);

  if (!clientId) {
    return (
      <div style={styles.container}>
        <p style={styles.err}>Missing client id.</p>
        <Link to={DASHBOARD_CALENDAR_TO} style={styles.back}>
          ← Back
        </Link>
      </div>
    );
  }

  const hasEvents = events.length > 0;
  const isDemoClient = clientId ? isDemoClientOverviewClient(clientId) : false;

  return (
    <div style={styles.container}>
      <Link to={DASHBOARD_CALENDAR_TO} style={styles.back}>
        ← Back to Dashboard
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#fff" }}>Client</h1>
      <p style={{ fontSize: 12, color: "#666", marginBottom: 20, fontFamily: "monospace" }}>
        Client Intake: {clientId}
      </p>
      {isDemoClient ? (
        <p style={{ ...styles.muted, marginTop: -12, marginBottom: 20 }}>
          Demo client — 15 events (Acme) or 8 events (Rivera). Event links are not real Airtable records. Try:{" "}
          <code style={{ color: "#a3a3a3" }}>/client/recDemoClientScrollMultiA</code> or{" "}
          <code style={{ color: "#a3a3a3" }}>/client/recDemoClientScrollMultiB</code>
        </p>
      ) : null}

      {invalidIdError ? (
        <p style={styles.err}>{invalidIdError}</p>
      ) : loading ? (
        <p style={{ color: "#888" }}>Loading…</p>
      ) : (
        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.title}>Client snapshot</h2>
            {clientSectionNote ? <p style={styles.muted}>{clientSectionNote}</p> : null}
            {snapshot?.clientName ? (
              <>
                <div style={styles.label}>Client name</div>
                <div style={styles.value}>{snapshot.clientName}</div>
              </>
            ) : null}
            {snapshot?.companyName ? (
              <>
                <div style={styles.label}>Company name</div>
                <div style={styles.value}>{snapshot.companyName}</div>
              </>
            ) : null}
            {snapshot?.phone ? (
              <>
                <div style={styles.label}>Phone</div>
                <div style={styles.value}>{snapshot.phone}</div>
              </>
            ) : null}
            {snapshot?.email ? (
              <>
                <div style={styles.label}>Email</div>
                <div style={styles.value}>{snapshot.email}</div>
              </>
            ) : null}
            {!clientSectionNote && snapshot && !hasAnySnapshot(snapshot) ? (
              <p style={styles.muted}>No client details on this record.</p>
            ) : null}
          </div>

          <div style={styles.card}>
            <h2 style={styles.title}>Event history</h2>
            {eventsLoadError ? (
              <p style={styles.err}>{eventsLoadError}</p>
            ) : events.length === 0 ? (
              <div style={styles.eventHistoryEmpty}>
                <p style={{ color: "#a3a3a3", fontSize: 14, margin: "0 0 18px", lineHeight: 1.5 }}>
                  This client has no events yet.
                </p>
                <button
                  type="button"
                  style={{ ...styles.btn, ...styles.btnFirstEvent, ...(busy === "new" || isDemoClient ? styles.btnDisabled : {}) }}
                  disabled={busy === "new" || isDemoClient}
                  onClick={() => void handleNewEvent()}
                >
                  {busy === "new" ? "Working…" : "+ Create First Event"}
                </button>
              </div>
            ) : (
              <div ref={listRef} style={styles.eventHistoryScroll}>
                <div
                  style={{
                    ...styles.row,
                    cursor: "default",
                    fontSize: 10,
                    color: "#666",
                    textTransform: "uppercase" as const,
                    fontWeight: 700,
                  }}
                >
                  <span>House order #</span>
                  <span>Event date</span>
                  <span>Type</span>
                  <span>Guests</span>
                </div>
                {events.map((ev, index) => {
                  const isMostRecent = index === 0;
                  return (
                    <Link
                      ref={index === 0 ? firstRowRef : null}
                      key={ev.id}
                      to={`/event/${ev.id}`}
                      className={
                        isMostRecent
                          ? "clientOverviewEventRow clientOverviewEventRowMostRecent"
                          : "clientOverviewEventRow"
                      }
                    >
                      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
                        {isMostRecent ? <span style={styles.mostRecentLabel}>Most Recent</span> : null}
                        <span>{ev.houseOrder || "—"}</span>
                      </span>
                      <span>{ev.eventDate || "—"}</span>
                      <span>{ev.eventType || "—"}</span>
                      <span>{ev.guestCount != null ? String(ev.guestCount) : "—"}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div style={styles.card}>
            <h2 style={styles.title}>Actions</h2>
            <button
              type="button"
              style={{ ...styles.btn, ...((busy || isDemoClient) ? styles.btnDisabled : {}) }}
              disabled={busy !== null || isDemoClient}
              title={isDemoClient ? "Disabled for demo client" : undefined}
              onClick={() => void handleNewEvent()}
            >
              {busy === "new" ? "Working…" : "New event"}
            </button>
            <p style={{ fontSize: 11, color: "#666", marginBottom: 14 }}>
              Creates an empty event linked to this client (no menu copy).
            </p>
            <button
              type="button"
              style={{ ...styles.btn, ...(!hasEvents || busy !== null || isDemoClient ? styles.btnDisabled : {}) }}
              disabled={!hasEvents || busy !== null || isDemoClient}
              title={isDemoClient ? "Disabled for demo client" : !hasEvents ? "No previous orders to repeat" : ""}
              onClick={() => void handleRepeatLastOrder()}
            >
              {busy === "repeat" ? "Working…" : "Repeat last order"}
            </button>
            <p style={{ fontSize: 11, color: "#666", marginBottom: 0 }}>
              Uses the most recent event by date, copies menu + boxed lunch only, then opens Event Overview.
            </p>
            {actionError ? <p style={styles.err}>{actionError}</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}
