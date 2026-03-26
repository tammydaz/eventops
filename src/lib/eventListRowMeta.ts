/** Format seconds since midnight to 12h clock with AM/PM (e.g. "6:00 PM"). */
export function formatClock12FromSeconds(seconds: number): string {
  const h24 = Math.floor(seconds / 3600) % 24;
  const m = Math.floor((seconds % 3600) / 60);
  const am = h24 < 12;
  const h12 = h24 % 12 || 12;
  const mm = String(m).padStart(2, "0");
  return `${h12}:${mm} ${am ? "AM" : "PM"}`;
}

function formatDayHeader(dateStr: string): string {
  const [y, mo, day] = dateStr.split("-").map(Number);
  const d = new Date(y, mo - 1, day);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${day}, ${y}`;
}

/** Detail panel: "Mon, Apr 21, 2026 • 6:00 PM – 10:00 PM" when dispatch exists. */
export function formatDetailDateTimeLine(event: { eventDate?: string; dispatchTimeSeconds?: number }): string {
  const datePart = event.eventDate ? formatDayHeader(event.eventDate) : "—";
  if (event.dispatchTimeSeconds != null && Number.isFinite(event.dispatchTimeSeconds)) {
    const s = event.dispatchTimeSeconds;
    const end = (s + 4 * 3600) % (24 * 3600);
    return `${datePart} • ${formatClock12FromSeconds(s)} – ${formatClock12FromSeconds(end)}`;
  }
  return datePart;
}

function cityStateZipLine(city?: string, state?: string, zip?: string): string {
  const c = (city ?? "").trim();
  const s = (state ?? "").trim();
  const z = (zip ?? "").trim();
  if (!c && !s && !z) return "";
  if (c && s && z) return `${c}, ${s} ${z}`;
  if (c && s) return `${c}, ${s}`;
  return [c, s, z].filter(Boolean).join(", ");
}

/** Street + city/state/zip for sidebar — client fields when event is at client address, else venue fields. */
export function displayAddressForListItem(e: {
  venue?: string;
  venueStreet?: string;
  venueCity?: string;
  venueState?: string;
  venueZip?: string;
  clientStreet?: string;
  clientCity?: string;
  clientState?: string;
  clientZip?: string;
}): string {
  const vName = (e.venue ?? "").trim();
  const hasVenueGeo = !!(
    e.venueStreet?.trim() ||
    e.venueCity?.trim() ||
    e.venueState?.trim() ||
    e.venueZip?.trim()
  );
  if (hasVenueGeo) {
    const lines: string[] = [];
    if (vName && vName !== "—") lines.push(vName);
    if (e.venueStreet?.trim()) lines.push(e.venueStreet.trim());
    const line2 = cityStateZipLine(e.venueCity, e.venueState, e.venueZip);
    if (line2) lines.push(line2);
    return lines.join("\n") || "—";
  }
  const lines: string[] = [];
  if (vName && vName !== "—") lines.push(vName);
  if (e.clientStreet?.trim()) lines.push(e.clientStreet.trim());
  const line2 = cityStateZipLine(e.clientCity, e.clientState, e.clientZip);
  if (line2) lines.push(line2);
  const out = lines.join("\n");
  return out || "—";
}

/**
 * Prefer Airtable venue; when missing, use the event-name suffix only if it is not a date
 * (formula titles like "Client – 03/26/2026" must not show the date as venue).
 */
export function venueDisplayFromListItem(e: { eventName?: string; venue?: string }): string {
  const fromField = (e.venue ?? "").trim();
  if (fromField && fromField !== "—") return fromField;
  const parts = (e.eventName ?? "").split(/\s*[–—-]\s*/);
  const second = parts[1]?.trim() ?? "";
  if (!second) return "—";
  const looksLikeDate =
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(second) ||
    /^\d{1,2}\/\d{1,2}\/\d{2}$/.test(second) ||
    /^\d{4}-\d{2}-\d{2}$/.test(second);
  if (looksLikeDate) return "—";
  return second;
}

/** Primary label for list/command views — client only (no event title). */
export function listPrimaryLabel(client: string): string {
  const t = (client ?? "").trim();
  if (!t || t === "—") return "—";
  return t;
}

/** Compact time label for list rows (e.g. "6–10p") from dispatch seconds. */
function fmtClock(seconds: number): string {
  const h24 = Math.floor(seconds / 3600) % 24;
  const m = Math.floor((seconds % 3600) / 60);
  const ampm = h24 >= 12 ? "p" : "a";
  const h12 = h24 % 12 || 12;
  const mm = m > 0 ? `:${String(m).padStart(2, "0")}` : "";
  return `${h12}${mm}${ampm}`;
}

/** Right-side meta: time range if dispatch known, else light guest hint. */
export function formatListRowTimeMeta(evt: {
  dispatchTimeSeconds?: number;
  guests?: number;
}): string {
  if (evt.dispatchTimeSeconds != null && Number.isFinite(evt.dispatchTimeSeconds)) {
    const s = evt.dispatchTimeSeconds;
    const end = (s + 4 * 3600) % (24 * 3600);
    return `${fmtClock(s)}–${fmtClock(end)}`;
  }
  if (evt.guests != null && evt.guests > 0) return `${evt.guests} guests`;
  return "";
}
