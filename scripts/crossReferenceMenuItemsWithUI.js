/**
 * Cross-reference Airtable Menu Items export with UI category map.
 * Run after: node scripts/exportMenuItemsForAnalysis.js
 * Reads: menu-items-export.json (project root)
 * Output: Lists categories and items that never appear in any UI picker.
 *
 * Must stay in sync with src/constants/menuCategories.ts CATEGORY_MAP.
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const exportPath = join(__dirname, "..", "menu-items-export.json");

// Mirror of CATEGORY_MAP from src/constants/menuCategories.ts (single source of truth for this script)
const CATEGORY_MAP = {
  passed: ["Passed App", "Presented App", "Appetizer", "Passed", "App"],
  presented: [
    "Passed App", "Presented App", "Appetizer", "Passed", "App",
    "Station Item", "Station",
  ],
  buffet_metal: [
    "Buffet Metal", "Buffet", "Buffet Item", "Side",
    "Entrée", "Protein (Entrée)", "Pasta (Entrée)", "Pasta (Side)", "Starch (Side)", "Vegetable (Side)",
  ],
  buffet_china: ["Buffet China", "Salad", "Bread", "Side"],
  desserts: ["Dessert", "Dessert/Metal", "Dessert/China", "Dessert (Display)", "Dessert (Individual)"],
  stations: ["Station", "Stations", "Station Item"],
  dressing: ["Dressing"],
  deli: ["Deli/Sandwhiches", "Deli/Breads", "Deli/Sandwiches", "Deli"],
  room_temp: ["Room Temp Display", "Display", "Buffet China"],
  displays: ["Display", "Buffet China"],
  beverage_service: ["Beverage", "Beverages", "Drink", "Bar / Beverage Component"],
  bar_service: ["Bar", "Bar Item", "Beverage", "Beverages", "Bar / Beverage Component"],
  creation_station: ["Station", "Stations", "Station Item"],
};

const ALL_ALLOWED = new Set();
Object.values(CATEGORY_MAP).forEach((arr) => arr.forEach((c) => ALL_ALLOWED.add(c)));

function main() {
  let data;
  try {
    data = JSON.parse(readFileSync(exportPath, "utf8"));
  } catch (e) {
    console.error("Run first: node scripts/exportMenuItemsForAnalysis.js");
    process.exit(1);
  }

  const records = data.records || [];
  const categoryToItems = {};
  const missingByCategory = {};
  let visibleCount = 0;
  let noCategoryCount = 0;
  let missingCount = 0;

  for (const r of records) {
    const name = r.name || r.itemName || "(no name)";
    const cat = r.category == null || r.category === "" ? "(empty)" : String(r.category).trim();

    if (!categoryToItems[cat]) categoryToItems[cat] = [];
    categoryToItems[cat].push({ id: r.id, name });

    if (cat === "(empty)") {
      noCategoryCount++;
      continue;
    }

    if (ALL_ALLOWED.has(cat)) {
      visibleCount++;
    } else {
      missingCount++;
      if (!missingByCategory[cat]) missingByCategory[cat] = [];
      missingByCategory[cat].push(name);
    }
  }

  // Report
  console.log("=== MENU ITEMS: UI vs Airtable ===\n");
  console.log(`Total records: ${records.length}`);
  console.log(`No category (empty): ${noCategoryCount}`);
  console.log(`Category in at least one UI picker: ${visibleCount}`);
  console.log(`Category NOT in any UI picker (missing from UI): ${missingCount}`);

  const missingCategories = Object.keys(missingByCategory).sort();
  if (missingCategories.length === 0) {
    console.log("\nNo categories are missing; all Airtable categories are in CATEGORY_MAP.");
    return;
  }

  console.log("\n--- Categories in Airtable but NOT in any picker (CATEGORY_MAP) ---");
  for (const cat of missingCategories) {
    const items = missingByCategory[cat];
    console.log(`\n  "${cat}" (${items.length} items):`);
    items.slice(0, 15).forEach((n) => console.log(`    - ${n}`));
    if (items.length > 15) console.log(`    ... and ${items.length - 15} more`);
  }

  console.log("\n--- Suggested fix ---");
  console.log("Add the missing category strings to the appropriate key(s) in src/constants/menuCategories.ts CATEGORY_MAP.");
  console.log("Example: if 'Deli' items should appear in the Deli picker, add 'Deli' to the deli array.");
}

main();
