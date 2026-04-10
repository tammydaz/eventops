export function stationCustomItemsToLines(customItems?: string): string[] {
  const rawLines = (customItems || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^BEO Placement:/i.test(line));

  const lines: string[] = [];
  const multiValueLine = /^(Items?|Included|Toppings?|Condiments?|Dressings?|Salads?|Proteins|Meats|Upgrades?|Sauces?|Add(?:ons?)?):\s*(.+)$/i;

  for (const line of rawLines) {
    const multi = line.match(multiValueLine);
    if (multi) {
      lines.push(...multi[2].split(",").map((value) => value.trim()).filter(Boolean));
      continue;
    }

    const keyVal = line.match(/^([A-Za-z\s]+):\s*(.+)$/);
    if (keyVal) {
      const key = keyVal[1].trim();
      const value = keyVal[2].trim();
      if (/^Salad\s*shooters?$/i.test(key) && /^yes$/i.test(value)) {
        lines.push("Salad shooters (included)");
      } else if (!/^yes$/i.test(value) || !/^Salad/i.test(key)) {
        lines.push(value);
      }
      continue;
    }

    lines.push(line);
  }

  return lines.map((line) => line.replace(/^PLATTER\s+/i, ""));
}
