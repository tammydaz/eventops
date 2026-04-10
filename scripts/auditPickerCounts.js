const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const LEGACY = "tbl0aN33DGG6R1sPZ";
const NAME_FIELD = "fldW5gfSlHRTl01v1";
const CAT_FIELD = "fldM7lWvjH8S0YNSX";

const CATEGORY_MAP = {
  passed: ["Passed App", "Presented App", "Appetizer", "Passed", "App"],
  presented: ["Passed App", "Presented App", "Appetizer", "Passed", "App", "Station Item", "Station"],
  buffet_metal: ["Buffet Metal", "Buffet", "Buffet Item", "Side", "Entrée", "Protein (Entrée)", "Pasta (Entrée)", "Pasta (Side)", "Starch (Side)", "Vegetable (Side)"],
  buffet_china: ["Buffet China", "Salad", "Bread", "Side"],
  desserts: ["Dessert", "Dessert/Metal", "Dessert/China", "Dessert (Display)", "Dessert (Individual)"],
  stations: ["Station", "Stations", "Station Item"],
  deli: ["Deli/Sandwhiches", "Deli/Breads", "Deli/Sandwiches", "Deli"],
};

async function fetchAll() {
  const all = [];
  let offset;
  do {
    const p = new URLSearchParams();
    p.set("pageSize", "100");
    p.set("returnFieldsByFieldId", "true");
    p.append("fields[]", NAME_FIELD);
    p.append("fields[]", CAT_FIELD);
    if (offset) p.set("offset", offset);
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${LEGACY}?${p}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    const d = await r.json();
    if (!d.records) break;
    all.push(...d.records);
    offset = d.offset;
  } while (offset);
  return all;
}

(async () => {
  const all = await fetchAll();
  console.log(`Total legacy records: ${all.length}\n`);

  // Count items with NO category
  const noCategory = all.filter(r => {
    const cat = r.fields[CAT_FIELD];
    return !cat || (typeof cat === "string" && cat.trim() === "");
  });
  console.log(`Records with NO Category tag: ${noCategory.length}`);
  if (noCategory.length > 0 && noCategory.length <= 20) {
    for (const r of noCategory) {
      console.log(`  - ${r.fields[NAME_FIELD] || r.id}`);
    }
  }
  console.log("");

  // For each picker, count matches
  for (const [key, cats] of Object.entries(CATEGORY_MAP)) {
    const matches = all.filter(r => {
      const cat = r.fields[CAT_FIELD];
      if (!cat) return false;
      const catStr = typeof cat === "string" ? cat : (cat.name || String(cat));
      return cats.some(c => catStr.includes(c));
    });
    console.log(`${key}: ${matches.length} items`);
  }

  // Show all unique Category values
  const catCounts = {};
  for (const r of all) {
    const cat = r.fields[CAT_FIELD];
    const catStr = cat ? (typeof cat === "string" ? cat : (cat.name || String(cat))) : "(none)";
    catCounts[catStr] = (catCounts[catStr] || 0) + 1;
  }
  console.log("\n--- All Category values in legacy table ---");
  for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }
})().catch(console.error);
