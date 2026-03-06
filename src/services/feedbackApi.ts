import { useAuthStore } from "../state/authStore";

export type FeedbackType = "issue" | "idea" | "bug" | "recommendation";

export interface FeedbackRecord {
  id: string;
  createdTime?: string;
  type: FeedbackType;
  screen: string;
  url: string;
  message: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "open" | "resolved";
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export const FEEDBACK_LABELS: Record<FeedbackType, string> = {
  issue: "Report Issue",
  idea: "Share Idea",
  bug: "Report Bug",
  recommendation: "Recommendation",
};

const base = import.meta.env.VITE_APP_URL || "";

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function createFeedback(params: {
  type: FeedbackType;
  screen: string;
  url: string;
  message: string;
}): Promise<{ id?: string; error?: string; details?: string }> {
  const res = await fetch(`${base}/api/feedback`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(params),
  });
  const data = (await res.json()) as { id?: string; error?: string; details?: string; rawError?: string };
  if (!res.ok) {
    console.error("[Feedback API] POST failed:", res.status, data);
    return { error: data.error || "Failed to save", details: data.details };
  }
  return { id: data.id };
}

export async function listFeedback(): Promise<{
  records?: FeedbackRecord[];
  error?: string;
  details?: string;
}> {
  const res = await fetch(`${base}/api/feedback`, {
    method: "GET",
    headers: await getAuthHeaders(),
  });
  const data = (await res.json()) as {
    records?: FeedbackRecord[];
    error?: string;
    details?: string;
  };
  if (!res.ok) {
    console.error("[Feedback API] GET failed:", res.status, data);
    return { error: data.error || "Failed to load", details: data.details };
  }
  return { records: data.records || [] };
}

export async function resolveFeedback(
  id: string,
  resolutionNote?: string
): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch(`${base}/api/feedback`, {
    method: "PATCH",
    headers: await getAuthHeaders(),
    body: JSON.stringify({ id, status: "resolved", resolutionNote }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok) {
    return { error: data.error || "Failed to resolve" };
  }
  return { ok: true };
}
