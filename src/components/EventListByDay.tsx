import { useMemo } from "react";
import { useQuestionStore } from "../state/questionStore";
import type { DepartmentKey } from "../lib/productionHelpers";
import {
  getProductionColor,
  getProductionColorForFOH,
  isProductionFrozen,
  PRODUCTION_COLORS,
  shouldBlink,
  shouldBlinkForDepartment,
} from "../lib/productionHelpers";
import { formatListRowTimeMeta, listPrimaryLabel } from "../lib/eventListRowMeta";
import { addDaysToIso, startOfWeekMonday } from "../lib/weekRange";

/** Minimal event shape for list-by-day (Dashboard + EventsPipeline). */
export type ListByDayEvent = {
  id: string;
  eventDate?: string;
  name: string;
  client: string;
  venue: string;
  guests: number;
  category: string;
  eventType: string;
  serviceStyle: string;
  isDemo?: boolean;
  productionFrozen?: boolean;
  phone?: string;
  beoSentToBOH?: boolean;
  dispatchTimeSeconds?: number;
};

const SHORT_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function formatDayColumnHeader(dateStr: string): string {
  const [y, m, day] = dateStr.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  return `${SHORT_DAYS[d.getDay()]} ${day}`;
}

function sortColumnEvents(
  arr: ListByDayEvent[],
  sortBy: "date" | "client" | "venue" | "eventType" | "serviceStyle",
  sortDir: "asc" | "desc"
): ListByDayEvent[] {
  const out = [...arr];
  const mult = sortDir === "asc" ? 1 : -1;
  out.sort((a, b) => {
    let cmp = 0;
    if (sortBy === "date") cmp = (a.eventDate ?? "").localeCompare(b.eventDate ?? "");
    else if (sortBy === "client") cmp = a.client.localeCompare(b.client);
    else if (sortBy === "venue") cmp = a.venue.localeCompare(b.venue);
    else if (sortBy === "eventType") cmp = a.eventType.localeCompare(b.eventType);
    else if (sortBy === "serviceStyle") cmp = a.serviceStyle.localeCompare(b.serviceStyle);
    return mult * cmp;
  });
  return out;
}

export function buildListDayColumns(
  events: ListByDayEvent[],
  activeTab: string,
  today: string
): { dateStr: string; events: ListByDayEvent[] }[] {
  const byDate = events.reduce<Record<string, ListByDayEvent[]>>((acc, e) => {
    const d = e.eventDate ?? "";
    if (!d) return acc;
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});

  if (activeTab === "Weekly") {
    const days: string[] = [];
    let cur = startOfWeekMonday(today);
    for (let i = 0; i < 7; i++) {
      days.push(cur);
      cur = addDaysToIso(cur, 1);
    }
    return days.map((dateStr) => ({
      dateStr,
      events: events.filter((e) => e.eventDate === dateStr),
    }));
  }

  if (activeTab === "Today's Events") {
    return [{ dateStr: today, events: events.filter((e) => e.eventDate === today) }];
  }

  const dates = Object.keys(byDate).sort();
  if (activeTab === "Completed" || activeTab === "Archive") {
    dates.sort((a, b) => b.localeCompare(a));
  }
  return dates.map((dateStr) => ({
    dateStr,
    events: byDate[dateStr] ?? [],
  }));
}

export type EventListByDayProps = {
  events: ListByDayEvent[];
  activeTab: string;
  today: string;
  sortBy: "date" | "client" | "venue" | "eventType" | "serviceStyle";
  sortDir: "asc" | "desc";
  isFOH?: boolean;
  deptKey: DepartmentKey | null;
  /** Single click — show right detail panel */
  onSelectDetail: (evt: ListByDayEvent) => void;
  /** Double click — navigate / open event */
  onOpenEvent: (evt: ListByDayEvent) => void;
  selectedEventId?: string | null;
};

