const MINUTE_OPTIONS = [0, 15, 30, 45] as const;

/** Round seconds to nearest 15 minutes */
function roundToNearest15(seconds: number): number {
  const m = Math.round((seconds % 3600) / 60 / 15) * 15;
  const h = Math.floor(seconds / 3600);
  return h * 3600 + m * 60;
}

/** Convert seconds since midnight or "HH:mm" string → "4:00 PM" (12-hour format), or "—" for empty */
export function secondsTo12HourString(seconds: number | string | null | undefined): string {
  if (seconds === undefined || seconds === null) return "—";
  let totalSeconds: number;
  if (typeof seconds === "string") {
    const hmMatch = seconds.match(/^(\d{1,2}):(\d{2})/);
    if (hmMatch) {
      totalSeconds = parseInt(hmMatch[1], 10) * 3600 + parseInt(hmMatch[2], 10) * 60;
    } else {
      const date = new Date(seconds);
      if (!isNaN(date.getTime())) {
        totalSeconds = date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds();
      } else return "—";
    }
  } else if (typeof seconds === "number" && !isNaN(seconds)) {
    totalSeconds = seconds;
  } else return "—";
  let h = Math.floor(totalSeconds / 3600);
  let m = Math.floor((totalSeconds % 3600) / 60);
  // Clamp invalid hours (e.g. 31, 88 from bad data) to valid range
  if (h >= 24) h = h % 24;
  if (m >= 60) m = 59;
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Convert Airtable duration (seconds or timestamp) → "HH:mm" (rounded to 15-min), or "—" for empty */
export function secondsToTimeString(seconds: number | string | null | undefined): string {
  if (seconds === undefined || seconds === null) {
    return "—";
  }

  let totalSeconds: number;

  if (typeof seconds === "string") {
    const date = new Date(seconds);
    if (!isNaN(date.getTime())) {
      totalSeconds = date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds();
    } else {
      return "—";
    }
  } else if (typeof seconds === "number" && !isNaN(seconds)) {
    totalSeconds = seconds;
  } else {
    return "—";
  }

  const rounded = roundToNearest15(totalSeconds);
  let h = Math.floor(rounded / 3600);
  let m = Math.floor((rounded % 3600) / 60);
  // Clamp invalid hours (e.g. 31, 88 from bad data) to valid range
  if (h >= 24) h = h % 24;
  if (m >= 60) m = 59;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Parse "10:00 AM" or "10:00 PM" → seconds since midnight for Airtable */
export function twelveHourStringToSeconds(s: string): number | null {
  if (!s || !s.trim()) return null;
  const m = s.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = (m[3] || "").toUpperCase();
  if (h >= 24 || min >= 60) return null;
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 3600 + min * 60;
}

/** Convert "HH:mm" → seconds for Airtable (minutes rounded to 0, 15, 30, 45) */
export function timeStringToSeconds(timeStr: string): number | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const roundedM = MINUTE_OPTIONS.reduce((prev, curr) =>
    Math.abs(curr - m) < Math.abs(prev - m) ? curr : prev
  );
  return h * 3600 + roundedM * 60;
}

/** Add minutes to a time string ("10:00 AM") and return formatted result */
export function addMinutesToTimeString(timeStr: string, minutes: number): string {
  const sec = twelveHourStringToSeconds(timeStr);
  if (sec == null) return "—";
  const totalSec = sec + minutes * 60;
  return secondsTo12HourString(totalSec);
}

/** Minute options for 15-min increment picker */
export const MINUTE_INCREMENTS = MINUTE_OPTIONS;
