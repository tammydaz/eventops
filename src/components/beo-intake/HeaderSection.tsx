/**
 * HeaderSection — single collapsible "Header" section that bundles all BEO header fields
 * in order: Client, Contact person, Event address, Event Date, Guests, times, FW Staff.
 * Industry-standard: Client (name or company) + Contact person (with "Same as client").
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS, FW_STAFF_SUMMARY_FIELD_ID, getFoodwerxArrivalFieldId, resolveFwStaffLineFromFields, STAFFING_CONFIRMED_FIELD_ID } from "../../services/airtable/events";
import { asString, asSingleSelectName, asAirtableCheckbox } from "../../services/airtable/selectors";
import { isDeliveryOrPickup } from "../../lib/deliveryHelpers";
import { FormSection, BEO_SECTION_PILL_ACCENT, Helper, inputStyle, labelStyle, helperStyle, MUTED_COLOR, LABEL_COLOR, ACCENT_LINK, LABEL_FONT_SIZE, HELPER_FONT_SIZE } from "./FormSection";
import { secondsToTimeString, secondsTo12HourString, MINUTE_INCREMENTS } from "../../utils/timeHelpers";

/** Link to Nowsta scheduling — update if your org uses a different URL */
const NOWSTA_URL = "https://app.nowsta.com";

/** Staff roles for breakdown (matches invoice style: "2 Servers, 1 Chef") */
const STAFF_ROLES = [
  { key: "lead" as const, label: "Lead", plural: "Leads" },
  { key: "captain" as const, label: "Captain", plural: "Captains" },
  { key: "server" as const, label: "Server", plural: "Servers" },
  { key: "chef" as const, label: "Chef", plural: "Chefs" },
  { key: "bartender" as const, label: "Bartender", plural: "Bartenders" },
  { key: "utility" as const, label: "Utility", plural: "Utility" },
] as const;

type StaffCounts = Record<typeof STAFF_ROLES[number]["key"], number>;

function staffCountsToSummary(counts: StaffCounts): string {
  const parts = STAFF_ROLES
    .filter((r) => counts[r.key] > 0)
    .map((r) => {
      const n = counts[r.key];
      const word = n === 1 ? r.label : r.plural;
      return `${n} ${word}`;
    });
  return parts.join(", ") || "";
}

/** Parse "2 Servers, 1 Chef" style string into StaffCounts. Best-effort. */
function parseStaffSummary(text: string): StaffCounts {
  const counts: StaffCounts = { lead: 0, captain: 0, server: 0, chef: 0, bartender: 0, utility: 0 };
  const lower = text.trim().toLowerCase();
  for (const role of STAFF_ROLES) {
    const regex = new RegExp(`(\\d+)\\s+${role.label.toLowerCase()}s?`, "i");
    const m = lower.match(regex) || text.match(regex);
    if (m) counts[role.key] = Math.max(0, parseInt(m[1], 10) || 0);
  }
  return counts;
}

const pillBase: React.CSSProperties = {
  padding: "4px 14px",
  borderRadius: 20,
  border: "1px solid #444",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s",
};
const pillActive: React.CSSProperties = { ...pillBase, background: "#2563eb", borderColor: "#2563eb", color: "#fff" };
const pillInactive: React.CSSProperties = { ...pillBase, background: "transparent", color: MUTED_COLOR };

const compactInputStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "6px 10px",
  fontSize: "14px",
  borderRadius: "6px",
};

type VenueMode = "same_as_client" | "add_venue";

function formatDateForBeo(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw + "T12:00:00");
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

type HeaderSectionProps = {
  jobNumberDisplay?: string;
  dispatchTimeDisplay?: string;
  /** Only Ops Chief and Watchtower can edit dispatch time; others see read-only */
  canEditDispatch?: boolean;
  /** Event date YYYY-MM-DD for saving dispatch time */
  eventDate?: string;
};

