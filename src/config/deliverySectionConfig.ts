/**
 * Delivery BEO — kitchen + driver facing sections.
 *
 *   DISPOSABLE HOT     → cook, pack hot in disposable chafer pan, goes out hot
 *   DISPOSABLE READY   → prep, pack in disposable chafer pan, client reheats on site
 *   DISPOSABLE DISPLAY → cold/room-temp presentation items (platters, cheese boards, crudite, fruit)
 *   DISPOSABLE BULK    → bulk cold sides in large containers (pasta salad, fruit salad, salads)
 *   INDIVIDUAL WRAPPED → individually wrapped items (boxed lunches)
 *   SANDWICH TRAYS     → deli trays
 *
 * Intake, print, kitchen BEO, and shadow preview all derive from this config.
 */
import { FIELD_IDS } from "../services/airtable/events";

export type DeliverySectionId =
  | "chafer_hot"
  | "chafer_ready"
  | "ready_display"
  | "cold_display"
  | "bulk_sides"
  | "individual_wrapped"
  | "sandwich_trays";

export type DeliverySectionRow = {
  id: DeliverySectionId;
  /** UI heading */
  title: string;
  icon: string;
  /** Passed to MenuPickerModal / fetchDeliveryMenuPickerItems */
  pickerType: string;
  /** usePickerStore targetField (must map via targetFieldToSection except cold sentinel) */
  targetField: string;
  /** Events table linked fields that may contribute items to this section */
  fieldIds: readonly string[];
  /** Custom long-text fields merged into this section on print */
  customFieldIds: readonly string[];
};

const HOT_EVENT_FIELDS: readonly string[] = [
  FIELD_IDS.BUFFET_METAL,
  FIELD_IDS.PASSED_APPETIZERS,
  FIELD_IDS.PRESENTED_APPETIZERS,
];

const COLD_EVENT_FIELDS: readonly string[] = [
  FIELD_IDS.BUFFET_CHINA,
  FIELD_IDS.ROOM_TEMP_DISPLAY,
  FIELD_IDS.DESSERTS,
];

/** Matches full-service `CourseStyleBlock`: uppercase title + dot color per delivery row. */
export const DELIVERY_COURSE_BLOCK: Record<
  DeliverySectionId,
  { blockTitle: string; dotColor: string }
> = {
  chafer_hot: { blockTitle: "DISPOSABLE HOT", dotColor: "#ef4444" },
  chafer_ready: { blockTitle: "DISPOSABLE READY", dotColor: "#f97316" },
  ready_display: { blockTitle: "DISPOSABLE DISPLAY", dotColor: "#3b82f6" },
  cold_display: { blockTitle: "DISPOSABLE DISPLAY", dotColor: "#3b82f6" },
  bulk_sides: { blockTitle: "DISPOSABLE BULK", dotColor: "#26a69a" },
  individual_wrapped: { blockTitle: "INDIVIDUAL WRAPPED", dotColor: "#eab308" },
  sandwich_trays: { blockTitle: "SANDWICH TRAYS", dotColor: "#d97706" },
};

export const DELIVERY_SECTION_CONFIG: readonly DeliverySectionRow[] = [
  {
    id: "chafer_hot",
    title: "Hot / Tin",
    icon: "🔥",
    pickerType: "delivery_chafer_hot",
    targetField: "buffetMetal",
    fieldIds: HOT_EVENT_FIELDS,
    customFieldIds: [
      FIELD_IDS.CUSTOM_BUFFET_METAL,
      FIELD_IDS.CUSTOM_PASSED_APP,
      FIELD_IDS.CUSTOM_PRESENTED_APP,
    ],
  },
  {
    id: "chafer_ready",
    title: "Ready / Tin",
    icon: "♨️",
    pickerType: "delivery_chafer_ready",
    targetField: "buffetMetal",
    fieldIds: HOT_EVENT_FIELDS,
    customFieldIds: [],
  },
  {
    id: "ready_display",
    title: "Ready / Display",
    icon: "🧀",
    pickerType: "delivery_ready_display",
    targetField: "roomTempDisplay",
    fieldIds: [FIELD_IDS.ROOM_TEMP_DISPLAY],
    customFieldIds: [FIELD_IDS.CUSTOM_ROOM_TEMP_DISPLAY],
  },
  {
    id: "cold_display",
    title: "Ready / Cold",
    icon: "🧊",
    pickerType: "delivery_cold_display",
    targetField: "__delivery_cold__",
    fieldIds: COLD_EVENT_FIELDS,
    customFieldIds: [
      FIELD_IDS.CUSTOM_BUFFET_CHINA,
      FIELD_IDS.CUSTOM_DESSERTS,
    ],
  },
  {
    id: "bulk_sides",
    title: "Ready / Bulk",
    icon: "🍲",
    pickerType: "delivery_bulk_sides",
    targetField: "buffetChina",
    fieldIds: [FIELD_IDS.BUFFET_CHINA, FIELD_IDS.ROOM_TEMP_DISPLAY],
    customFieldIds: [],
  },
  {
    id: "individual_wrapped",
    title: "Individual Wrapped",
    icon: "📦",
    pickerType: "delivery_individual_wrapped",
    targetField: "deliveryDeli",
    fieldIds: [FIELD_IDS.DELIVERY_DELI],
    customFieldIds: [],
  },
  {
    id: "sandwich_trays",
    title: "Sandwich Trays",
    icon: "🥪",
    pickerType: "delivery_sandwich_trays",
    targetField: "deliveryDeli",
    fieldIds: [FIELD_IDS.DELIVERY_DELI],
    customFieldIds: [FIELD_IDS.CUSTOM_DELIVERY_DELI],
  },
] as const;

