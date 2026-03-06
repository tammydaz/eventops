import React, { useState } from "react";

// ── Types ──
type PrepTask = {
  id: string;
  itemName: string;
  task: string;
  qty: string;
  checked: boolean;
  allergenFlag?: string;
  section: string;
};

type EventPrepPlan = {
  eventName: string;
  eventDate: string;
  dispatchTime: string;
  guestCount: number;
  serviceStyle: string;
  jobNumber: string;
  allergyBanner?: string;
  prep: {
    threeDaysBefore: PrepTask[];
    twoDaysBefore: PrepTask[];
    oneDayBefore: PrepTask[];
    dayOf: PrepTask[];
  };
};

// ── Sample Data — OFF-PREMISE WORKFLOW ──
const SAMPLE_EVENTS: EventPrepPlan[] = [
  {
    eventName: "Holloway Wedding",
    eventDate: "2026-02-19",
    dispatchTime: "3:00 PM",
    guestCount: 180,
    serviceStyle: "Full Service",
    jobNumber: "HW-021926",
    allergyBanner: "TREE NUT ALLERGY — NO WALNUTS",
    prep: {
      threeDaysBefore: [
        { id: "h1", itemName: "Filet Mignon Au Poivre", task: "Pull filets from freezer to walk-in — thaw (45 lbs)", qty: "3 full pans", checked: false, section: "Buffet – Metal" },
        { id: "h2", itemName: "Braised Short Ribs", task: "Pull short ribs from freezer to walk-in — thaw (30 lbs)", qty: "2 full pans", checked: false, section: "Buffet – Metal" },
      ],
      twoDaysBefore: [
        { id: "h3", itemName: "Filet Mignon Au Poivre", task: "Season & marinate filets, return to walk-in", qty: "45 lbs", checked: false, section: "Buffet – Metal" },
        { id: "h4", itemName: "Braised Short Ribs", task: "Braise short ribs — 4hr cook, cool, store in walk-in", qty: "30 lbs", checked: false, section: "Buffet – Metal" },
        { id: "h5", itemName: "Bleu Cheese Dressing", task: "Make bleu cheese dressing, portion into deli containers, label HW-021926", qty: "2 qt", checked: false, section: "Passed Appetizers" },
        { id: "h6", itemName: "Au Poivre Sauce", task: "Make peppercorn cream sauce, cool, store in cambro, label HW-021926", qty: "1.5 gal", checked: false, section: "Buffet – Metal" },
      ],
      oneDayBefore: [
        { id: "h7", itemName: "Buffalo Bleu Cheese Quesadilla", task: "Prep quesadilla filling — shred chicken, mix buffalo sauce, store labeled HW-021926", qty: "300 pcs", checked: false, section: "Passed Appetizers" },
        { id: "h8", itemName: "Buffalo Bleu Cheese Quesadilla", task: "Cut & stack tortillas, wrap and label HW-021926", qty: "300 pcs", checked: false, section: "Passed Appetizers" },
        { id: "h9", itemName: "Caprese Skewers", task: "Slice mozz, halve tomatoes, pick basil — skewer, tray, wrap, label HW-021926", qty: "180 pcs", checked: true, section: "Buffet – China" },
        { id: "h10", itemName: "Mini Cookies", task: "Bake cookies — chocolate chip & assorted, cool completely", qty: "180 pcs", checked: false, section: "Desserts" },
        { id: "h11", itemName: "Mini Cookies", task: "Tray cookies, wrap, label HW-021926, store in dry rack", qty: "180 pcs", checked: false, section: "Desserts" },
      ],
      dayOf: [
        { id: "h12", itemName: "Buffalo Bleu Cheese Quesadilla", task: "Griddle quesadillas, cut, tray into full pans, wrap & label HW-021926", qty: "300 pcs — 3 full pans", checked: false, section: "Passed Appetizers" },
        { id: "h13", itemName: "Filet Mignon Au Poivre", task: "Sear & finish filets to med-rare, slice, pan, wrap & label HW-021926", qty: "3 full pans", checked: false, section: "Buffet – Metal" },
        { id: "h14", itemName: "Braised Short Ribs", task: "Reheat short ribs 325° x 45min, glaze, pan, wrap & label HW-021926", qty: "2 full pans", checked: false, section: "Buffet – Metal" },
        { id: "h15", itemName: "Au Poivre Sauce", task: "Reheat sauce to simmer, adjust seasoning, cambro, label HW-021926", qty: "1.5 gal", checked: false, section: "Buffet – Metal" },
        { id: "h16", itemName: "Bleu Cheese Dressing", task: "Pull dressing from walk-in, verify label HW-021926, stage for pack-out", qty: "2 qt", checked: false, section: "Passed Appetizers" },
        { id: "h17", itemName: "Caprese Skewers", task: "Pull from walk-in, verify label HW-021926, stage for pack-out", qty: "180 pcs", checked: false, section: "Buffet – China" },
        { id: "h18", itemName: "Mini Cookies", task: "Pull from dry rack, verify label HW-021926, stage for pack-out", qty: "180 pcs", checked: false, section: "Desserts" },
        { id: "h19", itemName: "ALL ITEMS", task: "✅ FINAL CHECK — All pans wrapped, labeled HW-021926, staged on dispatch rack by 2:00 PM", qty: "ALL", checked: false, section: "Buffet – Metal" },
      ],
    },
  },
  {
    eventName: "Laurel Corporate Gala",
    eventDate: "2026-02-20",
    dispatchTime: "5:00 PM",
    guestCount: 240,
    serviceStyle: "Full Service",
    jobNumber: "LCG-022026",
    allergyBanner: "SHELLFISH ALLERGY TABLE 12",
    prep: {
      threeDaysBefore: [
        { id: "l1", itemName: "Carved Beef Tenderloin", task: "Pull whole tenderloins from freezer to walk-in — thaw (60 lbs)", qty: "4 full pans", checked: false, section: "Buffet – Metal" },
      ],
      twoDaysBefore: [
        { id: "l2", itemName: "Carved Beef Tenderloin", task: "Trim, tie, season tenderloins — dry brine, return to walk-in", qty: "60 lbs", checked: false, section: "Buffet – Metal" },
        { id: "l3", itemName: "Shrimp Cocktail Shooters", task: "Pull shrimp from freezer, thaw in walk-in (25 lbs)", qty: "480 pcs", checked: false, allergenFlag: "SHELLFISH", section: "Passed Appetizers" },
        { id: "l4", itemName: "Caesar Dressing", task: "Make caesar dressing, store in deli container, label LCG-022026", qty: "1 gal", checked: false, section: "Buffet – China" },
      ],
      oneDayBefore: [
        { id: "l5", itemName: "Shrimp Cocktail Shooters", task: "Devein & poach shrimp, chill in ice bath, store labeled LCG-022026", qty: "480 pcs", checked: false, allergenFlag: "SHELLFISH", section: "Passed Appetizers" },
        { id: "l6", itemName: "Cocktail Sauce", task: "Make cocktail sauce, portion into containers, label LCG-022026", qty: "1 qt", checked: false, section: "Passed Appetizers" },
        { id: "l7", itemName: "Shrimp Cocktail Shooters", task: "Assemble shooters — shrimp + sauce + lemon in cups, tray, wrap, label LCG-022026", qty: "480 pcs", checked: false, allergenFlag: "SHELLFISH", section: "Passed Appetizers" },
        { id: "l8", itemName: "Caesar Salad Display", task: "Wash & chop romaine, make croutons, shave parm — store all separately, label LCG-022026", qty: "2 large", checked: false, section: "Buffet – China" },
        { id: "l9", itemName: "Mediterranean Hummus Display", task: "Make hummus, prep crudité, slice pita — store in containers, label LCG-022026", qty: "2 boards", checked: false, section: "Buffet – China" },
        { id: "l10", itemName: "Tiramisu Cups", task: "Layer mascarpone, espresso ladyfingers in cups — wrap trays, label LCG-022026, walk-in overnight", qty: "300 cups", checked: false, section: "Desserts" },
      ],
      dayOf: [
        { id: "l11", itemName: "Carved Beef Tenderloin", task: "Roast tenderloins 425° to 125° internal, rest 20min, wrap whole in foil, label LCG-022026", qty: "4 full pans", checked: false, section: "Buffet – Metal" },
        { id: "l12", itemName: "Shrimp Cocktail Shooters", task: "Pull from walk-in, verify label LCG-022026, stage for pack-out (KEEP COLD)", qty: "480 pcs", checked: false, allergenFlag: "SHELLFISH", section: "Passed Appetizers" },
        { id: "l13", itemName: "Caesar Salad Display", task: "Pull all components from walk-in, verify labels LCG-022026, stage for pack-out (DO NOT DRESS)", qty: "2 large", checked: false, section: "Buffet – China" },
        { id: "l14", itemName: "Mediterranean Hummus Display", task: "Pull from walk-in, verify label LCG-022026, stage for pack-out", qty: "2 boards", checked: false, section: "Buffet – China" },
        { id: "l15", itemName: "Tiramisu Cups", task: "Pull from walk-in, dust cocoa powder on each cup, re-wrap, label LCG-022026, stage for pack-out", qty: "300 cups", checked: false, section: "Desserts" },
        { id: "l16", itemName: "ALL ITEMS", task: "✅ FINAL CHECK — All pans wrapped, labeled LCG-022026, staged on dispatch rack by 4:00 PM", qty: "ALL", checked: false, section: "Buffet – Metal" },
      ],
    },
  },
];

