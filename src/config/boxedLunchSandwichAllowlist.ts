/**
 * Which Airtable {Box Lunch Type} values (sandwich rows) apply to each boxed-lunch box Menu Item.
 * Source: FoodWerx Deli/Sandwiches boxed products + sandwich rows tagged Classic / Gourmet / Wrap.
 * Unknown box ids fall back to name heuristics, then all three types.
 */
import type { BoxLunchTypeValue } from "../services/airtable/menuItems";

export const ALL_BOX_LUNCH_SANDWICH_TYPES: BoxLunchTypeValue[] = [
  "Classic Sandwich",
  "Gourmet Sandwich",
  "Wrap",
];

/** Sandwich types allowed per box type id (Airtable record ids + static BOX_TYPES ids). */
const BY_BOX_TYPE_ID: Record<string, readonly BoxLunchTypeValue[]> = {
  // ── Static BOX_TYPES ids ──────────────────────────────────────────────
  "super-saver-werx": ["Classic Sandwich"],
  "premium-werx": ["Gourmet Sandwich", "Wrap"],
  "executive-werx": [], // Fixed trio — no sandwich picker
  "basic-saladwerx": [], // Salad mode
  "premium-saladwerx": [], // Salad mode
  "executive-saladwerx": [], // Salad mode

  // ── Airtable record ids (legacy Menu Items table) ─────────────────────
  rectixyPfz9QIIuw9: ["Classic Sandwich"],               // Classic Boxed Lunch
  recSGHORYWhLQLSee: ["Wrap"],                           // Wrap Boxed Lunch
  recigFGPiqd53lGVr: ["Gourmet Sandwich", "Wrap"],       // Signature Boxed Lunch
  recUXMB3qFzIYkXGe: ALL_BOX_LUNCH_SANDWICH_TYPES,      // VIP Boxed Lunch
  recLYTCqkmX77u5qI: [],                                 // Salad Boxed Lunch
};

function normalizeBoxName(name: string): string {
  return name.toLowerCase().replace(/[–—-]\s*$/g, "").trim();
}

/**
 * Allowed sandwich line types for the selected boxed lunch box.
 * When the box is a salad box, callers should use salad UI instead — this is for sandwich catalog tabs only.
 */
export function getAllowedBoxLunchTypesForBox(boxTypeId: string, boxName?: string): BoxLunchTypeValue[] {
  const mapped = BY_BOX_TYPE_ID[boxTypeId];
  if (mapped?.length) return [...mapped];

  const n = normalizeBoxName(boxName ?? "");

  if (n.includes("saladwerx") || n.includes("salad boxed lunch") || n.includes("salad box")) {
    return [];
  }
  if (n.includes("executive werx") || n.includes("executive werx box")) {
    return []; // Fixed trio — no sandwich picker
  }
  if (n.includes("wrap") && (n.includes("boxed") || n.includes("box"))) return ["Wrap"];
  if (n.includes("classic") && (n.includes("boxed") || n.includes("box"))) return ["Classic Sandwich"];
  if (n.includes("super saver")) return ["Classic Sandwich"];
  if (n.includes("signature") && (n.includes("boxed") || n.includes("box"))) {
    return ["Gourmet Sandwich", "Wrap"];
  }
  if (n.includes("vip") && (n.includes("boxed") || n.includes("box"))) return [...ALL_BOX_LUNCH_SANDWICH_TYPES];
  if (n.includes("premium werx") || (n.includes("premium") && n.includes("werx") && !n.includes("salad"))) {
    return ["Gourmet Sandwich", "Wrap"];
  }

  return [...ALL_BOX_LUNCH_SANDWICH_TYPES];
}
