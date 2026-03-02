/**
 * Extract sandwich/wrap item names from DELI sections of delivery BEOs
 */
import XLSX from "xlsx";
import { readdirSync, statSync } from "fs";
import { join } from "path";

function findDeliveryFiles(dir, acc = []) {
  try {
    const entries = readdirSync(dir);
    for (const e of entries) {
      const full = join(dir, e);
      const stat = statSync(full);
      if (stat.isDirectory()) findDeliveryFiles(full, acc);
      else if (e.endsWith(".xlsx") && e.toLowerCase().includes("delivery") && !e.includes("conflicted")) {
        acc.push(full);
      }
    }
  } catch (_) {}
  return acc;
}

const files = findDeliveryFiles("beo templates");
const items = new Map();

// Known sandwich/wrap patterns from BEO structure: "3 Acapulco Turkey BLT - ..." or "4 Chicken Ceasar - ..."
const SANDWICH_KEYWORDS = /sandwich|wrap|hoagie|panini|blt|turkey|chicken|beef|ham|caprese|italian|vegetarian|veggie|vegan|mediterranean|napa|acapulco|parmesan crusted|eye round|roast beef|honey ham|sharp caprese|zesty/i;

for (const f of files) {
  try {
    const wb = XLSX.readFile(f);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    for (let i = 0; i < data.length; i++) {
      const colA = String(data[i][0] || "").trim();
      const colB = String(data[i][1] || "").trim();
      const line = colA + " " + colB;

      // Pattern: "3 Acapulco Turkey BLT" or "4 Chicken Ceasar - Marinated..."
      const numPrefix = line.match(/^(\d+)\s+(.+?)(?:\s+-\s|$)/);
      if (numPrefix) {
        const rawName = numPrefix[2].split(/\s+-\s+/)[0].trim();
        if (rawName.length > 8 && SANDWICH_KEYWORDS.test(rawName)) {
          const clean = rawName.replace(/\s*\([^)]*\)\s*$/, "").trim();
          if (clean.length > 6) items.set(clean, (items.get(clean) || 0) + 1);
        }
      }
    }
  } catch (_) {}
}

const sorted = [...items.entries()].sort((a, b) => b[1] - a[1]);
console.log("=== SANDWICH/WRAP ITEMS (from delivery BEOs) ===\n");
sorted.forEach(([k, v]) => console.log(v + "x  " + k));
