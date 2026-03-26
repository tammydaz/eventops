import "dotenv/config";

const base = process.env.AIRTABLE_BASE_ID;
const key = process.env.AIRTABLE_API_KEY?.trim();
const table = process.env.VITE_AIRTABLE_MENU_ITEMS_TABLE?.trim() || "tbl0aN33DGG6R1sPZ";
const CHILD = "fldIu6qmlUwAEn2W9";
const DESC = "fldQ83gpgOmMxNMQw";
const ITEM = "fldW5gfSlHRTl01v1";
const CLIENT_DESC = "fldtN2hxy9TS559Rm"; // Description/Client Facing
const PRINT_LINE = "fld3yFasXPIoo6MO3"; // Print Line (formula)

const recId = process.argv[2] || "recLYTCqkmX77u5qI";

if (!base || !key) {
  console.error("Missing AIRTABLE_BASE_ID or AIRTABLE_API_KEY");
  process.exit(1);
}

const p = new URLSearchParams({
  filterByFormula: `RECORD_ID()='${recId}'`,
  maxRecords: "1",
  returnFieldsByFieldId: "true",
});
p.append("fields[]", CHILD);
p.append("fields[]", DESC);
p.append("fields[]", ITEM);
p.append("fields[]", CLIENT_DESC);
p.append("fields[]", PRINT_LINE);

const r = await fetch(
  `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}?${p}`,
  { headers: { Authorization: `Bearer ${key}` } }
);
const j = await r.json();
if (!r.ok) {
  console.error(JSON.stringify(j, null, 2));
  process.exit(1);
}

const f = j.records?.[0]?.fields || {};
const itemName = typeof f[ITEM] === "string" ? f[ITEM] : "";
const descRaw = f[DESC];
const parentLabel =
  typeof descRaw === "string"
    ? descRaw
    : descRaw && typeof descRaw === "object" && "name" in descRaw
      ? String(descRaw.name)
      : itemName || recId;

const childIds = Array.isArray(f[CHILD])
  ? f[CHILD].filter((x) => typeof x === "string" && x.startsWith("rec"))
  : [];

const names = {};
for (let i = 0; i < childIds.length; i += 10) {
  const chunk = childIds.slice(i, i + 10);
  const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
  const p2 = new URLSearchParams({
    filterByFormula: formula,
    returnFieldsByFieldId: "true",
    pageSize: "100",
  });
  p2.append("fields[]", DESC);
  p2.append("fields[]", ITEM);
  const r2 = await fetch(
    `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}?${p2}`,
    { headers: { Authorization: `Bearer ${key}` } }
  );
  const j2 = await r2.json();
  for (const rec of j2.records || []) {
    const fr = rec.fields;
    const dn = fr[DESC];
    const display =
      typeof dn === "string"
        ? dn
        : dn && typeof dn === "object" && "name" in dn
          ? String(dn.name)
          : typeof fr[ITEM] === "string"
            ? fr[ITEM]
            : rec.id;
    names[rec.id] = display;
  }
}

const choicesInOrder = childIds.map((id) => names[id] || id);

console.log(
  JSON.stringify(
    {
      parent: parentLabel.trim(),
      itemName: itemName.trim(),
      childCount: childIds.length,
      choicesInOrder,
      clientFacingDescription: typeof f[CLIENT_DESC] === "string" ? f[CLIENT_DESC].trim() : f[CLIENT_DESC],
      cookBookPrintLine: f[PRINT_LINE],
    },
    null,
    2
  )
);
