import { useEffect, useState, useCallback, useRef } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS, getBarServiceFieldId, loadSingleSelectOptions, type SingleSelectOption } from "../../services/airtable/events";
import { asBarServicePrimary, asMultiSelectNames, asSingleSelectName, asString, asStringArray } from "../../services/airtable/selectors";
import { FormSection, CollapsibleSubsection, Helper, inputStyle, labelStyle } from "./FormSection";
import { HydrationStationModal } from "./HydrationStationModal";
import {
  FULL_BAR_PACKAGE_SPECK_ROWS,
  MIMOSA_BAR_JUICES_ROWS,
  MIMOSA_BAR_FRUIT_GARNISH_ROWS,
  isStandardBarItem,
  parseBarItemTokens,
  getNonStandardBarItems,
  parseSignatureDrinkRecipe,
  combineSignatureDrinkRecipe,
} from "../../constants/fullBarPackage";

const BAR_SERVICE_FALLBACK_OPTIONS = ["N/A", "Full Bar Package", "Mimosa Bar", "FoodWerx Bartender Only", "FoodWerx Mixers Only"];
const ICE_PROVIDED_BY_FALLBACK_OPTIONS = ["Client", "Foodwerx", "Venue"];

type BeverageServicesSectionProps = { embedded?: boolean };

