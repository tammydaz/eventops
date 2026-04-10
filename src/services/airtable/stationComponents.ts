/**
 * Station Components and Station Options services.
 * Used by Stations UI for preset-based component selection.
 * Does NOT touch Menu Items, spec engine, or BEO rendering.
 */
import { airtableFetch, getBaseId, getApiKey, airtableMetaFetch, airtableMetaTables } from "./client";
import { isErrorResult, asString, asSingleSelectName, asLinkedRecordIds, asBoolean } from "./selectors";
import type { AirtableListResponse, AirtableErrorResult } from "./client";

const STATION_PRESETS_TABLE = (import.meta.env.VITE_AIRTABLE_STATION_PRESETS_TABLE as string | undefined)?.trim() || "Station Presets";
const STATION_COMPONENTS_TABLE = (import.meta.env.VITE_AIRTABLE_STATION_COMPONENTS_TABLE as string | undefined)?.trim() || "Station Components";
const STATION_OPTIONS_TABLE = (import.meta.env.VITE_AIRTABLE_STATION_OPTIONS_TABLE as string | undefined)?.trim() || "Station Options";

const META_TABLES_PATH = "/tables";
const DEFAULT_COMPONENTS_FIELD_ID = (import.meta.env.VITE_AIRTABLE_STATION_PRESETS_DEFAULT_COMPONENTS_FIELD as string | undefined)?.trim();
const AVAILABLE_OPTIONS_FIELD_ID = (import.meta.env.VITE_AIRTABLE_STATION_PRESETS_AVAILABLE_OPTIONS_FIELD as string | undefined)?.trim();

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
  const data = await airtableMetaFetch<{ tables: Array<{ id: string; name: string }> }>(META_TABLES_PATH);
  if (isErrorResult(data)) return null;
  const tables = Array.isArray(data) ? data : airtableMetaTables<{ id: string; name: string }>(data);
  const table = tables.find((t) => t.id === envOverride || t.name === tableName);
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
  const data = await airtableMetaFetch<{ tables?: Array<{ id: string; name: string }> } | Array<{ id: string; name: string }>>(META_TABLES_PATH);
  if (isErrorResult(data)) return { presets: null, components: null, options: null };
  const tables = Array.isArray(data) ? data : airtableMetaTables<{ id: string; name: string }>(data);
  const presets = tables.find((t) => t.id === STATION_PRESETS_TABLE || t.name === "Station Presets");
  const components = tables.find((t) => t.id === STATION_COMPONENTS_TABLE || t.name === "Station Components");
  const options = tables.find((t) => t.id === STATION_OPTIONS_TABLE || t.name === "Station Options");
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
  const data = await airtableMetaFetch<{ tables?: Array<{ id: string; fields?: Array<{ id: string; name: string }> }> } | Array<{ id: string; fields?: Array<{ id: string; name: string }> }>>(META_TABLES_PATH);
  if (isErrorResult(data)) return null;
  type Tbl = { id: string; fields?: Array<{ id: string; name: string }> };
  const tables = Array.isArray(data) ? (data as Tbl[]) : airtableMetaTables<Tbl>(data);
  const table = tables.find((t) => t.id === tableId);
  const field = table?.fields?.find((f) => f.name === fieldName);
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

/** Load Station Components linked to a preset. Supports both link directions:
 * 1. Preset → Components: Preset has "Default Components" field linking to components
 * 2. Components → Preset: Components have "Station Preset" field linking back to preset */
