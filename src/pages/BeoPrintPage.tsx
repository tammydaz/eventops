import React, { useCallback, useEffect, useState } from "react";
import { useEventStore } from "../state/eventStore";
import { fetchBeoData, updateSpecOverrides } from "../services/airtable/beo";
import { isErrorResult } from "../services/airtable/selectors";
import { SECTION_ORDER, SECTION_LABELS } from "../config/beoFieldIds";
import type { BeoData, BeoViewMode, MenuItem, SaveStatus, SpecOverrides } from "../types/beo";

// ── Extract eventId from URL ──
const getEventIdFromUrl = (): string | null => {
  const parts = window.location.pathname.split("/");
  const idx = parts.indexOf("beo-print");
  if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
  return null;
};

// ── Print styles ──
const printStyles = `
  @media print {
    body { margin: 0; padding: 0; background: #fff; }
    .no-print { display: none !important; }
    .print-page { break-after: page; }
    .spec-override-col { display: none !important; }
  }
  @page { margin: 0.5in; }
`;

// ── Section border colors ──
const SECTION_COLORS: Record<string, string> = {
  passedAppetizers: "#22c55e",
  presentedAppetizers: "#22c55e",
  buffetMetal: "#f97316",
  buffetChina: "#3b82f6",
  desserts: "#f97316",
  beverages: "#8b5cf6",
};

// ── Styles ──
const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    maxWidth: 960,
    margin: "0 auto",
    padding: "24px 32px",
    background: "#fff",
    color: "#000",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "3px solid #000",
    paddingBottom: 12,
    marginBottom: 8,
  },
  headerLeft: { flex: 1 },
  headerRight: { flex: 1, textAlign: "right" as const },
  headerRow: { display: "flex", gap: 8, marginBottom: 4, fontSize: 13 },
  headerRowRight: {
    display: "flex",
    gap: 8,
    marginBottom: 4,
    fontSize: 13,
    justifyContent: "flex-end",
  },
  headerLabel: { fontWeight: 700, minWidth: 100 },
  headerValue: { fontWeight: 400 },
  beoTitle: {
    textAlign: "center" as const,
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 2,
    padding: "8px 0",
    background: "#f0f0f0",
    marginBottom: 8,
  },
  allergyBanner: {
    background: "#ff0000",
    color: "#fff",
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 8,
    letterSpacing: 1,
  },
  serviceStyleBanner: {
    background: "#f97316",
    color: "#fff",
    padding: "6px 16px",
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 8,
    letterSpacing: 1,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#1a1a1a",
    color: "#fff",
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 0,
  },
  sectionEmpty: {
    padding: "10px 16px",
    fontSize: 13,
    color: "#999",
    fontStyle: "italic" as const,
    borderBottom: "1px solid #eee",
  },
  lineItemGrid: {
    display: "grid",
    gridTemplateColumns: "160px 1fr 200px",
    padding: "7px 16px",
    borderBottom: "1px solid #ddd",
    fontSize: 13,
    alignItems: "center" as const,
    gap: 8,
  },
  childLineItemGrid: {
    display: "grid",
    gridTemplateColumns: "160px 1fr 200px",
    padding: "5px 16px 5px 32px",
    borderBottom: "1px solid #f0f0f0",
    fontSize: 12,
    alignItems: "center" as const,
    gap: 8,
    background: "#fafafa",
  },
  specCol: { fontWeight: 700, color: "#333", fontSize: 12 },
  itemCol: { fontWeight: 500 },
  overrideCol: { fontSize: 11 },
  allergenChip: {
    display: "inline-block",
    marginLeft: 4,
    fontSize: 12,
  },
  noteRow: {
    padding: "2px 16px 6px 176px",
    fontSize: 11,
    color: "#555",
    borderBottom: "1px solid #ddd",
    fontStyle: "italic" as const,
  },
  footer: {
    borderTop: "3px solid #000",
    marginTop: 24,
    paddingTop: 4,
  },
  footerStrip: {
    background: "#e5e7eb",
    border: "1px solid #000",
    padding: "6px 16px",
    fontSize: 11,
    fontWeight: 600,
    display: "flex",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap" as const,
  },
  toolbar: {
    display: "flex",
    gap: 12,
    padding: "16px 32px",
    background: "#111",
    justifyContent: "center",
    flexWrap: "wrap" as const,
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
  saveBtn: { background: "#22c55e" },
  lockBtn: { background: "#f97316" },
  backBtn: { background: "#555" },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "60vh",
    fontSize: 18,
    color: "#999",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  overrideInput: {
    width: "100%",
    padding: "3px 6px",
    fontSize: 12,
    background: "#f5f5f5",
    border: "1px solid #ccc",
    borderRadius: 3,
    boxSizing: "border-box" as const,
  },
  saveStatus: {
    padding: "4px 16px",
    fontSize: 11,
    textAlign: "center" as const,
    color: "#666",
  },
};

