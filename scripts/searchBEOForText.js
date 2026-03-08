/**
 * Search all BEO xlsx files for a text string
 * Run: node scripts/searchBEOForText.js "mezzanine platter"
 */
import XLSX from "xlsx";
import { readdirSync } from "fs";
import { join } from "path";

const BEO_TEMPLATES_PATH = join(process.cwd(), "beo templates");
const searchTerm = (process.argv[2] || "mezzanine platter").toLowerCase();

function findXlsxFiles(dir, results = []) {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        findXlsxFiles(fullPath, results);
      } else if (entry.name.endsWith(".xlsx")) {
        results.push(fullPath);
      }
    }
  } catch (e) {
    console.warn("Skip dir:", dir, e.message);
  }
  return results;
}

function searchFile(filePath) {
  const matches = [];
  try {
    const workbook = XLSX.readFile(filePath);
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      data.forEach((row, rowIdx) => {
        const rowStr = Array.isArray(row)
          ? row.map((c) => (c != null ? String(c) : "")).join(" ")
          : String(row);
        if (rowStr.toLowerCase().includes(searchTerm)) {
          matches.push({ sheet: sheetName, row: rowIdx + 1, text: rowStr.trim().slice(0, 120) });
        }
      });
    }
  } catch (e) {
    return { error: e.message };
  }
  return matches;
}

const files = findXlsxFiles(BEO_TEMPLATES_PATH);
console.log(`Searching for "${searchTerm}" in ${files.length} xlsx files...\n`);

let found = 0;
for (const filePath of files) {
  const relPath = filePath.replace(BEO_TEMPLATES_PATH, "").replace(/^[/\\]/, "");
  const result = searchFile(filePath);
  if (result.error) {
    console.log("ERROR:", relPath, result.error);
  } else if (result.length > 0) {
    found++;
    console.log("FOUND in:", relPath);
    result.forEach((m) => {
      console.log(`  Sheet: ${m.sheet}, Row ${m.row}: ${m.text}`);
    });
    console.log("");
  }
}

console.log(`\nTotal: ${found} file(s) contain "${searchTerm}"`);
