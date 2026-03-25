import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProductionColor,
  getProductionColorForFOH,
  PRODUCTION_COLORS,
  type ProductionColor,
} from "../lib/productionHelpers";
import { formatClock12FromSeconds, formatDetailDateTimeLine, listPrimaryLabel } from "../lib/eventListRowMeta";
import { StaffingAttentionBadge } from "./StaffingAttentionBadge";
import { useEventStore } from "../state/eventStore";
import { FOH_BEO_FIRED_FIELD_ID, FOH_SPECK_COMPLETE_FIELD_ID } from "../services/airtable/events";

export type ListDetailEvent = {
  id: string;
  eventDate?: string;
  name: string;
  time: string;
  client: string;
  venue: string;
  guests: number;
  category: string;
  eventType: string;
  serviceStyle: string;
  phone?: string;
  beoSentToBOH?: boolean;
  isDemo?: boolean;
  staffingConfirmedInNowsta?: boolean;
  fwStaffSummaryPresent?: boolean;
  guestCountConfirmed?: boolean;
  menuAcceptedByKitchen?: boolean;
  productionColor?: string;
  beoFiredToBOH?: boolean;
  speckComplete?: boolean;
  dispatchTimeSeconds?: number;
  beoNotes?: string;
  timelineRaw?: string;
  paymentStatus?: string;
  invoicePaid?: boolean;
};

