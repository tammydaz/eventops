import "dotenv/config";
const baseId = process.env.VITE_AIRTABLE_BASE_ID;
const apiKey = process.env.VITE_AIRTABLE_API_KEY;
const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, { headers: { Authorization: `Bearer ${apiKey}` } });
const data = await res.json();
const t = data.tables?.find(t => t.id === "tbl0aN33DGG6R1sPZ");
if (t) t.fields.forEach(f => console.log(f.name, "-", f.type));
