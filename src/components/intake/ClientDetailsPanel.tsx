import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS, type ClientDetails } from "../../services/airtable/events";
import { asSingleSelectName, asString } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

const ROLE_OPTIONS = [
  "Planner",
  "Venue Manager",
  "Mother of Bride",
  "Father of Groom",
  "Client Rep",
  "Other",
];

const emptyDetails: ClientDetails = {
  clientFirstName: "",
  clientLastName: "",
  clientEmail: "",
  clientPhone: "",
  primaryContactName: "",
  primaryContactPhone: "",
  primaryContactRole: "",
};

export const ClientDetailsPanel = () => {
  const { selectedEventId, selectedEventData, setFields, saveError } = useEventStore();
  const [details, setDetails] = useState<ClientDetails>(emptyDetails);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails(emptyDetails);
      return;
    }
    setIsLoading(false);
    setError(null);
    setDetails({
      clientFirstName: asString(selectedEventData[FIELD_IDS.CLIENT_FIRST_NAME]),
      clientLastName: asString(selectedEventData[FIELD_IDS.CLIENT_LAST_NAME]),
      clientEmail: asString(selectedEventData[FIELD_IDS.CLIENT_EMAIL]),
      clientPhone: asString(selectedEventData[FIELD_IDS.CLIENT_PHONE]),
      primaryContactName: asString(selectedEventData[FIELD_IDS.PRIMARY_CONTACT_NAME]),
      primaryContactPhone: asString(selectedEventData[FIELD_IDS.PRIMARY_CONTACT_PHONE]),
      primaryContactRole: asSingleSelectName(selectedEventData[FIELD_IDS.PRIMARY_CONTACT_ROLE]),
    });
  }, [selectedEventId, selectedEventData]);

  useEffect(() => {
    if (saveError) {
      setError(saveError);
      setSaveSuccess(false);
    } else if (selectedEventId) {
      // Clear error when saveError is cleared (successful save)
      setError(null);
    }
  }, [saveError, selectedEventId]);

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const saveField = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    setError(null);
    setSaveSuccess(false);
    await setFields(selectedEventId, { [fieldId]: value });
    // Success feedback (saveError will be handled by useEffect)
    if (!saveError) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleChange = <K extends keyof ClientDetails>(key: K, value: ClientDetails[K]) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="border-2 border-red-600 rounded-xl p-5 mb-3 transition-all backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(30, 10, 10, 0.8), rgba(25, 10, 15, 0.6))', boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4), 0 0 20px rgba(204, 0, 0, 0.25), inset -2px -2px 8px rgba(0, 0, 0, 0.2), inset 2px 2px 8px rgba(255, 255, 255, 0.05)' }}>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3"
        >
          <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">▶ Client Details</h2>
        </button>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {isOpen ? (
        <>
          {error || saveError ? (
            <div className="text-sm text-red-400 mb-4">
              {error || saveError}
            </div>
          ) : null}
          {saveSuccess && !error && !saveError ? (
            <div className="text-sm text-green-400 mb-4">✓ Saved to Airtable</div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Client First Name</label>
          <input
            type="text"
            value={details.clientFirstName}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("clientFirstName", event.target.value);
              saveField(FIELD_IDS.CLIENT_FIRST_NAME, event.target.value);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Client Last Name</label>
          <input
            type="text"
            value={details.clientLastName}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("clientLastName", event.target.value);
              saveField(FIELD_IDS.CLIENT_LAST_NAME, event.target.value);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Client Email</label>
          <input
            type="email"
            value={details.clientEmail}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("clientEmail", event.target.value);
              saveField(FIELD_IDS.CLIENT_EMAIL, event.target.value);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Client Phone</label>
          <input
            type="tel"
            value={details.clientPhone}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("clientPhone", event.target.value);
              saveField(FIELD_IDS.CLIENT_PHONE, event.target.value);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Primary Contact Name</label>
          <input
            type="text"
            value={details.primaryContactName}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("primaryContactName", event.target.value);
              saveField(FIELD_IDS.PRIMARY_CONTACT_NAME, event.target.value);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Primary Contact Phone</label>
          <input
            type="tel"
            value={details.primaryContactPhone}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("primaryContactPhone", event.target.value);
              saveField(FIELD_IDS.PRIMARY_CONTACT_PHONE, event.target.value);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Primary Contact Role</label>
          <select
            value={details.primaryContactRole}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("primaryContactRole", event.target.value);
              saveField(FIELD_IDS.PRIMARY_CONTACT_ROLE, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          >
            <option value="">Select role</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
          </div>
        </>
      ) : null}
    </section>
  );
};
