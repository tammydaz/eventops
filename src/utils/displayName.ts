/** Strip leading emojis and trailing " – " from menu item display names */
export function cleanDisplayName(name: string): string {
  if (!name || typeof name !== "string") return name;
  let s = name.trim();
  s = s.replace(/^[\s\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+/gu, "");
  s = s.replace(/\s*[–—]\s*$/g, "").trim();
  return s || name;
}