export function EventListByDay({
  events,
  activeTab,
  today,
  sortBy,
  sortDir,
  isFOH,
  deptKey,
  onSelectDetail,
  onOpenEvent,
  selectedEventId,
}: EventListByDayProps) {
  const hasUnacknowledgedForDepartment = useQuestionStore((s) => s.hasUnacknowledgedForDepartment);

  const columns = useMemo(() => {
    const raw = buildListDayColumns(events, activeTab, today);
    return raw.map((col) => ({
      ...col,
      events: sortColumnEvents(col.events, sortBy, sortDir),
    }));
  }, [events, activeTab, today, sortBy, sortDir]);

  if (events.length === 0) {
    return (
      <div className="dp-events-list dp-list-by-day">
        <div className="dp-events-empty">
          <p>No events in &quot;{activeTab}&quot;</p>
          <p className="dp-events-empty-hint">
            {activeTab === "Today's Events" && "Try Weekly or Upcoming Events, or add an event."}
            {(activeTab === "Weekly" || activeTab === "Upcoming Events") && "Add an event via Quick Intake or Upload Invoice."}
            {(activeTab === "Completed" || activeTab === "Archive") && "Past events will appear here."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dp-events-list dp-list-by-day">
      <div className="dp-list-by-day-scroll" role="region" aria-label="Events by day">
        {columns.map((col) => (
          <div key={col.dateStr} className="dp-list-day-column">
            <div className="dp-list-day-column-header">
              <span className="dp-list-day-column-header-day">{formatDayColumnHeader(col.dateStr)}</span>
              <span className="dp-list-day-column-header-count">
                {col.events.length} {col.events.length === 1 ? "order" : "orders"}
              </span>
            </div>
            <div className="dp-list-day-column-body">
              {col.events.length === 0 ? (
                <div className="dp-list-day-empty">No events</div>
              ) : (
                col.events.map((evt) => {
                  const prodColor = isFOH
                    ? getProductionColorForFOH({
                        eventType: evt.eventType,
                        beoSentToBOH: evt.beoSentToBOH,
                      })
                    : getProductionColor(evt as never);
                  const dotHex = PRODUCTION_COLORS[prodColor];
                  const canSelect = !evt.isDemo;
                  const blink =
                    canSelect &&
                    (isFOH
                      ? hasUnacknowledgedForDepartment(evt.id, "intake_foh")
                      : deptKey
                        ? shouldBlinkForDepartment(evt as never, deptKey)
                        : shouldBlink(evt as never));
                  const frozen = canSelect && isProductionFrozen(evt as never);
                  const timeMeta = formatListRowTimeMeta(evt) || "—";
                  const selected = selectedEventId === evt.id;
                  const rowLabel = listPrimaryLabel(evt.client);

                  return (
                    <div
                      key={evt.id}
                      className={`dp-list-row-mock ${selected ? "dp-list-row-mock--selected" : ""} ${blink ? "dp-list-row-mock--blink" : ""} ${frozen ? "dp-list-row-mock--frozen" : ""} ${evt.isDemo ? "dp-list-row-mock--demo" : ""}`}
                      data-production={prodColor}
                      role="button"
                      tabIndex={0}
                      aria-label={`${rowLabel}. ${timeMeta}.`}
                      onClick={() => {
                        onSelectDetail(evt);
                      }}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        onOpenEvent(evt);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Spacebar") {
                          e.preventDefault();
                          onSelectDetail(evt);
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          onOpenEvent(evt);
                        }
                      }}
                    >
                      <span className="dp-list-row-mock-dot" style={{ backgroundColor: dotHex, boxShadow: `0 0 8px ${dotHex}66` }} aria-hidden />
                      <span className="dp-list-row-mock-title">{evt.name}</span>
                      <span className="dp-list-row-mock-time">{timeMeta}</span>
                      {evt.isDemo && <span className="dp-list-row-mock-demo-badge">Demo</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
