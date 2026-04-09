/**
 * Clients table service — Airtable CRUD for the Clients table.
 * Table ID: tblsP51vS3doAquQE
 */

import {
  airtableFetch,
  type AirtableListResponse,
  type AirtableRecord,
  type AirtableErrorResult,
} from "./client";
import { isErrorResult, asString, asSingleSelectName, asNumber } from "./selectors";

// ── Table ──
export const CLIENTS_TABLE_ID = "tblsP51vS3doAquQE";

// ── Field IDs (source of truth) ──
export const CLIENT_FIELD_IDS = {
  CLIENT_NAME: "fldad8RGQJhG6fXUB",           // Single line text — primary field
  COMPANY_NAME: "fldaIlxVUF2Nos27H",          // Single line text
  PHONE_NUMBER: "fld9TAaKDdiQdsrsJ",           // Phone number
  EMAIL: "fldYVUhqsI2tscdKv",                 // Single line text
  ADDRESS: "fldWWKxtwklHpk5Sw",               // Long text
  CLIENT_SINCE: "fldHYz6fs9xlWzGUU",          // Date
  CLIENT_STATUS: "fld2zdS1aphYKurhm",         // Single select: Active, Inactive
  CLIENT_NOTES: "fldjzBBSYvrtvvR6b",          // Long text
  EVENTS: "fldyMnilAS66GydTn",                // Linked record → Events table
  RELATIONSHIP_MANAGER: "fldauL1pc8b9ZLFoS",  // Single line text
  CLIENT_TYPE: "fldXsSsO5cRcpzIsd",           // Single select: Corporate, Individual, Venue Partner, Other
  TOTAL_EVENT_COUNT: "fldnsZEyULP37ZH2q",      // Count — READ ONLY
  LAST_EVENT_DATE: "fldXDogeJmlokBLyX",        // Rollup/computed — READ ONLY
} as const;

// ── Computed / read-only fields — never write to these ──
const READ_ONLY_FIELDS = new Set<string>([
  CLIENT_FIELD_IDS.TOTAL_EVENT_COUNT,
  CLIENT_FIELD_IDS.LAST_EVENT_DATE,
]);

// ── Types ──
export type ClientRecord = {
  id: string;
  clientName: string;
  companyName: string;
  phoneNumber: string;
  email: string;
  address: string;
  clientSince: string;
  clientStatus: string;
  clientNotes: string;
  relationshipManager: string;
  clientType: string;
  totalEventCount: number;
  lastEventDate: string;
  eventIds: string[];
};

function parseClientRecord(rec: AirtableRecord<Record<string, unknown>>): ClientRecord {
  const f = rec.fields;
  return {
    id: rec.id,
    clientName: asString(f[CLIENT_FIELD_IDS.CLIENT_NAME]),
    companyName: asString(f[CLIENT_FIELD_IDS.COMPANY_NAME]),
    phoneNumber: asString(f[CLIENT_FIELD_IDS.PHONE_NUMBER]),
    email: asString(f[CLIENT_FIELD_IDS.EMAIL]),
    address: asString(f[CLIENT_FIELD_IDS.ADDRESS]),
    clientSince: asString(f[CLIENT_FIELD_IDS.CLIENT_SINCE]),
    clientStatus: asSingleSelectName(f[CLIENT_FIELD_IDS.CLIENT_STATUS]),
    clientNotes: asString(f[CLIENT_FIELD_IDS.CLIENT_NOTES]),
    relationshipManager: asString(f[CLIENT_FIELD_IDS.RELATIONSHIP_MANAGER]),
    clientType: asSingleSelectName(f[CLIENT_FIELD_IDS.CLIENT_TYPE]),
    totalEventCount: asNumber(f[CLIENT_FIELD_IDS.TOTAL_EVENT_COUNT]) ?? 0,
    lastEventDate: asString(f[CLIENT_FIELD_IDS.LAST_EVENT_DATE]),
    eventIds: Array.isArray(f[CLIENT_FIELD_IDS.EVENTS]) ? (f[CLIENT_FIELD_IDS.EVENTS] as string[]) : [],
  };
}

/** Base path for all Clients table requests. */
function tablePath(): string {
  return `/${CLIENTS_TABLE_ID}`;
}

// ── CRUD ──

/** Load all clients (paginated — fetches all pages). */
export async function loadAllClients(): Promise<ClientRecord[] | AirtableErrorResult> {
  const all: ClientRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    params.set("pageSize", "100");
    if (offset) params.set("offset", offset);

    const res = await airtableFetch<AirtableListResponse<Record<string, unknown>> & { offset?: string }>(
      `${tablePath()}?${params.toString()}`
    );
    if (isErrorResult(res)) return res;

    all.push(...res.records.map(parseClientRecord));
    offset = res.offset;
  } while (offset);

  return all;
}

/** Load a single client by record ID. */
export async function loadClient(recordId: string): Promise<ClientRecord | AirtableErrorResult> {
  const res = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `${tablePath()}/${recordId}`
  );
  if (isErrorResult(res)) return res;
  return parseClientRecord(res);
}

/** Create a new client. Returns the created record. */
export async function createClient(
  fields: Partial<Record<string, unknown>>
): Promise<ClientRecord | AirtableErrorResult> {
  // Strip read-only fields
  const safeFields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (!READ_ONLY_FIELDS.has(k)) safeFields[k] = v;
  }

  const res = await airtableFetch<AirtableRecord<Record<string, unknown>>>(tablePath(), {
    method: "POST",
    body: JSON.stringify({ fields: safeFields }),
  });
  if (isErrorResult(res)) return res;
  return parseClientRecord(res);
}

/** Update a client. Returns the updated record. */
export async function updateClient(
  recordId: string,
  fields: Partial<Record<string, unknown>>
): Promise<ClientRecord | AirtableErrorResult> {
  // Strip read-only fields
  const safeFields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (!READ_ONLY_FIELDS.has(k)) safeFields[k] = v;
  }

  const res = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `${tablePath()}/${recordId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ fields: safeFields }),
    }
  );
  if (isErrorResult(res)) return res;
  return parseClientRecord(res);
}

/** Delete a client by record ID. */
export async function deleteClient(recordId: string): Promise<true | AirtableErrorResult> {
  const res = await airtableFetch<{ id: string; deleted: boolean }>(
    `${tablePath()}/${recordId}`,
    { method: "DELETE" }
  );
  if (isErrorResult(res)) return res;
  return true;
}
