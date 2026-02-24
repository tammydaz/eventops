// 🔥 FOODWERX EVENTOPS – Airtable API Wrapper
// Simplest possible version. No React. No errors. No guessing.

const AIRTABLE_API_KEY =
  (import.meta.env.VITE_AT_API || import.meta.env.VITE_AIRTABLE_API_KEY)?.trim() || "";
const BASE_ID =
  (import.meta.env.VITE_AT_BASE || import.meta.env.VITE_AIRTABLE_BASE)?.trim() || "";
const TABLE = (import.meta.env.VITE_AT_TABLE)?.trim() || "Events"; // Your Events table
const VIEW = (import.meta.env.VITE_AT_VIEW)?.trim() || "Grid view";
const VIEW_ID = import.meta.env.VITE_AT_VIEW_ID || "";
const MENU_TABLE = import.meta.env.VITE_AT_MENU_TABLE || "Menu Items";

async function api(path, method = "GET", body = null) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json();
  if (!res.ok || data?.error) {
    const message = data?.error?.message || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return data;
}

// ------------------------------------------------------
// LIST EVENTS
// ------------------------------------------------------
export async function listEvents() {
  const viewParam = VIEW_ID
    ? `view=${encodeURIComponent(VIEW_ID)}`
    : `view=${encodeURIComponent(VIEW)}`;
  const returnByIdParam = "&returnFieldsByFieldId=true";
  const data = await api(
    `/${TABLE}?maxRecords=200&${viewParam}&cellFormat=json${returnByIdParam}`
  );

  if (!data.records) return [];

  // Map into a clean JS object for the frontend
  return data.records.map((r) => ({
    id: r.id,
    ...r.fields,
  }));
}

export async function listMenuItems() {
  const data = await api(
    `/${MENU_TABLE}?maxRecords=1000&cellFormat=json`
  );

  if (!data.records) return [];
  return data.records.map((r) => ({
    id: r.id,
    fields: r.fields || {},
  }));
}

// ------------------------------------------------------
// UPDATE A SINGLE EVENT
// ------------------------------------------------------
const COMPUTED_FIELDS = [
  "fldZuHc9D29Wcj60h",  // EVENT_NAME - Formula
  "fld4YxQOjzPyyBIHL",  // CLIENT_BUSINESS_NAME - Formula
  "fldOKQTp8Zf6a462f",  // VENUE_FULL_ADDRESS (Venue Full Address Clean) - Formula
  "flddestyZNoX9sKGE",  // EVENT_LOCATION_FINAL_PRINT - Formula
  "fldJsajSl1l6marzw",  // PRINT_VENUE_ADDRESS (VenuePrint) - Formula - THE BUG!
];

export async function updateEvent(recordId, fields) {
  // Debug: Log what's being sent BEFORE filtering
  console.log("🔍 updateEvent (legacy) - BEFORE filter:", JSON.stringify(fields, null, 2));

  const filtered = {};
  const blocked = [];
  
  for (const [key, value] of Object.entries(fields)) {
    if (!COMPUTED_FIELDS.includes(key)) {
      filtered[key] = value;
    } else {
      blocked.push(key);
    }
  }
  
  // Debug: Log what was blocked and what will be sent
  if (blocked.length > 0) {
    console.warn("⚠️ BLOCKED computed fields (legacy):", blocked);
  }
  console.log("✅ updateEvent (legacy) - AFTER filter:", JSON.stringify(filtered, null, 2));
  
  if (Object.keys(filtered).length === 0) {
    console.log("⏭️ No fields to update after filtering (legacy)");
    return { records: [] };
  }
  
  return api(`/${TABLE}`, "PATCH", {
    records: [{ id: recordId, fields: filtered }],
    typecast: true,
  });
}

// ------------------------------------------------------
// SNAPSHOT (for BEO Ready)
// ------------------------------------------------------
export async function snapshotEvent(recordId, fields) {
  return updateEvent(recordId, fields);
}
