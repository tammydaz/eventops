/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AIRTABLE_API_KEY?: string;
  readonly VITE_AIRTABLE_BASE_ID?: string;
  readonly VITE_AIRTABLE_EVENTS_TABLE_ID?: string;
  readonly VITE_AIRTABLE_EVENTS_TABLE?: string;
  readonly VITE_AIRTABLE_EVENTS_VIEW_ID?: string;
  readonly VITE_AIRTABLE_MASTER_MENU_SPECS_TABLE?: string;
  readonly VITE_AIRTABLE_MENU_ITEMS_TABLE?: string;
  readonly VITE_AIRTABLE_STATION_PRESETS_TABLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
