import React, { useState } from "react";

// ── Types ──
type EquipmentStatus = "returned" | "missing" | "damaged" | "pending";

type EquipmentItem = {
  id: string;
  name: string;
  category: string;
  sentQty: number;
  returnedQty: number;
  status: EquipmentStatus;
  damageNote?: string;
  replacementCost: number;
};

type EventEquipment = {
  eventName: string;
  jobNumber: string;
  eventDate: string;
  venue: string;
  returnedBy: string;
  returnDate: string;
  checkedBy: string;
  equipment: EquipmentItem[];
};

// ── Sample Data ──
const SAMPLE_EVENTS: EventEquipment[] = [
  {
    eventName: "Holloway Wedding",
    jobNumber: "HW-021526",
    eventDate: "2026-02-15",
    venue: "Magnolia Estate",
    returnedBy: "Carlos",
    returnDate: "2026-02-16",
    checkedBy: "Pending",
    equipment: [
      { id: "e1", name: "Full-Size Chafer", category: "Chafers", sentQty: 6, returnedQty: 6, status: "returned", replacementCost: 85 },
      { id: "e2", name: "Half-Size Chafer", category: "Chafers", sentQty: 4, returnedQty: 3, status: "missing", replacementCost: 65 },
      { id: "e3", name: "Chafer Fuel Frames", category: "Chafers", sentQty: 10, returnedQty: 10, status: "returned", replacementCost: 15 },
      { id: "e4", name: "12\" Round China Plate", category: "Serviceware", sentQty: 200, returnedQty: 196, status: "damaged", damageNote: "4 plates chipped — discard", replacementCost: 8 },
      { id: "e5", name: "Glass Water Goblet", category: "Glassware", sentQty: 200, returnedQty: 192, status: "missing", replacementCost: 6 },
      { id: "e6", name: "Linen Tablecloth (120\" Round)", category: "Linens", sentQty: 20, returnedQty: 20, status: "returned", replacementCost: 35 },
      { id: "e7", name: "Linen Napkin (Black)", category: "Linens", sentQty: 200, returnedQty: 197, status: "missing", replacementCost: 4 },
      { id: "e8", name: "Serving Tongs (12\")", category: "Utensils", sentQty: 8, returnedQty: 8, status: "returned", replacementCost: 12 },
      { id: "e9", name: "Serving Spoon (Slotted)", category: "Utensils", sentQty: 6, returnedQty: 6, status: "returned", replacementCost: 10 },
      { id: "e10", name: "Beverage Dispenser (3 gal)", category: "Beverage", sentQty: 4, returnedQty: 4, status: "returned", replacementCost: 45 },
      { id: "e11", name: "Wire Riser (Black)", category: "Display", sentQty: 6, returnedQty: 5, status: "missing", replacementCost: 25 },
      { id: "e12", name: "Overlay Runner (Gold)", category: "Linens", sentQty: 10, returnedQty: 10, status: "returned", replacementCost: 20 },
      { id: "e13", name: "Bus Tub", category: "Transport", sentQty: 8, returnedQty: 8, status: "returned", replacementCost: 15 },
      { id: "e14", name: "Cambro Insulated Carrier", category: "Transport", sentQty: 4, returnedQty: 3, status: "damaged", damageNote: "1 cambro — broken latch, still usable but needs repair", replacementCost: 120 },
    ],
  },
  {
    eventName: "Laurel Corporate Gala",
    jobNumber: "LCG-021326",
    eventDate: "2026-02-13",
    venue: "Harbor Hall",
    returnedBy: "Mike",
    returnDate: "2026-02-14",
    checkedBy: "Alex",
    equipment: [
      { id: "e20", name: "Full-Size Chafer", category: "Chafers", sentQty: 8, returnedQty: 8, status: "returned", replacementCost: 85 },
      { id: "e21", name: "Half-Size Chafer", category: "Chafers", sentQty: 4, returnedQty: 4, status: "returned", replacementCost: 65 },
      { id: "e22", name: "12\" Round China Plate", category: "Serviceware", sentQty: 260, returnedQty: 260, status: "returned", replacementCost: 8 },
      { id: "e23", name: "Glass Water Goblet", category: "Glassware", sentQty: 260, returnedQty: 258, status: "missing", replacementCost: 6 },
      { id: "e24", name: "Linen Tablecloth (120\" Round)", category: "Linens", sentQty: 30, returnedQty: 30, status: "returned", replacementCost: 35 },
      { id: "e25", name: "Serving Tongs (12\")", category: "Utensils", sentQty: 12, returnedQty: 11, status: "missing", replacementCost: 12 },
      { id: "e26", name: "Beverage Dispenser (3 gal)", category: "Beverage", sentQty: 6, returnedQty: 6, status: "returned", replacementCost: 45 },
      { id: "e27", name: "Bus Tub", category: "Transport", sentQty: 12, returnedQty: 12, status: "returned", replacementCost: 15 },
    ],
  },
];

