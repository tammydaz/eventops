import { useEffect, useMemo, useState } from "react";
import { useEventStore } from "../../state/eventStore";

type ChinaGlasswareDetails = {
  chinaDinnerPlates: string;
  chinaSaladPlates: string;
  chinaDessertPlates: string;
  chinaDinnerForks: string;
  chinaSaladForks: string;
  chinaKnives: string;
  chinaSpoons: string;
  disposableGlassware: string;
  irishCoffeeMugs: string;
  champagneFlutes: string;
  wineGlasses: string;
};

const emptyDetails: ChinaGlasswareDetails = {
  chinaDinnerPlates: "",
  chinaSaladPlates: "",
  chinaDessertPlates: "",
  chinaDinnerForks: "",
  chinaSaladForks: "",
  chinaKnives: "",
  chinaSpoons: "",
  disposableGlassware: "",
  irishCoffeeMugs: "",
  champagneFlutes: "",
  wineGlasses: "",
};

export const ChinaGlasswarePanel = () => {
  const { selectedEventId, selectedEventData, setFields, saveError } = useEventStore();
  const [details, setDetails] = useState<ChinaGlasswareDetails>(emptyDetails);
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
      chinaDinnerPlates: selectedEventData["China Dinner Plates"] !== undefined ? String(selectedEventData["China Dinner Plates"]) : "",
      chinaSaladPlates: selectedEventData["China Salad Plates"] !== undefined ? String(selectedEventData["China Salad Plates"]) : "",
      chinaDessertPlates: selectedEventData["China Dessert Plates"] !== undefined ? String(selectedEventData["China Dessert Plates"]) : "",
      chinaDinnerForks: selectedEventData["China Dinner Forks"] !== undefined ? String(selectedEventData["China Dinner Forks"]) : "",
      chinaSaladForks: selectedEventData["China Salad Forks"] !== undefined ? String(selectedEventData["China Salad Forks"]) : "",
      chinaKnives: selectedEventData["China Knives"] !== undefined ? String(selectedEventData["China Knives"]) : "",
      chinaSpoons: selectedEventData["China Spoons"] !== undefined ? String(selectedEventData["China Spoons"]) : "",
      disposableGlassware: selectedEventData["Disposable Glassware"] !== undefined ? String(selectedEventData["Disposable Glassware"]) : "",
      irishCoffeeMugs: selectedEventData["Irish Coffee Mugs"] !== undefined ? String(selectedEventData["Irish Coffee Mugs"]) : "",
      champagneFlutes: selectedEventData["Champagne Flutes"] !== undefined ? String(selectedEventData["Champagne Flutes"]) : "",
      wineGlasses: selectedEventData["Wine Glasses"] !== undefined ? String(selectedEventData["Wine Glasses"]) : "",
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

  const handleChange = <K extends keyof ChinaGlasswareDetails>(key: K, value: ChinaGlasswareDetails[K]) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="bg-gray-900 border-2 border-gray-800 rounded-xl p-5 mb-3 hover:border-red-600 transition-all shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3">
          <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">▶ China & Glassware</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">China Dinner Plates</label>
              <input
                type="number"
                value={details.chinaDinnerPlates}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("chinaDinnerPlates", event.target.value);
                  const numeric = event.target.value === "" ? null : Number(event.target.value);
                  saveField("China Dinner Plates", Number.isNaN(numeric) ? null : numeric);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">China Salad Plates</label>
              <input
                type="number"
                value={details.chinaSaladPlates}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("chinaSaladPlates", event.target.value);
                  const numeric = event.target.value === "" ? null : Number(event.target.value);
                  saveField("China Salad Plates", Number.isNaN(numeric) ? null : numeric);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">China Dessert Plates</label>
              <input
                type="number"
                value={details.chinaDessertPlates}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("chinaDessertPlates", event.target.value);
                  const numeric = event.target.value === "" ? null : Number(event.target.value);
                  saveField("China Dessert Plates", Number.isNaN(numeric) ? null : numeric);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">China Dinner Forks</label>
              <input
                type="number"
                value={details.chinaDinnerForks}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("chinaDinnerForks", event.target.value);
                  const numeric = event.target.value === "" ? null : Number(event.target.value);
                  saveField("China Dinner Forks", Number.isNaN(numeric) ? null : numeric);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">China Salad Forks</label>
              <input
                type="number"
                value={details.chinaSaladForks}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("chinaSaladForks", event.target.value);
                  const numeric = event.target.value === "" ? null : Number(event.target.value);
                  saveField("China Salad Forks", Number.isNaN(numeric) ? null : numeric);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">China Knives</label>
              <input
                type="number"
                value={details.chinaKnives}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("chinaKnives", event.target.value);
                  const numeric = event.target.value === "" ? null : Number(event.target.value);
                  saveField("China Knives", Number.isNaN(numeric) ? null : numeric);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">China Spoons</label>
              <input
                type="number"
                value={details.chinaSpoons}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("chinaSpoons", event.target.value);
                  const numeric = event.target.value === "" ? null : Number(event.target.value);
                  saveField("China Spoons", Number.isNaN(numeric) ? null : numeric);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Disposable Glassware</label>
              <input
                type="number"
                value={details.disposableGlassware}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("disposableGlassware", event.target.value);
                  const numeric = event.target.value === "" ? null : Number(event.target.value);
                  saveField("Disposable Glassware", Number.isNaN(numeric) ? null : numeric);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Irish Coffee Mugs</label>
              <input
                type="number"
                value={details.irishCoffeeMugs}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("irishCoffeeMugs", event.target.value);
                  const numeric = event.target.value === "" ? null : Number(event.target.value);
                  saveField("Irish Coffee Mugs", Number.isNaN(numeric) ? null : numeric);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Champagne Flutes</label>
              <input
                type="number"
                value={details.champagneFlutes}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("champagneFlutes", event.target.value);
                  const numeric = event.target.value === "" ? null : Number(event.target.value);
                  saveField("Champagne Flutes", Number.isNaN(numeric) ? null : numeric);
                }}
                className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Wine Glasses</label>
              <input
                type="number"
                value={details.wineGlasses}
                disabled={!canEdit}
                onChange={(event) => {
                  handleChange("wineGlasses", event.target.value);
                  const numeric = event.target.value === "" ? null : Number(event.target.value);
                  saveField("Wine Glasses", Number.isNaN(numeric) ? null : numeric);
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
