/**
 * Station Components and Station Options services.
 * Used by Stations UI for preset-based component selection.
 * Does NOT touch Menu Items, spec engine, or BEO rendering.
 */
import { airtableFetch, getBaseId, getApiKey, airtableMetaFetch } from "./client";
import { isErrorResult, asString, asSingleSelectName, asLinkedRecordIds, asBoolean } from "./selectors";
import type { AirtableListResponse, AirtableErrorResult } from "./client";

const STATION_PRESETS_TABLE = (import.meta.env.VITE_AIRTABLE_STATION_PRESETS_TABLE as string | undefined)?.trim() || "Station Presets";
const STATION_COMPONENTS_TABLE = (import.meta.env.VITE_AIRTABLE_STATION_COMPONENTS_TABLE as string | undefined)?.trim() || "Station Components";
const STATION_OPTIONS_TABLE = (import.meta.env.VITE_AIRTABLE_STATION_OPTIONS_TABLE as string | undefined)?.trim() || "Station Options";

export type StationComponent = {
  id: string;
  name: string;
  componentType: string;
  isDefault: boolean;
  isOther: boolean;
};

export type StationOption = {
  id: string;
  optionName: string;
  componentType: string;
  numberOfSelectionsAllowed: number;
};

export type StationPresetRecord = {
  id: string;
  name: string;
};

let cachedPresetsTableId: string | null | undefined = undefined;
let cachedComponentsTableId: string | null | undefined = undefined;
let cachedOptionsTableId: string | null | undefined = undefined;

async function getTableId(tableName: string, envOverride?: string): Promise<string | null> {
  const data = await airtableMetaFetch<{ tables: Array<{ id: string; name: string }> }>("");
  if (isErrorResult(data)) return null;
  const table = data.tables.find(
    (t) => t.id === envOverride || t.name === tableName
  );
  return table?.id ?? null;
}

/** Resolve table IDs from schema (cached). */
async function resolveTableIds(): Promise<{
  presets: string | null;
  components: string | null;
  options: string | null;
}> {
  if (cachedPresetsTableId !== undefined && cachedComponentsTableId !== undefined && cachedOptionsTableId !== undefined) {
    return { presets: cachedPresetsTableId ?? null, components: cachedComponentsTableId ?? null, options: cachedOptionsTableId ?? null };
  }
  const data = await airtableMetaFetch<{ tables: Array<{ id: string; name: string }> }>("");
  if (isErrorResult(data)) {
    return { presets: null, components: null, options: null };
  }
  const presets = data.tables.find((t) => t.id === STATION_PRESETS_TABLE || t.name === "Station Presets");
  const components = data.tables.find((t) => t.id === STATION_COMPONENTS_TABLE || t.name === "Station Components");
  const options = data.tables.find((t) => t.id === STATION_OPTIONS_TABLE || t.name === "Station Options");
  cachedPresetsTableId = presets?.id ?? null;
  cachedComponentsTableId = components?.id ?? null;
  cachedOptionsTableId = options?.id ?? null;
  return {
    presets: cachedPresetsTableId,
    components: cachedComponentsTableId,
    options: cachedOptionsTableId,
  };
}

/** Get field ID by name from a table. */
async function getFieldId(tableId: string, fieldName: string): Promise<string | null> {
  const data = await airtableMetaFetch<{ tables: Array<{ id: string; fields: Array<{ id: string; name: string }> }> }>("");
  if (isErrorResult(data)) return null;
  const table = data.tables.find((t) => t.id === tableId);
  const field = table?.fields.find((f) => f.name === fieldName);
  return field?.id ?? null;
}

/** List all Station Presets (id + name). */
export async function loadStationPresets(): Promise<StationPresetRecord[] | AirtableErrorResult> {
  const { presets } = await resolveTableIds();
  if (!presets) return [];
  const nameField = await getFieldId(presets, "Preset Name") || await getFieldId(presets, "Name") || await getFieldId(presets, "Station Type");
  if (!nameField) return [];
  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${presets}?maxRecords=200&returnFieldsByFieldId=true`
  );
  if (isErrorResult(data)) return data;
  return data.records.map((rec) => {
    const fields = rec.fields as Record<string, unknown>;
    const name = asString(fields[nameField]) || asSingleSelectName(fields[nameField]) || rec.id;
    return { id: rec.id, name };
  });
}

/** Load Station Components linked to a preset. Optionally filter by Is Default for Station? = true. */
export async function loadStationComponentsForPreset(
  presetId: string,
  defaultsOnly = false
): Promise<StationComponent[] | AirtableErrorResult> {
  const { components } = await resolveTableIds();
  if (!components) return [];
  const metaData = await airtableMetaFetch<{ tables: Array<{ id: string; fields: Array<{ id: string; name: string }> }> }>("");
  if (isErrorResult(metaData)) return [];
  const table = metaData.tables.find((t) => t.id === components);
  const byName = (n: string) => table?.fields.find((f) => f.name === n)?.id ?? "";
  const presetLinkFieldId = byName("Station Preset") || byName("Station Presets");
  const nameFieldId = byName("Component Name") || byName("Name");
  const componentTypeFieldId = byName("Component Type");
  const isDefaultFieldId = byName("Is Default for Station?");
  const isOtherFieldId = byName("Is Other?") || byName("Other");

  const params = new URLSearchParams();
  params.set("maxRecords", "500");
  params.set("returnFieldsByFieldId", "true");

  const listData = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${components}?${params.toString()}`
  );
  if (isErrorResult(listData)) return listData;

  const result: StationComponent[] = [];
  for (const rec of listData.records) {
    const fields = rec.fields as Record<string, unknown>;
    if (!presetLinkFieldId) continue;
    const linkedPresetIds = asLinkedRecordIds(fields[presetLinkFieldId]);
    if (linkedPresetIds.length === 0 || !linkedPresetIds.includes(presetId)) continue;
    const isDefault = isDefaultFieldId ? asBoolean(fields[isDefaultFieldId]) : false;
    if (defaultsOnly && !isDefault) continue;
    const name = asString(fields[nameFieldId]) || asSingleSelectName(fields[nameFieldId]) || "";
    const componentType = asString(fields[componentTypeFieldId]) || asSingleSelectName(fields[componentTypeFieldId]) || "Other";
    const isOther = isOtherFieldId ? asBoolean(fields[isOtherFieldId]) : name.toLowerCase() === "other";
    result.push({ id: rec.id, name, componentType, isDefault, isOther });
  }
  return result;
}

