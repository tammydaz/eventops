import React, { useState } from "react";

// ── Types ──
type FoodFeedback = {
  itemName: string;
  section: string;
  result: "ran-out" | "perfect" | "too-much" | "not-rated";
  leftoverEstimate?: string;
};

type StaffRating = {
  name: string;
  role: string;
  rating: 1 | 2 | 3 | 4 | 5;
  note?: string;
};

type DebriefData = {
  eventName: string;
  jobNumber: string;
  eventDate: string;
  venue: string;
  guestCount: number;
  actualGuestCount: string;
  clientSatisfaction: 1 | 2 | 3 | 4 | 5;
  foodFeedback: FoodFeedback[];
  staffRatings: StaffRating[];
  issuesEncountered: string[];
  clientComplaints: string;
  venueNotes: string;
  timingNotes: string;
  equipmentNotes: string;
  wouldRepeatMenu: boolean;
  overallNotes: string;
  submittedBy: string;
};

// ── Sample Data ──
const SAMPLE_DEBRIEF: DebriefData = {
  eventName: "Holloway Wedding",
  jobNumber: "HW-021526",
  eventDate: "2026-02-15",
  venue: "Magnolia Estate",
  guestCount: 180,
  actualGuestCount: "~195",
  clientSatisfaction: 4,
  foodFeedback: [
    { itemName: "Buffalo Bleu Cheese Quesadilla", section: "Passed Appetizers", result: "ran-out", leftoverEstimate: "Ran out at 45min mark — need 20% more for 180+ guests" },
    { itemName: "Filet Mignon Au Poivre", section: "Buffet – Metal", result: "perfect" },
    { itemName: "Braised Short Ribs", section: "Buffet – Metal", result: "perfect" },
    { itemName: "Au Poivre Sauce", section: "Buffet – Metal", result: "too-much", leftoverEstimate: "~0.5 gal returned" },
    { itemName: "Caprese Skewers", section: "Buffet – China", result: "ran-out", leftoverEstimate: "Gone in 30min — only had 180 for 195 guests" },
    { itemName: "Mini Cookies", section: "Desserts", result: "perfect" },
  ],
  staffRatings: [
    { name: "Maria", role: "Captain", rating: 5, note: "Excellent — handled last-minute venue change smoothly" },
    { name: "Carlos", role: "Server", rating: 4 },
    { name: "Jen", role: "Server", rating: 4 },
    { name: "Alex", role: "Bartender", rating: 3, note: "Showed up 10min late, otherwise fine" },
    { name: "Tommy", role: "Utility", rating: 5, note: "MVP — handled breakdown solo" },
  ],
  issuesEncountered: [
    "Venue had no loading dock — had to hand-carry everything 200ft",
    "Client added 15 guests day-of without notice",
    "Power outlet near buffet tripped twice — had to reroute to backup",
    "Passed apps ran out early due to extra guests",
  ],
  clientComplaints: "Bride's mother mentioned passed apps ran out before she got to try them. Otherwise very happy.",
  venueNotes: "Magnolia Estate — NO loading dock. Park in grass lot, 200ft carry to ballroom. Need extra utility staff next time. Contact: venue manager Sarah (555-0199)",
  timingNotes: "Dispatch was on time. Setup took 30min longer than planned due to carry distance. Pushed cocktail hour start by 15min. Client was understanding.",
  equipmentNotes: "1 half-size chafer missing. 4 plates chipped. 8 goblets missing. 3 napkins missing. 1 cambro latch broken.",
  wouldRepeatMenu: true,
  overallNotes: "Good event overall. Need to account for venue access issues next time. Increase passed app count for weddings 150+. Short ribs were a huge hit — client specifically complimented.",
  submittedBy: "Maria (Captain)",
};

// ── Styles ──
const resultConfig: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  "ran-out": { color: "#ff0000", bg: "#1a0000", label: "RAN OUT", icon: "🔴" },
  perfect: { color: "#4caf50", bg: "#0a1f0a", label: "PERFECT", icon: "✅" },
  "too-much": { color: "#ff9800", bg: "#1a1000", label: "TOO MUCH", icon: "🟡" },
  "not-rated": { color: "#666", bg: "#111", label: "NOT RATED", icon: "⚪" },
};

