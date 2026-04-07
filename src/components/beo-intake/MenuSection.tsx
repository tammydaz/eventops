import { useCallback, useEffect, useState, Fragment, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FIELD_IDS } from "../../services/airtable/events";
import { CATEGORY_MAP, type MenuCategoryKey } from "../../constants/menuCategories";
import { usePickerStore } from "../../state/usePickerStore";
import { STATION_TYPE_OPTIONS } from "../../constants/stations";
import {
  loadMenuItems,
  loadMenuItemsByStationType,
  loadStationPreset,
  loadStationsByEventId,
  createStation,
  createStationFromPreset,
  updateStationItems,
  updateStationComponents,
  deleteStation,
  getStationTypeOptions,
  type LinkedRecordItem,
} from "../../services/airtable/linkedRecords";
import { airtableFetch, getMenuItemsTable } from "../../services/airtable/client";
import { getMenuCatalogFieldIds } from "../../services/airtable/menuCatalogConfig";
import { loadStationPresets, loadStationComponentNamesByIds } from "../../services/airtable/stationComponents";
import { StationComponentsConfigModal } from "./StationComponentsConfigModal";
import { BoxedLunchSection } from "./BoxedLunchSection";
import { SandwichPlatterConfigModal } from "./SandwichPlatterConfigModal";
import { SALAD_BAR } from "../../config/stationPresets";
import { getPlatterOrdersByEventId, setPlatterOrdersForEvent } from "../../state/platterOrdersStore";
import { asLinkedRecordIds, asSingleSelectName, asString, isErrorResult } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";
import { FormSection, BEO_SECTION_PILL_ACCENT } from "./FormSection";
import { CustomFoodItemsBlock } from "./CustomFoodItemsBlock";
import { getSauceOverrides, setSauceOverride, type SauceOverride, type SauceOverrideValue } from "../../state/sauceOverrideStore";
import { calculateAutoSpec, type FoodCategory } from "../../utils/beoAutoSpec";
import { getBeoSpecStorageKey, getSpecOverrideKey } from "../../utils/beoSpecStorage";
import {
  DELIVERY_COURSE_BLOCK,
  DELIVERY_SECTION_CONFIG,
  deliveryItemBelongsInSection,
  type DeliverySectionRow,
} from "../../config/deliverySectionConfig";
import { DELIVERY_INTAKE_SECTIONS, LEGACY_MENU_ITEMS_TABLE_ID } from "../../services/airtable/menuCatalogConfig";
import { DELIVERY_INTAKE_TARGET_FIELD, fetchExecutionTokensByMenuItemIds } from "../../services/airtable/menuItems";
import { deleteEventMenuRow, syncShadowToEvent } from "../../services/airtable/eventMenu";

function laneToFoodCategory(lane: string): FoodCategory {
  if (lane === "passedAppetizers") return "passed";
  if (lane === "presentedAppetizers") return "presented";
  if (lane === "desserts") return "dessert";
  return "buffet";
}

function laneUsesSauceOnFirstChild(lane: string): boolean {
  return lane === "passedAppetizers" || lane === "presentedAppetizers";
}

