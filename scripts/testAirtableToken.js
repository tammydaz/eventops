/**
 * Airtable API connectivity & permissions test.
 * Run: node scripts/testAirtableToken.js
 *
 * Tests: Meta API, Events, Stations, Menu Items.
 * 403 = API key lacks permission. See README for required scopes.
 */
import "dotenv/config";

const apiKey = process.env.VITE_AIRTABLE_API_KEY?.trim();
const baseId = process.env.VITE_AIRTABLE_BASE_ID?.trim();

if (!apiKey || !baseId) {
  console.error("Missing VITE_AIRTABLE_API_KEY or VITE_AIRTABLE_BASE_ID in .env");
  process.exit(1);
}

console.log("Testing Airtable token against base:", baseId);
console.log("Token starts with:", apiKey.slice(0, 12) + "...\n");

async function test(name, url) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  let body;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }
  const ok = res.ok;
  if (res.status === 403) {
    console.log(`❌ ${name}: 403 Forbidden — API key needs access. Check scopes: data.records:read, schema.bases:read`);
  } else if (!ok) {
    console.log(`❌ ${name}: ${res.status}`, typeof body === "string" ? body.slice(0, 200) : JSON.stringify(body).slice(0, 200));
  } else {
    console.log(`✅ ${name}: OK`);
  }
  return { ok: res.ok, status: res.status };
}

// 1. Meta API (schema - dropdowns, field resolution)
const metaUrl = `https://api.airtable.com/v0/meta/bases/${baseId}`;
console.log("--- Meta API (schema) ---");
await test("Meta API", metaUrl);

// 2. Events table
const eventsTable = process.env.VITE_AIRTABLE_EVENTS_TABLE?.trim() || "tblYfaWh67Ag4ydXq";
console.log("\n--- Events table ---");
await test("Events", `https://api.airtable.com/v0/${baseId}/${eventsTable}?maxRecords=1`);

// 3. Stations table (Creation Station picker)
const stationsTable = process.env.VITE_AIRTABLE_STATIONS_TABLE?.trim() || "tblhFwUfREbpfFXhv";
console.log("\n--- Stations table ---");
await test("Stations", `https://api.airtable.com/v0/${baseId}/${stationsTable}?maxRecords=1`);

// 4. Menu Items table (station item picker)
const menuTable = process.env.VITE_AIRTABLE_MENU_ITEMS_TABLE?.trim() || "tbl0aN33DGG6R1sPZ";
console.log("\n--- Menu Items table ---");
await test("Menu Items", `https://api.airtable.com/v0/${baseId}/${menuTable}?maxRecords=1`);

// 5. Station Presets (optional)
const presetsTable = process.env.VITE_AIRTABLE_STATION_PRESETS_TABLE?.trim();
if (presetsTable) {
  console.log("\n--- Station Presets table ---");
  await test("Station Presets", `https://api.airtable.com/v0/${baseId}/${presetsTable}?maxRecords=1`);
} else {
  console.log("\n--- Station Presets ---");
  console.log("⏭️  Skipped (VITE_AIRTABLE_STATION_PRESETS_TABLE not set)");
}

console.log("\n--- Done ---");
console.log("If you see 403: In Airtable → Developer Hub → create token with scopes: data.records:read, data.records:write, schema.bases:read");
console.log("Ensure the token has access to this base.");
