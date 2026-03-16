/**
 * Station Components Config Modal — uses Station Presets, Station Components, Station Options.
 * Does NOT touch Menu Items, menu pickers, spec engine, or BEO rendering.
 * UX aligned with Plates section: collapsed sections, row-style items, Add opens a dropdown picker.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  loadAllComponentsForPreset,
  loadAllStationComponents,
  loadDefaultComponentsForPreset,
  loadStationOptionsForPreset,
  type StationComponent,
  type StationOption,
} from "../../services/airtable/stationComponents";
import { isErrorResult } from "../../services/airtable/selectors";
import { CollapsibleSubsection } from "./FormSection";
import { getStationPresetKey, TEX_MEX, RAMEN, ALL_AMERICAN, STREET_FOOD, RAW_BAR, CARVING, HIBACHI, CHICKEN_WAFFLE, LATE_NIGHT, FISHERMANS_CORNER } from "../../config/stationPresets";

/** Airtable uses "Starch"; we display "Starch (Pasta)" for pasta stations. */
const TYPE_DISPLAY: Record<string, string> = {
  Starch: "Starch (Pasta)",
  Protein: "Protein",
  Sauce: "Sauce",
  Vegetable: "Vegetable",
  Topping: "Topping",
  Other: "Other",
};
const COMPONENT_TYPE_ORDER = ["Starch", "Protein", "Sauce", "Vegetable", "Topping", "Other"];

/** Accent color per component type for section headers and controls */
const TYPE_ACCENT_COLORS: Record<string, string> = {
  Starch: "#a855f7",
  Protein: "#eab308",
  Sauce: "#14b8a6",
  Vegetable: "#22c55e",
  Topping: "#3b82f6",
  Other: "#94a3b8",
};

/** Light background for accent color (for buttons) */
const TYPE_ACCENT_BG: Record<string, string> = {
  Starch: "rgba(168,85,247,0.15)",
  Protein: "rgba(234,179,8,0.15)",
  Sauce: "rgba(20,184,166,0.15)",
  Vegetable: "rgba(34,197,94,0.15)",
  Topping: "rgba(59,130,246,0.15)",
  Other: "rgba(148,163,184,0.15)",
};

/** Preferred display order for Viva La Pasta components (matches Airtable). Items not in list sort last. */
const VIVA_PASTA_ORDER: Record<string, string[]> = {
  Starch: ["Penne", "Rigatoni", "Bowtie", "Linguine", "Fettuccine", "Cavatappi", "Tortellini"],
  Sauce: ["Alfredo", "Pesto Cream", "Parmesan Cream", "Garlic Cream", "Lemon Butter Cream", "Marinara", "Vodka", "Sunday Gravy / Bolognese", "Garlic & Oil"],
  Protein: ["Bacon", "Sausage", "Grilled Chicken", "Shrimp"],
  Vegetable: ["Mushrooms", "Broccoli", "Olives", "Tomatoes", "Spinach"],
  Topping: ["Parmesan Cheese", "Mozzarella Cheese", "Cheddar Cheese"],
};

/** Viva La Pasta: default sauce names for Auto-Fill (pick 3). */
const VIVA_DEFAULT_SAUCE_NAMES = ["Sunday Gravy / Bolognese", "Vodka", "Alfredo"];

/** Viva La Pasta: default pasta names for Auto-Fill (pick 2). Penne and Tortellini; Bowtie fallback if Tortellini not in Airtable. */
const VIVA_DEFAULT_PASTA_NAMES = ["Penne", "Tortellini", "Cheese Tortellini", "Bowtie"];

/** Viva La Pasta: ONLY these condiments in the Included section. No other veggies/toppings/proteins. */
const VIVA_INCLUDED_CONDIMENT_NAMES = [
  "Mushrooms", "Broccoli", "Olives", "Tomatoes", "Spinach",
  "Parmesan Cheese", "Mozzarella Cheese", "Cheddar Cheese",
  "Bacon", "Sausage", "Grilled Chicken", "Shrimp",
];

function sortComponentsByOrder(comps: StationComponent[], type: string, presetName: string): StationComponent[] {
  const name = (presetName || "").toLowerCase();
  if (!name.includes("pasta") && !name.includes("viva")) return comps;
  const order = VIVA_PASTA_ORDER[type];
  if (!order) return comps;
  const orderMap = new Map(order.map((n, i) => [n.toLowerCase(), i]));
  return [...comps].sort((a, b) => {
    const ia = orderMap.get(a.name.toLowerCase()) ?? 999;
    const ib = orderMap.get(b.name.toLowerCase()) ?? 999;
    if (ia !== ib) return ia - ib;
    return a.name.localeCompare(b.name);
  });
}

/** Normalize Airtable component types (e.g. "Proteins" -> "Protein") so dropdowns show correctly. */
function normalizeComponentType(raw: string): string {
  const t = (raw || "").trim();
  if (t === "Proteins") return "Protein";
  if (t === "Starches") return "Starch";
  if (t === "Vegetables") return "Vegetable";
  if (t === "Toppings") return "Topping";
  if (t === "Sauces") return "Sauce";
  return t || "Other";
}

function groupByComponentType(components: StationComponent[]): Map<string, StationComponent[]> {
  const map = new Map<string, StationComponent[]>();
  for (const c of components) {
    const type = normalizeComponentType(c.componentType);
    const list = map.get(type) ?? [];
    list.push(c);
    map.set(type, list);
  }
  return map;
}

function displayType(type: string): string {
  return TYPE_DISPLAY[type] ?? type;
}

/** Parse Tex-Mex customItems from edit mode */
function parseTexMexCustomItems(text: string): { shell: "Soft" | "Hard"; proteins: string[]; included: string[] } | null {
  if (!text?.trim()) return null;
  const lines = text.split("\n").map((s) => s.trim());
  let shell: "Soft" | "Hard" | "" = "";
  const proteins: string[] = [];
  const included: string[] = [];
  for (const line of lines) {
    const m = line.match(/^Shell:\s*(.+)$/i);
    if (m) {
      const v = m[1].trim();
      if (v === "Soft" || v === "Hard") shell = v;
    }
    const pm = line.match(/^Proteins?:\s*(.+)$/i);
    if (pm) proteins.push(...pm[1].split(",").map((s) => s.trim()).filter(Boolean));
    const im = line.match(/^Included:\s*(.+)$/i);
    if (im) included.push(...im[1].split(",").map((s) => s.trim()).filter(Boolean));
    const tm = line.match(/^Toppings\s*\(included\):\s*(.+)$/i);
    if (tm) included.push(...tm[1].split(",").map((s) => s.trim()).filter(Boolean));
    const sm = line.match(/^Sides\s*\(included\):\s*(.+)$/i);
    if (sm) included.push(...sm[1].split(",").map((s) => s.trim()).filter(Boolean));
  }
  if (!shell && proteins.length === 0 && included.length === 0) return null;
  return { shell: shell || "Soft", proteins: proteins.slice(0, 2), included };
}

/** Parse Ramen customItems from edit mode */
function parseRamenCustomItems(text: string): { stock: string; protein: string; included: string[] } | null {
  if (!text?.trim()) return null;
  const lines = text.split("\n").map((s) => s.trim());
  let stock = "";
  let protein = "";
  const included: string[] = [];
  for (const line of lines) {
    const sm = line.match(/^Stock:\s*(.+)$/i);
    if (sm) stock = sm[1].trim();
    const pm = line.match(/^Protein:\s*(.+)$/i);
    if (pm) protein = pm[1].trim();
    const im = line.match(/^Included:\s*(.+)$/i);
    if (im) included.push(...im[1].split(",").map((s) => s.trim()).filter(Boolean));
    const tm = line.match(/^Toppings\s*\(included\):\s*(.+)$/i);
    if (tm) included.push(...tm[1].split(",").map((s) => s.trim()).filter(Boolean));
    const sm2 = line.match(/^Sauces?\s*\(included\):\s*(.+)$/i);
    if (sm2) included.push(...sm2[1].split(",").map((s) => s.trim()).filter(Boolean));
  }
  if (!stock && !protein && included.length === 0) return null;
  return { stock, protein, included };
}

/** Parse All-American customItems */
function parseAllAmericanCustomItems(text: string): { main: string; potato: string; chicken: string; salad: string } | null {
  if (!text?.trim()) return null;
  const lines = text.split("\n").map((s) => s.trim());
  let main = "", potato = "", chicken = "", salad = "";
  for (const line of lines) {
    const m = line.match(/^Main:\s*(.+)$/i); if (m) main = m[1].trim();
    const p = line.match(/^Potato:\s*(.+)$/i); if (p) potato = p[1].trim();
    const c = line.match(/^Chicken:\s*(.+)$/i); if (c) chicken = c[1].trim();
    const s = line.match(/^Salad:\s*(.+)$/i); if (s) salad = s[1].trim();
  }
  if (!main && !potato && !chicken && !salad) return null;
  return { main, potato, chicken, salad };
}

/** Parse Street Food customItems — first 5 go to dropdowns, rest to custom */
function parseStreetFoodCustomItems(text: string): { selected: string[]; custom: string[] } | null {
  if (!text?.trim()) return null;
  const m = text.match(/^Items:\s*(.+)$/im);
  if (!m) return null;
  const items = m[1].split(",").map((s) => s.trim()).filter(Boolean);
  const selected = [...items.slice(0, 5), "", "", "", "", ""].slice(0, 5);
  const custom = items.slice(5);
  return { selected, custom };
}

/** Parse Raw Bar customItems */
function parseRawBarCustomItems(text: string): { proteins: string[]; included: string[] } | null {
  if (!text?.trim()) return null;
  const lines = text.split("\n").map((s) => s.trim());
  const proteins: string[] = [];
  const included: string[] = [];
  for (const line of lines) {
    const pm = line.match(/^Proteins?:\s*(.+)$/i);
    if (pm) proteins.push(...pm[1].split(",").map((s) => s.trim()).filter(Boolean));
    const im = line.match(/^Included:\s*(.+)$/i);
    if (im) included.push(...im[1].split(",").map((s) => s.trim()).filter(Boolean));
    const gm = line.match(/^Garnishes?\s*\(included\):\s*(.+)$/i);
    if (gm) included.push(...gm[1].split(",").map((s) => s.trim()).filter(Boolean));
  }
  if (proteins.length === 0 && included.length === 0) return null;
  return { proteins, included };
}

/** Parse Carving customItems */
function parseCarvingCustomItems(text: string): { meats: string[]; potato: string; included: string[] } | null {
  if (!text?.trim()) return null;
  const lines = text.split("\n").map((s) => s.trim());
  const meats: string[] = [];
  let potato = "";
  const included: string[] = [];
  for (const line of lines) {
    const mm = line.match(/^Meats?:\s*(.+)$/i);
    if (mm) meats.push(...mm[1].split(",").map((s) => s.trim()).filter(Boolean));
    const pm = line.match(/^Potato:\s*(.+)$/i);
    if (pm) potato = pm[1].trim();
    const im = line.match(/^Included:\s*(.+)$/i);
    if (im) included.push(...im[1].split(",").map((s) => s.trim()).filter(Boolean));
  }
  if (meats.length === 0 && !potato && included.length === 0) return null;
  return { meats: meats.slice(0, 2), potato, included };
}

/** Parse Hibachi customItems */
function parseHibachiCustomItems(text: string): { proteins: string[]; upgrades: string[]; included: string[] } | null {
  if (!text?.trim()) return null;
  const lines = text.split("\n").map((s) => s.trim());
  const proteins: string[] = [];
  const upgrades: string[] = [];
  const included: string[] = [];
  for (const line of lines) {
    const pm = line.match(/^Proteins?:\s*(.+)$/i);
    if (pm) proteins.push(...pm[1].split(",").map((s) => s.trim()).filter(Boolean));
    const um = line.match(/^Upgrades?:\s*(.+)$/i);
    if (um) upgrades.push(...um[1].split(",").map((s) => s.trim()).filter(Boolean));
    const im = line.match(/^Included:\s*(.+)$/i);
    if (im) included.push(...im[1].split(",").map((s) => s.trim()).filter(Boolean));
  }
  if (proteins.length === 0 && upgrades.length === 0 && included.length === 0) return null;
  return { proteins: proteins.slice(0, 2), upgrades, included };
}

/** Parse Late Night customItems */
function parseLateNightCustomItems(text: string): { items: string[] } | null {
  if (!text?.trim()) return null;
  const m = text.match(/^Items?:\s*(.+)$/im);
  if (!m) return null;
  const items = m[1].split(",").map((s) => s.trim()).filter(Boolean);
  return { items };
}

/** Parse Fisherman's Corner customItems */
function parseFishermansCornerCustomItems(text: string): { selected: string[] } | null {
  if (!text?.trim()) return null;
  const m = text.match(/^Items?:\s*(.+)$/im);
  if (!m) return null;
  const items = m[1].split(",").map((s) => s.trim()).filter(Boolean);
  return { selected: items.slice(0, 2) };
}

/** Parse Chicken & Waffle customItems */
function parseChickenWaffleCustomItems(text: string): {
  chicken: string;
  sauces: string[];
  butter: string;
  addons: string[];
  included: string[];
} | null {
  if (!text?.trim()) return null;
  const lines = text.split("\n").map((s) => s.trim()).filter(Boolean);
  let chicken = "";
  const sauces: string[] = [];
  let butter = "";
  const addons: string[] = [];
  const included: string[] = [];
  for (const line of lines) {
    const cm = line.match(/^Chicken:\s*(.+)$/i);
    if (cm) chicken = cm[1].trim();
    const sm = line.match(/^Sauce:\s*(.+)$/i);
    if (sm) sauces.push(...sm[1].split(",").map((s) => s.trim()).filter(Boolean));
    const bm = line.match(/^Butter:\s*(.+)$/i);
    if (bm) butter = bm[1].trim();
    const am = line.match(/^Add:\s*(.+)$/i);
    if (am) addons.push(...am[1].split(",").map((s) => s.trim()).filter(Boolean));
    const im = line.match(/^Included:\s*(.+)$/i);
    if (im) included.push(...im[1].split(",").map((s) => s.trim()).filter(Boolean));
  }
  if (!chicken && !butter && sauces.length === 0 && addons.length === 0 && included.length === 0) return null;
  return { chicken, sauces, butter, addons, included };
}

/** White label above each section (e.g. "PICK TWO PASTAS"). */
function getSectionLabel(type: string, limit: number, presetName: string): string {
  const name = (presetName || "").toLowerCase();
  const isPasta = name.includes("pasta") || name.includes("viva");
  const effectiveLimit = limit >= 999 ? (type === "Starch" ? 2 : type === "Protein" ? 1 : 999) : limit;

  if (isPasta) {
    switch (type) {
      case "Starch":
        return "PICK TWO PASTAS";
      case "Protein":
        return "PICK ONE PROTEIN";
      case "Topping":
      case "Other":
        return "A LA CARTE TOPPINGS";
      case "Sauce":
        return effectiveLimit === 1 ? "PICK ONE SAUCE" : effectiveLimit < 999 ? `PICK ${effectiveLimit} SAUCES` : "SELECT SAUCES";
      case "Vegetable":
        return effectiveLimit < 999 ? `PICK ${effectiveLimit} VEGETABLES` : "SELECT VEGETABLES";
      default:
        break;
    }
  }

  if (effectiveLimit < 999) {
    const noun = displayType(type);
    return effectiveLimit === 1 ? `PICK ONE ${noun.toUpperCase()}` : `PICK ${effectiveLimit} ${noun.toUpperCase()}S`;
  }
  return `SELECT ${displayType(type).toUpperCase()}S`;
}

/** Dropdown trigger text (e.g. "Pick 2 pastas"). */
function getDropdownLabel(type: string, limit: number, selectedCount: number, presetName: string): string {
  const name = (presetName || "").toLowerCase();
  const isPasta = name.includes("pasta") || name.includes("viva");
  const effectiveLimit = limit >= 999 ? (type === "Starch" ? 2 : type === "Protein" ? 1 : 999) : limit;

  const noun = type === "Starch" ? "pastas" : type === "Protein" ? "proteins" : type === "Sauce" ? "sauces" : type === "Vegetable" ? "vegetables" : type === "Topping" ? "toppings" : "items";
  if (effectiveLimit < 999) {
    return `Pick ${effectiveLimit} ${noun} — ${selectedCount}/${effectiveLimit} selected`;
  }
  return `Select ${noun} — ${selectedCount} selected`;
}

