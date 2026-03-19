/**
 * BeoIntakeView — Intake laid out like the printed BEO.
 * Sections in print order with pill headers (● TITLE ●). Click pill to open; filled sections stay, empty can collapse.
 */
import { useState, useEffect } from "react";
import { BeoIntakeViewProvider } from "./BeoIntakeViewContext";
import { HeaderSection } from "./HeaderSection";
import { EventCoreSection } from "./EventCoreSection";
import { MenuAndBeveragesSection } from "./MenuAndBeveragesSection";
import { KitchenAndServicewareSection } from "./KitchenAndServicewareSection";
import { TimelineSection } from "./TimelineSection";
import { SiteVisitLogisticsSection } from "./SiteVisitLogisticsSection";
import { ApprovalsLockoutSection } from "./ApprovalsLockoutSection";
import { useEventStore } from "../../state/eventStore";
import { asString, asLinkedRecordIds } from "../../services/airtable/selectors";
import { FIELD_IDS } from "../../services/airtable/events";

const SECTION_COLORS: Record<string, string> = {
  "HEADER": "#00bcd4",
  "EVENT DETAILS": "#00bcd4",
  "PASSED APPETIZERS": "#22c55e",
  "PRESENTED APPETIZERS": "#f97316",
  "BUFFET – METAL": "#3b82f6",
  "BUFFET – CHINA": "#3b82f6",
  "DESSERTS": "#ef4444",
  "MENU & BEVERAGES": "#22c55e",
  "BEVERAGES": "#22c55e",
  "KITCHEN & SERVICEWARE": "#a855f7",
  "PAPER PRODUCTS": "#a855f7",
  "TIMELINE": "#3b82f6",
  "NOTES & LOGISTICS": "#eab308",
};
const DEFAULT_DOT = "#6b7280";

function getDotColor(title: string): string {
  return SECTION_COLORS[title] ?? DEFAULT_DOT;
}

type SectionSlot = {
  id: string;
  title: string;
  children: React.ReactNode;
  /** When true, section is shown even when collapsed (has content). When false, section can be hidden when empty. */
  alwaysShow?: boolean;
  hasContent?: (data: Record<string, unknown>) => boolean;
};

export function BeoIntakeView(props: {
  eventId: string;
  eventName: string;
  isDelivery: boolean;
}) {
  const { eventId, eventName, isDelivery } = props;
  const selectedEventData = useEventStore((s) => s.selectedEventData);
  const data = selectedEventData ?? {};

  const hasMenuItems = (fieldId: string, customId?: string) => {
    const ids = asLinkedRecordIds(data[fieldId]);
    if (ids.length > 0) return true;
    if (customId) {
      const raw = asString(data[customId]);
      if (raw?.trim()) return true;
    }
    return false;
  };
  const hasText = (fieldId: string) => !!asString(data[fieldId])?.trim();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "header": true,
    "event": true,
  });

  const toggle = (id: string) => setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  // When URL has ?section= we jump here; open the matching pill so the section is in the DOM
  const sectionIdToSlotId: Record<string, string> = {
    "beo-section-header": "header",
    "beo-section-event": "event",
    "beo-section-menu": "menu",
    "beo-section-bar": "menu",
    "beo-section-serviceware": "kitchen",
    "beo-section-timeline": "timeline",
    "beo-section-notes": "notes",
  };
  useEffect(() => {
    const handler = (e: Event) => {
      const sectionId = (e as CustomEvent<string>).detail;
      const slotId = sectionIdToSlotId[sectionId];
      if (slotId) setOpenSections((prev) => ({ ...prev, [slotId]: true }));
    };
    window.addEventListener("beo-jump-to-section", handler);
    return () => window.removeEventListener("beo-jump-to-section", handler);
  }, []);

  const sections: SectionSlot[] = [
    { id: "header", title: "HEADER", alwaysShow: true, children: <HeaderSection /> },
    { id: "event", title: "EVENT DETAILS", alwaysShow: true, children: <EventCoreSection isDelivery={isDelivery} hideHeaderFields /> },
    {
      id: "menu",
      title: "MENU & BEVERAGES",
      hasContent: () =>
        hasMenuItems(FIELD_IDS.PASSED_APPETIZERS, FIELD_IDS.CUSTOM_PASSED_APP) ||
        hasMenuItems(FIELD_IDS.PRESENTED_APPETIZERS, FIELD_IDS.CUSTOM_PRESENTED_APP) ||
        hasMenuItems(FIELD_IDS.BUFFET_METAL, FIELD_IDS.CUSTOM_BUFFET_METAL) ||
        hasMenuItems(FIELD_IDS.BUFFET_CHINA, FIELD_IDS.CUSTOM_BUFFET_CHINA) ||
        hasMenuItems(FIELD_IDS.DESSERTS, FIELD_IDS.CUSTOM_DESSERTS),
      children: <MenuAndBeveragesSection isDelivery={isDelivery} />,
    },
    ...(!isDelivery
      ? [
          { id: "kitchen", title: "KITCHEN & SERVICEWARE", children: <KitchenAndServicewareSection /> } as SectionSlot,
          { id: "timeline", title: "TIMELINE", hasContent: () => hasText(FIELD_IDS.BEO_TIMELINE), children: <TimelineSection /> } as SectionSlot,
          { id: "notes", title: "NOTES & LOGISTICS", hasContent: () => hasText(FIELD_IDS.BEO_NOTES) || hasText(FIELD_IDS.DIETARY_NOTES), children: <SiteVisitLogisticsSection /> } as SectionSlot,
        ]
      : []),
  ];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 120 }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 12, textAlign: "center" }}>
        Click a section to open it · Filled sections stay; empty ones collapse
      </div>
      {sections.map((slot) => {
        const isOpen = openSections[slot.id] ?? false;
        const hasContent = slot.alwaysShow || slot.hasContent?.(data);
        const dotColor = getDotColor(slot.title);
        return (
          <div
            key={slot.id}
            style={{
              background: "#fff",
              border: "2px solid #000",
              borderRadius: 4,
              marginBottom: 8,
              overflow: "hidden",
              color: "#111",
            }}
          >
            <BeoIntakeViewProvider
              value={{
                inBeoView: true,
                controlledOpen: isOpen,
                onToggle: () => toggle(slot.id),
              }}
            >
              <button
                type="button"
                onClick={() => toggle(slot.id)}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  padding: "8px 16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#000",
                }}
              >
                <span style={{ color: dotColor, fontSize: 18, lineHeight: 0 }}>●</span>
                <span>{slot.title}</span>
                <span style={{ color: dotColor, fontSize: 18, lineHeight: 0 }}>●</span>
                <span style={{ marginLeft: 4, fontSize: 10, color: "#666" }}>{isOpen ? "▼" : "▶"}</span>
              </button>
              {isOpen && slot.children}
            </BeoIntakeViewProvider>
          </div>
        );
      })}
      <ApprovalsLockoutSection eventId={eventId} eventName={eventName} />
    </div>
  );
}
