/**
 * HTTP headers must contain only ISO-8859-1 characters.
 * Strips any character outside ASCII to prevent "non ISO-8859-1 code point" fetch errors.
 */
export function sanitizeForHeader(value: string): string {
  return value.replace(/[^\x00-\x7F]/g, "").trim();
}
