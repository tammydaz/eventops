/**
 * Self-test: V2 orderName roundtrip (no Airtable). Run: node scripts/boxedLunchV2Selftest.mjs
 */
const PREFIX = "FWX_BOXED_V2:";

function normalizeBoxedLunchV2Payload(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw;
  const rawBt = o.boxTypeId;
  const boxTypeId =
    typeof rawBt === "string"
      ? rawBt.trim()
      : typeof rawBt === "number" && !Number.isNaN(rawBt)
        ? String(Math.floor(rawBt))
        : "";
  if (!boxTypeId) return null;
  const arr = o.sandwiches;
  let sandwichRows;
  if (Array.isArray(arr)) sandwichRows = arr;
  else if (arr == null) sandwichRows = [];
  else return null;
  const parseQty = (v) => {
    if (typeof v === "number" && !Number.isNaN(v)) return Math.max(0, Math.floor(v));
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v.trim());
      if (!Number.isNaN(n)) return Math.max(0, Math.floor(n));
    }
    return 0;
  };
  const sandwiches = sandwichRows.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return { name: "", qty: 0 };
    const r = row;
    const rawName = r.name;
    const name =
      typeof rawName === "string"
        ? rawName
        : rawName != null && rawName !== ""
          ? String(rawName).trim()
          : "";
    const qty = parseQty(r.qty !== undefined ? r.qty : r.quantity);
    return { name, qty };
  });
  return { boxTypeId, sandwiches };
}

function parseFromOrderName(orderName) {
  const t = (orderName || "").trim().replace(/^\uFEFF/, "");
  if (!t.startsWith(PREFIX)) return null;
  try {
    const parsed = JSON.parse(t.slice(PREFIX.length));
    return normalizeBoxedLunchV2Payload(parsed);
  } catch {
    return null;
  }
}

const payload = { boxTypeId: "premium-werx", sandwiches: [{ name: "Turkey", qty: 2 }] };
const v2Json = JSON.stringify({
  boxTypeId: payload.boxTypeId,
  sandwiches: payload.sandwiches,
});
const orderName = `${PREFIX}${v2Json}`;
const back = parseFromOrderName(orderName);

if (!back || back.boxTypeId !== "premium-werx" || back.sandwiches.length !== 1 || back.sandwiches[0].name !== "Turkey") {
  console.error("FAIL roundtrip", { orderName, back });
  process.exit(1);
}

const escaped = "recABC'def".replace(/'/g, "\\'");
const formula = `OR({Client/Event}='${escaped}', FIND('${escaped}', ARRAYJOIN({Client/Event})) > 0)`;
if (!formula.includes("recABC\\'def") || !formula.startsWith("OR(")) {
  console.error("FAIL formula escape", formula);
  process.exit(1);
}

console.log("OK boxed lunch V2 selftest: roundtrip + formula escape");
