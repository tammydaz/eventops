const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const SHADOW = "Event Menu (SHADOW SYSTEM)";

async function fetchAll() {
  const records = [];
  let offset = null;
  do {
    const params = new URLSearchParams();
    params.set("pageSize", "100");
    if (offset) params.set("offset", offset);
    const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(SHADOW)}?${params}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
    const data = await res.json();
    if (data.error) { console.error("API Error:", data.error); return records; }
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return records;
}

(async () => {
  const records = await fetchAll();
  console.log(`Total shadow rows: ${records.length}\n`);

  // Group by Event
  const byEvent = {};
  for (const r of records) {
    const f = r.fields || {};
    const events = Array.isArray(f.Event) ? f.Event : (f.Event ? [f.Event] : []);
    const catalogItem = Array.isArray(f["Catalog Item"]) ? f["Catalog Item"] : (f["Catalog Item"] ? [f["Catalog Item"]] : []);
    const section = f.Section || "(none)";
    
    for (const evId of events) {
      const eid = typeof evId === "string" ? evId : (evId && evId.id ? evId.id : String(evId));
      if (!byEvent[eid]) byEvent[eid] = [];
      byEvent[eid].push({
        rowId: r.id,
        section,
        catalogItemId: catalogItem[0] || "(none)",
        childOverrides: f["Child Overrides"] ? "yes" : "no",
      });
    }
  }

  // Show events with duplicate catalog items
  for (const [eventId, rows] of Object.entries(byEvent)) {
    const seen = {};
    const dups = [];
    for (const row of rows) {
      const key = `${row.section}|${row.catalogItemId}`;
      if (seen[key]) {
        dups.push({ ...row, dupOf: seen[key].rowId });
      } else {
        seen[key] = row;
      }
    }
    if (dups.length > 0) {
      console.log(`Event ${eventId}: ${rows.length} rows, ${dups.length} duplicates`);
      for (const d of dups) {
        console.log(`  DUP: ${d.rowId} section=${d.section} catalog=${d.catalogItemId} (dup of ${d.dupOf})`);
      }
    }
  }

  // Show all rows for each event
  console.log("\n=== All shadow rows by event ===");
  for (const [eventId, rows] of Object.entries(byEvent)) {
    console.log(`\nEvent ${eventId}: ${rows.length} rows`);
    for (const row of rows) {
      console.log(`  ${row.rowId} | ${row.section} | catalog=${row.catalogItemId} | childOverrides=${row.childOverrides}`);
    }
  }
})().catch(console.error);
