#!/usr/bin/env node

/**
 * Env diagnostic — find .env issues that break Airtable.
 * Run: node scripts/checkEnv.js
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env");
const envLocalPath = join(root, ".env.local");

console.log("=== Env diagnostic ===\n");

// 1. Which file is used
console.log("1. Env files:");
console.log("   .env exists:", existsSync(envPath));
console.log("   .env.local exists:", existsSync(envLocalPath));
if (existsSync(envLocalPath)) {
  console.log("   ⚠️  .env.local overrides .env for Vercel. Check both.");
}

// 2. Raw file check (encoding, BOM)
if (existsSync(envPath)) {
  const buf = readFileSync(envPath);
  const hasBOM = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  console.log("\n2. .env file:");
  console.log("   BOM (UTF-8 byte order mark):", hasBOM ? "❌ YES — can break first variable" : "✅ No");
  if (hasBOM) {
    console.log("   Fix: Save .env as UTF-8 without BOM (VS Code: bottom-right encoding → Save with Encoding)");
  }
  const firstLine = buf.toString("utf8").split("\n")[0];
  const firstChar = firstLine?.charCodeAt(0);
  console.log("   First char code:", firstChar, firstChar === 0xef ? "(BOM start)" : "");
}

// 3. What dotenv actually loads
import "dotenv/config";

const vars = [
  "VITE_AIRTABLE_API_KEY",
  "VITE_AIRTABLE_BASE_ID",
  "VITE_AIRTABLE_EVENTS_TABLE",
  "AIRTABLE_API_KEY",
  "AIRTABLE_BASE_ID",
];

console.log("\n3. Loaded vars (from dotenv):");
for (const v of vars) {
  const val = process.env[v];
  const set = val != null && String(val).trim() !== "";
  const preview = set ? `${String(val).slice(0, 15)}...` : "(empty/missing)";
  console.log(`   ${v}: ${set ? "✅" : "❌"} ${preview}`);
}

// 4. Server vs client
console.log("\n4. Server vs client:");
console.log("   API routes use: AIRTABLE_API_KEY, AIRTABLE_BASE_ID");
console.log("   Browser uses:   VITE_AIRTABLE_API_KEY, VITE_AIRTABLE_BASE_ID");
console.log("   Both should be set. Metadata now goes through /api/airtable/meta (server key).");

// 5. Vercel
console.log("\n5. If using vercel dev:");
console.log("   Run: vercel env pull .env.local");
console.log("   This pulls Development env from Vercel. Local .env may be ignored.");
console.log("   Or ensure .env has all vars — vercel dev loads .env when project not linked.");

console.log("\n=== Done ===");
