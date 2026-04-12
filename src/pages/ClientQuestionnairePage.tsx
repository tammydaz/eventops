import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { airtableFetch, getEventsTable } from "../services/airtable/client";
import { FIELD_IDS } from "../services/airtable/events";

type FieldPatch = Record<string, unknown>;

const asStr = (v: unknown): string =>
  typeof v === "string" ? v : "";

const asSingleSelect = (v: unknown): string => {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "name" in v)
    return (v as { name: string }).name;
  return "";
};

const LOGISTICS_FIELDS = [
  FIELD_IDS.CLIENT_FIRST_NAME,
  FIELD_IDS.CLIENT_LAST_NAME,
  FIELD_IDS.EVENT_DATE,
  FIELD_IDS.VENUE,
  FIELD_IDS.GUEST_COUNT,
  FIELD_IDS.DIETARY_NOTES,
  FIELD_IDS.RELIGIOUS_RESTRICTIONS,
  FIELD_IDS.PARKING_NOTES,
  FIELD_IDS.LOAD_IN_NOTES,
  FIELD_IDS.STAIRS_STEPS,
  FIELD_IDS.ELEVATORS_AVAILABLE,
  FIELD_IDS.VENUE_NOTES,
  FIELD_IDS.FOOD_SETUP_LOCATION,
  FIELD_IDS.ANIMALS_PETS,
  FIELD_IDS.EVENT_PURPOSE,
  FIELD_IDS.CLIENT_SUPPLIED_FOOD,
  FIELD_IDS.THEME_COLOR_SCHEME,
  FIELD_IDS.SPECIAL_NOTES,
];

const YES_NO_OPTIONS = ["Yes", "No", "N/A"];

