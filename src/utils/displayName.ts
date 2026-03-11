/** Strip leading emojis and trailing " – " from menu item display names */
export function cleanDisplayName(name: string): string {
  if (!name || typeof name !== "string") return name;
  let s = name.trim();
  // Strip leading emojis (covers 🍽️🍤🍰 etc.) and variation selectors
  s = s.replace(/^[\s\p{Emoji}\uFE00-\uFE0F]+/gu, "");
  s = s.replace(/\s*[-–—]\s*$/g, "").trim();
  return s || name;
}