export const BeverageServicesSection = ({ embedded = false }: BeverageServicesSectionProps) => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();

  const [barServiceFieldId, setBarServiceFieldId] = useState<string | null>(null);
  const [barServiceOptions, setBarServiceOptions] = useState<string[]>(BAR_SERVICE_FALLBACK_OPTIONS);

  // Bar: multi-select (Full Bar, Mimosa Bar, etc.) + signature drink fields
  const [barServiceSelected, setBarServiceSelected] = useState<string[]>([]);
  const [bar, setBar] = useState({
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

  /** Bar speck overrides by row index. When set, left column shows override instead of auto speck. Speck engine persistence TBD. */
  const [barSpeckOverrides, setBarSpeckOverrides] = useState<Record<number, string>>({});
  /** Mimosa Bar speck overrides by row index (juices). */
  const [mimosaSpeckOverrides, setMimosaSpeckOverrides] = useState<Record<number, string>>({});
  /** Mimosa Bar fruit garnish overrides by row index (3 rows). */
  const [mimosaFruitGarnishOverrides, setMimosaFruitGarnishOverrides] = useState<Record<number, string>>({});
  /** Which Full Bar pill is open: "barMixers" | "signatureDrink" | null (both closed). */
  const [openBarPill, setOpenBarPill] = useState<"barMixers" | "signatureDrink" | "mimosaMixers" | null>(null);
  /** Which beverage pill is open: "hydration" | "coffee" | "ice" | null. */
  const [openBeveragePill, setOpenBeveragePill] = useState<"hydration" | "coffee" | "ice" | null>(null);
  /** Bar service "Select all that apply" picker expanded. Collapses when something is picked. */
  const [barServicePickerOpen, setBarServicePickerOpen] = useState(true);
  /** Show reminder to add Mimosa Bar to Dessert items when user first selects Mimosa Bar. */
  const [showMimosaBarDessertReminder, setShowMimosaBarDessertReminder] = useState(false);

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
          const fromAirtable = opts.map((o: SingleSelectOption) => o.name);
          // Merge with fallback; dedupe case-insensitively so "FoodWerx Mixers Only" / "Foodwerx Mixers Only" show once
          const seen = new Set<string>();
          const merged = [...BAR_SERVICE_FALLBACK_OPTIONS, ...fromAirtable].filter((o) => {
            const key = o.trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setBarServiceOptions(merged);
        });
      }
    });
    loadSingleSelectOptions([FIELD_IDS.ICE_PROVIDED_BY]).then((result) => {
      if (cancelled || "error" in result) return;
      const opts = result[FIELD_IDS.ICE_PROVIDED_BY] ?? [];
      const names = opts.length > 0 ? opts.map((o: SingleSelectOption) => o.name) : ICE_PROVIDED_BY_FALLBACK_OPTIONS;
      setIceOptions(names);
    });
    return () => { cancelled = true; };
  }, []);

  const loadFromStore = useCallback(() => {
    if (!selectedEventId || !selectedEventData) {
      setBarServiceSelected([]);
      setBar({ signatureDrinkYesNo: "", signatureDrinkName: "", signatureDrinkIngredients: "", signatureDrinkMixersSupplier: "", mixers: "", garnishes: "" });
      setHydrationProvided("");
      setHydrationDrinkOptions([]);
      setHydrationNotes("");
      setCoffeeServiceNeeded("");
      setCoffeeMugType("");
      setIceProvidedBy("");
      setBarSpeckOverrides({});
      setMimosaFruitGarnishOverrides({});
      return;
    }
    if (skipLoadRef.current) {
      skipLoadRef.current = false;
      return;
    }

    const d = selectedEventData;
    const barFid = barServiceFieldId ?? FIELD_IDS.BAR_SERVICE;
    const raw = asMultiSelectNames(d[barFid]);
    const selected = raw.filter((x) => x && x !== "None");
    setBarServiceSelected(selected);
    setBarServicePickerOpen(selected.length === 0);
    setBar({
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

  const hasBarService = barServiceSelected.length > 0;
  const hasHydration = hydrationProvided === "Yes" || hydrationDrinkOptions.length > 0 || (hydrationNotes != null && String(hydrationNotes).trim() !== "");
  const hasCoffeeTea = coffeeServiceNeeded === "Yes";
  const hasIce = iceProvidedBy != null && String(iceProvidedBy).trim() !== "";

  const isFullBarPackage = barServiceSelected.includes("Full Bar Package");
  const isMimosaBar = barServiceSelected.some((s) => s.trim().toLowerCase() === "mimosa bar");
  const hasSignatureDrinkYes = bar.signatureDrinkYesNo === "Yes";
  const isClientSupplying = /client/i.test(bar.signatureDrinkMixersSupplier || "");
  const signatureDrinkComplete = Boolean(bar.signatureDrinkName?.trim() && bar.signatureDrinkMixersSupplier);
  const { alcohol: displayAlcohol, recipe: displayRecipe } = parseSignatureDrinkRecipe(bar.signatureDrinkIngredients ?? "");
  const sigDrinkInSpeckColor = "#22c55e";

  // When form becomes complete (name + who supplies), collapse the signature drink pill
  const prevCompleteRef = useRef(false);
  useEffect(() => {
    if (signatureDrinkComplete && !prevCompleteRef.current && openBarPill === "signatureDrink") setOpenBarPill(null);
    prevCompleteRef.current = signatureDrinkComplete;
  }, [signatureDrinkComplete, openBarPill]);

  const hydrationComplete = hydrationProvided === "Yes" && (hydrationDrinkOptions.length > 0 || (hydrationNotes != null && String(hydrationNotes).trim() !== ""));
  const hydrationPrevCompleteRef = useRef(false);
  useEffect(() => {
    if (hydrationComplete && !hydrationPrevCompleteRef.current && openBeveragePill === "hydration") setOpenBeveragePill(null);
    hydrationPrevCompleteRef.current = hydrationComplete;
  }, [hydrationComplete, openBeveragePill]);

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
        summary={hasBarService ? barServiceSelected.join(", ") : "N/A"}
        defaultOpen={isFullBarPackage || isMimosaBar}
        titleAlign="center"
      >
        <div style={{ gridColumn: "1 / -1", maxWidth: 560, margin: "0 auto" }}>
          <button
            type="button"
            onClick={() => setBarServicePickerOpen((open) => !open)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, background: "rgba(30,15,15,0.4)", cursor: "pointer", color: "inherit", textAlign: "left", marginBottom: barServicePickerOpen ? 8 : 0 }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.95)" }}>
              {hasBarService ? `Bar service: ${barServiceSelected.join(", ")}` : "Select all that apply"}
            </span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", transform: barServicePickerOpen ? "rotate(90deg)" : "none" }}>▶</span>
          </button>
          {barServicePickerOpen && (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 20px", marginTop: 8 }}>
                {(() => {
                const seen = new Set<string>();
                return barServiceOptions
                  .map((o) => (o === "None" ? "N/A" : o))
                  .filter((o) => o && o !== "N/A")
                  .filter((o) => {
                    const key = o.toLowerCase();
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });
              })().map((opt) => {
                  const isChecked = barServiceSelected.includes(opt);
                  return (
                    <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, cursor: canEdit ? "pointer" : "default", fontSize: 13, color: "#e0e0e0" }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={!canEdit}
                        onChange={() => {
                          const next = isChecked ? barServiceSelected.filter((x) => x !== opt) : [...barServiceSelected, opt];
                          setBarServiceSelected(next);
                          save({ [barServiceFieldId ?? FIELD_IDS.BAR_SERVICE]: next });
                          if (next.length > 0) setBarServicePickerOpen(false);
                          if (!isChecked && next.some((s) => s.trim().toLowerCase() === "mimosa bar")) setShowMimosaBarDessertReminder(true);
                        }}
                        style={{ accentColor: "#22c55e", width: 18, height: 18 }}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
              <Helper>Full Bar = bartender + mixers. Mimosa Bar = mimosa juices. You can select both. Bartender only = client supplies alcohol. Mixers only = client has bartender.</Helper>
            </>
          )}
        </div>

        {(isFullBarPackage || isMimosaBar) && (
          /* One row: Bar mixers | Signature Drink (when Full Bar) | Mimosa Bar (when selected) — like three columns when both */
          <div style={{ gridColumn: "1 / -1", marginTop: 12, display: "flex", flexDirection: "row", gap: 10, flexWrap: "wrap", width: "100%" }}>
            {isFullBarPackage && (
            <>
            {/* Pill: Bar mixers */}
            <div style={{ flex: "1 1 0", minWidth: 260, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, backgroundColor: "rgba(30,15,15,0.6)", overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setOpenBarPill((p) => (p === "barMixers" ? null : "barMixers"))}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 12px", border: "none", background: "none", cursor: "pointer", color: "inherit", textAlign: "left" }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Bar mixers</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", transform: openBarPill === "barMixers" ? "rotate(90deg)" : "none" }}>▶</span>
              </button>
              {openBarPill === "barMixers" && (
                <div style={{ padding: "0 12px 12px" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Override cell to edit. Speck engine will use when wired.</div>
                  <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, overflow: "hidden", background: "rgba(0,0,0,0.25)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "rgba(255,255,255,0.95)", width: "26%" }}>Auto speck</th>
                          <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "rgba(255,255,255,0.95)", width: "46%" }}>Items</th>
                          <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "rgba(255,255,255,0.95)", width: "28%" }}>Override</th>
                        </tr>
                      </thead>
                      <tbody>
                        {FULL_BAR_PACKAGE_SPECK_ROWS.map((row, i) => {
                          const overrideVal = barSpeckOverrides[i] ?? "";
                          const displaySpec = String(overrideVal || "").trim() !== "" ? overrideVal : row.speck;
                          return (
                            <tr key={i} style={{ borderBottom: i < FULL_BAR_PACKAGE_SPECK_ROWS.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                              <td style={{ padding: "6px 10px", color: "#e0e0e0" }}>{displaySpec}</td>
                              <td style={{ padding: "6px 10px", color: "#e0e0e0" }}>{row.item}</td>
                              <td style={{ padding: 4 }}>
                                <input
                                  type="text"
                                  value={overrideVal}
                                  disabled={!canEdit}
                                  onChange={(e) => setBarSpeckOverrides((prev) => ({ ...prev, [i]: e.target.value }))}
                                  placeholder="—"
                                  style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "#e0e0e0", fontSize: 13 }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Pill: Signature Drink */}
            <div style={{ flex: "1 1 0", minWidth: 260, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, backgroundColor: "rgba(30,15,15,0.6)", overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setOpenBarPill((p) => (p === "signatureDrink" ? null : "signatureDrink"))}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 12px", border: "none", background: "none", cursor: "pointer", color: "inherit", textAlign: "left" }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>
                  Signature Drink {hasSignatureDrinkYes ? "Yes" : bar.signatureDrinkYesNo ? "No" : ""}
                </span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", transform: openBarPill === "signatureDrink" ? "rotate(90deg)" : "none" }}>▶</span>
              </button>
              {openBarPill === "signatureDrink" && (
                <div style={{ padding: "0 12px 12px" }}>
                  <label style={labelStyle}>Signature drink?</label>
                  <select
                    value={bar.signatureDrinkYesNo}
                    disabled={!canEdit}
                    onChange={(e) => {
                      const v = e.target.value;
                      setBar((p) => ({ ...p, signatureDrinkYesNo: v }));
                      saveSingle(FIELD_IDS.BAR_SIGNATURE_DRINK_YES_NO, v || null);
                      if (v === "No") setOpenBarPill(null);
                    }}
                    style={inputStyle}
                  >
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  {hasSignatureDrinkYes && (
                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Who supplies mixers & garnishes</label>
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
                          <div>
                            <label style={labelStyle}>Drink name</label>
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
                          <div>
                            <label style={labelStyle}>Recipe (instructions)</label>
                            <textarea
                              rows={2}
                              value={displayRecipe}
                              disabled={!canEdit}
                              onChange={(e) => {
                                const v = e.target.value;
                                saveSingle(FIELD_IDS.BAR_SIGNATURE_DRINK_INGREDIENTS, combineSignatureDrinkRecipe(displayAlcohol, v));
                                setBar((p) => ({ ...p, signatureDrinkIngredients: combineSignatureDrinkRecipe(displayAlcohol, v) }));
                              }}
                              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                              placeholder="Build instructions..."
                            />
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                              <label style={labelStyle}>Alcohol (spirits)</label>
                              <input
                                type="text"
                                value={displayAlcohol}
                                disabled={!canEdit}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  const combined = combineSignatureDrinkRecipe(v, displayRecipe);
                                  saveSingle(FIELD_IDS.BAR_SIGNATURE_DRINK_INGREDIENTS, combined);
                                  setBar((p) => ({ ...p, signatureDrinkIngredients: combined }));
                                }}
                                style={inputStyle}
                                placeholder="e.g. Vodka, Cointreau"
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Mixers & garnish</label>
                              {!isClientSupplying && (
                                <>
                                  <input
                                    type="text"
                                    value={bar.mixers}
                                    disabled={!canEdit}
                                    onChange={(e) => { setBar((p) => ({ ...p, mixers: e.target.value })); saveSingle(FIELD_IDS.BAR_MIXERS, e.target.value); }}
                                    style={inputStyle}
                                    placeholder="Mixers (comma or -)"
                                  />
                                  <input
                                    type="text"
                                    value={bar.garnishes}
                                    disabled={!canEdit}
                                    onChange={(e) => { setBar((p) => ({ ...p, garnishes: e.target.value })); saveSingle(FIELD_IDS.BAR_GARNISHES, e.target.value); }}
                                    style={{ ...inputStyle, marginTop: 6 }}
                                    placeholder="Garnish (comma or -)"
                                  />
                                  {(() => {
                                    const mixersTokens = parseBarItemTokens(bar.mixers);
                                    const garnishTokens = parseBarItemTokens(bar.garnishes);
                                    const allTokens = [...mixersTokens, ...garnishTokens];
                                    const anyInSpeck = allTokens.some((t) => isStandardBarItem(t));
                                    if (allTokens.length === 0) return null;
                                    return (
                                      <div style={{ marginTop: 8, fontSize: 12 }}>
                                        <div style={{ marginBottom: 4 }}>Items: {allTokens.map((t, i) => (
                                          <span key={i} style={{ color: isStandardBarItem(t) ? sigDrinkInSpeckColor : "#e0e0e0", marginRight: 6 }}>{t}</span>
                                        ))}</div>
                                        {anyInSpeck && (
                                          <div style={{ fontSize: 11, color: sigDrinkInSpeckColor }}>
                                            * Sig drink items included in speck
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </>
                              )}
                            </div>
                          </div>
                          {isClientSupplying && (
                            <div style={{ color: "#22c55e", fontSize: 12, padding: "8px 10px", borderRadius: 6, backgroundColor: "rgba(34,197,94,0.1)" }}>
                              Client supplying — name and recipe still print on BEO.
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
            </div>
          )}
            </div>
          </>
            )}
            {isMimosaBar && (
              <div style={{ flex: "1 1 0", minWidth: 260, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, backgroundColor: "rgba(30,15,15,0.6)", overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => setOpenBarPill((p) => (p === "mimosaMixers" ? null : "mimosaMixers"))}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 12px", border: "none", background: "none", cursor: "pointer", color: "inherit", textAlign: "left" }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Mimosa Bar</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", transform: openBarPill === "mimosaMixers" ? "rotate(90deg)" : "none" }}>▶</span>
                </button>
                {openBarPill === "mimosaMixers" && (
                  <div style={{ padding: "0 12px 12px" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 4 }}>Juices</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Override cell to edit. Speck engine will use when wired.</div>
                    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, overflow: "hidden", background: "rgba(0,0,0,0.25)", marginBottom: 12 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "rgba(255,255,255,0.95)", width: "26%" }}>Auto speck</th>
                            <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "rgba(255,255,255,0.95)", width: "46%" }}>Items</th>
                            <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "rgba(255,255,255,0.95)", width: "28%" }}>Override</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MIMOSA_BAR_JUICES_ROWS.map((row, i) => {
                            const overrideVal = mimosaSpeckOverrides[i] ?? "";
                            const displaySpec = String(overrideVal || "").trim() !== "" ? overrideVal : row.speck;
                            return (
                              <tr key={i} style={{ borderBottom: i < MIMOSA_BAR_JUICES_ROWS.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                                <td style={{ padding: "6px 10px", color: "#e0e0e0" }}>{displaySpec}</td>
                                <td style={{ padding: "6px 10px", color: "#e0e0e0" }}>{row.item}</td>
                                <td style={{ padding: 4 }}>
                                  <input
                                    type="text"
                                    value={overrideVal}
                                    disabled={!canEdit}
                                    onChange={(e) => setMimosaSpeckOverrides((prev) => ({ ...prev, [i]: e.target.value }))}
                                    placeholder="—"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "#e0e0e0", fontSize: 13 }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 4 }}>Fruit Garnish</div>
                    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, overflow: "hidden", background: "rgba(0,0,0,0.25)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "rgba(255,255,255,0.95)", width: "26%" }}>Auto speck</th>
                            <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "rgba(255,255,255,0.95)", width: "46%" }}>Items</th>
                            <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, color: "rgba(255,255,255,0.95)", width: "28%" }}>Override</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MIMOSA_BAR_FRUIT_GARNISH_ROWS.map((row, i) => {
                            const overrideVal = mimosaFruitGarnishOverrides[i] ?? "";
                            const displaySpec = String(overrideVal || "").trim() !== "" ? overrideVal : row.speck;
                            return (
                              <tr key={i} style={{ borderBottom: i < MIMOSA_BAR_FRUIT_GARNISH_ROWS.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                                <td style={{ padding: "6px 10px", color: "#e0e0e0" }}>{displaySpec}</td>
                                <td style={{ padding: "6px 10px", color: "#e0e0e0" }}>{row.item}</td>
                                <td style={{ padding: 4 }}>
                                  <input
                                    type="text"
                                    value={overrideVal}
                                    disabled={!canEdit}
                                    onChange={(e) => setMimosaFruitGarnishOverrides((prev) => ({ ...prev, [i]: e.target.value }))}
                                    placeholder="—"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "#e0e0e0", fontSize: 13 }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CollapsibleSubsection>

      {/* Reminder when user selects Mimosa Bar: add it to Dessert items so Kitchen BEO shows fruit for kitchen to cut */}
      {showMimosaBarDessertReminder && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }} onClick={() => setShowMimosaBarDessertReminder(false)}>
          <div style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: 24, maxWidth: 400, margin: 16 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Mimosa Bar selected</div>
            <p style={{ fontSize: 13, color: "#e0e0e0", lineHeight: 1.5, margin: 0 }}>
              So the kitchen can cut the fruit, add <strong>Mimosa Bar</strong> in the <strong>DESSERTS</strong> section: go to the menu and use &quot;+ Add&quot; under Desserts, then pick &quot;Mimosa Bar&quot; from the dessert picker. That will show the mimosa fruit on the Kitchen BEO.
            </p>
            <button type="button" onClick={() => setShowMimosaBarDessertReminder(false)} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, border: "1px solid #22c55e", background: "#22c55e", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>OK</button>
          </div>
        </div>
      )}

      {/* Hydration, Coffee/Tea, Ice — full-width pills (same pattern as Bar mixers / Signature Drink) */}
      <div style={{ gridColumn: "1 / -1", marginTop: 12, display: "flex", flexDirection: "row", gap: 10, flexWrap: "wrap", width: "100%" }}>
        {/* Pill: Hydration Station */}
        <div style={{ flex: "1 1 0", minWidth: 200, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, backgroundColor: "rgba(30,15,15,0.6)", overflow: "hidden" }}>
          <button
            type="button"
            onClick={() => setOpenBeveragePill((p) => (p === "hydration" ? null : "hydration"))}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 12px", border: "none", background: "none", cursor: "pointer", color: "inherit", textAlign: "left" }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>
              💧 Hydration Station {hydrationProvided === "Yes" ? (hasHydration ? `— ${hydrationDrinkOptions.slice(0, 2).join(", ")}${hydrationDrinkOptions.length > 2 ? "…" : ""}` : "Yes") : hydrationProvided === "No" ? "No" : ""}
            </span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", transform: openBeveragePill === "hydration" ? "rotate(90deg)" : "none" }}>▶</span>
          </button>
          {openBeveragePill === "hydration" && (
            <div style={{ padding: "0 12px 12px" }}>
              <label style={labelStyle}>Hydration station provided?</label>
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: canEdit ? "pointer" : "default" }}>
                  <input type="radio" name="hydrationProvided" checked={hydrationProvided === "Yes"} disabled={!canEdit} onChange={() => { setHydrationProvided("Yes"); saveSingle(FIELD_IDS.HYDRATION_STATION_PROVIDED, "Yes"); setHydrationModalOpen(true); }} style={{ accentColor: "#22c55e" }} />
                  <span style={{ color: "#e0e0e0", fontSize: 13 }}>Yes</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: canEdit ? "pointer" : "default" }}>
                  <input type="radio" name="hydrationProvided" checked={hydrationProvided === "No"} disabled={!canEdit} onChange={async () => { setHydrationProvided("No"); setHydrationDrinkOptions([]); setHydrationNotes(""); if (selectedEventId) await setFields(selectedEventId, { [FIELD_IDS.HYDRATION_STATION_PROVIDED]: "No", [FIELD_IDS.HYDRATION_STATION_DRINK_OPTIONS]: [], [FIELD_IDS.HYDRATION_STATION_NOTES]: null }); setOpenBeveragePill(null); }} style={{ accentColor: "#22c55e" }} />
                  <span style={{ color: "#e0e0e0", fontSize: 13 }}>No</span>
                </label>
              </div>
              {hydrationProvided === "Yes" && (
                <div style={{ marginTop: 12 }}>
                  <button type="button" onClick={() => setHydrationModalOpen(true)} disabled={!canEdit} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #22c55e", background: "rgba(34,197,94,0.15)", color: "#22c55e", fontWeight: 600, fontSize: 12, cursor: canEdit ? "pointer" : "default", opacity: canEdit ? 1 : 0.6 }}>
                    {hasHydration ? "Edit options" : "Select drink options"}
                  </button>
                  {hasHydration && <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{[hydrationDrinkOptions.join(", "), hydrationNotes != null && String(hydrationNotes).trim() && `Notes: ${String(hydrationNotes).trim()}`].filter(Boolean).join(" • ")}</div>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pill: Coffee / Tea Service */}
        <div style={{ flex: "1 1 0", minWidth: 200, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, backgroundColor: "rgba(30,15,15,0.6)", overflow: "hidden" }}>
          <button type="button" onClick={() => setOpenBeveragePill((p) => (p === "coffee" ? null : "coffee"))} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 12px", border: "none", background: "none", cursor: "pointer", color: "inherit", textAlign: "left" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>☕ Coffee / Tea {hasCoffeeTea ? (coffeeMugType ? coffeeMugType : "Yes") : coffeeServiceNeeded === "No" ? "No" : ""}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", transform: openBeveragePill === "coffee" ? "rotate(90deg)" : "none" }}>▶</span>
          </button>
          {openBeveragePill === "coffee" && (
            <div style={{ padding: "0 12px 12px" }}>
              <label style={labelStyle}>Coffee service needed?</label>
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: canEdit ? "pointer" : "default" }}>
                  <input type="radio" name="coffeeNeeded" checked={coffeeServiceNeeded === "Yes"} disabled={!canEdit} onChange={() => { setCoffeeServiceNeeded("Yes"); saveSingle(FIELD_IDS.COFFEE_SERVICE_NEEDED, "Yes"); }} style={{ accentColor: "#22c55e" }} />
                  <span style={{ color: "#e0e0e0", fontSize: 13 }}>Yes</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: canEdit ? "pointer" : "default" }}>
                  <input type="radio" name="coffeeNeeded" checked={coffeeServiceNeeded === "No"} disabled={!canEdit} onChange={() => { setCoffeeServiceNeeded("No"); setCoffeeMugType(""); save({ [FIELD_IDS.COFFEE_SERVICE_NEEDED]: "No", ...(FIELD_IDS.COFFEE_MUG_TYPE !== "fldCoffeeMugTypeTODO" ? { [FIELD_IDS.COFFEE_MUG_TYPE]: null } : {}) }); setOpenBeveragePill(null); }} style={{ accentColor: "#22c55e" }} />
                  <span style={{ color: "#e0e0e0", fontSize: 13 }}>No</span>
                </label>
              </div>
              {coffeeServiceNeeded === "Yes" && (
                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>Mug type (for pack-out)</label>
                  <select value={coffeeMugType} disabled={!canEdit} onChange={(e) => { const v = e.target.value; setCoffeeMugType(v); if (FIELD_IDS.COFFEE_MUG_TYPE !== "fldCoffeeMugTypeTODO") saveSingle(FIELD_IDS.COFFEE_MUG_TYPE, v || null); }} style={inputStyle}>
                    <option value="">Select...</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Irish">Irish</option>
                  </select>
                  {FIELD_IDS.COFFEE_MUG_TYPE === "fldCoffeeMugTypeTODO" && <div style={{ marginTop: 4, fontSize: 11, color: "#888" }}>Create Coffee Mug Type field in Airtable to persist</div>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pill: Ice */}
        <div style={{ flex: "1 1 0", minWidth: 200, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, backgroundColor: "rgba(30,15,15,0.6)", overflow: "hidden" }}>
          <button type="button" onClick={() => setOpenBeveragePill((p) => (p === "ice" ? null : "ice"))} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 12px", border: "none", background: "none", cursor: "pointer", color: "inherit", textAlign: "left" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>🧊 Ice {hasIce ? iceProvidedBy : ""}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", transform: openBeveragePill === "ice" ? "rotate(90deg)" : "none" }}>▶</span>
          </button>
          {openBeveragePill === "ice" && (
            <div style={{ padding: "0 12px 12px" }}>
              <label style={labelStyle}>Ice provided by</label>
              <select value={iceProvidedBy} disabled={!canEdit} onChange={(e) => { const v = e.target.value || ""; setIceProvidedBy(v); saveSingle(FIELD_IDS.ICE_PROVIDED_BY, v || null); }} style={inputStyle}>
                <option value="">No ice</option>
                {[...new Set([...iceOptions, iceProvidedBy].filter(Boolean))].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div style={{ marginTop: 6, fontSize: 11, color: "#888" }}>Who provides ice. Leave "No ice" if not needed.</div>
            </div>
          )}
        </div>
      </div>

      <HydrationStationModal
        isOpen={hydrationModalOpen}
        onClose={() => setHydrationModalOpen(false)}
        drinkOptionsSelected={hydrationDrinkOptions}
        notes={hydrationNotes}
        onSave={async (fid, val) => {
          await saveSingle(fid, val);
          if (fid === FIELD_IDS.HYDRATION_STATION_DRINK_OPTIONS) setHydrationDrinkOptions(Array.isArray(val) ? val : []);
          else if (fid === FIELD_IDS.HYDRATION_STATION_NOTES) setHydrationNotes(val === null ? "" : String(val));
        }}
        onDrinkOptionsChange={(opts) => setHydrationDrinkOptions(opts)}
        onNotesChange={(n) => setHydrationNotes(n)}
        canEdit={canEdit}
      />
    </>
  );

  return embedded ? content : (
    <FormSection title="Beverage Services" dotColor="#00bcd4" titleAlign="center">
      {content}
    </FormSection>
  );
};
