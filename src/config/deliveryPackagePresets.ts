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
  | "hot_lunch"
  | "ambient_display"
  | "happy_hour"
  | "lunch_premium"
  | "desserts";

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

// ─── Lunch Premium Packages ───────────────────────────────────────────────────

export const HEART_HEALTHY_LETTUCE_WRAPS: DeliveryPackagePreset = {
  key: "heart-healthy-lettuce-wraps",
  displayName: "Heart Healthy Lettuce Wraps",
  panelCategory: "lunch_premium",
  routeTargetField: "deliveryDeli",
  matchPatterns: ["heart healthy lettuce wraps", "lettuce wraps"],
  groups: [
    {
      label: "Protein — Pick 1",
      pickCount: 1,
      options: [
        "Teriyaki Marinated Flank Steak",
        "Spicy Chili Marinated Shaved Chicken",
        "Lemon, Garlic & Soy Poached Shrimp",
      ],
    },
  ],
  autoIncluded: [
    "Crunchy sesame noodles, pico de gallo, chopped roasted peppers, shredded carrots, frizzled onion straws & raw sesame seeds",
    "Green leaf & iceberg leaves",
    "Choice of 1 classic salad",
    "Teriyaki ginger, chili sauce & sriracha aioli condiments",
  ],
};

export const SLAMMIN_SLIDERS: DeliveryPackagePreset = {
  key: "slammin-sliders",
  displayName: "Slammin' Sliders",
  panelCategory: "happy_hour",
  routeTargetField: "buffetMetal",
  matchPatterns: ["slammin' sliders", "slammin sliders"],
  groups: [
    {
      label: "Slider Proteins — Pick 2",
      pickCount: 2,
      options: [
        "Angus Beef Sliders",
        "Carolina Pulled Pork",
        "Crispy Chicken",
        "Chipotle Pulled Chicken",
        "Grilled Vegetable Stax",
      ],
    },
  ],
  autoIncluded: [
    "Petite slider buns",
    "Shredded cheese mix, frizzled onions & fried pickle toppers",
    "Tater tots",
    "Individual salad shooters",
  ],
};

export const BBY_SIGNATURE_SALAD_BAR: DeliveryPackagePreset = {
  key: "bby-signature-salad-bar",
  displayName: "BBY Signature Salad Bar",
  panelCategory: "lunch_premium",
  routeTargetField: "buffetChina",
  matchPatterns: ["bby signature salad bar", "signature salad bar", "built by you salad"],
  groups: [
    {
      label: "Greens — Pick 3",
      pickCount: 3,
      options: ["Romaine", "Spring Mix", "Arugula", "Kale", "Spinach", "Super Greens Blend", "Red Cabbage", "Rough Chop Iceberg"],
    },
    {
      label: "Proteins — Pick 3",
      pickCount: 3,
      options: [
        "Marinated Grilled Chicken", "Buffalo Chicken", "Chicken Salad",
        "Marinated Steak", "Roasted Turkey Breast",
        "Tuna Salad", "Crispy Crumbled Bacon",
        "Steamed Shrimp", "Quinoa", "Seared Tofu", "Poached Salmon",
      ],
    },
    {
      label: "Crunch — Pick 3",
      pickCount: 3,
      options: [
        "Garlic & Herb Croutons", "Toasted Pita Squares", "Candied Pecans",
        "Toasted Walnuts", "Sunflower Seeds", "Pumpkin Seeds",
        "Wonton Threads", "Frizzled Onions", "Toasted Almond Slivers", "Chow Mein Noodles",
      ],
    },
    {
      label: "Cheese — Pick 2",
      pickCount: 2,
      options: ["Crumbled Bleu Cheese", "Feta", "Chards of Parmesan Romano", "Cheddar Blend"],
    },
    {
      label: "Fruit — Pick 1",
      pickCount: 1,
      options: ["Sliced Strawberries", "Blueberries", "Chunked Pineapple", "Mango", "Grapes"],
    },
    {
      label: "Dressings — Pick 3",
      pickCount: 3,
      options: [
        "Balsamic Vinaigrette", "Creamy Ranch", "Parmesan Peppercorn",
        "Classic Caesar", "Low Fat Raspberry", "Red Wine Vinegar & Olive Oil",
        "Reduced Fat Caesar", "Chefs' Choice Trending Dressing",
      ],
    },
  ],
  autoIncluded: [
    "Cucumbers, grape tomatoes, mushrooms, confetti peppers, carrots, red onion, chick peas & seasonal marinated grilled vegetables, hard-boiled eggs (essentials)",
    "Artisan rolls & flavor infused whipped butter",
  ],
};

