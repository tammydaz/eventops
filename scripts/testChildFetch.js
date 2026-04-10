const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const LEG = "tbl0aN33DGG6R1sPZ";
const ML = "tbl6gXRT2FPpTdf0J";

// Nicholas Continental legacy ID
const NC_LEGACY = "recul6IJZ4aA5eWKa";

async function fetchRecord(table, recordId, fields) {
  const params = new URLSearchParams();
  params.set("filterByFormula", `RECORD_ID()='${recordId}'`);
  params.set("maxRecords", "1");
  params.set("returnFieldsByFieldId", "true");
  for (const f of fields) params.append("fields[]", f);
  const url = `https://api.airtable.com/v0/${BASE}/${table}?${params}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
  const data = await res.json();
  return data.records?.[0] || null;
}

(async () => {
  // Step 1: Try Menu_Lab (should NOT find NC_LEGACY since it's a legacy ID)
  console.log("=== Step 1: Try Menu_Lab with legacy ID ===");
  const mlRec = await fetchRecord(ML, NC_LEGACY, ["fldDDfLJTI6BK1zKd", "fldpbzDFSg9sYeexU"]);
  console.log("Menu_Lab result:", mlRec ? `Found (id=${mlRec.id})` : "NOT FOUND");
  
  // Step 2: Try Legacy (should find it)
  console.log("\n=== Step 2: Try Legacy with legacy ID ===");
  const legRec = await fetchRecord(LEG, NC_LEGACY, ["fldIu6qmlUwAEn2W9", "fldW5gfSlHRTl01v1"]);
  console.log("Legacy result:", legRec ? `Found (id=${legRec.id})` : "NOT FOUND");
  if (legRec) {
    const childField = legRec.fields["fldIu6qmlUwAEn2W9"];
    console.log("Child Items field raw:", JSON.stringify(childField));
    console.log("Type:", typeof childField, Array.isArray(childField) ? "is array" : "not array");
    if (Array.isArray(childField)) {
      console.log("Number of children:", childField.length);
      childField.forEach((c, i) => {
        console.log(`  [${i}] type=${typeof c}, value=${JSON.stringify(c)}`);
      });
    }
  }
  
  // Step 3: If children are record IDs, fetch their names from legacy
  if (legRec) {
    const childField = legRec.fields["fldIu6qmlUwAEn2W9"];
    if (Array.isArray(childField)) {
      const childIds = childField.filter(c => typeof c === "string" && c.startsWith("rec"));
      console.log(`\n=== Step 3: Fetch child names (${childIds.length} IDs) ===`);
      
      // Try Menu_Lab first (mimics the app behavior)
      console.log("Trying Menu_Lab for child names...");
      for (let i = 0; i < childIds.length; i += 10) {
        const chunk = childIds.slice(i, i + 10);
        const formula = `OR(${chunk.map(id => `RECORD_ID()='${id}'`).join(",")})`;
        const params = new URLSearchParams();
        params.set("filterByFormula", formula);
        params.set("returnFieldsByFieldId", "true");
        params.append("fields[]", "fldpbzDFSg9sYeexU");
        const url = `https://api.airtable.com/v0/${BASE}/${ML}?${params}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
        const data = await res.json();
        console.log(`  Menu_Lab found: ${(data.records || []).length} of ${chunk.length}`);
        for (const r of data.records || []) {
          console.log(`    ${r.id} = ${r.fields["fldpbzDFSg9sYeexU"]}`);
        }
      }
      
      // Try Legacy fallback
      console.log("Trying Legacy fallback for child names...");
      for (let i = 0; i < childIds.length; i += 10) {
        const chunk = childIds.slice(i, i + 10);
        const formula = `OR(${chunk.map(id => `RECORD_ID()='${id}'`).join(",")})`;
        const params = new URLSearchParams();
        params.set("filterByFormula", formula);
        params.set("returnFieldsByFieldId", "true");
        params.append("fields[]", "fldW5gfSlHRTl01v1");
        const url = `https://api.airtable.com/v0/${BASE}/${LEG}?${params}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
        const data = await res.json();
        console.log(`  Legacy found: ${(data.records || []).length} of ${chunk.length}`);
        for (const r of data.records || []) {
          console.log(`    ${r.id} = ${r.fields["fldW5gfSlHRTl01v1"]}`);
        }
      }
    }
  }
})().catch(console.error);
