import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";

const AIRTABLE_API = "https://api.airtable.com/v0";

type Role = "ops_admin" | "kitchen" | "logistics" | "intake" | "flair" | "foh";

interface JwtPayload {
  sub: string;
  email?: string;
  role: Role;
  name: string;
}

function verifyToken(token: string, secret: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${parts[0]}.${parts[1]}`)
      .digest("base64url");
    if (signature !== parts[2]) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    ) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
}

function getAuth(req: VercelRequest): JwtPayload | null {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) return null;
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  return verifyToken(token, secret);
}

function cors(res: VercelResponse, req: VercelRequest) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    cors(res, req);
    if (req.method === "OPTIONS") return res.status(204).end();

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    // Use table name or ID — Airtable accepts both. Default: "Feedback Issues" (create a table with this name)
    const tableIdOrName =
      process.env.AIRTABLE_FEEDBACK_TABLE || "Feedback Issues";
    const jwtSecret = process.env.AUTH_JWT_SECRET;

    const missing = [
      !apiKey && "AIRTABLE_API_KEY",
      !baseId && "AIRTABLE_BASE_ID",
      !jwtSecret && "AUTH_JWT_SECRET",
    ].filter(Boolean) as string[];
    if (missing.length > 0) {
      return res.status(500).json({
        error: "Server configuration error",
        details: `Missing: ${missing.join(", ")}`,
      });
    }

    const user = getAuth(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const isAdmin = user.role === "ops_admin";

    if (req.method === "POST") {
      const { type, screen, url, message } = req.body || {};
      if (!type || !screen || typeof message !== "string") {
        return res.status(400).json({
          error: "Missing required fields",
          required: ["type", "screen", "message"],
        });
      }

      const fields = {
        Type: type,
        Screen: String(screen),
        URL: String(url || ""),
        Message: String(message).trim() || "(No message)",
        UserId: user.sub,
        UserName: user.name || "Unknown",
        UserEmail: user.email || "",
        Status: "open",
      };

      const tablePath = encodeURIComponent(tableIdOrName);
      const airRes = await fetch(`${AIRTABLE_API}/${baseId}/${tablePath}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields }),
      });

      if (!airRes.ok) {
        const errText = await airRes.text();
        console.error("Airtable create error:", airRes.status, errText);
        const isPermsOrNotFound = errText.includes("INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND");
        return res.status(500).json({
          error: "Failed to save feedback",
          details: isPermsOrNotFound
            ? `Create a table named "Feedback Issues" in your Airtable base (same base as Events), or set AIRTABLE_FEEDBACK_TABLE to your table's exact name. See docs/FEEDBACK_SETUP.md`
            : errText.slice(0, 200),
        });
      }

      const data = (await airRes.json()) as { id: string };
      return res.status(201).json({ id: data.id, ok: true });
    }

    if (req.method === "GET") {
      const escaped = (user.sub || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      const filter = isAdmin
        ? ""
        : encodeURIComponent(`{UserId}="${escaped}"`);
      const tablePath = encodeURIComponent(tableIdOrName);
      const url = `${AIRTABLE_API}/${baseId}/${tablePath}?sort[0][field]=createdTime&sort[0][direction]=desc`;
      const urlWithFilter = filter ? `${url}&filterByFormula=${filter}` : url;

      const airRes = await fetch(urlWithFilter, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!airRes.ok) {
        const errText = await airRes.text();
        console.error("Airtable list error:", airRes.status, errText);
        return res.status(500).json({
          error: "Failed to load feedback",
          details: errText.slice(0, 200),
        });
      }

      const data = (await airRes.json()) as {
        records: Array<{
          id: string;
          fields: Record<string, unknown>;
          createdTime?: string;
        }>;
      };

      const records = (data.records || []).map((r) => ({
        id: r.id,
        createdTime: r.createdTime,
        type: r.fields.Type,
        screen: r.fields.Screen,
        url: r.fields.URL,
        message: r.fields.Message,
        userId: r.fields.UserId,
        userName: r.fields.UserName,
        userEmail: r.fields.UserEmail,
        status: r.fields.Status || "open",
        resolvedAt: r.fields.ResolvedAt,
        resolvedBy: r.fields.ResolvedBy,
        resolutionNote: r.fields.ResolutionNote,
      }));

      return res.status(200).json({ records });
    }

    if (req.method === "PATCH") {
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id, status, resolutionNote } = req.body || {};
      if (!id || !status) {
        return res.status(400).json({
          error: "Missing required fields",
          required: ["id", "status"],
        });
      }

      const fields: Record<string, unknown> = {
        Status: status,
      };
      if (status === "resolved") {
        fields.ResolvedAt = new Date().toISOString();
        fields.ResolvedBy = user.name || user.sub;
        if (resolutionNote) fields.ResolutionNote = resolutionNote;
      }

      const tablePath = encodeURIComponent(tableIdOrName);
      const airRes = await fetch(`${AIRTABLE_API}/${baseId}/${tablePath}/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields }),
      });

      if (!airRes.ok) {
        const errText = await airRes.text();
        console.error("Airtable patch error:", airRes.status, errText);
        return res.status(500).json({
          error: "Failed to update feedback",
          details: errText.slice(0, 200),
        });
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("Feedback API error:", e);
    return res.status(500).json({
      error: "Server error",
      details: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