/**
 * Shadow Event Menu "Section" strings grouped under each delivery row (for preview / labels).
 * Same Airtable section may appear under more than one row; print filters by execution when possible.
 */
export const DELIVERY_SECTION_SHADOW_KEYS: readonly (readonly string[])[] = DELIVERY_SECTION_CONFIG.map(
  (row) => {
    if (row.id === "chafer_hot" || row.id === "chafer_ready") {
      return ["Passed Appetizers", "Presented Appetizers", "Buffet – Metal"];
    }
    if (row.id === "ready_display") {
      return ["Room Temp", "Room Temp / Display"];
    }
    if (row.id === "cold_display" || row.id === "bulk_sides") {
      return ["Buffet – China", "Room Temp", "Room Temp / Display", "Desserts"];
    }
    return ["Deli"];
  }
);

const HOT_FIELD_SET = new Set(HOT_EVENT_FIELDS);
const hasExec = (exec: string[], needle: string) =>
  exec.some((e) => e.toUpperCase().includes(needle.toUpperCase()));

/** Print / UI: assign one linked item to at most one delivery section (priority: display > bulk > cold). */
export function deliveryItemBelongsInSection(
  sectionId: DeliverySectionId,
  executionTokens: string[],
  sourceFieldId: string
): boolean {
  const legacy = executionTokens.length === 0;

  switch (sectionId) {
    case "chafer_hot": {
      if (!HOT_FIELD_SET.has(sourceFieldId)) return false;
      if (hasExec(executionTokens, "BULK SIDES")) return false;
      if (hasExec(executionTokens, "CHAFER READY")) return false;
      if (hasExec(executionTokens, "CHAFER HOT")) return true;
      return legacy;
    }
    case "chafer_ready": {
      if (!HOT_FIELD_SET.has(sourceFieldId)) return false;
      if (hasExec(executionTokens, "CHAFER READY")) return true;
      return false;
    }
    case "ready_display": {
      if (sourceFieldId !== FIELD_IDS.ROOM_TEMP_DISPLAY) return false;
      if (hasExec(executionTokens, "ROOM TEMP") || hasExec(executionTokens, "DISPLAY")) return true;
      if (legacy && sourceFieldId === FIELD_IDS.ROOM_TEMP_DISPLAY) return true;
      return false;
    }
    case "bulk_sides": {
      if (sourceFieldId !== FIELD_IDS.BUFFET_CHINA && sourceFieldId !== FIELD_IDS.ROOM_TEMP_DISPLAY)
        return false;
      if (sourceFieldId === FIELD_IDS.ROOM_TEMP_DISPLAY) return false;
      if (hasExec(executionTokens, "BULK SIDES")) return true;
      return false;
    }
    case "cold_display": {
      if (sourceFieldId === FIELD_IDS.ROOM_TEMP_DISPLAY) return false;
      if (sourceFieldId === FIELD_IDS.DESSERTS) {
        if (hasExec(executionTokens, "BULK SIDES")) return false;
        return true;
      }
      if (sourceFieldId === FIELD_IDS.BUFFET_CHINA) {
        if (hasExec(executionTokens, "BULK SIDES")) return false;
        if (
          hasExec(executionTokens, "COLD DISPLAY") ||
          hasExec(executionTokens, "DESSERTS") ||
          hasExec(executionTokens, "ROOM TEMP")
        ) {
          return true;
        }
        return legacy;
      }
      return false;
    }
    case "individual_wrapped": {
      if (sourceFieldId !== FIELD_IDS.DELIVERY_DELI) return false;
      if (legacy) return false;
      if (hasExec(executionTokens, "INDIVIDUAL PACKS")) return true;
      return false;
    }
    case "sandwich_trays": {
      if (sourceFieldId !== FIELD_IDS.DELIVERY_DELI) return false;
      if (legacy) return true;
      if (hasExec(executionTokens, "INDIVIDUAL PACKS")) return false;
      return true;
    }
    default:
      return false;
  }
}
