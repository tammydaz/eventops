const AIRTABLE_API_URL = "https://api.airtable.com/v0";

const AIRTABLE_API_KEY = (import.meta.env.VITE_AIRTABLE_API_KEY as string | undefined)?.trim();
const AIRTABLE_BASE_ID = (import.meta.env.VITE_AIRTABLE_BASE_ID as string | undefined)?.trim();
const AIRTABLE_EVENTS_TABLE = (import.meta.env.VITE_AIRTABLE_EVENTS_TABLE as
  | string
  | undefined)?.trim();

export type EventRecord = {
  id: string;
  fields: Record<string, unknown>;
};

type AirtableListResponse = {
  records: Array<{
    id: string;
    fields: Record<string, unknown>;
  }>;
};

const requireEnv = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
};

const getHeaders = () => {
  const key = requireEnv(AIRTABLE_API_KEY, "VITE_AIRTABLE_API_KEY");
  const cleanKey = key.replace(/[^\x00-\x7F]/g, "").trim();
  return {
    Authorization: `Bearer ${cleanKey}`,
    "Content-Type": "application/json",
  };
};

export const listEvents = async (): Promise<EventRecord[]> => {
  const baseId = requireEnv(AIRTABLE_BASE_ID, "VITE_AIRTABLE_BASE_ID");
  const table = requireEnv(AIRTABLE_EVENTS_TABLE, "VITE_AIRTABLE_EVENTS_TABLE");
  const params = new URLSearchParams({
    maxRecords: "200",
    cellFormat: "json",
  });
  const url = `${AIRTABLE_API_URL}/${baseId}/${table}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  const data = (await response.json()) as AirtableListResponse | {
    error?: { message?: string };
  };

  if (!response.ok || (data as { error?: { message?: string } }).error) {
    const message = (data as { error?: { message?: string } }).error?.message;
    throw new Error(message || `Airtable request failed: ${response.status}`);
  }

  return (data as AirtableListResponse).records.map((record) => ({
    id: record.id,
    fields: record.fields,
  }));
};
