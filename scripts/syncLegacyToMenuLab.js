const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const MENU_LAB = "tbl6gXRT2FPpTdf0J";
const LEGACY = "tbl0aN33DGG6R1sPZ";

const ML_NAME = "fldpbzDFSg9sYeexU";
const LEG_NAME = "fldW5gfSlHRTl01v1";
const LEG_PARENT = "fldBzB941q8TDeqm3";

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
  const url = `https://api.airtable.com/v0/${BASE}/${MENU_LAB}?typecast=true`;
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
  const ml = await fetchAll(MENU_LAB, [ML_NAME]);
  console.log(`Menu_Lab: ${ml.length} records`);

  console.log("Fetching Legacy...");
  const leg = await fetchAll(LEGACY, [LEG_NAME, LEG_PARENT]);
  console.log(`Legacy: ${leg.length} records`);

  const mlNames = new Set();
  ml.forEach(r => {
    const n = r.fields[ML_NAME];
    if (n) mlNames.add(n.toLowerCase());
  });

  const toCreate = [];
  leg.forEach(r => {
    const name = r.fields[LEG_NAME];
    if (!name) return;
    if (mlNames.has(name.toLowerCase())) return;
    toCreate.push(name);
  });

  console.log(`\nItems to create in Menu_Lab: ${toCreate.length}\n`);

  let created = 0;
  let failed = 0;

  for (let i = 0; i < toCreate.length; i += 10) {
    const batch = toCreate.slice(i, i + 10);
    const records = batch.map(name => ({ fields: { [ML_NAME]: name } }));
    const batchNum = Math.floor(i / 10) + 1;
    const totalBatches = Math.ceil(toCreate.length / 10);
    console.log(`Batch ${batchNum}/${totalBatches}: ${batch.slice(0, 3).join(", ")}${batch.length > 3 ? "..." : ""}`);

    const result = await createBatch(records);
    if (result) {
      created += result.length;
    } else {
      failed += batch.length;
    }

    if (i + 10 < toCreate.length) await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n=== DONE ===`);
  console.log(`Created in Menu_Lab: ${created}`);
  console.log(`Failed: ${failed}`);
}

run().catch(e => console.error(e));
