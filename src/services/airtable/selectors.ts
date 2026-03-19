import type { AirtableErrorResult } from "./client";

export const isErrorResult = (value: unknown): value is AirtableErrorResult => {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && "error" in value);
};

export const asString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value);
};

export const asOptionalString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const normalized = String(value);
  return normalized === "" ? undefined : normalized;
};

export const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    return Number.isNaN(numeric) ? undefined : numeric;
  }
  return undefined;
};

export const asBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  return false;
};

export const asSingleSelectName = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name?: string }).name ?? "");
  }
  return "";
};

export const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

/** Multi-select field: returns array of option names. Handles array of strings or array of { name }. Backward compat: single string → [string]. */
export const asMultiSelectNames = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : item && typeof item === "object" && "name" in item ? String((item as { name?: string }).name ?? "") : ""))
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) return [value];
  return [];
};

/** Bar Service field (single or multi-select): returns first selected option for display. Use when field may be array. */
export const asBarServicePrimary = (value: unknown): string => {
  const arr = asMultiSelectNames(value);
  return arr[0] ?? "";
};

export const asLinkedRecordIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "id" in item) {
        return String((item as { id?: string }).id ?? "");
      }
      return "";
    })
    .filter((item) => item.length > 0);
};

export type AttachmentItem = {
  id?: string;
  url: string;
  filename: string;
};

export const asAttachments = (value: unknown): AttachmentItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const url = "url" in item ? String((item as { url?: string }).url ?? "") : "";
      const filename =
        "filename" in item ? String((item as { filename?: string }).filename ?? "") : "";
      const idValue = "id" in item ? String((item as { id?: string }).id ?? "") : "";
      if (!url || !filename) return null;
      const base = { url, filename } as AttachmentItem;
      return idValue ? { ...base, id: idValue } : base;
    })
    .filter((item): item is AttachmentItem => item !== null);
};
