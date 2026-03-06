#!/usr/bin/env node

/**
 * Fetch and output schema for Stations and Station Presets tables from Airtable.
 * Uses .env for VITE_AIRTABLE_API_KEY, VITE_AIRTABLE_BASE_ID,
 * and optionally VITE_AIRTABLE_STATIONS_TABLE, VITE_AIRTABLE_STATION_PRESETS_TABLE.
 */

import dotenv from 'dotenv';

dotenv.config();

const AIRTABLE_API_KEY = process.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.VITE_AIRTABLE_BASE_ID;
const STATIONS_TABLE_ID = process.env.VITE_AIRTABLE_STATIONS_TABLE;
const STATION_PRESETS_TABLE_ID = process.env.VITE_AIRTABLE_STATION_PRESETS_TABLE;

if (!AIRTABLE_API_KEY) {
  console.error('Error: VITE_AIRTABLE_API_KEY is not set in .env');
  process.exit(1);
}

if (!AIRTABLE_BASE_ID) {
  console.error('Error: VITE_AIRTABLE_BASE_ID is not set in .env');
  process.exit(1);
}

const BASE_URL = 'https://api.airtable.com/v0/meta/bases';

async function fetchTables() {
  const url = BASE_URL + '/' + AIRTABLE_BASE_ID + '/tables';
  const response = await fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + AIRTABLE_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error('Airtable API Error: ' + response.status + ' - ' + error);
  }

  return response.json();
}

function findTable(data, idOrName, fallbackNames) {
  const names = Array.isArray(fallbackNames) ? fallbackNames : [fallbackNames];
  if (idOrName) {
    const byId = data.tables.find(t => t.id === idOrName);
    if (byId) return byId;
  }
  for (const n of names) {
    const t = data.tables.find(tbl => tbl.name === n);
    if (t) return t;
  }
  return null;
}

function outputTable(table) {
  if (!table) return;
  console.log('---');
  console.log('Table id:', table.id);
  console.log('Table name:', table.name);
  console.log('Fields:');
  (table.fields || []).forEach(f => {
    console.log('  - id:', f.id, ', name:', f.name);
  });
  console.log('');
}

async function main() {
  const data = await fetchTables();

  const stationsTable = findTable(data, STATIONS_TABLE_ID, 'Stations');
  const stationPresetsTable = findTable(data, STATION_PRESETS_TABLE_ID, ['Station Presets', 'Station Preset']);

  if (!stationsTable) {
    console.error('Stations table not found (by name or VITE_AIRTABLE_STATIONS_TABLE)');
  } else {
    outputTable(stationsTable);
  }

  if (!stationPresetsTable) {
    console.error('Station Presets table not found (by name or VITE_AIRTABLE_STATION_PRESETS_TABLE)');
    console.log('All tables in base:', data.tables.map(t => t.name).join(', '));
  } else {
    outputTable(stationPresetsTable);
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
