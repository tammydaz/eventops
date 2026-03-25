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
