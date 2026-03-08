/**
 * Delete duplicate Passed App items that have NO sauce in the display name.
 * Keeps the version where the name shows a sauce (e.g. "Coconut Shrimp – Pineapple Colada Dipping Sauce").
 *
 * IMPORTANT: Uses the display name (Description Name) as source of truth, NOT hasChildItems.
 * The Child Items link can be inconsistent with what's shown in the name.
 *
 * Run: node scripts/deleteDuplicatePassedApps.js [--dry-run]
 * Requires: VITE_AIRTABLE_API_KEY, VITE_AIRTABLE_BASE_ID in .env
 */
import "dotenv/config";

const apiKey = process.env.VITE_AIRTABLE_API_KEY?.trim();
const baseId = process.env.VITE_AIRTABLE_BASE_ID?.trim();
const menuTable = process.env.VITE_AIRTABLE_MENU_ITEMS_TABLE?.trim() || "tbl0aN33DGG6R1sPZ";
const dryRun = process.argv.includes("--dry-run");

const FIELDS = {
  descriptionName: "fldQ83gpgOmMxNMQw",
  itemName: "fldW5gfSlHRTl01v1",
  category: "fldM7lWvjH8S0YNSX",
};

/** True if the display name shows a sauce (has " – Something" where Something is non-empty) */
function hasSauceInName(name) {
  if (!name || typeof name !== "string") return false;
  const idx = name.indexOf(" – ");
  if (idx < 0) return false;
  const after = name.slice(idx + 3).trim();
  return after.length > 0;
}

function norm(s) {
  if (!s) return "";
  return String(s).replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function baseName(s) {
  if (!s) return "";
  const str = String(s);
  const dash = str.indexOf(" – ");
  const base = dash >= 0 ? str.slice(0, dash).trim() : str;
  return norm(base);
}

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
    console.error("❌ Set VITE_AIRTABLE_API_KEY and VITE_AIRTABLE_BASE_ID in .env");
    process.exit(1);
  }

  console.log("Fetching Menu Items from Airtable...");
  const raw = await fetchAllRecords();

  const records = raw.map((rec) => {
    const f = rec.fields || {};
    const name = asString(f[FIELDS.descriptionName]) || asString(f[FIELDS.itemName]);
    const itemName = asString(f[FIELDS.itemName]);
    const category = asCategory(f[FIELDS.category]);
    return {
      id: rec.id,
      name,
      itemName,
      category,
    };
  });

  const passed = records.filter(
    (r) =>
      (r.category === "Passed App" || r.category === "Appetizer") &&
      (r.itemName || r.name)
  );

  const byBase = {};
  passed.forEach((r) => {
    const b = baseName(r.itemName || r.name);
    if (b) {
      byBase[b] = byBase[b] || [];
      byBase[b].push(r);
    }
  });

  const toDelete = [];
  Object.entries(byBase).forEach(([base, items]) => {
    if (items.length < 2) return;
    const withSauce = items.filter((i) => hasSauceInName(i.name));
    const withoutSauce = items.filter((i) => !hasSauceInName(i.name));
    if (withSauce.length > 0 && withoutSauce.length > 0) {
      withoutSauce.forEach((i) => {
        toDelete.push({
          id: i.id,
          name: i.itemName || i.name,
          displayName: i.name,
          reason: "No sauce in name; keeping version with sauce",
        });
      });
    }
  });

  if (toDelete.length === 0) {
    console.log("\n✅ No duplicate Passed App items found (without sauce in name).");
    return;
  }

  console.log(dryRun ? "\n🔍 DRY RUN — no records will be deleted\n" : "\n🗑️ Deleting duplicates (no sauce in name)...\n");

  for (const { id, name, displayName } of toDelete) {
    if (dryRun) {
      console.log(`  Would delete: ${name} (${id})`);
      console.log(`    Display: "${displayName}"`);
    } else {
      try {
        const url = `https://api.airtable.com/v0/${baseId}/${menuTable}/${id}`;
        const res = await fetch(url, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`HTTP ${res.status}: ${err}`);
        }
        console.log(`  ✓ Deleted: ${name} (${id})`);
      } catch (e) {
        console.error(`  ✗ Failed ${name} (${id}): ${e.message}`);
      }
    }
  }

  console.log(dryRun ? "\nRun without --dry-run to actually delete." : "\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
