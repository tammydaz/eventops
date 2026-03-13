/**
 * Server-side proxy for Airtable attachment uploads.
 * Keeps API key server-side — never use VITE_AIRTABLE_API_KEY in the browser.
 *
 * POST /api/airtable/upload?recordId=recXXX&fieldId=fldYYY
 * Body: multipart/form-data with "file" field
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const CONTENT_API = "https://content.airtable.com/v0";

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const r = req as unknown as { on: (e: string, c: (chunk: Buffer) => void) => void; once: (e: string, c: () => void) => void };
  return new Promise((resolve, reject) => {
    r.on("data", (chunk: Buffer) => chunks.push(chunk));
    r.once("end", () => resolve(Buffer.concat(chunks)));
    r.once("error", reject);
  });
}

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
      message: "AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set.",
    });
  }

  const recordId = (req.query.recordId as string)?.trim();
  const fieldId = (req.query.fieldId as string)?.trim();

  if (!recordId || !fieldId) {
    return res.status(400).json({
      error: "Bad request",
      message: "Query params recordId and fieldId are required.",
    });
  }

  try {
    const body = await readRawBody(req);
    const contentType = (req.headers["content-type"] as string) || "application/octet-stream";
    const url = `${CONTENT_API}/${baseId}/${recordId}/${fieldId}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": contentType,
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    return res.status(200).json(data);
  } catch (err) {
    console.error("[api/airtable/upload]", err);
    return res.status(500).json({
      error: "Upload failed",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
