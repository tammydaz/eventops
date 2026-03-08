/**
 * Export Stations and Station Presets from Airtable.
 * Run: node scripts/exportStationsAndPresets.js
 *
 * Output: stations-export.json (Station Type + Station Items per record)
 * Use with buildStationMapping.js to generate correct stationItemMapping.ts
 */
import "dotenv/config";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiKey = process.env.VITE_AIRTABLE_API_KEY?.trim();
const baseId = process.env.VITE_AIRTABLE_BASE_ID?.trim();
const stationsTable = process.env.VITE_AIRTABLE_STATIONS_TABLE?.trim() || "tblhFwUfREbpfFXhv";
const presetsTable = process.env.VITE_AIRTABLE_STATION_PRESETS_TABLE?.trim() || "Station Presets";

// Field names (Airtable uses these)
const STATION_FIELDS = ["Station Type", "Station Items", "Event", "Station Notes"];
const PRESET_FIELDS = ["Preset Name", "Station Type", "Line 1 Defaults", "Line 2 Defaults", "Individual Defaults", "Pick Count"];

function asString(val) {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && "name" in val) return String(val.name);
  return String(val);
}

function asLinkedIds(val) {
  if (!Array.isArray(val)) return [];
  return val.map((v) => (typeof v === "string" ? v : v?.id)).filter(Boolean);
}

async function fetchTable(tableIdOrName, fields, tableLabel) {
  const all = [];
  let offset;
  do {
    const params = new URLSearchParams();
    params.set("pageSize", "100");
    params.set("returnFieldsByFieldId", "false");
    fields.forEach((f) => params.append("fields[]", f));

    if (offset) params.set("offset", offset);

    const url = `https://api.airtable.com/v0/${baseId}/${tableIdOrName}?${params}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    const data = await res.json();

    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

    all.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  return all;
}

async function main() {
  if (!apiKey || !baseId) {
    console.error("Missing VITE_AIRTABLE_API_KEY or VITE_AIRTABLE_BASE_ID in .env");
    process.exit(1);
  }

  const out = {
    exportedAt: new Date().toISOString(),
    stations: [],
    presets: [],
    stationTypeToItemIds: {},
  };

  // 1. Fetch Stations
  console.log("Fetching Stations...");
  let stationsRaw = [];
  try {
    stationsRaw = await fetchTable(stationsTable, STATION_FIELDS, "Stations");
    console.log(`  Fetched ${stationsRaw.length} station records.`);
  } catch (e) {
    console.warn("  Could not fetch Stations:", e.message);
  }

  for (const rec of stationsRaw) {
    const f = rec.fields || {};
    const stationType = asString(f["Station Type"]);
    const itemIds = asLinkedIds(f["Station Items"]);
    out.stations.push({
      id: rec.id,
      stationType,
      stationItems: itemIds,
      stationNotes: asString(f["Station Notes"]),
    });
    if (stationType && itemIds.length > 0) {
      out.stationTypeToItemIds[stationType] = [
        ...new Set([...(out.stationTypeToItemIds[stationType] || []), ...itemIds]),
      ];
    }
  }

  // 2. Fetch Station Presets (table may not exist)
  console.log("Fetching Station Presets...");
  let presetsRaw = [];
  try {
    presetsRaw = await fetchTable(presetsTable, PRESET_FIELDS, "Station Presets");
    console.log(`  Fetched ${presetsRaw.length} preset records.`);
  } catch (e) {
    console.warn("  Could not fetch Station Presets:", e.message);
  }

  for (const rec of presetsRaw) {
    const f = rec.fields || {};
    const presetName = asString(f["Preset Name"]) || asString(f["Station Type"]);
    const line1 = asLinkedIds(f["Line 1 Defaults"]);
    const line2 = asLinkedIds(f["Line 2 Defaults"]);
    const individuals = asLinkedIds(f["Individual Defaults"]);
    const allIds = [...line1, ...line2, ...individuals];
    out.presets.push({
      id: rec.id,
      presetName,
      line1,
      line2,
      individuals,
      pickCount: f["Pick Count"],
    });
    if (presetName && allIds.length > 0) {
      out.stationTypeToItemIds[presetName] = [
        ...new Set([...(out.stationTypeToItemIds[presetName] || []), ...allIds]),
      ];
    }
  }

  const outPath = join(__dirname, "..", "stations-export.json");
  writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log(`\n✅ Exported to: ${outPath}`);
  console.log("\nStation types with item IDs:", Object.keys(out.stationTypeToItemIds));
  console.log("\nNext: Run 'node scripts/buildStationMapping.js' to generate stationItemMapping.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