function formatDayHeader(dateStr: string): string {
  const [y, m, day] = dateStr.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${day}, ${y}`;
}

/** Parse TIMELINE long text into rows (line = "4:00 PM – Title | subtitle" or free text). */
function parseTimelineLines(raw: string | undefined): { time: string; title: string; sub?: string }[] {
  if (!raw?.trim()) return [];
  return raw.split(/\r?\n/).reduce<{ time: string; title: string; sub?: string }[]>((acc, line) => {
    const t = line.trim();
    if (!t) return acc;
    const m = t.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[–\-—]\s*(.+)$/i);
    if (m) {
      const rest = m[2].trim();
      const pipe = rest.split(/\s*\|\s*/);
      acc.push({ time: m[1].trim(), title: pipe[0] ?? rest, sub: pipe[1]?.trim() });
      return acc;
    }
    const m2 = t.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s+(.+)$/i);
    if (m2) {
      acc.push({ time: m2[1].trim(), title: m2[2].trim(), sub: undefined });
      return acc;
    }
    acc.push({ time: "", title: t, sub: undefined });
    return acc;
  }, []);
}

function notesToBullets(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

function isPaidLabel(event: ListDetailEvent): boolean {
  if (event.invoicePaid) return true;
  const s = (event.paymentStatus ?? "").toLowerCase();
  return /paid|complete|received/.test(s);
}

type Props = {
  event: ListDetailEvent;
  isFOH: boolean;
  compactLayout?: boolean;
  onClose: () => void;
  onOpenEvent: () => void;
};

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 11h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 22s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="11" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconCard({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

export function EventListDetailSidebar({ event, isFOH, compactLayout, onClose, onOpenEvent }: Props) {
  const navigate = useNavigate();
  const setFields = useEventStore((s) => s.setFields);
  const loadEvents = useEventStore((s) => s.loadEvents);
  const [beoMenuOpen, setBeoMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const beoWrapRef = useRef<HTMLDivElement>(null);

  const prod: ProductionColor = isFOH
    ? getProductionColorForFOH({ eventType: event.eventType, beoSentToBOH: event.beoSentToBOH })
    : getProductionColor(event as never);
  const hex = PRODUCTION_COLORS[prod];
  const statusLabel =
    event.beoSentToBOH === true ? "CONFIRMED" : prod === "grey" ? "SETUP" : "ACTIVE";

  const beoConfigured = Boolean(FOH_BEO_FIRED_FIELD_ID);
  const speckConfigured = Boolean(FOH_SPECK_COMPLETE_FIELD_ID);

  useEffect(() => {
    if (!beoMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (beoWrapRef.current && !beoWrapRef.current.contains(e.target as Node)) setBeoMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [beoMenuOpen]);

  const patchAndRefresh = useCallback(
    async (patch: Record<string, unknown>) => {
      if (event.isDemo) return;
      setSaving(true);
      try {
        const ok = await setFields(event.id, patch);
        if (ok) await loadEvents({ background: true });
      } finally {
        setSaving(false);
      }
    },
    [event.id, event.isDemo, setFields, loadEvents]
  );

  const handleBeoPrint = useCallback(() => {
    setBeoMenuOpen(false);
    navigate(`/beo-print/${event.id}`);
  }, [navigate, event.id]);

  const handleBeoFire = useCallback(async () => {
    setBeoMenuOpen(false);
    if (!beoConfigured || !FOH_BEO_FIRED_FIELD_ID) return;
    await patchAndRefresh({ [FOH_BEO_FIRED_FIELD_ID]: true });
  }, [beoConfigured, patchAndRefresh]);

  const handleSpeck = useCallback(async () => {
    if (!speckConfigured || !FOH_SPECK_COMPLETE_FIELD_ID || event.speckComplete) return;
    await patchAndRefresh({ [FOH_SPECK_COMPLETE_FIELD_ID]: true });
  }, [speckConfigured, event.speckComplete, patchAndRefresh]);

  const baseAsideClass = ["dp-event-detail-sidebar", compactLayout ? "dp-event-detail-sidebar--compact" : ""]
    .filter(Boolean)
    .join(" ");
  const fohAsideClass = `${baseAsideClass} dp-event-detail-sidebar--foh dp-event-detail-sidebar--foh-mock`.trim();

  const timelineRows = parseTimelineLines(event.timelineRaw);
  const noteLines = notesToBullets(event.beoNotes);
  const paid = isPaidLabel(event);
  const paymentLine = event.paymentStatus?.trim() || "—";

  if (isFOH) {
    return (
      <aside className={fohAsideClass} aria-label="Event details">
        <div className="dp-foh-mock-top">
          <button type="button" className="dp-event-detail-sidebar-close dp-foh-mock-close" onClick={onClose} aria-label="Close panel">
            ✕
          </button>
          <div className="dp-foh-mock-title-row">
            <h2 className="dp-foh-mock-title">{listPrimaryLabel(event.client)}</h2>
            <span
              className={`dp-foh-mock-status ${event.beoSentToBOH === true ? "dp-foh-mock-status--confirmed" : ""}`}
              style={
                event.beoSentToBOH === true
                  ? undefined
                  : {
                      color: hex,
                      borderColor: `${hex}80`,
                      backgroundColor: `${hex}14`,
                    }
              }
            >
              {event.beoSentToBOH === true && <span className="dp-foh-mock-status-dot" />}
              {statusLabel}
            </span>
          </div>
          <div className="dp-foh-mock-datetime">
            <IconCalendar className="dp-foh-mock-datetime-icon" />
            <span>{formatDetailDateTimeLine(event)}</span>
          </div>
          <div className="dp-foh-mock-actions-bar">
            <StaffingAttentionBadge
              event={event}
              linkNowsta
              className="dp-staff-pill-nowsta dp-foh-action-pill dp-foh-action-pill--staff"
            />
            <div className="dp-foh-mock-beo-wrap" ref={beoWrapRef}>
              {event.beoFiredToBOH ? (
                <span className="dp-foh-action-pill dp-foh-action-pill--beo dp-foh-action-pill--done">✓ BEO</span>
              ) : (
                <>
                  <button
                    type="button"
                    className="dp-foh-action-pill dp-foh-action-pill--beo"
                    disabled={event.isDemo || saving}
                    aria-expanded={beoMenuOpen}
                    onClick={() => !event.isDemo && setBeoMenuOpen((o) => !o)}
                  >
                    BEO
                    <span className="dp-foh-beo-caret" aria-hidden>
                      ▾
                    </span>
                  </button>
                  {beoMenuOpen && (
                    <div className="dp-foh-beo-menu" role="menu">
                      <button type="button" className="dp-foh-beo-menu-item" role="menuitem" onClick={handleBeoPrint}>
                        Print
                      </button>
                      <button
                        type="button"
                        className="dp-foh-beo-menu-item"
                        role="menuitem"
                        disabled={!beoConfigured}
                        title={!beoConfigured ? "Configure VITE_AIRTABLE_FOH_BEO_FIRED_FIELD" : undefined}
                        onClick={() => void handleBeoFire()}
                      >
                        Fire
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            {event.speckComplete ? (
              <span className="dp-foh-action-pill dp-foh-action-pill--speck dp-foh-action-pill--done">✓ Speck</span>
            ) : (
              <button
                type="button"
                className="dp-foh-action-pill dp-foh-action-pill--speck"
                disabled={event.isDemo || saving || !speckConfigured}
                title={!speckConfigured ? "Configure VITE_AIRTABLE_FOH_SPECK_COMPLETE_FIELD" : undefined}
                onClick={() => void handleSpeck()}
              >
                Speck
              </button>
            )}
          </div>
        </div>

        <div className="dp-foh-mock-grid dp-foh-mock-grid--venue-pay">
          <div className="dp-foh-mock-cell">
            <div className="dp-foh-mock-cell-head">
              <IconPin />
              <span>Venue</span>
            </div>
            <div className="dp-foh-mock-cell-value">{event.venue !== "—" ? event.venue : "—"}</div>
          </div>
          <div className="dp-foh-mock-cell">
            <div className="dp-foh-mock-cell-head">
              <IconCard />
              <span>Payment</span>
            </div>
            <div className="dp-foh-mock-cell-value dp-foh-mock-payment-row">
              <span>{paymentLine}</span>
              {paid && <span className="dp-foh-mock-paid-badge">PAID</span>}
            </div>
          </div>
        </div>

        <div className="dp-foh-mock-section">
          <h3 className="dp-foh-mock-section-title">Event timeline</h3>
          {timelineRows.length === 0 ? (
            <p className="dp-foh-mock-empty">No timeline yet — add lines in BEO Intake (Timeline section).</p>
          ) : (
            <ul className="dp-foh-mock-timeline">
              {timelineRows.map((row, i) => {
                const showCheck =
                  i === 0 && (event.beoSentToBOH === true || event.beoFiredToBOH === true);
                return (
                  <li key={i} className="dp-foh-mock-timeline-item">
                    <div className="dp-foh-mock-timeline-track" aria-hidden>
                      <span className={`dp-foh-mock-timeline-dot ${showCheck ? "dp-foh-mock-timeline-dot--done" : ""}`}>
                        {showCheck ? "✓" : ""}
                      </span>
                      {i < timelineRows.length - 1 && <span className="dp-foh-mock-timeline-line" />}
                    </div>
                    <div className="dp-foh-mock-timeline-body">
                      <div className="dp-foh-mock-timeline-time">
                        {row.time || (event.dispatchTimeSeconds != null ? formatClock12FromSeconds(event.dispatchTimeSeconds) : "—")}
                      </div>
                      <div className="dp-foh-mock-timeline-title">{row.title}</div>
                      {row.sub && <div className="dp-foh-mock-timeline-sub">{row.sub}</div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="dp-foh-mock-section">
          <h3 className="dp-foh-mock-section-title">Notes</h3>
          <div className="dp-foh-mock-notes-box">
            {noteLines.length === 0 ? (
              <p className="dp-foh-mock-empty dp-foh-mock-empty--inbox">No notes — add BEO Notes in intake.</p>
            ) : (
              <ul className="dp-foh-mock-notes-list">
                {noteLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {event.isDemo ? (
          <p className="dp-event-detail-sidebar-hint">Demo event — not linked to a record.</p>
        ) : (
          <div className="dp-event-detail-sidebar-actions">
            <button type="button" className="dp-event-detail-sidebar-open-btn" onClick={onOpenEvent}>
              Open event
            </button>
          </div>
        )}

        <p className="dp-event-detail-sidebar-footnote dp-foh-mock-footnote">
          Double-click a card to open · Single-click for details
        </p>
      </aside>
    );
  }

  /* ── Non-FOH: original list layout ── */
  return (
    <aside className={baseAsideClass} aria-label="Event details">
      <div className="dp-event-detail-sidebar-header">
        <h2 className="dp-event-detail-sidebar-title">{listPrimaryLabel(event.client)}</h2>
        <div className="dp-event-detail-sidebar-header-actions">
          <button type="button" className="dp-event-detail-sidebar-close" onClick={onClose} aria-label="Close panel">
            ✕
          </button>
        </div>
      </div>
      <span
        className="dp-event-detail-sidebar-badge"
        style={{
          color: hex,
          borderColor: `${hex}80`,
          backgroundColor: `${hex}14`,
        }}
      >
        {statusLabel}
      </span>

      <dl className="dp-event-detail-sidebar-dl">
        <div className="dp-event-detail-sidebar-row">
          <dt>Date</dt>
          <dd>{event.eventDate ? formatDayHeader(event.eventDate) : "—"}</dd>
        </div>
        <div className="dp-event-detail-sidebar-row">
          <dt>Venue</dt>
          <dd>{event.venue !== "—" ? event.venue : "—"}</dd>
        </div>
        <div className="dp-event-detail-sidebar-row">
          <dt>Guests</dt>
          <dd>{event.guests}</dd>
        </div>
        <div className="dp-event-detail-sidebar-row">
          <dt>Type</dt>
          <dd>{event.eventType}</dd>
        </div>
        <div className="dp-event-detail-sidebar-row">
          <dt>Service</dt>
          <dd>{event.serviceStyle}</dd>
        </div>
        {(event.phone?.trim() ?? "") && (
          <div className="dp-event-detail-sidebar-row">
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${event.phone}`} className="dp-event-detail-sidebar-tel">
                {event.phone}
              </a>
            </dd>
          </div>
        )}
      </dl>

      <div className="dp-event-detail-sidebar-staff">
        <span className="dp-event-detail-sidebar-staff-label">Staffing</span>
        <StaffingAttentionBadge event={event} linkNowsta={false} />
      </div>

      {event.isDemo ? (
        <p className="dp-event-detail-sidebar-hint">Demo event — not linked to a record.</p>
      ) : (
        <div className="dp-event-detail-sidebar-actions">
          <button type="button" className="dp-event-detail-sidebar-open-btn" onClick={onOpenEvent}>
            Open event
          </button>
        </div>
      )}

      <p className="dp-event-detail-sidebar-footnote">Double-click a card in the list to open the event. Single-click selects details here.</p>
    </aside>
  );
}
