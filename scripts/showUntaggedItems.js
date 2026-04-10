const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const LEGACY = "tbl0aN33DGG6R1sPZ";
const NAME_FIELD = "fldW5gfSlHRTl01v1";
const CAT_FIELD = "fldM7lWvjH8S0YNSX";
const ML = "tbl6gXRT2FPpTdf0J";
const ML_NAME = "fldpbzDFSg9sYeexU";
const ML_DISPLAY_TYPE = "flddOn21WHp7XEaP9";
const ML_EXEC_TYPE = "fldnP7tCisqdDkaOI";

async function fetchAllLegacy() {
  const all = [];
  let offset;
  do {
    const p = new URLSearchParams();
    p.set("pageSize", "100");
    p.set("returnFieldsByFieldId", "true");
    p.append("fields[]", NAME_FIELD);
    p.append("fields[]", CAT_FIELD);
    if (offset) p.set("offset", offset);
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${LEGACY}?${p}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    const d = await r.json();
    if (!d.records) break;
    all.push(...d.records);
    offset = d.offset;
  } while (offset);
  return all;
}

async function fetchAllMenuLab() {
  const all = [];
  let offset;
  do {
    const p = new URLSearchParams();
    p.set("pageSize", "100");
    p.set("returnFieldsByFieldId", "true");
    p.append("fields[]", ML_NAME);
    p.append("fields[]", ML_DISPLAY_TYPE);
    p.append("fields[]", ML_EXEC_TYPE);
    if (offset) p.set("offset", offset);
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${ML}?${p}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    const d = await r.json();
    if (!d.records) break;
    all.push(...d.records);
    offset = d.offset;
  } while (offset);
  return all;
}

(async () => {
  const [legacy, menuLab] = await Promise.all([fetchAllLegacy(), fetchAllMenuLab()]);

  // Build Menu_Lab name -> tags lookup
  const mlByName = {};
  for (const r of menuLab) {
    const name = (r.fields[ML_NAME] || "").trim().toLowerCase();
    if (!name) continue;
    const dt = r.fields[ML_DISPLAY_TYPE] || [];
    const et = r.fields[ML_EXEC_TYPE] || [];
    const dtArr = Array.isArray(dt) ? dt : [dt];
    const etArr = Array.isArray(et) ? et : [et];
    mlByName[name] = { displayType: dtArr, execType: etArr };
  }

  // Find untagged legacy items and check if Menu_Lab has tags for them
  const untagged = legacy.filter(r => {
    const cat = r.fields[CAT_FIELD];
    return !cat || (typeof cat === "string" && cat.trim() === "");
  });

  // How many have Menu_Lab tags that could tell us what Category they should be?
  let hasMLTags = 0;
  let noMLTags = 0;
  const tagSuggestions = {};

  for (const r of untagged) {
    const name = (r.fields[NAME_FIELD] || "").trim().toLowerCase();
    const ml = mlByName[name];
    if (ml && (ml.displayType.length > 0 || ml.execType.length > 0)) {
      hasMLTags++;
      const key = `DT:${ml.displayType.join(",")} | ET:${ml.execType.join(",")}`;
      tagSuggestions[key] = (tagSuggestions[key] || 0) + 1;
    } else {
      noMLTags++;
    }
  }

  console.log(`Untagged legacy items: ${untagged.length}`);
  console.log(`  Have Menu_Lab tags (can auto-fix): ${hasMLTags}`);
  console.log(`  No Menu_Lab tags either: ${noMLTags}`);
  console.log(`\nMenu_Lab tag combinations for fixable items:`);
  for (const [tags, count] of Object.entries(tagSuggestions).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count}x ${tags}`);
  }
})().catch(console.error);
