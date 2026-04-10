const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const ML = "tbl6gXRT2FPpTdf0J";

const items = [
  "Ahi Tuna Tartare on Wontons",
  "Beef Empanadas",
  "Chicken Satay Skewers",
  "Brie & Raspberry Purse",
  "Parmesan Crusted Chicken",
  "Mini Crab Cakes",
];

(async () => {
  for (const name of items) {
    const p = new URLSearchParams();
    p.set("filterByFormula", `{Item Name}="${name}"`);
    p.set("returnFieldsByFieldId", "true");
    p.append("fields[]", "fldpbzDFSg9sYeexU");
    p.append("fields[]", "fldDDfLJTI6BK1zKd");
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${ML}?${p}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    const d = await r.json();
    const recs = d.records || [];
    if (recs.length === 0) {
      console.log(`${name}: NOT FOUND in Menu_Lab`);
      continue;
    }
    for (const rec of recs) {
      const children = rec.fields["fldDDfLJTI6BK1zKd"] || [];
      console.log(`${name} (${rec.id}): ${children.length} children in Menu_Lab -> ${JSON.stringify(children)}`);
    }
  }
})().catch(console.error);
