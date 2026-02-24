import React, { useEffect, useState } from "react";
import { useEventStore } from "../state/eventStore";
import { FIELD_IDS } from "../services/airtable/events";
import { asSingleSelectName } from "../services/airtable/selectors";
import { calculateSpec } from "../services/airtable/specEngine";
import { secondsToTimeString } from "../utils/timeHelpers";

// ── Types ──
type MenuLineItem = {
  id: string;
  name: string;
  specQty?: string;
  specVessel?: string;
  packOutItems?: string;
  loaded?: boolean;
};

type SectionData = {
  title: string;
  fieldId: string;
  items: MenuLineItem[];
};

// ── View Modes ──
type ViewMode = "kitchen" | "spec" | "packout" | "expeditor";

// ── Section color by type ──
const getSectionColor = (sectionTitle: string): string => {
  if (sectionTitle.includes("PASSED")) return "#22c55e";
  if (sectionTitle.includes("PRESENTED")) return "#f97316";
  if (sectionTitle.includes("BUFFET")) return "#3b82f6";
  if (sectionTitle.includes("DESSERT")) return "#ef4444";
  if (sectionTitle.includes("STATION")) return "#a855f7";
  return "#6b7280";
};

// ── Header design tokens (coral reserved for dietary alerts only) ──
const ACCENT = "#e85d5d";           // dietary / highlights only
const HEADER_ACCENT = "#0d9488";    // dispatch/job/times — light teal, ink-friendly

// ── Header row: label | value (for 4-col grid) ──
function HeaderRow({ label, value, last, highlight }: { label: string; value: string; last?: boolean; highlight?: boolean }) {
  return (
    <>
      <div style={{
        padding: "4px 10px 4px 0",
        borderBottom: last ? "none" : "1px solid rgba(0,0,0,0.06)",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "#6b7280",
        fontWeight: 600,
        lineHeight: 1.3,
      }}>{label}</div>
      <div style={{
        padding: "4px 0",
        borderBottom: last ? "none" : "1px solid rgba(0,0,0,0.06)",
        fontWeight: 600,
        color: highlight ? HEADER_ACCENT : "#1f2937",
        fontSize: 13,
        lineHeight: 1.3,
      }}>{value || "—"}</div>
    </>
  );
}

function HighlightField({ label, value, accentColor }: { label: string; value: string; accentColor: string }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "6px 16px",
    }}>
      <span style={{
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: "#6b7280",
        fontWeight: 600,
        marginBottom: 2,
        lineHeight: 1.2,
      }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", color: accentColor, lineHeight: 1.2 }}>
        {value || "—"}
      </span>
    </div>
  );
}

// ── Extract eventId from URL ──
const getEventIdFromUrl = (): string | null => {
  const parts = window.location.pathname.split("/");
  const idx = parts.indexOf("beo-print");
  if (idx !== -1 && parts[idx + 1]) {
    return parts[idx + 1];
  }
  return null;
};

// ── Styles ──
const printStyles = `
  @media print {
    body { margin: 0; padding: 0; background: #fff; }
    .no-print { display: none !important; }
    .print-page { break-after: page; }
  }
  @page { margin: 0.5in; }
`;

