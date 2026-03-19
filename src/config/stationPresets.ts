/**
 * Station preset configurations — questions, options, and auto-included items.
 * Used by StationComponentsConfigModal for custom layouts.
 */

export type StationPresetKey =
  | "tex-mex"
  | "ramen"
  | "all-american"
  | "street-food"
  | "raw-bar"
  | "carving"
  | "hibachi"
  | "chicken-waffle"
  | "late-night"
  | "vegetable"
  | "spreads-breads"
  | "charcuterie"
  | "pasta-flight"
  | "farmers-fruit"
  | "fishermans-corner"
  | "barwerx"
  | "philly-jawn"
  | "salad-bar";

/** Preset name patterns that map to config keys */
export const PRESET_NAME_PATTERNS: Record<StationPresetKey, string[]> = {
  "tex-mex": ["tex-mex", "tex mex"],
  ramen: ["ramen", "make your own ramen"],
  "all-american": ["all-american", "all american"],
  "street-food": ["street food", "street food station"],
  "raw-bar": ["raw bar", "iced raw bar"],
  carving: ["carving", "carving station"],
  hibachi: ["hibachi", "hibachi station"],
  "chicken-waffle": ["chicken", "waffle", "chicken & waffle"],
  "late-night": ["late night", "late night bites"],
  vegetable: ["vegetable", "marinated grilled"],
  "spreads-breads": ["spreads", "breads", "spreads & breads"],
  charcuterie: ["charcuterie", "grande charcuterie"],
  "pasta-flight": ["pasta flight", "pasta flight presentation"],
  "farmers-fruit": ["farmers", "fruit", "farmers' market"],
  "fishermans-corner": ["fisherman", "fisherman's corner"],
  barwerx: ["barwerx", "bar werx", "appetizer sampler"],
  "philly-jawn": ["philly jawn", "philly jawn"],
  "salad-bar": ["salad bar", "built by you salad", "foodwerx salad bar"],
};

/** "Built by You" foodwerx Salad Bar — Pick 3 Greens, Pick 3 Proteins, Pick 3 Crunch, Pick 2 Cheese, Pick 1 Sweet, Pick 1 Fruit, Pick 3 Dressings */
export const SALAD_BAR = {
  greensOptions: ["Romaine", "Spring mix", "Arugula", "Kale", "Spinach", "Super greens blend with red cabbage & rough chop iceberg"] as const,
  greensCount: 3,
  proteinOptions: ["Marinated grilled chicken", "Buffalo chicken", "Chicken salad", "Marinated steak", "Seared tofu", "Roasted turkey breast", "Quinoa", "Tuna salad", "Crispy crumbled bacon & steamed shrimp", "Poached salmon"] as const,
  proteinCount: 3,
  crunchOptions: ["Garlic & herb croutons", "Toasted pita squares", "Candied pecans", "Toasted walnuts", "Sunflower seeds", "Pumpkin seeds", "Wonton threads & frizzled onions", "Toasted almond slivers", "Chow mein noodles"] as const,
  crunchCount: 3,
  cheeseOptions: ["Crumbled bleu cheese", "Feta", "Chards of parmesan romano & cheddar blend"] as const,
  cheeseCount: 2,
  sweetOptions: ["Dried tart cranberries", "Sweet raisins", "Dried turkish apricots", "Locally sourced dried cherries"] as const,
  sweetCount: 1,
  fruitOptions: ["Sliced strawberries", "Blueberries", "Chunked pineapple", "Mango", "Grapes"] as const,
  fruitCount: 1,
  dressingOptions: ["Balsamic vinaigrette", "Creamy ranch", "Parmesan peppercorn", "Chef's choice trending salad dressing", "Classic caesar", "Low fat raspberry", "Red wine vinegar & olive oil", "Reduced fat caesar"] as const,
  dressingCount: 3,
  essentialsIncluded: ["Cucumbers", "Grape tomatoes", "Mushrooms", "Confetti peppers", "Carrots", "Red onion", "Chick peas", "Seasonal marinated grilled vegetables", "Hard-boiled eggs"] as const,
};

