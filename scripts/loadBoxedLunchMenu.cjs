/**
 * Loads missing Gourmet sandwiches, Wraps, and Saladwerx salad options
 * into the legacy Menu Items table in Airtable.
 *
 * Usage: node scripts/loadBoxedLunchMenu.cjs
 *
 * Checks for existing records by name before writing (dedup-safe).
 */
require("dotenv").config();

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_ID = "tbl0aN33DGG6R1sPZ"; // Legacy Menu Items

// Field IDs
const F_ITEM_NAME = "fldW5gfSlHRTl01v1";
const F_CATEGORY = "fldM7lWvjH8S0YNSX";
const F_BOX_LUNCH_TYPE = "fld3QYpCSZaLTU2rg";
const F_BOXED_LUNCH_CATEGORY = "fldrFw4Puy2WURVs3";

if (!API_KEY || !BASE_ID) {
  console.error("Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env");
  process.exit(1);
}

async function airtableFetch(path, opts = {}) {
  const url = `https://api.airtable.com/v0/${BASE_ID}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable ${res.status}: ${text}`);
  }
  return res.json();
}

/** Fetch all existing records that have Box Lunch Type set. Returns Set of lowercase names. */
async function fetchExistingNames() {
  const existing = new Set();
  let offset;
  do {
    const params = new URLSearchParams();
    params.set("pageSize", "100");
    params.set("returnFieldsByFieldId", "true");
    params.append("fields[]", F_ITEM_NAME);
    params.append("fields[]", F_BOX_LUNCH_TYPE);
    params.set(
      "filterByFormula",
      `NOT({${F_BOX_LUNCH_TYPE}} = "")`
    );
    if (offset) params.set("offset", offset);
    const data = await airtableFetch(`/${TABLE_ID}?${params}`);
    for (const rec of data.records || []) {
      const name = rec.fields[F_ITEM_NAME];
      if (name) existing.add(String(name).trim().toLowerCase());
    }
    offset = data.offset;
  } while (offset);
  return existing;
}

/**
 * Items to add.
 * boxLunchType: "Gourmet Sandwich" | "Wrap"
 * boxedLunchCategory: "Gourmet" | "Salad"
 * category: the legacy Category field (single-select) - use "Deli/Sandwhiches" for sandwiches/wraps
 */
const ITEMS_TO_ADD = [
  // ── Gourmet Sandwiches ──────────────────────────────────────────────────
  {
    name: "Smoked Turkey with Green Apples & Brie",
    boxLunchType: "Gourmet Sandwich",
    boxedLunchCategory: "Gourmet",
    category: "Deli/Sandwhiches",
  },
  {
    name: "The Greek",
    boxLunchType: "Gourmet Sandwich",
    boxedLunchCategory: "Gourmet",
    category: "Deli/Sandwhiches",
  },
  {
    name: "Honey Stung Chicken",
    boxLunchType: "Gourmet Sandwich",
    boxedLunchCategory: "Gourmet",
    category: "Deli/Sandwhiches",
  },
  {
    name: "Herb Grilled Chicken Breast",
    boxLunchType: "Gourmet Sandwich",
    boxedLunchCategory: "Gourmet",
    category: "Deli/Sandwhiches",
  },
  {
    name: "Savory & Sweet Flank Steak",
    boxLunchType: "Gourmet Sandwich",
    boxedLunchCategory: "Gourmet",
    category: "Deli/Sandwhiches",
  },
  {
    name: "Eye Round of Beef",
    boxLunchType: "Gourmet Sandwich",
    boxedLunchCategory: "Gourmet",
    category: "Deli/Sandwhiches",
  },
  {
    name: "Grilled Flank Steak",
    boxLunchType: "Gourmet Sandwich",
    boxedLunchCategory: "Gourmet",
    category: "Deli/Sandwhiches",
  },
  {
    name: "Beef, Blue & Balsamic",
    boxLunchType: "Gourmet Sandwich",
    boxedLunchCategory: "Gourmet",
    category: "Deli/Sandwhiches",
  },
  {
    name: "Honey Ham & Brie",
    boxLunchType: "Gourmet Sandwich",
    boxedLunchCategory: "Gourmet",
    category: "Deli/Sandwhiches",
  },
  {
    name: "Ham & Cheese Squared",
    boxLunchType: "Gourmet Sandwich",
    boxedLunchCategory: "Gourmet",
    category: "Deli/Sandwhiches",
  },
  {
    name: "foodwerx Italian Hoagie",
    boxLunchType: "Gourmet Sandwich",
    boxedLunchCategory: "Gourmet",
    category: "Deli/Sandwhiches",
  },
  {
    name: "Prosciutto de Parma",
    boxLunchType: "Gourmet Sandwich",
    boxedLunchCategory: "Gourmet",
    category: "Deli/Sandwhiches",
  },

  // ── Wraps ───────────────────────────────────────────────────────────────
  {
    name: "Turkey, Tuna or Chicken BLT Wrap",
    boxLunchType: "Wrap",
    boxedLunchCategory: "Gourmet",
    category: "Deli/Sandwhiches",
  },
  {
    name: "Flat Iron Seared Eye Round Wrap",
    boxLunchType: "Wrap",
    boxedLunchCategory: "Gourmet",
    category: "Deli/Sandwhiches",
  },
  {
    name: "Chicken Caesar Wrap",
    boxLunchType: "Wrap",
    boxedLunchCategory: "Gourmet",
    category: "Deli/Sandwhiches",
  },
  {
    name: "Buffalo Chicken Wrap",
    boxLunchType: "Wrap",
    boxedLunchCategory: "Gourmet",
    category: "Deli/Sandwhiches",
  },
];

