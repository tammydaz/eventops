/**
 * Stations table structure (linked to Events via Events.Stations).
 * Set VITE_AIRTABLE_STATIONS_TABLE in .env if different from "Stations".
 *
 * Field IDs from Airtable:
 * - Events.Stations: fldbbDlpheiUGQbKu (links event to stations)
 * - Menu Items.Stations: fldQviHhoK29mq15H (links menu item to stations — same link as Station Items)
 * - Menu Items.Station Type: fldBSOxpjxcVnIYhK (on Menu Items; Stations table has its own Station Type)
 */

/** Station Items (Stations table, linked record → Menu Items). Same link as Menu Items.Stations. */
export const STATION_ITEMS_FIELD_ID = "fldQviHhoK29mq15H";

/** Event (Stations table, linked record → Events). Same link as Events.Stations. */
export const STATION_EVENT_FIELD_ID = "fldbbDlpheiUGQbKu";

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
