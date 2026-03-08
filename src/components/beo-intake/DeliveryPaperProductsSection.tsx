import { useEffect, useState, useCallback, useRef } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString, asSingleSelectName } from "../../services/airtable/selectors";
import { FormSection } from "./FormSection";

type DeliveryItem = {
  id: string;
  item: string;
  supplier: string;
  qty: number | null;
};

function formatLine(item: DeliveryItem): string {
  if (!item.item.trim()) return "";
  const hasQty = item.qty !== null && item.qty !== undefined && String(item.qty).trim() !== "";
  const suffix = hasQty ? ` – ${item.qty}` : "";
  return `• ${item.item.trim()} (${item.supplier})${suffix}`;
}

function parseLines(text: string): DeliveryItem[] {
  const lines = (text || "").split(/\n/).filter(Boolean);
  const items: DeliveryItem[] = [];
  for (const line of lines) {
    const bullet = (line.startsWith("•") ? line.slice(1) : line).trim();
    if (!bullet) continue;
    const parenStart = bullet.indexOf("(");
    const parenEnd = bullet.indexOf(")");
    if (parenStart >= 0 && parenEnd > parenStart) {
      const itemName = bullet.slice(0, parenStart).trim();
      const supplier = bullet.slice(parenStart + 1, parenEnd).trim();
      const rest = bullet.slice(parenEnd + 1).trim();
      const dashMatch = rest.match(/[–\-]\s*(.+)/);
      const qtyStr = dashMatch ? dashMatch[1].replace("Provided by host", "").trim() : "";
      const qty = qtyStr ? (parseInt(qtyStr, 10) || null) : null;
      items.push({ id: `dp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, item: itemName, supplier, qty });
    }
  }
  return items;
}

function generateId() {
  return `dp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const GUEST_COUNT_BUFFER = 15;

function autoFillDeliveryPaper(guestCount: number): DeliveryItem[] {
  const count = Math.max(0, Number(guestCount) || 0) + GUEST_COUNT_BUFFER;
  const appetizerQty = count * 2;
  return [
    { id: generateId(), item: "Small Plates – Standard (app + dessert)", supplier: "FoodWerx Standard", qty: appetizerQty },
    { id: generateId(), item: "Large Plates – Standard (dinner)", supplier: "FoodWerx Standard", qty: count },
    { id: generateId(), item: "Forks – Standard", supplier: "FoodWerx Standard", qty: count },
    { id: generateId(), item: "Knives – Standard", supplier: "FoodWerx Standard", qty: count },
    { id: generateId(), item: "Spoons – Standard", supplier: "FoodWerx Standard", qty: count },
    { id: generateId(), item: "FW Napkins – Standard", supplier: "FoodWerx Standard", qty: count },
    { id: generateId(), item: "Cocktail Napkins – Standard", supplier: "FoodWerx Standard", qty: count },
    { id: generateId(), item: "Large Cups – Standard", supplier: "FoodWerx Standard", qty: count },
    { id: generateId(), item: "Small Cups – Standard", supplier: "FoodWerx Standard", qty: count },
  ];
}

const DEFAULT_UTENSILS: { item: string; qty: number }[] = [
  { item: "Plastic Tongs", qty: 3 },
  { item: "Serving Spoons", qty: 2 },
  { item: "Wire Chafing Frame w/ Water Pan", qty: 1 },
  { item: "Sternos", qty: 4 },
  { item: "Roll Ups (napkin/utensil)", qty: 0 },
];

type DeliveryPaperProductsSectionProps = { embedded?: boolean };

export const DeliveryPaperProductsSection = ({ embedded = false }: DeliveryPaperProductsSectionProps) => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [paperNeeded, setPaperNeeded] = useState<"yes" | "no">("no");
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const hasLoadedRef = useRef(false);
  const skipLoadRef = useRef(false);

  const guestCount = selectedEventData?.[FIELD_IDS.GUEST_COUNT] != null
    ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT])
    : 0;

  const loadFromAirtable = useCallback(() => {
    if (!selectedEventId || !selectedEventData) {
      setPaperNeeded("no");
      setItems([]);
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
    const combined = [platesRaw, cutleryRaw, glasswareRaw].filter(Boolean).join("\n");
    const parsed = parseLines(combined);
    const src = asSingleSelectName(selectedEventData[FIELD_IDS.SERVICEWARE_SOURCE]);
    const needed = src === "FoodWerx" || src === "Mixed" || parsed.length > 0 ? "yes" : "no";
    setPaperNeeded(needed);
    setItems(parsed.length > 0 ? parsed : []);
    hasLoadedRef.current = true;
  }, [selectedEventId, selectedEventData]);

  const saveToAirtable = useCallback(
    async (needed: "yes" | "no", itemsData: DeliveryItem[]) => {
      if (!selectedEventId) return;
      skipLoadRef.current = true;
      const plates: DeliveryItem[] = [];
      const cutlery: DeliveryItem[] = [];
      const glassware: DeliveryItem[] = [];
      const plateKeywords = ["plate", "bowl"];
      const glassKeywords = ["cup", "glass"];
      for (const it of itemsData) {
        const lower = it.item.toLowerCase();
        if (plateKeywords.some((k) => lower.includes(k))) plates.push(it);
        else if (glassKeywords.some((k) => lower.includes(k))) glassware.push(it);
        else cutlery.push(it);
      }
      const platesStr = needed === "yes" ? plates.map(formatLine).filter(Boolean).join("\n") : "";
      const cutleryStr = needed === "yes" ? cutlery.map(formatLine).filter(Boolean).join("\n") : "";
      const glasswareStr = needed === "yes" ? glassware.map(formatLine).filter(Boolean).join("\n") : "";
      const source = needed === "yes" ? "FoodWerx" : "Client";
      await setFields(selectedEventId, {
        [FIELD_IDS.PLATES_LIST]: platesStr || null,
        [FIELD_IDS.CUTLERY_LIST]: cutleryStr || null,
        [FIELD_IDS.GLASSWARE_LIST]: glasswareStr || null,
        [FIELD_IDS.SERVICEWARE_SOURCE]: source,
      });
    },
    [selectedEventId, setFields]
  );

  useEffect(() => {
    loadFromAirtable();
  }, [loadFromAirtable]);

  useEffect(() => {
    if (!selectedEventId || !hasLoadedRef.current) return;
    const t = setTimeout(() => {
      saveToAirtable(paperNeeded, items);
    }, 600);
    return () => clearTimeout(t);
  }, [selectedEventId, paperNeeded, items, saveToAirtable]);

  const handleAutoFill = () => {
    const filled = autoFillDeliveryPaper(guestCount);
    const utensils = DEFAULT_UTENSILS.map((u) => ({
      id: generateId(),
      item: u.item,
      supplier: "FoodWerx Standard",
      qty: u.qty > 0 ? u.qty : guestCount + GUEST_COUNT_BUFFER,
    }));
    setItems([...filled, ...utensils]);
    setPaperNeeded("yes");
  };

  const updateItem = (id: string, updates: Partial<DeliveryItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: generateId(), item: "", supplier: "FoodWerx Standard", qty: null },
    ]);
  };

  const inputStyle = {
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #444",
    backgroundColor: "#1a1a1a",
    color: "#e0e0e0",
    fontSize: "13px",
    minWidth: 0,
  };

  const labelStyle = {
    display: "block" as const,
    fontSize: "11px",
    color: "#999",
    marginBottom: "6px",
    fontWeight: "600" as const,
  };

  const buttonStyle = {
    padding: "10px 16px",
    border: "2px solid #22c55e",
    borderRadius: "8px",
    backgroundColor: "transparent",
    color: "#22c55e",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: 600,
  };

  const content = (
    <div style={{ gridColumn: "1 / -1" }}>
      <label style={labelStyle}>Paper Products Needed?</label>
      <div style={{ display: "flex", gap: 32, marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="radio"
            name="paperNeeded"
            checked={paperNeeded === "yes"}
            onChange={() => {
              setPaperNeeded("yes");
              if (items.length === 0) handleAutoFill();
            }}
          />
          <span style={{ color: "#e0e0e0" }}>Yes</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="radio"
            name="paperNeeded"
            checked={paperNeeded === "no"}
            onChange={() => {
              setPaperNeeded("no");
              setItems([]);
            }}
          />
          <span style={{ color: "#e0e0e0" }}>No (Client provides)</span>
        </label>
      </div>

      {paperNeeded === "yes" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <button type="button" onClick={handleAutoFill} style={buttonStyle}>
              Auto-fill for {guestCount} guests
            </button>
            <button type="button" onClick={addItem} style={{ ...buttonStyle, borderColor: "#22c55e", color: "#22c55e" }}>
              + Add Item
            </button>
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {items.map((it) => (
              <div
                key={it.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px 80px 36px",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <input
                  type="text"
                  value={it.item}
                  onChange={(e) => updateItem(it.id, { item: e.target.value })}
                  placeholder="Item name"
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={it.supplier}
                  onChange={(e) => updateItem(it.id, { supplier: e.target.value })}
                  placeholder="Supplier"
                  style={inputStyle}
                />
                <input
                  type="number"
                  value={it.qty ?? ""}
                  onChange={(e) => updateItem(it.id, { qty: e.target.value ? parseInt(e.target.value, 10) : null })}
                  placeholder="Qty"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return embedded ? content : (
    <FormSection title="Paper Products & Utensils" dotColor="#22c55e" isDelivery>
      {content}
    </FormSection>
  );
};
