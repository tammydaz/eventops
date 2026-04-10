/**
 * Leads service for FOH lead pipeline.
 * Uses the Leads Airtable table (`leadsSchema.ts` default id; override with VITE_AIRTABLE_LEADS_TABLE).
 * Field IDs are merged: canonical map in `leadsSchema.ts` + Meta API names from LEAD_FIELD_NAMES when they match.
 * When the table is unavailable or list fetch fails, returns demo data.
 *
 * Expected Leads table fields:
 * - Lead Name (single line)
 * - Inquiry Date (date)
 * - Lead Status (single select)
 * - Next Follow-Up Date (date)
 * - Contact Info (long text)
 * - Follow-Up History (long text)
 * - Proposal Status (single select)
 * - Notes (long text)
 * - FOH Notes (long text, optional bubble on cards)
 */

import {
  airtableFetch,
  airtableMetaFetch,
  airtableMetaTables,
  getLeadsTable,
  type AirtableListResponse,
  type AirtableRecord,
  type AirtableErrorResult,
} from "./client";
import { LEADS_FIELD_IDS_BY_LABEL } from "./leadsSchema";
import { asString, asSingleSelectName, isErrorResult } from "./selectors";

export type FollowUpPriority = "Urgent" | "High" | "Medium" | "Low";

export type LeadListItem = {
  id: string;
  leadName: string;
  inquiryDate?: string;
  leadStatus: string;
  nextFollowUpDate?: string;
  contactInfo?: string;
  followUpHistory?: string;
  proposalStatus?: string;
  notes?: string;
  fohNotes?: string;
  /** Follow-Up Priority for glow border: Urgent=red, High=orange, Medium=yellow, Low=green */
  followUpPriority?: FollowUpPriority;
  /** Proposal Sent? — true when proposalStatus is "Sent" or explicit field */
  proposalSent?: boolean;
};

export type LeadRecordData = {
  id: string;
  fields: Record<string, unknown>;
};

/** Normalized lead detail for overview page (works with both Airtable and demo data) */
export type LeadDetail = {
  id: string;
  leadName: string;
  inquiryDate: string;
  contactInfo: string;
  leadStatus: string;
  followUpHistory: string;
  proposalStatus: string;
  notes: string;
  fohNotes?: string;
  nextFollowUpDate?: string;
  source?: string;
  timesContacted?: number;
  lastContact?: string;
  followUpNotes?: string;
  followUpPriority?: FollowUpPriority;
  proposalSent?: boolean;
  proposalNeeded?: boolean;
  proposalDate?: string;
  clientFirstName?: string;
  clientLastName?: string;
  phone?: string;
  email?: string;
  preferredContactMethod?: string;
  bestTimeToReach?: string;
  estimatedEventDate?: string;
  eventType?: string;
  estimatedGuestCount?: number;
  venue?: string;
  budgetRange?: string;
  estimatedPriceRange?: string;
  menuIdeas?: string;
  specialRequests?: string;
};

/** Parsed timeline entry for Lead Notes */
export type LeadNoteEntry = {
  date: string;  // M/D/YY format for display
  text: string;
};

const LEAD_FIELD_NAMES = [
  "Lead Name",
  "Inquiry Date",
  "Lead Status",
  "Next Follow-Up Date",
  "Contact Info",
  "Follow-Up History",
  "Proposal Status",
  "Proposal Sent",
  "Notes",
  "FOH Notes",
  "Follow-Up Priority",
  "Source",
  "Client First Name",
  "Client Last Name",
  "Phone",
  "Email",
  "Preferred Contact Method",
  "Best Time to Reach",
  "Estimated Event Date",
  "Event Type",
  "Estimated Guest Count",
  "Venue",
  "Budget Range",
  "Last Contact Date",
  "Times Contacted",
  "Follow-Up Notes",
  "Proposal Needed",
  "Proposal Date",
  "Estimated Price Range",
  "Menu Ideas",
  "Special Requests",
] as const;

type AirtableTableSchema = {
  id: string;
  name: string;
  fields: Array<{ id: string; name: string; type: string }>;
};

type AirtableTablesResponse = {
  tables: AirtableTableSchema[];
};

