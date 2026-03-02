/**
 * Analyze delivery BEO xlsx files to extract structure and common patterns
 */
import XLSX from "xlsx";
import { readdirSync, statSync } from "fs";
import { join } from "path";

const BEO_TEMPLATES_PATH = join(process.cwd(), "beo templates");
const MAX_FILES = 15; // Analyze first N delivery files

function findDeliveryFiles(dir, results = []) {
  if (results.length >= MAX_FILES) return results;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        findDeliveryFiles(fullPath, results);
      } else if (entry.name.endsWith(".xlsx") && entry.name.toUpperCase().includes("DELIVERY")) {
        results.push(fullPath);
        if (results.length >= MAX_FILES) return results;
      }
    }
  } catch (e) {
    console.warn("Skip dir:", dir, e.message);
  }
  return results;
}

function analyzeFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheets = workbook.SheetNames;
    const result = { file: filePath.split(/[/\\]/).pop(), sheets: [] };
    for (const sheetName of sheets) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      const rows = data.length;
      const cols = data[0]?.length || 0;
      const sample = data.slice(0, 25).map((r) => (Array.isArray(r) ? r.slice(0, 12) : r));
      result.sheets.push({
        name: sheetName,
        rows,
        cols,
        sample,
      });
    }
    return result;
  } catch (e) {
    return { file: filePath.split(/[/\\]/).pop(), error: e.message };
  }
}

console.log("Searching for delivery BEO files in:", BEO_TEMPLATES_PATH);
const files = findDeliveryFiles(BEO_TEMPLATES_PATH);
console.log("Found", files.length, "delivery files\n");

const analyses = files.map(analyzeFile);

for (const a of analyses) {
  if (a.error) {
    console.log("---", a.file, "ERROR:", a.error);
    continue;
  }
  console.log("====", a.file, "====");
  for (const s of a.sheets) {
    console.log("\nSheet:", s.name, `(${s.rows} rows x ${s.cols} cols)`);
    console.log("Sample (first 25 rows, 12 cols):");
    s.sample.forEach((row, i) => {
      const line = Array.isArray(row) ? row.map((c) => (c != null ? String(c).slice(0, 25) : "")).join(" | ") : row;
      if (line.trim()) console.log(`  ${i}: ${line}`);
    });
  }
  console.log("\n");
}
