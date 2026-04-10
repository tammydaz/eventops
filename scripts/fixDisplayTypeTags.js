const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const MENU_LAB = "tbl6gXRT2FPpTdf0J";

const ML_NAME = "fldpbzDFSg9sYeexU";
const ML_DISPLAY = "flddOn21WHp7XEaP9";
const ML_EXEC = "fldnP7tCisqdDkaOI";
const ML_SECTION = "fld8Okh1qBnMeHwIN";

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
  if (data.error) { console.error("PATCH Error:", data.error); return false; }
  return true;
}

function inferSpecificDisplayType(execTypes, menuSections) {
  const exec = (execTypes || []).map(e => e.toUpperCase());
  const sections = (menuSections || []).map(s => s.toLowerCase());

  // Hot items: need to distinguish metal vs passed vs presented
  if (exec.includes("CHAFER HOT") || exec.includes("CHAFER READY")) {
    // If it has a "passed" hint in section or name context, use that
    // But without more context, BUFFET METAL is the safe default for hot items
    return ["BUFFET METAL"];
  }

  if (exec.includes("COLD DISPLAY")) {
    return ["BUFFET CHINA"];
  }

  if (exec.includes("ROOM TEMP")) {
    return ["DISPLAY"];
  }

  if (exec.includes("BULK SIDES")) {
    return ["BUFFET CHINA"];
  }

  if (exec.includes("DESSERTS")) {
    return ["DESSERTS"];
  }

  if (exec.includes("INDIVIDUAL PACKS")) {
    return ["DISPLAY"];
  }

  // Fallback based on menu section
  if (sections.some(s => s.includes("ambient"))) return ["DISPLAY"];
  if (sections.some(s => s.includes("hot lunch"))) return ["BUFFET METAL"];
  if (sections.some(s => s.includes("breakfast - hot"))) return ["BUFFET METAL"];
  if (sections.some(s => s.includes("breakfast"))) return ["DISPLAY"];
  if (sections.some(s => s.includes("lunch"))) return ["DISPLAY"];
  if (sections.some(s => s.includes("salad"))) return ["BUFFET CHINA"];
  if (sections.some(s => s.includes("sweet"))) return ["DESSERTS"];
  if (sections.some(s => s.includes("beverage"))) return ["DISPLAY"];
  if (sections.some(s => s.includes("snack") || s.includes("break"))) return ["DISPLAY"];

  return null;
}

async function run() {
  console.log("Fetching Menu_Lab...");
  const ml = await fetchAll(MENU_LAB, [ML_NAME, ML_DISPLAY, ML_EXEC, ML_SECTION]);
  console.log(`Got ${ml.length} records\n`);

  // Find items with generic Display Type that needs to be more specific
  const genericTags = new Set(["BUFFET", "DISPLAY"]);
  const toPatch = [];

  ml.forEach(r => {
    const name = r.fields[ML_NAME];
    const display = r.fields[ML_DISPLAY] || [];
    const exec = r.fields[ML_EXEC] || [];
    const section = r.fields[ML_SECTION] || [];

    if (exec.length === 0 && section.length === 0) return;

    // Case 1: has a generic tag that should be more specific
    const hasGeneric = display.some(d => genericTags.has(d));
    // Case 2: only has DESSERTS (that's already correct)
    const onlyDesserts = display.length === 1 && display[0] === "DESSERTS";

    if (hasGeneric || display.length === 0) {
      const specific = inferSpecificDisplayType(exec, section);
      if (specific && JSON.stringify(specific) !== JSON.stringify(display)) {
        toPatch.push({ id: r.id, fields: { [ML_DISPLAY]: specific }, _name: name, _old: display, _new: specific });
      }
    }
  });

  console.log(`Items to fix: ${toPatch.length}\n`);

  // Show what we're changing
  const groups = {};
  toPatch.forEach(p => {
    const key = `${(p._old||[]).join(",")||"(empty)"} → ${p._new.join(",")}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p._name);
  });
  for (const [change, names] of Object.entries(groups)) {
    console.log(`${change}: ${names.length} items`);
  }
  console.log("");

  let success = 0;
  let failed = 0;
  for (let i = 0; i < toPatch.length; i += 10) {
    const batch = toPatch.slice(i, i + 10);
    const records = batch.map(r => ({ id: r.id, fields: r.fields }));
    const batchNum = Math.floor(i / 10) + 1;
    const total = Math.ceil(toPatch.length / 10);
    process.stdout.write(`Batch ${batchNum}/${total}... `);
    const ok = await patchBatch(records);
    if (ok) { success += batch.length; console.log("OK"); }
    else { failed += batch.length; console.log("FAILED"); }
    if (i + 10 < toPatch.length) await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n=== DONE ===`);
  console.log(`Fixed: ${success}`);
  console.log(`Failed: ${failed}`);
}

run().catch(e => console.error(e));
