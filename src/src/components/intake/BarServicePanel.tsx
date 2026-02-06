import { useEffect, useMemo, useState } from "react";
import { asSingleSelectName, asString } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

type BarServiceDetails = {
  barServiceNeeded: string;
  numberOfBars: string;
  barLocations: string;
  customBarNotes: string;
  signatureDrink: string;
  signatureDrinkName: string;
  signatureDrinkRecipe: string;
  whoSupplyingSignatureDrink: string;
  signatureDrinkMixers: string;
  signatureDrinkGarnishes: string;
};

const emptyDetails: BarServiceDetails = {
  barServiceNeeded: "",
  numberOfBars: "",
  barLocations: "",
  customBarNotes: "",
  signatureDrink: "",
  signatureDrinkName: "",
  signatureDrinkRecipe: "",
  whoSupplyingSignatureDrink: "",
  signatureDrinkMixers: "",
  signatureDrinkGarnishes: "",
};

const FULL_BAR_PACKAGE_ITEMS = `Sodas: Diet Coke, Coke, Sprite, Ginger Ale
Juices: Cranberry juice, Pineapple juice, Orange juice
Mixers: Club Soda, Tonic, Cranberry, Sour mix, Rose's Lime, Grenadine, Simple syrup
Garnishes: Olives, Cherries, Lemons, Limes, Oranges`;

const MIXERS_ONLY_ITEMS = `Mixers: Club Soda, Tonic, Cranberry, Sour mix, Rose's Lime, Grenadine, Simple syrup
Garnishes: Olives, Cherries, Lemons, Limes, Oranges`;

