const MINUTE_OPTIONS = [0, 15, 30, 45] as const;

/** Round seconds to nearest 15 minutes */
function roundToNearest15(seconds: number): number {
  const m = Math.round((seconds % 3600) / 60 / 15) * 15;
  const h = Math.floor(seconds / 3600);
  return h * 3600 + m * 60;
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
  const h = Math.floor(rounded / 3600);
  const m = Math.floor((rounded % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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

/** Minute options for 15-min increment picker */
export const MINUTE_INCREMENTS = MINUTE_OPTIONS;
