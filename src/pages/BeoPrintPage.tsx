import React, { useEffect, useState } from "react";
import { useEventStore } from "../state/eventStore";
import { useBeoPrintStore } from "../state/beoPrintStore";
import { FIELD_IDS, getBarServiceFieldId } from "../services/airtable/events";
import { asSingleSelectName, asString, asStringArray } from "../services/airtable/selectors";
import { calculateSpec } from "../services/airtable/specEngine";
import { secondsToTimeString, secondsTo12HourString } from "../utils/timeHelpers";
import { sanitizeForHeader } from "../utils/httpHeaders";
import { FULL_BAR_PACKAGE, FULL_BAR_PACKAGE_SPECK_ROWS, getFullBarPackagePackoutItems, getSignatureCocktailGreeting } from "../constants/fullBarPackage";

// ── Types ──
type MenuLineItem = {
  id: string;
  name: string;
  specQty?: string;
  specVessel?: string;
  packOutItems?: string;
  loaded?: boolean;
};

type SectionData = {
  title: string;
  fieldId: string;
  items: MenuLineItem[];
};

// ── View Modes (left column checklist) ──
import type { LeftCheckMode } from "../state/beoPrintStore";
type LeftCheck = LeftCheckMode;
// ── Top tabs (main document types) ──
type TopTab = "kitchenBEO" | "meetingBeoNotes" | "fullBeoPacket" | "buffetMenuSigns" | "serverBeo2ndPage";

// ── Section color by type ──
const getSectionColor = (sectionTitle: string): string => {
  if (sectionTitle.includes("PASSED")) return "#22c55e";
  if (sectionTitle.includes("PRESENTED")) return "#f97316";
  if (sectionTitle.includes("BUFFET")) return "#3b82f6";
  if (sectionTitle.includes("DESSERT")) return "#ef4444";
  if (sectionTitle.includes("STATION")) return "#a855f7";
  return "#6b7280";
};

// ── Header design tokens (coral reserved for dietary alerts only) ──
const ACCENT = "#e85d5d";           // dietary / highlights only
const HEADER_ACCENT = "#0d9488";    // dispatch/job/times — light teal, ink-friendly

// ── Header field: compact inline label + value ──
function HeaderField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "baseline", flexWrap: "nowrap" }}>
      <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, flexShrink: 0 }}>{label}:</span>
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: highlight ? HEADER_ACCENT : "#111",
      }}>{value || "—"}</span>
    </div>
  );
}

// ── Header field with vertical divider after label (for grid cells) ──
function HeaderFieldWithDivider({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr",
      alignItems: "center",
      minHeight: "100%",
    }}>
      <span style={{
        fontSize: 11,
        color: "#6b7280",
        fontWeight: 500,
        paddingRight: 8,
        borderRight: "1px solid #374151",
      }}>{label}:</span>
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: highlight ? HEADER_ACCENT : "#111",
        paddingLeft: 8,
      }}>{value || "—"}</span>
    </div>
  );
}

// ── Extract eventId from URL ──
const getEventIdFromUrl = (): string | null => {
  const parts = window.location.pathname.split("/");
  const idx = parts.indexOf("beo-print");
  if (idx !== -1 && parts[idx + 1]) {
    return parts[idx + 1];
  }
  return null;
};

// ── Cursive font for section headers ──
const SECTION_HEADER_FONT = "'Dancing Script', 'Brush Script MT', 'Lucida Handwriting', cursive";

// ── Menu print theme options (Airtable Single Select) ──
const MENU_THEME_OPTIONS = [
  { label: "Classic European", slug: "classic-european" },
  { label: "Modern Minimal", slug: "modern-minimal" },
  { label: "Rustic Elegant", slug: "rustic-elegant" },
  { label: "Black Tie Formal", slug: "black-tie-formal" },
] as const;
const themeLabelToSlug = (label: string): string =>
  MENU_THEME_OPTIONS.find((o) => o.label === label)?.slug ?? "classic-european";

