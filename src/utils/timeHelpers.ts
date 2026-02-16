/** Convert Airtable duration (seconds) → "HH:mm" for <input type="time"> */
export function secondsToTimeString(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds)) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Convert "HH:mm" from <input type="time"> → seconds for Airtable */
export function timeStringToSeconds(timeStr: string): number | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 3600 + m * 60;
}
