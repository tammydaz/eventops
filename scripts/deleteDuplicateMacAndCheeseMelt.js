/**
 * Delete the duplicate Mac and Cheese melt that does NOT have Marinara sauce as a child item.
 * Keeps the one that has Marinara linked.
 *
 * Run: node scripts/deleteDuplicateMacAndCheeseMelt.js [--dry-run]
 * Use --delete to actually delete (default is dry-run)
 *
 * Requires: VITE_AIRTABLE_API_KEY, VITE_AIRTABLE_BASE_ID in .env
 */
import "dotenv/config";

const apiKey = process.env.VITE_AIRTABLE_API_KEY?.trim();
const baseId = process.env.VITE_AIRTABLE_BASE_ID?.trim();
const menuTable = process.env.VITE_AIRTABLE_MENU_ITEMS_TABLE?.trim() || "tbl0aN33DGG6R1sPZ";

const CHILD_ITEMS_FIELD_ID = "fldIu6qmlUwAEn2W9";
const ITEM_NAME = "fldW5gfSlHRTl01v1";
const DESCRIPTION_NAME = "fldQ83gpgOmMxNMQw";

const dryRun = !process.argv.includes("--delete");

function asString(val) {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && "name" in val) return String(val.name);
  return String(val);
}

function asChildIds(val) {
  if (!Array.isArray(val)) return [];
  return val
    .map((v) => (typeof v === "string" ? v : v?.id))
    .filter((id) => id && id.startsWith("rec"));
}

async function fetchRecords(formula, fields) {
  const params = new URLSearchParams();
  params.set("filterByFormula", formula);
  params.set("pageSize", "100");
  params.set("returnFieldsByFieldId", "true");
  fields.forEach((f) => params.append("fields[]", f));
  const url = `https://api.airtable.com/v0/${baseId}/${menuTable}?${params}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.records || [];
}

async function main() {
  if (!apiKey || !baseId) {
    console.error("❌ Set VITE_AIRTABLE_API_KEY and VITE_AIRTABLE_BASE_ID in .env");
    process.exit(1);
  }

  console.log("Searching for Mac and Cheese melt records...");
  // Fetch all menu items, filter in JS (formula field refs use names not IDs)
  const allParams = new URLSearchParams();
  allParams.set("pageSize", "100");
  allParams.set("returnFieldsByFieldId", "true");
  [ITEM_NAME, DESCRIPTION_NAME, CHILD_ITEMS_FIELD_ID].forEach((f) => allParams.append("fields[]", f));
  let allRecords = [];
  let offset;
  do {
    if (offset) allParams.set("offset", offset);
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${menuTable}?${allParams}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    allRecords = allRecords.concat(data.records || []);
    offset = data.offset;
  } while (offset);

  const macRecords = allRecords.filter((rec) => {
    const f = rec.fields || {};
    const name = (asString(f[ITEM_NAME]) + " " + asString(f[DESCRIPTION_NAME])).toLowerCase();
    return (name.includes("mac") && name.includes("cheese"));
  });

  if (macRecords.length === 0) {
    console.log("No Mac and Cheese records found.");
    return;
  }

  console.log(`Found ${macRecords.length} Mac and Cheese record(s):`);
  const withChildIds = macRecords.map((rec) => {
    const f = rec.fields || {};
    const name = asString(f[DESCRIPTION_NAME]) || asString(f[ITEM_NAME]);
    const childIds = asChildIds(f[CHILD_ITEMS_FIELD_ID]);
    return { id: rec.id, name, childIds };
  });

  // Fetch child item names for each record
  const allChildIds = [...new Set(withChildIds.flatMap((r) => r.childIds))];
  const childNames = {};
  if (allChildIds.length > 0) {
    const childFormula = `OR(${allChildIds.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
    const childRecs = await fetchRecords(childFormula, [ITEM_NAME, DESCRIPTION_NAME]);
    childRecs.forEach((rec) => {
      const f = rec.fields || {};
      childNames[rec.id] = (asString(f[DESCRIPTION_NAME]) || asString(f[ITEM_NAME]) || "").toLowerCase();
    });
  }

  const withMarinara = [];
  const withoutMarinara = [];
  withChildIds.forEach((r) => {
    const hasMarinara = r.childIds.some((cid) => childNames[cid]?.includes("marinara"));
    if (hasMarinara) {
      withMarinara.push(r);
    } else {
      withoutMarinara.push(r);
    }
  });

  console.log("\n  With Marinara child:", withMarinara.map((r) => `${r.name} (${r.id})`).join(", ") || "none");
  console.log("  Without Marinara:", withoutMarinara.map((r) => `${r.name} (${r.id})`).join(", ") || "none");

  // Delete only items that look like "Mac and Cheese Melt" / "Mac & Cheese Melts" without Marinara
  const meltPattern = /mac\s*[&]?\s*cheese\s*melts?|macaroni\s+and\s+cheese/i;
  const duplicateMelts = withoutMarinara.filter((r) => meltPattern.test(r.name));
  const toDelete =
    duplicateMelts.length >= 1
      ? duplicateMelts
      : withoutMarinara.length === 1 && withMarinara.length >= 1
        ? withoutMarinara
        : [];

  if (toDelete.length === 0) {
    console.log("\n✅ No duplicate to delete (either only one record, or all have Marinara).");
    return;
  }

  console.log(dryRun ? "\n🔍 DRY RUN — run with --delete to actually delete\n" : "\n🗑️ Deleting duplicate...\n");

  for (const { id, name } of toDelete) {
    if (dryRun) {
      console.log(`  Would delete: ${name} (${id})`);
    } else {
      try {
        const url = `https://api.airtable.com/v0/${baseId}/${menuTable}/${id}`;
        const res = await fetch(url, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        console.log(`  ✓ Deleted: ${name} (${id})`);
      } catch (e) {
        console.error(`  ✗ Failed ${name} (${id}): ${e.message}`);
      }
    }
  }

  console.log(dryRun ? "\nRun with --delete to actually delete." : "\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
