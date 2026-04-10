const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";

(async () => {
  const p = new URLSearchParams();
  p.set("filterByFormula", '{Section}="Passed Appetizers"');
  p.set("pageSize", "20");
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent("Event Menu (SHADOW SYSTEM)")}?${p}`, {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  const d = await r.json();
  
  const eventIds = new Set();
  for (const rec of d.records || []) {
    const ev = rec.fields["Event"];
    const eid = Array.isArray(ev) ? ev[0] : ev;
    if (eid) eventIds.add(typeof eid === "string" ? eid : (eid.id || eid));
  }
  
  console.log("Events with Passed Appetizer shadow rows:");
  for (const eid of eventIds) {
    const ep = new URLSearchParams();
    ep.set("filterByFormula", `RECORD_ID()="${eid}"`);
    ep.append("fields[]", "Event Name");
    ep.append("fields[]", "Event Type");
    const er = await fetch(`https://api.airtable.com/v0/${BASE}/tblYfaWh67Ag4ydXq?${ep}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    const ed = await er.json();
    const erec = (ed.records || [])[0];
    if (erec) console.log(`  ${eid}: ${JSON.stringify(erec.fields)}`);
    else console.log(`  ${eid}: NOT FOUND in Events`);
  }
})().catch(console.error);
