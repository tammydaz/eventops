const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const MENU_LAB = "tbl6gXRT2FPpTdf0J";
const LEGACY = "tbl0aN33DGG6R1sPZ";

const ML_NAME = "fldpbzDFSg9sYeexU";
const ML_DISPLAY = "flddOn21WHp7XEaP9";
const ML_EXEC = "fldnP7tCisqdDkaOI";

const LEG_NAME = "fldW5gfSlHRTl01v1";
const LEG_CATEGORY = "fldSP4wt67VNxrhR2";

async function fetchAll(table, fields) {
  const records = [];
  let offset = null;
  do {
    let url = `https://api.airtable.com/v0/${BASE}/${table}?returnFieldsByFieldId=true`;
    fields.forEach(f => { url += `&fields[]=${f}`; });
    if (offset) url += `&offset=${offset}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
    const data = await res.json();
    if (data.error) { console.error("API Error:", data.error); return records; }
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return records;
}

async function patchBatch(records) {
  const url = `https://api.airtable.com/v0/${BASE}/${MENU_LAB}?typecast=true`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ records, typecast: true })
  });
  const data = await res.json();
  if (data.error) { console.error("PATCH Error:", JSON.stringify(data.error)); return false; }
  return true;
}

async function run() {
  // First, check what Category field exists in Legacy to find passed/presented items
  console.log("Checking Legacy table fields...");
  const legSample = await fetchAll(LEGACY, [LEG_NAME]);
  console.log(`Legacy: ${legSample.length} records`);
  
  // Let's check what fields Legacy has - try to find the Category field
  const testUrl = `https://api.airtable.com/v0/${BASE}/${LEGACY}?maxRecords=5`;
  const testRes = await fetch(testUrl, { headers: { Authorization: `Bearer ${API_KEY}` } });
  const testData = await testRes.json();
  if (testData.records && testData.records[0]) {
    console.log("\nLegacy field names:", Object.keys(testData.records[0].fields).join(", "));
  }

  // Now check Menu_Lab for items with names that match passed apps from the appetizers PDF
  console.log("\nFetching Menu_Lab...");
  const ml = await fetchAll(MENU_LAB, [ML_NAME, ML_DISPLAY, ML_EXEC]);
  console.log(`Menu_Lab: ${ml.length} records\n`);

  // Known passed appetizer names from APPETIZERS-STATIONS-MENU-23.pdf
  const passedNames = new Set([
    "QUILTED FRANKS", "SESAME CRUSTED CHICKEN SATAYS", "SPANAKOPITA",
    "MINI CHICKEN QUESADILLAS", "LAMB LOLLIPOPS", "MINI BEEF WELLINGTONS",
    "HIBACHI CHICKEN KABOBS", "VEGETABLE SPRING ROLLS", "STUFFED MUSHROOMS",
    "MINI JUMBO LUMP CRAB CAKES", "EDAMAME QUESADILLAS", "CHEESESTEAK DUMPLINGS",
    "BEEF EMPANADAS", "FIGS IN A BLANKET", "BRAISED SHORT RIBS",
    "COCONUT SHRIMP", "CANDIED PORK BELLY BURNT ENDS", "SRIRACHA CHICKEN MEATBALLS",
    "CHORIZO EMPANADA", "CHILI SPICED BRISKET", "MONGOLIAN BEEF SKEWER",
    "MINI VEGETABLE INDIAN SAMOSAS", "MINI VEGETABLE SKEWER",
    "MEXICAN SWEET CORN SHOOTER", "FIG & GOAT CHEESE CROSTINI",
    "PETITE GINGER CHICKEN KABOBS", "CHICKEN MANGO QUESADILLAS",
    "PISTACHIO CHICKEN TENDERS", "KOREAN FRIED CHICKEN",
    "BAO PEKING DUCK", "LAMB GYROS", "MEDITERRANEAN LAMB SATAY",
    "BRIE & RASPBERRY STUFFED FILO DOUGH", "CONEY ISLAND FRANKS",
    "FILET OF BEEF ON CROSTINI", "PEKING DUCK SPRING ROLLS",
    "POLPETTI", "BACON WRAPPED SCALLOPS", "FRIED BRUSSEL SPROUTS",
    "GREEN APPLE EMPANADAS", "POTATO WRAPPED SHRIMP", "MAC & CHEESE MELTS",
    "SMOKED CANDIED BACON JAM TART", "BUFFALO & BLEU CHEESE QUESADILLAS",
    "GREEK SALAD KABOBS", "FIRECRACKER SHRIMP ON BAMBOO",
    "CANDIED BACON SPOON", "WEDGE SALAD SKEWERS", "MUSHROOM CAPS STUFFED",
    "ALBACORE TUNA", "SESAME PEEKYTOE CRAB BALLS", "AHI TUNA TARTARE",
    "LOUISIANA LOBSTER HUSHPUPPIES", "LOBSTER QUESADILLAS",
    "TUNA & AVOCADO POKE", "KOREAN PORK BELLY", "OPEN-FACED CUBANO",
    "ROASTED PORK SPRING ROLLS", "MINI CUBAN X3",
    "PROSCIUTTO FLATBREAD SQUARES", "CAROLINA PULLED PORK",
    "SWEET & SOUR PORK BELLY", "FRESH STRAWBERRIES",
    "MINI BEEF EMPANADAS", "PIGS IN A BLANKET", "FIRECRACKER SHRIMP",
    "CHEESESTEAK DUMPLING", "BACON-WRAPPED SCALLOPS",
    "CHORIZO EMPANADAS"
  ].map(n => n.toLowerCase()));

  const presentedNames = new Set([
    "PETITE GRILLED CHICKEN KABOBS", "SMOKED SALMON ON BLACK BREAD",
    "TANDOORI CHICKEN SATAYS", "JUMBO LUMP CRAB SHOOTERS",
    "EGGPLANT CAPONATA DIP WITH OLIVE BREAD CROSTINI",
    "THE REALLY BUSY VEGETABLE CRUDITÉ", "CHEESESTEAK DUMPLINGS",
    "TRADITIONAL SHRIMP COCKTAIL", "GRILLED & CHILLED SHRIMP",
    "PACIFIC RIM ORIENTAL POTSTICKERS", "MINI GRILLED VEGETABLE TOWERS",
    "FOODWERX FUNKY SALAD SHOOTER", "MEDITERRANEAN DISPLAY",
    "MIDDLE EASTERN PLATTER", "JAPANESE SEARED AHI TUNA",
    "MINI LOBSTER ROLLS", "SESAME THAI NOODLES",
    "BRUSCHETTA PASTA SALAD SHOOTERS", "MOZZARELLA, BASIL & TOMATO ON BAMBOO",
    "SESAME CHICKEN ON BAMBOO", "SHRIMP & SCALLOP CEVICHE SHOOTER",
    "GREEK SALAD SKEWERS", "DECONSTRUCTED CHICKEN OR VEGETABLE ENCHILADA",
    "MANICURED VEGETABLE SHOOTER", "GRANDE CHARCUTERIE",
    "HANGING CHARCUTERIE", "DUO OF FLATBREADS",
    "CHICKEN CAPRESE MINI ROLL", "BUFFALO CHICKEN DIP",
    "PINTXOS Y TAPAS DE BARCELONA", "CHINATOWN DUCK",
    "MINIATURE TWICE BAKED POTATO", "BITE SIZE TACO",
    "KOREAN SHORT RIBS WITH PICKLED ONIONS",
    "TWICE COOKED PULLED PORK SLIDERS", "BACON BOURBON BBQ CHICKEN KABOBS",
    "TUNA POKE", "SEASONAL VEGETABLE QUINOA SHOOTER",
    "CHINESE CHICKEN SALAD", "GREEK STYLE ZUCCHINI CHIPS",
    "SEA SALAD PLATTER", "BUILD YOUR OWN SLIDERS",
    "TUNA & AVOCADO CEVICHE", "ITALIAN PANINI TRIANGLES",
    "ANTIPASTI DISPLAY", "VEGETABLE EMPANADAS",
    "STICKY MONGOLIAN BEEF SATAY", "WATERMELON, BASIL, AND FETA SKEWERS",
    "ASSORTED CROSTINI FLIGHT", "LIME GRILLED SHRIMP & MANGO SKEWERS",
    "POLPETTE", "JUMBO LUMP CRAB SHOOTER",
    "BACON & PIMENTO CHEESE STACK", "PROSCIUTTO WRAPPED ASPARAGUS",
    "CHARCUTERIE MINI CONES", "SOUTHWEST STYLE CHIPS & DIPS",
    "WONTON TACOS"
  ].map(n => n.toLowerCase()));

  // Find matches in Menu_Lab and tag them
  const passedToPatch = [];
  const presentedToPatch = [];
  const dessertsToPatch = [];

  ml.forEach(r => {
    const name = r.fields[ML_NAME];
    if (!name) return;
    const lower = name.toLowerCase();
    const display = r.fields[ML_DISPLAY] || [];
    const exec = r.fields[ML_EXEC] || [];

    if (passedNames.has(lower) && !display.includes("PASSED APPETIZERS")) {
      passedToPatch.push({ id: r.id, fields: { [ML_DISPLAY]: ["PASSED APPETIZERS"] }, _name: name });
    }
    if (presentedNames.has(lower) && !display.includes("PRESENTED APPETIZERS")) {
      presentedToPatch.push({ id: r.id, fields: { [ML_DISPLAY]: ["PRESENTED APPETIZERS"] }, _name: name });
    }
    // Fix desserts: items with DESSERTS exec type but wrong display type
    if (exec.includes("DESSERTS") && !display.includes("DESSERTS")) {
      dessertsToPatch.push({ id: r.id, fields: { [ML_DISPLAY]: ["DESSERTS"] }, _name: name });
    }
  });

  console.log(`Passed Appetizers to tag: ${passedToPatch.length}`);
  passedToPatch.forEach(p => console.log(`  ${p._name}`));
  console.log(`\nPresented Appetizers to tag: ${presentedToPatch.length}`);
  presentedToPatch.forEach(p => console.log(`  ${p._name}`));
  console.log(`\nDesserts to fix: ${dessertsToPatch.length}`);
  dessertsToPatch.forEach(p => console.log(`  ${p._name}`));

  const allPatches = [...passedToPatch, ...presentedToPatch, ...dessertsToPatch];
  console.log(`\nTotal to patch: ${allPatches.length}\n`);

  let success = 0;
  let failed = 0;
  for (let i = 0; i < allPatches.length; i += 10) {
    const batch = allPatches.slice(i, i + 10);
    const records = batch.map(r => ({ id: r.id, fields: r.fields }));
    process.stdout.write(`Batch ${Math.floor(i/10)+1}/${Math.ceil(allPatches.length/10)}... `);
    const ok = await patchBatch(records);
    if (ok) { success += batch.length; console.log("OK"); }
    else { failed += batch.length; console.log("FAILED"); }
    if (i + 10 < allPatches.length) await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n=== DONE ===`);
  console.log(`Tagged: ${success}`);
  console.log(`Failed: ${failed}`);
}

run().catch(e => console.error(e));
