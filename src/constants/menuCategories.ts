// SINGLE SOURCE OF TRUTH — category keys, labels, field names, and allowed Airtable service types
// Values below are the EXACT strings from Airtable's Service Type single-select field.
// \u2013 = EN DASH (–) which is what Airtable returns (NOT a regular hyphen)
//
// From Omni's verified output, these are ALL possible Service Type values:
//   "Dessert", "Passed App", "Entrée", "Room Temp Display",
//   "Buffet – Hot", "Buffet", "Beverage", "Appetizer", null

export const SERVICE_TYPE_MAP: Record<string, string[]> = {
  passed:       ['Passed App'],
  presented:    ['Presented App', 'Appetizer'],
  buffet_metal: ['Buffet', 'Buffet \u2013 Hot'],
  buffet_china: ['Buffet', 'Buffet \u2013 Cold'],
  desserts:     ['Dessert'],
};

export type MenuCategoryKey = keyof typeof SERVICE_TYPE_MAP;

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
];
