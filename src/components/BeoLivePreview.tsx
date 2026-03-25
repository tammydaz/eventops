/**
 * BeoLivePreview — live BEO document panel that updates in real-time as
 * the intake form is filled. Reads from the Zustand event store for header/event data
 * and from shadowMenuRows (Event Menu SHADOW SYSTEM) for the menu.
 * Loads linked BEO stations separately for the preview (same placements as print).
 */
import { useEffect, useState } from "react";
import { useEventStore } from "../state/eventStore";
import { FIELD_IDS } from "../services/airtable/events";
import { asString, asSingleSelectName, asLinkedRecordIds, isErrorResult } from "../services/airtable/selectors";
import { secondsTo12HourString } from "../utils/timeHelpers";
import { isDeliveryOrPickup } from "../lib/deliveryHelpers";
import type { EventMenuRow, EventMenuRowComponent } from "../services/airtable/eventMenu";
import { loadStationsByEventId } from "../services/airtable/linkedRecords";
import { fetchMenuItemNamesByIds } from "../services/airtable/menuItems";

export type ShadowMenuRowForPreview = EventMenuRow & {
  catalogItemName: string;
  components?: EventMenuRowComponent[];
};

function f(data: Record<string, unknown>, fieldId: string): string {
  const v = data[fieldId];
  if (v == null) return "";
  if (typeof v === "number") return String(v);
  return asSingleSelectName(v) || asString(v);
}

function fTime(data: Record<string, unknown>, fieldId: string): string {
  return secondsTo12HourString(data[fieldId]) || "";
}

function fDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw + "T12:00:00");
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

type LiveStationPreview = {
  id: string;
  stationType: string;
  beoPlacement?: "Presented Appetizer" | "Buffet Metal" | "Buffet China";
  detailLines: string[];
};

const STATION_PREVIEW_GROUPS: Array<{ placement: "Presented Appetizer" | "Buffet Metal" | "Buffet China"; label: string }> = [
  { placement: "Presented Appetizer", label: "Presented Appetizers" },
  { placement: "Buffet Metal", label: "Buffet – Metal" },
  { placement: "Buffet China", label: "Buffet – China" },
];

