import { useEffect, useState, useCallback, useRef } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS, getBarServiceFieldId, loadSingleSelectOptions, type SingleSelectOption } from "../../services/airtable/events";
import { asSingleSelectName, asString, asStringArray } from "../../services/airtable/selectors";
import { FormSection, CollapsibleSubsection } from "./FormSection";
import { HydrationStationModal } from "./HydrationStationModal";

const BAR_SERVICE_FALLBACK_OPTIONS = ["None", "Full Bar Package", "FoodWerx Bartender Only", "FoodWerx Mixers Only"];

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #444",
  backgroundColor: "#1a1a1a",
  color: "#e0e0e0",
  fontSize: "14px",
};

const labelStyle = {
  display: "block",
  fontSize: "11px",
  color: "#999",
  marginBottom: "6px",
  fontWeight: "600" as const,
};

type BeverageServicesSectionProps = { embedded?: boolean };

export const BeverageServicesSection = ({ embedded = false }: BeverageServicesSectionProps) => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();

  const [barServiceFieldId, setBarServiceFieldId] = useState<string | null>(null);
  const [barServiceOptions, setBarServiceOptions] = useState<string[]>(BAR_SERVICE_FALLBACK_OPTIONS);

  // Bar
  const [bar, setBar] = useState({
    barService: "",
    signatureDrinkYesNo: "",
    signatureDrinkName: "",
    signatureDrinkIngredients: "",
    signatureDrinkMixersSupplier: "",
    mixers: "",
    garnishes: "",
  });

  // Hydration
  const [hydrationProvided, setHydrationProvided] = useState<string>("");
  const [hydrationDrinkOptions, setHydrationDrinkOptions] = useState<string[]>([]);
  const [hydrationNotes, setHydrationNotes] = useState("");
  const [hydrationModalOpen, setHydrationModalOpen] = useState(false);

  // Coffee/Tea
  const [coffeeServiceNeeded, setCoffeeServiceNeeded] = useState("");
  const [coffeeMugType, setCoffeeMugType] = useState("");

  // Ice
  const [iceProvidedBy, setIceProvidedBy] = useState("");
  const [iceOptions, setIceOptions] = useState<string[]>([]);

  const skipLoadRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getBarServiceFieldId().then((fid) => {
      if (cancelled) return;
      setBarServiceFieldId(fid);
      if (fid) {
        loadSingleSelectOptions([fid]).then((result) => {
          if (cancelled || "error" in result) return;
          const opts = result[fid] ?? [];
          if (opts.length > 0) {
            setBarServiceOptions(opts.map((o: SingleSelectOption) => o.name));
          }
        });
      }
    });
    loadSingleSelectOptions([FIELD_IDS.ICE_PROVIDED_BY]).then((result) => {
      if (cancelled || "error" in result) return;
      const opts = result[FIELD_IDS.ICE_PROVIDED_BY] ?? [];
      if (opts.length > 0) {
        setIceOptions(opts.map((o: SingleSelectOption) => o.name));
      }
    });
    return () => { cancelled = true; };
  }, []);

  const loadFromStore = useCallback(() => {
    if (!selectedEventId || !selectedEventData) {
      setBar({ barService: "", signatureDrinkYesNo: "", signatureDrinkName: "", signatureDrinkIngredients: "", signatureDrinkMixersSupplier: "", mixers: "", garnishes: "" });
      setHydrationProvided("");
      setHydrationDrinkOptions([]);
      setHydrationNotes("");
      setCoffeeServiceNeeded("");
      setCoffeeMugType("");
      setIceProvidedBy("");
      return;
    }
    if (skipLoadRef.current) {
      skipLoadRef.current = false;
      return;
    }

    const d = selectedEventData;
    const barFid = barServiceFieldId ?? FIELD_IDS.BAR_SERVICE;
    setBar({
      barService: asSingleSelectName(d[barFid]),
      signatureDrinkYesNo: asSingleSelectName(d[FIELD_IDS.BAR_SIGNATURE_DRINK_YES_NO]),
      signatureDrinkName: asString(d[FIELD_IDS.BAR_SIGNATURE_DRINK_NAME]),
      signatureDrinkIngredients: asString(d[FIELD_IDS.BAR_SIGNATURE_DRINK_INGREDIENTS]),
      signatureDrinkMixersSupplier: asSingleSelectName(d[FIELD_IDS.BAR_SIGNATURE_DRINK_MIXERS_SUPPLIER]),
      mixers: asString(d[FIELD_IDS.BAR_MIXERS]),
      garnishes: asString(d[FIELD_IDS.BAR_GARNISHES]),
    });
    setHydrationProvided(asSingleSelectName(d[FIELD_IDS.HYDRATION_STATION_PROVIDED]));
    setHydrationDrinkOptions(asStringArray(d[FIELD_IDS.HYDRATION_STATION_DRINK_OPTIONS]));
    setHydrationNotes(asString(d[FIELD_IDS.HYDRATION_STATION_NOTES]));
    const rawCoffee = asString(d[FIELD_IDS.COFFEE_SERVICE_NEEDED]);
    setCoffeeServiceNeeded(rawCoffee === "Yes" || rawCoffee === "No" ? rawCoffee : "");
    setCoffeeMugType(asSingleSelectName(d[FIELD_IDS.COFFEE_MUG_TYPE]));
    setIceProvidedBy(asSingleSelectName(d[FIELD_IDS.ICE_PROVIDED_BY]));
  }, [selectedEventId, selectedEventData, barServiceFieldId]);

  useEffect(() => {
    loadFromStore();
  }, [loadFromStore]);

  const save = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!selectedEventId) return;
      skipLoadRef.current = true;
      // Skip COFFEE_MUG_TYPE if still placeholder (like carafes)
      const filtered = { ...patch };
      if (FIELD_IDS.COFFEE_MUG_TYPE === "fldCoffeeMugTypeTODO" && FIELD_IDS.COFFEE_MUG_TYPE in filtered) {
        delete filtered[FIELD_IDS.COFFEE_MUG_TYPE];
      }
      if (Object.keys(filtered).length > 0) {
        await setFields(selectedEventId, filtered);
      }
    },
    [selectedEventId, setFields]
  );

  const saveSingle = useCallback(
    (fid: string, val: unknown) => save({ [fid]: val }),
    [save]
  );

  const canEdit = Boolean(selectedEventId);

  const hasBarService = bar.barService.trim() !== "";
  const hasHydration = hydrationProvided === "Yes" || hydrationDrinkOptions.length > 0 || hydrationNotes.trim() !== "";
  const hasCoffeeTea = coffeeServiceNeeded === "Yes";
  const hasIce = iceProvidedBy.trim() !== "";

  const isFullBarPackage = bar.barService === "Full Bar Package";
  const hasSignatureDrinkYes = bar.signatureDrinkYesNo === "Yes";
  const isClientSupplying = /client/i.test(bar.signatureDrinkMixersSupplier || "");

  const handleWhoSuppliesChange = async (value: string) => {
    setBar((p) => ({ ...p, signatureDrinkMixersSupplier: value }));
    await saveSingle(FIELD_IDS.BAR_SIGNATURE_DRINK_MIXERS_SUPPLIER, value || null);
    if (/client/i.test(value)) {
      setBar((p) => ({ ...p, mixers: "CLIENT", garnishes: "CLIENT" }));
      await save({
        [FIELD_IDS.BAR_MIXERS]: "CLIENT",
        [FIELD_IDS.BAR_GARNISHES]: "CLIENT",
      });
    }
  };

  const content = (
    <>
      <CollapsibleSubsection
        title="Bar Service"
        icon="🍹"
        summary={hasBarService ? bar.barService : undefined}
        defaultOpen={hasBarService}
      >
        <div style={{ gridColumn: "1 / -1", maxWidth: 400 }}>
          <label style={labelStyle}>Bar Service Needed</label>
          <select
            value={bar.barService}
            disabled={!canEdit}
            onChange={(e) => {
              const v = e.target.value;
              setBar((p) => ({ ...p, barService: v }));
              saveSingle(barServiceFieldId ?? FIELD_IDS.BAR_SERVICE, v || null);
            }}
            style={inputStyle}
          >
            <option value="">Select...</option>
            {[...new Set([...barServiceOptions, bar.barService].filter(Boolean))].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {isFullBarPackage && (
          <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            <div>
              <label style={labelStyle}>Signature Drink?</label>
              <select
                value={bar.signatureDrinkYesNo}
                disabled={!canEdit}
                onChange={(e) => {
                  const v = e.target.value;
                  setBar((p) => ({ ...p, signatureDrinkYesNo: v }));
                  saveSingle(FIELD_IDS.BAR_SIGNATURE_DRINK_YES_NO, v || null);
                }}
                style={inputStyle}
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {hasSignatureDrinkYes && (
              <>
                <div>
                  <label style={labelStyle}>Who supplies signature drink mixers & garnishes</label>
                  <select
                    value={bar.signatureDrinkMixersSupplier}
                    disabled={!canEdit}
                    onChange={(e) => handleWhoSuppliesChange(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select...</option>
                    <option value="Foodwerx">Foodwerx</option>
                    <option value="Client">Client</option>
                  </select>
                </div>

                {bar.signatureDrinkMixersSupplier && (
                  <>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={labelStyle}>Signature Drink Name</label>
                      <input
                        type="text"
                        value={bar.signatureDrinkName}
                        disabled={!canEdit}
                        onChange={(e) => {
                          setBar((p) => ({ ...p, signatureDrinkName: e.target.value }));
                          saveSingle(FIELD_IDS.BAR_SIGNATURE_DRINK_NAME, e.target.value);
                        }}
                        style={inputStyle}
                        placeholder="e.g. Moscow Mule, Paloma"
                      />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={labelStyle}>Recipe & Ingredients</label>
                      <textarea
                        rows={3}
                        value={bar.signatureDrinkIngredients}
                        disabled={!canEdit}
                        onChange={(e) => {
                          setBar((p) => ({ ...p, signatureDrinkIngredients: e.target.value }));
                          saveSingle(FIELD_IDS.BAR_SIGNATURE_DRINK_INGREDIENTS, e.target.value);
                        }}
                        style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                        placeholder="Recipe, ingredients, instructions..."
                      />
                    </div>
                    {isClientSupplying ? (
                      <div style={{ gridColumn: "1 / -1", color: "#22c55e", fontSize: 13, padding: "8px 12px", borderRadius: 8, backgroundColor: "rgba(34,197,94,0.1)" }}>
                        Client supplying — mixers and garnishes set to CLIENT
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, gridColumn: "1 / -1" }}>
                        <div>
                          <label style={labelStyle}>Signature Drink Mixers</label>
                          <input
                            type="text"
                            value={bar.mixers}
                            disabled={!canEdit}
                            onChange={(e) => {
                              setBar((p) => ({ ...p, mixers: e.target.value }));
                              saveSingle(FIELD_IDS.BAR_MIXERS, e.target.value);
                            }}
                            style={inputStyle}
                            placeholder="e.g. Tonic, Ginger Beer"
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Signature Drink Garnishes</label>
                          <input
                            type="text"
                            value={bar.garnishes}
                            disabled={!canEdit}
                            onChange={(e) => {
                              setBar((p) => ({ ...p, garnishes: e.target.value }));
                              saveSingle(FIELD_IDS.BAR_GARNISHES, e.target.value);
                            }}
                            style={inputStyle}
                            placeholder="e.g. Limes, Mint, Olives"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </CollapsibleSubsection>

      <CollapsibleSubsection
        title="Hydration Station"
        icon="💧"
        summary={hasHydration ? [hydrationDrinkOptions.join(", "), hydrationNotes.trim()].filter(Boolean).join(" • ") || "Configured" : undefined}
        defaultOpen={hasHydration || hydrationProvided !== ""}
      >
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Hydration station provided?</label>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: canEdit ? "pointer" : "default" }}>
              <input
                type="radio"
                name="hydrationProvided"
                checked={hydrationProvided === "Yes"}
                disabled={!canEdit}
                onChange={() => {
                  setHydrationProvided("Yes");
                  saveSingle(FIELD_IDS.HYDRATION_STATION_PROVIDED, "Yes");
                  setHydrationModalOpen(true);
                }}
                style={{ accentColor: "#22c55e" }}
              />
              <span style={{ color: "#e0e0e0", fontSize: 14 }}>Yes</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: canEdit ? "pointer" : "default" }}>
              <input
                type="radio"
                name="hydrationProvided"
                checked={hydrationProvided === "No"}
                disabled={!canEdit}
                onChange={async () => {
                  setHydrationProvided("No");
                  setHydrationDrinkOptions([]);
                  setHydrationNotes("");
                  if (selectedEventId) {
                    await setFields(selectedEventId, {
                      [FIELD_IDS.HYDRATION_STATION_PROVIDED]: "No",
                      [FIELD_IDS.HYDRATION_STATION_DRINK_OPTIONS]: [],
                      [FIELD_IDS.HYDRATION_STATION_NOTES]: null,
                    });
                  }
                }}
                style={{ accentColor: "#22c55e" }}
              />
              <span style={{ color: "#e0e0e0", fontSize: 14 }}>No</span>
            </label>
          </div>
        </div>
        {hydrationProvided === "Yes" && (
          <div style={{ gridColumn: "1 / -1" }}>
            <button
              type="button"
              onClick={() => setHydrationModalOpen(true)}
              disabled={!canEdit}
              style={{
                marginTop: 12,
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid #22c55e",
                backgroundColor: "rgba(34,197,94,0.15)",
                color: "#22c55e",
                fontWeight: 600,
                fontSize: 13,
                cursor: canEdit ? "pointer" : "default",
                opacity: canEdit ? 1 : 0.6,
              }}
            >
              {hasHydration ? "Edit hydration options" : "Select hydration options"}
            </button>
            {hasHydration && (
              <div style={{ marginTop: 12, fontSize: 13, color: "#888" }}>
                {[hydrationDrinkOptions.join(", "), hydrationNotes.trim() && `Notes: ${hydrationNotes.trim()}`].filter(Boolean).join(" • ")}
              </div>
            )}
          </div>
        )}
        <HydrationStationModal
          isOpen={hydrationModalOpen}
          onClose={() => setHydrationModalOpen(false)}
          drinkOptionsSelected={hydrationDrinkOptions}
          notes={hydrationNotes}
          onSave={async (fid, val) => {
            await saveSingle(fid, val);
            if (fid === FIELD_IDS.HYDRATION_STATION_DRINK_OPTIONS) {
              setHydrationDrinkOptions(Array.isArray(val) ? val : []);
            } else if (fid === FIELD_IDS.HYDRATION_STATION_NOTES) {
              setHydrationNotes(val === null ? "" : String(val));
            }
          }}
          onDrinkOptionsChange={(opts) => setHydrationDrinkOptions(opts)}
          onNotesChange={(n) => setHydrationNotes(n)}
          canEdit={canEdit}
        />
      </CollapsibleSubsection>

      <CollapsibleSubsection
        title="Coffee / Tea Service"
        icon="☕"
        summary={hasCoffeeTea ? (coffeeMugType ? `${coffeeMugType} mugs` : "Yes") : undefined}
        defaultOpen={hasCoffeeTea}
      >
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Coffee service needed?</label>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: canEdit ? "pointer" : "default" }}>
              <input
                type="radio"
                name="coffeeNeeded"
                checked={coffeeServiceNeeded === "Yes"}
                disabled={!canEdit}
                onChange={() => {
                  setCoffeeServiceNeeded("Yes");
                  saveSingle(FIELD_IDS.COFFEE_SERVICE_NEEDED, "Yes");
                }}
                style={{ accentColor: "#22c55e" }}
              />
              <span style={{ color: "#e0e0e0", fontSize: 14 }}>Yes</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: canEdit ? "pointer" : "default" }}>
              <input
                type="radio"
                name="coffeeNeeded"
                checked={coffeeServiceNeeded === "No"}
                disabled={!canEdit}
                onChange={() => {
                  setCoffeeServiceNeeded("No");
                  setCoffeeMugType("");
                  save({
                    [FIELD_IDS.COFFEE_SERVICE_NEEDED]: "No",
                    ...(FIELD_IDS.COFFEE_MUG_TYPE !== "fldCoffeeMugTypeTODO" ? { [FIELD_IDS.COFFEE_MUG_TYPE]: null } : {}),
                  });
                }}
                style={{ accentColor: "#22c55e" }}
              />
              <span style={{ color: "#e0e0e0", fontSize: 14 }}>No</span>
            </label>
          </div>
        </div>
        {coffeeServiceNeeded === "Yes" && (
          <div style={{ marginTop: 16, maxWidth: 300 }}>
            <label style={labelStyle}>Mug type (for pack-out)</label>
            <select
              value={coffeeMugType}
              disabled={!canEdit}
              onChange={(e) => {
                const v = e.target.value;
                setCoffeeMugType(v);
                if (FIELD_IDS.COFFEE_MUG_TYPE !== "fldCoffeeMugTypeTODO") {
                  saveSingle(FIELD_IDS.COFFEE_MUG_TYPE, v || null);
                }
              }}
              style={inputStyle}
            >
              <option value="">Select...</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="Irish">Irish</option>
            </select>
            {FIELD_IDS.COFFEE_MUG_TYPE === "fldCoffeeMugTypeTODO" && (
              <div style={{ marginTop: 6, fontSize: 11, color: "#888" }}>Create Coffee Mug Type field in Airtable to persist</div>
            )}
          </div>
        )}
      </CollapsibleSubsection>

      <CollapsibleSubsection
        title="Ice"
        icon="🧊"
        summary={hasIce ? `Provided by ${iceProvidedBy}` : undefined}
        defaultOpen={hasIce}
      >
        <div style={{ gridColumn: "1 / -1", maxWidth: 400 }}>
          <label style={labelStyle}>Ice provided by</label>
          <select
            value={iceProvidedBy}
            disabled={!canEdit}
            onChange={(e) => {
              const v = e.target.value || null;
              setIceProvidedBy(v || "");
              saveSingle(FIELD_IDS.ICE_PROVIDED_BY, v);
            }}
            style={inputStyle}
          >
            <option value="">No ice</option>
            {[...new Set([...iceOptions, iceProvidedBy].filter(Boolean))].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <div style={{ marginTop: 6, fontSize: 11, color: "#888" }}>
            Select who provides ice for the event. Leave as "No ice" if not needed.
          </div>
        </div>
      </CollapsibleSubsection>
    </>
  );

  return embedded ? content : (
    <FormSection title="Beverage Service" dotColor="#22c55e" defaultOpen>
      {content}
    </FormSection>
  );
};
