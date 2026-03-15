/**
 * Sandwich Platter Config — Pick X from list. Aligns with foodwerx Corporate Catering Menu.
 * "Please pick up to 5 selections" / "pick up to 2 selections for every 10 guests"
 */

export type PlatterType = keyof typeof PLATTER_CHOICES;

/** Platter types with their options and max pick count */
export const PLATTER_CHOICES: Record<
  string,
  { label: string; options: string[]; maxPick: number; instruction: string }
> = {
  "Classic Sandwiches": {
    label: "Classic Sandwiches",
    options: [
      "Honey Ham & American Cheese",
      "Oven Roasted Turkey & Swiss",
      "Roast Beef & White Cheddar",
      "Grilled Chicken & Pepper Jack",
      "Tuna Salad",
      "White Grape Chicken Salad",
      "Genoa Salami, Capicola & Provolone",
    ],
    maxPick: 5,
    instruction: "Pick up to 5 selections per order",
  },
  "Signature Specialty Platter": {
    label: "Signature Specialty Platter",
    options: [
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
    maxPick: 5,
    instruction: "Pick up to 5 selections per order",
  },
  "Signature Wrap Platter": {
    label: "Signature Wrap Platter",
    options: [
      "Cuban Chicken & Honey Ham",
      "Porta-mato-luscious",
      "Buffalo Chicken",
      "Crunch Chicken Wrap",
      "Grilled Vegetable Wrap",
      "Turkey Club Wrap",
      "Buffalo Chicken Wrap",
      "Caesar Wrap",
      "Zesty Mediterranean",
    ],
    maxPick: 5,
    instruction: "Pick up to 5 selections per order",
  },
  "Gourmet Specialty Sandwich & Wrap Platter": {
    label: "Gourmet Specialty Sandwich & Wrap Platter",
    options: [
      "Acapulco Turkey BLT",
      "Smoked Turkey (apples, walnuts, brie, cranberry)",
      "Spa Turkey",
      "Parmesan Crusted Chicken Cutlet",
      "The Greek",
      "Honey Stung Chicken",
      "Savory & Sweet Flank Steak",
      "Beef, Blue & Balsamic",
      "Honey Ham & Brie",
      "foodwerx Italian Hoagie",
      "Prosciutto de Parma",
      "Southwest Shrimp Salad",
      "Marinated Grilled Vegetables",
      "Napa Valley",
      "Sharp Caprese",
      "Cuban Chicken & Honey Ham",
      "Porta-mato-luscious",
      "Buffalo Chicken Wrap",
      "Turkey Club Wrap",
      "Caesar Wrap",
    ],
    maxPick: 5,
    instruction: "Select your favorites from both sandwiches & wraps",
  },
  "Panini Press": {
    label: "Panini Press",
    options: [
      "Italiano (Genoa, prosciutto, capicola & provolone)",
      "Biggie Beef",
      "Turkey",
      "Cheezie Veg",
      "Honey Roasted Ham & Brie",
    ],
    maxPick: 2,
    instruction: "Pick up to 2 selections for every 10 guests",
  },
  "Philadelphia Hoagie Platter": {
    label: "Philadelphia Hoagie Platter",
    options: [
      "Italian by foodwerx",
      "Roast Beef",
      "Simple Ham & Cheese",
      "Oven Roasted Turkey",
      "Spicy (Mild) Tuna Salad",
      "Crispy Chicken Cutlet & Pecorino Romano",
      "Vegetarian",
    ],
    maxPick: 5,
    instruction: "Pick up to 5 selections",
  },
  "Combination Platter": {
    label: "Combination Platter",
    options: [
      "Gourmet Specialty Sandwiches",
      "Signature Wraps",
      "Philadelphia Hoagies",
      "Pressed Panini Triangles",
    ],
    maxPick: 4,
    instruction: "Mix of gourmet sandwiches, wraps, hoagies & panini",
  },
};

export const PLATTER_TYPES = Object.keys(PLATTER_CHOICES);

export type PlatterRow = {
  id: string;
  platterType: string;
  picks: string[];
  quantity: number;
};