export function getStationPresetKey(presetName: string): StationPresetKey | null {
  const lower = (presetName || "").toLowerCase();
  for (const [key, patterns] of Object.entries(PRESET_NAME_PATTERNS)) {
    if (patterns.some((p) => lower.includes(p))) return key as StationPresetKey;
  }
  return null;
}

/** Tex-Mex: Shell + Proteins (choose 2) */
export const TEX_MEX = {
  shellOptions: ["Soft", "Hard"] as const,
  proteinOptions: ["Chicken", "Beef", "Pork", "Shrimp"] as const,
  proteinCount: 2,
  includedToppings: ["Sour Cream", "Pico de Gallo", "Guacamole", "Jalapenos", "Cheddar & Monterey Jack Cheese"],
  includedSides: ["Tricolored tortilla chips", "Black bean salsa", "Ranchero shoe peg corn toss"],
};

/** Ramen Noodle Bar: Stock + Protein (choose 1) */
export const RAMEN = {
  stockOptions: ["Pork stock", "Miso stock", "Both"] as const,
  proteinOptions: ["Chicken", "Pork", "Shrimp"] as const,
  includedToppings: ["Soft boiled egg halves", "Cilantro", "Scallions", "Baby bok choy", "Toasted corn", "Carrots", "Snow peas", "Mushrooms", "Jalapeno", "Ginger"],
  includedSauces: ["Sriracha", "Lime", "Soy sauce"],
};

/** All-American: Main + Potato + Chicken + Salad + slider rolls, toppings, condiments (per old BEOs) */
export const ALL_AMERICAN = {
  mainOptions: ["Mini Angus beef burgers", "Braised brisket", "Pulled pork"] as const,
  potatoOptions: ["Crispy boardwalk potato wedges (sea salt & malt vinegar)", "Baked potato salad"] as const,
  chickenOptions: ["Honey hot chicken tenders", "No chicken"] as const,
  saladShooters: ["Yes", "No"] as const,
  /** Slider rolls / bread — appears under station on BEO */
  sliderRollOptions: ["Assorted slider rolls", "Regular slider rolls", "Mini brioche rolls", "Seeded rolls", "Long seeded roll", "Semolina dinner roll"] as const,
  /** Toppings (lettuce, tomato, cheese) — per old BEO "PLATTER Lettuce & Tomato" */
  toppingsOptions: ["PLATTER Lettuce & Tomato", "Cheese, Lettuce, Tomatoes", "Lettuce & Tomato", "Sliced American Cheese", "Green Leaf Lettuce", "Roma Tomatoes"] as const,
  /** Condiments listed under station */
  condimentOptions: ["Pickles", "Ketchup", "Mustard", "Ranch", "BBQ sauce"] as const,
  /** Dressings for salad shooters / station */
  dressingOptions: ["Ranch", "Balsamic vinaigrette", "Caesar", "Blue cheese", "Honey mustard", "On side"] as const,
  /** Salad choices (greens / salad types) — show on BEO under station */
  saladOptions: ["Field of Greens", "Caesar Salad", "Greek Salad", "Mixed Greens", "Wedge Salad", "Bruschetta Tortellini Pasta Salad", "Seasonal Fruit Salad", "Garden Salad Shooters"] as const,
};

/** Street Food: Choose 5 items */
export const STREET_FOOD = {
  options: [
    "Mini shredded BBQ chicken on brioche rolls",
    "Mini sliders with aged white cheddar, caramelized onions & garlic aioli on mini brioche rolls",
    "Crispy cod or beef street tacos",
    "Carolina BBQ pork on a bao bun",
    "Thai sesame noodles in mini Chinese takeout containers",
    "Grilled chimichurri beef kebob",
    "Tandoori chicken kabobs",
    "Adult Mac & Cheese (house favorite)",
    "Chicken parm slivers",
    "Korean fried chicken nuggets",
    "Margarita & BBQ chicken flatbreads",
  ] as const,
  count: 5,
};

