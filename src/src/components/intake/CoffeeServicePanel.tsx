import { useEffect, useState } from "react";
import { FIELD_IDS, type CoffeeServiceDetails } from "../../services/airtable/events";
import { asBoolean } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

const emptyDetails: CoffeeServiceDetails = {
  coffeeServiceNeeded: false,
};

export const CoffeeServicePanel = () => {
  const { selectedEventId, selectedEventData, setField } = useEventStore();
  const [details, setDetails] = useState<CoffeeServiceDetails>(emptyDetails);
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
    const needed = asBoolean(selectedEventData[FIELD_IDS.COFFEE_SERVICE_NEEDED]);
    setDetails({
      coffeeServiceNeeded: needed,
    });
    setIsOpen(needed);
  }, [selectedEventId, selectedEventData]);


  const toggle = async (value: boolean) => {
    if (!selectedEventId) return;
    setDetails({ coffeeServiceNeeded: value });
    setIsOpen(value);
    await setField(selectedEventId, FIELD_IDS.COFFEE_SERVICE_NEEDED, value);
  };

  return (
    <section className="bg-gray-900 border-2 border-gray-800 rounded-xl p-5 mb-3 hover:border-red-600 transition-all shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">▶ Coffee Service</h2>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {error ? <div className="text-sm text-red-400 mb-4">{error}</div> : null}
      <div className="flex items-center gap-3">
        <input
          id="coffee-service-needed"
          type="checkbox"
          checked={details.coffeeServiceNeeded}
          disabled={!selectedEventId || isLoading}
          onChange={(event) => toggle(event.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="coffee-service-needed" className="text-xs uppercase tracking-widest text-gray-400">
          Coffee Service Needed
        </label>
      </div>
      {isOpen ? (
        <div className="mt-4 text-sm text-gray-300">
          Coffee service is enabled for this event.
        </div>
      ) : null}
    </section>
  );
};
