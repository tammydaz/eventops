/**
 * Platter Orders — localStorage persistence for sandwich platter configs.
 * Used when adding platters via SandwichPlatterConfigModal. BEO merge reads from here.
 * TODO: Migrate to Airtable (Platter Orders table) when Omni creates it.
 */

import { normalizePlatterRow, type PlatterRow } from "../config/sandwichPlatterConfig";

const STORAGE_KEY = "eventops-platter-orders";

function getStorage(): Record<string, PlatterRow[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStorage(data: Record<string, PlatterRow[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getPlatterOrdersByEventId(eventId: string): PlatterRow[] {
  const data = getStorage();
  const rows = data[eventId] ?? [];
  return rows.map((row) => normalizePlatterRow(row as PlatterRow & Record<string, unknown>));
}

export function setPlatterOrdersForEvent(eventId: string, rows: PlatterRow[]) {
  const data = getStorage();
  data[eventId] = rows;
  setStorage(data);
}

export function addPlatterOrdersForEvent(eventId: string, rows: PlatterRow[]) {
  const existing = getPlatterOrdersByEventId(eventId);
  const combined = [...existing, ...rows];
  setPlatterOrdersForEvent(eventId, combined);
}
