const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const ML = "tbl6gXRT2FPpTdf0J";
const LEG = "tbl0aN33DGG6R1sPZ";

async function count(table) {
  let total = 0, offset = null;
  do {
    let url = `https://api.airtable.com/v0/${BASE}/${table}?pageSize=100`;
    if (offset) url += `&offset=${offset}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
    const data = await res.json();
    total += (data.records || []).length;
    offset = data.offset;
  } while (offset);
  return total;
}

async function checkItem(name) {
  const escaped = name.replace(/"/g, '\\"');
  
  // Legacy
  const legParams = new URLSearchParams();
  legParams.set("filterByFormula", `{Item Name}="${escaped}"`);
  legParams.set("returnFieldsByFieldId", "true");
  legParams.append("fields[]", "fldW5gfSlHRTl01v1");
  legParams.append("fields[]", "fldIu6qmlUwAEn2W9");
  const legRes = await fetch(`https://api.airtable.com/v0/${BASE}/${LEG}?${legParams}`, { headers: { Authorization: `Bearer ${API_KEY}` } });
  const legData = await legRes.json();
  console.log(`Legacy "${name}": ${(legData.records || []).length} records`);
  for (const r of legData.records || []) {
    const children = r.fields["fldIu6qmlUwAEn2W9"] || [];
    console.log(`  id=${r.id}, children=${JSON.stringify(children)}`);
  }

  // Menu_Lab
  const mlParams = new URLSearchParams();
  mlParams.set("filterByFormula", `{Item Name}="${escaped}"`);
  mlParams.set("returnFieldsByFieldId", "true");
  mlParams.append("fields[]", "fldpbzDFSg9sYeexU");
  mlParams.append("fields[]", "fldDDfLJTI6BK1zKd");
  mlParams.append("fields[]", "fld8Okh1qBnMeHwIN");
  mlParams.append("fields[]", "fldnP7tCisqdDkaOI");
  const mlRes = await fetch(`https://api.airtable.com/v0/${BASE}/${ML}?${mlParams}`, { headers: { Authorization: `Bearer ${API_KEY}` } });
  const mlData = await mlRes.json();
  console.log(`Menu_Lab "${name}": ${(mlData.records || []).length} records`);
  for (const r of mlData.records || []) {
    const children = r.fields["fldDDfLJTI6BK1zKd"] || [];
    const menuSec = r.fields["fld8Okh1qBnMeHwIN"] || [];
    const execType = r.fields["fldnP7tCisqdDkaOI"] || [];
    console.log(`  id=${r.id}, children=${JSON.stringify(children)}, menuSection=${JSON.stringify(menuSec)}, execType=${JSON.stringify(execType)}`);
  }
}

async function checkShadowRows(eventId) {
  const SHADOW = "Event Menu (SHADOW SYSTEM)";
  const params = new URLSearchParams();
  params.set("filterByFormula", `OR({Event}='${eventId}', FIND('${eventId}', ARRAYJOIN({Event})) > 0)`);
  params.set("pageSize", "100");
  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(SHADOW)}?${params}`, { headers: { Authorization: `Bearer ${API_KEY}` } });
  const data = await res.json();
  console.log(`Shadow rows for ${eventId}: ${(data.records || []).length}`);
  for (const r of data.records || []) {
    const f = r.fields || {};
    const catalogItem = f["Catalog Item"];
    const section = f["Section"];
    const childOverrides = f["Child Overrides"];
    console.log(`  id=${r.id}, section=${section}, catalogItem=${JSON.stringify(catalogItem)}, childOverrides=${childOverrides ? "yes" : "no"}`);
  }
}

(async () => {
  console.log("=== Table counts ===");
  console.log("Menu_Lab:", await count(ML));
  console.log("Legacy:", await count(LEG));
  console.log("");

  await checkItem("Nicholas Continental");
  console.log("");
  await checkItem("Parmesan Crusted Chicken");
  console.log("");
  
  // Check a sample child item
  await checkItem("Assorted Morning Pastries");
  console.log("");
  await checkItem("Seasonal Fruit Platter");
})().catch(console.error);
