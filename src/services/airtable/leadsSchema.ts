/**
 * FoodWerx **Leads** table — canonical IDs for this base.
 * Override table with `VITE_AIRTABLE_LEADS_TABLE` if you clone the base.
 *
 * Table: Leads · tbl6fyfrQpyfVV96q
 *
 * Keys are **app-internal labels** used in `leads.ts` (not always identical to Airtable column titles).
 */

export const LEADS_TABLE_ID_DEFAULT = "tbl6fyfrQpyfVV96q";

/** App label → Airtable field id (see LEAD_FIELD_NAMES in leads.ts). */
export const LEADS_FIELD_IDS_BY_LABEL: Record<string, string> = {
  "Lead Name": "fldejwF4JBQ1hnQ3l",
  "Inquiry Date": "fldlYr1DKVXdSwpzy",
  Source: "fldhSOBySilEEYrxu",
  "Client First Name": "fldo1NqBUEjSnii2z",
  "Client Last Name": "fld1IoG6DPwMz8suU",
  Phone: "fldHlePGdnwcI6ERS",
  Email: "fldXTfgSXKkiXJj7Q",
  "Preferred Contact Method": "fldyq1sKt0r4q44xh",
  "Best Time to Reach": "fldUG4R9ww4L3wiPE",
  "Estimated Event Date": "fldLIQlLdE5TDMNj8",
  "Event Type": "fldji6WhTorL2GXcV",
  "Estimated Guest Count": "fldHm3Z2Mfao6QC3n",
  /** Airtable column: "Venue (If known)" */
  Venue: "fldX4ZCNgglf8Kb9r",
  "Budget Range": "fldsg79Q3DsqfKawg",
  "Lead Status": "fldx81yV5dbXaFp4z",
  "Next Follow-Up Date": "fldp3UO0gcnXTRfPQ",
  "Follow-Up Priority": "fldHjQasresOixSrt",
  "Last Contact Date": "fldmm0i8GTpi3wUlV",
  "Times Contacted": "fldYoPDCXFnnJdBCd",
  "Follow-Up Notes": "fldsn121SqhBRywvd",
  /** Legacy list key — same long text field as Follow-Up Notes in this base */
  "Follow-Up History": "fldsn121SqhBRywvd",
  /** Airtable: "Proposal Needed?" */
  "Proposal Needed": "fldeOowC9kWtYxTpW",
  /** Airtable: "Proposal Sent?" */
  "Proposal Sent": "fldxQ5fo5uDdqdeic",
  "Proposal Date": "fldTw2KP8YtjWp2Vp",
  "Estimated Price Range": "fldizBSPErHN22efQ",
  /** Airtable: "Menu Ideas / Requested Concepts" */
  "Menu Ideas": "fldi6kC6PjZnBB4TR",
  "Special Requests": "flddMdBxAdxkgMEgL",
  /** Airtable: "Lead Notes" */
  Notes: "fldRFCm8zHjzHXcRl",
};
