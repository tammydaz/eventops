/**
 * Delivery package presets — guided "Pick N" choice groups.
 *
 * When a package is selected from the Packages panel, the DeliveryPackageConfigModal
 * opens so staff can record which options the client chose. Selections are saved
 * as customText on the shadow-menu row and appear on the BEO under the parent item.
 *
 * Pattern mirrors stationPresets.ts / StationComponentsConfigModal.
 */

export type DeliveryPanelCategory =
  | "breakfast"
  | "lunch_platter"
  | "hot_lunch";

export interface DeliveryPickGroup {
  /** Section heading shown in the modal (e.g. "Eggs — Pick 1") */
  label: string;
  /** How many options the client must choose */
  pickCount: number;
  /** Available choices */
  options: readonly string[];
}

export interface DeliveryPackagePreset {
  key: string;
  /** Exact display name shown in the panel and used to look up the Airtable record */
  displayName: string;
  /** Panel grouping category */
  panelCategory: DeliveryPanelCategory;
  /** Which shadow-menu section this package routes to */
  routeTargetField: "buffetMetal" | "deliveryDeli";
  /** Match patterns used to identify this preset from an item name (fallback for picker flow) */
  matchPatterns: readonly string[];
  /** Groups the staff works through in the modal */
  groups: readonly DeliveryPickGroup[];
  /** Items that are always included — shown as locked lines, no selection needed */
  autoIncluded?: readonly string[];
}

// ─── Breakfast Packages ──────────────────────────────────────────────────────

export const ITS_YOUR_CHOICE_BREAKFAST: DeliveryPackagePreset = {
  key: "its-your-choice-breakfast",
  displayName: "It's Your Choice Breakfast",
  panelCategory: "breakfast",
  routeTargetField: "buffetMetal",
  matchPatterns: ["it's your choice", "its your choice", "choice breakfast"],
  groups: [
    {
      label: "Eggs — Pick 1",
      pickCount: 1,
      options: ["Scrambled Eggs", "3-Cheese Scrambled Eggs"],
    },
    {
      label: "Starch — Pick 1",
      pickCount: 1,
      options: [
        "foodwerx Home Fried Potatoes (onion & pepper confetti)",
        "Shredded Potato Hash Browns & Cheddar Casserole",
      ],
    },
    {
      label: "Meats — Pick 2",
      pickCount: 2,
      options: ["Hickory Bacon", "Sausage Links", "Country Ham", "Turkey Sausage"],
    },
    {
      label: "Pastry — Pick 1",
      pickCount: 1,
      options: ["French Toast Casserole", "Belgium Waffles"],
    },
    {
      label: "Fruit / Dairy — Pick 1",
      pickCount: 1,
      options: ["Seasonal Fruit Salad", "Individual Yogurt Sundaes"],
    },
    {
      label: "Beverage — Pick 1",
      pickCount: 1,
      options: ["Orange Juice Service", "Coffee Service"],
    },
  ],
};

export const BB_BASIC_BREAKFAST: DeliveryPackagePreset = {
  key: "bb-basic-breakfast",
  displayName: "BB Basic Breakfast",
  panelCategory: "breakfast",
  routeTargetField: "buffetMetal",
  matchPatterns: ["bb basic breakfast", "basic breakfast"],
  groups: [
    {
      label: "Add-On — Pick 1 (optional)",
      pickCount: 1,
      options: ["Hickory Bacon", "Sausage Links", "None"],
    },
  ],
  autoIncluded: [
    "Scrambled Eggs",
    "Chefs' Skillet Potatoes with Pepper Trio & Onions",
    "Bagel Assortment with Cream Cheese Spreads & Whipped Butter",
  ],
};