// ── Spec display helper ──
function getDisplaySpec(item: MenuItem): string {
  if (item.specOverride?.qty) return item.specOverride.qty;
  return item.autoSpec || "\u2014";
}

// ── SpecOverrideInput component ──
type SpecOverrideInputProps = {
  menuItemId: string;
  currentOverrides?: SpecOverrides;
  onSave: (itemId: string, overrides: SpecOverrides) => void;
  locked: boolean;
};

const SpecOverrideInput: React.FC<SpecOverrideInputProps> = ({
  menuItemId,
  currentOverrides,
  onSave,
  locked,
}) => {
  const [localQty, setLocalQty] = useState(currentOverrides?.qty ?? "");

  useEffect(() => {
    setLocalQty(currentOverrides?.qty ?? "");
  }, [currentOverrides?.qty]);

  const handleBlur = () => {
    onSave(menuItemId, { ...currentOverrides, qty: localQty || undefined });
  };

  return (
    <input
      type="text"
      className="no-print"
      placeholder="override qty…"
      value={localQty}
      disabled={locked}
      onChange={(e) => setLocalQty(e.target.value)}
      onBlur={handleBlur}
      style={styles.overrideInput}
    />
  );
};

// ── MenuItem row renderer ──
type MenuItemRowProps = {
  item: MenuItem;
  viewMode: BeoViewMode;
  overrides: Record<string, SpecOverrides>;
  onSaveOverride: (itemId: string, overrides: SpecOverrides) => void;
  locked: boolean;
  isChild?: boolean;
};

