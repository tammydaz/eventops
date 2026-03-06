/**
 * Stations table structure (linked to Events via Events.Stations).
 * Set VITE_AIRTABLE_STATIONS_TABLE in .env if different from "Stations".
 *
 * Field IDs from Airtable schema:
 * - Stations table: tblhFwUfREbpfFXhv
 * - Menu Items table: tbl0aN33DGG6R1sPZ
 * - Stations.Station Items: fldRo8xgmoIR2yecn (links to Menu Items)
 * - Stations.Event: fldoOaZsMyXiSNKTc (links to Events)
 * - Menu Items.Station Type: fldBSOxpjxcVnIYhK (categorizes item by station)
 */

/** Stations table ID. */
export const STATIONS_TABLE_ID = "tblhFwUfREbpfFXhv";

/** Station Items (Stations table, linked record → Menu Items). */
export const STATION_ITEMS_FIELD_ID = "fldRo8xgmoIR2yecn";

/** Event (Stations table, linked record → Events). */
export const STATION_EVENT_FIELD_ID = "fldoOaZsMyXiSNKTc";

/** Station Type (Stations table, single-select). From schema: fldQ1bGDg8jhJvqmJ */
export const STATION_TYPE_FIELD_ID = "fldQ1bGDg8jhJvqmJ";

/** Station Type single-select options (from Stations table). */
export const STATION_TYPE_OPTIONS = [
  "Pasta Station",
  "Carving Station",
  "Taco Station",
  "Kids Station",
  "Dessert Station",
  "Action Station",
  "Grazing Display / Interactive Station",
  "Other",
] as const;
