import { useEffect, useMemo, useState } from "react";
import { asString, asSingleSelectName } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

type ServicewareDetails = {
  whoSupplyingServiceware: string;
  servicewareType: string;
  dinnerPlatesQty: string;
  saladPlatesQty: string;
  dinnerForksQty: string;
  saladForksQty: string;
  knivesQty: string;
  servicewareNotes: string;
  rentalNotes: string;
};

const emptyDetails: ServicewareDetails = {
  whoSupplyingServiceware: "",
  servicewareType: "",
  dinnerPlatesQty: "",
  saladPlatesQty: "",
  dinnerForksQty: "",
  saladForksQty: "",
  knivesQty: "",
  servicewareNotes: "",
  rentalNotes: "",
};

const PREMIUM_PAPER_ITEMS = `Small Plates
Large Plates
Forks
Knives
Spoons`;

const STANDARD_PAPER_ITEMS = `Small Plates
Large Plates
Forks
Knives
Spoons`;

export const ServicewareNewPanel = () => {
  const { selectedEventId, selectedEventData, setFields, saveError } = useEventStore();
  const [details, setDetails] = useState<ServicewareDetails>(emptyDetails);
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
      whoSupplyingServiceware: asSingleSelectName(selectedEventData["Who Supplying Serviceware"]),
      servicewareType: asSingleSelectName(selectedEventData["Serviceware Type"]),
      dinnerPlatesQty: selectedEventData["Dinner Plates Qty"] !== undefined ? String(selectedEventData["Dinner Plates Qty"]) : "",
      saladPlatesQty: selectedEventData["Salad Plates Qty"] !== undefined ? String(selectedEventData["Salad Plates Qty"]) : "",
      dinnerForksQty: selectedEventData["Dinner Forks Qty"] !== undefined ? String(selectedEventData["Dinner Forks Qty"]) : "",
      saladForksQty: selectedEventData["Salad Forks Qty"] !== undefined ? String(selectedEventData["Salad Forks Qty"]) : "",
      knivesQty: selectedEventData["Knives Qty"] !== undefined ? String(selectedEventData["Knives Qty"]) : "",
      servicewareNotes: asString(selectedEventData["fldonFS1hhN5VYwA9"]),
      rentalNotes: asString(selectedEventData["Rental Serviceware Notes"]),
    });
  }, [selectedEventId, selectedEventData]);

  useEffect(() => {
    if (saveError) {
      setError(saveError);
      setSaveSuccess(false);
    } else if (selectedEventId) {
      setError(null);
    }
  }, [saveError, selectedEventId]);

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const saveField = async (fieldName: string, value: unknown) => {
    if (!selectedEventId) return;
    setError(null);
    setSaveSuccess(false);
    await setFields(selectedEventId, { [fieldName]: value });
    if (!saveError) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleChange = <K extends keyof ServicewareDetails>(key: K, value: ServicewareDetails[K]) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="bg-gradient-to-r from-gray-900 to-black border-2 border-cyan-900 rounded-xl p-5 mb-3 hover:border-cyan-500 transition-all shadow-lg shadow-cyan-500/50">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3">
          <h2 className="text-lg font-black text-cyan-400 tracking-wider uppercase">▶ Serviceware</h2>
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

          {/* Setup Reminders */}
          <div className="bg-yellow-900 border border-yellow-600 rounded-md p-3 mb-4 text-xs text-yellow-200">
            <p className="font-bold mb-1">⚠️ SETUP REMINDERS:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Add field "Who Supplying Serviceware" (Single Select: Foodwerx, Client, Rentals)</li>
              <li>Add field "Serviceware Type" (Single Select: Premium Paper Products, Standard Paper Products, China)</li>
              <li>Add field "Dinner Plates Qty" (Number)</li>
              <li>Add field "Salad Plates Qty" (Number)</li>
              <li>Add field "Dinner Forks Qty" (Number)</li>
              <li>Add field "Salad Forks Qty" (Number)</li>
              <li>Add field "Knives Qty" (Number)</li>
              <li>Add field "Rental Serviceware Notes" (Long Text)</li>
              <li>Set up automation: When "Rentals" selected → Email Ocean Rental</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            {/* Who's Supplying */}
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Who's Supplying Serviceware?</label>
              <select
                value={details.whoSupplyingServiceware}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("whoSupplyingServiceware", event.target.value);
                  saveField("Who Supplying Serviceware", event.target.value || null);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              >
                <option value="">Select option</option>
                <option value="Foodwerx">Foodwerx</option>
                <option value="Client">Client</option>
                <option value="Rentals">Rentals</option>
              </select>
            </div>

            {/* If Foodwerx - ask for type */}
            {details.whoSupplyingServiceware === "Foodwerx" && (
              <>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400">Serviceware Type</label>
                  <select
                    value={details.servicewareType}
                    disabled={!canEdit}
                    onChange={(event) => {
                      handleChange("servicewareType", event.target.value);
                      saveField("Serviceware Type", event.target.value || null);
                    }}
                    className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                  >
                    <option value="">Select type</option>
                    <option value="Premium Paper Products">Premium Paper Products</option>
                    <option value="Standard Paper Products">Standard Paper Products</option>
                    <option value="China">China</option>
                  </select>
                </div>

                {/* Premium Paper - show list */}
                {details.servicewareType === "Premium Paper Products" && (
                  <div className="bg-gray-800 border border-red-600 rounded-md p-4">
                    <p className="text-xs uppercase tracking-widest text-red-500 font-bold mb-2">Premium Paper Products Include:</p>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                      {PREMIUM_PAPER_ITEMS}
                    </pre>
                  </div>
                )}

                {/* Standard Paper - show list */}
                {details.servicewareType === "Standard Paper Products" && (
                  <div className="bg-gray-800 border border-red-600 rounded-md p-4">
                    <p className="text-xs uppercase tracking-widest text-red-500 font-bold mb-2">Standard Paper Products Include:</p>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                      {STANDARD_PAPER_ITEMS}
                    </pre>
                  </div>
                )}

                {/* China - show quantity fields */}
                {details.servicewareType === "China" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-800 border border-red-600 rounded-md p-4">
                    <div className="md:col-span-2">
                      <p className="text-xs uppercase tracking-widest text-red-500 font-bold mb-3">China Quantities:</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400">Dinner Plates</label>
                      <input
                        type="number"
                        value={details.dinnerPlatesQty}
                        disabled={!canEdit}
                        onChange={(event) => {
                          handleChange("dinnerPlatesQty", event.target.value);
                          const numeric = event.target.value === "" ? null : Number(event.target.value);
                          saveField("Dinner Plates Qty", Number.isNaN(numeric) ? null : numeric);
                        }}
                        className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400">Salad Plates</label>
                      <input
                        type="number"
                        value={details.saladPlatesQty}
                        disabled={!canEdit}
                        onChange={(event) => {
                          handleChange("saladPlatesQty", event.target.value);
                          const numeric = event.target.value === "" ? null : Number(event.target.value);
                          saveField("Salad Plates Qty", Number.isNaN(numeric) ? null : numeric);
                        }}
                        className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400">Dinner Forks</label>
                      <input
                        type="number"
                        value={details.dinnerForksQty}
                        disabled={!canEdit}
                        onChange={(event) => {
                          handleChange("dinnerForksQty", event.target.value);
                          const numeric = event.target.value === "" ? null : Number(event.target.value);
                          saveField("Dinner Forks Qty", Number.isNaN(numeric) ? null : numeric);
                        }}
                        className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400">Salad Forks</label>
                      <input
                        type="number"
                        value={details.saladForksQty}
                        disabled={!canEdit}
                        onChange={(event) => {
                          handleChange("saladForksQty", event.target.value);
                          const numeric = event.target.value === "" ? null : Number(event.target.value);
                          saveField("Salad Forks Qty", Number.isNaN(numeric) ? null : numeric);
                        }}
                        className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400">Knives</label>
                      <input
                        type="number"
                        value={details.knivesQty}
                        disabled={!canEdit}
                        onChange={(event) => {
                          handleChange("knivesQty", event.target.value);
                          const numeric = event.target.value === "" ? null : Number(event.target.value);
                          saveField("Knives Qty", Number.isNaN(numeric) ? null : numeric);
                        }}
                        className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* If Rentals - show notes and reminder */}
            {details.whoSupplyingServiceware === "Rentals" && (
              <>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400">Rental Serviceware Notes</label>
                  <textarea
                    rows={4}
                    value={details.rentalNotes}
                    disabled={!canEdit}
                    onChange={(event) => {
                      handleChange("rentalNotes", event.target.value);
                      saveField("Rental Serviceware Notes", event.target.value);
                    }}
                    className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                    placeholder="Enter rental details for Ocean Rental..."
                  />
                </div>
                
                <div className="bg-blue-900 border border-blue-600 rounded-md p-3 text-xs text-blue-200">
                  <p className="font-bold mb-1">📧 ACTION REQUIRED:</p>
                  <p>Set up automation in Airtable: When "Rentals" is selected → Email Ocean Rental with serviceware details</p>
                </div>
              </>
            )}

            {/* Serviceware Notes (always show) */}
            <div className="border-t border-gray-700 pt-4">
              <label className="text-xs uppercase tracking-widest text-gray-400">Serviceware Notes</label>
              <textarea
                rows={3}
                value={details.servicewareNotes}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("servicewareNotes", event.target.value);
                  saveField("fldonFS1hhN5VYwA9", event.target.value);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
};