/** Iced Raw Bar: ALL proteins always included, no picks */
export const RAW_BAR = {
  includedProteins: ["Shrimp", "Crab claws", "Oysters"] as const,
  includedGarnishes: ["Classic cocktail sauce", "Louisiana hot sauce", "Jalapeno remoulade", "Sweet Vidalia vinegar", "Horseradish"],
};

/** Grande Charcuterie Display: core board components per legacy BEOs */
export const CHARCUTERIE = {
  included: [
    "Assorted meats",
    "Imported & domestic cheeses",
    "Veggie crudité",
    "Sliced fruit",
    "Grapes & berries",
    "Dried fruit",
    "Nuts",
    "Olives",
    "Gherkin pickles",
    "Crackers & crostini",
    "Toasted pita triangles",
    "Hummus",
    "Sundried tomato ranch",
    "Mustard",
  ] as const,
};

/** Carving Station: Choose 2 meats + potato */
export const CARVING = {
  meatOptions: ["Pork tenderloin with mushroom duxelle en croute", "Roasted turkey with orange compote & gravy", "Dr. Pepper marinated flank steak", "Spiral ham with honey mustard glaze"] as const,
  potatoOptions: ["Roasted potatoes", "Mashed potatoes"] as const,
};

/** Hibachi: Choose 2 proteins + optional upgrades */
export const HIBACHI = {
  proteinOptions: ["Chicken", "Steak", "Shrimp", "Tofu"] as const,
  upgrades: ["Filet Mignon (+$5/person)", "Lobster Tail (+$10/person)"] as const,
  included: ["Grilled vegetables", "Fried rice", "Teriyaki lo mein"],
};

/** Chicken & Waffle Station — Chicken Pick 1, +Add sauce, Butter Pick 1, +Add, Included as blocks */
export const CHICKEN_WAFFLE = {
  chickenOptions: ["Classic fried chicken tenders", "Honey hot fried chicken tenders"] as const,
  butterOptions: ["Regular whipped butter", "Herb-infused whipped butter"] as const,
  included: [
    "Belgian waffles",
    "Powdered sugar",
    "Whipped cream",
    "Maple bourbon syrup",
    "Fresh fruit (strawberries, blueberries, bananas)",
    "Cinnamon",
    "Bacon crumbles",
    "Fried pickles",
  ] as const,
};

/** Late Night Bites */
export const LATE_NIGHT = {
  options: [
    "Philly soft pretzel bites with cheese & mustard",
    "Assorted donuts",
    "Chicken & waffle bites with bourbon maple butter drizzle",
    "Mini PB, Nutella & crumbled bacon sandwiches",
    "Donut wall - Assorted donuts hung from a pegged wall",
    "Pop-Tart a la carte (Strawberry Frosted, Cinnamon Brown Sugar Frosted, S'mores, Blueberry)",
  ] as const,
};

/** Fisherman's Corner: Choose 2 of the following 4 */
export const FISHERMANS_CORNER = {
  options: [
    "Jumbo shrimp cocktail in mini martini glasses",
    "Jumbo lump crab salad shooters",
    "Bacon wrapped scallops",
    "Sesame seared ahi tuna",
  ] as const,
  count: 2,
};

/** BarWerx Appetizer Sampler — fixed 4-item display, no choices */
export const BARWERX = {
  included: [
    "Cheesy potato skins with bacon & a dollop of sour cream",
    "Cheese quesadillas with house made salsa",
    "Classic boneless buffalo wings",
    "Mozzarella sticks",
  ] as const,
};

/** The Philly Jawn — fixed 4-item display, no choices */
export const PHILLY_JAWN = {
  included: [
    "Mini roast pork sandwiches with house made roasted peppers",
    "Nonna's meatballs with Sunday gravy sliders",
    "Philly cheesesteak dumplings with spicy ketchup",
    "Philly soft pretzels with mustard & warm cheese",
  ] as const,
};
