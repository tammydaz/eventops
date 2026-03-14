#!/usr/bin/env node
/**
 * Check Station Options and Components for a preset (e.g. Viva La Pasta).
 * Run: node scripts/checkStationOptions.js
 * Uses .env for AIRTABLE_API_KEY, AIRTABLE_BASE_ID.
 */
import "dotenv/config";

const baseId = process.env.AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID;
const apiKey = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
const presetsTable = process.env.VITE_AIRTABLE_STATION_PRESETS_TABLE || "tbl6HdKHF8f9OEadE";
const optionsTable = process.env.VITE_AIRTABLE_STATION_OPTIONS_TABLE || "tbloJSO6IEzY6Bd35";
const componentsTable = process.env.VITE_AIRTABLE_STATION_COMPONENTS_TABLE || "tblQuBGWfASBz5zfe";

if (!apiKey || !baseId) {
  console.error("Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID in .env");
  process.exit(1);
}

const base = `https://api.airtable.com/v0/${baseId}`;

async function airFetch(url) {
  const res = await globalThis.fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  return res.json();
}

async function main() {
  console.log("\n=== Station Presets ===\n");
  const presetsRes = await airFetch(`${base}/${presetsTable}?maxRecords=50`);
  if (presetsRes.error) {
    console.error("Error:", presetsRes.error);
    return;
  }
  const presets = presetsRes.records || [];
  for (const r of presets) {
    const name = r.fields?.["Station Type"] ?? r.fields?.Name ?? r.id;
    const availOpts = r.fields?.["Available Options"] ?? r.fields?.["Station Options"];
    const optCount = Array.isArray(availOpts) ? availOpts.length : 0;
    console.log(`  ${name} | Available Options linked: ${optCount}`);
  }
  const viva = presets.find((r) => (r.fields?.["Station Type"] ?? "").toLowerCase().includes("pasta"));
  if (viva) console.log("\n  ^ Viva La Pasta (or similar) found");

  console.log("\n=== Station Options (first 15) ===\n");
  const optsRes = await airFetch(`${base}/${optionsTable}?maxRecords=15`);
  if (optsRes.error) {
    console.error("Error:", optsRes.error);
    return;
  }
  const opts = optsRes.records || [];
  if (opts.length === 0) {
    console.log("  No options found.");
  } else {
    for (const r of opts) {
      const f = r.fields || {};
      const name = f["Option Name"] ?? f.Name ?? "-";
      const compType = f["Component Type (applies to)"] ?? f["Component Type"] ?? "-";
      const num = f["Number of Selections Allowed"] ?? "-";
      const presetLink = f["Station Preset"] ?? f["Station Presets"];
      const presetCount = Array.isArray(presetLink) ? presetLink.length : 0;
      console.log(`  ${name} | Type: ${compType} | Pick: ${num} | Linked to ${presetCount} preset(s)`);
    }
  }

  console.log("\n=== Station Components - Component Types (sample) ===\n");
  const compRes = await airFetch(`${base}/${componentsTable}?maxRecords=20`);
  if (compRes.error) {
    console.error("Error:", compRes.error);
    return;
  }
  const types = new Set();
  for (const r of compRes.records || []) {
    const t = r.fields?.["Component Type"] ?? "-";
    if (t) types.add(t);
  }
  console.log("  Types in use:", [...types].join(", "));

  console.log("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
