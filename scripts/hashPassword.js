/**
 * Generate a password hash for the Airtable Users table.
 * Run: node scripts/hashPassword.js "YourPassword"
 * Copy the output into the PasswordHash field in Airtable.
 */
import crypto from "crypto";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hashPassword.js \"YourPassword\"");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("base64");
const hash = crypto.scryptSync(password, salt, 64).toString("base64");
const stored = `${salt}:${hash}`;

console.log("\nPaste this into the PasswordHash field in Airtable:\n");
console.log(stored);
console.log("\n");
