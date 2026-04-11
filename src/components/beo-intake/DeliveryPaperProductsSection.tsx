import { useEffect, useState, useCallback, useRef } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString, asSingleSelectName } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";

// Row definitions — every label is the exact text that appears on the printed
// delivery BEO (so round-tripping load->save->print stays consistent).

type PaperRowDef = {
  key: string;
  label: string;
  printLabel: string;
  group: "plates" | "cutlery" | "glassware";
  optional?: boolean;
};

const PAPER_ROWS: PaperRowDef[] = [
  { key: "bowls",          label: "Bowls",           printLabel: "Bowls",          group: "plates",    optional: true  },
  { key: "small_plates",   label: "Small Plates",    printLabel: "Small Plates",   group: "plates",    optional: false },
  { key: "large_plates",   label: "Large Plates",    printLabel: "Large Plates",   group: "plates",    optional: false },
  { key: "forks",          label: "Forks",           printLabel: "Forks",          group: "cutlery",   optional: false },
  { key: "teaspoons",      label: "Teaspoons",       printLabel: "Teaspoons",      group: "cutlery",   optional: false },
  { key: "knives",         label: "Knives",          printLabel: "Knives",         group: "cutlery",   optional: false },
  { key: "coffee_cups",    label: "Coffee Cups",     printLabel: "Coffee Cups",    group: "glassware", optional: true  },
  { key: "dinner_napkins", label: "Dinner Napkins",  printLabel: "Dinner Napkins", group: "cutlery",   optional: false },
  /** Optional add-ons — not filled by "Auto-fill for N guests" */
  { key: "tongs",          label: "Tongs",           printLabel: "Tongs",          group: "cutlery",   optional: true },
  { key: "serving_spoons", label: "Serving Spoons",  printLabel: "Serving Spoons", group: "cutlery",   optional: true },
];

const HOT_ROWS: PaperRowDef[] = [
  { key: "chafer_racks", label: "Aluminum Wire Chafer Racks", printLabel: "Aluminum Wire Chafer Racks", group: "cutlery" },
  { key: "water_pans",   label: "Water Pans",              printLabel: "Water Pans",                 group: "cutlery" },
  { key: "sternos",      label: "Sternos",                 printLabel: "Sternos",                    group: "cutlery" },
];

const EXTRAS_ROWS: PaperRowDef[] = [
  { key: "roll_ups",     label: "Roll Ups",                printLabel: "Roll Ups",                       group: "cutlery", optional: true },
  { key: "table_covers", label: "Disp. Table Covers",      printLabel: "White Disposable Table Covers",  group: "cutlery", optional: true },
];

type BevRowDef = {
  key: string;
  label: string;
  printLabel: string;
  /** When set, UI shows a flavor dropdown; saved/printed as `${printLabel} — ${choice}` */
  choices?: readonly string[];
};

const BEV_ROWS: BevRowDef[] = [
  { key: "oj",          label: "Orange Juice",                    printLabel: "Orange Juice"                        },
  { key: "coffee_reg",  label: "Coffee - Reg (boxes)",            printLabel: "Coffee Regular Boxes"                },
  { key: "coffee_dec",  label: "Coffee - Decaf (boxes)",          printLabel: "Coffee Decaf Boxes"                  },
  { key: "coffee_setup", label: "☕ Coffee Setup",                printLabel: "Coffee Setup (sweetener, stirrers & creamers)" },
  { key: "soda_cans",   label: "Soda Cans (Assorted)",            printLabel: "Cold Assorted Soda Cans"             },
  { key: "iced_tea",    label: "Iced Tea Bottles",                printLabel: "Cold Assorted Iced Tea Bottles"      },
  { key: "water",       label: "Water Bottles",                   printLabel: "Water Bottles"                       },
  {
    key: "infused_water",
    label: "Infused Water",
    printLabel: "Infused Water",
    choices: [
      "Lemon",
      "Cucumber",
      "Strawberry",
      "Orange",
      "Mint",
      "Mixed Berry",
      "Seasonal Citrus",
    ],
  },
];

/** Space + em dash + space between base beverage name and flavor (printed line). */
const BEV_FLAVOR_SEP = " \u2014 ";

