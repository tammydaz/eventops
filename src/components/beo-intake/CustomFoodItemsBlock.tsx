import { useCallback, useEffect, useRef, useState } from "react";

/** One custom food item: name + optional modifier (sauce, dressing, etc.) or notes. */
export type CustomFoodItem = {
  id: string;
  item: string;
  notes: string; // sauce, dressing, modifier, or dietary notes
};

const NOTES_SEP = " – "; // Used to separate item name from notes in stored string

function parseStoredText(text: string): CustomFoodItem[] {
  if (!text?.trim()) return [];
  const lines = text.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  const items: CustomFoodItem[] = [];
  for (const line of lines) {
    const sepIdx = line.indexOf(NOTES_SEP);
    const item = sepIdx >= 0 ? line.slice(0, sepIdx).trim() : line;
    const notes = sepIdx >= 0 ? line.slice(sepIdx + NOTES_SEP.length).trim() : "";
    if (item) {
      items.push({
        id: `cf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        item,
        notes,
      });
    }
  }
  return items;
}

function formatForStorage(items: CustomFoodItem[]): string {
  return items
    .filter((it) => it.item.trim())
    .map((it) => (it.notes.trim() ? `${it.item.trim()}${NOTES_SEP}${it.notes.trim()}` : it.item.trim()))
    .join("\n");
}

function generateId() {
  return `cf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type CustomFoodItemsBlockProps = {
  value: string;
  fieldId: string;
  placeholder?: string;
  notesPlaceholder?: string; // e.g. "Ranch, gluten-free"
  canEdit: boolean;
  onSave: (fieldId: string, value: string) => void | Promise<void>;
  label?: string;
  inputStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
};

/**
 * Structured custom food items block — one row per item with Item + Notes.
 * Replaces free-form textarea to avoid format errors (missing commas, etc.).
 */
export function CustomFoodItemsBlock({
  value,
  fieldId,
  placeholder = "Item name",
  notesPlaceholder = "Sauce, dressing, or notes",
  canEdit,
  onSave,
  label = "+ Add Custom (not in menu)",
  inputStyle = {},
  labelStyle = {},
  buttonStyle = {},
}: CustomFoodItemsBlockProps) {
  const [items, setItems] = useState<CustomFoodItem[]>(() => parseStoredText(value));
  const skipLoadRef = useRef(false);
  const [isOpen, setIsOpen] = useState(() => parseStoredText(value).length > 0);

  useEffect(() => {
    if (skipLoadRef.current) {
      skipLoadRef.current = false; // Reset so next load (e.g. event switch) isn't skipped
      return;
    }
    const parsed = parseStoredText(value);
    setItems(parsed);
    setIsOpen(parsed.length > 0);
  }, [value]);

  const save = useCallback(
    async (newItems: CustomFoodItem[]) => {
      const str = formatForStorage(newItems);
      skipLoadRef.current = true;
      await onSave(fieldId, str);
    },
    [fieldId, onSave]
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateItem = (id: string, updates: Partial<CustomFoodItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)));
  };

  const removeItem = async (id: string) => {
    const next = items.filter((it) => it.id !== id);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setItems(next);
    if (next.length === 0) setIsOpen(false);
    await save(next); // Save immediately so print page sees the change
  };

  const addItem = () => {
    const newItem: CustomFoodItem = { id: generateId(), item: "", notes: "" };
    setItems((prev) => [...prev, newItem]);
  };

  // Debounced save when items change (skip if output matches incoming value to avoid overwriting on load)
  useEffect(() => {
    const out = formatForStorage(items);
    if (out === (value || "").trim()) return;
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      save(items);
    }, 500);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [items, save, value]);

  const handleBlur = () => {
    const out = formatForStorage(items);
    if (out !== (value || "").trim()) save(items);
  };

  const baseInputStyle: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #444",
    backgroundColor: "#1a1a1a",
    color: "#e0e0e0",
    fontSize: "13px",
    minWidth: 0,
    ...inputStyle,
  };

  return (
    <div style={{ marginTop: "6px" }}>
      <label style={{ display: "block", fontSize: "11px", color: "#999", marginBottom: "4px", fontWeight: 600, ...labelStyle }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => {
            if (!isOpen && items.length === 0) {
              setIsOpen(true);
              addItem();
            } else {
              setIsOpen((prev) => !prev);
            }
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            ...buttonStyle,
          }}
        >
          + Add Custom Item
        </button>
      </div>
      {isOpen && (
        <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: 8, background: "rgba(0,0,0,0.25)" }}>
          {items.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 36px",
              gap: 8,
              marginBottom: 6,
              paddingLeft: 2,
              fontSize: "11px",
              color: "#888",
              fontWeight: 600,
            }}
          >
            <span>Item name</span>
            <span>Sauce / dressing / modifier (or notes)</span>
            <span />
          </div>
          )}
          {items.map((it) => (
          <div
            key={it.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 36px",
              gap: 8,
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <input
              type="text"
              value={it.item}
              onChange={(e) => updateItem(it.id, { item: e.target.value })}
              onBlur={handleBlur}
              disabled={!canEdit}
              placeholder={placeholder}
              style={baseInputStyle}
            />
            <input
              type="text"
              value={it.notes}
              onChange={(e) => updateItem(it.id, { notes: e.target.value })}
              onBlur={handleBlur}
              disabled={!canEdit}
              placeholder={notesPlaceholder}
              style={baseInputStyle}
            />
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => removeItem(it.id)}
              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18 }}
            >
              ✕
            </button>
          </div>
          ))}
        </div>
      )}
    </div>
  );
}