export function StationComponentsConfigModal(props: {
  isOpen: boolean;
  presetId: string | null;
  presetName: string;
  stationNotes: string;
  initialComponentIds: string[];
  initialCustomItems: string;
  initialBeoPlacement?: "Presented Appetizer" | "Buffet Metal" | "Buffet China";
  onConfirm: (params: { componentIds: string[]; customItems: string; beoPlacement?: "Presented Appetizer" | "Buffet Metal" | "Buffet China" }) => void;
  onCancel: () => void;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
  /** When "edit", use initialComponentIds/initialCustomItems; when "create", autopopulate defaults. */
  mode?: "create" | "edit";
  submitLabel?: string;
  guestCount?: number;
}) {
  const {
    isOpen,
    presetId,
    presetName,
    stationNotes,
    initialComponentIds,
    initialCustomItems,
    initialBeoPlacement,
    onConfirm,
    onCancel,
    inputStyle,
    labelStyle,
    buttonStyle,
    mode = "create",
    submitLabel,
    guestCount = 0,
  } = props;

  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState("");
  const [allComponents, setAllComponents] = useState<StationComponent[]>([]);
  const [options, setOptions] = useState<StationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [otherInput, setOtherInput] = useState("");
  const [sectionsExpanded, setSectionsExpanded] = useState(false);
  const [addDropdownType, setAddDropdownType] = useState<string | null>(null);
  const [platesStyleExpanded, setPlatesStyleExpanded] = useState<Record<string, boolean>>({});
  const [customPastaInput, setCustomPastaInput] = useState("");
  const [customProteinInput, setCustomProteinInput] = useState("");
  const [customSauceInput, setCustomSauceInput] = useState("");
  const [customCondimentInput, setCustomCondimentInput] = useState("");
  const [beoPlacement, setBeoPlacement] = useState<"Presented Appetizer" | "Buffet Metal" | "Buffet China" | "">(initialBeoPlacement ?? "");
  const [texMexShell, setTexMexShell] = useState<"Soft" | "Hard" | "">("");
  const [texMexProteins, setTexMexProteins] = useState<string[]>(["", ""]);
  const [texMexIncluded, setTexMexIncluded] = useState<string[]>([]);
  const [texMexIncludedInput, setTexMexIncludedInput] = useState("");
  const [ramenStock, setRamenStock] = useState<string>("");
  const [ramenProtein, setRamenProtein] = useState<string>("");
  const [ramenIncluded, setRamenIncluded] = useState<string[]>([]);
  const [ramenIncludedInput, setRamenIncludedInput] = useState("");
  const [allAmericanMain, setAllAmericanMain] = useState<string>("");
  const [allAmericanPotato, setAllAmericanPotato] = useState<string>("");
  const [allAmericanChicken, setAllAmericanChicken] = useState<string>("");
  const [allAmericanSalad, setAllAmericanSalad] = useState<string>("");
  const [streetFoodSelected, setStreetFoodSelected] = useState<string[]>(["", "", "", "", ""]);
  const [streetFoodCustomItems, setStreetFoodCustomItems] = useState<string[]>([]);
  const [streetFoodCustomInput, setStreetFoodCustomInput] = useState("");
  const [rawBarProteins, setRawBarProteins] = useState<string[]>([]);
  const [rawBarIncluded, setRawBarIncluded] = useState<string[]>([]);
  const [rawBarIncludedInput, setRawBarIncludedInput] = useState("");
  const [carvingMeats, setCarvingMeats] = useState<string[]>(["", ""]);
  const [carvingPotato, setCarvingPotato] = useState<string>("");
  const [carvingIncluded, setCarvingIncluded] = useState<string[]>([]);
  const [carvingIncludedInput, setCarvingIncludedInput] = useState("");
  const [hibachiProteins, setHibachiProteins] = useState<string[]>(["", ""]);
  const [hibachiUpgrades, setHibachiUpgrades] = useState<string[]>([]);
  const [hibachiIncluded, setHibachiIncluded] = useState<string[]>([]);
  const [hibachiIncludedInput, setHibachiIncludedInput] = useState("");
  const [hibachiUpgradesInput, setHibachiUpgradesInput] = useState("");
  const [rawBarCustomProteinInput, setRawBarCustomProteinInput] = useState("");
  const [chickenWaffleChicken, setChickenWaffleChicken] = useState<string>("");
  const [chickenWaffleSauces, setChickenWaffleSauces] = useState<string[]>([]);
  const [chickenWaffleButter, setChickenWaffleButter] = useState<string>("");
  const [chickenWaffleAddons, setChickenWaffleAddons] = useState<string[]>([]);
  const [chickenWaffleIncluded, setChickenWaffleIncluded] = useState<string[]>([]);
  const [chickenWaffleSauceInput, setChickenWaffleSauceInput] = useState("");
  const [chickenWaffleAddInput, setChickenWaffleAddInput] = useState("");
  const [chickenWaffleIncludedInput, setChickenWaffleIncludedInput] = useState("");
  const [lateNightSelected, setLateNightSelected] = useState<string[]>(["", "", "", "", "", ""]);
  const [lateNightCustomItems, setLateNightCustomItems] = useState<string[]>([]);
  const [lateNightCustomInput, setLateNightCustomInput] = useState("");
  const [fishermansCornerSelected, setFishermansCornerSelected] = useState<string[]>(["", ""]);
  const addDropdownRef = useRef<HTMLDivElement>(null);

  const stationPresetKey = getStationPresetKey(presetName || "");
  const isVivaPasta = (presetName || "").toLowerCase().includes("pasta") || (presetName || "").toLowerCase().includes("viva");
  const isTexMex = stationPresetKey === "tex-mex";
  const isRamen = stationPresetKey === "ramen";
  const isAllAmerican = stationPresetKey === "all-american";
  const isStreetFood = stationPresetKey === "street-food";
  const isRawBar = stationPresetKey === "raw-bar";
  const isCarving = stationPresetKey === "carving";
  const isHibachi = stationPresetKey === "hibachi";
  const isChickenWaffle = stationPresetKey === "chicken-waffle";
  const isLateNight = stationPresetKey === "late-night";
  const isFishermansCorner = stationPresetKey === "fishermans-corner";

  const applyAutoFill = useCallback(
    (defaults: StationComponent[], all: StationComponent[], opts: StationOption[]) => {
      const grouped = groupByComponentType(all);
      const getLimit = (t: string) => opts.find((o) => o.componentType === t)?.numberOfSelectionsAllowed ?? 999;
      const ids = new Set<string>(defaults.map((d) => d.id));
      for (const type of COMPONENT_TYPE_ORDER) {
        const limit = getLimit(type);
        const comps = grouped.get(type) ?? [];
        const currentInType = [...ids].filter((id) => {
          const c = all.find((x) => x.id === id);
          return c && normalizeComponentType(c.componentType) === type;
        });
        let need = limit - currentInType.length;
        if (need > 0) {
          for (const c of comps) {
            if (need <= 0) break;
            if (!ids.has(c.id)) {
              ids.add(c.id);
              need--;
            }
          }
        }
      }
      return [...ids];
    },
    []
  );

  /** Viva La Pasta: Auto-Fill with specific defaults — 3 sauces, 2 pastas, all included (veggies/toppings/proteins). */
  const applyAutoFillViva = useCallback((all: StationComponent[]): string[] => {
    const grouped = groupByComponentType(all);
    const ids: string[] = [];

    const sauces = grouped.get("Sauce") ?? [];
    const sauceByName = new Map(sauces.map((c) => [c.name.toLowerCase().trim(), c]));
    for (const name of VIVA_DEFAULT_SAUCE_NAMES) {
      const c = sauceByName.get(name.toLowerCase().trim());
      if (c) ids.push(c.id);
    }

    const starches = grouped.get("Starch") ?? [];
    const starchByName = new Map(starches.map((c) => [c.name.toLowerCase().trim(), c]));
    for (const name of VIVA_DEFAULT_PASTA_NAMES) {
      const c = starchByName.get(name.toLowerCase().trim());
      if (c && ids.filter((id) => starches.some((s) => s.id === id)).length < 2) ids.push(c.id);
    }

    const vivaCondimentSet = new Set(VIVA_INCLUDED_CONDIMENT_NAMES.map((n) => n.toLowerCase().trim()));
    const includedTypes = ["Vegetable", "Topping", "Protein"] as const;
    const order = [...(VIVA_PASTA_ORDER.Vegetable ?? []), ...(VIVA_PASTA_ORDER.Topping ?? []), ...(VIVA_PASTA_ORDER.Protein ?? [])];
    const orderMap = new Map(order.map((n, i) => [n.toLowerCase(), i]));
    const includedComps = includedTypes
      .flatMap((t) => grouped.get(t) ?? [])
      .filter((c) => vivaCondimentSet.has(c.name.toLowerCase().trim()));
    const sorted = [...includedComps].sort((a, b) => {
      const ia = orderMap.get(a.name.toLowerCase()) ?? 999;
      const ib = orderMap.get(b.name.toLowerCase()) ?? 999;
      return ia - ib;
    });
    for (const c of sorted) ids.push(c.id);
    return ids;
  }, []);

  useEffect(() => {
    if (!isOpen || !presetId) return;
    let cancelled = false;
    setLoading(true);
    const name = (presetName || "").toLowerCase();
    const skipAirtableLoad = name.includes("tex-mex") || name.includes("tex mex") || name.includes("ramen") || name.includes("all-american") || name.includes("all american") || name.includes("street food") || name.includes("raw bar") || name.includes("carving") || name.includes("hibachi") || (name.includes("chicken") && name.includes("waffle")) || name.includes("late night") || name.includes("vegetable") || name.includes("spreads") || name.includes("charcuterie") || name.includes("pasta flight") || name.includes("farmers") || name.includes("fisherman") || name.includes("barwerx") || name.includes("philly jawn") || name.includes("salad bar") || name.includes("built by you");
    if (skipAirtableLoad) {
      setAllComponents([]);
      setOptions([]);
      setSelectedComponentIds([]);
      setCustomItems(initialCustomItems);
      setBeoPlacement(initialBeoPlacement ?? "");
      setSectionsExpanded(false);
      const isCreate = mode === "create" && !initialCustomItems;
      if (name.includes("tex-mex") || name.includes("tex mex")) {
        const parsed = parseTexMexCustomItems(initialCustomItems);
        if (parsed) {
          setTexMexShell(parsed.shell);
          setTexMexProteins(parsed.proteins.length >= 2 ? parsed.proteins : [...parsed.proteins, ""].slice(0, 2));
          setTexMexIncluded(parsed.included.length > 0 ? parsed.included : [...TEX_MEX.includedToppings, ...TEX_MEX.includedSides]);
        } else if (isCreate) {
          setTexMexShell("Soft");
          setTexMexProteins(["Chicken", "Beef"]);
          setTexMexIncluded([...TEX_MEX.includedToppings, ...TEX_MEX.includedSides]);
        } else {
          setTexMexShell("");
          setTexMexProteins(["", ""]);
          setTexMexIncluded([]);
        }
      }
      if (name.includes("ramen")) {
        const parsed = parseRamenCustomItems(initialCustomItems);
        if (parsed) {
          setRamenStock(parsed.stock);
          setRamenProtein(parsed.protein);
          setRamenIncluded(parsed.included.length > 0 ? parsed.included : [...RAMEN.includedToppings, ...RAMEN.includedSauces]);
        } else if (isCreate) {
          setRamenStock("Both");
          setRamenProtein("Chicken");
          setRamenIncluded([...RAMEN.includedToppings, ...RAMEN.includedSauces]);
        } else {
          setRamenStock("");
          setRamenProtein("");
          setRamenIncluded([]);
        }
      }
      if (name.includes("all-american") || name.includes("all american")) {
        const parsed = parseAllAmericanCustomItems(initialCustomItems);
        if (parsed) {
          setAllAmericanMain(parsed.main);
          setAllAmericanPotato(parsed.potato);
          setAllAmericanChicken(parsed.chicken);
          setAllAmericanSalad(parsed.salad);
        } else if (isCreate) {
          setAllAmericanMain("Mini Angus beef burgers");
          setAllAmericanPotato("Crispy boardwalk potato wedges (sea salt & malt vinegar)");
          setAllAmericanChicken("Honey hot chicken tenders");
          setAllAmericanSalad("Yes");
        } else {
          setAllAmericanMain("");
          setAllAmericanPotato("");
          setAllAmericanChicken("");
          setAllAmericanSalad("");
        }
      }
      if (name.includes("street food")) {
        const parsed = parseStreetFoodCustomItems(initialCustomItems);
        if (parsed) {
          setStreetFoodSelected(parsed.selected);
          setStreetFoodCustomItems(parsed.custom);
        } else if (isCreate) {
          setStreetFoodSelected(["Mini shredded BBQ chicken on brioche rolls", "Mini sliders with aged white cheddar, caramelized onions & garlic aioli on mini brioche rolls", "Crispy cod or beef street tacos", "Carolina BBQ pork on a bao bun", "Thai sesame noodles in mini Chinese takeout containers"]);
          setStreetFoodCustomItems([]);
        } else {
          setStreetFoodSelected(["", "", "", "", ""]);
          setStreetFoodCustomItems([]);
        }
      }
      if (name.includes("raw bar")) {
        const parsed = parseRawBarCustomItems(initialCustomItems);
        if (parsed) {
          setRawBarProteins(parsed.proteins.length > 0 ? parsed.proteins : [...RAW_BAR.includedProteins]);
          setRawBarIncluded(parsed.included.length > 0 ? parsed.included : [...RAW_BAR.includedGarnishes]);
        } else {
          setRawBarProteins([...RAW_BAR.includedProteins]);
          setRawBarIncluded([...RAW_BAR.includedGarnishes]);
        }
      }
      if (name.includes("carving")) {
        const parsed = parseCarvingCustomItems(initialCustomItems);
        if (parsed) {
          setCarvingMeats(parsed.meats.length >= 2 ? parsed.meats : [...parsed.meats, "", ""].slice(0, 2));
          setCarvingPotato(parsed.potato);
          setCarvingIncluded(parsed.included);
        } else if (isCreate) {
          setCarvingMeats(["Pork tenderloin with mushroom duxelle en croute", "Roasted turkey with orange compote & gravy"]);
          setCarvingPotato("Roasted potatoes");
          setCarvingIncluded([]);
        } else {
          setCarvingMeats(["", ""]);
          setCarvingPotato("");
          setCarvingIncluded([]);
        }
      }
      if (name.includes("hibachi")) {
        const parsed = parseHibachiCustomItems(initialCustomItems);
        if (parsed) {
          setHibachiProteins(parsed.proteins.length >= 2 ? parsed.proteins : [...parsed.proteins, "", ""].slice(0, 2));
          setHibachiUpgrades(parsed.upgrades);
          setHibachiIncluded(parsed.included.length > 0 ? parsed.included : [...HIBACHI.included]);
        } else if (isCreate) {
          setHibachiProteins(["Chicken", "Steak"]);
          setHibachiUpgrades([]);
          setHibachiIncluded([...HIBACHI.included]);
        } else {
          setHibachiProteins(["", ""]);
          setHibachiUpgrades([]);
          setHibachiIncluded([]);
        }
      }
      if (name.includes("chicken") && name.includes("waffle")) {
        const parsed = parseChickenWaffleCustomItems(initialCustomItems);
        if (parsed) {
          setChickenWaffleChicken(parsed.chicken);
          setChickenWaffleSauces(parsed.sauces);
          setChickenWaffleButter(parsed.butter);
          setChickenWaffleAddons(parsed.addons);
          setChickenWaffleIncluded(parsed.included.length > 0 ? parsed.included : [...CHICKEN_WAFFLE.included]);
        } else if (isCreate) {
          setChickenWaffleChicken("Classic fried chicken tenders");
          setChickenWaffleSauces([]);
          setChickenWaffleButter("Regular whipped butter");
          setChickenWaffleAddons([]);
          setChickenWaffleIncluded([...CHICKEN_WAFFLE.included]);
        } else {
          setChickenWaffleChicken("");
          setChickenWaffleSauces([]);
          setChickenWaffleButter("");
          setChickenWaffleAddons([]);
          setChickenWaffleIncluded([]);
        }
      }
      if (name.includes("late night")) {
        const parsed = parseLateNightCustomItems(initialCustomItems);
        if (parsed) {
          const first6 = parsed.items.slice(0, 6);
          setLateNightSelected([...first6, "", "", "", "", "", ""].slice(0, 6));
          setLateNightCustomItems(parsed.items.slice(6));
        } else if (isCreate) {
          setLateNightSelected(["Philly soft pretzel bites with cheese & mustard", "Assorted donuts", "Chicken & waffle bites with bourbon maple butter drizzle", "Mini PB, Nutella & crumbled bacon sandwiches", "Donut wall - Assorted donuts hung from a pegged wall", ""]);
          setLateNightCustomItems([]);
        } else {
          setLateNightSelected(["", "", "", "", "", ""]);
          setLateNightCustomItems([]);
        }
      }
      if (name.includes("fisherman")) {
        const parsed = parseFishermansCornerCustomItems(initialCustomItems);
        if (parsed) {
          setFishermansCornerSelected([...parsed.selected, "", ""].slice(0, 2));
        } else if (isCreate) {
          setFishermansCornerSelected(["Jumbo shrimp cocktail in mini martini glasses", "Jumbo lump crab salad shooters"]);
        } else {
          setFishermansCornerSelected(["", ""]);
        }
      }
      setLoading(false);
      return;
    }
    Promise.all([
      loadDefaultComponentsForPreset(presetId),
      loadAllComponentsForPreset(presetId),
      loadStationOptionsForPreset(presetId),
    ]).then(async ([defaults, all, opts]) => {
      if (cancelled) return;
      const name = (presetName || "").toLowerCase();
      const isPastaPreset = name.includes("pasta") || name.includes("viva");
      let componentsToUse = all;
      if (isPastaPreset) {
        const fullList = await loadAllStationComponents();
        if (!isErrorResult(fullList) && fullList.length > 0) componentsToUse = fullList;
      } else if (isErrorResult(all) || (Array.isArray(all) && all.length === 0)) {
        componentsToUse = all;
      }
      if (!isErrorResult(componentsToUse)) setAllComponents(componentsToUse);
      if (!isErrorResult(opts)) setOptions(opts);
      if (mode === "create") {
        if (!isErrorResult(componentsToUse)) {
          if (isPastaPreset) {
            const filled = applyAutoFillViva(componentsToUse);
            setSelectedComponentIds(filled.length > 0 ? filled : initialComponentIds);
          } else if (!isErrorResult(defaults) && !isErrorResult(opts)) {
            const filled = applyAutoFill(defaults, componentsToUse, opts);
            setSelectedComponentIds(filled.length > 0 ? filled : initialComponentIds);
          } else {
            setSelectedComponentIds(initialComponentIds);
          }
        } else {
          setSelectedComponentIds(initialComponentIds);
        }
      } else {
        setSelectedComponentIds(initialComponentIds);
      }
      setCustomItems(initialCustomItems);
      setOtherInput("");
      setCustomPastaInput("");
      setCustomProteinInput("");
      setCustomSauceInput("");
      setCustomCondimentInput("");
      setBeoPlacement(initialBeoPlacement ?? "");
      setSectionsExpanded(false);
      if (name.includes("tex-mex") || name.includes("tex mex")) {
        const parsed = parseTexMexCustomItems(initialCustomItems);
        if (parsed) {
          setTexMexShell(parsed.shell);
          setTexMexProteins(parsed.proteins.length >= 2 ? parsed.proteins : [...parsed.proteins, ""].slice(0, 2));
          setTexMexIncluded(parsed.included.length > 0 ? parsed.included : [...TEX_MEX.includedToppings, ...TEX_MEX.includedSides]);
        } else {
          setTexMexShell("");
          setTexMexProteins(["", ""]);
          setTexMexIncluded([]);
        }
      } else {
        setTexMexShell("");
        setTexMexProteins(["", ""]);
      }
      if (name.includes("ramen")) {
        const parsed = parseRamenCustomItems(initialCustomItems);
        if (parsed) {
          setRamenStock(parsed.stock);
          setRamenProtein(parsed.protein);
          setRamenIncluded(parsed.included.length > 0 ? parsed.included : [...RAMEN.includedToppings, ...RAMEN.includedSauces]);
        } else {
          setRamenStock("");
          setRamenProtein("");
          setRamenIncluded([]);
        }
      } else {
        setRamenStock("");
        setRamenProtein("");
        setRamenIncluded([]);
      }
      setAddDropdownType(null);
      setPlatesStyleExpanded({});
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [isOpen, presetId, presetName, initialComponentIds, initialCustomItems, initialBeoPlacement, mode, applyAutoFill, applyAutoFillViva]);

  const getLimitForType = useCallback(
    (componentType: string): number => {
      const norm = normalizeComponentType(componentType);
      const opt = options.find((o) => normalizeComponentType(o.componentType) === norm || o.componentType === componentType);
      return opt?.numberOfSelectionsAllowed ?? 999;
    },
    [options]
  );

  const canAddComponent = useCallback(
    (componentId: string): boolean => {
      if (selectedComponentIds.includes(componentId)) return false;
      const comp = allComponents.find((c) => c.id === componentId);
      if (!comp) return true;
      const limit = getLimitForType(comp.componentType);
      const currentInType = selectedComponentIds.filter((id) => {
        const c = allComponents.find((x) => x.id === id);
        return c && normalizeComponentType(c.componentType) === normalizeComponentType(comp.componentType);
      }).length;
      return currentInType < limit;
    },
    [selectedComponentIds, allComponents, getLimitForType]
  );

  const addComponent = useCallback(
    (componentId: string) => {
      if (!canAddComponent(componentId)) return;
      const comp = allComponents.find((c) => c.id === componentId);
      if (!comp) return;
      const limit = getLimitForType(comp.componentType);
      const currentInType = selectedComponentIds.filter((id) => {
        const c = allComponents.find((x) => x.id === id);
        return c && normalizeComponentType(c.componentType) === normalizeComponentType(comp.componentType);
      });
      let next: string[];
      if (currentInType.length >= limit) {
        const toRemove = currentInType[0];
        next = selectedComponentIds.filter((id) => id !== toRemove);
        next = [...next, componentId];
      } else {
        next = [...selectedComponentIds, componentId];
      }
      setSelectedComponentIds(next);
    },
    [selectedComponentIds, allComponents, getLimitForType, canAddComponent]
  );

  const removeComponent = useCallback((componentId: string) => {
    setSelectedComponentIds((prev) => prev.filter((id) => id !== componentId));
  }, []);

  const handleAutoFill = useCallback(async () => {
    if (!presetId) return;
    setLoading(true);
    try {
      const name = (presetName || "").toLowerCase();
      const isPastaPreset = name.includes("pasta") || name.includes("viva");
      const isTexMexPreset = name.includes("tex-mex") || name.includes("tex mex");
      if (isTexMexPreset) {
        setTexMexShell("Soft");
        setTexMexProteins(["Chicken", "Beef"]);
        setTexMexIncluded([...TEX_MEX.includedToppings, ...TEX_MEX.includedSides]);
        setSectionsExpanded(true);
        setLoading(false);
        return;
      }
      const isRamenPreset = name.includes("ramen");
      if (isRamenPreset) {
        setRamenStock("Both");
        setRamenProtein("Chicken");
        setRamenIncluded([...RAMEN.includedToppings, ...RAMEN.includedSauces]);
        setSectionsExpanded(true);
        setLoading(false);
        return;
      }
      const isAllAmericanPreset = name.includes("all-american") || name.includes("all american");
      if (isAllAmericanPreset) {
        setAllAmericanMain("Mini Angus beef burgers");
        setAllAmericanPotato("Crispy boardwalk potato wedges (sea salt & malt vinegar)");
        setAllAmericanChicken("Honey hot chicken tenders");
        setAllAmericanSalad("Yes");
        setSectionsExpanded(true);
        setLoading(false);
        return;
      }
      const isStreetFoodPreset = name.includes("street food");
      if (isStreetFoodPreset) {
        setStreetFoodSelected(["Mini shredded BBQ chicken on brioche rolls", "Mini sliders with aged white cheddar, caramelized onions & garlic aioli", "Crispy cod street tacos", "Carolina BBQ pork on a bao bun", "Thai sesame noodles in mini Chinese takeout containers"]);
        setSectionsExpanded(true);
        setLoading(false);
        return;
      }
      const isChickenWafflePreset = name.includes("chicken") && name.includes("waffle");
      if (isChickenWafflePreset) {
        setChickenWaffleChicken("Classic fried chicken tenders");
        setChickenWaffleSauces([]);
        setChickenWaffleButter("Regular whipped butter");
        setChickenWaffleAddons([]);
        setChickenWaffleIncluded([...CHICKEN_WAFFLE.included]);
        setSectionsExpanded(true);
        setLoading(false);
        return;
      }
      const isRawBarPreset = name.includes("raw bar");
      if (isRawBarPreset) {
        setRawBarProteins([...RAW_BAR.includedProteins]);
        setRawBarIncluded([...RAW_BAR.includedGarnishes]);
        setSectionsExpanded(true);
        setLoading(false);
        return;
      }
      const isCarvingPreset = name.includes("carving");
      if (isCarvingPreset) {
        setCarvingMeats(["Pork tenderloin with mushroom duxelle en croute", "Roasted turkey with orange compote & gravy"]);
        setCarvingPotato("Roasted potatoes");
        setCarvingIncluded([]);
        setSectionsExpanded(true);
        setLoading(false);
        return;
      }
      const isHibachiPreset = name.includes("hibachi");
      if (isHibachiPreset) {
        setHibachiProteins(["Chicken", "Steak"]);
        setHibachiUpgrades([]);
        setHibachiIncluded([...HIBACHI.included]);
        setSectionsExpanded(true);
        setLoading(false);
        return;
      }
      const isLateNightPreset = name.includes("late night");
      if (isLateNightPreset) {
        setLateNightSelected(["Philly soft pretzel bites with cheese & mustard", "Assorted donuts", "Chicken & waffle bites with bourbon maple butter drizzle", "Mini PB, Nutella & crumbled bacon sandwiches", "Donut wall - Assorted donuts hung from a pegged wall", ""]);
        setLateNightCustomItems([]);
        setSectionsExpanded(true);
        setLoading(false);
        return;
      }
      const isFishermansCornerPreset = name.includes("fisherman");
      if (isFishermansCornerPreset) {
        setFishermansCornerSelected(["Jumbo shrimp cocktail in mini martini glasses", "Jumbo lump crab salad shooters"]);
        setSectionsExpanded(true);
        setLoading(false);
        return;
      }
      let componentsToUse;
      if (isPastaPreset) {
        const all = await loadAllStationComponents();
        componentsToUse = !isErrorResult(all) && all.length > 0 ? all : [];
        if (componentsToUse.length > 0) setAllComponents(componentsToUse);
      } else {
        const [defaults, all, opts] = await Promise.all([
          loadDefaultComponentsForPreset(presetId),
          loadAllComponentsForPreset(presetId),
          loadStationOptionsForPreset(presetId),
        ]);
        componentsToUse = all;
        if (!isErrorResult(defaults) && !isErrorResult(opts)) {
          const filled = applyAutoFill(defaults, componentsToUse, opts);
          setSelectedComponentIds(filled);
          setSectionsExpanded(true);
          if (filled.length > 0) {
            setPlatesStyleExpanded((p) => ({ ...p, Sauce: true, Starch: true, Protein: true, Vegetable: true, Topping: true }));
          }
        }
        setLoading(false);
        return;
      }
      if (componentsToUse.length > 0) {
        const filled = applyAutoFillViva(componentsToUse);
        setSelectedComponentIds(filled);
        setSectionsExpanded(true);
        if (filled.length > 0) {
          setPlatesStyleExpanded((p) => ({ ...p, Sauce: true, Starch: true, Protein: true, Vegetable: true, Topping: true }));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [presetId, presetName, applyAutoFill, applyAutoFillViva]);

  const handleClearAll = useCallback(() => {
    setSelectedComponentIds([]);
    setCustomItems("");
    setOtherInput("");
    setCustomPastaInput("");
    setCustomProteinInput("");
    setCustomSauceInput("");
    setCustomCondimentInput("");
    setBeoPlacement(initialBeoPlacement ?? "");
    setAddDropdownType(null);
    setSectionsExpanded(false);
    setPlatesStyleExpanded({});
    if (isTexMex) {
      setTexMexShell("");
      setTexMexProteins(["", ""]);
      setTexMexIncluded([]);
      setTexMexIncludedInput("");
    }
    if (isRamen) {
      setRamenStock("");
      setRamenProtein("");
      setRamenIncluded([]);
      setRamenIncludedInput("");
    }
    if (isAllAmerican) {
      setAllAmericanMain("");
      setAllAmericanPotato("");
      setAllAmericanChicken("");
      setAllAmericanSalad("");
    }
    if (isStreetFood) {
      setStreetFoodSelected(["", "", "", "", ""]);
      setStreetFoodCustomItems([]);
      setStreetFoodCustomInput("");
    }
    if (isChickenWaffle) {
      setChickenWaffleChicken("");
      setChickenWaffleSauces([]);
      setChickenWaffleButter("");
      setChickenWaffleAddons([]);
      setChickenWaffleIncluded([]);
      setChickenWaffleSauceInput("");
      setChickenWaffleAddInput("");
      setChickenWaffleIncludedInput("");
    }
    if (isRawBar) {
      setRawBarProteins([]);
      setRawBarIncluded([]);
      setRawBarIncludedInput("");
    }
    if (isCarving) {
      setCarvingMeats(["", ""]);
      setCarvingPotato("");
      setCarvingIncluded([]);
      setCarvingIncludedInput("");
    }
    if (isHibachi) {
      setHibachiProteins(["", ""]);
      setHibachiUpgrades([]);
      setHibachiIncluded([]);
      setHibachiIncludedInput("");
    }
    if (isLateNight) {
      setLateNightSelected(["", "", "", "", "", ""]);
      setLateNightCustomItems([]);
      setLateNightCustomInput("");
    }
    if (isFishermansCorner) {
      setFishermansCornerSelected(["", ""]);
    }
  }, [initialBeoPlacement, isTexMex, isRamen, isAllAmerican, isStreetFood, isChickenWaffle, isRawBar, isCarving, isHibachi, isLateNight, isFishermansCorner]);

  // Close add dropdown when clicking outside
  useEffect(() => {
    if (!addDropdownType) return;
    const handler = (e: MouseEvent) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target as Node)) {
        setAddDropdownType(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [addDropdownType]);

  const handleConfirm = () => {
    const name = (presetName || "").toLowerCase();
    const isPastaPreset = name.includes("pasta") || name.includes("viva");

    if (isTexMex) {
      const hasPlacement = beoPlacement === "Presented Appetizer" || beoPlacement === "Buffet Metal" || beoPlacement === "Buffet China";
      const hasShell = texMexShell === "Soft" || texMexShell === "Hard";
      const filledProteins = texMexProteins.filter(Boolean);
      const hasProteins = filledProteins.length >= 2;
      const missing: string[] = [];
      if (!hasPlacement) missing.push("BEO Placement");
      if (!hasShell) missing.push("Shell type (Soft or Hard)");
      if (!hasProteins) missing.push("2 proteins");
      if (missing.length > 0) {
        window.alert(`Please fill out the entire form before saving. Missing: ${missing.join(", ")}.`);
        return;
      }
      const lines = [
        `Shell: ${texMexShell}`,
        `Proteins: ${filledProteins.join(", ")}`,
        ...(texMexIncluded.length > 0 ? [`Included: ${texMexIncluded.join(", ")}`] : []),
      ];
      onConfirm({ componentIds: [], customItems: lines.join("\n"), beoPlacement: hasPlacement ? beoPlacement : undefined });
      return;
    }

    if (isRamen) {
      const hasPlacement = beoPlacement === "Presented Appetizer" || beoPlacement === "Buffet Metal" || beoPlacement === "Buffet China";
      const hasStock = ramenStock.trim().length > 0;
      const hasProtein = ramenProtein.trim().length > 0;
      const missing: string[] = [];
      if (!hasPlacement) missing.push("BEO Placement");
      if (!hasStock) missing.push("Stock type");
      if (!hasProtein) missing.push("Protein");
      if (missing.length > 0) {
        window.alert(`Please fill out the entire form before saving. Missing: ${missing.join(", ")}.`);
        return;
      }
      const lines = [
        `Stock: ${ramenStock}`,
        `Protein: ${ramenProtein}`,
        ...(ramenIncluded.length > 0 ? [`Included: ${ramenIncluded.join(", ")}`] : []),
      ];
      onConfirm({ componentIds: [], customItems: lines.join("\n"), beoPlacement: hasPlacement ? beoPlacement : undefined });
      return;
    }

    if (isAllAmerican) {
      const hasPlacement = beoPlacement === "Presented Appetizer" || beoPlacement === "Buffet Metal" || beoPlacement === "Buffet China";
      const hasMain = allAmericanMain.trim().length > 0;
      const hasPotato = allAmericanPotato.trim().length > 0;
      const hasChicken = allAmericanChicken.trim().length > 0;
      const hasSalad = allAmericanSalad.trim().length > 0;
      const missing: string[] = [];
      if (!hasPlacement) missing.push("BEO Placement");
      if (!hasMain) missing.push("Main");
      if (!hasPotato) missing.push("Potato");
      if (!hasChicken) missing.push("Chicken");
      if (!hasSalad) missing.push("Salad shooters");
      if (missing.length > 0) {
        window.alert(`Please fill out the entire form before saving. Missing: ${missing.join(", ")}.`);
        return;
      }
      const lines = [`Main: ${allAmericanMain}`, `Potato: ${allAmericanPotato}`, `Chicken: ${allAmericanChicken}`, `Salad shooters: ${allAmericanSalad}`];
      onConfirm({ componentIds: [], customItems: lines.join("\n"), beoPlacement: hasPlacement ? beoPlacement : undefined });
      return;
    }

    if (isStreetFood) {
      const hasPlacement = beoPlacement === "Presented Appetizer" || beoPlacement === "Buffet Metal" || beoPlacement === "Buffet China";
      const filled = streetFoodSelected.filter(Boolean);
      const hasFive = filled.length >= 5;
      const missing: string[] = [];
      if (!hasPlacement) missing.push("BEO Placement");
      if (!hasFive) missing.push("5 items");
      if (missing.length > 0) {
        window.alert(`Please fill out the entire form before saving. Missing: ${missing.join(", ")}.`);
        return;
      }
      const allItems = [...filled, ...streetFoodCustomItems];
      const lines = [`Items: ${allItems.join(", ")}`];
      onConfirm({ componentIds: [], customItems: lines.join("\n"), beoPlacement: hasPlacement ? beoPlacement : undefined });
      return;
    }

    if (isChickenWaffle) {
      const hasPlacement = beoPlacement === "Presented Appetizer" || beoPlacement === "Buffet Metal" || beoPlacement === "Buffet China";
      const hasChicken = chickenWaffleChicken.trim().length > 0;
      const hasButter = chickenWaffleButter.trim().length > 0;
      const missing: string[] = [];
      if (!hasPlacement) missing.push("BEO Placement");
      if (!hasChicken) missing.push("Chicken (Classic or Honey hot)");
      if (!hasButter) missing.push("Butter type");
      if (missing.length > 0) {
        window.alert(`Please fill out the entire form before saving. Missing: ${missing.join(", ")}.`);
        return;
      }
      const lines: string[] = [
        `Chicken: ${chickenWaffleChicken}`,
        chickenWaffleSauces.length > 0 ? `Sauce: ${chickenWaffleSauces.join(", ")}` : "",
        `Butter: ${chickenWaffleButter}`,
        chickenWaffleAddons.length > 0 ? `Add: ${chickenWaffleAddons.join(", ")}` : "",
        chickenWaffleIncluded.length > 0 ? `Included: ${chickenWaffleIncluded.join(", ")}` : "",
      ].filter(Boolean);
      onConfirm({ componentIds: [], customItems: lines.join("\n"), beoPlacement: hasPlacement ? beoPlacement : undefined });
      return;
    }

    if (isRawBar) {
      const effectivePlacement = (beoPlacement || "Buffet Metal") as "Presented Appetizer" | "Buffet Metal" | "Buffet China";
      const filledProteins = rawBarProteins.filter(Boolean);
      const lines = [
        `Proteins: ${filledProteins.length > 0 ? filledProteins.join(", ") : RAW_BAR.includedProteins.join(", ")}`,
        ...(rawBarIncluded.length > 0 ? [`Included: ${rawBarIncluded.join(", ")}`] : []),
      ];
      onConfirm({ componentIds: [], customItems: lines.join("\n"), beoPlacement: effectivePlacement });
      return;
    }

    if (isCarving) {
      const hasPlacement = beoPlacement === "Presented Appetizer" || beoPlacement === "Buffet Metal" || beoPlacement === "Buffet China";
      const filledMeats = carvingMeats.filter(Boolean);
      const hasMeats = filledMeats.length >= 2;
      const hasPotato = carvingPotato.trim().length > 0;
      const missing: string[] = [];
      if (!hasPlacement) missing.push("BEO Placement");
      if (!hasMeats) missing.push("2 meats");
      if (!hasPotato) missing.push("Potato");
      if (missing.length > 0) {
        window.alert(`Please fill out the entire form before saving. Missing: ${missing.join(", ")}.`);
        return;
      }
      const lines = [
        `Meats: ${filledMeats.join(", ")}`,
        `Potato: ${carvingPotato}`,
        ...(carvingIncluded.length > 0 ? [`Included: ${carvingIncluded.join(", ")}`] : []),
      ];
      onConfirm({ componentIds: [], customItems: lines.join("\n"), beoPlacement: hasPlacement ? beoPlacement : undefined });
      return;
    }

    if (isHibachi) {
      const hasPlacement = beoPlacement === "Presented Appetizer" || beoPlacement === "Buffet Metal" || beoPlacement === "Buffet China";
      const filledProteins = hibachiProteins.filter(Boolean);
      const hasProteins = filledProteins.length >= 2;
      const missing: string[] = [];
      if (!hasPlacement) missing.push("BEO Placement");
      if (!hasProteins) missing.push("2 proteins");
      if (missing.length > 0) {
        window.alert(`Please fill out the entire form before saving. Missing: ${missing.join(", ")}.`);
        return;
      }
      const lines = [
        `Proteins: ${filledProteins.join(", ")}`,
        ...(hibachiUpgrades.length > 0 ? [`Upgrades: ${hibachiUpgrades.join(", ")}`] : []),
        ...(hibachiIncluded.length > 0 ? [`Included: ${hibachiIncluded.join(", ")}`] : []),
      ];
      onConfirm({ componentIds: [], customItems: lines.join("\n"), beoPlacement: hasPlacement ? beoPlacement : undefined });
      return;
    }

    if (isLateNight) {
      const hasPlacement = beoPlacement === "Presented Appetizer" || beoPlacement === "Buffet Metal" || beoPlacement === "Buffet China";
      const filled = lateNightSelected.filter(Boolean);
      const allItems = [...filled, ...lateNightCustomItems];
      const missing: string[] = [];
      if (!hasPlacement) missing.push("BEO Placement");
      if (allItems.length === 0) missing.push("at least 1 item");
      if (missing.length > 0) {
        window.alert(`Please fill out the entire form before saving. Missing: ${missing.join(", ")}.`);
        return;
      }
      const lines = [`Items: ${allItems.join(", ")}`];
      onConfirm({ componentIds: [], customItems: lines.join("\n"), beoPlacement: hasPlacement ? beoPlacement : undefined });
      return;
    }

    if (isFishermansCorner) {
      const hasPlacement = beoPlacement === "Presented Appetizer" || beoPlacement === "Buffet Metal" || beoPlacement === "Buffet China";
      const filled = fishermansCornerSelected.filter(Boolean);
      const hasTwo = filled.length >= 2;
      const missing: string[] = [];
      if (!hasPlacement) missing.push("BEO Placement");
      if (!hasTwo) missing.push("2 items");
      if (missing.length > 0) {
        window.alert(`Please fill out the entire form before saving. Missing: ${missing.join(", ")}.`);
        return;
      }
      const lines = [`Items: ${filled.join(", ")}`];
      onConfirm({ componentIds: [], customItems: lines.join("\n"), beoPlacement: hasPlacement ? beoPlacement : undefined });
      return;
    }

    const isSimpleStation = stationPresetKey === "vegetable" || stationPresetKey === "spreads-breads" || stationPresetKey === "charcuterie" || stationPresetKey === "pasta-flight" || stationPresetKey === "farmers-fruit" || stationPresetKey === "barwerx" || stationPresetKey === "philly-jawn";
    if (isSimpleStation) {
      const hasPlacement = beoPlacement === "Presented Appetizer" || beoPlacement === "Buffet Metal" || beoPlacement === "Buffet China";
      if (!hasPlacement) {
        window.alert("Please fill out the entire form before saving. Missing: BEO Placement.");
        return;
      }
      onConfirm({ componentIds: [], customItems: customItems.trim(), beoPlacement });
      return;
    }

    if (isPastaPreset) {
      const selectedSauces = selectedComponentIds.filter((id) => {
        const c = allComponents.find((x) => x.id === id);
        return c && normalizeComponentType(c.componentType) === "Sauce";
      });
      const selectedPastas = selectedComponentIds.filter((id) => {
        const c = allComponents.find((x) => x.id === id);
        return c && normalizeComponentType(c.componentType) === "Starch";
      });
      const hasPlacement = beoPlacement === "Presented Appetizer" || beoPlacement === "Buffet Metal" || beoPlacement === "Buffet China";
      const missing: string[] = [];
      if (!hasPlacement) missing.push("BEO Placement");
      if (selectedSauces.length < 3) missing.push("3 sauces");
      if (selectedPastas.length < 2) missing.push("2 pastas");
      if (missing.length > 0) {
        window.alert(`Please fill out the entire form before saving. Missing: ${missing.join(", ")}.`);
        return;
      }
    } else {
      for (const type of COMPONENT_TYPE_ORDER) {
        const limit = getLimitForType(type);
        if (limit >= 999) continue;
        const selectedInType = selectedComponentIds.filter((id) => {
          const c = allComponents.find((x) => x.id === id);
          return c && normalizeComponentType(c.componentType) === type;
        });
        if (selectedInType.length < limit) {
          const noun = { Starch: "pastas", Sauce: "sauces", Protein: "proteins", Vegetable: "vegetables", Topping: "toppings" }[type] ?? type.toLowerCase() + "s";
          window.alert(`Please fill out the entire form before saving. You need to select ${limit} ${noun} in the ${displayType(type)} section.`);
          return;
        }
      }
    }

    const extras = [otherInput, customSauceInput, customCondimentInput, customPastaInput, customProteinInput]
      .map((s) => s?.trim())
      .filter(Boolean);
    const customText = extras.length > 0 ? `${customItems ? customItems + "\n" : ""}${extras.join("\n")}` : customItems;
    const placement = beoPlacement === "Presented Appetizer" || beoPlacement === "Buffet Metal" || beoPlacement === "Buffet China" ? beoPlacement : undefined;
    onConfirm({ componentIds: selectedComponentIds, customItems: customText, beoPlacement: placement });
  };

  const grouped = groupByComponentType(allComponents);
  const selectedSet = new Set(selectedComponentIds);

  if (!isOpen) return null;

  const content = (
    <div className="station-config-modal" style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div className="station-config-modal-backdrop" style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.85)" }} onClick={onCancel} aria-hidden="true" />
      <div
        role="dialog"
        style={{
          position: "relative",
          zIndex: 1,
          backgroundColor: "#1a1a1a",
          borderRadius: 12,
          border: "2px solid #ff6b6b",
          maxWidth: 640,
          width: "100%",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: 16, borderBottom: "1px solid #444", flexShrink: 0 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: "#e0e0e0" }}>
            Configure Station {presetName || "(Select Preset)"}
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: "#ff6b6b", fontWeight: 600 }}>
            Follow the instructions in each section — pick the required number of items.
          </p>
        </div>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #333", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={handleAutoFill}
            disabled={loading || !presetId}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #ff6b6b",
              background: "rgba(255,107,107,0.15)",
              color: "#ff6b6b",
              fontSize: 12,
              fontWeight: 600,
              cursor: loading || !presetId ? "not-allowed" : "pointer",
              opacity: loading || !presetId ? 0.5 : 1,
            }}
          >
            Auto-Fill FoodWerx Defaults
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={loading || (selectedComponentIds.length === 0 && !(isTexMex || isRamen || isAllAmerican || isStreetFood || isChickenWaffle || isRawBar || isCarving || isHibachi || isLateNight || isFishermansCorner))}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #666",
              background: "rgba(160,160,160,0.1)",
              color: "#a0a0a0",
              fontSize: 12,
              fontWeight: 600,
              cursor: loading || (selectedComponentIds.length === 0 && !(isTexMex || isRamen || isAllAmerican || isStreetFood || isChickenWaffle || isRawBar || isCarving || isHibachi || isLateNight || isFishermansCorner)) ? "not-allowed" : "pointer",
              opacity: loading || (selectedComponentIds.length === 0 && !(isTexMex || isRamen || isAllAmerican || isStreetFood || isChickenWaffle || isRawBar || isCarving || isHibachi || isLateNight || isFishermansCorner)) ? 0.5 : 1,
            }}
          >
            Clear All & Start Over
          </button>
          {guestCount > 0 && (
            <span style={{ marginLeft: 8, fontSize: 12, color: "#888" }}>
              ({guestCount} guests)
            </span>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {loading ? (
            <div style={{ color: "#999", padding: 24, textAlign: "center" }}>Loading…</div>
          ) : presetId && isTexMex ? (
            (() => {
              const rowInputStyle = { padding: "5px 8px", borderRadius: 5, border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#e0e0e0", fontSize: 12, minWidth: 0, width: "100%" };
              const updateProtein = (idx: number, val: string) => {
                const next = [...texMexProteins];
                next[idx] = val;
                setTexMexProteins(next);
              };
              return (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>BEO Placement <span style={{ color: "#ff6b6b" }}>*</span></label>
                    <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#999" }}>Required — for placement on the BEO</p>
                    <select value={beoPlacement} onChange={(e) => setBeoPlacement(e.target.value as "Presented Appetizer" | "Buffet Metal" | "Buffet China" | "")} style={{ ...rowInputStyle, minWidth: 160, width: "auto" }}>
                      <option value="">Select...</option>
                      <option value="Presented Appetizer">Presented Appetizer</option>
                      <option value="Buffet Metal">Buffet Metal</option>
                      <option value="Buffet China">Buffet China</option>
                    </select>
                  </div>
                  <CollapsibleSubsection title="Shell - Pick 1" icon="▶" defaultOpen={sectionsExpanded} accentColor="#eab308">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <select value={texMexShell} onChange={(e) => setTexMexShell(e.target.value as "Soft" | "Hard" | "")} style={{ ...rowInputStyle, minWidth: 140, width: "auto" }}>
                          <option value="">Select shell...</option>
                          <option value="Soft">Soft</option>
                          <option value="Hard">Hard</option>
                        </select>
                        <button type="button" onClick={() => setTexMexShell("")} disabled={!texMexShell} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#eab308", fontSize: 13, fontWeight: "bold", cursor: texMexShell ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: texMexShell ? 1 : 0.4 }}>✕</button>
                      </div>
                    </div>
                  </CollapsibleSubsection>
                  <CollapsibleSubsection title="Proteins - Pick 2 (or more)" icon="▶" defaultOpen={sectionsExpanded} accentColor="#22c55e">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {texMexProteins.map((val, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input type="text" value={val} onChange={(e) => updateProtein(idx, e.target.value)} list={`tex-mex-protein-${idx}`} placeholder="Select or type protein..." style={{ ...rowInputStyle, minWidth: 150, width: "auto" }} />
                            <datalist id={`tex-mex-protein-${idx}`}>{TEX_MEX.proteinOptions.map((p) => <option key={p} value={p} />)}</datalist>
                            <button type="button" onClick={() => { const next = texMexProteins.filter((_, i) => i !== idx); setTexMexProteins(next.length >= 2 ? next : [...next, ""].slice(0, Math.max(2, next.length))); }} disabled={texMexProteins.length <= 2 && !val} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#22c55e", fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: (texMexProteins.length <= 2 && !val) ? 0.4 : 1 }}>✕</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setTexMexProteins((p) => [...p, ""])} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #22c55e", background: "rgba(34,197,94,0.15)", color: "#22c55e", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add Protein</button>
                      </div>
                    </div>
                  </CollapsibleSubsection>
                  <CollapsibleSubsection title="Included (Toppings & Sides)" icon="▶" defaultOpen={sectionsExpanded} accentColor="#94a3b8">
                    <div style={{ gridColumn: "1 / -1" }}>
                      {(() => {
                        const TEX_MEX_INCLUDED_OPTIONS = [...TEX_MEX.includedToppings, ...TEX_MEX.includedSides];
                        const available = TEX_MEX_INCLUDED_OPTIONS.filter((opt) => !texMexIncluded.includes(opt));
                        return (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                            {texMexIncluded.map((item, idx) => {
                              const isCustom = !TEX_MEX_INCLUDED_OPTIONS.includes(item);
                              return (
                                <div key={`${idx}-${item}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <select
                                    value={isCustom ? "__custom__" : item}
                                    onChange={(e) => { if (e.target.value === "__custom__") return; const next = [...texMexIncluded]; next[idx] = e.target.value; setTexMexIncluded(next); }}
                                    style={{ ...rowInputStyle, minWidth: 220, width: "auto" }}
                                  >
                                    <option value="">Select item...</option>
                                    {TEX_MEX_INCLUDED_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                    {isCustom && <option value="__custom__">{item}</option>}
                                  </select>
                                  <button type="button" onClick={() => setTexMexIncluded((prev) => prev.filter((_, i) => i !== idx))} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#22c55e", fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                </div>
                              );
                            })}
                            {available.length > 0 && (
                              <select value="" onChange={(e) => { if (e.target.value) setTexMexIncluded((prev) => [...prev, e.target.value]); }} style={{ ...rowInputStyle, minWidth: 180, width: "auto" }}>
                                <option value="">Add from list...</option>
                                {available.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                              </select>
                            )}
                            <input type="text" value={texMexIncludedInput} onChange={(e) => setTexMexIncludedInput(e.target.value)} placeholder="Type custom item..." style={{ ...rowInputStyle, minWidth: 160, width: "auto" }} onKeyDown={(e) => { if (e.key === "Enter" && texMexIncludedInput.trim()) { setTexMexIncluded((prev) => [...prev, texMexIncludedInput.trim()]); setTexMexIncludedInput(""); } }} />
                            <button type="button" onClick={() => { if (texMexIncludedInput.trim()) { setTexMexIncluded((prev) => [...prev, texMexIncludedInput.trim()]); setTexMexIncludedInput(""); } }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #22c55e", background: "rgba(34,197,94,0.15)", color: "#22c55e", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add Component</button>
                          </div>
                        );
                      })()}
                    </div>
                  </CollapsibleSubsection>
                </>
              );
            })()
          ) : presetId && isRamen ? (
            (() => {
              const rowInputStyle = { padding: "5px 8px", borderRadius: 5, border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#e0e0e0", fontSize: 12, minWidth: 0, width: "100%" };
              return (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>BEO Placement <span style={{ color: "#ff6b6b" }}>*</span></label>
                    <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#999" }}>Required — for placement on the BEO</p>
                    <select value={beoPlacement} onChange={(e) => setBeoPlacement(e.target.value as "Presented Appetizer" | "Buffet Metal" | "Buffet China" | "")} style={{ ...rowInputStyle, minWidth: 160, width: "auto" }}>
                      <option value="">Select...</option>
                      <option value="Presented Appetizer">Presented Appetizer</option>
                      <option value="Buffet Metal">Buffet Metal</option>
                      <option value="Buffet China">Buffet China</option>
                    </select>
                  </div>
                  <CollapsibleSubsection title="Stock - Pick 1" icon="▶" defaultOpen={sectionsExpanded} accentColor="#14b8a6">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <select
                            value={(RAMEN.stockOptions as readonly string[]).includes(ramenStock) ? ramenStock : (ramenStock ? "__custom__" : "")}
                            onChange={(e) => { if (e.target.value === "__custom__") return; setRamenStock(e.target.value); }}
                            style={{ ...rowInputStyle, minWidth: 240, width: "auto" }}
                          >
                            <option value="">Select...</option>
                            {RAMEN.stockOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                            <option value="__custom__">Other (type below)...</option>
                          </select>
                          <button type="button" onClick={() => setRamenStock("")} disabled={!ramenStock} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#14b8a6", fontSize: 13, fontWeight: "bold", cursor: ramenStock ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: ramenStock ? 1 : 0.4 }}>✕</button>
                        </div>
                        <input
                          type="text"
                          value={!(RAMEN.stockOptions as readonly string[]).includes(ramenStock) ? ramenStock : ""}
                          onChange={(e) => setRamenStock(e.target.value)}
                          placeholder="Type custom..."
                          style={{ ...rowInputStyle, minWidth: 200, width: "auto" }}
                        />
                      </div>
                    </div>
                  </CollapsibleSubsection>
                  <CollapsibleSubsection title="Protein - Pick 1 (or more)" icon="▶" defaultOpen={sectionsExpanded} accentColor="#eab308">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <select
                            value={(RAMEN.proteinOptions as readonly string[]).includes(ramenProtein) ? ramenProtein : (ramenProtein ? "__custom__" : "")}
                            onChange={(e) => { if (e.target.value === "__custom__") return; setRamenProtein(e.target.value); }}
                            style={{ ...rowInputStyle, minWidth: 240, width: "auto" }}
                          >
                            <option value="">Select...</option>
                            {RAMEN.proteinOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                            <option value="__custom__">Other (type below)...</option>
                          </select>
                          <button type="button" onClick={() => setRamenProtein("")} disabled={!ramenProtein} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#eab308", fontSize: 13, fontWeight: "bold", cursor: ramenProtein ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: ramenProtein ? 1 : 0.4 }}>✕</button>
                        </div>
                        <input
                          type="text"
                          value={!(RAMEN.proteinOptions as readonly string[]).includes(ramenProtein) ? ramenProtein : ""}
                          onChange={(e) => setRamenProtein(e.target.value)}
                          placeholder="Type custom..."
                          style={{ ...rowInputStyle, minWidth: 200, width: "auto" }}
                        />
                      </div>
                    </div>
                  </CollapsibleSubsection>
                  <CollapsibleSubsection title="Included (Toppings & Sauces)" icon="▶" defaultOpen={sectionsExpanded} accentColor="#94a3b8">
                    <div style={{ gridColumn: "1 / -1" }}>
                      {(() => {
                        const RAMEN_INCLUDED_OPTIONS = [...RAMEN.includedToppings, ...RAMEN.includedSauces];
                        const available = RAMEN_INCLUDED_OPTIONS.filter((opt) => !ramenIncluded.includes(opt));
                        return (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                            {ramenIncluded.map((item, idx) => {
                              const isCustom = !RAMEN_INCLUDED_OPTIONS.includes(item);
                              return (
                                <div key={`${idx}-${item}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <select
                                    value={isCustom ? "__custom__" : item}
                                    onChange={(e) => { if (e.target.value === "__custom__") return; const next = [...ramenIncluded]; next[idx] = e.target.value; setRamenIncluded(next); }}
                                    style={{ ...rowInputStyle, minWidth: 220, width: "auto" }}
                                  >
                                    <option value="">Select item...</option>
                                    {RAMEN_INCLUDED_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                    {isCustom && <option value="__custom__">{item}</option>}
                                  </select>
                                  <button type="button" onClick={() => setRamenIncluded((prev) => prev.filter((_, i) => i !== idx))} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#22c55e", fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                </div>
                              );
                            })}
                            {available.length > 0 && (
                              <select value="" onChange={(e) => { if (e.target.value) setRamenIncluded((prev) => [...prev, e.target.value]); }} style={{ ...rowInputStyle, minWidth: 180, width: "auto" }}>
                                <option value="">Add from list...</option>
                                {available.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                              </select>
                            )}
                            <input type="text" value={ramenIncludedInput} onChange={(e) => setRamenIncludedInput(e.target.value)} placeholder="Type custom item..." style={{ ...rowInputStyle, minWidth: 160, width: "auto" }} onKeyDown={(e) => { if (e.key === "Enter" && ramenIncludedInput.trim()) { setRamenIncluded((prev) => [...prev, ramenIncludedInput.trim()]); setRamenIncludedInput(""); } }} />
                            <button type="button" onClick={() => { if (ramenIncludedInput.trim()) { setRamenIncluded((prev) => [...prev, ramenIncludedInput.trim()]); setRamenIncludedInput(""); } }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #22c55e", background: "rgba(34,197,94,0.15)", color: "#22c55e", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add Component</button>
                          </div>
                        );
                      })()}
                    </div>
                  </CollapsibleSubsection>
                </>
              );
            })()
          ) : presetId && isAllAmerican ? (
            (() => {
              const rowInputStyle = { padding: "5px 8px", borderRadius: 5, border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#e0e0e0", fontSize: 12, minWidth: 0, width: "100%" };
              return (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>BEO Placement <span style={{ color: "#ff6b6b" }}>*</span></label>
                    <select value={beoPlacement} onChange={(e) => setBeoPlacement(e.target.value as "Presented Appetizer" | "Buffet Metal" | "Buffet China" | "")} style={{ ...rowInputStyle, minWidth: 160, width: "auto" }}>
                      <option value="">Select...</option>
                      <option value="Presented Appetizer">Presented Appetizer</option>
                      <option value="Buffet Metal">Buffet Metal</option>
                      <option value="Buffet China">Buffet China</option>
                    </select>
                  </div>
                  <CollapsibleSubsection title="Main - Pick 1" icon="▶" defaultOpen={sectionsExpanded} accentColor="#eab308">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <select
                            value={(ALL_AMERICAN.mainOptions as readonly string[]).includes(allAmericanMain) ? allAmericanMain : (allAmericanMain ? "__custom__" : "")}
                            onChange={(e) => { if (e.target.value === "__custom__") return; setAllAmericanMain(e.target.value); }}
                            style={{ ...rowInputStyle, minWidth: 300, width: "auto" }}
                          >
                            <option value="">Select...</option>
                            {ALL_AMERICAN.mainOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                            <option value="__custom__">Other (type below)...</option>
                          </select>
                          <button type="button" onClick={() => setAllAmericanMain("")} disabled={!allAmericanMain} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#eab308", fontSize: 13, fontWeight: "bold", cursor: allAmericanMain ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: allAmericanMain ? 1 : 0.4 }}>✕</button>
                        </div>
                        <input
                          type="text"
                          value={!(ALL_AMERICAN.mainOptions as readonly string[]).includes(allAmericanMain) ? allAmericanMain : ""}
                          onChange={(e) => setAllAmericanMain(e.target.value)}
                          placeholder="Type custom..."
                          style={{ ...rowInputStyle, minWidth: 200, width: "auto" }}
                        />
                      </div>
                    </div>
                  </CollapsibleSubsection>
                  <CollapsibleSubsection title="Potato - Pick 1" icon="▶" defaultOpen={sectionsExpanded} accentColor="#22c55e">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <select
                            value={(ALL_AMERICAN.potatoOptions as readonly string[]).includes(allAmericanPotato) ? allAmericanPotato : (allAmericanPotato ? "__custom__" : "")}
                            onChange={(e) => { if (e.target.value === "__custom__") return; setAllAmericanPotato(e.target.value); }}
                            style={{ ...rowInputStyle, minWidth: 360, width: "auto" }}
                          >
                            <option value="">Select...</option>
                            {ALL_AMERICAN.potatoOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                            <option value="__custom__">Other (type below)...</option>
                          </select>
                          <button type="button" onClick={() => setAllAmericanPotato("")} disabled={!allAmericanPotato} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#22c55e", fontSize: 13, fontWeight: "bold", cursor: allAmericanPotato ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: allAmericanPotato ? 1 : 0.4 }}>✕</button>
                        </div>
                        <input
                          type="text"
                          value={!(ALL_AMERICAN.potatoOptions as readonly string[]).includes(allAmericanPotato) ? allAmericanPotato : ""}
                          onChange={(e) => setAllAmericanPotato(e.target.value)}
                          placeholder="Type custom..."
                          style={{ ...rowInputStyle, minWidth: 200, width: "auto" }}
                        />
                      </div>
                    </div>
                  </CollapsibleSubsection>
                  <CollapsibleSubsection title="Chicken & Salad" icon="▶" defaultOpen={sectionsExpanded} accentColor="#14b8a6">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ ...labelStyle, display: "block", marginBottom: 4 }}>Chicken tenders</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <select
                              value={(ALL_AMERICAN.chickenOptions as readonly string[]).includes(allAmericanChicken) ? allAmericanChicken : (allAmericanChicken ? "__custom__" : "")}
                              onChange={(e) => { if (e.target.value === "__custom__") return; setAllAmericanChicken(e.target.value); }}
                              style={{ ...rowInputStyle, minWidth: 240, width: "auto" }}
                            >
                              <option value="">Select...</option>
                              {ALL_AMERICAN.chickenOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                              <option value="__custom__">Other (type below)...</option>
                            </select>
                            <button type="button" onClick={() => setAllAmericanChicken("")} disabled={!allAmericanChicken} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#14b8a6", fontSize: 13, fontWeight: "bold", cursor: allAmericanChicken ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: allAmericanChicken ? 1 : 0.4 }}>✕</button>
                          </div>
                          <input
                            type="text"
                            value={!(ALL_AMERICAN.chickenOptions as readonly string[]).includes(allAmericanChicken) ? allAmericanChicken : ""}
                            onChange={(e) => setAllAmericanChicken(e.target.value)}
                            placeholder="Type custom..."
                            style={{ ...rowInputStyle, minWidth: 200, width: "auto" }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <label style={{ ...labelStyle, minWidth: 110 }}>Salad shooters</label>
                        <select value={allAmericanSalad} onChange={(e) => setAllAmericanSalad(e.target.value)} style={{ ...rowInputStyle, minWidth: 120, width: "auto" }}>
                          <option value="">Select...</option>
                          {ALL_AMERICAN.saladShooters.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => setAllAmericanSalad("")} disabled={!allAmericanSalad} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#14b8a6", fontSize: 13, fontWeight: "bold", cursor: allAmericanSalad ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: allAmericanSalad ? 1 : 0.4 }}>✕</button>
                      </div>
                    </div>
                  </CollapsibleSubsection>
                </>
              );
            })()
          ) : presetId && isStreetFood ? (
            (() => {
              const rowInputStyle = { padding: "5px 8px", borderRadius: 5, border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#e0e0e0", fontSize: 12, minWidth: 0, width: "100%" };
              const updateStreetFood = (idx: number, val: string) => {
                const next = [...streetFoodSelected];
                next[idx] = val;
                setStreetFoodSelected(next);
              };
              return (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>BEO Placement <span style={{ color: "#ff6b6b" }}>*</span></label>
                    <select value={beoPlacement} onChange={(e) => setBeoPlacement(e.target.value as "Presented Appetizer" | "Buffet Metal" | "Buffet China" | "")} style={{ ...rowInputStyle, minWidth: 160, width: "auto" }}>
                      <option value="">Select...</option>
                      <option value="Presented Appetizer">Presented Appetizer</option>
                      <option value="Buffet Metal">Buffet Metal</option>
                      <option value="Buffet China">Buffet China</option>
                    </select>
                  </div>
                  <CollapsibleSubsection title="Choose Items" icon="▶" defaultOpen={sectionsExpanded} accentColor="#a855f7">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {streetFoodSelected.map((val, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input type="text" value={val} onChange={(e) => updateStreetFood(idx, e.target.value)} list={`street-food-item-${idx}`} placeholder={`Select or type item ${idx + 1}...`} style={{ ...rowInputStyle, flex: 1, minWidth: 200 }} />
                            <datalist id={`street-food-item-${idx}`}>{STREET_FOOD.options.map((o) => <option key={o} value={o} />)}</datalist>
                            <button type="button" onClick={() => { const next = streetFoodSelected.filter((_, i) => i !== idx); setStreetFoodSelected(next.length > 0 ? next : [""]); }} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#a855f7", fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setStreetFoodSelected((s) => [...s, ""])} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #a855f7", background: "rgba(168,85,247,0.15)", color: "#a855f7", fontSize: 11, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" }}>+ Add Another Item</button>
                      </div>
                    </div>
                  </CollapsibleSubsection>
                  <CollapsibleSubsection title="+ Add Custom Items" icon="▶" defaultOpen={sectionsExpanded} accentColor="#94a3b8">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {streetFoodCustomItems.map((item, idx) => (
                          <span key={`${idx}-${item}`} style={{ fontSize: 12, padding: "4px 8px", backgroundColor: "#2a2a2a", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            {item}
                            <button type="button" onClick={() => setStreetFoodCustomItems((prev) => prev.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 10 }}>✕</button>
                          </span>
                        ))}
                        <input type="text" value={streetFoodCustomInput} onChange={(e) => setStreetFoodCustomInput(e.target.value)} placeholder="Type custom item..." style={{ ...rowInputStyle, minWidth: 120, width: "auto" }} onKeyDown={(e) => { if (e.key === "Enter" && streetFoodCustomInput.trim()) { setStreetFoodCustomItems((prev) => [...prev, streetFoodCustomInput.trim()]); setStreetFoodCustomInput(""); } }} />
                        <button type="button" onClick={() => { if (streetFoodCustomInput.trim()) { setStreetFoodCustomItems((prev) => [...prev, streetFoodCustomInput.trim()]); setStreetFoodCustomInput(""); } }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #94a3b8", background: "rgba(148,163,184,0.15)", color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add</button>
                      </div>
                    </div>
                  </CollapsibleSubsection>
                </>
              );
            })()
          ) : presetId && isChickenWaffle ? (
            (() => {
              const rowInputStyle = { padding: "5px 8px", borderRadius: 5, border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#e0e0e0", fontSize: 12, minWidth: 0, width: "100%" };
              const blockStyle = { fontSize: 12, padding: "4px 8px", backgroundColor: "#2a2a2a", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 };
              return (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>BEO Placement <span style={{ color: "#ff6b6b" }}>*</span></label>
                    <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#999" }}>Required — for placement on the BEO</p>
                    <select value={beoPlacement} onChange={(e) => setBeoPlacement(e.target.value as "Presented Appetizer" | "Buffet Metal" | "Buffet China" | "")} style={{ ...rowInputStyle, minWidth: 160, width: "auto" }}>
                      <option value="">Select...</option>
                      <option value="Presented Appetizer">Presented Appetizer</option>
                      <option value="Buffet Metal">Buffet Metal</option>
                      <option value="Buffet China">Buffet China</option>
                    </select>
                  </div>

                  <CollapsibleSubsection title="Chicken - Pick 1" icon="▶" defaultOpen={sectionsExpanded} accentColor="#eab308">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <select
                            value={(CHICKEN_WAFFLE.chickenOptions as readonly string[]).includes(chickenWaffleChicken) ? chickenWaffleChicken : (chickenWaffleChicken ? "__custom__" : "")}
                            onChange={(e) => {
                              if (e.target.value === "__custom__") return;
                              setChickenWaffleChicken(e.target.value);
                            }}
                            style={{ ...rowInputStyle, minWidth: 260, width: "auto" }}
                          >
                            <option value="">Select chicken style...</option>
                            {CHICKEN_WAFFLE.chickenOptions.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                            <option value="__custom__">Other (type below)...</option>
                          </select>
                          <button type="button" onClick={() => setChickenWaffleChicken("")} disabled={!chickenWaffleChicken} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#eab308", fontSize: 13, fontWeight: "bold", cursor: chickenWaffleChicken ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: chickenWaffleChicken ? 1 : 0.4 }}>✕</button>
                        </div>
                        <input
                          type="text"
                          value={!(CHICKEN_WAFFLE.chickenOptions as readonly string[]).includes(chickenWaffleChicken) ? chickenWaffleChicken : ""}
                          onChange={(e) => setChickenWaffleChicken(e.target.value)}
                          placeholder="Type custom chicken style..."
                          style={{ ...rowInputStyle, minWidth: 200, width: "auto" }}
                        />
                      </div>
                    </div>
                  </CollapsibleSubsection>

                  <CollapsibleSubsection title="+ Add Sauce" icon="▶" defaultOpen={sectionsExpanded} accentColor="#14b8a6">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {chickenWaffleSauces.map((s, idx) => (
                          <span key={`${idx}-${s}`} style={blockStyle}>
                            {s}
                            <button type="button" onClick={() => setChickenWaffleSauces((prev) => prev.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 10 }}>✕</button>
                          </span>
                        ))}
                        <input type="text" value={chickenWaffleSauceInput} onChange={(e) => setChickenWaffleSauceInput(e.target.value)} placeholder="Type sauce..." style={{ ...rowInputStyle, minWidth: 120, width: "auto" }} onKeyDown={(e) => { if (e.key === "Enter" && chickenWaffleSauceInput.trim()) { setChickenWaffleSauces((prev) => [...prev, chickenWaffleSauceInput.trim()]); setChickenWaffleSauceInput(""); } }} />
                        <button type="button" onClick={() => { if (chickenWaffleSauceInput.trim()) { setChickenWaffleSauces((prev) => [...prev, chickenWaffleSauceInput.trim()]); setChickenWaffleSauceInput(""); } }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #14b8a6", background: "rgba(20,184,166,0.15)", color: "#14b8a6", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add Sauce</button>
                      </div>
                    </div>
                  </CollapsibleSubsection>

                  <CollapsibleSubsection title="Butter - Pick 1" icon="▶" defaultOpen={sectionsExpanded} accentColor="#a855f7">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <select
                            value={(CHICKEN_WAFFLE.butterOptions as readonly string[]).includes(chickenWaffleButter) ? chickenWaffleButter : (chickenWaffleButter ? "__custom__" : "")}
                            onChange={(e) => {
                              if (e.target.value === "__custom__") return;
                              setChickenWaffleButter(e.target.value);
                            }}
                            style={{ ...rowInputStyle, minWidth: 240, width: "auto" }}
                          >
                            <option value="">Select butter style...</option>
                            {CHICKEN_WAFFLE.butterOptions.map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                            <option value="__custom__">Other (type below)...</option>
                          </select>
                          <button type="button" onClick={() => setChickenWaffleButter("")} disabled={!chickenWaffleButter} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#a855f7", fontSize: 13, fontWeight: "bold", cursor: chickenWaffleButter ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: chickenWaffleButter ? 1 : 0.4 }}>✕</button>
                        </div>
                        <input
                          type="text"
                          value={!(CHICKEN_WAFFLE.butterOptions as readonly string[]).includes(chickenWaffleButter) ? chickenWaffleButter : ""}
                          onChange={(e) => setChickenWaffleButter(e.target.value)}
                          placeholder="Type custom butter style..."
                          style={{ ...rowInputStyle, minWidth: 200, width: "auto" }}
                        />
                      </div>
                    </div>
                  </CollapsibleSubsection>

                  <CollapsibleSubsection title="+ Add" icon="▶" defaultOpen={sectionsExpanded} accentColor="#94a3b8">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {chickenWaffleAddons.map((a, idx) => (
                          <span key={`${idx}-${a}`} style={blockStyle}>
                            {a}
                            <button type="button" onClick={() => setChickenWaffleAddons((prev) => prev.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 10 }}>✕</button>
                          </span>
                        ))}
                        <input type="text" value={chickenWaffleAddInput} onChange={(e) => setChickenWaffleAddInput(e.target.value)} placeholder="e.g. jelly, etc." style={{ ...rowInputStyle, minWidth: 120, width: "auto" }} onKeyDown={(e) => { if (e.key === "Enter" && chickenWaffleAddInput.trim()) { setChickenWaffleAddons((prev) => [...prev, chickenWaffleAddInput.trim()]); setChickenWaffleAddInput(""); } }} />
                        <button type="button" onClick={() => { if (chickenWaffleAddInput.trim()) { setChickenWaffleAddons((prev) => [...prev, chickenWaffleAddInput.trim()]); setChickenWaffleAddInput(""); } }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #94a3b8", background: "rgba(148,163,184,0.15)", color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add</button>
                      </div>
                    </div>
                  </CollapsibleSubsection>

                  <CollapsibleSubsection title="Included" icon="▶" defaultOpen={sectionsExpanded} accentColor="#22c55e">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {chickenWaffleIncluded.map((item, idx) => {
                          const isCustom = !(CHICKEN_WAFFLE.included as readonly string[]).includes(item);
                          return (
                            <div key={`${idx}-${item}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <select
                                value={isCustom ? "__custom__" : item}
                                onChange={(e) => {
                                  if (e.target.value === "__custom__") return;
                                  const next = [...chickenWaffleIncluded];
                                  next[idx] = e.target.value;
                                  setChickenWaffleIncluded(next);
                                }}
                                style={{ ...rowInputStyle, minWidth: 220, width: "auto" }}
                              >
                                <option value="">Select item...</option>
                                {CHICKEN_WAFFLE.included.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                                {isCustom && <option value="__custom__">{item}</option>}
                              </select>
                              <button
                                type="button"
                                onClick={() => setChickenWaffleIncluded((prev) => prev.filter((_, i) => i !== idx))}
                                style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#22c55e", fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                              >✕</button>
                            </div>
                          );
                        })}
                        {(() => {
                          const available = (CHICKEN_WAFFLE.included as readonly string[]).filter((opt) => !chickenWaffleIncluded.includes(opt));
                          return available.length > 0 ? (
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) setChickenWaffleIncluded((prev) => [...prev, e.target.value]);
                              }}
                              style={{ ...rowInputStyle, minWidth: 180, width: "auto" }}
                            >
                              <option value="">Add from list...</option>
                              {available.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : null;
                        })()}
                        <input type="text" value={chickenWaffleIncludedInput} onChange={(e) => setChickenWaffleIncludedInput(e.target.value)} placeholder="Type custom item..." style={{ ...rowInputStyle, minWidth: 160, width: "auto" }} onKeyDown={(e) => { if (e.key === "Enter" && chickenWaffleIncludedInput.trim()) { setChickenWaffleIncluded((prev) => [...prev, chickenWaffleIncludedInput.trim()]); setChickenWaffleIncludedInput(""); } }} />
                        <button type="button" onClick={() => { if (chickenWaffleIncludedInput.trim()) { setChickenWaffleIncluded((prev) => [...prev, chickenWaffleIncludedInput.trim()]); setChickenWaffleIncludedInput(""); } }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #22c55e", background: "rgba(34,197,94,0.15)", color: "#22c55e", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add Component</button>
                      </div>
                    </div>
                  </CollapsibleSubsection>
                </>
              );
            })()
          ) : presetId && isRawBar ? (
            (() => {
              const rowInputStyle = { padding: "5px 8px", borderRadius: 5, border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#e0e0e0", fontSize: 12, minWidth: 0, width: "100%" };
              const updateRawBarProtein = (idx: number, val: string) => { const n = [...rawBarProteins]; n[idx] = val; setRawBarProteins(n); };
              return (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>BEO Placement <span style={{ color: "#ff6b6b" }}>*</span></label>
                    <select value={beoPlacement || "Buffet Metal"} onChange={(e) => setBeoPlacement(e.target.value as "Presented Appetizer" | "Buffet Metal" | "Buffet China" | "")} style={{ ...rowInputStyle, minWidth: 160, width: "auto" }}>
                      <option value="Presented Appetizer">Presented Appetizer</option>
                      <option value="Buffet Metal">Buffet Metal</option>
                      <option value="Buffet China">Buffet China</option>
                    </select>
                  </div>
                  <CollapsibleSubsection title="Proteins (All Included)" icon="▶" defaultOpen={sectionsExpanded} accentColor="#eab308">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#999" }}>All 3 proteins are always included. Edit or remove for custom orders only.</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {rawBarProteins.map((val, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input type="text" value={val} onChange={(e) => updateRawBarProtein(idx, e.target.value)} list={`raw-bar-protein-${idx}`} placeholder="Protein..." style={{ ...rowInputStyle, minWidth: 150, width: "auto" }} />
                            <datalist id={`raw-bar-protein-${idx}`}>{RAW_BAR.includedProteins.map((p) => <option key={p} value={p} />)}</datalist>
                            <button type="button" onClick={() => setRawBarProteins((prev) => prev.filter((_, i) => i !== idx))} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#eab308", fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setRawBarProteins((p) => [...p, ""])} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #eab308", background: "rgba(234,179,8,0.15)", color: "#eab308", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add Protein</button>
                      </div>
                    </div>
                  </CollapsibleSubsection>
                  <CollapsibleSubsection title="Included (Garnishes)" icon="▶" defaultOpen={sectionsExpanded} accentColor="#22c55e">
                    <div style={{ gridColumn: "1 / -1" }}>
                      {(() => {
                        const RAW_BAR_GARNISH_OPTIONS = [...RAW_BAR.includedGarnishes];
                        const available = RAW_BAR_GARNISH_OPTIONS.filter((opt) => !rawBarIncluded.includes(opt));
                        return (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                            {rawBarIncluded.map((item, idx) => {
                              const isCustom = !RAW_BAR_GARNISH_OPTIONS.includes(item);
                              return (
                                <div key={`${idx}-${item}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <select
                                    value={isCustom ? "__custom__" : item}
                                    onChange={(e) => { if (e.target.value === "__custom__") return; const next = [...rawBarIncluded]; next[idx] = e.target.value; setRawBarIncluded(next); }}
                                    style={{ ...rowInputStyle, minWidth: 220, width: "auto" }}
                                  >
                                    <option value="">Select item...</option>
                                    {RAW_BAR_GARNISH_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                    {isCustom && <option value="__custom__">{item}</option>}
                                  </select>
                                  <button type="button" onClick={() => setRawBarIncluded((prev) => prev.filter((_, i) => i !== idx))} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#22c55e", fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                </div>
                              );
                            })}
                            {available.length > 0 && (
                              <select value="" onChange={(e) => { if (e.target.value) setRawBarIncluded((prev) => [...prev, e.target.value]); }} style={{ ...rowInputStyle, minWidth: 180, width: "auto" }}>
                                <option value="">Add from list...</option>
                                {available.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                              </select>
                            )}
                            <input type="text" value={rawBarIncludedInput} onChange={(e) => setRawBarIncludedInput(e.target.value)} placeholder="Type custom garnish..." style={{ ...rowInputStyle, minWidth: 160, width: "auto" }} onKeyDown={(e) => { if (e.key === "Enter" && rawBarIncludedInput.trim()) { setRawBarIncluded((prev) => [...prev, rawBarIncludedInput.trim()]); setRawBarIncludedInput(""); } }} />
                            <button type="button" onClick={() => { if (rawBarIncludedInput.trim()) { setRawBarIncluded((prev) => [...prev, rawBarIncludedInput.trim()]); setRawBarIncludedInput(""); } }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #22c55e", background: "rgba(34,197,94,0.15)", color: "#22c55e", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add Component</button>
                          </div>
                        );
                      })()}
                    </div>
                  </CollapsibleSubsection>
                </>
              );
            })()
          ) : presetId && isCarving ? (
            (() => {
              const rowInputStyle = { padding: "5px 8px", borderRadius: 5, border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#e0e0e0", fontSize: 12, minWidth: 0, width: "100%" };
              const blockStyle = { fontSize: 12, padding: "4px 8px", backgroundColor: "#2a2a2a", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 };
              const updateMeat = (idx: number, val: string) => { const n = [...carvingMeats]; n[idx] = val; setCarvingMeats(n); };
              return (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>BEO Placement <span style={{ color: "#ff6b6b" }}>*</span></label>
                    <select value={beoPlacement} onChange={(e) => setBeoPlacement(e.target.value as "Presented Appetizer" | "Buffet Metal" | "Buffet China" | "")} style={{ ...rowInputStyle, minWidth: 160, width: "auto" }}>
                      <option value="">Select...</option>
                      <option value="Presented Appetizer">Presented Appetizer</option>
                      <option value="Buffet Metal">Buffet Metal</option>
                      <option value="Buffet China">Buffet China</option>
                    </select>
                  </div>
                  <CollapsibleSubsection title="Meats - Pick 2 (or more)" icon="▶" defaultOpen={sectionsExpanded} accentColor="#eab308">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {carvingMeats.map((val, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input type="text" value={val} onChange={(e) => updateMeat(idx, e.target.value)} list={`carving-meat-${idx}`} placeholder="Select or type meat..." style={{ ...rowInputStyle, minWidth: 200, width: "auto" }} />
                            <datalist id={`carving-meat-${idx}`}>{CARVING.meatOptions.map((o) => <option key={o} value={o} />)}</datalist>
                            <button type="button" onClick={() => { const next = carvingMeats.filter((_, i) => i !== idx); setCarvingMeats(next.length >= 2 ? next : [...next, ""].slice(0, Math.max(2, next.length))); }} disabled={carvingMeats.length <= 2 && !val} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#eab308", fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: (carvingMeats.length <= 2 && !val) ? 0.4 : 1 }}>✕</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setCarvingMeats((m) => [...m, ""])} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #eab308", background: "rgba(234,179,8,0.15)", color: "#eab308", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add Meat</button>
                      </div>
                    </div>
                  </CollapsibleSubsection>
                  <CollapsibleSubsection title="Potato - Pick 1" icon="▶" defaultOpen={sectionsExpanded} accentColor="#22c55e">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <select
                            value={(CARVING.potatoOptions as readonly string[]).includes(carvingPotato) ? carvingPotato : (carvingPotato ? "__custom__" : "")}
                            onChange={(e) => { if (e.target.value === "__custom__") return; setCarvingPotato(e.target.value); }}
                            style={{ ...rowInputStyle, minWidth: 240, width: "auto" }}
                          >
                            <option value="">Select...</option>
                            {CARVING.potatoOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                            <option value="__custom__">Other (type below)...</option>
                          </select>
                          <button type="button" onClick={() => setCarvingPotato("")} disabled={!carvingPotato} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#22c55e", fontSize: 13, fontWeight: "bold", cursor: carvingPotato ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: carvingPotato ? 1 : 0.4 }}>✕</button>
                        </div>
                        <input
                          type="text"
                          value={!(CARVING.potatoOptions as readonly string[]).includes(carvingPotato) ? carvingPotato : ""}
                          onChange={(e) => setCarvingPotato(e.target.value)}
                          placeholder="Type custom..."
                          style={{ ...rowInputStyle, minWidth: 200, width: "auto" }}
                        />
                      </div>
                    </div>
                  </CollapsibleSubsection>
                  <CollapsibleSubsection title="Included" icon="▶" defaultOpen={sectionsExpanded} accentColor="#94a3b8">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {carvingIncluded.map((item, idx) => (
                          <div key={`${idx}-${item}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => { const next = [...carvingIncluded]; next[idx] = e.target.value; setCarvingIncluded(next); }}
                              style={{ ...rowInputStyle, minWidth: 220, width: "auto" }}
                            />
                            <button type="button" onClick={() => setCarvingIncluded((prev) => prev.filter((_, i) => i !== idx))} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#22c55e", fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                          </div>
                        ))}
                        <input type="text" value={carvingIncludedInput} onChange={(e) => setCarvingIncludedInput(e.target.value)} placeholder="Type custom item..." style={{ ...rowInputStyle, minWidth: 160, width: "auto" }} onKeyDown={(e) => { if (e.key === "Enter" && carvingIncludedInput.trim()) { setCarvingIncluded((prev) => [...prev, carvingIncludedInput.trim()]); setCarvingIncludedInput(""); } }} />
                        <button type="button" onClick={() => { if (carvingIncludedInput.trim()) { setCarvingIncluded((prev) => [...prev, carvingIncludedInput.trim()]); setCarvingIncludedInput(""); } }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #22c55e", background: "rgba(34,197,94,0.15)", color: "#22c55e", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add Component</button>
                      </div>
                    </div>
                  </CollapsibleSubsection>
                </>
              );
            })()
          ) : presetId && isHibachi ? (
            (() => {
              const rowInputStyle = { padding: "5px 8px", borderRadius: 5, border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#e0e0e0", fontSize: 12, minWidth: 0, width: "100%" };
              const blockStyle = { fontSize: 12, padding: "4px 8px", backgroundColor: "#2a2a2a", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 };
              const updateProtein = (idx: number, val: string) => { const n = [...hibachiProteins]; n[idx] = val; setHibachiProteins(n); };
              return (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>BEO Placement <span style={{ color: "#ff6b6b" }}>*</span></label>
                    <select value={beoPlacement} onChange={(e) => setBeoPlacement(e.target.value as "Presented Appetizer" | "Buffet Metal" | "Buffet China" | "")} style={{ ...rowInputStyle, minWidth: 160, width: "auto" }}>
                      <option value="">Select...</option>
                      <option value="Presented Appetizer">Presented Appetizer</option>
                      <option value="Buffet Metal">Buffet Metal</option>
                      <option value="Buffet China">Buffet China</option>
                    </select>
                  </div>
                  <CollapsibleSubsection title="Proteins - Pick 2 (or more)" icon="▶" defaultOpen={sectionsExpanded} accentColor="#eab308">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {hibachiProteins.map((val, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input type="text" value={val} onChange={(e) => updateProtein(idx, e.target.value)} list={`hibachi-protein-${idx}`} placeholder="Select or type protein..." style={{ ...rowInputStyle, minWidth: 150, width: "auto" }} />
                            <datalist id={`hibachi-protein-${idx}`}>{HIBACHI.proteinOptions.map((o) => <option key={o} value={o} />)}</datalist>
                            <button type="button" onClick={() => { const next = hibachiProteins.filter((_, i) => i !== idx); setHibachiProteins(next.length >= 2 ? next : [...next, ""].slice(0, Math.max(2, next.length))); }} disabled={hibachiProteins.length <= 2 && !val} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#eab308", fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: (hibachiProteins.length <= 2 && !val) ? 0.4 : 1 }}>✕</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setHibachiProteins((p) => [...p, ""])} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #eab308", background: "rgba(234,179,8,0.15)", color: "#eab308", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add Protein</button>
                      </div>
                    </div>
                  </CollapsibleSubsection>
                  <CollapsibleSubsection title="Upgrades" icon="▶" defaultOpen={sectionsExpanded} accentColor="#a855f7">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {hibachiUpgrades.map((item, idx) => (
                          <span key={`${idx}-${item}`} style={blockStyle}>
                            {item}
                            <button type="button" onClick={() => setHibachiUpgrades((prev) => prev.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 10 }}>✕</button>
                          </span>
                        ))}
                        {HIBACHI.upgrades.filter((u) => !hibachiUpgrades.includes(u)).map((u) => (
                          <button key={u} type="button" onClick={() => setHibachiUpgrades((prev) => [...prev, u])} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #a855f7", background: "rgba(168,85,247,0.15)", color: "#a855f7", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ {u}</button>
                        ))}
                        <input type="text" value={hibachiUpgradesInput} onChange={(e) => setHibachiUpgradesInput(e.target.value)} placeholder="Type custom upgrade..." style={{ ...rowInputStyle, minWidth: 140, width: "auto" }} onKeyDown={(e) => { if (e.key === "Enter" && hibachiUpgradesInput.trim()) { setHibachiUpgrades((prev) => [...prev, hibachiUpgradesInput.trim()]); setHibachiUpgradesInput(""); } }} />
                        <button type="button" onClick={() => { if (hibachiUpgradesInput.trim()) { setHibachiUpgrades((prev) => [...prev, hibachiUpgradesInput.trim()]); setHibachiUpgradesInput(""); } }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #a855f7", background: "rgba(168,85,247,0.15)", color: "#a855f7", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add Custom</button>
                      </div>
                    </div>
                  </CollapsibleSubsection>
                  <CollapsibleSubsection title="Included" icon="▶" defaultOpen={sectionsExpanded} accentColor="#22c55e">
                    <div style={{ gridColumn: "1 / -1" }}>
                      {(() => {
                        const HIBACHI_INCLUDED_OPTIONS = [...HIBACHI.included];
                        const available = HIBACHI_INCLUDED_OPTIONS.filter((opt) => !hibachiIncluded.includes(opt));
                        return (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                            {hibachiIncluded.map((item, idx) => {
                              const isCustom = !HIBACHI_INCLUDED_OPTIONS.includes(item);
                              return (
                                <div key={`${idx}-${item}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <select
                                    value={isCustom ? "__custom__" : item}
                                    onChange={(e) => { if (e.target.value === "__custom__") return; const next = [...hibachiIncluded]; next[idx] = e.target.value; setHibachiIncluded(next); }}
                                    style={{ ...rowInputStyle, minWidth: 220, width: "auto" }}
                                  >
                                    <option value="">Select item...</option>
                                    {HIBACHI_INCLUDED_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                    {isCustom && <option value="__custom__">{item}</option>}
                                  </select>
                                  <button type="button" onClick={() => setHibachiIncluded((prev) => prev.filter((_, i) => i !== idx))} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#22c55e", fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                </div>
                              );
                            })}
                            {available.length > 0 && (
                              <select value="" onChange={(e) => { if (e.target.value) setHibachiIncluded((prev) => [...prev, e.target.value]); }} style={{ ...rowInputStyle, minWidth: 180, width: "auto" }}>
                                <option value="">Add from list...</option>
                                {available.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                              </select>
                            )}
                            <input type="text" value={hibachiIncludedInput} onChange={(e) => setHibachiIncludedInput(e.target.value)} placeholder="Type custom item..." style={{ ...rowInputStyle, minWidth: 160, width: "auto" }} onKeyDown={(e) => { if (e.key === "Enter" && hibachiIncludedInput.trim()) { setHibachiIncluded((prev) => [...prev, hibachiIncludedInput.trim()]); setHibachiIncludedInput(""); } }} />
                            <button type="button" onClick={() => { if (hibachiIncludedInput.trim()) { setHibachiIncluded((prev) => [...prev, hibachiIncludedInput.trim()]); setHibachiIncludedInput(""); } }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #22c55e", background: "rgba(34,197,94,0.15)", color: "#22c55e", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add Component</button>
                          </div>
                        );
                      })()}
                    </div>
                  </CollapsibleSubsection>
                </>
              );
            })()
          ) : presetId && isLateNight ? (
            (() => {
              const rowInputStyle = { padding: "5px 8px", borderRadius: 5, border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#e0e0e0", fontSize: 12, minWidth: 0, width: "100%" };
              const blockStyle = { fontSize: 12, padding: "4px 8px", backgroundColor: "#2a2a2a", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 };
              const updateItem = (idx: number, val: string) => { const n = [...lateNightSelected]; n[idx] = val; setLateNightSelected(n); };
              return (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>BEO Placement <span style={{ color: "#ff6b6b" }}>*</span></label>
                    <select value={beoPlacement} onChange={(e) => setBeoPlacement(e.target.value as "Presented Appetizer" | "Buffet Metal" | "Buffet China" | "")} style={{ ...rowInputStyle, minWidth: 160, width: "auto" }}>
                      <option value="">Select...</option>
                      <option value="Presented Appetizer">Presented Appetizer</option>
                      <option value="Buffet Metal">Buffet Metal</option>
                      <option value="Buffet China">Buffet China</option>
                    </select>
                  </div>
                  <CollapsibleSubsection title="Choose Items" icon="▶" defaultOpen={sectionsExpanded} accentColor="#a855f7">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {lateNightSelected.map((val, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input type="text" value={val} onChange={(e) => updateItem(idx, e.target.value)} list={`late-night-item-${idx}`} placeholder={`Select or type item ${idx + 1}...`} style={{ ...rowInputStyle, flex: 1, minWidth: 200 }} />
                            <datalist id={`late-night-item-${idx}`}>{LATE_NIGHT.options.map((o) => <option key={o} value={o} />)}</datalist>
                            <button type="button" onClick={() => { const next = lateNightSelected.filter((_, i) => i !== idx); setLateNightSelected(next.length > 0 ? next : [""]); }} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#a855f7", fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setLateNightSelected((s) => [...s, ""])} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #a855f7", background: "rgba(168,85,247,0.15)", color: "#a855f7", fontSize: 11, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" }}>+ Add Another Item</button>
                      </div>
                    </div>
                  </CollapsibleSubsection>
                  <CollapsibleSubsection title="+ Add Custom Items" icon="▶" defaultOpen={sectionsExpanded} accentColor="#94a3b8">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {lateNightCustomItems.map((item, idx) => (
                          <span key={`${idx}-${item}`} style={blockStyle}>
                            {item}
                            <button type="button" onClick={() => setLateNightCustomItems((prev) => prev.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 10 }}>✕</button>
                          </span>
                        ))}
                        <input type="text" value={lateNightCustomInput} onChange={(e) => setLateNightCustomInput(e.target.value)} placeholder="Type custom item..." style={{ ...rowInputStyle, minWidth: 120, width: "auto" }} onKeyDown={(e) => { if (e.key === "Enter" && lateNightCustomInput.trim()) { setLateNightCustomItems((prev) => [...prev, lateNightCustomInput.trim()]); setLateNightCustomInput(""); } }} />
                        <button type="button" onClick={() => { if (lateNightCustomInput.trim()) { setLateNightCustomItems((prev) => [...prev, lateNightCustomInput.trim()]); setLateNightCustomInput(""); } }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #94a3b8", background: "rgba(148,163,184,0.15)", color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add</button>
                      </div>
                    </div>
                  </CollapsibleSubsection>
                </>
              );
            })()
          ) : presetId && (stationPresetKey === "vegetable" || stationPresetKey === "spreads-breads" || stationPresetKey === "charcuterie" || stationPresetKey === "pasta-flight" || stationPresetKey === "farmers-fruit" || stationPresetKey === "fishermans-corner" || stationPresetKey === "barwerx" || stationPresetKey === "philly-jawn") ? (
            (() => {
              const rowInputStyle = { padding: "5px 8px", borderRadius: 5, border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#e0e0e0", fontSize: 12, minWidth: 0, width: "100%" };
              return (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>BEO Placement <span style={{ color: "#ff6b6b" }}>*</span></label>
                    <select value={beoPlacement} onChange={(e) => setBeoPlacement(e.target.value as "Presented Appetizer" | "Buffet Metal" | "Buffet China" | "")} style={{ ...rowInputStyle, minWidth: 160, width: "auto" }}>
                      <option value="">Select...</option>
                      <option value="Presented Appetizer">Presented Appetizer</option>
                      <option value="Buffet Metal">Buffet Metal</option>
                      <option value="Buffet China">Buffet China</option>
                    </select>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <label style={labelStyle}>Additional notes / selections</label>
                    <textarea rows={4} value={customItems} onChange={(e) => setCustomItems(e.target.value)} placeholder="Enter any custom selections or notes for this station..." style={{ ...inputStyle, width: "100%", resize: "vertical" }} />
                  </div>
                </>
              );
            })()
          ) : presetId && isVivaPasta ? (
            (() => {
              const rowInputStyle = { padding: "5px 8px", borderRadius: 5, border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#e0e0e0", fontSize: 12, minWidth: 0, width: "100%" };
              const sauces = sortComponentsByOrder(grouped.get("Sauce") ?? [], "Sauce", presetName);
              const starches = sortComponentsByOrder(grouped.get("Starch") ?? [], "Starch", presetName);
              const includedTypes = ["Vegetable", "Topping", "Protein"] as const;
              const vivaCondimentSet = new Set(VIVA_INCLUDED_CONDIMENT_NAMES.map((n) => n.toLowerCase().trim()));
              const includedComps = includedTypes
                .flatMap((t) => grouped.get(t) ?? [])
                .filter((c) => vivaCondimentSet.has(c.name.toLowerCase().trim()));

              const selectedSauces = selectedComponentIds.filter((id) => {
                const c = allComponents.find((x) => x.id === id);
                return c && normalizeComponentType(c.componentType) === "Sauce";
              });
              const selectedPastas = selectedComponentIds.filter((id) => {
                const c = allComponents.find((x) => x.id === id);
                return c && normalizeComponentType(c.componentType) === "Starch";
              });
              const includedOrder = [...(VIVA_PASTA_ORDER.Vegetable ?? []), ...(VIVA_PASTA_ORDER.Topping ?? []), ...(VIVA_PASTA_ORDER.Protein ?? [])];
              const includedOrderMap = new Map(includedOrder.map((n, i) => [n.toLowerCase(), i]));
              const includedCompIds = new Set(includedComps.map((c) => c.id));
              const selectedIncluded = selectedComponentIds
                .filter((id) => includedCompIds.has(id))
                .sort((a, b) => {
                  const ca = allComponents.find((x) => x.id === a);
                  const cb = allComponents.find((x) => x.id === b);
                  const ia = ca ? (includedOrderMap.get(ca.name.toLowerCase()) ?? 999) : 999;
                  const ib = cb ? (includedOrderMap.get(cb.name.toLowerCase()) ?? 999) : 999;
                  return ia - ib;
                });

              const updateSauceSlot = (idx: number, newId: string) => {
                const other = selectedComponentIds.filter((id) => {
                  const c = allComponents.find((x) => x.id === id);
                  return !c || normalizeComponentType(c.componentType) !== "Sauce";
                });
                const next = [...selectedSauces];
                while (next.length <= idx) next.push("");
                next[idx] = newId;
                setSelectedComponentIds([...other, ...next.filter(Boolean)]);
              };
              const updatePastaSlot = (idx: number, newId: string) => {
                const other = selectedComponentIds.filter((id) => {
                  const c = allComponents.find((x) => x.id === id);
                  return !c || normalizeComponentType(c.componentType) !== "Starch";
                });
                const next = [...selectedPastas];
                while (next.length <= idx) next.push("");
                next[idx] = newId;
                setSelectedComponentIds([...other, ...next.filter(Boolean)]);
              };

              return (
                <>
                  {/* 0. BEO PLACEMENT — Appetizers or Buffet (for print placement only) */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>BEO Placement <span style={{ color: "#ff6b6b" }}>*</span></label>
                    <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#999" }}>Required — for placement on the BEO</p>
                    <select
                      value={beoPlacement}
                      onChange={(e) => setBeoPlacement(e.target.value as "Presented Appetizer" | "Buffet Metal" | "Buffet China" | "")}
                      style={{ ...rowInputStyle, minWidth: 160, width: "auto" }}
                    >
                      <option value="">Select...</option>
                      <option value="Presented Appetizer">Presented Appetizer</option>
                      <option value="Buffet Metal">Buffet Metal</option>
                      <option value="Buffet China">Buffet China</option>
                    </select>
                  </div>

                  {/* 1. Sauce - Pick 3 */}
                  <CollapsibleSubsection title="Sauce - Pick 3" icon="▶" defaultOpen={sectionsExpanded} accentColor="#14b8a6">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {[0, 1, 2].map((idx) => {
                          const slotId = selectedSauces[idx] ?? "";
                          return (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <select
                                value={slotId}
                                onChange={(e) => updateSauceSlot(idx, e.target.value)}
                                style={{ ...rowInputStyle, minWidth: 140, width: "auto" }}
                              >
                                <option value="">Select sauce...</option>
                                {sauces.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => updateSauceSlot(idx, "")}
                                disabled={!slotId}
                                style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#14b8a6", fontSize: 13, fontWeight: "bold", cursor: slotId ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: slotId ? 1 : 0.4 }}
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                        <input
                          type="text"
                          value={customSauceInput}
                          onChange={(e) => setCustomSauceInput(e.target.value)}
                          placeholder="Type custom sauce..."
                          style={{ ...rowInputStyle, minWidth: 140, width: "auto" }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && customSauceInput.trim()) {
                              setCustomItems((prev) => (prev ? prev + "\n" : "") + customSauceInput.trim());
                              setCustomSauceInput("");
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customSauceInput.trim()) {
                              setCustomItems((prev) => (prev ? prev + "\n" : "") + customSauceInput.trim());
                              setCustomSauceInput("");
                            }
                          }}
                          style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #14b8a6", background: "rgba(20,184,166,0.15)", color: "#14b8a6", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                        >
                          + Add Sauce
                        </button>
                      </div>
                    </div>
                  </CollapsibleSubsection>

                  {/* 2. Pasta - Pick 2 */}
                  <CollapsibleSubsection title="Pasta - Pick 2" icon="▶" defaultOpen={sectionsExpanded} accentColor="#a855f7">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {[0, 1].map((idx) => {
                          const slotId = selectedPastas[idx] ?? "";
                          return (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <select
                                value={slotId}
                                onChange={(e) => updatePastaSlot(idx, e.target.value)}
                                style={{ ...rowInputStyle, minWidth: 120, width: "auto" }}
                              >
                                <option value="">Select pasta...</option>
                                {starches.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => updatePastaSlot(idx, "")}
                                disabled={!slotId}
                                style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#a855f7", fontSize: 13, fontWeight: "bold", cursor: slotId ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: slotId ? 1 : 0.4 }}
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                        <input
                          type="text"
                          value={customPastaInput}
                          onChange={(e) => setCustomPastaInput(e.target.value)}
                          placeholder="Type custom pasta..."
                          style={{ ...rowInputStyle, minWidth: 140, width: "auto" }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && customPastaInput.trim()) {
                              setCustomItems((prev) => (prev ? prev + "\n" : "") + customPastaInput.trim());
                              setCustomPastaInput("");
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customPastaInput.trim()) {
                              setCustomItems((prev) => (prev ? prev + "\n" : "") + customPastaInput.trim());
                              setCustomPastaInput("");
                            }
                          }}
                          style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #a855f7", background: "rgba(168,85,247,0.15)", color: "#a855f7", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                        >
                          + Add Pasta
                        </button>
                      </div>
                    </div>
                  </CollapsibleSubsection>

                  {/* 3. Included */}
                  <CollapsibleSubsection title="Included" icon="▶" defaultOpen={sectionsExpanded} accentColor="#22c55e">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {selectedIncluded.map((id, idx) => {
                          const slotId = id;
                          return (
                            <div key={id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <select
                                value={slotId}
                                onChange={(e) => {
                                  const newId = e.target.value;
                                  const other = selectedComponentIds.filter((i) => {
                                    const c = allComponents.find((x) => x.id === i);
                                    return !c || !includedTypes.includes(normalizeComponentType(c.componentType) as (typeof includedTypes)[number]);
                                  });
                                  const next = [...selectedIncluded];
                                  next[idx] = newId;
                                  setSelectedComponentIds([...other, ...next.filter(Boolean)]);
                                }}
                                style={{ ...rowInputStyle, minWidth: 120, width: "auto" }}
                              >
                                <option value="">Select condiment...</option>
                                {includedComps.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => removeComponent(id)}
                                style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#22c55e", fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                        {(() => {
                          const availableIncluded = includedComps.filter((c) => !selectedSet.has(c.id));
                          return availableIncluded.length > 0 ? (
                            <div key="add-slot" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <select
                                value=""
                                onChange={(e) => {
                                  const id = e.target.value;
                                  if (id) {
                                    setSelectedComponentIds((prev) => [...prev, id]);
                                    e.target.value = "";
                                  }
                                }}
                                style={{ ...rowInputStyle, minWidth: 120, width: "auto" }}
                              >
                                <option value="">Add from list...</option>
                                {availableIncluded.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                          ) : null;
                        })()}
                        <input
                          type="text"
                          value={customCondimentInput}
                          onChange={(e) => setCustomCondimentInput(e.target.value)}
                          placeholder="Type custom condiment..."
                          style={{ ...rowInputStyle, minWidth: 140, width: "auto" }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && customCondimentInput.trim()) {
                              setCustomItems((prev) => (prev ? prev + "\n" : "") + customCondimentInput.trim());
                              setCustomCondimentInput("");
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customCondimentInput.trim()) {
                              setCustomItems((prev) => (prev ? prev + "\n" : "") + customCondimentInput.trim());
                              setCustomCondimentInput("");
                            }
                          }}
                          style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #22c55e", background: "rgba(34,197,94,0.15)", color: "#22c55e", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                        >
                          + Add Condiment
                        </button>
                      </div>
                    </div>
                  </CollapsibleSubsection>

                  <div style={{ marginTop: 16 }}>
                    <label style={labelStyle}>Custom Items (text)</label>
                    <textarea
                      rows={2}
                      value={customItems}
                      onChange={(e) => setCustomItems(e.target.value)}
                      placeholder="Additional custom items..."
                      style={{ ...inputStyle, width: "100%", resize: "vertical" }}
                    />
                  </div>
                </>
              );
            })()
          ) : presetId && isFishermansCorner ? (
            (() => {
              const rowInputStyle = { padding: "5px 8px", borderRadius: 5, border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#e0e0e0", fontSize: 12, minWidth: 0, width: "100%" };
              const updateSelection = (idx: number, val: string) => {
                const next = [...fishermansCornerSelected];
                next[idx] = val;
                setFishermansCornerSelected(next);
              };
              return (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>BEO Placement <span style={{ color: "#ff6b6b" }}>*</span></label>
                    <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#999" }}>Required — for placement on the BEO</p>
                    <select value={beoPlacement} onChange={(e) => setBeoPlacement(e.target.value as "Presented Appetizer" | "Buffet Metal" | "Buffet China" | "")} style={{ ...rowInputStyle, minWidth: 160, width: "auto" }}>
                      <option value="">Select...</option>
                      <option value="Presented Appetizer">Presented Appetizer</option>
                      <option value="Buffet Metal">Buffet Metal</option>
                      <option value="Buffet China">Buffet China</option>
                    </select>
                  </div>
                  <CollapsibleSubsection title="Choose 2 Items (or more)" icon="▶" defaultOpen={true} accentColor="#14b8a6">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {fishermansCornerSelected.map((val, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input type="text" value={val} onChange={(e) => updateSelection(idx, e.target.value)} list={`fc-item-${idx}`} placeholder="Select or type item..." style={{ ...rowInputStyle, minWidth: 240, width: "auto" }} />
                            <datalist id={`fc-item-${idx}`}>{FISHERMANS_CORNER.options.map((opt) => <option key={opt} value={opt} />)}</datalist>
                            <button type="button" onClick={() => { const next = fishermansCornerSelected.filter((_, i) => i !== idx); setFishermansCornerSelected(next.length >= 2 ? next : [...next, ""].slice(0, Math.max(2, next.length))); }} disabled={fishermansCornerSelected.length <= 2 && !val} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: "#14b8a6", fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: (fishermansCornerSelected.length <= 2 && !val) ? 0.4 : 1 }}>✕</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setFishermansCornerSelected((s) => [...s, ""])} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #14b8a6", background: "rgba(20,184,166,0.15)", color: "#14b8a6", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add Item</button>
                      </div>
                    </div>
                  </CollapsibleSubsection>
                </>
              );
            })()
          ) : presetId ? (
            <>
              {COMPONENT_TYPE_ORDER.map((type) => {
                const rawComps = grouped.get(type) ?? [];
                const comps = sortComponentsByOrder(rawComps, type, presetName);
                const selectedInType = selectedComponentIds.filter((id) => {
                  const c = allComponents.find((x) => x.id === id);
                  return c && normalizeComponentType(c.componentType) === type;
                });
                const limit = getLimitForType(type);
                const availableToAdd = comps.filter((c) => !selectedSet.has(c.id));
                const sectionLabel = getSectionLabel(type, limit, presetName);
                const dropdownLabel = getDropdownLabel(type, limit, selectedInType.length, presetName);
                const sectionTitle = displayType(type);
                const isAddOpen = addDropdownType === type;
                const typeColor = TYPE_ACCENT_COLORS[type] ?? "#94a3b8";
                return (
                  <CollapsibleSubsection
                    key={type}
                    title={sectionTitle}
                    icon="▶"
                    defaultOpen={sectionsExpanded}
                    accentColor={typeColor}
                  >
                    <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: "#e0e0e0" }}>
                      {sectionLabel}
                    </div>
                    {(() => {
                      const name = (presetName || "").toLowerCase();
                      const isPastaStarch = (name.includes("pasta") || name.includes("viva")) && type === "Starch";
                      const isPastaProtein = (name.includes("pasta") || name.includes("viva")) && type === "Protein";
                      const usePlatesStyle = isPastaStarch || isPastaProtein;
                      const addLabel = type === "Starch" ? "Add Pasta" : type === "Protein" ? "Add Protein" : type === "Sauce" ? "Add Sauce" : type === "Vegetable" ? "Add Vegetable" : type === "Topping" ? "Add Topping" : `Add ${displayType(type)}`;
                      const effectiveLimit = limit >= 999 ? (type === "Starch" ? 2 : type === "Protein" ? 1 : limit) : limit;
                      const showPlatesRows = selectedInType.length > 0 || platesStyleExpanded[type];

                      if (usePlatesStyle) {
                        const rowInputStyle = { padding: "5px 8px", borderRadius: 5, border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#e0e0e0", fontSize: 12, minWidth: 0, width: "100%" };
                        const slot0 = selectedInType[0] ?? "";
                        const slot1 = selectedInType[1] ?? "";
                        const updateSlot = (idx: number, newId: string) => {
                          const otherIds = selectedComponentIds.filter((id) => {
                            const c = allComponents.find((x) => x.id === id);
                            return !c || normalizeComponentType(c.componentType) !== type;
                          });
                          const newForType = [...selectedInType];
                          while (newForType.length <= idx) newForType.push("");
                          newForType[idx] = newId;
                          const filtered = newForType.filter(Boolean);
                          setSelectedComponentIds([...otherIds, ...filtered]);
                        };

                        if (!showPlatesRows) {
                          return (
                            <button
                              type="button"
                              onClick={() => setPlatesStyleExpanded((p) => ({ ...p, [type]: true }))}
                              style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${typeColor}`, background: TYPE_ACCENT_BG[type] ?? "rgba(148,163,184,0.15)", color: typeColor, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                            >
                              + {addLabel}
                            </button>
                          );
                        }

                        return (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                            {[0, 1].slice(0, effectiveLimit).map((idx) => {
                              const slotId = idx === 0 ? slot0 : slot1;
                              return (
                                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <select
                                    value={slotId}
                                    onChange={(e) => updateSlot(idx, e.target.value)}
                                    style={{ ...rowInputStyle, minWidth: 120, width: "auto" }}
                                  >
                                    <option value="">Select {type === "Starch" ? "pasta" : "protein"}...</option>
                                    {comps.map((c) => (
                                      <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => updateSlot(idx, "")}
                                    disabled={!slotId}
                                    style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: typeColor, fontSize: 13, fontWeight: "bold", cursor: slotId ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: slotId ? 1 : 0.4 }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              );
                            })}
                            {isPastaStarch && (
                              <>
                                <input
                                  type="text"
                                  value={customPastaInput}
                                  onChange={(e) => setCustomPastaInput(e.target.value)}
                                  placeholder="Type custom pasta..."
                                  style={{ ...rowInputStyle, minWidth: 140, width: "auto" }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && customPastaInput.trim()) {
                                      setCustomItems((prev) => (prev ? prev + "\n" : "") + customPastaInput.trim());
                                      setCustomPastaInput("");
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (customPastaInput.trim()) {
                                      setCustomItems((prev) => (prev ? prev + "\n" : "") + customPastaInput.trim());
                                      setCustomPastaInput("");
                                    }
                                  }}
                                  style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${typeColor}`, background: TYPE_ACCENT_BG[type] ?? "rgba(148,163,184,0.15)", color: typeColor, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                                >
                                  + Add Pasta
                                </button>
                              </>
                            )}
                            {isPastaProtein && (
                              <>
                                <input
                                  type="text"
                                  value={customProteinInput}
                                  onChange={(e) => setCustomProteinInput(e.target.value)}
                                  placeholder="Type custom protein..."
                                  style={{ ...rowInputStyle, minWidth: 140, width: "auto" }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && customProteinInput.trim()) {
                                      setCustomItems((prev) => (prev ? prev + "\n" : "") + customProteinInput.trim());
                                      setCustomProteinInput("");
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (customProteinInput.trim()) {
                                      setCustomItems((prev) => (prev ? prev + "\n" : "") + customProteinInput.trim());
                                      setCustomProteinInput("");
                                    }
                                  }}
                                  style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${typeColor}`, background: TYPE_ACCENT_BG[type] ?? "rgba(148,163,184,0.15)", color: typeColor, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                                >
                                  + Add Protein
                                </button>
                              </>
                            )}
                          </div>
                        );
                      }

                      return (
                        <>
                          <div ref={addDropdownType === type ? addDropdownRef : undefined} style={{ position: "relative", marginBottom: 10 }}>
                            <button
                              type="button"
                              onClick={() => setAddDropdownType(isAddOpen ? null : type)}
                              disabled={availableToAdd.length === 0 || selectedInType.length >= limit}
                              style={{ width: "100%", padding: "6px 12px", fontSize: 12, background: "#2a2a2a", color: "#e0e0e0", border: "1px solid #555", borderRadius: 6, cursor: availableToAdd.length > 0 && selectedInType.length < limit ? "pointer" : "not-allowed", opacity: availableToAdd.length === 0 || selectedInType.length >= limit ? 0.5 : 1, textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                            >
                              <span>{dropdownLabel}</span>
                              <span style={{ fontSize: 10, color: "#888" }}>▼</span>
                            </button>
                            {isAddOpen && availableToAdd.length > 0 && (
                              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, maxHeight: 200, overflowY: "auto", backgroundColor: "#1a1a1a", border: "1px solid #444", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.5)", zIndex: 10 }}>
                                {availableToAdd.map((c) => (
                                  <button key={c.id} type="button" onClick={() => { addComponent(c.id); setAddDropdownType(null); }} disabled={!canAddComponent(c.id)} style={{ display: "block", width: "100%", padding: "8px 12px", textAlign: "left", fontSize: 12, background: "none", border: "none", color: canAddComponent(c.id) ? "#e0e0e0" : "#666", cursor: canAddComponent(c.id) ? "pointer" : "not-allowed" }}>{c.name}</button>
                                ))}
                              </div>
                            )}
                          </div>
                          {selectedInType.map((id) => {
                            const comp = allComponents.find((c) => c.id === id);
                            const name = comp?.name ?? id;
                            const isOther = comp?.isOther ?? name.toLowerCase() === "other";
                            return (
                              <div key={id} style={{ display: "grid", gridTemplateColumns: "1fr 26px", gap: 6, alignItems: "center", marginBottom: 6 }}>
                                {isOther ? (
                                  <input type="text" value={otherInput} onChange={(e) => setOtherInput(e.target.value)} placeholder="Enter custom..." style={{ ...inputStyle, padding: "5px 8px", fontSize: 12, minWidth: 0 }} />
                                ) : (
                                  <span style={{ color: "#e0e0e0", fontSize: 13 }}>{name}</span>
                                )}
                                <button type="button" onClick={() => removeComponent(id)} style={{ width: 26, height: 26, padding: 0, borderRadius: 5, border: "1px solid #555", background: "#333", color: typeColor, fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                    </div>
                  </CollapsibleSubsection>
                );
              })}
              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Custom Items (text)</label>
                <textarea
                  rows={2}
                  value={customItems}
                  onChange={(e) => setCustomItems(e.target.value)}
                  placeholder="Additional custom items..."
                  style={{ ...inputStyle, width: "100%", resize: "vertical" }}
                />
              </div>
            </>
          ) : (
            <div style={{ color: "#999", fontSize: 14 }}>Select a Station Preset to configure components.</div>
          )}
        </div>
        <div style={{ padding: 16, borderTop: "1px solid #444", display: "flex", gap: 12, justifyContent: "flex-end", flexShrink: 0 }}>
          <button type="button" onClick={onCancel} style={{ padding: "10px 20px", background: "#444", color: "#e0e0e0", border: "none", borderRadius: 8, cursor: "pointer" }}>
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={loading || !presetId} style={buttonStyle}>
            {submitLabel ?? "Save"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
