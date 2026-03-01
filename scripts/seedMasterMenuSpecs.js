#!/usr/bin/env node

/**
 * Seed Master Menu Specs — creates a spec row for each Menu Item that doesn't have one.
 *
 * Usage:
 *   node scripts/seedMasterMenuSpecs.js
 *   npm run seed-specs
 *
 * Requires in .env:
 *   VITE_AIRTABLE_API_KEY
 *   VITE_AIRTABLE_BASE_ID
 *   VITE_AIRTABLE_MENU_ITEMS_TABLE (default: tbl0aN33DGG6R1sPZ)
 *   VITE_AIRTABLE_MASTER_MENU_SPECS_TABLE (default: tblGeCmzJscnocs1T)
 */

import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.VITE_AIRTABLE_API_KEY?.trim();
const BASE_ID = process.env.VITE_AIRTABLE_BASE_ID?.trim();
const MENU_ITEMS_TABLE = process.env.VITE_AIRTABLE_MENU_ITEMS_TABLE?.trim() || "tbl0aN33DGG6R1sPZ";
const MASTER_SPECS_TABLE = process.env.VITE_AIRTABLE_MASTER_MENU_SPECS_TABLE?.trim() || "tblGeCmzJscnocs1T";

const API_URL = "https://api.airtable.com/v0";
const META_URL = "https://api.airtable.com/v0/meta/bases";

async function fetch(url, options = {}) {
  const res = await globalThis.fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json();
}

async function getMasterSpecsFieldNames() {
  try {
    const data = await fetch(`${META_URL}/${BASE_ID}/tables`);
    const table = data.tables?.find((t) => t.id === MASTER_SPECS_TABLE);
    if (!table) {
      console.warn("⚠️  Could not fetch Master Menu Specs schema (Meta API). Using default field names.");
      return null;
    }
    const fields = {};
    for (const f of table.fields) {
      fields[f.id] = f.name;
    }
    return { table, fields };
  } catch (e) {
    console.warn("⚠️  Meta API failed:", e.message, "- Using default field names.");
    return null;
  }
}

async function listAllRecords(tableId) {
  const records = [];
  let offset = null;
  do {
    const url = `${API_URL}/${BASE_ID}/${tableId}?pageSize=100${offset ? `&offset=${offset}` : ""}`;
    const data = await fetch(url);
    records.push(...(data.records || []));
    offset = data.offset || null;
  } while (offset);
  return records;
}

function findFieldByName(obj, patterns) {
  for (const key of Object.keys(obj)) {
    if (patterns.some((p) => p.test(key))) return key;
  }
  return null;
}

async function main() {
  if (!API_KEY || !BASE_ID) {
    console.error("❌ Set VITE_AIRTABLE_API_KEY and VITE_AIRTABLE_BASE_ID in .env");
    process.exit(1);
  }

  console.log("\n🌱 Seed Master Menu Specs\n");
  console.log("  Menu Items table:", MENU_ITEMS_TABLE);
  console.log("  Master Menu Specs table:", MASTER_SPECS_TABLE);
  if (!process.env.VITE_AIRTABLE_MASTER_MENU_SPECS_TABLE?.trim()) {
    console.log("  ⚠️  Tip: Set VITE_AIRTABLE_MASTER_MENU_SPECS_TABLE=tblMdXBm5vlXELLqu in .env");
  }
  console.log("");

  const schema = await getMasterSpecsFieldNames();
  const names = schema?.fields ? Object.values(schema.fields) : [];
  const menuItemFieldName = names.find((n) => /menu\s*item/i.test(n)) || "Menu Item";
  const tierFieldNames = names.length
    ? [
        names.find((n) => /spec\s*tier\s*0[-_]?40/i.test(n)),
        names.find((n) => /spec\s*tier\s*41[-_]?75/i.test(n)),
        names.find((n) => /spec\s*tier\s*76[-_]?125/i.test(n)),
        names.find((n) => /spec\s*tier\s*126[-_]?175/i.test(n)),
        names.find((n) => /spec\s*tier\s*176[-_]?225/i.test(n)),
        names.find((n) => /spec\s*tier\s*225/i.test(n)),
      ].filter(Boolean)
    : [];
  const specUnitTypeField = names.find((n) => /spec\s*unit\s*type/i.test(n));
  const specCategoryField = names.find((n) => /spec\s*category/i.test(n));
  const industryStandardField = names.find((n) => /industry\s*standard/i.test(n));

  if (!names.length) {
    console.log("  ⚠️  Schema not available (Meta API 403?). Using minimal fields: Menu Item only.");
    console.log("     Spec engine will use defaults for tier/unit/category.\n");
  }

  console.log("  Menu Item link field:", menuItemFieldName);
  console.log("");

  const [menuItems, existingSpecs] = await Promise.all([
    listAllRecords(MENU_ITEMS_TABLE),
    listAllRecords(MASTER_SPECS_TABLE),
  ]);

  const nameField = findFieldByName(menuItems[0]?.fields || {}, [/^name$/i, /item\s*name/i]) || "Name";
  const categoryField = findFieldByName(menuItems[0]?.fields || {}, [/category/i]);

  const linkedMenuIds = new Set();
  for (const rec of existingSpecs) {
    const linkField = findFieldByName(rec.fields || {}, [/menu\s*item/i, /^item$/i]);
    if (linkField) {
      const val = rec.fields[linkField];
      const ids = Array.isArray(val) ? val.map((v) => (typeof v === "string" ? v : v?.id)).filter(Boolean) : [];
      ids.forEach((id) => linkedMenuIds.add(id));
    }
  }

  const toCreate = menuItems.filter((r) => !linkedMenuIds.has(r.id));
  if (toCreate.length === 0) {
    console.log("✅ All menu items already have specs. Nothing to create.\n");
    return;
  }

  console.log(`  Menu items: ${menuItems.length}`);
  console.log(`  Already have specs: ${linkedMenuIds.size}`);
  console.log(`  To create: ${toCreate.length}\n`);

  const BATCH_SIZE = 10;
  let created = 0;

  for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
    const batch = toCreate.slice(i, i + BATCH_SIZE);
    const records = batch.map((mi) => {
      const name = mi.fields?.[nameField];
      const category = categoryField ? categoryField in (mi.fields || {}) : null;
      const catVal = category ? mi.fields[category] : null;
      const specCategory = typeof catVal === "string" ? catVal : catVal?.name ?? "Dessert";

      const fields = { [menuItemFieldName]: [mi.id] };
      if (specUnitTypeField) fields[specUnitTypeField] = "Full Pan";
      if (specCategoryField) fields[specCategoryField] = specCategory;
      if (industryStandardField) fields[industryStandardField] = 1 / 30;
      for (const fn of tierFieldNames) fields[fn] = 1;

      return { fields };
    });

    await fetch(`${API_URL}/${BASE_ID}/${MASTER_SPECS_TABLE}`, {
      method: "POST",
      body: JSON.stringify({ records, typecast: true }),
    });
    created += batch.length;
    console.log(`  Created ${created}/${toCreate.length} specs...`);
  }

  console.log(`\n✅ Done! Created ${created} Master Menu Specs records.\n`);
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