const starColor = (rating: number, star: number): string =>
  star <= rating ? "#ffd700" : "#333";

const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    background: "#0a0a0a",
    color: "#eee",
    minHeight: "100vh",
    padding: "24px 32px",
    maxWidth: 960,
    margin: "0 auto",
  },
  header: { textAlign: "center", marginBottom: 32 },
  title: { fontSize: 32, fontWeight: 800, color: "#ff6b6b", letterSpacing: 2, marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#888", letterSpacing: 1 },
  eventBanner: {
    background: "#0d1b2a",
    border: "2px solid #00e5ff",
    borderRadius: 8,
    padding: "20px 24px",
    marginBottom: 24,
  },
  eventTitle: { fontSize: 24, fontWeight: 800, color: "#00e5ff" },
  jobTag: {
    background: "#00e5ff",
    color: "#000",
    fontSize: 12,
    fontWeight: 800,
    padding: "3px 12px",
    borderRadius: 3,
    marginLeft: 12,
  },
  eventMeta: {
    display: "flex",
    gap: 32,
    marginTop: 12,
    fontSize: 13,
    color: "#aaa",
  },
  guestAlert: {
    background: "#1a1000",
    border: "1px solid #ff9800",
    borderRadius: 4,
    padding: "8px 16px",
    marginTop: 12,
    fontSize: 13,
    color: "#ff9800",
    fontWeight: 600,
  },
  section: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: 8,
    marginBottom: 20,
    overflow: "hidden",
  },
  sectionHeader: {
    padding: "12px 20px",
    fontSize: 16,
    fontWeight: 700,
    borderBottom: "1px solid #333",
    color: "#fff",
  },
  sectionBody: {
    padding: "16px 20px",
  },
  foodRow: {
    display: "grid",
    gridTemplateColumns: "1fr 140px 120px",
    padding: "8px 0",
    borderBottom: "1px solid #1a1a1a",
    alignItems: "center",
    fontSize: 13,
  },
  foodNote: {
    padding: "2px 0 8px 0",
    fontSize: 11,
    fontStyle: "italic",
  },
  staffRow: {
    display: "grid",
    gridTemplateColumns: "1fr 100px 120px 1fr",
    padding: "8px 0",
    borderBottom: "1px solid #1a1a1a",
    alignItems: "center",
    fontSize: 13,
  },
  issueItem: {
    padding: "8px 0",
    borderBottom: "1px solid #1a1a1a",
    fontSize: 13,
    display: "flex",
    gap: 8,
  },
  textBlock: {
    fontSize: 13,
    lineHeight: 1.8,
    color: "#ccc",
  },
  insightCard: {
    background: "#0d1b2a",
    border: "2px solid #00e5ff",
    borderRadius: 8,
    padding: "20px 24px",
    marginTop: 32,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#00e5ff",
    marginBottom: 16,
  },
  insightRow: {
    display: "flex",
    gap: 8,
    padding: "6px 0",
    fontSize: 13,
    color: "#eee",
    borderBottom: "1px solid #1a1a2e",
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
const PostEventDebriefPage: React.FC = () => {
  const [debrief] = useState<DebriefData>(SAMPLE_DEBRIEF);

  const ranOutCount = debrief.foodFeedback.filter((f) => f.result === "ran-out").length;
  const tooMuchCount = debrief.foodFeedback.filter((f) => f.result === "too-much").length;
  const avgStaffRating =
    debrief.staffRatings.reduce((sum, sr) => sum + sr.rating, 0) / debrief.staffRatings.length;

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .debrief-page { padding: 16px !important; max-width: 100% !important; }
          .debrief-title { font-size: 24px !important; }
          .debrief-event-meta { flex-direction: column !important; gap: 8px !important; }
          .debrief-food-row { grid-template-columns: 1fr !important; gap: 4px !important; }
          .debrief-staff-row { grid-template-columns: 1fr !important; gap: 4px !important; }
        }
      `}</style>
      <div style={s.page} className="debrief-page">
        <button style={s.backBtn} onClick={() => window.history.back()}>← Back</button>

      {/* Header */}
      <div style={s.header}>
        <div style={s.title} className="debrief-title">📝 POST-EVENT DEBRIEF</div>
        <div style={s.subtitle}>WHAT HAPPENED • WHAT TO FIX • WHAT TO REMEMBER</div>
      </div>

      {/* Event Banner */}
      <div style={s.eventBanner}>
        <div>
          <span style={s.eventTitle}>{debrief.eventName}</span>
          <span style={s.jobTag}>{debrief.jobNumber}</span>
        </div>
        <div style={s.eventMeta} className="debrief-event-meta">
          <span>📅 {debrief.eventDate}</span>
          <span>📍 {debrief.venue}</span>
          <span>👥 Planned: {debrief.guestCount}</span>
          <span>⭐ Client Satisfaction: {debrief.clientSatisfaction}/5</span>
          <span>📋 Submitted by: {debrief.submittedBy}</span>
        </div>
        {debrief.actualGuestCount !== String(debrief.guestCount) && (
          <div style={s.guestAlert}>
            ⚠️ ACTUAL GUEST COUNT: {debrief.actualGuestCount} (planned {debrief.guestCount}) — {parseInt(debrief.actualGuestCount.replace("~", "")) - debrief.guestCount > 0 ? "OVER" : "UNDER"} by ~{Math.abs(parseInt(debrief.actualGuestCount.replace("~", "")) - debrief.guestCount)} guests
          </div>
        )}
      </div>

      {/* Client Satisfaction */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#888", letterSpacing: 1, marginBottom: 8 }}>CLIENT SATISFACTION</div>
        <div style={{ fontSize: 40 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} style={{ color: starColor(debrief.clientSatisfaction, star), marginRight: 8 }}>
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Food Feedback */}
      <div style={s.section}>
        <div style={{ ...s.sectionHeader, background: "#1a0000" }}>
          🍽️ FOOD FEEDBACK — {ranOutCount > 0 ? `${ranOutCount} ITEMS RAN OUT` : "ALL GOOD"}
        </div>
        <div style={s.sectionBody}>
          {debrief.foodFeedback.map((food, idx) => {
            const cfg = resultConfig[food.result];
            return (
              <React.Fragment key={idx}>
                <div style={{ ...s.foodRow, background: cfg.bg }} className="debrief-food-row">
                  <div style={{ color: "#eee", fontWeight: 500 }}>{food.itemName}</div>
                  <div style={{ color: "#888", fontSize: 11 }}>{food.section}</div>
                  <div>
                    <span
                      style={{
                        background: cfg.color,
                        color: food.result === "too-much" ? "#000" : "#fff",
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
                {food.leftoverEstimate && (
                  <div style={{ ...s.foodNote, color: cfg.color, paddingLeft: 8 }}>
                    → {food.leftoverEstimate}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Staff Ratings */}
      <div style={s.section}>
        <div style={{ ...s.sectionHeader, background: "#0d1b2a" }}>
          👥 STAFF PERFORMANCE — Avg: {avgStaffRating.toFixed(1)}/5
        </div>
        <div style={s.sectionBody}>
          {debrief.staffRatings.map((staff, idx) => (
            <div key={idx} style={s.staffRow} className="debrief-staff-row">
              <div style={{ color: "#eee", fontWeight: 600 }}>{staff.name}</div>
              <div style={{ color: "#888", fontSize: 12 }}>{staff.role}</div>
              <div>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} style={{ color: starColor(staff.rating, star), fontSize: 16 }}>★</span>
                ))}
              </div>
              <div style={{ color: "#aaa", fontSize: 11, fontStyle: "italic" }}>
                {staff.note || "—"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issues */}
      <div style={s.section}>
        <div style={{ ...s.sectionHeader, background: "#1a1000" }}>
          ⚠️ ISSUES ENCOUNTERED ({debrief.issuesEncountered.length})
        </div>
        <div style={s.sectionBody}>
          {debrief.issuesEncountered.map((issue, idx) => (
            <div key={idx} style={s.issueItem}>
              <span style={{ color: "#ff9800" }}>•</span>
              <span style={{ color: "#eee" }}>{issue}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Client Complaints */}
      {debrief.clientComplaints && (
        <div style={s.section}>
          <div style={{ ...s.sectionHeader, background: "#1a0000" }}>
            😟 CLIENT COMPLAINTS / FEEDBACK
          </div>
          <div style={s.sectionBody}>
            <div style={s.textBlock}>{debrief.clientComplaints}</div>
          </div>
        </div>
      )}

      {/* Venue Notes */}
      <div style={s.section}>
        <div style={{ ...s.sectionHeader, background: "#111" }}>
          📍 VENUE NOTES — SAVE FOR NEXT TIME
        </div>
        <div style={s.sectionBody}>
          <div style={s.textBlock}>{debrief.venueNotes}</div>
        </div>
      </div>

      {/* Timing Notes */}
      <div style={s.section}>
        <div style={{ ...s.sectionHeader, background: "#111" }}>
          ⏱️ TIMING NOTES
        </div>
        <div style={s.sectionBody}>
          <div style={s.textBlock}>{debrief.timingNotes}</div>
        </div>
      </div>

      {/* Equipment Notes */}
      <div style={s.section}>
        <div style={{ ...s.sectionHeader, background: "#1a0000" }}>
          📦 EQUIPMENT NOTES
        </div>
        <div style={s.sectionBody}>
          <div style={s.textBlock}>{debrief.equipmentNotes}</div>
        </div>
      </div>

      {/* Overall Notes */}
      <div style={s.section}>
        <div style={{ ...s.sectionHeader, background: "#0d1b2a" }}>
          📝 OVERALL NOTES
        </div>
        <div style={s.sectionBody}>
          <div style={s.textBlock}>{debrief.overallNotes}</div>
          <div style={{ marginTop: 12 }}>
            <span style={{ color: "#888", fontSize: 12 }}>Would repeat this menu? </span>
            <span style={{ color: debrief.wouldRepeatMenu ? "#4caf50" : "#ff0000", fontWeight: 700, fontSize: 14 }}>
              {debrief.wouldRepeatMenu ? "✅ YES" : "❌ NO"}
            </span>
          </div>
        </div>
      </div>

      {/* Insights Card */}
      <div style={s.insightCard}>
        <div style={s.insightTitle}>💡 AUTO-GENERATED INSIGHTS</div>
        <div style={s.insightRow}>
          <span>📊</span>
          <span>
            <strong>Spec Adjustment Needed:</strong> Buffalo Bleu Cheese Quesadilla ran out for 180+ guest wedding.
            Current spec: 300 pcs. Recommend: 360 pcs (2 pcs/person) for weddings 150+.
          </span>
        </div>
        <div style={s.insightRow}>
          <span>📊</span>
          <span>
            <strong>Spec Adjustment Needed:</strong> Caprese Skewers ran out — only 1:1 ratio.
            Recommend: 1.2× guest count for cold display items (guests graze more).
          </span>
        </div>
        <div style={s.insightRow}>
          <span>📊</span>
          <span>
            <strong>Overproduction:</strong> Au Poivre Sauce — 0.5 gal returned.
            Reduce from 1.5 gal to 1.25 gal for 180 guests.
          </span>
        </div>
        <div style={s.insightRow}>
          <span>📍</span>
          <span>
            <strong>Venue Flag:</strong> Magnolia Estate saved to venue database — "NO loading dock, 200ft carry, need extra utility."
            This note will auto-appear on future BEOs at this venue.
          </span>
        </div>
        <div style={s.insightRow}>
          <span>👥</span>
          <span>
            <strong>Guest Count Variance:</strong> Client added ~15 guests day-of (8.3% over).
            Consider building 10% buffer for weddings as standard spec practice.
          </span>
        </div>
        <div style={s.insightRow}>
          <span>📦</span>
          <span>
            <strong>Equipment Loss:</strong> $167 in missing/damaged items from this event.
            Running monthly total: $354. Trending above $500 threshold.
          </span>
        </div>
      </div>
    </>
  );
};

export default PostEventDebriefPage;
