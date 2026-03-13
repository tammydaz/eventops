import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePickerStore } from "../state/usePickerStore";
import { fetchMenuItemsByCategory } from "../services/airtable/menuItems";

type PickerItem = { id: string; name: string; childItems?: string[] };

function getDisplayLabel(item: PickerItem): string {
  const parent = item.name;
  const children = item.childItems || [];
  const extraChildren = children.filter(
    (child) => child && !parent.toLowerCase().includes(child.toLowerCase())
  );
  const childLines = extraChildren.map((child) => `w/ ${child}`);
  return childLines.length > 0 ? `${parent} – ${childLines.join(" – ")}` : parent;
}

/** Group by base name (before " – ", " – ", or "— "), keep only the longest display label in each group. */
function preferMostDescriptive(items: PickerItem[]): PickerItem[] {
  const DASH_SPLIT = /\s*[-–—]\s+/;
  const byBase = new Map<string, PickerItem[]>();
  for (const item of items) {
    const label = getDisplayLabel(item);
    const base = label.split(DASH_SPLIT)[0].trim();
    const list = byBase.get(base) ?? [];
    list.push(item);
    byBase.set(base, list);
  }
  const result: PickerItem[] = [];
  for (const group of byBase.values()) {
    const best = group.reduce((a, b) =>
      getDisplayLabel(a).length >= getDisplayLabel(b).length ? a : b
    );
    result.push(best);
  }
  return result.sort((a, b) => getDisplayLabel(a).localeCompare(getDisplayLabel(b)));
}

interface MenuPickerModalProps {
  onAdd: (item: { id: string; name: string }) => void;
  alreadyAddedIds: string[];
}

export const MenuPickerModal: React.FC<MenuPickerModalProps> = ({ onAdd, alreadyAddedIds }) => {
  const { isOpen, pickerType, pickerTitle, closePicker } = usePickerStore();

  const [items, setItems] = useState<PickerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !pickerType) return;

    setSearch("");
    setLoading(true);
    fetchMenuItemsByCategory(pickerType)
      .then((results) => {
        const raw = results || [];
        setItems(preferMostDescriptive(raw));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isOpen, pickerType]);

  const searchLower = search.trim().toLowerCase();
  const filteredItems = !searchLower
    ? items
    : items.filter((item) => getDisplayLabel(item).toLowerCase().includes(searchLower));

  if (!isOpen) return null;

  return createPortal(
      <div
      className="picker-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".picker-modal") || (e.target as HTMLElement).closest(".picker-done-button")) return;
        closePicker();
      }}
    >
      <div
        className="picker-modal"
        style={{
          backgroundColor: "#1a1a1a",
          borderRadius: "12px",
          border: "2px solid #ff6b6b",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "bold", color: "#e0e0e0", padding: "16px 16px 0" }}>
          {pickerTitle}
        </h2>

        {!loading && items.length > 0 && (
          <div style={{ padding: "0 16px 12px" }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #444",
                background: "#2a2a2a",
                color: "#e0e0e0",
                fontSize: "14px",
              }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
              {filteredItems.length} of {items.length} items
            </div>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px" }}>
          {loading ? (
            <div style={{ color: "#999", fontSize: "14px" }}>Loading items…</div>
          ) : (
            <div className="picker-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredItems.map((item) => {
                const isAdded = alreadyAddedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`picker-item ${isAdded ? "active" : ""}`}
                    style={{
                      padding: "12px",
                      backgroundColor: isAdded ? "#2a3a2a" : "#2a2a2a",
                      border: `1px solid ${isAdded ? "#22c55e" : "#444"}`,
                      borderRadius: "6px",
                      cursor: isAdded ? "default" : "pointer",
                      color: "#e0e0e0",
                      transition: "all 0.2s",
                    }}
                    onClick={() => {
                      if (!isAdded) {
                        onAdd(item);
                        setSearch("");
                        searchInputRef.current?.focus();
                      }
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {isAdded && <span style={{ color: "#22c55e" }}>✓</span>}
                      {getDisplayLabel(item)}
                    </span>
                  </div>
                );
              })}
              {filteredItems.length === 0 && !loading && (
                <div style={{ textAlign: "center", padding: "32px", color: "#999" }}>
                  {items.length === 0 ? "No items found" : "No matching items"}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="picker-actions" style={{ padding: "16px", borderTop: "1px solid #ff6b6b", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="picker-done-button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              usePickerStore.setState({ pickerClosedAt: Date.now() });
              usePickerStore.getState().closePicker();
            }}
            style={{
              padding: "10px 20px",
              background: "rgba(255,107,107,0.2)",
              color: "#ff6b6b",
              border: "2px solid #ff6b6b",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
