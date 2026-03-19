import { useEffect, useMemo, useState } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";
import { asString, asSingleSelectName } from "../../services/airtable/selectors";
import { isDeliveryOrPickup } from "../../lib/deliveryHelpers";
import { FormSection, Helper, inputStyle, labelStyle } from "./FormSection";

type ClientType = "individual" | "business";

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
const pillInactive: React.CSSProperties = { ...pillBase, background: "transparent", color: "#777" };

/** Tighter inputs so boxes aren’t oversized for the content */
const compactInputStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "5px 8px",
  fontSize: "12px",
  borderRadius: "5px",
};
const compactLabelStyle: React.CSSProperties = { ...labelStyle, fontSize: "9px", marginBottom: "2px" };

export const ClientAndContactSection = () => {
  const { selectedEventId, selectedEventData, setFields, setIntakeDirty } = useEventStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [zip, setZip] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [clientType, setClientType] = useState<ClientType>("individual");
  /** When true, show Contact name/phone (day-of contact different from client). Individual or Business can both use this. */
  const [showContact, setShowContact] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  /** When false, show only pills; after picking Individual/Business or when data exists, show form */
  const [showFormFields, setShowFormFields] = useState(false);

  const eventType = selectedEventData ? asSingleSelectName(selectedEventData[FIELD_IDS.EVENT_TYPE]) : "";
  const isDelivery = isDeliveryOrPickup(eventType);
  const canEdit = Boolean(selectedEventId);

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setFirstName(""); setLastName(""); setBusinessName("");
      setPhone(""); setEmail(""); setStreet(""); setCity(""); setStateVal(""); setZip("");
      setContactName(""); setContactPhone("");
    setClientType(isDelivery ? "business" : "individual");
    setShowContact(false);
    setShowAddress(false);
    setShowFormFields(false);
    return;
  }

    const fn = asString(selectedEventData[FIELD_IDS.CLIENT_FIRST_NAME]);
    const ln = asString(selectedEventData[FIELD_IDS.CLIENT_LAST_NAME]);
    const bn = asString(selectedEventData[FIELD_IDS.BUSINESS_NAME]);
    const ph = asString(selectedEventData[FIELD_IDS.CLIENT_PHONE]);
    const em = asString(selectedEventData[FIELD_IDS.CLIENT_EMAIL]);
    const st = asString(selectedEventData[FIELD_IDS.CLIENT_STREET]);
    const ci = asString(selectedEventData[FIELD_IDS.CLIENT_CITY]);
    const sa = asString(selectedEventData[FIELD_IDS.CLIENT_STATE]);
    const zp = asString(selectedEventData[FIELD_IDS.CLIENT_ZIP]);
    const cn = asString(selectedEventData[FIELD_IDS.PRIMARY_CONTACT_NAME]);
    const cp = asString(selectedEventData[FIELD_IDS.PRIMARY_CONTACT_PHONE]);

    setFirstName(fn); setLastName(ln); setBusinessName(bn);
    setPhone(ph); setEmail(em); setStreet(st); setCity(ci); setStateVal(sa); setZip(zp);
    setContactName(cn); setContactPhone(cp);

    // Infer business: explicit BUSINESS_NAME, or delivery, or first name looks like company (last name empty/placeholder)
    const fullName = `${fn} ${ln}`.trim();
    const lastLooksPlaceholder = !ln || ln.trim() === "" || ln === "Last";
    const inferredType: ClientType =
      bn ? "business"
      : isDelivery ? "business"
      : fn?.trim() && lastLooksPlaceholder ? "business"
      : "individual";
    if (inferredType === "business" && !bn?.trim() && fn?.trim()) {
      setBusinessName(fn.trim());
    }
    setClientType(inferredType);
    setShowContact(!!(cn?.trim() && cn !== fullName && cn !== fn));
    setShowAddress(!!(st || ci || sa || zp));
    setShowFormFields(!!(fn?.trim() || ln?.trim() || bn?.trim()));
  }, [selectedEventId, selectedEventData, isDelivery]);

  const save = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
    setIntakeDirty(false);
  };

  const handleContactOff = async () => {
    setShowContact(false);
    const fullName = clientType === "business" ? businessName : `${firstName} ${lastName}`.trim();
    setContactName(fullName);
    setContactPhone(phone);
    if (selectedEventId) {
      await setFields(selectedEventId, {
        [FIELD_IDS.PRIMARY_CONTACT_NAME]: fullName,
        [FIELD_IDS.PRIMARY_CONTACT_PHONE]: phone,
      });
    }
  };

  const collapsedSummary = useMemo(() => {
    const name = clientType === "business"
      ? businessName
      : [firstName, lastName].filter(Boolean).join(" ");
    const parts = [name, phone].filter(Boolean);
    return parts.length ? parts.join("  ·  ") : undefined;
  }, [clientType, businessName, firstName, lastName, phone]);

  const dividerStyle: React.CSSProperties = {
    gridColumn: "1 / -1",
    borderTop: "1px solid #2a2a2a",
    marginTop: 2,
    paddingTop: 10,
  };

  return (
    <FormSection title="Client & Contact" subtitle={collapsedSummary} isDelivery={isDelivery} sectionId="beo-section-client" defaultOpen={false}>

      {/* ── Pills: Individual | Business | Contact (contact = different day-of person) ── */}
      <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid #222" }}>
        <button
          style={clientType === "individual" ? pillActive : pillInactive}
          onClick={() => { setClientType("individual"); setShowFormFields(true); }}
        >
          Individual
        </button>
        <button
          style={clientType === "business" ? pillActive : pillInactive}
          onClick={() => { setClientType("business"); setShowFormFields(true); }}
        >
          Business
        </button>
        <button
          style={showContact ? pillActive : pillInactive}
          onClick={() => {
            if (showContact) handleContactOff();
            else setShowContact(true);
          }}
        >
          Contact
        </button>
      </div>

      {/* Form fields only after user has picked Individual or Business */}
      {showFormFields && (
      <>
      {/* ── Business Name — full width ── */}
      {clientType === "business" && (
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={compactLabelStyle}>Business / Company Name *</label>
          <input
            type="text"
            value={businessName}
            disabled={!canEdit}
            onChange={(e) => { setBusinessName(e.target.value); setIntakeDirty(true); }}
            onBlur={(e) => save(FIELD_IDS.BUSINESS_NAME, e.target.value)}
            style={{ ...compactInputStyle, fontWeight: 600 }}
            placeholder="e.g. Moorestown Public Schools"
            autoFocus={!businessName}
          />
        </div>
      )}

      {/* ── Main contact row: First | Last | Phone | Email (individual) or Phone | Email (business) ── */}
      <div
        style={{
          gridColumn: "1 / -1",
          display: "grid",
          gridTemplateColumns: clientType === "individual"
            ? "minmax(72px, 1fr) minmax(72px, 1fr) minmax(90px, 1.1fr) minmax(100px, 1.4fr)"
            : "minmax(120px, 1fr) minmax(140px, 1.4fr)",
          gap: 8,
          alignItems: "end",
        }}
      >
        {clientType === "individual" && (
          <>
            <div>
              <label style={compactLabelStyle}>First Name *</label>
              <input
                type="text"
                value={firstName}
                disabled={!canEdit}
                onChange={(e) => { setFirstName(e.target.value); setIntakeDirty(true); }}
                onBlur={async (e) => {
                  await save(FIELD_IDS.CLIENT_FIRST_NAME, e.target.value);
                  if (!showContact) {
                    const full = `${e.target.value} ${lastName}`.trim();
                    setContactName(full);
                    await save(FIELD_IDS.PRIMARY_CONTACT_NAME, full);
                  }
                }}
                style={compactInputStyle}
                placeholder="First"
              />
            </div>
            <div>
              <label style={compactLabelStyle}>Last Name *</label>
              <input
                type="text"
                value={lastName}
                disabled={!canEdit}
                onChange={(e) => { setLastName(e.target.value); setIntakeDirty(true); }}
                onBlur={async (e) => {
                  await save(FIELD_IDS.CLIENT_LAST_NAME, e.target.value);
                  if (!showContact) {
                    const full = `${firstName} ${e.target.value}`.trim();
                    setContactName(full);
                    await save(FIELD_IDS.PRIMARY_CONTACT_NAME, full);
                  }
                }}
                style={compactInputStyle}
                placeholder="Last"
              />
            </div>
          </>
        )}
        <div>
          <label style={compactLabelStyle}>{clientType === "business" ? "Main Phone" : "Phone *"}</label>
          <input
            type="tel"
            value={phone}
            disabled={!canEdit}
            onChange={(e) => { setPhone(e.target.value); setIntakeDirty(true); }}
            onBlur={async (e) => {
              await save(FIELD_IDS.CLIENT_PHONE, e.target.value);
              if (!showContact) {
                setContactPhone(e.target.value);
                await save(FIELD_IDS.PRIMARY_CONTACT_PHONE, e.target.value);
              }
            }}
            style={compactInputStyle}
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <label style={compactLabelStyle}>Email</label>
          <input
            type="email"
            value={email}
            disabled={!canEdit}
            onChange={(e) => { setEmail(e.target.value); setIntakeDirty(true); }}
            onBlur={(e) => save(FIELD_IDS.CLIENT_EMAIL, e.target.value)}
            style={compactInputStyle}
            placeholder="email@example.com"
          />
        </div>
      </div>

      {/* ── Contact (day-of contact when different from client) ── */}
      {showContact && (
        <div style={dividerStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(100px, 0.6fr)", gap: 8, alignItems: "end" }}>
            <div>
              <label style={{ ...compactLabelStyle, color: "#f59e0b" }}>
                {clientType === "business" ? "Contact Person *" : "Day-of Contact Name *"}
              </label>
              <input
                type="text"
                value={contactName}
                disabled={!canEdit}
                onChange={(e) => { setContactName(e.target.value); setIntakeDirty(true); }}
                onBlur={(e) => save(FIELD_IDS.PRIMARY_CONTACT_NAME, e.target.value)}
                style={compactInputStyle}
                placeholder={clientType === "business" ? "Who to call" : "Venue coordinator…"}
              />
              {clientType === "individual" && (
                <Helper>Person on-site day-of — not the client.</Helper>
              )}
            </div>
            <div>
              <label style={{ ...compactLabelStyle, color: "#f59e0b" }}>
                {clientType === "business" ? "Contact Phone *" : "Day-of Phone *"}
              </label>
              <input
                type="tel"
                value={contactPhone}
                disabled={!canEdit}
                onChange={(e) => { setContactPhone(e.target.value); setIntakeDirty(true); }}
                onBlur={(e) => save(FIELD_IDS.PRIMARY_CONTACT_PHONE, e.target.value)}
                style={compactInputStyle}
                placeholder="(555) 555-5555"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Address (under Individual = client home; under Business = business address; delivery = delivery address) ── */}
      <div style={dividerStyle}>
        {isDelivery ? (
          <>
            <label style={compactLabelStyle}>Delivery address *</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(80px, 0.5fr) minmax(44px, 0.25fr) minmax(64px, 0.3fr)", gap: 8, marginTop: 4 }}>
              <input
                type="text"
                value={street}
                disabled={!canEdit}
                onChange={(e) => { setStreet(e.target.value); setIntakeDirty(true); }}
                onBlur={(e) => save(FIELD_IDS.CLIENT_STREET, e.target.value)}
                style={compactInputStyle}
                placeholder="Street"
              />
              <input
                type="text"
                value={city}
                disabled={!canEdit}
                onChange={(e) => { setCity(e.target.value); setIntakeDirty(true); }}
                onBlur={(e) => save(FIELD_IDS.CLIENT_CITY, e.target.value)}
                style={compactInputStyle}
                placeholder="City"
              />
              <input
                type="text"
                value={stateVal}
                disabled={!canEdit}
                onChange={(e) => { setStateVal(e.target.value); setIntakeDirty(true); }}
                onBlur={(e) => save(FIELD_IDS.CLIENT_STATE, e.target.value)}
                style={compactInputStyle}
                placeholder="St"
              />
              <input
                type="text"
                value={zip}
                disabled={!canEdit}
                onChange={(e) => { setZip(e.target.value); setIntakeDirty(true); }}
                onBlur={(e) => save(FIELD_IDS.CLIENT_ZIP, e.target.value)}
                style={compactInputStyle}
                placeholder="ZIP"
              />
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowAddress(!showAddress)}
              style={{
                background: "none",
                border: "none",
                color: "#555",
                fontSize: 11,
                cursor: "pointer",
                padding: "2px 0",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>{showAddress ? "▾" : "▸"}</span>
              <span style={{ color: "#666" }}>
                {showAddress ? "Hide" : "+ Add"} {clientType === "business" ? "business" : "client"} address
              </span>
            </button>
            {showAddress && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(80px, 0.5fr) minmax(44px, 0.25fr) minmax(64px, 0.3fr)", gap: 8, marginTop: 6 }}>
                <input
                  type="text"
                  value={street}
                  disabled={!canEdit}
                  onChange={(e) => { setStreet(e.target.value); setIntakeDirty(true); }}
                  onBlur={(e) => save(FIELD_IDS.CLIENT_STREET, e.target.value)}
                  style={compactInputStyle}
                  placeholder="Street"
                />
                <input
                  type="text"
                  value={city}
                  disabled={!canEdit}
                  onChange={(e) => { setCity(e.target.value); setIntakeDirty(true); }}
                  onBlur={(e) => save(FIELD_IDS.CLIENT_CITY, e.target.value)}
                  style={compactInputStyle}
                  placeholder="City"
                />
                <input
                  type="text"
                  value={stateVal}
                  disabled={!canEdit}
                  onChange={(e) => { setStateVal(e.target.value); setIntakeDirty(true); }}
                  onBlur={(e) => save(FIELD_IDS.CLIENT_STATE, e.target.value)}
                  style={compactInputStyle}
                  placeholder="St"
                />
                <input
                  type="text"
                  value={zip}
                  disabled={!canEdit}
                  onChange={(e) => { setZip(e.target.value); setIntakeDirty(true); }}
                  onBlur={(e) => save(FIELD_IDS.CLIENT_ZIP, e.target.value)}
                  style={compactInputStyle}
                  placeholder="ZIP"
                />
              </div>
            )}
          </>
        )}
      </div>

      </>
      )}

    </FormSection>
  );
};
