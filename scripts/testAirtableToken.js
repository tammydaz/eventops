/**
 * Quick test: does your Airtable token work?
 * Run: node scripts/testAirtableToken.js
 */
import "dotenv/config";

const apiKey = process.env.VITE_AIRTABLE_API_KEY?.trim();
const baseId = process.env.VITE_AIRTABLE_BASE_ID?.trim();

if (!apiKey || !baseId) {
  console.error("Missing VITE_AIRTABLE_API_KEY or VITE_AIRTABLE_BASE_ID in .env");
  process.exit(1);
}

console.log("Testing token against base:", baseId);
console.log("Token starts with:", apiKey.slice(0, 12) + "...\n");

// Test 1: Meta API (schema - what Quick Intake uses for Event Type dropdown)
const metaUrl = `https://api.airtable.com/v0/meta/bases/${baseId}`;
const metaRes = await fetch(metaUrl, {
  headers: { Authorization: `Bearer ${apiKey}` },
});
const metaBody = await metaRes.text();
let metaJson;
try {
  metaJson = JSON.parse(metaBody);
} catch {
  metaJson = metaBody;
}

console.log("--- Meta API (schema) ---");
console.log("Status:", metaRes.status);
console.log("Response:", JSON.stringify(metaJson, null, 2));

if (!metaRes.ok) {
  console.error("\n❌ Meta API failed. This is what Quick Intake uses for Event Type dropdown.");
} else {
  console.log("\n✅ Meta API OK");
  console.log("Tables:", metaJson.tables?.map((t) => t.name)?.join(", ") || "none");
}

// Test 2: Records API (list records)
const tableId = process.env.VITE_AIRTABLE_EVENTS_TABLE?.trim() || "Events";
const recordsUrl = `https://api.airtable.com/v0/${baseId}/${tableId}?maxRecords=1`;
const recordsRes = await fetch(recordsUrl, {
  headers: { Authorization: `Bearer ${apiKey}` },
});
const recordsBody = await recordsRes.text();
let recordsJson;
try {
  recordsJson = JSON.parse(recordsBody);
} catch {
  recordsJson = recordsBody;
}

console.log("\n--- Records API (list) ---");
console.log("Status:", recordsRes.status);
if (!recordsRes.ok) {
  console.log("Response:", recordsJson);
} else {
  console.log("✅ Records API OK");
}
