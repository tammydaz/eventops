#!/usr/bin/env node

/**
 * Airtable Schema Management Script
 * 
 * Usage:
 *   node scripts/updateAirtableSchema.js read
 *   node scripts/updateAirtableSchema.js add "Field Name" "fieldType"
 * 
 * Or via npm:
 *   npm run schema read
 *   npm run schema add "Field Name" "fieldType"
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID;
const AIRTABLE_EVENTS_TABLE_ID = process.env.VITE_AIRTABLE_EVENTS_TABLE;
/** Event Menu (SHADOW SYSTEM) table — ID or name. Used for ensure-event-menu-section. */
const EVENT_MENU_SHADOW_TABLE = process.env.VITE_AIRTABLE_EVENT_MENU_SHADOW_TABLE || 'Event Menu (SHADOW SYSTEM)';
/** Menu Items table ID — used for DELI (Full Service) linked field. Must match your base. */
const MENU_ITEMS_TABLE_ID = process.env.VITE_AIRTABLE_MENU_ITEMS_TABLE || 'tbl0aN33DGG6R1sPZ';

// Validate environment variables
if (!AIRTABLE_API_KEY) {
  console.error('❌ Error: AIRTABLE_API_KEY or VITE_AIRTABLE_API_KEY must be set in .env');
  process.exit(1);
}

if (!AIRTABLE_BASE_ID) {
  console.error('❌ Error: VITE_AIRTABLE_BASE_ID is not set in .env file');
  process.exit(1);
}

// EVENTS_TABLE only required for read/add commands, not for export

const BASE_URL = 'https://api.airtable.com/v0/meta';

/**
 * Make authenticated request to Airtable Metadata API
 */
async function airtableMetaRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airtable API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Read and display the schema for the base
 */
