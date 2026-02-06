import { useState } from "react";
import { getBeoPrintDetails } from "../../services/airtable";
import { useEventStore } from "../../state/eventStore";

export const ButtonsPanel = () => {
  const { selectedEventId } = useEventStore();
  const [beoPrint, setBeoPrint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateBEO = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    setError(null);
    try {
      const details = await getBeoPrintDetails(selectedEventId);
      setBeoPrint(details);
    } catch (e) {
      setError("Failed to load BEO Print details.");
      setBeoPrint(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gray-900 border-2 border-gray-800 rounded-xl p-5 mb-3 hover:border-red-600 transition-all shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">▶ Buttons & Actions</h2>
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded-md border border-red-500 text-red-400 bg-black hover:bg-gray-900"
        >
          Open URL
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-md border border-red-500 text-red-400 bg-black hover:bg-gray-900"
        >
          Open BEO
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-md border border-red-500 text-red-400 bg-black hover:bg-gray-900"
        >
          Open BEO Intake
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-md border border-green-500 text-green-400 bg-black hover:bg-gray-900"
          onClick={handleGenerateBEO}
          disabled={loading || !selectedEventId}
        >
          {loading ? "Generating..." : "Generate BEO Print"}
        </button>
      </div>
      {error && <div className="text-red-400 mt-2">{error}</div>}
      {beoPrint ? (
        <div className="mt-4 bg-gray-800 p-4 rounded">
          <div><strong>Event Header:</strong> {beoPrint.printEventHeader || <em>None</em>}</div>
          <div><strong>Event Details:</strong> {beoPrint.printEventDetails || <em>None</em>}</div>
          <div><strong>Client Block:</strong> {beoPrint.printClientBlock || <em>None</em>}</div>
          <div><strong>Address Block:</strong> {beoPrint.printAddressBlock || <em>None</em>}</div>
        </div>
      ) : beoPrint === null && !loading && (
        <div className="mt-4 text-gray-400">No BEO Print data loaded.</div>
      )}
      <p className="text-xs text-gray-500 mt-3">
        Airtable buttons are visual only in this UI.
      </p>
    </section>
  );
};
