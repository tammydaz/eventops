/**
 * Create Menu_Lab records — Themed Buffets: French
 *
 * Creates:
 *   1 parent  → FRENCH THEMED BUFFET
 *   10 children (linked to parent via "Parent Item" field, Child Type = included)
 *
 * All schema fields (Execution Type, Display Type, Choice Group, Selection Rule,
 * Notes, Test Status) are intentionally left EMPTY — they are filled in a
 * separate enrichment pass.
 *
 * Requires:
 *   VITE_AIRTABLE_API_KEY  — Personal Access Token
 *   VITE_AIRTABLE_BASE_ID  — Airtable base ID (appXXXXXXXX)
 *   MENU_LAB_TABLE_ID      — Menu_Lab table ID (tblXXXXXXXX) or table name "Menu_Lab"
 *
 * Usage:
 *   node scripts/createMenuLabFrenchBuffet.js [--dry-run]
 */
import "dotenv/config";

const apiKey = process.env.VITE_AIRTABLE_API_KEY?.trim();
const baseId = process.env.VITE_AIRTABLE_BASE_ID?.trim();
const tableId = (process.env.MENU_LAB_TABLE_ID?.trim()) || "Menu_Lab";
const dryRun = process.argv.includes("--dry-run");

if (!apiKey || !baseId) {
  console.error("❌ Set VITE_AIRTABLE_API_KEY and VITE_AIRTABLE_BASE_ID in .env");
  process.exit(1);
}

const BASE_URL = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableId)}`;

const HEADERS = {
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
};

// ── helper ──────────────────────────────────────────────────────────────────

async function createRecord(fields) {
  if (dryRun) {
    console.log("  [DRY-RUN] would create:", JSON.stringify(fields));
    return { id: `rec_dryrun_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, fields };
  }

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable error ${res.status}: ${err}`);
  }

  return res.json();
}

// ── data ─────────────────────────────────────────────────────────────────────

const PARENT_NAME = "FRENCH THEMED BUFFET";

const CHILD_NAMES = [
  "SHASHLIK",
  "CHICKEN ALLA GRIGLIA",
  "ANTIPASTA",
  "FOCACCIA SQUARES",
  "ROASTED WHOLE HERBS DE PROVENCE CHICKEN",
  "RATATOUILLE",
  "POMMES PUREE",
  "SALMON EN PAPILLOTE",
  "FRENCH BEAN SALAD",
  "FRENCH BAGUETTE SLICES",
];

// ── main ─────────────────────────────────────────────────────────────────────

console.log(`\n📋 Menu_Lab — Themed Buffets: French`);
console.log(`   Table  : ${tableId}`);
console.log(`   Base   : ${baseId}`);
console.log(dryRun ? "   Mode   : DRY-RUN (no writes)\n" : "   Mode   : LIVE\n");

// 1. Create parent
console.log(`Creating parent: ${PARENT_NAME} …`);
let parentRecord;
try {
  parentRecord = await createRecord({
    "Item Name": PARENT_NAME,
    // Parent Item: intentionally empty (this IS the parent)
    // All schema fields empty per task spec
  });
  console.log(`  ✅ Parent created  id=${parentRecord.id}`);
} catch (err) {
  console.error(`  ❌ Failed to create parent: ${err.message}`);
  process.exit(1);
}

const parentId = parentRecord.id;

// 2. Create children
console.log(`\nCreating ${CHILD_NAMES.length} children …`);
let childrenCreated = 0;
const failures = [];

for (const name of CHILD_NAMES) {
  try {
    const child = await createRecord({
      "Item Name": name,
      "Parent Item": [parentId],   // linked-record field — array of IDs
      "Child Type": "included",
    });
    console.log(`  ✅ ${name}  id=${child.id}`);
    childrenCreated++;
  } catch (err) {
    console.error(`  ❌ ${name}: ${err.message}`);
    failures.push(name);
  }
}

// ── summary ──────────────────────────────────────────────────────────────────

console.log(`\n── Summary ──────────────────────────────────────`);
console.log(`  Parent created  : 1${dryRun ? " (dry-run)" : ""}`);
console.log(`  Children created: ${childrenCreated}${dryRun ? " (dry-run)" : ""}`);
if (failures.length) {
  console.log(`  Failures        : ${failures.length}`);
  failures.forEach((f) => console.log(`    - ${f}`));
  process.exit(1);
} else {
  console.log(`  Status          : ✅ All records OK`);
}
