import React, { useEffect, useState } from "react";
import { useEventStore } from "../state/eventStore";
import { FIELD_IDS } from "../services/airtable/events";

// ── Types ──
type MenuLineItem = {
  id: string;
  name: string;
  specQty?: string;
  specVessel?: string;
  packOutItems?: string;
};

type SectionData = {
  title: string;
  fieldId: string;
  items: MenuLineItem[];
};

// ── Extract eventId from URL ──
const getEventIdFromUrl = (): string | null => {
  const parts = window.location.pathname.split("/");
  // /beo-print/:eventId
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
  headerRow: {
    display: "flex",
    gap: 8,
    marginBottom: 4,
    fontSize: 13,
  },
  headerRowRight: {
    display: "flex",
    gap: 8,
    marginBottom: 4,
    fontSize: 13,
    justifyContent: "flex-end",
  },
  headerLabel: { fontWeight: 700, minWidth: 100 },
  headerValue: { fontWeight: 400 },
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
    background: "#000",
    color: "#fff",
    padding: "6px 16px",
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 8,
    letterSpacing: 1,
    border: "2px solid #000",
  },
  noKitchenBanner: {
    background: "#ff6600",
    color: "#fff",
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 8,
    letterSpacing: 1,
  },
  sectionHeader: {
    background: "#1a1a1a",
    color: "#fff",
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 0,
  },
  lineItem: {
    display: "grid",
    gridTemplateColumns: "140px 1fr 200px",
    padding: "8px 16px",
    borderBottom: "1px solid #ddd",
    fontSize: 13,
    alignItems: "center" as const,
  },
  specCol: { fontWeight: 700, color: "#333" },
  itemCol: { fontWeight: 500 },
  packOutCol: { fontSize: 11, color: "#666", textAlign: "right" as const },
  footer: {
    borderTop: "3px solid #000",
    marginTop: 24,
    paddingTop: 8,
  },
  footerAllergyRepeat: {
    background: "#ff0000",
    color: "#fff",
    padding: "4px 12px",
    fontSize: 11,
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 4,
  },
  footerServiceStyle: {
    background: "#000",
    color: "#fff",
    padding: "4px 12px",
    fontSize: 11,
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 4,
  },
  footerStrip: {
    display: "flex",
    justifyContent: "center",
    gap: 24,
    fontSize: 12,
    fontWeight: 600,
    padding: "6px 0",
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

// ── View Modes ──
type ViewMode = "kitchen" | "spec" | "packout";

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

    // Fetch each record's name from the Menu Items table
    const MENU_TABLE = "tbl0aN33DGG6R1sPZ";
    const NAME_FIELD = "fldQ83gpgOmMxNMQw"; // Description Name/Formula
    const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY as string;
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID as string;

    const fetchNames = async () => {
      const newNames: Record<string, string> = { ...menuNames };

      // Airtable allows fetching by formula OR individual gets
      // We'll batch with filterByFormula using OR(RECORD_ID()=...)
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

  const clientName =
    (f(FIELD_IDS.CLIENT_FIRST_NAME) + " " + f(FIELD_IDS.CLIENT_LAST_NAME)).trim();
  const phone = f(FIELD_IDS.CLIENT_PHONE);
  const venue = f(FIELD_IDS.VENUE_NAME) || f(FIELD_IDS.VENUE);
  const venueAddress = f(FIELD_IDS.VENUE_ADDRESS);
  const eventDate = f(FIELD_IDS.EVENT_DATE);
  const guestCount = f(FIELD_IDS.GUEST_COUNT);
  const dispatchTime = f(FIELD_IDS.DISPATCH_TIME);
  const serviceStyle = f(FIELD_IDS.SERVICE_STYLE);
  const allergies = f(FIELD_IDS.DIETARY_NOTES);
  const jobNumber = clientName + " \u2013 " + eventDate;

  // Service style banner: only show if NOT buffet / full service
  const styleLower = serviceStyle.toLowerCase();
  const isBuffetStyle =
    styleLower.includes("buffet") || styleLower.includes("full service");
  const showServiceStyleBanner = serviceStyle && !isBuffetStyle;

  // No kitchen available (wire to real field when ready)
  const noKitchenAvailable = false; // TODO: wire to actual field

  // ── Parse linked menu items ──
  const parseMenuItems = (fieldId: string): MenuLineItem[] => {
    const raw = eventData[fieldId];
    if (!raw || !Array.isArray(raw)) return [];

    return raw.map((item: unknown) => {
      if (typeof item === "string") {
        // It's a record ID — resolve from menuNames
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

  // ── Menu Sections (Sacred Order) ──
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
      title: "BUFFET \u2013 METAL",
      fieldId: FIELD_IDS.BUFFET_METAL,
      items: parseMenuItems(FIELD_IDS.BUFFET_METAL),
    },
    {
      title: "BUFFET \u2013 CHINA",
      fieldId: FIELD_IDS.BUFFET_CHINA,
      items: parseMenuItems(FIELD_IDS.BUFFET_CHINA),
    },
    {
      title: "DESSERTS",
      fieldId: FIELD_IDS.DESSERTS,
      items: parseMenuItems(FIELD_IDS.DESSERTS),
    },
  ];

  // Collapse empty sections
  const activeSections = menuSections.filter((s) => s.items.length > 0);

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

      {/* ── Toolbar (doesn't print) ── */}
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
        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerRow}>
              <span style={styles.headerLabel}>CLIENT:</span>
              <span style={styles.headerValue}>{clientName || "\u2014"}</span>
            </div>
            <div style={styles.headerRow}>
              <span style={styles.headerLabel}>PHONE:</span>
              <span style={styles.headerValue}>{phone || "\u2014"}</span>
            </div>
            <div style={styles.headerRow}>
              <span style={styles.headerLabel}>VENUE:</span>
              <span style={styles.headerValue}>
                {venue || "\u2014"}
                {venueAddress ? `, ${venueAddress}` : ""}
              </span>
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.headerRowRight}>
              <span style={styles.headerLabel}>DATE:</span>
              <span style={styles.headerValue}>{eventDate || "\u2014"}</span>
            </div>
            <div style={styles.headerRowRight}>
              <span style={styles.headerLabel}>GUEST COUNT:</span>
              <span style={styles.headerValue}>{guestCount || "\u2014"}</span>
            </div>
            <div style={styles.headerRowRight}>
              <span style={styles.headerLabel}>DISPATCH:</span>
              <span style={styles.headerValue}>{dispatchTime || "\u2014"}</span>
            </div>
            <div style={styles.headerRowRight}>
              <span style={styles.headerLabel}>JOB #:</span>
              <span style={styles.headerValue}>{jobNumber}</span>
            </div>
          </div>
        </div>

        {/* ── Allergy Banner ── */}
        {allergies && (
          <div style={styles.allergyBanner}>
            ⚠️ ALLERGY ALERT: {allergies.toUpperCase()}
          </div>
        )}

        {/* ── Service Style Banner (only if NOT buffet) ── */}
        {showServiceStyleBanner && (
          <div style={styles.serviceStyleBanner}>
            SERVICE STYLE: {serviceStyle.toUpperCase()}
          </div>
        )}

        {/* ── No Kitchen Banner ── */}
        {noKitchenAvailable && (
          <div style={styles.noKitchenBanner}>
            🔥 NO KITCHEN AVAILABLE — ALL FOOD MUST GO HOT
          </div>
        )}

        {/* ── Menu Sections ── */}
        {activeSections.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "#999", fontSize: 16 }}>
            No menu items assigned to this event yet.
          </div>
        )}

        {activeSections.map((section) => (
          <div key={section.fieldId}>
            <div style={styles.sectionHeader}>{section.title}</div>
            {section.items.map((item, idx) => (
              <div key={item.id + idx} style={styles.lineItem}>
                {/* Column 1: Specs */}
                <div style={styles.specCol}>
                  {viewMode === "spec" ? (
                    <input
                      type="text"
                      placeholder="qty / pan / vessel"
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
                    <span>{item.specQty || "\u2014"}</span>
                  )}
                </div>

                {/* Column 2: Item Name */}
                <div style={styles.itemCol}>{item.name}</div>

                {/* Column 3: Pack-Out Items */}
                <div style={styles.packOutCol}>
                  {viewMode === "packout" ? (
                    <input
                      type="text"
                      placeholder="chafer, tongs, riser..."
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
                  ) : (
                    <span>{item.packOutItems || ""}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* ── KITCHEN STOPS HERE ── */}

        {/* ── Footer ── */}
        <div style={styles.footer}>
          {allergies && (
            <div style={styles.footerAllergyRepeat}>
              ⚠️ {allergies.toUpperCase()}
            </div>
          )}
          {showServiceStyleBanner && (
            <div style={styles.footerServiceStyle}>
              {serviceStyle.toUpperCase()}
            </div>
          )}
          <div style={styles.footerStrip}>
            <span>CLIENT: {clientName}</span>
            <span>•</span>
            <span>VENUE: {venue}{venueAddress ? `, ${venueAddress}` : ""}</span>
            <span>•</span>
            <span>DISPATCH: {dispatchTime || "\u2014"}</span>
            <span>•</span>
            <span>GUESTS: {guestCount}</span>
            <span>•</span>
            <span>JOB #: {jobNumber}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default BeoPrintPage;