export const HeaderSection = ({ jobNumberDisplay = "—", dispatchTimeDisplay = "—", canEditDispatch = false, eventDate: eventDateProp = "" }: HeaderSectionProps) => {
  const { selectedEventId, selectedEventData, setFields, setIntakeDirty } = useEventStore();
  const isUpdatingRef = useRef(false);
  const [fwArrivalFieldId, setFwArrivalFieldId] = useState<string | null>(null);

  // Client: one field (name or company). Contact: same-as-client or separate person.
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [zip, setZip] = useState("");
  /** While focused, CITY/ST/ZIP cell shows raw text; without this, filter(Boolean).join strips "Berlin," → "Berlin" */
  const [cityStateLineDraft, setCityStateLineDraft] = useState<string | null>(null);
  const [contactSameAsClient, setContactSameAsClient] = useState(true);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [showAddress, setShowAddress] = useState(false);
  const [clientEditing, setClientEditing] = useState(true);

  // Venue state
  const [venue, setVenue] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [venueState, setVenueState] = useState("");
  const [venueMode, setVenueMode] = useState<VenueMode>("same_as_client");
  const [addressEditing, setAddressEditing] = useState(true);
  const [venueModalOpen, setVenueModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  // Modal draft (only used while modal is open)
  const [modalVenueName, setModalVenueName] = useState("");
  const [modalVenueAddress, setModalVenueAddress] = useState("");
  const [modalVenueCity, setModalVenueCity] = useState("");
  const [modalVenueState, setModalVenueState] = useState("");
  const [modalContactName, setModalContactName] = useState("");
  const [modalContactPhone, setModalContactPhone] = useState("");

  const [staffBreakdownModalOpen, setStaffBreakdownModalOpen] = useState(false);
  const [staffCounts, setStaffCounts] = useState<StaffCounts>({ lead: 0, captain: 0, server: 0, chef: 0, bartender: 0, utility: 0 });

  // Event core (date, guests, times, captain)
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState<number | null>(null);
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventArrivalTime, setEventArrivalTime] = useState("");
  const [dispatchTime, setDispatchTime] = useState("");
  const [captain, setCaptain] = useState("");
  const [staffingConfirmedNowsta, setStaffingConfirmedNowsta] = useState(false);

  const eventType = selectedEventData ? asSingleSelectName(selectedEventData[FIELD_IDS.EVENT_TYPE]) : "";
  const isDelivery = isDeliveryOrPickup(eventType);
  const canEdit = Boolean(selectedEventId);

  useEffect(() => {
    getFoodwerxArrivalFieldId().then(setFwArrivalFieldId);
  }, []);

  useEffect(() => {
    if (!venueModalOpen && !contactModalOpen && !staffBreakdownModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setVenueModalOpen(false); setContactModalOpen(false); setStaffBreakdownModalOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [venueModalOpen, contactModalOpen, staffBreakdownModalOpen]);

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setClientName(""); setPhone(""); setEmail("");
      setStreet(""); setCity(""); setStateVal(""); setZip("");
      setCityStateLineDraft(null);
      setContactSameAsClient(true); setContactName(""); setContactPhone("");
      setShowAddress(false); setClientEditing(true);
      setVenue(""); setVenueAddress(""); setVenueCity(""); setVenueState(""); setVenueMode("same_as_client"); setAddressEditing(true); setVenueModalOpen(false); setContactModalOpen(false);
      setEventDate(""); setGuestCount(null); setEventStartTime(""); setEventEndTime(""); setEventArrivalTime(""); setDispatchTime(""); setCaptain("");
      setStaffingConfirmedNowsta(false);
      setStaffBreakdownModalOpen(false); setStaffCounts({ lead: 0, captain: 0, server: 0, chef: 0, bartender: 0, utility: 0 });
      return;
    }
    const d = selectedEventData;
    const bn = asString(d[FIELD_IDS.BUSINESS_NAME]);
    const fn = asString(d[FIELD_IDS.CLIENT_FIRST_NAME]);
    const ln = asString(d[FIELD_IDS.CLIENT_LAST_NAME]);
    const full = (bn?.trim() || [fn, ln].filter(Boolean).join(" ").trim()) || "";
    setClientName(full);
    setPhone(asString(d[FIELD_IDS.CLIENT_PHONE]));
    setEmail(asString(d[FIELD_IDS.CLIENT_EMAIL]));
    setStreet(asString(d[FIELD_IDS.CLIENT_STREET]));
    setCity(asString(d[FIELD_IDS.CLIENT_CITY]));
    setStateVal(asString(d[FIELD_IDS.CLIENT_STATE]));
    setZip(asString(d[FIELD_IDS.CLIENT_ZIP]));
    setContactName(asString(d[FIELD_IDS.PRIMARY_CONTACT_NAME]));
    setContactPhone(asString(d[FIELD_IDS.PRIMARY_CONTACT_PHONE]));
    const primary = asString(d[FIELD_IDS.PRIMARY_CONTACT_NAME])?.trim();
    setContactSameAsClient(!primary || primary === full || primary === fn);
    setShowAddress(!!(asString(d[FIELD_IDS.CLIENT_STREET]) || asString(d[FIELD_IDS.CLIENT_CITY]) || asString(d[FIELD_IDS.CLIENT_STATE]) || asString(d[FIELD_IDS.CLIENT_ZIP])));

    setVenue(asString(d[FIELD_IDS.VENUE]));
    setVenueAddress(asString(d[FIELD_IDS.VENUE_ADDRESS]));
    setVenueCity(asString(d[FIELD_IDS.VENUE_CITY]));
    setVenueState(asSingleSelectName(d[FIELD_IDS.VENUE_STATE]) ?? "");
    const hasVenueData = !!(asString(d[FIELD_IDS.VENUE])?.trim() || asString(d[FIELD_IDS.VENUE_ADDRESS])?.trim() || asString(d[FIELD_IDS.VENUE_CITY])?.trim());
    setVenueMode(hasVenueData ? "add_venue" : "same_as_client");
    if (full) setClientEditing(false);
    const addrFilled = hasVenueData ? true : !!(asString(d[FIELD_IDS.CLIENT_STREET]) || asString(d[FIELD_IDS.CLIENT_CITY]) || asString(d[FIELD_IDS.CLIENT_STATE]) || asString(d[FIELD_IDS.CLIENT_ZIP]));
    if (addrFilled) setAddressEditing(false);

    setEventDate(asString(d[FIELD_IDS.EVENT_DATE]) ?? "");
    setGuestCount(d[FIELD_IDS.GUEST_COUNT] !== undefined ? Number(d[FIELD_IDS.GUEST_COUNT]) : null);
    setEventStartTime(secondsToTimeString(d[FIELD_IDS.EVENT_START_TIME]));
    setEventEndTime(secondsToTimeString(d[FIELD_IDS.EVENT_END_TIME]));
    const arrivalId = fwArrivalFieldId ?? FIELD_IDS.VENUE_ARRIVAL_TIME;
    setEventArrivalTime(secondsToTimeString(d[arrivalId ?? FIELD_IDS.VENUE_ARRIVAL_TIME]));
    setDispatchTime(secondsToTimeString(d[FIELD_IDS.DISPATCH_TIME]));
    const captainStr = resolveFwStaffLineFromFields(d);
    setCaptain(captainStr);
    setStaffCounts(parseStaffSummary(captainStr ?? ""));
    setStaffingConfirmedNowsta(asAirtableCheckbox(d[STAFFING_CONFIRMED_FIELD_ID]));
    setCityStateLineDraft(null);
  }, [selectedEventId, selectedEventData, isDelivery, fwArrivalFieldId]);

  const save = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
    setIntakeDirty(false);
  };

  const saveField = async (fieldId: string, value: unknown): Promise<boolean> => {
    if (!selectedEventId) return false;
    isUpdatingRef.current = true;
    try {
      return await setFields(selectedEventId, { [fieldId]: value });
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const handleClientNameBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    if (selectedEventId) {
      await setFields(selectedEventId, {
        [FIELD_IDS.CLIENT_FIRST_NAME]: v,
        [FIELD_IDS.CLIENT_LAST_NAME]: "",
        [FIELD_IDS.BUSINESS_NAME]: "",
      });
      if (contactSameAsClient) await setFields(selectedEventId, { [FIELD_IDS.PRIMARY_CONTACT_NAME]: v });
    }
  };

  // BEO display values
  const clientDisplayName = clientName.trim();
  const hasClientFilled = !!clientDisplayName;
  const clientAddressLine = [street, city, stateVal, zip].filter(Boolean).join(", ");
  const venueAddressLine = venueMode === "same_as_client"
    ? clientAddressLine
    : [venue, venueAddress, [venueCity, venueState].filter(Boolean).join(", "), zip].filter(Boolean).join(" — ").replace(/, $/, "");
  const hasAddressFilled = venueMode === "same_as_client" ? !!clientAddressLine : !!(venue?.trim() || venueAddress?.trim() || venueCity?.trim());
  const eventDateFormatted = formatDateForBeo(eventDate);
  const eventStartDisplay = selectedEventData && secondsTo12HourString(selectedEventData[FIELD_IDS.EVENT_START_TIME]);
  const eventEndDisplay = selectedEventData && secondsTo12HourString(selectedEventData[FIELD_IDS.EVENT_END_TIME]);
  const arrivalFieldIdResolved = fwArrivalFieldId ?? FIELD_IDS.VENUE_ARRIVAL_TIME;
  const arrivalRaw = selectedEventData && selectedEventData[arrivalFieldIdResolved];
  const eventArrivalDisplay = secondsTo12HourString(arrivalRaw);

  const handleTimeSelectChange = (fieldId: string, hour: number, minute: number) => {
    const timeValue = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    if (fieldId === FIELD_IDS.EVENT_START_TIME) setEventStartTime(timeValue);
    else if (fieldId === FIELD_IDS.EVENT_END_TIME) setEventEndTime(timeValue);
    else if (fieldId === FIELD_IDS.DISPATCH_TIME) setDispatchTime(timeValue);
    else setEventArrivalTime(timeValue);
    if (selectedEventId) {
      const seconds = hour * 3600 + minute * 60;
      const patch: Record<string, unknown> = { [fieldId]: seconds };
      if (fieldId === FIELD_IDS.DISPATCH_TIME && eventDateProp) patch[FIELD_IDS.EVENT_DATE] = eventDateProp;
      setFields(selectedEventId, patch);
    }
  };

  const applyContactSameAsClient = async () => {
    setContactName(clientName);
    setContactPhone(phone);
    if (selectedEventId) {
      await setFields(selectedEventId, {
        [FIELD_IDS.PRIMARY_CONTACT_NAME]: clientName,
        [FIELD_IDS.PRIMARY_CONTACT_PHONE]: phone,
      });
    }
  };

  const copyFromClientAddress = async () => {
    if (!selectedEventId) return;
    setVenueMode("same_as_client");
    await setFields(selectedEventId, {
      [FIELD_IDS.VENUE_ADDRESS]: street?.trim() ?? "",
      [FIELD_IDS.VENUE_CITY]: city?.trim() ?? "",
      [FIELD_IDS.VENUE_STATE]: stateVal?.trim() ?? "",
      [FIELD_IDS.VENUE_ZIP]: zip?.trim() ?? "",
      ...(venue?.trim() ? {} : { [FIELD_IDS.VENUE]: "Residence" }),
    });
    setVenueAddress(street ?? "");
    setVenueCity(city ?? "");
    setVenueState(stateVal ?? "");
  };

  const openVenueModal = () => {
    setModalVenueName(venue);
    setModalVenueAddress(venueAddress);
    setModalVenueCity(venueCity);
    setModalVenueState(venueState);
    setVenueModalOpen(true);
  };

  const saveVenueModal = async () => {
    setVenue(modalVenueName.trim());
    setVenueAddress(modalVenueAddress.trim());
    setVenueCity(modalVenueCity.trim());
    setVenueState(modalVenueState);
    setVenueMode("add_venue");
    setVenueModalOpen(false);
    if (selectedEventId) {
      await setFields(selectedEventId, {
        [FIELD_IDS.VENUE]: modalVenueName.trim() || "Residence",
        [FIELD_IDS.VENUE_ADDRESS]: modalVenueAddress.trim(),
        [FIELD_IDS.VENUE_CITY]: modalVenueCity.trim(),
        [FIELD_IDS.VENUE_STATE]: modalVenueState || null,
      });
    }
  };

  const switchToClientAddress = () => {
    setVenueMode("same_as_client");
    // Client address remains stored; form just displays it again
  };

  const openContactModal = () => {
    setModalContactName(contactName);
    setModalContactPhone(contactPhone);
    setContactModalOpen(true);
  };

  const saveContactModal = async () => {
    setContactName(modalContactName.trim());
    setContactPhone(modalContactPhone.trim());
    setContactSameAsClient(false);
    setContactModalOpen(false);
    if (selectedEventId) {
      await setFields(selectedEventId, {
        [FIELD_IDS.PRIMARY_CONTACT_NAME]: modalContactName.trim(),
        [FIELD_IDS.PRIMARY_CONTACT_PHONE]: modalContactPhone.trim(),
      });
    }
  };

  const switchToContactSameAsClient = async () => {
    setContactSameAsClient(true);
    await applyContactSameAsClient();
  };

  const openStaffBreakdownModal = () => {
    setStaffBreakdownModalOpen(true);
  };

  const saveStaffBreakdown = async () => {
    const summary = staffCountsToSummary(staffCounts);
    setCaptain(summary);
    setStaffBreakdownModalOpen(false);
    if (selectedEventId) await saveField(FW_STAFF_SUMMARY_FIELD_ID, summary);
  };

  const headerSummary = useMemo(() => {
    const parts: string[] = [];
    if (clientDisplayName) parts.push(clientDisplayName);
    if (eventDateFormatted) parts.push(eventDateFormatted);
    if (guestCount != null) parts.push(`${guestCount} guests`);
    return parts.length ? parts.join("  ·  ") : undefined;
  }, [clientDisplayName, eventDateFormatted, guestCount]);

  const VENUE_STATE_OPTIONS = ["NJ", "PA", "DE", "NY"];

  const timePicker = (
    key: "eventStartTime" | "eventEndTime" | "eventArrivalTime",
    label: string,
    fieldId: string
  ) => {
    const raw = key === "eventStartTime" ? eventStartTime : key === "eventEndTime" ? eventEndTime : eventArrivalTime;
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
      handleTimeSelectChange(fieldId, newHour24, minute);
    };
    const handleMinuteChange = (newMinute: number) => {
      handleTimeSelectChange(fieldId, hour24, newMinute);
    };
    return (
      <div key={key}>
        <label style={labelStyle}>{label}</label>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={String(hour12)}
            disabled={!canEdit}
            onChange={(e) => { const v = Number(e.target.value); if (!Number.isNaN(v)) handleHourChange(v, isPM); }}
            style={{ ...compactInputStyle, flex: 1, minWidth: 70 }}
          >
            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
              <option key={i} value={String(i)}>{i}</option>
            ))}
          </select>
          <span style={{ color: MUTED_COLOR, fontSize: 14 }}>:</span>
          <select
            value={String(minute)}
            disabled={!canEdit}
            onChange={(e) => { const v = Number(e.target.value); if (!Number.isNaN(v)) handleMinuteChange(v); }}
            style={{ ...compactInputStyle, flex: 1, minWidth: 70 }}
          >
            {MINUTE_INCREMENTS.map((m) => (
              <option key={m} value={String(m)}>{String(m).padStart(2, "0")}</option>
            ))}
          </select>
          <select
            value={isPM ? "PM" : "AM"}
            disabled={!canEdit}
            onChange={(e) => handleHourChange(hour12, e.target.value === "PM")}
            style={{ ...compactInputStyle, flex: 1, minWidth: 60 }}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>
    );
  };

  const rowDivider: React.CSSProperties = {
    gridColumn: "1 / -1",
    borderTop: "1px solid #2a2a2a",
    marginTop: 10,
    paddingTop: 10,
  };

  const stepLabelStyle: React.CSSProperties = {
    fontSize: LABEL_FONT_SIZE,
    fontWeight: 600,
    color: LABEL_COLOR,
    marginBottom: 6,
    display: "block",
  };

  // BEO-style: same layout as printed header — click the exact cell to edit
  const addressCell = venueMode === "same_as_client" ? street : venueAddress;
  const cityStateCell = venueMode === "same_as_client"
    ? [city, stateVal, zip].filter(Boolean).join(", ")
    : [venueCity, venueState, zip].filter(Boolean).join(", ");
  const cityStateInputValue = cityStateLineDraft !== null ? cityStateLineDraft : cityStateCell;
  const venueNameDisplay = venueMode === "same_as_client" ? (street || city || stateVal || zip ? "Same as client" : "—") : (venue || "Residence");

  const tableCellLabel: React.CSSProperties = { padding: "6px 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, color: "#e0e0e0", border: "1px solid #444", background: "rgba(0,0,0,0.3)", width: "12%", verticalAlign: "middle" };
  const tableCellValue: React.CSSProperties = { padding: 0, border: "1px solid #444", background: "rgba(0,0,0,0.2)", verticalAlign: "middle" };
  const tableInput: React.CSSProperties = { width: "100%", minHeight: 32, padding: "4px 8px", border: "none", background: "transparent", color: "#e0e0e0", fontSize: 13, boxSizing: "border-box" as const };

  const timeSelectInCell = (fieldId: string, key: "eventStartTime" | "eventEndTime" | "eventArrivalTime") => {
    const raw = key === "eventStartTime" ? eventStartTime : key === "eventEndTime" ? eventEndTime : eventArrivalTime;
    const hasValue = raw && raw !== "—";
    const [h, m] = hasValue ? raw.split(":").map(Number) : [12, 0];
    const hour24 = isNaN(h) ? 12 : Math.max(0, Math.min(23, h));
    const minute = (() => { const mNum = isNaN(m) ? 0 : m; return MINUTE_INCREMENTS.reduce((prev, curr) => Math.abs(curr - mNum) < Math.abs(prev - mNum) ? curr : prev); })();
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const isPM = hour24 >= 12;
    const handleHour = (newHour12: number, newIsPM: boolean) => { const newHour24 = newHour12 === 12 ? (newIsPM ? 12 : 0) : (newIsPM ? newHour12 + 12 : newHour12); handleTimeSelectChange(fieldId, newHour24, minute); };
    const handleMinute = (newMinute: number) => handleTimeSelectChange(fieldId, hour24, newMinute);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <select value={String(hour12)} disabled={!canEdit} onChange={(e) => handleHour(Number(e.target.value), isPM)} style={{ ...tableInput, minHeight: 28, flex: "1 1 0", minWidth: 0 }}><option value="12">12</option>{[1,2,3,4,5,6,7,8,9,10,11].map((i) => <option key={i} value={i}>{i}</option>)}</select>
        <span style={{ color: MUTED_COLOR }}>:</span>
        <select value={String(minute)} disabled={!canEdit} onChange={(e) => handleMinute(Number(e.target.value))} style={{ ...tableInput, minHeight: 28, flex: "1 1 0", minWidth: 0 }}>{MINUTE_INCREMENTS.map((m) => <option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}</select>
        <select value={isPM ? "PM" : "AM"} disabled={!canEdit} onChange={(e) => handleHour(hour12, e.target.value === "PM")} style={{ ...tableInput, minHeight: 28, width: 44 }}><option value="AM">AM</option><option value="PM">PM</option></select>
      </div>
    );
  };

  const dispatchTimeRaw = dispatchTime && dispatchTime !== "—" ? dispatchTime : "12:00";
  const [dispatchH, dispatchM] = dispatchTimeRaw.split(":").map(Number);
  const dispatchHour24 = isNaN(dispatchH) ? 12 : Math.max(0, Math.min(23, dispatchH));
  const dispatchMinute = (() => { const m = isNaN(dispatchM) ? 0 : dispatchM; return MINUTE_INCREMENTS.reduce((prev, curr) => Math.abs(curr - m) < Math.abs(prev - m) ? curr : prev); })();
  const dispatchHour12 = dispatchHour24 === 0 ? 12 : dispatchHour24 > 12 ? dispatchHour24 - 12 : dispatchHour24;
  const dispatchIsPM = dispatchHour24 >= 12;
  const dispatchHour24From12 = (h12: number, pm: boolean) => (h12 === 12 ? (pm ? 12 : 0) : (pm ? h12 + 12 : h12));
  const timeSelectStyle: React.CSSProperties = { ...tableInput, minHeight: 24, width: 50, padding: "2px 6px", fontSize: 12, color: "#FBC02D" };
  const amPmSelectStyle: React.CSSProperties = { ...timeSelectStyle, width: 48 };
  const dispatchTimePicker = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      <select value={String(dispatchHour12)} onChange={(e) => handleTimeSelectChange(FIELD_IDS.DISPATCH_TIME, dispatchHour24From12(Number(e.target.value), dispatchIsPM), dispatchMinute)} style={timeSelectStyle}><option value="12">12</option>{[1,2,3,4,5,6,7,8,9,10,11].map((i) => <option key={i} value={i}>{i}</option>)}</select>
      <span style={{ color: "#FBC02D" }}>:</span>
      <select value={String(dispatchMinute)} onChange={(e) => handleTimeSelectChange(FIELD_IDS.DISPATCH_TIME, dispatchHour24, Number(e.target.value))} style={timeSelectStyle}>{MINUTE_INCREMENTS.map((m) => <option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}</select>
      <select value={dispatchIsPM ? "PM" : "AM"} onChange={(e) => handleTimeSelectChange(FIELD_IDS.DISPATCH_TIME, dispatchHour24From12(dispatchHour12, e.target.value === "PM"), dispatchMinute)} style={amPmSelectStyle}><option value="AM">AM</option><option value="PM">PM</option></select>
    </span>
  );

  return (
    <>
    <FormSection
      title="Event details/Header"
      subtitle={headerSummary}
      isDelivery={isDelivery}
      sectionId="beo-section-header"
      defaultOpen={false}
      titleAlign="center"
      dotColor={BEO_SECTION_PILL_ACCENT}
    >
      <p style={{ gridColumn: "1 / -1", ...helperStyle, marginBottom: 14, marginTop: 0 }}>
        Click any cell to edit. Same layout as the printed BEO header.</p>
      <div style={{ gridColumn: "1 / -1", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #444", fontSize: 13 }}>
          <colgroup><col style={{ width: "12%" }} /><col style={{ width: "38%" }} /><col style={{ width: "12%" }} /><col style={{ width: "38%" }} /></colgroup>
          <tbody>
            <tr>
              <td colSpan={4} style={{ padding: "8px", border: "1px solid #444", background: "rgba(0,0,0,0.2)", verticalAlign: "middle" }}>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "nowrap", alignItems: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "8px 14px", color: "#4DD0E1", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, whiteSpace: "nowrap", border: "1px solid rgba(77, 208, 225, 0.5)", background: "linear-gradient(135deg, rgba(77, 208, 225, 0.2), rgba(77, 208, 225, 0.06))", width: 320, height: 36, boxSizing: "border-box", borderRadius: 6 }}>JOB #: {jobNumberDisplay}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "8px 14px", color: "#FBC02D", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, whiteSpace: "nowrap", border: "1px solid rgba(251, 192, 45, 0.5)", background: "linear-gradient(135deg, rgba(251, 192, 45, 0.2), rgba(251, 192, 45, 0.06))", width: 320, height: 36, boxSizing: "border-box", borderRadius: 6 }}>
                    DISPATCH TIME: {canEditDispatch ? dispatchTimePicker : <><span style={{ color: "#FBC02D" }}>{dispatchTimeDisplay}</span></>}
                    {!canEditDispatch && <span style={{ fontSize: 11, color: MUTED_COLOR, marginLeft: 4 }}>(read-only)</span>}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style={tableCellLabel}>CLIENT</td>
              <td style={tableCellValue}><input value={clientName} disabled={!canEdit} onChange={(e) => { setClientName(e.target.value); setIntakeDirty(true); }} onBlur={handleClientNameBlur} style={tableInput} placeholder="—" /></td>
              <td style={tableCellLabel}>ORDER #</td>
              <td style={{ ...tableCellValue, color: MUTED_COLOR, padding: "6px 8px" }}>—</td>
            </tr>
            <tr>
              <td style={tableCellLabel}>CONTACT</td>
              <td style={tableCellValue}>
                {contactSameAsClient ? (
                  <button type="button" style={{ ...pillInactive, margin: "4px 8px" }} onClick={canEdit ? openContactModal : undefined} disabled={!canEdit}>
                    If different than client
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "4px 8px" }}>
                    <input value={contactName} disabled={!canEdit} onChange={(e) => setContactName(e.target.value)} onBlur={async (e) => { const v = e.target.value; if (selectedEventId) await setFields(selectedEventId, { [FIELD_IDS.PRIMARY_CONTACT_NAME]: v }); }} style={{ ...tableInput, flex: "1 1 120px" }} placeholder="Contact name" />
                    <button type="button" onClick={switchToContactSameAsClient} style={{ fontSize: 11, color: ACCENT_LINK, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Same as client</button>
                  </div>
                )}
              </td>
              <td style={tableCellLabel}>EVENT DATE</td>
              <td style={tableCellValue}><input type="date" value={eventDate} disabled={!canEdit} onChange={async (e) => { const v = e.target.value; setEventDate(v); if (selectedEventId) await saveField(FIELD_IDS.EVENT_DATE, v || null); }} style={tableInput} /></td>
            </tr>
            <tr>
              <td style={tableCellLabel}>PHONE</td>
              <td style={tableCellValue}>
                <input
                  type="tel"
                  value={contactSameAsClient ? phone : contactPhone}
                  disabled={!canEdit}
                  onChange={(e) => { const v = e.target.value; if (contactSameAsClient) setPhone(v); else setContactPhone(v); setIntakeDirty(true); }}
                  onBlur={async (e) => {
                    const v = e.target.value;
                    if (contactSameAsClient) {
                      await save(FIELD_IDS.CLIENT_PHONE, v);
                      if (selectedEventId) await setFields(selectedEventId, { [FIELD_IDS.PRIMARY_CONTACT_PHONE]: v });
                    } else if (selectedEventId) {
                      await setFields(selectedEventId, { [FIELD_IDS.PRIMARY_CONTACT_PHONE]: v });
                    }
                  }}
                  style={tableInput}
                  placeholder="—"
                />
              </td>
              <td style={tableCellLabel}>GUESTS</td>
              <td style={tableCellValue}><input type="number" value={guestCount ?? ""} disabled={!canEdit} onChange={(e) => setGuestCount(e.target.value === "" ? null : Number(e.target.value))} onBlur={async (e) => { const v = e.target.value === "" ? null : Number(e.target.value); if (selectedEventId) await saveField(FIELD_IDS.GUEST_COUNT, v); }} style={tableInput} placeholder="—" min={0} /></td>
            </tr>
            <tr>
              <td style={tableCellLabel}>ADDRESS</td>
              <td style={tableCellValue}><input value={addressCell} disabled={!canEdit} onChange={(e) => { if (venueMode === "same_as_client") setStreet(e.target.value); else setVenueAddress(e.target.value); setIntakeDirty(true); }} onBlur={async (e) => { const v = e.target.value; if (venueMode === "same_as_client") await save(FIELD_IDS.CLIENT_STREET, v); else await saveField(FIELD_IDS.VENUE_ADDRESS, v); }} style={tableInput} placeholder="—" /></td>
              <td style={tableCellLabel}>EVENT START</td>
              <td style={tableCellValue}>{!isDelivery && timeSelectInCell(FIELD_IDS.EVENT_START_TIME, "eventStartTime")}</td>
            </tr>
            <tr>
              <td style={tableCellLabel}>CITY, ST</td>
              <td style={tableCellValue}>
                <input
                  value={cityStateInputValue}
                  disabled={!canEdit}
                  onFocus={() => setCityStateLineDraft(cityStateCell)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCityStateLineDraft(v);
                    const parts = v.split(",").map((s) => s.trim());
                    if (venueMode === "same_as_client") {
                      setCity(parts[0] ?? "");
                      setStateVal(parts[1] ?? "");
                      setZip(parts[2] ?? "");
                    } else {
                      setVenueCity(parts[0] ?? "");
                      setVenueState(parts[1] ?? "");
                    }
                    setIntakeDirty(true);
                  }}
                  onBlur={async () => {
                    setCityStateLineDraft(null);
                    if (venueMode === "same_as_client" && selectedEventId) {
                      await save(FIELD_IDS.CLIENT_CITY, city);
                      await save(FIELD_IDS.CLIENT_STATE, stateVal);
                      await save(FIELD_IDS.CLIENT_ZIP, zip);
                    } else if (selectedEventId) {
                      await saveField(FIELD_IDS.VENUE_CITY, venueCity);
                      await saveField(FIELD_IDS.VENUE_STATE, venueState);
                    }
                  }}
                  style={tableInput}
                  placeholder="—"
                />
              </td>
              <td style={tableCellLabel}>EVENT END</td>
              <td style={tableCellValue}>{!isDelivery && timeSelectInCell(FIELD_IDS.EVENT_END_TIME, "eventEndTime")}</td>
            </tr>
            <tr>
              <td style={tableCellLabel}>VENUE</td>
              <td style={tableCellValue}>
                {venueMode === "same_as_client" ? (
                  <button type="button" style={{ ...pillInactive, margin: "4px 8px" }} onClick={canEdit ? openVenueModal : undefined} disabled={!canEdit}>
                    If different than client address
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "4px 8px" }}>
                    <input value={venue} disabled={!canEdit} onChange={(e) => setVenue(e.target.value)} onBlur={(e) => saveField(FIELD_IDS.VENUE, e.target.value)} style={{ ...tableInput, flex: "1 1 120px" }} placeholder="e.g. Residence or venue name" />
                    <button type="button" onClick={switchToClientAddress} style={{ fontSize: 11, color: ACCENT_LINK, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Same as client</button>
                  </div>
                )}
              </td>
              <td style={tableCellLabel}>EVENT ARRIVAL</td>
              <td style={tableCellValue}>{!isDelivery && timeSelectInCell(arrivalFieldIdResolved, "eventArrivalTime")}</td>
            </tr>
            <tr>
              <td style={tableCellLabel} />
              <td style={tableCellValue} />
              <td style={tableCellLabel}>FW STAFF</td>
              <td style={tableCellValue}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "4px 8px" }}>
                  <input value={captain} disabled={!canEdit} onChange={(e) => setCaptain(e.target.value)} onBlur={async (e) => {
                    const v = e.target.value;
                    setCaptain(v);
                    if (selectedEventId) await saveField(FW_STAFF_SUMMARY_FIELD_ID, v);
                  }} style={{ ...tableInput, flex: "1 1 100px" }} placeholder="e.g. 2 Servers, 1 Chef" />
                  <button type="button" style={{ ...pillInactive, margin: 0 }} onClick={canEdit ? openStaffBreakdownModal : undefined} disabled={!canEdit}>Staff breakdown</button>
                  <a href={NOWSTA_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: ACCENT_LINK }}>Nowsta →</a>
                  {/* Always show (not gated on delivery/pickup) so the control does not disappear after type loads or for hybrid jobs. */}
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      color: "#e0e0e0",
                      cursor: canEdit ? "pointer" : "default",
                      whiteSpace: "nowrap",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={staffingConfirmedNowsta}
                      disabled={!canEdit}
                      onChange={async (e) => {
                        const v = e.target.checked;
                        setStaffingConfirmedNowsta(v);
                        if (!selectedEventId) return;
                        const ok = await saveField(STAFFING_CONFIRMED_FIELD_ID, v);
                        if (ok === false) setStaffingConfirmedNowsta(!v);
                      }}
                    />
                    Confirmed in Nowsta
                  </label>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </FormSection>
    {venueModalOpen && (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="venue-modal-title"
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={() => setVenueModalOpen(false)}
      >
        <div style={{ background: "#1a1a1a", border: "1px solid #444", borderRadius: 8, padding: 20, minWidth: 320, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
          <h3 id="venue-modal-title" style={{ margin: "0 0 14px", fontSize: 16, color: "#e0e0e0" }}>Venue name & address</h3>
          <p style={{ ...helperStyle, marginBottom: 12 }}>Event will show this address on the BEO. Client address stays saved.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={labelStyle}>Venue name</label>
            <input value={modalVenueName} onChange={(e) => setModalVenueName(e.target.value)} style={compactInputStyle} placeholder="e.g. Grand Ballroom, The Merion" />
            <label style={labelStyle}>Address</label>
            <input value={modalVenueAddress} onChange={(e) => setModalVenueAddress(e.target.value)} style={compactInputStyle} placeholder="Street address" />
            <label style={labelStyle}>City</label>
            <input value={modalVenueCity} onChange={(e) => setModalVenueCity(e.target.value)} style={compactInputStyle} placeholder="City" />
            <label style={labelStyle}>State</label>
            <select value={modalVenueState} onChange={(e) => setModalVenueState(e.target.value)} style={compactInputStyle}>
              <option value="">—</option>
              {VENUE_STATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setVenueModalOpen(false)} style={pillInactive}>Cancel</button>
            <button type="button" onClick={saveVenueModal} style={pillActive}>Save</button>
          </div>
        </div>
      </div>
    )}
    {contactModalOpen && (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={() => setContactModalOpen(false)}
      >
        <div style={{ background: "#1a1a1a", border: "1px solid #444", borderRadius: 8, padding: 20, minWidth: 320, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
          <h3 id="contact-modal-title" style={{ margin: "0 0 14px", fontSize: 16, color: "#e0e0e0" }}>Contact person</h3>
          <p style={{ ...helperStyle, marginBottom: 12 }}>Event will show this contact on the BEO. Client name stays saved.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={labelStyle}>Contact name</label>
            <input value={modalContactName} onChange={(e) => setModalContactName(e.target.value)} style={compactInputStyle} placeholder="Person to reach" />
            <label style={labelStyle}>Contact phone</label>
            <input type="tel" value={modalContactPhone} onChange={(e) => setModalContactPhone(e.target.value)} style={compactInputStyle} placeholder="(555) 555-5555" />
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setContactModalOpen(false)} style={pillInactive}>Cancel</button>
            <button type="button" onClick={saveContactModal} style={pillActive}>Save</button>
          </div>
        </div>
      </div>
    )}
    {staffBreakdownModalOpen && (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-breakdown-modal-title"
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={() => setStaffBreakdownModalOpen(false)}
      >
        <div style={{ background: "#1a1a1a", border: "1px solid #444", borderRadius: 8, padding: 20, minWidth: 320, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
          <h3 id="staff-breakdown-modal-title" style={{ margin: "0 0 14px", fontSize: 16, color: "#e0e0e0" }}>Staff by role</h3>
          <p style={{ ...helperStyle, marginBottom: 14 }}>Same format as the invoice: number per role. Saves as e.g. &quot;2 Servers, 1 Chef&quot;.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {STAFF_ROLES.map((role) => (
              <div key={role.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <label style={{ ...labelStyle, marginBottom: 0, minWidth: 90 }}>{role.label}</label>
                <input
                  type="number"
                  min={0}
                  value={staffCounts[role.key]}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setStaffCounts((prev) => ({ ...prev, [role.key]: isNaN(v) ? 0 : Math.max(0, v) }));
                  }}
                  style={{ ...compactInputStyle, width: 72 }}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setStaffBreakdownModalOpen(false)} style={pillInactive}>Cancel</button>
            <button type="button" onClick={saveStaffBreakdown} style={pillActive}>Save</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
