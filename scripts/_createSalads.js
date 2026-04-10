import "dotenv/config";
const baseId = process.env.AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID;
const apiKey = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
const table = "tbl0aN33DGG6R1sPZ";
const base = `https://api.airtable.com/v0/${baseId}`;

async function air(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...opts.headers } });
  return res.json();
}

// Check existing salads
const existing = await air(`${base}/${table}?filterByFormula=${encodeURIComponent('{Category}="Salad"')}&fields[]=Item Name`);
const existingNames = new Set((existing.records || []).map(r => r.fields?.["Item Name"]?.toLowerCase().trim()));
console.log("Existing salads:", [...existingNames]);

const salads = [
  "Arugula & Fennel Salad",
  "Foodwerx Funky Salad",
  "Caesar Salad",
  "Greek Goddess Salad",
  "Caprese Salad",
  "Kale Caesar Salad",
  "Classic Green Salad",
];

const toCreate = salads.filter(n => !existingNames.has(n.toLowerCase().trim()));
console.log("Creating:", toCreate);

if (toCreate.length === 0) { console.log("Nothing to create."); process.exit(0); }

const res = await air(`${base}/${table}`, {
  method: "POST",
  body: JSON.stringify({ records: toCreate.map(n => ({ fields: { "Item Name": n, "Category": "Salad" } })) }),
});

if (res.error) { console.error("Error:", res.error); process.exit(1); }
for (const rec of res.records || []) {
  console.log("✓ Created:", rec.fields?.["Item Name"], "("+rec.id+")");
}