// ── Helpers ──
const statusConfig: Record<EquipmentStatus, { color: string; bg: string; label: string; icon: string }> = {
  returned: { color: "#4caf50", bg: "#0a1f0a", label: "RETURNED", icon: "✅" },
  missing: { color: "#ff0000", bg: "#1a0000", label: "MISSING", icon: "❌" },
  damaged: { color: "#ff9800", bg: "#1a1000", label: "DAMAGED", icon: "⚠️" },
  pending: { color: "#ffff00", bg: "#1a1a00", label: "PENDING CHECK", icon: "🔍" },
};

const categoryIcons: Record<string, string> = {
  Chafers: "🔥",
  Serviceware: "🍽️",
  Glassware: "🥂",
  Linens: "🧵",
  Utensils: "🥄",
  Beverage: "🧊",
  Display: "🏗️",
  Transport: "📦",
};

// ── Styles ──
const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    background: "#0a0a0a",
    color: "#eee",
    minHeight: "100vh",
    padding: "24px 32px",
  },
  header: { textAlign: "center", marginBottom: 32 },
  title: { fontSize: 32, fontWeight: 800, color: "#ff6b6b", letterSpacing: 2, marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#888", letterSpacing: 1 },
  statsBar: {
    display: "flex",
    justifyContent: "center",
    gap: 40,
    marginBottom: 32,
    padding: "16px 0",
    borderTop: "1px solid #333",
    borderBottom: "1px solid #333",
  },
  stat: { textAlign: "center" as const },
  statNumber: { fontSize: 28, fontWeight: 800, color: "#00e5ff" },
  statLabel: { fontSize: 11, color: "#888", letterSpacing: 1, textTransform: "uppercase" as const },
  eventCard: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: 8,
    marginBottom: 32,
    overflow: "hidden",
  },
  eventHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    background: "#0d1b2a",
    borderBottom: "2px solid #00e5ff",
  },
  eventTitle: { fontSize: 20, fontWeight: 800, color: "#00e5ff" },
  jobTag: {
    background: "#00e5ff",
    color: "#000",
    fontSize: 11,
    fontWeight: 800,
    padding: "2px 10px",
    borderRadius: 3,
    marginLeft: 10,
  },
  eventMeta: {
    display: "flex",
    gap: 24,
    padding: "8px 20px",
    fontSize: 12,
    color: "#888",
    background: "#0a0a0a",
    borderBottom: "1px solid #222",
  },
  metaItem: {},
  metaLabel: { color: "#666", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: 1 },
  metaValue: { color: "#eee", fontSize: 13, fontWeight: 600 },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "32px 1fr 80px 80px 80px 120px",
    padding: "8px 20px",
    fontSize: 10,
    color: "#666",
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    borderBottom: "1px solid #333",
    background: "#0a0a0a",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "32px 1fr 80px 80px 80px 120px",
    padding: "8px 20px",
    fontSize: 13,
    alignItems: "center",
    borderBottom: "1px solid #1a1a1a",
  },
  damageRow: {
    padding: "4px 20px 8px 52px",
    fontSize: 11,
    borderBottom: "1px solid #1a1a1a",
  },
  deltaSection: {
    padding: "16px 20px",
    borderTop: "2px solid #333",
  },
  deltaTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#ff6b6b",
    marginBottom: 12,
  },
  deltaRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    fontSize: 13,
    borderBottom: "1px solid #1a1a1a",
  },
  runningTotal: {
    background: "#1a0000",
    border: "2px solid #ff0000",
    borderRadius: 8,
    padding: "20px 24px",
    marginTop: 32,
  },
  backBtn: {
    position: "fixed" as const,
    top: 16,
    left: 16,
    padding: "8px 20px",
    background: "#333",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    zIndex: 100,
  },
};

