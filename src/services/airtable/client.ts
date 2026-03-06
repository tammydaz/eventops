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

const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const AIRTABLE_API_KEY = (import.meta.env.VITE_AIRTABLE_API_KEY as string | undefined)?.trim();
const AIRTABLE_BASE_ID = (import.meta.env.VITE_AIRTABLE_BASE_ID as string | undefined)?.trim();
const AIRTABLE_EVENTS_TABLE = (import.meta.env.VITE_AIRTABLE_EVENTS_TABLE as string | undefined)?.trim();
const AIRTABLE_STATIONS_TABLE = (import.meta.env.VITE_AIRTABLE_STATIONS_TABLE as string | undefined)?.trim() || "tblhFwUfREbpfFXhv";
const AIRTABLE_MASTER_MENU_SPECS_TABLE = (import.meta.env.VITE_AIRTABLE_MASTER_MENU_SPECS_TABLE as string | undefined)?.trim();
const AIRTABLE_MENU_ITEMS_TABLE = (import.meta.env.VITE_AIRTABLE_MENU_ITEMS_TABLE as string | undefined)?.trim();

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
  getEnvValue(AIRTABLE_EVENTS_TABLE, "VITE_AIRTABLE_EVENTS_TABLE");

export const getStationsTable = (): string =>
  AIRTABLE_STATIONS_TABLE || "Stations";

export const getMasterMenuSpecsTable = (): string =>
  AIRTABLE_MASTER_MENU_SPECS_TABLE || "tblGeCmzJscnocs1T";

export const getMenuItemsTable = (): string =>
  AIRTABLE_MENU_ITEMS_TABLE || "tbl0aN33DGG6R1sPZ";

export const getBaseId = (): string | AirtableErrorResult =>
  getEnvValue(AIRTABLE_BASE_ID, "VITE_AIRTABLE_BASE_ID");

export const getApiKey = (): string | AirtableErrorResult =>
  getEnvValue(AIRTABLE_API_KEY, "VITE_AIRTABLE_API_KEY");

export const airtableFetch = async <T>(
  path: string,
  init?: RequestInit
): Promise<T | AirtableErrorResult> => {
  const baseId = getEnvValue(AIRTABLE_BASE_ID, "VITE_AIRTABLE_BASE_ID");
  if (typeof baseId !== "string") {
    return baseId;
  }

  const apiKey = getEnvValue(AIRTABLE_API_KEY, "VITE_AIRTABLE_API_KEY");
  if (typeof apiKey !== "string") {
    return apiKey;
  }

  const url = `${AIRTABLE_API_URL}/${baseId}${path}`;

  console.log("🔍 Airtable Fetch Debug:", {
    baseId,
    path,
    fullUrl: url,
    method: init?.method || "GET",
    body: init?.body,
  });

  try {
    const headers = getHeaders(apiKey);
    
    // Debug: Check for non-ASCII in Authorization header
    const authHeader = headers.Authorization;
    const hasNonAscii = /[^\x00-\x7F]/.test(authHeader);
    if (hasNonAscii) {
      console.error("Non-ASCII character found in Authorization header:", authHeader);
      return {
        error: true,
        message: `Authorization header contains non-ASCII characters. Please check your API key.`,
      };
    }

    const response = await fetch(url, {
      ...init,
      headers: {
        ...headers,
        ...(init?.headers ?? {}),
      },
    });

    const data = (await response.json()) as T & AirtableApiError;

    if (!response.ok || data?.error) {
      const errMsg = (data as { error?: { message?: string; type?: string } })?.error?.message;
      const errType = (data as { error?: { message?: string; type?: string } })?.error?.type;
      console.error('❌ AIRTABLE ERROR (422 = invalid field value):', response.status, errType || '', errMsg || JSON.stringify(data));
      console.error('Request body:', init?.body);
      return {
        error: true,
        message: data?.error?.message || `Airtable request failed: ${response.status}`,
      };
    }

    console.log("🔍 Airtable Fetch Response:", JSON.stringify(data, null, 2));
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
  const baseId = getEnvValue(AIRTABLE_BASE_ID, "VITE_AIRTABLE_BASE_ID");
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
