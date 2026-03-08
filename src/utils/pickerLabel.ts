/**
 * --- UNIVERSAL PICKER LABEL FIX ---
 * Display child items consistently in ALL pickers.
 * Use `getPickerLabel(item)` everywhere a menu item name is rendered in a picker.
 */

type ItemWithChildItems = {
  name: string;
  childItems?: Array<string | { name: string }>;
};

export function getPickerLabel(item: ItemWithChildItems): string {
  const childNames = (item.childItems || [])
    .map((c) => (typeof c === "string" ? c : c.name))
    .filter(Boolean)
    .join(", ");
  return childNames ? `${item.name} – ${childNames}` : item.name;
}
