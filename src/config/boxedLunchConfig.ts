/**
 * Boxed Lunch Config — Pick 1 (sandwich choice) and Pick 2 (format) options per boxed lunch type.
 * Aligns with foodwerx Corporate Catering Menu.
 */

/** Pick 2 = format options (customer chooses how they want it) */
export const FORMAT_OPTIONS = [
  { value: "Sandwich", label: "Sandwich" },
  { value: "Wrap", label: "Wrap" },
  { value: "GF Wrap", label: "GF Wrap" },
  { value: "GF Roll", label: "GF Roll" },
  { value: "Other", label: "Other (free write)" },
] as const;

export type FormatValue = (typeof FORMAT_OPTIONS)[number]["value"];

/** Pick 1 = sandwich options by boxed lunch tier */
export const BOXED_LUNCH_SANDWICH_OPTIONS: Record<string, string[]> = {
  "Super Saver werx": [
    "Honey Ham & American Cheese",
    "Oven Roasted Turkey & Swiss",
    "Roast Beef & White Cheddar",
    "Grilled Chicken & Pepper Jack",
    "Tuna Salad",
    "White Grape Chicken Salad",
    "Genoa Salami, Capicola & Provolone",
  ],
  "Premium werx": [
    "Acapulco Turkey BLT",
    "Smoked Turkey (apples, walnuts, brie, cranberry)",
    "Spa Turkey",
    "Smoked Turkey & Crispy Bacon",
    "Parmesan Crusted Chicken Cutlet",
    "The Greek (chicken, olives, feta, tzatziki)",
    "Honey Stung Chicken",
    "Herb Grilled Chicken Breast",
    "Savory & Sweet Flank Steak",
    "Eye Round of Beef",
    "Grilled Flank Steak",
    "Beef, Blue & Balsamic",
    "Honey Ham & Brie",
    "Ham & Cheese Squared",
    "foodwerx Italian Hoagie",
    "Prosciutto de Parma",
    "Southwest Shrimp Salad",
    "Tuna Salad BLT",
    "Marinated Grilled Vegetables",
    "Napa Valley (kale, avocado, hummus)",
    "Sharp Caprese",
    "Crunch Chicken Wrap",
    "Grilled Vegetable Wrap",
    "Turkey Club Wrap",
    "Buffalo Chicken Wrap",
    "Caesar Wrap",
  ],
  "Executive werx": [
    "Marinated Flank Steak",
    "Grilled Chicken",
    "Cocktail Poached Shrimp",
    "(Trio – all three on greens)",
  ],
  "Basic Saladwerx": [
    "Garden",
    "Caesar",
    "Greek",
    "Funky",
    "+ Grilled Chicken",
  ],
  "Premium Saladwerx": [
    "Country Cobb (roast beef, turkey, egg, bacon, avocado)",
    "+ Grilled Chicken",
  ],
  "Executive Saladwerx": [
    "Sliced Tenderloin of Beef",
    "Grilled Shrimp",
    "Marinated Grilled Vegetables",
    "(All atop greens)",
  ],
};

/** Boxed lunch types that show the config modal (have Pick 1 + Pick 2) */
export const BOXED_LUNCH_TYPES_WITH_PICKS = [
  "Super Saver werx",
  "Premium werx",
  "Executive werx",
  "Basic Saladwerx",
  "Premium Saladwerx",
  "Executive Saladwerx",
];

export type BoxedLunchRow = {
  id: string;
  boxedLunchType: string;
  pick1: string;
  pick2: string;
  pick2Other?: string;
  quantity: number;
};
