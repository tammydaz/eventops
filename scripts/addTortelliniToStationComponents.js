#!/usr/bin/env node
/**
 * Add Tortellini to Station Components table (Component Type: Starch).
 * Run: node scripts/addTortelliniToStationComponents.js
 * Uses .env: AIRTABLE_API_KEY, AIRTABLE_BASE_ID.
 */
import "dotenv/config";

const baseId = process.env.AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID;
const apiKey = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
const componentsTable = process.env.VITE_AIRTABLE_STATION_COMPONENTS_TABLE || "tblQuBGWfASBz5zfe";
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
  console.log("\n=== Add Tortellini to Station Components ===\n");

  const listRes = await airFetch(
    `${base}/${componentsTable}?filterByFormula=${encodeURIComponent('{Component Name}="Tortellini"')}`
  );
  if (listRes.error) {
    console.error("Error listing components:", listRes.error);
    process.exit(1);
  }
  if (listRes.records?.length > 0) {
    console.log("Tortellini already exists:", listRes.records[0].id);
    return;
  }

  const createRes = await airFetch(`${base}/${componentsTable}`, {
    method: "POST",
    body: JSON.stringify({
      records: [
        {
          fields: {
            "Component Name": "Tortellini",
            "Component Type": "Starch",
          },
        },
      ],
    }),
  });

  if (createRes.error) {
    console.error("Error creating Tortellini:", createRes.error);
    if (createRes.error.message?.includes("Unknown field")) {
      console.log("\nTip: Your table may use different field names. Check Component Name / Component Type.");
    }
    process.exit(1);
  }

  const newId = createRes.records?.[0]?.id;
  console.log("Created Tortellini:", newId);

  const presetRes = await airFetch(
    `${base}/${presetsTable}?filterByFormula=${encodeURIComponent('OR(FIND("Viva", {Preset Name}), FIND("Pasta", {Preset Name}))')}`
  );
  if (!presetRes.error && presetRes.records?.length > 0) {
    const preset = presetRes.records[0];
    const defaultComps = preset.fields?.["Default Components"] || preset.fields?.["Components"] || preset.fields?.["Station Components"];
    const existingIds = Array.isArray(defaultComps) ? defaultComps : defaultComps ? [defaultComps] : [];
    const fieldName = preset.fields?.["Default Components"] !== undefined ? "Default Components" : preset.fields?.["Components"] !== undefined ? "Components" : "Station Components";
    if (fieldName && !existingIds.some((r) => (typeof r === "string" ? r : r?.id) === newId)) {
      const updatedIds = [...existingIds.map((r) => (typeof r === "string" ? r : r?.id)).filter(Boolean), newId];
      const patchRes = await airFetch(`${base}/${presetsTable}/${preset.id}`, {
        method: "PATCH",
        body: JSON.stringify({ fields: { [fieldName]: updatedIds } }),
      });
      if (patchRes.error) {
        console.log("Created Tortellini. Link it to Viva La Pasta preset manually in Airtable.");
      } else {
        console.log("Linked Tortellini to Viva La Pasta preset.");
      }
    }
  } else {
    console.log("Link Tortellini to your Viva La Pasta preset in Airtable (Default Components or Station Preset).");
  }

  console.log("\nDone. Tortellini is now in the pasta choices. Auto-Fill will use Penne + Tortellini.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