function getDefaultBevChoices(): Record<string, string> {
  const d: Record<string, string> = {};
  for (const row of BEV_ROWS) {
    if (row.choices?.length) d[row.key] = row.choices[0];
  }
  return d;
}

// Storage helpers — same bullet format "• PrintLabel (FoodWerx Standard) – qty"
// used everywhere else so parseServicewareLines() in print pages stays compatible.

function toBulletLine(printLabel: string, qty: number | null): string | null {
  if (!qty || qty <= 0) return null;
  return `\u2022 ${printLabel} (FoodWerx Standard) \u2013 ${qty}`;
}

function parseBulletLines(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const line of (text || "").split(/\n/).filter(Boolean)) {
    const bullet = (line.startsWith("\u2022") ? line.slice(1) : line).trim();
    if (!bullet) continue;
    const parenStart = bullet.indexOf("(");
    const itemName = parenStart >= 0 ? bullet.slice(0, parenStart).trim() : bullet;
    const rest = parenStart >= 0 ? bullet.slice(bullet.indexOf(")") + 1).trim() : "";
    const dashMatch = rest.match(/[\u2013\-]\s*(\d+)/);
    const qty = dashMatch ? parseInt(dashMatch[1], 10) : 0;
    if (itemName && qty > 0) out[itemName.toLowerCase()] = qty;
  }
  return out;
}

function mapPaperFromSaved(saved: Record<string, number>, rows: PaperRowDef[]): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const row of rows) out[row.key] = saved[row.printLabel.toLowerCase()] ?? null;
  return out;
}

function mapBevFromSaved(saved: Record<string, number>): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const row of BEV_ROWS) {
    if (row.choices?.length) {
      const base = row.printLabel.toLowerCase();
      let qty: number | null = null;
      for (const [k, v] of Object.entries(saved)) {
        if (
          k === base ||
          k.startsWith(base + BEV_FLAVOR_SEP) ||
          k.startsWith(base + " — ") ||
          k.startsWith(base + " - ")
        ) {
          qty = v;
          break;
        }
      }
      out[row.key] = qty;
    } else {
      out[row.key] = saved[row.printLabel.toLowerCase()] ?? null;
    }
  }
  return out;
}

function mapBevChoicesFromSaved(saved: Record<string, number>): Record<string, string> {
  const choices = getDefaultBevChoices();
  for (const row of BEV_ROWS) {
    if (!row.choices?.length) continue;
    const base = row.printLabel.toLowerCase();
    const seps = [BEV_FLAVOR_SEP, " — ", " - "];
    outer: for (const k of Object.keys(saved)) {
      if (k === base) {
        choices[row.key] = row.choices[0];
        break;
      }
      for (const sep of seps) {
        if (k.startsWith(base + sep)) {
          const rest = k.slice((base + sep).length).trim();
          const match = row.choices.find((c) => c.toLowerCase() === rest.toLowerCase());
          choices[row.key] = match ?? rest;
          break outer;
        }
      }
    }
  }
  return choices;
}

const GUEST_COUNT_BUFFER = 15;

function autoFillPaperQtys(guestCount: number, hasCoffee = false): Record<string, number | null> {
  const n = Math.max(0, guestCount) + GUEST_COUNT_BUFFER;
  return {
    bowls: null,
    small_plates: n,
    large_plates: n,
    forks: n,
    teaspoons: Math.ceil(n * 0.25),
    knives: n,
    coffee_cups: hasCoffee ? n : null,
    dinner_napkins: Math.round(n * 1.5),
    tongs: null,
    serving_spoons: null,
    chafer_racks: null,
    water_pans: null,
    sternos: null,
    roll_ups: null,
    table_covers: null,
  };
}

type DeliveryPaperProductsSectionProps = {
  embedded?: boolean;
  sectionId?: string;
};

