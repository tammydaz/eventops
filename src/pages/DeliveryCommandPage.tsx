import React, { useState } from "react";

// ── Types ──
type DeliveryType = "delivery" | "pickup" | "full-service";

type DispatchItem = {
  id: string;
  eventName: string;
  jobNumber: string;
  client: string;
  type: DeliveryType;
  venue: string;
  venueAddress: string;
  distanceFromKitchen: string;
  estimatedDriveTime: number; // minutes
  guestCount: number;
  dispatchTime: string;
  eventStartTime: string;
  assignedDriver: string;
  assignedVehicle: string;
  status: "staged" | "loaded" | "en-route" | "delivered" | "picked-up" | "conflict";
  notes?: string;
  requiresExpeditor: boolean;
  panCount: number;
};

type Driver = {
  name: string;
  vehicle: string;
  capacity: string;
  assignments: string[]; // job numbers
  totalDriveMinutes: number;
  hasConflict: boolean;
  conflictReason?: string;
};

// ── Sample Data — Yesterday's Chaos Recreated ──
const SAMPLE_DISPATCHES: DispatchItem[] = [
  {
    id: "d1",
    eventName: "Johnson Anniversary Lunch",
    jobNumber: "JAL-021526",
    client: "Johnson Family",
    type: "delivery",
    venue: "The Vineyard Estate",
    venueAddress: "450 Vineyard Rd, Hammonton NJ",
    distanceFromKitchen: "28 mi",
    estimatedDriveTime: 42,
    guestCount: 45,
    dispatchTime: "10:00 AM",
    eventStartTime: "12:00 PM",
    assignedDriver: "Mike",
    assignedVehicle: "Van 1",
    status: "delivered",
    panCount: 8,
    requiresExpeditor: false,
  },
  {
    id: "d2",
    eventName: "Tech Corp Board Meeting",
    jobNumber: "TCBM-021526",
    client: "Tech Corp",
    type: "delivery",
    venue: "Tech Corp HQ",
    venueAddress: "200 Innovation Blvd, Cherry Hill NJ",
    distanceFromKitchen: "18 mi",
    estimatedDriveTime: 30,
    guestCount: 25,
    dispatchTime: "10:30 AM",
    eventStartTime: "12:00 PM",
    assignedDriver: "Mike",
    assignedVehicle: "Van 1",
    status: "conflict",
    panCount: 5,
    requiresExpeditor: false,
    notes: "⚠️ Mike can't do both — JAL dispatch 10AM + 42min drive = arrival 10:42AM, return to kitchen ~11:24AM, TCBM dispatch 10:30AM MISSED",
  },
  {
    id: "d3",
    eventName: "Rosewood Bridal Shower",
    jobNumber: "RBS-021526",
    client: "Ava Daniels",
    type: "full-service",
    venue: "Rosewood Loft",
    venueAddress: "88 Main St, Haddonfield NJ",
    distanceFromKitchen: "12 mi",
    estimatedDriveTime: 22,
    guestCount: 60,
    dispatchTime: "11:00 AM",
    eventStartTime: "1:00 PM",
    assignedDriver: "Carlos",
    assignedVehicle: "Box Truck",
    status: "en-route",
    panCount: 14,
    requiresExpeditor: true,
  },
  {
    id: "d4",
    eventName: "Smith Family Pickup",
    jobNumber: "SFP-021526",
    client: "Karen Smith",
    type: "pickup",
    venue: "CLIENT PICKS UP AT KITCHEN",
    venueAddress: "FoodWerx Kitchen",
    distanceFromKitchen: "0 mi",
    estimatedDriveTime: 0,
    guestCount: 30,
    dispatchTime: "11:30 AM",
    eventStartTime: "2:00 PM",
    assignedDriver: "—",
    assignedVehicle: "—",
    status: "staged",
    panCount: 6,
    requiresExpeditor: true,
    notes: "Client picking up — expeditor must be here to hand off & explain heating instructions",
  },
  {
    id: "d5",
    eventName: "Harbor Hall Corporate",
    jobNumber: "HHC-021526",
    client: "Laurel Tech",
    type: "full-service",
    venue: "Harbor Hall",
    venueAddress: "500 Harbor Dr, Atlantic City NJ",
    distanceFromKitchen: "45 mi",
    estimatedDriveTime: 65,
    guestCount: 240,
    dispatchTime: "12:00 PM",
    eventStartTime: "5:00 PM",
    assignedDriver: "Carlos",
    assignedVehicle: "Box Truck",
    status: "conflict",
    panCount: 32,
    requiresExpeditor: true,
    notes: "⚠️ Carlos dispatched RBS at 11AM + 22min drive + 30min unload = back at kitchen ~12:00PM. HHC dispatch is 12:00PM — NO TIME TO LOAD. 45mi drive means late arrival.",
  },
  {
    id: "d6",
    eventName: "Downtown Office Lunch",
    jobNumber: "DOL-021526",
    client: "Metro Financial",
    type: "delivery",
    venue: "Metro Financial Tower",
    venueAddress: "100 Market St, Camden NJ",
    distanceFromKitchen: "15 mi",
    estimatedDriveTime: 25,
    guestCount: 35,
    dispatchTime: "10:15 AM",
    eventStartTime: "12:00 PM",
    assignedDriver: "Mike",
    assignedVehicle: "Van 1",
    status: "conflict",
    panCount: 6,
    requiresExpeditor: false,
    notes: "⚠️ Third delivery for Mike before noon — physically impossible",
  },
];

