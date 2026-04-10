const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const ML = "tbl6gXRT2FPpTdf0J";

// Check items in the "Breakfast - Room Temp" menu section (what the Breakfast picker loads)
async function checkBreakfastItems() {
  const params = new URLSearchParams();
  params.set("filterByFormula", `FIND("Breakfast", ARRAYJOIN({Menu Section}&""))`);
  params.set("returnFieldsByFieldId", "true");
  params.set("pageSize", "100");
  params.append("fields[]", "fldpbzDFSg9sYeexU"); // Item Name
  params.append("fields[]", "fldnP7tCisqdDkaOI"); // Execution Type
  params.append("fields[]", "fld8Okh1qBnMeHwIN"); // Menu Section
  params.append("fields[]", "fldDDfLJTI6BK1zKd"); // Child Items
  params.append("fields[]", "fldLrxghm3bUg0bCx"); // Parent Item
  
  const url = `https://api.airtable.com/v0/${BASE}/${ML}?${params}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
  const data = await res.json();
  
  console.log(`Breakfast items in Menu_Lab: ${(data.records || []).length}\n`);
  for (const r of data.records || []) {
    const name = r.fields["fldpbzDFSg9sYeexU"] || "(no name)";
    const exec = r.fields["fldnP7tCisqdDkaOI"] || [];
    const menuSec = r.fields["fld8Okh1qBnMeHwIN"] || [];
    const children = r.fields["fldDDfLJTI6BK1zKd"] || [];
    const parent = r.fields["fldLrxghm3bUg0bCx"] || [];
    const isChild = parent.length > 0;
    console.log(`${isChild ? "  (child) " : ""}${name}`);
    console.log(`  id=${r.id} exec=${JSON.stringify(exec)} menuSec=${JSON.stringify(menuSec)} children=${children.length} parent=${parent.length}`);
  }
}

// Also check "Desserts" and "Breaks and Snacks" sections
async function checkSection(sectionName) {
  const params = new URLSearchParams();
  params.set("filterByFormula", `FIND("${sectionName}", ARRAYJOIN({Menu Section}&""))`);
  params.set("returnFieldsByFieldId", "true");
  params.set("pageSize", "100");
  params.append("fields[]", "fldpbzDFSg9sYeexU");
  params.append("fields[]", "fldnP7tCisqdDkaOI");
  params.append("fields[]", "fldLrxghm3bUg0bCx");
  
  const url = `https://api.airtable.com/v0/${BASE}/${ML}?${params}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
  const data = await res.json();
  
  console.log(`\n=== ${sectionName}: ${(data.records || []).length} items ===`);
  for (const r of data.records || []) {
    const name = r.fields["fldpbzDFSg9sYeexU"] || "(no name)";
    const exec = r.fields["fldnP7tCisqdDkaOI"] || [];
    const parent = r.fields["fldLrxghm3bUg0bCx"] || [];
    if (parent.length > 0) continue; // skip children
    console.log(`  ${name} → exec=${JSON.stringify(exec)}`);
  }
}

(async () => {
  await checkBreakfastItems();
  await checkSection("Breaks and Snacks");
  await checkSection("Ambient Displays");
})().catch(console.error);