export function BeoLivePreview({ shadowMenuRows }: { shadowMenuRows: ShadowMenuRowForPreview[] }) {
  const { selectedEventData, selectedEventId } = useEventStore();
  const [liveStations, setLiveStations] = useState<LiveStationPreview[]>([]);
  const data = selectedEventData ?? {};
  const eventType = asSingleSelectName(data[FIELD_IDS.EVENT_TYPE]) || "";
  const isDelivery = isDeliveryOrPickup(eventType);
  const accentColor = isDelivery ? "#eab308" : "#00bcd4";

  // Header fields (still from Events table)
  const businessName = f(data, FIELD_IDS.BUSINESS_NAME);
  const clientFirst = f(data, FIELD_IDS.CLIENT_FIRST_NAME);
  const clientLast = f(data, FIELD_IDS.CLIENT_LAST_NAME);
  const clientName = businessName || `${clientFirst} ${clientLast}`.trim() || "";
  const contact = f(data, FIELD_IDS.PRIMARY_CONTACT_NAME);
  const contactPhone = f(data, FIELD_IDS.CONTACT_PHONE);
  const clientPhone = f(data, FIELD_IDS.CLIENT_PHONE);
  const venue = f(data, FIELD_IDS.VENUE);
  const venueCity = f(data, FIELD_IDS.VENUE_CITY) || f(data, FIELD_IDS.CLIENT_CITY);
  const venueState = asSingleSelectName(data[FIELD_IDS.VENUE_STATE]) || f(data, FIELD_IDS.CLIENT_STATE);
  const eventDate = fDate(f(data, FIELD_IDS.EVENT_DATE));
  const guestCount = f(data, FIELD_IDS.GUEST_COUNT);
  const eventStart = fTime(data, FIELD_IDS.EVENT_START_TIME);
  const eventEnd = fTime(data, FIELD_IDS.EVENT_END_TIME);
  const arrival = fTime(data, FIELD_IDS.FOODWERX_ARRIVAL) || fTime(data, FIELD_IDS.VENUE_ARRIVAL_TIME);
  const dispatch = fTime(data, FIELD_IDS.DISPATCH_TIME);
  const dietary = f(data, FIELD_IDS.DIETARY_NOTES);
  const religious = f(data, FIELD_IDS.RELIGIOUS_RESTRICTIONS);
  const dietaryMeals = f(data, FIELD_IDS.DIETARY_SUMMARY);
  const beoNotes = f(data, FIELD_IDS.BEO_NOTES);
  const beoTimeline = f(data, FIELD_IDS.BEO_TIMELINE);

  const SECTION_ORDER = ["Passed Appetizers", "Presented Appetizers", "Buffet – Metal", "Buffet – China", "Deli", "Desserts", "Room Temp", "Room Temp / Display"];
  const normalizeSection = (raw: string) => raw.replace(/\s*[-–—]\s*/g, " – ").trim();

  // Group shadow rows by Section — render ALL rows, no filtering (picker filtering is selection-only)
  const bySection = shadowMenuRows.reduce<Record<string, ShadowMenuRowForPreview[]>>((acc, row) => {
    const raw = row.section || "Other";
    const s = SECTION_ORDER.find((o) => normalizeSection(o) === normalizeSection(raw)) ?? raw;
    if (!acc[s]) acc[s] = [];
    acc[s].push(row);
    return acc;
  }, {});
  const sectionsWithItems = SECTION_ORDER.filter((sec) => (bySection[sec]?.length ?? 0) > 0);
  const extraSections = Object.keys(bySection).filter((sec) => !SECTION_ORDER.includes(sec) && (bySection[sec]?.length ?? 0) > 0);
  const sections = [...sectionsWithItems, ...extraSections];

  useEffect(() => {
    if (!selectedEventId) {
      setLiveStations([]);
      return;
    }
    let cancelled = false;
    const linkIds = asLinkedRecordIds((selectedEventData ?? {})[FIELD_IDS.STATIONS] ?? []);
    (async () => {
      const result = await loadStationsByEventId(selectedEventId, linkIds);
      if (cancelled) return;
      if (isErrorResult(result) || result.length === 0) {
        setLiveStations([]);
        return;
      }
      const allRecIds = [
        ...new Set(
          result.flatMap((st) => [...(st.stationComponents ?? []), ...st.stationItems].filter((id) => typeof id === "string" && id.startsWith("rec")))
        ),
      ];
      const names = allRecIds.length > 0 ? await fetchMenuItemNamesByIds(allRecIds) : {};
      if (cancelled) return;
      const rows: LiveStationPreview[] = result.map((st) => {
        const detailLines: string[] = [];
        for (const id of st.stationComponents ?? []) {
          const n = names[id];
          if (n) detailLines.push(n);
        }
        for (const id of st.stationItems) {
          const n = names[id];
          if (n) detailLines.push(n);
        }
        const custom = (st as { customItems?: string }).customItems;
        if (custom?.trim()) {
          custom.split(/\r?\n/).forEach((line) => {
            const t = line.trim();
            if (t && !/^BEO Placement:/i.test(t)) detailLines.push(t);
          });
        }
        const notes = (st.stationNotes || "")
          .split(/\r?\n/)
          .map((l) => l.replace(/^BEO Placement:\s*.+$/i, "").trim())
          .filter(Boolean);
        for (const n of notes) {
          if (!detailLines.includes(n)) detailLines.push(n);
        }
        return {
          id: st.id,
          stationType: st.stationType?.trim() || "Station",
          beoPlacement: st.beoPlacement,
          detailLines,
        };
      });
      setLiveStations(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedEventId, selectedEventData]);

  const s = {
    doc: {
      background: "#fff",
      color: "#111",
      borderRadius: 8,
      padding: "20px 22px",
      fontSize: 12,
      lineHeight: 1.55,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      boxShadow: "0 2px 20px rgba(0,0,0,0.35)",
    } as React.CSSProperties,

    letterhead: {
      textAlign: "center" as const,
      borderBottom: `2px solid ${accentColor}`,
      paddingBottom: 10,
      marginBottom: 12,
    },

    company: {
      fontSize: 8,
      fontWeight: 800,
      letterSpacing: "0.2em",
      color: accentColor,
      textTransform: "uppercase" as const,
    },

    title: {
      fontSize: 16,
      fontWeight: 800,
      color: "#111",
      marginTop: 2,
    },

    badge: {
      display: "inline-block",
      marginTop: 6,
      padding: "2px 10px",
      borderRadius: 20,
      background: isDelivery ? "#fef9c3" : "#e0f7fa",
      color: accentColor,
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: "0.06em",
    },

    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "3px 12px",
      marginBottom: 4,
    } as React.CSSProperties,

    fieldRow: {
      display: "flex",
      gap: 6,
      alignItems: "baseline",
    } as React.CSSProperties,

    lbl: {
      fontSize: 8,
      fontWeight: 700,
      color: "#999",
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      minWidth: 52,
      flexShrink: 0,
    },

    val: {
      fontSize: 11,
      color: "#111",
      fontWeight: 500,
    },

    emptyVal: {
      fontSize: 11,
      color: "#ddd",
      fontStyle: "italic" as const,
    },

    sectionTitle: {
      fontSize: 8,
      fontWeight: 800,
      textTransform: "uppercase" as const,
      letterSpacing: "0.12em",
      color: accentColor,
      borderBottom: `1px solid ${accentColor}44`,
      paddingBottom: 3,
      marginBottom: 6,
      marginTop: 12,
    },

    subsectionLabel: {
      fontSize: 9,
      fontWeight: 700,
      color: "#777",
      textTransform: "uppercase" as const,
      letterSpacing: "0.06em",
      marginBottom: 3,
    },

    menuItem: {
      padding: "0 0 0 8px",
      borderLeft: `2px solid ${accentColor}44`,
      color: "#222",
      fontSize: 11,
      marginBottom: 2,
    },

    menuItemComponent: {
      padding: "0 0 0 16px",
      color: "#444",
      fontSize: 10,
      marginBottom: 1,
    },

    emptyMenu: {
      color: "#ccc",
      fontSize: 10,
      fontStyle: "italic" as const,
      paddingLeft: 8,
      marginBottom: 4,
    },

    alert: {
      background: "#fff3cd",
      border: "1px solid #ffc107",
      borderRadius: 4,
      padding: "5px 8px",
      marginTop: 8,
      fontSize: 10,
    },

    footer: {
      marginTop: 16,
      paddingTop: 8,
      borderTop: "1px solid #f0f0f0",
      fontSize: 8,
      color: "#ccc",
      textAlign: "center" as const,
    },
  };

  function Field({ lbl, val }: { lbl: string; val: string }) {
    return (
      <div style={s.fieldRow}>
        <span style={s.lbl}>{lbl}</span>
        <span style={val ? s.val : s.emptyVal}>{val || "—"}</span>
      </div>
    );
  }

  return (
    <div style={s.doc}>
      <div style={s.letterhead}>
        <div style={s.company}>Foodwerx Catering</div>
        <div style={s.title}>Banquet Event Order</div>
        <div style={s.badge}>{eventType || "Event Type Not Set"}</div>
      </div>

      <div style={s.grid}>
        <Field lbl="Client" val={clientName} />
        <Field lbl="Date" val={eventDate} />
        <Field lbl="Contact" val={contact || clientName} />
        <Field lbl="Guests" val={guestCount ? `${guestCount} guests` : ""} />
        <Field lbl="Phone" val={contactPhone || clientPhone} />
        <Field lbl="Start" val={eventStart} />
        <Field lbl="Venue" val={venue} />
        {isDelivery ? (
          <Field lbl="Dispatch" val={dispatch} />
        ) : (
          <Field lbl="End" val={eventEnd} />
        )}
        {(venueCity || venueState) && (
          <Field lbl="City" val={[venueCity, venueState].filter(Boolean).join(", ")} />
        )}
        {arrival && <Field lbl="Arrival" val={arrival} />}
      </div>

      {(dietary || religious || dietaryMeals) && (
        <div style={s.alert}>
          {dietary && <div><strong>Dietary:</strong> {dietary}</div>}
          {religious && <div><strong>Religious:</strong> {religious}</div>}
          {dietaryMeals && <div><strong>Dietary meal counts:</strong> {dietaryMeals}</div>}
        </div>
      )}

      <div style={s.sectionTitle}>Menu</div>
      {sections.length > 0 ? (
        sections.map((section) => {
          const sectionRows = bySection[section];
          const topLevel = sectionRows.filter((r) => !r.parentItemId).sort((a, b) => a.sortOrder - b.sortOrder);
          const childrenByParent = sectionRows
            .filter((r) => r.parentItemId)
            .reduce<Record<string, ShadowMenuRowForPreview[]>>((acc, r) => {
              const pid = r.parentItemId!;
              if (!acc[pid]) acc[pid] = [];
              acc[pid].push(r);
              return acc;
            }, {});
          Object.values(childrenByParent).forEach((arr) => arr.sort((a, b) => a.sortOrder - b.sortOrder));
          const parentIds = new Set(sectionRows.map((r) => r.id));
          const orphans = sectionRows.filter((r) => r.parentItemId && !parentIds.has(r.parentItemId!)).sort((a, b) => a.sortOrder - b.sortOrder);
          const orderedRows: { row: ShadowMenuRowForPreview; isChild: boolean }[] = [];
          topLevel.forEach((r) => {
            orderedRows.push({ row: r, isChild: false });
            (childrenByParent[r.id] ?? []).forEach((c) => orderedRows.push({ row: c, isChild: true }));
          });
          orphans.forEach((r) => orderedRows.push({ row: r, isChild: false }));
          return (
            <div key={section} style={{ marginBottom: 8 }}>
              <div style={s.subsectionLabel}>{section}</div>
              {orderedRows.map(({ row, isChild }) => {
                const displayName = row.customText?.trim() || row.catalogItemName || "—";
                const components = (row.components ?? []).filter((c) => !c.isRemoved);
                const hasChildItems = (childrenByParent[row.id] ?? []).length > 0 || components.length > 0 || (row.sauceOverride && row.sauceOverride !== "Default");
                const displayNameForParent = !isChild && hasChildItems && displayName.includes(" – ")
                  ? displayName.split(" – ")[0]?.trim() || displayName
                  : displayName;
                const itemStyle = isChild ? s.menuItemComponent : s.menuItem;
                return (
                  <div key={row.id} style={{ marginBottom: 6 }}>
                    <div style={{ ...itemStyle, marginBottom: 0 }}>{displayNameForParent}</div>
                    {row.sauceOverride && row.sauceOverride !== "Default" && (
                      <div style={{ ...s.menuItemComponent, paddingLeft: isChild ? 24 : 16, marginTop: 0, marginBottom: 0 }}>Sauce: {row.sauceOverride}</div>
                    )}
                    {components.length > 0 && (
                      components.map((c, i) => (
                        <div key={i} style={{ ...s.menuItemComponent, paddingLeft: isChild ? 24 : 16, marginTop: 0, marginBottom: 0 }}>
                          {c.isAdded ? "+ " : "– "}{c.name}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          );
        })
      ) : (
        <div style={s.emptyMenu}>No menu items added yet</div>
      )}

      {beoTimeline && (
        <>
          <div style={s.sectionTitle}>Timeline</div>
          <div style={{ fontSize: 11, color: "#333", whiteSpace: "pre-wrap" }}>{beoTimeline}</div>
        </>
      )}

      {beoNotes && (
        <>
          <div style={s.sectionTitle}>Notes</div>
          <div style={{ fontSize: 11, color: "#333", whiteSpace: "pre-wrap" }}>{beoNotes}</div>
        </>
      )}

      <div style={s.footer}>Live preview · updates as you type</div>
    </div>
  );
}
