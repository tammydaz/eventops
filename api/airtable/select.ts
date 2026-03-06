/**
 * Server-side proxy for Airtable select queries.
 * Keeps API key server-side and avoids 403/CORS from frontend.
 *
 * GET /api/airtable/select?table=Station%20Presets&formula={Preset%20Name}%20%3D%20"Taco%20Station"
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const AIRTABLE_API = "https://api.airtable.com/v0";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.AIRTABLE_API_KEY?.trim();
  const baseId = process.env.AIRTABLE_BASE_ID?.trim();
  const table = (req.query.table as string)?.trim();
  const formula = (req.query.formula as string)?.trim();
  const nameField =
    ((req.query.nameField as string)?.trim()) ||
    (process.env.VITE_AIRTABLE_STATION_PRESETS_NAME_FIELD as string)?.trim() ||
    "Preset Name";

  if (!apiKey || !baseId) {
    return res.status(500).json({
      error: "Server config",
      message: "AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set in Vercel env.",
    });
  }

  if (!table || table === "undefined" || table === "null") {
    return res.status(400).json({
      error: "Bad request",
      message: "Query param 'table' is required (e.g. Station Presets or tblXXX).",
    });
  }

  const params = new URLSearchParams();
  if (formula) params.set("filterByFormula", formula);
  params.set("maxRecords", "1");
  params.append("fields[]", nameField);
  params.append("fields[]", "Line 1 Defaults");
  params.append("fields[]", "Line 2 Defaults");
  params.append("fields[]", "Individual Defaults");

  const url = `${AIRTABLE_API}/${baseId}/${encodeURIComponent(table)}?${params.toString()}`;

  try {
    const airRes = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await airRes.json();

    if (!airRes.ok) {
      return res.status(airRes.status).json(data);
    }

    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    return res.status(200).json(data);
  } catch (err) {
    console.error("[api/airtable/select]", err);
    return res.status(500).json({
      error: "Airtable request failed",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