// ── Component ──
const ReturnedEquipmentPage: React.FC = () => {
  const [events] = useState<EventEquipment[]>(SAMPLE_EVENTS);
  const [filter, setFilter] = useState<"all" | "missing" | "damaged">("all");

  // Global stats
  const allItems = events.flatMap((e) => e.equipment);
  const totalSent = allItems.reduce((sum, i) => sum + i.sentQty, 0);
  const totalReturned = allItems.reduce((sum, i) => sum + i.returnedQty, 0);
  const totalMissing = allItems
    .filter((i) => i.status === "missing")
    .reduce((sum, i) => sum + (i.sentQty - i.returnedQty), 0);
  const totalDamaged = allItems.filter((i) => i.status === "damaged").length;
  const totalLossCost = allItems
    .filter((i) => i.status === "missing" || i.status === "damaged")
    .reduce((sum, i) => (i.sentQty - i.returnedQty) * i.replacementCost, 0);
  const damageCost = allItems
    .filter((i) => i.status === "damaged")
    .reduce((sum, i) => {
      const missing = i.sentQty - i.returnedQty;
      return sum + missing * i.replacementCost;
    }, 0);

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .equipment-page { padding: 16px !important; }
          .equipment-title { font-size: 24px !important; }
          .equipment-stats { flex-direction: column !important; gap: 16px !important; }
          .equipment-table-header { grid-template-columns: 1fr 60px 60px 60px 100px !important; font-size: 9px !important; }
          .equipment-table-row { grid-template-columns: 1fr 60px 60px 60px 100px !important; font-size: 11px !important; }
          .equipment-event-meta { flex-direction: column !important; gap: 8px !important; }
        }
      `}</style>
      <div style={s.page} className="equipment-page">
        <button style={s.backBtn} onClick={() => window.history.back()}>← Back</button>

      {/* Header */}
      <div style={s.header}>
        <div style={s.title} className="equipment-title">📋 RETURNED EQUIPMENT TRACKER</div>
        <div style={s.subtitle}>WHAT LEFT • WHAT CAME BACK • WHAT'S MISSING</div>
      </div>

      {/* Stats */}
      <div style={s.statsBar} className="equipment-stats">
        <div style={s.stat}>
          <div style={s.statNumber}>{events.length}</div>
          <div style={s.statLabel}>Events</div>
        </div>
        <div style={s.stat}>
          <div style={s.statNumber}>{totalSent}</div>
          <div style={s.statLabel}>Items Sent</div>
        </div>
        <div style={s.stat}>
          <div style={{ ...s.statNumber, color: "#4caf50" }}>{totalReturned}</div>
          <div style={s.statLabel}>Returned</div>
        </div>
        <div style={s.stat}>
          <div style={{ ...s.statNumber, color: "#ff0000" }}>{totalMissing}</div>
          <div style={s.statLabel}>Missing</div>
        </div>
        <div style={s.stat}>
          <div style={{ ...s.statNumber, color: "#ff9800" }}>{totalDamaged}</div>
          <div style={s.statLabel}>Damaged</div>
        </div>
        <div style={s.stat}>
          <div style={{ ...s.statNumber, color: "#ff0000" }}>
            ${totalLossCost + damageCost}
          </div>
          <div style={s.statLabel}>Loss Value</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 24 }}>
        {(["all", "missing", "damaged"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              color: "#fff",
              background: filter === f ? "#ff6b6b" : "#333",
              textTransform: "uppercase",
            }}
          >
            {f === "all" ? "All Items" : f === "missing" ? "❌ Missing Only" : "⚠️ Damaged Only"}
          </button>
        ))}
      </div>

      {/* Event Cards */}
      {events.map((ev) => {
        const filtered =
          filter === "all"
            ? ev.equipment
            : ev.equipment.filter((i) => i.status === filter);

        const eventMissing = ev.equipment
          .filter((i) => i.status === "missing")
          .reduce((sum, i) => sum + (i.sentQty - i.returnedQty), 0);
        const eventDamaged = ev.equipment.filter((i) => i.status === "damaged").length;
        const eventLoss = ev.equipment
          .filter((i) => i.status === "missing" || i.status === "damaged")
          .reduce((sum, i) => (i.sentQty - i.returnedQty) * i.replacementCost, 0);

        return (
          <div key={ev.jobNumber} style={s.eventCard}>
            {/* Event Header */}
            <div style={s.eventHeader}>
              <div>
                <span style={s.eventTitle}>{ev.eventName}</span>
                <span style={s.jobTag}>{ev.jobNumber}</span>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                {eventMissing > 0 && (
                  <span
                    style={{
                      background: "#ff0000",
                      color: "#fff",
                      padding: "4px 12px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {eventMissing} MISSING
                  </span>
                )}
                {eventDamaged > 0 && (
                  <span
                    style={{
                      background: "#ff9800",
                      color: "#000",
                      padding: "4px 12px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {eventDamaged} DAMAGED
                  </span>
                )}
              </div>
            </div>

            {/* Event Meta */}
            <div style={s.eventMeta} className="equipment-event-meta">
              <div style={s.metaItem}>
                <div style={s.metaLabel}>Event Date</div>
                <div style={s.metaValue}>{ev.eventDate}</div>
              </div>
              <div style={s.metaItem}>
                <div style={s.metaLabel}>Venue</div>
                <div style={s.metaValue}>{ev.venue}</div>
              </div>
              <div style={s.metaItem}>
                <div style={s.metaLabel}>Returned By</div>
                <div style={s.metaValue}>{ev.returnedBy}</div>
              </div>
              <div style={s.metaItem}>
                <div style={s.metaLabel}>Return Date</div>
                <div style={s.metaValue}>{ev.returnDate}</div>
              </div>
              <div style={s.metaItem}>
                <div style={s.metaLabel}>Checked By</div>
                <div style={s.metaValue}>{ev.checkedBy}</div>
              </div>
            </div>

            {/* Table Header */}
            <div style={s.tableHeader} className="equipment-table-header">
              <div></div>
              <div>ITEM</div>
              <div>SENT</div>
              <div>BACK</div>
              <div>DELTA</div>
              <div>STATUS</div>
            </div>

            {/* Table Rows */}
            {filtered.map((item) => {
              const delta = item.sentQty - item.returnedQty;
              const cfg = statusConfig[item.status];

              return (
                <React.Fragment key={item.id}>
                  <div
                    style={{
                      ...s.tableRow,
                      background: cfg.bg,
                    }}
                    className="equipment-table-row"
                  >
                    <div>{categoryIcons[item.category] || "📦"}</div>
                    <div style={{ color: "#eee", fontWeight: 500 }}>{item.name}</div>
                    <div style={{ color: "#aaa", textAlign: "center" }}>{item.sentQty}</div>
                    <div style={{ color: "#aaa", textAlign: "center" }}>{item.returnedQty}</div>
                    <div
                      style={{
                        color: delta > 0 ? "#ff0000" : "#4caf50",
                        fontWeight: 700,
                        textAlign: "center",
                      }}
                    >
                      {delta > 0 ? `-${delta}` : "✓"}
                    </div>
                    <div>
                      <span
                        style={{
                          background: cfg.color,
                          color: item.status === "damaged" ? "#000" : "#fff",
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "3px 10px",
                          borderRadius: 3,
                          letterSpacing: 1,
                        }}
                      >
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                  </div>
                  {item.damageNote && (
                    <div
                      style={{
                        ...s.damageRow,
                        background: cfg.bg,
                        color: "#ff9800",
                        fontStyle: "italic",
                      }}
                    >
                      📝 {item.damageNote}
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Delta Summary */}
            {(eventMissing > 0 || eventDamaged > 0) && (
              <div style={s.deltaSection}>
                <div style={s.deltaTitle}>💸 LOSS REPORT — {ev.jobNumber}</div>
                {ev.equipment
                  .filter((i) => i.status === "missing" || i.status === "damaged")
                  .map((item) => {
                    const delta = item.sentQty - item.returnedQty;
                    if (delta === 0 && item.status !== "damaged") return null;
                    return (
                      <div key={item.id} style={s.deltaRow}>
                        <span style={{ color: "#eee" }}>
                          {item.name} × {delta > 0 ? delta : "damaged"}
                        </span>
                        <span style={{ color: "#ff6b6b", fontWeight: 700 }}>
                          ${delta * item.replacementCost}
                        </span>
                      </div>
                    );
                  })}
                <div
                  style={{
                    ...s.deltaRow,
                    borderTop: "2px solid #ff0000",
                    marginTop: 8,
                    paddingTop: 8,
                    fontSize: 16,
                    fontWeight: 800,
                  }}
                >
                  <span style={{ color: "#fff" }}>TOTAL LOSS</span>
                  <span style={{ color: "#ff0000" }}>${eventLoss}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Running Total */}
      <div style={s.runningTotal}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#ff0000", marginBottom: 16, textAlign: "center" }}>
          📊 RUNNING EQUIPMENT LOSS — FEBRUARY 2026
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, textAlign: "center" }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#ff0000" }}>{totalMissing}</div>
            <div style={{ fontSize: 11, color: "#888", letterSpacing: 1 }}>ITEMS MISSING</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#ff9800" }}>{totalDamaged}</div>
            <div style={{ fontSize: 11, color: "#888", letterSpacing: 1 }}>ITEMS DAMAGED</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#ff0000" }}>
              ${totalLossCost + damageCost}
            </div>
            <div style={{ fontSize: 11, color: "#888", letterSpacing: 1 }}>TOTAL REPLACEMENT COST</div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#666" }}>
          Track this monthly. If it exceeds $500/month, implement equipment checkout signatures.
        </div>
      </div>
    </>
  );
};

export default ReturnedEquipmentPage;
