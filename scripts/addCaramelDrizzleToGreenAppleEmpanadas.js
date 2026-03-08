/**
 * 1. Create Caramel Drizzle Menu Item (if not exists)
 * 2. Link it to Green Apple Empanadas
 */
import "dotenv/config";

const apiKey = process.env.VITE_AIRTABLE_API_KEY?.trim();
const baseId = process.env.VITE_AIRTABLE_BASE_ID?.trim();
const menuTable = process.env.VITE_AIRTABLE_MENU_ITEMS_TABLE?.trim() || "tbl0aN33DGG6R1sPZ";

const FIELDS = {
  itemName: "fldW5gfSlHRTl01v1",
  category: "fldM7lWvjH8S0YNSX",
  childItems: "fldIu6qmlUwAEn2W9",
};

const GREEN_APPLE_EMPANADAS_ID = "rec3qRI6pLmD6irCt";

if (!apiKey || !baseId) {
  console.error("❌ Set VITE_AIRTABLE_API_KEY and VITE_AIRTABLE_BASE_ID in .env");
  process.exit(1);
}

async function findCaramelDrizzle() {
  const params = new URLSearchParams();
  params.set("filterByFormula", `{Item Name} = "Caramel Drizzle"`);
  params.set("maxRecords", "5");
  params.set("returnFieldsByFieldId", "true");
  params.append("fields[]", FIELDS.itemName);

  const res = await fetch(
    `https://api.airtable.com/v0/${baseId}/${menuTable}?${params.toString()}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  const data = await res.json();
  const exact = data.records?.find((r) => {
    const n = r.fields[FIELDS.itemName];
    return (typeof n === "string" ? n : "").trim() === "Caramel Drizzle";
  });
  return exact?.id;
}

async function createCaramelDrizzle() {
  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${menuTable}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        [FIELDS.itemName]: "Caramel Drizzle",
        [FIELDS.category]: "Component",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.id;
}

async function linkChildToParent(parentId, childId) {
  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${menuTable}/${parentId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        [FIELDS.childItems]: [childId],
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Link failed: ${res.status} ${err}`);
  }
}

async function main() {
  let caramelDrizzleId = await findCaramelDrizzle();
  if (!caramelDrizzleId) {
    console.log("Creating Caramel Drizzle...");
    caramelDrizzleId = await createCaramelDrizzle();
    console.log("✅ Created Caramel Drizzle:", caramelDrizzleId);
  } else {
    console.log("Caramel Drizzle exists:", caramelDrizzleId);
  }

  console.log("Linking Caramel Drizzle to Green Apple Empanadas...");
  await linkChildToParent(GREEN_APPLE_EMPANADAS_ID, caramelDrizzleId);
  console.log("✅ Done. Green Apple Empanadas now has Caramel Drizzle.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