export const ENGLISH_MUFFIN_WRAP_SANDWICHES: DeliveryPackagePreset = {
  key: "english-muffin-wrap",
  displayName: "English Muffin & Wrap Sandwiches",
  panelCategory: "breakfast",
  routeTargetField: "buffetMetal",
  matchPatterns: ["english muffin & wrap", "english muffin wrap"],
  groups: [
    {
      label: "Sandwich Selections — Pick 3",
      pickCount: 3,
      options: [
        "Scrambled Eggs, Bacon & American Cheese",
        "Egg Whites, Sautéed Spinach, Roma Tomatoes & Feta",
        "Crispy Chicken, Sliced Tomato & Cheddar Cheese",
        "Pork Roll, Roasted Peppers & Provolone",
        "Scrambled Eggs, Grilled Vegetables & Mozzarella",
      ],
    },
    {
      label: "Add-On — Pick 1 (optional)",
      pickCount: 1,
      options: ["Chefs' Skillet Potatoes or Tater Tots (+$2pp)", "Seasonal Fruit (+$4pp)", "None"],
    },
  ],
};

export const ONE_HAND_PICKUP: DeliveryPackagePreset = {
  key: "one-hand-pickup",
  displayName: "One Hand Pick Up Breakfast",
  panelCategory: "breakfast",
  routeTargetField: "buffetMetal",
  matchPatterns: ["one hand pick up", "one hand pickup", "mini roll", "petite croissant"],
  groups: [
    {
      label: "Sandwich Selections — Pick 3",
      pickCount: 3,
      options: [
        "Scrambled Eggs, Turkey Sausage, Brie & Fig Jam",
        "Egg Whites, Kale, Caramelized Sweet Onions & Parmesan",
        "Scrambled Eggs, Honey Ham, Tomatoes & Cheddar",
        "Grilled Vegetables, Fresh Basil & Sharp Provolone",
        "Scrambled Eggs, Bacon, Sautéed Mushrooms & Swiss",
      ],
    },
    {
      label: "Bread — Pick 1",
      pickCount: 1,
      options: ["Mini Rolls", "Small Bagels", "Petite Croissants"],
    },
  ],
};

// ─── Lunch Platter Packages ───────────────────────────────────────────────────

export const CLASSIC_SANDWICH_PLATTER: DeliveryPackagePreset = {
  key: "classic-sandwich-platter",
  displayName: "Classic Sandwich Platter",
  panelCategory: "lunch_platter",
  routeTargetField: "deliveryDeli",
  matchPatterns: ["classic sandwich platter", "classic sandwich"],
  groups: [
    {
      label: "Sandwich Selections — Pick 5",
      pickCount: 5,
      options: [
        "Honey Ham & American Cheese",
        "Oven Roasted Turkey & Swiss",
        "Roast Beef & White Cheddar",
        "Grilled Chicken & Pepper Jack",
        "Tuna Salad",
        "White Grape Chicken Salad",
        "Genoa Salami, Capicola & Provolone",
      ],
    },
    {
      label: "Salad Upgrade",
      pickCount: 1,
      options: [
        "1 Classic Salad (included)",
        "2 Classic Salads (+$3pp)",
        "1 Signature Salad (+$3pp)",
      ],
    },
  ],
  autoIncluded: [
    "Sourdough, Rye & Multigrain breads / French seeded & 7-grain rolls",
    "Sliced Roma Tomatoes & Green Leaf Lettuce",
    "Mayonnaise & Spicy Mustard",
  ],
};

export const GOURMET_SANDWICH_PLATTER: DeliveryPackagePreset = {
  key: "gourmet-sandwich-platter",
  displayName: "Gourmet Signature Sandwich Platter",
  panelCategory: "lunch_platter",
  routeTargetField: "deliveryDeli",
  matchPatterns: ["gourmet signature sandwich platter", "gourmet sandwich platter", "signature specialty platter"],
  groups: [
    {
      label: "Sandwich Selections — Pick 5",
      pickCount: 5,
      options: [
        "S1 Acapulco Turkey BLT",
        "S2 Smoked Turkey with Green Apples & Brie",
        "S3 Spa Turkey",
        "S4 Smoked Turkey & Crispy Bacon",
        "S5 Parmesan Crusted Chicken Cutlet",
        "S6 The Greek Chicken",
        "S7 Honey Stung Chicken",
        "S8 Herb Grilled Chicken Breast",
        "S9 Savory & Sweet Flank Steak",
        "S10 Eye Round of Beef",
        "S11 Grilled Flank Steak",
        "S12 Beef, Blue & Balsamic",
        "S13 Honey Ham & Brie",
        "S14 Ham & Cheese Squared",
        "S15 foodwerx Italian Hoagie",
        "S16 Prosciutto de Parma",
        "S17 Southwest Shrimp Salad",
        "S18 Tuna Salad BLT",
        "S25 Marinated Grilled Vegetables",
        "S26 Napa Valley",
        "S27 Sharp Caprese",
      ],
    },
    {
      label: "Salad Selection — Pick 1",
      pickCount: 1,
      options: [
        "1 Classic Salad (included)",
        "2 Classic Salads (+$2pp)",
        "1 Signature Salad (+$2pp)",
      ],
    },
  ],
};

