import { useEffect, useState, useCallback, useRef } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString, asSingleSelectName, asLinkedRecordIds } from "../../services/airtable/selectors";
import { FormSection, CollapsibleSubsection } from "./FormSection";

const SUPPLIER_OPTIONS = [
  "FoodWerx Standard",
  "FoodWerx Premium",
  "FoodWerx China",
  "Ocean Rentals",
  "Client",
  "Venue",
] as const;

type ServicewareItem = {
  id: string;
  item: string;
  supplier: string;
  qty: number | null;
};

function formatLine(item: ServicewareItem): string {
  if (!item.item.trim()) return "";
  const isClient = item.supplier === "Client";
  const hasQty = item.qty !== null && item.qty !== undefined && String(item.qty).trim() !== "";
  const suffix = isClient && !hasQty ? " – Provided by host" : hasQty ? ` – ${item.qty}` : "";
  if (!isClient && !hasQty) return ""; // Skip non-Client items with no qty
  return `• ${item.item.trim()} (${item.supplier})${suffix}`;
}

function parseLines(text: string): ServicewareItem[] {
  const lines = text.split(/\n/).filter(Boolean);
  const items: ServicewareItem[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const bullet = line.startsWith("•") ? line.slice(1).trim() : line;
    const parenStart = bullet.indexOf("(");
    const parenEnd = bullet.indexOf(")");
    if (parenStart >= 0 && parenEnd > parenStart) {
      const itemName = bullet.slice(0, parenStart).trim();
      const supplier = bullet.slice(parenStart + 1, parenEnd).trim();
      const rest = bullet.slice(parenEnd + 1).trim();
      const dashIdx = rest.search(/[–\-]\s*/);
      const qtyStr = dashIdx >= 0 ? rest.slice(dashIdx).replace(/^[–\-]\s*/, "").trim() : "";
      const qty = qtyStr === "Provided by host" || !qtyStr ? null : (parseInt(qtyStr, 10) || null);
      items.push({ id: generateId(), item: itemName, supplier, qty });
    }
  }
  return items;
}

