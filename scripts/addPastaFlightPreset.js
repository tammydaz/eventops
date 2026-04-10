#!/usr/bin/env node
/**
 * Add "Pasta Flight Presentation" to Station Presets table in Airtable.
 * Skips creation if it already exists.
 * Run: node scripts/addPastaFlightPreset.js
 */
import "dotenv/config";

const baseId = process.env.AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID;
const apiKey = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
const presetsTable = process.env.VITE_AIRTABLE_STATION_PRESETS_TABLE || "tbl6HdKHF8f9OEadE";

if (!apiKey || !baseId) {
  console.error("Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID in .env");
  process.exit(1);
}

const base = `https://api.airtable.com/v0/${baseId}`;

async function airFetch(url, opts = {}) {
  const res = await globalThis.fetch(url, {
    ...opts,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...opts.headers },
  });
  return res.json();
}

async function main() {
  console.log("\n=== Add Pasta Flight Presentation to Station Presets ===\n");

  // 1. Inspect table schema to find the name field
  const metaRes = await airFetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`);
  const tables = metaRes.tables || [];
  const presetsTableMeta = tables.find((t) => t.id === presetsTable || t.name === "Station Presets");
  if (!presetsTableMeta) {
    console.error("Could not find Station Presets table in schema. Check VITE_AIRTABLE_STATION_PRESETS_TABLE.");
    process.exit(1);
  }

  const fields = presetsTableMeta.fields || [];
  const nameField =
    fields.find((f) => f.name === "Preset Name")?.name ||
    fields.find((f) => f.name === "Name")?.name ||
    fields.find((f) => f.name === "Station Type")?.name;

  if (!nameField) {
    console.error("Could not find a name field in Station Presets. Fields:", fields.map((f) => f.name).join(", "));
    process.exit(1);
  }
  console.log(`Using name field: "${nameField}"`);

  // 2. Check if the preset already exists
  const checkRes = await airFetch(
    `${base}/${presetsTable}?filterByFormula=${encodeURIComponent(`{${nameField}}="Pasta Flight Presentation"`)}`
  );
  if (checkRes.error) {
    console.error("Error checking for existing preset:", JSON.stringify(checkRes.error));
    process.exit(1);
  }
  if (checkRes.records?.length > 0) {
    console.log(`"Pasta Flight Presentation" already exists (${checkRes.records[0].id}). Nothing to do.`);
    return;
  }

  // 3. Create the preset record
  const createRes = await airFetch(`${base}/${presetsTable}`, {
    method: "POST",
    body: JSON.stringify({
      records: [
        {
          fields: {
            [nameField]: "Pasta Flight Presentation",
          },
        },
      ],
    }),
  });

  if (createRes.error) {
    console.error("Error creating preset:", JSON.stringify(createRes.error));
    process.exit(1);
  }

  const newId = createRes.records?.[0]?.id;
  console.log(`\n✓ Created "Pasta Flight Presentation" preset: ${newId}`);
  console.log("\nItems (auto-filled by the app on new station creation):");
  console.log("  • Penne a la Vodka with Red Pepper Jam");
  console.log("  • Bruschetta Pasta Primavera with Lots of Veggies");
  console.log("  • Bowties with Grilled Chicken, Basil Pesto, Yellow Peppers & Sun Dried Tomatoes");
  console.log("  Included: Parmesan garlic bread");
  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