let cachedFieldIds: Record<string, string> | null | undefined = undefined;

async function getLeadFieldIds(): Promise<Record<string, string> | null> {
  if (cachedFieldIds !== undefined) return cachedFieldIds;
  const tableId = getLeadsTable();
  if (!tableId) {
    cachedFieldIds = null;
    return null;
  }
  /** Start from canonical FoodWerx ids so Airtable titles like "Lead Notes" / "Proposal Sent?" still map. */
  const ids: Record<string, string> = { ...LEADS_FIELD_IDS_BY_LABEL };

  const data = await airtableMetaFetch<AirtableTablesResponse>("");
  if (!isErrorResult(data)) {
    const tables = airtableMetaTables<AirtableTableSchema>(data);
    const table = tables.find((t) => t.id === tableId || t.name === tableId);
    if (table) {
      const byName = Object.fromEntries((table.fields ?? []).map((f) => [f.name, f.id]));
      for (const name of LEAD_FIELD_NAMES) {
        if (byName[name]) ids[name] = byName[name];
      }
    }
  }

  if (!ids["Lead Name"]) {
    cachedFieldIds = null;
    return null;
  }
  cachedFieldIds = ids;
  return cachedFieldIds;
}

function recordToLeadItem(record: AirtableRecord<Record<string, unknown>>, ids: Record<string, string>): LeadListItem {
  const f = record.fields ?? {};
  const proposalStatusFieldId = ids["Proposal Status"];
  const proposalStatus = proposalStatusFieldId
    ? asSingleSelectName(f[proposalStatusFieldId]) || asString(f[proposalStatusFieldId])
    : "";
  const proposalSentField = ids["Proposal Sent"] ? f[ids["Proposal Sent"]] : undefined;
  const proposalSent =
    typeof proposalSentField === "boolean"
      ? proposalSentField
      : proposalStatus?.toLowerCase() === "sent";
  const followUpPriorityRaw = ids["Follow-Up Priority"]
    ? asSingleSelectName(f[ids["Follow-Up Priority"]]) || asString(f[ids["Follow-Up Priority"]])
    : "";
  const followUpPriority = followUpPriorityRaw && ["Urgent", "High", "Medium", "Low"].includes(followUpPriorityRaw)
    ? (followUpPriorityRaw as FollowUpPriority)
    : undefined;
  const followUpBlock = ids["Follow-Up History"] ? asString(f[ids["Follow-Up History"]]) : "";
  const contactFromField = ids["Contact Info"] ? asString(f[ids["Contact Info"]]) : "";
  const contactComposed = [
    [asString(ids["Client First Name"] ? f[ids["Client First Name"]] : ""), asString(ids["Client Last Name"] ? f[ids["Client Last Name"]] : "")]
      .join(" ")
      .trim(),
    asString(ids["Phone"] ? f[ids["Phone"]] : ""),
    asString(ids["Email"] ? f[ids["Email"]] : ""),
  ]
    .filter(Boolean)
    .join("\n");
  return {
    id: record.id,
    leadName: asString(ids["Lead Name"] ? f[ids["Lead Name"]] : ""),
    inquiryDate:
      ids["Inquiry Date"] && typeof f[ids["Inquiry Date"]] === "string"
        ? (f[ids["Inquiry Date"]] as string).slice(0, 10)
        : undefined,
    leadStatus: ids["Lead Status"]
      ? asSingleSelectName(f[ids["Lead Status"]]) || asString(f[ids["Lead Status"]]) || "—"
      : "—",
    nextFollowUpDate:
      ids["Next Follow-Up Date"] && typeof f[ids["Next Follow-Up Date"]] === "string"
        ? (f[ids["Next Follow-Up Date"]] as string).slice(0, 10)
        : undefined,
    contactInfo: contactFromField || contactComposed,
    followUpHistory: followUpBlock,
    proposalStatus: proposalStatus || undefined,
    notes: ids["Notes"] ? asString(f[ids["Notes"]]) : "",
    fohNotes: ids["FOH Notes"] ? asString(f[ids["FOH Notes"]]) : "",
    followUpPriority,
    proposalSent,
  };
}

