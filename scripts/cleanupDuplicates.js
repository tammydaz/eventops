const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const ML = "tbl6gXRT2FPpTdf0J";
const LEG = "tbl0aN33DGG6R1sPZ";
const ML_NAME = "fldpbzDFSg9sYeexU";
const ML_CHILDREN = "fldDDfLJTI6BK1zKd";
const ML_PARENT = "fldLrxghm3bUg0bCx";
const LEG_NAME = "fldW5gfSlHRTl01v1";
const LEG_CHILDREN = "fldIu6qmlUwAEn2W9";
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

async function deleteBatch(table, ids) {
  let url = `https://api.airtable.com/v0/${BASE}/${table}?`;
  ids.forEach((id, i) => { url += `${i > 0 ? "&" : ""}records[]=${id}`; });
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  const data = await res.json();
  if (data.error) { console.error("DELETE Error:", JSON.stringify(data.error)); return false; }
  return true;
}

function pickDuplicatesToDelete(records, nameField, childrenField, parentField) {
  const byName = {};
  records.forEach(r => {
    const n = (r.fields[nameField] || "").toLowerCase();
    if (!n || n === "undefined") return;
    if (!byName[n]) byName[n] = [];
    byName[n].push(r);
  });

  const toDelete = [];
  for (const [name, recs] of Object.entries(byName)) {
    if (recs.length <= 1) continue;

    // Sort: keep the one with children first, then the one with a parent link, then oldest (lowest recId)
    recs.sort((a, b) => {
      const aChildren = (a.fields[childrenField] || []).length;
      const bChildren = (b.fields[childrenField] || []).length;
      if (bChildren !== aChildren) return bChildren - aChildren;
      const aParent = parentField ? (a.fields[parentField] || []).length : 0;
      const bParent = parentField ? (b.fields[parentField] || []).length : 0;
      if (bParent !== aParent) return bParent - aParent;
      return a.id.localeCompare(b.id);
    });

    // Keep first (best), delete rest
    for (let i = 1; i < recs.length; i++) {
      toDelete.push({ id: recs[i].id, name: recs[i].fields[nameField], reason: `dup of ${recs[0].id}` });
    }
  }
  return toDelete;
}

async function run() {
  console.log("Fetching Menu_Lab...");
  const ml = await fetchAll(ML, [ML_NAME, ML_CHILDREN, ML_PARENT]);
  console.log(`Menu_Lab: ${ml.length} records`);

  console.log("Fetching Legacy...");
  const leg = await fetchAll(LEG, [LEG_NAME, LEG_CHILDREN, LEG_PARENT]);
  console.log(`Legacy: ${leg.length} records\n`);

  // 1. Delete "undefined" records from Legacy
  const undefinedLeg = leg.filter(r => !r.fields[LEG_NAME] || r.fields[LEG_NAME] === "undefined");
  console.log(`=== UNDEFINED RECORDS IN LEGACY: ${undefinedLeg.length} ===`);

  // 2. Find duplicates to delete in Menu_Lab
  const mlDupsToDelete = pickDuplicatesToDelete(ml, ML_NAME, ML_CHILDREN, ML_PARENT);
  console.log(`=== MENU_LAB DUPLICATES TO DELETE: ${mlDupsToDelete.length} ===`);
  mlDupsToDelete.slice(0, 10).forEach(d => console.log(`  ${d.name} (${d.id})`));
  if (mlDupsToDelete.length > 10) console.log(`  ... and ${mlDupsToDelete.length - 10} more`);

  // 3. Find duplicates to delete in Legacy
  const legDupsToDelete = pickDuplicatesToDelete(leg, LEG_NAME, LEG_CHILDREN, LEG_PARENT);
  console.log(`\n=== LEGACY DUPLICATES TO DELETE: ${legDupsToDelete.length} ===`);
  legDupsToDelete.slice(0, 10).forEach(d => console.log(`  ${d.name} (${d.id})`));
  if (legDupsToDelete.length > 10) console.log(`  ... and ${legDupsToDelete.length - 10} more`);

  // Delete undefined from Legacy
  console.log(`\n--- Deleting ${undefinedLeg.length} undefined from Legacy ---`);
  for (let i = 0; i < undefinedLeg.length; i += 10) {
    const batch = undefinedLeg.slice(i, i + 10).map(r => r.id);
    const ok = await deleteBatch(LEG, batch);
    process.stdout.write(ok ? "." : "X");
    await new Promise(r => setTimeout(r, 250));
  }
  console.log(" done");

  // Delete duplicates from Menu_Lab
  console.log(`--- Deleting ${mlDupsToDelete.length} duplicates from Menu_Lab ---`);
  for (let i = 0; i < mlDupsToDelete.length; i += 10) {
    const batch = mlDupsToDelete.slice(i, i + 10).map(r => r.id);
    const ok = await deleteBatch(ML, batch);
    process.stdout.write(ok ? "." : "X");
    await new Promise(r => setTimeout(r, 250));
  }
  console.log(" done");

  // Delete duplicates from Legacy
  console.log(`--- Deleting ${legDupsToDelete.length} duplicates from Legacy ---`);
  for (let i = 0; i < legDupsToDelete.length; i += 10) {
    const batch = legDupsToDelete.slice(i, i + 10).map(r => r.id);
    const ok = await deleteBatch(LEG, batch);
    process.stdout.write(ok ? "." : "X");
    await new Promise(r => setTimeout(r, 250));
  }
  console.log(" done");

  console.log(`\n=== CLEANUP COMPLETE ===`);
  console.log(`Deleted undefined: ${undefinedLeg.length}`);
  console.log(`Deleted Menu_Lab dups: ${mlDupsToDelete.length}`);
  console.log(`Deleted Legacy dups: ${legDupsToDelete.length}`);
  console.log(`Total removed: ${undefinedLeg.length + mlDupsToDelete.length + legDupsToDelete.length}`);
}

run().catch(e => console.error(e));