/** Delivery “Food List”: teal header, collapsible — matches full-service speck table layout. */
function FoodListCollapsible(props: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const { title, defaultOpen = false, children } = props;
  const [open, setOpen] = useState(defaultOpen);
  const accent = BEO_SECTION_PILL_ACCENT;
  const border = "rgba(255,255,255,0.15)";
  return (
    <div
      style={{
        border: `1px solid ${border}`,
        borderRadius: 8,
        background: "#0a0a0a",
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: "rgba(0,0,0,0.4)",
          border: "none",
          borderBottom: open ? `1px solid ${border}` : "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ color: accent, fontSize: 11, width: 14, flexShrink: 0 }}>{open ? "▼" : "▶"}</span>
        <span style={{ color: accent, fontWeight: 700, fontSize: 13, letterSpacing: "0.06em" }}>{title}</span>
      </button>
      {open && <div style={{ padding: "0 0 8px 0" }}>{children}</div>}
    </div>
  );
}

/** Collapsible block with same visual shell as CourseBlock: heading with colored dots and chevron. Use for any section that should match course-block look. */
function CourseStyleBlock(props: {
  title: string;
  dotColor: string;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const { title, dotColor, defaultCollapsed = true, children } = props;
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const dotStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: dotColor,
    flexShrink: 0,
  };
  const tableBorder = "1px solid rgba(255,255,255,0.15)";
  return (
    <div
      style={{
        border: tableBorder,
        borderRadius: 8,
        backgroundColor: "rgba(0,0,0,0.2)",
        overflow: "hidden",
        marginBottom: 10,
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "8px 12px",
          border: "none",
          borderBottom: isOpen ? tableBorder : "none",
          background: "rgba(0,0,0,0.15)",
          cursor: "pointer",
          color: "inherit",
        }}
      >
        <span style={{ fontSize: "10px", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s ease", color: "rgba(255,255,255,0.7)" }}>▶</span>
        <span style={dotStyle} />
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", color: "#e0e0e0" }}>{title}</span>
        <span style={dotStyle} />
      </button>
      {isOpen && <div style={{ padding: 8 }}>{children}</div>}
    </div>
  );
}

/** Course block: collapsible heading with colored dots, two-column item list (qty | name/description), + Add button. */
function CourseBlock(props: {
  title: string;
  dotColor: string;
  itemIds: string[];
  getItemName: (id: string) => string;
  getItemDescription?: (id: string) => string | null;
  onRemove: (id: string) => void;
  onAdd: () => void;
  addButtonLabel: string;
  canEdit: boolean;
  buttonStyle: React.CSSProperties;
  defaultCollapsed?: boolean;
  children?: React.ReactNode;
}) {
  const {
    title,
    dotColor,
    itemIds,
    getItemName,
    getItemDescription,
    onRemove,
    onAdd,
    addButtonLabel,
    canEdit,
    buttonStyle,
    defaultCollapsed = true,
    children,
  } = props;
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const dotStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: dotColor,
    flexShrink: 0,
  };
  const tableBorder = "1px solid rgba(255,255,255,0.15)";
  return (
    <div
      style={{
        border: tableBorder,
        borderRadius: 8,
        backgroundColor: "rgba(0,0,0,0.2)",
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "12px 16px",
          border: "none",
          borderBottom: isOpen ? tableBorder : "none",
          background: "rgba(0,0,0,0.15)",
          cursor: "pointer",
          color: "inherit",
        }}
      >
        <span style={{ fontSize: "10px", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s ease", color: "rgba(255,255,255,0.7)" }}>▶</span>
        <span style={dotStyle} />
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.05em", color: "#e0e0e0" }}>{title}</span>
        <span style={dotStyle} />
      </button>
      {isOpen && (
      <div style={{ padding: 12 }}>
        <div style={{ border: tableBorder, borderRadius: 6, overflow: "hidden" }}>
          {itemIds.length === 0 ? (
            <div style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>No items yet. Use + Add to select.</div>
          ) : (
            itemIds.map((itemId) => {
              const name = getItemName(itemId);
              const desc = getItemDescription?.(itemId)?.trim();
              return (
                <div
                  key={itemId}
                  style={{
                    display: "flex",
                    borderBottom: itemIds.indexOf(itemId) < itemIds.length - 1 ? tableBorder : "none",
                    minHeight: 44,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      flexShrink: 0,
                      padding: "8px 12px",
                      borderRight: tableBorder,
                      fontSize: 13,
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    —
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, color: "#e0e0e0", fontWeight: 500 }}>{name}</div>
                      {desc && (
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{desc.startsWith("w/") || desc.startsWith("Sauce:") ? desc : `w/ ${desc}`}</div>
                      )}
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => onRemove(itemId)}
                        style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: 16, fontWeight: "bold", flexShrink: 0 }}
                        aria-label="Remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="button" disabled={!canEdit} onClick={onAdd} style={buttonStyle}>
            {addButtonLabel}
          </button>
        </div>
        {children}
      </div>
      )}
    </div>
  );
}

/** Inline replace button — opens picker to swap one station item for another. */
function StationItemReplaceButton(props: {
  stationId: string;
  stationType: string;
  currentId: string;
  stationItems: string[];
  getItemName: (id: string) => string;
  onReplaced: (newItems: string[]) => void;
  updateStationItems: (stationId: string, items: string[]) => Promise<unknown>;
  isErrorResult: (r: unknown) => r is { error: true };
  buttonStyle: React.CSSProperties;
}) {
  const { stationId, stationType, currentId, stationItems, onReplaced, updateStationItems, isErrorResult, buttonStyle } = props;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuItems, setMenuItems] = useState<LinkedRecordItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stationType?.trim()) return;
    setLoading(true);
    loadMenuItemsByStationType(stationType)
      .then((result) => {
        if (!isErrorResult(result)) setMenuItems(result);
        else setMenuItems([]);
      })
      .catch(() => setMenuItems([]))
      .finally(() => setLoading(false));
  }, [stationType]);

  const hasStationType = Boolean(stationType?.trim());
  const filtered = !search.trim()
    ? menuItems.filter((m) => m.id !== currentId)
    : menuItems.filter((m) => m.id !== currentId && m.name.toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={!hasStationType} style={{ ...buttonStyle, padding: "2px 6px", fontSize: 10, opacity: hasStationType ? 1 : 0.5, cursor: hasStationType ? "pointer" : "not-allowed" }} title={hasStationType ? "Replace" : "Replace (requires station type)"}>↔</button>
      {open &&
        createPortal(
          <div style={{ position: "fixed", inset: 0, zIndex: 99998, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setOpen(false)}>
            <div style={{ backgroundColor: "#1a1a1a", borderRadius: 12, border: "2px solid #ff6b6b", maxWidth: 400, width: "100%", maxHeight: "70vh", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: 12, borderBottom: "1px solid #444" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#e0e0e0" }}>Replace with</h4>
                <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #444", background: "#2a2a2a", color: "#e0e0e0", fontSize: 13 }} autoFocus />
              </div>
              <div style={{ maxHeight: 200, overflowY: "auto", padding: 12 }}>
                {loading ? (
                  <div style={{ color: "#999", fontSize: 13 }}>Loading items…</div>
                ) : (
                  <>
                    {filtered.map((item) => (
                      <div key={item.id} onClick={async () => { const idx = stationItems.indexOf(currentId); if (idx >= 0) { const newItems = [...stationItems]; newItems[idx] = item.id; const r = await updateStationItems(stationId, newItems); if (!isErrorResult(r)) onReplaced(newItems); setOpen(false); } }} style={{ padding: 10, marginBottom: 6, fontSize: 13, color: "#e0e0e0", background: "#2a2a2a", borderRadius: 6, cursor: "pointer" }}>{item.name}</div>
                    ))}
                    {filtered.length === 0 && <div style={{ color: "#666", fontSize: 13 }}>No other items</div>}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/** Picker to add a menu item to a station. */
function StationItemPicker(props: {
  stationId: string;
  stationType: string;
  existingIds: string[];
  onSelect: (itemId: string) => void;
  buttonStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  /** Use higher z-index when picker is inside another modal (e.g. StationItemsConfigModal) */
  portalZIndex?: number;
}) {
  const { existingIds, onSelect, buttonStyle, portalZIndex = 99998 } = props;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuItems, setMenuItems] = useState<LinkedRecordItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!props.stationType?.trim()) return;
    setLoading(true);
    loadMenuItemsByStationType(props.stationType)
      .then((result) => {
        if (!isErrorResult(result)) setMenuItems(result);
        else setMenuItems([]);
      })
      .catch(() => setMenuItems([]))
      .finally(() => setLoading(false));
  }, [props.stationType]);

  const hasStationType = Boolean(props.stationType?.trim());
  const filtered = !search.trim()
    ? menuItems.filter((m) => !existingIds.includes(m.id))
    : menuItems.filter((m) => !existingIds.includes(m.id) && m.name.toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={!hasStationType} style={{ ...buttonStyle, padding: "6px 10px", fontSize: 12, opacity: hasStationType ? 1 : 0.5, cursor: hasStationType ? "pointer" : "not-allowed" }} title={hasStationType ? "Add item" : "Add item (requires station type)"}>
        + Add Item
      </button>
      {open &&
        createPortal(
          <div style={{ position: "fixed", inset: 0, zIndex: portalZIndex, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setOpen(false)}>
            <div style={{ backgroundColor: "#1a1a1a", borderRadius: 12, border: "2px solid #ff6b6b", maxWidth: 500, width: "100%", maxHeight: "80vh", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: 16, borderBottom: "1px solid #444" }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: 16, color: "#e0e0e0" }}>Add menu item to station</h3>
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #444", background: "#2a2a2a", color: "#e0e0e0", fontSize: 14 }}
                  autoFocus
                />
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto", padding: 16 }}>
                {loading ? (
                  <div style={{ color: "#999", fontSize: 14 }}>Loading items…</div>
                ) : (
                  <>
                    {filtered.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelect(item.id);
                          setOpen(false);
                        }}
                        style={{ padding: 12, marginBottom: 8, fontSize: 14, color: "#e0e0e0", background: "#2a2a2a", borderRadius: 6, cursor: "pointer" }}
                      >
                        {item.name}
                      </div>
                    ))}
                    {filtered.length === 0 && <div style={{ color: "#999", fontSize: 14 }}>No items found</div>}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/** Modal to configure station items when adding a station. Shows items for that station type with Replace/Remove options. */
function StationItemsConfigModal(props: {
  isOpen: boolean;
  stationType: string;
  stationNotes: string;
  getItemName: (id: string) => string;
  onConfirm: (itemIds: string[]) => void;
  onCancel: () => void;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
}) {
  const { isOpen, stationType, stationNotes, getItemName, onConfirm, onCancel, inputStyle, labelStyle, buttonStyle } = props;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<LinkedRecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [replaceIdx, setReplaceIdx] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isOpen || !stationType.trim()) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      const [preset, typeResult] = await Promise.all([
        loadStationPreset(stationType.trim()),
        loadMenuItemsByStationType(stationType.trim()),
      ]);

      if (!cancelled) {
        if (!isErrorResult(typeResult)) {
          setMenuItems(typeResult);
        } else {
          setMenuItems([]);
        }

        if (preset) {
          const combined = [...preset.line1, ...preset.line2, ...preset.individuals];
          setSelectedIds(combined);
        } else if (!isErrorResult(typeResult)) {
          setSelectedIds(typeResult.map((r) => r.id));
        } else {
          setSelectedIds([]);
        }
      }

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [isOpen, stationType]);

  if (!isOpen) return null;

  const removeItem = (idx: number) => {
    setSelectedIds((prev) => prev.filter((_, i) => i !== idx));
    if (replaceIdx !== null && replaceIdx >= idx) setReplaceIdx((r) => (r > idx ? r - 1 : null));
  };

  const replaceItem = (idx: number, newId: string) => {
    setSelectedIds((prev) => prev.map((id, i) => (i === idx ? newId : id)));
    setReplaceIdx(null);
  };

  const addItem = (itemId: string) => {
    if (!selectedIds.includes(itemId)) setSelectedIds((prev) => [...prev, itemId]);
  };

  const filteredForReplace = !search.trim()
    ? menuItems.filter((m) => !selectedIds.includes(m.id) || (replaceIdx !== null && selectedIds[replaceIdx] === m.id))
    : menuItems.filter((m) => (!selectedIds.includes(m.id) || (replaceIdx !== null && selectedIds[replaceIdx] === m.id)) && m.name.toLowerCase().includes(search.trim().toLowerCase()));

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "auto" }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", pointerEvents: "auto" }} onClick={onCancel} aria-hidden="true" />
      <div role="dialog" style={{ position: "relative", zIndex: 1, backgroundColor: "#1a1a1a", borderRadius: 12, border: "2px solid #ff6b6b", maxWidth: 560, width: "100%", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #444", flexShrink: 0 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: "#e0e0e0" }}>Configure {stationType}</h3>
          <p style={{ margin: 0, fontSize: 12, color: "#999" }}>Review items, replace, or remove. Then confirm.</p>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {loading ? (
            <div style={{ color: "#999", padding: 24, textAlign: "center" }}>Loading items…</div>
          ) : (
            <>
              <label style={labelStyle}>Station items</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {selectedIds.map((id, idx) => (
                  <div key={`${id}-${idx}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, backgroundColor: "#2a2a2a", borderRadius: 8, border: "1px solid #444" }}>
                    <span style={{ flex: 1, color: "#e0e0e0", fontSize: 14 }}>{getItemName(id)}</span>
                    {replaceIdx === idx ? (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                        <input
                          type="text"
                          placeholder="Search to replace..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          style={{ ...inputStyle, padding: 8, fontSize: 12 }}
                          autoFocus
                        />
                        <div style={{ maxHeight: 120, overflowY: "auto" }}>
                          {filteredForReplace.map((item) => (
                            <div key={item.id} onClick={() => replaceItem(idx, item.id)} style={{ padding: 8, fontSize: 12, color: "#e0e0e0", cursor: "pointer", background: "#1a1a1a", borderRadius: 4, marginBottom: 4 }}>{item.name}</div>
                          ))}
                          {filteredForReplace.length === 0 && <div style={{ color: "#666", fontSize: 12 }}>No other items</div>}
                        </div>
                        <button type="button" onClick={() => setReplaceIdx(null)} style={{ ...buttonStyle, padding: 6, fontSize: 12 }}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={() => setReplaceIdx(idx)} style={{ ...buttonStyle, padding: "6px 10px", fontSize: 11 }}>Replace</button>
                        <button type="button" onClick={() => removeItem(idx)} style={{ padding: "6px 10px", fontSize: 11, background: "#444", color: "#e0e0e0", border: "1px solid #666", borderRadius: 6, cursor: "pointer" }}>Remove</button>
                      </>
                    )}
                  </div>
                ))}
                {selectedIds.length === 0 && !loading && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: "#666", fontSize: 13, marginBottom: 8 }}>No items for this station type. Click items below to add:</div>
                    <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                      {menuItems.slice(0, 100).map((item) => (
                        <div key={item.id} onClick={() => addItem(item.id)} style={{ padding: 8, fontSize: 13, color: "#e0e0e0", cursor: "pointer", background: "#2a2a2a", borderRadius: 6, border: "1px solid #444" }}>{item.name}</div>
                      ))}
                      {menuItems.length > 100 && <div style={{ color: "#666", fontSize: 12 }}>… or use + Add Item for full list</div>}
                    </div>
                  </div>
                )}
              </div>
              <label style={labelStyle}>Add more items</label>
              <StationItemPicker
                stationId=""
                stationType={stationType}
                existingIds={selectedIds}
                onSelect={(id) => { addItem(id); }}
                buttonStyle={buttonStyle}
                labelStyle={labelStyle}
                portalZIndex={100001}
              />
            </>
          )}
        </div>
        <div style={{ padding: 16, borderTop: "1px solid #444", display: "flex", gap: 12, justifyContent: "flex-end", flexShrink: 0 }}>
          <button type="button" onClick={onCancel} style={{ padding: "10px 20px", background: "#444", color: "#e0e0e0", border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={() => onConfirm(selectedIds)} disabled={loading} style={buttonStyle}>Save</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** BEO stations — grouped by BEO placement; station type, items, notes. */
export function CreationStationContent(props: {
  selectedEventId: string | null;
  canEdit: boolean;
  menuItems: LinkedRecordItem[];
  menuItemNames: Record<string, string>;
  getItemName: (id: string) => string;
  fetchItemNames: (eventId: string | null, recordIds: string[], options?: { clearWhenEmpty?: boolean }) => void | Promise<void>;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
  /** Compact style for Edit Components and + Add Station */
  addButtonStyle?: React.CSSProperties;
}) {
  const { selectedEventId, canEdit, getItemName, fetchItemNames, inputStyle, labelStyle, buttonStyle, addButtonStyle } = props;
  const compactStyle = addButtonStyle ?? buttonStyle;
  const { selectedEventData, setFields } = useEventStore();

  const appendStationIdOnEvent = async (stationId: string) => {
    const sid = useEventStore.getState().selectedEventId;
    if (!sid) return;
    const ev = useEventStore.getState().selectedEventData;
    const existing = asLinkedRecordIds(ev[FIELD_IDS.STATIONS]);
    const next = [...new Set([...existing, stationId])];
    const ok = await setFields(sid, { [FIELD_IDS.STATIONS]: next });
    if (!ok) {
      window.alert("Station was saved, but linking it on the event failed. Try again or add it manually on the Events record (Stations field).");
    }
  };

  const removeStationIdOnEvent = async (stationId: string) => {
    const sid = useEventStore.getState().selectedEventId;
    if (!sid) return;
    const ev = useEventStore.getState().selectedEventData;
    const existing = asLinkedRecordIds(ev[FIELD_IDS.STATIONS]);
    const next = existing.filter((id) => id !== stationId);
    const ok = await setFields(sid, { [FIELD_IDS.STATIONS]: next });
    if (!ok) window.alert("Could not remove this station from the event link. You can fix the Stations field in Airtable.");
  };
  const [stations, setStations] = useState<Array<{ id: string; stationType: string; stationItems: string[]; stationNotes: string; stationPresetId?: string; stationComponents?: string[]; customItems?: string; beoPlacement?: "Presented Appetizer" | "Buffet Metal" | "Buffet China" }>>([]);
  const [stationTypeOptions, setStationTypeOptions] = useState<string[]>([]);
  const [stationPresets, setStationPresets] = useState<Array<{ id: string; name: string }>>([]);
  const [newStationType, setNewStationType] = useState("");
  const [newStationPresetId, setNewStationPresetId] = useState("");
  const [newStationNotes, setNewStationNotes] = useState("");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showComponentsModal, setShowComponentsModal] = useState(false);
  const [editingStationId, setEditingStationId] = useState<string | null>(null);
  const [componentNames, setComponentNames] = useState<Record<string, string>>({});
  /** When true, station row is expanded; omitted = use default (expanded until items are picked, then collapsed). */
  const [stationRowExpanded, setStationRowExpanded] = useState<Record<string, boolean>>({});
  /** BEO placement groups default expanded; `false` = user collapsed that header. */
  const [placementGroupExpanded, setPlacementGroupExpanded] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setPlacementGroupExpanded({});
  }, [selectedEventId]);
  useEffect(() => {
    getStationTypeOptions().then((opts) => setStationTypeOptions(opts.length > 0 ? opts : [...STATION_TYPE_OPTIONS]));
  }, []);

  useEffect(() => {
    loadStationPresets().then((result) => {
      if (!isErrorResult(result)) setStationPresets(result);
      else setStationPresets([]);
    });
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setStations([]);
      return;
    }
    let active = true;
    loadStationsByEventId(selectedEventId, asLinkedRecordIds(selectedEventData?.[FIELD_IDS.STATIONS])).then((result) => {
      if (active && !isErrorResult(result)) {
        setStations(result);
        const allStationItemIds = result.flatMap((s) => s.stationItems).filter((id) => id.startsWith("rec"));
        if (allStationItemIds.length > 0 && selectedEventId) {
          fetchItemNames(selectedEventId, allStationItemIds);
        }
        const allComponentIds = result.flatMap((s) => s.stationComponents ?? []).filter((id) => id?.startsWith("rec"));
        if (allComponentIds.length > 0) {
          loadStationComponentNamesByIds(allComponentIds).then((names) => {
            if (active && !isErrorResult(names)) setComponentNames(names);
          });
        } else {
          setComponentNames({});
        }
      }
    });
    return () => { active = false; };
  }, [selectedEventId, selectedEventData, fetchItemNames]);

  const usePresetFlow = stationPresets.length > 0;
  const selectedPreset = stationPresets.find((p) => p.id === newStationPresetId);

  const openAddStationModal = () => {
    if (usePresetFlow) {
      if (!newStationPresetId || !selectedPreset) return;
      setShowComponentsModal(true);
    } else {
      if (!newStationType.trim()) return;
      setShowConfigModal(true);
    }
  };

  const confirmAddStation = async (itemIds: string[]) => {
    if (!selectedEventId || !newStationType.trim()) return;
    const result = await createStation({
      stationType: newStationType.trim(),
      stationItems: itemIds,
      stationNotes: newStationNotes.trim(),
      eventId: selectedEventId,
    });
    if (isErrorResult(result)) {
      console.error("Failed to create station:", result);
      window.alert(result.message ?? "Could not create station. Check Airtable fields and permissions.");
      return;
    }
    await appendStationIdOnEvent(result.id);
    setStations((prev) => [...prev, { id: result.id, stationType: newStationType.trim(), stationItems: itemIds, stationNotes: newStationNotes.trim() }]);
    setNewStationType("");
    setNewStationNotes("");
    setShowConfigModal(false);
    if (itemIds.length > 0 && selectedEventId) fetchItemNames(selectedEventId, itemIds);
  };

  const confirmAddStationFromPreset = async (params: { componentIds: string[]; customItems: string; beoPlacement?: "Presented Appetizer" | "Buffet Metal" | "Buffet China" }) => {
    if (!selectedEventId || !newStationPresetId || !selectedPreset) return;
    const result = await createStationFromPreset({
      presetId: newStationPresetId,
      presetName: selectedPreset.name,
      stationComponents: params.componentIds,
      customItems: params.customItems || undefined,
      stationNotes: newStationNotes.trim(),
      eventId: selectedEventId,
      beoPlacement: params.beoPlacement,
    });
    if (isErrorResult(result)) {
      console.error("Failed to create station:", result);
      window.alert(result.message ?? "Could not create station from preset. Check Airtable fields and permissions.");
      return;
    }
    await appendStationIdOnEvent(result.id);
    setStations((prev) => [
      ...prev,
      { id: result.id, stationType: selectedPreset.name, stationItems: [], stationNotes: newStationNotes.trim(), stationPresetId: newStationPresetId, stationComponents: params.componentIds, customItems: params.customItems, beoPlacement: params.beoPlacement },
    ]);
    setNewStationPresetId("");
    setNewStationNotes("");
    setShowComponentsModal(false);
  };

  const handleDeleteStation = async (stationId: string) => {
    if (!window.confirm("Remove this station from the event? This cannot be undone.")) return;
    const result = await deleteStation(stationId);
    if (isErrorResult(result)) {
      console.error("Failed to delete station:", result);
      window.alert(result.message ?? "Could not delete station.");
      return;
    }
    await removeStationIdOnEvent(stationId);
    setStations((prev) => prev.filter((s) => s.id !== stationId));
  };

  const confirmEditStationComponents = async (stationId: string, params: { componentIds: string[]; customItems: string; beoPlacement?: "Presented Appetizer" | "Buffet Metal" | "Buffet China" }) => {
    const result = await updateStationComponents(stationId, { stationComponents: params.componentIds, customItems: params.customItems || undefined, beoPlacement: params.beoPlacement });
    if (isErrorResult(result)) {
      console.error("Failed to update station components:", result);
      return;
    }
    setStations((prev) =>
      prev.map((s) => (s.id === stationId ? { ...s, stationComponents: params.componentIds, customItems: params.customItems, beoPlacement: params.beoPlacement } : s))
    );
    setEditingStationId(null);
    loadStationComponentNamesByIds(params.componentIds).then((names) => {
      if (!isErrorResult(names)) setComponentNames((prev) => ({ ...prev, ...names }));
    });
  };

  const getComponentName = (id: string) => componentNames[id] ?? id;

  const addStationItem = async (stationId: string, itemId: string) => {
    const st = stations.find((s) => s.id === stationId);
    if (!st || st.stationItems.includes(itemId)) return;
    const newItems = [...st.stationItems, itemId];
    const result = await updateStationItems(stationId, newItems);
    if (isErrorResult(result)) {
      console.error("Failed to update station items:", result);
      return;
    }
    setStations((prev) => prev.map((s) => (s.id === stationId ? { ...s, stationItems: newItems } : s)));
    if (selectedEventId) fetchItemNames(selectedEventId, [itemId]);
  };

  const selectStyle = { ...inputStyle, cursor: canEdit ? "pointer" : "not-allowed" };

  const stationHasPickItems = (st: (typeof stations)[0]) =>
    (st.stationComponents?.length ?? 0) > 0 || st.stationItems.length > 0 || Boolean(st.customItems?.trim());

  const stationRowIsExpanded = (st: (typeof stations)[0]) =>
    !stationHasPickItems(st) || stationRowExpanded[st.id] === true;

  const toggleStationRow = (st: (typeof stations)[0]) => {
    if (!stationHasPickItems(st)) return;
    const now = stationRowIsExpanded(st);
    setStationRowExpanded((p) => ({ ...p, [st.id]: !now }));
  };

  const creationStationTableBorder = "1px solid rgba(255,255,255,0.15)";
  /** Match shadow menu item / section title contrast (white, not accent purple). */
  const creationStationHeaderTitleColor = "#fff";

  const STATION_PLACEMENT_GROUPS: Array<{
    placement: "Presented Appetizer" | "Buffet Metal" | "Buffet China";
    shadowTitle: string;
    color: string;
  }> = [
    { placement: "Presented Appetizer", shadowTitle: "Presented Appetizers", color: "#FBC02D" },
    { placement: "Buffet Metal", shadowTitle: "Buffet – Metal", color: "#4DD0E1" },
    { placement: "Buffet China", shadowTitle: "Buffet – China", color: "#E8E8E8" },
  ];

  type StationRowState = (typeof stations)[number];

  const renderStationCard = (st: StationRowState) => {
        const expanded = stationRowIsExpanded(st);
        const hasItems = stationHasPickItems(st);
        return (
        <div
          key={st.id}
          style={{ width: "100%", border: creationStationTableBorder, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.2)", overflow: "hidden" }}
        >
          <div
            role={hasItems ? "button" : undefined}
            tabIndex={hasItems ? 0 : -1}
            aria-expanded={hasItems ? expanded : undefined}
            onClick={() => toggleStationRow(st)}
            onKeyDown={(e) => { if (hasItems && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggleStationRow(st); } }}
            style={{
              padding: "8px 12px",
              background: "rgba(0,0,0,0.15)",
              borderBottom: expanded ? creationStationTableBorder : "none",
              cursor: hasItems ? "pointer" : "default",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ width: 100, minWidth: 100, padding: 0, verticalAlign: "middle" }} />
                  <td style={{ padding: 0, textAlign: "center", verticalAlign: "middle" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", color: creationStationHeaderTitleColor }}>
                      {(st.stationType || "Station").toUpperCase()}
                    </span>
                    {hasItems && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: "rgba(255,255,255,0.45)", userSelect: "none" }} aria-hidden>
                        {expanded ? "▼" : "▶"}
                      </span>
                    )}
                  </td>
                  <td style={{ width: 140, minWidth: 140, padding: 0, textAlign: "right", verticalAlign: "middle" }} onClick={(e) => e.stopPropagation()}>
                    {canEdit && (
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, flexWrap: "wrap" }}>
                        {(st.stationPresetId || stationPresets.some((p) => p.name === st.stationType) || (st.customItems != null && /^Main:\s/m.test(st.customItems))) && (
                          <button
                            type="button"
                            onClick={() => { setStationRowExpanded((p) => ({ ...p, [st.id]: true })); setEditingStationId(st.id); }}
                            style={{ padding: "4px 10px", fontSize: 10, fontWeight: 600, background: "rgba(139,92,246,0.2)", border: "1px solid #8b5cf6", color: "#a78bfa", borderRadius: 5, cursor: "pointer" }}
                            title="Edit station config"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteStation(st.id)}
                          style={{ padding: "4px 10px", fontSize: 10, fontWeight: 600, background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 5, cursor: "pointer" }}
                          title="Remove this station"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {expanded && (
          <div style={{ padding: 12 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <div>
              <label style={labelStyle}>Station Type</label>
              <div style={{ color: "#e0e0e0", fontSize: 14 }}>{st.stationType || "—"}</div>
            </div>
            <div>
              <label style={labelStyle}>{st.stationPresetId || (st.stationComponents && st.stationComponents.length > 0) ? "Station Components" : "Station Items"}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                {st.stationPresetId || (st.stationComponents && st.stationComponents.length > 0) ? (
                  <>
                    {(st.stationComponents ?? []).map((id) => (
                      <span key={id} style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#2a2a2a", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {getComponentName(id)}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              const newComponents = (st.stationComponents ?? []).filter((cid) => cid !== id);
                              updateStationComponents(st.id, { stationComponents: newComponents }).then((r) => {
                                if (!isErrorResult(r)) setStations((prev) => prev.map((s) => (s.id === st.id ? { ...s, stationComponents: newComponents } : s)));
                              });
                            }}
                            style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 10 }}
                            title="Remove"
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    ))}
                    {st.customItems?.trim() && (
                      <span style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#2a2a2a", borderRadius: 4, color: "#999" }} title={st.customItems}>
                        Custom: {st.customItems.split("\n")[0]?.slice(0, 30)}{st.customItems.length > 30 ? "…" : ""}
                      </span>
                    )}
                    {(st.stationComponents ?? []).length === 0 && !st.customItems?.trim() && <span style={{ color: "#666", fontSize: 12 }}>No components</span>}
                    {canEdit && (st.stationPresetId || stationPresets.some((p) => p.name === st.stationType) || (st.customItems != null && /^Main:\s/m.test(st.customItems))) && (
                      <button type="button" onClick={() => setEditingStationId(st.id)} style={compactStyle}>
                        Edit Components
                      </button>
                    )}
                  </>
                ) : st.stationType === "Grande Charcuterie Display" ? (
                  (() => {
                    const line1 = st.stationItems.slice(0, 5);
                    const line2 = st.stationItems.slice(5, 9);
                    const individuals = st.stationItems.slice(9);
                    return (
                      <>
                        {line1.length > 0 && (
                          <div style={{ width: "100%", fontSize: 12, color: "#e0e0e0", marginBottom: 4 }}>
                            Line 1: {line1.map((id) => getItemName(id)).join(", ")}
                          </div>
                        )}
                        {line2.length > 0 && (
                          <div style={{ width: "100%", fontSize: 12, color: "#e0e0e0", marginBottom: 4 }}>
                            Line 2: {line2.map((id) => getItemName(id)).join(", ")}
                          </div>
                        )}
                        {individuals.map((id) => (
                            <span key={id} style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#2a2a2a", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              {getItemName(id)}
                              {canEdit && (
                                <>
                                  <button type="button" onClick={() => { const idx = st.stationItems.indexOf(id); if (idx >= 0) { const newItems = st.stationItems.filter((_, i) => i !== idx); updateStationItems(st.id, newItems).then((r) => { if (!isErrorResult(r)) setStations((prev) => prev.map((s) => (s.id === st.id ? { ...s, stationItems: newItems } : s))); }); } }} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 10 }} title="Remove">✕</button>
                                  <StationItemReplaceButton stationId={st.id} stationType={st.stationType} currentId={id} stationItems={st.stationItems} getItemName={getItemName} onReplaced={(newItems) => { setStations((prev) => prev.map((s) => (s.id === st.id ? { ...s, stationItems: newItems } : s))); if (selectedEventId) fetchItemNames(selectedEventId, newItems); }} updateStationItems={updateStationItems} isErrorResult={isErrorResult} buttonStyle={buttonStyle} />
                                </>
                              )}
                            </span>
                          ))}
                      </>
                    );
                  })()
                ) : (
                  <>
                    {st.stationItems.map((id) => (
                      <span key={id} style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#2a2a2a", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {getItemName(id)}
                        {canEdit && (
                          <>
                            <button type="button" onClick={() => { const idx = st.stationItems.indexOf(id); if (idx >= 0) { const newItems = st.stationItems.filter((_, i) => i !== idx); updateStationItems(st.id, newItems).then((r) => { if (!isErrorResult(r)) setStations((prev) => prev.map((s) => (s.id === st.id ? { ...s, stationItems: newItems } : s))); }); } }} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 10 }} title="Remove">✕</button>
                            <StationItemReplaceButton stationId={st.id} stationType={st.stationType} currentId={id} stationItems={st.stationItems} getItemName={getItemName} onReplaced={(newItems) => { setStations((prev) => prev.map((s) => (s.id === st.id ? { ...s, stationItems: newItems } : s))); if (selectedEventId) fetchItemNames(selectedEventId, newItems); }} updateStationItems={updateStationItems} isErrorResult={isErrorResult} buttonStyle={buttonStyle} />
                          </>
                        )}
                      </span>
                    ))}
                  </>
                )}
                {!(st.stationPresetId || (st.stationComponents && st.stationComponents.length > 0)) && st.stationItems.length === 0 && (
                  <span style={{ color: "#666", fontSize: 12 }}>No items</span>
                )}
                {canEdit && !(st.stationPresetId || (st.stationComponents && st.stationComponents.length > 0)) && (
                  <StationItemPicker
                    stationId={st.id}
                    stationType={st.stationType}
                    existingIds={st.stationItems}
                    onSelect={(itemId) => addStationItem(st.id, itemId)}
                    buttonStyle={buttonStyle}
                    labelStyle={labelStyle}
                  />
                )}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Station Notes</label>
              <div style={{ color: "#e0e0e0", fontSize: 13, whiteSpace: "pre-wrap" }}>{st.stationNotes || "—"}</div>
            </div>
          </div>
          </div>
          )}
        </div>
        );
      };

  const unassignedStations = stations.filter((s) => !s.beoPlacement);

  return (
    <div style={{ gridColumn: "1 / -1" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
        {STATION_PLACEMENT_GROUPS.map((g) => {
          const groupStations = stations.filter((s) => s.beoPlacement === g.placement);
          if (groupStations.length === 0) return null;
          const groupOpen = placementGroupExpanded[g.placement] === true;
          return (
            <div key={g.placement} style={{ width: "100%", border: creationStationTableBorder, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.2)", overflow: "hidden" }}>
              <div
                role="button"
                tabIndex={0}
                aria-expanded={groupOpen}
                onClick={() => setPlacementGroupExpanded((p) => ({ ...p, [g.placement]: !p[g.placement] }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setPlacementGroupExpanded((p) => ({ ...p, [g.placement]: !p[g.placement] }));
                  }
                }}
                style={{ padding: "8px 12px", background: "rgba(0,0,0,0.15)", borderBottom: groupOpen ? creationStationTableBorder : "none", cursor: "pointer" }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 100, minWidth: 100, padding: 0 }} />
                      <td style={{ padding: 0, textAlign: "center" }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginRight: 6, userSelect: "none" }} aria-hidden>
                          {groupOpen ? "▼" : "▶"}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", color: g.color }}>{g.shadowTitle.toUpperCase()}</span>
                      </td>
                      <td style={{ width: 140, minWidth: 140, padding: 0 }} />
                    </tr>
                  </tbody>
                </table>
              </div>
              {groupOpen && (
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                {groupStations.map((st) => renderStationCard(st))}
              </div>
              )}
            </div>
          );
        })}
        {unassignedStations.length > 0 && (() => {
          const uKey = "__unassigned__";
          const uOpen = placementGroupExpanded[uKey] !== false;
          return (
            <div style={{ width: "100%", border: creationStationTableBorder, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.2)", overflow: "hidden" }}>
              <div
                role="button"
                tabIndex={0}
                aria-expanded={uOpen}
                onClick={() =>
                  setPlacementGroupExpanded((p) =>
                    p[uKey] === false
                      ? (() => {
                          const { [uKey]: _r, ...rest } = p;
                          return rest;
                        })()
                      : { ...p, [uKey]: false }
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setPlacementGroupExpanded((p) =>
                      p[uKey] === false
                        ? (() => {
                            const { [uKey]: _r, ...rest } = p;
                            return rest;
                          })()
                        : { ...p, [uKey]: false }
                    );
                  }
                }}
                style={{ padding: "8px 12px", background: "rgba(0,0,0,0.15)", borderBottom: uOpen ? creationStationTableBorder : "none", cursor: "pointer" }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 100, minWidth: 100, padding: 0 }} />
                      <td style={{ padding: 0, textAlign: "center" }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginRight: 6, userSelect: "none" }} aria-hidden>
                          {uOpen ? "▼" : "▶"}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", color: "#888" }}>OTHER STATIONS</span>
                      </td>
                      <td style={{ width: 140, minWidth: 140, padding: 0 }} />
                    </tr>
                  </tbody>
                </table>
              </div>
              {uOpen && (
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                {unassignedStations.map((st) => renderStationCard(st))}
              </div>
              )}
            </div>
          );
        })()}
      </div>
      {canEdit && (
        <div style={{ marginTop: 16, padding: 12, border: "2px dashed #444", borderRadius: 8 }}>
          <label style={labelStyle}>Add station</label>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {usePresetFlow ? (
              <div>
                <label style={labelStyle}>Station Preset</label>
                <select value={newStationPresetId} onChange={(e) => setNewStationPresetId(e.target.value)} disabled={!canEdit} style={selectStyle}>
                  <option value="">Select preset</option>
                  {stationPresets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label style={labelStyle}>Station Type</label>
                <select value={newStationType} onChange={(e) => setNewStationType(e.target.value)} disabled={!canEdit} style={selectStyle}>
                  <option value="">Select type</option>
                  {([...new Set([...(stationTypeOptions.length > 0 ? stationTypeOptions : []), ...STATION_TYPE_OPTIONS])]).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Station Notes</label>
              <textarea rows={2} value={newStationNotes} onChange={(e) => setNewStationNotes(e.target.value)} disabled={!canEdit} style={inputStyle} placeholder="Special instructions or notes..." />
            </div>
            <button
              type="button"
              disabled={!canEdit || (usePresetFlow ? !newStationPresetId : !newStationType.trim())}
              onClick={openAddStationModal}
              style={compactStyle}
            >
              + Add Station
            </button>
          </div>
        </div>
      )}
      <StationItemsConfigModal
        isOpen={showConfigModal}
        stationType={newStationType}
        stationNotes={newStationNotes}
        getItemName={getItemName}
        onConfirm={confirmAddStation}
        onCancel={() => setShowConfigModal(false)}
        inputStyle={inputStyle}
        labelStyle={labelStyle}
        buttonStyle={buttonStyle}
      />
      {selectedPreset && (
        <StationComponentsConfigModal
          isOpen={showComponentsModal}
          presetId={newStationPresetId}
          presetName={selectedPreset.name}
          stationNotes={newStationNotes}
          initialComponentIds={[]}
          initialCustomItems=""
          initialBeoPlacement={undefined}
          onConfirm={confirmAddStationFromPreset}
          onCancel={() => setShowComponentsModal(false)}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
          buttonStyle={buttonStyle}
          mode="create"
          guestCount={selectedEventData?.[FIELD_IDS.GUEST_COUNT] != null ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT]) : 0}
        />
      )}
      {(() => {
        const editingStation = editingStationId ? stations.find((s) => s.id === editingStationId) : null;
        const resolvedPreset = stationPresets.find((p) => p.id === editingStation?.stationPresetId) ?? stationPresets.find((p) => p.name === editingStation?.stationType);
        const editPresetId = resolvedPreset?.id ?? "";
        const editPreset = resolvedPreset ?? (editingStation ? { id: "", name: editingStation.stationType } : null);
        return editingStation && (editPresetId || editingStation.stationType) ? (
          <StationComponentsConfigModal
            isOpen={!!editingStationId}
            presetId={editPresetId}
            presetName={editPreset.name}
            stationNotes={editingStation.stationNotes}
            initialComponentIds={editingStation.stationComponents ?? []}
            initialCustomItems={editingStation.customItems ?? ""}
            initialBeoPlacement={editingStation.beoPlacement}
            onConfirm={(params) => confirmEditStationComponents(editingStationId!, params)}
            onCancel={() => setEditingStationId(null)}
            inputStyle={inputStyle}
            labelStyle={labelStyle}
            buttonStyle={buttonStyle}
            mode="edit"
            guestCount={selectedEventData?.[FIELD_IDS.GUEST_COUNT] != null ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT]) : 0}
          />
        ) : null;
      })()}
    </div>
  );
}

function norm(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D\-]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

type MenuSelections = {
  passedAppetizers: string[];
  presentedAppetizers: string[];
  buffetMetal: string[];
  buffetChina: string[];
  desserts: string[];
  deliveryDeli: string[];
  fullServiceDeli: string[];
  roomTempDisplay: string[];
  displays: string[];
};

/** Maps Events table linked-field IDs to `MenuSelections` keys (delivery grouping). */
const EVENT_FIELD_ID_TO_LANE: Record<string, keyof MenuSelections> = {
  [FIELD_IDS.PASSED_APPETIZERS]: "passedAppetizers",
  [FIELD_IDS.PRESENTED_APPETIZERS]: "presentedAppetizers",
  [FIELD_IDS.BUFFET_METAL]: "buffetMetal",
  [FIELD_IDS.BUFFET_CHINA]: "buffetChina",
  [FIELD_IDS.ROOM_TEMP_DISPLAY]: "roomTempDisplay",
  [FIELD_IDS.DESSERTS]: "desserts",
  [FIELD_IDS.DELIVERY_DELI]: "deliveryDeli",
};

type CustomFields = {
  customPassedApp: string;
  customPresentedApp: string;
  customBuffetMetal: string;
  customBuffetChina: string;
  customDessert: string;
  customDeli: string;
  customFullServiceDeli: string;
  customRoomTemp: string;
};

function deliveryCustomFieldHasValue(cfid: string, cf: CustomFields): boolean {
  const t = (s: string | undefined) => (s?.trim() ?? "").length > 0;
  if (cfid === FIELD_IDS.CUSTOM_BUFFET_METAL) return t(cf.customBuffetMetal);
  if (cfid === FIELD_IDS.CUSTOM_PASSED_APP) return t(cf.customPassedApp);
  if (cfid === FIELD_IDS.CUSTOM_PRESENTED_APP) return t(cf.customPresentedApp);
  if (cfid === FIELD_IDS.CUSTOM_DELIVERY_DELI) return t(cf.customDeli);
  if (cfid === FIELD_IDS.CUSTOM_BUFFET_CHINA) return t(cf.customBuffetChina);
  if (cfid === FIELD_IDS.CUSTOM_ROOM_TEMP_DISPLAY) return t(cf.customRoomTemp);
  if (cfid === FIELD_IDS.CUSTOM_DESSERTS) return t(cf.customDessert);
  return false;
}

/** With an event selected: hide empty delivery buckets (like full-serve). Sandwich trays always show (boxed lunch + platters). */
function shouldShowDeliveryFoodSection(
  config: DeliverySectionRow,
  sectionRowCount: number,
  cf: CustomFields,
  selectedEventId: string | null
): boolean {
  if (!selectedEventId) return true;
  if (config.id === "sandwich_trays") return true;
  if (sectionRowCount > 0) return true;
  for (const cfid of config.customFieldIds) {
    if (deliveryCustomFieldHasValue(cfid, cf)) return true;
  }
  return false;
}

type MenuItemRecord = {
  id: string;
  name: string;
  category?: string | string[] | null;
  serviceType?: string | string[] | null;
  dietaryTags?: string;
};

/** Matches Event Menu (shadow) `Section` strings for each menu lane — must stay aligned with `targetFieldToSection`. */
const MENU_LANE_TO_SHADOW_SECTION: Partial<Record<keyof MenuSelections, string>> = {
  passedAppetizers: "Passed Appetizers",
  presentedAppetizers: "Presented Appetizers",
  buffetMetal: "Buffet – Metal",
  buffetChina: "Buffet – China",
  desserts: "Desserts",
  deliveryDeli: "Deli",
  fullServiceDeli: "Deli",
  roomTempDisplay: "Room Temp / Display",
};

function shadowRowMatchesLane(
  r: { section: string; catalogItemId: string | null },
  fieldKey: keyof MenuSelections,
  itemId: string
): boolean {
  if (r.catalogItemId !== itemId) return false;
  const hint = MENU_LANE_TO_SHADOW_SECTION[fieldKey];
  if (!hint) return true;
  if (r.section === hint) return true;
  if (fieldKey === "roomTempDisplay" && (r.section === "Room Temp" || r.section === "Room Temp / Display")) return true;
  return false;
}

type MenuSectionProps = {
  embedded?: boolean;
  isDelivery?: boolean;
  /** When set, removing a line deletes the shadow row + syncs so Print/BEO and Airtable stay aligned. */
  shadowMenuRows?: Array<{ id: string; section: string; catalogItemId: string | null }>;
  loadShadowMenu?: (opts?: { retryIfEmpty?: boolean }) => Promise<void>;
};

export const MenuSection = ({
  embedded = false,
  isDelivery = false,
  shadowMenuRows: shadowMenuRowsForRemove,
  loadShadowMenu,
}: MenuSectionProps) => {
  const { selectedEventId, selectedEventData, setFields, loadEventData } = useEventStore();
  const [menuItems, setMenuItems] = useState<LinkedRecordItem[]>([]);
  const [menuItemNames, setMenuItemNames] = useState<Record<string, string>>({});
  const [menuItemChildIds, setMenuItemChildIds] = useState<Record<string, string[]>>({});
  const [menuItemSauce, setMenuItemSauce] = useState<Record<string, string>>({});
  const [menuSpecOverrides, setMenuSpecOverrides] = useState<Record<string, string>>({});
  const [sauceOverrides, setSauceOverridesState] = useState<Record<string, SauceOverride>>({});
  const [selections, setSelections] = useState<MenuSelections>({
    passedAppetizers: [],
    presentedAppetizers: [],
    buffetMetal: [],
    buffetChina: [],
    desserts: [],
    deliveryDeli: [],
    fullServiceDeli: [],
    roomTempDisplay: [],
    displays: [],
  });
  const [customFields, setCustomFields] = useState<CustomFields>({
    customPassedApp: "",
    customPresentedApp: "",
    customBuffetMetal: "",
    customBuffetChina: "",
    customDessert: "",
    customDeli: "",
    customFullServiceDeli: "",
    customRoomTemp: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showDressingPicker, setShowDressingPicker] = useState(false);
  const [dressingPickerSearch, setDressingPickerSearch] = useState("");
  const [platterModalOpen, setPlatterModalOpen] = useState(false);
  /** Menu_Lab execution tokens per catalog id — used to bucket delivery sections. */
  const [deliveryExecByItemId, setDeliveryExecByItemId] = useState<Record<string, string[]>>({});
  const [kitchenFields, setKitchenFields] = useState({ allergies: "", religious: "", dietaryMeals: "" });
  const [dietaryLine, setDietaryLine] = useState({ count: 1, type: "Gluten free", item: "" });
  const [openKitchenPill, setOpenKitchenPill] = useState<"allergies" | "religious" | "dietaryMeals" | "serviceStyle" | null>(null);

  useEffect(() => {
    if (!isDelivery || !selectedEventId) {
      setDeliveryExecByItemId({});
      return;
    }
    const ids = new Set<string>();
    const lanes: (keyof MenuSelections)[] = [
      "passedAppetizers",
      "presentedAppetizers",
      "buffetMetal",
      "buffetChina",
      "roomTempDisplay",
      "desserts",
      "deliveryDeli",
    ];
    for (const lane of lanes) {
      for (const id of selections[lane]) {
        if (id.startsWith("rec")) ids.add(id);
      }
    }
    const idArr = [...ids];
    if (idArr.length === 0) {
      setDeliveryExecByItemId({});
      return;
    }
    let cancelled = false;
    fetchExecutionTokensByMenuItemIds(idArr).then((map) => {
      if (!cancelled) setDeliveryExecByItemId(map);
    });
    return () => {
      cancelled = true;
    };
  }, [
    isDelivery,
    selectedEventId,
    selections.passedAppetizers,
    selections.presentedAppetizers,
    selections.buffetMetal,
    selections.buffetChina,
    selections.roomTempDisplay,
    selections.desserts,
    selections.deliveryDeli,
  ]);

  // Load menu items on mount
  useEffect(() => {
    let active = true;
    const loadItems = async () => {
      try {
        const items = await loadMenuItems();
        if (isErrorResult(items)) {
          if (active) {
            setMenuItems([]);
            setError(items.message ?? "Failed to load menu items.");
          }
          return;
        }
        if (active) setMenuItems(items);
      } catch (err) {
        if (active) {
          setMenuItems([]);
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      }
    };
    loadItems();
    return () => { active = false; };
  }, []);

  // Fetch item names from Airtable when event data has linked record IDs.
  // Batches all fetches and applies a single setState to avoid re-render storm when switching events.
  // Skips update if event changed during fetch (cancellation).
  const fetchItemNames = useCallback(
    async (eventId: string | null, recordIds: string[], options?: { clearWhenEmpty?: boolean }) => {
    const baseId = (import.meta.env.VITE_AIRTABLE_BASE_ID as string)?.trim();
    if (!baseId) return;
    if (!recordIds?.length) {
      if (options?.clearWhenEmpty) {
        if (eventId && useEventStore.getState().selectedEventId !== eventId) return;
        setMenuItemNames({});
        setMenuItemChildIds({});
        setMenuItemSauce({});
      }
      return;
    }

    const uniqueIds = [...new Set(recordIds.filter((id) => typeof id === "string" && id.startsWith("rec")))];
    const allNames: Record<string, string> = {};
    const allSauce: Record<string, string> = {};
    const allRecords: Array<{ id: string; fields: Record<string, unknown> }> = [];
    const cat = getMenuCatalogFieldIds();
    const MENU_TABLE_ID = getMenuItemsTable() || "tbl0aN33DGG6R1sPZ";
    const MENU_ITEM_NAME_FIELD_ID = cat.itemNameFieldId;
    const MENU_ITEMS_CHILD_ITEMS_FIELD_ID = cat.childItemsFieldId;
    const MENU_ITEM_SAUCE_FIELD_ID = cat.longTextSaucesFieldId;

    for (let i = 0; i < uniqueIds.length; i += 10) {
      if (eventId && useEventStore.getState().selectedEventId !== eventId) return;
      const chunk = uniqueIds.slice(i, i + 10);
      const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
      const params = new URLSearchParams();
      params.set("filterByFormula", formula);
      params.set("returnFieldsByFieldId", "true");
      params.append("fields[]", MENU_ITEM_NAME_FIELD_ID);
      if (MENU_ITEM_SAUCE_FIELD_ID) params.append("fields[]", MENU_ITEM_SAUCE_FIELD_ID);
      params.append("fields[]", MENU_ITEMS_CHILD_ITEMS_FIELD_ID);

      try {
        const data = await airtableFetch<{ records?: Array<{ id: string; fields: Record<string, unknown> }> }>(
          `/${MENU_TABLE_ID}?${params.toString()}`
        );
        if (!isErrorResult(data) && data?.records) allRecords.push(...data.records);
      } catch (err) {
        console.error("Failed to fetch item names:", err);
      }
    }
    if (eventId && useEventStore.getState().selectedEventId !== eventId) return;

    for (const rec of allRecords) {
      const name = rec.fields[MENU_ITEM_NAME_FIELD_ID];
      allNames[rec.id] = typeof name === "string" ? name : rec.id;
    }

    // Legacy fallback: IDs not found in configured table → try legacy Menu Items table
    if (MENU_TABLE_ID !== LEGACY_MENU_ITEMS_TABLE_ID) {
      const missingIds = uniqueIds.filter((id) => !allNames[id]);
      if (missingIds.length > 0) {
        const legacyLabel = "fldW5gfSlHRTl01v1";
        const legacyChildren = "fldIu6qmlUwAEn2W9";
        const legacySauce = MENU_ITEM_SAUCE_FIELD_ID;
        for (let i = 0; i < missingIds.length; i += 10) {
          if (eventId && useEventStore.getState().selectedEventId !== eventId) return;
          const chunk = missingIds.slice(i, i + 10);
          const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
          const params = new URLSearchParams();
          params.set("filterByFormula", formula);
          params.set("returnFieldsByFieldId", "true");
          params.append("fields[]", legacyLabel);
          params.append("fields[]", legacyChildren);
          if (legacySauce) params.append("fields[]", legacySauce);
          try {
            const data = await airtableFetch<{ records?: Array<{ id: string; fields: Record<string, unknown> }> }>(
              `/${LEGACY_MENU_ITEMS_TABLE_ID}?${params.toString()}`
            );
            if (!isErrorResult(data) && data?.records) {
              for (const rec of data.records) {
                const nameRaw = rec.fields[legacyLabel];
                allNames[rec.id] = typeof nameRaw === "string" ? nameRaw : rec.id;
                allRecords.push({ id: rec.id, fields: { ...rec.fields, [MENU_ITEM_NAME_FIELD_ID]: rec.fields[legacyLabel], [MENU_ITEMS_CHILD_ITEMS_FIELD_ID]: rec.fields[legacyChildren] } });
              }
            }
          } catch (err) {
            console.error("Failed legacy fallback for item names:", err);
          }
        }
      }
    }

    const childIdsToFetch = new Set<string>();
    const recordsNeedingChild: Array<{ recId: string; firstChildId: string }> = [];
    const childIdsByParent: Record<string, string[]> = {};
    for (const rec of allRecords) {
      const sauceRaw = MENU_ITEM_SAUCE_FIELD_ID ? rec.fields[MENU_ITEM_SAUCE_FIELD_ID] : undefined;
      const sauce = typeof sauceRaw === "string" ? sauceRaw.trim() : "";
      const childIds = asLinkedRecordIds(rec.fields[MENU_ITEMS_CHILD_ITEMS_FIELD_ID]).filter((id) => id?.startsWith("rec"));
      if (childIds.length) childIdsByParent[rec.id] = childIds;
      if (sauce) {
        allSauce[rec.id] = sauce;
      } else {
        const firstChildId = childIds[0];
        if (firstChildId) {
          recordsNeedingChild.push({ recId: rec.id, firstChildId });
          if (!allNames[firstChildId]) childIdsToFetch.add(firstChildId);
        }
      }
    }

    if (childIdsToFetch.size > 0) {
      const childIds = [...childIdsToFetch];
      for (let i = 0; i < childIds.length; i += 10) {
        if (eventId && useEventStore.getState().selectedEventId !== eventId) return;
        const chunk = childIds.slice(i, i + 10);
        const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
        const params = new URLSearchParams();
        params.set("filterByFormula", formula);
        params.set("returnFieldsByFieldId", "true");
        params.append("fields[]", MENU_ITEM_NAME_FIELD_ID);
        try {
          const data = await airtableFetch<{ records?: Array<{ id: string; fields: Record<string, unknown> }> }>(
            `/${MENU_TABLE_ID}?${params.toString()}`
          );
          if (!isErrorResult(data) && data?.records) {
            data.records.forEach((rec) => {
              const name = rec.fields[MENU_ITEM_NAME_FIELD_ID];
              allNames[rec.id] = typeof name === "string" ? name : rec.id;
            });
          }
        } catch (err) {
          console.error("Failed to fetch child item names:", err);
        }
      }

      // Legacy fallback for child IDs not found in configured table
      if (MENU_TABLE_ID !== LEGACY_MENU_ITEMS_TABLE_ID) {
        const missingChildIds = childIds.filter((id) => !allNames[id]);
        if (missingChildIds.length > 0) {
          const legacyLabel = "fldW5gfSlHRTl01v1";
          for (let i = 0; i < missingChildIds.length; i += 10) {
            const chunk = missingChildIds.slice(i, i + 10);
            const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
            const p = new URLSearchParams();
            p.set("filterByFormula", formula);
            p.set("returnFieldsByFieldId", "true");
            p.append("fields[]", legacyLabel);
            try {
              const data = await airtableFetch<{ records?: Array<{ id: string; fields: Record<string, unknown> }> }>(
                `/${LEGACY_MENU_ITEMS_TABLE_ID}?${p.toString()}`
              );
              if (!isErrorResult(data) && data?.records) {
                for (const rec of data.records) {
                  const name = rec.fields[legacyLabel];
                  allNames[rec.id] = typeof name === "string" ? name : rec.id;
                }
              }
            } catch (err) {
              console.error("Failed legacy fallback for child names:", err);
            }
          }
        }
      }
    }
    if (eventId && useEventStore.getState().selectedEventId !== eventId) return;

    for (const { recId, firstChildId } of recordsNeedingChild) {
      const firstChildName = allNames[firstChildId]?.trim();
      if (firstChildName) allSauce[recId] = firstChildName;
    }

    if (options?.clearWhenEmpty) {
      setMenuItemNames(allNames);
      setMenuItemChildIds(childIdsByParent);
      setMenuItemSauce(allSauce);
    } else {
      setMenuItemNames((prev) => ({ ...prev, ...allNames }));
      setMenuItemChildIds((prev) => ({ ...prev, ...childIdsByParent }));
      setMenuItemSauce((prev) => ({ ...prev, ...allSauce }));
    }
  },
  []
);

  // Load selections from event data whenever selectedEventData changes
  // (e.g. after save, after navigating back from print, or when event loads)
  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setSelections({
        passedAppetizers: [],
        presentedAppetizers: [],
        buffetMetal: [],
        buffetChina: [],
        desserts: [],
        deliveryDeli: [],
        fullServiceDeli: [],
        roomTempDisplay: [],
        displays: [],
      });
      setCustomFields({
        customPassedApp: "",
        customPresentedApp: "",
        customBuffetMetal: "",
        customBuffetChina: "",
        customDessert: "",
        customDeli: "",
        customFullServiceDeli: "",
        customRoomTemp: "",
      });
      setKitchenFields({ allergies: "", religious: "", dietaryMeals: "" });
      return;
    }

    const newSelections = {
      passedAppetizers: asLinkedRecordIds(selectedEventData[FIELD_IDS.PASSED_APPETIZERS]),
      presentedAppetizers: asLinkedRecordIds(selectedEventData[FIELD_IDS.PRESENTED_APPETIZERS]),
      buffetMetal: asLinkedRecordIds(selectedEventData[FIELD_IDS.BUFFET_METAL]),
      buffetChina: asLinkedRecordIds(selectedEventData[FIELD_IDS.BUFFET_CHINA]),
      desserts: asLinkedRecordIds(selectedEventData[FIELD_IDS.DESSERTS]),
      deliveryDeli: asLinkedRecordIds(selectedEventData[FIELD_IDS.DELIVERY_DELI]),
      fullServiceDeli: asLinkedRecordIds(selectedEventData[FIELD_IDS.FULL_SERVICE_DELI]),
      roomTempDisplay: asLinkedRecordIds(selectedEventData[FIELD_IDS.ROOM_TEMP_DISPLAY]),
      displays: asLinkedRecordIds(selectedEventData[FIELD_IDS.DISPLAYS]),
    };
    setSelections(newSelections);

    const allRecordIds: string[] = [
      ...newSelections.passedAppetizers,
      ...newSelections.presentedAppetizers,
      ...newSelections.buffetMetal,
      ...newSelections.buffetChina,
      ...newSelections.desserts,
      ...newSelections.deliveryDeli,
      ...newSelections.fullServiceDeli,
      ...newSelections.roomTempDisplay,
      ...newSelections.displays,
    ];
    fetchItemNames(selectedEventId, allRecordIds, { clearWhenEmpty: true });

    setSauceOverridesState(getSauceOverrides(selectedEventId));

    setCustomFields({
      customPassedApp: asString(selectedEventData[FIELD_IDS.CUSTOM_PASSED_APP]),
      customPresentedApp: asString(selectedEventData[FIELD_IDS.CUSTOM_PRESENTED_APP]),
      customBuffetMetal: asString(selectedEventData[FIELD_IDS.CUSTOM_BUFFET_METAL]),
      customBuffetChina: asString(selectedEventData[FIELD_IDS.CUSTOM_BUFFET_CHINA]),
      customDessert: asString(selectedEventData[FIELD_IDS.CUSTOM_DESSERTS]),
      customDeli: asString(selectedEventData[FIELD_IDS.CUSTOM_DELIVERY_DELI]),
      customFullServiceDeli: asString(selectedEventData[FIELD_IDS.CUSTOM_FULL_SERVICE_DELI]),
      customRoomTemp: asString(selectedEventData[FIELD_IDS.CUSTOM_ROOM_TEMP_DISPLAY]),
    });
    setKitchenFields({
      allergies: asString(selectedEventData[FIELD_IDS.DIETARY_NOTES]),
      religious: asString(selectedEventData[FIELD_IDS.RELIGIOUS_RESTRICTIONS]),
      dietaryMeals: asString(selectedEventData[FIELD_IDS.DIETARY_SUMMARY]),
    });
  }, [selectedEventId, selectedEventData, fetchItemNames]);

  // Load spec overrides once per event (not on every save). Isolated from selectedEventData so
  // optimistic saves don't wipe overrides the user is actively editing.
  useEffect(() => {
    if (!selectedEventId) {
      setMenuSpecOverrides({});
      return;
    }
    let parsed: Record<string, string> = {};
    try {
      const fromStorage = localStorage.getItem(getBeoSpecStorageKey(selectedEventId));
      if (fromStorage) {
        const p = JSON.parse(fromStorage);
        if (p && typeof p === "object") parsed = { ...parsed, ...p };
      }
    } catch {
      // ignore
    }
    // Also merge Airtable SPEC_OVERRIDE if present at load time
    try {
      const fromAirtable = asString(selectedEventData?.[FIELD_IDS.SPEC_OVERRIDE])?.trim();
      if (fromAirtable) {
        const p = JSON.parse(fromAirtable);
        if (p && typeof p === "object") parsed = { ...p, ...parsed }; // localStorage wins over Airtable
      }
    } catch {
      // ignore
    }
    setMenuSpecOverrides(parsed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]); // intentionally omit selectedEventData — only re-load on event switch

  // Persist spec overrides to localStorage so BEO print page sees them (effect for bulk/load; handler for immediate write on edit)
  useEffect(() => {
    if (!selectedEventId || Object.keys(menuSpecOverrides).length === 0) return;
    try {
      localStorage.setItem(getBeoSpecStorageKey(selectedEventId), JSON.stringify(menuSpecOverrides));
    } catch {
      // ignore
    }
  }, [selectedEventId, menuSpecOverrides]);

  const handleSpecOverrideChange = (specKey: string, value: string) => {
    setMenuSpecOverrides((prev) => ({ ...prev, [specKey]: value }));
  };

  const canEdit = Boolean(selectedEventId);
  const { openPicker } = usePickerStore();

  const getItemDescriptionForList = useCallback(
    (itemId: string): string | null => {
      const override = sauceOverrides[itemId];
      if (override?.sauceOverride === "Other" && override.customSauce?.trim()) return override.customSauce.trim();
      if (override?.sauceOverride === "None") return null;
      const def = menuItemSauce[itemId]?.trim();
      return def || null;
    },
    [sauceOverrides, menuItemSauce]
  );

  const fieldIdMap: Record<keyof MenuSelections, string> = {
    passedAppetizers: FIELD_IDS.PASSED_APPETIZERS,
    presentedAppetizers: FIELD_IDS.PRESENTED_APPETIZERS,
    buffetMetal: FIELD_IDS.BUFFET_METAL,
    buffetChina: FIELD_IDS.BUFFET_CHINA,
    desserts: FIELD_IDS.DESSERTS,
    deliveryDeli: FIELD_IDS.DELIVERY_DELI,
    fullServiceDeli: FIELD_IDS.FULL_SERVICE_DELI,
    roomTempDisplay: FIELD_IDS.ROOM_TEMP_DISPLAY,
    displays: FIELD_IDS.DISPLAYS,
  };

  const addDressingItem = async (itemId: string) => {
    if (!selectedEventId) return;

    const currentItems = selections.buffetChina;
    if (currentItems.includes(itemId)) return;

    const newItems = [...currentItems, itemId];
    setSelections((prev) => ({ ...prev, buffetChina: newItems }));
    await setFields(selectedEventId, { [FIELD_IDS.BUFFET_CHINA]: newItems });
  };

  /** Add a dressing or salad by name to Custom Buffet China (when not in menu). */
  const addDressingOrSaladCustom = async (name: string) => {
    if (!selectedEventId || !name.trim()) return;
    const current = (customFields.customBuffetChina || "").trim();
    const next = current ? `${current}\n${name.trim()}` : name.trim();
    setCustomFields((prev) => ({ ...prev, customBuffetChina: next }));
    await setFields(selectedEventId, { [FIELD_IDS.CUSTOM_BUFFET_CHINA]: next });
  };

  const closeDressingPicker = () => {
    setShowDressingPicker(false);
    setDressingPickerSearch("");
  };

  const removeMenuItem = async (fieldKey: keyof MenuSelections, itemId: string) => {
    if (!selectedEventId) return;

    const newItems = selections[fieldKey].filter((id) => id !== itemId);
    setSelections((prev) => ({ ...prev, [fieldKey]: newItems }));

    const shadowRow = shadowMenuRowsForRemove?.find((r) => shadowRowMatchesLane(r, fieldKey, itemId));
    if (shadowRow?.id && loadShadowMenu) {
      const del = await deleteEventMenuRow(shadowRow.id);
      if (isErrorResult(del)) {
        await setFields(selectedEventId, { [fieldIdMap[fieldKey]]: newItems });
        return;
      }
      const syncRes = await syncShadowToEvent(selectedEventId);
      if (isErrorResult(syncRes)) {
        await setFields(selectedEventId, { [fieldIdMap[fieldKey]]: newItems });
        return;
      }
      await loadShadowMenu({ retryIfEmpty: true });
      await loadEventData(selectedEventId, { quiet: true });
      return;
    }

    await setFields(selectedEventId, { [fieldIdMap[fieldKey]]: newItems });
  };

  const handleSauceChange = (itemId: string, override: SauceOverride) => {
    if (!selectedEventId) return;
    setSauceOverride(selectedEventId, itemId, override);
    setSauceOverridesState((prev) => ({ ...prev, [itemId]: override }));
  };

  const saveCustomField = async (fieldName: string, value: string) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldName]: value });
  };

  const saveKitchenField = async (fieldId: string, value: string) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const addDietaryMealLine = () => {
    const { count, type, item } = dietaryLine;
    const line = item.trim() ? `${count} ${type} (${item.trim()})` : `${count} ${type}`;
    const next = kitchenFields.dietaryMeals.trim() ? `${kitchenFields.dietaryMeals}\n${line}` : line;
    setKitchenFields((prev) => ({ ...prev, dietaryMeals: next }));
    saveKitchenField(FIELD_IDS.DIETARY_SUMMARY, next);
    setDietaryLine((prev) => ({ ...prev, count: 1, item: "" }));
  };

  const getItemName = (itemId: string) => {
    return menuItemNames[itemId] || menuItems.find((i) => i.id === itemId)?.name || "Loading...";
  };

  // Dressing picker filtered items (categoryKey = "dressing")
  const dressingAllowed = CATEGORY_MAP.dressing || [];
  const dressingSearchLower = dressingPickerSearch.trim().toLowerCase();
  const dressingCategoryFiltered = menuItems.filter((item) => {
    const raw = item.category ?? (item as Record<string, unknown>)["fldM7lWvjH8S0YNSX"];
    const cats = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return cats.some((cat) => dressingAllowed.includes(String(cat)));
  });
  const dressingFilteredItems = !dressingSearchLower
    ? dressingCategoryFiltered
    : dressingCategoryFiltered.filter((item) => item.name.toLowerCase().includes(dressingSearchLower));

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #444",
    backgroundColor: "#1a1a1a",
    color: "#e0e0e0",
    fontSize: "14px",
    resize: "vertical" as const,
    fontFamily: "inherit",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    color: "#999",
    marginBottom: "6px",
    fontWeight: "600" as const,
  };

  const buttonStyle = {
    width: "100%",
    padding: "10px",
    border: "2px dashed #ff6b6b",
    borderRadius: "8px",
    backgroundColor: "transparent",
    color: "#ff6b6b",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  /** Compact save-style buttons for + Add / + Add Custom Item (match contact info Save pill) */
  const smallAddButtonStyle: React.CSSProperties = {
    padding: "6px 14px",
    fontSize: "11px",
    fontWeight: 600,
    borderRadius: 6,
    border: "1px solid rgba(255,107,107,0.5)",
    background: "rgba(255,107,107,0.15)",
    color: "#ff6b6b",
    cursor: "pointer",
    opacity: 1,
    transition: "background 0.2s ease, opacity 0.2s ease",
  };

  const kitchenLabelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" };
  const kitchenInputStyle: React.CSSProperties = { width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#e0e0e0", fontSize: 12, fontFamily: "inherit" };
  const SERVICE_STYLE_OPTIONS = ["Buffet", "Cocktail / Passed Apps Only", "Hybrid (Cocktail + Buffet)", "Family Style", "Plated"];
  const serviceStyleValue = selectedEventData ? asSingleSelectName(selectedEventData[FIELD_IDS.SERVICE_STYLE]) : "";

  const pillBaseStyle: React.CSSProperties = {
    flex: "1 1 0",
    minWidth: 0,
    maxWidth: "25%",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 10,
    backgroundColor: "rgba(30,15,15,0.6)",
    overflow: "hidden",
  };
  const pillHeaderStyle = (isOpen: boolean): React.CSSProperties => ({
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    padding: "10px 12px",
    border: "none",
    background: "none",
    cursor: "pointer",
    color: "inherit",
    textAlign: "left",
  });

  const content = (
    <>
      {error && (
        <div style={{ gridColumn: "1 / -1", color: "#ff6b6b", fontSize: "14px", marginBottom: "12px" }}>
          {error}
        </div>
      )}

      {/* Kitchen / service pills — span full grid width so they spread across the top */}
      <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "nowrap", width: "100%" }}>
        {/* Allergies pill */}
        <div style={pillBaseStyle}>
          <button
            type="button"
            onClick={() => setOpenKitchenPill((p) => (p === "allergies" ? null : "allergies"))}
            style={pillHeaderStyle(openKitchenPill === "allergies")}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Allergies</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", transform: openKitchenPill === "allergies" ? "rotate(90deg)" : "none" }}>▶</span>
          </button>
          {openKitchenPill === "allergies" && (
            <div style={{ padding: "0 12px 12px" }}>
              <input
                type="text"
                value={kitchenFields.allergies}
                disabled={!canEdit}
                onChange={(e) => setKitchenFields((p) => ({ ...p, allergies: e.target.value }))}
                onBlur={(e) => saveKitchenField(FIELD_IDS.DIETARY_NOTES, e.target.value)}
                placeholder="e.g. Shellfish, tree nuts"
                style={kitchenInputStyle}
              />
            </div>
          )}
        </div>
        {/* Religious / dietary pill */}
        <div style={pillBaseStyle}>
          <button
            type="button"
            onClick={() => setOpenKitchenPill((p) => (p === "religious" ? null : "religious"))}
            style={pillHeaderStyle(openKitchenPill === "religious")}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Religious / dietary</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", transform: openKitchenPill === "religious" ? "rotate(90deg)" : "none" }}>▶</span>
          </button>
          {openKitchenPill === "religious" && (
            <div style={{ padding: "0 12px 12px" }}>
              <select
                value=""
                disabled={!canEdit}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) return;
                  const next = kitchenFields.religious.trim() ? `${kitchenFields.religious}; ${v}` : v;
                  setKitchenFields((p) => ({ ...p, religious: next }));
                  saveKitchenField(FIELD_IDS.RELIGIOUS_RESTRICTIONS, next);
                  e.target.value = "";
                }}
                style={{ ...kitchenInputStyle, marginBottom: 6 }}
              >
                <option value="">+ Add…</option>
                <option value="Kosher">Kosher</option>
                <option value="Halal">Halal</option>
                <option value="No pork">No pork</option>
                <option value="Vegetarian options">Vegetarian options</option>
                <option value="Vegan options">Vegan options</option>
                <option value="Dairy free">Dairy free</option>
              </select>
              <input
                type="text"
                value={kitchenFields.religious}
                disabled={!canEdit}
                onChange={(e) => setKitchenFields((p) => ({ ...p, religious: e.target.value }))}
                onBlur={(e) => saveKitchenField(FIELD_IDS.RELIGIOUS_RESTRICTIONS, e.target.value)}
                placeholder="Or type here"
                style={kitchenInputStyle}
              />
            </div>
          )}
        </div>
        {/* Dietary meal counts pill */}
        <div style={pillBaseStyle}>
          <button
            type="button"
            onClick={() => setOpenKitchenPill((p) => (p === "dietaryMeals" ? null : "dietaryMeals"))}
            style={pillHeaderStyle(openKitchenPill === "dietaryMeals")}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Dietary meals</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", transform: openKitchenPill === "dietaryMeals" ? "rotate(90deg)" : "none" }}>▶</span>
          </button>
          {openKitchenPill === "dietaryMeals" && (
            <div style={{ padding: "0 12px 12px" }}>
              <textarea
                rows={2}
                value={kitchenFields.dietaryMeals}
                disabled={!canEdit}
                onChange={(e) => setKitchenFields((p) => ({ ...p, dietaryMeals: e.target.value }))}
                onBlur={(e) => saveKitchenField(FIELD_IDS.DIETARY_SUMMARY, e.target.value)}
                placeholder="e.g. 2 gluten-free crab cakes, 3 vegetarian"
                style={{ ...kitchenInputStyle, resize: "vertical", minHeight: 44 }}
              />
              {canEdit && (
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={dietaryLine.count}
                    onChange={(e) => setDietaryLine((p) => ({ ...p, count: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                    style={{ ...kitchenInputStyle, width: 44, padding: "4px 6px" }}
                  />
                  <select
                    value={dietaryLine.type}
                    onChange={(e) => setDietaryLine((p) => ({ ...p, type: e.target.value }))}
                    style={{ ...kitchenInputStyle, width: 100 }}
                  >
                    <option value="Gluten free">Gluten free</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Dairy free">Dairy free</option>
                    <option value="Nut free">Nut free</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="text"
                    value={dietaryLine.item}
                    onChange={(e) => setDietaryLine((p) => ({ ...p, item: e.target.value }))}
                    placeholder="Item (e.g. Crab Cakes)"
                    style={{ ...kitchenInputStyle, flex: 1, minWidth: 60 }}
                  />
                  <button type="button" onClick={addDietaryMealLine} style={{ ...buttonStyle, padding: "6px 10px", fontSize: 12 }}>Add line</button>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Service style pill — closes after selection */}
        <div style={pillBaseStyle}>
          <button
            type="button"
            onClick={() => setOpenKitchenPill((p) => (p === "serviceStyle" ? null : "serviceStyle"))}
            style={pillHeaderStyle(openKitchenPill === "serviceStyle")}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Service style{serviceStyleValue ? `: ${serviceStyleValue}` : ""}
            </span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", transform: openKitchenPill === "serviceStyle" ? "rotate(90deg)" : "none" }}>▶</span>
          </button>
          {openKitchenPill === "serviceStyle" && (
            <div style={{ padding: "0 12px 12px" }}>
              <select
                value={serviceStyleValue}
                disabled={!canEdit}
                onChange={async (e) => {
                  const value = e.target.value || "";
                  if (!selectedEventId) return;
                  await saveKitchenField(FIELD_IDS.SERVICE_STYLE, value);
                  setOpenKitchenPill(null);
                }}
                style={kitchenInputStyle}
              >
                <option value="">—</option>
                {SERVICE_STYLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {isDelivery ? (
        <div style={{ gridColumn: "1 / -1", width: "100%", display: "flex", justifyContent: "center" }}>
          <div style={{ maxWidth: 720, width: "100%" }}>
            {/* ── Client-facing menu section buttons ── */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 6,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#fff",
              }}
            >
              ADD FROM MENU
            </div>
            <div
              className="beo-menu-add-buttons"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {DELIVERY_INTAKE_SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  disabled={!canEdit}
                  onClick={() =>
                    openPicker(
                      `delivery_intake_${sec.id}`,
                      DELIVERY_INTAKE_TARGET_FIELD,
                      `Add — ${sec.title}`
                    )
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "12px 10px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    cursor: canEdit ? "pointer" : "not-allowed",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{sec.icon}</span>
                  {sec.title}
                </button>
              ))}
            </div>

            {/* ── Kitchen-language food list — now rendered as shadow rows in BeoIntakePage ── */}
            {false && (<><div
              style={{
                textAlign: "center",
                marginBottom: 14,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#fff",
              }}
            >
              YOUR FOOD LIST
            </div>
            {DELIVERY_SECTION_CONFIG.map((config) => {
              const guestCount =
                selectedEventData?.[FIELD_IDS.GUEST_COUNT] != null ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT]) : 0;
              const sectionRows: { itemId: string; lane: keyof MenuSelections; sourceFieldId: string }[] = [];
              for (const fieldId of config.fieldIds) {
                const lane = EVENT_FIELD_ID_TO_LANE[fieldId];
                if (!lane) continue;
                for (const itemId of selections[lane]) {
                  const tokens = deliveryExecByItemId[itemId] ?? [];
                  if (deliveryItemBelongsInSection(config.id, tokens, fieldId)) {
                    sectionRows.push({ itemId, lane, sourceFieldId: fieldId });
                  }
                }
              }
              if (!shouldShowDeliveryFoodSection(config, sectionRows.length, customFields, selectedEventId)) {
                return <Fragment key={config.id} />;
              }
              const course = DELIVERY_COURSE_BLOCK[config.id];
              type DRow = {
                rowKey: string;
                parentId: string;
                lane: keyof MenuSelections;
                sourceFieldId: string;
                isChild: boolean;
                childId?: string;
                isFirstChild?: boolean;
                rowIdx: number;
              };
              const flatRows: DRow[] = [];
              for (const sr of sectionRows) {
                flatRows.push({
                  rowKey: `p-${sr.itemId}-${sr.sourceFieldId}`,
                  parentId: sr.itemId,
                  lane: sr.lane,
                  sourceFieldId: sr.sourceFieldId,
                  isChild: false,
                  rowIdx: 0,
                });
                (menuItemChildIds[sr.itemId] ?? []).forEach((childId, idx) => {
                  flatRows.push({
                    rowKey: `c-${sr.itemId}-${childId}-${sr.sourceFieldId}`,
                    parentId: sr.itemId,
                    lane: sr.lane,
                    sourceFieldId: sr.sourceFieldId,
                    isChild: true,
                    childId,
                    isFirstChild: idx === 0,
                    rowIdx: idx + 1,
                  });
                });
              }
              const overrideInputStyle: React.CSSProperties = {
                width: "100%",
                padding: "4px 6px",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.2)",
                color: "#fff",
                fontSize: 12,
              };
              return (
                <FoodListCollapsible key={config.id} title={course.blockTitle}>
                  <div style={{ margin: "0 8px 8px 8px" }}>
                    <div
                      style={{
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 6,
                        overflow: "hidden",
                        background: "rgba(0,0,0,0.35)",
                      }}
                    >
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr>
                            <th
                              style={{
                                textAlign: "left",
                                padding: "6px 8px",
                                borderBottom: "1px solid rgba(255,255,255,0.12)",
                                fontWeight: 600,
                                color: "#fff",
                                width: "22%",
                              }}
                            >
                              Auto speck
                            </th>
                            <th
                              style={{
                                textAlign: "left",
                                padding: "6px 8px",
                                borderBottom: "1px solid rgba(255,255,255,0.12)",
                                fontWeight: 600,
                                color: "#fff",
                                width: "44%",
                              }}
                            >
                              Items
                            </th>
                            <th
                              style={{
                                textAlign: "left",
                                padding: "6px 8px",
                                borderBottom: "1px solid rgba(255,255,255,0.12)",
                                fontWeight: 600,
                                color: "#fff",
                                width: "24%",
                              }}
                            >
                              Override
                            </th>
                            <th style={{ width: 32 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {flatRows.length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                style={{ padding: "10px 8px", color: "rgba(255,255,255,0.45)", fontSize: 13 }}
                              >
                                No items yet.
                              </td>
                            </tr>
                          ) : (
                            flatRows.map((r) => {
                              const specKey = getSpecOverrideKey(r.sourceFieldId, r.parentId, r.rowIdx);
                              if (r.isChild && r.childId != null) {
                                const ov = sauceOverrides[r.parentId];
                                const defSauce = menuItemSauce[r.parentId] ?? "";
                                const showSauce =
                                  laneUsesSauceOnFirstChild(r.lane) && r.isFirstChild && (defSauce || ov);
                                const childDisplaySpec =
                                  (menuSpecOverrides[specKey] ?? "").trim() !== "" ? menuSpecOverrides[specKey] : "";
                                return (
                                  <tr key={r.rowKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    <td style={{ padding: "4px 8px", color: "#fff", verticalAlign: "top" }}>
                                      {childDisplaySpec || "—"}
                                    </td>
                                    <td style={{ padding: "4px 8px", color: "#fff", paddingLeft: 24, verticalAlign: "top" }}>
                                      {showSauce ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                          <select
                                            value={
                                              ov?.sauceOverride === "Other"
                                                ? "Other"
                                                : ov?.sauceOverride === "None"
                                                  ? "None"
                                                  : "Default"
                                            }
                                            disabled={!canEdit}
                                            onChange={(e) => {
                                              const v = e.target.value as SauceOverrideValue;
                                              handleSauceChange(r.parentId, {
                                                sauceOverride: v,
                                                customSauce: v === "Other" ? ov?.customSauce ?? null : null,
                                              });
                                            }}
                                            style={{ ...inputStyle, padding: "4px 6px", fontSize: 12 }}
                                          >
                                            <option value="Default">{defSauce?.trim() || "Default"}</option>
                                            <option value="None">None</option>
                                            <option value="Other">Other…</option>
                                          </select>
                                          {ov?.sauceOverride === "Other" && (
                                            <input
                                              type="text"
                                              value={ov?.customSauce ?? ""}
                                              onChange={(e) =>
                                                handleSauceChange(r.parentId, {
                                                  sauceOverride: "Other",
                                                  customSauce: e.target.value || null,
                                                })
                                              }
                                              placeholder="Custom sauce name"
                                              disabled={!canEdit}
                                              style={{ ...inputStyle, padding: "4px 6px", fontSize: 12 }}
                                            />
                                          )}
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: 13 }}>
                                          <span style={{ color: "rgba(255,255,255,0.6)", marginRight: 4 }}>•</span>
                                          ✓ {getItemName(r.childId)}
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ padding: 2, verticalAlign: "top" }}>
                                      <input
                                        type="text"
                                        value={menuSpecOverrides[specKey] ?? ""}
                                        disabled={!canEdit}
                                        onChange={(e) => handleSpecOverrideChange(specKey, e.target.value)}
                                        placeholder="—"
                                        style={overrideInputStyle}
                                      />
                                    </td>
                                    <td />
                                  </tr>
                                );
                              }
                              const name = getItemName(r.parentId);
                              const cat = laneToFoodCategory(r.lane);
                              const spec = calculateAutoSpec(name, cat, guestCount);
                              const displaySpec =
                                (menuSpecOverrides[specKey] ?? "").trim() !== "" ? menuSpecOverrides[specKey] : spec.quantity;
                              return (
                                <tr key={r.rowKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                  <td style={{ padding: "4px 8px", color: "#fff", verticalAlign: "top" }}>{displaySpec}</td>
                                  <td style={{ padding: "4px 8px", color: "#fff", verticalAlign: "top" }}>
                                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{name}</div>
                                    {!laneUsesSauceOnFirstChild(r.lane) && (
                                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 4 }}>
                                        <select
                                          value={
                                            (sauceOverrides[r.parentId]?.sauceOverride === "Other"
                                              ? "Other"
                                              : sauceOverrides[r.parentId]?.sauceOverride === "None"
                                                ? "None"
                                                : "Default") as SauceOverrideValue
                                          }
                                          disabled={!canEdit}
                                          onChange={(e) => {
                                            const v = e.target.value as SauceOverrideValue;
                                            const cur = sauceOverrides[r.parentId] ?? {
                                              sauceOverride: "Default" as SauceOverrideValue,
                                              customSauce: null,
                                            };
                                            handleSauceChange(r.parentId, {
                                              sauceOverride: v,
                                              customSauce: v === "Other" ? cur.customSauce : null,
                                            });
                                          }}
                                          style={{ ...inputStyle, padding: "4px 6px", fontSize: 12, maxWidth: 200 }}
                                        >
                                          <option value="Default">
                                            {menuItemSauce[r.parentId]?.trim() || "Default (none)"}
                                          </option>
                                          <option value="None">None</option>
                                          <option value="Other">Other…</option>
                                        </select>
                                        {sauceOverrides[r.parentId]?.sauceOverride === "Other" && (
                                          <input
                                            type="text"
                                            value={sauceOverrides[r.parentId]?.customSauce ?? ""}
                                            onChange={(e) =>
                                              handleSauceChange(r.parentId, {
                                                sauceOverride: "Other",
                                                customSauce: e.target.value || null,
                                              })
                                            }
                                            placeholder="Custom sauce"
                                            disabled={!canEdit}
                                            style={{ ...inputStyle, padding: "4px 6px", fontSize: 12, maxWidth: 200 }}
                                          />
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: 2, verticalAlign: "top" }}>
                                    <input
                                      type="text"
                                      value={menuSpecOverrides[specKey] ?? ""}
                                      disabled={!canEdit}
                                      onChange={(e) => handleSpecOverrideChange(specKey, e.target.value)}
                                      placeholder="—"
                                      style={overrideInputStyle}
                                    />
                                  </td>
                                  <td style={{ padding: "4px 6px", verticalAlign: "top" }}>
                                    <button
                                      type="button"
                                      disabled={!canEdit}
                                      onClick={() => removeMenuItem(r.lane, r.parentId)}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        color: "#ff6b6b",
                                        cursor: "pointer",
                                        fontSize: 16,
                                        fontWeight: "bold",
                                      }}
                                      title="Remove"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div style={{ margin: "0 8px 8px 8px" }}>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => openPicker(config.pickerType, config.targetField, `Add — ${config.title}`)}
                      style={smallAddButtonStyle}
                    >
                      + Add
                    </button>
                  </div>

                  {config.id === "sandwich_trays" ? (
                    <div style={{ margin: "12px 8px 0 8px" }}>
                      <button
                        type="button"
                        onClick={() => setPlatterModalOpen((v) => !v)}
                        style={{ ...smallAddButtonStyle, borderColor: "#f97316", color: "#f97316" }}
                      >
                        {platterModalOpen ? "− Hide platters" : "+ Sandwich platters"}
                      </button>
                      <BoxedLunchSection eventId={selectedEventId} canEdit={canEdit} />
                      {platterModalOpen ? (
                        <SandwichPlatterConfigModal
                          open
                          inline
                          onClose={() => setPlatterModalOpen(false)}
                          onConfirm={(rows) => {
                            if (!selectedEventId) {
                              setError("Select an event first");
                              return;
                            }
                            setPlatterOrdersForEvent(selectedEventId, rows);
                            setPlatterModalOpen(false);
                          }}
                          initialRows={selectedEventId ? getPlatterOrdersByEventId(selectedEventId) : []}
                        />
                      ) : null}
                    </div>
                  ) : null}

                  {config.customFieldIds.map((cfid) => (
                    <div key={cfid} style={{ margin: "8px 8px 12px 8px" }}>
                      {cfid === FIELD_IDS.CUSTOM_BUFFET_METAL && (
                        <CustomFoodItemsBlock
                          value={customFields.customBuffetMetal}
                          fieldId={FIELD_IDS.CUSTOM_BUFFET_METAL}
                          placeholder="Item name"
                          notesPlaceholder="Notes (optional)"
                          canEdit={canEdit}
                          onSave={saveCustomField}
                          label="Custom hot buffet (not in menu)"
                          inputStyle={inputStyle}
                          labelStyle={labelStyle}
                          buttonStyle={smallAddButtonStyle}
                        />
                      )}
                      {cfid === FIELD_IDS.CUSTOM_PASSED_APP && (
                        <CustomFoodItemsBlock
                          value={customFields.customPassedApp}
                          fieldId={FIELD_IDS.CUSTOM_PASSED_APP}
                          placeholder="Item name"
                          notesPlaceholder="Notes (optional)"
                          canEdit={canEdit}
                          onSave={saveCustomField}
                          label="Custom (not in menu)"
                          inputStyle={inputStyle}
                          labelStyle={labelStyle}
                          buttonStyle={smallAddButtonStyle}
                        />
                      )}
                      {cfid === FIELD_IDS.CUSTOM_PRESENTED_APP && (
                        <CustomFoodItemsBlock
                          value={customFields.customPresentedApp}
                          fieldId={FIELD_IDS.CUSTOM_PRESENTED_APP}
                          placeholder="Item name"
                          notesPlaceholder="Notes (optional)"
                          canEdit={canEdit}
                          onSave={saveCustomField}
                          label="Custom (not in menu)"
                          inputStyle={inputStyle}
                          labelStyle={labelStyle}
                          buttonStyle={smallAddButtonStyle}
                        />
                      )}
                      {cfid === FIELD_IDS.CUSTOM_DELIVERY_DELI && (
                        <CustomFoodItemsBlock
                          value={customFields.customDeli}
                          fieldId={FIELD_IDS.CUSTOM_DELIVERY_DELI}
                          placeholder="Sandwich or wrap name"
                          notesPlaceholder="Notes (optional)"
                          canEdit={canEdit}
                          onSave={saveCustomField}
                          label="Custom sandwich / wrap (not in menu)"
                          inputStyle={inputStyle}
                          labelStyle={labelStyle}
                          buttonStyle={smallAddButtonStyle}
                        />
                      )}
                      {cfid === FIELD_IDS.CUSTOM_BUFFET_CHINA && (
                        <CustomFoodItemsBlock
                          value={customFields.customBuffetChina}
                          fieldId={FIELD_IDS.CUSTOM_BUFFET_CHINA}
                          placeholder="Item name"
                          notesPlaceholder="Notes (optional)"
                          canEdit={canEdit}
                          onSave={saveCustomField}
                          label="Custom cold / bulk (not in menu)"
                          inputStyle={inputStyle}
                          labelStyle={labelStyle}
                          buttonStyle={smallAddButtonStyle}
                        />
                      )}
                      {cfid === FIELD_IDS.CUSTOM_ROOM_TEMP_DISPLAY && (
                        <CustomFoodItemsBlock
                          value={customFields.customRoomTemp}
                          fieldId={FIELD_IDS.CUSTOM_ROOM_TEMP_DISPLAY}
                          placeholder="Salad or display item"
                          notesPlaceholder="Notes (optional)"
                          canEdit={canEdit}
                          onSave={saveCustomField}
                          label="Custom salad / display (not in menu)"
                          inputStyle={inputStyle}
                          labelStyle={labelStyle}
                          buttonStyle={smallAddButtonStyle}
                        />
                      )}
                      {cfid === FIELD_IDS.CUSTOM_DESSERTS && (
                        <CustomFoodItemsBlock
                          value={customFields.customDessert}
                          fieldId={FIELD_IDS.CUSTOM_DESSERTS}
                          placeholder="Dessert name"
                          notesPlaceholder="Notes (optional)"
                          canEdit={canEdit}
                          onSave={saveCustomField}
                          label="Custom desserts (not in menu)"
                          inputStyle={inputStyle}
                          labelStyle={labelStyle}
                          buttonStyle={smallAddButtonStyle}
                        />
                      )}
                    </div>
                  ))}
                </FoodListCollapsible>
              );
            })}</>)}
          </div>
        </div>
      ) : (
        /* ── FULL SERVICE: Passed → Presented → Buffet Metal → China → Deli → Desserts → Platters → Stations ── */
        <div style={{ gridColumn: "1 / -1", width: "100%", display: "flex", justifyContent: "center" }}>
          <div style={{ maxWidth: 640, width: "100%" }}>
      {/* Passed Appetizers — every item on its own row for speck: parent line then sauce/child line(s); specKey matches BEO print */}
      <CourseStyleBlock title="PASSED APPETIZERS" dotColor="#22c55e">
        <label style={labelStyle}>Passed Appetizers</label>
        {(() => {
          const fieldId = FIELD_IDS.PASSED_APPETIZERS;
          const guestCount = selectedEventData?.[FIELD_IDS.GUEST_COUNT] != null ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT]) : 0;
          const itemIds = selections.passedAppetizers;
          const rows: { rowKey: string; parentId: string; isChild: boolean; childId?: string; isFirstChild?: boolean; rowIdx: number }[] = [];
          itemIds.forEach((parentId) => {
            rows.push({ rowKey: `parent-${parentId}`, parentId, isChild: false, rowIdx: 0 });
            (menuItemChildIds[parentId] ?? []).forEach((childId, idx) => {
              rows.push({ rowKey: `child-${parentId}-${childId}`, parentId, isChild: true, childId, isFirstChild: idx === 0, rowIdx: idx + 1 });
            });
          });
          return (
            <>
              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, overflow: "hidden", background: "rgba(0,0,0,0.25)", marginBottom: 6 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "22%" }}>Auto speck</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "44%" }}>Items</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "24%" }}>Override</th>
                      <th style={{ width: 32 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const specKey = getSpecOverrideKey(fieldId, r.parentId, r.rowIdx);
                      if (r.isChild && r.childId != null) {
                        const override = sauceOverrides[r.parentId];
                        const defSauce = menuItemSauce[r.parentId] ?? "";
                        const showSauce = r.isFirstChild && (defSauce || override);
                        const childDisplaySpec = (menuSpecOverrides[specKey] ?? "").trim() !== "" ? menuSpecOverrides[specKey] : "";
                        return (
                          <tr key={r.rowKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                            <td style={{ padding: "4px 8px", color: "#fff" }}>{childDisplaySpec}</td>
                            <td style={{ padding: "4px 8px", color: "#fff", paddingLeft: 24 }}>
                              {showSauce ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  <select
                                    value={override?.sauceOverride === "Other" ? "Other" : override?.sauceOverride === "None" ? "None" : "Default"}
                                    disabled={!canEdit}
                                    onChange={(e) => {
                                      const v = e.target.value as SauceOverrideValue;
                                      handleSauceChange(r.parentId, { sauceOverride: v, customSauce: v === "Other" ? override?.customSauce ?? null : null });
                                    }}
                                    style={{ ...inputStyle, padding: "4px 6px", fontSize: 12 }}
                                  >
                                    <option value="Default">{defSauce?.trim() || "Default"}</option>
                                    <option value="None">None</option>
                                    <option value="Other">Other…</option>
                                  </select>
                                  {override?.sauceOverride === "Other" && (
                                    <input
                                      type="text"
                                      value={override?.customSauce ?? ""}
                                      onChange={(e) => handleSauceChange(r.parentId, { sauceOverride: "Other", customSauce: e.target.value || null })}
                                      placeholder="Custom sauce name"
                                      disabled={!canEdit}
                                      style={{ ...inputStyle, padding: "4px 6px", fontSize: 12 }}
                                    />
                                  )}
                                </div>
                              ) : (
                                getItemName(r.childId)
                              )}
                            </td>
                            <td style={{ padding: 2 }}>
                              <input type="text" value={menuSpecOverrides[specKey] ?? ""} disabled={!canEdit} onChange={(e) => handleSpecOverrideChange(specKey, e.target.value)} placeholder="—" style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: 12 }} />
                            </td>
                            <td />
                          </tr>
                        );
                      }
                      const name = getItemName(r.parentId);
                      const spec = calculateAutoSpec(name, "passed", guestCount);
                      const displaySpec = (menuSpecOverrides[specKey] ?? "").trim() !== "" ? menuSpecOverrides[specKey] : spec.quantity;
                      return (
                        <tr key={r.rowKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          <td style={{ padding: "4px 8px", color: "#fff" }}>{displaySpec}</td>
                          <td style={{ padding: "4px 8px", color: "#fff" }}>{name}</td>
                          <td style={{ padding: 2 }}>
                            <input type="text" value={menuSpecOverrides[specKey] ?? ""} disabled={!canEdit} onChange={(e) => handleSpecOverrideChange(specKey, e.target.value)} placeholder="—" style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: 12 }} />
                          </td>
                          <td style={{ padding: "2px 6px" }}>
                            <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("passedAppetizers", r.parentId)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }} title="Remove">✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button type="button" disabled={!canEdit} onClick={() => openPicker("passed", "passedApps", "Passed Appetizers")} style={smallAddButtonStyle}>+ Add</button>
              <div style={{ marginTop: 6 }}>
                <CustomFoodItemsBlock value={customFields.customPassedApp} fieldId={FIELD_IDS.CUSTOM_PASSED_APP} placeholder="Item name" notesPlaceholder="Notes (optional)" canEdit={canEdit} onSave={saveCustomField} label="Custom Passed Appetizers (not in menu)" inputStyle={inputStyle} labelStyle={labelStyle} buttonStyle={smallAddButtonStyle} />
              </div>
            </>
          );
        })()}
      </CourseStyleBlock>

      {/* Presented Appetizers — every item on its own row for speck: parent line then sauce/child line(s); specKey matches BEO print */}
      <CourseStyleBlock title="PRESENTED APPETIZERS" dotColor="#f97316">
        <label style={labelStyle}>Presented Appetizers</label>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Override cell to edit. Speck engine will use when wired. Every item on its own line.</p>
        {(() => {
          const fieldId = FIELD_IDS.PRESENTED_APPETIZERS;
          const guestCount = selectedEventData?.[FIELD_IDS.GUEST_COUNT] != null ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT]) : 0;
          const itemIds = selections.presentedAppetizers;
          const rows: { rowKey: string; parentId: string; isChild: boolean; childId?: string; isFirstChild?: boolean; rowIdx: number }[] = [];
          itemIds.forEach((parentId) => {
            rows.push({ rowKey: `parent-${parentId}`, parentId, isChild: false, rowIdx: 0 });
            (menuItemChildIds[parentId] ?? []).forEach((childId, idx) => {
              rows.push({ rowKey: `child-${parentId}-${childId}`, parentId, isChild: true, childId, isFirstChild: idx === 0, rowIdx: idx + 1 });
            });
          });
          return (
            <>
              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, overflow: "hidden", background: "rgba(0,0,0,0.25)", marginBottom: 6 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "22%" }}>Auto speck</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "44%" }}>Items</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "24%" }}>Override</th>
                      <th style={{ width: 32 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const specKey = getSpecOverrideKey(fieldId, r.parentId, r.rowIdx);
                      if (r.isChild && r.childId != null) {
                        const override = sauceOverrides[r.parentId];
                        const defSauce = menuItemSauce[r.parentId] ?? "";
                        const showSauce = r.isFirstChild && (defSauce || override);
                        const childDisplaySpec = (menuSpecOverrides[specKey] ?? "").trim() !== "" ? menuSpecOverrides[specKey] : "";
                        return (
                          <tr key={r.rowKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                            <td style={{ padding: "4px 8px", color: "#fff" }}>{childDisplaySpec}</td>
                            <td style={{ padding: "4px 8px", color: "#fff", paddingLeft: 24 }}>
                              {showSauce ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  <select
                                    value={override?.sauceOverride === "Other" ? "Other" : override?.sauceOverride === "None" ? "None" : "Default"}
                                    disabled={!canEdit}
                                    onChange={(e) => {
                                      const v = e.target.value as SauceOverrideValue;
                                      handleSauceChange(r.parentId, { sauceOverride: v, customSauce: v === "Other" ? override?.customSauce ?? null : null });
                                    }}
                                    style={{ ...inputStyle, padding: "4px 6px", fontSize: 12 }}
                                  >
                                    <option value="Default">{defSauce?.trim() || "Default"}</option>
                                    <option value="None">None</option>
                                    <option value="Other">Other…</option>
                                  </select>
                                  {override?.sauceOverride === "Other" && (
                                    <input
                                      type="text"
                                      value={override?.customSauce ?? ""}
                                      onChange={(e) => handleSauceChange(r.parentId, { sauceOverride: "Other", customSauce: e.target.value || null })}
                                      placeholder="Custom sauce name"
                                      disabled={!canEdit}
                                      style={{ ...inputStyle, padding: "4px 6px", fontSize: 12 }}
                                    />
                                  )}
                                </div>
                              ) : (
                                getItemName(r.childId)
                              )}
                            </td>
                            <td style={{ padding: 2 }}>
                              <input type="text" value={menuSpecOverrides[specKey] ?? ""} disabled={!canEdit} onChange={(e) => handleSpecOverrideChange(specKey, e.target.value)} placeholder="—" style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: 12 }} />
                            </td>
                            <td />
                          </tr>
                        );
                      }
                      const name = getItemName(r.parentId);
                      const spec = calculateAutoSpec(name, "presented", guestCount);
                      const displaySpec = (menuSpecOverrides[specKey] ?? "").trim() !== "" ? menuSpecOverrides[specKey] : spec.quantity;
                      return (
                        <tr key={r.rowKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          <td style={{ padding: "4px 8px", color: "#fff" }}>{displaySpec}</td>
                          <td style={{ padding: "4px 8px", color: "#fff" }}>{name}</td>
                          <td style={{ padding: 2 }}>
                            <input type="text" value={menuSpecOverrides[specKey] ?? ""} disabled={!canEdit} onChange={(e) => handleSpecOverrideChange(specKey, e.target.value)} placeholder="—" style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: 12 }} />
                          </td>
                          <td style={{ padding: "2px 6px" }}>
                            <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("presentedAppetizers", r.parentId)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }} title="Remove">✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button type="button" disabled={!canEdit} onClick={() => openPicker("presented", "presentedApps", "Presented Appetizers")} style={smallAddButtonStyle}>+ Add</button>
              <div style={{ marginTop: 6 }}>
                <CustomFoodItemsBlock value={customFields.customPresentedApp} fieldId={FIELD_IDS.CUSTOM_PRESENTED_APP} placeholder="Item name" notesPlaceholder="Notes (optional)" canEdit={canEdit} onSave={saveCustomField} label="Custom Presented Appetizers (not in menu)" inputStyle={inputStyle} labelStyle={labelStyle} buttonStyle={smallAddButtonStyle} />
              </div>
            </>
          );
        })()}
      </CourseStyleBlock>

      {/* Buffet – Metal — table layout */}
      <CourseStyleBlock title="BUFFET – METAL" dotColor="#3b82f6">
        <label style={labelStyle}>Buffet – Metal</label>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Override cell to edit. Speck engine will use when wired.</p>
        {(() => {
          const fieldId = FIELD_IDS.BUFFET_METAL;
          const guestCount = selectedEventData?.[FIELD_IDS.GUEST_COUNT] != null ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT]) : 0;
          const itemIds = selections.buffetMetal;
          const rows: { rowKey: string; parentId: string; isChild: boolean; childId?: string; rowIdx: number }[] = [];
          itemIds.forEach((parentId) => {
            rows.push({ rowKey: `parent-${parentId}`, parentId, isChild: false, rowIdx: 0 });
            (menuItemChildIds[parentId] ?? []).forEach((childId, idx) => {
              rows.push({ rowKey: `child-${parentId}-${childId}`, parentId, isChild: true, childId, rowIdx: idx + 1 });
            });
          });
          return (
            <>
              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, overflow: "hidden", background: "rgba(0,0,0,0.25)", marginBottom: 6 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "22%" }}>Auto speck</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "44%" }}>Items</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "24%" }}>Override</th>
                      <th style={{ width: 32 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const specKey = getSpecOverrideKey(fieldId, r.parentId, r.rowIdx);
                      if (r.isChild && r.childId != null) {
                        const childDisplaySpec = (menuSpecOverrides[specKey] ?? "").trim() !== "" ? menuSpecOverrides[specKey] : "";
                        return (
                          <tr key={r.rowKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                            <td style={{ padding: "4px 8px", color: "#fff" }}>{childDisplaySpec}</td>
                            <td style={{ padding: "4px 8px", color: "#fff", paddingLeft: 24 }}>{getItemName(r.childId)}</td>
                            <td style={{ padding: 2 }}>
                              <input type="text" value={menuSpecOverrides[specKey] ?? ""} disabled={!canEdit} onChange={(e) => handleSpecOverrideChange(specKey, e.target.value)} placeholder="—" style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: 12 }} />
                            </td>
                            <td />
                          </tr>
                        );
                      }
                      const name = getItemName(r.parentId);
                      const spec = calculateAutoSpec(name, "buffet", guestCount);
                      const displaySpec = (menuSpecOverrides[specKey] ?? "").trim() !== "" ? menuSpecOverrides[specKey] : spec.quantity;
                      return (
                        <tr key={r.rowKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          <td style={{ padding: "4px 8px", color: "#fff" }}>{displaySpec}</td>
                          <td style={{ padding: "4px 8px", color: "#fff" }}>{name}</td>
                          <td style={{ padding: 2 }}>
                            <input type="text" value={menuSpecOverrides[specKey] ?? ""} disabled={!canEdit} onChange={(e) => handleSpecOverrideChange(specKey, e.target.value)} placeholder="—" style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: 12 }} />
                          </td>
                          <td style={{ padding: "2px 6px" }}>
                            <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("buffetMetal", r.parentId)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }} title="Remove">✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button type="button" disabled={!canEdit} onClick={() => openPicker("buffet_metal", "buffetMetal", "Buffet – Metal")} style={smallAddButtonStyle}>+ Add</button>
              <div style={{ marginTop: 6 }}>
                <CustomFoodItemsBlock value={customFields.customBuffetMetal} fieldId={FIELD_IDS.CUSTOM_BUFFET_METAL} placeholder="Item name" notesPlaceholder="Notes (optional)" canEdit={canEdit} onSave={saveCustomField} label="Custom Buffet Metal (not in menu)" inputStyle={inputStyle} labelStyle={labelStyle} buttonStyle={smallAddButtonStyle} />
              </div>
            </>
          );
        })()}
      </CourseStyleBlock>

      {/* Buffet – China — table layout */}
      <CourseStyleBlock title="BUFFET – CHINA" dotColor="#3b82f6">
        <label style={labelStyle}>Buffet – China</label>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Override cell to edit. Speck engine will use when wired.</p>
        {(() => {
          const fieldId = FIELD_IDS.BUFFET_CHINA;
          const guestCount = selectedEventData?.[FIELD_IDS.GUEST_COUNT] != null ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT]) : 0;
          const itemIds = selections.buffetChina;
          const rows: { rowKey: string; parentId: string; isChild: boolean; childId?: string; rowIdx: number }[] = [];
          itemIds.forEach((parentId) => {
            rows.push({ rowKey: `parent-${parentId}`, parentId, isChild: false, rowIdx: 0 });
            (menuItemChildIds[parentId] ?? []).forEach((childId, idx) => {
              rows.push({ rowKey: `child-${parentId}-${childId}`, parentId, isChild: true, childId, rowIdx: idx + 1 });
            });
          });
          return (
            <>
              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, overflow: "hidden", background: "rgba(0,0,0,0.25)", marginBottom: 6 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "22%" }}>Auto speck</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "44%" }}>Items</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "24%" }}>Override</th>
                      <th style={{ width: 32 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const specKey = getSpecOverrideKey(fieldId, r.parentId, r.rowIdx);
                      if (r.isChild && r.childId != null) {
                        const childDisplaySpec = (menuSpecOverrides[specKey] ?? "").trim() !== "" ? menuSpecOverrides[specKey] : "";
                        return (
                          <tr key={r.rowKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                            <td style={{ padding: "4px 8px", color: "#fff" }}>{childDisplaySpec}</td>
                            <td style={{ padding: "4px 8px", color: "#fff", paddingLeft: 24 }}>{getItemName(r.childId)}</td>
                            <td style={{ padding: 2 }}>
                              <input type="text" value={menuSpecOverrides[specKey] ?? ""} disabled={!canEdit} onChange={(e) => handleSpecOverrideChange(specKey, e.target.value)} placeholder="—" style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: 12 }} />
                            </td>
                            <td />
                          </tr>
                        );
                      }
                      const name = getItemName(r.parentId);
                      const spec = calculateAutoSpec(name, "buffet", guestCount);
                      const displaySpec = (menuSpecOverrides[specKey] ?? "").trim() !== "" ? menuSpecOverrides[specKey] : spec.quantity;
                      return (
                        <tr key={r.rowKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          <td style={{ padding: "4px 8px", color: "#fff" }}>{displaySpec}</td>
                          <td style={{ padding: "4px 8px", color: "#fff" }}>{name}</td>
                          <td style={{ padding: 2 }}>
                            <input type="text" value={menuSpecOverrides[specKey] ?? ""} disabled={!canEdit} onChange={(e) => handleSpecOverrideChange(specKey, e.target.value)} placeholder="—" style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: 12 }} />
                          </td>
                          <td style={{ padding: "2px 6px" }}>
                            <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("buffetChina", r.parentId)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }} title="Remove">✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button type="button" disabled={!canEdit} onClick={() => openPicker("buffet_china", "buffetChina", "Select Buffet Items (China)")} style={smallAddButtonStyle}>+ Add</button>
              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={labelStyle}>Salads & dressings</span>
                <button type="button" disabled={!canEdit} onClick={() => setShowDressingPicker(true)} style={smallAddButtonStyle}>+ Add dressing</button>
              </div>
              <div style={{ marginTop: 6 }}>
                <CustomFoodItemsBlock value={customFields.customBuffetChina} fieldId={FIELD_IDS.CUSTOM_BUFFET_CHINA} placeholder="Item name" notesPlaceholder="Notes (optional)" canEdit={canEdit} onSave={saveCustomField} label="Custom Buffet China (not in menu)" inputStyle={inputStyle} labelStyle={labelStyle} buttonStyle={smallAddButtonStyle} />
              </div>
            </>
          );
        })()}
      </CourseStyleBlock>

      {/* DELI (full service) — before desserts */}
      <div id="beo-menu-deli">
      <CourseStyleBlock title="DELI" dotColor="#eab308">
        <label style={labelStyle}>DELI</label>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Override cell to edit. Speck engine will use when wired.</p>
        {(() => {
          const fieldId = FIELD_IDS.FULL_SERVICE_DELI;
          const guestCount = selectedEventData?.[FIELD_IDS.GUEST_COUNT] != null ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT]) : 0;
          const itemIds = selections.fullServiceDeli;
          const rows: { rowKey: string; parentId: string; isChild: boolean; childId?: string; rowIdx: number }[] = [];
          itemIds.forEach((parentId) => {
            rows.push({ rowKey: `parent-${parentId}`, parentId, isChild: false, rowIdx: 0 });
            (menuItemChildIds[parentId] ?? []).forEach((childId, idx) => {
              rows.push({ rowKey: `child-${parentId}-${childId}`, parentId, isChild: true, childId, rowIdx: idx + 1 });
            });
          });
          return (
            <>
              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, overflow: "hidden", background: "rgba(0,0,0,0.25)", marginBottom: 6 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "22%" }}>Auto speck</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "44%" }}>Items</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "24%" }}>Override</th>
                      <th style={{ width: 32 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const specKey = getSpecOverrideKey(fieldId, r.parentId, r.rowIdx);
                      if (r.isChild && r.childId != null) {
                        const childDisplaySpec = (menuSpecOverrides[specKey] ?? "").trim() !== "" ? menuSpecOverrides[specKey] : "";
                        return (
                          <tr key={r.rowKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                            <td style={{ padding: "4px 8px", color: "#fff" }}>{childDisplaySpec}</td>
                            <td style={{ padding: "4px 8px", color: "#fff", paddingLeft: 24 }}>{getItemName(r.childId)}</td>
                            <td style={{ padding: 2 }}>
                              <input type="text" value={menuSpecOverrides[specKey] ?? ""} disabled={!canEdit} onChange={(e) => handleSpecOverrideChange(specKey, e.target.value)} placeholder="—" style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: 12 }} />
                            </td>
                            <td />
                          </tr>
                        );
                      }
                      const name = getItemName(r.parentId);
                      const spec = calculateAutoSpec(name, "buffet", guestCount);
                      const displaySpec = (menuSpecOverrides[specKey] ?? "").trim() !== "" ? menuSpecOverrides[specKey] : spec.quantity;
                      return (
                        <tr key={r.rowKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          <td style={{ padding: "4px 8px", color: "#fff" }}>{displaySpec}</td>
                          <td style={{ padding: "4px 8px", color: "#fff" }}>{name}</td>
                          <td style={{ padding: 2 }}>
                            <input type="text" value={menuSpecOverrides[specKey] ?? ""} disabled={!canEdit} onChange={(e) => handleSpecOverrideChange(specKey, e.target.value)} placeholder="—" style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: 12 }} />
                          </td>
                          <td style={{ padding: "2px 6px" }}>
                            <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("fullServiceDeli", r.parentId)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }} title="Remove">✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button type="button" disabled={!canEdit} onClick={() => openPicker("deli", "fullServiceDeli", "Select Deli Items (Sandwiches, Wraps)")} style={smallAddButtonStyle}>+ Add</button>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>For sandwich platters and other DELI items. Slider rolls, lettuce & tomato, condiments are picked in the station (e.g. Configure Station All-American).</p>
              <div style={{ marginTop: 6 }}>
                <CustomFoodItemsBlock value={customFields.customFullServiceDeli} fieldId={FIELD_IDS.CUSTOM_FULL_SERVICE_DELI} placeholder="Item name" notesPlaceholder="Notes (optional)" canEdit={canEdit} onSave={saveCustomField} label="Custom DELI (not in menu)" inputStyle={inputStyle} labelStyle={labelStyle} buttonStyle={smallAddButtonStyle} />
              </div>
            </>
          );
        })()}
      </CourseStyleBlock>
      </div>

      {/* Desserts — table layout */}
      <CourseStyleBlock title="DESSERTS" dotColor="#ef4444">
        <label style={labelStyle}>Desserts</label>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Override cell to edit. Speck engine will use when wired.</p>
        {(() => {
          const fieldId = FIELD_IDS.DESSERTS;
          const guestCount = selectedEventData?.[FIELD_IDS.GUEST_COUNT] != null ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT]) : 0;
          const itemIds = selections.desserts;
          const rows: { rowKey: string; parentId: string; isChild: boolean; childId?: string; rowIdx: number }[] = [];
          itemIds.forEach((parentId) => {
            rows.push({ rowKey: `parent-${parentId}`, parentId, isChild: false, rowIdx: 0 });
            (menuItemChildIds[parentId] ?? []).forEach((childId, idx) => {
              rows.push({ rowKey: `child-${parentId}-${childId}`, parentId, isChild: true, childId, rowIdx: idx + 1 });
            });
          });
          return (
            <>
              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, overflow: "hidden", background: "rgba(0,0,0,0.25)", marginBottom: 6 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "22%" }}>Auto speck</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "44%" }}>Items</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "#fff", width: "24%" }}>Override</th>
                      <th style={{ width: 32 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const specKey = getSpecOverrideKey(fieldId, r.parentId, r.rowIdx);
                      if (r.isChild && r.childId != null) {
                        const childDisplaySpec = (menuSpecOverrides[specKey] ?? "").trim() !== "" ? menuSpecOverrides[specKey] : "";
                        return (
                          <tr key={r.rowKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                            <td style={{ padding: "4px 8px", color: "#fff" }}>{childDisplaySpec}</td>
                            <td style={{ padding: "4px 8px", color: "#fff", paddingLeft: 24 }}>{getItemName(r.childId)}</td>
                            <td style={{ padding: 2 }}>
                              <input type="text" value={menuSpecOverrides[specKey] ?? ""} disabled={!canEdit} onChange={(e) => handleSpecOverrideChange(specKey, e.target.value)} placeholder="—" style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: 12 }} />
                            </td>
                            <td />
                          </tr>
                        );
                      }
                      const name = getItemName(r.parentId);
                      const spec = calculateAutoSpec(name, "dessert", guestCount);
                      const displaySpec = (menuSpecOverrides[specKey] ?? "").trim() !== "" ? menuSpecOverrides[specKey] : spec.quantity;
                      return (
                        <tr key={r.rowKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          <td style={{ padding: "4px 8px", color: "#fff" }}>{displaySpec}</td>
                          <td style={{ padding: "4px 8px", color: "#fff" }}>{name}</td>
                          <td style={{ padding: 2 }}>
                            <input type="text" value={menuSpecOverrides[specKey] ?? ""} disabled={!canEdit} onChange={(e) => handleSpecOverrideChange(specKey, e.target.value)} placeholder="—" style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: 12 }} />
                          </td>
                          <td style={{ padding: "2px 6px" }}>
                            <button type="button" disabled={!canEdit} onClick={() => removeMenuItem("desserts", r.parentId)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }} title="Remove">✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button type="button" disabled={!canEdit} onClick={() => openPicker("desserts", "desserts", "Desserts")} style={smallAddButtonStyle}>+ Add</button>
              <div style={{ marginTop: 6 }}>
                <CustomFoodItemsBlock value={customFields.customDessert} fieldId={FIELD_IDS.CUSTOM_DESSERTS} placeholder="Dessert name" notesPlaceholder="Notes (optional)" canEdit={canEdit} onSave={saveCustomField} label="Custom Desserts (not in menu)" inputStyle={inputStyle} labelStyle={labelStyle} buttonStyle={smallAddButtonStyle} />
              </div>
            </>
          );
        })()}
      </CourseStyleBlock>

      {/* Sandwich Platters — bottom, same block style */}
      <CourseStyleBlock title="SANDWICH PLATTERS" dotColor="#d97706">
        <label style={labelStyle}>Sandwich & Wrap Platters</label>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Available for full service and delivery events. Selections are scoped to each platter tier.</p>
        <button
          type="button"
          onClick={() => setPlatterModalOpen((v) => !v)}
          style={{ ...buttonStyle, borderColor: "#f97316", color: "#f97316", background: "rgba(249,115,22,0.1)" }}
        >
          {platterModalOpen ? "− Hide Platter Config" : "+ Configure Sandwich Platters"}
        </button>
        {platterModalOpen && (
          <SandwichPlatterConfigModal
            open
            inline
            onClose={() => setPlatterModalOpen(false)}
            onConfirm={(rows) => {
              if (!selectedEventId) { setError("Select an event first"); return; }
              setPlatterOrdersForEvent(selectedEventId, rows);
              setPlatterModalOpen(false);
            }}
            initialRows={selectedEventId ? getPlatterOrdersByEventId(selectedEventId) : []}
          />
        )}
      </CourseStyleBlock>

      <div className="beo-stations-embedded" style={{ marginTop: 20, width: "100%" }}>
        <CreationStationContent
          selectedEventId={selectedEventId}
          canEdit={canEdit}
          menuItems={menuItems}
          menuItemNames={menuItemNames}
          getItemName={getItemName}
          fetchItemNames={fetchItemNames}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
          buttonStyle={buttonStyle}
          addButtonStyle={smallAddButtonStyle}
        />
      </div>

          </div>
        </div>
      )}

      {/* ── Dressing Picker (pops up when salad selected in Buffet China) ── */}
      {showDressingPicker &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={closeDressingPicker}
          >
            <div
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
              <div style={{ borderBottom: "1px solid #ff6b6b", padding: "16px", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#e0e0e0", margin: 0 }}>Select Dressings</h3>
                  <button onClick={closeDressingPicker} style={{ background: "none", border: "none", color: "#ff6b6b", fontSize: "24px", cursor: "pointer", fontWeight: "bold" }}>✕</button>
                </div>
                <input
                  type="text"
                  placeholder="Search dressings..."
                  value={dressingPickerSearch}
                  onChange={(e) => setDressingPickerSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #444",
                    backgroundColor: "#2a2a2a",
                    color: "#e0e0e0",
                    fontSize: "14px",
                  }}
                  autoFocus
                />
                <div style={{ fontSize: "11px", color: "#999", marginTop: "8px" }}>
                  {dressingFilteredItems.length} from menu
                  {dressingCategoryFiltered.length === 0 && " — use common options below"}
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px" }}>
                {dressingFilteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => addDressingItem(item.id)}
                    style={{
                      padding: "12px",
                      marginBottom: "8px",
                      backgroundColor: selections.buffetChina.includes(item.id) ? "#3a2a2a" : "#2a2a2a",
                      border: "1px solid #444",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#e0e0e0",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#3a3a3a";
                      e.currentTarget.style.borderColor = "#ff6b6b";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = selections.buffetChina.includes(item.id) ? "#3a2a2a" : "#2a2a2a";
                      e.currentTarget.style.borderColor = "#444";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{item.name}</span>
                      {selections.buffetChina.includes(item.id) && (
                        <span style={{ fontSize: "11px", color: "#22c55e" }}>✓ Added</span>
                      )}
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 16, marginBottom: 8, fontSize: "12px", color: "#aaa", fontWeight: 600 }}>Common dressings (add to Buffet China)</div>
                {(SALAD_BAR.dressingOptions as readonly string[]).map((name) => (
                  <div
                    key={name}
                    onClick={() => addDressingOrSaladCustom(name)}
                    style={{
                      padding: "10px 12px",
                      marginBottom: "6px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #444",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#e0e0e0",
                      fontSize: "14px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#3a3a3a";
                      e.currentTarget.style.borderColor = "#ff6b6b";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#2a2a2a";
                      e.currentTarget.style.borderColor = "#444";
                    }}
                  >
                    {name}
                  </div>
                ))}
                <div style={{ marginTop: 16, marginBottom: 8, fontSize: "12px", color: "#aaa", fontWeight: 600 }}>Common salads (add to Buffet China)</div>
                {["Field of Greens Salad", "Tri-Colored Rotini Pasta Salad", "Seasonal Fruit Salad", "Wedge Salad", "Bruschetta Tortellini Pasta Salad", "Caesar Salad", "Greek Salad"].map((name) => (
                  <div
                    key={name}
                    onClick={() => addDressingOrSaladCustom(name)}
                    style={{
                      padding: "10px 12px",
                      marginBottom: "6px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #444",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#e0e0e0",
                      fontSize: "14px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#3a3a3a";
                      e.currentTarget.style.borderColor = "#ff6b6b";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#2a2a2a";
                      e.currentTarget.style.borderColor = "#444";
                    }}
                  >
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );

  return embedded ? content : (
    <FormSection title="Menu Sections" icon="🍽️">
      {content}
    </FormSection>
  );
};
