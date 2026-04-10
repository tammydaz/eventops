import React, { useMemo, useState } from "react";
import { FIELD_IDS } from "../../services/airtable/events";
import { asSingleSelectName, asString, asStringArray } from "../../services/airtable/selectors";

export type DeliveryPrintLine = { item: string; qty: string };

/** Same bullet parsing as DeliveryPaperProductsSection / Kitchen BEO print */
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

export function buildDeliveryPaperProductsLines(fields: Record<string, unknown> | null): DeliveryPrintLine[] {
  if (!fields) return [];
  const all: DeliveryPrintLine[] = [];
  for (const fid of [FIELD_IDS.PLATES_LIST, FIELD_IDS.CUTLERY_LIST, FIELD_IDS.GLASSWARE_LIST]) {
    parseServicewareLines(asString(fields[fid])).forEach((p) => all.push({ item: p.item, qty: p.qty }));
  }
  return all;
}

/** Single-select sometimes stores Yes/No for “include water?” — not a SKU; don’t print as a beverage line. */
function isHydrationWaterProductChoice(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  return !/^(yes|no|none|n\/a)$/i.test(v);
}

export function buildDeliveryBeverageLines(fields: Record<string, unknown> | null): DeliveryPrintLine[] {
  if (!fields) return [];
  const items: DeliveryPrintLine[] = [];
  const notesRaw = asString(fields[FIELD_IDS.SERVICEWARE_NOTES]);
  if (notesRaw?.trim()) {
    parseServicewareLines(notesRaw).forEach((p) => items.push({ qty: p.qty, item: p.item }));
  }
  if (items.length === 0) {
    const soda = asStringArray(fields[FIELD_IDS.HYDRATION_SODA_SELECTION]).filter(
      (s) => s.trim() && !/^(yes|no)$/i.test(s.trim())
    );
    if (soda.length > 0) items.push({ qty: "", item: soda.join(", ") });
    const waterRaw = asSingleSelectName(fields[FIELD_IDS.HYDRATION_BOTTLED_WATER]) || "";
    if (isHydrationWaterProductChoice(waterRaw)) {
      items.push({ qty: "", item: `Bottled Water: ${waterRaw.trim()}` });
    }
    const other = asString(fields[FIELD_IDS.HYDRATION_OTHER]);
    if (other?.trim()) items.push({ qty: "", item: other });
  }
  return items;
}

const RED = "#ff0000";
const YELLOW = "#ffff00";
const BLACK = "#000000";

const cellBase: React.CSSProperties = {
  border: `1px solid ${BLACK}`,
  padding: "4px 8px",
  fontSize: 11,
  fontWeight: 700,
  color: BLACK,
  textTransform: "uppercase",
  verticalAlign: "middle",
};

/**
 * Delivery-only print layout: PAPER PRODUCTS & BEVERAGES (staff spreadsheet style).
 * When `collapsibleWhenEmpty` and there is no data, shows a screen-only stub; prints nothing.
 */
export function DeliveryPaperBeveragesSpreadsheet(props: {
  paper: DeliveryPrintLine[];
  beverages: DeliveryPrintLine[];
  collapsibleWhenEmpty?: boolean;
}) {
  const { paper, beverages, collapsibleWhenEmpty = true } = props;
  const hasContent = paper.length > 0 || beverages.length > 0;
  const [emptyOpen, setEmptyOpen] = useState(false);

  const rows = useMemo(() => {
    const n = Math.max(paper.length, beverages.length);
    return Array.from({ length: n }, (_, i) => ({
      pq: paper[i]?.qty ?? "",
      pi: (paper[i]?.item ?? "").toUpperCase(),
      bi: (beverages[i]?.item ?? "").toUpperCase(),
      bq: beverages[i]?.qty ?? "",
      bevRow: !!(beverages[i]?.item || beverages[i]?.qty),
    }));
  }, [paper, beverages]);

  if (!hasContent && collapsibleWhenEmpty) {
    return (
      <div className="delivery-pbb-empty-wrap" style={{ marginTop: 10, breakInside: "avoid", pageBreakInside: "avoid" }}>
        <button
          type="button"
          className="no-print"
          onClick={() => setEmptyOpen((v) => !v)}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            border: `2px solid ${BLACK}`,
            background: "#f3f4f6",
            cursor: "pointer",
            borderRadius: 4,
          }}
        >
          {emptyOpen ? "▼" : "▶"} PAPER PRODUCTS & BEVERAGES — not filled (expand to confirm)
        </button>
        {emptyOpen && (
          <div className="no-print" style={{ marginTop: 6, fontSize: 11, color: "#6b7280", paddingLeft: 4 }}>
            No paper products or delivery beverages in intake yet.
          </div>
        )}
      </div>
    );
  }

  if (!hasContent) return null;

  return (
    <div
      className="delivery-pbb-spreadsheet"
      style={{ marginTop: 12, breakInside: "avoid", pageBreakInside: "avoid" }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <tbody>
          <tr>
            <td colSpan={4} style={{ ...cellBase, background: RED, textAlign: "center", fontSize: 12, padding: "8px 10px" }}>
              PAPER PRODUCTS & BEVERAGES
            </td>
          </tr>
          <tr>
            <td style={{ ...cellBase, background: YELLOW, width: "12%", textAlign: "center" }}>QTY</td>
            <td style={{ ...cellBase, background: YELLOW, width: "38%" }}>PREMIUM PAPER PRODUCTS</td>
            <td style={{ ...cellBase, background: YELLOW, width: "35%" }}>BEVERAGES</td>
            <td style={{ ...cellBase, background: YELLOW, width: "15%", textAlign: "center" }}>QTY</td>
          </tr>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ ...cellBase, textAlign: "center", fontWeight: 700 }}>{r.pq}</td>
              <td style={cellBase}>{r.pi}</td>
              <td style={{ ...cellBase, background: r.bevRow ? YELLOW : "#fff" }}>{r.bi}</td>
              <td style={{ ...cellBase, textAlign: "center", background: r.bevRow ? YELLOW : "#fff", fontWeight: 700 }}>{r.bq}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Builds lines from live event record (BEO Print page). */
export function DeliveryPaperBeveragesSpreadsheetFromEvent(props: {
  eventData: Record<string, unknown>;
  collapsibleWhenEmpty?: boolean;
}) {
  const paper = useMemo(() => buildDeliveryPaperProductsLines(props.eventData), [props.eventData]);
  const beverages = useMemo(() => buildDeliveryBeverageLines(props.eventData), [props.eventData]);
  return (
    <DeliveryPaperBeveragesSpreadsheet
      paper={paper}
      beverages={beverages}
      collapsibleWhenEmpty={props.collapsibleWhenEmpty}
    />
  );
}
