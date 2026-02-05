export const AIRTABLE_API_KEY_ENV = "VITE_AIRTABLE_API_KEY";
export const AIRTABLE_BASE_ID_ENV = "VITE_AIRTABLE_BASE_ID";
export const AIRTABLE_EVENTS_TABLE_ID_ENV = "VITE_AIRTABLE_EVENTS_TABLE_ID";
export const AIRTABLE_EVENTS_VIEW_ID_ENV = "VITE_AIRTABLE_EVENTS_VIEW_ID";

export const EVENT_NAME_FIELD_ID = "fldZuHc9D29Wcj60h";

export const requiredEnv = (key: string): string => {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  if (!value) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
};

export const optionalEnv = (key: string): string | undefined => {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  return value || undefined;
};
