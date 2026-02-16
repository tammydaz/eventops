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

const AIRTABLE_API_KEY = process.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.VITE_AIRTABLE_BASE_ID;
const AIRTABLE_EVENTS_TABLE_ID = process.env.VITE_AIRTABLE_EVENTS_TABLE;

// Validate environment variables
if (!AIRTABLE_API_KEY) {
  console.error('❌ Error: VITE_AIRTABLE_API_KEY is not set in .env file');
  process.exit(1);
}

if (!AIRTABLE_BASE_ID) {
  console.error('❌ Error: VITE_AIRTABLE_BASE_ID is not set in .env file');
  process.exit(1);
}

if (!AIRTABLE_EVENTS_TABLE_ID) {
  console.error('❌ Error: VITE_AIRTABLE_EVENTS_TABLE is not set in .env file');
  process.exit(1);
}

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
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('\n📚 Airtable Schema Manager\n');
    console.log('Usage:');
    console.log('  npm run schema read');
    console.log('  npm run schema add "Field Name" "fieldType"');
    console.log('  npm run schema ensure-client-business-name\n');
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

    case 'add':
      const fieldName = args[1];
      const fieldType = args[2];
      await addField(fieldName, fieldType);
      break;

    case 'ensure-client-business-name':
      await ensureClientBusinessName();
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('\nAvailable commands: read, add, ensure-client-business-name\n');
      process.exit(1);
  }
}

// Run CLI
main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
