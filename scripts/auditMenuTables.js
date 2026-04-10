const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const MENU_LAB = "tbl6gXRT2FPpTdf0J";
const LEGACY = "tbl0aN33DGG6R1sPZ";

const ML_NAME = "fldpbzDFSg9sYeexU";
const ML_SECTION = "fld8Okh1qBnMeHwIN";
const ML_DISPLAY = "flddOn21WHp7XEaP9";
const ML_EXEC = "fldnP7tCisqdDkaOI";
const ML_CHILDREN = "fldDDfLJTI6BK1zKd";
const ML_PARENT = "fldLrxghm3bUg0bCx";

const LEG_NAME = "fldW5gfSlHRTl01v1";
const LEG_CHILDREN = "fldIu6qmlUwAEn2W9";

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

async function run() {
  console.log("Fetching Menu_Lab...");
  const ml = await fetchAll(MENU_LAB, [ML_NAME, ML_SECTION, ML_DISPLAY, ML_EXEC, ML_CHILDREN, ML_PARENT]);
  console.log(`Menu_Lab: ${ml.length} records\n`);

  console.log("Fetching Legacy...");
  const leg = await fetchAll(LEGACY, [LEG_NAME, LEG_CHILDREN]);
  console.log(`Legacy: ${leg.length} records\n`);

  const mlNames = new Map();
  ml.forEach(r => {
    const n = r.fields[ML_NAME];
    if (n) mlNames.set(n.toLowerCase(), r);
  });

  const legNames = new Map();
  leg.forEach(r => {
    const n = r.fields[LEG_NAME];
    if (n) legNames.set(n.toLowerCase(), r);
  });

  // Items that match by name — check for missing tags
  const matched = [];
  const missingTags = [];
  for (const [lowerName, mlRec] of mlNames) {
    if (legNames.has(lowerName)) {
      matched.push(lowerName);
      const section = mlRec.fields[ML_SECTION];
      const display = mlRec.fields[ML_DISPLAY];
      const exec = mlRec.fields[ML_EXEC];
      const isParent = !mlRec.fields[ML_PARENT] || mlRec.fields[ML_PARENT].length === 0;
      const hasChildren = mlRec.fields[ML_CHILDREN] && mlRec.fields[ML_CHILDREN].length > 0;
      const missing = [];
      if (!exec || exec.length === 0) missing.push("Execution Type");
      if (!section || section.length === 0) missing.push("Menu Section");
      if (!display || display.length === 0) missing.push("Display Type");
      if (missing.length > 0) {
        missingTags.push({
          name: mlRec.fields[ML_NAME],
          id: mlRec.id,
          missing,
          isParent,
          hasChildren: !!hasChildren
        });
      }
    }
  }

  // Items in Menu_Lab but NOT in Legacy
  const mlOnly = [];
  for (const [lowerName, mlRec] of mlNames) {
    if (!legNames.has(lowerName)) {
      const isChild = mlRec.fields[ML_PARENT] && mlRec.fields[ML_PARENT].length > 0;
      mlOnly.push({ name: mlRec.fields[ML_NAME], isChild });
    }
  }

  // Items in Legacy but NOT in Menu_Lab
  const legOnly = [];
  for (const [lowerName, legRec] of legNames) {
    if (!mlNames.has(lowerName)) {
      const hasChildren = legRec.fields[LEG_CHILDREN] && legRec.fields[LEG_CHILDREN].length > 0;
      legOnly.push({ name: legRec.fields[LEG_NAME], hasChildren });
    }
  }

  console.log("=== MATCHED ITEMS WITH MISSING TAGS ===");
  console.log(`(${missingTags.length} items need tags)\n`);
  missingTags.forEach(item => {
    const flags = [];
    if (item.isParent && item.hasChildren) flags.push("PACKAGE");
    console.log(`  ${item.name} ${flags.length ? `[${flags.join(",")}]` : ""}`);
    console.log(`    Missing: ${item.missing.join(", ")}`);
  });

  console.log(`\n=== IN MENU_LAB BUT NOT IN LEGACY (${mlOnly.length}) ===`);
  mlOnly.filter(x => !x.isChild).forEach(x => console.log(`  ${x.name}`));
  if (mlOnly.filter(x => x.isChild).length > 0) {
    console.log(`  ... plus ${mlOnly.filter(x => x.isChild).length} child items`);
  }

  console.log(`\n=== IN LEGACY BUT NOT IN MENU_LAB (${legOnly.length}) ===`);
  legOnly.slice(0, 50).forEach(x => console.log(`  ${x.name}${x.hasChildren ? " [HAS CHILDREN]" : ""}`));
  if (legOnly.length > 50) console.log(`  ... and ${legOnly.length - 50} more`);

  console.log(`\n=== SUMMARY ===`);
  console.log(`Matched (both tables): ${matched.length}`);
  console.log(`Need tags: ${missingTags.length}`);
  console.log(`Menu_Lab only: ${mlOnly.length}`);
  console.log(`Legacy only: ${legOnly.length}`);
}

run().catch(e => console.error(e));
