/**
 * Boxed lunch sandwich customization — corporate bread/spreads + encode/decode for Box Customizations.specialRequests.
 * Also mirrored to dedicated Airtable columns (field IDs in `boxedLunchOrders`); specialRequests keeps FWX_BOXED_CFG JSON.
 */

import type { BoxedLunchCheeseOption, BoxedLunchSandwichLine } from "./boxedLunchBeo";
import {
  type BoxedLunchRemovalKey,
  BOXED_LUNCH_REMOVAL_KEYS,
  sanitizeRemovalKeys,
} from "./boxedLunchCorporateCatering";

export const BOXED_LUNCH_BREAD_TYPES: readonly string[] = [
  "Sourdough",
  "Rye",
  "Multigrain",
  "French seeded roll",
  "7-grain roll",
];

/**
 * Default mayo & spicy mustard (side) are NOT stored here — they are implied unless `mayo` / `mustard`
 * appear in `removedItems`. This list is only additional spreads (checkbox UI + JSON `spreads`).
 */
export const BOXED_LUNCH_ADDITIONAL_SPREAD_LABEL = "Foodwerx secret sauce";

export const BOXED_LUNCH_SPREADS: readonly string[] = [BOXED_LUNCH_ADDITIONAL_SPREAD_LABEL];

const ADDITIONAL_SPREAD_NORMALIZED = "foodwerx secret sauce";

function normalizeSpreadToken(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Keep only allowed additional spreads; canonical label casing for storage/print. */
export function sanitizeAdditionalSpreads(raw: string[] | undefined | null): string[] {
  if (!raw || raw.length === 0) return [];
  const out: string[] = [];
  for (const s of raw) {
    if (normalizeSpreadToken(typeof s === "string" ? s : String(s)) === ADDITIONAL_SPREAD_NORMALIZED) {
      out.push(BOXED_LUNCH_ADDITIONAL_SPREAD_LABEL);
    }
  }
  return [...new Set(out)];
}

export const BOXED_LUNCH_CHEESE_OPTIONS: readonly { value: BoxedLunchCheeseOption; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "none", label: "No Cheese" },
  { value: "special", label: "Special Cheese" },
];

/** Prefix for JSON blob inside Box Customizations → specialRequests (single line). */
export const BOXED_LUNCH_CFG_PREFIX = "FWX_BOXED_CFG:";

export type BoxedLunchCustomizationPayload = {
  breadType?: string;
  spreads?: string[];
  cheeseOption?: BoxedLunchCheeseOption;
  customNotes?: string;
  removedItems?: string[];
};

const REMOVAL_PRINT_ORDER: readonly BoxedLunchRemovalKey[] = [
  "lettuce",
  "tomato",
  "mayo",
  "mustard",
  "cheese",
];

const REMOVAL_PRINT_LABEL: Record<BoxedLunchRemovalKey, string> = {
  lettuce: "No lettuce",
  tomato: "No tomato",
  mayo: "No mayo",
  mustard: "No mustard",
  cheese: "No cheese",
};

/** Individual pack labels (BEO): removals as "NO ___". */
const REMOVAL_INDIVIDUAL_LABEL: Record<BoxedLunchRemovalKey, string> = {
  lettuce: "NO lettuce",
  tomato: "NO tomato",
  mayo: "NO mayo",
  mustard: "NO mustard",
  cheese: "NO cheese",
};

export function defaultCustomizationForNewLine(): {
  breadType: string;
  spreads: string[];
  cheeseOption: BoxedLunchCheeseOption;
  customNotes: string;
  removedItems: string[];
} {
  return {
    breadType: "",
    spreads: [],
    cheeseOption: "default",
    customNotes: "",
    removedItems: [],
  };
}

/** Single-select labels on Box Customizations (Airtable). */
export function cheeseOptionLabelForAirtable(option: BoxedLunchCheeseOption | undefined): string {
  const v = option ?? "default";
  return BOXED_LUNCH_CHEESE_OPTIONS.find((o) => o.value === v)?.label ?? "Default";
}

export function cheeseOptionFromAirtableLabel(label: unknown): BoxedLunchCheeseOption {
  const t = typeof label === "string" ? label.trim() : "";
  const hit = BOXED_LUNCH_CHEESE_OPTIONS.find((o) => o.label === t);
  return hit?.value ?? "default";
}

function normalizeAirtableStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.map((x) => (typeof x === "string" ? x : String(x))).filter((s) => s.length > 0);
  }
  if (typeof v === "string" && v.trim()) {
    try {
      const p = JSON.parse(v) as unknown;
      if (Array.isArray(p)) return p.map((x) => String(x)).filter(Boolean);
    } catch {
      /* use delimiter split */
    }
    return v
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Read structured Box Customizations columns (by field id). Only keys present on `cf` are set — use with mergeCustomizationPayloads.
 */
export function partialCustomizationFromAirtableFields(
  cf: Record<string, unknown>,
  ids: {
    breadType: string;
    spreads: string;
    cheeseOption: string;
    removedItems: string;
    customNotes: string;
  }
): Partial<BoxedLunchCustomizationPayload> {
  const p: Partial<BoxedLunchCustomizationPayload> = {};
  if (Object.prototype.hasOwnProperty.call(cf, ids.breadType)) {
    p.breadType = typeof cf[ids.breadType] === "string" ? cf[ids.breadType] as string : String(cf[ids.breadType] ?? "");
  }
  if (Object.prototype.hasOwnProperty.call(cf, ids.spreads)) {
    p.spreads = sanitizeAdditionalSpreads(normalizeAirtableStringArray(cf[ids.spreads]));
  }
  if (Object.prototype.hasOwnProperty.call(cf, ids.cheeseOption)) {
    p.cheeseOption = cheeseOptionFromAirtableLabel(cf[ids.cheeseOption]);
  }
  if (Object.prototype.hasOwnProperty.call(cf, ids.removedItems)) {
    p.removedItems = sanitizeRemovalKeys(normalizeAirtableStringArray(cf[ids.removedItems]));
  }
  if (Object.prototype.hasOwnProperty.call(cf, ids.customNotes)) {
    p.customNotes = typeof cf[ids.customNotes] === "string" ? cf[ids.customNotes] as string : String(cf[ids.customNotes] ?? "");
  }
  return p;
}

export function mergeCustomizationPayloads(
  fromJson: BoxedLunchCustomizationPayload | null,
  airtablePartial: Partial<BoxedLunchCustomizationPayload>
): BoxedLunchCustomizationPayload | null {
  if (!fromJson && Object.keys(airtablePartial).length === 0) return null;
  const j: BoxedLunchCustomizationPayload = fromJson ?? {
    breadType: "",
    spreads: [],
    cheeseOption: "default",
    customNotes: "",
    removedItems: [],
  };
  const a = airtablePartial;
  return {
    breadType: a.breadType !== undefined ? a.breadType : j.breadType,
    spreads: a.spreads !== undefined ? a.spreads : j.spreads,
    cheeseOption: a.cheeseOption !== undefined ? a.cheeseOption : j.cheeseOption,
    customNotes: a.customNotes !== undefined ? a.customNotes : j.customNotes,
    removedItems: a.removedItems !== undefined ? a.removedItems : j.removedItems,
  };
}

export function encodeCustomizationForSpecialRequests(line: BoxedLunchSandwichLine): string {
  const removedSorted = [...sanitizeRemovalKeys(line.removedItems ?? [])].sort();
  const spreadsClean = sanitizeAdditionalSpreads(line.spreads ?? []);
  const payload: BoxedLunchCustomizationPayload = {
    breadType: line.breadType?.trim() || undefined,
    spreads: spreadsClean.length > 0 ? spreadsClean : undefined,
    cheeseOption: line.cheeseOption,
    customNotes: line.customNotes?.trim() || undefined,
    removedItems: removedSorted.length > 0 ? removedSorted : undefined,
  };
  return `${BOXED_LUNCH_CFG_PREFIX}${JSON.stringify(payload)}`;
}

export function decodeCustomizationFromSpecialRequests(raw: string): BoxedLunchCustomizationPayload | null {
  const t = (raw || "").trim();
  if (!t.startsWith(BOXED_LUNCH_CFG_PREFIX)) return null;
  try {
    const parsed = JSON.parse(t.slice(BOXED_LUNCH_CFG_PREFIX.length)) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const o = parsed as Record<string, unknown>;
    const cheese = o.cheeseOption;
    const cheeseOption: BoxedLunchCheeseOption =
      cheese === "none" || cheese === "special" ? cheese : "default";
    const breadType = typeof o.breadType === "string" ? o.breadType : "";
    const customNotes = typeof o.customNotes === "string" ? o.customNotes : "";
    let spreads: string[] = [];
    if (Array.isArray(o.spreads)) {
      spreads = sanitizeAdditionalSpreads(o.spreads.map((x) => (typeof x === "string" ? x : String(x))));
    }
    let removedItems: string[] = [];
    if (Array.isArray(o.removedItems)) {
      removedItems = sanitizeRemovalKeys(
        o.removedItems.map((x) => (typeof x === "string" ? x : String(x)))
      );
    }
    return { breadType, spreads, cheeseOption, customNotes, removedItems };
  } catch {
    return null;
  }
}

/**
 * Individual pack labels: only deltas — NO default condiments. Order: removals, cheese changes,
 * additional spreads, then custom notes as a separate *emphasized* line (never merged into removals/spreads).
 */
export function formatBoxedSandwichIndividualLabelSubLines(line: BoxedLunchSandwichLine): string[] {
  const out: string[] = [];
  const rem = new Set(sanitizeRemovalKeys(line.removedItems ?? []));
  const cheese = line.cheeseOption ?? "default";
  let printedNoCheese = false;

  for (const k of REMOVAL_PRINT_ORDER) {
    if (k === "cheese") {
      if (rem.has("cheese") || cheese === "none") {
        if (!printedNoCheese) {
          out.push(REMOVAL_INDIVIDUAL_LABEL.cheese);
          printedNoCheese = true;
        }
      }
      continue;
    }
    if (rem.has(k)) out.push(REMOVAL_INDIVIDUAL_LABEL[k]);
  }

  if (cheese === "special") out.push("Special cheese");

  for (const s of sanitizeAdditionalSpreads(line.spreads ?? [])) {
    if (s.trim()) out.push(s.trim());
  }

  const notes = (line.customNotes ?? "").trim();
  if (notes) out.push(`*${notes}*`);
  return out;
}

/** Kitchen/BEO grouped sublines: same rules as individual labels — no default condiments; notes last, *only*. */
export function formatBoxedSandwichKitchenSubLines(line: BoxedLunchSandwichLine): string[] {
  const out: string[] = [];
  const rem = new Set(sanitizeRemovalKeys(line.removedItems ?? []));
  const cheese = line.cheeseOption ?? "default";
  let printedNoCheese = false;

  for (const k of REMOVAL_PRINT_ORDER) {
    if (k === "cheese") {
      if (rem.has("cheese") || cheese === "none") {
        if (!printedNoCheese) {
          out.push(REMOVAL_PRINT_LABEL.cheese);
          printedNoCheese = true;
        }
      }
      continue;
    }
    if (rem.has(k)) out.push(REMOVAL_PRINT_LABEL[k]);
  }

  if (cheese === "special") out.push("Special cheese");

  for (const s of sanitizeAdditionalSpreads(line.spreads ?? [])) {
    if (s.trim()) out.push(s.trim());
  }

  const notes = (line.customNotes ?? "").trim();
  if (notes) out.push(`*${notes}*`);
  return out;
}

/** Kitchen grouped view: bread + same modification lines as formatBoxedSandwichKitchenSubLines (strings only). */
export function formatBoxedSandwichKitchenGroupedDetailStrings(line: BoxedLunchSandwichLine): string[] {
  const bread = (line.breadType ?? "").trim();
  const parts: string[] = [];
  if (bread) parts.push(`Bread: ${bread}`);
  parts.push(...formatBoxedSandwichKitchenSubLines(line));
  return parts;
}

/** Primary print label: "Turkey & Swiss (Sourdough)". */
export function formatBoxedSandwichPrimaryLabel(line: Pick<BoxedLunchSandwichLine, "name" | "breadType">): string {
  const name = (line.name ?? "").trim();
  const bread = (line.breadType ?? "").trim();
  if (!bread) return name;
  return `${name} (${bread})`;
}

/** Stable key for merging identical configurations (qty sums). */
export function boxedSandwichConfigKey(line: BoxedLunchSandwichLine): string {
  const spreads = [...sanitizeAdditionalSpreads(line.spreads ?? [])].sort().join("|");
  const removed = [...sanitizeRemovalKeys(line.removedItems ?? [])].sort().join("|");
  const cheese = line.cheeseOption ?? "default";
  const bread = (line.breadType ?? "").trim();
  const notes = (line.customNotes ?? "").trim();
  const mid = (line.menuItemId ?? "").trim();
  const name = (line.name ?? "").trim();
  return `${mid}\t${name}\t${bread}\t${spreads}\t${cheese}\t${removed}\t${notes}`;
}

export function coalesceBoxedSandwichLines(lines: BoxedLunchSandwichLine[]): BoxedLunchSandwichLine[] {
  const map = new Map<string, BoxedLunchSandwichLine>();
  for (const line of lines) {
    const name = (line.name ?? "").trim();
    if (!name) continue;
    const qty = Math.max(0, Math.floor(Number(line.qty) || 0));
    if (qty <= 0) continue;
    const key = boxedSandwichConfigKey({ ...line, name, qty });
    const existing = map.get(key);
    const removedClean = sanitizeRemovalKeys(line.removedItems ?? []);
    if (existing) {
      existing.qty = Math.max(0, Math.floor(Number(existing.qty) || 0)) + qty;
    } else {
      const spreadsClean = sanitizeAdditionalSpreads(line.spreads ?? []);
      map.set(key, {
        name,
        qty,
        menuItemId: line.menuItemId?.trim() || undefined,
        breadType: (line.breadType ?? "").trim() || undefined,
        spreads: spreadsClean.length > 0 ? spreadsClean : undefined,
        cheeseOption: line.cheeseOption ?? "default",
        removedItems: removedClean.length > 0 ? removedClean : undefined,
        customNotes: (line.customNotes ?? "").trim() || undefined,
      });
    }
  }
  return [...map.values()];
}