export default function ClientQuestionnairePage() {
  const { eventId } = useParams<{ eventId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event header info
  const [clientName, setClientName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [guestCount, setGuestCount] = useState<number | null>(null);

  // Logistics fields
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [religiousRestrictions, setReligiousRestrictions] = useState("");
  const [parkingNotes, setParkingNotes] = useState("");
  const [loadInNotes, setLoadInNotes] = useState("");
  const [stairsSteps, setStairsSteps] = useState("");
  const [elevatorsAvailable, setElevatorsAvailable] = useState("");
  const [venueNotes, setVenueNotes] = useState("");
  const [foodSetupLocation, setFoodSetupLocation] = useState("");
  const [animalsPets, setAnimalsPets] = useState("");
  const [eventPurpose, setEventPurpose] = useState("");
  const [clientSuppliedFood, setClientSuppliedFood] = useState("");
  const [themeColorScheme, setThemeColorScheme] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");

  useEffect(() => {
    if (!eventId) {
      setError("Invalid link — no event ID found.");
      setLoading(false);
      return;
    }

    const tableResult = getEventsTable();
    if (typeof tableResult !== "string") {
      setError("Configuration error. Please contact Foodwerx.");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    LOGISTICS_FIELDS.forEach((f) => params.append("fields[]", f));

    airtableFetch<{ records: { fields: Record<string, unknown> }[] }>(
      `/${tableResult}/${eventId}?${params.toString()}`
    ).then((result) => {
      // If load fails, show a blank form anyway — client can still fill it out
      if (!result || typeof result !== "object" || "error" in result) {
        setLoading(false);
        return;
      }

      const f = (result as { fields: Record<string, unknown> }).fields ?? {};

      const first = asStr(f[FIELD_IDS.CLIENT_FIRST_NAME]);
      const last = asStr(f[FIELD_IDS.CLIENT_LAST_NAME]);
      setClientName([first, last].filter(Boolean).join(" ") || "Valued Client");
      setEventDate(asStr(f[FIELD_IDS.EVENT_DATE]).slice(0, 10));
      setVenue(asStr(f[FIELD_IDS.VENUE]));
      setGuestCount(typeof f[FIELD_IDS.GUEST_COUNT] === "number" ? (f[FIELD_IDS.GUEST_COUNT] as number) : null);

      setDietaryNotes(asStr(f[FIELD_IDS.DIETARY_NOTES]));
      setReligiousRestrictions(asStr(f[FIELD_IDS.RELIGIOUS_RESTRICTIONS]));
      setParkingNotes(asStr(f[FIELD_IDS.PARKING_NOTES]));
      setLoadInNotes(asStr(f[FIELD_IDS.LOAD_IN_NOTES]));
      setStairsSteps(asSingleSelect(f[FIELD_IDS.STAIRS_STEPS]));
      setElevatorsAvailable(asSingleSelect(f[FIELD_IDS.ELEVATORS_AVAILABLE]));
      setVenueNotes(asStr(f[FIELD_IDS.VENUE_NOTES]));
      setFoodSetupLocation(asStr(f[FIELD_IDS.FOOD_SETUP_LOCATION]));
      setAnimalsPets(asStr(f[FIELD_IDS.ANIMALS_PETS]));
      setEventPurpose(asStr(f[FIELD_IDS.EVENT_PURPOSE]));
      setClientSuppliedFood(asStr(f[FIELD_IDS.CLIENT_SUPPLIED_FOOD]));
      setThemeColorScheme(asStr(f[FIELD_IDS.THEME_COLOR_SCHEME]));
      setSpecialNotes(asStr(f[FIELD_IDS.SPECIAL_NOTES]));

      setLoading(false);
    });
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    const tableResult = getEventsTable();
    if (typeof tableResult !== "string") return;

    setSaving(true);

    const patch: FieldPatch = {
      [FIELD_IDS.DIETARY_NOTES]: dietaryNotes || null,
      [FIELD_IDS.RELIGIOUS_RESTRICTIONS]: religiousRestrictions || null,
      [FIELD_IDS.PARKING_NOTES]: parkingNotes || null,
      [FIELD_IDS.LOAD_IN_NOTES]: loadInNotes || null,
      [FIELD_IDS.STAIRS_STEPS]: stairsSteps ? { name: stairsSteps } : null,
      [FIELD_IDS.ELEVATORS_AVAILABLE]: elevatorsAvailable ? { name: elevatorsAvailable } : null,
      [FIELD_IDS.VENUE_NOTES]: venueNotes || null,
      [FIELD_IDS.FOOD_SETUP_LOCATION]: foodSetupLocation || null,
      [FIELD_IDS.ANIMALS_PETS]: animalsPets || null,
      [FIELD_IDS.EVENT_PURPOSE]: eventPurpose || null,
      [FIELD_IDS.CLIENT_SUPPLIED_FOOD]: clientSuppliedFood || null,
      [FIELD_IDS.THEME_COLOR_SCHEME]: themeColorScheme || null,
      [FIELD_IDS.SPECIAL_NOTES]: specialNotes || null,
    };

    // Strip null values — don't overwrite existing data with blank
    const cleanPatch = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== null && v !== "")
    );

    const result = await airtableFetch(`/${tableResult}`, {
      method: "PATCH",
      body: JSON.stringify({
        records: [{ id: eventId, fields: cleanPatch }],
      }),
    });

    setSaving(false);

    if (result && typeof result === "object" && "error" in result) {
      setSaveError(true);
    }
    setSubmitted(true);
  };

  // ── styles ──────────────────────────────────────────────────────────────
  const s = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#f1f5f9",
      padding: "32px 16px 64px",
    } as React.CSSProperties,
    card: {
      maxWidth: 640,
      margin: "0 auto",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 16,
      padding: "32px 28px",
    } as React.CSSProperties,
    logo: {
      fontSize: 22,
      fontWeight: 800,
      letterSpacing: 1,
      color: "#e2e8f0",
      marginBottom: 4,
    } as React.CSSProperties,
    subtitle: {
      fontSize: 13,
      color: "#94a3b8",
      marginBottom: 28,
    } as React.CSSProperties,
    eventHeader: {
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10,
      padding: "14px 18px",
      marginBottom: 28,
      fontSize: 13,
      lineHeight: 1.6,
      color: "#cbd5e1",
    } as React.CSSProperties,
    eventName: {
      fontSize: 17,
      fontWeight: 700,
      color: "#f1f5f9",
      marginBottom: 2,
    } as React.CSSProperties,
    sectionTitle: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1.2,
      textTransform: "uppercase" as const,
      color: "#64748b",
      marginTop: 28,
      marginBottom: 12,
      paddingBottom: 6,
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    } as React.CSSProperties,
    label: {
      display: "block",
      fontSize: 13,
      fontWeight: 600,
      color: "#cbd5e1",
      marginBottom: 6,
    } as React.CSSProperties,
    hint: {
      fontSize: 11,
      color: "#64748b",
      marginBottom: 6,
      marginTop: -4,
    } as React.CSSProperties,
    textarea: {
      width: "100%",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 8,
      padding: "10px 12px",
      color: "#f1f5f9",
      fontSize: 14,
      lineHeight: 1.5,
      resize: "vertical" as const,
      outline: "none",
      boxSizing: "border-box" as const,
      marginBottom: 16,
    } as React.CSSProperties,
    select: {
      width: "100%",
      background: "rgba(15,23,42,0.8)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 8,
      padding: "10px 12px",
      color: "#f1f5f9",
      fontSize: 14,
      outline: "none",
      boxSizing: "border-box" as const,
      marginBottom: 16,
    } as React.CSSProperties,
    submitBtn: {
      display: "block",
      width: "100%",
      marginTop: 28,
      padding: "14px",
      background: "linear-gradient(135deg, #0d9488, #0891b2)",
      border: "none",
      borderRadius: 10,
      color: "#fff",
      fontSize: 16,
      fontWeight: 700,
      cursor: "pointer",
      letterSpacing: 0.5,
    } as React.CSSProperties,
    successBox: {
      textAlign: "center" as const,
      padding: "48px 24px",
    } as React.CSSProperties,
  };

  // ── render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={s.page}>
        <div style={{ ...s.card, textAlign: "center", padding: "64px 28px", color: "#64748b" }}>
          Loading your event details…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.page}>
        <div style={{ ...s.card, textAlign: "center", padding: "64px 28px" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <div style={{ color: "#f87171", fontWeight: 600, marginBottom: 8 }}>Something went wrong</div>
          <div style={{ color: "#94a3b8", fontSize: 13 }}>{error}</div>
        </div>
      </div>
    );
  }

  if (submitted) {
    const answers = [
      { label: "Dietary Restrictions", value: dietaryNotes },
      { label: "Religious Restrictions", value: religiousRestrictions },
      { label: "Venue Notes", value: venueNotes },
      { label: "Parking Notes", value: parkingNotes },
      { label: "Load-In / Access Notes", value: loadInNotes },
      { label: "Stairs / Steps", value: stairsSteps },
      { label: "Elevators", value: elevatorsAvailable },
      { label: "Animals / Pets", value: animalsPets },
      { label: "Food Setup Location", value: foodSetupLocation },
      { label: "Event Purpose", value: eventPurpose },
      { label: "Theme / Colors", value: themeColorScheme },
      { label: "Client-Supplied Food", value: clientSuppliedFood },
      { label: "Special Notes", value: specialNotes },
    ].filter((a) => a.value);

    return (
      <div style={s.page}>
        <div style={{ ...s.card, textAlign: "center" as const, padding: "40px 28px" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>{saveError ? "📋" : "✅"}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
            {saveError ? "Responses Received" : `Thank you${clientName ? ", " + clientName.split(" ")[0] : ""}!`}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            {saveError
              ? "We captured your responses below. Please forward this page or screenshot it to your Foodwerx contact."
              : "Your responses have been saved and our team will review them before your event."}
          </div>

          {answers.length > 0 && (
            <div style={{ textAlign: "left" as const, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#64748b", textTransform: "uppercase" as const, marginBottom: 12 }}>Your Responses</div>
              {answers.map((a) => (
                <div key={a.label} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 2 }}>{a.label}</div>
                  <div style={{ fontSize: 13, color: "#cbd5e1" }}>{a.value}</div>
                </div>
              ))}
            </div>
          )}

          {!saveError && (
            <div style={{ fontSize: 13, color: "#475569" }}>— The Foodwerx Team</div>
          )}
        </div>
      </div>
    );
  }

  const formatDate = (d: string) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(m) - 1]} ${parseInt(day)}, ${y}`;
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Header */}
        <div style={s.logo}>Foodwerx</div>
        <div style={s.subtitle}>Event Logistics Questionnaire</div>

        {/* Event context */}
        <div style={s.eventHeader}>
          <div style={s.eventName}>{clientName}</div>
          {eventDate && <div>{formatDate(eventDate)}{guestCount ? ` · ${guestCount} guests` : ""}</div>}
          {venue && <div style={{ color: "#94a3b8" }}>{venue}</div>}
        </div>

        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24, lineHeight: 1.6 }}>
          Hi {clientName.split(" ")[0]}! To make sure your event goes smoothly, please fill out the details below.
          All fields are optional — just share what you know.
        </div>

        <form onSubmit={handleSubmit}>

          {/* ── Dietary & Restrictions ── */}
          <div style={s.sectionTitle}>Dietary &amp; Restrictions</div>

          <label style={s.label}>Allergies / Dietary Restrictions</label>
          <div style={s.hint}>List any allergies, intolerances, or dietary needs (e.g. gluten-free, nut allergy, vegan)</div>
          <textarea
            style={s.textarea}
            rows={3}
            value={dietaryNotes}
            onChange={(e) => setDietaryNotes(e.target.value)}
            placeholder="e.g. 3 guests are nut-free, 1 is vegan"
          />

          <label style={s.label}>Religious Restrictions</label>
          <div style={s.hint}>e.g. Kosher, Halal, no pork</div>
          <textarea
            style={s.textarea}
            rows={2}
            value={religiousRestrictions}
            onChange={(e) => setReligiousRestrictions(e.target.value)}
            placeholder="None, or describe..."
          />

          {/* ── Venue & Access ── */}
          <div style={s.sectionTitle}>Venue &amp; Access</div>

          <label style={s.label}>Venue Notes</label>
          <div style={s.hint}>Anything specific we should know about the venue (entry points, rules, contacts, etc.)</div>
          <textarea
            style={s.textarea}
            rows={3}
            value={venueNotes}
            onChange={(e) => setVenueNotes(e.target.value)}
            placeholder="e.g. use side entrance on Oak St, check in with building security"
          />

          <label style={s.label}>Parking / Load-In Notes</label>
          <div style={s.hint}>Where should we park? Any loading dock instructions?</div>
          <textarea
            style={s.textarea}
            rows={3}
            value={parkingNotes}
            onChange={(e) => setParkingNotes(e.target.value)}
            placeholder="e.g. loading dock on Elm Ave, parking validated in garage B"
          />

          <label style={s.label}>Load-In / Access Notes</label>
          <div style={s.hint}>Gate codes, key contacts, or any access restrictions</div>
          <textarea
            style={s.textarea}
            rows={2}
            value={loadInNotes}
            onChange={(e) => setLoadInNotes(e.target.value)}
            placeholder="e.g. call John at 555-1234 for access"
          />

          <label style={s.label}>Stairs / Steps?</label>
          <select
            style={s.select}
            value={stairsSteps}
            onChange={(e) => setStairsSteps(e.target.value)}
          >
            <option value="">— Select —</option>
            {YES_NO_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <label style={s.label}>Elevators Available?</label>
          <select
            style={s.select}
            value={elevatorsAvailable}
            onChange={(e) => setElevatorsAvailable(e.target.value)}
          >
            <option value="">— Select —</option>
            {YES_NO_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <label style={s.label}>Animals / Pets on Site?</label>
          <div style={s.hint}>Any pets or animals present at the venue?</div>
          <textarea
            style={s.textarea}
            rows={2}
            value={animalsPets}
            onChange={(e) => setAnimalsPets(e.target.value)}
            placeholder="None, or describe..."
          />

          {/* ── Event Setup ── */}
          <div style={s.sectionTitle}>Event Setup</div>

          <label style={s.label}>Food Setup Location</label>
          <div style={s.hint}>Where in the venue should the food be set up?</div>
          <textarea
            style={s.textarea}
            rows={2}
            value={foodSetupLocation}
            onChange={(e) => setFoodSetupLocation(e.target.value)}
            placeholder="e.g. main ballroom, outdoor patio, conference room B"
          />

          <label style={s.label}>Event Purpose / Occasion</label>
          <div style={s.hint}>What is the occasion? (e.g. corporate luncheon, birthday, product launch)</div>
          <textarea
            style={s.textarea}
            rows={2}
            value={eventPurpose}
            onChange={(e) => setEventPurpose(e.target.value)}
            placeholder="e.g. Annual company picnic"
          />

          <label style={s.label}>Theme / Color Scheme</label>
          <div style={s.hint}>Any specific theme, colors, or aesthetic for the event?</div>
          <textarea
            style={s.textarea}
            rows={2}
            value={themeColorScheme}
            onChange={(e) => setThemeColorScheme(e.target.value)}
            placeholder="e.g. Black and gold, tropical theme"
          />

          <label style={s.label}>Client-Supplied Food or Items</label>
          <div style={s.hint}>Are you providing any food, cake, or other items we should be aware of?</div>
          <textarea
            style={s.textarea}
            rows={2}
            value={clientSuppliedFood}
            onChange={(e) => setClientSuppliedFood(e.target.value)}
            placeholder="e.g. Client is bringing their own wedding cake"
          />

          {/* ── Anything Else ── */}
          <div style={s.sectionTitle}>Anything Else?</div>

          <label style={s.label}>Special Notes</label>
          <div style={s.hint}>Anything else we should know to make your event perfect</div>
          <textarea
            style={s.textarea}
            rows={4}
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            placeholder="Share any additional details, requests, or concerns..."
          />

          <button type="submit" style={s.submitBtn} disabled={saving}>
            {saving ? "Saving…" : "Submit My Responses"}
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 11, color: "#334155", textAlign: "center" }}>
          Powered by Foodwerx Event Management
        </div>
      </div>
    </div>
  );
}
