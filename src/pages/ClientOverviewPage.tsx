import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  createEvent,
  loadEvent,
  loadEventsForClientLinkedRecord,
  FIELD_IDS,
  HOUSE_ORDER_NUMBER_FIELD_ID,
  computeNextHouseOrderNumber,
  buildNewDeliveryOrderContextPatch,
  updateEventMultiple,
  type EventForClientOverview,
} from "../services/airtable/events";
import { isErrorResult, asString, asSingleSelectName } from "../services/airtable/selectors";
import {
  loadClientIntakeRecord,
  applyCorporateClientDefaultsToEventPatch,
  hasCorporateDeliveryDefaults,
  type ClientIntakeSnapshot,
} from "../services/airtable/clientIntake";
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
  /** Full service alternative when client page is opened from delivery intake */
  btnFullService: {
    display: "block",
    width: "100%",
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid rgba(0,188,212,0.45)",
    background: "rgba(0,188,212,0.1)",
    color: "#67e8f9",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    marginBottom: 10,
  },
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
  return Boolean(
    s.clientName ||
      s.companyName ||
      s.phone ||
      s.email ||
      hasCorporateDeliveryDefaults(s)
  );
}

function formatIntakeDefaultAddress(s: ClientIntakeSnapshot): string {
  const street = s.defaultClientStreet?.trim() ?? "";
  const city = s.defaultClientCity?.trim() ?? "";
  const st = s.defaultClientState?.trim() ?? "";
  const zip = s.defaultClientZip?.trim() ?? "";
  const citySt = [city, st].filter(Boolean).join(", ");
  const parts = [street, citySt, zip].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

/** Fill gaps in a context patch from Client Intake when the event row had blanks. */
function applyClientIntakeSnapshotToPatch(snapshot: ClientIntakeSnapshot | null, patch: Record<string, unknown>): void {
  if (!snapshot) return;
  const emptyish = (v: unknown) =>
    v === undefined || v === null || (typeof v === "string" && !v.trim());
  if (snapshot.phone?.trim() && emptyish(patch[FIELD_IDS.CLIENT_PHONE])) {
    patch[FIELD_IDS.CLIENT_PHONE] = snapshot.phone.trim();
  }
  if (snapshot.email?.trim() && emptyish(patch[FIELD_IDS.CLIENT_EMAIL])) {
    patch[FIELD_IDS.CLIENT_EMAIL] = snapshot.email.trim();
  }
  const hasName =
    (typeof patch[FIELD_IDS.CLIENT_FIRST_NAME] === "string" && (patch[FIELD_IDS.CLIENT_FIRST_NAME] as string).trim() !== "") ||
    (typeof patch[FIELD_IDS.BUSINESS_NAME] === "string" && (patch[FIELD_IDS.BUSINESS_NAME] as string).trim() !== "");
  if (snapshot.clientName?.trim() && !hasName) {
    patch[FIELD_IDS.CLIENT_FIRST_NAME] = snapshot.clientName.trim();
    patch[FIELD_IDS.CLIENT_LAST_NAME] = "";
  }
  if (snapshot.companyName?.trim()) {
    const existing = typeof patch[FIELD_IDS.BUSINESS_NAME] === "string" ? (patch[FIELD_IDS.BUSINESS_NAME] as string).trim() : "";
    if (!existing) patch[FIELD_IDS.BUSINESS_NAME] = snapshot.companyName.trim();
  }
}

export default function ClientOverviewPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isDeliveryFlow = searchParams.get("flow") === "delivery";
  const loadEvents = useEventStore((s) => s.loadEvents);
  const [snapshot, setSnapshot] = useState<ClientIntakeSnapshot | null>(null);
  const [clientSectionNote, setClientSectionNote] = useState<string | null>(null);
  const [events, setEvents] = useState<EventForClientOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [invalidIdError, setInvalidIdError] = useState<string | null>(null);
  const [eventsLoadError, setEventsLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  /** Creating a new event from this page: delivery preset from `?flow=delivery`, full service explicit, or untyped (generic client page). */
  const [busy, setBusy] = useState<"delivery" | "fullservice" | "generic" | null>(null);
  /** When set, that row's "Reuse menu" is running — we never PATCH the source event. */
  const [repeatingFromId, setRepeatingFromId] = useState<string | null>(null);
  const [lastEventPreview, setLastEventPreview] = useState<{
    addressLine: string;
    deliveryNotes: string;
    primaryContactName: string;
    primaryContactPhone: string;
  } | null>(null);
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

  useEffect(() => {
    if (!clientId?.startsWith("rec") || events.length === 0 || isDemoClientOverviewClient(clientId)) {
      setLastEventPreview(null);
      return;
    }
    let cancelled = false;
    const mostRecentId = events[0]?.id;
    if (!mostRecentId) {
      setLastEventPreview(null);
      return;
    }
    loadEvent(mostRecentId).then((res) => {
      if (cancelled || isErrorResult(res)) return;
      const f = res.fields ?? {};
      const street = asString(f[FIELD_IDS.CLIENT_STREET]).trim();
      const city = asString(f[FIELD_IDS.CLIENT_CITY]).trim();
      const st = asSingleSelectName(f[FIELD_IDS.CLIENT_STATE]) || asString(f[FIELD_IDS.CLIENT_STATE]).trim();
      const zip = asString(f[FIELD_IDS.CLIENT_ZIP]).trim();
      const citySt = [city, st].filter(Boolean).join(", ");
      const parts = [street, citySt, zip].filter(Boolean);
      const loadIn = asString(f[FIELD_IDS.LOAD_IN_NOTES]) || "";
      const primaryContactName = asString(f[FIELD_IDS.PRIMARY_CONTACT_NAME]).trim();
      const primaryContactPhone = asString(f[FIELD_IDS.PRIMARY_CONTACT_PHONE]).trim();
      setLastEventPreview({
        addressLine: parts.length > 0 ? parts.join(" · ") : "—",
        deliveryNotes: loadIn.trim() ? loadIn : "—",
        primaryContactName: primaryContactName || "—",
        primaryContactPhone: primaryContactPhone || "—",
      });
    });
    return () => {
      cancelled = true;
    };
  }, [clientId, events]);

  const startNewOrderWithPresetType = useCallback(
    async (presetEventType: "Delivery" | "Full Service" | null) => {
      if (!clientId) return;
      if (isDemoClientOverviewClient(clientId)) {
        setActionError("Demo client — create event is disabled.");
        return;
      }
      setActionError(null);
      const busyKey: "delivery" | "fullservice" | "generic" =
        presetEventType === "Full Service" ? "fullservice" : presetEventType === "Delivery" ? "delivery" : "generic";
      setBusy(busyKey);
      try {
        const createFields: Record<string, unknown> = { [FIELD_IDS.CLIENT]: [clientId] };
        if (presetEventType) {
          createFields[FIELD_IDS.EVENT_TYPE] = presetEventType;
        }

        const created = await createEvent(createFields);
        if (isErrorResult(created)) {
          setActionError(created.message ?? "Could not create event.");
          return;
        }
        const newId = created.id;

        /** New order: Client Intake only — no fields copied from any prior event. */
        const patch: Record<string, unknown> = {};
        applyClientIntakeSnapshotToPatch(snapshot, patch);
        applyCorporateClientDefaultsToEventPatch(patch, snapshot);
        if (Object.keys(patch).length > 0) {
          const up = await updateEventMultiple(newId, patch);
          if (isErrorResult(up)) {
            setActionError(up.message ?? "Event created but Client Intake fields could not be applied.");
          }
        }

        await loadEvents();
        navigate(`/event/${newId}`);
      } finally {
        setBusy(null);
      }
    },
    [clientId, navigate, loadEvents, snapshot]
  );

  const handleNewEvent = useCallback(async () => {
    await startNewOrderWithPresetType(isDeliveryFlow ? "Delivery" : null);
  }, [isDeliveryFlow, startNewOrderWithPresetType]);

  const handleNewFullServiceEvent = useCallback(async () => {
    await startNewOrderWithPresetType("Full Service");
  }, [startNewOrderWithPresetType]);

  /** From Event Overview (or elsewhere): `<Link state={{ autoCreate }} />` kicks off one create once snapshot has loaded. */
  useEffect(() => {
    const ac = (location.state as { autoCreate?: "delivery" | "fullservice" } | null | undefined)?.autoCreate;
    if (ac !== "delivery" && ac !== "fullservice") return;
    if (!clientId?.startsWith("rec")) return;
    if (isDemoClientOverviewClient(clientId)) return;
    if (!isDeliveryFlow) return;
    if (loading) return;

    const guardKey = `ee:autoCreate:${clientId}:${ac}`;
    const raw = sessionStorage.getItem(guardKey);
    if (raw) {
      const t = Number(raw);
      if (Number.isFinite(t) && Date.now() - t < 10_000) return;
    }
    sessionStorage.setItem(guardKey, String(Date.now()));

    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });

    const preset: "Delivery" | "Full Service" = ac === "fullservice" ? "Full Service" : "Delivery";
    void startNewOrderWithPresetType(preset).finally(() => {
      sessionStorage.removeItem(guardKey);
    });
  }, [
    clientId,
    isDeliveryFlow,
    loading,
    location.pathname,
    location.search,
    location.state,
    navigate,
    startNewOrderWithPresetType,
  ]);

  /**
   * Reuse menu: always creates a NEW event. Never PATCHes `sourceEventId`.
   * Header (incl. address + load-in notes) and menu both come from `sourceEventId` only — no Client Intake merge.
   */
  const repeatOrderFromSourceEvent = useCallback(
    async (sourceEventId: string) => {
      if (!clientId) return;
      if (isDemoClientOverviewClient(clientId)) {
        setActionError("Demo client — reuse menu is disabled.");
        return;
      }
      setActionError(null);
      setRepeatingFromId(sourceEventId);
      try {
        const rows = await loadEventsForClientLinkedRecord(clientId);
        if (isErrorResult(rows)) {
          setActionError(rows.message ?? "Failed to load events.");
          return;
        }

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

        const headerPatch: Record<string, unknown> = {};
        Object.assign(headerPatch, buildNewDeliveryOrderContextPatch(sourceFields));
        if (Object.keys(headerPatch).length > 0) {
          const up = await updateEventMultiple(newId, headerPatch);
          if (isErrorResult(up)) {
            setActionError(up.message ?? "Event created but header could not be copied from source.");
          }
        }

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
        setRepeatingFromId(null);
      }
    },
    [clientId, navigate, loadEvents]
  );

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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <Link to={isDeliveryFlow ? "/delivery/intake" : DASHBOARD_CALENDAR_TO} style={styles.back}>
          ← {isDeliveryFlow ? "Delivery intake" : "Back to Dashboard"}
        </Link>
        {!isDeliveryFlow ? (
          <Link to="/delivery/intake" style={styles.back}>
            Delivery intake
          </Link>
        ) : null}
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#fff" }}>
        {isDeliveryFlow ? "Client — delivery order" : "Client"}
      </h1>
      <p style={{ fontSize: 12, color: "#666", marginBottom: 20, fontFamily: "monospace" }}>
        Client Intake: {clientId}
      </p>
      {isDeliveryFlow ? (
        <div
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.35)",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 20,
            fontSize: 14,
            color: "#bbf7d0",
            lineHeight: 1.5,
          }}
        >
          <strong>Start delivery order</strong> — new <strong>Delivery</strong> event, empty menu. <strong>Start full service
          order</strong> — same client, new <strong>Full Service</strong> event (still empty menu; Client Intake contact +
          defaults apply). Both skip copying from past jobs. <strong>Reuse menu</strong> — pick a past event; we create a{' '}
          <strong>new</strong> event and copy <strong>menu + header</strong> from <strong>that</strong> job only; the source is
          never modified.
        </div>
      ) : null}
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
            <h2 style={styles.title}>Client (persistent)</h2>
            <p style={{ ...styles.muted, marginTop: -8, marginBottom: 14 }}>
              {isDeliveryFlow ? (
                <>
                  <strong>Start delivery</strong> and <strong>Start full service</strong> fill only from this Client Intake row —
                  never from a past event’s address or notes.
                </>
              ) : (
                <>
                  <strong>Start new order</strong> fills only from this Client Intake row — never from a past event’s address or
                  notes.
                </>
              )}{" "}
              <strong>Reuse menu</strong> copies header and food from the event you pick. The latest event below is reference
              only.
            </p>
            {clientSectionNote ? <p style={styles.muted}>{clientSectionNote}</p> : null}
            <div style={styles.label}>From Client Intake</div>
            {snapshot?.clientName ? (
              <>
                <div style={styles.label}>Name</div>
                <div style={styles.value}>{snapshot.clientName}</div>
              </>
            ) : null}
            {snapshot?.companyName ? (
              <>
                <div style={styles.label}>Company</div>
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
              <p style={styles.muted}>No name, contact, or corporate delivery defaults on this Client Intake row yet.</p>
            ) : null}

            {snapshot && hasCorporateDeliveryDefaults(snapshot) ? (
              <>
                <div style={{ ...styles.label, marginTop: 18 }}>Default delivery (Client Intake)</div>
                <div style={styles.label}>Address</div>
                <div style={{ ...styles.value, fontSize: 14, lineHeight: 1.45 }}>{formatIntakeDefaultAddress(snapshot)}</div>
                <div style={styles.label}>Delivery / load-in notes</div>
                <div
                  style={{
                    ...styles.value,
                    fontSize: 13,
                    lineHeight: 1.45,
                    whiteSpace: "pre-wrap",
                    color: "#cbd5e1",
                    maxHeight: 180,
                    overflowY: "auto",
                  }}
                >
                  {snapshot.defaultDeliveryNotes?.trim() ? snapshot.defaultDeliveryNotes : "—"}
                </div>
              </>
            ) : null}

            {lastEventPreview && hasEvents ? (
              <>
                <div style={{ ...styles.label, marginTop: 18 }}>From latest event (reference only)</div>
                <div style={styles.label}>Primary contact (day-of)</div>
                <div style={{ ...styles.value, fontSize: 14 }}>
                  {lastEventPreview.primaryContactName}
                  {lastEventPreview.primaryContactPhone !== "—" ? (
                    <span style={{ color: "#94a3b8" }}> · {lastEventPreview.primaryContactPhone}</span>
                  ) : null}
                </div>
                <div style={styles.label}>Address</div>
                <div style={{ ...styles.value, fontSize: 14, lineHeight: 1.45 }}>{lastEventPreview.addressLine}</div>
                <div style={styles.label}>Delivery / load-in notes</div>
                <div
                  style={{
                    ...styles.value,
                    fontSize: 13,
                    lineHeight: 1.45,
                    whiteSpace: "pre-wrap",
                    color: "#cbd5e1",
                    maxHeight: 180,
                    overflowY: "auto",
                  }}
                >
                  {lastEventPreview.deliveryNotes}
                </div>
              </>
            ) : !hasEvents ? (
              <p style={{ ...styles.muted, marginTop: 12 }}>
                No events yet — set default address / notes on Client Intake for the next delivery, or enter them on the new event.
              </p>
            ) : null}
          </div>

          <div style={styles.card}>
            <h2 style={styles.title}>Past events</h2>
            <p style={{ ...styles.muted, marginTop: -8, marginBottom: 12 }}>
              <strong>View</strong> opens that job (read-only intent). <strong>Reuse menu</strong> creates a <em>new</em> event,
              copies <strong>food + header</strong> (address, load-in notes, etc.) from that job only — the original event is not
              modified.
            </p>
            {eventsLoadError ? (
              <p style={styles.err}>{eventsLoadError}</p>
            ) : events.length === 0 ? (
              <div style={styles.eventHistoryEmpty}>
                <p style={{ color: "#a3a3a3", fontSize: 14, margin: "0 0 18px", lineHeight: 1.5 }}>
                  This client has no events yet.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                  <button
                    type="button"
                    style={{
                      ...styles.btn,
                      ...styles.btnFirstEvent,
                      ...(isDeliveryFlow ? {} : { marginBottom: 0 }),
                      ...(busy !== null || repeatingFromId !== null || isDemoClient ? styles.btnDisabled : {}),
                    }}
                    disabled={busy !== null || repeatingFromId !== null || isDemoClient}
                    onClick={() => void handleNewEvent()}
                  >
                    {busy === "delivery" || (!isDeliveryFlow && busy === "generic") ? "Working…" : isDeliveryFlow ? "Start delivery order" : "Start new order"}
                  </button>
                  {isDeliveryFlow ? (
                    <button
                      type="button"
                      style={{
                        ...styles.btnFullService,
                        ...styles.btnFirstEvent,
                        ...(busy !== null || repeatingFromId !== null || isDemoClient ? styles.btnDisabled : {}),
                      }}
                      disabled={busy !== null || repeatingFromId !== null || isDemoClient}
                      onClick={() => void handleNewFullServiceEvent()}
                    >
                      {busy === "fullservice" ? "Working…" : "Start full service order"}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div ref={listRef} style={styles.eventHistoryScroll}>
                <div className="clientOverviewEventHeader">
                  <span>House #</span>
                  <span>Date</span>
                  <span>Type</span>
                  <span>Guests</span>
                  <span> </span>
                </div>
                {events.map((ev, index) => {
                  const isMostRecent = index === 0;
                  const reuseBusy = repeatingFromId === ev.id;
                  return (
                    <div
                      ref={index === 0 ? firstRowRef : null}
                      key={ev.id}
                      className={
                        isMostRecent
                          ? "clientOverviewEventRowWrap clientOverviewEventRowWrapMostRecent"
                          : "clientOverviewEventRowWrap"
                      }
                    >
                      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
                        {isMostRecent ? <span style={styles.mostRecentLabel}>Most recent</span> : null}
                        <span>{ev.houseOrder || "—"}</span>
                      </span>
                      <span>{ev.eventDate || "—"}</span>
                      <span>{ev.eventType || "—"}</span>
                      <span>{ev.guestCount != null ? String(ev.guestCount) : "—"}</span>
                      <span style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
                        <Link
                          to={`/event/${ev.id}`}
                          style={{ fontSize: 12, color: "#93c5fd", fontWeight: 600, whiteSpace: "nowrap" }}
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          className="clientOverviewReuseMenuBtn"
                          disabled={repeatingFromId !== null || busy !== null || isDemoClient}
                          title={isDemoClient ? "Disabled for demo" : "New event + copy menu from this one"}
                          onClick={() => void repeatOrderFromSourceEvent(ev.id)}
                        >
                          {reuseBusy ? "Working…" : "Reuse menu"}
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={styles.card}>
            <h2 style={styles.title}>Decide</h2>
            <button
              type="button"
              style={{
                ...styles.btn,
                ...((busy !== null || repeatingFromId !== null || isDemoClient) ? styles.btnDisabled : {}),
              }}
              disabled={busy !== null || repeatingFromId !== null || isDemoClient}
              title={isDemoClient ? "Disabled for demo client" : undefined}
              onClick={() => void handleNewEvent()}
            >
              {busy === "delivery" || (!isDeliveryFlow && busy === "generic")
                ? "Working…"
                : isDeliveryFlow
                  ? "Start delivery order"
                  : "Start new order"}
            </button>
            {isDeliveryFlow ? (
              <button
                type="button"
                style={{
                  ...styles.btnFullService,
                  ...((busy !== null || repeatingFromId !== null || isDemoClient) ? styles.btnDisabled : {}),
                }}
                disabled={busy !== null || repeatingFromId !== null || isDemoClient}
                title={isDemoClient ? "Disabled for demo client" : "On-site / full service job for this same client"}
                onClick={() => void handleNewFullServiceEvent()}
              >
                {busy === "fullservice" ? "Working…" : "Start full service order"}
              </button>
            ) : null}
            <p style={{ fontSize: 11, color: "#666", marginBottom: 14 }}>
              {isDeliveryFlow ? (
                <>
                  Creates a <strong>new</strong> event, <strong>empty menu</strong>. <strong>Delivery</strong> vs{' '}
                  <strong>Full Service</strong> only sets event type; Client Intake contact and corporate defaults still apply.
                  Nothing is copied from past jobs. Does <strong>not</strong> copy food.
                </>
              ) : (
                <>
                  Creates a <strong>new</strong> event, <strong>empty menu</strong>. Choose event type on the event or in BEO
                  Intake. Applies Client Intake contact and corporate defaults when configured. Does <strong>not</strong> copy
                  food. For typed <strong>Delivery</strong> vs <strong>Full service</strong> buttons, open this client from{' '}
                  <Link to="/delivery/intake" style={{ color: "#93c5fd" }}>
                    Delivery intake
                  </Link>
                  .
                </>
              )}
            </p>
            <p style={{ fontSize: 11, color: "#666", marginBottom: 0 }}>
              <strong>Reuse menu</strong> (under Past events) creates a new event and copies menu + full header from the row you
              choose — not from Client Intake defaults. The source job is never modified.
            </p>
            {actionError ? <p style={styles.err}>{actionError}</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}