export const QUICHE_ASSORTMENT: DeliveryPackagePreset = {
  key: "quiche-assortment",
  displayName: "Quiche Assortment",
  panelCategory: "breakfast",
  routeTargetField: "buffetMetal",
  matchPatterns: ["quiche assortment", "quiche"],
  groups: [
    {
      label: "Quiche Type — Pick 1",
      pickCount: 1,
      options: [
        "Spinach, Tomato, Feta & Cracked Black Pepper",
        "Artichoke, Green Onion, Mushroom & Gruyère",
        "Bacon, Caramelized Onions & Cheddar Cheese",
      ],
    },
  ],
};

// ─── Ambient Display Packages (with protein choice) ───────────────────────────

// ─── Ambient Displays — Vegetarian ───────────────────────────────────────────

export const VERY_VEGETARIAN_VICTORY_LANDSLIDE: DeliveryPackagePreset = {
  key: "very-vegetarian-victory-landslide",
  displayName: "Very Vegetarian Victory Landslide",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["very vegetarian victory", "vegetarian victory landslide"],
  groups: [],
  autoIncluded: [
    "Marinated grilled vegetables atop roasted red skin & sweet potatoes",
    "Blistered grape tomatoes, grilled shallot rings, crispy onion straws & fried hot peppers",
    "Calimyrna fig vinaigrette drizzle",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const BUFFALO_GRILLED_CAULIFLOWER_STEAKS: DeliveryPackagePreset = {
  key: "buffalo-grilled-cauliflower-steaks",
  displayName: "Buffalo Grilled Cauliflower Steaks Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["buffalo grilled cauliflower", "buffalo cauliflower steaks"],
  groups: [],
  autoIncluded: [
    "Cauliflower steaks atop crisp romaine lettuce",
    "Garbanzo beans, bleu cheese crumbles, tomato, celery, turkish golden raisins & shredded carrots",
    "Creamiest ranch dressing",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const GRILLED_PORTABELLA_MUSHROOM_CAPS: DeliveryPackagePreset = {
  key: "grilled-portabella-mushroom-caps",
  displayName: "Grilled Portabella Mushroom Caps Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["grilled portabella mushroom caps", "portabella mushroom caps display"],
  groups: [],
  autoIncluded: [
    "Portabella mushroom caps stuffed with israeli couscous, spinach, roasted vegetables & asiago cheese",
    "Balsamic basil pesto drizzle",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const BBQ_RUBBED_GRILLED_TOFU: DeliveryPackagePreset = {
  key: "bbq-rubbed-grilled-tofu",
  displayName: "BBQ Rubbed Grilled Tofu Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["bbq rubbed grilled tofu", "grilled tofu display"],
  groups: [],
  autoIncluded: [
    "BBQ rubbed grilled tofu with white shoe peg confetti corn, sweet cherry tomatoes & red onion",
    "Atop a mixture of kale, arugula & mesclun",
    "Snappy chipotle ranch dressing",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const GRILLED_VEGETABLE_TOWER_DISPLAY: DeliveryPackagePreset = {
  key: "grilled-vegetable-tower-display",
  displayName: "Grilled Vegetable Tower Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["grilled vegetable tower display", "vegetable tower display"],
  groups: [],
  autoIncluded: [
    "Grilled eggplant, zucchini, summer squash, grilled peppers, carrot coins, red onion & roma tomato",
    "Speared with a rosemary sprig",
    "Herb infused olive oil & lemon zest drizzle",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

// ─── Ambient Displays — Chicken ───────────────────────────────────────────────

export const CRISPY_FRIED_BONELESS_PICNIC_CHICKEN: DeliveryPackagePreset = {
  key: "crispy-fried-boneless-picnic-chicken",
  displayName: "Crispy Fried Boneless Picnic Chicken Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["crispy fried boneless picnic chicken", "picnic chicken display"],
  groups: [],
  autoIncluded: [
    "Crispy fried boneless picnic chicken",
    "Within a baked potato salad circle accentuating a colorful grilled corn salad center",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const MESQUITE_GRILLED_CHICKEN_DISPLAY: DeliveryPackagePreset = {
  key: "mesquite-grilled-chicken-display",
  displayName: "Mesquite Grilled Chicken Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["mesquite grilled chicken display"],
  groups: [],
  autoIncluded: [
    "Mesquite grilled chicken with crumbled bacon, roasted corn, charred grape tomatoes & jalapeño jack cheese",
    "Crunchy tortilla strips atop crisp romaine & peppery arugula",
    "BBQ honey ranch dressing",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const GRILLED_LEMON_CHICKEN_WILD_RICE: DeliveryPackagePreset = {
  key: "grilled-lemon-chicken-wild-rice",
  displayName: "Grilled Lemon Chicken Breast & Wild Rice Dyad",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["grilled lemon chicken breast", "lemon chicken wild rice dyad"],
  groups: [],
  autoIncluded: [
    "Grilled lemon chicken breast & wild rice",
    "Toasted almonds, dried cranberries, orange zest & baby arugula",
    "Refreshing citrus vinaigrette",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const FAR_EAST_CHICKEN_DISPLAY: DeliveryPackagePreset = {
  key: "far-east-chicken-display",
  displayName: "Far East Chicken Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["far east chicken display"],
  groups: [],
  autoIncluded: [
    "Teriyaki marinated chicken atop spicy pepper & peanut vermicelli pasta & salad greens",
    "Sesame seeds, sliced orange segments, water chestnut",
    "Sesame dressing drizzle",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const GRILLED_BONELESS_CHICKEN_BASIL_EVOO: DeliveryPackagePreset = {
  key: "grilled-boneless-chicken-basil-evoo",
  displayName: "Grilled Boneless Chicken with Basil EVOO",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["grilled boneless chicken with basil evoo", "basil infused evoo"],
  groups: [],
  autoIncluded: [
    "Grilled boneless breast of chicken brushed with basil infused EVOO",
    "Paired with bruschetta tortellini salad",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

// ─── Ambient Displays — Beef ──────────────────────────────────────────────────

export const VIETNAMESE_STEAK_DISPLAY: DeliveryPackagePreset = {
  key: "vietnamese-steak-display",
  displayName: "Vietnamese Steak Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["vietnamese steak display"],
  groups: [],
  autoIncluded: [
    "Vermicelli noodle salad circle envelops steamed broccoli center",
    "Scallions, fried jalapeño rings & toasted coconut",
    "Ginger soy sesame dressing drizzle",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const WERX_SIGNATURE_FLANK_STEAK_DISPLAY: DeliveryPackagePreset = {
  key: "werx-signature-flank-steak-display",
  displayName: "werx Signature Flank Steak Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["werx signature flank steak display"],
  groups: [],
  autoIncluded: [
    "Grilled flank steak displayed with crisp romaine hearts",
    "Roasted zucchini, red skinned potato cubes, butter roasted mushroom caps, olives & feta",
    "Roasted roma tomatoes with signature fig & balsamic syrup drizzle",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const SOUTHWEST_GRILLED_FLANK_STEAK_DISPLAY: DeliveryPackagePreset = {
  key: "southwest-grilled-flank-steak-display",
  displayName: "Southwest Grilled Flank Steak Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["southwest grilled flank steak display"],
  groups: [],
  autoIncluded: [
    "Grilled flank steak with roasted chili potatoes & grilled white corn salad",
    "Sautéed peppers, charred red onion rings",
    "Grilled pineapple salsa & avocado cilantro crema",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const ROASTED_FILET_MIGNON_DISPLAY: DeliveryPackagePreset = {
  key: "roasted-filet-mignon-display",
  displayName: "Roasted Filet Mignon Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["roasted filet mignon display"],
  groups: [],
  autoIncluded: [
    "Filet mignon in rosemary & cracked black pepper crust",
    "Roasted potatoes, sautéed trilogy of mushrooms, crispy onion straws",
    "Petite rolls, whipped herb infused butter, horseradish crème",
    "Salad selection — 15 guest minimum",
  ],
};

// ─── Ambient Displays — Seafood ───────────────────────────────────────────────

export const SWEET_SOUR_GLAZED_SHRIMP_DISPLAY: DeliveryPackagePreset = {
  key: "sweet-sour-glazed-shrimp-display",
  displayName: "Sweet & Sour Glazed Shrimp Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["sweet & sour glazed shrimp display", "sweet and sour glazed shrimp"],
  groups: [],
  autoIncluded: [
    "Sweet & sour glazed shrimp in a confetti black rice ring",
    "Mango, cilantro, pepper trio & orange segments with lime vinaigrette",
    "Paired with spicy cucumber salad",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const SALMON_PROVENCAL_DISPLAY: DeliveryPackagePreset = {
  key: "salmon-provencal-display",
  displayName: "Salmon Provencal Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["salmon provencal display"],
  groups: [],
  autoIncluded: [
    "Seasoned seared salmon atop arugula, white beans, cherry tomatoes",
    "Sautéed rosemary shallots & capers tossed with roasted pepper vinaigrette",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const SEARED_TUNA_NICOISE_DISPLAY: DeliveryPackagePreset = {
  key: "seared-tuna-nicoise-display",
  displayName: "Seared Tuna Nicoise Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["seared tuna nicoise display"],
  groups: [],
  autoIncluded: [
    "Seared tuna with fingerling potatoes, haricots verts, olives, red onion & diced egg",
    "Mixed greens tossed with simple red wine vinaigrette",
    "Crispy wonton threads",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const SRIRACHA_HONEY_GLAZED_SALMON_DISPLAY: DeliveryPackagePreset = {
  key: "sriracha-honey-glazed-salmon-display",
  displayName: "Sriracha Honey Glazed Salmon Tiles Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["sriracha honey glazed salmon tiles", "sriracha salmon tiles"],
  groups: [],
  autoIncluded: [
    "Sriracha honey glazed salmon tiles with sautéed shallots & avocado relish",
    "Atop dried cherries, green onion, micro-cut yellow pepper & citrus zest studded wheatberry salad",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const SESAME_ENCRUSTED_AHI_TUNA_DISPLAY: DeliveryPackagePreset = {
  key: "sesame-encrusted-ahi-tuna-display",
  displayName: "Sesame Encrusted Ahi Tuna Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["sesame encrusted ahi tuna display"],
  groups: [],
  autoIncluded: [
    "Pan seared ahi tuna cut sushi style",
    "Red pepper & cucumber slaw, sushi rice salad",
    "Black soy balsamic drizzle with micro greens & pickled ginger",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const BAJA_SHRIMP_SALAD_DISPLAY: DeliveryPackagePreset = {
  key: "baja-shrimp-salad-display",
  displayName: "Baja Shrimp Salad Display",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["baja shrimp salad display"],
  groups: [],
  autoIncluded: [
    "Tequila & lime marinated shrimp with avocado, tomatoes, black beans & corn",
    "Atop mixed greens with crispy tortilla strips",
    "Creamy sweet red pepper ranch dressing",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

// ─── Ambient Displays — Mixed Grill ───────────────────────────────────────────

export const SOUTH_OF_BORDER_MIXED_GRILL: DeliveryPackagePreset = {
  key: "south-of-border-mixed-grill",
  displayName: "South of the Border Mixed Grill",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["south of the border mixed grill", "south of the border grill"],
  groups: [],
  autoIncluded: [
    "Chimichurri brushed flank steak",
    "Chipotle glazed chicken",
    "Spanish rice, grilled peppers & onions, chili glazed sweet potato coins",
    "Housemade pico de gallo",
    "Sweet & spicy bacon jalapeño ranch dressing",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const TERIYAKI_SAMPLER_MIXED_GRILL: DeliveryPackagePreset = {
  key: "teriyaki-sampler-mixed-grill",
  displayName: "Teriyaki Sampler Mixed Grill",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["teriyaki sampler mixed grill", "teriyaki sampler"],
  groups: [],
  autoIncluded: [
    "Grilled teriyaki glazed salmon",
    "Teriyaki glazed chicken",
    "Ginger-soy marinated rice noodle salad & mixed baby greens",
    "Carrots, cabbage, green onions, crispy wontons & julienned bamboo shoots",
    "Asian sesame dressing",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const HEALTHWERX_TWOSOME_MIXED_GRILL: DeliveryPackagePreset = {
  key: "healthwerx-twosome-mixed-grill",
  displayName: "Healthwerx Twosome Mixed Grill",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["healthwerx twosome", "healthwerx twosome mixed grill"],
  groups: [],
  autoIncluded: [
    "Line-caught blackened salmon",
    "Mandarin ginger glazed chicken",
    "Kale & quinoa combo topped with toasted almonds, dried cranberries, toasted shallots & orange zest",
    "Center of black bean salsa",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const SOUTHEAST_ASIAN_MIXED_GRILL: DeliveryPackagePreset = {
  key: "southeast-asian-mixed-grill",
  displayName: "Southeast Asian Mixed Grill",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["southeast asian mixed grill"],
  groups: [],
  autoIncluded: [
    "Grilled lemongrass-ginger shrimp",
    "Hoisin brushed chicken",
    "Sweet & spicy black rice salad & julienne vegetables",
    "Mango, cilantro, shredded coconut surrounding avocado jicama salad with pumpkin seeds",
    "Ginger-sambal vinaigrette drizzle",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const ANYTIME_GRILL: DeliveryPackagePreset = {
  key: "anytime-grill",
  displayName: "Anytime Mixed Grill",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["anytime mixed grill", "anytime grill"],
  groups: [],
  autoIncluded: [
    "Orange teriyaki glazed grilled tuna",
    "Mesquite grilled chicken breast",
    "Grilled asparagus, roasted roma tomato halves & fire roasted peppers",
    "Grilled white corn salad with melon citrus vinaigrette",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

export const KABOOM_MIXED_GRILL: DeliveryPackagePreset = {
  key: "kaboom-mixed-grill",
  displayName: "Kaboom!! Mixed Grill",
  panelCategory: "ambient_display",
  routeTargetField: "buffetChina",
  matchPatterns: ["kaboom!! mixed grill", "kaboom mixed grill", "kaboom!!"],
  groups: [],
  autoIncluded: [
    "Tender marinated beef & chicken kabobs",
    "Crown of seasonal grilled vegetables",
    "Basmati rice with chopped tomatoes, kalamata olives, red pepper, feta & scallions",
    "Green goddess vinaigrette, micro chopped cashew & chili infused honey drizzle",
    "Choice of classic salad with artisan rolls & butter",
  ],
};

// ─── Desserts ─────────────────────────────────────────────────────────────────

export const DECADENT_DESSERT_DISPLAY: DeliveryPackagePreset = {
  key: "decadent-dessert-display",
  displayName: "Decadent Dessert Display",
  panelCategory: "desserts",
  routeTargetField: "deliveryDeli",
  matchPatterns: ["decadent dessert display"],
  groups: [],
  autoIncluded: [
    "Freshly baked cookies, brownies, blondies & assorted dessert bars",
    "Artfully arranged & garnished with chocolate covered strawberries, mini cannolis & beignets",
  ],
};

export const DECADENT_DESSERT_DISPLAY_PLUS: DeliveryPackagePreset = {
  key: "decadent-dessert-display-plus",
  displayName: "Decadent Dessert Display PLUS!!",
  panelCategory: "desserts",
  routeTargetField: "deliveryDeli",
  matchPatterns: ["decadent dessert display plus"],
  groups: [],
  autoIncluded: [
    "Housemade cookies, brownies, blondies & featured dessert bar",
    "Mini cheese cakes & foodwerx Bark",
    "Chocolate dipped strawberries, granny smith apples & coconut macaroons",
  ],
};

export const SINFULLY_DELICIOUS_CHOC_DIPPED_1: DeliveryPackagePreset = {
  key: "sinfully-delicious-choc-dipped-1",
  displayName: "Sinfully Delicious Chocolate Dipped #1 — Strictly Sweet",
  panelCategory: "desserts",
  routeTargetField: "deliveryDeli",
  matchPatterns: ["sinfully delicious chocolate dipped #1", "strictly sweet chocolate dipped"],
  groups: [],
  autoIncluded: [
    "Sweet driscoll strawberries, granny smith apples, selected seasonal fruit",
    "Oreos, coconut macaroons, brownies hand dipped in chocolate",
  ],
};

export const SINFULLY_DELICIOUS_CHOC_DIPPED_2: DeliveryPackagePreset = {
  key: "sinfully-delicious-choc-dipped-2",
  displayName: "Sinfully Delicious Chocolate Dipped #2 — Sweet & Salty",
  panelCategory: "desserts",
  routeTargetField: "deliveryDeli",
  matchPatterns: ["sinfully delicious chocolate dipped #2", "sweet & salty chocolate dipped"],
  groups: [],
  autoIncluded: [
    "Plump driscoll strawberries, granny smith apples, rice crispy treats, mini cannolis",
    "Thick-cut potato chips, salted pretzels & salty toffee drizzled nuts — all dipped in CHOCOLATE!",
  ],
};

export const MINI_PASTRIES_PETIT_FOURS: DeliveryPackagePreset = {
  key: "mini-pastries-petit-fours",
  displayName: "Mini Pastries & Petit Fours",
  panelCategory: "desserts",
  routeTargetField: "deliveryDeli",
  matchPatterns: ["mini pastries & petit fours", "petit fours"],
  groups: [],
  autoIncluded: [
    "Traditional petit fours, mini eclairs, cream puffs, cannolis & mini fruit tartlets",
  ],
};

export const DESSERT_SHOT: DeliveryPackagePreset = {
  key: "dessert-shot",
  displayName: 'Dessert "Shot" Display',
  panelCategory: "desserts",
  routeTargetField: "deliveryDeli",
  matchPatterns: ["dessert shot", "dessert \"shot\""],
  groups: [],
  autoIncluded: [
    "Perfect size desserts presented in mini shot vessels",
    "Double chocolate, strawberry cream cheese pound cake, lemon & pineapple spoon bread",
  ],
};

export const COOKIES_COOKIES_COOKIES: DeliveryPackagePreset = {
  key: "cookies-cookies-cookies",
  displayName: "Cookies Cookies Cookies!",
  panelCategory: "desserts",
  routeTargetField: "deliveryDeli",
  matchPatterns: ["cookies cookies cookies"],
  groups: [],
  autoIncluded: [
    "Housemade chocolate chip, white macadamia, oatmeal raisin & foodwerx featured flavor cookies",
    "Garnished with driscoll sweet berries",
  ],
};

export const COOKIES_N_BROWNIES: DeliveryPackagePreset = {
  key: "cookies-n-brownies",
  displayName: "Cookies 'n Brownies",
  panelCategory: "desserts",
  routeTargetField: "deliveryDeli",
  matchPatterns: ["cookies n brownies", "cookies 'n brownies"],
  groups: [],
  autoIncluded: [
    "Assorted cookies & brownie squares",
  ],
};

// ─── Registry & helpers ───────────────────────────────────────────────────────

export const ALL_DELIVERY_PACKAGE_PRESETS: readonly DeliveryPackagePreset[] = [
  // Breakfast
  ITS_YOUR_CHOICE_BREAKFAST,
  BB_BASIC_BREAKFAST,
  ENGLISH_MUFFIN_WRAP_SANDWICHES,
  ONE_HAND_PICKUP,
  QUICHE_ASSORTMENT,
  // Lunch Platters
  CLASSIC_SANDWICH_PLATTER,
  GOURMET_SANDWICH_PLATTER,
  SIGNATURE_WRAP_PLATTER,
  PANINI_PRESS_PLATTER,
  PHILLY_HOAGIE_PLATTER,
  // Hot Lunch
  PHILLY_CHEESESTEAK,
  TACO_TIME,
  FAJITA_FESTIVAL,
  // Premium Lunch
  HEART_HEALTHY_LETTUCE_WRAPS,
  BBY_SIGNATURE_SALAD_BAR,
  // Happy Hour
  SLAMMIN_SLIDERS,
  // Ambient Displays — Vegetarian
  VERY_VEGETARIAN_VICTORY_LANDSLIDE,
  BUFFALO_GRILLED_CAULIFLOWER_STEAKS,
  GRILLED_PORTABELLA_MUSHROOM_CAPS,
  BBQ_RUBBED_GRILLED_TOFU,
  GRILLED_VEGETABLE_TOWER_DISPLAY,
  // Ambient Displays — Chicken
  CRISPY_FRIED_BONELESS_PICNIC_CHICKEN,
  MESQUITE_GRILLED_CHICKEN_DISPLAY,
  GRILLED_LEMON_CHICKEN_WILD_RICE,
  FAR_EAST_CHICKEN_DISPLAY,
  GRILLED_BONELESS_CHICKEN_BASIL_EVOO,
  // Ambient Displays — Beef
  VIETNAMESE_STEAK_DISPLAY,
  WERX_SIGNATURE_FLANK_STEAK_DISPLAY,
  SOUTHWEST_GRILLED_FLANK_STEAK_DISPLAY,
  ROASTED_FILET_MIGNON_DISPLAY,
  // Ambient Displays — Seafood
  SWEET_SOUR_GLAZED_SHRIMP_DISPLAY,
  SALMON_PROVENCAL_DISPLAY,
  SEARED_TUNA_NICOISE_DISPLAY,
  SRIRACHA_HONEY_GLAZED_SALMON_DISPLAY,
  SESAME_ENCRUSTED_AHI_TUNA_DISPLAY,
  BAJA_SHRIMP_SALAD_DISPLAY,
  // Ambient Displays — Mixed Grill
  SOUTH_OF_BORDER_MIXED_GRILL,
  TERIYAKI_SAMPLER_MIXED_GRILL,
  HEALTHWERX_TWOSOME_MIXED_GRILL,
  SOUTHEAST_ASIAN_MIXED_GRILL,
  ANYTIME_GRILL,
  KABOOM_MIXED_GRILL,
  // Desserts
  DECADENT_DESSERT_DISPLAY,
  DECADENT_DESSERT_DISPLAY_PLUS,
  SINFULLY_DELICIOUS_CHOC_DIPPED_1,
  SINFULLY_DELICIOUS_CHOC_DIPPED_2,
  MINI_PASTRIES_PETIT_FOURS,
  DESSERT_SHOT,
  COOKIES_COOKIES_COOKIES,
  COOKIES_N_BROWNIES,
];

export const PANEL_CATEGORY_LABELS: Record<DeliveryPanelCategory, string> = {
  breakfast: "🍳 Breakfast Packages",
  lunch_platter: "🥪 Lunch Platters",
  hot_lunch: "🔥 Hot Lunch",
  lunch_premium: "⭐ Premium Lunch",
  happy_hour: "🍺 Happy Hour",
  ambient_display: "🌿 Ambient Displays",
  desserts: "🍰 Desserts",
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