// ── Styles ──
const printStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
  .print-only { display: none !important; }
  @media print {
    html {
      color-scheme: light !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      color: #000 !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      color: #000 !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #root, #root > * {
      background: #fff !important;
      color: #000 !important;
      visibility: visible !important;
      opacity: 1 !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .beo-print-content {
      color: #000 !important;
      background: #fff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      width: 100% !important;
      max-width: none !important;
      padding: 0 !important;
      margin: 0 !important;
      box-sizing: border-box !important;
      font-size: 14pt !important;
    }
    .beo-print-layout, .beo-print-main {
      background: #fff !important;
      max-width: none !important;
    }
    .beo-print-table thead {
      display: table-header-group !important;
    }
    .beo-print-table thead tr td {
      vertical-align: top !important;
    }
    .beo-letterhead-bar {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-size: 13pt !important;
      font-weight: 600 !important;
    }
    .beo-section-card {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .beo-event-header-block {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .beo-event-details-table {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      font-size: 14pt !important;
    }
    .beo-menu-item-block {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .beo-banner-block {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .beo-footer-block {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .beo-section-header {
      font-size: 18pt !important;
      font-weight: 700 !important;
    }
    .beo-line-item {
      font-size: 14pt !important;
    }
    .beo-spec-col {
      font-size: 14pt !important;
    }
    .beo-item-col {
      font-size: 14pt !important;
    }
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    .print-page { break-after: page; }
    .kitchen-beo-page { break-after: page; }
    .kitchen-beo-page:not(:first-child) { break-before: page !important; }
    .kitchen-beo-page:last-child { break-after: auto; }
    .meeting-beo-notes-section { break-before: page !important; }
    .menu-section-page { break-after: page !important; width: 8in !important; min-height: 10in !important; box-sizing: border-box !important; }
  }
  @page {
    size: 8.5in 11in;
    margin: 0.5in;
    margin-top: 1.5in;
    @top-center {
      font-size: 18pt;
      font-weight: 800;
      color: #111;
      letter-spacing: 0.05em;
    }
  }
  @page :first {
    margin-top: 0.5in;
    @top-center {
      content: none;
    }
  }
`;

// ── Menu print styles (Buffet Menu Signs tab only) — scoped to .print-menu-mode / .print-tent-mode ──
const clientMenuPrintStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap');
  .menu-item-icons { font-size: 0.8em; margin-left: 6px; }
  @media print {
    .print-menu-mode .menu-section-page,
    .print-tent-mode .tent-card { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .print-menu-mode .menu-section-page {
      height: calc(11in - 1.5in) !important;
      min-height: calc(11in - 1.5in) !important;
      max-height: calc(11in - 1.5in) !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }
    .print-menu-mode .menu-section-page:not(:first-child) {
      page-break-before: always !important;
      break-before: page !important;
    }
    .print-menu-mode .menu-section-page.too-tall {
      transform: scale(0.9) !important;
      transform-origin: top center !important;
    }
    .print-menu-mode .menu-section-page.too-tall-2 {
      transform: scale(0.8) !important;
      transform-origin: top center !important;
    }
    .print-menu-mode .menu-section-page:last-child { page-break-after: auto !important; break-after: auto !important; }
    .print-tent-mode .tent-cards-page {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      grid-template-rows: 1fr 1fr !important;
      width: 100% !important;
      height: 10in !important;
      gap: 0.25in !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      padding: 0.25in !important;
      box-sizing: border-box !important;
    }
    .print-tent-mode .tent-cards-page:last-child { page-break-after: auto !important; break-after: auto !important; }
    .print-tent-mode .tent-card {
      min-height: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      page-break-inside: avoid !important;
      border: 1px solid rgba(0,0,0,0.15) !important;
      border-radius: 4px !important;
      overflow: hidden !important;
    }
    .print-tent-mode .tent-panel {
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 14pt !important;
      text-align: center !important;
      padding: 0.2in !important;
      min-height: 0 !important;
    }
    .print-tent-mode .tent-panel.bottom { transform: rotate(180deg) !important; }
    body.print-menu-mode,
    body.print-menu-mode #root,
    body.print-menu-mode #root > *,
    .print-wrapper.print-menu-mode,
    .print-wrapper.print-tent-mode { background: #f8f5f0 !important; color: #2c2c2c !important; }
    .print-wrapper .buffet-menu-signs-container {
      font-family: "Source Serif 4", "Georgia", serif !important;
      width: 100% !important;
      max-width: none !important;
      padding: 0 !important;
      margin: 0 !important;
      box-sizing: border-box !important;
      display: block !important;
    }
    .print-menu-mode .menu-section-page {
      background: #f8f5f0 !important;
      border: 1px solid rgba(0,0,0,0.2) !important;
      width: 100% !important;
      max-width: none !important;
      min-height: 9in !important;
      padding: 1.5in 0.75in !important;
      margin: 0 !important;
      box-shadow: none !important;
      position: relative !important;
    }
    .print-menu-mode.theme-classic-european .menu-section-page::before,
    .print-tent-mode.theme-classic-european .tent-card::before {
      content: "❧" !important;
      position: absolute !important;
      top: 0.4in !important;
      left: 0.4in !important;
      font-size: 12pt !important;
      color: rgba(0,0,0,0.12) !important;
      pointer-events: none !important;
    }
    .print-menu-mode.theme-classic-european .menu-section-page::after,
    .print-tent-mode.theme-classic-european .tent-card::after {
      content: "❧" !important;
      position: absolute !important;
      bottom: 0.4in !important;
      right: 0.4in !important;
      font-size: 12pt !important;
      color: rgba(0,0,0,0.12) !important;
      pointer-events: none !important;
    }
    .print-menu-mode .buffet-sign-title,
    .print-tent-mode .tent-panel-content { font-family: "Cormorant Garamond", "Georgia", serif !important; }
    .print-menu-mode .buffet-sign-title {
      font-size: 26pt !important;
      font-weight: 600 !important;
      font-style: italic !important;
      letter-spacing: 0.2em !important;
      text-transform: uppercase !important;
      text-align: center !important;
      margin-bottom: 1.5em !important;
      color: #2c2c2c !important;
    }
    .print-menu-mode .menu-section-content { display: flex !important; flex-direction: column !important; align-items: stretch !important; width: 100% !important; text-align: left !important; }
    .print-menu-mode .buffet-sign-item { margin-bottom: 1.5em !important; padding-bottom: 1.25em !important; border-bottom: 1px solid rgba(0,0,0,0.1) !important; text-align: left !important; }
    .print-menu-mode .buffet-sign-item:last-child { border-bottom: none !important; }
    .print-menu-mode .buffet-sign-item-name,
    .print-menu-mode .menu-item-row,
    .print-menu-mode .menu-item-rows { font-family: "Source Serif 4", "Georgia", serif !important; font-size: 14pt !important; font-weight: 600 !important; line-height: 1.6 !important; text-align: left !important; }
    .print-menu-mode .buffet-sign-item-desc { font-size: 12pt !important; font-style: italic !important; color: #555 !important; }
    .print-menu-mode .buffet-sign-ornament { text-align: center !important; font-size: 16pt !important; color: rgba(0,0,0,0.2) !important; margin: 1em 0 !important; letter-spacing: 0.6em !important; }
    .print-menu-mode.theme-modern-minimal .menu-section-page,
    .print-tent-mode.theme-modern-minimal .tent-card { background: #fff !important; }
    .print-menu-mode.theme-rustic-elegant .menu-section-page,
    .print-tent-mode.theme-rustic-elegant .tent-card { background: #faf6f0 !important; }
    .print-menu-mode.theme-black-tie-formal .menu-section-page,
    .print-tent-mode.theme-black-tie-formal .tent-card { background: #fff !important; }
    .print-menu-mode.theme-black-tie-formal .buffet-sign-title { background: #000 !important; color: #fff !important; padding: 0.25em 0.5em !important; }
  }
`;

// Client menu @page: no page numbers. Margins: 0.75in (full menu) or 0.5in (tent). Injected only when Buffet Menu Signs tab is active.
const getClientMenuPageStyles = (printMode: "menu" | "tent") => `
  @media print {
    @page {
      size: 8.5in 11in;
      margin: ${printMode === "tent" ? "0.5in" : "0.75in"};
      @top-center { content: none !important; }
      @top-left { content: none !important; }
      @top-right { content: none !important; }
      @bottom-center { content: none !important; }
      @bottom-left { content: none !important; }
      @bottom-right { content: none !important; }
    }
    @page :first {
      margin: ${printMode === "tent" ? "0.5in" : "0.75in"};
      @top-center { content: none !important; }
    }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    maxWidth: 900,
    margin: "0 auto",
    padding: "12px 24px",
    background: "#fff",
    color: "#000",
  },
  header: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "auto auto auto auto",
    gap: "6px 32px",
    padding: "16px 24px",
    background: "#f5f5f5",
    marginBottom: 16,
    borderRadius: 8,
    border: "2px solid #000",
    alignItems: "center",
  },
  headerLeft: {
    display: "flex",
    fontSize: 13,
    lineHeight: 1.5,
    alignItems: "center",
  },
  headerRight: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    fontSize: 13,
    lineHeight: 1.5,
    textAlign: "right" as const,
  },
  headerLabel: {
    fontWeight: 700,
    marginRight: 4,
    minWidth: "auto",
  },
  headerValue: { fontWeight: 400 },
  allergyBanner: {
    background: "#ffe5e5",
    color: "#c41e3a",
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 12,
    border: "2px solid #ff0000",
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  notBuffetBanner: {
    background: "#e0f2fe",
    color: "#0369a1",
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 12,
    border: "2px solid #0284c7",
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  sectionCard: {
    background: "transparent",
    border: "3px solid #000",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden" as const,
  },
  sectionHeader: {
    background: "transparent",
    color: "#000",
    padding: "10px 16px",
    fontSize: 18,
    fontWeight: 700,
    fontFamily: SECTION_HEADER_FONT,
    textAlign: "center" as const,
    marginTop: 16,
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  lineItem: {
    display: "grid",
    padding: "8px 16px",
    borderBottom: "1px solid #eee",
    fontSize: 13,
    alignItems: "center" as const,
  },
  specCol: { fontWeight: 700, color: "#555", fontSize: 12 },
  itemCol: { fontWeight: 600, color: "#333" },
  packOutCol: { fontSize: 11, color: "#666", textAlign: "right" as const },
  checkboxCol: { display: "flex", alignItems: "center", justifyContent: "center" },
  footer: {
    borderTop: "3px solid #000",
    marginTop: 20,
    paddingTop: 6,
    paddingBottom: 6,
  },
  footerStrip: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    fontWeight: 500,
    color: "#333",
  },
  footerSeparator: {
    color: "#999",
    fontSize: 10,
    userSelect: "none" as const,
  },
  toolbar: {
    display: "flex",
    gap: 12,
    padding: "16px 32px",
    background: "#111",
    justifyContent: "center",
  },
  toolbarBtn: {
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 700,
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    color: "#fff",
  },
  activeBtn: { background: "#ff6b6b" },
  inactiveBtn: { background: "#333" },
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#1a1a1a",
  },
  leftSidebar: {
    width: 200,
    padding: "16px 12px",
    background: "#252525",
    borderRight: "1px solid #444",
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  leftBox: {
    padding: "12px 14px",
    borderRadius: 6,
    border: "2px solid #444",
    background: "#333",
    color: "#e0e0e0",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "all 0.15s",
  },
  leftBoxActive: {
    borderColor: "#ff6b6b",
    background: "#3d2a2a",
    color: "#fff",
  },
  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "auto",
  },
  topTabs: {
    display: "flex",
    gap: 8,
    padding: "12px 20px",
    background: "#111",
    borderBottom: "1px solid #444",
    alignItems: "center",
    flexWrap: "wrap",
  },
  topTab: {
    padding: "12px 14px",
    borderRadius: 6,
    border: "2px solid #444",
    background: "#333",
    color: "#e0e0e0",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  topTabActive: {
    borderColor: "#ff6b6b",
    background: "#3d2a2a",
    color: "#fff",
  },
  noteModalOverlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  noteModal: {
    background: "#1a1a1a",
    border: "2px solid #444",
    borderRadius: 8,
    padding: 24,
    width: "90%",
    maxWidth: 480,
    color: "#e0e0e0",
  },
  noteModalTitle: { fontSize: 16, fontWeight: 700, marginBottom: 12 },
  noteModalTextarea: {
    width: "100%",
    minHeight: 120,
    padding: 12,
    fontSize: 14,
    background: "#333",
    border: "2px solid #555",
    borderRadius: 6,
    color: "#fff",
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
  },
  noteModalBtns: { display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end" },
  addNoteBtn: {
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    background: "#2d8cf0",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  deleteItemBtn: {
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 600,
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "60vh",
    fontSize: 18,
    color: "#999",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
};

// ── Buffet Menu Signs (8x10 signs: Presented Apps, Buffet, Desserts) ──
function BuffetMenuSignsContent(props: {
  eventData: Record<string, unknown>;
  menuItemData: Record<string, { name: string; childIds: string[]; description?: string; dietaryTags?: string }>;
  buffetMenuEdits: Record<string, string>;
  onEditDescription: (itemId: string, value: string) => void;
  onDeleteItem: (itemId: string) => void;
  hiddenMenuItems: Set<string>;
  parseMenuItems: (fieldId: string) => MenuLineItem[];
  expandItemToRows: (item: MenuLineItem) => { lineName: string; isChild: boolean; itemId: string }[];
  printMode: "menu" | "tent";
  menuTheme: string;
}) {
  const { menuItemData, buffetMenuEdits, onEditDescription, onDeleteItem, hiddenMenuItems, parseMenuItems, expandItemToRows, printMode, menuTheme } = props;
  const themeSlug = themeLabelToSlug(menuTheme);
  const sectionRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  const filterHidden = (items: MenuLineItem[]) => items.filter((i) => !hiddenMenuItems.has(i.id));
  const presentedItems = filterHidden(parseMenuItems(FIELD_IDS.PRESENTED_APPETIZERS));
  const buffetMetalItems = filterHidden(parseMenuItems(FIELD_IDS.BUFFET_METAL));
  const buffetChinaItems = filterHidden(parseMenuItems(FIELD_IDS.BUFFET_CHINA));
  const buffetItems = [...buffetMetalItems, ...buffetChinaItems];
  const dessertItems = filterHidden(parseMenuItems(FIELD_IDS.DESSERTS));

  const getDescription = (itemId: string) =>
    buffetMenuEdits[itemId] ?? menuItemData[itemId]?.description ?? "";
  const getDietaryTags = (itemId: string) => menuItemData[itemId]?.dietaryTags ?? "";

  // ── Render item with children and inline dietary icons (used for full menu and tent cards) ──
  const renderItemWithChildrenAndIcons = (item: MenuLineItem) => {
    const rows = expandItemToRows(item);
    return (
      <div className="menu-item-rows">
        {rows.map((r, i) => (
          <div key={i} className="menu-item-row" style={{ display: "flex", alignItems: "baseline", flexWrap: "nowrap", marginBottom: i < rows.length - 1 ? 4 : 0 }}>
            <span style={{ flex: "0 0 auto" }}>{r.lineName}</span>
            {getDietaryTags(r.itemId) && (
              <span className="menu-item-icons" style={{ fontSize: "0.8em", marginLeft: 6, flexShrink: 0 }}>{getDietaryTags(r.itemId)}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ── Too-tall detection: add class if section content overflows (content area = 9.5in - 3in padding = 6.5in) ──
  useEffect(() => {
    if (printMode !== "menu") return;
    const contentAreaPx = (11 - 1.5) * 96 - 1.5 * 96 * 2;
    const check = () => {
      sectionRefs.current.forEach((el) => {
        if (!el) return;
        const content = el.querySelector(".menu-section-content");
        if (!content) return;
        const overflow = content.scrollHeight > contentAreaPx;
        el.classList.remove("too-tall", "too-tall-2");
        if (overflow) {
          el.classList.add("too-tall");
          if (content.scrollHeight > contentAreaPx * 1.2) el.classList.add("too-tall-2");
        }
      });
    };
    check();
    const t1 = setTimeout(check, 100);
    const t2 = setTimeout(check, 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [printMode, presentedItems, buffetItems, dessertItems]);

  const sections = [
    { title: "Presented Appetizers", items: presentedItems },
    { title: "Buffet", items: buffetItems },
    { title: "Desserts", items: dessertItems },
  ];

  if (printMode === "tent") {
    const allItems = [...presentedItems, ...buffetItems, ...dessertItems];
    const CARDS_PER_PAGE = 4;
    const tentPages: MenuLineItem[][] = [];
    for (let i = 0; i < allItems.length; i += CARDS_PER_PAGE) {
      tentPages.push(allItems.slice(i, i + CARDS_PER_PAGE));
    }
    if (allItems.length > 0 && tentPages.length === 0) tentPages.push(allItems);
    return (
      <div className={`print-wrapper print-tent-mode theme-${themeSlug}`} style={{ ...styles.page, maxWidth: "8.5in" }}>
        <div className="beo-print-content buffet-menu-signs-container tent-cards-grid">
          {allItems.length === 0 ? (
            <div style={{ color: "#999", textAlign: "center", padding: 48 }}>No items</div>
          ) : (
            tentPages.map((pageItems, pageIdx) => (
              <div key={pageIdx} className="tent-cards-page">
                {pageItems.map((item) => (
                  <div key={item.id} className="tent-card">
                    <div className="tent-panel top">
                      <div className="tent-panel-content">
                        {renderItemWithChildrenAndIcons(item)}
                      </div>
                    </div>
                    <div className="tent-panel bottom">
                      <div className="tent-panel-content">
                        {renderItemWithChildrenAndIcons(item)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`print-wrapper print-menu-mode theme-${themeSlug}`} style={{ ...styles.page, maxWidth: "8.5in" }}>
      <div className="beo-print-content buffet-menu-signs-container print-menu-mode">
        {sections.map((sec, idx) => (
          <div
            key={sec.title}
            ref={(r) => { sectionRefs.current[idx] = r; }}
            className="menu-section-page"
            style={{
              width: "8in",
              minHeight: "10in",
              padding: "0.75in",
              margin: "0 auto 24px",
              background: "#fff",
              border: "2px solid #000",
              boxSizing: "border-box",
            }}
          >
            <div className="menu-section-content">
              <div className="buffet-sign-ornament" style={{ textAlign: "center" as const, fontSize: 18, color: "#c9c4b8", marginBottom: 8, letterSpacing: "0.5em" }}>◆ ◆ ◆</div>
              <div className="buffet-sign-title" style={{ fontSize: 28, fontWeight: 800, textAlign: "center" as const, marginBottom: 24, textTransform: "uppercase" as const, letterSpacing: 2, fontFamily: SECTION_HEADER_FONT }}>
                {sec.title}
              </div>
              {sec.items.length === 0 ? (
                <div style={{ color: "#999", textAlign: "center", padding: 24 }}>No items</div>
              ) : (
                sec.items.map((item) => {
                  const desc = getDescription(item.id);
                  return (
                    <div key={item.id} className="buffet-sign-item" style={{ marginBottom: 20, borderBottom: "1px solid #eee", paddingBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="buffet-sign-item-name" style={{ fontWeight: 700, fontSize: 18, marginBottom: 6, textAlign: "left" }}>
                            {renderItemWithChildrenAndIcons(item)}
                          </div>
                          {(desc || buffetMenuEdits[item.id]) && (
                            <div className="buffet-sign-item-desc" style={{ fontSize: 14, color: "#444", marginTop: 6, fontStyle: "italic", textAlign: "left" }}>
                              {getDescription(item.id)}
                            </div>
                          )}
                        </div>
                        <button type="button" className="no-print" style={styles.deleteItemBtn} onClick={() => onDeleteItem(item.id)} title="Remove from menu">Delete</button>
                      </div>
                      <div className="no-print" style={{ marginTop: 8 }}>
                        <textarea
                          placeholder="Add/edit description..."
                          value={buffetMenuEdits[item.id] ?? menuItemData[item.id]?.description ?? ""}
                          onChange={(e) => onEditDescription(item.id, e.target.value)}
                          style={{ width: "100%", minHeight: 60, padding: 8, fontSize: 14, border: "1px solid #ccc", borderRadius: 4, resize: "vertical", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
              <div className="buffet-sign-ornament buffet-sign-ornament-bottom" style={{ textAlign: "center" as const, fontSize: 18, color: "#c9c4b8", marginTop: 24, letterSpacing: "0.5em" }}>◆ ◆ ◆</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section colors for Server BEO 2nd page ──
const SERVER_BEO_SECTION_COLORS = {
  beverage: "#22c55e",
  paperProducts: "#a855f7",
  notes: "#eab308",
  timeline: "#3b82f6",
} as const;

// ── Excel-style table styles for Server 2nd page (tight, aligned) ──
const serverBeoTable = {
  width: "100%",
  borderCollapse: "collapse" as const,
  fontSize: 12,
  border: "1px solid #000",
};
const serverBeoCell = {
  padding: "4px 8px",
  border: "1px solid #000",
  verticalAlign: "top" as const,
  lineHeight: 1.35,
};
const serverBeoHeader = {
  ...serverBeoCell,
  fontWeight: 700,
  textAlign: "center" as const,
  background: "#fff",
};

// ── Parse serviceware lines (• Item (Supplier) – qty) into { item, qty, supplier } ──
function parseServicewareLines(text: string): { item: string; qty: string; supplier: string }[] {
  const lines = (text || "").split(/\n/).filter(Boolean);
  const items: { item: string; qty: string; supplier: string }[] = [];
  for (const line of lines) {
    const bullet = (line.startsWith("•") ? line.slice(1) : line).trim();
    if (!bullet) continue;
    const parenStart = bullet.indexOf("(");
    const parenEnd = bullet.indexOf(")");
    let itemName = bullet;
    let qty = "";
    let supplier = "";
    if (parenStart >= 0 && parenEnd > parenStart) {
      itemName = bullet.slice(0, parenStart).trim();
      supplier = bullet.slice(parenStart + 1, parenEnd).trim();
      const rest = bullet.slice(parenEnd + 1).trim();
      const dashMatch = rest.match(/[–\-]\s*(.+)/);
      if (dashMatch) qty = dashMatch[1].replace("Provided by host", "").trim();
    }
    if (itemName) items.push({ item: itemName, qty, supplier });
  }
  return items;
}

// ── Section pill for BEO print (with dot color, always expanded) ──
function BeoSectionPill({
  title,
  dotColor,
  children,
}: { title: string; dotColor: string; children: React.ReactNode }) {
  return (
    <div className="beo-section-card" style={styles.sectionCard}>
      <div
        style={{
          width: "100%",
          ...styles.sectionHeader,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <span style={{ color: dotColor, fontSize: "28px", lineHeight: 0 }}>●</span>
        <span>{title}</span>
        <span style={{ color: dotColor, fontSize: "28px", lineHeight: 0 }}>●</span>
      </div>
      <div style={{ padding: "0 16px 16px" }}>{children}</div>
    </div>
  );
}

// ── Speck / Item two-column rows (Server BEO 2nd page format) ──
// Speck = left column (quantities, codes; can use + or - for separation)
// Item = right column (multiple items allowed on one line)
function SpeckItemTable({ rows }: { rows: { speck: string; item: string }[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td style={{ verticalAlign: "top", padding: "4px 12px 4px 0", width: "1%", whiteSpace: "nowrap", fontWeight: 600, color: "#333" }}>
              {r.speck}
            </td>
            <td style={{ verticalAlign: "top", padding: "4px 0", color: "#111" }}>
              {r.item}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Speck / Item with right column (3-col layout matching Kitchen BEO) ──
// Column 1: speck | Column 2: item | Column 3: checkbox / override / packout
function SpeckItemTableWithRightCol(props: {
  rows: { speck: string; item: string }[];
  sectionKey: string;
  leftCheck: string;
  gridTemplateColumns: string;
  checkState: Record<string, boolean>;
  setCheckState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  specOverrides: Record<string, string>;
  setSpecOverrides: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  packOutEdits: Record<string, string>;
  setPackOutEdits: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const { rows, sectionKey, leftCheck, gridTemplateColumns, checkState, setCheckState, specOverrides, setSpecOverrides, packOutEdits, setPackOutEdits } = props;
  const prefix = `serverbeo2:${sectionKey}`;
  return (
    <div style={{ fontSize: 14 }}>
      {rows.map((r, rowIdx) => {
        const checkKey = `${leftCheck}:${prefix}:${rowIdx}`;
        const overrideKey = `${prefix}:${rowIdx}`;
        const packOutKey = `${prefix}:${rowIdx}`;
        return (
          <div
            key={rowIdx}
            className="beo-line-item"
            style={{ ...styles.lineItem, borderBottom: "none", gridTemplateColumns, padding: "1px 12px", lineHeight: 1, minHeight: "unset", alignItems: "flex-start" }}
          >
            {/* Spec column (left): auto spec on screen; effective (override or auto) when printing */}
            <div className="beo-spec-col" style={{ ...styles.specCol, lineHeight: 1 }}>
              <span className="no-print">{r.speck || "—"}</span>
              <span className="print-only">{specOverrides[overrideKey]?.trim() || r.speck || "—"}</span>
            </div>
            {/* Item column (middle) */}
            <div className="beo-item-col" style={{ ...styles.itemCol, lineHeight: 1 }}>{r.item}</div>
            {/* Right column: override input (spec mode) / checkbox / packout */}
            {leftCheck === "spec" && (
              <div className="beo-spec-col" style={{ ...styles.specCol, display: "flex", flexDirection: "column", gap: 2 }} onClick={(e) => e.stopPropagation()}>
                <span style={{ fontSize: 10, color: "#666", lineHeight: 1 }} className="no-print">Override</span>
                <input
                  type="text"
                  placeholder="spec..."
                  value={specOverrides[overrideKey] ?? ""}
                  onChange={(e) => setSpecOverrides((prev) => ({ ...prev, [overrideKey]: e.target.value }))}
                  style={{
                    width: "100%",
                    minWidth: 60,
                    padding: "2px 6px",
                    fontSize: 12,
                    lineHeight: 1,
                    background: "#fff",
                    border: "1px solid #888",
                    borderRadius: 3,
                    boxSizing: "border-box",
                  }}
                  className="no-print"
                />
              </div>
            )}
            {(leftCheck === "kitchen" || leftCheck === "expeditor" || leftCheck === "server") && (
              <div style={styles.checkboxCol} onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={checkState[checkKey] ?? false}
                  onChange={(e) => setCheckState((prev) => ({ ...prev, [checkKey]: e.target.checked }))}
                  className="no-print"
                />
              </div>
            )}
            {leftCheck === "packout" && (
              <div style={styles.packOutCol} onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  placeholder="equipment..."
                  value={packOutEdits[packOutKey] ?? ""}
                  onChange={(e) => setPackOutEdits((prev) => ({ ...prev, [packOutKey]: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "2px 6px",
                    fontSize: 11,
                    background: "#f5f5f5",
                    border: "1px solid #ccc",
                    borderRadius: 3,
                  }}
                  className="no-print"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Beverage pill (section for BEO print) ──
function BeveragePill({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <BeoSectionPill title={title} dotColor={SERVER_BEO_SECTION_COLORS.beverage}>
      {children}
    </BeoSectionPill>
  );
}

// ── Full BEO Packet — Beverages section (page 2) with collapsible pills ──
function FullBeoPacketBeveragesContent(props: {
  eventDate: string;
  clientName: string;
  jobNumberDisplay: string;
  dispatchTime: string;
  eventArrival: string;
  guestCount: string;
  eventLocation: string;
  venueAddress: string;
  eventStart: string;
  eventEnd: string;
  fwStaff: string;
  allergies: string;
  notBuffetBanner: string;
  eventData: Record<string, unknown>;
  barServiceFieldId?: string | null;
}) {
  const { eventData, barServiceFieldId } = props;
  const f = (id: string) => asString(eventData[id]);
  const barFid = barServiceFieldId ?? FIELD_IDS.BAR_SERVICE;
  const barService = asSingleSelectName(eventData[barFid]);
  const signatureDrinkName = f(FIELD_IDS.BAR_SIGNATURE_DRINK_NAME);
  const isFullBarPackage = barService === "Full Bar Package";
  const hasSignatureDrink = signatureDrinkName.trim() !== "";

  const hydrationProvided = asSingleSelectName(eventData[FIELD_IDS.HYDRATION_STATION_PROVIDED]);
  const hydrationDrinkOptions = asStringArray(eventData[FIELD_IDS.HYDRATION_STATION_DRINK_OPTIONS]);
  const hydrationNotes = f(FIELD_IDS.HYDRATION_STATION_NOTES);
  const hasHydration = hydrationProvided === "Yes" && (hydrationDrinkOptions.length > 0 || hydrationNotes.trim() !== "");
  const coffeeServiceNeeded = f(FIELD_IDS.COFFEE_SERVICE_NEEDED);
  const hasCoffeeTea = coffeeServiceNeeded === "Yes";
  const iceProvidedBy = asSingleSelectName(eventData[FIELD_IDS.ICE_PROVIDED_BY]);
  const hasIce = iceProvidedBy.trim() !== "";

  return (
    <div className="beo-print-content" style={styles.page}>
      <div className="beo-event-header-block" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 6 }}>{props.eventDate || "—"}</div>
        <div className="beo-letterhead-bar" style={{
          background: "#9ca3af", color: "#111", padding: "8px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 13, fontWeight: 600, border: "3px double #374151",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)", flexShrink: 0 }}>
              <span style={{ transform: "rotate(-45deg)", fontSize: 12, fontWeight: 800, color: "#fff" }}>f</span>
            </div>
            <span>BEO — Full Packet (Page 2)</span>
          </div>
          <span>JOB#: {props.jobNumberDisplay} — DISPATCH: {props.dispatchTime}</span>
        </div>
        <div className="beo-event-details-table" style={{ background: "#e5e7eb", border: "3px double #374151", borderRadius: 8, marginTop: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, background: "#e5e7eb" }}>
            <tbody>
              <tr>
                <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                  <HeaderFieldWithDivider label="Client" value={props.clientName} />
                </td>
                <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                  <HeaderFieldWithDivider label="Event Arrival" value={props.eventArrival} highlight />
                </td>
                <td style={{ padding: "10px 16px", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                  <HeaderFieldWithDivider label="Guest Count" value={props.guestCount} />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                  <HeaderFieldWithDivider label="Venue" value={props.eventLocation} />
                </td>
                <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                  <HeaderFieldWithDivider label="Event Start" value={props.eventStart} highlight />
                </td>
                <td style={{ padding: "10px 16px", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                  <HeaderFieldWithDivider label="Event End" value={props.eventEnd} highlight />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", background: "#e5e7eb" }}>
                  <HeaderFieldWithDivider label="Venue Address" value={props.venueAddress} />
                </td>
                <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", background: "#e5e7eb" }}>
                  <HeaderFieldWithDivider label="FW Staff" value={props.fwStaff} />
                </td>
                <td style={{ padding: "10px 16px", background: "#e5e7eb" }} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {props.notBuffetBanner && (
        <div className="beo-banner-block" style={styles.notBuffetBanner}>{props.notBuffetBanner}</div>
      )}
      {props.allergies && (
        <div className="beo-banner-block" style={styles.allergyBanner}>⚠️ ALLERGIES: {props.allergies.toUpperCase()}</div>
      )}

      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 24, marginBottom: 12, color: "#dc2626", textAlign: "center" }}>BEVERAGES</div>

      <BeveragePill title="Bar Service">
        {isFullBarPackage ? (
          <div style={{ fontSize: 14, lineHeight: 1.2 }}>
            {FULL_BAR_PACKAGE.glasswareAndService.map((g) => <div key={g}>{g}</div>)}
            {FULL_BAR_PACKAGE.garnishes.map((g) => <div key={g}>{g}</div>)}
            {FULL_BAR_PACKAGE.mixers.map((m) => <div key={m}>{m}</div>)}
            {hasSignatureDrink && <div style={{ marginTop: 8 }}>{getSignatureCocktailGreeting(signatureDrinkName)}</div>}
          </div>
        ) : (
          <div style={{ fontSize: 14 }}>Bar Service: {barService || "—"}</div>
        )}
      </BeveragePill>

      <BeveragePill title="Hydration Station">
        {hasHydration ? (
          <div style={{ fontSize: 14 }}>
            {hydrationDrinkOptions.length > 0 && <div>{hydrationDrinkOptions.join(", ")}</div>}
            {hydrationNotes.trim() && <div>{hydrationNotes.trim()}</div>}
          </div>
        ) : (
          <div style={{ color: "#999", fontSize: 14 }}>No hydration items</div>
        )}
      </BeveragePill>

      <BeveragePill title="Coffee / Tea Service">
        {hasCoffeeTea ? (
          <div style={{ fontSize: 14 }}>Coffee/tea service requested</div>
        ) : (
          <div style={{ color: "#999", fontSize: 14 }}>No coffee/tea service</div>
        )}
      </BeveragePill>

      <BeveragePill title="Ice">
        {hasIce ? (
          <div style={{ fontSize: 14 }}>Ice provided by: {iceProvidedBy}</div>
        ) : (
          <div style={{ color: "#999", fontSize: 14 }}>No ice</div>
        )}
      </BeveragePill>

      <div style={{ marginTop: 20, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>***end of BEO***</div>
    </div>
  );
}

// ── Server BEO 2nd page — 4 sections: Beverage (green), Paper Products (purple), Notes (yellow), Timeline (blue) ──
// Uses same 3-column layout as Kitchen BEO: speck | item | right (checkbox/override/packout)
function ServerBeo2ndPageContent(props: {
  eventDate: string;
  clientName: string;
  jobNumberDisplay: string;
  dispatchTime: string;
  eventArrival: string;
  guestCount: string;
  eventLocation: string;
  venueAddress: string;
  eventStart: string;
  eventEnd: string;
  fwStaff: string;
  allergies: string;
  notBuffetBanner: string;
  eventData: Record<string, unknown>;
  barServiceFieldId?: string | null;
  leftCheck: string;
  gridTemplateColumns: string;
  checkState: Record<string, boolean>;
  setCheckState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  specOverrides: Record<string, string>;
  setSpecOverrides: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  packOutEdits: Record<string, string>;
  setPackOutEdits: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const { eventData, barServiceFieldId, leftCheck, gridTemplateColumns, checkState, setCheckState, specOverrides, setSpecOverrides, packOutEdits, setPackOutEdits } = props;
  const f = (id: string) => asString(eventData[id]);
  const barFid = barServiceFieldId ?? FIELD_IDS.BAR_SERVICE;
  const barService = asSingleSelectName(eventData[barFid]);
  const signatureDrinkName = f(FIELD_IDS.BAR_SIGNATURE_DRINK_NAME);
  const signatureDrinkMixersSupplier = asSingleSelectName(eventData[FIELD_IDS.BAR_SIGNATURE_DRINK_MIXERS_SUPPLIER]);
  const signatureDrinkMixers = f(FIELD_IDS.BAR_MIXERS);
  const signatureDrinkGarnishes = f(FIELD_IDS.BAR_GARNISHES);
  const isClientSupplyingBar = /client/i.test(signatureDrinkMixersSupplier || "");
  const isFullBarPackage = barService === "Full Bar Package";
  const hasSignatureDrink = signatureDrinkName.trim() !== "";

  const hydrationProvided = asSingleSelectName(eventData[FIELD_IDS.HYDRATION_STATION_PROVIDED]);
  const hydrationDrinkOptions = asStringArray(eventData[FIELD_IDS.HYDRATION_STATION_DRINK_OPTIONS]);
  const hydrationNotes = f(FIELD_IDS.HYDRATION_STATION_NOTES);
  const hasHydration = hydrationProvided === "Yes" && (hydrationDrinkOptions.length > 0 || hydrationNotes.trim() !== "");
  const coffeeServiceNeeded = f(FIELD_IDS.COFFEE_SERVICE_NEEDED);
  const hasCoffeeTea = coffeeServiceNeeded === "Yes";
  const iceProvidedBy = asSingleSelectName(eventData[FIELD_IDS.ICE_PROVIDED_BY]);
  const hasIce = iceProvidedBy.trim() !== "";

  const platesList = f(FIELD_IDS.PLATES_LIST);
  const cutleryList = f(FIELD_IDS.CUTLERY_LIST);
  const glasswareList = f(FIELD_IDS.GLASSWARE_LIST);
  const servicewareNotes = f(FIELD_IDS.SERVICEWARE_NOTES);
  const serviceWare = f(FIELD_IDS.SERVICE_WARE);
  const serviceWareSource = f(FIELD_IDS.SERVICE_WARE_SOURCE);
  const chinaPaperGlassware = f(FIELD_IDS.CHINA_PAPER_GLASSWARE);
  const isClientSupplyingPaperProducts = /client/i.test(serviceWareSource || "");
  const hasPaperProducts =
    platesList.trim() !== "" ||
    cutleryList.trim() !== "" ||
    glasswareList.trim() !== "" ||
    servicewareNotes.trim() !== "" ||
    serviceWare.trim() !== "" ||
    chinaPaperGlassware.trim() !== "" ||
    isClientSupplyingPaperProducts;

  const dietaryNotes = f(FIELD_IDS.DIETARY_NOTES);
  const specialNotes = f(FIELD_IDS.SPECIAL_NOTES);
  const beoNotes = f(FIELD_IDS.BEO_NOTES);
  const parkingNotes = f(FIELD_IDS.PARKING_NOTES);
  const loadInNotes = f(FIELD_IDS.LOAD_IN_NOTES);
  const venueNotes = f(FIELD_IDS.VENUE_NOTES);
  const kitchenAccessNotes = f(FIELD_IDS.KITCHEN_ACCESS_NOTES);
  const powerNotes = f(FIELD_IDS.POWER_NOTES);
  const timelineNotes = f(FIELD_IDS.TIMELINE_NOTES);
  const equipmentNotes = f(FIELD_IDS.EQUIPMENT_NOTES);
  const stairsSteps = asSingleSelectName(eventData[FIELD_IDS.STAIRS_STEPS]);
  const elevatorsAvailable = asSingleSelectName(eventData[FIELD_IDS.ELEVATORS_AVAILABLE]);
  const animalsPets = f(FIELD_IDS.ANIMALS_PETS);
  const foodSetupLocation = f(FIELD_IDS.FOOD_SETUP_LOCATION);
  const eventPurpose = f(FIELD_IDS.EVENT_PURPOSE);
  const foodServiceFlow = asSingleSelectName(eventData[FIELD_IDS.FOOD_SERVICE_FLOW]);
  const clientSuppliedFood = f(FIELD_IDS.CLIENT_SUPPLIED_FOOD);
  const religiousRestrictions = f(FIELD_IDS.RELIGIOUS_RESTRICTIONS);
  const hasNotes =
    dietaryNotes.trim() !== "" ||
    specialNotes.trim() !== "" ||
    beoNotes.trim() !== "" ||
    parkingNotes.trim() !== "" ||
    loadInNotes.trim() !== "" ||
    venueNotes.trim() !== "" ||
    kitchenAccessNotes.trim() !== "" ||
    powerNotes.trim() !== "" ||
    timelineNotes.trim() !== "" ||
    equipmentNotes.trim() !== "" ||
    stairsSteps.trim() !== "" ||
    elevatorsAvailable.trim() !== "" ||
    animalsPets.trim() !== "" ||
    foodSetupLocation.trim() !== "" ||
    eventPurpose.trim() !== "" ||
    foodServiceFlow.trim() !== "" ||
    clientSuppliedFood.trim() !== "" ||
    religiousRestrictions.trim() !== "";

  const beoTimeline = f(FIELD_IDS.BEO_TIMELINE);
  const hasTimeline = beoTimeline.trim() !== "";
  const eventOccasion = asSingleSelectName(eventData[FIELD_IDS.EVENT_OCCASION]) ?? "";
  const isWeddingOrMitzvah = eventOccasion === "Wedding" || eventOccasion === "Bar/Bat Mitzvah";

  // Build 3-column rows: CLIENT | RENTALS | FOODWERX (Excel-style, tight layout)
  type ThreeColRow = { client: string; rentals: string; foodwerx: string };
  const beverageRows: ThreeColRow[] = [];
  const paperRows: ThreeColRow[] = [];
  const rentalsDisplay = f(FIELD_IDS.RENTALS) || "";
  const source = asSingleSelectName(eventData[FIELD_IDS.SERVICEWARE_SOURCE])?.toLowerCase() || "";

  // ── Beverage rows ──
  if (isClientSupplyingBar) beverageRows.push({ client: "Mixers", rentals: "", foodwerx: "" });
  if (!isFullBarPackage) {
    const barLabel = barService === "None" || !barService ? "None" : /foodwerx bartender only/i.test(barService || "") ? "Foodwerx bartender, client supplying mixers" : barService;
    beverageRows.push({ client: "", rentals: "", foodwerx: barLabel });
  } else {
    beverageRows.push({ client: "", rentals: "", foodwerx: "Bars: 1" });
    FULL_BAR_PACKAGE_SPECK_ROWS.forEach((r) => beverageRows.push({ client: "", rentals: "", foodwerx: r.item }));
    if (hasSignatureDrink) {
      beverageRows.push({ client: "", rentals: "", foodwerx: getSignatureCocktailGreeting(signatureDrinkName).toUpperCase() });
      if (isClientSupplyingBar) beverageRows.push({ client: "Mixers/Garnishes", rentals: "", foodwerx: "" });
      else if (signatureDrinkMixers.trim() || signatureDrinkGarnishes.trim()) {
        if (signatureDrinkMixers.trim()) beverageRows.push({ client: "", rentals: "", foodwerx: `SIGNATURE MIXERS: ${signatureDrinkMixers.toUpperCase()}` });
        if (signatureDrinkGarnishes.trim()) beverageRows.push({ client: "", rentals: "", foodwerx: `SIGNATURE GARNISHES: ${signatureDrinkGarnishes.toUpperCase()}` });
      }
    }
  }
  if (hasHydration) {
    const parts: string[] = [];
    if (hydrationDrinkOptions.length > 0) parts.push(hydrationDrinkOptions.join(", ").toUpperCase());
    if (hydrationNotes.trim()) parts.push(hydrationNotes.trim().toUpperCase());
    beverageRows.push({ client: "", rentals: "", foodwerx: `HYDRATION STATION: ${parts.join(" — ")}` });
  }
  if (hasCoffeeTea) {
    beverageRows.push({ client: "", rentals: "", foodwerx: "COFFEE/TEA SERVICE REQUESTED" });
    const coffeeMugType = f(FIELD_IDS.COFFEE_MUG_TYPE);
    if (coffeeMugType.trim()) beverageRows.push({ client: "", rentals: "", foodwerx: `${coffeeMugType.toUpperCase()} MUGS` });
    beverageRows.push({ client: "", rentals: "", foodwerx: "• Full Coffee Station Setup" });
    beverageRows.push({ client: "", rentals: "", foodwerx: "• Regular + Decaf Urns" });
    beverageRows.push({ client: "", rentals: "", foodwerx: "• Cups, Lids, Stirrers" });
    beverageRows.push({ client: "", rentals: "", foodwerx: "• Creamers + Sugar" });
  }
  if (hasIce) beverageRows.push({ client: "", rentals: "", foodwerx: `ICE: ${iceProvidedBy.toUpperCase()} — Ice Quantity: 1` });

  // ── Paper product rows (CLIENT | RENTALS | FOODWERX) ──
  const hasNewLists = platesList.trim() || cutleryList.trim() || glasswareList.trim();
  if (hasNewLists) {
    paperRows.push({ client: source.includes("client") || source.includes("mixed") ? "IN HOUSE" : "", rentals: rentalsDisplay, foodwerx: source.includes("foodwerx") || source.includes("mixed") ? "FOODWERX PACK OUT" : "" });
    const addServicewareRows = (text: string) => {
      parseServicewareLines(text).forEach((p) => {
        const display = p.qty ? `${p.qty} ${p.item}` : p.item;
        const isClient = p.supplier.toLowerCase().includes("client");
        paperRows.push({ client: isClient ? display : "", rentals: "", foodwerx: isClient ? "" : display });
      });
    };
    if (platesList.trim()) addServicewareRows(platesList);
    if (cutleryList.trim()) addServicewareRows(cutleryList);
    if (glasswareList.trim()) addServicewareRows(glasswareList);
  } else {
    paperRows.push({ client: source.includes("client") || source.includes("mixed") ? "IN HOUSE" : "", rentals: rentalsDisplay, foodwerx: source.includes("foodwerx") || source.includes("mixed") ? "FOODWERX PACK OUT" : "" });
    if (isFullBarPackage) FULL_BAR_PACKAGE.glasswareAndService.forEach((g) => paperRows.push({ client: "", rentals: "", foodwerx: g.toUpperCase() }));
    const parseLines = (t: string) => t.split(/\n/).filter(Boolean).map((line) => {
      const dashIdx = line.indexOf(" - ");
      if (dashIdx >= 0) return { client: "", rentals: "", foodwerx: line.slice(dashIdx + 3).trim() };
      return { client: "", rentals: "", foodwerx: line.trim() };
    });
    if (serviceWare) paperRows.push(...parseLines(serviceWare));
    if (chinaPaperGlassware) paperRows.push(...parseLines(chinaPaperGlassware));
  }

  return (
    <div className="beo-print-content" style={{ ...styles.page, maxWidth: 900, margin: "0 auto" }}>
      {/* Excel-style header: straight, aligned table */}
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{props.eventDate || "—"}</div>
      <table style={{ ...serverBeoTable, marginBottom: 12 }}>
        <tbody>
          <tr>
            <td style={{ ...serverBeoCell, width: "10%", fontWeight: 700 }}>CLIENT</td>
            <td style={{ ...serverBeoCell, width: "23%" }}>{props.clientName}</td>
            <td style={{ ...serverBeoCell, width: "10%", fontWeight: 700 }}>ORDER #</td>
            <td style={{ ...serverBeoCell, width: "14%" }}>{props.jobNumberDisplay}</td>
            <td style={{ ...serverBeoCell, width: "10%", fontWeight: 700 }}>DISPATCH</td>
            <td style={{ ...serverBeoCell, width: "18%" }}>{props.dispatchTime}</td>
          </tr>
          <tr>
            <td style={{ ...serverBeoCell, fontWeight: 700 }}>EVENT ARRIVAL</td>
            <td style={serverBeoCell}>{props.eventArrival}</td>
            <td style={{ ...serverBeoCell, fontWeight: 700 }}>GUESTS</td>
            <td style={serverBeoCell}>{props.guestCount}</td>
            <td style={{ ...serverBeoCell, fontWeight: 700 }}>EVENT START</td>
            <td style={serverBeoCell}>{props.eventStart}</td>
          </tr>
          <tr>
            <td style={{ ...serverBeoCell, fontWeight: 700 }}>VENUE</td>
            <td style={serverBeoCell}>{props.eventLocation}</td>
            <td style={{ ...serverBeoCell, fontWeight: 700 }}>EVENT END</td>
            <td style={serverBeoCell}>{props.eventEnd}</td>
            <td style={{ ...serverBeoCell, fontWeight: 700 }}>FW STAFF</td>
            <td style={serverBeoCell}>{props.fwStaff}</td>
          </tr>
          <tr>
            <td style={{ ...serverBeoCell, fontWeight: 700 }}>VENUE ADDRESS</td>
            <td style={{ ...serverBeoCell, colSpan: 5 }}>{props.venueAddress}</td>
          </tr>
        </tbody>
      </table>

      {/* BEVERAGES — red banner, 3-column table */}
      <div style={{ background: "#ff0000", color: "#fff", textAlign: "center", fontWeight: 700, fontSize: 13, padding: "4px 0", marginBottom: 0, border: "1px solid #000", borderBottom: "none" }}>
        BEVERAGES
      </div>
      <table style={{ ...serverBeoTable, marginBottom: 12 }}>
        <thead>
          <tr>
            <td style={{ ...serverBeoHeader, width: "33%", color: "#c00" }}>CLIENT</td>
            <td style={{ ...serverBeoHeader, width: "33%", color: "#00a" }}>RENTALS</td>
            <td style={{ ...serverBeoHeader, width: "34%", color: "#00a" }}>FOODWERX</td>
          </tr>
        </thead>
        <tbody>
          {(beverageRows.length > 0 ? beverageRows : [{ client: "", rentals: "", foodwerx: "No beverage service specified" }]).map((r, i) => (
            <tr key={i}>
              <td style={serverBeoCell}>{r.client || "—"}</td>
              <td style={serverBeoCell}>{r.rentals || "—"}</td>
              <td style={serverBeoCell}>{r.foodwerx || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAPER PRODUCTS — yellow banner, 3-column table */}
      <div style={{ background: "#ffff00", color: "#000", textAlign: "center", fontWeight: 700, fontSize: 13, padding: "4px 0", marginBottom: 0, border: "1px solid #000", borderBottom: "none" }}>
        PAPER PRODUCTS / CHINA — CUTLERY — GLASSWARE
      </div>
      <table style={{ ...serverBeoTable, marginBottom: 12 }}>
        <thead>
          <tr>
            <td style={{ ...serverBeoHeader, width: "33%", color: "#c00" }}>CLIENT</td>
            <td style={{ ...serverBeoHeader, width: "33%", color: "#00a" }}>RENTALS</td>
            <td style={{ ...serverBeoHeader, width: "34%", color: "#00a" }}>FOODWERX</td>
          </tr>
        </thead>
        <tbody>
          {(paperRows.length > 0 ? paperRows : [{ client: "", rentals: "", foodwerx: "—" }]).map((r, i) => (
            <tr key={i}>
              <td style={serverBeoCell}>{r.client || "—"}</td>
              <td style={serverBeoCell}>{r.rentals || "—"}</td>
              <td style={serverBeoCell}>{r.foodwerx || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* NOTES — yellow banner */}
      <div style={{ background: "#ffff00", color: "#000", textAlign: "center", fontWeight: 700, fontSize: 13, padding: "4px 0", marginBottom: 0, border: "1px solid #000", borderBottom: "none" }}>
        NOTES
      </div>
      <div style={{ border: "1px solid #000", borderTop: "none", padding: "8px 16px", minHeight: 60, marginBottom: 12 }}>
        {[
          { label: "PARKING", val: parkingNotes },
          { label: "LOAD-IN", val: loadInNotes },
          { label: "STAIRS/STEPS", val: stairsSteps },
          { label: "ELEVATORS", val: elevatorsAvailable },
          { label: "VENUE", val: venueNotes },
          { label: "KITCHEN ACCESS", val: kitchenAccessNotes },
          { label: "FOOD SETUP", val: foodSetupLocation },
          { label: "POWER", val: powerNotes },
          { label: "ANIMALS/PETS", val: animalsPets },
          { label: "EVENT PURPOSE", val: eventPurpose },
          { label: "FOOD SERVICE FLOW", val: foodServiceFlow },
          { label: "TIMELINE", val: timelineNotes },
          { label: "CLIENT-SUPPLIED FOOD", val: clientSuppliedFood },
          { label: "EQUIPMENT", val: equipmentNotes },
          { label: "ALLERGIES/DIETARY", val: dietaryNotes },
          { label: "RELIGIOUS", val: religiousRestrictions },
          { label: "SPECIAL", val: specialNotes },
          { label: "BEO", val: beoNotes },
        ]
          .filter((x) => x.val?.trim())
          .map((x, i) => (
            <div key={i} style={{ fontSize: 12, marginBottom: 4, lineHeight: 1.35 }}>
              <strong>{x.label}:</strong> {x.val}
            </div>
          ))}
        {!parkingNotes && !loadInNotes && !stairsSteps && !elevatorsAvailable && !venueNotes && !kitchenAccessNotes && !foodSetupLocation && !powerNotes && !animalsPets && !eventPurpose && !foodServiceFlow && !timelineNotes && !clientSuppliedFood && !equipmentNotes && !dietaryNotes && !religiousRestrictions && !specialNotes && !beoNotes && (
          <div style={{ color: "#999", fontSize: 12 }}>—</div>
        )}
      </div>

      {/* TIMELINE — blue banner */}
      <div style={{ background: "#87ceeb", color: "#000", textAlign: "center", fontWeight: 700, fontSize: 13, padding: "4px 0", marginBottom: 0, border: "1px solid #000", borderBottom: "none" }}>
        TIMELINE
      </div>
      <div style={{ border: "1px solid #000", borderTop: "none", padding: "8px 16px", minHeight: 40 }}>
        {hasTimeline ? (
          beoTimeline.split(/\n/).filter(Boolean).map((line, i) => {
            const dashIdx = line.indexOf(" - ");
            const [time, action] = dashIdx >= 0 ? [line.slice(0, dashIdx).trim(), line.slice(dashIdx + 3).trim()] : ["", line.trim()];
            return (
              <div key={i} style={{ display: "flex", gap: 16, fontSize: 12, marginBottom: 4 }}>
                {time && <span style={{ fontWeight: 700, minWidth: 80 }}>{time}</span>}
                <span>{action}</span>
              </div>
            );
          })
        ) : (
          <div style={{ color: "#999", fontSize: 12 }}>No timeline specified</div>
        )}
      </div>

      <div style={{ marginTop: 20, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>***end of server BEO***</div>
    </div>
  );
}


// ── Meeting BEO Notes content (BEO + add note buttons + notes summary) ──
function MeetingBeoNotesContent(props: {
  clientName: string;
  eventDate: string;
  jobNumberDisplay: string;
  dispatchTime: string;
  eventArrival: string;
  guestCount: string;
  eventLocation: string;
  venueAddress: string;
  eventStart: string;
  eventEnd: string;
  fwStaff: string;
  allergies: string;
  notBuffetBanner: string;
  activeSections: SectionData[];
  expandItemToRows: (item: MenuLineItem) => { lineName: string; isChild: boolean; itemId?: string }[];
  meetingNotes: Record<string, { itemName: string; sectionTitle: string; notes: string[] }>;
  onAddNote: (itemId: string, itemName: string, sectionTitle: string) => void;
}) {
  const { activeSections, expandItemToRows, meetingNotes, onAddNote } = props;
  const notesEntries = Object.entries(meetingNotes).filter(([, v]) => v.notes.length > 0);

  return (
    <div className="beo-print-content" style={styles.page}>
      {/* BEO header + menu */}
      <div className="meeting-beo-beo-section">
        <div className="beo-event-header-block" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 6 }}>{props.eventDate || "—"}</div>
          <div className="beo-letterhead-bar" style={{
            background: "#9ca3af", color: "#111", padding: "8px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: 13, fontWeight: 600, border: "3px double #374151",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)", flexShrink: 0 }}>
                <span style={{ transform: "rotate(-45deg)", fontSize: 12, fontWeight: 800, color: "#fff" }}>f</span>
              </div>
              <span>BEO — Meeting Notes</span>
            </div>
            <span>JOB#: {props.jobNumberDisplay} — DISPATCH: {props.dispatchTime}</span>
          </div>
          <div className="beo-event-details-table" style={{ background: "#e5e7eb", border: "3px double #374151", borderRadius: 8, marginTop: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, background: "#e5e7eb" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                    <HeaderFieldWithDivider label="Client" value={props.clientName} />
                  </td>
                  <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                    <HeaderFieldWithDivider label="Event Arrival" value={props.eventArrival} highlight />
                  </td>
                  <td style={{ padding: "10px 16px", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                    <HeaderFieldWithDivider label="Guest Count" value={props.guestCount} />
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                    <HeaderFieldWithDivider label="Venue" value={props.eventLocation} />
                  </td>
                  <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                    <HeaderFieldWithDivider label="Event Start" value={props.eventStart} highlight />
                  </td>
                  <td style={{ padding: "10px 16px", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                    <HeaderFieldWithDivider label="Event End" value={props.eventEnd} highlight />
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", background: "#e5e7eb" }}>
                    <HeaderFieldWithDivider label="Venue Address" value={props.venueAddress} />
                  </td>
                  <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", background: "#e5e7eb" }}>
                    <HeaderFieldWithDivider label="FW Staff" value={props.fwStaff} />
                  </td>
                  <td style={{ padding: "10px 16px", background: "#e5e7eb" }} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        {props.notBuffetBanner && (
          <div className="beo-banner-block" style={styles.notBuffetBanner}>{props.notBuffetBanner}</div>
        )}
        {props.allergies && (
          <div className="beo-banner-block" style={styles.allergyBanner}>⚠️ ALLERGIES: {props.allergies.toUpperCase()}</div>
        )}
        {activeSections.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "#999", fontSize: 16 }}>No menu items assigned.</div>
        )}
        {activeSections.map((section) => (
          <div key={section.fieldId} className="beo-section-card" style={styles.sectionCard}>
            <div className="beo-section-header" style={styles.sectionHeader}>
              <span style={{ color: getSectionColor(section.title), fontSize: "28px", lineHeight: 0 }}>●</span>
              <span>{section.title}</span>
              <span style={{ color: getSectionColor(section.title), fontSize: "28px", lineHeight: 0 }}>●</span>
            </div>
            {section.items.map((item, itemIdx) => {
              const rows = expandItemToRows(item);
              const itemNotes = meetingNotes[item.id]?.notes ?? [];
              const guestCount = parseInt(props.guestCount) || 0;
              return (
                <div key={`${item.id}-${itemIdx}`} className="beo-menu-item-block" style={{ borderBottom: "1px solid #eee", marginTop: itemIdx > 0 ? 16 : 0 }}>
                  {rows.map((row, rowIdx) => {
                    const spec = calculateSpec({
                      itemId: item.id,
                      itemName: row.lineName,
                      section: section.title,
                      guestCount,
                    });
                    return (
                    <div key={rowIdx} className="beo-line-item" style={{ ...styles.lineItem, borderBottom: "none", gridTemplateColumns: row.isChild ? "140px 1fr" : "140px 1fr auto", padding: "8px 16px", ...(row.isChild ? { marginTop: -6 } : {}) }}>
                      <div className="beo-spec-col" style={styles.specCol}>{spec}</div>
                      <div className="beo-item-col" style={styles.itemCol}>{row.lineName}</div>
                      {!row.isChild && (
                        <button
                          type="button"
                          className="no-print"
                          style={styles.addNoteBtn}
                          onClick={() => onAddNote(item.id, item.name, section.title)}
                        >
                          Add note/issue
                        </button>
                      )}
                    </div>
                    );
                  })}
                  {itemNotes.length > 0 && (
                    <div style={{ padding: "8px 16px 12px 2em", fontSize: 12, color: "#555", borderTop: "1px solid #eee" }}>
                      {itemNotes.map((n, i) => (
                        <div key={i} style={{ marginBottom: 4 }}>• {n}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <div style={{ marginTop: 20, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>***end of BEO***</div>
      </div>

      {/* Notes summary page (page break before) */}
      <div className="meeting-beo-notes-section" style={{ breakBefore: "page", marginTop: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, borderBottom: "2px solid #000", paddingBottom: 8 }}>
          Notes / Issues
        </div>
        {notesEntries.length === 0 ? (
          <div style={{ color: "#999", fontSize: 14 }}>No notes added yet.</div>
        ) : (
          notesEntries.map(([itemId, { itemName, sectionTitle, notes }]) => (
            <div key={itemId} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{itemName} ({sectionTitle})</div>
              {notes.map((n, i) => (
                <div key={i} style={{ marginLeft: 16, marginBottom: 4, fontSize: 13 }}>• {n}</div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const BeoPrintPage: React.FC = () => {
  const {
    selectedEventId,
    selectEvent,
    eventData,
    loadEventData,
    updateEvent,
    events,
  } = useEventStore();
  const [topTab, setTopTab] = useState<TopTab>("kitchenBEO");
  const [leftCheck, setLeftCheck] = useState<LeftCheck>("kitchen");
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printModalFormat, setPrintModalFormat] = useState<"menu" | "tent">("menu");
  const [printModalTheme, setPrintModalTheme] = useState<string>("Classic European");
  const [menuTheme, setMenuTheme] = useState<string>("Classic European");
  const [printMode, setPrintMode] = useState<"menu" | "tent">("menu");
  const [meetingNotes, setMeetingNotes] = useState<Record<string, { itemName: string; sectionTitle: string; notes: string[] }>>({});
  const [noteModal, setNoteModal] = useState<{ open: boolean; itemId: string; itemName: string; sectionTitle: string; draftNote: string }>({
    open: false,
    itemId: "",
    itemName: "",
    sectionTitle: "",
    draftNote: "",
  });
  const [loading, setLoading] = useState(true);
  const [menuItemData, setMenuItemData] = useState<Record<string, { name: string; childIds: string[]; description?: string; dietaryTags?: string }>>({});
  const [buffetMenuEdits, setBuffetMenuEdits] = useState<Record<string, string>>({}); // itemId -> edited description
  const [specOverrides, setSpecOverrides] = useState<Record<string, string>>({});
  const [packOutEdits, setPackOutEdits] = useState<Record<string, string>>({});
  const [checkState, setCheckState] = useState<Record<string, boolean>>({});
  const [hiddenMenuItems, setHiddenMenuItems] = useState<Set<string>>(new Set());
  const [barServiceFieldId, setBarServiceFieldId] = useState<string | null>(null);

  useEffect(() => {
    getBarServiceFieldId().then(setBarServiceFieldId);
  }, []);

  // ── Step 1: Grab event ID from URL and select it ──
  useEffect(() => {
    const urlEventId = getEventIdFromUrl();
    if (urlEventId && urlEventId !== selectedEventId) {
      selectEvent(urlEventId).then(() => setLoading(false));
    } else if (selectedEventId) {
      loadEventData().then(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── Sync menu theme from Airtable on load ──
  useEffect(() => {
    const raw = eventData[FIELD_IDS.MENU_PRINT_THEME];
    const name = asSingleSelectName(raw);
    setMenuTheme(name || "Classic European");
  }, [eventData]);

  // ── Body class for menu print mode (Buffet Menu Signs tab only) ──
  useEffect(() => {
    if (topTab === "buffetMenuSigns") {
      document.body.classList.add("print-menu-mode");
    } else {
      document.body.classList.remove("print-menu-mode");
    }
    return () => document.body.classList.remove("print-menu-mode");
  }, [topTab]);

  // ── Step 2: Fetch menu items with Item Name + Child Items (linked records) ──
  useEffect(() => {
    const menuFieldIds = [
      FIELD_IDS.PASSED_APPETIZERS,
      FIELD_IDS.PRESENTED_APPETIZERS,
      FIELD_IDS.BUFFET_METAL,
      FIELD_IDS.BUFFET_CHINA,
      FIELD_IDS.DESSERTS,
      FIELD_IDS.STATIONS,
    ];

    const parentIds = new Set<string>();
    menuFieldIds.forEach((fid) => {
      const val = eventData[fid];
      if (Array.isArray(val)) {
        val.forEach((id: unknown) => {
          if (typeof id === "string" && id.startsWith("rec")) parentIds.add(id);
        });
      }
    });

    if (parentIds.size === 0) return;

    const MENU_TABLE = "tbl0aN33DGG6R1sPZ";
    const ITEM_NAME = FIELD_IDS.MENU_ITEM_NAME;
    const CHILD_ITEMS = FIELD_IDS.MENU_ITEM_CHILD_ITEMS;
    const DESCRIPTION = FIELD_IDS.MENU_ITEM_DESCRIPTION;
    const DIETARY_TAGS = FIELD_IDS.MENU_ITEM_DIETARY_TAGS;
    const apiKey = (import.meta.env.VITE_AIRTABLE_API_KEY as string)?.trim() || "";
    const baseId = (import.meta.env.VITE_AIRTABLE_BASE_ID as string)?.trim() || "";

    const fetchMenuItems = async () => {
      const newData: Record<string, { name: string; childIds: string[]; description?: string; dietaryTags?: string }> = {};
      const toFetch = [...parentIds];

      const fetchChunk = async (ids: string[]) => {
        const formula = `OR(${ids.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
        const params = new URLSearchParams();
        params.set("filterByFormula", formula);
        params.set("returnFieldsByFieldId", "true");
        params.append("fields[]", ITEM_NAME);
        params.append("fields[]", CHILD_ITEMS);
        params.append("fields[]", DESCRIPTION);
        params.append("fields[]", DIETARY_TAGS);
        const res = await fetch(
          `https://api.airtable.com/v0/${baseId}/${MENU_TABLE}?${params.toString()}`,
          { headers: { Authorization: `Bearer ${sanitizeForHeader(apiKey)}` } }
        );
        const data = await res.json();
        if (data.records) {
          data.records.forEach((rec: { id: string; fields: Record<string, unknown> }) => {
            const name = rec.fields[ITEM_NAME];
            const childRaw = rec.fields[CHILD_ITEMS];
            const descRaw = rec.fields[DESCRIPTION];
            const tagsRaw = rec.fields[DIETARY_TAGS];
            const childIds = Array.isArray(childRaw)
              ? childRaw.filter((c): c is string => typeof c === "string" && c.startsWith("rec"))
              : [];
            const description = typeof descRaw === "string" ? descRaw : undefined;
            const dietaryTags = Array.isArray(tagsRaw)
              ? tagsRaw.map((t) => (typeof t === "string" ? t : (t && typeof t === "object" && "name" in t ? String((t as { name: string }).name) : ""))).filter(Boolean).join(" ")
              : typeof tagsRaw === "string" ? tagsRaw
              : tagsRaw && typeof tagsRaw === "object" && "name" in tagsRaw ? String((tagsRaw as { name: string }).name) : undefined;
            newData[rec.id] = {
              name: typeof name === "string" ? name : rec.id,
              childIds,
              description: description || undefined,
              dietaryTags: dietaryTags || undefined,
            };
          });
        }
        return data;
      };

      try {
        for (let i = 0; i < toFetch.length; i += 10) {
          await fetchChunk(toFetch.slice(i, i + 10));
        }
        const childIdsToFetch = new Set<string>();
        Object.values(newData).forEach((d) => {
          d.childIds.forEach((cid) => {
            if (!newData[cid]) childIdsToFetch.add(cid);
          });
        });
        if (childIdsToFetch.size > 0) {
          const childParams = new URLSearchParams();
          childParams.set("filterByFormula", `OR(${[...childIdsToFetch].map((id) => `RECORD_ID()='${id}'`).join(",")})`);
          childParams.set("returnFieldsByFieldId", "true");
          childParams.append("fields[]", ITEM_NAME);
          childParams.append("fields[]", DIETARY_TAGS);
          const res = await fetch(
            `https://api.airtable.com/v0/${baseId}/${MENU_TABLE}?${childParams.toString()}`,
            { headers: { Authorization: `Bearer ${sanitizeForHeader(apiKey)}` } }
          );
          const childData = await res.json();
          if (childData.records) {
            childData.records.forEach((rec: { id: string; fields: Record<string, unknown> }) => {
              const name = rec.fields[ITEM_NAME];
              const tagsRaw = rec.fields[DIETARY_TAGS];
              const dietaryTags = Array.isArray(tagsRaw)
                ? tagsRaw.map((t) => (typeof t === "string" ? t : (t && typeof t === "object" && "name" in t ? String((t as { name: string }).name) : ""))).filter(Boolean).join(" ")
                : typeof tagsRaw === "string" ? tagsRaw
                : tagsRaw && typeof tagsRaw === "object" && "name" in tagsRaw ? String((tagsRaw as { name: string }).name) : undefined;
              if (!newData[rec.id]) {
                newData[rec.id] = {
                  name: typeof name === "string" ? name : rec.id,
                  childIds: [],
                  dietaryTags: dietaryTags || undefined,
                };
              } else {
                newData[rec.id].name = typeof name === "string" ? name : rec.id;
                newData[rec.id].dietaryTags = dietaryTags || undefined;
              }
            });
          }
        }
        setMenuItemData(newData);
      } catch (e) {
        console.error("Failed to fetch menu items:", e);
      }
    };

    fetchMenuItems();
  }, [eventData]);

  // ── Extract event fields ──
  const f = (id: string): string => {
    const val = eventData[id];
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number") return String(val);
    return String(val);
  };

  const clientName = `${f(FIELD_IDS.CLIENT_FIRST_NAME)} ${f(FIELD_IDS.CLIENT_LAST_NAME)}`.trim();
  const contactName = f(FIELD_IDS.PRIMARY_CONTACT_NAME) || "";
  const clientPhone = f(FIELD_IDS.CLIENT_PHONE);
  const contactPhone = f(FIELD_IDS.CONTACT_PHONE);

  const eventLocation = f(FIELD_IDS.EVENT_LOCATION_FINAL_PRINT);
  const venueAddress = f(FIELD_IDS.PRINT_VENUE_ADDRESS);
  const eventDateRaw = f(FIELD_IDS.EVENT_DATE);
  const eventDate = eventDateRaw
    ? (() => {
        const d = new Date(eventDateRaw + "T12:00:00");
        if (isNaN(d.getTime())) return eventDateRaw;
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      })()
    : "";
  const eventStart = secondsTo12HourString(eventData[FIELD_IDS.EVENT_START_TIME]);
  const eventEnd = secondsTo12HourString(eventData[FIELD_IDS.EVENT_END_TIME]);
  const guestCount = f(FIELD_IDS.GUEST_COUNT);
  const dispatchTime = secondsTo12HourString(eventData[FIELD_IDS.DISPATCH_TIME]) || f(FIELD_IDS.DISPATCH_TIME) || "TBD";
  const fwStaff = f(FIELD_IDS.CAPTAIN);
  const eventArrival = secondsTo12HourString(eventData[FIELD_IDS.FOODWERX_ARRIVAL]);
  const allergies = f(FIELD_IDS.DIETARY_NOTES);
  const serviceStyle = asSingleSelectName(eventData[FIELD_IDS.SERVICE_STYLE]).trim();
  const notBuffetBanner = serviceStyle && !serviceStyle.toLowerCase().includes("buffet")
    ? `NOT BUFFET – ${serviceStyle.toUpperCase()}`
    : "";

  // Job number = order by dispatch time for that day (001 = earliest, etc.)
  const eventDateNorm = (eventDateRaw || "").trim();
  const sameDayEvents = events.filter(
    (e) => (e.eventDate || "").trim() === eventDateNorm
  );
  const sortedByDispatch = [...sameDayEvents].sort((a, b) => {
    const sa = a.dispatchTimeSeconds ?? 999999;
    const sb = b.dispatchTimeSeconds ?? 999999;
    return sa - sb;
  });
  const jobIndex = selectedEventId
    ? sortedByDispatch.findIndex((e) => e.id === selectedEventId) + 1
    : 0;
  const jobNumberDisplay = jobIndex > 0
    ? String(jobIndex).padStart(3, "0")
    : "—";
  const phone = contactPhone || clientPhone;

  // ── Parse linked menu items ──
  const parseMenuItems = (fieldId: string): MenuLineItem[] => {
    const raw = eventData[fieldId];
    if (!raw || !Array.isArray(raw)) return [];

    return raw.map((item: unknown) => {
      const id = typeof item === "string" ? item : (item && typeof item === "object" && "id" in item) ? (item as { id: string }).id : String(item);
      const data = menuItemData[id];
      return {
        id,
        name: data?.name || "Loading...",
      };
    });
  };

  // ── Menu Sections ──
  const menuSections: SectionData[] = [
    {
      title: "PASSED APPETIZERS",
      fieldId: FIELD_IDS.PASSED_APPETIZERS,
      items: parseMenuItems(FIELD_IDS.PASSED_APPETIZERS),
    },
    {
      title: "PRESENTED APPETIZERS",
      fieldId: FIELD_IDS.PRESENTED_APPETIZERS,
      items: parseMenuItems(FIELD_IDS.PRESENTED_APPETIZERS),
    },
    {
      title: "BUFFET – METAL",
      fieldId: FIELD_IDS.BUFFET_METAL,
      items: parseMenuItems(FIELD_IDS.BUFFET_METAL),
    },
    {
      title: "BUFFET – CHINA",
      fieldId: FIELD_IDS.BUFFET_CHINA,
      items: parseMenuItems(FIELD_IDS.BUFFET_CHINA),
    },
    {
      title: "DESSERTS",
      fieldId: FIELD_IDS.DESSERTS,
      items: parseMenuItems(FIELD_IDS.DESSERTS),
    },
    {
      title: "STATIONS",
      fieldId: FIELD_IDS.STATIONS,
      items: parseMenuItems(FIELD_IDS.STATIONS),
    },
  ];

  const barFid = barServiceFieldId ?? FIELD_IDS.BAR_SERVICE;
  const barService = asSingleSelectName(eventData[barFid]);
  const isFullBarPackage = barService === "Full Bar Package";
  const sigDrinkMixersSupplier = asSingleSelectName(eventData[FIELD_IDS.BAR_SIGNATURE_DRINK_MIXERS_SUPPLIER]);
  const sigDrinkMixers = asString(eventData[FIELD_IDS.BAR_MIXERS]);
  const sigDrinkGarnishes = asString(eventData[FIELD_IDS.BAR_GARNISHES]);
  const hasSignatureDrinkForPackout = asString(eventData[FIELD_IDS.BAR_SIGNATURE_DRINK_NAME]).trim() !== "";
  const isClientSupplyingSigDrink = /client/i.test(sigDrinkMixersSupplier || "");

  // When Full Bar Package: add BEVERAGES — MIXERS section for Kitchen BEO; first item gets packout list
  const basePackoutItems = getFullBarPackagePackoutItems();
  const sigDrinkPackoutAdditions: string[] = [];
  if (isFullBarPackage && hasSignatureDrinkForPackout) {
    if (isClientSupplyingSigDrink) {
      sigDrinkPackoutAdditions.push("CLIENT (signature drink mixers/garnishes)");
    } else if (sigDrinkMixers.trim() || sigDrinkGarnishes.trim()) {
      if (sigDrinkMixers.trim()) sigDrinkPackoutAdditions.push(sigDrinkMixers.trim());
      if (sigDrinkGarnishes.trim()) sigDrinkPackoutAdditions.push(sigDrinkGarnishes.trim());
    }
  }
  const fullBarPackoutItems = [...basePackoutItems, ...sigDrinkPackoutAdditions].join(", ");
  const beverageMixersItems: MenuLineItem[] = [
    ...FULL_BAR_PACKAGE.glasswareAndService.map((name, i) => ({ id: `bev-glass-${i}`, name, packOutItems: i === 0 ? fullBarPackoutItems : undefined })),
    ...FULL_BAR_PACKAGE.garnishes.map((name, i) => ({ id: `bev-garnish-${i}`, name })),
    ...FULL_BAR_PACKAGE.mixers.map((name, i) => ({ id: `bev-mixer-${i}`, name })),
  ];
  if (isFullBarPackage && hasSignatureDrinkForPackout && !isClientSupplyingSigDrink) {
    if (sigDrinkMixers.trim()) beverageMixersItems.push({ id: "bev-sig-mixers", name: `Signature Mixers: ${sigDrinkMixers.trim()}` });
    if (sigDrinkGarnishes.trim()) beverageMixersItems.push({ id: "bev-sig-garnishes", name: `Signature Garnishes: ${sigDrinkGarnishes.trim()}` });
  } else if (isFullBarPackage && hasSignatureDrinkForPackout && isClientSupplyingSigDrink) {
    beverageMixersItems.push({ id: "bev-sig-client", name: "Signature Drink Mixers/Garnishes: CLIENT" });
  }
  const beverageMixersSection: SectionData | null = isFullBarPackage
    ? {
        title: "BEVERAGES — MIXERS",
        fieldId: "bev-mixers",
        items: beverageMixersItems,
      }
    : null;

  // Kitchen BEO: hard stop after desserts + footer — never includes Staff BEO 2nd page content (beverages/mixers)
  const activeSections = menuSections.filter((s) => s.items.length > 0);
  const visibleSections = activeSections.map((s) => ({
    ...s,
    items: s.items.filter((item) => !hiddenMenuItems.has(item.id)),
  })).filter((s) => s.items.length > 0);

  // Expand items using linked Child Items (parent on first line, each child on own line indented)
  const expandItemToRows = (item: MenuLineItem): { lineName: string; isChild: boolean; itemId: string }[] => {
    const data = menuItemData[item.id];
    const parentName = data?.name || item.name || "Loading...";
    const rows: { lineName: string; isChild: boolean; itemId: string }[] = [{ lineName: parentName, isChild: false, itemId: item.id }];
    if (data?.childIds?.length) {
      data.childIds.forEach((childId) => {
        const childName = menuItemData[childId]?.name || "Loading...";
        rows.push({ lineName: childName, isChild: true, itemId: childId });
      });
    }
    return rows;
  };

  // ── Kitchen BEO pagination: page 1 has less room (header/banners), pages 2+ have full height ──
  // Sections are never split across pages — each pill stays whole.
  const LINES_PER_PAGE_FIRST = 16;  // page 1: event header + banners take ~16 lines
  const LINES_PER_PAGE = 32;        // pages 2+: full page for menu
  const SECTION_HEADER_LINES = 3;
  type KitchenPage = { pageNum: number; sections: Array<{ section: SectionData; items: MenuLineItem[] }> };
  const kitchenPages: KitchenPage[] = (() => {
    const pages: KitchenPage[] = [];
    let current: KitchenPage = { pageNum: 1, sections: [] };
    let linesUsed = 0;
    const getMaxLines = () => (current.pageNum === 1 ? LINES_PER_PAGE_FIRST : LINES_PER_PAGE);
    activeSections.forEach((section) => {
      const sectionItemLines = section.items.reduce((sum, item) => sum + expandItemToRows(item).length, 0);
      const sectionLines = SECTION_HEADER_LINES + sectionItemLines;
      const wouldExceed = linesUsed + sectionLines > getMaxLines();
      if (wouldExceed && current.sections.length > 0) {
        pages.push(current);
        current = { pageNum: pages.length + 1, sections: [] };
        linesUsed = 0;
      }
      current.sections.push({ section, items: section.items });
      linesUsed += sectionLines;
      if (linesUsed >= getMaxLines()) {
        pages.push(current);
        current = { pageNum: pages.length + 1, sections: [] };
        linesUsed = 0;
      }
    });
    if (current.sections.length > 0) pages.push(current);
    return pages.length > 0 ? pages : [{ pageNum: 1, sections: [] }];
  })();

  // Grid columns: spec (left), item (middle), right column (override / equipment / checkbox)
  const gridTemplateColumns =
    leftCheck === "spec" ? "140px 1fr 200px" :
    leftCheck === "packout" ? "140px 1fr 250px" :
    leftCheck === "kitchen" || leftCheck === "expeditor" || leftCheck === "server" ? "140px 1fr 40px" :
    "1fr";

  const handleSaveNote = () => {
    const { itemId, itemName, sectionTitle, draftNote } = noteModal;
    if (!draftNote.trim()) return;
    setMeetingNotes((prev) => {
      const existing = prev[itemId];
      return {
        ...prev,
        [itemId]: {
          itemName: existing?.itemName ?? itemName,
          sectionTitle: existing?.sectionTitle ?? sectionTitle,
          notes: [...(existing?.notes ?? []), draftNote.trim()],
        },
      };
    });
    setNoteModal({ open: false, itemId: "", itemName: "", sectionTitle: "", draftNote: "" });
  };

  // ── Loading State ──
  if (loading) {
    return <div style={styles.loading}>Loading event data...</div>;
  }

  if (!selectedEventId) {
    return (
      <div style={styles.loading}>
        No event selected. Go to the dashboard and click Print/View BEO.
      </div>
    );
  }

  // ── Client name for page markers (injected into @page; escaped for CSS) ──
  const pageMarkerClientName = (clientName || "—").replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  // ── Render ──
  return (
    <>
      <style>{printStyles}</style>
      {topTab !== "buffetMenuSigns" && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { @top-center { content: "PAGE " counter(page) " - ${pageMarkerClientName}"; } }
            @page :first { @top-center { content: none; } }
          }
        `}} />
      )}
      {topTab === "buffetMenuSigns" && (
        <>
          <style>{clientMenuPrintStyles}</style>
          <style>{getClientMenuPageStyles(printMode)}</style>
        </>
      )}

      {/* ── Print Menu modal (Buffet Menu Signs only) ── */}
      {printModalOpen && topTab === "buffetMenuSigns" && (
        <div className="no-print" style={styles.noteModalOverlay} onClick={() => setPrintModalOpen(false)}>
          <div style={{ ...styles.noteModal, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.noteModalTitle}>Print Menu</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 8 }}>STEP 1 – Format</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {(["menu", "tent"] as const).map((fmt) => (
                  <label key={fmt} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input type="radio" checked={printModalFormat === fmt} onChange={() => setPrintModalFormat(fmt)} />
                    <span>{fmt === "menu" ? "Full Page Menu" : "Mini Menu Tent Cards (Mirrored)"}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 8 }}>STEP 2 – Theme</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {MENU_THEME_OPTIONS.map((opt) => (
                  <label key={opt.slug} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input type="radio" checked={printModalTheme === opt.label} onChange={() => setPrintModalTheme(opt.label)} />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={styles.noteModalBtns}>
              <button style={{ ...styles.addNoteBtn, background: "#555" }} onClick={() => setPrintModalOpen(false)}>Cancel</button>
              <button style={styles.addNoteBtn} onClick={async () => {
                if (selectedEventId) {
                  await updateEvent(selectedEventId, { [FIELD_IDS.MENU_PRINT_THEME]: printModalTheme });
                  setMenuTheme(printModalTheme);
                  setPrintMode(printModalFormat);
                  setPrintModalOpen(false);
                  setTimeout(() => window.print(), 100);
                }
              }}>Print</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Note modal (for Meeting BEO Notes) ── */}
      {noteModal.open && (
        <div className="no-print" style={styles.noteModalOverlay} onClick={() => setNoteModal((m) => ({ ...m, open: false }))}>
          <div style={styles.noteModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.noteModalTitle}>
              Add note/issue — {noteModal.itemName} ({noteModal.sectionTitle})
            </div>
            <textarea
              style={styles.noteModalTextarea}
              placeholder="Enter question or issue..."
              value={noteModal.draftNote}
              onChange={(e) => setNoteModal((m) => ({ ...m, draftNote: e.target.value }))}
              autoFocus
            />
            <div style={styles.noteModalBtns}>
              <button style={{ ...styles.addNoteBtn, background: "#555" }} onClick={() => setNoteModal((m) => ({ ...m, open: false }))}>
                Cancel
              </button>
              <button style={styles.addNoteBtn} onClick={handleSaveNote}>
                Save note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Layout: left sidebar + main area ── */}
      <div className={`beo-print-layout${topTab === "buffetMenuSigns" ? " print-menu-mode" : ""}`} style={styles.layout}>
        {/* Left column: checklist boxes (hidden when printing) */}
        <div className="no-print" style={styles.leftSidebar}>
          <button
            type="button"
            style={{
              ...styles.leftBox,
              ...(leftCheck === "spec" ? styles.leftBoxActive : {}),
            }}
            onClick={() => { setLeftCheck("spec"); setTopTab("kitchenBEO"); }}
          >
            ☑️ Spec check
          </button>
          <button
            type="button"
            style={{
              ...styles.leftBox,
              ...(leftCheck === "packout" ? styles.leftBoxActive : {}),
            }}
            onClick={() => { setLeftCheck("packout"); setTopTab("kitchenBEO"); }}
          >
            ☑️ Pack-out check
          </button>
          <button
            type="button"
            style={{
              ...styles.leftBox,
              ...(leftCheck === "kitchen" ? styles.leftBoxActive : {}),
            }}
            onClick={() => { setLeftCheck("kitchen"); setTopTab("kitchenBEO"); }}
          >
            ☑️ Kitchen check
          </button>
          <button
            type="button"
            style={{
              ...styles.leftBox,
              ...(leftCheck === "expeditor" ? styles.leftBoxActive : {}),
            }}
            onClick={() => { setLeftCheck("expeditor"); setTopTab("kitchenBEO"); }}
          >
            ☑️ Expeditor check
          </button>
          <button
            type="button"
            style={{
              ...styles.leftBox,
              ...(leftCheck === "server" ? styles.leftBoxActive : {}),
            }}
            onClick={() => { setLeftCheck("server"); setTopTab("kitchenBEO"); }}
          >
            ☑️ Server check
          </button>
          <div style={{ flex: 1 }} />
          <button
            style={{ ...styles.leftBox, background: "#2d8cf0", borderColor: "#2d8cf0" }}
            onClick={() => topTab === "buffetMenuSigns" ? (setPrintModalTheme(menuTheme), setPrintModalFormat(printMode), setPrintModalOpen(true)) : window.print()}
          >
            {topTab === "buffetMenuSigns" ? "Print Menu" : "Print"}
          </button>
          <button
            style={{ ...styles.leftBox, background: "#555", borderColor: "#555" }}
            onClick={() => window.history.back()}
          >
            ← Back
          </button>
        </div>

        {/* Main area: top tabs + content */}
        <div className="beo-print-main" style={styles.mainArea}>
          <div className="no-print" style={styles.topTabs}>
            <button
              style={{
                ...styles.topTab,
                ...(topTab === "kitchenBEO" ? styles.topTabActive : {}),
              }}
              onClick={() => setTopTab("kitchenBEO")}
            >
              Kitchen BEO
            </button>
            <button
              style={{
                ...styles.topTab,
                ...(topTab === "meetingBeoNotes" ? styles.topTabActive : {}),
              }}
              onClick={() => setTopTab("meetingBeoNotes")}
            >
              Meeting BEO Notes
            </button>
            <button
              style={{
                ...styles.topTab,
                ...(topTab === "fullBeoPacket" ? styles.topTabActive : {}),
              }}
              onClick={() => setTopTab("fullBeoPacket")}
            >
              Full BEO Packet
            </button>
            <button
              style={{
                ...styles.topTab,
                ...(topTab === "buffetMenuSigns" ? styles.topTabActive : {}),
              }}
              onClick={() => setTopTab("buffetMenuSigns")}
            >
              Buffet Menu Signs
            </button>
            <button
              style={{
                ...styles.topTab,
                ...(topTab === "serverBeo2ndPage" ? styles.topTabActive : {}),
              }}
              onClick={() => setTopTab("serverBeo2ndPage")}
            >
              Server Beo 2nd page
            </button>
            <button
              style={{
                ...styles.topTab,
                marginLeft: "auto",
                background: "#059669",
                borderColor: "#059669",
                color: "#fff",
              }}
              onClick={() => loadEventData().then(() => setLoading(false))}
              title="Reload event data from Airtable (use after saving Bar Service)"
            >
              ↻ Refresh
            </button>
            <button
              style={{
                ...styles.topTab,
                background: "#2d8cf0",
                borderColor: "#2d8cf0",
                color: "#fff",
              }}
              onClick={() => topTab === "buffetMenuSigns" ? (setPrintModalTheme(menuTheme), setPrintModalFormat(printMode), setPrintModalOpen(true)) : window.print()}
            >
              {topTab === "buffetMenuSigns" ? "Print Menu" : "Print"}
            </button>
          </div>

          {/* ── Content (based on top tab) ── */}
          {topTab === "kitchenBEO" && (
      <div key={`kitchen-${leftCheck}`} className="beo-print-content" style={styles.page}>
        {kitchenPages.length === 0 || (kitchenPages.length === 1 && kitchenPages[0].sections.length === 0) ? (
          <div style={{ padding: 32, textAlign: "center", color: "#999", fontSize: 16 }}>
            No menu items assigned to this event yet.
          </div>
        ) : (
        kitchenPages.map((page, pageIdx) => (
          <div
            key={page.pageNum}
            className="kitchen-beo-page"
            style={{ pageBreakAfter: pageIdx < kitchenPages.length - 1 ? "page" : "auto" }}
          >
            {/* Page marker (PAGE 2, 3, …) is rendered via @page @top-center in print CSS — not in DOM */}

            {/* Page 1 only: Event header */}
            {page.pageNum === 1 && (
              <div className="beo-event-header-block" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 6 }}>{eventDate || "—"}</div>
                <div className="beo-letterhead-bar" style={{
                  background: "#9ca3af", color: "#111", padding: "8px 16px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  fontSize: 13, fontWeight: 600, border: "3px double #374151",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)", flexShrink: 0 }}>
                      <span style={{ transform: "rotate(-45deg)", fontSize: 12, fontWeight: 800, color: "#fff" }}>f</span>
                    </div>
                    <span>BEO</span>
                  </div>
                  <span>JOB#: {jobNumberDisplay}-----------------DISPATCH TIME {dispatchTime}</span>
                </div>
                <div className="beo-event-details-table" style={{ background: "#e5e7eb", border: "3px double #374151", borderRadius: 8, marginTop: 12, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, background: "#e5e7eb" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                          <HeaderFieldWithDivider label="Client" value={clientName} />
                        </td>
                        <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                          <HeaderFieldWithDivider label="Event Arrival" value={eventArrival} highlight />
                        </td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                          <HeaderFieldWithDivider label="Guest Count" value={guestCount} />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                          <HeaderFieldWithDivider label="Phone" value={phone} />
                        </td>
                        <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                          <HeaderFieldWithDivider label="Event Start" value={eventStart} highlight />
                        </td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                          <HeaderFieldWithDivider label="Event Date" value={eventDate} />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                          <HeaderFieldWithDivider label="Venue" value={eventLocation} />
                        </td>
                        <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                          <HeaderFieldWithDivider label="Event End" value={eventEnd} highlight />
                        </td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid #374151", background: "#e5e7eb" }}>
                          <HeaderFieldWithDivider label="FW Staff" value={fwStaff} />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", background: "#e5e7eb" }}>
                          <HeaderFieldWithDivider label="Venue Address" value={venueAddress} />
                        </td>
                        <td style={{ padding: "10px 16px", borderRight: "1px solid #374151", background: "#e5e7eb" }}>
                          <HeaderFieldWithDivider label="Rentals" value="" />
                        </td>
                        <td style={{ padding: "10px 16px", background: "#e5e7eb" }} />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Page 1 only: Not Buffet + Allergy banners */}
            {page.pageNum === 1 && notBuffetBanner && (
              <div className="beo-banner-block" style={styles.notBuffetBanner}>{notBuffetBanner}</div>
            )}
            {page.pageNum === 1 && allergies && (
              <div className="beo-banner-block" style={styles.allergyBanner}>⚠️ ALLERGIES / DIETARY RESTRICTIONS: {allergies.toUpperCase()}</div>
            )}

            {/* ── Menu Sections for this page ── */}
            {page.sections.map(({ section, items: sectionItems }) => (
          <div key={`${section.fieldId}-${page.pageNum}`} className="beo-section-card" style={styles.sectionCard}>
            <div className="beo-section-header" style={styles.sectionHeader}>
              <span style={{ color: getSectionColor(section.title), fontSize: "28px", lineHeight: 0 }}>●</span>
              <span>{section.title}</span>
              <span style={{ color: getSectionColor(section.title), fontSize: "28px", lineHeight: 0 }}>●</span>
            </div>
            {sectionItems.map((item, itemIdx) => {
              const rows = expandItemToRows(item);
              return (
              <div key={`${item.id}-${itemIdx}`} className="beo-menu-item-block" style={{ borderBottom: "1px solid #eee", marginTop: itemIdx > 0 ? 16 : 0 }}>
              {rows.map((row, rowIdx) => (
              <div key={rowIdx} className="beo-line-item" style={{ ...styles.lineItem, borderBottom: "none", gridTemplateColumns, padding: "4px 16px", lineHeight: 1.25, minHeight: "unset", alignItems: "flex-start", ...(row.isChild ? { marginTop: -4 } : {}) }}>
                {/* SPEC / PACK-OUT / EXPEDITOR / KITCHEN / SERVER: Spec Column (left) — always auto spec on screen; effective (override or auto) when printing */}
                {(leftCheck === "spec" || leftCheck === "packout" || leftCheck === "expeditor" || leftCheck === "kitchen" || leftCheck === "server") && (
                  <div className="beo-spec-col" style={{ ...styles.specCol, lineHeight: 1.25 }}>
                    {(() => {
                      const overrideKey = `${section.fieldId}:${item.id}:${rowIdx}`;
                      const overrideKeyLegacy = `${section.fieldId}:${item.id}`;
                      const overrideVal = specOverrides[overrideKey] ?? (rowIdx === 0 ? specOverrides[overrideKeyLegacy] : undefined) ?? item.specQty ?? "";
                      const autoSpec = calculateSpec({
                        itemId: item.id,
                        itemName: row.lineName,
                        section: section.title,
                        guestCount: parseInt(guestCount) || 0,
                        nickQtyOverride: undefined,
                      });
                      const effectiveSpec = overrideVal.trim() ? overrideVal.trim() : autoSpec;
                      return (
                        <>
                          <span className="no-print">{autoSpec}</span>
                          <span className="print-only">{effectiveSpec}</span>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* ALL MODES: Item Name (children indented 2 spaces) */}
                <div className="beo-item-col" style={{ ...styles.itemCol, lineHeight: 1.25 }}>
                  {row.lineName}
                </div>

                {/* SPEC VIEW: Override input/button (right) */}
                {leftCheck === "spec" && (
                  <div className="beo-spec-col" style={{ ...styles.specCol, display: "flex", flexDirection: "column", gap: 2 }} onClick={(e) => e.stopPropagation()}>
                    <span style={{ fontSize: 10, color: "#666", lineHeight: 1 }}>Override</span>
                    <input
                      type="text"
                      placeholder="spec..."
                      value={specOverrides[`${section.fieldId}:${item.id}:${rowIdx}`] ?? (rowIdx === 0 ? specOverrides[`${section.fieldId}:${item.id}`] : undefined) ?? item.specQty ?? ""}
                      onChange={(e) => {
                        const key = `${section.fieldId}:${item.id}:${rowIdx}`;
                        setSpecOverrides((prev) => ({ ...prev, [key]: e.target.value }));
                      }}
                      style={{
                        width: "100%",
                        padding: "2px 6px",
                        fontSize: 12,
                        lineHeight: 1,
                        background: "#f5f5f5",
                        border: "1px solid #ccc",
                        borderRadius: 3,
                      }}
                      className="no-print"
                    />
                  </div>
                )}

                {/* KITCHEN / EXPEDITOR / SERVER: Checkbox (right) — each mode has its own state */}
                {(leftCheck === "kitchen" || leftCheck === "expeditor" || leftCheck === "server") && (
                  <div style={styles.checkboxCol} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={checkState[`${leftCheck}:${section.fieldId}:${item.id}:${rowIdx}`] ?? item.loaded ?? false}
                      onChange={(e) => {
                        const key = `${leftCheck}:${section.fieldId}:${item.id}:${rowIdx}`;
                        setCheckState((prev) => ({ ...prev, [key]: e.target.checked }));
                      }}
                      className="no-print"
                    />
                  </div>
                )}

                {/* PACK-OUT: Editable equipment list (right) — per item, only on parent row */}
                {leftCheck === "packout" && (
                  <div style={styles.packOutCol} onClick={(e) => e.stopPropagation()}>
                    {rowIdx === 0 ? (
                      <textarea
                        placeholder="equipment..."
                        value={packOutEdits[`${section.fieldId}:${item.id}`] ?? item.packOutItems ?? ""}
                        onChange={(e) => {
                          setPackOutEdits((prev) => ({ ...prev, [`${section.fieldId}:${item.id}`]: e.target.value }));
                        }}
                        style={{
                          width: "100%",
                          minHeight: 36,
                          padding: "4px 6px",
                          fontSize: 11,
                          background: "#f5f5f5",
                          border: "1px solid #ccc",
                          borderRadius: 3,
                          resize: "vertical",
                          boxSizing: "border-box",
                        }}
                        className="no-print"
                        rows={2}
                      />
                    ) : (
                      <span style={{ color: "#999", fontSize: 10 }}>—</span>
                    )}
                  </div>
                )}

              </div>
            ))}
              </div>
            );
            })}
          </div>
        ))}

            {/* Last page only: Allergy banner + footer (inside page div) */}
            {pageIdx === kitchenPages.length - 1 && (
              <>
                {allergies && (
                  <div className="beo-banner-block" style={{ ...styles.allergyBanner, marginTop: 20, marginBottom: 12 }}>
                    ⚠️ ALLERGIES / DIETARY RESTRICTIONS: {allergies.toUpperCase()}
                  </div>
                )}
                <div className="beo-footer-block" style={{ marginTop: 24 }}>
                  <div style={{ border: "2px solid #333", borderRadius: 6, padding: "12px 20px", background: "#9ca3af" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: 8, fontSize: 13, fontWeight: 600, color: "#111" }}>
                      <span>Client: {clientName || "—"}</span>
                      <span style={{ color: "#374151", fontSize: 10 }}>|</span>
                      <span>Venue: {eventLocation || "—"}</span>
                      <span style={{ color: "#374151", fontSize: 10 }}>|</span>
                      <span>Dispatch: {dispatchTime || "—"}</span>
                      <span style={{ color: "#374151", fontSize: 10 }}>|</span>
                      <span>Guests: {guestCount || "—"}</span>
                      <span style={{ color: "#374151", fontSize: 10 }}>|</span>
                      <span>Job #: {jobNumberDisplay}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "center" as const, marginTop: 8, fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#333" }}>
                    ***end of event***
                  </div>
                </div>
              </>
            )}
          </div>
        )))}
        {/* When packout/expeditor/server: append Server BEO 2nd page (beverage, hydration, paper, notes, timeline) so it appears in those checks */}
        {(leftCheck === "packout" || leftCheck === "expeditor" || leftCheck === "server") && (
          <div style={{ pageBreakBefore: "always", marginTop: 24 }}>
            <ServerBeo2ndPageContent
              eventDate={eventDate}
              clientName={clientName}
              jobNumberDisplay={jobNumberDisplay}
              dispatchTime={dispatchTime}
              eventArrival={eventArrival}
              guestCount={guestCount}
              eventLocation={eventLocation}
              venueAddress={venueAddress}
              eventStart={eventStart}
              eventEnd={eventEnd}
              fwStaff={fwStaff}
              allergies={allergies}
              notBuffetBanner={notBuffetBanner}
              eventData={eventData}
              barServiceFieldId={barServiceFieldId}
              leftCheck={leftCheck}
              gridTemplateColumns={gridTemplateColumns}
              checkState={checkState}
              setCheckState={setCheckState}
              specOverrides={specOverrides}
              setSpecOverrides={setSpecOverrides}
              packOutEdits={packOutEdits}
              setPackOutEdits={setPackOutEdits}
            />
          </div>
        )}
      </div>
          )}
          {topTab === "meetingBeoNotes" && (
            <MeetingBeoNotesContent
              clientName={clientName}
              eventDate={eventDate}
              jobNumberDisplay={jobNumberDisplay}
              dispatchTime={dispatchTime}
              eventArrival={eventArrival}
              guestCount={guestCount}
              eventLocation={eventLocation}
              venueAddress={venueAddress}
              eventStart={eventStart}
              eventEnd={eventEnd}
              fwStaff={fwStaff}
              allergies={allergies}
              notBuffetBanner={notBuffetBanner}
              activeSections={activeSections}
              expandItemToRows={expandItemToRows}
              meetingNotes={meetingNotes}
              onAddNote={(itemId, itemName, sectionTitle) =>
                setNoteModal({ open: true, itemId, itemName, sectionTitle, draftNote: "" })
              }
            />
          )}
          {topTab === "fullBeoPacket" && (
            <FullBeoPacketBeveragesContent
              eventDate={eventDate}
              clientName={clientName}
              jobNumberDisplay={jobNumberDisplay}
              dispatchTime={dispatchTime}
              eventArrival={eventArrival}
              guestCount={guestCount}
              eventLocation={eventLocation}
              venueAddress={venueAddress}
              eventStart={eventStart}
              eventEnd={eventEnd}
              fwStaff={fwStaff}
              allergies={allergies}
              notBuffetBanner={notBuffetBanner}
              eventData={eventData}
              barServiceFieldId={barServiceFieldId}
            />
          )}
          {topTab === "serverBeo2ndPage" && (
            <ServerBeo2ndPageContent
              eventDate={eventDate}
              clientName={clientName}
              jobNumberDisplay={jobNumberDisplay}
              dispatchTime={dispatchTime}
              eventArrival={eventArrival}
              guestCount={guestCount}
              eventLocation={eventLocation}
              venueAddress={venueAddress}
              eventStart={eventStart}
              eventEnd={eventEnd}
              fwStaff={fwStaff}
              allergies={allergies}
              notBuffetBanner={notBuffetBanner}
              eventData={eventData}
              barServiceFieldId={barServiceFieldId}
              leftCheck={leftCheck}
              gridTemplateColumns={gridTemplateColumns}
              checkState={checkState}
              setCheckState={setCheckState}
              specOverrides={specOverrides}
              setSpecOverrides={setSpecOverrides}
              packOutEdits={packOutEdits}
              setPackOutEdits={setPackOutEdits}
            />
          )}
          {topTab === "buffetMenuSigns" && (
            <BuffetMenuSignsContent
              eventData={eventData}
              menuItemData={menuItemData}
              buffetMenuEdits={buffetMenuEdits}
              onEditDescription={(itemId, value) => setBuffetMenuEdits((p) => ({ ...p, [itemId]: value }))}
              onDeleteItem={(itemId) => setHiddenMenuItems((prev) => new Set([...prev, itemId]))}
              hiddenMenuItems={hiddenMenuItems}
              parseMenuItems={parseMenuItems}
              expandItemToRows={expandItemToRows}
              printMode={printMode}
              menuTheme={menuTheme}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default BeoPrintPage;
