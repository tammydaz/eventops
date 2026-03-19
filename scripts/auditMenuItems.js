import https from 'https';

const API_KEY = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const BASE_ID = 'appMLgdc3QpV2pwoz';
const TABLE_ID = 'tbl0aN33DGG6R1sPZ';

// Field IDs
const ITEM_NAME   = 'fldW5gfSlHRTl01v1';
const CATEGORY    = 'fldM7lWvjH8S0YNSX';
const SERVICE_TYPE = 'fld2EhDP5GRalZJzQ';

// What the picker needs — from menuCategories.ts (keep in sync)
const VALID_CATEGORIES = new Set([
  // passed / presented
  'Passed App','Presented App','Appetizer','Passed','App',
  // buffet metal
  'Buffet Metal','Buffet','Buffet Item','Side',
  'Entrée','Protein (Entrée)','Pasta (Entrée)','Pasta (Side)','Starch (Side)','Vegetable (Side)',
  // buffet china
  'Buffet China','Salad','Bread',
  // desserts
  'Dessert','Dessert/Metal','Dessert/China','Dessert (Display)','Dessert (Individual)',
  // stations
  'Station','Stations','Station Item',
  // deli
  'Deli/Sandwhiches','Deli/Breads','Deli/Sandwiches','Deli',
  // room temp
  'Room Temp Display','Display',
  // beverages
  'Beverage','Beverages','Drink','Bar / Beverage Component',
]);

function fetchPage(offset) {
  return new Promise((resolve) => {
    const filter = encodeURIComponent('NOT({Item Name}="")');
    let path = `/v0/${BASE_ID}/${TABLE_ID}?pageSize=100&returnFieldsByFieldId=true&filterByFormula=${filter}`;
    path += `&fields[]=${ITEM_NAME}&fields[]=${CATEGORY}&fields[]=${SERVICE_TYPE}`;
    if (offset) path += `&offset=${offset}`;
    const options = { hostname: 'api.airtable.com', path, method: 'GET', headers: { Authorization: `Bearer ${API_KEY}` } };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', resolve);
    req.end();
  });
}

(async () => {
  let all = [];
  let offset = null;
  do {
    const r = await fetchPage(offset);
    if (r.records) all = all.concat(r.records);
    offset = r.offset || null;
  } while (offset);

  const visible = [];
  const noCategory = [];
  const hasCategoryInvalid = [];

  all.forEach((rec) => {
    const name = rec.fields[ITEM_NAME] || '';
    const cat  = rec.fields[CATEGORY]  || '';
    const svc  = rec.fields[SERVICE_TYPE] || '';
    if (!name.trim()) return;

    const catStr = typeof cat === 'object' && cat.name ? cat.name : String(cat);
    const isVisible = VALID_CATEGORIES.has(catStr);

    if (isVisible) {
      visible.push({ name, cat: catStr, svc });
    } else if (!catStr || catStr === '') {
      noCategory.push({ id: rec.id, name, svc });
    } else {
      hasCategoryInvalid.push({ id: rec.id, name, cat: catStr, svc });
    }
  });

  console.log('=== MENU ITEMS AUDIT ===\n');
  console.log(`TOTAL NAMED ITEMS: ${all.length}`);
  console.log(`  ✅ VISIBLE in picker (valid Category): ${visible.length}`);
  console.log(`  ❌ NO CATEGORY (completely invisible): ${noCategory.length}`);
  console.log(`  ⚠️  Has category but NOT in CATEGORY_MAP: ${hasCategoryInvalid.length}`);

  console.log('\n\n=== ITEMS WITH WRONG/UNKNOWN CATEGORY (need reassignment) ===');
  const byWrongCat = {};
  hasCategoryInvalid.forEach(({ name, cat }) => {
    if (!byWrongCat[cat]) byWrongCat[cat] = [];
    byWrongCat[cat].push(name);
  });
  Object.entries(byWrongCat).sort().forEach(([cat, names]) => {
    console.log(`\n  Category: "${cat}" (${names.length} items):`);
    names.sort().forEach(n => console.log(`    - ${n}`));
  });

  console.log('\n\n=== ITEMS WITH NO CATEGORY (need category assigned) ===');
  noCategory.sort((a,b) => a.name.localeCompare(b.name)).forEach(({ name }) => {
    console.log(`  - ${name}`);
  });
})();
