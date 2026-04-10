const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const LEGACY = "tbl0aN33DGG6R1sPZ";
const NAME_FIELD = "fldW5gfSlHRTl01v1";
const CAT_FIELD = "fldM7lWvjH8S0YNSX";
const CHILD_FIELD = "fldIu6qmlUwAEn2W9";

const PASSED_HORS_DOEUVRES = [
  "Quilted Franks",
  "Sesame Crusted Chicken Satays",
  "Spanakopita",
  "Mini Chicken Quesadillas",
  "Lamb Lollipops",
  "Mini Beef Wellingtons",
  "Hibachi Chicken Kabobs",
  "Fresh Strawberries",
  "Vegetable Spring Rolls",
  "Stuffed Mushrooms",
  "Mini Jumbo Lump Crab Cakes",
  "Edamame Quesadillas",
  "Cheesesteak Dumplings",
  "Beef Empanadas",
  "Figs In A Blanket",
  "Braised Short Ribs",
  "Coconut Shrimp",
  "Candied Pork Belly Burnt Ends",
  "Sriracha Chicken Meatballs",
  "Chorizo Empanada",
  "Chili Spiced Brisket",
  "Mongolian Beef Skewer",
  "Mini Vegetable Indian Samoas",
  "Mini Vegetable Skewer",
  "Mexican Sweet Corn Shooter",
  "Fig & Goat Cheese Crostini",
  "Petite Ginger Chicken Kabobs",
  "Chicken Mango Quesadillas",
  "Pistachi Chicken Tenders",
  "Korean Fried Chicken",
  "Bao Peking Duck",
  "Lamb Gyros",
  "Mediterranean Lamb Satay",
  "Brie & Raspberry Stuffed Filo Dough",
  "Coney Island Franks",
  "Filet Of Beef On Crostini",
  "Peking Duck Spring Rolls",
  "Polpetti",
  "Bacon Wrapped Scallops",
  "Fried Brussel Sprouts",
  "Green Apple Empanadas",
  "Potato Wrapped Shrimp",
  "Mac & Cheese Melts",
  "Smoked Candied Bacon Jam Tart",
  "Buffalo & Bleu Cheese Quesadillas",
  "Greek Salad Kabobs",
  "Firecracker Shrimp On Bamboo",
  "Candied Bacon Spoon",
  "Wedge Salad Skewers",
  "Mushroom Caps Stuffed",
  "Albacore Tuna",
  "Sesame Peekytoe Crab Balls",
  "Ahi Tuna Tartare",
  "Louisiana Lobster Hushpuppies",
  "Lobster Quesadillas",
  "Tuna & Avocado Poke",
  "Korean Pork Belly",
  "Open-Faced Cubano",
  "Roasted Pork Spring Rolls",
  "Mini Cuban X3",
  "Prosciutto Flatbread Squares",
  "Carolina Pulled Pork",
  "Sweet & Sour Pork Belly",
];

const PRESENTED_APPETIZERS = [
  "Petite Grilled Chicken Kabobs",
  "Smoked Salmon On Black Bread",
  "Tandoori Chicken Satays",
  "Jumbo Lump Crab Shooters",
  "Eggplant Caponata Dip",
  "The Really Busy Vegetable Crudite",
  "Cheesesteak Dumplings",
  "Traditional Shrimp Cocktail",
  "Grilled & Chilled Shrimp",
  "Dr. Pepper Marinated Flank Steak",
  "Pacific Rim Oriental Potstickers",
  "Mini Grilled Vegetable Towers",
  "Foodwerx Funky Salad Shooter",
  "Mediterranean Display",
  "Middle Eastern Platter",
  "Japanese Seared Ahi Tuna",
  "Mini Lobster Rolls",
  "Sesame Thai Noodles",
  "Bruschetta Pasta Salad Shooters",
  "Mozzarella Basil & Tomato On Bamboo",
  "Sesame Chicken On Bamboo",
  "Shrimp & Scallop Ceviche Shooter",
  "Greek Salad Skewers",
  "Deconstructed Enchilada",
  "Manicured Vegetable Shooter",
  "Grande Charcuterie",
  "Hanging Charcuterie",
  "Duo Of Flatbreads",
  "Chicken Caprese Mini Roll",
  "Buffalo Chicken Dip",
  "Pintxos Y Tapas De Barcelona",
  "Chinatown Duck",
  "Miniature Twice Baked Potato",
  "Bite Size Taco",
  "Pork Belly Roasted Poblano Manchego Grilled Cheese Wedges",
  "Korean Short Ribs With Pickled Onions",
  "Twice Cooked Pulled Pork Sliders",
  "Bacon Bourbon BBQ Chicken Kabobs",
  "Tuna Poke",
  "Seasonal Vegetable Quinoa Shooter",
  "Chinese Chicken Salad",
  "Greek Style Zucchini Chips",
  "Sea Salad Platter",
  "Build Your Own Sliders",
  "Tuna & Avocado Ceviche",
  "Italian Panini Triangles",
  "Antipasti Display",
  "Vegetable Empanadas",
  "Dr. Pepper Marinated Flank Steak Mexican Roll Ups",
  "Sticky Mongolian Beef Satay",
  "Watermelon Basil And Feta Skewers",
  "Assorted Crostini Flight",
  "Lime Grilled Shrimp & Mango Skewers",
  "Polpette",
  "Shredded Pork Pickled Cucumber & Sriracha Aioli",
  "Jumbo Lump Crab Shooter",
  "Bacon & Pimento Cheese Stack",
  "Prosciutto Wrapped Asparagus",
  "Charcuterie Mini Cones",
  "Southwest Style Chips & Dips",
  "Wonton Tacos",
];

