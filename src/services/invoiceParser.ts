const OPENAI_API_KEY = (import.meta.env.VITE_OPENAI_API_KEY as string)?.replace(/[^\x00-\x7F]/g, "").trim() ?? "";

/** Exclude vendor/caterer emails (info@, sales@, @foodwerx) from being used as client email */
function isVendorEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();
  if (/@foodwerx/i.test(lower) || /@hospitality/i.test(lower)) return true;
  if (/^info@|^sales@|^hello@|^contact@|^admin@|^support@/i.test(lower)) return true;
  return false;
}

/** Exclude vendor/placeholder words from being used as client first or last name. Exported for use in excelParser and invoiceToEventFields. */
export function isVendorOrPlaceholderName(name: string): boolean {
  const lower = (name || "").toLowerCase().trim();
  if (!lower || lower.length < 2) return true;
  const vendorWords = ["info", "infor", "information", "contact", "bill", "sales", "support", "admin", "foodwerx", "hospitality"];
  return vendorWords.includes(lower) || vendorWords.some((w) => lower.startsWith(w + " ") || lower === w);
}

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
  clientStreet?: string;
  clientCity?: string;
  clientState?: string;
  clientZip?: string;
  guestCount?: number;
  eventDate?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  staffArrivalTime?: string;
  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  venueState?: string;
  venueZip?: string;
  invoiceNumber?: string;
  primaryContactName?: string;
  notes?: string;
  menuText?: string;
  /** Parsed menu sections for BEO custom fields */
  customPassedApp?: string;
  customPresentedApp?: string;
  customBuffetMetal?: string;
  customBuffetChina?: string;
  customDessert?: string;
  /** FW staff from invoice: e.g. "2 Server, 1 Bartender" */
  fwStaff?: string;
  /** Event type: "Delivery", "Pickup", "Full Service" */
  eventType?: string;
};

/**
 * Rule-based parser for Hospitality Management Services / FoodWerx invoice format.
 * Works without OpenAI. Extracts: Bill To, Phone, E-Mail, Date, guest count, venue, menu, etc.
 */
