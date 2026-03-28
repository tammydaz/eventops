import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useEventStore } from "../state/eventStore";
import { useAuthStore } from "../state/authStore";
import { useBeoPrintStore } from "../state/beoPrintStore";
import { FIELD_IDS, getBarServiceFieldId, getLockoutFieldIds, getBOHProductionFieldIds, resolveFwStaffLineFromFields } from "../services/airtable/events";
import { airtableFetch } from "../services/airtable/client";
import { loadStationsByEventId } from "../services/airtable/linkedRecords";
import { loadStationComponentNamesByIds } from "../services/airtable/stationComponents";
import { loadBoxedLunchOrdersByEventId, type BoxedLunchOrder } from "../services/airtable/boxedLunchOrders";
import { buildBoxedLunchBeoSectionsFromOrders } from "../utils/boxedLunchPrint";
import { getPlatterOrdersByEventId } from "../state/platterOrdersStore";
import { asBarServicePrimary, asBoolean, asLinkedRecordIds, asMultiSelectNames, asSingleSelectName, asString, asStringArray, isErrorResult } from "../services/airtable/selectors";
import { secondsToTimeString, secondsTo12HourString } from "../utils/timeHelpers";
import { isDeliveryOrPickup } from "../lib/deliveryHelpers";
import { FULL_BAR_PACKAGE, FULL_BAR_PACKAGE_SPECK_ROWS, getFullBarPackagePackoutItems, getSignatureCocktailGreeting, getNonStandardBarItems, parseBarItemTokens, isStandardBarItem } from "../constants/fullBarPackage";
import { ConfirmSendToBOHModal } from "../components/ConfirmSendToBOHModal";
import { AcceptTransferModal } from "../components/AcceptTransferModal";
import { getSauceOverrides } from "../state/sauceOverrideStore";
import { getBeoSpecStorageKey, getSpecOverrideKey } from "../utils/beoSpecStorage";
import { loadEventMenuRows, type EventMenuRow, type ChildOverridesData } from "../services/airtable/eventMenu";

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
  // Delivery sections — locked structure colors
  if (sectionTitle.includes("HOT FOOD")) return "#f97316";            // section 1: orange (heat)
  if (sectionTitle.includes("COLD / DELI")) return "#3b82f6";         // section 2: blue (cold)
  if (sectionTitle.includes("BOXED ITEMS")) return "#22c55e";          // section 3: green (packaged)
  if (sectionTitle.includes("DESSERT / SNACKS")) return "#ef4444";     // section 4: red (sweets)
  if (sectionTitle === "BEVERAGES") return "#a855f7";                  // section 5: purple
  if (sectionTitle === "SERVICEWARE") return "#6b7280";                // section 6: gray
  // Full-service sections (unchanged)
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

// ── Header field with vertical divider (used in Server BEO / other views) ──
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

// ── BEO header table: Kitchen BEO style (condensed for ticket rail) ──
const LABEL_BG = "#fff";
const LABEL_CELL = { fontSize: 10, fontWeight: 700, color: "#000", padding: "1px 6px", border: "1px solid #000", verticalAlign: "middle" as const, background: LABEL_BG, lineHeight: 1 };
const DATA_CELL = { fontSize: 11, fontWeight: 400, color: "#000", padding: "1px 6px", border: "1px solid #000", background: "#fff", verticalAlign: "middle" as const, lineHeight: 1 };
// Kitchen BEO header style: 2px table border, condensed, 15/35/15/35 cols
const KITCHEN_HEADER_TABLE = { width: "100%", borderCollapse: "collapse" as const, border: "2px solid #000", marginBottom: 0 };
const KITCHEN_HEADER_CELL = { padding: "1px 6px", fontSize: 11, border: "1px solid #000", verticalAlign: "middle" as const, background: "#fff", lineHeight: 1 };

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

/** Parent/child item row styling for BEO print.
 * - Parent with children → bold (#111), fontWeight 700
 * - Child row → lighter (#777), fontWeight 400, italic
 * - Standalone parent (no children) → normal (#333), fontWeight 600
 */
