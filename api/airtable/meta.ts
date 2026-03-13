/**
 * Server-side proxy for Airtable Metadata API.
 * Avoids 403 from client-side calls — uses AIRTABLE_API_KEY (server env).
 * Fallback: when API returns 403, serves airtable_schema.json if present.
 *
 * GET /api/airtable/meta?path=  →  https://api.airtable.com/v0/meta/bases/{baseId}{path}
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const META_BASE = "https://api.airtable.com/v0/meta/bases";
const SCHEMA_FALLBACK = join(process.cwd(), "airtable_schema.json");

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
  const path = (req.query.path as string)?.trim() || "";

  if (!baseId) {
    return res.status(500).json({
      error: "Server config",
      message: "AIRTABLE_BASE_ID must be set.",
    });
  }

  const url = `${META_BASE}/${baseId}${path.startsWith("/") ? path : path ? `/${path}` : ""}`;

  try {
    if (apiKey) {
      const airRes = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await airRes.json();

      if (airRes.ok) {
        res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
        return res.status(200).json(data);
      }
      if (airRes.status !== 403) {
        return res.status(airRes.status).json(data);
      }
    }

    // 403 or no key: fallback to cached schema
    if (existsSync(SCHEMA_FALLBACK) && (!path || path === "/tables")) {
      const cached = JSON.parse(readFileSync(SCHEMA_FALLBACK, "utf8"));
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(200).json(cached);
    }

    return res.status(403).json({
      error: { type: "INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND", message: "Metadata API 403. Run: curl -s \"https://api.airtable.com/v0/meta/bases/YOUR_BASE_ID/tables\" -H \"Authorization: Bearer YOUR_TOKEN\" -o airtable_schema.json" },
    });
  } catch (err) {
    console.error("[api/airtable/meta]", err);
    return res.status(500).json({
      error: "Airtable request failed",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