/** Demo leads when table is not configured or fetch fails */
function getDemoLeads(): LeadListItem[] {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  return [
    { id: "demo_lead_1", leadName: "Smith Wedding Inquiry", inquiryDate: "2025-03-01", leadStatus: "Active", nextFollowUpDate: yesterday, contactInfo: "Jane Smith\n(555) 123-4567\njane@example.com", followUpHistory: "3/10/26 – Left voicemail about availability\n3/8/26 – Client requested menu options\n3/5/26 – Initial inquiry came through website", proposalStatus: "Draft", notes: "", fohNotes: "Call back re: venue", followUpPriority: "Urgent", proposalSent: false },
    { id: "demo_lead_2", leadName: "TechCorp Q2 Summit", inquiryDate: "2025-03-05", leadStatus: "Hot Lead", nextFollowUpDate: today, contactInfo: "Mike Johnson\nmike@techcorp.com\n(555) 987-6543", followUpHistory: "3/5/26 – Sent proposal\n3/4/26 – Initial call", proposalStatus: "Sent", notes: "", fohNotes: "", followUpPriority: "High", proposalSent: true },
    { id: "demo_lead_3", leadName: "Holloway Anniversary", inquiryDate: "2025-03-03", leadStatus: "Warm", nextFollowUpDate: tomorrow, contactInfo: "Sarah Holloway\nsarah@email.com", followUpHistory: "3/6/26 – Awaiting menu preferences", proposalStatus: "Pending", notes: "", fohNotes: "Prefers plated", followUpPriority: "Medium", proposalSent: false },
    { id: "demo_lead_4", leadName: "Green Acres Luncheon", inquiryDate: "2025-02-28", leadStatus: "Cold", nextFollowUpDate: nextWeek, contactInfo: "Tom Green\ntom@greenacres.org", followUpHistory: "2/28/26 – No response to follow-up", proposalStatus: "Draft", notes: "", fohNotes: "", followUpPriority: "Low", proposalSent: false },
    { id: "demo_lead_5", leadName: "Rivera Quinceañera", inquiryDate: "2025-03-06", leadStatus: "Hot Lead", nextFollowUpDate: today, contactInfo: "Maria Rivera\n(555) 555-1212\nmaria@rivera.com", followUpHistory: "3/7/26 – Site visit scheduled\n3/6/26 – Initial inquiry", proposalStatus: "In Progress", notes: "", fohNotes: "200 guests, buffet", followUpPriority: "High", proposalSent: false },
  ];
}

export async function loadLeads(): Promise<LeadListItem[] | AirtableErrorResult> {
  const tableId = getLeadsTable();
  if (!tableId) {
    return getDemoLeads();
  }

  const ids = await getLeadFieldIds();
  if (!ids) {
    return getDemoLeads();
  }

  const params = new URLSearchParams();
  params.set("pageSize", "100");
  params.set("cellFormat", "json");
  params.set("returnFieldsByFieldId", "true");
  new Set(Object.values(ids)).forEach((id) => params.append("fields[]", id));

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(`/${tableId}?${params.toString()}`);
  if (isErrorResult(data)) {
    return getDemoLeads();
  }

  return (data.records ?? []).map((r) => recordToLeadItem(r, ids));
}

function leadItemToDetail(item: LeadListItem): LeadDetail {
  return {
    id: item.id,
    leadName: item.leadName,
    inquiryDate: item.inquiryDate ?? "",
    contactInfo: item.contactInfo ?? "",
    leadStatus: item.leadStatus,
    followUpHistory: item.followUpHistory ?? "",
    proposalStatus: item.proposalStatus ?? "",
    notes: item.notes ?? "",
    fohNotes: item.fohNotes,
    nextFollowUpDate: item.nextFollowUpDate,
    source: undefined,
    timesContacted: undefined,
    lastContact: undefined,
    followUpNotes: item.followUpHistory ?? item.fohNotes ?? "",
    followUpPriority: item.followUpPriority,
    proposalSent: item.proposalSent,
  };
}

