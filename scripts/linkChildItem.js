/**
 * Link a Child Item (sauce) to a parent Menu Item.
 * Usage: node scripts/linkChildItem.js <parentRecordId> <childRecordId>
 *
 * Example: node scripts/linkChildItem.js recgG9CJd6JIL1fLu recqIyjOtYWjk0UnB
 */
import "dotenv/config";

const apiKey = process.env.VITE_AIRTABLE_API_KEY?.trim();
const baseId = process.env.VITE_AIRTABLE_BASE_ID?.trim();
const menuTable = process.env.VITE_AIRTABLE_MENU_ITEMS_TABLE?.trim() || "tbl0aN33DGG6R1sPZ";
const childItemsFieldId = "fldIu6qmlUwAEn2W9";

const [parentId, childId] = process.argv.slice(2);
if (!parentId || !childId) {
  console.error("Usage: node scripts/linkChildItem.js <parentRecordId> <childRecordId>");
  console.error("Example: node scripts/linkChildItem.js recgG9CJd6JIL1fLu recqIyjOtYWjk0UnB");
  process.exit(1);
}

if (!apiKey || !baseId) {
  console.error("❌ Set VITE_AIRTABLE_API_KEY and VITE_AIRTABLE_BASE_ID in .env");
  process.exit(1);
}

const url = `https://api.airtable.com/v0/${baseId}/${menuTable}/${parentId}`;

const res = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    fields: {
      [childItemsFieldId]: [childId],
    },
  }),
});

if (!res.ok) {
  const err = await res.text();
  console.error("❌ Failed:", res.status, err);
  process.exit(1);
}

const data = await res.json();
console.log("✅ Linked Chipotle Aioli to Mini Crab Cakes");
console.log("   Parent:", parentId, "→ Child:", childId);