async function readSchema() {
  console.log('\n📖 Reading Airtable Schema...\n');
  console.log(`Base ID: ${AIRTABLE_BASE_ID}`);
  console.log(`Events Table ID: ${AIRTABLE_EVENTS_TABLE_ID}\n`);

  try {
    // Fetch base schema
    const data = await airtableMetaRequest(`/bases/${AIRTABLE_BASE_ID}/tables`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ALL TABLES IN BASE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    data.tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.name}`);
      console.log(`   ID: ${table.id}`);
      console.log(`   Fields: ${table.fields.length}`);
      console.log('');
    });

    // Find Events table
    const eventsTable = data.tables.find(t => t.id === AIRTABLE_EVENTS_TABLE_ID);

    if (!eventsTable) {
      console.error(`❌ Events table (${AIRTABLE_EVENTS_TABLE_ID}) not found in base`);
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 EVENTS TABLE FIELDS (${eventsTable.name})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    eventsTable.fields.forEach((field, index) => {
      console.log(`${index + 1}. ${field.name}`);
      console.log(`   ID: ${field.id}`);
      console.log(`   Type: ${field.type}`);
      if (field.options) {
        console.log(`   Options: ${JSON.stringify(field.options, null, 2).split('\n').join('\n   ')}`);
      }
      console.log('');
    });

    console.log(`✅ Total fields in Events table: ${eventsTable.fields.length}\n`);

  } catch (error) {
    console.error('❌ Error reading schema:', error.message);
    process.exit(1);
  }
}

/**
 * Add a new field to the Events table
 */
async function addField(fieldName, fieldType) {
  console.log('\n➕ Adding Field to Events Table...\n');
  console.log(`Field Name: "${fieldName}"`);
  console.log(`Field Type: "${fieldType}"`);
  console.log('');

  if (!fieldName || !fieldType) {
    console.error('❌ Error: Both fieldName and fieldType are required');
    console.log('\nUsage: npm run schema add "Field Name" "fieldType"');
    console.log('Example: npm run schema add "Notes" "multilineText"\n');
    process.exit(1);
  }

  try {
    // First, get current schema to check if field exists
    const data = await airtableMetaRequest(`/bases/${AIRTABLE_BASE_ID}/tables`);
    const eventsTable = data.tables.find(t => t.id === AIRTABLE_EVENTS_TABLE_ID);

    if (!eventsTable) {
      console.error(`❌ Events table (${AIRTABLE_EVENTS_TABLE_ID}) not found in base`);
      process.exit(1);
    }

    // Check if field already exists
    const existingField = eventsTable.fields.find(
      f => f.name.toLowerCase() === fieldName.toLowerCase()
    );

    if (existingField) {
      console.log(`⚠️  Field already exists. No changes made.`);
      console.log(`   Existing field: "${existingField.name}" (${existingField.type})\n`);
      return;
    }

    // Add new field
    console.log('⏳ Creating field...\n');

    const response = await airtableMetaRequest(
      `/bases/${AIRTABLE_BASE_ID}/tables/${AIRTABLE_EVENTS_TABLE_ID}/fields`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: fieldName,
          type: fieldType,
        }),
      }
    );

    console.log('✅ Field created successfully!\n');
    console.log(`   Name: ${response.name}`);
    console.log(`   ID: ${response.id}`);
    console.log(`   Type: ${response.type}\n`);

  } catch (error) {
    console.error('❌ Error adding field:', error.message);
    console.log('\nCommon field types:');
    console.log('  - singleLineText');
    console.log('  - multilineText');
    console.log('  - richText');
    console.log('  - number');
    console.log('  - percent');
    console.log('  - currency');
    console.log('  - singleSelect');
    console.log('  - multipleSelects');
    console.log('  - date');
    console.log('  - dateTime');
    console.log('  - checkbox');
    console.log('  - url');
    console.log('  - email');
    console.log('  - phoneNumber');
    console.log('  - multipleAttachments\n');
    process.exit(1);
  }
}

const PLACEHOLDER_CLIENT_BUSINESS_NAME = 'fldPLACEHOLDER_CLIENT_BUSINESS_NAME';
const EVENTS_TS_PATH = 'src/services/airtable/events.ts';

/**
 * Ensure "Production Accepted" checkbox exists on Events table (for production color/blink flow).
 * When Hard Lock is clicked, events turn color and blink until department accepts by clicking.
 */
async function ensureProductionAccepted() {
  console.log('\n🔧 Ensuring "Production Accepted" field exists on Events table...\n');

  const data = await airtableMetaRequest(`/bases/${AIRTABLE_BASE_ID}/tables`);
  const eventsTable = data.tables.find(t => t.id === AIRTABLE_EVENTS_TABLE_ID);
  if (!eventsTable) {
    console.error(`❌ Events table (${AIRTABLE_EVENTS_TABLE_ID}) not found`);
    process.exit(1);
  }

  const fieldName = 'Production Accepted';
  let fieldId = eventsTable.fields.find(f => f.name === fieldName)?.id;

  if (fieldId) {
    console.log(`✅ Field "${fieldName}" already exists.`);
    console.log(`   ID: ${fieldId}\n`);
  } else {
    console.log(`⏳ Creating field "${fieldName}" (checkbox)...\n`);
    const response = await airtableMetaRequest(
      `/bases/${AIRTABLE_BASE_ID}/tables/${AIRTABLE_EVENTS_TABLE_ID}/fields`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: fieldName,
          type: 'checkbox',
          options: { icon: 'check', color: 'greenBright' },
        }),
      }
    );
    fieldId = response.id;
    console.log(`✅ Field created. ID: ${fieldId}\n`);
  }

  console.log('📋 This field is used by getLockoutFieldIds() (resolved by name).');
  console.log('   No code changes needed — the app looks up "Production Accepted" by name.\n');
}

/** Department acceptance field names (each department has its own). */
const DEPT_ACCEPTANCE_FIELDS = [
  'Production Accepted',           // Kitchen (legacy, keep as-is)
  'Production Accepted (Flair)',
  'Production Accepted (Delivery)',
  'Production Accepted (Ops Chief)',
];

/**
 * Ensure per-department Production Accepted checkboxes exist.
 * Each department accepts independently; event blinks for a department until that department accepts.
 */
async function ensureDepartmentAcceptanceFields() {
  console.log('\n🔧 Ensuring per-department Production Accepted fields exist...\n');

  const data = await airtableMetaRequest(`/bases/${AIRTABLE_BASE_ID}/tables`);
  const eventsTable = data.tables.find(t => t.id === AIRTABLE_EVENTS_TABLE_ID);
  if (!eventsTable) {
    console.error(`❌ Events table (${AIRTABLE_EVENTS_TABLE_ID}) not found`);
    process.exit(1);
  }

  for (const fieldName of DEPT_ACCEPTANCE_FIELDS) {
    const existing = eventsTable.fields.find(f => f.name === fieldName);
    if (existing) {
      console.log(`✅ "${fieldName}" already exists (${existing.id})`);
    } else {
      console.log(`⏳ Creating "${fieldName}" (checkbox)...`);
      const response = await airtableMetaRequest(
        `/bases/${AIRTABLE_BASE_ID}/tables/${AIRTABLE_EVENTS_TABLE_ID}/fields`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: fieldName,
            type: 'checkbox',
            options: { icon: 'check', color: 'greenBright' },
          }),
        }
      );
      console.log(`   Created. ID: ${response.id}`);
    }
  }
  console.log('\n✅ Done. App resolves these by name via getLockoutFieldIds().\n');
}

/**
 * Ensure "Client Business Name" exists on Events table; create if not. Print or write field ID.
 */
async function ensureClientBusinessName() {
  console.log('\n🔧 Ensuring "Client Business Name" field exists on Events table...\n');

  const data = await airtableMetaRequest(`/bases/${AIRTABLE_BASE_ID}/tables`);
  const eventsTable = data.tables.find(t => t.id === AIRTABLE_EVENTS_TABLE_ID);
  if (!eventsTable) {
    console.error(`❌ Events table (${AIRTABLE_EVENTS_TABLE_ID}) not found`);
    process.exit(1);
  }

  const fieldName = 'Client Business Name';
  let fieldId = eventsTable.fields.find(f => f.name === fieldName)?.id;

  if (fieldId) {
    console.log(`✅ Field "${fieldName}" already exists.`);
    console.log(`   ID: ${fieldId}\n`);
  } else {
    console.log(`⏳ Creating field "${fieldName}" (singleLineText)...\n`);
    const response = await airtableMetaRequest(
      `/bases/${AIRTABLE_BASE_ID}/tables/${AIRTABLE_EVENTS_TABLE_ID}/fields`,
      {
        method: 'POST',
        body: JSON.stringify({ name: fieldName, type: 'singleLineText' }),
      }
    );
    fieldId = response.id;
    console.log(`✅ Field created. ID: ${fieldId}\n`);
  }

  const eventsTsPath = path.resolve(process.cwd(), EVENTS_TS_PATH);
  if (fs.existsSync(eventsTsPath)) {
    let content = fs.readFileSync(eventsTsPath, 'utf8');
    if (content.includes(PLACEHOLDER_CLIENT_BUSINESS_NAME)) {
      content = content.replace(new RegExp(PLACEHOLDER_CLIENT_BUSINESS_NAME, 'g'), fieldId);
      fs.writeFileSync(eventsTsPath, content);
      console.log(`📝 Updated ${EVENTS_TS_PATH} with CLIENT_BUSINESS_NAME = ${fieldId}\n`);
    } else {
      console.log(`💡 Add to FIELD_IDS in ${EVENTS_TS_PATH}:  CLIENT_BUSINESS_NAME: "${fieldId}"\n`);
    }
  }
}

/**
 * Ensure DELI-related fields exist on Events table (so you don't have to add them in Airtable UI).
 * Creates: Custom Delivery DELI (multilineText), DELI (Full Service) (linked to Menu Items), Custom DELI (Full Service) (multilineText).
 * Prints the new field IDs for pasting into src/services/airtable/events.ts.
 */
async function ensureDeliFields() {
  console.log('\n🔧 Ensuring DELI fields exist on Events table...\n');

  const data = await airtableMetaRequest(`/bases/${AIRTABLE_BASE_ID}/tables`);
  const eventsTable = data.tables.find((t) => t.id === AIRTABLE_EVENTS_TABLE_ID);
  if (!eventsTable) {
    console.error(`❌ Events table (${AIRTABLE_EVENTS_TABLE_ID}) not found`);
    process.exit(1);
  }

  const results = { customDeliveryDeli: null, fullServiceDeli: null, customFullServiceDeli: null };

  // 1. Custom Delivery DELI (Long Text)
  const customDeliveryName = 'Custom Delivery DELI';
  let f = eventsTable.fields.find((x) => x.name === customDeliveryName);
  if (f) {
    results.customDeliveryDeli = f.id;
    console.log(`✅ "${customDeliveryName}" already exists (${f.id})`);
  } else {
    const res = await airtableMetaRequest(
      `/bases/${AIRTABLE_BASE_ID}/tables/${AIRTABLE_EVENTS_TABLE_ID}/fields`,
      { method: 'POST', body: JSON.stringify({ name: customDeliveryName, type: 'multilineText' }) }
    );
    results.customDeliveryDeli = res.id;
    console.log(`✅ Created "${customDeliveryName}" (${res.id})`);
  }

  // 2. DELI (Full Service) — linked to Menu Items
  const fullServiceDeliName = 'DELI (Full Service)';
  f = eventsTable.fields.find((x) => x.name === fullServiceDeliName);
  if (f) {
    results.fullServiceDeli = f.id;
    console.log(`✅ "${fullServiceDeliName}" already exists (${f.id})`);
  } else {
    const res = await airtableMetaRequest(
      `/bases/${AIRTABLE_BASE_ID}/tables/${AIRTABLE_EVENTS_TABLE_ID}/fields`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: fullServiceDeliName,
          type: 'multipleRecordLinks',
          options: { linkedTableId: MENU_ITEMS_TABLE_ID },
        }),
      }
    );
    results.fullServiceDeli = res.id;
    console.log(`✅ Created "${fullServiceDeliName}" linked to Menu Items (${res.id})`);
  }

  // Refresh table so we don't re-check stale field list for next create
  const data2 = await airtableMetaRequest(`/bases/${AIRTABLE_BASE_ID}/tables`);
  const eventsTable2 = data2.tables.find((t) => t.id === AIRTABLE_EVENTS_TABLE_ID);

  // 3. Custom DELI (Full Service) (Long Text)
  const customFullName = 'Custom DELI (Full Service)';
  f = eventsTable2.fields.find((x) => x.name === customFullName);
  if (f) {
    results.customFullServiceDeli = f.id;
    console.log(`✅ "${customFullName}" already exists (${f.id})`);
  } else {
    const res = await airtableMetaRequest(
      `/bases/${AIRTABLE_BASE_ID}/tables/${AIRTABLE_EVENTS_TABLE_ID}/fields`,
      { method: 'POST', body: JSON.stringify({ name: customFullName, type: 'multilineText' }) }
    );
    results.customFullServiceDeli = res.id;
    console.log(`✅ Created "${customFullName}" (${res.id})`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Add these to src/services/airtable/events.ts');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('1. Replace CUSTOM_DELIVERY_DELI placeholder:');
  console.log(`   CUSTOM_DELIVERY_DELI: "${results.customDeliveryDeli}",\n`);
  console.log('2. Add full-service DELI (after DELIVERY_DELI or in menu section):');
  console.log(`   FULL_SERVICE_DELI: "${results.fullServiceDeli}",    // DELI (Full Service) — linked to Menu Items`);
  console.log(`   CUSTOM_FULL_SERVICE_DELI: "${results.customFullServiceDeli}",    // Custom DELI (Full Service)\n`);
  console.log('3. Add those three field IDs to SAVE_WHITELIST in the same file.');
  console.log('4. Remove "fldCustomDeliTODO" from PLACEHOLDER_FIELD_IDS.\n');
}

/**
 * Ensure Event Menu (SHADOW SYSTEM) Section field allows the section values we send.
 * Option A: PATCH the field to set allowNewOptions: true (if API supports it).
 * Option B: PATCH the field to add missing choices (Passed Appetizers, Presented Appetizers, etc.).
 */
async function ensureEventMenuSectionOptions() {
  console.log('\n🔧 Event Menu (SHADOW SYSTEM) — Section field options...\n');

  const data = await airtableMetaRequest(`/bases/${AIRTABLE_BASE_ID}/tables`);
  const table = data.tables.find(
    (t) => t.id === EVENT_MENU_SHADOW_TABLE || t.name === EVENT_MENU_SHADOW_TABLE
  );
  if (!table) {
    console.error(`❌ Table "${EVENT_MENU_SHADOW_TABLE}" not found. Set VITE_AIRTABLE_EVENT_MENU_SHADOW_TABLE to table ID or name.`);
    process.exit(1);
  }

  const sectionField = table.fields.find((f) => f.name === 'Section');
  if (!sectionField) {
    console.error('❌ Field "Section" not found in Event Menu (SHADOW SYSTEM).');
    process.exit(1);
  }
  if (sectionField.type !== 'singleSelect') {
    console.error(`❌ Field "Section" is not singleSelect (got ${sectionField.type}).`);
    process.exit(1);
  }

  const requiredChoices = [
    'Passed Appetizers',
    'Presented Appetizers',
    'Buffet – Metal',
    'Buffet – China',
    'Desserts',
    'Deli',
    'Room Temp',
    'Room Temp / Display',
  ];
  const existingChoices = sectionField.options?.choices ?? [];
  const existingNames = new Set(existingChoices.map((c) => (typeof c === 'string' ? c : c.name)));

  const toAdd = requiredChoices.filter((name) => !existingNames.has(name));
  if (toAdd.length === 0) {
    console.log('✅ Section field already has all required choices. No change needed.\n');
    return;
  }

  const newChoices = [
    ...existingChoices.map((c) => {
      if (typeof c === 'object' && c != null) {
        const out = { name: c.name ?? String(c) };
        if (c.id) out.id = c.id;
        if (c.color) out.color = c.color;
        return out;
      }
      return { name: String(c) };
    }),
    ...toAdd.map((name) => ({ name })),
  ];

  try {
    await airtableMetaRequest(
      `/bases/${AIRTABLE_BASE_ID}/tables/${table.id}/fields/${sectionField.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          type: 'singleSelect',
          options: {
            choices: newChoices,
          },
        }),
      }
    );
    console.log(`✅ Section field updated. Added choices: ${toAdd.join(', ')}\n`);
  } catch (err) {
    console.error('❌ Failed to update Section field:', err.message);
    console.log('\n👉 Do this manually in Airtable:');
    console.log('   Event Menu (SHADOW SYSTEM) → Section field → turn ON "Allow new options".\n');
    process.exit(1);
  }
}

/**
 * Export full schema to airtable_schema.json for metadata fallback.
 */
async function exportSchema() {
  console.log('\n📤 Exporting Airtable schema to airtable_schema.json...\n');
  try {
    const data = await airtableMetaRequest(`/bases/${AIRTABLE_BASE_ID}/tables`);
    const outPath = path.join(process.cwd(), 'airtable_schema.json');
    fs.writeFileSync(outPath, JSON.stringify(data, null, 0), 'utf8');
    console.log(`✅ Wrote ${data.tables?.length ?? 0} tables to ${outPath}\n`);
  } catch (error) {
    console.error('❌ Error exporting schema:', error.message);
    process.exit(1);
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('\n📚 Airtable Schema Manager\n');
    console.log('Usage:');
    console.log('  npm run schema read');
    console.log('  npm run schema export     # Refresh airtable_schema.json');
    console.log('  npm run schema add "Field Name" "fieldType"');
    console.log('  npm run schema ensure-production-accepted');
    console.log('  npm run schema ensure-department-acceptance');
    console.log('  npm run schema ensure-client-business-name');
    console.log('  npm run schema ensure-deli-fields     # Creates Custom Delivery DELI + DELI (Full Service) + Custom DELI (Full Service)');
    console.log('  npm run schema ensure-event-menu-section   # Event Menu (SHADOW SYSTEM) Section: add required choices\n');
    console.log('Examples:');
    console.log('  npm run schema read');
    console.log('  npm run schema add "Customer Notes" "multilineText"');
    console.log('  npm run schema ensure-client-business-name\n');
    process.exit(0);
  }

  switch (command.toLowerCase()) {
    case 'read':
      await readSchema();
      break;

    case 'export':
      await exportSchema();
      break;

    case 'add':
      const fieldName = args[1];
      const fieldType = args[2];
      await addField(fieldName, fieldType);
      break;

    case 'ensure-production-accepted':
      await ensureProductionAccepted();
      break;

    case 'ensure-department-acceptance':
      await ensureDepartmentAcceptanceFields();
      break;

    case 'ensure-client-business-name':
      await ensureClientBusinessName();
      break;

    case 'ensure-deli-fields':
      await ensureDeliFields();
      break;

    case 'ensure-event-menu-section':
      await ensureEventMenuSectionOptions();
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('\nAvailable commands: read, export, add, ensure-production-accepted, ensure-department-acceptance, ensure-client-business-name, ensure-deli-fields, ensure-event-menu-section\n');
      process.exit(1);
  }
}

// Run CLI
main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
