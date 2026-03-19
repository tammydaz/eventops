// Deletes the "Item Name" junk/test record from Menu Items table
import https from 'https';

const API_KEY = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const BASE_ID = 'appMLgdc3QpV2pwoz';
const TABLE_ID = 'tbl0aN33DGG6R1sPZ';

const ITEM_NAME = 'fldW5gfSlHRTl01v1';
const CATEGORY  = 'fldM7lWvjH8S0YNSX';

function airtableRequest(method, path, body) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.airtable.com',
      path,
      method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', resolve);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  // First find the junk record
  const filter = encodeURIComponent(`{${ITEM_NAME}}="Item Name"`);
  const path = `/v0/${BASE_ID}/${TABLE_ID}?returnFieldsByFieldId=true&filterByFormula=${filter}&fields[]=${ITEM_NAME}&fields[]=${CATEGORY}`;
  const result = await airtableRequest('GET', path, null);
  
  if (!result.records || result.records.length === 0) {
    console.log('No junk record found — already clean.');
    return;
  }

  console.log(`Found ${result.records.length} junk record(s):`);
  for (const rec of result.records) {
    console.log(`  ID: ${rec.id}, Name: ${rec.fields[ITEM_NAME]}, Category: ${rec.fields[CATEGORY]}`);
    const del = await airtableRequest('DELETE', `/v0/${BASE_ID}/${TABLE_ID}/${rec.id}`, null);
    console.log(`  Deleted: ${del.deleted ? 'YES' : 'NO'}`);
  }
})();
