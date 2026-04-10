#!/usr/bin/env node
/**
 * Add 7 salad items to legacy Menu Items table (Category = "Salad")
 * and standard dressings (Category = "Dressing") if they don't already exist.
 * Run: node scripts/addSaladItems.js
 */
import "dotenv/config";

const baseId = process.env.AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID;
const apiKey = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
const menuItemsTable = process.env.VITE_AIRTABLE_MENU_ITEMS_TABLE || "tbl0aN33DGG6R1sPZ";

if (!apiKey || !baseId) {
  console.error("Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID in .env");
  process.exit(1);
}

const base = `https://api.airtable.com/v0/${baseId}`;

async function airFetch(url, opts = {}) {
  const res = await globalThis.fetch(url, {
    ...opts,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...opts.headers },
  });
  return res.json();
}

// 7 salads from BEO reference image
const SALADS = [
  {
    name: "Arugula & Fennel Salad",
    description: "Peppery arugula with licorice flavored shaved fennel, toasted walnuts, goat cheese, & red onion",
  },
  {
    name: "Foodwerx Funky Salad",
    description: "Baby lettuces, Maytag bleu cheese, candied pecans, mixed berries, peppers, & scallions",
  },
  {
    name: "Caesar Salad",
    description: "Romaine hearts, grape tomatoes, shaved parmigiana reggiano, & crunchy herb croutons",
  },
  {
    name: "Greek Goddess Salad",
    description: "Baby spinach & lolla rossa lettuce, kalamata olives, garbanzo beans, grape tomatoes, & feta cheese",
  },
  {
    name: "Caprese Salad",
    description: "Roasted roma tomatoes, fresh mozzarella, basil pesto, & red pepper with seared crostini",
  },
  {
    name: "Kale Caesar Salad",
    description: "Baby kale with cream cheese croutons, grape tomatoes, & seared yellow peppers tossed in peppercorn caesar dressing",
  },
  {
    name: "Classic Green Salad",
    description: "Mature & baby lettuces, cucumber, carrots, mushrooms, broccoli, onion, & tomatoes",
  },
];

// Standard dressings to add (Category = "Dressing")
const DRESSINGS = [
  "Balsamic vinaigrette",
  "Creamy ranch",
  "Classic caesar dressing",
  "Peppercorn caesar dressing",
  "Greek dressing",
  "Blue cheese dressing",
  "Honey mustard dressing",
  "Red wine vinaigrette",
  "Lemon herb vinaigrette",
  "Parmesan peppercorn dressing",
  "Tahini dressing",
  "Low fat raspberry vinaigrette",
];

async function getExistingNames(category) {
  const formula = encodeURIComponent(`{Category}="${category}"`);
  let names = new Set();
  let offset = "";
  do {
    const url = `${base}/${menuItemsTable}?filterByFormula=${formula}&fields[]=Item Name${offset ? `&offset=${offset}` : ""}`;
    const res = await airFetch(url);
    if (res.error) {
      console.error(`Error fetching ${category} items:`, res.error);
      return names;
    }
    for (const rec of res.records || []) {
      const n = rec.fields?.["Item Name"];
      if (n) names.add(n.toLowerCase().trim());
    }
    offset = res.offset || "";
  } while (offset);
  return names;
}

async function createRecords(items) {
  // Airtable allows max 10 records per batch
  for (let i = 0; i < items.length; i += 10) {
    const batch = items.slice(i, i + 10);
    const res = await airFetch(`${base}/${menuItemsTable}`, {
      method: "POST",
      body: JSON.stringify({ records: batch.map((f) => ({ fields: f })) }),
    });
    if (res.error) {
      console.error("  Error creating batch:", JSON.stringify(res.error));
    } else {
      for (const rec of res.records || []) {
        const name = rec.fields?.["Item Name"] || rec.id;
        console.log(`  ✓ Created: ${name} (${rec.id})`);
      }
    }
  }
}

async function main() {
  console.log("\n=== Add Salad Items & Dressings to Menu Items ===\n");
  console.log(`Table: ${menuItemsTable}\n`);

  // --- Salads ---
  console.log("Checking existing Salad items...");
  const existingSalads = await getExistingNames("Salad");
  console.log(`  ${existingSalads.size} existing salad record(s) found.`);

  const saladsToCreate = SALADS.filter(
    (s) => !existingSalads.has(s.name.toLowerCase().trim())
  );

  if (saladsToCreate.length === 0) {
    console.log("  All salads already exist — skipping.\n");
  } else {
    console.log(`\nCreating ${saladsToCreate.length} salad(s):`);
    await createRecords(
      saladsToCreate.map((s) => ({
        "Item Name": s.name,
        "Description Name": s.description,
        "Category": "Salad",
      }))
    );
  }

  // --- Dressings ---
  console.log("\nChecking existing Dressing items...");
  const existingDressings = await getExistingNames("Dressing");
  console.log(`  ${existingDressings.size} existing dressing record(s) found.`);

  const dressingsToCreate = DRESSINGS.filter(
    (d) => !existingDressings.has(d.toLowerCase().trim())
  );

  if (dressingsToCreate.length === 0) {
    console.log("  All dressings already exist — skipping.\n");
  } else {
    console.log(`\nCreating ${dressingsToCreate.length} dressing(s):`);
    await createRecords(
      dressingsToCreate.map((d) => ({
        "Item Name": d,
        "Category": "Dressing",
      }))
    );
  }

  console.log("\n=== Done ===");
  console.log("\nSalads now appear in the Buffet China picker (+ Add button).");
  console.log("Dressings now appear in the dressing picker (+ Add dressing button).\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
