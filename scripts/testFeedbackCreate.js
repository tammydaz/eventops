#!/usr/bin/env node
/**
 * Test creating a feedback record directly via Airtable API.
 * Run: node scripts/testFeedbackCreate.js
 * Requires: AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_FEEDBACK_TABLE in .env
 */

import "dotenv/config";

const API_KEY = process.env.AIRTABLE_API_KEY?.trim();
const BASE_ID = process.env.AIRTABLE_BASE_ID?.trim();
const TABLE_ID = process.env.AIRTABLE_FEEDBACK_TABLE?.trim() || "tbl5YaVniN2w4J9fw";

if (!API_KEY || !BASE_ID) {
  console.error("❌ Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID in .env");
  process.exit(1);
}

const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_ID)}`;

console.log("\nTesting POST to", url, "\n");

const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    fields: {
      Type: "issue",
      Screen: "Test Script",
      URL: "https://test",
      Message: "Test create from script",
      UserId: "test-user",
      UserName: "Test User",
      UserEmail: "test@test.com",
      Status: "open",
    },
  }),
});

const text = await res.text();
console.log("Status:", res.status);
console.log("Response:", text);

if (res.ok) {
  console.log("\n✅ Create succeeded! Your token has write access.");
} else {
  console.log("\n❌ Create failed. Check:");
  console.log("   1. Token Access: airtable.com/create/tokens → your token → add your base to Access");
  console.log("   2. Scopes: data.records:read, data.records:write");
  console.log("   3. Table", TABLE_ID, "exists in base", BASE_ID);
}
console.log("");
