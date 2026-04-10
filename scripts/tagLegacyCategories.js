const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const LEGACY = "tbl0aN33DGG6R1sPZ";
const ML = "tbl6gXRT2FPpTdf0J";
const NAME_FIELD = "fldW5gfSlHRTl01v1";
const CAT_FIELD = "fldM7lWvjH8S0YNSX";
const ML_NAME = "fldpbzDFSg9sYeexU";
const ML_DISPLAY_TYPE = "flddOn21WHp7XEaP9";
const ML_EXEC_TYPE = "fldnP7tCisqdDkaOI";

// Map Menu_Lab tags -> legacy Category value
function inferCategory(displayTypes, execTypes) {
  const dt = displayTypes.map(s => s.toUpperCase());
  const et = execTypes.map(s => s.toUpperCase());

  if (dt.includes("PASSED APPETIZERS") || dt.includes("PRESENTED APPETIZERS")) return "Appetizer";
  if (dt.includes("DESSERTS") || et.includes("DESSERTS")) return "Dessert";
  if (dt.includes("STATION") || et.includes("STATIONS")) return "Station Item";
  if (dt.includes("BEVERAGES") || et.includes("BEVERAGES")) return "Beverage";
  if (et.includes("INDIVIDUAL PACKS")) return "Deli";
  if (dt.includes("BUFFET METAL") || et.includes("CHAFER HOT") || et.includes("CHAFER READY")) {
    if (et.includes("CHAFER HOT") || et.includes("CHAFER READY")) return "Entrée";
    return "Buffet Metal";
  }
  if (dt.includes("BUFFET CHINA") || et.includes("COLD DISPLAY") || et.includes("BULK SIDES")) return "Buffet China";
  if (dt.includes("DISPLAY") || et.includes("ROOM TEMP")) return "Display";
  if (dt.includes("COLD DISPLAY")) return "Buffet China";
  return null;
}

async function fetchAll(tableId, fields) {
  const all = [];
  let offset;
  do {
    const p = new URLSearchParams();
    p.set("pageSize", "100");
    p.set("returnFieldsByFieldId", "true");
    for (const f of fields) p.append("fields[]", f);
    if (offset) p.set("offset", offset);
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${tableId}?${p}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    const d = await r.json();
    if (!d.records) break;
    all.push(...d.records);
    offset = d.offset;
  } while (offset);
  return all;
}

async function patchBatch(records) {
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${LEGACY}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ records, typecast: true }),
  });
  const d = await r.json();
  if (d.error) {
    console.error("PATCH error:", d.error);
    return false;
  }
  return true;
}

(async () => {
  console.log("Loading legacy and Menu_Lab tables...");
  const [legacy, menuLab] = await Promise.all([
    fetchAll(LEGACY, [NAME_FIELD, CAT_FIELD]),
    fetchAll(ML, [ML_NAME, ML_DISPLAY_TYPE, ML_EXEC_TYPE]),
  ]);
  console.log(`Legacy: ${legacy.length}, Menu_Lab: ${menuLab.length}`);

  // Build Menu_Lab name -> tags
  const mlByName = {};
  for (const r of menuLab) {
    const name = (r.fields[ML_NAME] || "").trim().toLowerCase();
    if (!name) continue;
    const dt = r.fields[ML_DISPLAY_TYPE] || [];
    const et = r.fields[ML_EXEC_TYPE] || [];
    mlByName[name] = {
      displayType: Array.isArray(dt) ? dt.map(String) : [String(dt)].filter(Boolean),
      execType: Array.isArray(et) ? et.map(String) : [String(et)].filter(Boolean),
    };
  }

  // Find untagged legacy items and infer Category
  const toPatch = [];
  let skipped = 0;
  for (const r of legacy) {
    const cat = r.fields[CAT_FIELD];
    if (cat && (typeof cat !== "string" || cat.trim() !== "")) continue; // already tagged

    const name = (r.fields[NAME_FIELD] || "").trim().toLowerCase();
    const ml = mlByName[name];
    if (!ml) { skipped++; continue; }

    const category = inferCategory(ml.displayType, ml.execType);
    if (!category) { skipped++; continue; }

    toPatch.push({ id: r.id, fields: { [CAT_FIELD]: category }, name: r.fields[NAME_FIELD], category });
  }

  console.log(`\nWill tag ${toPatch.length} items. Skipped ${skipped} (no match or no tags).`);

  // Show breakdown
  const byCat = {};
  for (const p of toPatch) {
    byCat[p.category] = (byCat[p.category] || 0) + 1;
  }
  console.log("\nBreakdown:");
  for (const [cat, count] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  // Patch in batches of 10
  console.log("\nPatching...");
  let patched = 0;
  for (let i = 0; i < toPatch.length; i += 10) {
    const batch = toPatch.slice(i, i + 10).map(p => ({ id: p.id, fields: { [CAT_FIELD]: p.category } }));
    const ok = await patchBatch(batch);
    if (ok) patched += batch.length;
    else console.error("Failed batch at index", i);
    process.stdout.write(".");
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(` done`);
  console.log(`\n=== COMPLETE ===`);
  console.log(`Tagged: ${patched}`);
  console.log(`Skipped: ${skipped}`);
})().catch(console.error);
