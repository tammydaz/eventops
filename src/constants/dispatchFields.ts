/**
 * Dispatch & Deliveries Hub — field mapping for autopopulation from Airtable.
 * Add field IDs here when you have them; until then, fields show "—" or fallback values.
 *
 * To find field IDs: Airtable → Table → Field → Customize field type → (ID in URL or API)
 */

/** Server Name (full-service) — add field ID when available in Airtable. Empty = use CAPTAIN as fallback. */
export const DISPATCH_SERVER_NAME_FIELD =
  (import.meta.env.VITE_AIRTABLE_DISPATCH_SERVER_NAME_FIELD as string | undefined)?.trim() || "";

/** Van # (full-service) — add field ID when available. Empty = use Vehicle/load-out field if you have one. */
export const DISPATCH_VAN_NUMBER_FIELD =
  (import.meta.env.VITE_AIRTABLE_DISPATCH_VAN_NUMBER_FIELD as string | undefined)?.trim() || "";
