export type AirtableRecord<TFields> = {
  id: string;
  fields: TFields;
};

export type AirtableListResponse<TFields> = {
  records: Array<AirtableRecord<TFields>>;
};

export type AirtableErrorResult = {
  error: true;
  message?: string;
};

type AirtableApiError = {
  error?: {
    message?: string;
  };
};

/** Server proxy — keeps API key server-side. Never use VITE_AIRTABLE_API_KEY. */
const PROXY_URL = "/api/airtable/proxy";

/** Lazy env reads to avoid "Cannot access before initialization" in bundled chunks. */
const _getBaseId = () => (import.meta.env.VITE_AIRTABLE_BASE_ID as string | undefined)?.trim();
const _getEventsTable = () => (import.meta.env.VITE_AIRTABLE_EVENTS_TABLE as string | undefined)?.trim();
const _getStationsTable = () => (import.meta.env.VITE_AIRTABLE_STATIONS_TABLE as string | undefined)?.trim();
const _getMasterMenuSpecsTable = () => (import.meta.env.VITE_AIRTABLE_MASTER_MENU_SPECS_TABLE as string | undefined)?.trim();
const _getMenuItemsTable = () => (import.meta.env.VITE_AIRTABLE_MENU_ITEMS_TABLE as string | undefined)?.trim();
const _getLeadsTable = () => (import.meta.env.VITE_AIRTABLE_LEADS_TABLE as string | undefined)?.trim();
const _getTasksTable = () => (import.meta.env.VITE_AIRTABLE_TASKS_TABLE as string | undefined)?.trim();

const getEnvValue = (value: string | undefined, name: string): string | AirtableErrorResult => {
  if (!value) {
    return { error: true, message: `Missing required env: ${name}` };
  }
  return value;
};

const getHeaders = (apiKey: string) => {
  // Ensure API key contains only ASCII characters
  const cleanApiKey = apiKey.replace(/[^\x00-\x7F]/g, "");
  return {
    Authorization: `Bearer ${cleanApiKey}`,
    "Content-Type": "application/json",
  };
};

export const getEventsTable = (): string | AirtableErrorResult =>
  getEnvValue(_getEventsTable(), "VITE_AIRTABLE_EVENTS_TABLE");

export const getStationsTable = (): string =>
  _getStationsTable() || "Stations";

export const getMasterMenuSpecsTable = (): string =>
  _getMasterMenuSpecsTable() || "tblGeCmzJscnocs1T";

export const getMenuItemsTable = (): string =>
  _getMenuItemsTable() || "tbl0aN33DGG6R1sPZ";

/** Leads table for FOH lead pipeline. When unset, leads service returns demo data. */
export const getLeadsTable = (): string | undefined =>
  _getLeadsTable() || undefined;

/** Tasks table for FOH task management. Fields: Task Name, Event, Task Type, Due Date, Status, Notes, Created At, Updated At. */
export const getTasksTable = (): string | undefined =>
  _getTasksTable() || undefined;

export const getBaseId = (): string | AirtableErrorResult =>
  getEnvValue(_getBaseId(), "VITE_AIRTABLE_BASE_ID");

/** When using server proxy, returns "proxy" if baseId is set. Legacy checks use this. */
export const getApiKey = (): string | AirtableErrorResult => {
  const baseId = _getBaseId();
  if (baseId) return "proxy";
  return { error: true, message: "VITE_AIRTABLE_BASE_ID must be set" };
};

export const airtableFetch = async <T>(
  path: string,
  init?: RequestInit
): Promise<T | AirtableErrorResult> => {
  const baseId = getEnvValue(_getBaseId(), "VITE_AIRTABLE_BASE_ID");
  if (typeof baseId !== "string") {
    return baseId;
  }

  try {
    const method = (init?.method as string) || "GET";
    const body = init?.body != null ? (typeof init.body === "string" ? init.body : JSON.stringify(init.body)) : undefined;

    const response = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, method, body }),
    });

    const data = (await response.json()) as T & AirtableApiError;

    if (!response.ok || data?.error) {
      const errMsg = (data as { error?: { message?: string; type?: string } })?.error?.message;
      const errType = (data as { error?: { message?: string; type?: string } })?.error?.type;
      console.error("❌ AIRTABLE ERROR (422 = invalid field value):", response.status, errType || "", errMsg || JSON.stringify(data));
      console.error("Request body:", body);
      return {
        error: true,
        message: (data as { error?: { message?: string } })?.error?.message || `Airtable request failed: ${response.status}`,
      };
    }

    return data as T;
  } catch (error) {
    return {
      error: true,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/** Use server proxy for metadata — avoids 403 from client-side token. */
const META_PROXY = "/api/airtable/meta";

export const airtableMetaFetch = async <T>(
  path: string,
  init?: RequestInit
): Promise<T | AirtableErrorResult> => {
  const baseId = getEnvValue(_getBaseId(), "VITE_AIRTABLE_BASE_ID");
  if (typeof baseId !== "string") {
    return baseId;
  }

  // Use server proxy — keeps API key server-side, avoids 403 on metadata API
  const url = `${META_PROXY}${path.startsWith("/") ? `?path=${encodeURIComponent(path)}` : ""}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const data = (await response.json()) as T & AirtableApiError;

    if (!response.ok || data?.error) {
      return {
        error: true,
        message: data?.error?.message || `Airtable request failed: ${response.status}`,
      };
    }

    return data as T;
  } catch (error) {
    return {
      error: true,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