const SAMPLE_DRIVERS: Driver[] = [
  {
    name: "Mike",
    vehicle: "Van 1 (12-pan capacity)",
    capacity: "12 pans",
    assignments: ["JAL-021526", "TCBM-021526", "DOL-021526"],
    totalDriveMinutes: 97,
    hasConflict: true,
    conflictReason: "3 deliveries before noon — overlapping dispatch times. Can only make 1.",
  },
  {
    name: "Carlos",
    vehicle: "Box Truck (40-pan capacity)",
    capacity: "40 pans",
    assignments: ["RBS-021526", "HHC-021526"],
    totalDriveMinutes: 87,
    hasConflict: true,
    conflictReason: "RBS unload + return overlaps with HHC dispatch. Need 2nd driver or stagger times.",
  },
  {
    name: "Expeditor (Alex)",
    vehicle: "Kitchen Station",
    capacity: "—",
    assignments: ["RBS-021526", "SFP-021526", "HHC-021526"],
    totalDriveMinutes: 0,
    hasConflict: true,
    conflictReason: "3 events need expeditor between 11AM-12PM. Smith pickup at 11:30 while expeditor loading RBS and HHC.",
  },
];

// ── Helpers ──
const typeColors: Record<DeliveryType, string> = {
  delivery: "#2196f3",
  pickup: "#9c27b0",
  "full-service": "#ff9800",
};

const typeLabels: Record<DeliveryType, string> = {
  delivery: "🚐 DELIVERY",
  pickup: "📦 CLIENT PICKUP",
  "full-service": "🎪 FULL SERVICE",
};

const statusColors: Record<string, string> = {
  staged: "#ffff00",
  loaded: "#ff9800",
  "en-route": "#2196f3",
  delivered: "#4caf50",
  "picked-up": "#4caf50",
  conflict: "#ff0000",
};

