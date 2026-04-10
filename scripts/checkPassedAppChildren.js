const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const LEG = "tbl0aN33DGG6R1sPZ";
const ML = "tbl6gXRT2FPpTdf0J";
const SHADOW = "Event Menu (SHADOW SYSTEM)";

async function run() {
  // Get sample passed app items from shadow table
  const sp = new URLSearchParams();
  sp.set("filterByFormula", '{Section}="Passed Appetizers"');
  sp.set("pageSize", "10");
  const sr = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(SHADOW)}?${sp}`, {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  const sd = await sr.json();
  
  const catalogIds = new Set();
  for (const r of sd.records || []) {
    const ci = r.fields["Catalog Item"];
    const id = Array.isArray(ci) ? ci[0] : ci;
    if (id) catalogIds.add(typeof id === "string" ? id : id.id);
  }
  console.log(`Sample Passed App catalog IDs: ${[...catalogIds].join(", ")}\n`);

  for (const id of catalogIds) {
    // Try legacy first
    const lp = new URLSearchParams();
    lp.set("filterByFormula", `RECORD_ID()='${id}'`);
    lp.set("returnFieldsByFieldId", "true");
    lp.append("fields[]", "fldW5gfSlHRTl01v1");
    lp.append("fields[]", "fldIu6qmlUwAEn2W9");
    const lr = await fetch(`https://api.airtable.com/v0/${BASE}/${LEG}?${lp}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    const ld = await lr.json();
    const lrec = (ld.records || [])[0];
    
    if (lrec) {
      const name = lrec.fields["fldW5gfSlHRTl01v1"] || "(no name)";
      const children = lrec.fields["fldIu6qmlUwAEn2W9"] || [];
      console.log(`LEGACY: ${id} = "${name}", ${children.length} children: ${JSON.stringify(children)}`);
      
      // Fetch child names if any
      if (children.length > 0) {
        const childIds = children.filter(c => typeof c === "string" && c.startsWith("rec"));
        for (const cid of childIds) {
          const cp = new URLSearchParams();
          cp.set("filterByFormula", `RECORD_ID()='${cid}'`);
          cp.set("returnFieldsByFieldId", "true");
          cp.append("fields[]", "fldW5gfSlHRTl01v1");
          const cr = await fetch(`https://api.airtable.com/v0/${BASE}/${LEG}?${cp}`, {
            headers: { Authorization: `Bearer ${API_KEY}` }
          });
          const cd = await cr.json();
          const crec = (cd.records || [])[0];
          const cname = crec ? (crec.fields["fldW5gfSlHRTl01v1"] || "(no name)") : "DELETED";
          console.log(`  child ${cid} = "${cname}"`);
        }
      }
    } else {
      // Try Menu_Lab
      const mp = new URLSearchParams();
      mp.set("filterByFormula", `RECORD_ID()='${id}'`);
      mp.set("returnFieldsByFieldId", "true");
      mp.append("fields[]", "fldpbzDFSg9sYeexU");
      mp.append("fields[]", "fldDDfLJTI6BK1zKd");
      const mr = await fetch(`https://api.airtable.com/v0/${BASE}/${ML}?${mp}`, {
        headers: { Authorization: `Bearer ${API_KEY}` }
      });
      const md = await mr.json();
      const mrec = (md.records || [])[0];
      if (mrec) {
        console.log(`MENU_LAB: ${id} = "${mrec.fields["fldpbzDFSg9sYeexU"]}", children: ${JSON.stringify(mrec.fields["fldDDfLJTI6BK1zKd"] || [])}`);
      } else {
        console.log(`NOT FOUND: ${id}`);
      }
    }
    console.log("");
  }
}

run().catch(console.error);