export async function loadLead(recordId: string): Promise<LeadDetail | AirtableErrorResult> {
  const tableId = getLeadsTable();
  if (!tableId) {
    const demos = getDemoLeads();
    const match = demos.find((l) => l.id === recordId);
    if (match) return leadItemToDetail(match);
    return { error: true, message: "Lead not found" };
  }

  const ids = await getLeadFieldIds();
  if (!ids) {
    const demos = getDemoLeads();
    const match = demos.find((l) => l.id === recordId);
    if (match) return leadItemToDetail(match);
    return { error: true, message: "Lead not found" };
  }

  const params = new URLSearchParams();
  params.set("returnFieldsByFieldId", "true");
  params.set("cellFormat", "json");
  const data = await airtableFetch<AirtableRecord<Record<string, unknown>>>(
    `/${tableId}/${recordId}?${params.toString()}`
  );
  if (isErrorResult(data)) return data;
  const item = recordToLeadItem(data as AirtableRecord<Record<string, unknown>>, ids);
  const detail = leadItemToDetail(item);
  const f = data.fields ?? {};
  // Enrich detail with optional fields when available
  if (ids["Source"]) detail.source = asString(f[ids["Source"]]);
  if (ids["Client First Name"]) detail.clientFirstName = asString(f[ids["Client First Name"]]);
  if (ids["Client Last Name"]) detail.clientLastName = asString(f[ids["Client Last Name"]]);
  if (ids["Phone"]) detail.phone = asString(f[ids["Phone"]]);
  if (ids["Email"]) detail.email = asString(f[ids["Email"]]);
  if (ids["Preferred Contact Method"]) detail.preferredContactMethod = asString(f[ids["Preferred Contact Method"]]);
  if (ids["Best Time to Reach"]) detail.bestTimeToReach = asString(f[ids["Best Time to Reach"]]);
  if (ids["Estimated Event Date"]) {
    const d = f[ids["Estimated Event Date"]];
    detail.estimatedEventDate = typeof d === "string" ? (d as string).slice(0, 10) : undefined;
  }
  if (ids["Event Type"]) detail.eventType = asSingleSelectName(f[ids["Event Type"]]) || asString(f[ids["Event Type"]]);
  if (ids["Estimated Guest Count"]) {
    const n = f[ids["Estimated Guest Count"]];
    detail.estimatedGuestCount = typeof n === "number" ? n : typeof n === "string" ? parseInt(n, 10) : undefined;
  }
  if (ids["Venue"]) detail.venue = asString(f[ids["Venue"]]);
  if (ids["Budget Range"]) detail.budgetRange = asString(f[ids["Budget Range"]]);
  if (ids["Last Contact Date"]) {
    const d = f[ids["Last Contact Date"]];
    detail.lastContact = typeof d === "string" ? (d as string).slice(0, 10) : undefined;
  }
  if (ids["Times Contacted"]) {
    const n = f[ids["Times Contacted"]];
    detail.timesContacted = typeof n === "number" ? n : typeof n === "string" ? parseInt(n, 10) : undefined;
  }
  if (ids["Follow-Up Notes"]) detail.followUpNotes = asString(f[ids["Follow-Up Notes"]]);
  if (ids["Proposal Needed"]) detail.proposalNeeded = f[ids["Proposal Needed"]] === true;
  if (ids["Proposal Date"]) {
    const d = f[ids["Proposal Date"]];
    detail.proposalDate = typeof d === "string" ? (d as string).slice(0, 10) : undefined;
  }
  if (ids["Estimated Price Range"]) detail.estimatedPriceRange = asString(f[ids["Estimated Price Range"]]);
  if (ids["Menu Ideas"]) detail.menuIdeas = asString(f[ids["Menu Ideas"]]);
  if (ids["Special Requests"]) detail.specialRequests = asString(f[ids["Special Requests"]]);
  return detail;
}

/** Get urgency for next follow-up: "overdue" | "due_today" | "scheduled" */
export function getLeadUrgency(nextFollowUpDate?: string): "overdue" | "due_today" | "scheduled" | null {
  if (!nextFollowUpDate) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (nextFollowUpDate < today) return "overdue";
  if (nextFollowUpDate === today) return "due_today";
  return "scheduled";
}