const statusLabels: Record<string, string> = {
  staged: "📦 STAGED",
  loaded: "🔄 LOADED",
  "en-route": "🚛 EN ROUTE",
  delivered: "✅ DELIVERED",
  "picked-up": "✅ PICKED UP",
  conflict: "🚨 CONFLICT",
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
  header: { textAlign: "center", marginBottom: 8 },
  title: { fontSize: 32, fontWeight: 800, color: "#ff6b6b", letterSpacing: 2, marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#888", letterSpacing: 1 },
  conflictBanner: {
    background: "#330000",
    border: "2px solid #ff0000",
    borderRadius: 8,
    padding: "16px 24px",
    margin: "24px 0",
    textAlign: "center" as const,
  },
  conflictTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#ff0000",
    letterSpacing: 2,
    marginBottom: 8,
  },
  conflictDetail: {
    fontSize: 13,
    color: "#ff6b6b",
    marginBottom: 4,
  },
  statsBar: {
    display: "flex",
    justifyContent: "center",
    gap: 40,
    marginBottom: 24,
    padding: "16px 0",
    borderTop: "1px solid #333",
    borderBottom: "1px solid #333",
  },
  stat: { textAlign: "center" as const },
  statNumber: { fontSize: 28, fontWeight: 800, color: "#00e5ff" },
  statLabel: { fontSize: 11, color: "#888", letterSpacing: 1, textTransform: "uppercase" as const },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
    padding: "12px 0",
    borderBottom: "1px solid #333",
    marginTop: 32,
    marginBottom: 16,
  },
  timeline: {
    position: "relative" as const,
    paddingLeft: 40,
  },
  timelineLine: {
    position: "absolute" as const,
    left: 16,
    top: 0,
    bottom: 0,
    width: 2,
    background: "#333",
  },
  dispatchCard: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: 8,
    padding: "16px 20px",
    marginBottom: 12,
    position: "relative" as const,
  },
  dispatchCardConflict: {
    background: "#1a0000",
    border: "2px solid #ff0000",
    borderRadius: 8,
    padding: "16px 20px",
    marginBottom: 12,
    position: "relative" as const,
  },
  timeDot: {
    position: "absolute" as const,
    left: -32,
    top: 20,
    width: 12,
    height: 12,
    borderRadius: "50%",
    border: "2px solid #333",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#fff" },
  jobTag: {
    background: "#00e5ff",
    color: "#000",
    fontSize: 11,
    fontWeight: 800,
    padding: "2px 10px",
    borderRadius: 3,
    marginLeft: 10,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: 4,
    color: "#000",
  },
  typeBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 3,
    color: "#fff",
    display: "inline-block",
    marginBottom: 8,
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
    fontSize: 12,
    color: "#aaa",
    marginBottom: 8,
  },
  cardLabel: { color: "#666", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: 1 },
  cardValue: { color: "#eee", fontSize: 13, fontWeight: 600 },
  conflictNote: {
    background: "#330000",
    border: "1px solid #ff0000",
    borderRadius: 4,
    padding: "8px 12px",
    fontSize: 12,
    color: "#ff6b6b",
    fontWeight: 600,
    marginTop: 8,
  },
  driverCard: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: 8,
    padding: "16px 20px",
    marginBottom: 12,
  },
  driverCardConflict: {
    background: "#1a0000",
    border: "2px solid #ff0000",
    borderRadius: 8,
    padding: "16px 20px",
    marginBottom: 12,
  },
  driverName: { fontSize: 18, fontWeight: 700, color: "#00e5ff" },
  driverMeta: { fontSize: 12, color: "#aaa", marginTop: 4 },
  driverJobs: {
    display: "flex",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap" as const,
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
  roleHub: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 32,
  },
  roleCard: {
    background: "linear-gradient(145deg, #151515 0%, #0d0d0d 100%)",
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    padding: "20px 24px",
    textAlign: "center" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  roleCardPrimary: {
    borderColor: "rgba(0,229,255,0.5)",
    background: "linear-gradient(145deg, #0d1b2a 0%, #0a1520 100%)",
  },
  roleCardIcon: { fontSize: 32, marginBottom: 8 },
  roleCardTitle: { fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 },
  roleCardDesc: { fontSize: 12, color: "#888", lineHeight: 1.4 },
};

