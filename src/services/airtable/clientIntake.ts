/**
 * Client Intake table — snapshot for Client Overview (hardcoded table + field IDs).
 */

import { airtableFetch, type AirtableListResponse, type AirtableRecord, type AirtableErrorResult } from "./client";
import { isErrorResult, asString } from "./selectors";

export const CLIENT_INTAKE_TABLE_ID = "tblIpmULxKigGE8p4";

export const CLIENT_INTAKE_FIELDS = {
  NAME: "fld4Gg8T6wf492WRc",
  PHONE: "fldEspTpXg0sc1xqt",
  COMPANY: "fldDbqmuzZWKHJl1l",
  EMAIL: "fldK9u8s71oIziaYP",
} as const;

/** Only includes fields that have non-empty values (for conditional display). */
export type ClientIntakeSnapshot = {
  clientName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
};

function buildSnapshotFromFields(f: Record<string, unknown>): ClientIntakeSnapshot {
  const out: ClientIntakeSnapshot = {};
  const name = asString(f[CLIENT_INTAKE_FIELDS.NAME]).trim();
  if (name) out.clientName = name;
  const phone = asString(f[CLIENT_INTAKE_FIELDS.PHONE]).trim();
  if (phone) out.phone = phone;
  const company = asString(f[CLIENT_INTAKE_FIELDS.COMPANY]).trim();
  if (company) out.companyName = company;
  const email = asString(f[CLIENT_INTAKE_FIELDS.EMAIL]).trim();
  if (email) out.email = email;
  return out;
}

/**
 * Airtable **display name** for the phone field on Client Intake (used in filterByFormula).
 * If your base uses a different label, set `VITE_CLIENT_INTAKE_PHONE_FIELD_NAME` in `.env`.
 */
function getClientIntakePhoneFieldNameForFormula(): string {
  const v = (import.meta.env.VITE_CLIENT_INTAKE_PHONE_FIELD_NAME as string | undefined)?.trim();
  return v || "Phone";
}

/** Display name for the Client Intake name field in `filterByFormula` (default `Name`). */
function getClientIntakeNameFieldNameForFormula(): string {
  const v = (import.meta.env.VITE_CLIENT_INTAKE_NAME_FIELD_NAME as string | undefined)?.trim();
  return v || "Name";
}

/** Display name for the Company field on Client Intake (used in filterByFormula). */
function getClientIntakeCompanyFieldNameForFormula(): string {
  const v = (import.meta.env.VITE_CLIENT_INTAKE_COMPANY_FIELD_NAME as string | undefined)?.trim();
  return v || "Company";
}

function escapeAirtableFormulaString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/** Normalize to up to 10 US digits (strip leading 1). */
function normalizePhoneDigits(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d;
}

/** Common string variants for matching an existing Client Intake row by phone. */
function buildPhoneMatchVariants(raw: string): string[] {
  const t = raw.trim();
  const out = new Set<string>();
  if (t) out.add(t);
  const d = normalizePhoneDigits(raw);
  if (d.length >= 10) {
    const core = d.slice(-10);
    out.add(d);
    out.add(core);
    out.add(`(${core.slice(0, 3)}) ${core.slice(3, 6)}-${core.slice(6)}`);
    out.add(`${core.slice(0, 3)}-${core.slice(3, 6)}-${core.slice(6)}`);
  }
  return [...out];
}

async function findClientIntakeIdByPhoneVariants(phoneRaw: string): Promise<string | null> {
  const variants = buildPhoneMatchVariants(phoneRaw);
  if (variants.length === 0) return null;
  const phoneField = getClientIntakePhoneFieldNameForFormula();
  const clauses = variants.map((v) => `{${phoneField}}='${escapeAirtableFormulaString(v)}'`);
  const formula = `OR(${clauses.join(",")})`;
  const params = new URLSearchParams();
  params.set("filterByFormula", formula);
  params.set("pageSize", "1");
  params.set("returnFieldsByFieldId", "true");
  params.append("fields[]", CLIENT_INTAKE_FIELDS.NAME);

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${CLIENT_INTAKE_TABLE_ID}?${params.toString()}`
  );
  if (isErrorResult(data)) {
    console.warn("[clientIntake] find by phone failed (new row will be created):", data.message);
    return null;
  }
  return data.records?.[0]?.id ?? null;
}

/**
 * Case-insensitive match on Client Intake **Name** or **Company** (single row).
 * Used when Events → Client link is empty but the event title / client label matches a Client Intake row.
 */
async function findClientIntakeRecordIdByNameOrCompanyMatch(nameRaw: string): Promise<string | null> {
  const t = nameRaw.trim();
  if (!t || t === "—") return null;
  const nameField = getClientIntakeNameFieldNameForFormula();
  const companyField = getClientIntakeCompanyFieldNameForFormula();
  const escaped = escapeAirtableFormulaString(t);
  const formula = `OR(LOWER({${nameField}}) = LOWER('${escaped}'), LOWER({${companyField}}) = LOWER('${escaped}'))`;
  const params = new URLSearchParams();
  params.set("filterByFormula", formula);
  params.set("pageSize", "1");
  params.set("returnFieldsByFieldId", "true");
  params.append("fields[]", CLIENT_INTAKE_FIELDS.NAME);

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${CLIENT_INTAKE_TABLE_ID}?${params.toString()}`
  );
  if (isErrorResult(data)) {
    console.warn("[clientIntake] find by name/company failed:", data.message);
    return null;
  }
  return data.records?.[0]?.id ?? null;
}

