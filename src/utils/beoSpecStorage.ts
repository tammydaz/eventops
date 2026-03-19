/**
 * Shared key format for BEO spec overrides so intake and BEO print use the same localStorage keys.
 * Bar mixers use fieldId "bev-mixers" and item ids "bev-mixer-0", etc.; menu sections use
 * Airtable field ids (e.g. PASSED_APPETIZERS) and menu item record ids.
 */
export const getBeoSpecStorageKey = (eventId: string): string =>
  `beo-spec-overrides-${eventId}`;

export const getShadowMenuStorageKey = (eventId: string): string =>
  `beo-shadow-menu-${eventId}`;

export const getSpecOverrideKey = (fieldId: string, itemId: string, rowIdx: number): string =>
  `${fieldId}:${itemId}:${rowIdx}`;
