import { useEffect, useMemo, useState } from "react";
import { asSingleSelectName, asString, asStringArray } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

type HotColdBeveragesDetails = {
  coffeeServiceNeeded: string;
  coffeeServiceStyle: string;
  coffeeType: string[];
  creamSugarProvided: string;
  coffeeNotes: string;
  teaServiceNeeded: string;
  teaTypes: string[];
  hotOrIcedTea: string;
  teaNotes: string;
  infusedWaterNeeded: string;
  infusedWaterFlavors: string[];
  dispenserCount: string;
  infusedWaterNotes: string;
  iceTypeNeeded: string;
};

const emptyDetails: HotColdBeveragesDetails = {
  coffeeServiceNeeded: "",
  coffeeServiceStyle: "",
  coffeeType: [],
  creamSugarProvided: "",
  coffeeNotes: "",
  teaServiceNeeded: "",
  teaTypes: [],
  hotOrIcedTea: "",
  teaNotes: "",
  infusedWaterNeeded: "",
  infusedWaterFlavors: [],
  dispenserCount: "",
  infusedWaterNotes: "",
  iceTypeNeeded: "",
};

export const HotColdBeveragesPanel = () => {
  const { selectedEventId, selectedEventData, setFields, saveError } = useEventStore();
  const [details, setDetails] = useState<HotColdBeveragesDetails>(emptyDetails);
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
      coffeeServiceNeeded: asSingleSelectName(selectedEventData["fld568m"]),
      coffeeServiceStyle: asSingleSelectName(selectedEventData["fldzymzkA9Stfqc14"]),
      coffeeType: asStringArray(selectedEventData["fld605B"]),
      creamSugarProvided: asSingleSelectName(selectedEventData["fld606H"]),
      coffeeNotes: asString(selectedEventData["fldS0GdzMocn93Xjs"]),
      teaServiceNeeded: asSingleSelectName(selectedEventData["fld569s"]),
      teaTypes: asStringArray(selectedEventData["fld608T"]),
      hotOrIcedTea: asSingleSelectName(selectedEventData["fld609Z"]),
      teaNotes: asString(selectedEventData["fld610E"]),
      infusedWaterNeeded: asSingleSelectName(selectedEventData["fld570y"]),
      infusedWaterFlavors: asStringArray(selectedEventData["fldltlx9WVhm65MWW"]),
      dispenserCount: selectedEventData["fld612Q"] !== undefined ? String(selectedEventData["fld612Q"]) : "",
      infusedWaterNotes: asString(selectedEventData["fld613W"]),
      iceTypeNeeded: asSingleSelectName(selectedEventData["fldDNi5AdECt8oagy"]),
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

  const handleChange = <K extends keyof HotColdBeveragesDetails>(key: K, value: HotColdBeveragesDetails[K]) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="bg-gradient-to-r from-gray-900 to-black border-2 border-red-900 rounded-xl p-5 mb-3 hover:border-red-600 transition-all shadow-lg shadow-red-900/50">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3">
          <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">▶ Hot and Cold Beverages</h2>
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
          
          <div className="space-y-6">
            {/* COFFEE SERVICE */}
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-400">Coffee Service Needed</label>
                <select
                  value={details.coffeeServiceNeeded}
                  disabled={!canEdit}
                  onChange={(event) => {
                    handleChange("coffeeServiceNeeded", event.target.value);
                    saveField("fld568m", event.target.value || null);
                  }}
                  className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                >
                  <option value="">Select option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {details.coffeeServiceNeeded === "Yes" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400">Coffee Service Style</label>
                      <select
                        value={details.coffeeServiceStyle}
                        disabled={!canEdit}
                        onChange={(event) => {
                          handleChange("coffeeServiceStyle", event.target.value);
                          saveField("fldzymzkA9Stfqc14", event.target.value || null);
                        }}
                        className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                      >
                        <option value="">Select style</option>
                        <option value="Beverage Dispenser">Beverage Dispenser</option>
                        <option value="Traditional Carafe">Traditional Carafe</option>
                        <option value="Coffee Service Style">Coffee Service Style</option>
                        <option value="Urn">Urn</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400">Coffee Type (Multiple)</label>
                      <div className="mt-2 space-y-2">
                        {["Regular", "Decaf", "Both"].map(option => (
                          <div key={option} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={details.coffeeType.includes(option)}
                              disabled={!canEdit}
                              onChange={(event) => {
                                const newTypes = event.target.checked
                                  ? [...details.coffeeType, option]
                                  : details.coffeeType.filter(t => t !== option);
                                handleChange("coffeeType", newTypes);
                                saveField("fld605B", newTypes);
                              }}
                              className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-red-600 cursor-pointer"
                            />
                            <label className="text-sm text-gray-300">{option}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-400">Cream & Sugar Provided?</label>
                    <select
                      value={details.creamSugarProvided}
                      disabled={!canEdit}
                      onChange={(event) => {
                        handleChange("creamSugarProvided", event.target.value);
                        saveField("fld606H", event.target.value || null);
                      }}
                      className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                    >
                      <option value="">Select option</option>
                      <option value="Yes – Standard">Yes – Standard</option>
                      <option value="Yes – Premium (flavored creamers, raw sugar, etc.)">Yes – Premium (flavored creamers, raw sugar, etc.)</option>
                      <option value="No – Client Providing">No – Client Providing</option>
                      <option value="Cream & Sugar Provided?">Cream & Sugar Provided?</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-400">Coffee Notes</label>
                    <textarea
                      rows={2}
                      value={details.coffeeNotes}
                      disabled={!canEdit}
                      onChange={(event) => {
                        handleChange("coffeeNotes", event.target.value);
                        saveField("fldS0GdzMocn93Xjs", event.target.value);
                      }}
                      className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                    />
                  </div>
                </>
              )}
            </div>

            {/* TEA SERVICE */}
            <div className="border-t border-gray-700 pt-4 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-400">Tea Service Needed</label>
                <select
                  value={details.teaServiceNeeded}
                  disabled={!canEdit}
                  onChange={(event) => {
                    handleChange("teaServiceNeeded", event.target.value);
                    saveField("fld569s", event.target.value || null);
                  }}
                  className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                >
                  <option value="">Select option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {details.teaServiceNeeded === "Yes" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400">Tea Types (Multiple)</label>
                      <div className="mt-2 space-y-2">
                        {["Black", "Green", "Herbal", "Assorted", "Tea Types"].map(option => (
                          <div key={option} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={details.teaTypes.includes(option)}
                              disabled={!canEdit}
                              onChange={(event) => {
                                const newTypes = event.target.checked
                                  ? [...details.teaTypes, option]
                                  : details.teaTypes.filter(t => t !== option);
                                handleChange("teaTypes", newTypes);
                                saveField("fld608T", newTypes);
                              }}
                              className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-red-600 cursor-pointer"
                            />
                            <label className="text-sm text-gray-300">{option}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400">Hot or Iced Tea?</label>
                      <select
                        value={details.hotOrIcedTea}
                        disabled={!canEdit}
                        onChange={(event) => {
                          handleChange("hotOrIcedTea", event.target.value);
                          saveField("fld609Z", event.target.value || null);
                        }}
                        className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                      >
                        <option value="">Select option</option>
                        <option value="Hot">Hot</option>
                        <option value="Iced">Iced</option>
                        <option value="Both">Both</option>
                        <option value="Hot or Iced Tea?">Hot or Iced Tea?</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-400">Tea Notes</label>
                    <textarea
                      rows={2}
                      value={details.teaNotes}
                      disabled={!canEdit}
                      onChange={(event) => {
                        handleChange("teaNotes", event.target.value);
                        saveField("fld610E", event.target.value);
                      }}
                      className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                    />
                  </div>
                </>
              )}
            </div>

            {/* INFUSED WATER / HYDRATION STATION */}
            <div className="border-t border-gray-700 pt-4 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-400">Infused Water Needed</label>
                <select
                  value={details.infusedWaterNeeded}
                  disabled={!canEdit}
                  onChange={(event) => {
                    handleChange("infusedWaterNeeded", event.target.value);
                    saveField("fld570y", event.target.value || null);
                  }}
                  className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                >
                  <option value="">Select option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {details.infusedWaterNeeded === "Yes" && (
                <>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-400">Infused Water Flavors (Multiple)</label>
                    <div className="mt-2 space-y-2">
                      {["Cucumber Mint", "Lemon", "Berry Blend", "Citrus Mix", "Custom (see notes)"].map(option => (
                        <div key={option} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={details.infusedWaterFlavors.includes(option)}
                            disabled={!canEdit}
                            onChange={(event) => {
                              const newFlavors = event.target.checked
                                ? [...details.infusedWaterFlavors, option]
                                : details.infusedWaterFlavors.filter(f => f !== option);
                              handleChange("infusedWaterFlavors", newFlavors);
                              saveField("fldltlx9WVhm65MWW", newFlavors);
                            }}
                            className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-red-600 cursor-pointer"
                          />
                          <label className="text-sm text-gray-300">{option}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400">Dispenser Count</label>
                      <input
                        type="number"
                        value={details.dispenserCount}
                        disabled={!canEdit}
                        onChange={(event) => {
                          handleChange("dispenserCount", event.target.value);
                          const numeric = event.target.value === "" ? null : Number(event.target.value);
                          saveField("fld612Q", Number.isNaN(numeric) ? null : numeric);
                        }}
                        className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-400">Infused Water Notes</label>
                    <textarea
                      rows={2}
                      value={details.infusedWaterNotes}
                      disabled={!canEdit}
                      onChange={(event) => {
                        handleChange("infusedWaterNotes", event.target.value);
                        saveField("fld613W", event.target.value);
                      }}
                      className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
                    />
                  </div>
                </>
              )}
            </div>

            {/* ICE TYPE */}
            <div className="border-t border-gray-700 pt-4">
              <label className="text-xs uppercase tracking-widest text-gray-400">Ice Type Needed</label>
              <select
                value={details.iceTypeNeeded}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("iceTypeNeeded", event.target.value);
                  saveField("fldDNi5AdECt8oagy", event.target.value || null);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              >
                <option value="">Select option</option>
                <option value="None">None</option>
                <option value="Cubed">Cubed</option>
                <option value="Shaved">Shaved</option>
                <option value="Both">Both</option>
                <option value="Dry Ice">Dry Ice</option>
              </select>
              
              {(details.iceTypeNeeded === "Dry Ice" || details.iceTypeNeeded === "Shaved") && (
                <div className="mt-3 bg-blue-900 border border-blue-600 rounded-md p-3 text-xs text-blue-200">
                  <p className="font-bold">📝 REMINDER: Notify Matt about {details.iceTypeNeeded} needed for this event!</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
};
