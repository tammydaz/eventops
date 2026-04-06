import type { NavigateFunction } from "react-router-dom";
import { DASHBOARD_CALENDAR_TO } from "./dashboardRoutes";
import { resolveClientIntakeIdFromEventHints } from "../services/airtable/clientIntake";
import { useEventStore } from "../state/eventStore";

export type NavigateToClientOrEventArgs = {
  navigate: NavigateFunction;
  linkedClientRecordId?: string;
  eventId?: string;
  /** From selected event row — used when Events → Client link is empty */
  clientPhone?: string;
  primaryContactPhone?: string;
  clientNameHint?: string;
};

function hintsFromLoadedEvent(eventId: string): Pick<
  NavigateToClientOrEventArgs,
  "clientPhone" | "primaryContactPhone" | "clientNameHint"
> {
  const e = useEventStore.getState().events.find((x) => x.id === eventId);
  if (!e) return {};
  const clientNameHint = (e.eventName ?? "").split(/\s*[–—-]\s*/)[0]?.trim();
  return {
    clientPhone: e.clientPhone,
    primaryContactPhone: e.primaryContactPhone,
    clientNameHint: clientNameHint && clientNameHint !== "—" ? clientNameHint : undefined,
  };
}

/**
 * Single path for **search** and **client dropdown** selection: Client Overview when linked (or resolvable), else Event Overview.
 * Do not use raw search text — pass ids from the selected row/option only.
 */
export async function navigateToClientOrEvent({
  navigate,
  linkedClientRecordId,
  eventId,
  clientPhone,
  primaryContactPhone,
  clientNameHint,
}: NavigateToClientOrEventArgs): Promise<void> {
  const link = (linkedClientRecordId ?? "").trim();
  const eid = (eventId ?? "").trim();
  if (link) {
    navigate(`/client/${link}`);
    return;
  }
  const resolved = await resolveClientIntakeIdFromEventHints({
    clientPhone,
    primaryContactPhone,
    clientNameHint,
  });
  if (resolved) {
    navigate(`/client/${resolved}`);
    return;
  }
  if (eid) {
    navigate(`/event/${eid}`);
    return;
  }
  navigate(DASHBOARD_CALENDAR_TO);
}

const CLIENT_PREFIX = "client:";
const EVENT_PREFIX = "event:";

export type ClientDropdownOption = { value: string; label: string };

/** Build merged, sorted options: linked Client Intake rows + one fallback event per unlinked client name. */
export function buildIntakeClientDropdownOptions(
  rawEvents: Array<{
    id: string;
    eventName?: string;
    eventDate?: string;
    linkedClientRecordId?: string;
  }>
): ClientDropdownOption[] {
  const byClientId = new Map<string, string>();
  const linkedNames = new Set<string>();
  for (const e of rawEvents) {
    const name = (e.eventName ?? "").split(/\s*[–—-]\s*/)[0]?.trim() || "—";
    if (e.linkedClientRecordId) {
      linkedNames.add(name);
      if (!byClientId.has(e.linkedClientRecordId)) byClientId.set(e.linkedClientRecordId, name);
    }
  }

  const opts: ClientDropdownOption[] = [];
  byClientId.forEach((label, cid) => {
    opts.push({ value: `${CLIENT_PREFIX}${cid}`, label });
  });

  const unlinkedByName = new Map<string, { id: string; date: string }>();
  for (const e of rawEvents) {
    if (e.linkedClientRecordId) continue;
    const name = (e.eventName ?? "").split(/\s*[–—-]\s*/)[0]?.trim() || "—";
    if (linkedNames.has(name)) continue;
    const d = e.eventDate ?? "";
    const prev = unlinkedByName.get(name);
    if (!prev || d.localeCompare(prev.date) > 0) {
      unlinkedByName.set(name, { id: e.id, date: d });
    }
  }
  unlinkedByName.forEach(({ id }, name) => {
    opts.push({ value: `${EVENT_PREFIX}${id}`, label: name });
  });

  return opts.sort((a, b) => a.label.localeCompare(b.label));
}

export function parseIntakeClientDropdownValue(v: string): { kind: "client" | "event"; id: string } | null {
  const trimmed = v.trim();
  if (trimmed.startsWith(CLIENT_PREFIX)) {
    const id = trimmed.slice(CLIENT_PREFIX.length).trim();
    if (id) return { kind: "client", id };
    return null;
  }
  if (trimmed.startsWith(EVENT_PREFIX)) {
    const id = trimmed.slice(EVENT_PREFIX.length).trim();
    if (id) return { kind: "event", id };
    return null;
  }
  return null;
}

export function navigateFromIntakeDropdownValue(navigate: NavigateFunction, value: string): void {
  const p = parseIntakeClientDropdownValue(value);
  if (p) {
    if (p.kind === "client") {
      void navigateToClientOrEvent({
        navigate,
        linkedClientRecordId: p.id,
        eventId: "",
      });
      return;
    }
    const hints = hintsFromLoadedEvent(p.id);
    void navigateToClientOrEvent({
      navigate,
      linkedClientRecordId: undefined,
      eventId: p.id,
      ...hints,
    });
    return;
  }
  navigate(DASHBOARD_CALENDAR_TO);
}
