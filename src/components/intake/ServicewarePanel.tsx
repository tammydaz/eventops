import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS, type ServicewareDetails } from "../../services/airtable/events";
import { asSingleSelectName, asStringArray } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

const CHINA_PAPER_OPTIONS = [
  "In House China",
  "Rented China",
  "Client China",
  "Premium Paper",
  "Standard Paper",
  "Glassware – Water",
  "Glassware – Wine",
  "Glassware – Champagne",
  "Flatware – Full Set",
  "Flatware – Fork Only",
  "Flatware – Knife Only",
  "Flatware – Spoon Only",
];

const SERVICE_WARE_SOURCE_OPTIONS = ["FoodWerx", "Ocean", "Client"];
const PAPER_TYPE_OPTIONS = ["Premium", "Standard", "None"];

const emptyDetails: ServicewareDetails = {
  chinaPaperGlassware: [],
  serviceWareSource: "",
  bAndBs: "",
  largePlates: "",
  saladPlates: "",
  paperType: "",
};

export const ServicewarePanel = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<ServicewareDetails>(emptyDetails);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails(emptyDetails);
      return;
    }
    setIsLoading(false);
    setError(null);
    setDetails({
      chinaPaperGlassware: asStringArray(selectedEventData[FIELD_IDS.CHINA_PAPER_GLASSWARE]),
      serviceWareSource: asSingleSelectName(selectedEventData[FIELD_IDS.SERVICE_WARE_SOURCE_ALT]),
      bAndBs:
        selectedEventData[FIELD_IDS.BBS] !== undefined
          ? String(selectedEventData[FIELD_IDS.BBS])
          : "",
      largePlates:
        selectedEventData[FIELD_IDS.LARGE_PLATES] !== undefined
          ? String(selectedEventData[FIELD_IDS.LARGE_PLATES])
          : "",
      saladPlates:
        selectedEventData[FIELD_IDS.SALAD_PLATES] !== undefined
          ? String(selectedEventData[FIELD_IDS.SALAD_PLATES])
          : "",
      paperType: asSingleSelectName(selectedEventData[FIELD_IDS.PAPER_TYPE]),
    });
  }, [selectedEventId, selectedEventData]);

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const toggleOption = async (value: string) => {
    if (!selectedEventId) return;
    const next = details.chinaPaperGlassware.includes(value)
      ? details.chinaPaperGlassware.filter((item) => item !== value)
      : [...details.chinaPaperGlassware, value];
    setDetails((prev) => ({
      ...prev,
      chinaPaperGlassware: next,
    }));

    await setFields(selectedEventId, { [FIELD_IDS.CHINA_PAPER_GLASSWARE]: next });
  };

  const saveSelect = async (key: keyof ServicewareDetails, value: string) => {
    if (!selectedEventId) return;
    setDetails((prev) => ({ ...prev, [key]: value }));
    const fieldMap: Record<keyof ServicewareDetails, string> = {
      chinaPaperGlassware: FIELD_IDS.CHINA_PAPER_GLASSWARE,
      serviceWareSource: FIELD_IDS.SERVICE_WARE_SOURCE_ALT,
      bAndBs: FIELD_IDS.BBS,
      largePlates: FIELD_IDS.LARGE_PLATES,
      saladPlates: FIELD_IDS.SALAD_PLATES,
      paperType: FIELD_IDS.PAPER_TYPE,
    };
    const payload = key === "serviceWareSource" || key === "paperType" ? value || null : value;
    await setFields(selectedEventId, { [fieldMap[key]]: payload });
  };

  const saveNumber = async (key: keyof ServicewareDetails, value: string) => {
    if (!selectedEventId) return;
    setDetails((prev) => ({ ...prev, [key]: value }));
    const fieldMap: Record<keyof ServicewareDetails, string> = {
      chinaPaperGlassware: FIELD_IDS.CHINA_PAPER_GLASSWARE,
      serviceWareSource: FIELD_IDS.SERVICE_WARE_SOURCE_ALT,
      bAndBs: FIELD_IDS.BBS,
      largePlates: FIELD_IDS.LARGE_PLATES,
      saladPlates: FIELD_IDS.SALAD_PLATES,
      paperType: FIELD_IDS.PAPER_TYPE,
    };
    const numeric = value === "" ? null : Number(value);
    await setFields(selectedEventId, { [fieldMap[key]]: Number.isNaN(numeric) ? null : numeric });
  };

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left">
          <h2 className="text-lg font-bold text-red-500">Serviceware</h2>
        </button>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {isOpen ? (
        <>
          {error ? <div className="text-sm text-red-400 mb-4">{error}</div> : null}

          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search serviceware options..."
              className="w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
            />
          </div>

          <div className="space-y-6">
            <div className="border border-gray-800 rounded-lg p-4 bg-black">
              <div className="text-sm font-semibold text-gray-200 mb-3">China / Paper / Glassware</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {CHINA_PAPER_OPTIONS.filter((option) =>
                  searchTerm.trim()
                    ? option.toLowerCase().includes(searchTerm.toLowerCase())
                    : true
                ).map((option) => (
                  <label
                    key={option}
                    className={`flex items-center gap-2 text-sm text-gray-200 border border-gray-800 rounded-md px-3 py-2 cursor-pointer ${
                      details.chinaPaperGlassware.includes(option) ? "border-red-500" : "hover:border-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={details.chinaPaperGlassware.includes(option)}
                      disabled={!canEdit}
                      onChange={() => toggleOption(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400">Service Ware Source</label>
            <select
              value={details.serviceWareSource}
              disabled={!canEdit}
              onChange={(event) => saveSelect("serviceWareSource", event.target.value)}
              className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
            >
              <option value="">Select source</option>
              {SERVICE_WARE_SOURCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400">Paper Type</label>
            <select
              value={details.paperType}
              disabled={!canEdit}
              onChange={(event) => saveSelect("paperType", event.target.value)}
              className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
            >
              <option value="">Select paper type</option>
              {PAPER_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400">B&Bs</label>
            <input
              type="number"
              value={details.bAndBs}
              disabled={!canEdit}
              onChange={(event) => saveNumber("bAndBs", event.target.value)}
              className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400">Large Plates</label>
            <input
              type="number"
              value={details.largePlates}
              disabled={!canEdit}
              onChange={(event) => saveNumber("largePlates", event.target.value)}
              className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400">Salad Plates</label>
            <input
              type="number"
              value={details.saladPlates}
              disabled={!canEdit}
              onChange={(event) => saveNumber("saladPlates", event.target.value)}
              className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
            />
          </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
};
