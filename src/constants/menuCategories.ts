// SINGLE SOURCE OF TRUTH — category keys, labels, field names, and allowed Airtable Category values
// Values below are the EXACT strings from Airtable's Category single-select field (fldM7lWvjH8S0YNSX).
//
// Airtable Category field values: "Appetizer", "Entrée", "Side", "Dessert", "Beverage"

export const CATEGORY_FILTER_MAP: Record<string, string[]> = {
  passed:       ['Appetizer'],
  presented:    ['Appetizer'],
  buffet_metal: ['Entr\u00e9e', 'Side'],
  buffet_china: ['Entr\u00e9e', 'Side'],
  desserts:     ['Dessert'],
  beverages:    ['Beverage'],
};

// Keep SERVICE_TYPE_MAP as an alias for backward compatibility
export const SERVICE_TYPE_MAP = CATEGORY_FILTER_MAP;

export type MenuCategoryKey = keyof typeof CATEGORY_FILTER_MAP;

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
    categoryKey: 'beverages',
    label: 'Beverages',
    fieldName: 'beverages',
    customFieldName: '',
  },
];
