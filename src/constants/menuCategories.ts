// SINGLE SOURCE OF TRUTH — category keys, labels, field names, and allowed Airtable CATEGORY values
// Values below are the EXACT strings from Airtable's Category single-select field.

export const CATEGORY_MAP: Record<string, string[]> = {
  passed:       ['Passed App'],
  presented:    ['Presented App'],
  buffet_metal: [
    "Buffet Metal",
    "Buffet",
    "Buffet Item",
    "Side",
    "Vegetable (Side)",
    "Starch (Side)",
    "Pasta (Side)",
  ],
  buffet_china: [
    "Buffet China",
    "Salad",
    "Bread",
    "Side",
    "Vegetable (Side)",
  ],
  desserts:     ['Dessert'],
  stations:     ['Station'],
  dressing:     ['Dressing'],
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
