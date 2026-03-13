// SINGLE SOURCE OF TRUTH — category keys, labels, field names, and allowed Airtable CATEGORY values
// Values below are the EXACT strings from Airtable's Category single-select field.

const APPETIZER_CATEGORIES = [
  "Passed App",
  "Presented App",
  "Appetizer",
  "Passed",
  "App",
];

export const CATEGORY_MAP: Record<string, string[]> = {
  passed: APPETIZER_CATEGORIES,
  presented: APPETIZER_CATEGORIES,

  buffet_metal: ["Buffet Metal", "Buffet", "Buffet Item", "Side"],
  buffet_china: ["Buffet China", "Salad", "Bread", "Side"],

  desserts: ["Dessert", "Dessert/Metal", "Dessert/China"],
  stations:     ['Station', 'Stations', 'Station Item'],
  dressing:     ['Dressing'],
  deli: ["Deli/Sandwhiches", "Deli/Breads", "Deli/Sandwiches"],
  room_temp: ["Room Temp Display", "Display", "Buffet China"],
  displays:     ['Display', 'Buffet China'],
  beverage_service: ['Beverage', 'Beverages', 'Drink'],
  bar_service:     ['Bar', 'Bar Item', 'Beverage', 'Beverages'],
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
