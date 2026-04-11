// SINGLE SOURCE OF TRUTH — category keys, labels, field names, and allowed Airtable CATEGORY values
// Values below are the EXACT strings from Airtable's Category single-select field.

const APPETIZER_CATEGORIES = [
  "Passed App",
  "Presented App",
  "Appetizer",
  "Passed",
  "App",
];

/** Categories for Presented Appetizers: appetizers + station-type items that are presented (e.g. Mezze Display). */
const PRESENTED_CATEGORIES = [
  ...APPETIZER_CATEGORIES,
  "Station Item",
  "Station",
];

export const CATEGORY_MAP: Record<string, string[]> = {
  passed: APPETIZER_CATEGORIES,
  presented: PRESENTED_CATEGORIES,

  buffet_metal: [
    "Buffet Metal", "Buffet", "Buffet Item", "Side",
    // Full-service entrée & side categories from Airtable
    "Entrée", "Protein (Entrée)", "Pasta (Entrée)", "Pasta (Side)", "Starch (Side)", "Vegetable (Side)",
    // Corporate menu full-service hot packages
    "Full Service Hot Lunch", "Happy Hour",
    // Hot breakfast items for full-service morning events
    "Hot Breakfast",
  ],
  buffet_china: [
    "Buffet China", "Salad", "Bread", "Side",
    // Ambient Displays (room-temp presented platters)
    "Ambient Display",
    // Classic & signature salads for the china picker
    "Classic Salad", "Signature Salad",
    // Cold breakfast items for full-service morning events
    "Breakfast Room Temp",
  ],

  desserts: ["Dessert", "Dessert/Metal", "Dessert/China", "Dessert (Display)", "Dessert (Individual)"],
  stations:     ['Station', 'Stations', 'Station Item'],
  dressing:     ['Dressing'],
  deli: [
    "Deli/Sandwhiches", "Deli/Breads", "Deli/Sandwiches", "Deli",
    // Lunch presentations, salad stands, sandwich builders, etc.
  ],
  room_temp: ["Room Temp Display", "Display", "Buffet China", "Ambient Display"],
  displays:     ['Display', 'Buffet China', 'Ambient Display'],
  beverage_service: ['Beverage', 'Beverages', 'Drink', 'Bar / Beverage Component'],
  bar_service:     ['Bar', 'Bar Item', 'Beverage', 'Beverages', 'Bar / Beverage Component'],
  creation_station: ['Station', 'Stations', 'Station Item'],
};

export type MenuCategoryKey = keyof typeof CATEGORY_MAP;

export interface MenuSection {
  categoryKey: MenuCategoryKey;
  label: string;
  fieldName: string;
  customFieldName: string;
}

export const MENU_SECTIONS: MenuSection[] = [
  {
    categoryKey: 'passed',
    label: 'Passed Appetizers',
    fieldName: 'passedAppetizers',
    customFieldName: 'customPassedApp',
  },
  {
    categoryKey: 'presented',
    label: 'Presented Appetizers',
    fieldName: 'presentedAppetizers',
    customFieldName: 'customPresentedApp',
  },
  {
    categoryKey: 'buffet_metal',
    label: 'Buffet - Metal',
    fieldName: 'buffetMetal',
    customFieldName: 'customBuffetMetal',
  },
  {
    categoryKey: 'buffet_china',
    label: 'Buffet - China',
    fieldName: 'buffetChina',
    customFieldName: 'customBuffetChina',
  },
  {
    categoryKey: 'desserts',
    label: 'Desserts',
    fieldName: 'desserts',
    customFieldName: 'customDessert',
  },
  {
    categoryKey: 'stations',
    label: 'Stations',
    fieldName: 'stations',
    customFieldName: 'customStation',
  },
];
