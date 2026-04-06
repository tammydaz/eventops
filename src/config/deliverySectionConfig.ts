/**
 * Single source of truth for delivery BEO menu sections (intake, print, and kitchen BEO).
 * Do not duplicate section lists elsewhere — import this.
 *
 * Sections are NOT Airtable fields. Sections are filters on the Execution Type field in Menu_Lab.
 * Field ID for Execution Type: fldnP7tCisqdDkaOI
 */

/** Airtable field ID for the Execution Type field in the Menu_Lab table. */
export const EXECUTION_TYPE_FIELD_ID = "fldnP7tCisqdDkaOI";

export type DeliverySectionConfigRow = {
  title: string;
  /** Matches the Execution Type value in Menu_Lab / Event Menu shadow row section. */
  executionType: string;
};

/** Locked delivery structure — sections derived from Execution Type, never from event field IDs. */
export const DELIVERY_SECTION_CONFIG: readonly DeliverySectionConfigRow[] = [
  { title: "CHAFER HOT",       executionType: "CHAFER HOT" },
  { title: "CHAFER READY",     executionType: "CHAFER READY" },
  { title: "COLD DISPLAY",     executionType: "COLD DISPLAY" },
  { title: "INDIVIDUAL PACKS", executionType: "INDIVIDUAL PACKS" },
  { title: "BULK SIDES",       executionType: "BULK SIDES" },
  { title: "DESSERTS",         executionType: "DESSERTS" },
] as const;

/**
 * Event Menu (shadow) "Section" values that belong to each DELIVERY_SECTION_CONFIG row (same order).
 * Each section maps 1-to-1 with its executionType — no field ID wiring.
 * Used to aggregate preview rows and order sections.
 */
export const DELIVERY_SECTION_SHADOW_KEYS: readonly (readonly string[])[] = [
  ["CHAFER HOT"],
  ["CHAFER READY"],
  ["COLD DISPLAY"],
  ["INDIVIDUAL PACKS"],
  ["BULK SIDES"],
  ["DESSERTS"],
] as const;