function generateId() {
  return `sw-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const SERVICEWARE_SOURCE_OPTIONS = ["FoodWerx", "Client", "Rentals", "Mixed"] as const;
const PAPER_TYPE_OPTIONS = ["Standard Paper", "Premium Paper", "China"] as const;

const GUEST_COUNT_BUFFER = 15;

function autoFillServiceware(
  paperType: string,
  guestCount: number,
  hasAppetizersAndDesserts: boolean,
  carafesPerTable: number
): { plates: ServicewareItem[]; cutlery: ServicewareItem[]; glassware: ServicewareItem[] } {
  const count = Math.max(0, Number(guestCount) || 0) + GUEST_COUNT_BUFFER;
  const appetizerQty = hasAppetizersAndDesserts ? count * 2 : count;
  const tables = Math.max(1, Math.ceil(count / 8));
  const carafePlates = Math.max(0, Number(carafesPerTable) || 0) * tables;
  const bAndBQty = appetizerQty + carafePlates;

  const withIds = <T extends { item: string; supplier: string; qty: number | null }>(arr: T[]) =>
    arr.map((row) => ({ ...row, id: generateId() }));

  switch (paperType) {
    case "Standard Paper":
    case "Standard":
      return {
        plates: withIds([
          { item: "Small Plates – Standard (app + dessert)", supplier: "FoodWerx Standard", qty: appetizerQty },
          { item: "Large Plates – Standard (dinner)", supplier: "FoodWerx Standard", qty: count },
        ]),
        cutlery: withIds([
          { item: "Forks – Standard", supplier: "FoodWerx Standard", qty: count },
          { item: "Knives – Standard", supplier: "FoodWerx Standard", qty: count },
          { item: "Spoons – Standard", supplier: "FoodWerx Standard", qty: count },
          { item: "FW Napkins – Standard", supplier: "FoodWerx Standard", qty: count },
          { item: "Cocktail Napkins – Standard", supplier: "FoodWerx Standard", qty: count },
        ]),
        glassware: withIds([
          { item: "Large Cups – Standard", supplier: "FoodWerx Standard", qty: count },
          { item: "Small Cups – Standard", supplier: "FoodWerx Standard", qty: count },
        ]),
      };

    case "Premium Paper":
    case "Premium":
      return {
        plates: withIds([
          { item: "Small Plates – Premium (app + dessert)", supplier: "FoodWerx Premium", qty: appetizerQty },
          { item: "Large Plates – Premium (dinner)", supplier: "FoodWerx Premium", qty: count },
        ]),
        cutlery: withIds([
          { item: "Forks – Premium", supplier: "FoodWerx Premium", qty: count },
          { item: "Knives – Premium", supplier: "FoodWerx Premium", qty: count },
          { item: "Spoons – Premium", supplier: "FoodWerx Premium", qty: count },
          { item: "FW Napkins – Premium", supplier: "FoodWerx Premium", qty: count },
          { item: "Cocktail Napkins – Premium", supplier: "FoodWerx Premium", qty: count },
        ]),
        glassware: withIds([
          { item: "Large Cups – Premium", supplier: "FoodWerx Premium", qty: count },
          { item: "Small Cups – Premium", supplier: "FoodWerx Premium", qty: count },
        ]),
      };

    case "China":
      const sAndPDefault = Math.ceil(count / 10);
      const breadBasketsDefault = Math.ceil(count / 8);
      return {
        plates: withIds([
          { item: "B&B Plates (app + dessert, carafes, at seat)", supplier: "FoodWerx China", qty: bAndBQty },
          { item: "Salad Plates", supplier: "FoodWerx China", qty: count },
          { item: "Dinner Plates", supplier: "FoodWerx China", qty: count },
          { item: "S&P Shakers", supplier: "FoodWerx China", qty: sAndPDefault },
          { item: "Bread Baskets", supplier: "FoodWerx China", qty: breadBasketsDefault },
        ]),
        cutlery: withIds([
          { item: "Dinner Forks", supplier: "FoodWerx China", qty: count },
          { item: "Salad Forks", supplier: "FoodWerx China", qty: count },
          { item: "Knives", supplier: "FoodWerx China", qty: count },
          { item: "Spoons", supplier: "FoodWerx China", qty: count },
        ]),
        glassware: withIds([
          { item: "All-Purpose Glasses", supplier: "FoodWerx China", qty: count },
          { item: "Wine Glasses", supplier: "FoodWerx China", qty: count },
          { item: "Champagne Flutes", supplier: "FoodWerx China", qty: Math.ceil(count * 0.3) },
        ]),
      };

    default:
      return { plates: [], cutlery: [], glassware: [] };
  }
}

type ItemRowProps = {
  item: ServicewareItem;
  onUpdate: (id: string, updates: Partial<ServicewareItem>) => void;
  onRemove: (id: string) => void;
  onBlur: () => void;
  canEdit: boolean;
};

function ItemRow({ item, onUpdate, onRemove, onBlur, canEdit }: ItemRowProps) {
  const inputStyle = {
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #444",
    backgroundColor: "#1a1a1a",
    color: "#e0e0e0",
    fontSize: "13px",
    minWidth: 0,
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 140px 80px 36px",
        gap: "8px",
        alignItems: "center",
        marginBottom: "8px",
      }}
    >
      <input
        type="text"
        value={item.item}
        disabled={!canEdit}
        onChange={(e) => onUpdate(item.id, { item: e.target.value })}
        onBlur={onBlur}
        style={inputStyle}
        placeholder="Item name"
      />
      <select
        value={item.supplier}
        disabled={!canEdit}
        onChange={(e) => onUpdate(item.id, { supplier: e.target.value })}
        onBlur={onBlur}
        style={inputStyle}
      >
        {SUPPLIER_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <input
        type="text"
        inputMode="numeric"
        value={item.qty === null ? "" : String(item.qty)}
        disabled={!canEdit}
        onChange={(e) => {
          const v = e.target.value.trim();
          onUpdate(item.id, { qty: v === "" ? null : (parseInt(v, 10) || null) });
        }}
        onBlur={onBlur}
        style={inputStyle}
        placeholder="Qty"
      />
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        disabled={!canEdit}
        style={{
          width: 32,
          height: 32,
          padding: 0,
          borderRadius: "6px",
          border: "1px solid #555",
          background: "#333",
          color: "#ff6b6b",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: canEdit ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ✕
      </button>
    </div>
  );
}

type ServicewareSectionProps = { embedded?: boolean };

export const ServicewareSection = ({ embedded = false }: ServicewareSectionProps) => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [servicewareSource, setServicewareSource] = useState("");
  const [paperType, setPaperType] = useState("");
  const [plates, setPlates] = useState<ServicewareItem[]>([]);
  const [cutlery, setCutlery] = useState<ServicewareItem[]>([]);
  const [glassware, setGlassware] = useState<ServicewareItem[]>([]);
  const [notes, setNotes] = useState("");
  const [carafesPerTable, setCarafesPerTable] = useState<number | "">("");
  const hasLoadedRef = useRef(false);
  const skipLoadRef = useRef(false);

  const guestCount = selectedEventData?.[FIELD_IDS.GUEST_COUNT] != null
    ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT])
    : 0;

  const passedApps = asLinkedRecordIds(selectedEventData?.[FIELD_IDS.PASSED_APPETIZERS]);
  const presentedApps = asLinkedRecordIds(selectedEventData?.[FIELD_IDS.PRESENTED_APPETIZERS]);
  const customPassed = (asString(selectedEventData?.[FIELD_IDS.CUSTOM_PASSED_APP]) || "").trim();
  const customPresented = (asString(selectedEventData?.[FIELD_IDS.CUSTOM_PRESENTED_APP]) || "").trim();
  const desserts = asLinkedRecordIds(selectedEventData?.[FIELD_IDS.DESSERTS]);
  const customDesserts = (asString(selectedEventData?.[FIELD_IDS.CUSTOM_DESSERTS]) || "").trim();
  const hasDesserts = desserts.length > 0 || customDesserts !== "";
  const hasAppetizers = passedApps.length > 0 || presentedApps.length > 0 || customPassed !== "" || customPresented !== "";
  const hasAppetizersAndDesserts = hasAppetizers && hasDesserts;

  const loadFromAirtable = useCallback(() => {
    if (!selectedEventId || !selectedEventData) {
      setServicewareSource("");
      setPaperType("");
      setPlates([]);
      setCutlery([]);
      setGlassware([]);
      setNotes("");
      setCarafesPerTable("");
      hasLoadedRef.current = false;
      return;
    }
    if (skipLoadRef.current) {
      skipLoadRef.current = false;
      return;
    }
    const platesRaw = asString(selectedEventData[FIELD_IDS.PLATES_LIST]);
    const cutleryRaw = asString(selectedEventData[FIELD_IDS.CUTLERY_LIST]);
    const glasswareRaw = asString(selectedEventData[FIELD_IDS.GLASSWARE_LIST]);
    const notesRaw = asString(selectedEventData[FIELD_IDS.SERVICEWARE_NOTES]);
    const src = asSingleSelectName(selectedEventData[FIELD_IDS.SERVICEWARE_SOURCE]);
    const pType = asSingleSelectName(selectedEventData[FIELD_IDS.SERVICEWARE_PAPER_TYPE]);

    setServicewareSource(src);
    setPaperType(pType);
    const carafesRaw = selectedEventData[FIELD_IDS.CARAFES_PER_TABLE];
    const carafesNum = carafesRaw != null && carafesRaw !== "" ? Number(carafesRaw) : NaN;
    const carafesVal = Number.isNaN(carafesNum) ? "" : carafesNum;

    setPlates(parseLines(platesRaw));
    setCutlery(parseLines(cutleryRaw));
    setGlassware(parseLines(glasswareRaw));
    setNotes(notesRaw);
    setCarafesPerTable(carafesVal);
    hasLoadedRef.current = true;
  }, [selectedEventId, selectedEventData]);

  const saveToAirtable = useCallback(
    async (
      platesData: ServicewareItem[],
      cutleryData: ServicewareItem[],
      glasswareData: ServicewareItem[],
      notesData: string,
      carafesData: number | "",
      sourceData: string,
      pTypeData: string
    ) => {
      if (!selectedEventId) return;
      skipLoadRef.current = true;
      const platesStr = platesData.map(formatLine).filter(Boolean).join("\n");
      const cutleryStr = cutleryData.map(formatLine).filter(Boolean).join("\n");
      const glasswareStr = glasswareData.map(formatLine).filter(Boolean).join("\n");
      const patch: Record<string, unknown> = {
        [FIELD_IDS.PLATES_LIST]: platesStr || null,
        [FIELD_IDS.CUTLERY_LIST]: cutleryStr || null,
        [FIELD_IDS.GLASSWARE_LIST]: glasswareStr || null,
        [FIELD_IDS.SERVICEWARE_NOTES]: notesData || null,
        [FIELD_IDS.SERVICEWARE_SOURCE]: sourceData || null,
        [FIELD_IDS.SERVICEWARE_PAPER_TYPE]: pTypeData || null,
      };
      // Only save carafes when the real Airtable field exists (not placeholder)
      if (FIELD_IDS.CARAFES_PER_TABLE !== "fldCarafesPerTableTODO") {
        if (carafesData !== "" && typeof carafesData === "number" && !Number.isNaN(carafesData)) {
          patch[FIELD_IDS.CARAFES_PER_TABLE] = carafesData;
        } else if (carafesData === "") {
          patch[FIELD_IDS.CARAFES_PER_TABLE] = null;
        }
      }
      await setFields(selectedEventId, patch);
    },
    [selectedEventId, setFields]
  );

  useEffect(() => {
    loadFromAirtable();
  }, [loadFromAirtable]);

  // Debounced save when data changes (so "Update Event" / "Print" includes latest)
  useEffect(() => {
    if (!selectedEventId || !hasLoadedRef.current) return;
    const t = setTimeout(() => {
      saveToAirtable(plates, cutlery, glassware, notes, carafesPerTable, servicewareSource, paperType);
    }, 600);
    return () => clearTimeout(t);
  }, [selectedEventId, plates, cutlery, glassware, notes, carafesPerTable, servicewareSource, paperType, saveToAirtable]);

  const updateItem = (
    list: "plates" | "cutlery" | "glassware",
    id: string,
    updates: Partial<ServicewareItem>
  ) => {
    const setter = list === "plates" ? setPlates : list === "cutlery" ? setCutlery : setGlassware;
    setter((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
  };

  const removeItem = (list: "plates" | "cutlery" | "glassware", id: string) => {
    const setter = list === "plates" ? setPlates : list === "cutlery" ? setCutlery : setGlassware;
    setter((prev) => prev.filter((it) => it.id !== id));
  };

  const getDefaultSupplier = () => {
    if (paperType === "Premium Paper" || paperType === "Premium") return "FoodWerx Premium";
    if (paperType === "China") return "FoodWerx China";
    return "FoodWerx Standard";
  };

  const addItem = (list: "plates" | "cutlery" | "glassware") => {
    const newItem: ServicewareItem = {
      id: generateId(),
      item: "",
      supplier: getDefaultSupplier(),
      qty: null,
    };
    const setter = list === "plates" ? setPlates : list === "cutlery" ? setCutlery : setGlassware;
    setter((prev) => [...prev, newItem]);
  };

  const handleBlur = () => {
    saveToAirtable(plates, cutlery, glassware, notes, carafesPerTable, servicewareSource, paperType);
  };

  const canEdit = Boolean(selectedEventId);

  const handleAutoFill = () => {
    const carafes = typeof carafesPerTable === "number" ? carafesPerTable : (parseInt(String(carafesPerTable), 10) || 0);
    const defaults = autoFillServiceware(paperType, guestCount, hasAppetizersAndDesserts, carafes);
    setPlates(defaults.plates);
    setCutlery(defaults.cutlery);
    setGlassware(defaults.glassware);
  };

  const isAutoFillDisabled =
    !canEdit ||
    servicewareSource === "Client" ||
    servicewareSource === "Rentals" ||
    !paperType ||
    !["Standard Paper", "Premium Paper", "China", "Standard", "Premium"].includes(paperType);

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    color: "#999",
    marginBottom: "6px",
    fontWeight: "600" as const,
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #444",
    backgroundColor: "#1a1a1a",
    color: "#e0e0e0",
    fontSize: "14px",
  };

  const addButtonStyle = {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #444",
    background: "rgba(255,107,107,0.15)",
    color: "#ff6b6b",
    fontSize: "12px",
    fontWeight: 600,
    cursor: canEdit ? "pointer" : "default",
    opacity: canEdit ? 1 : 0.6,
  };

  const saveSourceAndPaperType = async (source: string, pType: string) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, {
      [FIELD_IDS.SERVICEWARE_SOURCE]: source || null,
      [FIELD_IDS.SERVICEWARE_PAPER_TYPE]: pType || null,
    });
  };

  const content = (
    <div style={{ gridColumn: "1 / -1" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Serviceware Source</label>
            <select
              value={servicewareSource}
              disabled={!canEdit}
              onChange={(e) => {
                const v = e.target.value;
                setServicewareSource(v);
                saveSourceAndPaperType(v, paperType);
              }}
              style={inputStyle}
            >
              <option value="">Select...</option>
              {SERVICEWARE_SOURCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Paper Type</label>
            <select
              value={paperType}
              disabled={!canEdit}
              onChange={(e) => {
                const v = e.target.value;
                setPaperType(v);
                saveSourceAndPaperType(servicewareSource, v);
              }}
              style={inputStyle}
            >
              <option value="">Select...</option>
              {PAPER_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={handleAutoFill}
            disabled={isAutoFillDisabled}
            style={{
              ...addButtonStyle,
              padding: "10px 20px",
              opacity: isAutoFillDisabled ? 0.5 : 1,
              cursor: isAutoFillDisabled ? "not-allowed" : "pointer",
            }}
          >
            Auto-Fill FoodWerx Defaults
          </button>
          {guestCount > 0 && (
            <span style={{ marginLeft: 12, fontSize: 12, color: "#888" }}>
              ({guestCount} guests)
            </span>
          )}
          {hasAppetizersAndDesserts && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 14px",
                borderRadius: 8,
                backgroundColor: "rgba(34, 197, 94, 0.12)",
                border: "1px solid rgba(34, 197, 94, 0.35)",
                fontSize: 13,
                color: "#22c55e",
                fontWeight: 600,
              }}
            >
              ℹ️ Apps + desserts → small/B&B plates doubled
              {(paperType === "China" || paperType === "china") && " (+ carafes per table in B&B qty)"}
            </div>
          )}
        </div>
        {(paperType === "China" || paperType === "china") && (
          <CollapsibleSubsection title="China Setup (S&P, Bread Baskets, Carafes)" icon="▶" defaultOpen={true}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Carafes per table (for B&B under carafes)</label>
                <input
                  type="number"
                  min={0}
                  value={carafesPerTable === "" ? "" : carafesPerTable}
                  disabled={!canEdit}
                  onChange={(e) => {
                    const v = e.target.value === "" ? "" : parseInt(e.target.value, 10);
                    setCarafesPerTable(v === "" || Number.isNaN(v as number) ? "" : (v as number));
                  }}
                  onBlur={handleBlur}
                  style={inputStyle}
                  placeholder="e.g. 2"
                />
              </div>
              <div>
                <label style={labelStyle}>How many S&P shakers?</label>
                <input
                  type="number"
                  min={0}
                  value={(() => {
                    const item = plates.find((p) => /s&p|salt.*pepper/i.test(p.item));
                    return item?.qty ?? "";
                  })()}
                  disabled={!canEdit}
                  onChange={(e) => {
                    const v = e.target.value === "" ? null : parseInt(e.target.value, 10) || null;
                    const existing = plates.find((p) => /s&p|salt.*pepper/i.test(p.item));
                    if (existing) {
                      updateItem("plates", existing.id, { qty: v });
                    } else {
                      setPlates((prev) => [...prev, { id: generateId(), item: "S&P Shakers", supplier: "FoodWerx China", qty: v }]);
                    }
                  }}
                  onBlur={handleBlur}
                  style={inputStyle}
                  placeholder="e.g. 12"
                />
              </div>
              <div>
                <label style={labelStyle}>How many bread baskets?</label>
                <input
                  type="number"
                  min={0}
                  value={(() => {
                    const item = plates.find((p) => /bread basket/i.test(p.item));
                    return item?.qty ?? "";
                  })()}
                  disabled={!canEdit}
                  onChange={(e) => {
                    const v = e.target.value === "" ? null : parseInt(e.target.value, 10) || null;
                    const existing = plates.find((p) => /bread basket/i.test(p.item));
                    if (existing) {
                      updateItem("plates", existing.id, { qty: v });
                    } else {
                      setPlates((prev) => [...prev, { id: generateId(), item: "Bread Baskets", supplier: "FoodWerx China", qty: v }]);
                    }
                  }}
                  onBlur={handleBlur}
                  style={inputStyle}
                  placeholder="e.g. 15"
                />
              </div>
            </div>
          </CollapsibleSubsection>
        )}
        <CollapsibleSubsection title="Plates" icon="▶" defaultOpen={plates.length > 0}>
          {plates.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onUpdate={(id, u) => updateItem("plates", id, u)}
              onRemove={(id) => removeItem("plates", id)}
              onBlur={handleBlur}
              canEdit={canEdit}
            />
          ))}
          <button
            type="button"
            onClick={() => addItem("plates")}
            disabled={!canEdit}
            onBlur={handleBlur}
            style={addButtonStyle}
          >
            + Add Plate
          </button>
        </CollapsibleSubsection>

        <CollapsibleSubsection title="Cutlery" icon="▶" defaultOpen={cutlery.length > 0}>
          {cutlery.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onUpdate={(id, u) => updateItem("cutlery", id, u)}
              onRemove={(id) => removeItem("cutlery", id)}
              onBlur={handleBlur}
              canEdit={canEdit}
            />
          ))}
          <button
            type="button"
            onClick={() => addItem("cutlery")}
            disabled={!canEdit}
            onBlur={handleBlur}
            style={addButtonStyle}
          >
            + Add Cutlery Item
          </button>
        </CollapsibleSubsection>

        <CollapsibleSubsection title="Glassware" icon="▶" defaultOpen={glassware.length > 0}>
          {glassware.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onUpdate={(id, u) => updateItem("glassware", id, u)}
              onRemove={(id) => removeItem("glassware", id)}
              onBlur={handleBlur}
              canEdit={canEdit}
            />
          ))}
          <button
            type="button"
            onClick={() => addItem("glassware")}
            disabled={!canEdit}
            onBlur={handleBlur}
            style={addButtonStyle}
          >
            + Add Glassware Item
          </button>
        </CollapsibleSubsection>

        <CollapsibleSubsection title="Other Serviceware Notes" icon="▶" defaultOpen={notes.trim() !== ""}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Serviceware Notes</label>
            <textarea
              rows={3}
              value={notes}
              disabled={!canEdit}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => saveToAirtable(plates, cutlery, glassware, notes, carafesPerTable, servicewareSource, paperType)}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
              placeholder="Additional serviceware notes..."
            />
          </div>
        </CollapsibleSubsection>
      </div>
  );

  return embedded ? content : (
    <FormSection title="Paper Products/China - Cutlery - Glassware" dotColor="#a855f7">
      {content}
    </FormSection>
  );
};
