import { FIELD_IDS } from "./airtable/events";
import { loadEvent, updateEventField } from "./airtable/events";
import { isErrorResult } from "./airtable/selectors";
import { calculateSpecsForEvent, formatSpecForDisplay } from "../lib/specs/calculateSpecs";

type PackOutData = {
  equipment: string[];
  glassware: string[];
  serviceware: string[];
  barSetup: string[];
  flair: string[];
  generatedAt: string;
};

export type PackOutLine = { id: string; label: string; category: string; checked?: boolean };

/** Build pack-out list from event data. Uses Spec Engine (Master Menu Specs) when available. */
export async function buildPackOutList(eventId: string | null): Promise<PackOutLine[]>;
export function buildPackOutList(eventData: Record<string, unknown>): PackOutLine[];

export function buildPackOutList(
  eventIdOrData: string | null | Record<string, unknown>
): PackOutLine[] | Promise<PackOutLine[]> {
  if (typeof eventIdOrData === "string" && eventIdOrData) {
    return buildPackOutListAsync(eventIdOrData);
  }
  if (eventIdOrData && typeof eventIdOrData === "object" && "id" in eventIdOrData) {
    return buildPackOutListSync(eventIdOrData as Record<string, unknown>);
  }
  return [];
}

async function buildPackOutListAsync(eventId: string): Promise<PackOutLine[]> {
  const result = await calculateSpecsForEvent(eventId);
  if ("error" in result) return [];

  const lines: PackOutLine[] = result.items.map((r, i) => ({
    id: r.itemId || `item-${i}`,
    label: `${r.itemName} — ${formatSpecForDisplay(r.fwxSpecValue, r.unitType)}`,
    category: r.unitType,
  }));

  const totalChafers = result.items.reduce((sum, r) => sum + r.chaferCount, 0);
  const fullPans = result.items.filter((r) => r.unitType === "Full Pan").reduce((sum, r) => sum + r.fwxSpecValue, 0);
  const halfPans = result.items.filter((r) => r.unitType === "Half Pan").reduce((sum, r) => sum + r.fwxSpecValue, 0);
  const roundPans = result.items.filter((r) => r.unitType === "Round Pan").reduce((sum, r) => sum + r.fwxSpecValue, 0);
  const quarts = result.items.filter((r) => r.unitType === "Quart").reduce((sum, r) => sum + r.fwxSpecValue, 0);

  if (totalChafers > 0) lines.push({ id: "eq-chafers", label: `Chafers: ${totalChafers}`, category: "Equipment" });
  if (fullPans > 0) lines.push({ id: "eq-fullpans", label: `Full Pans: ${fullPans}`, category: "Equipment" });
  if (halfPans > 0) lines.push({ id: "eq-halfpans", label: `Half Pans: ${halfPans}`, category: "Equipment" });
  if (roundPans > 0) lines.push({ id: "eq-roundpans", label: `Round Pans: ${roundPans}`, category: "Equipment" });
  if (quarts > 0) lines.push({ id: "eq-quarts", label: `Quarts: ${quarts}`, category: "Equipment" });

  return lines;
}

function buildPackOutListSync(eventData: Record<string, unknown>): PackOutLine[] {
  const eventId = eventData.id as string | undefined;
  if (!eventId) return [];
  return [];
}

export async function generateAndWritePackOut(eventId: string): Promise<void> {
  const eventData = await loadEvent(eventId);
  if (isErrorResult(eventData)) return;

  const currentPackOut = eventData[FIELD_IDS.PACK_OUT_JSON];
  if (currentPackOut !== null && currentPackOut !== undefined && currentPackOut !== "") {
    return;
  }

  const result = await calculateSpecsForEvent(eventId);
  if ("error" in result) return;

  const packOutData: PackOutData = {
    equipment: result.items
      .filter((i) => i.chaferCount > 0)
      .map((i) => `${i.itemName}: ${i.chaferCount} chafer(s)`),
    glassware: [],
    serviceware: [],
    barSetup: [],
    flair: [],
    generatedAt: new Date().toISOString(),
  };
  const packOutJson = JSON.stringify(packOutData);
  await updateEventField(eventId, FIELD_IDS.PACK_OUT_JSON, packOutJson);
}
