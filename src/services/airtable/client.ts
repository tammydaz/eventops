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
const AIRTABLE_META_API_URL = "https://api.airtable.com/v0/meta/bases";
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY as string | undefined;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID as string | undefined;
const AIRTABLE_EVENTS_TABLE = import.meta.env.VITE_AIRTABLE_EVENTS_TABLE as string | undefined;

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

export const airtableMetaFetch = async <T>(
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

  const url = `${AIRTABLE_META_API_URL}/${baseId}${path}`;

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