// ── Helpers ──
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr + "T12:00:00");
  return `${DAY_NAMES[d.getDay()]}, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
};

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const sectionColors: Record<string, string> = {
  "Passed Appetizers": "#ff9800",
  "Presented Appetizers": "#e91e63",
  "Buffet – Metal": "#f44336",
  "Buffet – China": "#2196f3",
  "Desserts": "#9c27b0",
};

type PrepPhase = "threeDaysBefore" | "twoDaysBefore" | "oneDayBefore" | "dayOf";

const PHASE_CONFIG: { key: PrepPhase; label: string; dayOffset: number; color: string; icon: string }[] = [
  { key: "threeDaysBefore", label: "3 DAYS OUT — PULL & THAW", dayOffset: -3, color: "#4caf50", icon: "📦" },
  { key: "twoDaysBefore", label: "2 DAYS OUT — PREP & COOK BASE", dayOffset: -2, color: "#ff9800", icon: "🔪" },
  { key: "oneDayBefore", label: "1 DAY OUT — BUILD & WRAP", dayOffset: -1, color: "#ff6b6b", icon: "🧊" },
  { key: "dayOf", label: "DAY OF — COOK, WRAP, LABEL, STAGE", dayOffset: 0, color: "#ff0000", icon: "🔥" },
];

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
  viewToggle: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  toggleBtn: {
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 700,
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    color: "#fff",
  },
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
  phaseBlock: {
    marginBottom: 4,
    overflow: "hidden",
    border: "1px solid #222",
  },
  phaseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 20px",
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: 2,
  },
  phaseDate: { fontSize: 13, fontWeight: 400, opacity: 0.7 },
  eventBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 20px",
    background: "#0d1b2a",
    borderBottom: "1px solid #1a1a2e",
  },
  eventName: { fontSize: 14, fontWeight: 700, color: "#00e5ff" },
  eventMeta: { fontSize: 11, color: "#888" },
  jobTag: {
    background: "#00e5ff",
    color: "#000",
    fontSize: 11,
    fontWeight: 800,
    padding: "2px 10px",
    borderRadius: 3,
    marginLeft: 10,
    letterSpacing: 1,
  },
  allergyStrip: {
    background: "#ff0000",
    color: "#fff",
    padding: "4px 20px",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1,
  },
  taskRow: {
    display: "grid",
    gridTemplateColumns: "32px 1fr 120px 100px",
    padding: "8px 20px",
    borderBottom: "1px solid #1a1a1a",
    alignItems: "center",
    fontSize: 13,
    background: "#111",
  },
  finalCheckRow: {
    display: "grid",
    gridTemplateColumns: "32px 1fr",
    padding: "12px 20px",
    borderBottom: "2px solid #00e5ff",
    borderTop: "1px solid #333",
    alignItems: "center",
    fontSize: 14,
    fontWeight: 700,
    background: "#0d1b2a",
  },
  checkbox: { width: 18, height: 18, cursor: "pointer", accentColor: "#00e5ff" },
  taskText: { color: "#eee" },
  taskTextDone: { color: "#555", textDecoration: "line-through" },
  taskItem: { color: "#aaa", fontSize: 11, fontStyle: "italic" },
  sectionTag: {
    fontSize: 10,
    padding: "2px 8px",
    borderRadius: 3,
    fontWeight: 600,
    color: "#fff",
    display: "inline-block",
    textAlign: "center" as const,
  },
  allergenBadge: {
    background: "#ff0000",
    color: "#fff",
    fontSize: 10,
    fontWeight: 800,
    padding: "2px 8px",
    borderRadius: 3,
    marginLeft: 8,
    letterSpacing: 1,
  },
  coldBadge: {
    background: "#2196f3",
    color: "#fff",
    fontSize: 10,
    fontWeight: 800,
    padding: "2px 8px",
    borderRadius: 3,
    marginLeft: 8,
    letterSpacing: 1,
  },
  kitchenReady: {
    textAlign: "center" as const,
    marginTop: 40,
    padding: 24,
    border: "2px solid #333",
    borderRadius: 8,
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
  dispatchBanner: {
    background: "#1a1a2e",
    border: "2px solid #ff6b6b",
    padding: "12px 20px",
    marginTop: 4,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 14,
    fontWeight: 700,
  },
  dispatchBannerComplete: {
    background: "#0d1b2a",
    border: "2px solid #22c55e",
    padding: "12px 20px",
    marginTop: 4,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 14,
    fontWeight: 700,
  },
};

// ── Component ──
type ViewType = "by-day" | "by-event";

const KitchenPrepPage: React.FC = () => {
  const [events, setEvents] = useState<EventPrepPlan[]>(SAMPLE_EVENTS);
  const [view, setView] = useState<ViewType>("by-day");

  const toggleTask = (eventIdx: number, phase: PrepPhase, taskId: string) => {
    setEvents((prev) =>
      prev.map((ev, i) => {
        if (i !== eventIdx) return ev;
        return {
          ...ev,
          prep: {
            ...ev.prep,
            [phase]: ev.prep[phase].map((t) =>
              t.id === taskId ? { ...t, checked: !t.checked } : t
            ),
          },
        };
      })
    );
  };

  const allTasks = events.flatMap((ev) => Object.values(ev.prep).flat());
  const totalTasks = allTasks.length;
  const completed = allTasks.filter((t) => t.checked).length;
  const allergenCount = allTasks.filter((t) => t.allergenFlag).length;
  const totalGuests = events.reduce((s, e) => s + e.guestCount, 0);
  const pctDone = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  const renderTaskRow = (
    task: PrepTask,
    eventIdx: number,
    phase: PrepPhase,
    isFinalCheck: boolean
  ) => {
    if (isFinalCheck) {
      return (
        <div key={task.id} style={s.finalCheckRow}>
          <div>
            <input
              type="checkbox"
              checked={task.checked}
              onChange={() => toggleTask(eventIdx, phase, task.id)}
              style={{ ...s.checkbox, accentColor: "#00ff00", width: 22, height: 22 }}
            />
          </div>
          <div style={{ color: task.checked ? "#00ff00" : "#ffff00" }}>
            {task.task}
          </div>
        </div>
      );
    }

    return (
      <div key={task.id} style={s.taskRow} className="kitchen-task-row">
        <div>
          <input
            type="checkbox"
            checked={task.checked}
            onChange={() => toggleTask(eventIdx, phase, task.id)}
            style={s.checkbox}
          />
        </div>
        <div>
          <div style={task.checked ? s.taskTextDone : s.taskText}>
            {task.task}
            {task.allergenFlag && (
              <span style={s.allergenBadge}>⚠️ {task.allergenFlag}</span>
            )}
            {task.task.includes("KEEP COLD") && (
              <span style={s.coldBadge}>❄️ KEEP COLD</span>
            )}
            {task.task.includes("DO NOT DRESS") && (
              <span style={s.coldBadge}>⛔ DO NOT DRESS</span>
            )}
          </div>
          <div style={s.taskItem}>{task.itemName} — {task.qty}</div>
        </div>
        <div>
          <span
            style={{
              ...s.sectionTag,
              background: sectionColors[task.section] || "#555",
            }}
          >
            {task.section}
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#666" }}>{task.qty}</div>
      </div>
    );
  };

  // ── BY-DAY VIEW ──
  const renderByDay = () => {
    type DayEntry = {
      event: EventPrepPlan;
      eventIdx: number;
      phase: PrepPhase;
      phaseLabel: string;
      phaseIcon: string;
      phaseColor: string;
      tasks: PrepTask[];
    };

    const dayMap: Record<string, DayEntry[]> = {};

    events.forEach((ev, eventIdx) => {
      PHASE_CONFIG.forEach((pc) => {
        const calendarDate = addDays(ev.eventDate, pc.dayOffset);
        const tasks = ev.prep[pc.key];
        if (tasks.length === 0) return;

        if (!dayMap[calendarDate]) dayMap[calendarDate] = [];
        dayMap[calendarDate].push({
          event: ev,
          eventIdx,
          phase: pc.key,
          phaseLabel: pc.label,
          phaseIcon: pc.icon,
          phaseColor: pc.color,
          tasks,
        });
      });
    });

    const sortedDays = Object.keys(dayMap).sort();

    return sortedDays.map((date) => {
      const entries = dayMap[date];
      const dayTasks = entries.flatMap((e) => e.tasks);
      const dayDone = dayTasks.filter((t) => t.checked).length;

      return (
        <div key={date} style={{ marginBottom: 24 }}>
          <div
            style={{
              ...s.phaseHeader,
              background: "#1a1a2e",
              color: "#fff",
              borderBottom: "2px solid #333",
              borderRadius: "8px 8px 0 0",
            }}
          >
            <span>📅 {formatDate(date)}</span>
            <span style={s.phaseDate}>
              {dayDone}/{dayTasks.length} tasks done
            </span>
          </div>

          {entries.map((entry, entryIdx) => (
            <div key={entry.event.eventName + entry.phase + entryIdx}>
              <div style={s.eventBanner}>
                <span style={s.eventName}>
                  {entry.phaseIcon} {entry.event.eventName}
                  <span style={s.jobTag}>{entry.event.jobNumber}</span>
                  <span style={{ color: "#888", fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                    {entry.phaseLabel}
                  </span>
                </span>
                <span style={s.eventMeta}>
                  Dispatch: {entry.event.dispatchTime} • {entry.event.guestCount} guests
                </span>
              </div>

              {entry.event.allergyBanner && (
                <div style={s.allergyStrip}>⚠️ {entry.event.allergyBanner}</div>
              )}

              {/* Dispatch deadline banner on day-of */}
              {entry.phase === "dayOf" && (() => {
                const allComplete = entry.tasks.every((t) => t.checked);
                return (
                  <div style={allComplete ? s.dispatchBannerComplete : s.dispatchBanner}>
                    <span style={{ color: allComplete ? "#22c55e" : "#ff6b6b" }}>
                      {allComplete
                        ? "✅ Completed on time"
                        : `🚛 DISPATCH DEADLINE: Everything wrapped, labeled & staged by ${entry.event.dispatchTime}`}
                    </span>
                    <span style={{ color: "#00e5ff" }}>{entry.event.jobNumber}</span>
                  </div>
                );
              })()}

              {/* Task list — collapse when all day-of tasks complete */}
              {!(entry.phase === "dayOf" && entry.tasks.every((t) => t.checked)) &&
                entry.tasks.map((task) =>
                  renderTaskRow(
                    task,
                    entry.eventIdx,
                    entry.phase,
                    task.itemName === "ALL ITEMS"
                  )
                )}
            </div>
          ))}
        </div>
      );
    });
  };

  // ── BY-EVENT VIEW ──
  const renderByEvent = () => {
    return events.map((ev, eventIdx) => (
      <div key={ev.eventName} style={{ marginBottom: 40 }}>
        <div
          style={{
            padding: "16px 20px",
            background: "#0d1b2a",
            borderRadius: "8px 8px 0 0",
            borderBottom: "2px solid #00e5ff",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, color: "#00e5ff" }}>
            {ev.eventName}
            <span style={{ ...s.jobTag, fontSize: 14, marginLeft: 16 }}>{ev.jobNumber}</span>
          </div>
          <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>
            {formatDate(ev.eventDate)} • Dispatch: {ev.dispatchTime} •{" "}
            {ev.guestCount} guests • {ev.serviceStyle}
          </div>
          {ev.allergyBanner && (
            <div style={{ ...s.allergyStrip, marginTop: 8, borderRadius: 3 }}>
              ⚠️ {ev.allergyBanner}
            </div>
          )}
        </div>

        {PHASE_CONFIG.map((pc) => {
          const tasks = ev.prep[pc.key];
          if (tasks.length === 0) return null;
          const prepDate = addDays(ev.eventDate, pc.dayOffset);
          const done = tasks.filter((t) => t.checked).length;

          return (
            <div key={pc.key}>
              <div style={s.phaseBlock}>
                <div
                  style={{
                    ...s.phaseHeader,
                    background: pc.color,
                    color: "#fff",
                  }}
                >
                  <span>{pc.icon} {pc.label}</span>
                  <span style={s.phaseDate}>
                    {formatDate(prepDate)} — {done}/{tasks.length} done
                  </span>
                </div>

                {pc.key === "dayOf" && (() => {
                  const allComplete = tasks.every((t) => t.checked);
                  return (
                    <div style={allComplete ? s.dispatchBannerComplete : s.dispatchBanner}>
                      <span style={{ color: allComplete ? "#22c55e" : "#ff6b6b" }}>
                        {allComplete
                          ? "✅ Completed on time"
                          : `🚛 DISPATCH DEADLINE: Everything wrapped, labeled & staged by ${ev.dispatchTime}`}
                      </span>
                      <span style={{ color: "#00e5ff" }}>{ev.jobNumber}</span>
                    </div>
                  );
                })()}

                {!(pc.key === "dayOf" && tasks.every((t) => t.checked)) &&
                  tasks.map((task) =>
                    renderTaskRow(
                      task,
                      eventIdx,
                      pc.key,
                      task.itemName === "ALL ITEMS"
                    )
                  )}
              </div>
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .kitchen-page { padding: 16px !important; }
          .kitchen-title { font-size: 24px !important; }
          .kitchen-stats { flex-direction: column !important; gap: 16px !important; }
          .kitchen-task-row { grid-template-columns: 32px 1fr !important; font-size: 12px !important; }
        }
      `}</style>
      <div style={s.page} className="kitchen-page">
        <button style={s.backBtn} onClick={() => window.history.back()}>← Back</button>

      <div style={s.header}>
        <div style={s.title} className="kitchen-title">🔪 KITCHEN PREP — WEEK OF FEB 16</div>
        <div style={s.subtitle}>OFF-PREMISE PRODUCTION MANIFEST • PREP → COOK → WRAP → LABEL → STAGE</div>
      </div>

      <div style={s.viewToggle}>
        <button
          style={{ ...s.toggleBtn, background: view === "by-day" ? "#ff6b6b" : "#333" }}
          onClick={() => setView("by-day")}
        >
          📅 View by Day
        </button>
        <button
          style={{ ...s.toggleBtn, background: view === "by-event" ? "#ff6b6b" : "#333" }}
          onClick={() => setView("by-event")}
        >
          🎪 View by Event
        </button>
      </div>

      <div style={s.statsBar} className="kitchen-stats">
        <div style={s.stat}>
          <div style={s.statNumber}>{events.length}</div>
          <div style={s.statLabel}>Events</div>
        </div>
        <div style={s.stat}>
          <div style={s.statNumber}>{totalGuests}</div>
          <div style={s.statLabel}>Total Guests</div>
        </div>
        <div style={s.stat}>
          <div style={s.statNumber}>{totalTasks}</div>
          <div style={s.statLabel}>Prep Tasks</div>
        </div>
        <div style={s.stat}>
          <div style={{ ...s.statNumber, color: allergenCount > 0 ? "#ff0000" : "#00e5ff" }}>
            {allergenCount}
          </div>
          <div style={s.statLabel}>Allergen Flags</div>
        </div>
        <div style={s.stat}>
          <div
            style={{
              ...s.statNumber,
              color: pctDone === 100 ? "#00ff00" : pctDone > 50 ? "#ffff00" : "#ff6b6b",
            }}
          >
            {pctDone}%
          </div>
          <div style={s.statLabel}>Complete</div>
        </div>
      </div>

      {view === "by-day" ? renderByDay() : renderByEvent()}

      <div style={s.kitchenReady}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{pctDone === 100 ? "✅" : "🔧"}</div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: pctDone === 100 ? "#00ff00" : "#ff6b6b",
            letterSpacing: 2,
          }}
        >
          {pctDone === 100 ? "ALL JOBS PREPPED & STAGED" : "PREP IN PROGRESS"}
        </div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
          {completed} of {totalTasks} tasks complete
        </div>
      </div>
      </div>
    </>
  );
};

export default KitchenPrepPage;
