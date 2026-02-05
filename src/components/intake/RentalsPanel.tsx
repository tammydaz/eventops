import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS, type RentalsDetails } from "../../services/airtable/events";
import {
  loadRentalItems,
  loadRentals,
  loadServiceWare,
  type LinkedRecordItem,
} from "../../services/airtable/linkedRecords";
import { asLinkedRecordIds, asSingleSelectName, asString, isErrorResult } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

const SERVICE_WARE_SOURCE_OPTIONS = ["In House", "Rented", "Client"];

const emptyDetails: RentalsDetails = {
  rentals: [],
  rentalItems: [],
  rentalsNeeded: [],
  serviceWare: [],
  serviceWareSource: "",
  linensOverlaysNeeded: "",
};

type SectionConfig = {
  key: keyof RentalsDetails;
  label: string;
  source: "rentals" | "rentalItems" | "serviceWare";
};

const SECTIONS: SectionConfig[] = [
  { key: "rentals", label: "Rentals", source: "rentals" },
  { key: "rentalItems", label: "Rental Items", source: "rentalItems" },
  { key: "rentalsNeeded", label: "Rentals Needed", source: "rentals" },
  { key: "serviceWare", label: "Service Ware", source: "serviceWare" },
];

export const RentalsPanel = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [rentals, setRentals] = useState<LinkedRecordItem[]>([]);
  const [rentalItems, setRentalItems] = useState<LinkedRecordItem[]>([]);
  const [serviceWare, setServiceWare] = useState<LinkedRecordItem[]>([]);
  const [details, setDetails] = useState<RentalsDetails>(emptyDetails);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let active = true;
    const loadLists = async () => {
      try {
        const rentalsList = await loadRentals();
        if (isErrorResult(rentalsList)) {
          if (active) {
            setError(rentalsList.message ?? "Failed to load rentals.");
          }
          return;
        }
        const rentalItemsList = await loadRentalItems();
        if (isErrorResult(rentalItemsList)) {
          if (active) {
            setError(rentalItemsList.message ?? "Failed to load rental items.");
          }
          return;
        }
        const serviceWareList = await loadServiceWare();
        if (isErrorResult(serviceWareList)) {
          if (active) {
            setError(serviceWareList.message ?? "Failed to load service ware.");
          }
          return;
        }
        if (active) {
          setRentals(rentalsList);
          setRentalItems(rentalItemsList);
          setServiceWare(serviceWareList);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      }
    };

    loadLists();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails(emptyDetails);
      return;
    }
    setIsLoading(false);
    setError(null);
    setDetails({
      rentals: asLinkedRecordIds(selectedEventData[FIELD_IDS.RENTALS]),
      rentalItems: asLinkedRecordIds(selectedEventData[FIELD_IDS.RENTAL_ITEMS]),
      rentalsNeeded: asLinkedRecordIds(selectedEventData[FIELD_IDS.RENTALS_NEEDED]),
      serviceWare: asLinkedRecordIds(selectedEventData[FIELD_IDS.SERVICE_WARE]),
      serviceWareSource: asSingleSelectName(selectedEventData[FIELD_IDS.SERVICE_WARE_SOURCE]),
      linensOverlaysNeeded: asString(selectedEventData[FIELD_IDS.LINENS_OVERLAYS]),
    });
  }, [selectedEventId, selectedEventData]);

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const getOptions = (source: SectionConfig["source"]) => {
    if (source === "rentalItems") return rentalItems;
    if (source === "serviceWare") return serviceWare;
    return rentals;
  };

  const toggleSelection = async (key: keyof RentalsDetails, id: string) => {
    if (!selectedEventId) return;
    const current = details[key] as string[];
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    setDetails((prev) => ({
      ...prev,
      [key]: next,
    }));

    const fieldMap: Record<keyof RentalsDetails, string> = {
      rentals: FIELD_IDS.RENTALS,
      rentalItems: FIELD_IDS.RENTAL_ITEMS,
      rentalsNeeded: FIELD_IDS.RENTALS_NEEDED,
      serviceWare: FIELD_IDS.SERVICE_WARE,
      serviceWareSource: FIELD_IDS.SERVICE_WARE_SOURCE,
      linensOverlaysNeeded: FIELD_IDS.LINENS_OVERLAYS,
    };
    await setFields(selectedEventId, { [fieldMap[key]]: next });
  };

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left">
          <h2 className="text-lg font-bold text-red-500">Rentals & Equipment</h2>
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
              placeholder="Search rentals..."
              className="w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
            />
          </div>
          <div className="space-y-6">
            {SECTIONS.map((section) => {
              const options = getOptions(section.source);
              const selected = details[section.key] as string[];
              return (
                <div key={section.key} className="border border-gray-800 rounded-lg p-4 bg-black">
                  <div className="text-sm font-semibold text-gray-200 mb-3">{section.label}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {options
                      .filter((option) =>
                        searchTerm.trim()
                          ? option.name.toLowerCase().includes(searchTerm.toLowerCase())
                          : true
                      )
                      .map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-center gap-2 text-sm text-gray-200 border border-gray-800 rounded-md px-3 py-2 cursor-pointer ${
                            selected.includes(option.id) ? "border-red-500" : "hover:border-gray-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected.includes(option.id)}
                            disabled={!canEdit}
                            onChange={() => toggleSelection(section.key, option.id)}
                          />
                          <span>{option.name}</span>
                        </label>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Service Ware Source</label>
              <select
                value={details.serviceWareSource}
                disabled={!canEdit}
                onChange={(event) => {
                  const value = event.target.value;
                  setDetails((prev) => ({ ...prev, serviceWareSource: value }));
                  setFields(selectedEventId ?? "", { [FIELD_IDS.SERVICE_WARE_SOURCE]: value || null });
                }}
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
              <label className="text-xs uppercase tracking-widest text-gray-400">Linens / Overlays Needed</label>
              <textarea
                rows={3}
                value={details.linensOverlaysNeeded}
                disabled={!canEdit}
                onChange={(event) => {
                  setDetails((prev) => ({ ...prev, linensOverlaysNeeded: event.target.value }));
                  setFields(selectedEventId ?? "", { [FIELD_IDS.LINENS_OVERLAYS]: event.target.value });
                }}
                className="mt-2 w-full rounded-md bg-black border border-gray-700 text-gray-100 px-3 py-2"
              />
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
};