const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    maxWidth: 900,
    margin: "0 auto",
    padding: "12px 24px",
    background: "#fff",
    color: "#000",
  },
  header: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "auto auto auto auto",
    gap: "6px 32px",
    padding: "16px 24px",
    background: "#f5f5f5",
    marginBottom: 16,
    borderRadius: 8,
    border: "2px solid #000",
    alignItems: "center",
  },
  headerLeft: {
    display: "flex",
    fontSize: 13,
    lineHeight: 1.5,
    alignItems: "center",
  },
  headerRight: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    fontSize: 13,
    lineHeight: 1.5,
    textAlign: "right" as const,
  },
  headerLabel: {
    fontWeight: 700,
    marginRight: 4,
    minWidth: "auto",
  },
  headerValue: { fontWeight: 400 },
  allergyBanner: {
    background: "#ffe5e5",
    color: "#c41e3a",
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 12,
    border: "2px solid #ff0000",
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  notBuffetBanner: {
    background: "#e0f2fe",
    color: "#0369a1",
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 12,
    border: "2px solid #0284c7",
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  sectionCard: {
    background: "#f5f5f5",
    border: "3px solid #000",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden" as const,
  },
  sectionHeader: {
    background: "transparent",
    color: "#000",
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center" as const,
    marginTop: 16,
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  lineItem: {
    display: "grid",
    padding: "8px 16px",
    borderBottom: "1px solid #eee",
    fontSize: 13,
    alignItems: "center" as const,
  },
  specCol: { fontWeight: 700, color: "#555", fontSize: 12 },
  itemCol: { fontWeight: 600, color: "#333" },
  packOutCol: { fontSize: 11, color: "#666", textAlign: "right" as const },
  checkboxCol: { display: "flex", alignItems: "center", justifyContent: "center" },
  footer: {
    borderTop: "3px solid #000",
    marginTop: 20,
    paddingTop: 6,
    paddingBottom: 6,
  },
  footerStrip: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    fontWeight: 500,
    color: "#333",
  },
  footerSeparator: {
    color: "#999",
    fontSize: 10,
    userSelect: "none" as const,
  },
  toolbar: {
    display: "flex",
    gap: 12,
    padding: "16px 32px",
    background: "#111",
    justifyContent: "center",
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
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "60vh",
    fontSize: 18,
    color: "#999",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
};

const BeoPrintPage: React.FC = () => {
  const {
    selectedEventId,
    selectEvent,
    eventData,
    loadEventData,
  } = useEventStore();
  const [viewMode, setViewMode] = useState<ViewMode>("kitchen");
  const [loading, setLoading] = useState(true);
  const [menuNames, setMenuNames] = useState<Record<string, string>>({});

  // ── Step 1: Grab event ID from URL and select it ──
  useEffect(() => {
    const urlEventId = getEventIdFromUrl();
    if (urlEventId && urlEventId !== selectedEventId) {
      selectEvent(urlEventId).then(() => setLoading(false));
    } else if (selectedEventId) {
      loadEventData().then(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── Step 2: Resolve linked record IDs to names ──
  useEffect(() => {
    const menuFieldIds = [
      FIELD_IDS.PASSED_APPETIZERS,
      FIELD_IDS.PRESENTED_APPETIZERS,
      FIELD_IDS.BUFFET_METAL,
      FIELD_IDS.BUFFET_CHINA,
      FIELD_IDS.DESSERTS,
      FIELD_IDS.STATIONS,
    ];

    const allRecordIds: string[] = [];
    menuFieldIds.forEach((fid) => {
      const val = eventData[fid];
      if (Array.isArray(val)) {
        val.forEach((id: string) => {
          if (typeof id === "string" && id.startsWith("rec") && !menuNames[id]) {
            allRecordIds.push(id);
          }
        });
      }
    });

    if (allRecordIds.length === 0) return;

    const MENU_TABLE = "tbl0aN33DGG6R1sPZ";
    const NAME_FIELD = "fldQ83gpgOmMxNMQw";
    const apiKey = (import.meta.env.VITE_AIRTABLE_API_KEY as string)?.trim() || "";
    const baseId = (import.meta.env.VITE_AIRTABLE_BASE_ID as string)?.trim() || "";

    const fetchNames = async () => {
      const newNames: Record<string, string> = { ...menuNames };
      const chunks: string[][] = [];
      for (let i = 0; i < allRecordIds.length; i += 10) {
        chunks.push(allRecordIds.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
        const params = new URLSearchParams();
        params.set("filterByFormula", formula);
        params.set("returnFieldsByFieldId", "true");
        params.append("fields[]", NAME_FIELD);

        try {
          const res = await fetch(
            `https://api.airtable.com/v0/${baseId}/${MENU_TABLE}?${params.toString()}`,
            { headers: { Authorization: `Bearer ${apiKey}` } }
          );
          const data = await res.json();
          if (data.records) {
            data.records.forEach((rec: { id: string; fields: Record<string, unknown> }) => {
              const name = rec.fields[NAME_FIELD];
              newNames[rec.id] = typeof name === "string" ? name : rec.id;
            });
          }
        } catch (e) {
          console.error("Failed to resolve menu item names:", e);
        }
      }

      setMenuNames(newNames);
    };

    fetchNames();
  }, [eventData]);

  // ── Extract event fields ──
  const f = (id: string): string => {
    const val = eventData[id];
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number") return String(val);
    return String(val);
  };

  const clientName = `${f(FIELD_IDS.CLIENT_FIRST_NAME)} ${f(FIELD_IDS.CLIENT_LAST_NAME)}`.trim();
  const contactName = `${f(FIELD_IDS.CONTACT_FIRST_NAME)} ${f(FIELD_IDS.CONTACT_LAST_NAME)}`.trim();
  const clientPhone = f(FIELD_IDS.CLIENT_PHONE);
  const contactPhone = f(FIELD_IDS.CONTACT_PHONE);

  const eventLocation = f(FIELD_IDS.EVENT_LOCATION_FINAL_PRINT);
  const venueAddress = f(FIELD_IDS.PRINT_VENUE_ADDRESS);
  const eventDate = f(FIELD_IDS.EVENT_DATE);
  const eventStart = secondsToTimeString(eventData[FIELD_IDS.EVENT_START_TIME]);
  const eventEnd = secondsToTimeString(eventData[FIELD_IDS.EVENT_END_TIME]);
  const guestCount = f(FIELD_IDS.GUEST_COUNT);
  const dispatchTime = secondsToTimeString(eventData[FIELD_IDS.DISPATCH_TIME]) || f(FIELD_IDS.DISPATCH_TIME);
  const fwStaff = f(FIELD_IDS.CAPTAIN);
  const eventArrival = secondsToTimeString(eventData[FIELD_IDS.FOODWERX_ARRIVAL]);
  const allergies = f(FIELD_IDS.DIETARY_NOTES);
  const serviceStyle = asSingleSelectName(eventData[FIELD_IDS.SERVICE_STYLE]).trim();
  const notBuffetBanner = serviceStyle && !serviceStyle.toLowerCase().includes("buffet")
    ? `NOT BUFFET – ${serviceStyle.toUpperCase()}`
    : "";
  const jobNumber = `${clientName} – ${eventDate}`;
  const phone = contactPhone || clientPhone;

  // ── Parse linked menu items ──
  const parseMenuItems = (fieldId: string): MenuLineItem[] => {
    const raw = eventData[fieldId];
    if (!raw || !Array.isArray(raw)) return [];

    return raw.map((item: unknown) => {
      if (typeof item === "string") {
        return {
          id: item,
          name: menuNames[item] || "Loading...",
        };
      }
      if (item && typeof item === "object" && "id" in item) {
        const obj = item as { id: string; name?: string };
        return {
          id: obj.id,
          name: obj.name || menuNames[obj.id] || "Loading...",
        };
      }
      return { id: String(item), name: String(item) };
    });
  };

  // ── Menu Sections ──
  const menuSections: SectionData[] = [
    {
      title: "PASSED APPETIZERS",
      fieldId: FIELD_IDS.PASSED_APPETIZERS,
      items: parseMenuItems(FIELD_IDS.PASSED_APPETIZERS),
    },
    {
      title: "PRESENTED APPETIZERS",
      fieldId: FIELD_IDS.PRESENTED_APPETIZERS,
      items: parseMenuItems(FIELD_IDS.PRESENTED_APPETIZERS),
    },
    {
      title: "BUFFET – METAL",
      fieldId: FIELD_IDS.BUFFET_METAL,
      items: parseMenuItems(FIELD_IDS.BUFFET_METAL),
    },
    {
      title: "BUFFET – CHINA",
      fieldId: FIELD_IDS.BUFFET_CHINA,
      items: parseMenuItems(FIELD_IDS.BUFFET_CHINA),
    },
    {
      title: "DESSERTS",
      fieldId: FIELD_IDS.DESSERTS,
      items: parseMenuItems(FIELD_IDS.DESSERTS),
    },
    {
      title: "STATIONS",
      fieldId: FIELD_IDS.STATIONS,
      items: parseMenuItems(FIELD_IDS.STATIONS),
    },
  ];

  const activeSections = menuSections.filter((s) => s.items.length > 0);

  // Grid columns based on view mode
  const gridTemplateColumns =
    viewMode === "kitchen" ? "140px 1fr" :
    viewMode === "spec" ? "140px 1fr 200px" :
    viewMode === "packout" ? "1fr 250px" :
    viewMode === "expeditor" ? "40px 1fr" :
    "1fr";

  // ── Loading State ──
  if (loading) {
    return <div style={styles.loading}>Loading event data...</div>;
  }

  if (!selectedEventId) {
    return (
      <div style={styles.loading}>
        No event selected. Go to the dashboard and click Print/View BEO.
      </div>
    );
  }

  // ── Render ──
  return (
    <>
      <style>{printStyles}</style>

      {/* ── Toolbar ── */}
      <div className="no-print" style={styles.toolbar}>
        <button
          style={{
            ...styles.toolbarBtn,
            ...(viewMode === "kitchen" ? styles.activeBtn : styles.inactiveBtn),
          }}
          onClick={() => setViewMode("kitchen")}
        >
          🍳 Kitchen BEO
        </button>
        <button
          style={{
            ...styles.toolbarBtn,
            ...(viewMode === "spec" ? styles.activeBtn : styles.inactiveBtn),
          }}
          onClick={() => setViewMode("spec")}
        >
          📐 Spec View
        </button>
        <button
          style={{
            ...styles.toolbarBtn,
            ...(viewMode === "packout" ? styles.activeBtn : styles.inactiveBtn),
          }}
          onClick={() => setViewMode("packout")}
        >
          📦 Pack-Out View
        </button>
        <button
          style={{
            ...styles.toolbarBtn,
            ...(viewMode === "expeditor" ? styles.activeBtn : styles.inactiveBtn),
          }}
          onClick={() => setViewMode("expeditor")}
        >
          ☑️ Expeditor View
        </button>
        <button
          style={{ ...styles.toolbarBtn, background: "#2d8cf0" }}
          onClick={() => window.print()}
        >
          🖨️ Print
        </button>
        <button
          style={{ ...styles.toolbarBtn, background: "#555" }}
          onClick={() => window.history.back()}
        >
          ← Back
        </button>
      </div>

      {/* ── Print Page ── */}
      <div style={styles.page}>
        {/* ── Header (redesigned) ── */}
        <div style={{
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          background: "#fff",
          overflow: "hidden",
          marginBottom: 16,
          boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
        }}>
          {/* Top — 4-column layout, grey */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            width: "100%",
            background: "#f3f4f6",
          }}>
            {/* Left block: Label | Value */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "minmax(100px, auto) 1fr",
              gap: "0 16px",
              padding: "10px 16px",
              alignItems: "stretch",
            }}>
              <HeaderRow label="Client" value={clientName} />
              {contactName && contactName !== clientName && (
                <HeaderRow label="Contact" value={contactName} />
              )}
              <HeaderRow label="Phone" value={phone} />
              <HeaderRow label="Venue" value={eventLocation} />
              <HeaderRow label="Venue Address" value={venueAddress} last />
            </div>
            {/* Right block: Label | Value — with vertical separator */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "minmax(100px, auto) 1fr",
              gap: "0 16px",
              padding: "10px 16px",
              borderLeft: "1px solid #e5e7eb",
              alignItems: "stretch",
            }}>
              <HeaderRow label="Guest Count" value={guestCount} />
              <HeaderRow label="Event Date" value={eventDate} />
              <HeaderRow label="Event Start" value={eventStart} highlight />
              <HeaderRow label="Event End" value={eventEnd} highlight />
              <HeaderRow label="FW Staff" value={fwStaff} />
              <HeaderRow label="Event Arrival" value={eventArrival} last />
            </div>
          </div>

          {/* Bottom band — Dispatch Time & Job #, white */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            background: "#fff",
            borderTop: "1px solid #e5e7eb",
          }}>
            <div style={{ borderRight: "1px solid #e5e7eb" }}>
              <HighlightField label="DISPATCH TIME" value={dispatchTime || "TBD"} accentColor={HEADER_ACCENT} />
            </div>
            <div>
              <HighlightField label="JOB #" value={jobNumber} accentColor={HEADER_ACCENT} />
            </div>
          </div>
        </div>

        {/* ── Not Buffet Banner (when service style is plated, family style, etc.) ── */}
        {notBuffetBanner && (
          <div style={styles.notBuffetBanner}>
            {notBuffetBanner}
          </div>
        )}

        {/* ── Allergy Banner ── */}
        {allergies && (
          <div style={styles.allergyBanner}>
            ⚠️ ALLERGIES / DIETARY RESTRICTIONS: {allergies.toUpperCase()}
          </div>
        )}

        {/* ── Menu Sections ── */}
        {activeSections.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "#999", fontSize: 16 }}>
            No menu items assigned to this event yet.
          </div>
        )}

        {activeSections.map((section) => (
          <div key={section.fieldId} style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <span style={{ color: getSectionColor(section.title), fontSize: "18px", lineHeight: 0 }}>●</span>
              <span>{section.title}</span>
              <span style={{ color: getSectionColor(section.title), fontSize: "18px", lineHeight: 0 }}>●</span>
            </div>
            {section.items.map((item, idx) => (
              <div key={item.id + idx} style={{ ...styles.lineItem, gridTemplateColumns }}>
                {/* EXPEDITOR: Checkbox */}
                {viewMode === "expeditor" && (
                  <div style={styles.checkboxCol}>
                    <input type="checkbox" checked={item.loaded || false} />
                  </div>
                )}

                {/* KITCHEN/SPEC: Spec Column */}
                {(viewMode === "kitchen" || viewMode === "spec") && (
                  <div style={styles.specCol}>
                    {viewMode === "spec" ? (
                      <input
                        type="text"
                        placeholder="override spec..."
                        defaultValue={item.specQty}
                        style={{
                          width: "100%",
                          padding: "4px 6px",
                          fontSize: 12,
                          background: "#f5f5f5",
                          border: "1px solid #ccc",
                          borderRadius: 3,
                        }}
                        className="no-print"
                      />
                    ) : (
                      <span>
                        {calculateSpec({
                          itemId: item.id,
                          itemName: item.name,
                          section: section.title,
                          guestCount: parseInt(guestCount) || 0,
                          nickQtyOverride: item.specQty,
                        })}
                      </span>
                    )}
                  </div>
                )}

                {/* ALL MODES: Item Name */}
                <div style={styles.itemCol}>{item.name}</div>

                {/* PACK-OUT: Equipment Column */}
                {viewMode === "packout" && (
                  <div style={styles.packOutCol}>
                    <input
                      type="text"
                      placeholder="equipment..."
                      defaultValue={item.packOutItems}
                      style={{
                        width: "100%",
                        padding: "4px 6px",
                        fontSize: 11,
                        background: "#f5f5f5",
                        border: "1px solid #ccc",
                        borderRadius: 3,
                        textAlign: "right" as const,
                      }}
                      className="no-print"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* ── Allergy Banner (Footer) ── */}
        {allergies && (
          <div style={{ ...styles.allergyBanner, marginTop: 20, marginBottom: 12 }}>
            ⚠️ ALLERGIES / DIETARY RESTRICTIONS: {allergies.toUpperCase()}
          </div>
        )}

        {/* ── Footer ── */}
        <div style={styles.footer}>
          <div style={styles.footerStrip}>
            <span>Client: {clientName || "—"}</span>
            <span style={styles.footerSeparator}>|</span>
            <span>Venue: {eventLocation || "—"}</span>
            <span style={styles.footerSeparator}>|</span>
            <span>Dispatch: {dispatchTime || "—"}</span>
            <span style={styles.footerSeparator}>|</span>
            <span>Guests: {guestCount || "—"}</span>
            <span style={styles.footerSeparator}>|</span>
            <span>Job #: {jobNumber || "—"}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default BeoPrintPage;
