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

async function deleteBatch(ids) {
  let url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(SHADOW)}?`;
  ids.forEach((id, i) => { url += `${i > 0 ? "&" : ""}records[]=${id}`; });
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  const data = await res.json();
  if (data.error) { console.error("DELETE Error:", JSON.stringify(data.error)); return false; }
  return true;
}

(async () => {
  const records = await fetchAll();
  console.log(`Total shadow rows: ${records.length}`);

  // Group by event
  const byEvent = {};
  for (const r of records) {
    const f = r.fields || {};
    const events = Array.isArray(f.Event) ? f.Event : (f.Event ? [f.Event] : []);
    const catalogRaw = f["Catalog Item"];
    const catalogItem = Array.isArray(catalogRaw) ? catalogRaw[0] : catalogRaw;
    const catalogId = typeof catalogItem === "string" ? catalogItem : (catalogItem?.id || null);
    const section = f.Section || "";
    const childOverrides = f["Child Overrides"] || null;

    for (const evRaw of events) {
      const evId = typeof evRaw === "string" ? evRaw : (evRaw?.id || String(evRaw));
      if (!byEvent[evId]) byEvent[evId] = [];
      byEvent[evId].push({
        rowId: r.id,
        section,
        catalogId,
        hasChildOverrides: !!childOverrides,
      });
    }
  }

  // Also collect rows with no catalog item or no event (orphans)
  const orphanIds = [];
  for (const r of records) {
    const f = r.fields || {};
    const events = Array.isArray(f.Event) ? f.Event : (f.Event ? [f.Event] : []);
    const catalogRaw = f["Catalog Item"];
    const catalogItem = Array.isArray(catalogRaw) ? catalogRaw[0] : catalogRaw;
    const catalogId = typeof catalogItem === "string" ? catalogItem : (catalogItem?.id || null);

    if (events.length === 0 || !catalogId) {
      orphanIds.push(r.id);
    }
  }

  // Find duplicate rows within each event (same section + catalogId)
  const toDelete = [];
  for (const [eventId, rows] of Object.entries(byEvent)) {
    const seen = {};
    for (const row of rows) {
      if (!row.catalogId) continue;
      const key = `${row.section}|${row.catalogId}`;
      if (!seen[key]) {
        seen[key] = row;
      } else {
        // Keep the one with childOverrides, delete the other
        if (row.hasChildOverrides && !seen[key].hasChildOverrides) {
          toDelete.push(seen[key].rowId);
          seen[key] = row;
        } else {
          toDelete.push(row.rowId);
        }
      }
    }
  }

  console.log(`Orphan rows (no event or no catalog): ${orphanIds.length}`);
  console.log(`Duplicate shadow rows to delete: ${toDelete.length}`);

  const allToDelete = [...new Set([...orphanIds, ...toDelete])];
  console.log(`Total rows to delete: ${allToDelete.length}`);

  if (allToDelete.length === 0) {
    console.log("Nothing to clean up!");
    return;
  }

  // Delete in batches of 10
  let deleted = 0;
  for (let i = 0; i < allToDelete.length; i += 10) {
    const batch = allToDelete.slice(i, i + 10);
    const ok = await deleteBatch(batch);
    if (ok) deleted += batch.length;
    process.stdout.write(ok ? "." : "X");
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(` done`);
  console.log(`\n=== CLEANUP COMPLETE ===`);
  console.log(`Deleted orphans: ${orphanIds.length}`);
  console.log(`Deleted duplicates: ${toDelete.length}`);
  console.log(`Total deleted: ${deleted}`);
  console.log(`Remaining: ~${records.length - deleted} rows`);
})().catch(console.error);
