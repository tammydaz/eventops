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

function inferDisplayType(execTypes) {
  const exec = (execTypes || []).map(e => e.toUpperCase());
  if (exec.includes("CHAFER HOT") || exec.includes("CHAFER READY")) return "BUFFET";
  if (exec.includes("COLD DISPLAY")) return "DISPLAY";
  if (exec.includes("ROOM TEMP")) return "DISPLAY";
  if (exec.includes("BULK SIDES")) return "DISPLAY";
  if (exec.includes("DESSERTS")) return "DESSERTS";
  if (exec.includes("INDIVIDUAL PACKS")) return "DISPLAY";
  return null;
}

async function patchBatch(records) {
  const url = `https://api.airtable.com/v0/${BASE}/${MENU_LAB}?typecast=true`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ records, typecast: true })
  });
  const data = await res.json();
  if (data.error) {
    console.error("PATCH Error:", data.error);
    return false;
  }
  return true;
}

async function run() {
  console.log("Fetching Menu_Lab...");
  const ml = await fetchAll(MENU_LAB, [ML_NAME, ML_DISPLAY, ML_EXEC, ML_PARENT]);
  console.log(`Got ${ml.length} records`);

  console.log("Fetching Legacy for name matching...");
  const leg = await fetchAll(LEGACY, [LEG_NAME]);
  const legNames = new Set();
  leg.forEach(r => { const n = r.fields[LEG_NAME]; if (n) legNames.add(n.toLowerCase()); });

  const toPatch = [];
  ml.forEach(r => {
    const name = r.fields[ML_NAME];
    if (!name || !legNames.has(name.toLowerCase())) return;
    const display = r.fields[ML_DISPLAY];
    if (display && display.length > 0) return;
    const exec = r.fields[ML_EXEC];
    if (!exec || exec.length === 0) return;
    const suggested = inferDisplayType(exec);
    if (!suggested) return;
    toPatch.push({ id: r.id, fields: { [ML_DISPLAY]: [suggested] }, _name: name });
  });

  console.log(`\nReady to tag ${toPatch.length} items with Display Type\n`);

  let success = 0;
  let failed = 0;
  for (let i = 0; i < toPatch.length; i += 10) {
    const batch = toPatch.slice(i, i + 10);
    const records = batch.map(r => ({ id: r.id, fields: r.fields }));
    console.log(`Batch ${Math.floor(i/10)+1}/${Math.ceil(toPatch.length/10)}: ${batch.map(b => b._name).join(", ")}`);
    const ok = await patchBatch(records);
    if (ok) {
      success += batch.length;
    } else {
      failed += batch.length;
    }
    if (i + 10 < toPatch.length) await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n=== DONE ===`);
  console.log(`Tagged: ${success}`);
  console.log(`Failed: ${failed}`);
}

run().catch(e => console.error(e));