export const DeliveryPaperProductsSection = ({
  embedded = false,
  sectionId = "beo-section-delivery-paper",
}: DeliveryPaperProductsSectionProps) => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();

  const [paperNeeded, setPaperNeeded]             = useState<"yes" | "no">("no");
  const [beveragesIncluded, setBeveragesIncluded] = useState<"yes" | "no">("no");
  const [paperQtys, setPaperQtys]                 = useState<Record<string, number | null>>({});
  const [bevQtys, setBevQtys]                     = useState<Record<string, number | null>>({});
  const [bevChoices, setBevChoices]               = useState<Record<string, string>>(() => getDefaultBevChoices());
  const [showHotEquipment, setShowHotEquipment]   = useState(false);
  const [showOptional, setShowOptional]           = useState<Record<string, boolean>>({});

  const hasLoadedRef = useRef(false);
  const skipLoadRef  = useRef(false);

  const guestCount = selectedEventData?.[FIELD_IDS.GUEST_COUNT] != null
    ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT])
    : 0;

  // Load from Airtable
  const loadFromAirtable = useCallback(() => {
    if (!selectedEventId || !selectedEventData) {
      setPaperNeeded("no");
      setBeveragesIncluded("no");
      setPaperQtys({});
      setBevQtys({});
      setBevChoices(getDefaultBevChoices());
      hasLoadedRef.current = false;
      return;
    }
    if (skipLoadRef.current) { skipLoadRef.current = false; return; }

    const combined: Record<string, number> = {};
    for (const fid of [FIELD_IDS.PLATES_LIST, FIELD_IDS.CUTLERY_LIST, FIELD_IDS.GLASSWARE_LIST]) {
      Object.assign(combined, parseBulletLines(asString(selectedEventData[fid])));
    }
    const allPaperRows = [...PAPER_ROWS, ...HOT_ROWS, ...EXTRAS_ROWS];
    const loadedPaper  = mapPaperFromSaved(combined, allPaperRows);
    setPaperQtys(loadedPaper);

    if (HOT_ROWS.some((r) => (loadedPaper[r.key] ?? 0) > 0)) setShowHotEquipment(true);

    const revealed: Record<string, boolean> = {};
    for (const row of [...PAPER_ROWS, ...EXTRAS_ROWS].filter((r) => r.optional)) {
      if ((loadedPaper[row.key] ?? 0) > 0) revealed[row.key] = true;
    }
    setShowOptional(revealed);

    const src      = asSingleSelectName(selectedEventData[FIELD_IDS.SERVICEWARE_SOURCE]);
    const hasItems = allPaperRows.some((r) => (loadedPaper[r.key] ?? 0) > 0);
    setPaperNeeded(src === "FoodWerx" || src === "Mixed" || hasItems ? "yes" : "no");

    const bevSaved  = parseBulletLines(asString(selectedEventData[FIELD_IDS.SERVICEWARE_NOTES]));
    const loadedBev = mapBevFromSaved(bevSaved);
    setBevQtys(loadedBev);
    setBevChoices(mapBevChoicesFromSaved(bevSaved));
    setBeveragesIncluded(BEV_ROWS.some((r) => (loadedBev[r.key] ?? 0) > 0) ? "yes" : "no");

    hasLoadedRef.current = true;
  }, [selectedEventId, selectedEventData]);

  // Save to Airtable
  const saveToAirtable = useCallback(
    async (
      needed: "yes" | "no",
          bevIncluded: "yes" | "no",
      qtys: Record<string, number | null>,
      bev: Record<string, number | null>,
      bevChoiceMap: Record<string, string>,
    ) => {
      if (!selectedEventId) return;
      skipLoadRef.current = true;

      const plates: string[]    = [];
      const cutlery: string[]   = [];
      const glassware: string[] = [];

      if (needed === "yes") {
        for (const row of [...PAPER_ROWS, ...HOT_ROWS, ...EXTRAS_ROWS]) {
          const line = toBulletLine(row.printLabel, qtys[row.key] ?? null);
          if (!line) continue;
          if (row.group === "plates")         plates.push(line);
          else if (row.group === "glassware") glassware.push(line);
          else                                cutlery.push(line);
        }
      }

      const bevLines: string[] = [];
      if (bevIncluded === "yes") {
        for (const row of BEV_ROWS) {
          const line = toBulletLine(row.printLabel, bev[row.key] ?? null);
          if (line) bevLines.push(line);
        }
      }

      await setFields(selectedEventId, {
        [FIELD_IDS.PLATES_LIST]:       plates.join("\n")    || null,
        [FIELD_IDS.CUTLERY_LIST]:      cutlery.join("\n")   || null,
        [FIELD_IDS.GLASSWARE_LIST]:    glassware.join("\n") || null,
        [FIELD_IDS.SERVICEWARE_NOTES]: bevLines.join("\n")  || null,
        [FIELD_IDS.SERVICEWARE_SOURCE]: needed === "yes" ? "FoodWerx" : "Client",
      });
    },
    [selectedEventId, setFields],
  );

  useEffect(() => { loadFromAirtable(); }, [loadFromAirtable]);

  // Debounced auto-save on any value change
  useEffect(() => {
    if (!selectedEventId || !hasLoadedRef.current) return;
    const t = setTimeout(() => saveToAirtable(paperNeeded, beveragesIncluded, paperQtys, bevQtys, bevChoices), 600);
    return () => clearTimeout(t);
  }, [selectedEventId, paperNeeded, beveragesIncluded, paperQtys, bevQtys, bevChoices, saveToAirtable]);

  // Auto-count coffee cups + add Coffee Setup when coffee boxes are entered
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const hasCoffee = (bevQtys.coffee_reg ?? 0) > 0 || (bevQtys.coffee_dec ?? 0) > 0;
    if (!hasCoffee) return;
    const n = Math.max(0, guestCount) + GUEST_COUNT_BUFFER;
    // Reveal and fill coffee cups if not already set
    setPaperQtys((prev) => (prev.coffee_cups ? prev : { ...prev, coffee_cups: n }));
    setShowOptional((prev) => ({ ...prev, coffee_cups: true }));
    // Auto-add Coffee Setup (qty 1) if not already set
    setBevQtys((prev) => (prev.coffee_setup ? prev : { ...prev, coffee_setup: 1 }));
  }, [bevQtys.coffee_reg, bevQtys.coffee_dec, guestCount]);

  const updatePaper = (key: string, qty: number | null) =>
    setPaperQtys((prev) => ({ ...prev, [key]: qty }));

  const updateBev = (key: string, qty: number | null) =>
    setBevQtys((prev) => ({ ...prev, [key]: qty }));

  const toggleOptional = (key: string) =>
    setShowOptional((prev) => ({ ...prev, [key]: !prev[key] }));

  const allPaperRowKeys = [...PAPER_ROWS, ...HOT_ROWS, ...EXTRAS_ROWS].map((r) => r.key);

  const clearPaperSection = () => {
    setPaperQtys((prev) => {
      const next = { ...prev };
      for (const key of allPaperRowKeys) next[key] = null;
      return next;
    });
    setShowHotEquipment(false);
    setShowOptional({});
  };

  const clearBeveragesSection = () => {
    setBevQtys({});
  };

  // Styles
  const qtyInput: React.CSSProperties = {
    width: 60,
    padding: "5px 6px",
    borderRadius: 5,
    border: "1px solid rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.3)",
    color: "#e0e0e0",
    fontSize: 13,
    textAlign: "center",
    fontWeight: 600,
    flexShrink: 0,
  };

  /** Multi-column grid so paper / bev lists stay compact vertically */
  const itemGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))",
    gap: 8,
    width: "100%",
  };

  const rowSt: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 8px",
    gap: 8,
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.2)",
    minWidth: 0,
  };

  const rowLbl: React.CSSProperties = {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: 500,
    flex: 1,
    minWidth: 0,
    lineHeight: 1.25,
  };

  const subHead = (color = "#22c55e"): React.CSSProperties => ({
    fontSize: 10,
    fontWeight: 700,
    color,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    paddingBottom: 4,
    borderBottom: `1px solid ${color}44`,
    marginBottom: 4,
    marginTop: 10,
    display: "block",
  });

  const panel: React.CSSProperties = {
    flex: "1 1 260px",
    minWidth: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 8,
    padding: "12px 14px",
    border: "1px solid rgba(34,197,94,0.2)",
  };

  const ynBtn = (active: boolean, col = "#22c55e"): React.CSSProperties => ({
    padding: "4px 14px",
    borderRadius: 20,
    border: `1px solid ${active ? col : "rgba(255,255,255,0.15)"}`,
    backgroundColor: active ? `${col}22` : "transparent",
    color: active ? col : "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.5px",
  });

  const chip = (active: boolean): React.CSSProperties => ({
    fontSize: 11,
    color: active ? "#22c55e" : "#6b7280",
    cursor: "pointer",
    padding: "2px 8px",
    borderRadius: 4,
    border: `1px dashed ${active ? "#22c55e" : "#555"}`,
    background: "none",
  });

  const sectionClearBtn = (accent: "green" | "blue"): React.CSSProperties => ({
    padding: "4px 10px",
    borderRadius: 6,
    border: `1px solid ${accent === "green" ? "rgba(34,197,94,0.35)" : "rgba(59,130,246,0.35)"}`,
    backgroundColor: "transparent",
    color: accent === "green" ? "rgba(34,197,94,0.85)" : "rgba(96,165,250,0.9)",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  });

  const renderPaperRow = (row: PaperRowDef) => {
    if (row.optional && !showOptional[row.key]) return null;
    return (
      <div key={row.key} style={rowSt}>
        <span style={rowLbl}>{row.label}</span>
        <input
          type="number"
          min="0"
          value={paperQtys[row.key] ?? ""}
          onChange={(e) => updatePaper(row.key, e.target.value ? parseInt(e.target.value, 10) : null)}
          placeholder="--"
          style={qtyInput}
        />
      </div>
    );
  };

  const bevSelectStyle: React.CSSProperties = {
    flex: "1 1 120px",
    minWidth: 100,
    padding: "5px 6px",
    borderRadius: 5,
    border: "1px solid rgba(59,130,246,0.35)",
    backgroundColor: "rgba(0,0,0,0.35)",
    color: "#e0e0e0",
    fontSize: 12,
  };

  const renderBevRow = (row: BevRowDef) => {
    const qIn = { ...qtyInput, borderColor: "rgba(59,130,246,0.3)" };
    if (row.choices?.length) {
      const flavor = bevChoices[row.key] ?? row.choices[0];
      return (
        <div key={row.key} style={{ ...rowSt, flexDirection: "column", alignItems: "stretch", gap: 6 }}>
          <span style={{ ...rowLbl, fontWeight: 600 }}>{row.label}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <label style={{ fontSize: 10, color: "#888", flexShrink: 0 }}>Flavor</label>
            <select
              value={flavor}
              onChange={(e) => setBevChoices((prev) => ({ ...prev, [row.key]: e.target.value }))}
              style={bevSelectStyle}
            >
              {row.choices.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              value={bevQtys[row.key] ?? ""}
              onChange={(e) => updateBev(row.key, e.target.value ? parseInt(e.target.value, 10) : null)}
              placeholder="--"
              style={qIn}
            />
          </div>
        </div>
      );
    }
    return (
      <div key={row.key} style={rowSt}>
        <span style={rowLbl}>{row.label}</span>
        <input
          type="number"
          min="0"
          value={bevQtys[row.key] ?? ""}
          onChange={(e) => updateBev(row.key, e.target.value ? parseInt(e.target.value, 10) : null)}
          placeholder="--"
          style={qIn}
        />
      </div>
    );
  };

  const content = (
    <div style={{ gridColumn: "1 / -1" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => {
            const hasCoffee = (bevQtys.coffee_reg ?? 0) > 0 || (bevQtys.coffee_dec ?? 0) > 0;
            setPaperQtys(autoFillPaperQtys(guestCount, hasCoffee));
            setPaperNeeded("yes");
            if (hasCoffee) setShowOptional((prev) => ({ ...prev, coffee_cups: true }));
          }}
          style={{
            padding: "7px 14px",
            borderRadius: 7,
            border: "2px solid #22c55e",
            backgroundColor: "rgba(34,197,94,0.1)",
            color: "#22c55e",
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Auto-fill for {guestCount || "?"} guests
        </button>
        <button
          type="button"
          onClick={() => { setPaperQtys({}); setBevQtys({}); setBevChoices(getDefaultBevChoices()); setPaperNeeded("no"); setBeveragesIncluded("no"); }}
          style={{
            padding: "7px 12px",
            borderRadius: 7,
            border: "1px solid rgba(255,255,255,0.12)",
            backgroundColor: "transparent",
            color: "rgba(255,255,255,0.35)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Clear all
        </button>
      </div>

      {/* Two-panel layout matching the printed BEO left/right columns */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>

        {/* LEFT: Paper Products */}
        <div style={panel}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10, flexWrap: "wrap", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#999", fontWeight: 700, letterSpacing: "0.5px" }}>PAPER PRODUCTS:</span>
              <button type="button" style={ynBtn(paperNeeded === "yes")} onClick={() => setPaperNeeded("yes")}>YES</button>
              <button type="button" style={ynBtn(paperNeeded === "no")}  onClick={() => setPaperNeeded("no")}>NO</button>
            </div>
            {paperNeeded === "yes" && (
              <button type="button" style={sectionClearBtn("green")} onClick={clearPaperSection}>
                Clear
              </button>
            )}
          </div>

          {paperNeeded === "yes" && (
            <>
              {/* Always-visible rows */}
              <div style={itemGrid}>
                {PAPER_ROWS.filter((r) => !r.optional).map(renderPaperRow)}
              </div>

              {/* Optional add-on chips (not filled by auto-fill) */}
              <div style={{ display: "flex", gap: 6, marginTop: 8, marginBottom: 2, flexWrap: "wrap" }}>
                {PAPER_ROWS.filter((r) => r.optional).map((row) => (
                  <button key={row.key} type="button" style={chip(!!showOptional[row.key])} onClick={() => toggleOptional(row.key)}>
                    {showOptional[row.key] ? "-" : "+"} {row.label}
                  </button>
                ))}
              </div>
              <div style={itemGrid}>
                {PAPER_ROWS.filter((r) => r.optional).map(renderPaperRow)}
              </div>

              {/* Hot Food Equipment */}
              <button
                type="button"
                onClick={() => setShowHotEquipment((p) => !p)}
                style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "6px 0 0" }}
              >
                <span style={subHead(showHotEquipment ? "#f97316" : "#6b7280")}>
                  Hot food equipment {showHotEquipment ? "v" : ">"}
                </span>
              </button>
              {showHotEquipment && (
                <div style={itemGrid}>
                  {HOT_ROWS.map(renderPaperRow)}
                </div>
              )}

              {/* Extras */}
              <span style={subHead()}>Extras</span>
              <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                {EXTRAS_ROWS.map((row) => (
                  <button key={row.key} type="button" style={chip(!!showOptional[row.key])} onClick={() => toggleOptional(row.key)}>
                    {showOptional[row.key] ? "-" : "+"} {row.label}
                  </button>
                ))}
              </div>
              <div style={itemGrid}>
                {EXTRAS_ROWS.map(renderPaperRow)}
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Beverages */}
        <div style={{ ...panel, border: "1px solid rgba(59,130,246,0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10, flexWrap: "wrap", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#999", fontWeight: 700, letterSpacing: "0.5px" }}>BEVERAGES:</span>
              <button type="button" style={ynBtn(beveragesIncluded === "yes", "#3b82f6")} onClick={() => setBeveragesIncluded("yes")}>YES</button>
              <button type="button" style={ynBtn(beveragesIncluded === "no")}             onClick={() => setBeveragesIncluded("no")}>NO</button>
            </div>
            {beveragesIncluded === "yes" && (
              <button type="button" style={sectionClearBtn("blue")} onClick={clearBeveragesSection}>
                Clear
              </button>
            )}
          </div>

          {beveragesIncluded === "yes"
            ? (
              <div style={itemGrid}>
                {BEV_ROWS.map(renderBevRow)}
              </div>
            )
            : (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", padding: "8px 0", fontStyle: "italic" }}>
                Toggle YES to add beverages (OJ, coffee, infused water, soda, etc.)
              </div>
            )
          }
        </div>

      </div>
    </div>
  );

  return embedded ? content : (
    <FormSection
      title="Paper Products & Beverages"
      subtitle="Disposables, utensils & delivery beverages — printed BEO block"
      dotColor="#22c55e"
      isDelivery
      sectionId={sectionId}
      titleAlign="center"
    >
      {content}
    </FormSection>
  );
};
