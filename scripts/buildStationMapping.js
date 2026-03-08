/**
 * Build stationItemMapping.ts from menu-items-export.json + stations-export.json.
 * Run: node scripts/buildStationMapping.js
 *
 * Prereqs:
 *   1. node scripts/exportMenuItemsForAnalysis.js  (creates menu-items-export.json)
 *   2. node scripts/exportStationsAndPresets.js    (creates stations-export.json)
 *
 * Uses: (1) Stations/Presets export for ID mapping, (2) Menu Items.stationType,
 * (3) Spec-based name matching for stations in the dropdown (Viva La Pasta, etc.)
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Spec station names + search terms to match menu items by name (from MENU_ITEMS_AIRTABLE_OMNI_PROMPT.md)
const SPEC_STATION_TERMS = {
  "Viva La Pasta": ["penne a la vodka", "bruschetta pasta", "bowties", "primavera", "vodka"],
  "Pasta Station": ["penne a la vodka", "bruschetta pasta", "bowties", "primavera", "vodka"],
  "Pasta Flight Presentation": ["penne a la vodka", "bruschetta pasta", "bowties", "red pepper jam"],
  "Tex-Mex": ["chicken taco", "beef taco", "pork taco", "shrimp taco", "soft shell", "hard shell", "pico de gallo", "ranchero", "black bean salsa"],
  "Taco Station": ["fish taco", "cod street taco", "beef street taco", "chicken taco", "beef taco", "pork taco", "shrimp taco", "soft shell taco", "hard shell taco", "pico de gallo", "ranchero", "black bean salsa", "tricolor tortilla", "street taco"],
  "Make Your Own Ramen Noodle Bar": ["pork stock", "miso stock", "ramen", "bok choy", "sriracha", "soft boiled egg", "snow peas"],
  "All-American": ["mini angus", "beef burger", "braised brisket", "pulled pork", "boardwalk potato", "potato wedges", "baked potato salad", "honey hot chicken"],
  "Street Food Station": ["mini slider", "aged white cheddar", "street taco", "carolina bbq", "bao bun", "thai sesame", "chimichurri", "adult mac", "chicken parm sliver", "korean fried chicken nugget", "margarita", "bbq chicken flatbread"],
  "Carving Station": ["pork tenderloin", "mushroom duxelle", "en croute", "roasted turkey", "orange compote", "flank steak", "spiral ham", "honey mustard glaze", "carving station"],
  "Hi Bachi Station": ["hibachi", "teriyaki", "lo mein", "filet mignon", "lobster tail"],
  "Chicken & Waffle Station": ["belgian waffle", "powdered sugar", "maple bourbon", "maple syrup", "whipped cream", "cinnamon", "fried chicken tender", "honey hot", "herb-infused butter", "bacon crumble", "fried pickle"],
  "Grande Charcuterie Display": ["charcuterie", "artisanal", "cracker", "crostini", "olive", "nut"],
  "BarWerx Appetizer Sampler": ["potato skin", "cheese quesadilla", "buffalo wing", "mozzarella stick"],
  "The Philly Jawn": ["philly", "cheesesteak", "meatball", "pretzel", "slider"],
  "Iced Raw Bar": ["shrimp", "crab claw", "clam", "oyster"],
};

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    console.error(`Could not read ${path}:`, e.message);
    return null;
  }
}

function nameMatchesTerms(name, terms) {
  const lower = (name || "").toLowerCase();
  return terms.some((t) => lower.includes(t.toLowerCase()));
}

function main() {
  const menuExport = loadJson(join(root, "menu-items-export.json"));
  const stationsExport = loadJson(join(root, "stations-export.json"));

  if (!menuExport?.records) {
    console.error("menu-items-export.json not found or empty. Run: node scripts/exportMenuItemsForAnalysis.js");
    process.exit(1);
  }

  const menuById = {};
  const allMenuItems = [];
  for (const r of menuExport.records) {
    const name = (r.name || r.itemName || "").trim();
    menuById[r.id] = { id: r.id, name, stationType: r.stationType || "" };
    allMenuItems.push({ id: r.id, name });
  }

  const stationTypeToIds = {};

  // 1. ID-based mapping from stations-export (Stations + Presets)
  if (stationsExport?.stationTypeToItemIds && Object.keys(stationsExport.stationTypeToItemIds).length > 0) {
    for (const [st, ids] of Object.entries(stationsExport.stationTypeToItemIds)) {
      if (st && ids?.length) {
        stationTypeToIds[st] = [...new Set(ids)].filter((id) => menuById[id]);
      }
    }
  }

  // 2. Menu Items' stationType field
  for (const r of menuExport.records) {
    const st = (r.stationType || "").trim();
    if (st && r.id) {
      stationTypeToIds[st] = stationTypeToIds[st] || [];
      if (!stationTypeToIds[st].includes(r.id)) {
        stationTypeToIds[st].push(r.id);
      }
    }
  }

  // 3. Spec-based name matching for dropdown station names (Viva La Pasta, Carving Station, etc.)
  for (const [st, terms] of Object.entries(SPEC_STATION_TERMS)) {
    if (stationTypeToIds[st]?.length > 0) continue; // already have IDs from 1 or 2
    const matched = allMenuItems.filter((item) => nameMatchesTerms(item.name, terms));
    if (matched.length > 0) {
      stationTypeToIds[st] = matched.map((m) => m.id);
    }
  }

  // 4. Build search terms from actual matched item names
  const stationTypeToSearchTerms = {};
  for (const [st, ids] of Object.entries(stationTypeToIds)) {
    const names = ids.map((id) => menuById[id]?.name).filter(Boolean);
    const terms = new Set();
    for (const n of names) {
      const lower = n.toLowerCase();
      if (n.length > 4) terms.add(lower);
      lower.split(/\s+/).filter((w) => w.length >= 4).forEach((w) => terms.add(w));
    }
    stationTypeToSearchTerms[st] = [...terms].slice(0, 40);
  }

  // 4. Generate TypeScript file
  const lines = [
    "/**",
    " * Station → item IDs and search terms. Generated by buildStationMapping.js",
    " * Run: node scripts/exportMenuItemsForAnalysis.js && node scripts/exportStationsAndPresets.js && node scripts/buildStationMapping.js",
    " */",
    "",
    "export const STATION_ITEM_IDS: Record<string, string[]> = {",
    ...Object.entries(stationTypeToIds)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([st, ids]) => `  "${st.replace(/"/g, '\\"')}": ${JSON.stringify(ids)},`),
    "};",
    "",
    "export const STATION_ITEM_SEARCH_TERMS: Record<string, string[]> = {",
    ...Object.entries(stationTypeToSearchTerms)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([st, terms]) => `  "${st.replace(/"/g, '\\"')}": ${JSON.stringify(terms)},`),
    "};",
    "",
    "export function hasStationMapping(stationType: string): boolean {",
    "  return (STATION_ITEM_IDS[stationType]?.length ?? 0) > 0 || (STATION_ITEM_SEARCH_TERMS[stationType]?.length ?? 0) > 0;",
    "}",
    "",
    "export function getStationItemIds(stationType: string): string[] {",
    "  return STATION_ITEM_IDS[stationType] ?? [];",
    "}",
    "",
    "export function itemMatchesStation(itemName: string, stationType: string): boolean {",
    "  const terms = STATION_ITEM_SEARCH_TERMS[stationType];",
    "  if (!terms?.length) return false;",
    "  const lower = itemName.toLowerCase();",
    "  return terms.some((t) => lower.includes(t.toLowerCase()));",
    "}",
  ];

  const outPath = join(root, "src", "constants", "stationItemMapping.ts");
  writeFileSync(outPath, lines.join("\n"), "utf8");
  console.log(`\n✅ Generated: ${outPath}`);
  console.log("\nStation types with mappings:", Object.keys(stationTypeToIds).length);
  Object.entries(stationTypeToIds).forEach(([st, ids]) => {
    console.log(`  ${st}: ${ids.length} items`);
  });
}

main();
