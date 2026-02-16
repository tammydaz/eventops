const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("[invoiceParser] VITE_OPENAI_API_KEY is not set. Invoice parsing will be disabled.");
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/build/pdf");
  const workerModule = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  const workerUrl = typeof workerModule.default === "string" ? workerModule.default : (workerModule as any).default?.href ?? "";
  if (workerUrl) {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerUrl;
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = (pdfjsLib as any).getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    fullText += strings.join(" ") + "\n";
  }

  return fullText;
}

export type ParsedInvoice = {
  clientFirstName?: string;
  clientLastName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientOrganization?: string;
  guestCount?: number;
  eventDate?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  venueName?: string;
  notes?: string;
  menuText?: string;
};

export async function parseInvoiceText(text: string): Promise<ParsedInvoice | null> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === "sk-your-openai-key-here") {
    throw new Error("OpenAI API key is missing or invalid. Add VITE_OPENAI_API_KEY to your .env file with a real key from platform.openai.com.");
  }

  const prompt = `
You are helping a catering company populate a BEO intake form from a PDF invoice.

Given the raw invoice text below, extract the key fields and return STRICT JSON only.

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
  "menuText": string | null
}

Rules:
- If you are unsure about a field, use null.
- "menuText" should be a single multi-line string that contains the human-readable menu / service description.
- Do NOT include any extra keys.
- Respond with JSON ONLY, no explanation.

INVOICE TEXT:
"""${text}"""`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    let errMsg = `OpenAI API error (${response.status})`;
    try {
      const j = JSON.parse(body);
      if (j.error?.message) errMsg = j.error.message;
    } catch {
      if (body) errMsg += ": " + body.slice(0, 150);
    }
    console.error("[invoiceParser]", errMsg);
    throw new Error(errMsg);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    console.error("[invoiceParser] Unexpected OpenAI response format", data);
    throw new Error("OpenAI returned an empty or unexpected response. Try again.");
  }

  const parsed = extractJsonFromText(content);
  if (!parsed) {
    console.error("[invoiceParser] No JSON found in response. Content sample:", content?.slice(0, 300));
    throw new Error("Could not read extracted data from OpenAI. Try a different invoice or try again.");
  }
  return parsed as ParsedInvoice;
}

/** Pull a JSON object out of model output (handles markdown code blocks and extra text). */
function extractJsonFromText(text: string): Record<string, unknown> | null {
  let raw = text.trim();
  // Strip markdown code block (e.g. ```json ... ```)
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) raw = codeBlockMatch[1].trim();
  // Find first { and last } to get a single JSON object
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  raw = raw.slice(start, end + 1);
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // Retry after removing trailing commas before } or ] (common model mistake)
    const fixed = raw.replace(/,(\s*[}\]])/g, "$1");
    try {
      return JSON.parse(fixed) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

