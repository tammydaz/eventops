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
const _getEventMenuTable = () => (import.meta.env.VITE_AIRTABLE_EVENT_MENU_TABLE as string | undefined)?.trim();
const _getEventMenuShadowTable = () => (import.meta.env.VITE_AIRTABLE_EVENT_MENU_SHADOW_TABLE as string | undefined)?.trim();

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

/** Event Menu table (shadow system). When unset, defaults to "Event Menu". Set VITE_AIRTABLE_EVENT_MENU_TABLE to table ID if needed. */
export const getEventMenuTable = (): string =>
  _getEventMenuTable() || "Event Menu";

/** Event Menu (SHADOW SYSTEM) table. Use table ID (tbl...) to avoid encoding: set VITE_AIRTABLE_EVENT_MENU_SHADOW_TABLE=tblYourId in .env */
export const getEventMenuShadowTable = (): string =>
  _getEventMenuShadowTable() || "Event Menu (SHADOW SYSTEM)";

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

    const rawText = await response.text();
    let data: T & AirtableApiError;
    try {
      data = (rawText ? JSON.parse(rawText) : {}) as T & AirtableApiError;
    } catch {
      return {
        error: true,
        message: `API returned non-JSON (${response.status}). ${rawText.slice(0, 120)}`,
      };
    }

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
    const msg = error instanceof Error ? error.message : "Unknown error";
    const hint =
      msg === "Failed to fetch"
        ? " Could not reach /api (check VPN/network). Use npm run dev or npm run preview with vite proxy, npm run dev:full for local API, or use the deployed Vercel app."
        : "";
    return {
      error: true,
      message: msg + hint,
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

    const rawText = await response.text();
    let data: T & AirtableApiError;
    try {
      data = (rawText ? JSON.parse(rawText) : {}) as T & AirtableApiError;
    } catch {
      return {
        error: true,
        message: `Meta API returned non-JSON (${response.status}). ${rawText.slice(0, 120)}`,
      };
    }

    if (!response.ok || data?.error) {
      return {
        error: true,
        message: data?.error?.message || `Airtable request failed: ${response.status}`,
      };
    }

    return data as T;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const hint =
      msg === "Failed to fetch"
        ? " Could not reach /api/airtable/meta. Check network or Vite /api proxy (see vite.config.js)."
        : "";
    return {
      error: true,
      message: msg + hint,
    };
  }
};
