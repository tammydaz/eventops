/**
 * Export Menu Items from Airtable for analysis.
 * Run: node scripts/exportMenuItemsForAnalysis.js
 *
 * Output: menu-items-export.json (in project root)
 * Paste this file's contents (or path) into Cursor for analysis.
 */
import "dotenv/config";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiKey = process.env.VITE_AIRTABLE_API_KEY?.trim();
const baseId = process.env.VITE_AIRTABLE_BASE_ID?.trim();
const menuTable = process.env.VITE_AIRTABLE_MENU_ITEMS_TABLE?.trim() || "tbl0aN33DGG6R1sPZ";

// Field IDs from schema (Menu Items table)
const FIELDS = {
  descriptionName: "fldQ83gpgOmMxNMQw",   // Description Name/Formula (primary)
  itemName: "fldW5gfSlHRTl01v1",          // Item Name
  category: "fldM7lWvjH8S0YNSX",          // Category
  childItems: "fldIu6qmlUwAEn2W9",         // Child Items (linked)
  parentItem: "fldBzB941q8TDeqm3",         // Parent Item (linked)
  stationType: "fldBSOxpjxcVnIYhK",        // Station Type
  serviceType: "fld2EhDP5GRalZJzQ",        // Service Type
  section: "fldwl2KIn0xOW1TR3",            // Section
};

function asString(val) {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && "name" in val) return String(val.name);
  return String(val);
}

function asCategory(val) {
  if (val == null) return null;
  if (typeof val === "string") return val;
  if (Array.isArray(val) && val.length > 0) return asString(val[0]);
  if (val && typeof val === "object" && "name" in val) return String(val.name);
  return asString(val);
}

function asLinkedIds(val) {
  if (!Array.isArray(val)) return [];
  return val
    .map((v) => (typeof v === "string" ? v : v?.id))
    .filter(Boolean);
}

async function fetchAllRecords() {
  const all = [];
  let offset;
  do {
    const params = new URLSearchParams();
    params.set("pageSize", "100");
    params.set("returnFieldsByFieldId", "true");
    Object.values(FIELDS).forEach((fid) => params.append("fields[]", fid));
    if (offset) params.set("offset", offset);

    const url = `https://api.airtable.com/v0/${baseId}/${menuTable}?${params}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
    }

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

  console.log("Fetching Menu Items from Airtable...");
  const records = await fetchAllRecords();
  console.log(`Fetched ${records.length} records.`);

  const exportData = {
    exportedAt: new Date().toISOString(),
    totalRecords: records.length,
    fieldIds: FIELDS,
    records: records.map((rec) => {
      const f = rec.fields || {};
      return {
        id: rec.id,
        name: asString(f[FIELDS.descriptionName]) || asString(f[FIELDS.itemName]),
        itemName: asString(f[FIELDS.itemName]),
        category: asCategory(f[FIELDS.category]),
        stationType: asString(f[FIELDS.stationType]),
        serviceType: asString(f[FIELDS.serviceType]),
        section: asString(f[FIELDS.section]),
        childItemIds: asLinkedIds(f[FIELDS.childItems]),
        parentItemId: asLinkedIds(f[FIELDS.parentItem])[0] || null,
        hasChildItems: (asLinkedIds(f[FIELDS.childItems]) || []).length > 0,
        hasParentItem: (asLinkedIds(f[FIELDS.parentItem]) || []).length > 0,
      };
    }),
    categorySummary: {},
  };

  // Build category summary
  exportData.records.forEach((r) => {
    const cat = r.category || "(empty)";
    exportData.categorySummary[cat] = (exportData.categorySummary[cat] || 0) + 1;
  });

  const outPath = join(__dirname, "..", "menu-items-export.json");
  writeFileSync(outPath, JSON.stringify(exportData, null, 2), "utf8");

  console.log(`\n✅ Exported to: ${outPath}`);
  console.log("\n--- Category Summary ---");
  Object.entries(exportData.categorySummary)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));
  console.log("\nNext: Open menu-items-export.json and paste its contents (or @mention the file) in Cursor for analysis.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
