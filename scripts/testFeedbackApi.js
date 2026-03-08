#!/usr/bin/env node
/**
 * Test the feedback API directly (no auth - will get 401, but confirms API is reachable).
 * Run: node scripts/testFeedbackApi.js
 *
 * For a real test, you need a JWT. This script checks if the API responds.
 */

import "dotenv/config";

const BASE = process.env.VITE_APP_URL || "http://localhost:3000";

async function main() {
  console.log("\n1. Testing config (no auth):", BASE + "/api/feedback?debug=1", "\n");

  try {
    const debugRes = await fetch(`${BASE}/api/feedback?debug=1`);
    const debugData = await debugRes.json().catch(() => ({}));
    console.log("Status:", debugRes.status);
    console.log("Response:", JSON.stringify(debugData, null, 2));
    if (debugRes.ok) {
      console.log("\n", debugData.hint || "");
    }
  } catch (e) {
    console.error("❌ Request failed:", e.message);
    console.log("\nIs the dev server running? Use: npm run dev:full");
    console.log("");
    return;
  }

  console.log("\n2. Testing GET (needs auth):", BASE + "/api/feedback", "\n");

  try {
    const res = await fetch(`${BASE}/api/feedback`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json().catch(() => ({}));

    console.log("Status:", res.status);
    if (data.details) console.log("Details:", data.details);

    if (res.status === 401) {
      console.log("\n✅ API reachable. 401 = auth required (log in to the app to test fully).");
    } else if (res.status === 500) {
      console.log("\n❌ 500 error. See details above.");
    } else if (res.ok) {
      console.log("\n✅ API OK");
    }
  } catch (e) {
    console.error("❌ Request failed:", e.message);
  }
  console.log("");
}

main();
