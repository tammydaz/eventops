const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const MENU_LAB = "tbl6gXRT2FPpTdf0J";
const LEGACY = "tbl0aN33DGG6R1sPZ";

const ML_NAME = "fldpbzDFSg9sYeexU";
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

async function createBatch(records) {
  const url = `https://api.airtable.com/v0/${BASE}/${LEGACY}?typecast=true`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ records, typecast: true })
  });
  const data = await res.json();
  if (data.error) {
    console.error("CREATE Error:", data.error);
    return null;
  }
  return data.records || [];
}

async function run() {
  console.log("Fetching Menu_Lab...");
  const ml = await fetchAll(MENU_LAB, [ML_NAME, ML_PARENT]);
  console.log(`Menu_Lab: ${ml.length} records`);

  console.log("Fetching Legacy...");
  const leg = await fetchAll(LEGACY, [LEG_NAME]);
  console.log(`Legacy: ${leg.length} records`);

  const legNames = new Set();
  leg.forEach(r => {
    const n = r.fields[LEG_NAME];
    if (n) legNames.add(n.toLowerCase());
  });

  // Find parent-only items in Menu_Lab missing from Legacy
  const parentsToCreate = [];
  const childrenToCreate = [];

  ml.forEach(r => {
    const name = r.fields[ML_NAME];
    if (!name) return;
    if (legNames.has(name.toLowerCase())) return;

    const isChild = r.fields[ML_PARENT] && r.fields[ML_PARENT].length > 0;
    if (isChild) {
      childrenToCreate.push(name);
    } else {
      parentsToCreate.push(name);
    }
  });

  console.log(`\nParents to create in Legacy: ${parentsToCreate.length}`);
  console.log(`Children to create in Legacy: ${childrenToCreate.length}`);
  console.log(`Total: ${parentsToCreate.length + childrenToCreate.length}\n`);

  // Create parents first, then children
  const allToCreate = [...parentsToCreate, ...childrenToCreate];

  let created = 0;
  let failed = 0;

  for (let i = 0; i < allToCreate.length; i += 10) {
    const batch = allToCreate.slice(i, i + 10);
    const records = batch.map(name => ({ fields: { [LEG_NAME]: name } }));
    const batchNum = Math.floor(i / 10) + 1;
    const totalBatches = Math.ceil(allToCreate.length / 10);
    console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} items): ${batch.slice(0, 3).join(", ")}${batch.length > 3 ? "..." : ""}`);

    const result = await createBatch(records);
    if (result) {
      created += result.length;
    } else {
      failed += batch.length;
    }

    // Rate limit: 5 requests/sec for Airtable
    if (i + 10 < allToCreate.length) await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n=== DONE ===`);
  console.log(`Created in Legacy: ${created}`);
  console.log(`Failed: ${failed}`);
  console.log(`Legacy should now have: ${leg.length + created} records`);
}

run().catch(e => console.error(e));
