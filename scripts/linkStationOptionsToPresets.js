#!/usr/bin/env node
/**
 * Link Station Options to Station Presets via Airtable API.
 * Run: node scripts/linkStationOptionsToPresets.js
 * Uses .env: AIRTABLE_API_KEY, AIRTABLE_BASE_ID.
 * Requires schema write / record update permission.
 */
import "dotenv/config";

const baseId = process.env.AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID;
const apiKey = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
const presetsTable = process.env.VITE_AIRTABLE_STATION_PRESETS_TABLE || "tbl6HdKHF8f9OEadE";
const optionsTable = process.env.VITE_AIRTABLE_STATION_OPTIONS_TABLE || "tbloJSO6IEzY6Bd35";

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

/** Preset name (partial match) → option name patterns to link */
const PRESET_TO_OPTIONS = {
  "Viva La Pasta": ["Pick Your Pasta Shapes", "Pick Your Proteins"],
  "Pasta Flight": ["Pick Your Pasta Shapes", "Pick Your Proteins"],
  "Tex-Mex": ["Pick Your Proteins"],
  "Taco Station": ["Pick Your Proteins"],
  "Carving Station": ["Pick Your Proteins"],
  "Hi Bachi": ["Pick Your Proteins"],
  "Fisherman's Corner": ["Choose Your Seafood"],
  "Cravin' Asian": ["Potsticker Protein", "Lo Mein Protein"],
  "Make Your Own Ramen": ["Lo Mein Protein"],
  "Street Food": ["Pick Your Proteins"],
};

function presetMatches(presetName, key) {
  const n = (presetName || "").toLowerCase();
  const k = key.toLowerCase();
  return n.includes(k) || k.includes(n);
}

function optionMatches(optionName, pattern) {
  return (optionName || "").toLowerCase().includes(pattern.toLowerCase());
}

async function main() {
  console.log("\n=== Linking Station Options to Presets ===\n");

  const [presetsRes, optsRes] = await Promise.all([
    airFetch(`${base}/${presetsTable}?maxRecords=100`),
    airFetch(`${base}/${optionsTable}?maxRecords=100`),
  ]);

  if (presetsRes.error) {
    console.error("Presets error:", presetsRes.error);
    return;
  }
  if (optsRes.error) {
    console.error("Options error:", optsRes.error);
    return;
  }

  const presets = presetsRes.records || [];
  const options = optsRes.records || [];

  const optionByName = new Map();
  for (const r of options) {
    const name = r.fields?.["Option Name"] ?? r.fields?.Name ?? "";
    if (name && name !== "-") optionByName.set(name, r);
  }

  let linked = 0;
  for (const preset of presets) {
    const presetName = preset.fields?.["Station Type"] ?? preset.fields?.Name ?? preset.id;
    let optionIds = [];

    for (const [key, patterns] of Object.entries(PRESET_TO_OPTIONS)) {
      if (!presetMatches(presetName, key)) continue;
      for (const pattern of patterns) {
        for (const [optName, optRec] of optionByName) {
          if (optionMatches(optName, pattern) && !optionIds.includes(optRec.id)) {
            optionIds.push(optRec.id);
          }
        }
      }
    }

    if (optionIds.length === 0) continue;

    const patch = { fields: { "Station Options": optionIds } };
    const updated = await airFetch(`${base}/${presetsTable}/${preset.id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });

    if (updated.error) {
      console.error(`  ❌ ${presetName}:`, updated.error.message);
    } else {
      console.log(`  ✓ ${presetName} → ${optionIds.length} option(s)`);
      linked++;
    }
  }

  console.log(`\nDone. Linked ${linked} preset(s).\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
