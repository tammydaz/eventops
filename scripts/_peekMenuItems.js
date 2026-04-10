import "dotenv/config";
const baseId = process.env.AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID;
const apiKey = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
const table = "tbl0aN33DGG6R1sPZ";
// Fetch one existing Salad record to see actual field names
const url = `https://api.airtable.com/v0/${baseId}/${table}?filterByFormula=${encodeURIComponent('{Category}="Salad"')}&maxRecords=1`;
const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
const data = await res.json();
if (data.error) { console.error(data.error); process.exit(1); }
const rec = data.records?.[0];
if (rec) {
  console.log("Record ID:", rec.id);
  console.log("Fields:", JSON.stringify(rec.fields, null, 2));
}
