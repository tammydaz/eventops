const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const MENU_LAB = "tbl6gXRT2FPpTdf0J";

const ML_NAME = "fldpbzDFSg9sYeexU";
const ML_DISPLAY = "flddOn21WHp7XEaP9";
const ML_CHILDREN = "fldDDfLJTI6BK1zKd";

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
  console.log("Fetching Menu_Lab...");
  const ml = await fetchAll(MENU_LAB, [ML_NAME, ML_DISPLAY, ML_CHILDREN]);
  console.log(`Got ${ml.length} records\n`);

  // All appetizer items should have BOTH passed and presented tags
  const allAppNames = new Set([
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
    "GREEK SALAD KABOBS", "FIRECRACKER SHRIMP ON BAMBOO", "FIRECRACKER SHRIMP",
    "CANDIED BACON SPOON", "WEDGE SALAD SKEWERS", "MUSHROOM CAPS STUFFED",
    "ALBACORE TUNA", "SESAME PEEKYTOE CRAB BALLS", "AHI TUNA TARTARE",
    "LOUISIANA LOBSTER HUSHPUPPIES", "LOBSTER QUESADILLAS",
    "TUNA & AVOCADO POKE", "KOREAN PORK BELLY", "OPEN-FACED CUBANO",
    "ROASTED PORK SPRING ROLLS", "MINI CUBAN X3",
    "PROSCIUTTO FLATBREAD SQUARES", "CAROLINA PULLED PORK",
    "SWEET & SOUR PORK BELLY", "FRESH STRAWBERRIES",
    "MINI BEEF EMPANADAS", "PIGS IN A BLANKET",
    "CHEESESTEAK DUMPLING", "BACON-WRAPPED SCALLOPS", "CHORIZO EMPANADAS",
    // Presented list
    "PETITE GRILLED CHICKEN KABOBS", "SMOKED SALMON ON BLACK BREAD",
    "TANDOORI CHICKEN SATAYS", "JUMBO LUMP CRAB SHOOTERS",
    "EGGPLANT CAPONATA DIP WITH OLIVE BREAD CROSTINI",
    "THE REALLY BUSY VEGETABLE CRUDITÉ",
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
    "WONTON TACOS", "CHICKEN & WAFFLES",
    "DR. PEPPER MARINATED FLANK STEAK MEXICAN ROLL UPS",
    "SHREDDED PORK, PICKLED CUCUMBER & SRIRACHA AIOLI",
    "PORK BELLY, ROASTED POBLANO, MANCHEGO GRILLED CHEESE WEDGES"
  ].map(n => n.toLowerCase()));

  const toPatch = [];

  ml.forEach(r => {
    const name = r.fields[ML_NAME];
    if (!name) return;
    const lower = name.toLowerCase();
    if (!allAppNames.has(lower)) return;

    const current = r.fields[ML_DISPLAY] || [];
    const hasPassed = current.includes("PASSED APPETIZERS");
    const hasPresented = current.includes("PRESENTED APPETIZERS");

    if (hasPassed && hasPresented) return;

    // Build new display type array: keep existing, add missing
    const newDisplay = new Set(current);
    newDisplay.add("PASSED APPETIZERS");
    newDisplay.add("PRESENTED APPETIZERS");

    toPatch.push({
      id: r.id,
      fields: { [ML_DISPLAY]: [...newDisplay] },
      _name: name,
      _old: current,
      _new: [...newDisplay]
    });
  });

  console.log(`Items to give BOTH passed+presented tags: ${toPatch.length}`);
  toPatch.forEach(p => console.log(`  ${p._name}: [${p._old.join(",")}] → [${p._new.join(",")}]`));

  // Also check for items with children that lost sauce references
  const withChildren = ml.filter(r => {
    const children = r.fields[ML_CHILDREN];
    return children && children.length > 0;
  });
  console.log(`\nItems with children (sauces intact): ${withChildren.length}`);
  withChildren.slice(0, 10).forEach(r => {
    console.log(`  ${r.fields[ML_NAME]}: ${r.fields[ML_CHILDREN].length} children`);
  });

  console.log(`\nPatching ${toPatch.length} items...\n`);

  let success = 0;
  let failed = 0;
  for (let i = 0; i < toPatch.length; i += 10) {
    const batch = toPatch.slice(i, i + 10);
    const records = batch.map(r => ({ id: r.id, fields: r.fields }));
    process.stdout.write(`Batch ${Math.floor(i/10)+1}/${Math.ceil(toPatch.length/10)}... `);
    const ok = await patchBatch(records);
    if (ok) { success += batch.length; console.log("OK"); }
    else { failed += batch.length; console.log("FAILED"); }
    if (i + 10 < toPatch.length) await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n=== DONE ===`);
  console.log(`Tagged with BOTH passed+presented: ${success}`);
  console.log(`Failed: ${failed}`);
}

run().catch(e => console.error(e));
