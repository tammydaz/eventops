/**
 * Server-side proxy for Airtable Data API.
 * Keeps API key server-side — never use VITE_AIRTABLE_API_KEY in the browser.
 *
 * POST /api/airtable/proxy
 * Body: { path: "/Events?filterByFormula=...", method?: "GET"|"POST"|"PATCH"|"DELETE", body?: string }
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const AIRTABLE_API = "https://api.airtable.com/v0";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.AIRTABLE_API_KEY?.trim();
  const baseId = process.env.AIRTABLE_BASE_ID?.trim();

  if (!apiKey || !baseId) {
    return res.status(500).json({
      error: "Server config",
      message: "AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set in Vercel env (or .env for local dev:full).",
    });
  }

  const path = typeof req.body?.path === "string" ? req.body.path : "";
  const method = (req.body?.method as string) || "GET";
  const body = typeof req.body?.body === "string" ? req.body.body : undefined;

  if (!path || !path.startsWith("/")) {
    return res.status(400).json({
      error: "Bad request",
      message: "Body must include { path: '/TableName?...' }",
    });
  }

  // Encode path segments so table names with spaces (e.g. "Event Menu (SHADOW SYSTEM)") work
  const [pathPart, ...queryParts] = path.split("?");
  const queryPart = queryParts.length ? "?" + queryParts.join("?") : "";
  const encodedPath =
    pathPart
      .split("/")
      .map((s) => (s ? encodeURIComponent(s) : ""))
      .join("/") + queryPart;

  const url = `${AIRTABLE_API}/${baseId}${encodedPath}`;

  try {
    const init: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    };
    if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
      init.body = body;
    }

    const response = await fetch(url, init);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    return res.status(200).json(data);
  } catch (err) {
    console.error("[api/airtable/proxy]", err);
    return res.status(500).json({
      error: "Airtable request failed",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