// ── Route Optimization content (reused in sticky panel) ──
const RouteOptimizationContent: React.FC = () => (
  <>
    <div style={{ fontSize: 18, fontWeight: 800, color: "#00e5ff", marginBottom: 12 }}>
      💡 SUGGESTED FIX — ROUTE OPTIMIZATION
    </div>
    <div style={{ fontSize: 13, color: "#eee", lineHeight: 1.8 }}>
      <div style={{ marginBottom: 12 }}>
        <strong style={{ color: "#ff6b6b" }}>Problem:</strong> Mike has 3 deliveries
        (JAL 10:00AM, DOL 10:15AM, TCBM 10:30AM) — physically impossible.
        Carlos has back-to-back full service loads with no buffer.
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong style={{ color: "#00ff00" }}>Option A:</strong> Add a 3rd driver for
        the morning window. Mike takes JAL (furthest), 3rd driver takes DOL + TCBM
        (both under 20mi, can combo load).
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong style={{ color: "#00ff00" }}>Option B:</strong> Move TCBM dispatch to
        9:30AM (30min earlier). Mike delivers TCBM first (18mi, back by 10:30AM),
        then takes JAL at 10:30AM (push 30min).
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong style={{ color: "#00ff00" }}>Option C:</strong> Combo load DOL + TCBM
        in Van 1 (11 pans total, under 12 capacity). Both are under 20mi.
        Mike delivers both, Carlos stays on full-service runs.
      </div>
      <div style={{ marginTop: 12, color: "#888", fontSize: 11 }}>
        * In the wired version, drive times and conflicts are calculated automatically
        from venue addresses using distance/time APIs.
      </div>
    </div>
  </>
);

// ── Hide warnings until design is ready ──
const SHOW_WARNINGS = false;