export async function loadStationComponentsForPreset(
  presetId: string,
  defaultsOnly = false
): Promise<StationComponent[] | AirtableErrorResult> {
  const { presets, components } = await resolveTableIds();
  if (!components) return [];

  type MetaTbl = { id: string; fields?: Array<{ id: string; name: string }> };
  const metaData = await airtableMetaFetch<{ tables?: MetaTbl[] } | MetaTbl[]>(META_TABLES_PATH);
  const tables =
    metaData && !isErrorResult(metaData)
      ? Array.isArray(metaData)
        ? metaData
        : airtableMetaTables<MetaTbl>(metaData)
      : [];
  const presetTable = tables.find((t) => t.id === presets);
  const compTable = tables.find((t) => t.id === components);
  const presetBy = (n: string) => presetTable?.fields?.find((f) => f.name === n)?.id ?? "";
  const compBy = (n: string) => compTable?.fields?.find((f) => f.name === n)?.id ?? "";

  const defaultComponentsFieldId =
    presetBy("Default Components") || presetBy("Components") || presetBy("Station Components") || DEFAULT_COMPONENTS_FIELD_ID || "";
  const presetLinkFieldId = compBy("Station Preset") || compBy("Station Presets");
  const nameFieldId = compBy("Component Name") || compBy("Name");
  const componentTypeFieldId = compBy("Component Type");
  const isDefaultFieldId = compBy("Is Default for Station?");
  const isOtherFieldId = compBy("Is Other?") || compBy("Other");

  let componentIds: string[] = [];

  if (presets && (defaultComponentsFieldId || DEFAULT_COMPONENTS_FIELD_ID)) {
    const fieldId = defaultComponentsFieldId || DEFAULT_COMPONENTS_FIELD_ID;
    const presetRes = await airtableFetch<{ id: string; fields?: Record<string, unknown> }>(`/${presets}/${presetId}`);
    if (!isErrorResult(presetRes)) {
      const ids = asLinkedRecordIds((presetRes.fields ?? {})[fieldId]);
      if (ids.length > 0) componentIds = ids;
    }
  }

  if (componentIds.length === 0 && presetLinkFieldId) {
    const params = new URLSearchParams({ maxRecords: "500", returnFieldsByFieldId: "true" });
    const listData = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(`/${components}?${params}`);
    if (isErrorResult(listData)) return listData;
    for (const rec of listData.records) {
      const linked = asLinkedRecordIds((rec.fields as Record<string, unknown>)[presetLinkFieldId]);
      if (linked.includes(presetId)) componentIds.push(rec.id);
    }
  }

  if (componentIds.length === 0) return [];

  const formula = `OR(${componentIds.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
  const params = new URLSearchParams();
  params.set("maxRecords", "500");
  params.set("returnFieldsByFieldId", "true");
  params.set("filterByFormula", formula);

  const listData = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(`/${components}?${params.toString()}`);
  if (isErrorResult(listData)) return listData;

  const result: StationComponent[] = [];
  for (const rec of listData.records) {
    const fields = rec.fields as Record<string, unknown>;
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

/** Load ALL components from Station Components table (no preset filter). Use as fallback when preset returns empty. */
export async function loadAllStationComponents(): Promise<StationComponent[] | AirtableErrorResult> {
  const { components } = await resolveTableIds();
  if (!components) return [];
  type MetaTbl = { id: string; fields?: Array<{ id: string; name: string }> };
  const metaData = await airtableMetaFetch<{ tables?: MetaTbl[] } | MetaTbl[]>(META_TABLES_PATH);
  const tables =
    metaData && !isErrorResult(metaData)
      ? Array.isArray(metaData)
        ? metaData
        : airtableMetaTables<MetaTbl>(metaData)
      : [];
  const compTable = tables.find((t) => t.id === components);
  const compBy = (n: string) => compTable?.fields?.find((f) => f.name === n)?.id ?? "";
  const nameFieldId = compBy("Component Name") || compBy("Name");
  const componentTypeFieldId = compBy("Component Type");
  const isOtherFieldId = compBy("Is Other?") || compBy("Other");
  const params = new URLSearchParams({ maxRecords: "500", returnFieldsByFieldId: "true" });
  const listData = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(`/${components}?${params}`);
  if (isErrorResult(listData)) return listData;
  const result: StationComponent[] = [];
  for (const rec of listData.records) {
    const fields = rec.fields as Record<string, unknown>;
    const name = asString(fields[nameFieldId]) || asSingleSelectName(fields[nameFieldId]) || "";
    const componentType = asString(fields[componentTypeFieldId]) || asSingleSelectName(fields[componentTypeFieldId]) || "Other";
    const isOther = isOtherFieldId ? asBoolean(fields[isOtherFieldId]) : name.toLowerCase() === "other";
    result.push({ id: rec.id, name, componentType, isDefault: false, isOther });
  }
  return result;
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
  type MetaTbl = { id: string; fields?: Array<{ id: string; name: string }> };
  const metaData = await airtableMetaFetch<{ tables?: MetaTbl[] } | MetaTbl[]>(META_TABLES_PATH);
  if (isErrorResult(metaData)) return {};
  const tables = Array.isArray(metaData) ? metaData : airtableMetaTables<MetaTbl>(metaData);
  const table = tables.find((t) => t.id === components);
  const nameFieldId = table?.fields?.find((f) => f.name === "Component Name" || f.name === "Name")?.id ?? "";
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

/** Load Station Options linked to a preset. Supports preset→options (Available Options) or options→preset (Station Preset). */
export async function loadStationOptionsForPreset(presetId: string): Promise<StationOption[] | AirtableErrorResult> {
  const { presets, options } = await resolveTableIds();
  if (!options) return [];

  type MetaTbl = { id: string; fields?: Array<{ id: string; name: string }> };
  const metaData = await airtableMetaFetch<{ tables?: MetaTbl[] } | MetaTbl[]>(META_TABLES_PATH);
  const tables =
    metaData && !isErrorResult(metaData)
      ? Array.isArray(metaData)
        ? metaData
        : airtableMetaTables<MetaTbl>(metaData)
      : [];
  const presetTable = tables.find((t) => t.id === presets);
  const optTable = tables.find((t) => t.id === options);
  const presetBy = (n: string) => presetTable?.fields?.find((f) => f.name === n)?.id ?? "";
  const optBy = (n: string) => optTable?.fields?.find((f) => f.name === n)?.id ?? "";

  const availableOptionsFieldId = presetBy("Available Options") || presetBy("Station Options") || presetBy("Options") || AVAILABLE_OPTIONS_FIELD_ID || "";
  const presetLinkFieldId = optBy("Station Preset") || optBy("Station Presets");
  const optionNameFieldId = optBy("Option Name") || optBy("Name");
  const componentTypeFieldId = optBy("Component Type") || optBy("Component Type (applies to)");
  const numSelectionsFieldId = optBy("Number of Selections Allowed") || optBy("Selections Allowed");

  let optionIds: string[] = [];
  if (presets && availableOptionsFieldId) {
    const presetRes = await airtableFetch<{ id: string; fields?: Record<string, unknown> }>(`/${presets}/${presetId}`);
    if (!isErrorResult(presetRes)) {
      optionIds = asLinkedRecordIds((presetRes.fields ?? {})[availableOptionsFieldId]);
    }
  }
  if (optionIds.length === 0 && presetLinkFieldId) {
    const params = new URLSearchParams({ maxRecords: "100", returnFieldsByFieldId: "true" });
    const listData = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(`/${options}?${params}`);
    if (!isErrorResult(listData)) {
      for (const rec of listData.records) {
        const linked = asLinkedRecordIds((rec.fields as Record<string, unknown>)[presetLinkFieldId]);
        if (linked.includes(presetId)) optionIds.push(rec.id);
      }
    }
  }
  if (optionIds.length === 0) return [];

  const formula = `OR(${optionIds.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
  const params = new URLSearchParams();
  params.set("maxRecords", "100");
  params.set("returnFieldsByFieldId", "true");
  params.set("filterByFormula", formula);

  const listData = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(`/${options}?${params}`);
  if (isErrorResult(listData)) return listData;

  const result: StationOption[] = [];
  for (const rec of listData.records) {
    const fields = rec.fields as Record<string, unknown>;
    const optionName = asString(fields[optionNameFieldId]) || asSingleSelectName(fields[optionNameFieldId]) || "";
    const componentType = asString(fields[componentTypeFieldId]) || asSingleSelectName(fields[componentTypeFieldId]) || "";
    const num = fields[numSelectionsFieldId];
    const numberOfSelectionsAllowed = typeof num === "number" ? num : parseInt(String(num || 0), 10) || 0;
    result.push({ id: rec.id, optionName, componentType, numberOfSelectionsAllowed });
  }
  return result;
}
