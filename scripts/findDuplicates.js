const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const ML = "tbl6gXRT2FPpTdf0J";
const LEG = "tbl0aN33DGG6R1sPZ";
const ML_NAME = "fldpbzDFSg9sYeexU";
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
  const ml = await fetchAll(ML, [ML_NAME, ML_CHILDREN, ML_PARENT]);
  console.log(`Menu_Lab: ${ml.length} records`);

  console.log("Fetching Legacy...");
  const leg = await fetchAll(LEG, [LEG_NAME, LEG_CHILDREN]);
  console.log(`Legacy: ${leg.length} records\n`);

  // Find duplicates in both tables
  const mlByName = {};
  ml.forEach(r => {
    const n = (r.fields[ML_NAME] || "").toLowerCase();
    if (!mlByName[n]) mlByName[n] = [];
    mlByName[n].push(r);
  });

  const legByName = {};
  leg.forEach(r => {
    const n = (r.fields[LEG_NAME] || "").toLowerCase();
    if (!legByName[n]) legByName[n] = [];
    legByName[n].push(r);
  });

  const mlDups = Object.entries(mlByName).filter(([k, v]) => v.length > 1);
  const legDups = Object.entries(legByName).filter(([k, v]) => v.length > 1);

  console.log(`=== MENU_LAB DUPLICATES: ${mlDups.length} names ===`);
  mlDups.sort((a, b) => b[1].length - a[1].length);
  mlDups.slice(0, 20).forEach(([name, recs]) => {
    console.log(`  ${recs.length}x "${recs[0].fields[ML_NAME]}"`);
    recs.forEach(r => {
      const children = r.fields[ML_CHILDREN] || [];
      const parent = r.fields[ML_PARENT] || [];
      console.log(`    ${r.id} | children: ${children.length} | isChild: ${parent.length > 0}`);
    });
  });

  console.log(`\n=== LEGACY DUPLICATES: ${legDups.length} names ===`);
  legDups.sort((a, b) => b[1].length - a[1].length);
  legDups.slice(0, 20).forEach(([name, recs]) => {
    console.log(`  ${recs.length}x "${recs[0].fields[LEG_NAME]}"`);
    recs.forEach(r => {
      const children = r.fields[LEG_CHILDREN] || [];
      console.log(`    ${r.id} | children: ${children.length}`);
    });
  });

  // Specifically look for Parmesan Crusted Chicken
  console.log("\n=== PARMESAN CRUSTED CHICKEN (Menu_Lab) ===");
  ml.filter(r => (r.fields[ML_NAME] || "").toLowerCase().includes("parmesan") && (r.fields[ML_NAME] || "").toLowerCase().includes("chicken"))
    .forEach(r => {
      const children = r.fields[ML_CHILDREN] || [];
      const parent = r.fields[ML_PARENT] || [];
      console.log(`  "${r.fields[ML_NAME]}" | id: ${r.id} | children: ${children.length} | isChild: ${parent.length > 0}`);
    });

  console.log("\n=== PARMESAN CRUSTED CHICKEN (Legacy) ===");
  leg.filter(r => (r.fields[LEG_NAME] || "").toLowerCase().includes("parmesan") && (r.fields[LEG_NAME] || "").toLowerCase().includes("chicken"))
    .forEach(r => {
      const children = r.fields[LEG_CHILDREN] || [];
      console.log(`  "${r.fields[LEG_NAME]}" | id: ${r.id} | children: ${children.length}`);
    });
}

run().catch(e => console.error(e));
