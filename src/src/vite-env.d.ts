/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AIRTABLE_API_KEY?: string;
  readonly VITE_AIRTABLE_BASE_ID?: string;
  readonly VITE_AIRTABLE_EVENTS_TABLE_ID?: string;
  readonly VITE_AIRTABLE_EVENTS_VIEW_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
