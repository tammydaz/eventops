const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const MENU_LAB = "tbl6gXRT2FPpTdf0J";
const LEGACY = "tbl0aN33DGG6R1sPZ";

const ML_NAME = "fldpbzDFSg9sYeexU";
const ML_SECTION = "fld8Okh1qBnMeHwIN";
const ML_DISPLAY = "flddOn21WHp7XEaP9";
const ML_EXEC = "fldnP7tCisqdDkaOI";
const ML_PARENT = "fldLrxghm3bUg0bCx";

const LEG_NAME = "fldW5gfSlHRTl01v1";

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

function inferDisplayType(execTypes, menuSections) {
  const exec = (execTypes || []).map(e => e.toUpperCase());
  const sections = (menuSections || []).map(s => s.toLowerCase());
  
  if (exec.includes("CHAFER HOT") || exec.includes("CHAFER READY")) return "BUFFET";
  if (exec.includes("COLD DISPLAY")) return "DISPLAY";
  if (exec.includes("ROOM TEMP")) return "DISPLAY";
  if (exec.includes("BULK SIDES")) return "DISPLAY";
  if (exec.includes("DESSERTS")) return "DESSERTS";
  if (exec.includes("INDIVIDUAL PACKS")) return "DISPLAY";
  
  if (sections.some(s => s.includes("breakfast"))) return "DISPLAY";
  if (sections.some(s => s.includes("lunch"))) return "DISPLAY";
  if (sections.some(s => s.includes("salad"))) return "DISPLAY";
  if (sections.some(s => s.includes("ambient"))) return "DISPLAY";
  if (sections.some(s => s.includes("beverage"))) return "DISPLAY";
  if (sections.some(s => s.includes("snack") || s.includes("break"))) return "DISPLAY";
  if (sections.some(s => s.includes("hot lunch"))) return "BUFFET";
  if (sections.some(s => s.includes("sweet"))) return "DESSERTS";
  
  return null;
}

async function run() {
  const ml = await fetchAll(MENU_LAB, [ML_NAME, ML_SECTION, ML_DISPLAY, ML_EXEC, ML_PARENT]);
  const leg = await fetchAll(LEGACY, [LEG_NAME]);
  
  const legNames = new Set();
  leg.forEach(r => { const n = r.fields[LEG_NAME]; if (n) legNames.add(n.toLowerCase()); });

  const needsDisplay = [];
  const needsAll = [];
  
  ml.forEach(r => {
    const name = r.fields[ML_NAME];
    if (!name || !legNames.has(name.toLowerCase())) return;
    
    const display = r.fields[ML_DISPLAY];
    const exec = r.fields[ML_EXEC];
    const section = r.fields[ML_SECTION];
    const isChild = r.fields[ML_PARENT] && r.fields[ML_PARENT].length > 0;
    
    if (display && display.length > 0) return;
    
    if ((!exec || exec.length === 0) && (!section || section.length === 0)) {
      needsAll.push({ id: r.id, name, isChild });
      return;
    }
    
    const suggested = inferDisplayType(exec, section);
    needsDisplay.push({
      id: r.id,
      name,
      exec: exec || [],
      section: section || [],
      suggested,
      isChild
    });
  });

  console.log(`=== CAN AUTO-TAG DISPLAY TYPE (${needsDisplay.filter(x => x.suggested && !x.isChild).length} parent items) ===\n`);
  
  const grouped = {};
  needsDisplay.filter(x => x.suggested && !x.isChild).forEach(item => {
    const key = `${item.suggested} (from ${item.exec.join(",")||"section"})`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item.name);
  });
  
  for (const [key, names] of Object.entries(grouped)) {
    console.log(`\n${key}:`);
    names.forEach(n => console.log(`  ${n}`));
  }

  console.log(`\n=== CHILD ITEMS (will inherit from parent — ${needsDisplay.filter(x => x.isChild).length}) ===`);
  
  console.log(`\n=== NEED MANUAL REVIEW (no exec or section to infer from — ${needsAll.filter(x => !x.isChild).length}) ===`);
  needsAll.filter(x => !x.isChild).forEach(x => console.log(`  ${x.name}`));
  
  console.log(`\n=== TOTALS ===`);
  console.log(`Can auto-tag: ${needsDisplay.filter(x => x.suggested && !x.isChild).length} parents + ${needsDisplay.filter(x => x.isChild).length} children`);
  console.log(`Need manual review: ${needsAll.filter(x => !x.isChild).length}`);
}

run().catch(e => console.error(e));
