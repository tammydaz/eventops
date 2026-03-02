import type { VercelRequest, VercelResponse } from "@vercel/node";

const AIRTABLE_API = "https://api.airtable.com/v0";

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

    const missing = [
      !apiKey && "AIRTABLE_API_KEY",
      !baseId && "AIRTABLE_BASE_ID",
      !tableId && "AIRTABLE_USERS_TABLE",
    ].filter(Boolean) as string[];
    if (missing.length > 0) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const { email } = req.body || {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email required" });
    }

    const emailLower = email.trim().toLowerCase();
    const escaped = emailLower.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const filterFormula = encodeURIComponent(`LOWER({Email})="${escaped}"`);
    const listUrl = `${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${filterFormula}&maxRecords=1`;
    const listRes = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!listRes.ok) {
      return res.status(500).json({ error: "Failed to lookup user" });
    }

    const listData = (await listRes.json()) as { records: Array<{ id: string }> };
    const record = listData.records?.[0];
    if (!record) {
      return res.status(404).json({ error: "User not found" });
    }

    const patchUrl = `${AIRTABLE_API}/${baseId}/${tableId}/${record.id}`;
    const patchRes = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: { PasswordHash: null },
      }),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error("Airtable PATCH error:", patchRes.status, errText);
      return res.status(500).json({ error: "Failed to clear password" });
    }

    return res.status(200).json({ ok: true, message: "Password cleared. You can now set a new one." });
  } catch (e) {
    console.error("Clear password error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