/** Parse followUpHistory + notes into timeline entries. Handles "M/D/YY – text" or "M/D/YY: text" format. */
export function parseLeadNotesTimeline(followUpHistory: string, notes?: string): LeadNoteEntry[] {
  const lines: string[] = [];
  if (followUpHistory?.trim()) lines.push(...followUpHistory.split(/\r?\n/));
  if (notes?.trim()) lines.push(...notes.split(/\r?\n/));
  const entries: LeadNoteEntry[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4})[\s–\-:]+(.+)$/);
    if (match) {
      entries.push({ date: match[1], text: match[2].trim() });
    } else {
      entries.push({ date: "", text: trimmed });
    }
  }
  return entries;
}

/** Build fields object for create/update from a partial record. Only includes fields that exist in ids. */
function buildLeadFields(
  ids: Record<string, string>,
  data: Partial<LeadDetail> & { leadName?: string }
): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  if (ids["Lead Name"] && data.leadName?.trim()) fields[ids["Lead Name"]] = data.leadName.trim();
  if (ids["Inquiry Date"] && data.inquiryDate) fields[ids["Inquiry Date"]] = data.inquiryDate;
  if (ids["Lead Status"] && data.leadStatus) fields[ids["Lead Status"]] = data.leadStatus;
  if (ids["Next Follow-Up Date"] && data.nextFollowUpDate) fields[ids["Next Follow-Up Date"]] = data.nextFollowUpDate;
  if (ids["Contact Info"] && data.contactInfo !== undefined) fields[ids["Contact Info"]] = data.contactInfo;
  if (ids["Follow-Up History"] && data.followUpHistory !== undefined) fields[ids["Follow-Up History"]] = data.followUpHistory;
  if (ids["Proposal Status"] && data.proposalStatus !== undefined) fields[ids["Proposal Status"]] = data.proposalStatus;
  if (ids["Notes"] && data.notes !== undefined) fields[ids["Notes"]] = data.notes;
  if (ids["FOH Notes"] && data.fohNotes !== undefined) fields[ids["FOH Notes"]] = data.fohNotes;
  if (ids["Follow-Up Priority"] && data.followUpPriority) fields[ids["Follow-Up Priority"]] = data.followUpPriority;
  if (ids["Proposal Sent"] && data.proposalSent !== undefined) fields[ids["Proposal Sent"]] = data.proposalSent;
  if (ids["Source"] && data.source !== undefined) fields[ids["Source"]] = data.source;
  if (ids["Client First Name"] && data.clientFirstName !== undefined) fields[ids["Client First Name"]] = data.clientFirstName;
  if (ids["Client Last Name"] && data.clientLastName !== undefined) fields[ids["Client Last Name"]] = data.clientLastName;
  if (ids["Phone"] && data.phone !== undefined) fields[ids["Phone"]] = data.phone;
  if (ids["Email"] && data.email !== undefined) fields[ids["Email"]] = data.email;
  if (ids["Venue"] && data.venue !== undefined) fields[ids["Venue"]] = data.venue;
  if (ids["Estimated Event Date"] && data.estimatedEventDate) fields[ids["Estimated Event Date"]] = data.estimatedEventDate;
  if (ids["Event Type"] && data.eventType !== undefined) fields[ids["Event Type"]] = data.eventType;
  if (ids["Estimated Guest Count"] && data.estimatedGuestCount !== undefined) fields[ids["Estimated Guest Count"]] = data.estimatedGuestCount;
  if (ids["Budget Range"] && data.budgetRange !== undefined) fields[ids["Budget Range"]] = data.budgetRange;
  if (ids["Follow-Up Notes"] && data.followUpNotes !== undefined) fields[ids["Follow-Up Notes"]] = data.followUpNotes;
  if (ids["Proposal Needed"] && data.proposalNeeded !== undefined) fields[ids["Proposal Needed"]] = data.proposalNeeded;
  if (ids["Proposal Date"] && data.proposalDate) fields[ids["Proposal Date"]] = data.proposalDate;
  if (ids["Estimated Price Range"] && data.estimatedPriceRange !== undefined) fields[ids["Estimated Price Range"]] = data.estimatedPriceRange;
  if (ids["Menu Ideas"] && data.menuIdeas !== undefined) fields[ids["Menu Ideas"]] = data.menuIdeas;
  if (ids["Special Requests"] && data.specialRequests !== undefined) fields[ids["Special Requests"]] = data.specialRequests;
  if (ids["Last Contact Date"] && data.lastContact) fields[ids["Last Contact Date"]] = data.lastContact;
  if (ids["Times Contacted"] && data.timesContacted !== undefined) {
    const val = typeof data.timesContacted === "number" ? data.timesContacted : parseInt(String(data.timesContacted), 10);
    if (!isNaN(val)) fields[ids["Times Contacted"]] = val;
  }
  if (ids["Preferred Contact Method"] && data.preferredContactMethod !== undefined) fields[ids["Preferred Contact Method"]] = data.preferredContactMethod;
  if (ids["Best Time to Reach"] && data.bestTimeToReach !== undefined) fields[ids["Best Time to Reach"]] = data.bestTimeToReach;
  return fields;
}

