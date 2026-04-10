const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const SHADOW = "Event Menu (SHADOW SYSTEM)";

(async () => {
  const p = new URLSearchParams();
  p.set("filterByFormula", '{Section}="Passed Appetizers"');
  p.set("pageSize", "20");
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(SHADOW)}?${p}`, {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  const d = await r.json();
  console.log("Total passed app shadow rows:", (d.records || []).length);
  for (const rec of d.records || []) {
    const f = rec.fields;
    const cat = f["Catalog Item"];
    const cid = Array.isArray(cat) ? cat[0] : cat;
    const catalogId = typeof cid === "string" ? cid : (cid && cid.id ? cid.id : cid);
    const sec = f["Section"] || "";
    const co = f["Child Overrides"] || "";
    const ev = f["Event"];
    const evId = Array.isArray(ev) ? ev[0] : ev;
    console.log(`  ${rec.id}: event=${typeof evId === "string" ? evId : (evId?.id||evId)}, catalog=${catalogId}, section=${sec}, childOverrides=${co ? co.substring(0, 120) : "(none)"}`);
  }

  // Also check Presented and Buffet
  for (const sec of ["Presented Appetizers", "Buffet Metal", "Buffet China"]) {
    const p2 = new URLSearchParams();
    p2.set("filterByFormula", `{Section}="${sec}"`);
    p2.set("pageSize", "10");
    const r2 = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(SHADOW)}?${p2}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    const d2 = await r2.json();
    console.log(`\n${sec} shadow rows: ${(d2.records || []).length}`);
    for (const rec of d2.records || []) {
      const f = rec.fields;
      const cat = f["Catalog Item"];
      const cid = Array.isArray(cat) ? cat[0] : cat;
      const catalogId = typeof cid === "string" ? cid : (cid && cid.id ? cid.id : cid);
      const co = f["Child Overrides"] || "";
      console.log(`  ${rec.id}: catalog=${catalogId}, childOverrides=${co ? co.substring(0, 120) : "(none)"}`);
    }
  }
})().catch(console.error);
