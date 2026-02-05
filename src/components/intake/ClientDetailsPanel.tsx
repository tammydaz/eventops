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
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<ClientDetails>(emptyDetails);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

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

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const saveField = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const handleChange = <K extends keyof ClientDetails>(key: K, value: ClientDetails[K]) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-left"
        >
          <h2 className="text-lg font-bold text-red-500">Client Details</h2>
        </button>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {isOpen ? (
        <>
          {error ? <div className="text-sm text-red-400 mb-4">{error}</div> : null}
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
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
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
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
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
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
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
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
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
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
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
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
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
            className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
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