export async function createLead(
  data: Partial<LeadDetail> & { leadName: string }
): Promise<{ id: string } | AirtableErrorResult> {
  const tableId = getLeadsTable();
  if (!tableId) return { error: true, message: "Leads table not configured" };

  const ids = await getLeadFieldIds();
  if (!ids) return { error: true, message: "Could not resolve lead field IDs" };

  const fields = buildLeadFields(ids, data);
  const result = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${tableId}`,
    {
      method: "POST",
      body: JSON.stringify({ records: [{ fields }] }),
    }
  );
  if (isErrorResult(result)) return result;
  const record = result.records?.[0];
  if (!record) return { error: true, message: "Failed to create lead" };
  return { id: record.id };
}

export async function updateLead(
  recordId: string,
  data: Partial<LeadDetail>
): Promise<{ success: true } | AirtableErrorResult> {
  const tableId = getLeadsTable();
  if (!tableId) return { error: true, message: "Leads table not configured" };

  const ids = await getLeadFieldIds();
  if (!ids) return { error: true, message: "Could not resolve lead field IDs" };

  const fields = buildLeadFields(ids, data);
  if (Object.keys(fields).length === 0) return { success: true };

  const result = await airtableFetch<{ records: Array<{ id: string }> }>(
    `/${tableId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ records: [{ id: recordId, fields }] }),
    }
  );
  if (isErrorResult(result)) return result;
  return { success: true };
}

/** Convert lead to event: create Event record, set LeadStatus = "Booked" */
export async function convertLeadToEvent(
  lead: LeadDetail
): Promise<{ eventId: string } | AirtableErrorResult> {
  const { createEvent } = await import("./events");
  const { FIELD_IDS } = await import("./events");

  const fields: Record<string, unknown> = {};
  const clientFirst = lead.clientFirstName?.trim() || "";
  const clientLast = lead.clientLastName?.trim() || "";
  const contactLine = lead.contactInfo?.split("\n")[0]?.trim() || "";
  const fallbackName = clientFirst || clientLast ? `${clientFirst} ${clientLast}`.trim() : contactLine || lead.leadName;
  const nameParts = fallbackName.split(/\s+/);
  const firstName = lead.clientFirstName ?? (nameParts[0] || "Client");
  const lastName = lead.clientLastName ?? (nameParts.slice(1).join(" ") || "—");
  const phone = lead.phone ?? lead.contactInfo?.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0] ?? "";

  fields[FIELD_IDS.CLIENT_FIRST_NAME] = firstName;
  fields[FIELD_IDS.CLIENT_LAST_NAME] = lastName;
  fields[FIELD_IDS.CLIENT_PHONE] = phone || "TBD";
  fields[FIELD_IDS.EVENT_TYPE] = lead.eventType || "Full Service";
  if (lead.estimatedEventDate) fields[FIELD_IDS.EVENT_DATE] = lead.estimatedEventDate;
  if (lead.estimatedGuestCount != null) fields[FIELD_IDS.GUEST_COUNT] = lead.estimatedGuestCount;
  if (lead.venue) fields[FIELD_IDS.VENUE] = lead.venue;
  if (lead.email) fields[FIELD_IDS.CLIENT_EMAIL] = lead.email;

  const eventResult = await createEvent(fields);
  if (isErrorResult(eventResult)) return eventResult;

  await updateLead(lead.id, { leadStatus: "Booked" });
  return { eventId: eventResult.id };
}