export const SIGNATURE_WRAP_PLATTER: DeliveryPackagePreset = {
  key: "signature-wrap-platter",
  displayName: "Signature Wrap Platter",
  panelCategory: "lunch_platter",
  routeTargetField: "deliveryDeli",
  matchPatterns: ["signature wrap platter", "werx wrap platter"],
  groups: [
    {
      label: "Wrap Selections — Pick 5",
      pickCount: 5,
      options: [
        "W1 Crunch Chicken",
        "W2 Turkey, Tuna or Chicken BLT",
        "W3 Flat Iron Seared Eye Round",
        "W4 Chicken Caesar",
        "W5 Grilled Vegetable",
        "W6 Zesty Mediterranean",
        "W7 Cuban Chicken & Honey Ham",
        "W8 Porta-mato-luscious",
        "W9 Buffalo Chicken",
      ],
    },
    {
      label: "Salad Selection — Pick 1",
      pickCount: 1,
      options: ["1 Classic Salad (included)", "2 Classic Salads (+$2pp)", "1 Signature Salad (+$2pp)"],
    },
  ],
};

export const PANINI_PRESS_PLATTER: DeliveryPackagePreset = {
  key: "panini-press-platter",
  displayName: "Panini Press Platter",
  panelCategory: "lunch_platter",
  routeTargetField: "deliveryDeli",
  matchPatterns: ["panini press platter", "panini press"],
  groups: [
    {
      label: "Panini Selections — Pick 5",
      pickCount: 5,
      options: [
        "Italiano (Genoa, prosciutto, capicola & sharp provolone)",
        "Biggie Beef (Flat iron seared eye round, cheddar, bacon & fried hot peppers)",
        "Turkey (Oven roasted turkey, swiss, caramelized onions & pickles)",
        "Cheezie Veg (Grilled vegetables & baby spinach with buffalo mozzarella)",
        "Honey Roasted Ham & Brie (frizzled onion straws, crumbled bacon, arugula & fig jam)",
      ],
    },
    {
      label: "Salad Selection — Pick 1",
      pickCount: 1,
      options: ["1 Classic Salad (included)", "2 Classic Salads (+$2pp)", "1 Signature Salad (+$2pp)"],
    },
  ],
};

export const PHILLY_HOAGIE_PLATTER: DeliveryPackagePreset = {
  key: "philly-hoagie-platter",
  displayName: "Philadelphia Hoagie Platter",
  panelCategory: "lunch_platter",
  routeTargetField: "deliveryDeli",
  matchPatterns: ["philadelphia hoagie platter", "philly hoagie"],
  groups: [
    {
      label: "Hoagie Selections — Pick 5",
      pickCount: 5,
      options: [
        "Italian by foodwerx",
        "Roast Beef",
        "Simple Ham & Cheese",
        "Oven Roasted Turkey",
        "Spicy (Mild) Tuna Salad",
        "Crispy Chicken Cutlet & Chards of Pecorino Romano",
        "Vegetarian (Seasonal Grilled Vegetables)",
      ],
    },
    {
      label: "Salad Selection — Pick 1",
      pickCount: 1,
      options: ["1 Classic Salad (included)", "2 Classic Salads (+$2pp)", "1 Signature Salad (+$2pp)"],
    },
  ],
  autoIncluded: ["Brick Oven Sesame Semolina Hoagie Rolls"],
};

// ─── Hot Lunch Packages ───────────────────────────────────────────────────────