// ── Component ──
const DeliveryCommandPage: React.FC = () => {
  const [dispatches] = useState<DispatchItem[]>(SAMPLE_DISPATCHES);
  const [drivers] = useState<Driver[]>(SAMPLE_DRIVERS);
  const [optimizePanelOpen, setOptimizePanelOpen] = useState(true);

  const conflicts = dispatches.filter((d) => d.status === "conflict");
  const totalPans = dispatches.reduce((sum, d) => sum + d.panCount, 0);
  const totalGuests = dispatches.reduce((sum, d) => sum + d.guestCount, 0);
  const deliveries = dispatches.filter((d) => d.type === "delivery").length;
  const pickups = dispatches.filter((d) => d.type === "pickup").length;
  const fullService = dispatches.filter((d) => d.type === "full-service").length;

  // Sort all jobs (delivery, pickup, full-service) by dispatch time for the day
  const parseDispatchTime = (t: string): number => {
    const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!m) return 0;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if ((m[3] || "").toUpperCase() === "PM" && h < 12) h += 12;
    if ((m[3] || "").toUpperCase() === "AM" && h === 12) h = 0;
    return h * 60 + min;
  };
  const sortedDispatches = [...dispatches].sort(
    (a, b) => parseDispatchTime(a.dispatchTime) - parseDispatchTime(b.dispatchTime)
  );
  const jobNumberToSeq: Record<string, number> = {};
  sortedDispatches.forEach((d, i) => { jobNumberToSeq[d.jobNumber] = i + 1; });

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .delivery-page { padding: 16px !important; }
          .delivery-header { font-size: 24px !important; }
          .delivery-subtitle { font-size: 12px !important; }
          .delivery-stats { flex-direction: column !important; gap: 16px !important; }
          .delivery-card-grid { grid-template-columns: 1fr !important; gap: 4px !important; font-size: 11px !important; }
          .delivery-conflict-banner { padding: 12px 16px !important; }
          .delivery-driver-jobs { flex-wrap: wrap !important; }
          .delivery-role-hub { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .delivery-hub-columns { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .delivery-role-hub { grid-template-columns: 1fr !important; }
        }
        .delivery-role-card-dispatch:hover {
          border-color: rgba(0,229,255,0.8) !important;
          box-shadow: 0 0 20px rgba(0,229,255,0.2);
        }
      `}</style>
      <div style={s.page} className="delivery-page">
        <button style={s.backBtn} onClick={() => window.history.back()}>← Back</button>

      {/* Header */}
      <div style={s.header} className="delivery-header-wrap">
        <div style={s.title} className="delivery-header">🚚 DELIVERY & OPERATIONS HUB</div>
        <div style={s.subtitle} className="delivery-subtitle">
          Expedite full-service runs • Dispatch deliveries • Handle pickups • Keep kitchen in check
        </div>
        <div style={{ ...s.subtitle, marginTop: 8, fontSize: 12 }}>Saturday, February 15, 2026</div>
      </div>

      {/* Role Overview — what delivery staff owns */}
      <div style={s.roleHub} className="delivery-role-hub">
        <div
          role="button"
          tabIndex={0}
          style={{ ...s.roleCard, ...s.roleCardPrimary }}
          onClick={() => document.getElementById("dispatch-deliveries-hub")?.scrollIntoView({ behavior: "smooth" })}
          onKeyDown={(e) => e.key === "Enter" && document.getElementById("dispatch-deliveries-hub")?.scrollIntoView({ behavior: "smooth" })}
          className="delivery-role-card-dispatch"
        >
          <div style={s.roleCardIcon}>🚛</div>
          <div style={s.roleCardTitle}>Dispatch & Deliveries</div>
          <div style={s.roleCardDesc}>Route deliveries, assign drivers, track en-route</div>
          <div style={{ fontSize: 10, color: "#00e5ff", marginTop: 8, opacity: 0.8 }}>Click to open →</div>
        </div>
        <div style={s.roleCard}>
          <div style={s.roleCardIcon}>🎪</div>
          <div style={s.roleCardTitle}>Full-Service Expediting</div>
          <div style={s.roleCardDesc}>Load out for full-service events, ensure timely departure</div>
        </div>
        <div style={s.roleCard}>
          <div style={s.roleCardIcon}>📦</div>
          <div style={s.roleCardTitle}>Special Order Pickups</div>
          <div style={s.roleCardDesc}>Client pickups at kitchen — hand off & heating instructions</div>
        </div>
        <div style={s.roleCard}>
          <div style={s.roleCardIcon}>🍳</div>
          <div style={s.roleCardTitle}>Kitchen Oversight</div>
          <div style={s.roleCardDesc}>Keep kitchen in check — staging, timing, flow</div>
        </div>
      </div>

      {/* ── DISPATCH & DELIVERIES HUB (main content) ── */}
      <div
        id="dispatch-deliveries-hub"
        style={{
          background: "linear-gradient(180deg, rgba(15,20,30,0.6) 0%, rgba(10,10,15,0.8) 100%)",
          border: "2px solid rgba(0,229,255,0.3)",
          borderRadius: 12,
          padding: "24px 28px",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "#00e5ff",
            letterSpacing: 2,
            marginBottom: 20,
            paddingBottom: 12,
            borderBottom: "1px solid rgba(0,229,255,0.3)",
          }}
        >
          🚛 DISPATCH & DELIVERIES HUB
        </div>

        {/* Conflict Banner */}
        {SHOW_WARNINGS && conflicts.length > 0 && (
          <div style={s.conflictBanner}>
            <div style={s.conflictTitle}>
              🚨 {conflicts.length} DISPATCH CONFLICTS DETECTED
            </div>
            <div style={s.conflictDetail}>
              The current schedule is PHYSICALLY IMPOSSIBLE — drivers cannot be in two places at once
            </div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>
              Review timeline below and reassign drivers or stagger dispatch times
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={s.statsBar} className="delivery-stats">
          <div style={s.stat}>
            <div style={s.statNumber}>{dispatches.length}</div>
            <div style={s.statLabel}>Total Dispatches</div>
          </div>
          <div style={s.stat}>
            <div style={s.statNumber}>{deliveries}</div>
            <div style={s.statLabel}>Deliveries</div>
          </div>
          <div style={s.stat}>
            <div style={s.statNumber}>{fullService}</div>
            <div style={s.statLabel}>Full Service</div>
          </div>
          <div style={s.stat}>
            <div style={s.statNumber}>{pickups}</div>
            <div style={s.statLabel}>Pickups</div>
          </div>
          <div style={s.stat}>
            <div style={s.statNumber}>{totalPans}</div>
            <div style={s.statLabel}>Total Pans</div>
          </div>
          <div style={s.stat}>
            <div style={s.statNumber}>{totalGuests}</div>
            <div style={s.statLabel}>Total Guests</div>
          </div>
          <div style={s.stat}>
            <div style={{ ...s.statNumber, color: SHOW_WARNINGS && conflicts.length > 0 ? "#ff0000" : "#00e5ff" }}>
              {conflicts.length}
            </div>
            <div style={s.statLabel}>Conflicts</div>
          </div>
        </div>

        {/* Two-column: Drivers | Timeline */}
        <div className="delivery-hub-columns" style={{ display: "grid", gridTemplateColumns: "minmax(280px, 380px) 1fr", gap: 28, marginTop: 24 }}>
          {/* ── Driver Assignments ── */}
          <div>
            <div style={s.sectionTitle}>👤 DRIVER ASSIGNMENTS</div>
            {drivers.map((driver) => (
        <div
          key={driver.name}
          style={SHOW_WARNINGS && driver.hasConflict ? s.driverCardConflict : s.driverCard}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={s.driverName}>{driver.name}</span>
              <span style={{ color: "#888", fontSize: 13, marginLeft: 12 }}>
                {driver.vehicle}
              </span>
            </div>
            {SHOW_WARNINGS && driver.hasConflict && (
              <span
                style={{
                  ...s.statusBadge,
                  background: "#ff0000",
                  color: "#fff",
                }}
              >
                🚨 CONFLICT
              </span>
            )}
          </div>
          <div style={s.driverMeta}>
            {driver.assignments.length} assignment{driver.assignments.length > 1 ? "s" : ""} •{" "}
            {driver.totalDriveMinutes} min total drive time
          </div>
          <div style={s.driverJobs} className="delivery-driver-jobs">
            {[...driver.assignments]
              .sort((a, b) => (jobNumberToSeq[a] ?? 999) - (jobNumberToSeq[b] ?? 999))
              .map((job) => (
                <span key={job} style={s.jobTag} title={job}>
                  {jobNumberToSeq[job] ? `Job #${jobNumberToSeq[job]}` : job}
                </span>
              ))}
          </div>
          {SHOW_WARNINGS && driver.hasConflict && driver.conflictReason && (
            <div style={s.conflictNote}>⚠️ {driver.conflictReason}</div>
          )}
        </div>
      ))}
          </div>

          {/* ── Dispatch Timeline ── */}
          <div>
            <div style={s.sectionTitle}>⏱️ DISPATCH TIMELINE — All jobs by dispatch time (delivery, pickup, full-service)</div>
            <div style={s.timeline}>
        <div style={s.timelineLine} />

        {sortedDispatches.map((d, idx) => (
          <div
            key={d.id}
            style={SHOW_WARNINGS && d.status === "conflict" ? s.dispatchCardConflict : s.dispatchCard}
          >
            <div
              style={{
                ...s.timeDot,
                background: statusColors[d.status],
                borderColor: statusColors[d.status],
              }}
            />

            {/* Header — Job # assigned by dispatch time order for the day (all jobs: delivery, pickup, full-service) */}
            <div style={s.cardHeader}>
              <div>
                <span style={{ ...s.jobTag, marginRight: 8 }}>Job #{idx + 1}</span>
                <span style={s.cardTitle}>{d.eventName}</span>
                <span style={{ ...s.jobTag, background: "rgba(255,255,255,0.15)", color: "#aaa" }}>{d.jobNumber}</span>
              </div>
              <span
                style={{
                  ...s.statusBadge,
                  background: statusColors[d.status],
                  color: SHOW_WARNINGS && d.status === "conflict" ? "#fff" : "#000",
                }}
              >
                {statusLabels[d.status]}
              </span>
            </div>

            {/* Type Badge */}
            <span style={{ ...s.typeBadge, background: typeColors[d.type] }}>
              {typeLabels[d.type]}
            </span>

            {/* Details Grid */}
            <div style={s.cardGrid} className="delivery-card-grid">
              <div>
                <div style={s.cardLabel}>Dispatch Time</div>
                <div style={{ ...s.cardValue, color: "#ff6b6b", fontSize: 16 }}>
                  {d.dispatchTime}
                </div>
              </div>
              <div>
                <div style={s.cardLabel}>Event Start</div>
                <div style={s.cardValue}>{d.eventStartTime}</div>
              </div>
              <div>
                <div style={s.cardLabel}>Guest Count</div>
                <div style={s.cardValue}>{d.guestCount}</div>
              </div>
              <div>
                <div style={s.cardLabel}>Venue</div>
                <div style={s.cardValue}>{d.venue}</div>
              </div>
              <div>
                <div style={s.cardLabel}>Distance / Drive Time</div>
                <div style={s.cardValue}>
                  {d.distanceFromKitchen} • {d.estimatedDriveTime} min
                </div>
              </div>
              <div>
                <div style={s.cardLabel}>Pan Count</div>
                <div style={s.cardValue}>{d.panCount} pans</div>
              </div>
              <div>
                <div style={s.cardLabel}>Driver</div>
                <div style={s.cardValue}>{d.assignedDriver}</div>
              </div>
              <div>
                <div style={s.cardLabel}>Vehicle</div>
                <div style={s.cardValue}>{d.assignedVehicle}</div>
              </div>
              <div>
                <div style={s.cardLabel}>Expeditor Needed</div>
                <div style={{ ...s.cardValue, color: d.requiresExpeditor ? "#ff9800" : "#4caf50" }}>
                  {d.requiresExpeditor ? "YES" : "No"}
                </div>
              </div>
            </div>

            {/* Conflict Note */}
            {SHOW_WARNINGS && d.notes && d.status === "conflict" && (
              <div style={s.conflictNote}>{d.notes}</div>
            )}

            {/* Pickup Note */}
            {d.type === "pickup" && d.notes && (
              <div
                style={{
                  ...s.conflictNote,
                  background: "#1a0033",
                  borderColor: "#9c27b0",
                  color: "#ce93d8",
                }}
              >
                {d.notes}
              </div>
            )}
          </div>
        ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Route Optimization (also in sticky panel below) ── */}
      <div
        style={{
          background: "#0d1b2a",
          border: "2px solid #00e5ff",
          borderRadius: 8,
          padding: "20px 24px",
          marginTop: 32,
        }}
      >
        <RouteOptimizationContent />
      </div>
      </div>

      {/* ── Sticky Route Optimization Panel (always accessible) ── */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          right: optimizePanelOpen ? 0 : -320,
          transform: "translateY(-50%)",
          zIndex: 90,
          transition: "right 0.25s ease",
        }}
      >
        <div
          style={{
            background: "#0d1b2a",
            border: "2px solid #00e5ff",
            borderRight: "none",
            borderRadius: "8px 0 0 8px",
            boxShadow: "-4px 0 20px rgba(0,0,0,0.5)",
            width: 320,
            maxHeight: "70vh",
            overflow: "auto",
          }}
        >
          <div style={{ padding: "16px 20px 16px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#00e5ff" }}>💡 Route Optimization</span>
              <button
                type="button"
                onClick={() => setOptimizePanelOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#00e5ff",
                  cursor: "pointer",
                  fontSize: 18,
                  padding: "0 4px",
                  lineHeight: 1,
                }}
                title="Collapse panel"
              >
                ›
              </button>
            </div>
            <RouteOptimizationContent />
          </div>
        </div>
      </div>
      {!optimizePanelOpen && (
        <button
          type="button"
          onClick={() => setOptimizePanelOpen(true)}
          style={{
            position: "fixed",
            top: "50%",
            right: 0,
            transform: "translateY(-50%)",
            zIndex: 89,
            background: "#0d1b2a",
            border: "2px solid #00e5ff",
            borderRight: "none",
            borderRadius: "8px 0 0 8px",
            padding: "16px 10px",
            color: "#00e5ff",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            letterSpacing: 1,
            boxShadow: "-2px 0 12px rgba(0,0,0,0.4)",
          }}
          title="Open Route Optimization"
        >
          💡 OPTIMIZE
        </button>
      )}
    </>
  );
};

export default DeliveryCommandPage;