/** Load all components for a preset (for picker). */
export async function loadAllComponentsForPreset(presetId: string): Promise<StationComponent[] | AirtableErrorResult> {
  return loadStationComponentsForPreset(presetId, false);
}

/** Load default components for a preset (for autopopulate). */
export async function loadDefaultComponentsForPreset(presetId: string): Promise<StationComponent[] | AirtableErrorResult> {
  return loadStationComponentsForPreset(presetId, true);
}

/** Load component names by IDs (for display). Returns id -> name map. */
export async function loadStationComponentNamesByIds(
  componentIds: string[]
): Promise<Record<string, string> | AirtableErrorResult> {
  const { components } = await resolveTableIds();
  if (!components || componentIds.length === 0) return {};
  const uniqueIds = [...new Set(componentIds)].filter((id) => id?.startsWith("rec"));
  if (uniqueIds.length === 0) return {};
  const metaData = await airtableMetaFetch<{ tables: Array<{ id: string; fields: Array<{ id: string; name: string }> }> }>("");
  if (isErrorResult(metaData)) return {};
  const table = metaData.tables.find((t) => t.id === components);
  const nameFieldId = table?.fields.find((f) => f.name === "Component Name" || f.name === "Name")?.id ?? "";
  if (!nameFieldId) return {};
  const formula = `OR(${uniqueIds.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
  const params = new URLSearchParams();
  params.set("maxRecords", String(uniqueIds.length));
  params.set("returnFieldsByFieldId", "true");
  params.set("filterByFormula", formula);
  params.append("fields[]", nameFieldId);
  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(`/${components}?${params.toString()}`);
  if (isErrorResult(data)) return data;
  const result: Record<string, string> = {};
  for (const rec of data.records) {
    const name = asString((rec.fields as Record<string, unknown>)[nameFieldId]) || rec.id;
    result[rec.id] = name;
  }
  return result;
}

/** Load Station Options linked to a preset. */
export async function loadStationOptionsForPreset(presetId: string): Promise<StationOption[] | AirtableErrorResult> {
  const { options } = await resolveTableIds();
  if (!options) return [];
  const metaData = await airtableMetaFetch<{ tables: Array<{ id: string; fields: Array<{ id: string; name: string }> }> }>("");
  if (isErrorResult(metaData)) return [];
  const table = metaData.tables.find((t) => t.id === options);
  const byName = (n: string) => table?.fields.find((f) => f.name === n)?.id ?? "";
  const presetLinkFieldId = byName("Station Preset") || byName("Station Presets");
  const optionNameFieldId = byName("Option Name") || byName("Name");
  const componentTypeFieldId = byName("Component Type");
  const numSelectionsFieldId = byName("Number of Selections Allowed") || byName("Selections Allowed");

  const params = new URLSearchParams();
  params.set("maxRecords", "100");
  params.set("returnFieldsByFieldId", "true");

  const listData = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${options}?${params.toString()}`
  );
  if (isErrorResult(listData)) return listData;

  const result: StationOption[] = [];
  for (const rec of listData.records) {
    const fields = rec.fields as Record<string, unknown>;
    if (presetLinkFieldId) {
      const linkedPresetIds = asLinkedRecordIds(fields[presetLinkFieldId]);
      if (linkedPresetIds.length === 0 || !linkedPresetIds.includes(presetId)) continue;
    }
    const optionName = asString(fields[optionNameFieldId]) || asSingleSelectName(fields[optionNameFieldId]) || "";
    const componentType = asString(fields[componentTypeFieldId]) || asSingleSelectName(fields[componentTypeFieldId]) || "";
    const num = fields[numSelectionsFieldId];
    const numberOfSelectionsAllowed = typeof num === "number" ? num : parseInt(String(num || 0), 10) || 0;
    result.push({ id: rec.id, optionName, componentType, numberOfSelectionsAllowed });
  }
  return result;
}
