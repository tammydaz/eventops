import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";

const AIRTABLE_API = "https://api.airtable.com/v0";

type Role = "ops_admin" | "kitchen" | "logistics" | "intake" | "flair" | "foh";

interface AirtableUser {
  id: string;
  fields: {
    Email?: string;
    Name?: string;
    Role?: string;
    PasswordHash?: string;
  };
}

function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const computed = crypto.scryptSync(password, salt, 64).toString("base64");
    return crypto.timingSafeEqual(Buffer.from(hash, "base64"), Buffer.from(computed, "base64"));
  } catch {
    return false;
  }
}

function signToken(payload: object, secret: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${enc(header)}.${enc(payload)}`)
    .digest("base64url");
  return `${enc(header)}.${enc(payload)}.${signature}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableId = process.env.AIRTABLE_USERS_TABLE;
    const jwtSecret = process.env.AUTH_JWT_SECRET;

    const missing = [
      !apiKey && "AIRTABLE_API_KEY",
      !baseId && "AIRTABLE_BASE_ID",
      !tableId && "AIRTABLE_USERS_TABLE",
      !jwtSecret && "AUTH_JWT_SECRET",
    ].filter(Boolean) as string[];
    if (missing.length > 0) {
      console.error("Missing env:", missing.join(", "));
      return res.status(500).json({
        error: "Server configuration error",
        details: `Missing: ${missing.join(", ")}. Add to .env.local and restart vercel dev.`,
      });
    }

    const { email, password } = req.body || {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email required" });
    }

    const emailLower = email.trim().toLowerCase();
    const escaped = emailLower.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    const filterFormula = encodeURIComponent(`LOWER({Email})="${escaped}"`);
    const url = `${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${filterFormula}&maxRecords=1`;
    const airRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!airRes.ok) {
      const errText = await airRes.text();
      console.error("Airtable error:", airRes.status, errText);
      return res.status(500).json({
        error: "Failed to fetch user",
        details: `Airtable error ${airRes.status}. Check AIRTABLE_BASE_ID and AIRTABLE_USERS_TABLE.`,
      });
    }

    const data = (await airRes.json()) as { records: AirtableUser[] };
    const record = data.records?.[0];
    if (!record) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const hash = record.fields.PasswordHash;
    if (!hash) {
      return res.status(200).json({ needsPasswordSetup: true, email: record.fields.Email });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({ error: "Password required" });
    }
    if (!verifyPassword(password, hash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const role = (record.fields.Role || "kitchen") as Role;
    const name = record.fields.Name || record.fields.Email || "User";

    const token = signToken(
      { sub: record.id, email: record.fields.Email, role, name },
      jwtSecret
    );

    return res.status(200).json({
      token,
      user: {
        id: record.id,
        name,
        role,
        email: record.fields.Email,
      },
    });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({
      error: "Login failed",
      details: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
