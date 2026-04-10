/**
 * Tasks API — FoodWerx Tasks table (field IDs in `tasksSchema.ts`).
 * Override table with VITE_AIRTABLE_TASKS_TABLE if needed.
 */

import {
  airtableFetch,
  getTasksTable,
  type AirtableListResponse,
  type AirtableRecord,
  type AirtableErrorResult,
} from "./client";
import { asString, asSingleSelectName, isErrorResult } from "./selectors";
import {
  getTasksFieldIdMap,
  normalizeTaskTypeForAirtable,
} from "./tasksSchema";

export type TaskStatus = "Pending" | "Completed" | "Overdue" | "Due Today";

export type Task = {
  id: string;
  taskId: string;
  eventId: string;
  eventName?: string;
  taskName: string;
  taskType: string;
  dueDate: string;
  status: TaskStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

function getTaskFieldIds(): Record<string, string> {
  return getTasksFieldIdMap();
}

function computeTaskStatus(dueDate: string, statusRaw: string): TaskStatus {
  if (statusRaw?.toLowerCase() === "completed") return "Completed";
  if (!dueDate) return "Pending";
  const today = new Date().toISOString().slice(0, 10);
  if (dueDate < today) return "Overdue";
  if (dueDate === today) return "Due Today";
  return "Pending";
}

type AirtableRecordWithTimestamps = AirtableRecord<Record<string, unknown>> & {
  createdTime?: string;
  lastModifiedTime?: string;
};

function recordToTask(
  record: AirtableRecordWithTimestamps,
  ids: Record<string, string>,
  eventName?: string
): Task {
  const f = record.fields ?? {};
  const dueDate = typeof f[ids["Due Date"]] === "string"
    ? (f[ids["Due Date"]] as string).slice(0, 10)
    : "";
  const statusRaw = asSingleSelectName(f[ids["Status"]]) || asString(f[ids["Status"]]);
  const eventIds = f[ids["Event"]];
  const eventId = Array.isArray(eventIds) && eventIds.length > 0
    ? (eventIds[0] as string)
    : typeof eventIds === "string"
      ? eventIds
      : "";

  const createdFromField = ids["Created At"] ? asString(f[ids["Created At"]]) : "";
  const updatedFromField = ids["Updated At"] ? asString(f[ids["Updated At"]]) : "";

  return {
    id: record.id,
    taskId: record.id,
    eventId,
    eventName,
    taskName: asString(f[ids["Task Name"]]) || "—",
    taskType: asSingleSelectName(f[ids["Task Type"]]) || asString(f[ids["Task Type"]]) || "—",
    dueDate,
    status: computeTaskStatus(dueDate, statusRaw),
    notes: asString(f[ids["Notes"]]) || "",
    createdAt: createdFromField || record.createdTime || "",
    updatedAt: updatedFromField || record.lastModifiedTime || "",
  };
}

/** Demo tasks when Tasks table id resolves empty (should not happen with default table id). */
function getDemoTasks(eventId?: string): Task[] {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return [
    {
      id: "demo_task_1",
      taskId: "demo_task_1",
      eventId: eventId || "recDemo1",
      taskName: "Follow up on questionnaire",
      taskType: "Questionnaire Follow-Up",
      dueDate: yesterday,
      status: "Overdue",
      notes: "",
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "demo_task_2",
      taskId: "demo_task_2",
      eventId: eventId || "recDemo1",
      taskName: "Send proposal package",
      taskType: "General Follow-Up",
      dueDate: today,
      status: "Due Today",
      notes: "",
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "demo_task_3",
      taskId: "demo_task_3",
      eventId: eventId || "recDemo1",
      taskName: "Get guest count from client",
      taskType: "Missing BEO Field",
      dueDate: tomorrow,
      status: "Pending",
      notes: "",
      createdAt: "",
      updatedAt: "",
    },
  ];
}

/** Load tasks for an event (status !== Completed) */
export async function loadTasksForEvent(eventId: string): Promise<Task[] | AirtableErrorResult> {
  const tableId = getTasksTable();
  if (!tableId) {
    return getDemoTasks(eventId).filter((t) => t.status !== "Completed");
  }

  const ids = getTaskFieldIds();
  const params = new URLSearchParams();
  params.set("pageSize", "100");
  params.set("cellFormat", "json");
  params.set("returnFieldsByFieldId", "true");
  Object.values(ids).forEach((fid) => params.append("fields[]", fid));

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${tableId}?${params.toString()}`
  );
  if (isErrorResult(data)) {
    return { error: true, message: (data as AirtableErrorResult).message ?? "Failed to load tasks" };
  }

  const tasks = (data.records ?? [])
    .map((r) => recordToTask(r as AirtableRecordWithTimestamps, ids))
    .filter((t) => t.eventId === eventId && t.status !== "Completed");
  return tasks;
}

/** Load today's pending tasks (status=Pending, dueDate=today) across all events */
export async function loadTodaysTasks(
  eventNamesById?: Record<string, string>
): Promise<Task[] | AirtableErrorResult> {
  const tableId = getTasksTable();
  if (!tableId) {
    const demos = getDemoTasks().filter(
      (t) => t.status === "Due Today" || t.status === "Pending"
    );
    return demos;
  }

  const ids = getTaskFieldIds();
  const today = new Date().toISOString().slice(0, 10);
  const params = new URLSearchParams();
  params.set("pageSize", "100");
  params.set("cellFormat", "json");
  params.set("returnFieldsByFieldId", "true");
  params.set(
    "filterByFormula",
    `AND(DATESTR({Due Date}) = "${today}", OR({Status} = "Pending", {Status} = ""))`
  );
  Object.values(ids).forEach((fid) => params.append("fields[]", fid));

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${tableId}?${params.toString()}`
  );
  if (isErrorResult(data)) {
    return { error: true, message: (data as AirtableErrorResult).message ?? "Failed to load today's tasks" };
  }

  return (data.records ?? []).map((r) => {
    const t = recordToTask(r as AirtableRecordWithTimestamps, ids);
    if (eventNamesById && t.eventId) {
      t.eventName = eventNamesById[t.eventId];
    }
    return t;
  });
}