export function parseInvoiceTextRuleBased(text: string): ParsedInvoice | null {
  const raw = text.replace(/\r\n/g, "\n");
  const lines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean);

  const result: ParsedInvoice = {};

  // Invoice #: "86308" or "Invoice # 86308"
  const invNumMatch = raw.match(/Invoice\s*#\s*(\d+)/im) || raw.match(/(?:^|\s)(\d{5,})\s*(?:$|\s|Date|Bill)/m);
  if (invNumMatch) result.invoiceNumber = invNumMatch[1].trim();

  // Invoice Date: "2/6/2026" or "Date 2/6/2026"
  const dateMatch = raw.match(/(?:^|\s)Date\s*\n?\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/im) ||
    raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    const m = dateMatch[dateMatch.length - 3];
    const d = dateMatch[dateMatch.length - 2];
    const y = dateMatch[dateMatch.length - 1];
    if (m && d && y) result.eventDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // Bill To block: name, address, city/state/zip (PDF may join with spaces or newlines)
  const billToMatch = raw.match(/Bill\s*To\s*([\s\S]+?)(?=Phone|E-?Mail|Total|PO\s*#|Terms|Due|Description|Quantity|Rate|Amount|Hospitality|foodwerx|$)/im);
  const billToText = billToMatch ? billToMatch[1].trim() : "";
  const billToLines = billToText ? billToText.split(/\s{2,}|\n/).map((l) => l.trim()).filter((l) => l.length > 2) : [];

  if (billToText) {
    // Client name: first part before address (digit) - "Charles Elsea & Devin Simpkins"
    const nameMatch = billToText.match(/^([^0-9\n]+?)(?=\d{2,}\s|\n|$)/);
    const firstLine = (nameMatch ? nameMatch[1] : billToLines[0] || "").trim();
    if (firstLine.includes(" & ")) {
      const parts = firstLine.split(/\s+&\s+/).map((s) => s.trim());
      const firstPart = parts[0] || "";
      const secondPart = parts[1] || "";
      const nameParts = firstPart.split(/\s+/);
      const fn = nameParts[0] || firstPart;
      const ln = nameParts.length > 1 ? nameParts.slice(1).join(" ") : secondPart;
      if (!isVendorOrPlaceholderName(fn)) result.clientFirstName = fn;
      if (ln && !isVendorOrPlaceholderName(ln)) result.clientLastName = ln;
      if (secondPart) result.primaryContactName = secondPart;
    } else if (firstLine.includes("@")) {
      const [before, after] = firstLine.split("@").map((s) => s.trim());
      result.clientOrganization = before || firstLine;
      result.venueName = after || billToLines[1] || before;
    } else if (firstLine && /^\d+/.test(billToText.slice(firstLine.length).trim())) {
      const nameParts = firstLine.split(/\s+/);
      const fn = nameParts[0] || firstLine;
      const ln = nameParts.slice(1).join(" ") || undefined;
      if (!isVendorOrPlaceholderName(fn)) result.clientFirstName = fn;
      if (ln && !isVendorOrPlaceholderName(ln)) result.clientLastName = ln;
    } else if (firstLine) {
      result.clientOrganization = firstLine;
      const nameParts = firstLine.split(/\s+/);
      if (nameParts.length >= 2) {
        const fn = nameParts[0];
        const ln = nameParts.slice(1).join(" ");
        if (!isVendorOrPlaceholderName(fn)) result.clientFirstName = fn;
        if (!isVendorOrPlaceholderName(ln)) result.clientLastName = ln;
      }
    }

    // Client address: "704 Meadowview Drive" + "Cinnaminson, NJ 08077"
    const streetMatch = billToText.match(/(\d+[\w\s\.]+(?:Street|St|Ave|Avenue|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Way|Court|Ct|Parkway|Pkwy)\.?)/i);
    if (streetMatch) result.clientStreet = streetMatch[1].trim();
    const cityStateZip = billToText.match(/([A-Za-z\s]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
    if (cityStateZip) {
      result.clientCity = cityStateZip[1].trim();
      result.clientState = cityStateZip[2].trim();
      result.clientZip = cityStateZip[3].trim();
    }
  }

  // Venue from "Taking place at Camden County Boathouse"
  const takingPlaceMatch = raw.match(/Taking\s+place\s+at\s+([^.]+?)(?=\s+Flirty|\s+Description|\s+Quantity|\s+\d{2,4}\s+\d|$)/im);
  if (takingPlaceMatch) result.venueName = takingPlaceMatch[1].trim();

  // Phone: "Phone 973-513-3134"
  const phoneMatch = raw.match(/Phone\s*\n?\s*([\d\-\.\(\)\s]{10,20})/im) || raw.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
  if (phoneMatch) result.clientPhone = phoneMatch[1].replace(/\s+/g, " ").trim();

  // E-Mail: "E-Mail elseac23@gmail.com" — prefer labeled email; when using generic match, skip vendor emails (info@, @foodwerx)
  const labeledEmail = raw.match(/E-?Mail\s*\n?\s*([\w._%+-]+@[\w.-]+\.\w+)/im);
  if (labeledEmail && !isVendorEmail(labeledEmail[1])) {
    result.clientEmail = labeledEmail[1].trim();
  } else {
    const allEmails = [...raw.matchAll(/([\w._%+-]+@[\w.-]+\.\w+)/g)];
    const clientEmail = allEmails.map((m) => m[1].trim()).find((e) => !isVendorEmail(e));
    if (clientEmail) result.clientEmail = clientEmail;
  }

  // Client name fallback from email: "elseac23" -> Elsea — only when email is not vendor (info@, @foodwerx)
  if (result.clientEmail && !result.clientFirstName && !isVendorEmail(result.clientEmail)) {
    const local = result.clientEmail.split("@")[0] || "";
    const name = local.replace(/[._\d]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts[0] && !isVendorOrPlaceholderName(parts[0])) result.clientFirstName = parts[0];
    if (parts.length > 1 && !isVendorOrPlaceholderName(parts.slice(1).join(" "))) result.clientLastName = parts.slice(1).join(" ");
  }

  // Guest count: prefer package line "Flirty Package 166 105.00" or dessert "25 6.00 150.00" - take largest qty in 20-2000 range
  const allQtyMatches = [...raw.matchAll(/(\d{2,4})\s+[\d.]+\s+[\d,]+\.?\d*T?/g)];
  let bestGuest = 0;
  for (const m of allQtyMatches) {
    const qty = parseInt(m[1], 10);
    if (qty >= 20 && qty <= 2000 && qty > bestGuest) bestGuest = qty;
  }
  // Fallback: "Pricing is based on 25 guests" or dessert quantity 25
  if (!bestGuest) {
    const guestNote = raw.match(/Pricing is based on (\d+)\s+guests/i) || raw.match(/(\d+)\s+guests/i);
    if (guestNote) {
      const n = parseInt(guestNote[1], 10);
      if (n >= 10 && n <= 2000) result.guestCount = n;
    }
  } else {
    result.guestCount = bestGuest;
  }

  const to24 = (h: number, m: number, ampm: string) => {
    if (/pm/i.test(ampm) && h !== 12) h += 12;
    if (/am/i.test(ampm) && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // Event times: "Event Begins at 6:30pm" (Rhinchart format)
  const eventBeginsMatch = raw.match(/Event\s+Begins?\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (eventBeginsMatch) {
    const h = parseInt(eventBeginsMatch[1], 10);
    const m = parseInt(eventBeginsMatch[2] || "0", 10);
    result.eventStartTime = to24(h, m, eventBeginsMatch[3] || "pm");
  }

  // Event times: "9am-4:30pm" or "Chef on site from 5pm-10pm" or "Staff on-site 1pm-6pm"
  const timeRange = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeRange) {
    const h1 = parseInt(timeRange[1], 10);
    const m1 = parseInt(timeRange[2] || "0", 10);
    const h2 = parseInt(timeRange[4], 10);
    const m2 = parseInt(timeRange[5] || "0", 10);
    const ampm1 = timeRange[3] || "pm";
    const ampm2 = timeRange[6] || "pm";
    if (!result.eventStartTime) result.eventStartTime = to24(h1, m1, ampm1);
    result.eventEndTime = to24(h2, m2, ampm2);
    // "Staff on-site 1pm-6pm" or "Chef on site from 5pm-10pm" — first time is staff arrival
    const staffMatch = raw.match(/(?:Staff\s+on-?site|Chef\s+on\s+site)\s+(?:from\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (staffMatch) {
      const sh = parseInt(staffMatch[1], 10);
      const sm = parseInt(staffMatch[2] || "0", 10);
      result.staffArrivalTime = to24(sh, sm, staffMatch[3] || "pm");
    } else {
      result.staffArrivalTime = to24(h1, m1, ampm1);
    }
  }

  // FW staff: "2 Server (5 Hours of Service)", "1 Bartender (5 Hours of Service)" -> "2 Server, 1 Bartender"
  const staffParts: string[] = [];
  const serverMatch = raw.match(/(\d+)\s+Server(?:s)?\s*(?:\([^)]*\))?/i);
  if (serverMatch) staffParts.push(`${serverMatch[1]} Server${parseInt(serverMatch[1], 10) !== 1 ? "s" : ""}`);
  const bartenderMatch = raw.match(/(\d+)\s+Bartender(?:s)?\s*(?:\([^)]*\))?/i);
  if (bartenderMatch) staffParts.push(`${bartenderMatch[1]} Bartender${parseInt(bartenderMatch[1], 10) !== 1 ? "s" : ""}`);
  if (staffParts.length > 0) result.fwStaff = staffParts.join(", ");

  // Description block: menu items, dietary notes, venue
  // Try multiple anchors — Rhinchart uses "Event Begins", table has "Description", "Quantity"
  const descAnchors = [
    /(?:Passed\s+Appetizers?|Presented\s+Appetizers?|Buffet|Dessert|Small\s+Plate|Grande\s+Display)/i,
    /(?:Description|Quantity)\s+(?:Description|Rate|Amount)/i,
    /(?:Taking place|Retreat|Event\s+Begins?|Event\s+Details?)/i,
  ];
  let descStart = -1;
  for (const re of descAnchors) {
    const m = raw.match(re);
    if (m && m.index != null) {
      descStart = m.index;
      break;
    }
  }
  if (descStart < 0) descStart = raw.search(/(?:Description|Event)/i);

  if (descStart >= 0) {
    // Take a larger block — stop at Total, Sales Tax, Payment, or Balance
    const stopMatch = raw.slice(descStart).match(/(?:Total|Sales\s+Tax|Payment|Balance\s+Due|Please\s+make\s+checks)/i);
    const endOffset = stopMatch ? stopMatch.index! + descStart : descStart + 3500;
    const descBlock = raw.slice(descStart, endOffset);
    const dietary = descBlock.match(/\*([^*]+)\*/g);
    const notes: string[] = [];
    if (result.invoiceNumber) notes.push(`Invoice #${result.invoiceNumber}`);
    if (dietary?.length) notes.push(...dietary.map((s) => s.replace(/\*/g, "").trim()));
    const timeline = descBlock.match(/(?:Breakfast|Lunch|Dinner|served)\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))/gi);
    if (timeline?.length) notes.push(...timeline);
    if (notes.length) result.notes = notes.join("\n");
    // Food items parsing disabled — user will add menu items manually in BEO Intake
  }

  if (Object.keys(result).length === 0) return null;
  return result;
}

/** Minimal fallback for regular PDFs that don't match FoodWerx format. Extracts date, email, phone from any text. */
function parseInvoiceTextMinimal(text: string): ParsedInvoice | null {
  const raw = text.trim();
  if (!raw || raw.length < 10) return null;
  const result: ParsedInvoice = {};
  const dateMatch = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    const [, m, d, y] = dateMatch;
    if (m && d && y) result.eventDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  const allEmails = [...raw.matchAll(/([\w._%+-]+@[\w.-]+\.\w+)/g)];
  const clientEmail = allEmails.map((m) => m[1].trim()).find((e) => !isVendorEmail(e));
  if (clientEmail) result.clientEmail = clientEmail;
  const phoneMatch = raw.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
  if (phoneMatch) result.clientPhone = phoneMatch[1].replace(/\s+/g, " ").trim();
  if (Object.keys(result).length === 0) return null;
  return result;
}

export async function parseInvoiceText(text: string): Promise<ParsedInvoice | null> {
  // Try rule-based first (works without API key)
  const ruleBased = parseInvoiceTextRuleBased(text);
  const hasEnough = ruleBased && (
    ruleBased.clientEmail || ruleBased.clientOrganization || ruleBased.venueName || ruleBased.eventDate ||
    ruleBased.clientFirstName || ruleBased.clientPhone || ruleBased.clientLastName || ruleBased.guestCount
  );
  if (hasEnough) return ruleBased;

  // Minimal fallback for regular PDFs: extract date, email, phone from any text (no menu items)
  const minimal = parseInvoiceTextMinimal(text);
  if (minimal) return minimal;

  // Fall back to OpenAI if available
  if (!OPENAI_API_KEY || OPENAI_API_KEY === "sk-your-openai-key-here") {
    return ruleBased;
  }

  const prompt = `
You are helping a catering company populate a BEO intake form from a PDF invoice.

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
- Respond with JSON ONLY, no explanation.

INVOICE TEXT:
"""${text}"""`;

  try {
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
  } catch (err) {
    console.warn("[invoiceParser] OpenAI failed, using rule-based result:", err);
    return ruleBased;
  }
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

