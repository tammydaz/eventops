const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "appMLgdc3QpV2pwoz";
const LEG = "tbl0aN33DGG6R1sPZ";

const NC_LEGACY_CHILDREN = [
  "rec4jhVa1zxC7jnzR", "recV0xitQPeLpZBhu", "recSAcRbXPheZVaw0",
  "recorxRJksPXPUFrZ", "rec0Kv81D2Um60uwj", "rectjiGZuy4TLI8rd",
  "recl8kqJm17XXspKh", "rec6V3F8OEuwyeEHz", "recKn7yjZZ6oY6efV",
  "reckihGf8zg3yQVUw"
];

async function fetchNames(table, ids, labelField) {
  const result = {};
  for (let i = 0; i < ids.length; i += 10) {
    const chunk = ids.slice(i, i + 10);
    const formula = `OR(${chunk.map(id => `RECORD_ID()='${id}'`).join(",")})`;
    const params = new URLSearchParams();
    params.set("filterByFormula", formula);
    params.set("returnFieldsByFieldId", "true");
    params.append("fields[]", labelField);
    const res = await fetch(`https://api.airtable.com/v0/${BASE}/${table}?${params}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    const data = await res.json();
    for (const r of data.records || []) {
      result[r.id] = r.fields[labelField] || "(no name)";
    }
  }
  return result;
}

(async () => {
  console.log("=== Checking Nicholas Continental legacy children ===");
  const names = await fetchNames(LEG, NC_LEGACY_CHILDREN, "fldW5gfSlHRTl01v1");
  
  let missing = 0;
  for (const id of NC_LEGACY_CHILDREN) {
    const name = names[id];
    if (name) {
      console.log(`  ✓ ${id} = ${name}`);
    } else {
      console.log(`  ✗ ${id} = MISSING (was likely deleted)`);
      missing++;
    }
  }
  console.log(`\n${missing} of ${NC_LEGACY_CHILDREN.length} children missing`);
  
  // Also check the Parmesan Crusted Chicken children
  const PCC_CHILDREN = ["recjAIW6nBAQujgNS", "recmxpcfqpaeGBbC6"];
  console.log("\n=== Checking Parmesan Crusted Chicken legacy children ===");
  const pccNames = await fetchNames(LEG, PCC_CHILDREN, "fldW5gfSlHRTl01v1");
  for (const id of PCC_CHILDREN) {
    const name = pccNames[id];
    if (name) {
      console.log(`  ✓ ${id} = ${name}`);
    } else {
      console.log(`  ✗ ${id} = MISSING`);
    }
  }
})().catch(console.error);
