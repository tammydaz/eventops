import { useEffect, useMemo, useState } from "react";
import { asSingleSelectName, asString, asStringArray } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

type GlasswareDetails = {
  glasswareSource: string;
  glasswareNotes: string;
  rentalGlasswareNotes: string;
  allPurposeGlassesNeeded: string;
  allPurposeGlassesQty: number;
  wineGlassesNeeded: string;
  wineGlassesQty: number;
  champagneFlutesNeeded: string;
  champagneFlutesQty: number;
};

const emptyDetails: GlasswareDetails = {
  glasswareSource: "",
  glasswareNotes: "",
  rentalGlasswareNotes: "",
  allPurposeGlassesNeeded: "",
  allPurposeGlassesQty: 0,
  wineGlassesNeeded: "",
  wineGlassesQty: 0,
  champagneFlutesNeeded: "",
  champagneFlutesQty: 0,
};

export const GlasswarePanel = () => {
  const { selectedEventId, selectedEventData, setFields, saveError } = useEventStore();
  const [details, setDetails] = useState<GlasswareDetails>(emptyDetails);
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
      glasswareSource: asSingleSelectName(selectedEventData["fldRmZRDADEfmdWfh"]),
      glasswareNotes: asString(selectedEventData["fldwrwnDPXcUcqwBF"]),
      rentalGlasswareNotes: asString(selectedEventData["Rental Glassware Notes"]),
      allPurposeGlassesNeeded: asSingleSelectName(selectedEventData["All-Purpose Glasses Needed"]),
      allPurposeGlassesQty: Number(selectedEventData["All-Purpose Glasses Qty"]) || 0,
      wineGlassesNeeded: asSingleSelectName(selectedEventData["fldeTuIQWzhnGGHF8"]),
      wineGlassesQty: Number(selectedEventData["Wine Glasses Qty"]) || 0,
      champagneFlutesNeeded: asSingleSelectName(selectedEventData["fldrziYkLGiUcKHbT"]),
      champagneFlutesQty: Number(selectedEventData["Champagne Flutes Qty"]) || 0,
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

  const saveField = async (fieldIdOrName: string, value: unknown) => {
    if (!selectedEventId) return;
    setError(null);
    setSaveSuccess(false);
    await setFields(selectedEventId, { [fieldIdOrName]: value });
    if (!saveError) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleChange = <K extends keyof GlasswareDetails>(key: K, value: GlasswareDetails[K]) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="bg-gradient-to-r from-gray-900 to-black border-2 border-red-900 rounded-xl p-5 mb-3 hover:border-red-600 transition-all shadow-lg shadow-red-900/50">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3">
          <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">▶ Glassware</h2>
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

          {/* Setup Reminder */}
          <div className="bg-yellow-900 border border-yellow-600 rounded-md p-3 mb-4 text-xs text-yellow-200">
            <p className="font-bold mb-1">⚠️ SETUP REMINDER:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Add field "Rental Glassware Notes" (Long Text) to Airtable Events table</li>
              <li>Add field "All-Purpose Glasses Needed" (Single Select: Yes/No) to Airtable Events table</li>
              <li>Add field "All-Purpose Glasses Qty" (Number) to Airtable Events table</li>
              <li>Add field "Wine Glasses Qty" (Number) to Airtable Events table</li>
              <li>Add field "Champagne Flutes Qty" (Number) to Airtable Events table</li>
              <li>Set up automation: When "Rental Company" selected → Email Ocean Rental with glassware details</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            {/* Who's Supplying Glassware */}
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Who's Supplying Glassware?</label>
              <select
                value={details.glasswareSource}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("glasswareSource", event.target.value);
                  saveField("fldRmZRDADEfmdWfh", event.target.value || null);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              >
                <option value="">Select option</option>
                <option value="FoodWerx">FoodWerx</option>
                <option value="Client Providing">Client Providing</option>
                <option value="Rental Company">Rental Company</option>
                <option value="Venue Providing">Venue Providing</option>
              </select>
            </div>

            {/* If Rental Company - show notes and reminder */}
            {details.glasswareSource === "Rental Company" && (
              <>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400">Rental Glassware Notes</label>
                  <textarea
                    rows={4}
                    value={details.rentalGlasswareNotes}
                    disabled={!canEdit}
                    onChange={(event) => {
                      handleChange("rentalGlasswareNotes", event.target.value);
                      saveField("Rental Glassware Notes", event.target.value);
                    }}
                    className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                    placeholder="Enter glassware rental details for Ocean Rental..."
                  />
                </div>
                
                <div className="bg-blue-900 border border-blue-600 rounded-md p-3 text-xs text-blue-200">
                  <p className="font-bold mb-1">📧 ACTION REQUIRED:</p>
                  <p>Set up automation in Airtable: When "Rental Company" is selected → Email Ocean Rental with glassware details</p>
                </div>
              </>
            )}

            {/* If FoodWerx - show glassware types and quantities */}
            {details.glasswareSource === "FoodWerx" && (
              <div className="space-y-4">
                {/* All-Purpose Glasses */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400">All-Purpose Glasses Needed</label>
                  <select
                    value={details.allPurposeGlassesNeeded}
                    disabled={!canEdit}
                    onChange={(event) => {
                      handleChange("allPurposeGlassesNeeded", event.target.value);
                      saveField("All-Purpose Glasses Needed", event.target.value || null);
                    }}
                    className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                  >
                    <option value="">Select option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* All-Purpose Glasses Quantity */}
                {details.allPurposeGlassesNeeded === "Yes" && (
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-400">All-Purpose Glasses Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={details.allPurposeGlassesQty || ""}
                      disabled={!canEdit}
                      onChange={(event) => {
                        const qty = Number(event.target.value);
                        handleChange("allPurposeGlassesQty", qty);
                        saveField("All-Purpose Glasses Qty", qty);
                      }}
                      className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                      placeholder="Enter quantity"
                    />
                  </div>
                )}

                {/* Wine Glasses */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400">Wine Glasses Needed</label>
                  <select
                    value={details.wineGlassesNeeded}
                    disabled={!canEdit}
                    onChange={(event) => {
                      handleChange("wineGlassesNeeded", event.target.value);
                      saveField("fldeTuIQWzhnGGHF8", event.target.value || null);
                    }}
                    className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                  >
                    <option value="">Select option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* Wine Glasses Quantity */}
                {details.wineGlassesNeeded === "Yes" && (
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-400">Wine Glasses Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={details.wineGlassesQty || ""}
                      disabled={!canEdit}
                      onChange={(event) => {
                        const qty = Number(event.target.value);
                        handleChange("wineGlassesQty", qty);
                        saveField("Wine Glasses Qty", qty);
                      }}
                      className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                      placeholder="Enter quantity"
                    />
                  </div>
                )}

                {/* Champagne Flutes */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400">Champagne Flutes Needed</label>
                  <select
                    value={details.champagneFlutesNeeded}
                    disabled={!canEdit}
                    onChange={(event) => {
                      handleChange("champagneFlutesNeeded", event.target.value);
                      saveField("fldrziYkLGiUcKHbT", event.target.value || null);
                    }}
                    className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                  >
                    <option value="">Select option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* Champagne Flutes Quantity */}
                {details.champagneFlutesNeeded === "Yes" && (
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-400">Champagne Flutes Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={details.champagneFlutesQty || ""}
                      disabled={!canEdit}
                      onChange={(event) => {
                        const qty = Number(event.target.value);
                        handleChange("champagneFlutesQty", qty);
                        saveField("Champagne Flutes Qty", qty);
                      }}
                      className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                      placeholder="Enter quantity"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Glassware Notes (always show) */}
            <div className="border-t border-gray-700 pt-4">
              <label className="text-xs uppercase tracking-widest text-gray-400">Glassware Notes</label>
              <textarea
                rows={3}
                value={details.glasswareNotes}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("glasswareNotes", event.target.value);
                  saveField("fldwrwnDPXcUcqwBF", event.target.value);
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