function buildClientNameMatchVariants(nameRaw: string): string[] {
  const t = nameRaw.trim();
  if (!t || t === "—") return [];
  const out = new Set<string>();
  out.add(t);
  out.add(t.replace(/\s+/g, " ").trim());
  const noDots = t.replace(/\./g, "").replace(/\s+/g, " ").trim();
  if (noDots) out.add(noDots);
  return [...out];
}

/** Lowercase, single spaces, no periods — for FIND() against Client Intake text. */
function normalizeClientNameForSubstring(nameRaw: string): string {
  return nameRaw.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
}

/**
 * When exact equality fails (punctuation / spacing), find a row where Name or Company **contains**
 * the normalized client label (from the event title), or vice versa.
 */
async function findClientIntakeRecordIdBySubstringNameOrCompany(nameRaw: string): Promise<string | null> {
  const norm = normalizeClientNameForSubstring(nameRaw);
  if (norm.length < 3) return null;
  const escaped = escapeAirtableFormulaString(norm);
  const nameField = getClientIntakeNameFieldNameForFormula();
  const companyField = getClientIntakeCompanyFieldNameForFormula();
  const stripDots = (field: string) => `SUBSTITUTE(LOWER({${field}}), '.', '')`;
  const formula = `OR(
    FIND('${escaped}', ${stripDots(nameField)}) > 0,
    FIND('${escaped}', ${stripDots(companyField)}) > 0,
    FIND(${stripDots(nameField)}, '${escaped}') > 0,
    FIND(${stripDots(companyField)}, '${escaped}') > 0
  )`;
  const params = new URLSearchParams();
  params.set("filterByFormula", formula.replace(/\s+/g, " "));
  params.set("pageSize", "1");
  params.set("returnFieldsByFieldId", "true");
  params.append("fields[]", CLIENT_INTAKE_FIELDS.NAME);

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${CLIENT_INTAKE_TABLE_ID}?${params.toString()}`
  );
  if (isErrorResult(data)) {
    console.warn("[clientIntake] find by substring name/company failed:", data.message);
    return null;
  }
  return data.records?.[0]?.id ?? null;
}

/**
 * When `linkedClientRecordId` is missing on the Events row, resolve Client Intake by phone or by
 * client display name (from the **selected event**, not the search box).
 */
export async function resolveClientIntakeIdFromEventHints(opts: {
  clientPhone?: string;
  primaryContactPhone?: string;
  clientNameHint?: string;
}): Promise<string | null> {
  const phone1 = (opts.clientPhone ?? "").trim();
  if (phone1 && /\d/.test(phone1)) {
    const id = await findClientIntakeIdByPhoneVariants(phone1);
    if (id) return id;
  }
  const phone2 = (opts.primaryContactPhone ?? "").trim();
  if (phone2 && phone2 !== phone1 && /\d/.test(phone2)) {
    const id = await findClientIntakeIdByPhoneVariants(phone2);
    if (id) return id;
  }
  const hint = (opts.clientNameHint ?? "").trim();
  if (!hint || hint === "—") return null;
  for (const variant of buildClientNameMatchVariants(hint)) {
    const id = await findClientIntakeRecordIdByNameOrCompanyMatch(variant);
    if (id) return id;
  }
  const sub = await findClientIntakeRecordIdBySubstringNameOrCompany(hint);
  if (sub) return sub;
  return null;
}

/**
 * Find or create a Client Intake row and return its record id so Events can link via `FIELD_IDS.CLIENT`.
 * Staff never touch Airtable — Quick Intake / new event flows call this automatically from `createEvent`.
 */
export async function ensureClientIntakeRecordForContact(opts: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  company?: string;
}): Promise<string | AirtableErrorResult> {
  const phone = opts.phone.trim();
  if (!phone) {
    return { error: true, message: "Phone is required to link client." };
  }

  const existing = await findClientIntakeIdByPhoneVariants(phone);
  if (existing) return existing;

  const displayName =
    [opts.firstName.trim(), opts.lastName.trim()].filter(Boolean).join(" ").trim() ||
    opts.company?.trim() ||
    "Client";

  const fields: Record<string, unknown> = {
    [CLIENT_INTAKE_FIELDS.NAME]: displayName,
    [CLIENT_INTAKE_FIELDS.PHONE]: phone,
  };
  if (opts.company?.trim()) fields[CLIENT_INTAKE_FIELDS.COMPANY] = opts.company.trim();
  if (opts.email?.trim()) fields[CLIENT_INTAKE_FIELDS.EMAIL] = opts.email.trim();

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${CLIENT_INTAKE_TABLE_ID}`,
    {
      method: "POST",
      body: JSON.stringify({ records: [{ fields }] }),
    }
  );

  if (isErrorResult(data)) return data;
  const id = data.records?.[0]?.id;
  if (!id) return { error: true, message: "Client Intake create returned no record." };
  return id;
}

export async function loadClientIntakeRecord(
  recordId: string
): Promise<{ snapshot: ClientIntakeSnapshot } | AirtableErrorResult> {
  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");
  params.set("cellFormat", "json");
  params.append("fields[]", CLIENT_INTAKE_FIELDS.NAME);
  params.append("fields[]", CLIENT_INTAKE_FIELDS.PHONE);
  params.append("fields[]", CLIENT_INTAKE_FIELDS.COMPANY);
  params.append("fields[]", CLIENT_INTAKE_FIELDS.EMAIL);

  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${CLIENT_INTAKE_TABLE_ID}/${recordId}?${params.toString()}`
  );
  if (isErrorResult(data)) return data;

  const f = data.fields ?? {};
  return { snapshot: buildSnapshotFromFields(f) };
}
