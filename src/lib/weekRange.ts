/** Add days to a calendar date string YYYY-MM-DD (local). */
export function addDaysToIso(iso: string, add: number): string {
  const [y, m, day] = iso.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  d.setDate(d.getDate() + add);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `iso` (weeks run Mon–Sun). */
export function startOfWeekMonday(iso: string): string {
  const [y, m, day] = iso.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  const dow = d.getDay();
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - daysFromMonday);
  return d.toISOString().slice(0, 10);
}

/** Sunday of the week containing `iso`. */
export function endOfWeekSunday(iso: string): string {
  return addDaysToIso(startOfWeekMonday(iso), 6);
}

export function weekRangeMondaySunday(iso: string): { monday: string; sunday: string } {
  const monday = startOfWeekMonday(iso);
  return { monday, sunday: addDaysToIso(monday, 6) };
}
