/**
 * FoodWerx **Tasks** table — canonical IDs (override env only if you clone the base).
 *
 * Table: Tasks · tblX6SC1F9dnFV2Yu
 * Event links → Events (e.g. tblYfaWh67Ag4ydXq)
 */

export const TASKS_TABLE_ID_DEFAULT = "tblX6SC1F9dnFV2Yu";

/** Field IDs — spelling must match Airtable single-select option names on write. */
export const TASKS_FIELD_IDS = {
  taskName: "fldhKU3q73BWHq7IU",
  event: "fldmTmMHBJJRWHolZ",
  taskType: "fldp0qIQqgKrM6BqC",
  dueDate: "fldR2FU0A6GEkkGyI",
  status: "fldSb1guHYgUU1ETs",
  notes: "fldk9XACoYcBMXNxC",
  /** Formula CREATED_TIME() — read only */
  createdAt: "fldSvGJncqmhNiORn",
  /** Formula LAST_MODIFIED_TIME() — read only */
  updatedAt: "fld35NACaiqDTklMr",
} as const;

/** Single-select options on Task Type (exact strings for API). */
export const TASK_TYPE_OPTION = {
  questionnaireFollowUp: "Questionnaire Follow-Up",
  proposalFollowUp: "Proposal Follow-Up",
  invoiceFollowUp: "Invoice Follow-Up",
  missingBeoField: "Missing BEO Field",
  generalFollowUp: "General Follow-Up",
} as const;

/** Map legacy / shorthand labels from older UI code → Airtable option names. */
const TASK_TYPE_ALIASES: Record<string, string> = {
  "follow-up": TASK_TYPE_OPTION.generalFollowUp,
  "follow up": TASK_TYPE_OPTION.generalFollowUp,
  followup: TASK_TYPE_OPTION.generalFollowUp,
  "beo missing": TASK_TYPE_OPTION.missingBeoField,
  "beo-missing": TASK_TYPE_OPTION.missingBeoField,
};

export function normalizeTaskTypeForAirtable(raw?: string): string | undefined {
  if (!raw?.trim()) return undefined;
  const t = raw.trim();
  const lower = t.toLowerCase();
  if (TASK_TYPE_ALIASES[lower]) return TASK_TYPE_ALIASES[lower];
  return t;
}

/** Internal map keyed like legacy Meta lookup (for recordToTask). */
export function getTasksFieldIdMap(): Record<string, string> {
  return {
    "Task Name": TASKS_FIELD_IDS.taskName,
    Event: TASKS_FIELD_IDS.event,
    "Task Type": TASKS_FIELD_IDS.taskType,
    "Due Date": TASKS_FIELD_IDS.dueDate,
    Status: TASKS_FIELD_IDS.status,
    Notes: TASKS_FIELD_IDS.notes,
    "Created At": TASKS_FIELD_IDS.createdAt,
    "Updated At": TASKS_FIELD_IDS.updatedAt,
  };
}