export const BarServicePanel = () => {
  const { selectedEventId, selectedEventData, setFields, saveError } = useEventStore();
  const [details, setDetails] = useState<BarServiceDetails>(emptyDetails);
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
      barServiceNeeded: asSingleSelectName(selectedEventData["fldXm91QjyvVKbiyO"]),
      numberOfBars: selectedEventData["fldWNzyvWhcXimh7N"] !== undefined ? String(selectedEventData["fldWNzyvWhcXimh7N"]) : "",
      barLocations: asString(selectedEventData["fldAYvAJ59FScw4LG"]),
      customBarNotes: asString(selectedEventData["fldDWl6ZzZqdaI7pN"]),
      signatureDrink: asSingleSelectName(selectedEventData["fldcry8vpUBY3fkHk"]),
      signatureDrinkName: asString(selectedEventData["fldZSIBTkzcEmG7bt"]),
      signatureDrinkRecipe: asString(selectedEventData["fld1sg6vQi7lziPDz"]),
      whoSupplyingSignatureDrink: asSingleSelectName(selectedEventData["fldoek1mpdi2ESyzu"]),
      signatureDrinkMixers: asString(selectedEventData["fldXL37gOon7wyQss"]),
      signatureDrinkGarnishes: asString(selectedEventData["flduv4RtRR0lLm4vY"]),
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

  const handleChange = <K extends keyof BarServiceDetails>(key: K, value: BarServiceDetails[K]) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="bg-gradient-to-r from-gray-900 to-black border-2 border-cyan-900 rounded-xl p-5 mb-3 hover:border-cyan-500 transition-all shadow-lg shadow-cyan-500/50">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3">
          <h2 className="text-lg font-black text-cyan-400 tracking-wider uppercase">▶ Bar Service</h2>
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
          <div className="space-y-4">
            {/* Bar Service Needed */}
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Bar Service Needed</label>
              <select
                value={details.barServiceNeeded}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("barServiceNeeded", event.target.value);
                  saveField("fldXm91QjyvVKbiyO", event.target.value || null);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              >
                <option value="">Select option</option>
                <option value="None">None</option>
                <option value="Full Bar Package">Full Bar Package</option>
                <option value="Foodwerx bartender only">Foodwerx bartender only</option>
                <option value="Foodwerx Mixers Only">Foodwerx Mixers Only</option>
              </select>
            </div>

            {/* Show Full Bar Package items */}
            {details.barServiceNeeded === "Full Bar Package" && (
              <div className="bg-gray-800 border border-red-600 rounded-md p-4">
                <p className="text-xs uppercase tracking-widest text-red-500 font-bold mb-2">Full Bar Package Includes:</p>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                  {FULL_BAR_PACKAGE_ITEMS}
                </pre>
              </div>
            )}

            {/* Show Mixers Only items */}
            {details.barServiceNeeded === "Foodwerx Mixers Only" && (
              <div className="bg-gray-800 border border-red-600 rounded-md p-4">
                <p className="text-xs uppercase tracking-widest text-red-500 font-bold mb-2">Mixers Only Package Includes:</p>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                  {MIXERS_ONLY_ITEMS}
                </pre>
              </div>
            )}

            {/* Show bar details if not None */}
            {details.barServiceNeeded && details.barServiceNeeded !== "None" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-400">Number of Bars</label>
                    <input
                      type="number"
                      value={details.numberOfBars}
                      disabled={!canEdit}
                      onChange={(event) => {
                        handleChange("numberOfBars", event.target.value);
                        const numeric = event.target.value === "" ? null : Number(event.target.value);
                        saveField("fldWNzyvWhcXimh7N", Number.isNaN(numeric) ? null : numeric);
                      }}
                      className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-400">Bar Locations</label>
                    <input
                      type="text"
                      value={details.barLocations}
                      disabled={!canEdit}
                      onChange={(event) => {
                        handleChange("barLocations", event.target.value);
                        saveField("fldAYvAJ59FScw4LG", event.target.value);
                      }}
                      className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400">Custom Bar Notes</label>
                  <textarea
                    rows={3}
                    value={details.customBarNotes}
                    disabled={!canEdit}
                    onChange={(event) => {
                      handleChange("customBarNotes", event.target.value);
                      saveField("fldDWl6ZzZqdaI7pN", event.target.value);
                    }}
                    className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                  />
                </div>
              </>
            )}

            {/* Signature Drink section */}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <label className="text-xs uppercase tracking-widest text-gray-400">Signature Drink?</label>
              <select
                value={details.signatureDrink}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("signatureDrink", event.target.value);
                  saveField("fldcry8vpUBY3fkHk", event.target.value || null);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              >
                <option value="">Select option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* Show signature drink fields if Yes */}
            {details.signatureDrink === "Yes" && (
              <>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400">Signature Drink Name</label>
                  <input
                    type="text"
                    value={details.signatureDrinkName}
                    disabled={!canEdit}
                    onChange={(event) => {
                      handleChange("signatureDrinkName", event.target.value);
                      saveField("fldZSIBTkzcEmG7bt", event.target.value);
                    }}
                    className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400">Signature Drink Recipe & Ingredients</label>
                  <textarea
                    rows={3}
                    value={details.signatureDrinkRecipe}
                    disabled={!canEdit}
                    onChange={(event) => {
                      handleChange("signatureDrinkRecipe", event.target.value);
                      saveField("fld1sg6vQi7lziPDz", event.target.value);
                    }}
                    className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400">Who's Supplying Signature Drink Mixers & Garnishes?</label>
                  <select
                    value={details.whoSupplyingSignatureDrink}
                    disabled={!canEdit}
                    onChange={(event) => {
                      handleChange("whoSupplyingSignatureDrink", event.target.value);
                      saveField("fldoek1mpdi2ESyzu", event.target.value || null);
                    }}
                    className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                  >
                    <option value="">Select option</option>
                    <option value="Foodwerx">Foodwerx</option>
                    <option value="Client">Client</option>
                  </select>
                </div>

                {/* Show mixers/garnishes fields if Foodwerx is supplying */}
                {details.whoSupplyingSignatureDrink === "Foodwerx" && (
                  <>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400">Signature Drink Mixers</label>
                      <input
                        type="text"
                        value={details.signatureDrinkMixers}
                        disabled={!canEdit}
                        onChange={(event) => {
                          handleChange("signatureDrinkMixers", event.target.value);
                          saveField("fldXL37gOon7wyQss", event.target.value);
                        }}
                        className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                        placeholder="Enter mixers needed..."
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400">Signature Drink Garnishes</label>
                      <input
                        type="text"
                        value={details.signatureDrinkGarnishes}
                        disabled={!canEdit}
                        onChange={(event) => {
                          handleChange("signatureDrinkGarnishes", event.target.value);
                          saveField("flduv4RtRR0lLm4vY", event.target.value);
                        }}
                        className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                        placeholder="Enter garnishes needed..."
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
};
