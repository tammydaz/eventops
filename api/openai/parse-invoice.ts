/**
 * Server-side proxy for OpenAI invoice parsing.
 * Keeps API key server-side — never use VITE_OPENAI_API_KEY in the browser.
 *
 * POST /api/openai/parse-invoice
 * Body: { "text": "raw invoice text..." }
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const OPENAI_API = "https://api.openai.com/v1/chat/completions";

const PROMPT = `You are helping a catering company populate a BEO intake form from a PDF invoice.

Given the raw invoice text below, extract the key fields and return STRICT JSON only.
Do NOT extract any food/menu items — those will be added manually.

JSON shape:
{
  "clientFirstName": string | null,
  "clientLastName": string | null,
  "clientEmail": string | null,
  "clientPhone": string | null,
  "clientOrganization": string | null,
  "guestCount": number | null,
  "eventDate": string | null,
  "eventStartTime": string | null,
  "eventEndTime": string | null,
  "venueName": string | null,
  "notes": string | null,
  "menuText": null,
  "customPassedApp": null,
  "customPresentedApp": null,
  "customBuffetMetal": null,
  "customBuffetChina": null,
  "customDessert": null,
  "fwStaff": string | null,
  "staffArrivalTime": string | null
}

Rules:
- If you are unsure about a field, use null.
- ALWAYS set menuText, customPassedApp, customPresentedApp, customBuffetMetal, customBuffetChina, customDessert to null — do not parse food items.
- "fwStaff": staff counts from line items, e.g. "2 Server, 1 Bartender" from "2 Server (5 Hours of Service)" and "1 Bartender (5 Hours of Service)".
- "staffArrivalTime": time staff arrives, e.g. "13:00" for 1pm from "Staff on-site 1pm-6pm".
- Do NOT include any extra keys.
- Respond with JSON ONLY, no explanation.`;

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

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(500).json({
      error: "Server config",
      message: "OPENAI_API_KEY must be set in Vercel env (or .env for local dev:full).",
    });
  }

  const text = typeof req.body?.text === "string" ? req.body.text : "";
  if (!text || text.length < 10) {
    return res.status(400).json({
      error: "Bad request",
      message: "Body must include { text: 'raw invoice text...' }",
    });
  }

  try {
    const response = await fetch(OPENAI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `${PROMPT}\n\nINVOICE TEXT:\n"""${text}"""` }],
        temperature: 0.2,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || `OpenAI API error (${response.status})`;
      return res.status(response.status).json({ error: errMsg });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return res.status(500).json({ error: "OpenAI returned an empty or unexpected response." });
    }

    const parsed = extractJsonFromText(content);
    if (!parsed) {
      return res.status(500).json({ error: "Could not parse JSON from OpenAI response." });
    }

    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    return res.status(200).json(parsed);
  } catch (err) {
    console.error("[api/openai/parse-invoice]", err);
    return res.status(500).json({
      error: "OpenAI request failed",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

function extractJsonFromText(text: string): Record<string, unknown> | null {
  let raw = text.trim();
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) raw = codeBlockMatch[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  raw = raw.slice(start, end + 1);
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const fixed = raw.replace(/,(\s*[}\]])/g, "$1");
    try {
      return JSON.parse(fixed) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
