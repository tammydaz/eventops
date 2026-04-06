import type { ClientIntakeSnapshot } from "../services/airtable/clientIntake";
import type { EventForClientOverview } from "../services/airtable/events";

/** Stable fake Client Intake ids — open `/client/<id>` to preview Client Overview with many events. */
export const DEMO_CLIENT_OVERVIEW_SCROLL_A = "recDemoClientScrollMultiA";
export const DEMO_CLIENT_OVERVIEW_SCROLL_B = "recDemoClientScrollMultiB";

const DEMO_BY_ID: Record<
  string,
  { snapshot: ClientIntakeSnapshot; events: EventForClientOverview[] }
> = {
  [DEMO_CLIENT_OVERVIEW_SCROLL_A]: {
    snapshot: {
      clientName: "Jordan Ellis",
      companyName: "Acme Catering Partners",
      phone: "(555) 301-4400",
      email: "jordan.ellis@acmecatering.example",
    },
    events: buildDemoEvents("A", [
      { d: "2026-06-20", ho: "HO-5091", t: "Full Service", g: 220 },
      { d: "2026-05-02", ho: "HO-5088", t: "Full Service", g: 180 },
      { d: "2026-04-18", ho: "HO-5072", t: "Corporate", g: 95 },
      { d: "2026-03-14", ho: "HO-5065", t: "Full Service", g: 160 },
      { d: "2026-02-22", ho: "HO-5051", t: "Delivery", g: 45 },
      { d: "2026-01-11", ho: "HO-5038", t: "Full Service", g: 200 },
      { d: "2025-12-07", ho: "HO-5024", t: "Tasting", g: 12 },
      { d: "2025-11-01", ho: "HO-5010", t: "Full Service", g: 175 },
      { d: "2025-09-19", ho: "HO-4996", t: "Pickup", g: 30 },
      { d: "2025-08-03", ho: "HO-4982", t: "Full Service", g: 140 },
      { d: "2025-06-28", ho: "HO-4965", t: "Corporate", g: 110 },
      { d: "2025-05-17", ho: "HO-4950", t: "Full Service", g: 190 },
      { d: "2025-04-05", ho: "HO-4933", t: "Delivery", g: 60 },
      { d: "2025-02-14", ho: "HO-4911", t: "Full Service", g: 155 },
      { d: "2024-12-01", ho: "HO-4888", t: "Full Service", g: 130 },
    ]),
  },
  [DEMO_CLIENT_OVERVIEW_SCROLL_B]: {
    snapshot: {
      clientName: "Elena Rivera",
      companyName: "Rivera Family",
      phone: "(555) 772-0091",
      email: "elena.rivera@example.com",
    },
    events: buildDemoEvents("B", [
      { d: "2026-04-12", ho: "HO-6120", t: "Full Service", g: 200 },
      { d: "2026-02-01", ho: "HO-6105", t: "Full Service", g: 165 },
      { d: "2025-11-22", ho: "HO-6088", t: "Corporate", g: 40 },
      { d: "2025-09-07", ho: "HO-6071", t: "Full Service", g: 185 },
      { d: "2025-06-15", ho: "HO-6054", t: "Delivery", g: 55 },
      { d: "2025-03-08", ho: "HO-6030", t: "Full Service", g: 210 },
      { d: "2024-11-30", ho: "HO-5999", t: "Tasting", g: 8 },
      { d: "2024-08-18", ho: "HO-5975", t: "Full Service", g: 175 },
    ]),
  },
};

function buildDemoEvents(
  suffix: string,
  rows: Array<{ d: string; ho: string; t: string; g: number }>
): EventForClientOverview[] {
  return rows.map((row, i) => ({
    id: `recDemoScroll${suffix}_ev${String(i + 1).padStart(2, "0")}`,
    eventDate: row.d,
    createdSortMs: 1_700_000_000_000 - i * 86_400_000,
    eventType: row.t,
    guestCount: row.g,
    houseOrder: row.ho,
  }));
}

export function getDemoClientOverviewData(
  clientId: string
): { snapshot: ClientIntakeSnapshot; events: EventForClientOverview[] } | null {
  return DEMO_BY_ID[clientId] ?? null;
}

export function isDemoClientOverviewClient(clientId: string): boolean {
  return clientId in DEMO_BY_ID;
}