function getItemRowNameStyle(isChild: boolean, hasChildren: boolean): React.CSSProperties {
  if (isChild) return { fontWeight: 400, color: "#777", fontStyle: "italic" };
  if (hasChildren) return { fontWeight: 700, color: "#111" };
  return { fontWeight: 600, color: "#333" };
}

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
  @media screen {
    .beo-print-content {
      box-shadow: 0 2px 12px rgba(0,0,0,0.12);
    }
  }
  @media print {
    html {
      color-scheme: light !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      color: #000 !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      color: #000 !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #root, #root > * {
      background: white !important;
      color: #000 !important;
      visibility: visible !important;
      opacity: 1 !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .beo-print-content {
      display: block !important;
      color: #000 !important;
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      width: 8.5in !important;
      max-width: 8.5in !important;
      padding: 0.5in !important;
      margin: 0 auto !important;
      box-sizing: border-box !important;
      font-size: 14pt !important;
      overflow: visible !important;
      min-height: 11in !important;
      height: auto !important;
      max-height: none !important;
    }
    .beo-print-layout, .beo-print-main {
      background: white !important;
      max-width: none !important;
      overflow: visible !important;
      min-height: auto !important;
      height: auto !important;
      max-height: none !important;
    }
    .beo-page, .print-page, .kitchen-beo-page, .page {
      display: block !important;
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      width: 8.5in !important;
      min-height: 11in !important;
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
    }
    .kitchen-beo-page .beo-section-card,
    .kitchen-beo-page .beo-line-item,
    .kitchen-beo-page .beo-menu-item-block,
    .kitchen-beo-page table td {
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
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
      margin: 0.12in 0 !important;
      break-inside: auto !important;
      page-break-inside: auto !important;
      overflow: visible !important;
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .beo-section-header {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }
    .meeting-beo-beo-section {
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .beo-section-header-with-first-item {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      background: white !important;
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
      break-before: avoid !important;
      page-break-before: avoid !important;
    }
    .beo-print-content {
      orphans: 2 !important;
      widows: 2 !important;
    }
    .beo-section-header {
      font-size: 12pt !important;
      font-weight: 700 !important;
      background: white !important;
    }
    .beo-line-item {
      font-size: 13pt !important;
    }
    .beo-spec-col {
      font-size: 13pt !important;
    }
    .beo-item-col {
      font-size: 13pt !important;
      overflow: visible !important;
      overflow-wrap: break-word !important;
      word-break: break-word !important;
    }
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    .print-page { break-after: page; }
    .kitchen-beo-page {
      width: 8.5in;
      min-height: auto !important;
      margin: 0 auto;
      padding: 0.35in 0.35in 0.4in 0.35in;
      display: block !important;
      page-break-after: auto;
      break-after: auto;
      overflow: visible !important;
      height: auto !important;
      max-height: none !important;
    }
    .kitchen-beo-page:last-child { break-after: auto; }
    .menu-section-page { break-after: page !important; width: 8in !important; min-height: 10in !important; box-sizing: border-box !important; }
    .kitchen-beo-page,
    .beo-print-content,
    .print-page {
      display: block !important;
      justify-content: flex-start !important;
      align-items: flex-start !important;
    }
  }
  @page {
    size: 8.5in 11in;
    margin: 0.4in;
    margin-top: 2in;
    @top-center {
      font-size: 18pt;
      font-weight: 800;
      color: #111;
      letter-spacing: 0.05em;
    }
  }
  @page :first {
    margin-top: 0.4in;
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
    .print-wrapper.print-tent-mode { background: #fff !important; color: #2c2c2c !important; }
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
      background: #fff !important;
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
      content: none !important;
    }
    .print-menu-mode.theme-classic-european .menu-section-page::after,
    .print-tent-mode.theme-classic-european .tent-card::after {
      content: none !important;
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
    .print-tent-mode.theme-rustic-elegant .tent-card { background: #fff !important; }
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
    width: "8.5in",
    maxWidth: "8.5in",
    minHeight: "11in",
    margin: "0 auto",
    padding: "0",
    background: "#fff",
    color: "#000",
    boxSizing: "border-box" as const,
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
    padding: "4px 12px",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 6,
    border: "2px solid #ff0000",
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  notBuffetBanner: {
    background: "#e0f2fe",
    color: "#0369a1",
    padding: "4px 12px",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 6,
    border: "2px solid #0284c7",
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  religiousBanner: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "4px 12px",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 6,
    border: "2px solid #d97706",
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  beoNotesBanner: {
    background: "#fef9c3",
    color: "#854d0e",
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 6,
    border: "2px solid #ca8a04",
    borderRadius: 6,
    letterSpacing: 0.5,
    whiteSpace: "pre-wrap" as const,
  },
  sectionCard: {
    background: "#fff",
    border: "2px solid #000",
    borderRadius: 4,
    marginBottom: 4,
    overflow: "visible" as const,
  },
  sectionHeader: {
    background: "transparent",
    color: "#000",
    padding: "2px 8px",
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "'Segoe UI', Arial, sans-serif",
    textAlign: "center" as const,
    marginTop: 2,
    marginBottom: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  lineItem: {
    display: "grid",
    padding: "1px 8px",
    borderBottom: "1px solid #eee",
    fontSize: 10,
    lineHeight: 1.15,
    alignItems: "center" as const,
  },
  specCol: { fontWeight: 700, color: "#555", fontSize: 10 },
  itemCol: { fontWeight: 600, color: "#333", fontSize: 10, overflowWrap: "break-word" as const, wordBreak: "break-word" as const, minWidth: 0, paddingLeft: "2ch" },
  packOutCol: { fontSize: 10, color: "#666", textAlign: "right" as const },
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
    fontSize: 10,
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
    background: "#1a1a1a", // Screen only; print CSS overrides to white
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
    outline: "none",
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

// ── Server 2nd page table styles (single-spaced) ──
const serverBeoTable = {
  width: "100%",
  borderCollapse: "collapse" as const,
  fontSize: 11,
  border: "1px solid #000",
};
const serverBeoCell = {
  padding: "3px 6px",
  border: "1px solid #000",
  verticalAlign: "top" as const,
  lineHeight: 1,
  fontSize: 11,
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

// ── Section pill for BEO print (with dot color, always expanded). Omit title to hide the header (e.g. Bar table only). ──
function BeoSectionPill({
  title,
  dotColor,
  children,
}: { title: string; dotColor: string; children: React.ReactNode }) {
  const showHeader = title.length > 0;
  return (
    <div className="beo-section-card" style={styles.sectionCard}>
      {showHeader && (
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
          <span style={{ color: dotColor, fontSize: "22px", lineHeight: 0 }}>●</span>
          <span>{title}</span>
          <span style={{ color: dotColor, fontSize: "22px", lineHeight: 0 }}>●</span>
        </div>
      )}
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
            {/* Spec column (left): show override when present, else auto spec; same on screen and print */}
            <div className="beo-spec-col" style={{ ...styles.specCol, lineHeight: 1 }}>
              <span>{specOverrides[overrideKey]?.trim() || r.speck || "—"}</span>
            </div>
            {/* Item column (middle) */}
            <div className="beo-item-col" style={{ ...styles.itemCol, lineHeight: 1 }}>{r.item}</div>
            {/* Right column: override input (spec mode) / checkbox / packout */}
            {leftCheck === "spec" && (
              <div className="beo-spec-col" style={{ ...styles.specCol, display: "flex", flexDirection: "column", gap: 2 }} onClick={(e) => { e.stopPropagation(); if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur(); }}>
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
              <div style={styles.checkboxCol} onClick={(e) => { e.stopPropagation(); if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur(); }}>
                <input
                  type="checkbox"
                  checked={checkState[checkKey] ?? false}
                  onChange={(e) => setCheckState((prev) => ({ ...prev, [checkKey]: e.target.checked }))}
                  className="no-print"
                  style={{ width: "20px", height: "20px", accentColor: "#333", cursor: "pointer" }}
                />
              </div>
            )}
            {leftCheck === "packout" && (
              <div style={styles.packOutCol} onClick={(e) => { e.stopPropagation(); if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur(); }}>
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

// ── S2-BEO header (reusable: CLIENT, CONTACT, PHONE, ADDRESS, etc.) ──
/** Delivery layout matches sample Excel BEOs in repo (HOUSE ORDER NUMBER, DELIVERY TIME, DELIVERY NOTES, …). */
function S2Header(props: {
  eventDate: string;
  clientName: string;
  contactName: string;
  cityState: string;
  jobNumberDisplay: string;
  dispatchTime: string;
  eventArrival: string;
  guestCount: string;
  eventLocation: string;
  venueAddress: string;
  eventStart: string;
  eventEnd: string;
  fwStaff: string;
  phoneStr: string;
  isDelivery?: boolean;
  /** Right column of DELIVERY NOTES row — typically Special Notes from intake */
  deliveryNotes?: string;
}) {
  const isDelivery = props.isDelivery === true;
  const deliveryNotes = (props.deliveryNotes ?? "").trim();
  return (
    <>
      {!isDelivery && (
        <div style={{ fontSize: 12, fontWeight: 600, color: "#111", marginBottom: 4 }}>{props.eventDate || "—"}</div>
      )}
      <div
        className="beo-letterhead-bar"
        style={{
          background: isDelivery ? "#facc15" : "#6b7280",
          color: isDelivery ? "#000" : "#fff",
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 13,
          fontWeight: 700,
          border: isDelivery ? "2px solid #000" : "2px solid #374151",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 22,
              height: 22,
              background: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "rotate(45deg)",
              flexShrink: 0,
            }}
          >
            <span style={{ transform: "rotate(-45deg)", fontSize: 11, fontWeight: 800, color: "#fff" }}>f</span>
          </div>
          <span>{isDelivery ? "DELIVERY" : "BEO"}</span>
        </div>
        <span style={{ textAlign: "right" as const }}>
          {isDelivery ? (
            <>
              HOUSE ORDER NUMBER: {props.jobNumberDisplay || "—"} — DISPATCH TIME: {props.dispatchTime || "—"}
            </>
          ) : (
            <>JOB#: {props.jobNumberDisplay} — DISPATCH TIME {props.dispatchTime}</>
          )}
        </span>
      </div>
      <div className="beo-event-details-table" style={{ marginTop: 6, overflow: "hidden" }}>
        <table style={KITCHEN_HEADER_TABLE}>
          <colgroup>
            <col style={{ width: "15%" }} />
            <col style={{ width: "35%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "35%" }} />
          </colgroup>
          <tbody>
            {isDelivery ? (
              <>
                <tr>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>CLIENT</td>
                  <td style={KITCHEN_HEADER_CELL}>{props.clientName || "—"}</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>EVENT DATE</td>
                  <td style={KITCHEN_HEADER_CELL}>{props.eventDate || "—"}</td>
                </tr>
                <tr>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>CONTACT</td>
                  <td style={KITCHEN_HEADER_CELL}>{props.contactName || "—"}</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>GUESTS</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.guestCount || "—"}</td>
                </tr>
                <tr>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>PHONE</td>
                  <td style={KITCHEN_HEADER_CELL}>{props.phoneStr || "—"}</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>DELIVERY TIME</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.dispatchTime || "—"}</td>
                </tr>
                <tr>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>ADDRESS</td>
                  <td style={KITCHEN_HEADER_CELL}>{props.venueAddress || "—"}</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>DELIVERY NOTES</td>
                  <td style={KITCHEN_HEADER_CELL}>{deliveryNotes || "—"}</td>
                </tr>
                <tr>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>CITY, ST</td>
                  <td style={KITCHEN_HEADER_CELL}>{props.cityState || "—"}</td>
                  <td style={KITCHEN_HEADER_CELL} />
                  <td style={KITCHEN_HEADER_CELL} />
                </tr>
                <tr>
                  <td style={KITCHEN_HEADER_CELL} />
                  <td style={KITCHEN_HEADER_CELL} />
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>FW STAFF</td>
                  <td style={KITCHEN_HEADER_CELL}>{props.fwStaff || "—"}</td>
                </tr>
              </>
            ) : (
              <>
                <tr>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>CLIENT</td>
                  <td style={KITCHEN_HEADER_CELL}>{props.clientName || "—"}</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>ORDER #</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.jobNumberDisplay || "—"}</td>
                </tr>
                <tr>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>CONTACT</td>
                  <td style={KITCHEN_HEADER_CELL}>{props.contactName || "—"}</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>EVENT DATE</td>
                  <td style={KITCHEN_HEADER_CELL}>{props.eventDate || "—"}</td>
                </tr>
                <tr>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>PHONE</td>
                  <td style={KITCHEN_HEADER_CELL}>{props.phoneStr || "—"}</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>GUESTS</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.guestCount || "—"}</td>
                </tr>
                <tr>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>ADDRESS</td>
                  <td style={KITCHEN_HEADER_CELL}>{props.venueAddress || "—"}</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>EVENT START</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.eventStart || "—"}</td>
                </tr>
                <tr>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>CITY, ST</td>
                  <td style={KITCHEN_HEADER_CELL}>{props.cityState || "—"}</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>EVENT END</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.eventEnd || "—"}</td>
                </tr>
                <tr>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>VENUE</td>
                  <td style={KITCHEN_HEADER_CELL}>{props.eventLocation || "—"}</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>EVENT ARRIVAL</td>
                  <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.eventArrival || "—"}</td>
                </tr>
                <tr>
                  <td style={KITCHEN_HEADER_CELL} />
                  <td style={KITCHEN_HEADER_CELL} />
                  <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>FW STAFF</td>
                  <td style={KITCHEN_HEADER_CELL}>{props.fwStaff || "—"}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── S-BEO: S2 header + K-BEO body (food only, stops at desserts) — first part of Full BEO Packet ──
function SBeoContent(props: {
  eventDate: string;
  clientName: string;
  contactName: string;
  cityState: string;
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
  religiousRestrictions?: string;
  beoNotes?: string;
  eventData: Record<string, unknown>;
  kitchenPages: { pageNum: number; sections: Array<{ section: SectionData; items: MenuLineItem[]; isContinuation?: boolean }> }[];
  expandItemToRows: (item: MenuLineItem) => { lineName: string; isChild: boolean; itemId: string }[];
  specOverrides: Record<string, string>;
  setSpecOverrides: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  checkState: Record<string, boolean>;
  setCheckState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  packOutEdits: Record<string, string>;
  setPackOutEdits: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isDelivery: boolean;
}) {
  const { kitchenPages, expandItemToRows, specOverrides, setSpecOverrides, checkState, setCheckState, packOutEdits, setPackOutEdits, isDelivery } = props;
  const phoneStr = asString(props.eventData[FIELD_IDS.CONTACT_PHONE]) || asString(props.eventData[FIELD_IDS.CLIENT_PHONE]) || "";
  const leftCheck = "server";
  const gridTemplateColumns = "140px 1fr 40px";

  return (
    <>
      {kitchenPages.length === 0 || (kitchenPages.length === 1 && kitchenPages[0].sections.length === 0) ? (
        <div className="beo-print-content" style={styles.page}>
          <div className="beo-event-header-block" style={{ marginBottom: 8 }}>
            <S2Header
              eventDate={props.eventDate}
              clientName={props.clientName}
              contactName={props.contactName}
              cityState={props.cityState}
              jobNumberDisplay={props.jobNumberDisplay}
              dispatchTime={props.dispatchTime}
              eventArrival={props.eventArrival}
              guestCount={props.guestCount}
              eventLocation={props.eventLocation}
              venueAddress={props.venueAddress}
              eventStart={props.eventStart}
              eventEnd={props.eventEnd}
              fwStaff={props.fwStaff}
              phoneStr={phoneStr}
              isDelivery={isDelivery}
              deliveryNotes={deliveryNotes}
            />
          </div>
          <div style={{ padding: 32, textAlign: "center", color: "#999", fontSize: 16 }}>
            No menu items assigned to this event yet.
          </div>
        </div>
      ) : (
        kitchenPages.map((page, pageIdx) => (
          <div
            key={`s-beo-${page.pageNum}`}
            className="beo-print-content kitchen-beo-page page"
            style={{
              ...styles.page,
              pageBreakAfter: pageIdx < kitchenPages.length - 1 ? "page" : "auto",
            }}
          >
            {/* S2 header on every page */}
            <div className="beo-event-header-block" style={{ marginBottom: page.pageNum === 1 ? 8 : 6 }}>
              <S2Header
                eventDate={props.eventDate}
                clientName={props.clientName}
                contactName={props.contactName}
                cityState={props.cityState}
                jobNumberDisplay={props.jobNumberDisplay}
                dispatchTime={props.dispatchTime}
                eventArrival={props.eventArrival}
                guestCount={props.guestCount}
                eventLocation={props.eventLocation}
                venueAddress={props.venueAddress}
                eventStart={props.eventStart}
                eventEnd={props.eventEnd}
                fwStaff={props.fwStaff}
                phoneStr={phoneStr}
                isDelivery={isDelivery}
                deliveryNotes={deliveryNotes}
              />
            </div>
            {page.pageNum > 1 && !isDelivery && (
              <div className="kitchen-beo-page2-buffer" style={{ height: "10in", minHeight: "10in", flexShrink: 0 }} aria-hidden="true" />
            )}
            {page.pageNum === 1 && (props.beoNotes?.trim() || props.notBuffetBanner || props.allergies || props.religiousRestrictions?.trim()) && (
              <div className="beo-banner-container">
                {props.beoNotes?.trim() && (
                  <div className="beo-banner-block" style={styles.beoNotesBanner}>📋 BEO NOTES: {props.beoNotes.trim()}</div>
                )}
                {props.notBuffetBanner && (
                  <div className="beo-banner-block" style={styles.notBuffetBanner}>{props.notBuffetBanner}</div>
                )}
                {props.allergies && (
                  <div className="beo-banner-block" style={styles.allergyBanner}>⚠️ ALLERGIES / DIETARY RESTRICTIONS: {props.allergies.toUpperCase()}</div>
                )}
                {props.religiousRestrictions?.trim() && (
                  <div className="beo-banner-block" style={styles.religiousBanner}>🕎 RELIGIOUS / DIETARY: {props.religiousRestrictions.trim().toUpperCase()}</div>
                )}
              </div>
            )}
            {page.sections.map(({ section, items: sectionItems, isContinuation }, secIdx) => (
              <div key={`${section.fieldId}-${page.pageNum}-${secIdx}`} className="beo-section-card" style={styles.sectionCard}>
                <div className={sectionItems.length > 0 ? "beo-section-header-with-first-item" : undefined}>
                  <div className="beo-section-header" style={styles.sectionHeader}>
                    <span style={{ color: getSectionColor(section.title), fontSize: "22px", lineHeight: 0 }}>●</span>
                    <span>{section.title}{isContinuation ? " (cont.)" : ""}</span>
                    <span style={{ color: getSectionColor(section.title), fontSize: "22px", lineHeight: 0 }}>●</span>
                  </div>
                  {sectionItems.length > 0 && (() => {
                    const item = sectionItems[0];
                    const rows = expandItemToRows(item);
                    return (
                      <div key={`${item.id}-0`} className="beo-menu-item-block" style={{ borderBottom: "1px solid #ddd", paddingBottom: 2, marginTop: 0 }}>
                        {rows.map((row, rowIdx) => (
                          <div key={rowIdx} className="beo-line-item" style={{ ...styles.lineItem, borderBottom: "none", gridTemplateColumns, padding: row.isChild ? "0 8px 0 8px" : "0 8px", paddingLeft: row.isChild ? "calc(8px + 2ch)" : 8, lineHeight: 1.15, minHeight: "unset", alignItems: "flex-start", marginTop: row.isChild ? 0 : 0 }}>
                            <div className="beo-spec-col" style={{ ...styles.specCol, lineHeight: 1.2 }}>
                              {(() => {
                                const overrideKey = `${section.fieldId}:${item.id}:${rowIdx}`;
                                const overrideKeyLegacy = `${section.fieldId}:${item.id}`;
                                const overrideVal = specOverrides[overrideKey] ?? (rowIdx === 0 ? specOverrides[overrideKeyLegacy] : undefined) ?? (rowIdx === 0 ? item.specQty : undefined) ?? "";
                                return <span>{overrideVal.trim() || "—"}</span>;
                              })()}
                            </div>
                            <div className="beo-item-col" style={{ ...styles.itemCol, lineHeight: 1.25, ...getItemRowNameStyle(row.isChild, rows.some(r => r.isChild)) }}>{row.lineName}</div>
                            <div style={styles.checkboxCol} onClick={(e) => { e.stopPropagation(); if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur(); }}>
                              <input
                                type="checkbox"
                                checked={checkState[`${leftCheck}:${section.fieldId}:${item.id}:${rowIdx}`] ?? item.loaded ?? false}
                                onChange={(e) => {
                                  const key = `${leftCheck}:${section.fieldId}:${item.id}:${rowIdx}`;
                                  setCheckState((prev) => ({ ...prev, [key]: e.target.checked }));
                                }}
                                className="no-print"
                                style={{ width: "20px", height: "20px", accentColor: "#333", cursor: "pointer" }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                {sectionItems.slice(1).map((item, itemIdx) => {
                  const rows = expandItemToRows(item);
                  return (
                    <div key={`${item.id}-${itemIdx + 1}`} className="beo-menu-item-block" style={{ borderBottom: "1px solid #ddd", paddingBottom: 2, marginTop: 2 }}>
                      {rows.map((row, rowIdx) => (
                        <div key={rowIdx} className="beo-line-item" style={{ ...styles.lineItem, borderBottom: "none", gridTemplateColumns, padding: row.isChild ? "0 8px 0 8px" : "0 8px", paddingLeft: row.isChild ? "calc(8px + 2ch)" : 8, lineHeight: 1.15, minHeight: "unset", alignItems: "flex-start", marginTop: row.isChild ? 0 : 0 }}>
                          <div className="beo-spec-col" style={{ ...styles.specCol, lineHeight: 1.2 }}>
                            {(() => {
                              const overrideKey = `${section.fieldId}:${item.id}:${rowIdx}`;
                              const overrideKeyLegacy = `${section.fieldId}:${item.id}`;
                              const overrideVal = specOverrides[overrideKey] ?? (rowIdx === 0 ? specOverrides[overrideKeyLegacy] : undefined) ?? (rowIdx === 0 ? item.specQty : undefined) ?? "";
                              return <span>{overrideVal.trim() || "—"}</span>;
                            })()}
                          </div>
                          <div className="beo-item-col" style={{ ...styles.itemCol, lineHeight: 1.25, ...getItemRowNameStyle(row.isChild, rows.some(r => r.isChild)) }}>{row.lineName}</div>
                          <div style={styles.checkboxCol} onClick={(e) => { e.stopPropagation(); if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur(); }}>
                            <input type="checkbox" checked={checkState[`${leftCheck}:${section.fieldId}:${item.id}:${rowIdx}`] ?? item.loaded ?? false} onChange={(e) => { setCheckState((prev) => ({ ...prev, [`${leftCheck}:${section.fieldId}:${item.id}:${rowIdx}`]: e.target.checked })); }} className="no-print" style={{ width: "20px", height: "20px", accentColor: "#333", cursor: "pointer" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))
      )}
    </>
  );
}

// ── Full BEO Packet — Beverages section (page 2) with collapsible pills ──
// Uses same header as Server BEO 2nd page (CLIENT, CONTACT, PHONE, ADDRESS, etc.) — servers need full details
function FullBeoPacketBeveragesContent(props: {
  eventDate: string;
  clientName: string;
  contactName: string;
  cityState: string;
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
  religiousRestrictions?: string;
  beoNotes?: string;
  eventData: Record<string, unknown>;
  barServiceFieldId?: string | null;
}) {
  const { eventData, barServiceFieldId } = props;
  const phoneStr = asString(eventData[FIELD_IDS.CONTACT_PHONE]) || asString(eventData[FIELD_IDS.CLIENT_PHONE]) || "";
  const f = (id: string) => asString(eventData[id]);
  const barFid = barServiceFieldId ?? FIELD_IDS.BAR_SERVICE;
  const barServiceSelectedHeader = asMultiSelectNames(eventData[barFid]);
  const barServiceLabel = barServiceSelectedHeader.length ? barServiceSelectedHeader.filter((x) => x !== "None").join(", ") || "N/A" : "—";
  const signatureDrinkName = f(FIELD_IDS.BAR_SIGNATURE_DRINK_NAME);
  const signatureDrinkRecipe = f(FIELD_IDS.BAR_SIGNATURE_DRINK_INGREDIENTS);
  const isFullBarPackage = barServiceSelectedHeader.includes("Full Bar Package");
  const hasSignatureDrink = signatureDrinkName.trim() !== "";

  const hydrationProvided = asSingleSelectName(eventData[FIELD_IDS.HYDRATION_STATION_PROVIDED]);
  const hydrationDrinkOptions = asStringArray(eventData[FIELD_IDS.HYDRATION_STATION_DRINK_OPTIONS]);
  const hydrationNotes = f(FIELD_IDS.HYDRATION_STATION_NOTES);
  const hasHydration = hydrationProvided === "Yes" && (hydrationDrinkOptions.length > 0 || hydrationNotes.trim() !== "");
  const coffeeServiceNeeded = f(FIELD_IDS.COFFEE_SERVICE_NEEDED);
  const hasCoffeeTea = coffeeServiceNeeded === "Yes";
  const iceProvidedBy = asSingleSelectName(eventData[FIELD_IDS.ICE_PROVIDED_BY]);
  const hasIce = iceProvidedBy.trim() !== "";

  const barServiceKitchenBeo = asString(eventData[FIELD_IDS.BAR_SERVICE_KITCHEN_BEO]);

  return (
    <div className="beo-print-content" style={styles.page}>
      {/* Same header as Server BEO 2nd page — servers need full details (CLIENT, CONTACT, PHONE, etc.) */}
      <div className="beo-event-header-block" style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#111", marginBottom: 4 }}>{props.eventDate || "—"}</div>
        <div className="beo-letterhead-bar" style={{
          background: "#6b7280", color: "#fff", padding: "8px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 13, fontWeight: 700, border: "2px solid #374151",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)", flexShrink: 0 }}>
              <span style={{ transform: "rotate(-45deg)", fontSize: 11, fontWeight: 800, color: "#fff" }}>f</span>
            </div>
            <span>BEO</span>
          </div>
          <span>JOB#: {props.jobNumberDisplay} — DISPATCH TIME {props.dispatchTime}</span>
        </div>
        <div className="beo-event-details-table" style={{ marginTop: 6, overflow: "hidden" }}>
          <table style={KITCHEN_HEADER_TABLE}>
            <colgroup>
              <col style={{ width: "15%" }} />
              <col style={{ width: "35%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "35%" }} />
            </colgroup>
            <tbody>
              <tr>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>CLIENT</td>
                <td style={KITCHEN_HEADER_CELL}>{props.clientName || "—"}</td>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>ORDER #</td>
                <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.jobNumberDisplay || "—"}</td>
              </tr>
              <tr>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>CONTACT</td>
                <td style={KITCHEN_HEADER_CELL}>{props.contactName || "—"}</td>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>EVENT DATE</td>
                <td style={KITCHEN_HEADER_CELL}>{props.eventDate || "—"}</td>
              </tr>
              <tr>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>PHONE</td>
                <td style={KITCHEN_HEADER_CELL}>{phoneStr || "—"}</td>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>GUESTS</td>
                <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.guestCount || "—"}</td>
              </tr>
              <tr>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>ADDRESS</td>
                <td style={KITCHEN_HEADER_CELL}>{props.venueAddress || "—"}</td>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>EVENT START</td>
                <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.eventStart || "—"}</td>
              </tr>
              <tr>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>CITY, ST</td>
                <td style={KITCHEN_HEADER_CELL}>{props.cityState || "—"}</td>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>EVENT END</td>
                <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.eventEnd || "—"}</td>
              </tr>
              <tr>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>VENUE</td>
                <td style={KITCHEN_HEADER_CELL}>{props.eventLocation || "—"}</td>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>EVENT ARRIVAL</td>
                <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.eventArrival || "—"}</td>
              </tr>
              <tr>
                <td style={KITCHEN_HEADER_CELL} />
                <td style={KITCHEN_HEADER_CELL} />
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>FW STAFF</td>
                <td style={KITCHEN_HEADER_CELL}>{props.fwStaff || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {barServiceKitchenBeo.trim() && (
        <div className="beo-banner-block" style={{ ...styles.beoNotesBanner, background: "#1e3a5f", color: "#fff", borderColor: "#1e3a5f" }}>
          🍸 BAR / SERVICE NOTES: {barServiceKitchenBeo.trim()}
        </div>
      )}
      {props.beoNotes?.trim() && (
        <div className="beo-banner-block" style={styles.beoNotesBanner}>📋 BEO NOTES: {props.beoNotes.trim()}</div>
      )}
      {props.notBuffetBanner && (
        <div className="beo-banner-block" style={styles.notBuffetBanner}>{props.notBuffetBanner}</div>
      )}
      {props.allergies && (
        <div className="beo-banner-block" style={styles.allergyBanner}>⚠️ ALLERGIES: {props.allergies.toUpperCase()}</div>
      )}
      {props.religiousRestrictions?.trim() && (
        <div className="beo-banner-block" style={styles.religiousBanner}>🕎 RELIGIOUS / DIETARY: {props.religiousRestrictions.trim().toUpperCase()}</div>
      )}

      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 24, marginBottom: 12, color: "#dc2626", textAlign: "center" }}>BEVERAGES</div>

      <BeveragePill title="Bar Service">
        {isFullBarPackage ? (
          <div style={{ fontSize: 14, lineHeight: 1.2 }}>
            {FULL_BAR_PACKAGE.glasswareAndService.map((g) => <div key={g}>{g}</div>)}
            {FULL_BAR_PACKAGE.garnishes.map((g) => <div key={g}>{g}</div>)}
            {FULL_BAR_PACKAGE.mixers.map((m) => <div key={m}>{m}</div>)}
            {hasSignatureDrink && (
              <div style={{ marginTop: 8 }}>
                <div>{getSignatureCocktailGreeting(signatureDrinkName)}</div>
                {signatureDrinkRecipe.trim() && <div style={{ marginTop: 4, whiteSpace: "pre-wrap", fontSize: 13 }}>{signatureDrinkRecipe.trim()}</div>}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 14 }}>Bar Service: {barServiceLabel}</div>
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
  contactName: string;
  cityState: string;
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
  religiousRestrictions?: string;
  beoNotes?: string;
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
  const barServiceSelected = asMultiSelectNames(eventData[barFid]);
  const barService = asBarServicePrimary(eventData[barFid]); // primary for single-place label
  const signatureDrinkName = f(FIELD_IDS.BAR_SIGNATURE_DRINK_NAME);
  const signatureDrinkRecipe = f(FIELD_IDS.BAR_SIGNATURE_DRINK_INGREDIENTS);
  const signatureDrinkMixersSupplier = asSingleSelectName(eventData[FIELD_IDS.BAR_SIGNATURE_DRINK_MIXERS_SUPPLIER]);
  const signatureDrinkMixers = f(FIELD_IDS.BAR_MIXERS);
  const signatureDrinkGarnishes = f(FIELD_IDS.BAR_GARNISHES);
  const isClientSupplyingBar = /client/i.test(signatureDrinkMixersSupplier || "");
  const isFullBarPackage = barServiceSelected.includes("Full Bar Package");
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
  const dietarySummaryNotes = f(FIELD_IDS.DIETARY_SUMMARY);
  const hasNotes =
    dietaryNotes.trim() !== "" ||
    dietarySummaryNotes.trim() !== "" ||
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

  // Beverages: bar rows (collapsible to CLIENT or FOODWERX) + other rows (hydration, coffee, ice)
  type BeverageRow = { client: string; speck?: string; foodwerx: string };
  type ThreeColRow = { client: string; rentals: string; foodwerx: string };
  const barRows: BeverageRow[] = [];
  const otherBeverageRows: BeverageRow[] = [];
  const paperRows: ThreeColRow[] = [];
  const rentalsDisplay = f(FIELD_IDS.RENTALS) || "";
  const source = asSingleSelectName(eventData[FIELD_IDS.SERVICEWARE_SOURCE])?.toLowerCase() || "";

  // ── Bar rows (under "Bar"; intake picks CLIENT or FOODWERX — only that column shows) ──
  if (isClientSupplyingBar) barRows.push({ client: "Mixers", foodwerx: "" });
  if (!isFullBarPackage) {
    const barLabel = barServiceSelected.length === 0 ? "N/A" : barServiceSelected.some((x) => /foodwerx bartender only/i.test(x)) ? "Foodwerx bartender, client supplying mixers" : barServiceSelected.join(", ");
    barRows.push({ client: "", foodwerx: barLabel });
  } else {
    barRows.push({ client: "", foodwerx: "Bars: 1" });
    FULL_BAR_PACKAGE_SPECK_ROWS.forEach((r) => barRows.push({ client: "", speck: r.speck, foodwerx: r.item }));
    if (hasSignatureDrink) {
      barRows.push({ client: "", foodwerx: getSignatureCocktailGreeting(signatureDrinkName).toUpperCase() });
      if (signatureDrinkRecipe.trim()) {
        barRows.push({ client: signatureDrinkRecipe.trim(), foodwerx: signatureDrinkRecipe.trim() });
      }
      if (isClientSupplyingBar) barRows.push({ client: "Mixers/Garnishes (client supplying)", foodwerx: "" });
      else if (signatureDrinkMixers.trim() || signatureDrinkGarnishes.trim()) {
        if (signatureDrinkMixers.trim()) barRows.push({ client: "", foodwerx: `SIGNATURE MIXERS: ${signatureDrinkMixers.toUpperCase()}` });
        if (signatureDrinkGarnishes.trim()) barRows.push({ client: "", foodwerx: `SIGNATURE GARNISHES: ${signatureDrinkGarnishes.toUpperCase()}` });
      }
    }
  }
  // ── Other beverage rows (hydration, coffee, ice). Mimosa Bar juices/garnish only on Kitchen BEO (after DESSERTS). ──
  if (hasHydration) {
    const otherHydrationOptions = hydrationDrinkOptions.filter((o) => !/mimosa\s*bar/i.test(o));
    const parts: string[] = [];
    if (otherHydrationOptions.length > 0) parts.push(otherHydrationOptions.join(", ").toUpperCase());
    if (hydrationNotes.trim()) parts.push(hydrationNotes.trim().toUpperCase());
    if (parts.length > 0) otherBeverageRows.push({ client: "", foodwerx: `HYDRATION STATION: ${parts.join(" — ")}` });
    else otherBeverageRows.push({ client: "", foodwerx: "HYDRATION STATION: —" });
  }
  if (hasCoffeeTea) {
    otherBeverageRows.push({ client: "", foodwerx: "COFFEE/TEA SERVICE REQUESTED" });
    const coffeeMugType = f(FIELD_IDS.COFFEE_MUG_TYPE);
    if (coffeeMugType.trim()) otherBeverageRows.push({ client: "", foodwerx: `${coffeeMugType.toUpperCase()} MUGS` });
    otherBeverageRows.push({ client: "", foodwerx: "• Full Coffee Station Setup" });
    otherBeverageRows.push({ client: "", foodwerx: "• Regular + Decaf Urns" });
    otherBeverageRows.push({ client: "", foodwerx: "• Cups, Lids, Stirrers" });
    otherBeverageRows.push({ client: "", foodwerx: "• Creamers + Sugar" });
  }
  if (hasIce) otherBeverageRows.push({ client: "", foodwerx: `ICE: ${iceProvidedBy.toUpperCase()} — Ice Quantity: 1` });

  const barColumnLabel = isClientSupplyingBar ? "CLIENT" : "FOODWERX";

  // Non-standard signature drink items (we don't regularly supply) — show banner so they're not missed.
  // TODO(Ops Chief): Surface nonStandardSigDrinkItems in Ops Chief view so expediter sees events that need sig drink items sourced.
  const nonStandardSigDrinkItems =
    hasSignatureDrink && !isClientSupplyingBar
      ? getNonStandardBarItems([signatureDrinkMixers, signatureDrinkGarnishes].filter(Boolean).join(", "))
      : [];

  // ── Paper product rows (CLIENT | RENTALS | FOODWERX) ──
  const hasNewLists = platesList.trim() || cutleryList.trim() || glasswareList.trim();
  if (hasNewLists) {
    paperRows.push({ client: source.includes("client") || source.includes("mixed") ? "CLIENT" : "", rentals: rentalsDisplay, foodwerx: source.includes("foodwerx") || source.includes("mixed") ? "FOODWERX PACK OUT" : "" });
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
    paperRows.push({ client: source.includes("client") || source.includes("mixed") ? "CLIENT" : "", rentals: rentalsDisplay, foodwerx: source.includes("foodwerx") || source.includes("mixed") ? "FOODWERX PACK OUT" : "" });
    if (isFullBarPackage) FULL_BAR_PACKAGE.glasswareAndService.forEach((g) => paperRows.push({ client: "", rentals: "", foodwerx: g.toUpperCase() }));
    const parseLines = (t: string) => t.split(/\n/).filter(Boolean).map((line) => {
      const dashIdx = line.indexOf(" - ");
      if (dashIdx >= 0) return { client: "", rentals: "", foodwerx: line.slice(dashIdx + 3).trim() };
      return { client: "", rentals: "", foodwerx: line.trim() };
    });
    if (serviceWare) paperRows.push(...parseLines(serviceWare));
    if (chinaPaperGlassware) paperRows.push(...parseLines(chinaPaperGlassware));
  }

  const phoneStr = asString(props.eventData[FIELD_IDS.CONTACT_PHONE]) || asString(props.eventData[FIELD_IDS.CLIENT_PHONE]) || "";

  return (
    <div className="beo-print-content" style={styles.page}>
      {/* Same header as Kitchen BEO: grey banner + event details table */}
      <div className="beo-event-header-block" style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#111", marginBottom: 4 }}>{props.eventDate || "—"}</div>
        <div className="beo-letterhead-bar" style={{
          background: "#6b7280", color: "#fff", padding: "8px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 13, fontWeight: 700, border: "2px solid #374151",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)", flexShrink: 0 }}>
              <span style={{ transform: "rotate(-45deg)", fontSize: 11, fontWeight: 800, color: "#fff" }}>f</span>
            </div>
            <span>BEO</span>
          </div>
          <span>JOB#: {props.jobNumberDisplay} — DISPATCH TIME {props.dispatchTime}</span>
        </div>
        <div className="beo-event-details-table" style={{ marginTop: 6, overflow: "hidden" }}>
          <table style={KITCHEN_HEADER_TABLE}>
            <colgroup>
              <col style={{ width: "15%" }} />
              <col style={{ width: "35%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "35%" }} />
            </colgroup>
            <tbody>
              <tr>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>CLIENT</td>
                <td style={KITCHEN_HEADER_CELL}>{props.clientName || "—"}</td>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>ORDER #</td>
                <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.jobNumberDisplay || "—"}</td>
              </tr>
              <tr>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>CONTACT</td>
                <td style={KITCHEN_HEADER_CELL}>{props.contactName || "—"}</td>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>EVENT DATE</td>
                <td style={KITCHEN_HEADER_CELL}>{props.eventDate || "—"}</td>
              </tr>
              <tr>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>PHONE</td>
                <td style={KITCHEN_HEADER_CELL}>{phoneStr || "—"}</td>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>GUESTS</td>
                <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.guestCount || "—"}</td>
              </tr>
              <tr>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>ADDRESS</td>
                <td style={KITCHEN_HEADER_CELL}>{props.venueAddress || "—"}</td>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>EVENT START</td>
                <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.eventStart || "—"}</td>
              </tr>
              <tr>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>CITY, ST</td>
                <td style={KITCHEN_HEADER_CELL}>{props.cityState || "—"}</td>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>EVENT END</td>
                <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.eventEnd || "—"}</td>
              </tr>
              <tr>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>VENUE</td>
                <td style={KITCHEN_HEADER_CELL}>{props.eventLocation || "—"}</td>
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>EVENT ARRIVAL</td>
                <td style={{ ...KITCHEN_HEADER_CELL, color: "#c00", fontWeight: 700 }}>{props.eventArrival || "—"}</td>
              </tr>
              <tr>
                <td style={KITCHEN_HEADER_CELL} />
                <td style={KITCHEN_HEADER_CELL} />
                <td style={{ ...KITCHEN_HEADER_CELL, fontWeight: 700 }}>FW STAFF</td>
                <td style={KITCHEN_HEADER_CELL}>{props.fwStaff || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {nonStandardSigDrinkItems.length > 0 && (
        <div className="beo-banner-block" style={{ ...styles.allergyBanner, background: "#fef3c7", color: "#92400e", borderColor: "#d97706", marginTop: 8 }}>
          🍸 SIGNATURE DRINK — NON-STANDARD ITEMS (not in bar speck): {nonStandardSigDrinkItems.join(", ").toUpperCase()}. Ensure ordered/sourced.
        </div>
      )}

      {/* BEVERAGES — Bar shows only CLIENT or FOODWERX (from intake); speck in left margin, items centered like Excel BEO */}
      <BeoSectionPill title="" dotColor={SERVER_BEO_SECTION_COLORS.beverage}>
        <table style={{ ...serverBeoTable, marginBottom: 0 }}>
          <thead>
            <tr>
              <td style={{ ...serverBeoHeader, width: "18%", color: barColumnLabel === "CLIENT" ? "#c00" : "#00a" }}>Bar</td>
              <td style={{ ...serverBeoHeader, width: "82%", color: barColumnLabel === "CLIENT" ? "#c00" : "#00a" }}>{barColumnLabel}</td>
            </tr>
          </thead>
          <tbody>
            {(barRows.length > 0 ? barRows : [{ client: "", foodwerx: "No bar service specified" }]).map((r, i) => {
              const content = barColumnLabel === "CLIENT" ? (r.client || "—") : (r.foodwerx || "—");
              const speck = r.speck ?? "—";
              return (
                <tr key={i}>
                  <td style={{ ...serverBeoCell, width: "18%", verticalAlign: "top" }}>{speck}</td>
                  <td style={{ ...serverBeoCell, width: "82%", textAlign: "center", verticalAlign: "middle" }}>{content}</td>
                </tr>
              );
            })}
            {otherBeverageRows.map((r, i) => (
              <tr key={`other-${i}`}>
                <td style={{ ...serverBeoCell, width: "18%", verticalAlign: "top" }}>{r.speck ?? "—"}</td>
                <td style={{ ...serverBeoCell, width: "82%", textAlign: "center", verticalAlign: "middle" }}>{r.foodwerx || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {hasSignatureDrink && !isClientSupplyingBar && (() => {
          const tokens = parseBarItemTokens([signatureDrinkMixers, signatureDrinkGarnishes].filter(Boolean).join(", "));
          const anyInSpeck = tokens.some((t) => isStandardBarItem(t));
          return anyInSpeck ? (
            <div style={{ fontSize: 10, color: "#16a34a", marginTop: 4, fontStyle: "italic" }}>* Sig drink items included in speck</div>
          ) : null;
        })()}
      </BeoSectionPill>

      {/* PAPER PRODUCTS — pill section (3 columns: CLIENT | RENTALS | FOODWERX) */}
      <BeoSectionPill title="PAPER PRODUCTS / CHINA — CUTLERY — GLASSWARE" dotColor={SERVER_BEO_SECTION_COLORS.paperProducts}>
        <table style={{ ...serverBeoTable, marginBottom: 0 }}>
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
      </BeoSectionPill>

      {/* NOTES — pill section */}
      <BeoSectionPill title="NOTES" dotColor={SERVER_BEO_SECTION_COLORS.notes}>
        <div style={{ border: "1px solid #000", padding: "6px 12px", minHeight: 40, borderRadius: 4 }}>
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
          { label: "DIETARY MEAL COUNTS", val: dietarySummaryNotes },
          { label: "SPECIAL", val: specialNotes },
          { label: "BEO", val: beoNotes },
        ]
          .filter((x) => x.val?.trim())
          .map((x, i) => (
            <div key={i} style={{ fontSize: 11, marginBottom: 2, lineHeight: 1 }}>
              <strong>{x.label}:</strong> {x.val}
            </div>
          ))}
        {!parkingNotes && !loadInNotes && !stairsSteps && !elevatorsAvailable && !venueNotes && !kitchenAccessNotes && !foodSetupLocation && !powerNotes && !animalsPets && !eventPurpose && !foodServiceFlow && !timelineNotes && !clientSuppliedFood && !equipmentNotes && !dietaryNotes && !religiousRestrictions && !dietarySummaryNotes && !specialNotes && !beoNotes && (
          <div style={{ color: "#999", fontSize: 12 }}>—</div>
        )}
        </div>
      </BeoSectionPill>

      {/* TIMELINE — pill section */}
      <BeoSectionPill title="TIMELINE" dotColor={SERVER_BEO_SECTION_COLORS.timeline}>
        <div style={{ border: "1px solid #000", padding: "6px 12px", minHeight: 32, borderRadius: 4 }}>
        {hasTimeline ? (
          beoTimeline.split(/\n/).filter(Boolean).map((line, i) => {
            const dashIdx = line.indexOf(" - ");
            const [time, action] = dashIdx >= 0 ? [line.slice(0, dashIdx).trim(), line.slice(dashIdx + 3).trim()] : ["", line.trim()];
            return (
              <div key={i} style={{ display: "flex", gap: 16, fontSize: 12, marginBottom: 4, lineHeight: 1 }}>
                {time && <span style={{ fontWeight: 700, minWidth: 80 }}>{time}</span>}
                <span>{action}</span>
              </div>
            );
          })
        ) : (
          <div style={{ color: "#999", fontSize: 12 }}>No timeline specified</div>
        )}
        </div>
      </BeoSectionPill>

      <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>***end of server BEO***</div>

      {/* Footer on last page (Server BEO 2nd page is last when packout/expeditor/server) */}
      {(() => {
        const eventType = asSingleSelectName(props.eventData[FIELD_IDS.EVENT_TYPE]);
        const isDelivery = isDeliveryOrPickup(eventType);
        const v = asString(props.eventData[FIELD_IDS.VENUE]) || "";
        const addr = (props.venueAddress || "").trim();
        const showVenue = !isDelivery && v.trim() && v.trim() !== addr;
        return (
          <div className="beo-footer-block" style={{ marginTop: 12, breakInside: "avoid", pageBreakInside: "avoid", breakBefore: "avoid", pageBreakBefore: "avoid", display: "flex", flexDirection: "column", alignItems: "flex-start", border: "3px solid #000", padding: "16px 20px", borderRadius: 4 }}>
            <div style={{ border: "2px solid #4b5563", outline: "2px solid #4b5563", outlineOffset: "2px", borderRadius: 6, padding: "16px 20px", background: isDelivery ? "#facc15" : "#9ca3af", width: "fit-content" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, color: isDelivery ? "#000" : "#fff" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Client: {props.clientName || "—"}</div>
                {showVenue && <div style={{ fontSize: 13, fontWeight: 600 }}>Venue: {v}</div>}
                <div style={{ fontSize: 13, fontWeight: 600 }}>Guests: {props.guestCount || "—"}</div>
                <div style={{ display: "flex", gap: 16, alignItems: "center", background: "#fff", color: "#000", padding: "8px 12px", borderRadius: 4, border: "2px solid #000", fontWeight: 700, fontSize: 16 }}>
                  <span>Job #: {props.jobNumberDisplay}</span>
                  <span>Dispatch: {props.dispatchTime || "—"}</span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: "left" as const, marginTop: 8, fontSize: 14, fontWeight: 700, letterSpacing: 2, color: "#333" }}>
              ***end of event***
            </div>
          </div>
        );
      })()}
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
  religiousRestrictions?: string;
  beoNotes?: string;
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
        {props.beoNotes?.trim() && (
          <div className="beo-banner-block" style={styles.beoNotesBanner}>📋 BEO NOTES: {props.beoNotes.trim()}</div>
        )}
        {props.notBuffetBanner && (
          <div className="beo-banner-block" style={styles.notBuffetBanner}>{props.notBuffetBanner}</div>
        )}
        {props.allergies && (
          <div className="beo-banner-block" style={styles.allergyBanner}>⚠️ ALLERGIES: {props.allergies.toUpperCase()}</div>
        )}
        {props.religiousRestrictions?.trim() && (
          <div className="beo-banner-block" style={styles.religiousBanner}>🕎 RELIGIOUS / DIETARY: {props.religiousRestrictions.trim().toUpperCase()}</div>
        )}
        {activeSections.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "#999", fontSize: 16 }}>No menu items assigned.</div>
        )}
        {activeSections.map((section) => (
          <div key={section.fieldId} className="beo-section-card" style={styles.sectionCard}>
            <div className="beo-section-header" style={styles.sectionHeader}>
              <span style={{ color: getSectionColor(section.title), fontSize: "22px", lineHeight: 0 }}>●</span>
              <span>{section.title}</span>
              <span style={{ color: getSectionColor(section.title), fontSize: "22px", lineHeight: 0 }}>●</span>
            </div>
            {section.items.map((item, itemIdx) => {
              const rows = expandItemToRows(item);
              const itemNotes = meetingNotes[item.id]?.notes ?? [];
              const guestCount = parseInt(props.guestCount) || 0;
              return (
                <div key={`${item.id}-${itemIdx}`} className="beo-menu-item-block" style={{ borderBottom: "1px solid #eee", marginTop: itemIdx > 0 ? 16 : 0 }}>
                  {rows.map((row, rowIdx) => {
                    return (
                    <div key={rowIdx} className="beo-line-item" style={{ ...styles.lineItem, borderBottom: "none", gridTemplateColumns: row.isChild ? "140px 1fr" : "140px 1fr auto", padding: "8px 16px", ...(row.isChild ? { marginTop: -6 } : {}) }}>
                      <div className="beo-spec-col" style={styles.specCol}>—</div>
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

      {/* Notes summary section */}
      <div className="meeting-beo-notes-section" style={{ marginTop: 24 }}>
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
  const location = useLocation();
  const { user } = useAuthStore();
  const {
    selectedEventId,
    selectEvent,
    eventData: eventDataFromStore,
    loadEventData,
    loadEvents,
    updateEvent,
    setFields,
    events,
  } = useEventStore();
  /** Store may set null while switching events — print page must not index null */
  const eventData = eventDataFromStore ?? ({} as Record<string, unknown>);
  const isKitchenDept = (user?.role ?? "") === "kitchen";
  const [topTab, setTopTab] = useState<TopTab>("kitchenBEO");
  const [leftCheck, setLeftCheck] = useState<LeftCheck>("spec");

  useEffect(() => {
    if (isKitchenDept) {
      setTopTab("kitchenBEO");
      setLeftCheck("kitchen");
    }
  }, [isKitchenDept]);
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
  const [menuItemData, setMenuItemData] = useState<Record<string, { name: string; childIds: string[]; description?: string; dietaryTags?: string; sauce?: string }>>({});
  const [stationsData, setStationsData] = useState<Array<{ id: string; stationType: string; stationItems: string[]; stationNotes?: string; stationComponents?: string[]; beoPlacement?: "Presented Appetizer" | "Buffet Metal" | "Buffet China" }>>([]);
  const [stationComponentNames, setStationComponentNames] = useState<Record<string, string>>({});
  const [boxedLunchOrders, setBoxedLunchOrders] = useState<BoxedLunchOrder[]>([]);
  const [buffetMenuEdits, setBuffetMenuEdits] = useState<Record<string, string>>({}); // itemId -> edited description
  const [specOverrides, setSpecOverrides] = useState<Record<string, string>>({});
  const [packOutEdits, setPackOutEdits] = useState<Record<string, string>>({});
  const [checkState, setCheckState] = useState<Record<string, boolean>>({});

  const SPEC_STORAGE_KEY = getBeoSpecStorageKey;
  const PACKOUT_STORAGE_KEY = (eid: string) => `beo-packout-edits-${eid}`;
  const CHECK_STORAGE_KEY = (eid: string) => `beo-check-state-${eid}`;
  const [hiddenMenuItems, setHiddenMenuItems] = useState<Set<string>>(new Set());
  const [eventMenuRows, setEventMenuRows] = useState<EventMenuRow[]>([]);
  const [barServiceFieldId, setBarServiceFieldId] = useState<string | null>(null);
  const [lockoutIds, setLockoutIds] = useState<Awaited<ReturnType<typeof getLockoutFieldIds>>>(null);
  const [bohIds, setBohIds] = useState<Awaited<ReturnType<typeof getBOHProductionFieldIds>>>(null);
  const [showSendToBOHModal, setShowSendToBOHModal] = useState(false);
  /** URL wins so boxed-lunch fetch matches the event in /beo-print/:id before store syncs. */
  const urlEventId = getEventIdFromUrl();
  const eventId = urlEventId ?? selectedEventId ?? null;

  useEffect(() => {
    getBarServiceFieldId().then(setBarServiceFieldId);
  }, []);

  useEffect(() => {
    getLockoutFieldIds().then(setLockoutIds);
  }, []);

  useEffect(() => {
    getBOHProductionFieldIds().then(setBohIds);
  }, []);

  const eventTypeRaw = asSingleSelectName(eventData[FIELD_IDS.EVENT_TYPE])?.toLowerCase() ?? "";
  const isDeliveryEvent = eventTypeRaw.includes("delivery") || eventTypeRaw.includes("pick up") || eventTypeRaw.includes("pickup");
  const beoSentToBOH = bohIds?.beoSentToBOH ? eventData[bohIds.beoSentToBOH] === true : false;
  const isLockedLegacy = lockoutIds
    ? (eventData[lockoutIds.guestCountConfirmed] === true && eventData[lockoutIds.menuAcceptedByKitchen] === true)
    : false;
  const isLocked = beoSentToBOH || isLockedLegacy;
  const productionFrozen = bohIds?.productionFrozen ? eventData[bohIds.productionFrozen] === true : false;
  const role = user?.role ?? "";
  const canSendToBOH = (role === "foh" || role === "intake" || role === "ops_admin") && !isDeliveryEvent && !isLocked && !!selectedEventId && (bohIds?.beoSentToBOH || lockoutIds);
  const isBOHDept = role === "kitchen" || role === "flair" || role === "logistics" || role === "ops_admin";

  const handleSendToBOH = async (_initials: string) => {
    if (!selectedEventId) return;
    const patch: Record<string, unknown> = {};
    if (bohIds?.beoSentToBOH) {
      patch[bohIds.beoSentToBOH] = true;
      if (bohIds.eventChangeRequested) patch[bohIds.eventChangeRequested] = false;
      if (bohIds.changeConfirmedByBOH) patch[bohIds.changeConfirmedByBOH] = false;
    }
    if (lockoutIds) {
      if (lockoutIds.productionAccepted) patch[lockoutIds.productionAccepted] = false;
      if (lockoutIds.productionAcceptedFlair) patch[lockoutIds.productionAcceptedFlair] = false;
      if (lockoutIds.productionAcceptedDelivery) patch[lockoutIds.productionAcceptedDelivery] = false;
      if (lockoutIds.productionAcceptedOpsChief) patch[lockoutIds.productionAcceptedOpsChief] = false;
    }
    if (!bohIds?.beoSentToBOH && lockoutIds) {
      patch[lockoutIds.guestCountConfirmed] = true;
      patch[lockoutIds.menuAcceptedByKitchen] = true;
    }
    if (Object.keys(patch).length > 0) {
      await setFields(selectedEventId, patch);
      await loadEvents();
      loadEventData();
    }
    setShowSendToBOHModal(false);
  };

  const [showConfirmChangeModal, setShowConfirmChangeModal] = useState(false);
  const handleConfirmChangeReceived = async (_initials: string) => {
    if (!selectedEventId || !bohIds?.changeConfirmedByBOH) return;
    await setFields(selectedEventId, { [bohIds.changeConfirmedByBOH]: true });
    await loadEvents();
    loadEventData();
    setShowConfirmChangeModal(false);
  };

  const eventName = asString(eventData[FIELD_IDS.EVENT_NAME]) || "Untitled";

  // ── Step 1: Grab event ID from URL and select it ──
  useEffect(() => {
    const urlEventId = getEventIdFromUrl();
    const storeId = useEventStore.getState().selectedEventId;
    const storeEventData = useEventStore.getState().eventData;
    let cancelled = false;
    const done = () => {
      if (!cancelled) setLoading(false);
    };
    if (urlEventId && urlEventId !== storeId) {
      setLoading(true);
      void selectEvent(urlEventId).finally(done);
    } else if (storeId && storeEventData) {
      // Reuse already-loaded event data when opening print for the currently selected event.
      setLoading(false);
      void loadEventData();
    } else if (storeId) {
      setLoading(true);
      void loadEventData().finally(done);
    } else {
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [location.pathname, selectEvent, loadEventData]);

  // ── Load spec overrides from Airtable (SPEC_OVERRIDE) then merge localStorage (per event) ──
  useEffect(() => {
    if (!eventId) return;
    try {
      const fromAirtable = typeof eventData[FIELD_IDS.SPEC_OVERRIDE] === "string" ? (eventData[FIELD_IDS.SPEC_OVERRIDE] as string).trim() : "";
      const fromStorage = localStorage.getItem(SPEC_STORAGE_KEY(eventId));
      let merged: Record<string, string> = {};
      if (fromAirtable) {
        try {
          const p = JSON.parse(fromAirtable) as Record<string, string>;
          if (p && typeof p === "object") merged = { ...merged, ...p };
        } catch {
          // ignore
        }
      }
      if (fromStorage) {
        try {
          const p = JSON.parse(fromStorage) as Record<string, string>;
          if (p && typeof p === "object") merged = { ...merged, ...p };
        } catch {
          // ignore
        }
      }
      if (Object.keys(merged).length > 0) setSpecOverrides(merged);
      const packRaw = localStorage.getItem(PACKOUT_STORAGE_KEY(eventId));
      if (packRaw) {
        const parsed = JSON.parse(packRaw) as Record<string, string>;
        if (parsed && typeof parsed === "object") setPackOutEdits(parsed);
      }
      const checkRaw = localStorage.getItem(CHECK_STORAGE_KEY(eventId));
      if (checkRaw) {
        const parsed = JSON.parse(checkRaw) as Record<string, boolean>;
        if (parsed && typeof parsed === "object") setCheckState(parsed);
      }
    } catch {
      // ignore parse errors
    }
  }, [eventId, eventData]);

  // ── When tab becomes visible, re-merge spec overrides from localStorage (e.g. after editing in intake) ──
  useEffect(() => {
    if (!eventId) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        try {
          const specRaw = localStorage.getItem(SPEC_STORAGE_KEY(eventId));
          if (specRaw) {
            const parsed = JSON.parse(specRaw) as Record<string, string>;
            if (parsed && typeof parsed === "object") setSpecOverrides((prev) => ({ ...prev, ...parsed }));
          }
        } catch {
          // ignore
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [eventId]);

  // ── Persist spec overrides, packout edits, check state to localStorage ──
  useEffect(() => {
    if (!eventId) return;
    try {
      // Don't overwrite with {} before load effect has applied (would wipe intake overrides)
      const specRaw = localStorage.getItem(SPEC_STORAGE_KEY(eventId));
      if (Object.keys(specOverrides).length === 0 && specRaw && specRaw !== "{}") return;
      localStorage.setItem(SPEC_STORAGE_KEY(eventId), JSON.stringify(specOverrides));
      localStorage.setItem(PACKOUT_STORAGE_KEY(eventId), JSON.stringify(packOutEdits));
      localStorage.setItem(CHECK_STORAGE_KEY(eventId), JSON.stringify(checkState));
    } catch {
      // ignore quota errors
    }
  }, [eventId, specOverrides, packOutEdits, checkState]);

  // ── Sync menu theme from Airtable on load ──
  useEffect(() => {
    const raw = eventData[FIELD_IDS.MENU_PRINT_THEME];
    const name = asSingleSelectName(raw);
    setMenuTheme(name || "Classic European");
  }, [eventData]);

  // ── Fetch boxed lunch orders for event (merge into DELI section for delivery BEO) ──
  useEffect(() => {
    if (!eventId) {
      setBoxedLunchOrders([]);
      return;
    }
    loadBoxedLunchOrdersByEventId(eventId).then((result) => {
      if (!isErrorResult(result)) setBoxedLunchOrders(result);
      else setBoxedLunchOrders([]);
    });
  }, [eventId]);

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
    const eventTypeRaw = asSingleSelectName(eventData[FIELD_IDS.EVENT_TYPE])?.toLowerCase() ?? "";
    const isDelivery = eventTypeRaw.includes("delivery") || eventTypeRaw.includes("pick up") || eventTypeRaw.includes("pickup");

    const menuFieldIds = isDelivery
      ? [
          FIELD_IDS.PASSED_APPETIZERS,
          FIELD_IDS.PRESENTED_APPETIZERS,
          FIELD_IDS.BUFFET_METAL,
          FIELD_IDS.BUFFET_CHINA,
          FIELD_IDS.DESSERTS,
          FIELD_IDS.DELIVERY_DELI,
          FIELD_IDS.ROOM_TEMP_DISPLAY,
        ]
      : [
          FIELD_IDS.PASSED_APPETIZERS,
          FIELD_IDS.PRESENTED_APPETIZERS,
          FIELD_IDS.BUFFET_METAL,
          FIELD_IDS.BUFFET_CHINA,
          FIELD_IDS.DESSERTS,
        ];

    const parentIds = new Set<string>();
    menuFieldIds.forEach((fid) => {
      const ids = asLinkedRecordIds(eventData[fid]);
      ids.forEach((id) => {
        if (id.startsWith("rec")) parentIds.add(id);
      });
    });

    const MENU_TABLE = "tbl0aN33DGG6R1sPZ";
    const ITEM_NAME = FIELD_IDS.MENU_ITEM_NAME;
    // NON-NEGOTIABLE: Kitchen BEO and BEO Print MUST use THIS field ID for Child Items
    const CHILD_ITEMS_FIELD_ID = "fldIu6qmlUwAEn2W9";
    const CHILD_ITEMS = CHILD_ITEMS_FIELD_ID;
    const DESCRIPTION = FIELD_IDS.MENU_ITEM_DESCRIPTION;
    const DIETARY_TAGS = FIELD_IDS.MENU_ITEM_DIETARY_TAGS;
    const MENU_ITEM_SAUCE_FIELD_ID = "fldCUjK7oBckAuNNa"; // Menu Items.Sauces (Long text)
    const baseId = (import.meta.env.VITE_AIRTABLE_BASE_ID as string)?.trim() || "";
    if (!baseId) return;

    const fetchMenuItems = async () => {
      if (eventId && !isDelivery) {
        const stationsResult = await loadStationsByEventId(eventId, asLinkedRecordIds(eventData[FIELD_IDS.STATIONS]));
        if (!isErrorResult(stationsResult)) {
          setStationsData(stationsResult);
          stationsResult.flatMap((s) => s.stationItems).filter((id) => id?.startsWith("rec")).forEach((id) => parentIds.add(id));
          // Fetch station component names (sauces, pastas, included items etc.)
          const allComponentIds = stationsResult.flatMap((s) => s.stationComponents ?? []).filter((id) => id?.startsWith("rec"));
          if (allComponentIds.length > 0) {
            const nameMap = await loadStationComponentNamesByIds(allComponentIds);
            if (!isErrorResult(nameMap)) setStationComponentNames(nameMap);
          }
        } else {
          setStationsData([]);
        }
      } else {
        setStationsData([]);
      }
      if (parentIds.size === 0) return;

      const newData: Record<string, { name: string; childIds: string[]; description?: string; dietaryTags?: string; sauce?: string }> = {};
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
        params.append("fields[]", MENU_ITEM_SAUCE_FIELD_ID);
        const data = await airtableFetch<{ records?: Array<{ id: string; fields: Record<string, unknown> }> }>(
          `/${MENU_TABLE}?${params.toString()}`
        );
        if (!isErrorResult(data) && data?.records) {
          data.records.forEach((rec: { id: string; fields: Record<string, unknown> }) => {
            const name = rec.fields[ITEM_NAME];
            const rawChildItems = rec.fields[CHILD_ITEMS_FIELD_ID] ?? [];
            const childIds = Array.isArray(rawChildItems)
              ? rawChildItems.map((item: unknown) => (typeof item === "string" ? item : (item && typeof item === "object" && "id" in item ? String((item as { id?: string }).id ?? "") : ""))).filter((id) => id.startsWith("rec"))
              : [];
            const descRaw = rec.fields[DESCRIPTION];
            const tagsRaw = rec.fields[DIETARY_TAGS];
            const sauceRaw = rec.fields[MENU_ITEM_SAUCE_FIELD_ID];
            const description = typeof descRaw === "string" ? descRaw : undefined;
            const dietaryTags = Array.isArray(tagsRaw)
              ? tagsRaw.map((t) => (typeof t === "string" ? t : (t && typeof t === "object" && "name" in t ? String((t as { name: string }).name) : ""))).filter(Boolean).join(" ")
              : typeof tagsRaw === "string" ? tagsRaw
              : tagsRaw && typeof tagsRaw === "object" && "name" in tagsRaw ? String((tagsRaw as { name: string }).name) : undefined;
            const sauce = typeof sauceRaw === "string" ? sauceRaw.trim() : undefined;
            newData[rec.id] = {
              name: typeof name === "string" ? name : rec.id,
              childIds,
              description: description || undefined,
              dietaryTags: dietaryTags || undefined,
              sauce: sauce || undefined,
            };
          });
        }
        return data;
      };

      try {
        // Parent menu items: was strictly sequential (one HTTP round-trip per 10 ids) — very slow for large menus.
        const PARENT_CHUNK = 10;
        const PARENT_CONCURRENT = 4;
        const parentChunks: string[][] = [];
        for (let i = 0; i < toFetch.length; i += PARENT_CHUNK) {
          parentChunks.push(toFetch.slice(i, i + PARENT_CHUNK));
        }
        for (let w = 0; w < parentChunks.length; w += PARENT_CONCURRENT) {
          await Promise.all(parentChunks.slice(w, w + PARENT_CONCURRENT).map((ids) => fetchChunk(ids)));
        }
        const childIdsToFetch = new Set<string>();
        Object.values(newData).forEach((d) => {
          d.childIds.forEach((cid) => {
            if (!newData[cid]) childIdsToFetch.add(cid);
          });
        });
        if (childIdsToFetch.size > 0) {
          const mergeChildRecord = (rec: { id: string; fields: Record<string, unknown> }) => {
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
          };
          const childList = [...childIdsToFetch];
          const CHILD_CHUNK = 10;
          const CHILD_CONCURRENT = 4;
          const childChunks: string[][] = [];
          for (let i = 0; i < childList.length; i += CHILD_CHUNK) {
            childChunks.push(childList.slice(i, i + CHILD_CHUNK));
          }
          const fetchChildChunk = async (ids: string[]) => {
            const childParams = new URLSearchParams();
            childParams.set("filterByFormula", `OR(${ids.map((id) => `RECORD_ID()='${id}'`).join(",")})`);
            childParams.set("returnFieldsByFieldId", "true");
            childParams.append("fields[]", ITEM_NAME);
            childParams.append("fields[]", DIETARY_TAGS);
            const childData = await airtableFetch<{ records?: Array<{ id: string; fields: Record<string, unknown> }> }>(
              `/${MENU_TABLE}?${childParams.toString()}`
            );
            if (!isErrorResult(childData) && childData?.records) {
              (childData as { records: Array<{ id: string; fields: Record<string, unknown> }> }).records.forEach(mergeChildRecord);
            }
          };
          for (let w = 0; w < childChunks.length; w += CHILD_CONCURRENT) {
            await Promise.all(childChunks.slice(w, w + CHILD_CONCURRENT).map((ids) => fetchChildChunk(ids)));
          }
        }
        setMenuItemData(newData);
      } catch (e) {
        console.error("Failed to fetch menu items:", e);
      }
    };

    fetchMenuItems();
    // Refetch when navigating to BEO page so station config (e.g. All-American customItems) is fresh after saving from intake
  }, [eventData, eventId, location.pathname]);

  // Load Event Menu (shadow) for customText + added items to show on Print/View BEO
  useEffect(() => {
    if (!eventId) {
      setEventMenuRows([]);
      return;
    }
    loadEventMenuRows(eventId).then((result) => {
      if (!isErrorResult(result)) setEventMenuRows(result);
      else setEventMenuRows([]);
    });
  }, [eventId]);

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

  // Venue name: VenuePrint formula (falls back to "Residence") or VENUE
  const eventLocation = f(FIELD_IDS.VENUE_PRINT) || f(FIELD_IDS.VENUE);
  // Venue address: Print – Event Address (BEO canonical) → Venue Full Address → build from components → client fallback
  const venueAddress =
    f(FIELD_IDS.PRINT_EVENT_ADDRESS) ||
    f(FIELD_IDS.VENUE_FULL_ADDRESS) ||
    [f(FIELD_IDS.VENUE_ADDRESS), f(FIELD_IDS.VENUE_CITY), asSingleSelectName(eventData[FIELD_IDS.VENUE_STATE]), f(FIELD_IDS.VENUE_ZIP)].filter(Boolean).join(", ") ||
    [f(FIELD_IDS.CLIENT_STREET), f(FIELD_IDS.CLIENT_CITY), f(FIELD_IDS.CLIENT_STATE), f(FIELD_IDS.CLIENT_ZIP)].filter(Boolean).join(", ");
  const cityState =
    [f(FIELD_IDS.VENUE_CITY), asSingleSelectName(eventData[FIELD_IDS.VENUE_STATE]), f(FIELD_IDS.VENUE_ZIP)].filter(Boolean).join(", ") ||
    [f(FIELD_IDS.CLIENT_CITY), f(FIELD_IDS.CLIENT_STATE), f(FIELD_IDS.CLIENT_ZIP)].filter(Boolean).join(", ");
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
  const fwStaff = resolveFwStaffLineFromFields(eventData as Record<string, unknown>);
  const eventArrival =
    secondsTo12HourString(eventData[FIELD_IDS.FOODWERX_ARRIVAL]) ||
    f(FIELD_IDS.VENUE_ARRIVAL_TIME);
  const allergies = f(FIELD_IDS.DIETARY_NOTES);
  const religiousRestrictions = f(FIELD_IDS.RELIGIOUS_RESTRICTIONS);
  const dietarySummary = f(FIELD_IDS.DIETARY_SUMMARY);
  const beoNotes = f(FIELD_IDS.BEO_NOTES);
  const specialNotes = f(FIELD_IDS.SPECIAL_NOTES);
  const serviceStyle = asSingleSelectName(eventData[FIELD_IDS.SERVICE_STYLE]).trim();
  const notBuffetBanner = serviceStyle && !serviceStyle.toLowerCase().includes("buffet")
    ? `NOT BUFFET – ${serviceStyle.toUpperCase()}`
    : "";
  // Delivery: "Food Must Go Hot" — when Kitchen On-Site = No and Food Must Go Hot is checked
  const kitchenOnSite = asSingleSelectName(eventData[FIELD_IDS.KITCHEN_ON_SITE]);
  const foodMustGoHot = asBoolean(eventData[FIELD_IDS.FOOD_MUST_GO_HOT]);
  // showFoodMustGoHotBanner is computed below after isDelivery is available

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

  // ── Parse linked menu items (handles Airtable formats: string[], {id:string}[], or single value) ──
  const parseMenuItems = (fieldId: string): MenuLineItem[] => {
    const raw = eventData[fieldId];
    if (!raw) return [];
    const arr = Array.isArray(raw) ? raw : [raw];

    return arr
      .map((item: unknown) => {
        const id =
          typeof item === "string"
            ? item
            : item && typeof item === "object" && "id" in item
              ? (item as { id: string }).id
              : String(item);
        return id;
      })
      .filter((id): id is string => typeof id === "string" && id.startsWith("rec"))
      .map((id) => {
        const data = menuItemData[id];
        return {
          id,
          name: data?.name || "Loading...",
        };
      });
  };

  // ── Custom text → menu items (each item + sauce on its own line; split by newline, comma, or semicolon)
  const customTextToItems = (text: string, prefix: string): MenuLineItem[] => {
    const t = (text || "").trim();
    if (!t) return [];
    return t.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean).map((name, i) => ({
      id: `${prefix}-${i}`,
      name,
    }));
  };

  // ── Menu Sections (linked items, or fallback to custom text from invoice)
  const eventType = asSingleSelectName(eventData[FIELD_IDS.EVENT_TYPE]);
  const isDelivery = isDeliveryOrPickup(eventType);
  const showFoodMustGoHotBanner = isDelivery && foodMustGoHot;

  // Hard print order: Passed → Presented → Buffet Metal → Buffet China → Deli → Desserts
  // Stations route into their placement section (Presented Appetizer / Buffet Metal / Buffet China).
  // No standalone STATIONS section — a station must have a BEO Placement to appear on the print.
  const FULL_SERVICE_SECTION_DEFS: { title: string; fieldId: string; linkedFieldId: string; customFieldId: string }[] = [
    { title: "PASSED APPETIZERS", fieldId: FIELD_IDS.PASSED_APPETIZERS, linkedFieldId: FIELD_IDS.PASSED_APPETIZERS, customFieldId: FIELD_IDS.CUSTOM_PASSED_APP },
    { title: "PRESENTED APPETIZERS", fieldId: FIELD_IDS.PRESENTED_APPETIZERS, linkedFieldId: FIELD_IDS.PRESENTED_APPETIZERS, customFieldId: FIELD_IDS.CUSTOM_PRESENTED_APP },
    { title: "BUFFET – METAL", fieldId: FIELD_IDS.BUFFET_METAL, linkedFieldId: FIELD_IDS.BUFFET_METAL, customFieldId: FIELD_IDS.CUSTOM_BUFFET_METAL },
    { title: "BUFFET – CHINA", fieldId: FIELD_IDS.BUFFET_CHINA, linkedFieldId: FIELD_IDS.BUFFET_CHINA, customFieldId: FIELD_IDS.CUSTOM_BUFFET_CHINA },
    { title: "DELI", fieldId: FIELD_IDS.FULL_SERVICE_DELI, linkedFieldId: FIELD_IDS.FULL_SERVICE_DELI, customFieldId: FIELD_IDS.CUSTOM_FULL_SERVICE_DELI },
    { title: "DESSERTS", fieldId: FIELD_IDS.DESSERTS, linkedFieldId: FIELD_IDS.DESSERTS, customFieldId: FIELD_IDS.CUSTOM_DESSERTS },
  ];

  // ── LOCKED Delivery BEO Section Structure ──
  // Section 1: HOT FOOD — TIN / HEATED  (hot entrées, hot apps, buffet metal)
  // Section 2: COLD / DELI — PLASTIC CONTAINER  (deli, cold sides, salads)
  // Section 3: BOXED ITEMS — INDIVIDUAL PACKAGING  (inserted from boxed lunch orders below)
  // Section 4: DESSERT / SNACKS  (desserts and snack items)
  // Section 5: BEVERAGES  (rendered separately from menu sections)
  // Section 6: SERVICEWARE  (rendered separately from menu sections)
  const DELIVERY_SECTION_CONFIG: { title: string; fieldIds: string[]; customFieldIds: string[] }[] = [
    {
      title: "HOT FOOD — TIN / HEATED",
      fieldIds: [FIELD_IDS.BUFFET_METAL, FIELD_IDS.PASSED_APPETIZERS, FIELD_IDS.PRESENTED_APPETIZERS],
      customFieldIds: [FIELD_IDS.CUSTOM_BUFFET_METAL, FIELD_IDS.CUSTOM_PASSED_APP, FIELD_IDS.CUSTOM_PRESENTED_APP],
    },
    {
      title: "COLD / DELI — PLASTIC CONTAINER",
      fieldIds: [FIELD_IDS.DELIVERY_DELI, FIELD_IDS.BUFFET_CHINA, FIELD_IDS.ROOM_TEMP_DISPLAY],
      customFieldIds: [FIELD_IDS.CUSTOM_DELIVERY_DELI, FIELD_IDS.CUSTOM_BUFFET_CHINA, FIELD_IDS.CUSTOM_ROOM_TEMP_DISPLAY],
    },
    {
      title: "DESSERT / SNACKS",
      fieldIds: [FIELD_IDS.DESSERTS],
      customFieldIds: [FIELD_IDS.CUSTOM_DESSERTS],
    },
  ];

  let menuSections: SectionData[] = isDelivery
    ? DELIVERY_SECTION_CONFIG.map((config) => {
        const allLinked: MenuLineItem[] = [];
        const seenIds = new Set<string>();
        const seenNames = new Set<string>();
        for (const fid of config.fieldIds) {
          for (const item of parseMenuItems(fid)) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              seenNames.add(item.name);
              allLinked.push(item);
            }
          }
        }
        for (const customFid of config.customFieldIds || []) {
          customTextToItems(asString(eventData[customFid]), `custom-${config.fieldIds[0]}-${customFid}`).forEach((c) => {
            if (!seenNames.has(c.name)) {
              seenNames.add(c.name);
              allLinked.push(c);
            }
          });
        }
        // Merge platter orders (from localStorage) into DELI section
        if (config.title.includes("DELI") && eventId) {
          const platterRows = getPlatterOrdersByEventId(eventId);
          for (const row of platterRows) {
            if (!(row.quantity > 0) || row.picks.length === 0) continue;
            const name = row.platterType;
            const specQty = `${row.picks.join(", ")} × ${row.quantity}`;
            const uniqueId = `platter-${row.id}`;
            if (!seenIds.has(uniqueId)) {
              seenIds.add(uniqueId);
              allLinked.push({ id: uniqueId, name, specQty });
            }
          }
        }
        return { title: config.title, fieldId: config.fieldIds[0], items: allLinked };
      }).filter((s) => s.items.length > 0)
    : FULL_SERVICE_SECTION_DEFS.map((def) => {
        // Build ONE synthetic item per station — expandItemToRows handles splitting into header + child rows
        const stationToItems = (s: typeof stationsData[number]): { id: string; name: string }[] => {
          const linkedComponentNames = (s.stationComponents ?? [])
            .filter((id) => id?.startsWith("rec"))
            .map((id) => stationComponentNames[id])
            .filter((n): n is string => !!n);
          const menuItemNames = (s.stationItems ?? [])
            .filter((id) => id?.startsWith("rec"))
            .map((id) => menuItemData[id]?.name)
            .filter((n): n is string => !!n && n !== "—");
          const notesLines = (s.stationNotes || "")
            .split(/\r?\n/)
            .map((l) => l.replace(/^BEO Placement:\s*.+$/i, "").trim())
            .filter(Boolean);
          // Preset stations (e.g. All-American) store Main, Potato, Chicken, Salad, Slider rolls, Toppings, Condiments, Dressings — show values as child lines (like old BEOs)
          const customItems = (s as { customItems?: string }).customItems;
          const rawCustomLines = customItems
            ? customItems.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^BEO Placement:/i.test(l))
            : [];
          const customLines: string[] = [];
          const multiValueKeys = /^(Toppings?|Condiments?|Dressings?|Salads?):\s*(.+)$/i;
          for (const line of rawCustomLines) {
            const multi = line.match(multiValueKeys);
            if (multi) {
              const values = multi[2].split(",").map((v) => v.trim()).filter(Boolean);
              customLines.push(...values);
            } else {
              const keyVal = line.match(/^([A-Za-z\s]+):\s*(.+)$/);
              if (keyVal) {
                const key = keyVal[1].trim();
                const val = keyVal[2].trim();
                if (/^Salad\s*shooters?$/i.test(key) && /^yes$/i.test(val)) customLines.push("Salad shooters (included)");
                else if (!/^yes$/i.test(val) || !/^Salad/i.test(key)) customLines.push(val);
              } else customLines.push(line);
            }
          }
          const stripPlatter = (s: string) => s.replace(/^PLATTER\s+/i, "");
          const cleanedCustomLines = customLines.map(stripPlatter);
          const allComponents = linkedComponentNames.length > 0 || menuItemNames.length > 0
            ? [...linkedComponentNames, ...menuItemNames, ...cleanedCustomLines, ...notesLines]
            : [...cleanedCustomLines, ...notesLines];
          const stationDisplayName = /all-american|all american/i.test(s.stationType || "") ? "The All-American Station" : `${s.stationType} [Metal/China]`;
          const encodedName = [`▶ ${stationDisplayName}`, ...allComponents].join("\n");
          return [{ id: `station-hdr-${s.id}`, name: encodedName }];
        };

        const placementFor = (s: typeof stationsData[number]) => {
          if (s.beoPlacement) return s.beoPlacement;
          const name = (s.stationType || "").toLowerCase();
          if (name.includes("all-american") || name.includes("all american") || name.includes("slider")) return "Presented Appetizer" as const;
          return undefined;
        };
        let linked: { id: string; name: string }[];
        if (def.fieldId === FIELD_IDS.PRESENTED_APPETIZERS) {
          linked = [
            ...parseMenuItems(def.linkedFieldId),
            ...stationsData.filter((s) => placementFor(s) === "Presented Appetizer").flatMap(stationToItems),
          ];
        } else if (def.fieldId === FIELD_IDS.BUFFET_METAL) {
          linked = [
            ...parseMenuItems(def.linkedFieldId),
            ...stationsData.filter((s) => placementFor(s) === "Buffet Metal").flatMap(stationToItems),
          ];
        } else if (def.fieldId === FIELD_IDS.BUFFET_CHINA) {
          linked = [
            ...parseMenuItems(def.linkedFieldId),
            ...stationsData.filter((s) => placementFor(s) === "Buffet China").flatMap(stationToItems),
          ];
        } else {
          linked = parseMenuItems(def.linkedFieldId);
        }

        const custom = def.customFieldId ? customTextToItems(asString(eventData[def.customFieldId]), `custom-${def.fieldId}`) : [];
        const seenNames = new Set(linked.map((i) => i.name));
        const items = [...linked];
        custom.forEach((c) => {
          if (!seenNames.has(c.name)) {
            seenNames.add(c.name);
            items.push(c);
          }
        });
        // Merge platter orders into full-service DELI section (same as delivery)
        if (def.fieldId === FIELD_IDS.FULL_SERVICE_DELI && eventId) {
          const platterRows = getPlatterOrdersByEventId(eventId);
          for (const row of platterRows) {
            if (!(row.quantity > 0) || row.picks.length === 0) continue;
            items.push({
              id: `platter-fs-${row.id}`,
              name: row.platterType,
              specQty: `${row.picks.join(", ")} × ${row.quantity}`,
            });
          }
        }
        return { title: def.title, fieldId: def.fieldId, items };
      });

  if (isDelivery) {
    const boxedSlice = buildBoxedLunchBeoSectionsFromOrders(boxedLunchOrders);
    if (boxedSlice.length > 0) {
      // Separate "BOXED ITEMS" from any sections that share a title with existing delivery sections
      const newSections: typeof menuSections = [];
      const dedupSections: typeof menuSections = [];
      for (const bs of boxedSlice) {
        if (menuSections.some((s) => s.title === bs.title)) {
          dedupSections.push(bs);
        } else {
          newSections.push(bs);
        }
      }
      // Merge items into existing same-titled sections
      for (const dup of dedupSections) {
        const idx = menuSections.findIndex((s) => s.title === dup.title);
        if (idx >= 0) {
          menuSections[idx] = { ...menuSections[idx], items: [...menuSections[idx].items, ...dup.items] };
        }
      }
      // Insert new sections (BOXED ITEMS) after COLD / DELI and before DESSERT / SNACKS
      if (newSections.length > 0) {
        const deliIdx = menuSections.findIndex((s) => s.title === "COLD / DELI — PLASTIC CONTAINER");
        if (deliIdx >= 0) {
          menuSections = [...menuSections.slice(0, deliIdx + 1), ...newSections, ...menuSections.slice(deliIdx + 1)];
        } else {
          menuSections = [...newSections, ...menuSections];
        }
      }
    }
  }

  const barFid = barServiceFieldId ?? FIELD_IDS.BAR_SERVICE;
  const barServiceSelectedKitchen = asMultiSelectNames(eventData[barFid]);
  const isFullBarPackage = barServiceSelectedKitchen.includes("Full Bar Package");
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

  // Hard print order ends at DESSERTS — no section after it. Always show DELI for full service (like old BEOs).
  const activeSections = [...menuSections.filter((s) => s.items.length > 0 || (s.title === "DELI" && !isDelivery))];
  const visibleSections = activeSections.map((s) => ({
    ...s,
    items: s.items.filter((item) => !hiddenMenuItems.has(item.id)),
  })).filter((s) => s.items.length > 0 || (s.title === "DELI" && !isDelivery));

  const NOTES_SEP = " – ";
  const sauceOverrides = getSauceOverrides(eventId);
  const getEffectiveSauce = (itemId: string): string | null => {
    const override = sauceOverrides[itemId];
    const data = menuItemData[itemId];
    if (override?.sauceOverride === "None") return null;
    if (override?.sauceOverride === "Other") return override.customSauce?.trim() || null;
    return data?.sauce?.trim() || null;
  };

  // Build Event Menu map: catalogItemId -> { customText, components } for Print/View BEO
  const eventMenuByCatalogId: Record<string, { customText?: string; components?: { name: string; isAdded: boolean }[] }> = (() => {
    const map: Record<string, { customText?: string; components?: { name: string; isAdded: boolean }[] }> = {};
    for (const row of eventMenuRows) {
      const cid = row.catalogItemId;
      if (!cid) continue;
      const customText = row.customText?.trim();
      const co = row.childOverrides as ChildOverridesData | null | undefined;
      const defaultChildIds = menuItemData[cid]?.childIds ?? [];
      const overrides = co?.overrides ?? {};
      const added = co?.added ?? [];
      const components: { name: string; isAdded: boolean }[] = [];
      for (const childId of defaultChildIds) {
        const o = overrides[childId];
        if ((o?.enabled ?? true) === false) continue;
        const label = o?.label?.trim();
        const name = (label !== undefined && label !== "") ? label : (menuItemData[childId]?.name ?? childId);
        components.push({ name, isAdded: false });
      }
      added.forEach((s) => { const t = s?.trim(); if (t) components.push({ name: t, isAdded: true }); });
      if (customText || components.length > 0) {
        map[cid] = {};
        if (customText) map[cid].customText = customText;
        if (components.length > 0) map[cid].components = components;
      }
    }
    return map;
  })();

  // Expand items: Item name, Sauce: Sauce Name (one leading space), blank line before next item. No dashes or "w/".
  const expandItemToRows = (item: MenuLineItem): { lineName: string; isChild: boolean; itemId: string }[] => {
    const data = menuItemData[item.id];
    const emRow = eventMenuByCatalogId[item.id];
    const rows: { lineName: string; isChild: boolean; itemId: string }[] = [];
    // Station items (id starts with "station-hdr-"): name encodes header + components separated by \n
    if (item.id.startsWith("station-hdr-")) {
      const lines = item.name.split("\n");
      const header = lines[0] ?? "";
      const components = lines.slice(1);
      if (header) rows.push({ lineName: header, isChild: false, itemId: item.id });
      components.forEach((comp, i) => {
        if (comp.trim()) rows.push({ lineName: ` ${comp.trim()}`, isChild: true, itemId: `${item.id}-c${i}` });
      });
      rows.push({ lineName: "", isChild: false, itemId: `${item.id}-blank` });
      return rows;
    }
    // Custom items (id starts with "custom-"): parse "Item – Notes" into parent + child
    if (item.id.startsWith("custom-")) {
      const sepIdx = item.name.indexOf(NOTES_SEP);
      const parentName = sepIdx >= 0 ? item.name.slice(0, sepIdx).trim() : item.name;
      const notes = sepIdx >= 0 ? item.name.slice(sepIdx + NOTES_SEP.length).trim() : "";
      if (parentName) rows.push({ lineName: parentName, isChild: false, itemId: item.id });
      if (notes) rows.push({ lineName: ` ${notes}`, isChild: true, itemId: `${item.id}-notes` });
    } else if (item.id.startsWith("platter-") && item.specQty) {
      // Platter orders: main line + indented sub-items (picks × qty)
      rows.push({ lineName: item.name, isChild: false, itemId: item.id });
      rows.push({ lineName: ` ${item.specQty}`, isChild: true, itemId: `${item.id}-spec` });
    } else {
      const rawName = data?.name || item.name || "Loading...";
      const dashIdx = rawName.indexOf(" – ");
      let parentName = dashIdx >= 0 ? rawName.slice(0, dashIdx).trim() : rawName;
      const nameSuffixChild = dashIdx >= 0 ? rawName.slice(dashIdx + 3).trim() : "";
      if (emRow?.customText) parentName = emRow.customText;
      rows.push({ lineName: parentName, isChild: false, itemId: item.id });
      if (emRow?.components && emRow.components.length > 0) {
        emRow.components.forEach((c, i) => {
          const prefix = c.isAdded ? " • + " : " • ✓ ";
          rows.push({ lineName: `${prefix}${c.name}`, isChild: true, itemId: `${item.id}-emc${i}` });
        });
      } else {
        if (nameSuffixChild) rows.push({ lineName: ` • ✓ ${nameSuffixChild}`, isChild: true, itemId: `${item.id}-namesuffix` });
        const effectiveSauce = getEffectiveSauce(item.id);
        if (effectiveSauce && effectiveSauce !== nameSuffixChild) rows.push({ lineName: ` • ✓ ${effectiveSauce}`, isChild: true, itemId: `${item.id}-sauce` });
        const desc = buffetMenuEdits[item.id] ?? data?.description;
        const parentLabel = [parentName, desc, effectiveSauce, nameSuffixChild].filter(Boolean).join(" ").toLowerCase();
        if (data?.childIds?.length) {
          const childIdsToShow = data.childIds.filter((childId) => {
            const childName = menuItemData[childId]?.name || "";
            return childName && !parentLabel.includes(childName.toLowerCase());
          });
          childIdsToShow.forEach((childId) => {
            const childName = menuItemData[childId]?.name || "Loading...";
            rows.push({ lineName: ` • ✓ ${childName}`, isChild: true, itemId: childId });
          });
        }
      }
    }
    rows.push({ lineName: "", isChild: false, itemId: `${item.id}-blank` });
    return rows;
  };

  // ── Kitchen BEO pagination ──
  // Delivery: target 2 pages (no buffer)
  // Full service: 10in buffer on page 2+ leaves ~0.5in for content — use 4 lines so each page gets its own buffer
  const LINES_PER_PAGE_FIRST = isDelivery ? 52 : 48;
  const LINES_PER_PAGE = isDelivery ? 55 : 48;
  const SECTION_HEADER_LINES = 2;
  const MIN_LINES_ON_LAST_PAGE = 4;
  type KitchenPage = { pageNum: number; sections: Array<{ section: SectionData; items: MenuLineItem[]; isContinuation?: boolean }> };
  const kitchenPages: KitchenPage[] = (() => {
    const pages: KitchenPage[] = [];
    let current: KitchenPage = { pageNum: 1, sections: [] };
    let linesUsed = 0;
    const getMaxLines = (pageNum: number) => (pageNum === 1 ? LINES_PER_PAGE_FIRST : LINES_PER_PAGE);
    const getItemLines = (item: MenuLineItem) => expandItemToRows(item).length;

    for (const section of activeSections) {
      let remainingItems = [...section.items];
      let isFirstChunkOfSection = true;

      while (remainingItems.length > 0) {
        const max = getMaxLines(current.pageNum);
        const headerLines = isFirstChunkOfSection ? SECTION_HEADER_LINES : 0;

        let itemsToAdd: MenuLineItem[] = [];
        let chunkLines = headerLines;
        for (const item of remainingItems) {
          const itemLines = getItemLines(item);
          if (linesUsed + chunkLines + itemLines > max && itemsToAdd.length > 0) break;
          if (linesUsed + chunkLines + itemLines > max && current.sections.length === 0) {
            itemsToAdd.push(item);
            chunkLines += itemLines;
            break;
          }
          itemsToAdd.push(item);
          chunkLines += itemLines;
        }

        if (itemsToAdd.length === 0) {
          pages.push(current);
          current = { pageNum: pages.length + 1, sections: [] };
          linesUsed = 0;
          continue;
        }

        current.sections.push({
          section,
          items: itemsToAdd,
          isContinuation: !isFirstChunkOfSection,
        });
        linesUsed += chunkLines;
        remainingItems = remainingItems.slice(itemsToAdd.length);
        isFirstChunkOfSection = false;

        if (remainingItems.length > 0) {
          pages.push(current);
          current = { pageNum: pages.length + 1, sections: [] };
          linesUsed = 0;
        }
      }
    }
    if (current.sections.length > 0) pages.push(current);
    let result = pages.length > 0 ? pages : [{ pageNum: 1, sections: [] }];
    while (result.length >= 2) {
      const last = result[result.length - 1];
      const lastLines = last.sections.reduce(
        (sum, { section, items, isContinuation }) =>
          sum + (isContinuation ? 0 : SECTION_HEADER_LINES) + items.reduce((s, item) => s + getItemLines(item), 0),
        0
      );
      if (lastLines >= MIN_LINES_ON_LAST_PAGE) break;
      const prev = result[result.length - 2];
      const prevLines = prev.sections.reduce(
        (sum, { section, items, isContinuation }) =>
          sum + (isContinuation ? 0 : SECTION_HEADER_LINES) + items.reduce((s, item) => s + getItemLines(item), 0),
        0
      );
      const prevMax = getMaxLines(prev.pageNum);
      if (prevLines + lastLines <= prevMax) {
        prev.sections.push(...last.sections);
        result = result.slice(0, -1);
      } else break;
    }
    return result;
  })();

  // Grid columns: spec (left), item (middle), override/equipment/checkbox (right)
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

  if (!eventId) {
    return (
      <div style={styles.loading}>
        No event selected. Go to the dashboard and click Print/View BEO.
      </div>
    );
  }

  // ── Client name for page markers (injected into @page; escaped for CSS) ──
  // ── Render ──
  return (
    <>
      <style>{printStyles}</style>
      {topTab !== "buffetMenuSigns" && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { @top-center { content: none !important; } }
            @page :first { @top-center { content: none !important; } }
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
                  const saved = await updateEvent(selectedEventId, { [FIELD_IDS.MENU_PRINT_THEME]: printModalTheme });
                  if (!saved) {
                    console.warn("Could not save menu theme (e.g. insufficient permissions to create select option). Proceeding with print.");
                  }
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

      {/* ── Send to BOH modal ── */}
      <ConfirmSendToBOHModal
        open={showSendToBOHModal}
        onClose={() => setShowSendToBOHModal(false)}
        eventName={eventName}
        onConfirm={handleSendToBOH}
      />

      {/* ── Confirm Change Received modal (production frozen) ── */}
      <AcceptTransferModal
        open={showConfirmChangeModal}
        onClose={() => setShowConfirmChangeModal(false)}
        eventName={eventName}
        onAccept={handleConfirmChangeReceived}
        isChangeConfirmation
        isProductionFrozen
      />

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
      <div className={`beo-print-layout beo-page${topTab === "buffetMenuSigns" ? " print-menu-mode" : ""}`} style={styles.layout}>
        {/* Left column: checklist boxes (hidden when printing). Kitchen dept: Print only */}
        <div className="no-print" style={styles.leftSidebar}>
          {!isKitchenDept && (
            <>
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
            </>
          )}
          <div style={{ flex: 1 }} />
          {canSendToBOH && (
            <button
              type="button"
              style={{ ...styles.leftBox, background: "#22c55e", borderColor: "#22c55e", color: "#fff" }}
              onClick={() => setShowSendToBOHModal(true)}
            >
              Send to BOH
            </button>
          )}
          <button
            style={{ ...styles.leftBox, background: "#2d8cf0", borderColor: "#2d8cf0" }}
            onClick={() => topTab === "buffetMenuSigns" ? (setPrintModalTheme(menuTheme), setPrintModalFormat(printMode), setPrintModalOpen(true)) : window.print()}
          >
            {topTab === "buffetMenuSigns" ? "Print Menu" : "Print"}
          </button>
          {!isKitchenDept && (
            <button
              style={{ ...styles.leftBox, background: "#555", borderColor: "#555" }}
              onClick={() => window.history.back()}
            >
              ← Back
            </button>
          )}
        </div>

        {/* Main area: top tabs + content. Kitchen dept: no tabs, Kitchen BEO only */}
        <div className="beo-print-main" style={styles.mainArea}>
          {productionFrozen && (
            <div className="no-print" style={{
              background: "#7f1d1d",
              color: "#fff",
              padding: "12px 16px",
              marginBottom: 12,
              borderRadius: 8,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}>
              <span>Event information was changed. Production is frozen until BOH confirms.</span>
              {isBOHDept && bohIds?.changeConfirmedByBOH && (
                <button
                  type="button"
                  onClick={() => setShowConfirmChangeModal(true)}
                  style={{
                    background: "#22c55e",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Confirm Change Received
                </button>
              )}
            </div>
          )}
          {!isKitchenDept && (
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
          )}

          {/* ── Content (based on top tab) ── */}
          {topTab === "kitchenBEO" && (
      <div
        key={`kitchen-${leftCheck}`}
        className="beo-print-content"
        style={styles.page}
        onClick={() => { if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur(); }}
      >
        {kitchenPages.length === 0 || (kitchenPages.length === 1 && kitchenPages[0].sections.length === 0) ? (
          <div style={{ padding: 32, textAlign: "center", color: "#999", fontSize: 16 }}>
            No menu items assigned to this event yet.
          </div>
        ) : (
        kitchenPages.map((page, pageIdx) => (
          <div
            key={page.pageNum}
            className="kitchen-beo-page print-page page"
            style={{
              pageBreakAfter: pageIdx < kitchenPages.length - 1 ? "page" : "auto",
            }}
          >
            {/* Page marker (PAGE 2, 3, …) is rendered via @page @top-center in print CSS — not in DOM */}

            {/* Grey / delivery yellow bar + header table — page 1 only (delivery matches sample Excel BEOs) */}
            {page.pageNum === 1 && (
              <div className="beo-event-header-block kitchen-beo-page-header" style={{ marginBottom: 6 }}>
                {isDelivery ? (
                  <S2Header
                    eventDate={eventDate}
                    clientName={clientName}
                    contactName={contactName}
                    cityState={cityState}
                    jobNumberDisplay={jobNumberDisplay}
                    dispatchTime={dispatchTime}
                    eventArrival={eventArrival}
                    guestCount={guestCount}
                    eventLocation={eventLocation}
                    venueAddress={venueAddress}
                    eventStart={eventStart}
                    eventEnd={eventEnd}
                    fwStaff={fwStaff}
                    phoneStr={phone}
                    isDelivery
                    deliveryNotes={specialNotes}
                  />
                ) : (
                  <>
                    <div
                      className="beo-letterhead-bar kitchen-beo-page-header"
                      style={{
                        background: "#6b7280",
                        color: "#fff",
                        padding: "6px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 12,
                        fontWeight: 700,
                        border: "2px solid #374151",
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            background: "#dc2626",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transform: "rotate(45deg)",
                            flexShrink: 0,
                          }}
                        >
                          <span style={{ transform: "rotate(-45deg)", fontSize: 11, fontWeight: 800, color: "#fff" }}>f</span>
                        </div>
                        <span>BEO</span>
                      </div>
                      <span>
                        ORDER #: {jobNumberDisplay} — DISPATCH TIME: {dispatchTime || "—"}
                      </span>
                    </div>

                    <div className="beo-event-details-table" style={{ marginTop: 4, marginBottom: 6, overflow: "hidden" }}>
                      <table style={KITCHEN_HEADER_TABLE}>
                        <colgroup>
                          <col style={{ width: "15%" }} />
                          <col style={{ width: "35%" }} />
                          <col style={{ width: "15%" }} />
                          <col style={{ width: "35%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td style={LABEL_CELL}>CLIENT</td>
                            <td style={DATA_CELL}>{clientName || "—"}</td>
                            <td style={LABEL_CELL}>ORDER #</td>
                            <td style={{ ...DATA_CELL, color: "#c00", fontWeight: 700 }}>{jobNumberDisplay || "—"}</td>
                          </tr>
                          <tr>
                            <td style={LABEL_CELL}>CONTACT</td>
                            <td style={DATA_CELL}>{contactName || "—"}</td>
                            <td style={LABEL_CELL}>EVENT DATE</td>
                            <td style={DATA_CELL}>{eventDate || "—"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {page.pageNum === 1 && (beoNotes.trim() || notBuffetBanner || showFoodMustGoHotBanner || allergies || religiousRestrictions.trim() || dietarySummary.trim()) && (
              <div className="beo-banner-container">
                {beoNotes.trim() && (
                  <div className="beo-banner-block" style={styles.beoNotesBanner}>📋 BEO NOTES: {beoNotes.trim()}</div>
                )}
                {notBuffetBanner && (
                  <div className="beo-banner-block" style={styles.notBuffetBanner}>{notBuffetBanner}</div>
                )}
                {showFoodMustGoHotBanner && (
                  <div className="beo-banner-block" style={{ background: "#ff0000", color: "#fff", fontWeight: 700, padding: "5px 10px", borderRadius: 3, textAlign: "center", letterSpacing: 1, fontSize: 13, marginBottom: 4 }}>
                    🔥 ALL FOOD MUST GO HOT — NO KITCHEN ON SITE
                  </div>
                )}
                {allergies && (
                  <div className="beo-banner-block" style={styles.allergyBanner}>⚠️ ALLERGIES / DIETARY RESTRICTIONS: {allergies.toUpperCase()}</div>
                )}
                {religiousRestrictions.trim() && (
                  <div className="beo-banner-block" style={styles.religiousBanner}>🕎 RELIGIOUS / DIETARY: {religiousRestrictions.trim().toUpperCase()}</div>
                )}
                {dietarySummary.trim() && (
                  <div className="beo-banner-block" style={styles.beoNotesBanner}>🍽️ DIETARY MEAL COUNTS: {dietarySummary.trim().toUpperCase()}</div>
                )}
              </div>
            )}

            {/* ── Menu Sections for this page ── */}
            {page.sections.map(({ section, items: sectionItems, isContinuation }, secIdx) => (
          <div key={`${section.fieldId}-${page.pageNum}-${secIdx}`} className="beo-section-card" style={styles.sectionCard}>
            <div className={sectionItems.length > 0 ? "beo-section-header-with-first-item" : undefined}>
              <div className="beo-section-header" style={styles.sectionHeader}>
                <span style={{ color: getSectionColor(section.title), fontSize: "22px", lineHeight: 0 }}>●</span>
                <span>{section.title}{isContinuation ? " (cont.)" : ""}</span>
                <span style={{ color: getSectionColor(section.title), fontSize: "22px", lineHeight: 0 }}>●</span>
              </div>
              {(leftCheck === "kitchen" || leftCheck === "expeditor" || leftCheck === "server") && sectionItems.length > 0 && secIdx === 0 && (
                <div className="beo-line-item" style={{ ...styles.lineItem, borderBottom: "1px solid #ddd", gridTemplateColumns, padding: "4px 8px", lineHeight: 1.2, minHeight: "unset", alignItems: "center", fontWeight: 600, fontSize: 10, color: "#333" }}>
                  <div style={styles.specCol}>—</div>
                  <div style={styles.itemCol}>—</div>
                  <div style={{ ...styles.checkboxCol, justifyContent: "center" }}>✓ when complete</div>
                </div>
              )}
              {sectionItems.length > 0 && (() => {
                const item = sectionItems[0];
                const rows = expandItemToRows(item);
                return (
              <div key={`${item.id}-0`} className="beo-menu-item-block" style={{ borderBottom: "1px solid #ddd", paddingBottom: 2, marginTop: 0 }}>
              {rows.map((row, rowIdx) => {
                const overrideKey = getSpecOverrideKey(section.fieldId, item.id, rowIdx);
                const overrideKeyLegacy = `${section.fieldId}:${item.id}`;
                return (
              <div key={rowIdx} className="beo-line-item" style={{ ...styles.lineItem, borderBottom: "none", gridTemplateColumns, padding: row.isChild ? "0 8px 0 8px" : "0 8px", paddingLeft: row.isChild ? "calc(8px + 2ch)" : 8, lineHeight: 1.15, minHeight: "unset", alignItems: "flex-start", marginTop: row.isChild ? 0 : 0 }}>
                {/* SPEC / PACK-OUT / EXPEDITOR / KITCHEN / SERVER: Spec Column (left) */}
                {(leftCheck === "spec" || leftCheck === "packout" || leftCheck === "expeditor" || leftCheck === "kitchen" || leftCheck === "server") && (
                  <div className="beo-spec-col" style={{ ...styles.specCol, lineHeight: 1.2 }}>
                    <span>{(specOverrides[overrideKey] ?? (rowIdx === 0 ? specOverrides[overrideKeyLegacy] : undefined) ?? (rowIdx === 0 ? item.specQty : undefined) ?? "").trim() || "—"}</span>
                  </div>
                )}

                {/* Item Name (middle column) */}
                <div className="beo-item-col" style={{ ...styles.itemCol, lineHeight: 1.25, ...getItemRowNameStyle(row.isChild, rows.some(r => r.isChild)) }}>
                  {row.lineName}
                </div>

                {/* SPEC VIEW: Override input (right) — to override the spec on the left */}
                {leftCheck === "spec" && (
                  <div className="beo-spec-col" style={{ ...styles.specCol, display: "flex", flexDirection: "column", gap: 2 }} onClick={(e) => { e.stopPropagation(); if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur(); }}>
                    <input
                      type="text"
                      placeholder="spec..."
                      value={specOverrides[overrideKey] ?? (rowIdx === 0 ? specOverrides[overrideKeyLegacy] : undefined) ?? (rowIdx === 0 ? item.specQty : undefined) ?? ""}
                      onChange={(e) => {
                        setSpecOverrides((prev) => ({ ...prev, [overrideKey]: e.target.value }));
                      }}
                      style={{
                        width: "100%",
                        padding: "2px 6px",
                        fontSize: 11,
                        lineHeight: 1,
                        background: "#f9f9f9",
                        border: "1px solid #ddd",
                        borderRadius: 2,
                      }}
                      className="no-print"
                    />
                  </div>
                )}

                {/* KITCHEN / EXPEDITOR / SERVER: Checkbox (right) */}
                {(leftCheck === "kitchen" || leftCheck === "expeditor" || leftCheck === "server") && (
                  <div style={styles.checkboxCol} onClick={(e) => { e.stopPropagation(); if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur(); }}>
                    <input
                      type="checkbox"
                      checked={checkState[`${leftCheck}:${section.fieldId}:${item.id}:${rowIdx}`] ?? item.loaded ?? false}
                      onChange={(e) => {
                        const key = `${leftCheck}:${section.fieldId}:${item.id}:${rowIdx}`;
                        setCheckState((prev) => ({ ...prev, [key]: e.target.checked }));
                      }}
                      className="no-print"
                      style={{ width: "20px", height: "20px", accentColor: "#333", cursor: "pointer" }}
                    />
                  </div>
                )}

                {/* PACK-OUT: Editable equipment list (right) — per item, only on parent row */}
                {leftCheck === "packout" && (
                  <div style={styles.packOutCol} onClick={(e) => { e.stopPropagation(); if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur(); }}>
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
            );
            })}
              </div>
                );
              })()}
            </div>
            {sectionItems.slice(1).map((item, itemIdx) => {
              const rows = expandItemToRows(item);
              return (
              <div key={`${item.id}-${itemIdx + 1}`} className="beo-menu-item-block" style={{ borderBottom: "1px solid #ddd", paddingBottom: 2, marginTop: 2 }}>
              {rows.map((row, rowIdx) => {
                const overrideKey = getSpecOverrideKey(section.fieldId, item.id, rowIdx);
                const overrideKeyLegacy = `${section.fieldId}:${item.id}`;
                return (
              <div key={rowIdx} className="beo-line-item" style={{ ...styles.lineItem, borderBottom: "none", gridTemplateColumns, padding: row.isChild ? "0 8px 0 8px" : "0 8px", paddingLeft: row.isChild ? "calc(8px + 2ch)" : 8, lineHeight: 1.15, minHeight: "unset", alignItems: "flex-start", marginTop: row.isChild ? 0 : 0 }}>
                {(leftCheck === "spec" || leftCheck === "packout" || leftCheck === "expeditor" || leftCheck === "kitchen" || leftCheck === "server") && (
                  <div className="beo-spec-col" style={{ ...styles.specCol, lineHeight: 1.2 }}>
                    <span>{(specOverrides[overrideKey] ?? (rowIdx === 0 ? specOverrides[overrideKeyLegacy] : undefined) ?? (rowIdx === 0 ? item.specQty : undefined) ?? "").trim() || "—"}</span>
                  </div>
                )}
                <div className="beo-item-col" style={{ ...styles.itemCol, lineHeight: 1.25, ...getItemRowNameStyle(row.isChild, rows.some(r => r.isChild)) }}>{row.lineName}</div>
                {leftCheck === "spec" && (
                  <div className="beo-spec-col" style={{ ...styles.specCol, display: "flex", flexDirection: "column", gap: 2 }} onClick={(e) => { e.stopPropagation(); if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur(); }}>
                    <input type="text" placeholder="spec..." value={specOverrides[overrideKey] ?? (rowIdx === 0 ? specOverrides[overrideKeyLegacy] : undefined) ?? (rowIdx === 0 ? item.specQty : undefined) ?? ""} onChange={(e) => { setSpecOverrides((prev) => ({ ...prev, [overrideKey]: e.target.value })); }} style={{ width: "100%", padding: "2px 6px", fontSize: 11, lineHeight: 1, background: "#f9f9f9", border: "1px solid #ddd", borderRadius: 2 }} className="no-print" />
                  </div>
                )}
                {(leftCheck === "kitchen" || leftCheck === "expeditor" || leftCheck === "server") && (
                  <div style={styles.checkboxCol} onClick={(e) => { e.stopPropagation(); if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur(); }}>
                    <input type="checkbox" checked={checkState[`${leftCheck}:${section.fieldId}:${item.id}:${rowIdx}`] ?? item.loaded ?? false} onChange={(e) => { setCheckState((prev) => ({ ...prev, [`${leftCheck}:${section.fieldId}:${item.id}:${rowIdx}`]: e.target.checked })); }} className="no-print" style={{ width: "20px", height: "20px", accentColor: "#333", cursor: "pointer" }} />
                  </div>
                )}
                {leftCheck === "packout" && (
                  <div style={styles.packOutCol} onClick={(e) => { e.stopPropagation(); if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur(); }}>
                    {rowIdx === 0 ? <textarea placeholder="equipment..." value={packOutEdits[`${section.fieldId}:${item.id}`] ?? item.packOutItems ?? ""} onChange={(e) => { setPackOutEdits((prev) => ({ ...prev, [`${section.fieldId}:${item.id}`]: e.target.value })); }} style={{ width: "100%", minHeight: 36, padding: "4px 6px", fontSize: 11, background: "#f5f5f5", border: "1px solid #ccc", borderRadius: 3, resize: "vertical", boxSizing: "border-box" }} className="no-print" rows={2} /> : <span style={{ color: "#999", fontSize: 10 }}>—</span>}
                  </div>
                )}
              </div>
                );
              })}
              </div>
            );
            })}
          </div>
        ))}

            {/* Last page only (when no Server BEO 2nd page): Allergy banner + footer */}
            {pageIdx === kitchenPages.length - 1 && !["packout", "expeditor", "server"].includes(leftCheck) && (
              <>
                {allergies && (
                  <div className="beo-banner-block" style={{ ...styles.allergyBanner, marginTop: 20, marginBottom: 12 }}>
                    ⚠️ ALLERGIES / DIETARY RESTRICTIONS: {allergies.toUpperCase()}
                  </div>
                )}
                <div className="beo-footer-block" style={{ marginTop: 12, breakInside: "avoid", pageBreakInside: "avoid", breakBefore: "avoid", pageBreakBefore: "avoid", display: "flex", flexDirection: "column", alignItems: "flex-start", border: "3px solid #000", padding: "16px 20px", borderRadius: 4 }}>
                  <div style={{ border: "2px solid #4b5563", outline: "2px solid #4b5563", outlineOffset: "2px", borderRadius: 6, padding: "16px 20px", background: isDelivery ? "#facc15" : "#9ca3af", width: "fit-content" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, color: isDelivery ? "#000" : "#fff" }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Client: {clientName || "—"}</div>
                      {!isDelivery && (() => {
                        const v = f(FIELD_IDS.VENUE) || "";
                        const addr = (venueAddress || "").trim();
                        const show = v.trim() && v.trim() !== addr;
                        return show ? <div style={{ fontSize: 13, fontWeight: 600 }}>Venue: {v}</div> : null;
                      })()}
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Guests: {guestCount || "—"}</div>
                      <div style={{ display: "flex", gap: 16, alignItems: "center", background: "#fff", color: "#000", padding: "8px 12px", borderRadius: 4, border: "2px solid #000", fontWeight: 700, fontSize: 16 }}>
                        <span>Job #: {jobNumberDisplay}</span>
                        <span>Dispatch: {dispatchTime || "—"}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "left" as const, marginTop: 8, fontSize: 14, fontWeight: 700, letterSpacing: 2, color: "#333" }}>
                    ***end of event***
                  </div>
                </div>
              </>
            )}
          </div>
        )))}
        {/* When packout/expeditor/server: append Server BEO 2nd page (beverage, hydration, paper, notes, timeline) so it appears in those checks */}
        {(leftCheck === "packout" || leftCheck === "expeditor" || leftCheck === "server") && (
          <div className="kitchen-beo-page print-page page">
            {/* Grey BEO letterhead bar + 9in buffer (same as kitchen pages 2+) */}
            <div className="beo-letterhead-bar" style={{
              background: "#6b7280", color: "#fff", padding: "12px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              fontSize: 14, fontWeight: 700, border: "2px solid #374151",
              marginBottom: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 24, height: 24, background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)", flexShrink: 0 }}>
                  <span style={{ transform: "rotate(-45deg)", fontSize: 12, fontWeight: 800, color: "#fff" }}>f</span>
                </div>
                <span>BEO</span>
              </div>
              <span>JOB#: {jobNumberDisplay}-----------------DISPATCH TIME {dispatchTime}</span>
            </div>
            <div className="kitchen-beo-page2-buffer" style={{ height: "10in", minHeight: "10in", flexShrink: 0 }} aria-hidden="true" />
            <ServerBeo2ndPageContent
              eventDate={eventDate}
              clientName={clientName}
              contactName={contactName}
              cityState={cityState}
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
              religiousRestrictions={religiousRestrictions}
              beoNotes={beoNotes}
              activeSections={activeSections}
              expandItemToRows={expandItemToRows}
              meetingNotes={meetingNotes}
              onAddNote={(itemId, itemName, sectionTitle) =>
                setNoteModal({ open: true, itemId, itemName, sectionTitle, draftNote: "" })
              }
            />
          )}
          {topTab === "fullBeoPacket" && (
            <>
              <SBeoContent
                eventDate={eventDate}
                clientName={clientName}
                contactName={contactName}
                cityState={cityState}
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
                religiousRestrictions={religiousRestrictions}
                beoNotes={beoNotes}
                eventData={eventData}
                kitchenPages={kitchenPages}
                expandItemToRows={expandItemToRows}
                specOverrides={specOverrides}
                setSpecOverrides={setSpecOverrides}
                checkState={checkState}
                setCheckState={setCheckState}
                packOutEdits={packOutEdits}
                setPackOutEdits={setPackOutEdits}
                isDelivery={isDelivery}
              />
              <FullBeoPacketBeveragesContent
              eventDate={eventDate}
              clientName={clientName}
              contactName={contactName}
              cityState={cityState}
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
              religiousRestrictions={religiousRestrictions}
              beoNotes={beoNotes}
              eventData={eventData}
              barServiceFieldId={barServiceFieldId}
            />
            </>
          )}
          {topTab === "serverBeo2ndPage" && (
            <ServerBeo2ndPageContent
              eventDate={eventDate}
              clientName={clientName}
              contactName={contactName}
              cityState={cityState}
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
              religiousRestrictions={religiousRestrictions}
              beoNotes={beoNotes}
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