const MenuItemRow: React.FC<MenuItemRowProps> = ({
  item,
  viewMode,
  overrides,
  onSaveOverride,
  locked,
  isChild = false,
}) => {
  const rowStyle = isChild ? styles.childLineItemGrid : styles.lineItemGrid;
  const combinedOverrides = overrides[item.id] ?? item.specOverride;
  const displaySpec = getDisplaySpec({ ...item, specOverride: combinedOverrides });

  const nameWithPrefix = isChild ? `– ${item.name}` : item.name;

  return (
    <>
      <div style={rowStyle}>
        {/* Column 1: Spec */}
        <div style={styles.specCol}>
          {viewMode === "packout" ? null : <span>{displaySpec}</span>}
        </div>

        {/* Column 2: Item Name + Allergens */}
        <div style={styles.itemCol}>
          <span>{nameWithPrefix}</span>
          {item.allergens.map((icon, i) => (
            <span key={i} style={styles.allergenChip}>{icon}</span>
          ))}
        </div>

        {/* Column 3: Override (spec view only) or Pack-Out (packout view) */}
        <div style={{ ...styles.overrideCol, ...(viewMode === "spec" ? {} : { display: "none" }) }} className="spec-override-col">
          {viewMode === "spec" && (
            <SpecOverrideInput
              menuItemId={item.id}
              currentOverrides={combinedOverrides}
              onSave={onSaveOverride}
              locked={locked}
            />
          )}
        </div>
      </div>
      {/* Notes row */}
      {item.notes && (
        <div style={styles.noteRow}>📝 {item.notes}</div>
      )}
    </>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const BeoPrintPage: React.FC = () => {
  const { selectedEventId, selectEvent, loadEventData } = useEventStore();
  const [viewMode, setViewMode] = useState<BeoViewMode>("kitchen");
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [beoData, setBeoData] = useState<BeoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, SpecOverrides>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Load event data
  useEffect(() => {
    const urlEventId = getEventIdFromUrl();
    const load = async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBeoData(id);
        if (isErrorResult(data)) {
          setError(data.message ?? "Failed to load BEO data.");
        } else {
          setBeoData(data);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    if (urlEventId && urlEventId !== selectedEventId) {
      selectEvent(urlEventId).then(() => load(urlEventId));
    } else if (selectedEventId) {
      loadEventData().then(() => load(selectedEventId));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save a single override to Airtable
  const handleSaveOverride = useCallback(
    async (itemId: string, newOverrides: SpecOverrides) => {
      setOverrides((prev) => ({ ...prev, [itemId]: newOverrides }));
      setSaveStatus("saving");
      const result = await updateSpecOverrides(itemId, newOverrides);
      setSaveStatus(isErrorResult(result) ? "error" : "saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    []
  );

  // Save all pending overrides
  const handleSaveAll = useCallback(async () => {
    if (!Object.keys(overrides).length) {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
      return;
    }
    setSaveStatus("saving");
    const results = await Promise.all(
      Object.entries(overrides).map(([id, ov]) => updateSpecOverrides(id, ov))
    );
    const hasError = results.some(isErrorResult);
    setSaveStatus(hasError ? "error" : "saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }, [overrides]);

  // Lock specs → save + switch to kitchen (print) mode
  const handleLockSpecs = useCallback(async () => {
    await handleSaveAll();
    setLocked(true);
    setViewMode("kitchen");
  }, [handleSaveAll]);

  if (loading) return <div style={styles.loading}>Loading BEO data…</div>;

  if (error) {
    return (
      <div style={{ ...styles.loading, flexDirection: "column", gap: 12 }}>
        <div style={{ color: "#ff4444" }}>{error}</div>
        <button
          style={{ ...styles.toolbarBtn, ...styles.backBtn }}
          onClick={() => window.history.back()}
        >
          ← Back
        </button>
      </div>
    );
  }

  if (!selectedEventId || !beoData) {
    return (
      <div style={styles.loading}>
        No event selected. Go to the dashboard and click Print / View BEO.
      </div>
    );
  }

  const { event, menuSections } = beoData;

  // ── Derived display values ──
  const clientName = event.clientDisplay || "\u2014";
  const jobNumber = event.jobNumber || `${clientName} \u2013 ${event.eventDate}`;
  const styleLower = event.serviceStyle.toLowerCase();
  const isBuffetStyle = styleLower.includes("buffet") || styleLower.includes("full service");
  const showServiceStyleBanner = event.serviceStyle && !isBuffetStyle;

  const saveStatusLabel: Record<SaveStatus, string> = {
    idle: "",
    saving: "Saving…",
    saved: "✅ Saved",
    error: "❌ Save failed",
  };

  return (
    <>
      <style>{printStyles}</style>

      {/* ── Toolbar (no-print) ── */}
      <div className="no-print" style={styles.toolbar}>
        <button
          style={{ ...styles.toolbarBtn, ...(viewMode === "kitchen" ? styles.activeBtn : styles.inactiveBtn) }}
          onClick={() => setViewMode("kitchen")}
        >
          🍳 Kitchen BEO
        </button>
        <button
          style={{ ...styles.toolbarBtn, ...(viewMode === "spec" ? styles.activeBtn : styles.inactiveBtn) }}
          onClick={() => { if (!locked) setViewMode("spec"); }}
          disabled={locked}
        >
          📐 Spec View
        </button>
        <button
          style={{ ...styles.toolbarBtn, ...(viewMode === "packout" ? styles.activeBtn : styles.inactiveBtn) }}
          onClick={() => setViewMode("packout")}
        >
          📦 Pack-Out View
        </button>
        <button style={{ ...styles.toolbarBtn, ...styles.saveBtn }} onClick={handleSaveAll} disabled={locked}>
          💾 Save Progress
        </button>
        <button style={{ ...styles.toolbarBtn, ...styles.lockBtn }} onClick={handleLockSpecs} disabled={locked}>
          🔒 Lock Specs
        </button>
        <button style={{ ...styles.toolbarBtn, background: "#2d8cf0" }} onClick={() => window.print()}>
          🖨️ Print
        </button>
        <button style={{ ...styles.toolbarBtn, ...styles.backBtn }} onClick={() => window.history.back()}>
          ← Back
        </button>
      </div>

      {saveStatus !== "idle" && (
        <div className="no-print" style={styles.saveStatus}>{saveStatusLabel[saveStatus]}</div>
      )}

      {/* ── Print Page ── */}
      <div style={styles.page}>
        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerRow}>
              <span style={styles.headerLabel}>DATE:</span>
              <span style={styles.headerValue}>{event.eventDate || "\u2014"}</span>
            </div>
            <div style={styles.headerRow}>
              <span style={styles.headerLabel}>CLIENT:</span>
              <span style={styles.headerValue}>{clientName}</span>
            </div>
            <div style={styles.headerRow}>
              <span style={styles.headerLabel}>PHONE:</span>
              <span style={styles.headerValue}>{event.clientPhone || "\u2014"}</span>
            </div>
            <div style={styles.headerRow}>
              <span style={styles.headerLabel}>VENUE:</span>
              <span style={styles.headerValue}>
                {event.venueName || "\u2014"}
                {event.eventLocation ? `, ${event.eventLocation}` : ""}
              </span>
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.headerRowRight}>
              <span style={styles.headerLabel}>GUESTS:</span>
              <span style={styles.headerValue}>{event.guestCount || "\u2014"}</span>
            </div>
            <div style={styles.headerRowRight}>
              <span style={styles.headerLabel}>START:</span>
              <span style={styles.headerValue}>{event.eventStartTime || "\u2014"}</span>
            </div>
            <div style={styles.headerRowRight}>
              <span style={styles.headerLabel}>END:</span>
              <span style={styles.headerValue}>{event.eventEndTime || "\u2014"}</span>
            </div>
            <div style={styles.headerRowRight}>
              <span style={styles.headerLabel}>ARRIVAL:</span>
              <span style={styles.headerValue}>{event.eventArrivalTime || "\u2014"}</span>
            </div>
          </div>
        </div>

        {/* ── BEO Title ── */}
        <div style={styles.beoTitle}>BANQUET EVENT ORDER</div>

        {/* ── Dispatch + Job # ── */}
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
          {event.dispatchTime ? `DISPATCH: ${event.dispatchTime}` : ""}{" "}
          {event.dispatchTime && jobNumber ? " | " : ""}
          {jobNumber ? `JOB #: ${jobNumber}` : ""}
        </div>

        {/* ── Allergy Banner ── */}
        {event.dietaryNotes && (
          <div style={styles.allergyBanner}>
            ⚠️ ALLERGY ALERT: {event.dietaryNotes.toUpperCase()}
          </div>
        )}

        {/* ── Service Style Banner ── */}
        {showServiceStyleBanner && (
          <div style={styles.serviceStyleBanner}>
            SERVICE STYLE: {event.serviceStyle.toUpperCase()}
          </div>
        )}

        {/* ── Menu Sections (Sacred Order) ── */}
        {SECTION_ORDER.map((sectionKey) => {
          const items: MenuItem[] = menuSections[sectionKey];
          const label = SECTION_LABELS[sectionKey];
          const borderColor = SECTION_COLORS[sectionKey] ?? "#999";

          return (
            <div key={sectionKey} style={{ borderLeft: `4px solid ${borderColor}`, marginBottom: 0 }}>
              <div style={styles.sectionHeader}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: borderColor, display: "inline-block", flexShrink: 0 }} />
                {label}
              </div>
              {items.length === 0 ? (
                <div style={styles.sectionEmpty}>No {label.toLowerCase()} items</div>
              ) : (
                items.map((item) => (
                  <React.Fragment key={item.id}>
                    <MenuItemRow
                      item={item}
                      viewMode={viewMode}
                      overrides={overrides}
                      onSaveOverride={handleSaveOverride}
                      locked={locked}
                    />
                    {item.children.map((child) => (
                      <MenuItemRow
                        key={child.id}
                        item={child}
                        viewMode={viewMode}
                        overrides={overrides}
                        onSaveOverride={handleSaveOverride}
                        locked={locked}
                        isChild
                      />
                    ))}
                    {/* Blank line after each parent-child block */}
                    <div style={{ height: 4 }} />
                  </React.Fragment>
                ))
              )}
            </div>
          );
        })}

        {/* ── Footer ── */}
        <div style={styles.footer}>
          {event.dietaryNotes && (
            <div style={{ ...styles.allergyBanner, fontSize: 11, padding: "4px 12px", marginBottom: 4 }}>
              ⚠️ {event.dietaryNotes.toUpperCase()}
            </div>
          )}
          <div style={styles.footerStrip}>
            <span>CLIENT: {clientName}</span>
            <span>|</span>
            <span>VENUE: {event.venueName}{event.eventLocation ? `, ${event.eventLocation}` : ""}</span>
            <span>|</span>
            <span>DISPATCH: {event.dispatchTime || "\u2014"}</span>
            <span>|</span>
            <span>GUESTS: {event.guestCount || "\u2014"}</span>
            <span>|</span>
            <span>JOB #: {jobNumber}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default BeoPrintPage;
