/**
 * FoodWerx Kitchen BEO Auto-Spec Engine
 * Following Tammy's Dropbox Blueprint Rules
 * 
 * Pattern-based calculations (NOT linear math)
 * Based on real event analysis from operational data
 */

export type AutoSpecResult = {
  quantity: string;
  notes?: string;
  flagForReview?: boolean;
};

export type FoodCategory = "passed" | "presented" | "buffet" | "dessert";

/**
 * Calculate spec quantities based on category and guest count
 * Uses tiered, pattern-based logic from Tammy's approved rules
 */
export function calculateAutoSpec(
  itemName: string,
  category: FoodCategory,
  guestCount: number
): AutoSpecResult {
  if (!guestCount || guestCount === 0) {
    return { quantity: "—", flagForReview: true };
  }

  const name = itemName.toLowerCase();

  // =======================================
  // PASSED & PRESENTED APPETIZERS
  // =======================================
  if (category === "passed" || category === "presented") {
    // Special case: Meatballs and cakes = 1.5 oz per guest
    if (name.includes("meatball") || name.includes("cake")) {
      const oz = Math.ceil(guestCount * 1.5);
      return { quantity: `${oz} oz` };
    }

    // Standard passed/presented = 2 oz per guest
    const oz = Math.ceil(guestCount * 2);
    return { quantity: `${oz} oz` };
  }

  // =======================================
  // BUFFET ITEMS
  // =======================================
  if (category === "buffet") {
    let fullPans = 0;
    let halfPans = 0;

    // Tiered guest count logic (Tammy's tier-based system)
    if (guestCount <= 25) {
      halfPans = 1;
    } else if (guestCount <= 50) {
      fullPans = 1;
    } else if (guestCount <= 75) {
      fullPans = 1;
      halfPans = 1;
    } else if (guestCount <= 100) {
      fullPans = 2;
    } else if (guestCount <= 150) {
      fullPans = 3;
    } else if (guestCount <= 200) {
      fullPans = 4;
    } else {
      // Over 200: 1 full pan per 50 guests
      fullPans = Math.ceil(guestCount / 50);
    }

    // Convert half pans: 2 halves = 1 full
    if (halfPans >= 2) {
      fullPans += Math.floor(halfPans / 2);
      halfPans = halfPans % 2;
    }

    // Build quantity string
    let result = "";
    if (fullPans > 0) result += `${fullPans} full`;
    if (halfPans > 0) result += (result ? " + " : "") + `${halfPans} half`;

    // Special notes
    let notes: string | undefined;
    let flagForReview = false;

    // Round pan detection
    if (name.includes("round") || name.includes("cake")) {
      notes = "⚠️ Round chafer required";
    }

    // Odd half pan flag
    if (halfPans === 1) {
      flagForReview = true;
      notes = notes ? `${notes} • Odd half pan` : "⚠️ Odd half pan";
    }

    return { 
      quantity: result || "1 full", 
      notes,
      flagForReview 
    };
  }

  // =======================================
  // DESSERTS
  // =======================================
  if (category === "dessert") {
    // 1 per guest (no linear math exceptions)
    return { quantity: `${guestCount} pcs` };
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
