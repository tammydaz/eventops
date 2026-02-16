/**
 * Create 5 Complete Test Events - SIMPLIFIED
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const API_KEY = process.env.VITE_AIRTABLE_API_KEY;
const BASE_ID = process.env.VITE_AIRTABLE_BASE_ID;
const TABLE_ID = process.env.VITE_AIRTABLE_EVENTS_TABLE;

if (!API_KEY || !BASE_ID || !TABLE_ID) {
  console.error('❌ Missing Airtable credentials in .env');
  process.exit(1);
}

// Only use fields we're 100% sure exist and are writable
const FIELD_IDS = {
  EVENT_DATE: "fldFYaE7hI27R3PsX",
  GUEST_COUNT: "fldjgqDUxVxaJ7Y9V",
  VENUE_NAME: "fldK8j9JRu0VYCFV9",
  VENUE_CITY: "fldNToCnV799eggiD",
  // VENUE_STATE has strict dropdown - skip it
  CLIENT_FIRST_NAME: "fldFAspB1ds9Yn0Kl",
  CLIENT_LAST_NAME: "fldeciZmsIY3c2T1v",
  CLIENT_EMAIL: "fldT5lcdCL5ndh84D",
  CLIENT_PHONE: "fldnw1VGIi3oXM4g3",
  DIETARY_NOTES: "fldhGj51bQQWLJSX0",
  SPECIAL_NOTES: "fldlTlYgvPTIUzzMn",
};

const testEvents = [
  {
    name: "Corporate Gala 2026",
    fields: {
      [FIELD_IDS.EVENT_DATE]: "2026-03-15",
      [FIELD_IDS.GUEST_COUNT]: 150,
      [FIELD_IDS.VENUE_NAME]: "The Grand Ballroom",
      [FIELD_IDS.VENUE_CITY]: "Charlotte",
      [FIELD_IDS.CLIENT_FIRST_NAME]: "Sarah",
      [FIELD_IDS.CLIENT_LAST_NAME]: "Johnson",
      [FIELD_IDS.CLIENT_EMAIL]: "sarah.johnson@techcorp.com",
      [FIELD_IDS.CLIENT_PHONE]: "(704) 555-0101",
      [FIELD_IDS.DIETARY_NOTES]: "3 vegan, 5 gluten-free, 2 nut allergies",
      [FIELD_IDS.SPECIAL_NOTES]: "Black and gold theme. VIP table for executives.",
    },
  },
  {
    name: "Smith Wedding Reception",
    fields: {
      [FIELD_IDS.EVENT_DATE]: "2026-04-22",
      [FIELD_IDS.GUEST_COUNT]: 200,
      [FIELD_IDS.VENUE_NAME]: "Riverside Gardens",
      [FIELD_IDS.VENUE_CITY]: "Matthews",
      [FIELD_IDS.CLIENT_FIRST_NAME]: "Emily",
      [FIELD_IDS.CLIENT_LAST_NAME]: "Smith",
      [FIELD_IDS.CLIENT_EMAIL]: "emily.smith@gmail.com",
      [FIELD_IDS.CLIENT_PHONE]: "(704) 555-0202",
      [FIELD_IDS.DIETARY_NOTES]: "7 vegetarian, 2 dairy-free",
      [FIELD_IDS.SPECIAL_NOTES]: "Outdoor ceremony 5:30pm, dinner 7pm. Blush pink & ivory.",
    },
  },
  {
    name: "Tech Startup Launch",
    fields: {
      [FIELD_IDS.EVENT_DATE]: "2026-03-08",
      [FIELD_IDS.GUEST_COUNT]: 85,
      [FIELD_IDS.VENUE_NAME]: "Innovation Hub",
      [FIELD_IDS.VENUE_CITY]: "Charlotte",
      [FIELD_IDS.CLIENT_FIRST_NAME]: "Michael",
      [FIELD_IDS.CLIENT_LAST_NAME]: "Chen",
      [FIELD_IDS.CLIENT_EMAIL]: "michael@innovatetech.io",
      [FIELD_IDS.CLIENT_PHONE]: "(704) 555-0303",
      [FIELD_IDS.DIETARY_NOTES]: "10 vegan, 5 gluten-free",
      [FIELD_IDS.SPECIAL_NOTES]: "High-energy networking event. Modern tech blue theme.",
    },
  },
  {
    name: "Anniversary - Martinez",
    fields: {
      [FIELD_IDS.EVENT_DATE]: "2026-05-10",
      [FIELD_IDS.GUEST_COUNT]: 75,
      [FIELD_IDS.VENUE_NAME]: "The Garden Terrace",
      [FIELD_IDS.VENUE_CITY]: "Waxhaw",
      [FIELD_IDS.CLIENT_FIRST_NAME]: "Carlos",
      [FIELD_IDS.CLIENT_LAST_NAME]: "Martinez",
      [FIELD_IDS.CLIENT_EMAIL]: "cmartinez@email.com",
      [FIELD_IDS.CLIENT_PHONE]: "(704) 555-0404",
      [FIELD_IDS.DIETARY_NOTES]: "1 shellfish allergy, 3 vegetarian",
      [FIELD_IDS.SPECIAL_NOTES]: "50th Wedding Anniversary! Gold and white colors.",
    },
  },
  {
    name: "Executive Board Lunch",
    fields: {
      [FIELD_IDS.EVENT_DATE]: "2026-02-28",
      [FIELD_IDS.GUEST_COUNT]: 25,
      [FIELD_IDS.VENUE_NAME]: "Executive Conference Center",
      [FIELD_IDS.VENUE_CITY]: "Charlotte",
      [FIELD_IDS.CLIENT_FIRST_NAME]: "David",
      [FIELD_IDS.CLIENT_LAST_NAME]: "Thompson",
      [FIELD_IDS.CLIENT_EMAIL]: "dthompson@financecorp.com",
      [FIELD_IDS.CLIENT_PHONE]: "(704) 555-0505",
      [FIELD_IDS.DIETARY_NOTES]: "2 pescatarian, 1 gluten-free, 1 dairy-free",
      [FIELD_IDS.SPECIAL_NOTES]: "Quarterly board meeting. Professional service required.",
    },
  },
];

async function createEvent(eventData) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      records: [{ fields: eventData.fields }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create ${eventData.name}: ${error}`);
  }

  const data = await response.json();
  return data.records[0];
}

async function main() {
  console.log('🚀 Creating 5 test events in Airtable...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const eventData of testEvents) {
    try {
      const created = await createEvent(eventData);
      console.log(`✅ Created: ${eventData.name} (${created.id})`);
      successCount++;
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ Failed: ${eventData.name}`);
      console.error(`   Error: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Created: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`\n🎉 Done! Refresh your app at http://localhost:5173/\n`);
}

main().catch(console.error);