async function createRecord(item, { skipBoxedLunchCategory = false, skipCategory = false } = {}) {
  const fields = {
    [F_ITEM_NAME]: item.name,
    [F_BOX_LUNCH_TYPE]: item.boxLunchType,
  };
  // Boxed Lunch Category: only set for "Classic" (known valid value); gourmet/wrap omit it
  if (!skipBoxedLunchCategory && item.boxedLunchCategory && item.boxedLunchCategory === "Classic") {
    fields[F_BOXED_LUNCH_CATEGORY] = item.boxedLunchCategory;
  }
  if (!skipCategory && item.category) {
    fields[F_CATEGORY] = item.category;
  }
  const body = JSON.stringify({ fields });
  return airtableFetch(`/${TABLE_ID}`, { method: "POST", body });
}

async function main() {
  console.log("Fetching existing boxed lunch records...");
  let existing;
  try {
    existing = await fetchExistingNames();
  } catch (err) {
    console.error("Failed to fetch existing records:", err.message);
    process.exit(1);
  }
  console.log(`Found ${existing.size} existing records with Box Lunch Type set.`);

  const toCreate = ITEMS_TO_ADD.filter(
    (item) => !existing.has(item.name.trim().toLowerCase())
  );
  const skipped = ITEMS_TO_ADD.length - toCreate.length;
  console.log(
    `\n${toCreate.length} to create, ${skipped} already exist (skipped).\n`
  );

  if (toCreate.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  let created = 0;
  let failed = 0;
  for (const item of toCreate) {
    try {
      const result = await createRecord(item);
      console.log(`  ✓ Created: "${item.name}" [${item.boxLunchType}] → ${result.id}`);
      created++;
    } catch (err) {
      // Retry without Category if it rejects the select option
      if (err.message.includes("Insufficient permissions") || err.message.includes("INVALID_MULTIPLE_CHOICE")) {
        try {
          const result = await createRecord(item, { skipBoxedLunchCategory: true, skipCategory: true });
          console.log(`  ✓ Created (minimal fields): "${item.name}" [${item.boxLunchType}] → ${result.id}`);
          created++;
        } catch (err2) {
          console.error(`  ✗ Failed: "${item.name}":`, err2.message);
          failed++;
        }
      } else {
        console.error(`  ✗ Failed: "${item.name}":`, err.message);
        failed++;
      }
    }
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone. Created: ${created}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