/** Create a task */
export async function createTask(params: {
  eventId: string;
  taskName: string;
  taskType?: string;
  dueDate: string;
  status?: "Pending" | "Completed" | "Overdue";
  notes?: string;
}): Promise<{ id: string } | AirtableErrorResult> {
  const tableId = getTasksTable();
  if (!tableId) return { error: true, message: "Tasks table not configured" };

  const ids = getTaskFieldIds();
  const taskTypeNorm = normalizeTaskTypeForAirtable(params.taskType);

  const fields: Record<string, unknown> = {
    [ids["Task Name"]]: params.taskName,
    [ids["Event"]]: [params.eventId],
    [ids["Due Date"]]: params.dueDate,
    [ids["Status"]]: params.status ?? "Pending",
  };
  if (taskTypeNorm) {
    fields[ids["Task Type"]] = taskTypeNorm;
  }
  if (params.notes?.trim()) {
    fields[ids["Notes"]] = params.notes.trim();
  }

  const result = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${tableId}`,
    {
      method: "POST",
      body: JSON.stringify({ records: [{ fields }] }),
    }
  );
  if (isErrorResult(result)) return result;
  const record = result.records?.[0];
  if (!record) return { error: true, message: "Failed to create task" };
  return { id: record.id };
}

/** Update a task */
export async function updateTask(
  taskId: string,
  updates: { status?: "Pending" | "Completed" | "Overdue"; dueDate?: string; notes?: string }
): Promise<{ success: true } | AirtableErrorResult> {
  const tableId = getTasksTable();
  if (!tableId) return { error: true, message: "Tasks table not configured" };

  const ids = getTaskFieldIds();

  const fields: Record<string, unknown> = {};
  if (updates.status !== undefined) fields[ids["Status"]] = updates.status;
  if (updates.dueDate !== undefined) fields[ids["Due Date"]] = updates.dueDate;
  if (updates.notes !== undefined) fields[ids["Notes"]] = updates.notes;

  if (Object.keys(fields).length === 0) return { success: true };

  const result = await airtableFetch<{ records: Array<{ id: string }> }>(
    `/${tableId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ records: [{ id: taskId, fields }] }),
    }
  );
  if (isErrorResult(result)) return result;
  return { success: true };
}

/** Sort tasks: Overdue first, then Due Today, then Pending */
export function sortOutstandingTasks(tasks: Task[]): Task[] {
  const order: Record<TaskStatus, number> = {
    Overdue: 0,
    "Due Today": 1,
    Pending: 2,
    Completed: 3,
  };
  return [...tasks].sort((a, b) => order[a.status] - order[b.status]);
}
