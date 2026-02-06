import { useEffect, useState } from "react";
import { FIELD_IDS, type BeoPrintDetails } from "../../services/airtable/events";
import { asString } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

const emptyDetails: BeoPrintDetails = {
  printEventHeader: "",
  printEventDetails: "",
  printClientBlock: "",
  printAddressBlock: "",
};

export const BeoPrintPanel = () => {
  const { selectedEventId, selectedEventData } = useEventStore();
  const [details, setDetails] = useState<BeoPrintDetails>(emptyDetails);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails(emptyDetails);
      return;
    }
    setIsLoading(false);
    setError(null);
    setDetails({
      printEventHeader: asString(selectedEventData[FIELD_IDS.PRINT_EVENT_HEADER]),
      printEventDetails: asString(selectedEventData[FIELD_IDS.PRINT_EVENT_DETAILS]),
      printClientBlock: asString(selectedEventData[FIELD_IDS.PRINT_CLIENT_BLOCK]),
      printAddressBlock: asString(selectedEventData[FIELD_IDS.PRINT_ADDRESS_BLOCK]),
    });
  }, [selectedEventId, selectedEventData]);

  return (
    <section className="bg-gray-900 border-2 border-gray-800 rounded-xl p-5 mb-3 hover:border-red-600 transition-all shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3">
          <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">▶ BEO Print — Page 1 Core</h2>
        </button>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {isOpen ? (
        <>
          {error ? <div className="text-sm text-red-400 mb-4">{error}</div> : null}
          <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Print – Event Header</label>
          <textarea
            rows={3}
            value={details.printEventHeader}
            disabled
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-500 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Print – Event Details</label>
          <textarea
            rows={4}
            value={details.printEventDetails}
            disabled
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-500 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Print – Client Block</label>
          <textarea
            rows={3}
            value={details.printClientBlock}
            disabled
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-500 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Print – Address Block</label>
          <textarea
            rows={3}
            value={details.printAddressBlock}
            disabled
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-500 px-3 py-2"
          />
        </div>
          </div>
        </>
      ) : null}
    </section>
  );
};
