/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AIRTABLE_API_KEY?: string;
  readonly VITE_AIRTABLE_BASE_ID?: string;
  readonly VITE_AIRTABLE_EVENTS_TABLE_ID?: string;
  readonly VITE_AIRTABLE_EVENTS_TABLE?: string;
  readonly VITE_AIRTABLE_EVENTS_VIEW_ID?: string;
  readonly VITE_AIRTABLE_MASTER_MENU_SPECS_TABLE?: string;
  readonly VITE_AIRTABLE_MENU_ITEMS_TABLE?: string;
  /** Optional: "menu_lab" | "legacy" — forces catalog schema; otherwise inferred from MENU_ITEMS_TABLE id (tbl6gXRT2FPpTdf0J = Menu_Lab). */
  readonly VITE_AIRTABLE_MENU_CATALOG_SCHEMA?: string;
  readonly VITE_AIRTABLE_STATION_PRESETS_TABLE?: string;
  /** Client Intake (`tblIpmULxKigGE8p4`): corporate default delivery fields (field IDs). */
  readonly VITE_CLIENT_INTAKE_DEFAULT_CLIENT_STREET_FIELD_ID?: string;
  readonly VITE_CLIENT_INTAKE_DEFAULT_CLIENT_CITY_FIELD_ID?: string;
  readonly VITE_CLIENT_INTAKE_DEFAULT_CLIENT_STATE_FIELD_ID?: string;
  readonly VITE_CLIENT_INTAKE_DEFAULT_CLIENT_ZIP_FIELD_ID?: string;
  readonly VITE_CLIENT_INTAKE_DEFAULT_DELIVERY_NOTES_FIELD_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
