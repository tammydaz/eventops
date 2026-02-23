import React, { useEffect, useState } from "react";
import { useEventStore } from "../state/eventStore";
import { FIELD_IDS } from "../services/airtable/events";
import { BEO_EVENTS, BEO_MENU_ITEM_FIELDS } from "../config/beoFieldIds";
import { calculateSpec } from "../services/airtable/specEngine";

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
type ViewMode = "kitchen" | "spec" | "packout" | "expeditor";

const GRID_TEMPLATES: Record<ViewMode, string> = {
  kitchen: '140px 1fr',
  spec: '140px 1fr 200px',
  packout: '1fr 250px',
  expeditor: '40px 1fr',
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
      BEO_EVENTS.PASSED_APPETIZERS,
      BEO_EVENTS.PRESENTED_APPETIZERS,
      BEO_EVENTS.BUFFET_METAL,
      BEO_EVENTS.BUFFET_CHINA,
      BEO_EVENTS.DESSERTS,
      BEO_EVENTS.STATIONS,
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
    const apiKey = (import.meta.env.VITE_AIRTABLE_API_KEY as string)?.trim() || "";
    const baseId = (import.meta.env.VITE_AIRTABLE_BASE_ID as string)?.trim() || "";

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

  // ── Smart Header: Client / Contact collapsing ──
  const clientName =
    (f(BEO_EVENTS.CLIENT_FIRST_NAME) + " " + f(BEO_EVENTS.CLIENT_LAST_NAME)).trim();
  const contactName =
    (f(BEO_EVENTS.CONTACT_FIRST_NAME) + " " + f(BEO_EVENTS.CONTACT_LAST_NAME)).trim();
  const clientPhone = f(BEO_EVENTS.CLIENT_PHONE);
  const contactPhone = f(BEO_EVENTS.CONTACT_PHONE);
  const isSamePerson = clientName === contactName && clientName !== "";

  const venue = f(BEO_EVENTS.VENUE_NAME) || f(FIELD_IDS.VENUE);
  const venueAddress = f(BEO_EVENTS.VENUE_FULL_ADDRESS_CLEAN);
  const eventDate = f(BEO_EVENTS.EVENT_DATE);
  const guestCount = f(BEO_EVENTS.GUEST_COUNT);
  const dispatchTime = f(BEO_EVENTS.DISPATCH_TIME);
  const eventStartTime = f(BEO_EVENTS.EVENT_START_TIME);
  const eventEndTime = f(BEO_EVENTS.EVENT_END_TIME);
  const serviceStyle = f(BEO_EVENTS.SERVICE_STYLE);
  const allergies = f(BEO_EVENTS.DIETARY_NOTES);
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
      fieldId: BEO_EVENTS.PASSED_APPETIZERS,
      items: parseMenuItems(BEO_EVENTS.PASSED_APPETIZERS),
    },
    {
      title: "PRESENTED APPETIZERS",
      fieldId: BEO_EVENTS.PRESENTED_APPETIZERS,
      items: parseMenuItems(BEO_EVENTS.PRESENTED_APPETIZERS),
    },
    {
      title: "BUFFET \u2013 METAL",
      fieldId: BEO_EVENTS.BUFFET_METAL,
      items: parseMenuItems(BEO_EVENTS.BUFFET_METAL),
    },
    {
      title: "BUFFET \u2013 CHINA",
      fieldId: BEO_EVENTS.BUFFET_CHINA,
      items: parseMenuItems(BEO_EVENTS.BUFFET_CHINA),
    },
    {
      title: "DESSERTS",
      fieldId: BEO_EVENTS.DESSERTS,
      items: parseMenuItems(BEO_EVENTS.DESSERTS),
    },
    {
      title: "STATIONS",
      fieldId: BEO_EVENTS.STATIONS,
      items: parseMenuItems(BEO_EVENTS.STATIONS),
    },
  ];

  // Collapse empty sections
  const activeSections = menuSections.filter((s) => s.items.length > 0);

  // ── Expeditor: Toggle loaded state ──
  const MENU_TABLE = "tbl0aN33DGG6R1sPZ";
  const apiKey = (import.meta.env.VITE_AIRTABLE_API_KEY as string)?.trim() || "";
  const baseId = (import.meta.env.VITE_AIRTABLE_BASE_ID as string)?.trim() || "";

  const toggleLoaded = async (itemId: string, currentState: boolean) => {
    try {
      await fetch(`https://api.airtable.com/v0/${baseId}/${MENU_TABLE}/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: { [BEO_MENU_ITEM_FIELDS.LOADED]: !currentState },
        }),
      });
    } catch (e) {
      console.error("Failed to toggle loaded state:", e);
    }
  };

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
        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            {isSamePerson ? (
              <>
                <div style={styles.headerRow}>
                  <span style={styles.headerLabel}>CLIENT:</span>
                  <span style={styles.headerValue}>{clientName || "\u2014"}</span>
                </div>
                <div style={styles.headerRow}>
                  <span style={styles.headerLabel}>PHONE:</span>
                  <span style={styles.headerValue}>{clientPhone || "\u2014"}</span>
                </div>
              </>
            ) : (
              <>
                <div style={styles.headerRow}>
                  <span style={styles.headerLabel}>CLIENT:</span>
                  <span style={styles.headerValue}>{clientName || "\u2014"}</span>
                </div>
                <div style={styles.headerRow}>
                  <span style={styles.headerLabel}>PHONE:</span>
                  <span style={styles.headerValue}>{clientPhone || "\u2014"} (Client)</span>
                </div>
                <div style={styles.headerRow}>
                  <span style={styles.headerLabel}>PRIMARY CONTACT:</span>
                  <span style={styles.headerValue}>{contactName || "\u2014"}</span>
                </div>
                <div style={styles.headerRow}>
                  <span style={styles.headerLabel}>CONTACT PHONE:</span>
                  <span style={styles.headerValue}>{contactPhone || "\u2014"} (Day-Of)</span>
                </div>
              </>
            )}
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
              <span style={styles.headerLabel}>START:</span>
              <span style={styles.headerValue}>{eventStartTime || "\u2014"}</span>
            </div>
            <div style={styles.headerRowRight}>
              <span style={styles.headerLabel}>END:</span>
              <span style={styles.headerValue}>{eventEndTime || "\u2014"}</span>
            </div>
            <div style={styles.headerRowRight}>
              <span style={styles.headerLabel}>GUESTS:</span>
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
            {section.items.map((item, idx) => {
              const autoSpec = calculateSpec({
                itemId: item.id,
                itemName: item.name,
                section: section.title,
                guestCount: parseInt(guestCount) || 0,
                nickQtyOverride: item.specQty,
              });
              const gridTemplateColumns = GRID_TEMPLATES[viewMode];
              return (
                <div key={item.id + idx} style={{ ...styles.lineItem, gridTemplateColumns }}>
                  {/* Expeditor: Checkbox column */}
                  {viewMode === "expeditor" && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <input
                        type="checkbox"
                        checked={item.loaded || false}
                        onChange={() => toggleLoaded(item.id, item.loaded || false)}
                        style={{ width: 18, height: 18, cursor: "pointer" }}
                      />
                    </div>
                  )}

                  {/* Kitchen / Spec: Spec column */}
                  {(viewMode === "kitchen" || viewMode === "spec") && (
                    <div style={styles.specCol}>
                      <span>{autoSpec}</span>
                    </div>
                  )}

                  {/* Column: Item Name */}
                  <div style={styles.itemCol}>{item.name}</div>

                  {/* Spec: Override input column */}
                  {viewMode === "spec" && (
                    <div>
                      <input
                        type="text"
                        placeholder="qty / pan / vessel"
                        defaultValue={item.specQty || ""}
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
                    </div>
                  )}

                  {/* Pack-Out: Equipment column */}
                  {viewMode === "packout" && (
                    <div style={styles.packOutCol}>
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
                    </div>
                  )}
                </div>
              );
            })}
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
