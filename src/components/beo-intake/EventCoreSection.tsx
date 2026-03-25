import { useEffect, useMemo, useRef, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { useAuthStore } from "../../state/authStore";
import { FIELD_IDS, FW_STAFF_SUMMARY_FIELD_ID, getFoodwerxArrivalFieldId, resolveFwStaffLineFromFields } from "../../services/airtable/events";
import { asSingleSelectName, asString, asBoolean } from "../../services/airtable/selectors";
import { FormSection, BEO_SECTION_PILL_ACCENT, Helper, inputStyle, labelStyle } from "./FormSection";
import type { EventCore } from "./types";
import { secondsToTimeString, MINUTE_INCREMENTS } from "../../utils/timeHelpers";

const EVENT_TYPE_OPTIONS = [
  "Full Service",
  "Delivery",
  "Pickup",
  "Grazing Display / Interactive Station",
  "Tasting",
];

const EVENT_OCCASION_OPTIONS = [
  "Wedding",
  "Bar/Bat Mitzvah",
  "Corporate",
  "Social",
  "Birthday",
  "Other",
];

const SERVICE_STYLE_OPTIONS = [
  "Buffet",
  "Cocktail / Passed Apps Only",
  "Hybrid (Cocktail + Buffet)",
  "Family Style",
  "Plated",
];

/** When true, date/guests/times/captain are shown in HeaderSection instead; this section only shows Event Type, Occasion, Service Style, and delivery-specific fields. */
export const EventCoreSection = ({ isDelivery = false, hideHeaderFields = false }: { isDelivery?: boolean; hideHeaderFields?: boolean }) => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const { user } = useAuthStore();
  const isUpdatingRef = useRef(false);
  const [fwArrivalFieldId, setFwArrivalFieldId] = useState<string | null>(null);
  const [details, setDetails] = useState<EventCore>({
    eventType: "",
    eventOccasion: "",
    serviceStyle: "",
    eventDate: "",
    guestCount: null,
    dispatchTime: "",
    eventStartTime: "",
    eventEndTime: "",
    eventArrivalTime: "",
  });
  const [captain, setCaptain] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [foodMustGoHot, setFoodMustGoHot] = useState(false);

  useEffect(() => {
    getFoodwerxArrivalFieldId().then(setFwArrivalFieldId);
  }, []);

  useEffect(() => {
    if (isUpdatingRef.current) return;
    if (!selectedEventId || !selectedEventData) {
      setDetails({
        eventType: "",
        eventOccasion: "",
        serviceStyle: "",
        eventDate: "",
        guestCount: null,
        dispatchTime: "",
        eventStartTime: "",
        eventEndTime: "",
        eventArrivalTime: "",
      });
      setCaptain("");
      setDeliveryNotes("");
      setFoodMustGoHot(false);
      return;
    }
    const arrivalFieldId = fwArrivalFieldId ?? FIELD_IDS.VENUE_ARRIVAL_TIME;
    const arrivalRaw = selectedEventData[arrivalFieldId] ?? selectedEventData[FIELD_IDS.VENUE_ARRIVAL_TIME];
    setDetails({
      eventType: asSingleSelectName(selectedEventData[FIELD_IDS.EVENT_TYPE]),
      eventOccasion: asSingleSelectName(selectedEventData[FIELD_IDS.EVENT_OCCASION]),
      serviceStyle: asSingleSelectName(selectedEventData[FIELD_IDS.SERVICE_STYLE]),
      eventDate: asString(selectedEventData[FIELD_IDS.EVENT_DATE]),
      guestCount: selectedEventData[FIELD_IDS.GUEST_COUNT] !== undefined
        ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT])
        : null,
      dispatchTime: secondsToTimeString(selectedEventData[FIELD_IDS.DISPATCH_TIME]),
      eventStartTime: secondsToTimeString(selectedEventData[FIELD_IDS.EVENT_START_TIME]),
      eventEndTime: secondsToTimeString(selectedEventData[FIELD_IDS.EVENT_END_TIME]),
      eventArrivalTime: secondsToTimeString(arrivalRaw),
    });
    setCaptain(resolveFwStaffLineFromFields(selectedEventData));
    setDeliveryNotes(asString(selectedEventData[FIELD_IDS.LOAD_IN_NOTES]));
    setFoodMustGoHot(asBoolean(selectedEventData[FIELD_IDS.FOOD_MUST_GO_HOT]));
  }, [selectedEventId, selectedEventData, fwArrivalFieldId]);

  const canEdit = Boolean(selectedEventId);
  const isAdmin = user?.role === "ops_admin";
  const canEditDispatchTime = canEdit && isAdmin;

  const handleTimeChange = (stateKey: keyof EventCore, timeValue: string) => {
    setDetails(prev => ({ ...prev, [stateKey]: timeValue }));
  };

  const handleTimeSelectChange = (stateKey: keyof EventCore, fieldId: string, hour: number, minute: number) => {
    const timeValue = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    setDetails(prev => ({ ...prev, [stateKey]: timeValue }));
    if (selectedEventId) {
      const seconds = hour * 3600 + minute * 60;
      setFields(selectedEventId, { [fieldId]: seconds });
    }
  };

  const saveField = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    isUpdatingRef.current = true;
    try {
      await setFields(selectedEventId, { [fieldId]: value });
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const eventSummary = useMemo(() => {
    if (hideHeaderFields) return details.eventType ? details.eventType : undefined;
    const parts: string[] = [];
    if (details.eventDate) {
      const d = new Date(details.eventDate + "T12:00:00");
      if (!isNaN(d.getTime())) parts.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
    }
    if (details.guestCount) parts.push(`${details.guestCount} guests`);
    if (details.eventStartTime) parts.push(details.eventStartTime);
    return parts.length ? parts.join("  ·  ") : undefined;
  }, [hideHeaderFields, details.eventType, details.eventDate, details.guestCount, details.eventStartTime]);

  return (
    <FormSection
      title={isDelivery ? "Delivery Event Details" : "Event Details"}
      subtitle={eventSummary}
      dotColor={BEO_SECTION_PILL_ACCENT}
      isDelivery={isDelivery}
      sectionId="beo-section-event"
    >
      {!hideHeaderFields && (
        <>
      <div>
        <label style={labelStyle}>Event Date</label>
        <input
          type="date"
          value={details.eventDate}
          disabled={!canEdit}
          onChange={async (e) => {
            const value = e.target.value;
            setDetails(prev => ({ ...prev, eventDate: value }));
            if (selectedEventId) {
              await saveField(FIELD_IDS.EVENT_DATE, value || null);
            }
          }}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Guest Count</label>
        <input
          type="number"
          value={details.guestCount ?? ""}
          disabled={!canEdit}
          onChange={(e) => {
            const value = e.target.value === "" ? null : Number(e.target.value);
            setDetails(prev => ({ ...prev, guestCount: value }));
          }}
          onBlur={async (e) => {
            const value = e.target.value === "" ? null : Number(e.target.value);
            if (selectedEventId) {
              await saveField(FIELD_IDS.GUEST_COUNT, value);
            }
          }}
          style={inputStyle}
          placeholder="Number of guests"
          min="0"
        />
        <Helper>Total expected guests. Used for quantities, pack-out, and staffing.</Helper>
      </div>
        </>
      )}

      <div>
        <label style={labelStyle}>Event Type</label>
        <select
          value={details.eventType}
          disabled={!canEdit}
          onChange={async (e) => {
            const value = e.target.value;
            setDetails(prev => ({ ...prev, eventType: value }));
            if (selectedEventId) {
              await saveField(FIELD_IDS.EVENT_TYPE, value || null);
            }
          }}
          style={inputStyle}
        >
          <option value="">Select event type...</option>
          {EVENT_TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <Helper>Full Service = on-site catering. Delivery/Pickup = off-site.</Helper>
      </div>

      {!isDelivery && (
        <>
          <div>
            <label style={labelStyle}>Event Occasion</label>
            <select
              value={details.eventOccasion}
              disabled={!canEdit}
              onChange={async (e) => {
                const value = e.target.value;
                setDetails(prev => ({ ...prev, eventOccasion: value }));
                if (selectedEventId) {
                  await saveField(FIELD_IDS.EVENT_OCCASION, value || null);
                }
              }}
              style={inputStyle}
            >
              <option value="">Select occasion...</option>
              {EVENT_OCCASION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Helper>Wedding & Bar/Bat Mitzvah show extra timeline prompts below.</Helper>
          </div>

          <div>
            <label style={labelStyle}>Service Style (kitchen banner)</label>
            <select
              value={details.serviceStyle}
              disabled={!canEdit}
              onChange={async (e) => {
                const value = e.target.value;
                setDetails(prev => ({ ...prev, serviceStyle: value }));
                if (selectedEventId) {
                  await saveField(FIELD_IDS.SERVICE_STYLE, value || null);
                }
              }}
              style={inputStyle}
            >
              <option value="">Select style...</option>
              {SERVICE_STYLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Helper>Buffet vs plated/cocktail/etc. When not buffet, a banner warns the kitchen.</Helper>
          </div>
        </>
      )}

      {(() => {
        const timeKeys = isDelivery ? (["dispatchTime"] as const) : (hideHeaderFields ? ([] as const) : (["dispatchTime", "eventStartTime", "eventEndTime", "eventArrivalTime"] as const));
        return timeKeys.map((key) => {
        const fieldIdMap: Record<typeof timeKeys[number], string> = {
          dispatchTime: FIELD_IDS.DISPATCH_TIME,
          eventStartTime: FIELD_IDS.EVENT_START_TIME,
          eventEndTime: FIELD_IDS.EVENT_END_TIME,
          eventArrivalTime: FIELD_IDS.FOODWERX_ARRIVAL,
        };
        const labelMap = {
          dispatchTime: "Dispatch Time",
          eventStartTime: "Event Start Time",
          eventEndTime: "Event End Time",
          eventArrivalTime: "Event Arrival Time",
        };
        const raw = details[key];
        const hasValue = raw && raw !== "—";
        const [h, m] = hasValue ? raw.split(":").map(Number) : [12, 0];
        const hour24 = isNaN(h) ? 12 : Math.max(0, Math.min(23, h));
        const minute = (() => {
          const mNum = isNaN(m) ? 0 : m;
          return MINUTE_INCREMENTS.reduce((prev, curr) =>
            Math.abs(curr - mNum) < Math.abs(prev - mNum) ? curr : prev
          );
        })();
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const isPM = hour24 >= 12;
        const handleHourChange = (newHour12: number, newIsPM: boolean) => {
          const newHour24 = newHour12 === 12 ? (newIsPM ? 12 : 0) : (newIsPM ? newHour12 + 12 : newHour12);
          handleTimeSelectChange(key, fieldIdMap[key], newHour24, minute);
        };
        const handleMinuteChange = (newMinute: number) => {
          handleTimeSelectChange(key, fieldIdMap[key], hour24, newMinute);
        };
        const isDispatchTime = key === "dispatchTime";
        const fieldCanEdit = isDispatchTime ? canEditDispatchTime : canEdit;
        return (
          <div key={key}>
            <label style={labelStyle}>{labelMap[key]}{isDispatchTime && !isAdmin ? " (read-only)" : ""}</label>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={String(hour12)}
                disabled={!fieldCanEdit}
                onChange={(e) => {
                  const newHour12 = Number(e.target.value);
                  if (!Number.isNaN(newHour12)) handleHourChange(newHour12, isPM);
                }}
                style={{ ...inputStyle, flex: 1, minWidth: 70 }}
              >
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                  <option key={i} value={String(i)}>{i}</option>
                ))}
              </select>
              <span style={{ color: "#999", fontSize: 14 }}>:</span>
              <select
                value={String(minute)}
                disabled={!fieldCanEdit}
                onChange={(e) => {
                  const newMinute = Number(e.target.value);
                  if (!Number.isNaN(newMinute)) handleMinuteChange(newMinute);
                }}
                style={{ ...inputStyle, flex: 1, minWidth: 70 }}
              >
                {MINUTE_INCREMENTS.map((m) => (
                  <option key={m} value={String(m)}>{String(m).padStart(2, "0")}</option>
                ))}
              </select>
              <select
                value={isPM ? "PM" : "AM"}
                disabled={!fieldCanEdit}
                onChange={(e) => handleHourChange(hour12, e.target.value === "PM")}
                style={{ ...inputStyle, flex: 1, minWidth: 60 }}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        );
      });
      })()}

      {isDelivery && (
        <>
          {/* ── Send Hot ── */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 10, cursor: canEdit ? "pointer" : "default" }}>
              <input
                type="checkbox"
                checked={foodMustGoHot}
                disabled={!canEdit}
                onChange={async (e) => {
                  const value = e.target.checked;
                  setFoodMustGoHot(value);
                  await saveField(FIELD_IDS.FOOD_MUST_GO_HOT, value);
                }}
                style={{ width: 18, height: 18, accentColor: "#ef4444", cursor: canEdit ? "pointer" : "default" }}
              />
              <span style={{ color: foodMustGoHot ? "#ef4444" : undefined, fontWeight: foodMustGoHot ? 700 : undefined }}>
                SEND HOT 🔥
              </span>
            </label>
            <Helper>Check if kitchen must send this order hot. Triggers kitchen flag on BEO.</Helper>
          </div>

          {!hideHeaderFields && (
          <div>
            <label style={labelStyle}>Employee / Driver</label>
            <input
              type="text"
              value={captain}
              disabled={!canEdit}
              onChange={(e) => setCaptain(e.target.value)}
              onBlur={async (e) => {
                await saveField(FW_STAFF_SUMMARY_FIELD_ID, e.target.value);
              }}
              style={inputStyle}
              placeholder="e.g. JA/JM"
            />
            <Helper>Staff initials or name assigned to this delivery.</Helper>
          </div>
          )}

          {/* ── Delivery Notes ── */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Delivery Notes</label>
            <textarea
              value={deliveryNotes}
              disabled={!canEdit}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              onBlur={async (e) => {
                await saveField(FIELD_IDS.LOAD_IN_NOTES, e.target.value);
              }}
              style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
              placeholder="e.g. One story building. Between middle/high schools. Bring lighter for sternos."
            />
            <Helper>Building access, parking, load-in details, and equipment reminders for the driver.</Helper>
          </div>
        </>
      )}
    </FormSection>
  );
};
