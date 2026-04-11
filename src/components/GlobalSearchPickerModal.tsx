import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { searchMenuItemsByName } from "../services/airtable/menuItems";

type SearchItem = { id: string; name: string; childItems?: string[] };

interface SectionChoice {
  label: string;
  routeTargetField: string;
  color: string;
}

const FULL_SERVICE_SECTIONS: SectionChoice[] = [
  { label: "Passed Apps",      routeTargetField: "passedApps",      color: "#D32F2F" },
  { label: "Presented Apps",   routeTargetField: "presentedApps",   color: "#FBC02D" },
  { label: "Buffet Metal",     routeTargetField: "buffetMetal",      color: "#4DD0E1" },
  { label: "Buffet China",     routeTargetField: "buffetChina",      color: "#FF8A65" },
  { label: "Deli",             routeTargetField: "fullServiceDeli",  color: "#4CAF50" },
  { label: "Desserts",         routeTargetField: "desserts",         color: "#7B1FA2" },
];

const DELIVERY_SECTIONS: SectionChoice[] = [
  { label: "🔥 Hot",           routeTargetField: "buffetMetal",      color: "#ef4444" },
  { label: "🍽️ Ready",         routeTargetField: "buffetMetal",      color: "#f97316" },
  { label: "🥗 Bulk",          routeTargetField: "buffetChina",      color: "#26a69a" },
  { label: "🥪 Display",       routeTargetField: "deliveryDeli",     color: "#3b82f6" },
  { label: "🍰 Desserts",      routeTargetField: "deliveryDeli",     color: "#a855f7" },
];

interface GlobalSearchPickerModalProps {
  isOpen: boolean;
  isDelivery: boolean;
  onAdd: (item: { id: string; name: string; routeTargetField: string; hasChildren?: boolean }) => void;
  onClose: () => void;
}

function useDebounce(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export const GlobalSearchPickerModal: React.FC<GlobalSearchPickerModalProps> = ({
  isOpen,
  isDelivery,
  onAdd,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 280);

  const sections = isDelivery ? DELIVERY_SECTIONS : FULL_SERVICE_SECTIONS;

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedItem(null);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      setSelectedItem(null);
      return;
    }
    setLoading(true);
    searchMenuItemsByName(debouncedQuery)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const handleSelectItem = useCallback((item: SearchItem) => {
    setSelectedItem(item);
  }, []);

  const handleChooseSection = useCallback(
    (section: SectionChoice) => {
      if (!selectedItem) return;
      onAdd({
        id: selectedItem.id,
        name: selectedItem.name,
        routeTargetField: section.routeTargetField,
        hasChildren: (selectedItem.childItems?.length ?? 0) > 0,
      });
      // Reset for next search
      setSelectedItem(null);
      setQuery("");
      setResults([]);
    },
    [selectedItem, onAdd]
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        backgroundColor: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".global-search-modal")) return;
        onClose();
      }}
    >
      <div
        className="global-search-modal"
        style={{
          backgroundColor: "#1a1a1a",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.2)",
          maxWidth: 560,
          width: "100%",
          maxHeight: "82vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>
              🔍 Find Any Item
            </h2>
            <button
              type="button"
              onClick={onClose}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 18, cursor: "pointer", padding: "2px 6px" }}
            >
              ✕
            </button>
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a menu item name…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedItem(null);
            }}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.3)",
              color: "#fff",
              fontSize: 14,
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          {debouncedQuery.trim().length >= 2 && !loading && (
            <div style={{ marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              {results.length === 0 ? "No items found" : `${results.length} result${results.length !== 1 ? "s" : ""}`}
              {results.length === 60 ? " (showing top 60)" : ""}
            </div>
          )}
        </div>

        {/* Section chooser — shown when item is selected */}
        {selectedItem && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(124,58,237,0.15)",
              borderBottom: "1px solid rgba(124,58,237,0.3)",
            }}
          >
            <div style={{ fontSize: 12, color: "#c4b5fd", fontWeight: 700, marginBottom: 8 }}>
              Put "{selectedItem.name}" under:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {sections.map((sec) => (
                <button
                  key={sec.routeTargetField + sec.label}
                  type="button"
                  onClick={() => handleChooseSection(sec)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: `1px solid ${sec.color}80`,
                    background: `linear-gradient(135deg, ${sec.color}40, ${sec.color}18)`,
                    color: sec.color,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sec.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                cancel
              </button>
            </div>
          </div>
        )}

        {/* Results list */}
        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
          {loading && (
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, padding: "8px 4px" }}>
              Searching…
            </div>
          )}
          {!loading && debouncedQuery.trim().length < 2 && (
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, padding: "20px 4px", textAlign: "center" }}>
              Start typing to search across the full menu
            </div>
          )}
          {!loading && results.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const childLabel =
              item.childItems && item.childItems.length > 0
                ? item.childItems.filter((c) => !item.name.toLowerCase().includes(c.toLowerCase())).slice(0, 2).join(", ")
                : "";
            return (
              <div
                key={item.id}
                onClick={() => handleSelectItem(item)}
                style={{
                  padding: "9px 12px",
                  borderRadius: 6,
                  border: `1px solid ${isSelected ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.08)"}`,
                  background: isSelected ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  marginBottom: 5,
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 13, color: "#fff", fontWeight: isSelected ? 700 : 400 }}>
                  {isSelected && <span style={{ color: "#a78bfa", marginRight: 6 }}>▶</span>}
                  {item.name}
                </div>
                {childLabel && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                    w/ {childLabel}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            {selectedItem ? "Pick a section above → item is added there" : "Click any result → choose which heading"}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "6px 14px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 6,
              color: "rgba(255,255,255,0.7)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
