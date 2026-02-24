/**
 * FoodWerx Kitchen BEO Auto-Spec Engine
 * OFFICIAL CONSERVATIVE HYBRID RULES
 * 
 * These are the locked business rules.
 * Do not modify without operational approval.
 * Do not apply generic banquet math.
 * Output must match FoodWerx kitchen terminology exactly.
 * 
 * CRITICAL: This engine does NOT infer item types from names.
 * It relies strictly on the FoodCategory input.
 * If categorization is wrong, that is a data problem, not a spec engine problem.
 */

export type AutoSpecResult = {
  quantity: string;
  notes?: string;
  flagForReview?: boolean;
};

export type FoodCategory = "passed" | "presented" | "buffet" | "dessert";

/**
 * Round to nearest 5
 */
function roundToNearest5(value: number): number {
  return Math.round(value / 5) * 5;
}

/**
 * Calculate spec quantities based on FoodWerx conservative hybrid rules
 * 
 * @param itemName - Item name (used only for display, NOT for logic)
 * @param category - Food category (determines spec rule)
 * @param guestCount - Number of guests
 */
export function calculateAutoSpec(
  itemName: string,
  category: FoodCategory,
  guestCount: number
): AutoSpecResult {
  if (!guestCount || guestCount === 0) {
    return { quantity: "—", flagForReview: true };
  }

  // =======================================
  // PASSED & PRESENTED APPETIZERS
  // =======================================
  if (category === "passed" || category === "presented") {
    // 1.35 pieces per guest per item
    // Round to nearest 5
    const rawPieces = guestCount * 1.35;
    const pieces = roundToNearest5(rawPieces);
    return { quantity: `${pieces} PC` };
  }

  // =======================================
  // BUFFET ITEMS (SIDES DEFAULT)
  // =======================================
  if (category === "buffet") {
    // Default: SIDES logic (most common, most conservative)
    // 1 HOTEL per 40 servings
    const hotelCount = Math.ceil(guestCount / 40);
    return { 
      quantity: `${hotelCount} HOTEL`,
      notes: "⚠️ Verify if protein or sauce (manual override may be needed)"
    };
  }

  // =======================================
  // DESSERTS
  // =======================================
  if (category === "dessert") {
    // 1 per guest, round to nearest 5
    const pieces = roundToNearest5(guestCount);
    return { quantity: `${pieces} PC` };
  }

  // Fallback
  return { quantity: "—", flagForReview: true };
}

/**
 * Parse menu item name to separate main name from sauce/description
 * Sauce lines should be indented under parent
 */
export function parseMenuItem(fullName: string): {
  name: string;
  sauce?: string;
} {
  const lines = fullName.split("\n").filter((l) => l.trim());
  
  if (lines.length > 1) {
    return {
      name: lines[0].trim(),
      sauce: lines.slice(1).join("\n").trim(),
    };
  }

  return { name: fullName.trim() };
}

/**
 * Determine if buffet items need to be split into Metal vs China
 * Returns indices for splitting the array
 */
export function splitBuffetItems(itemIds: string[]): {
  metalIds: string[];
  chinaIds: string[];
} {
  // Placeholder logic - in production, this would check item metadata
  // For now: first half = metal, second half = china
  const midpoint = Math.ceil(itemIds.length / 2);
  
  return {
    metalIds: itemIds.slice(0, midpoint),
    chinaIds: itemIds.slice(midpoint),
  };
}

/**
 * Format time strings for display
 */
export function formatTime(timeString: string | null | undefined): string {
  if (!timeString) return "—";
  
  // If already formatted, return as-is
  if (timeString.includes("AM") || timeString.includes("PM")) {
    return timeString;
  }

  // Parse 24-hour time and convert to 12-hour
  const match = timeString.match(/(\d{1,2}):(\d{2})/);
  if (!match) return timeString;

  const hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes} ${ampm}`;
}

/**
 * Nick's Spec Column dropdown options
 * These are the approved kitchen prep instructions
 */
export const NICK_SPEC_OPTIONS = [
  "Keep warm",
  "Heat under lamp",
  "Pass with napkins",
  "Arrange on platters",
  "Pack one dairy-free",
  "Display under heat lamp",
  "Individual boxes",
  "Serve chilled",
  "Room temperature",
  "Passed butler style",
  "Present on risers",
  "Keep refrigerated",
  "Reheat before service",
] as const;

export type NickSpecOption = typeof NICK_SPEC_OPTIONS[number];
