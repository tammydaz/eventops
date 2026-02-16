import { FIELD_IDS } from "./airtable/events";
import { loadEvent, updateEventField } from "./airtable/events";
import { isErrorResult } from "./airtable/selectors";
import { MenuSpecEngine, type SpecEngineInput, type MenuItem } from "./menuSpecEngine";

type MenuSpec = {
  itemName: string;
  quantity: number;
  category: string;
};

type PackOutData = {
  equipment: string[];
  glassware: string[];
  serviceware: string[];
  barSetup: string[];
  flair: string[];
  generatedAt: string;
};

function mapEventToSpecEngineInput(eventData: Record<string, unknown>): SpecEngineInput {
  const guestCount = typeof eventData[FIELD_IDS.GUEST_COUNT] === "number" 
    ? eventData[FIELD_IDS.GUEST_COUNT] as number 
    : 0;
  
  const serviceStyle = typeof eventData[FIELD_IDS.SERVICE_STYLE] === "string" 
    ? eventData[FIELD_IDS.SERVICE_STYLE] as string 
    : "Full Service";
  
  const menuItems: MenuItem[] = [];
  
  const passedApps = eventData[FIELD_IDS.PASSED_APPETIZERS];
  if (Array.isArray(passedApps)) {
    passedApps.forEach((item: any, idx: number) => {
      const itemName = typeof item === "string" ? item : `Passed App ${idx + 1}`;
      menuItems.push({
        itemId: `passed-${idx}`,
        itemName: itemName,
        placement: "Passed App",
      });
    });
  }
  
  const presentedApps = eventData[FIELD_IDS.PRESENTED_APPETIZERS];
  if (Array.isArray(presentedApps)) {
    presentedApps.forEach((item: any, idx: number) => {
      const itemName = typeof item === "string" ? item : `Presented App ${idx + 1}`;
      menuItems.push({
        itemId: `stationed-${idx}`,
        itemName: itemName,
        placement: "Presented App",
      });
    });
  }
  
  const buffetMetalItems = eventData[FIELD_IDS.BUFFET_METAL];
  if (Array.isArray(buffetMetalItems)) {
    buffetMetalItems.forEach((item: any, idx: number) => {
      const itemName = typeof item === "string" ? item : `Buffet Metal Item ${idx + 1}`;
      menuItems.push({
        itemId: `buffet-metal-${idx}`,
        itemName: itemName,
        placement: "Buffet – Metal",
      });
    });
  }
  
  const buffetChinaItems = eventData[FIELD_IDS.BUFFET_CHINA];
  if (Array.isArray(buffetChinaItems)) {
    buffetChinaItems.forEach((item: any, idx: number) => {
      const itemName = typeof item === "string" ? item : `Buffet China Item ${idx + 1}`;
      menuItems.push({
        itemId: `buffet-china-${idx}`,
        itemName: itemName,
        placement: "Buffet – China",
      });
    });
  }
  
  const desserts = eventData[FIELD_IDS.DESSERTS];
  if (Array.isArray(desserts)) {
    desserts.forEach((item: any, idx: number) => {
      const itemName = typeof item === "string" ? item : `Dessert ${idx + 1}`;
      menuItems.push({
        itemId: `dessert-${idx}`,
        itemName: itemName,
        placement: "Dessert",
      });
    });
  }
  
  const eventTypeRaw = eventData[FIELD_IDS.EVENT_TYPE];
  const eventType = typeof eventTypeRaw === "object" && eventTypeRaw != null && "name" in eventTypeRaw
    ? String((eventTypeRaw as { name?: string }).name ?? "").toLowerCase()
    : typeof eventTypeRaw === "string" ? eventTypeRaw.toLowerCase() : "";

  return {
    guestCount,
    menuItems,
    serviceStyle,
    eventType: eventType || "other",
  };
}

function BuildPackOutFromSpecs(specs: MenuSpec[]): PackOutData {
  return {
    equipment: [],
    glassware: [],
    serviceware: [],
    barSetup: [],
    flair: [],
    generatedAt: new Date().toISOString(),
  };
}

export type PackOutLine = { id: string; label: string; category: string; checked?: boolean };

/** Build pack-out list from event data for display. Uses latest eventData (e.g. from store). */
export function buildPackOutList(eventData: Record<string, unknown>): PackOutLine[] {
  const specInput = mapEventToSpecEngineInput(eventData);
  const specOutput = MenuSpecEngine(specInput);
  const lines: PackOutLine[] = [];
  (specOutput.items || []).forEach((r, i) => {
    lines.push({
      id: `item-${i}`,
      label: `${r.itemName} — ${r.totalPortions} portions (${r.category})`,
      category: r.category,
    });
  });
  if (specOutput.equipment) {
    if (specOutput.equipment.chafersTotal) lines.push({ id: "eq-chafers", label: `Chafers: ${specOutput.equipment.chafersTotal}`, category: "Equipment" });
    if (specOutput.equipment.halfPansTotal) lines.push({ id: "eq-halfpans", label: `Half pans: ${specOutput.equipment.halfPansTotal}`, category: "Equipment" });
    if (specOutput.equipment.fullPansTotal) lines.push({ id: "eq-fullpans", label: `Full pans: ${specOutput.equipment.fullPansTotal}`, category: "Equipment" });
    if (specOutput.equipment.roundChafersTotal) lines.push({ id: "eq-round", label: `Round chafers: ${specOutput.equipment.roundChafersTotal}`, category: "Equipment" });
  }
  return lines;
}

export async function generateAndWritePackOut(eventId: string): Promise<void> {
  const eventData = await loadEvent(eventId);
  if (isErrorResult(eventData)) return;

  const currentPackOut = eventData[FIELD_IDS.PACK_OUT_JSON];
  if (currentPackOut !== null && currentPackOut !== undefined && currentPackOut !== "") {
    return;
  }

  const specInput = mapEventToSpecEngineInput(eventData);
  const specOutput = MenuSpecEngine(specInput);
  const specs: MenuSpec[] = (specOutput.items || []).map((i) => ({ itemName: i.itemName, quantity: i.totalPortions, category: i.category }));
  const packOutData = BuildPackOutFromSpecs(specs);
  const packOutJson = JSON.stringify(packOutData);

  await updateEventField(eventId, FIELD_IDS.PACK_OUT_JSON, packOutJson);
}
