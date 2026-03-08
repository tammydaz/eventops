#!/usr/bin/env node
/**
 * List all tables in your Airtable base with their IDs.
 * Run: node scripts/listAirtableTables.js
 * Requires: AIRTABLE_API_KEY and AIRTABLE_BASE_ID in .env
 *
 * Use this to find your Feedback Issues table ID (tblXXXXXXXX) for AIRTABLE_FEEDBACK_TABLE.
 */

import "dotenv/config";

const API_KEY = process.env.AIRTABLE_API_KEY?.trim();
const BASE_ID = process.env.AIRTABLE_BASE_ID?.trim();

if (!API_KEY || !BASE_ID) {
  console.error("❌ Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID in .env");
  process.exit(1);
}

async function main() {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Airtable API error:", res.status, text.slice(0, 200));
    process.exit(1);
  }

  const data = await res.json();
  const tables = data.tables || [];

  console.log("\n📋 Tables in base", BASE_ID, "\n");
  console.log("Table Name              | Table ID");
  console.log("------------------------|------------------");

  for (const t of tables) {
    const name = (t.name || "—").padEnd(23);
    const id = t.id || "—";
    console.log(`${name} | ${id}`);
  }

  const feedback = tables.find((t) =>
    /feedback|issues/i.test(t.name || "")
  );
  if (feedback) {
    console.log("\n✅ Feedback table found! Add to .env:");
    console.log(`   AIRTABLE_FEEDBACK_TABLE=${feedback.id}`);
  } else {
    console.log("\n⚠️  No table matching 'feedback' or 'issues' found.");
    console.log("   Create a table named 'Feedback Issues' in this base, then run this script again.");
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
