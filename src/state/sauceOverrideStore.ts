/**
 * Sauce override state per event. Stored in localStorage for persistence.
 * Key: beo-sauce-overrides-{eventId}
 * Value: Record<itemId, { sauceOverride, customSauce }>
 */

export type SauceOverrideValue = "Default" | "None" | "Other";

export interface SauceOverride {
  sauceOverride: SauceOverrideValue;
  customSauce: string | null;
}

const STORAGE_KEY = (eventId: string) => `beo-sauce-overrides-${eventId}`;

export function getSauceOverrides(eventId: string | null): Record<string, SauceOverride> {
  if (!eventId) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY(eventId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SauceOverride>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function setSauceOverride(
  eventId: string | null,
  itemId: string,
  override: SauceOverride
): void {
  if (!eventId) return;
  try {
    const current = getSauceOverrides(eventId);
    const next = { ...current, [itemId]: override };
    localStorage.setItem(STORAGE_KEY(eventId), JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
}

export function getSauceOverride(eventId: string | null, itemId: string): SauceOverride | undefined {
  return getSauceOverrides(eventId)[itemId];
}
