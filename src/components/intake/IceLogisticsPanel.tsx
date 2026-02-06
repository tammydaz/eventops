import { useEffect, useMemo, useState } from "react";
import { asString, asBoolean } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

type IceLogisticsDetails = {
  iceNeeded: boolean;
  dryIceNeeded: boolean;
  shavedIceNeeded: boolean;
  iceQuantity: string;
  dryIceQuantity: string;
  coolerCount: string;
  shavedIceQuantity: string;
  iceVendor: string;
};

const emptyDetails: IceLogisticsDetails = {
  iceNeeded: false,
  dryIceNeeded: false,
  shavedIceNeeded: false,
  iceQuantity: "",
  dryIceQuantity: "",
  coolerCount: "",
  shavedIceQuantity: "",
  iceVendor: "",
};

export const IceLogisticsPanel = () => {
  const { selectedEventId, selectedEventData, setFields, saveError } = useEventStore();
  const [details, setDetails] = useState<IceLogisticsDetails>(emptyDetails);
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
      iceNeeded: asBoolean(selectedEventData["Ice Needed?"]),
      dryIceNeeded: asBoolean(selectedEventData["Dry Ice Needed?"]),
      shavedIceNeeded: asBoolean(selectedEventData["Shaved Ice Needed?"]),
      iceQuantity: selectedEventData["Ice Quantity"] !== undefined ? String(selectedEventData["Ice Quantity"]) : "",
      dryIceQuantity: selectedEventData["Dry Ice Quantity"] !== undefined ? String(selectedEventData["Dry Ice Quantity"]) : "",
      coolerCount: selectedEventData["Cooler Count"] !== undefined ? String(selectedEventData["Cooler Count"]) : "",
      shavedIceQuantity: selectedEventData["Shaved Ice Quantity"] !== undefined ? String(selectedEventData["Shaved Ice Quantity"]) : "",
      iceVendor: asString(selectedEventData["Ice Vendor"]),
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

  const handleChange = <K extends keyof IceLogisticsDetails>(key: K, value: IceLogisticsDetails[K]) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="bg-gray-900 border-2 border-gray-800 rounded-xl p-5 mb-3 hover:border-red-600 transition-all shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3">
          <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">▶ Ice & Logistics</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={details.iceNeeded}
                  disabled={!canEdit}
                  onChange={(event) => {
                    handleChange("iceNeeded", event.target.checked);
                    saveField("Ice Needed?", event.target.checked);
                  }}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-red-600 cursor-pointer"
                />
                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Ice Needed?
                </label>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Ice Quantity</label>
              <input
                type="number"
                value={details.iceQuantity}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("iceQuantity", event.target.value);
                  const numeric = event.target.value === "" ? null : Number(event.target.value);
                  saveField("Ice Quantity", Number.isNaN(numeric) ? null : numeric);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={details.dryIceNeeded}
                  disabled={!canEdit}
                  onChange={(event) => {
                    handleChange("dryIceNeeded", event.target.checked);
                    saveField("Dry Ice Needed?", event.target.checked);
                  }}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-red-600 cursor-pointer"
                />
                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Dry Ice Needed?
                </label>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Dry Ice Quantity</label>
              <input
                type="number"
                value={details.dryIceQuantity}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("dryIceQuantity", event.target.value);
                  const numeric = event.target.value === "" ? null : Number(event.target.value);
                  saveField("Dry Ice Quantity", Number.isNaN(numeric) ? null : numeric);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={details.shavedIceNeeded}
                  disabled={!canEdit}
                  onChange={(event) => {
                    handleChange("shavedIceNeeded", event.target.checked);
                    saveField("Shaved Ice Needed?", event.target.checked);
                  }}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-red-600 cursor-pointer"
                />
                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Shaved Ice Needed?
                </label>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Shaved Ice Quantity</label>
              <input
                type="number"
                value={details.shavedIceQuantity}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("shavedIceQuantity", event.target.value);
                  const numeric = event.target.value === "" ? null : Number(event.target.value);
                  saveField("Shaved Ice Quantity", Number.isNaN(numeric) ? null : numeric);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Cooler Count</label>
              <input
                type="number"
                value={details.coolerCount}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("coolerCount", event.target.value);
                  const numeric = event.target.value === "" ? null : Number(event.target.value);
                  saveField("Cooler Count", Number.isNaN(numeric) ? null : numeric);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Ice Vendor</label>
              <input
                type="text"
                value={details.iceVendor}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("iceVendor", event.target.value);
                  saveField("Ice Vendor", event.target.value);
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
