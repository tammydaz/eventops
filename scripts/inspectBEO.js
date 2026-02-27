/**
 * Inspect BEO Excel structure - outputs sheet names and first rows of each sheet
 */
import XLSX from "xlsx";
import { readdirSync, statSync } from "fs";
import { join } from "path";

const TEMPLATES = "beo templates";

function findSamples() {
  const samples = { fs: null, delivery: null, pickup: null };
  function walk(dir) {
    try {
      const entries = readdirSync(dir);
      for (const e of entries) {
        const full = join(dir, e);
        const stat = statSync(full);
        if (stat.isDirectory()) walk(full);
        else if (e.endsWith(".xlsx") && !e.includes("conflicted")) {
          const lower = e.toLowerCase();
          if (!samples.fs && (lower.includes(" fs.xlsx") || lower.includes(" fs "))) samples.fs = full;
          if (!samples.delivery && lower.includes("delivery.xlsx")) samples.delivery = full;
          if (!samples.pickup && lower.includes("pick up.xlsx")) samples.pickup = full;
          if (samples.fs && samples.delivery && samples.pickup) return;
        }
      }
    } catch (_) {}
  }
  walk(TEMPLATES);
  return samples;
}

function inspect(path, label) {
  if (!path) return;
  console.log("\n" + "=".repeat(80));
  console.log("FILE:", label, path);
  console.log("=".repeat(80));
  const wb = XLSX.readFile(path);
  console.log("Sheets:", wb.SheetNames.join(", "));
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    const rows = Math.min(25, range.e.r - range.s.r + 1);
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", range: 0 });
    console.log("\n--- Sheet:", name, "---");
    data.slice(0, rows).forEach((row, i) => {
      const line = row.map((c) => String(c ?? "").slice(0, 40)).join(" | ");
      if (line.trim()) console.log(i + 1, line);
    });
  }
}

const samples = findSamples();
console.log("Found samples:", samples);

inspect(samples.fs, "FULL SERVICE");
inspect(samples.delivery, "DELIVERY");
inspect(samples.pickup, "PICK UP");