const COCKTAIL_DISPLAYS = [
  "Vegetable Display",
  "Spreads & Breads",
  "Grande Charcuterie Display",
  "Pasta Flight Presentation",
  "Farmers Market Fruit",
  "Cravin Asian",
  "Fishermans Corner",
  "Barwerx Appetizer Sampler",
  "The Philly Jawn",
];

const CREATION_STATIONS = [
  "Tex-Mex",
  "Ramen Noodle Bar",
  "All-American",
  "Viva La Pasta",
  "Street Food Station",
  "Iced Raw Bar",
  "Carving Station",
  "Hibachi Station",
  "Chicken & Waffle Station",
];

const ENHANCEMENT_STATIONS = [
  "Late Night Bites",
  "Donut Wall",
  "Pop-Tart A La Carte",
];

async function fetchAll() {
  const all = [];
  let offset;
  do {
    const p = new URLSearchParams();
    p.set("pageSize", "100");
    p.set("returnFieldsByFieldId", "true");
    p.append("fields[]", NAME_FIELD);
    p.append("fields[]", CAT_FIELD);
    p.append("fields[]", CHILD_FIELD);
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
  const byNameLower = {};
  for (const r of all) {
    const name = (r.fields[NAME_FIELD] || "").trim();
    if (name) {
      const key = name.toLowerCase();
      if (!byNameLower[key]) byNameLower[key] = [];
      byNameLower[key].push(r);
    }
  }

  function findMatch(name) {
    const key = name.toLowerCase();
    if (byNameLower[key]) return byNameLower[key][0];
    // Try contains match
    for (const [k, recs] of Object.entries(byNameLower)) {
      if (k.includes(key) || key.includes(k)) return recs[0];
    }
    // Try word match (first 3+ words)
    const words = key.split(/\s+/).filter(w => w.length > 2);
    if (words.length >= 2) {
      for (const [k, recs] of Object.entries(byNameLower)) {
        const matchCount = words.filter(w => k.includes(w)).length;
        if (matchCount >= Math.min(3, words.length)) return recs[0];
      }
    }
    return null;
  }

  function audit(sectionName, expectedItems, requiredCats) {
    console.log(`\n========== ${sectionName} ==========`);
    console.log(`Expected: ${expectedItems.length} items`);

    const missing = [];
    const wrongCat = [];
    const ok = [];

    for (const name of expectedItems) {
      const rec = findMatch(name);
      if (!rec) {
        missing.push(name);
      } else {
        const cat = rec.fields[CAT_FIELD] || "";
        const catStr = typeof cat === "string" ? cat : (cat.name || String(cat));
        const children = rec.fields[CHILD_FIELD] || [];
        const childCount = Array.isArray(children) ? children.length : 0;
        const isRight = requiredCats.some(c => catStr.includes(c));
        const recName = rec.fields[NAME_FIELD];
        if (!isRight && catStr) {
          wrongCat.push({ name, recName, cat: catStr, id: rec.id });
        } else if (!catStr) {
          wrongCat.push({ name, recName, cat: "(none)", id: rec.id });
        } else {
          ok.push(`${recName} [${catStr}]${childCount > 0 ? ` (${childCount} children)` : ""}`);
        }
      }
    }

    console.log(`  OK: ${ok.length}`);
    if (wrongCat.length > 0) {
      console.log(`  WRONG/MISSING CATEGORY (${wrongCat.length}):`);
      for (const w of wrongCat) console.log(`    ⚠ "${w.recName}" has "${w.cat}" -> needs [${requiredCats[0]}]  (${w.id})`);
    }
    if (missing.length > 0) {
      console.log(`  MISSING FROM AIRTABLE (${missing.length}):`);
      for (const m of missing) console.log(`    ✗ ${m}`);
    }
    return { missing, wrongCat };
  }

  const appCats = ["Passed App", "Presented App", "Appetizer", "Passed", "App"];
  const r1 = audit("PASSED HORS D'OEUVRES", PASSED_HORS_DOEUVRES, appCats);
  const r2 = audit("PRESENTED APPETIZERS", PRESENTED_APPETIZERS, [...appCats, "Station Item", "Station", "Display"]);
  const r3 = audit("COCKTAIL DISPLAYS", COCKTAIL_DISPLAYS, ["Station Item", "Station", "Display", "Appetizer", "Presented App"]);
  const r4 = audit("CREATION STATIONS", CREATION_STATIONS, ["Station Item", "Station"]);
  const r5 = audit("ENHANCEMENT STATIONS", ENHANCEMENT_STATIONS, ["Station Item", "Station", "Dessert", "Display"]);

  const totalMissing = r1.missing.length + r2.missing.length + r3.missing.length + r4.missing.length + r5.missing.length;
  const totalWrong = r1.wrongCat.length + r2.wrongCat.length + r3.wrongCat.length + r4.wrongCat.length + r5.wrongCat.length;
  console.log(`\n========== SUMMARY ==========`);
  console.log(`Total missing from Airtable: ${totalMissing}`);
  console.log(`Total wrong/missing category: ${totalWrong}`);
})().catch(console.error);
