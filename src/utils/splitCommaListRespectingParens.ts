/** Split "a, b, c" into one string per comma, without splitting commas inside (...). */
export function splitCommaListRespectingParens(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(") depth++;
    if (c === ")") depth = Math.max(0, depth - 1);
    if (c === "," && depth === 0) {
      const t = buf.trim();
      if (t) out.push(t);
      buf = "";
      continue;
    }
    buf += c;
  }
  const t = buf.trim();
  if (t) out.push(t);
  return out;
}
