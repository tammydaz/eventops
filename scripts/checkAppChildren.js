const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const LEGACY = "tbl0aN33DGG6R1sPZ";

const items = [
  "Ahi Tuna Tartare on Wontons",
  "Beef Empanadas",
  "Chicken Satay Skewers",
  "Brie & Raspberry Purse",
  "Parmesan Crusted Chicken",
  "Caprese Skewers",
  "Mini Crab Cakes",
  "Bruschetta Trio",
  "Stuffed Mushrooms",
];

(async () => {
  for (const name of items) {
    const p = new URLSearchParams();
    p.set("filterByFormula", `{Item Name}="${name}"`);
    p.set("returnFieldsByFieldId", "true");
    p.append("fields[]", "fldW5gfSlHRTl01v1");
    p.append("fields[]", "fldIu6qmlUwAEn2W9");
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${LEGACY}?${p}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    const d = await r.json();
    const recs = d.records || [];
    if (recs.length === 0) {
      console.log(`${name}: NOT FOUND`);
      continue;
    }
    for (const rec of recs) {
      const children = rec.fields["fldIu6qmlUwAEn2W9"] || [];
      console.log(`${name} (${rec.id}): ${children.length} children`);
      if (children.length > 0) {
        for (const cid of children) {
          const cp = new URLSearchParams();
          cp.set("filterByFormula", `RECORD_ID()='${cid}'`);
          cp.set("returnFieldsByFieldId", "true");
          cp.append("fields[]", "fldW5gfSlHRTl01v1");
          const cr = await fetch(`https://api.airtable.com/v0/${BASE}/${LEGACY}?${cp}`, {
            headers: { Authorization: `Bearer ${API_KEY}` }
          });
          const cd = await cr.json();
          const crec = (cd.records || [])[0];
          console.log(`  -> ${cid}: ${crec ? crec.fields["fldW5gfSlHRTl01v1"] : "DELETED/MISSING"}`);
        }
      }
    }
  }
})().catch(console.error);
