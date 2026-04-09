/**
 * Tasks API for FOH task management.
 * Airtable table fields: Task Name, Event, Task Type, Due Date, Status, Notes, Created At, Updated At.
 * Set VITE_AIRTABLE_TASKS_TABLE to your table ID. When unset, returns demo data.
 */

import {
  airtableFetch,
  airtableMetaFetch,
  getTasksTable,
  type AirtableListResponse,
  type AirtableRecord,
  type AirtableErrorResult,
} from "./client";
import { asString, asSingleSelectName, isErrorResult } from "./selectors";

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

const TASK_FIELD_NAMES = [
  "Task Name",
  "Event",
  "Task Type",
  "Due Date",
  "Status",
  "Notes",
] as const;

type AirtableTableSchema = {
  id: string;
  name: string;
  fields: Array<{ id: string; name: string; type: string }>;
};

type AirtableTablesResponse = {
  tables: AirtableTableSchema[];
};

let cachedTaskFieldIds: Record<string, string> | null | undefined = undefined;

async function getTaskFieldIds(): Promise<Record<string, string> | null> {
  if (cachedTaskFieldIds !== undefined) return cachedTaskFieldIds;
  const tableId = getTasksTable();
  if (!tableId) {
    cachedTaskFieldIds = null;
    return null;
  }
  const data = await airtableMetaFetch<AirtableTablesResponse>("");
  if (isErrorResult(data) || !Array.isArray(data?.tables)) {
    cachedTaskFieldIds = null;
    return null;
  }
  const table = data.tables.find((t) => t.id === tableId || t.name === tableId);
  if (!table) {
    cachedTaskFieldIds = null;
    return null;
  }
  const byName = Object.fromEntries((table.fields ?? []).map((f) => [f.name, f.id]));
  const ids: Record<string, string> = {};
  for (const name of TASK_FIELD_NAMES) {
    if (byName[name]) ids[name] = byName[name];
  }
  cachedTaskFieldIds = Object.keys(ids).length >= 4 ? ids : null;
  return cachedTaskFieldIds;
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
    createdAt: record.createdTime ?? "",
    updatedAt: record.lastModifiedTime ?? "",
  };
}

/** Demo tasks when table is not configured */
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
      taskType: "Follow-up",
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
      taskType: "Follow-up",
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
      taskType: "BEO Missing",
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

  const ids = await getTaskFieldIds();
  if (!ids) {
    return { error: true, message: "Could not resolve task field IDs. Ensure table has: Task Name, Event, Task Type, Due Date, Status, Notes." };
  }

  const params = new URLSearchParams();
  params.set("pageSize", "100");
  params.set("cellFormat", "json");
  params.set("returnFieldsByFieldId", "true");
  Object.values(ids).forEach((id) => params.append("fields[]", id));

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${tableId}?${params.toString()}`
  );
  if (isErrorResult(data)) {
    return { error: true, message: (data as AirtableErrorResult).message ?? "Failed to load tasks" };
  }

  const tasks = (data.records ?? [])
    .map((r) => recordToTask(r, ids))
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

  const ids = await getTaskFieldIds();
  if (!ids) {
    return { error: true, message: "Could not resolve task field IDs. Ensure table has: Task Name, Event, Task Type, Due Date, Status, Notes." };
  }

  const today = new Date().toISOString().slice(0, 10);
  const params = new URLSearchParams();
  params.set("pageSize", "100");
  params.set("cellFormat", "json");
  params.set("returnFieldsByFieldId", "true");
  params.set(
    "filterByFormula",
    `AND(DATESTR({Due Date}) = "${today}", OR({Status} = "Pending", {Status} = ""))`
  );
  Object.values(ids).forEach((id) => params.append("fields[]", id));

  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${tableId}?${params.toString()}`
  );
  if (isErrorResult(data)) {
    return { error: true, message: (data as AirtableErrorResult).message ?? "Failed to load today's tasks" };
  }

  return (data.records ?? []).map((r) => {
    const t = recordToTask(r, ids);
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
  status?: "Pending" | "Completed";
  notes?: string;
}): Promise<{ id: string } | AirtableErrorResult> {
  const tableId = getTasksTable();
  if (!tableId) return { error: true, message: "Tasks table not configured" };

  const ids = await getTaskFieldIds();
  if (!ids) return { error: true, message: "Could not resolve task field IDs" };

  const fields: Record<string, unknown> = {
    [ids["Task Name"]]: params.taskName,
    [ids["Event"]]: [params.eventId],
    [ids["Due Date"]]: params.dueDate,
    [ids["Status"]]: params.status ?? "Pending",
  };
  if (ids["Task Type"] && params.taskType) {
    fields[ids["Task Type"]] = params.taskType;
  }
  if (ids["Notes"] && params.notes) {
    fields[ids["Notes"]] = params.notes;
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
  updates: { status?: "Pending" | "Completed"; dueDate?: string; notes?: string }
): Promise<{ success: true } | AirtableErrorResult> {
  const tableId = getTasksTable();
  if (!tableId) return { error: true, message: "Tasks table not configured" };

  const ids = await getTaskFieldIds();
  if (!ids) return { error: true, message: "Could not resolve task field IDs" };

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