export const PHILLY_CHEESESTEAK: DeliveryPackagePreset = {
  key: "philly-cheesesteak",
  displayName: "Philly Cheesesteak",
  panelCategory: "hot_lunch",
  routeTargetField: "buffetMetal",
  matchPatterns: ["philly cheesesteak", "cheesesteak station"],
  groups: [
    {
      label: "Protein — Pick 1",
      pickCount: 1,
      options: ["Beef Only", "Chicken Only", "Beef & Chicken"],
    },
  ],
  autoIncluded: [
    "Sautéed Onions, Peppers & Mushrooms",
    "Cheese Wiz & American Cheese",
    "Crusty Baguettes",
    "Crispy Boardwalk Potato Wedges (Sea Salt & Malt Vinegar)",
    "Choice of Classic Salad",
  ],
};

export const TACO_TIME: DeliveryPackagePreset = {
  key: "taco-time",
  displayName: "Taco Time",
  panelCategory: "hot_lunch",
  routeTargetField: "buffetMetal",
  matchPatterns: ["taco time"],
  groups: [
    {
      label: "Protein — Pick 1",
      pickCount: 1,
      options: ["Chili Seasoned Ground Beef Only", "Chipotle Chicken Only", "Beef & Chicken"],
    },
  ],
  autoIncluded: [
    "Sautéed Peppers & Onions",
    "Chopped Tomatoes, Shredded Lettuce, Cheddar Cheese",
    "Sour Cream, foodwerx Housemade Guacamole & Scallions",
    "Corn Tortillas & Soft Shell Tortillas",
    "Spanish Rice",
    "Choice of Classic Salad",
  ],
};

export const FAJITA_FESTIVAL: DeliveryPackagePreset = {
  key: "fajita-festival",
  displayName: "Fajita Festival",
  panelCategory: "hot_lunch",
  routeTargetField: "buffetMetal",
  matchPatterns: ["fajita festival"],
  groups: [
    {
      label: "Protein — Pick 1",
      pickCount: 1,
      options: ["Chili-Lime Chicken Only", "Carne Asada Flank Steak Only", "Chicken & Steak"],
    },
  ],
  autoIncluded: [
    "Flour Tortillas",
    "Sautéed Peppers & Onions",
    "Shredded Lettuce, Chopped Tomatoes, Sour Cream, Guacamole & Shredded Cheddar",
    "Mexican Corn & Black Bean Salad",
    "Tortilla Chips with Salsa",
    "Choice of Classic Salad",
  ],
};

// ─── Registry & helpers ───────────────────────────────────────────────────────

export const ALL_DELIVERY_PACKAGE_PRESETS: readonly DeliveryPackagePreset[] = [
  ITS_YOUR_CHOICE_BREAKFAST,
  BB_BASIC_BREAKFAST,
  ENGLISH_MUFFIN_WRAP_SANDWICHES,
  ONE_HAND_PICKUP,
  CLASSIC_SANDWICH_PLATTER,
  GOURMET_SANDWICH_PLATTER,
  SIGNATURE_WRAP_PLATTER,
  PANINI_PRESS_PLATTER,
  PHILLY_HOAGIE_PLATTER,
  PHILLY_CHEESESTEAK,
  TACO_TIME,
  FAJITA_FESTIVAL,
];

export const PANEL_CATEGORY_LABELS: Record<DeliveryPanelCategory, string> = {
  breakfast: "🍳 Breakfast Packages",
  lunch_platter: "🥪 Lunch Platters",
  hot_lunch: "🔥 Hot Lunch",
};

/** Returns a preset if the item name matches any of its patterns, otherwise null. */
export function getDeliveryPackagePreset(itemName: string): DeliveryPackagePreset | null {
  const lower = (itemName || "").toLowerCase();
  for (const preset of ALL_DELIVERY_PACKAGE_PRESETS) {
    if (preset.matchPatterns.some((p) => lower.includes(p))) return preset;
  }
  return null;
}

/** Format confirmed picks as BEO custom text lines. */
export function formatDeliveryPackagePicksAsLines(
  preset: DeliveryPackagePreset,
  picks: Record<string, string[]>
): string[] {
  const lines: string[] = [];
  for (const group of preset.groups) {
    const selected = picks[group.label] ?? [];
    if (selected.length > 0) {
      lines.push(`${group.label}: ${selected.join(", ")}`);
    }
  }
  for (const auto of preset.autoIncluded ?? []) {
    lines.push(auto);
  }
  return lines;
}
