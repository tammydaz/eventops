import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePickerStore } from "../state/usePickerStore";
import { fetchMenuItemsByCategory, fetchDeliveryMenuPickerItems, isDeliveryPickerType } from "../services/airtable/menuItems";

/**
 * Menu picker (BEO intake): items come from `fetchMenuItemsByCategory` / `fetchDeliveryMenuPickerItems`
 * on `getMenuItemsTable()` (Menu_Lab when configured). Catalog filter is category/execution only —
 * not Test Status. `search` filters the loaded list client-side; it cannot find items that belong
 * to a different picker category (open the correct + Add for that section).
 */
type PickerItem = { id: string; name: string; childItems?: string[]; routeTargetField?: string };

function getDisplayLabel(item: PickerItem): string {
  const parent = item.name;
  const children = item.childItems || [];
  const extraChildren = children.filter(
    (child) => child && !parent.toLowerCase().includes(child.toLowerCase())
  );
  const childLines = extraChildren.map((child) => `w/ ${child}`);
  return childLines.length > 0 ? `${parent} – ${childLines.join(" – ")}` : parent;
}

/** Valid item: has Child Items OR has no " – " in name. Excludes malformed duplicates like "Chicken Marsala – Mushroom-Shallot Demi" (dash in name, no children). */
function isValidPickerItem(item: PickerItem): boolean {
  const hasChildItems = (item.childItems?.length ?? 0) > 0;
  const hasDashInName = item.name.includes(" – ");
  return hasChildItems || !hasDashInName;
}

/** Group by base name. When duplicates exist, prefer item with Child Items; keep `routeTargetField` from winning row. */
function preferItemWithChildren(items: PickerItem[]): PickerItem[] {
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
    const withChildren = group.filter((i) => (i.childItems?.length ?? 0) > 0);
    const candidates = withChildren.length > 0 ? withChildren : group;
    const best = candidates.reduce((a, b) =>
      getDisplayLabel(a).length >= getDisplayLabel(b).length ? a : b
    );
    result.push({ ...best });
  }
  return result.sort((a, b) => getDisplayLabel(a).localeCompare(getDisplayLabel(b)));
}

interface MenuPickerModalProps {
  onAdd: (item: { id: string; name: string; routeTargetField?: string; hasChildren?: boolean }) => void;
  onRemove?: (catalogItemId: string, itemName?: string) => void;
  alreadyAddedIds: string[];
  alreadyAddedNames?: string[];
}

export const MenuPickerModal: React.FC<MenuPickerModalProps> = ({ onAdd, onRemove, alreadyAddedIds, alreadyAddedNames }) => {
  const { isOpen, pickerType, pickerTitle, closePicker } = usePickerStore();

  const [items, setItems] = useState<PickerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !pickerType) return;

    setSearch("");
    setLoading(true);
    (isDeliveryPickerType(pickerType)
      ? fetchDeliveryMenuPickerItems(pickerType)
      : fetchMenuItemsByCategory(pickerType)
    )
      .then((results) => {
        const raw = (results || []) as PickerItem[];
        const valid = raw.filter(isValidPickerItem);
        setItems(preferItemWithChildren(valid));
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
          border: "1px solid rgba(255,255,255,0.2)",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 600, color: "#fff", padding: "16px 16px 0" }}>
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
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.2)",
                color: "#fff",
                fontSize: "14px",
              }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
              {filteredItems.length} of {items.length} items
            </div>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px" }}>
          {loading ? (
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>Loading items…</div>
          ) : (
            <div className="picker-list" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {filteredItems.map((item) => {
                const isAdded = alreadyAddedIds.includes(item.id) ||
                  (alreadyAddedNames?.some((n) => n.toLowerCase() === item.name.toLowerCase()) ?? false);
                return (
                  <div
                    key={item.id}
                    className={`picker-item ${isAdded ? "active" : ""}`}
                    style={{
                      padding: "10px 12px",
                      backgroundColor: isAdded ? "rgba(255,255,255,0.06)" : "transparent",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#fff",
                      fontSize: "14px",
                      transition: "all 0.2s",
                    }}
                    onClick={() => {
                      if (isAdded) {
                        if (onRemove) onRemove(item.id, item.name);
                      } else {
                        onAdd({
                          id: item.id,
                          name: item.name,
                          ...(item.routeTargetField ? { routeTargetField: item.routeTargetField } : {}),
                          hasChildren: (item.childItems?.length ?? 0) > 0,
                        });
                        closePicker();
                        requestAnimationFrame(() => {
                          document.querySelector(".beo-menu-add-buttons")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        });
                      }
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between", width: "100%" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isAdded && <span style={{ color: "rgba(100,255,100,0.8)" }}>✓</span>}
                        {getDisplayLabel(item)}
                      </span>
                      {isAdded && onRemove && (
                        <span style={{ fontSize: 11, color: "rgba(255,100,100,0.8)", fontWeight: 500 }}>✕ remove</span>
                      )}
                    </span>
                  </div>
                );
              })}
              {filteredItems.length === 0 && !loading && (
                <div style={{ textAlign: "center", padding: "32px", color: "rgba(255,255,255,0.5)" }}>
                  {items.length === 0 ? "No items found" : "No matching items"}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="picker-actions" style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
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
              padding: "8px 18px",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "14px",
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
