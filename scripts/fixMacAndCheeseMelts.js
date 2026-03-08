/**
 * 1. Delete "Mac & Cheese Melts" (the one WITHOUT Marinara in the name)
 * 2. Fix "Mac & Cheese Mets – Marinara Sauce" → "Mac & Cheese Melts – Marinara Sauce"
 *
 * Run: node scripts/fixMacAndCheeseMelts.js [--dry-run]
 * Use --execute to actually run (default is dry-run)
 */
import "dotenv/config";

const apiKey = process.env.VITE_AIRTABLE_API_KEY?.trim();
const baseId = process.env.VITE_AIRTABLE_BASE_ID?.trim();
const menuTable = process.env.VITE_AIRTABLE_MENU_ITEMS_TABLE?.trim() || "tbl0aN33DGG6R1sPZ";

const ITEM_NAME = "fldW5gfSlHRTl01v1";
const DESCRIPTION_NAME = "fldQ83gpgOmMxNMQw";
const CHILD_ITEMS_FIELD_ID = "fldIu6qmlUwAEn2W9";

const dryRun = !process.argv.includes("--execute");

function asString(val) {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && "name" in val) return String(val.name);
  return String(val);
}

function asChildIds(val) {
  if (!Array.isArray(val)) return [];
  return val.map((v) => (typeof v === "string" ? v : v?.id)).filter((id) => id?.startsWith("rec"));
}

async function main() {
  if (!apiKey || !baseId) {
    console.error("❌ Set VITE_AIRTABLE_API_KEY and VITE_AIRTABLE_BASE_ID in .env");
    process.exit(1);
  }

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
    return name.includes("mac") && name.includes("cheese");
  });

  // Fetch child item names to check for Marinara
  const allChildIds = [...new Set(macRecords.flatMap((r) => asChildIds(r.fields[CHILD_ITEMS_FIELD_ID])))];
  const childNames = {};
  if (allChildIds.length > 0) {
    const childFormula = `OR(${allChildIds.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
    const childRecs = await fetch(
      `https://api.airtable.com/v0/${baseId}/${menuTable}?filterByFormula=${encodeURIComponent(childFormula)}&pageSize=100&returnFieldsByFieldId=true&fields[]=${ITEM_NAME}&fields[]=${DESCRIPTION_NAME}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    ).then((r) => r.json());
    (childRecs.records || []).forEach((rec) => {
      const f = rec.fields || {};
      childNames[rec.id] = (asString(f[DESCRIPTION_NAME]) || asString(f[ITEM_NAME]) || "").toLowerCase();
    });
  }

  const toDelete = macRecords.find((rec) => {
    const name = asString(rec.fields[DESCRIPTION_NAME]) || asString(rec.fields[ITEM_NAME]);
    const hasMarinaraChild = asChildIds(rec.fields[CHILD_ITEMS_FIELD_ID]).some(
      (cid) => childNames[cid]?.includes("marinara")
    );
    const isMelt = /mac\s*[&]?\s*cheese\s*melts?/i.test(name);
    return isMelt && !hasMarinaraChild;
  });

  // Also search all records for "Mets" typo (might be outside mac/cheese filter)
  const toFixSpelling =
    macRecords.find((rec) => {
      const name = asString(rec.fields[DESCRIPTION_NAME]) || asString(rec.fields[ITEM_NAME]);
      return name.includes("Mets");
    }) ||
    allRecords.find((rec) => {
      const name = asString(rec.fields[DESCRIPTION_NAME]) || asString(rec.fields[ITEM_NAME]);
      return name.includes("Mets");
    });

  // Debug: list all Mac & Cheese Melt(s) records
  const meltRecs = macRecords.filter((r) => {
    const n = asString(r.fields[DESCRIPTION_NAME]) || asString(r.fields[ITEM_NAME]);
    return /mac\s*[&]?\s*cheese\s*melts?/i.test(n);
  });
  if (meltRecs.length > 0) {
    console.log("Mac & Cheese Melt(s) records:");
    meltRecs.forEach((r) => {
      const name = asString(r.fields[DESCRIPTION_NAME]) || asString(r.fields[ITEM_NAME]);
      const childIds = asChildIds(r.fields[CHILD_ITEMS_FIELD_ID]);
      const hasMarinara = childIds.some((cid) => childNames[cid]?.includes("marinara"));
      console.log(`  - ${name} (${r.id}) | Marinara child: ${hasMarinara}`);
    });
    console.log("");
  }

  console.log(dryRun ? "🔍 DRY RUN\n" : "🗑️ EXECUTING\n");

  if (toDelete) {
    const name = asString(toDelete.fields[DESCRIPTION_NAME]) || asString(toDelete.fields[ITEM_NAME]);
    if (dryRun) {
      console.log(`Would DELETE: ${name} (${toDelete.id})`);
    } else {
      const res = await fetch(
        `https://api.airtable.com/v0/${baseId}/${menuTable}/${toDelete.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${apiKey}` } }
      );
      if (!res.ok) throw new Error(`Delete failed: ${await res.text()}`);
      console.log(`✓ Deleted: ${name} (${toDelete.id})`);
    }
  } else {
    console.log("No 'Mac & Cheese Melts' (without Marinara) found to delete.");
  }

  if (toFixSpelling) {
    const oldItemName = asString(toFixSpelling.fields[ITEM_NAME]);
    const newItemName = oldItemName.replace(/Mets/g, "Melts");
    if (dryRun) {
      console.log(`Would FIX: "${oldItemName}" → "${newItemName}" (${toFixSpelling.id})`);
    } else {
      const res = await fetch(
        `https://api.airtable.com/v0/${baseId}/${menuTable}/${toFixSpelling.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: { [ITEM_NAME]: newItemName },
          }),
        }
      );
      if (!res.ok) throw new Error(`Update failed: ${await res.text()}`);
      console.log(`✓ Fixed: "${oldItemName}" → "${newItemName}" (${toFixSpelling.id})`);
    }
  } else {
    console.log("No 'Mac & Cheese Mets' typo found to fix.");
  }

  console.log(dryRun ? "\nRun with --execute to apply." : "\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
