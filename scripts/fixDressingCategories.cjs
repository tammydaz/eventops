/**
 * Fix dressing item categories in Airtable Menu Items table.
 * 
 * Problems found:
 * - Ranch Dressing, Sesame Dressing → Category: "Buffet China" (should be "Dressing")
 * - Caesar Dressing, Poppy Seed Yogurt Dressing → Category: "Component" (should be "Dressing")
 * - "DRESSING CHOICES" → Category: "Buffet China" (header/placeholder, will be logged but not changed)
 *
 * Usage: node scripts/fixDressingCategories.js
 */

require("dotenv").config();

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_ID = "tbl0aN33DGG6R1sPZ"; // Menu Items (legacy)

const CATEGORY_FIELD_ID = "fldM7lWvjH8S0YNSX"; // Category field
const NAME_FIELD_ID = "fldW5gfSlHRTl01v1";     // Item Name field

const ITEMS_TO_FIX = [
  "Ranch Dressing",
  "Sesame Dressing",
  "Caesar Dressing",
  "Poppy Seed Yogurt Dressing",
];

async function airtableFetch(path, options = {}) {
  const url = `https://api.airtable.com/v0/${BASE_ID}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Airtable error ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function findRecordsByNames(names) {
  const orParts = names.map((n) => `{Item Name}="${n.replace(/"/g, '\\"')}"`);
  const formula = `OR(${orParts.join(",")})`;
  const params = new URLSearchParams({
    filterByFormula: formula,
    returnFieldsByFieldId: "true",
  });
  params.append("fields[]", NAME_FIELD_ID);
  params.append("fields[]", CATEGORY_FIELD_ID);

  const data = await airtableFetch(`/${TABLE_ID}?${params.toString()}`);
  return data.records || [];
}

async function patchRecord(recordId, categoryValue) {
  return airtableFetch(`/${TABLE_ID}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({
      fields: {
        [CATEGORY_FIELD_ID]: categoryValue,
      },
    }),
  });
}

async function main() {
  if (!API_KEY || !BASE_ID) {
    console.error("Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in environment.");
    process.exit(1);
  }

  console.log("Searching for dressing records to fix...\n");
  const records = await findRecordsByNames(ITEMS_TO_FIX);

  if (records.length === 0) {
    console.log("No matching records found. Check item names.");
    return;
  }

  for (const rec of records) {
    const name = rec.fields[NAME_FIELD_ID] || "(unknown)";
    const currentCat = rec.fields[CATEGORY_FIELD_ID] || "(none)";
    console.log(`Found: "${name}" | Current category: "${currentCat}"`);
  }

  const toUpdate = records.filter((rec) => {
    const name = rec.fields[NAME_FIELD_ID] || "";
    return ITEMS_TO_FIX.includes(name);
  });

  if (toUpdate.length === 0) {
    console.log("\nNothing to update.");
    return;
  }

  console.log(`\nUpdating ${toUpdate.length} record(s) to Category = "Dressing"...\n`);

  for (const rec of toUpdate) {
    const name = rec.fields[NAME_FIELD_ID] || rec.id;
    try {
      await patchRecord(rec.id, "Dressing");
      console.log(`  ✓ Updated: "${name}"`);
    } catch (err) {
      console.error(`  ✗ Failed to update "${name}":`, err.message);
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
