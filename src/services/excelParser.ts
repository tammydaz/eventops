/**
 * Parse delivery BEO Excel (.xlsx) files into ParsedInvoice format.
 * Matches FoodWerx BEO template: CLIENT, CONTACT, PHONE, ADDRESS, CITY ST,
 * EVENT DATE, GUESTS, DELIVERY TIME, DELIVERY NOTES, etc.
 */
import * as XLSX from "xlsx";
import type { ParsedInvoice } from "./invoiceParser";

/** Convert Excel serial date (days since 1900-01-01) to YYYY-MM-DD */
function excelDateToIso(serial: number): string | undefined {
  if (typeof serial !== "number" || isNaN(serial) || serial < 1) return undefined;
  // Excel epoch: 25569 = days from 1900-01-01 to 1970-01-01
  const ms = (serial - 25569) * 86400 * 1000;
  const d = new Date(ms);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

/** Parse "4:30-5PM DELIVERY" or "10:00 AM" to HH:mm 24h */
function parseDeliveryTime(raw: string): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const s = raw.trim();
  // "4:30-5PM" or "4:30-5 PM" -> take first time 4:30, assume PM if no AM
  const rangeMatch = s.match(/(\d{1,2}):?(\d{2})?\s*[-–]\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
  if (rangeMatch) {
    const h = parseInt(rangeMatch[1], 10);
    const m = parseInt(rangeMatch[2] || "0", 10);
    const isPM = /pm/i.test(rangeMatch[5] ?? "") || (h < 8 && !/am/i.test(rangeMatch[5] ?? ""));
    const hour24 = isPM && h < 12 ? h + 12 : !isPM && h === 12 ? 0 : h;
    return `${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  // "10:00 AM" or "10:00AM"
  const simpleMatch = s.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
  if (simpleMatch) {
    let h = parseInt(simpleMatch[1], 10);
    const m = parseInt(simpleMatch[2] || "0", 10);
    const ampm = (simpleMatch[3] || "").toUpperCase();
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  return undefined;
}

/** Parse "Mt. Laurel, NJ 08054" into city, state, zip */
function parseCityStateZip(citySt: string): { city?: string; state?: string; zip?: string } {
  if (!citySt || typeof citySt !== "string") return {};
  const match = citySt.trim().match(/^(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
  if (match) {
    return {
      city: match[1].trim(),
      state: match[2].toUpperCase(),
      zip: match[3].trim(),
    };
  }
  return {};
}

/** Build label->value map from BEO Excel rows (labels in col 0 and 8, values in col 1 and 9) */
function buildLabelMap(data: unknown[][]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of data) {
    if (!Array.isArray(row)) continue;
    const a = String(row[0] ?? "").trim().toUpperCase();
    const b = String(row[1] ?? "").trim();
    const h = String(row[8] ?? "").trim().toUpperCase();
    const i = String(row[9] ?? "").trim();
    if (a && b) map.set(a, b);
    if (h && i) map.set(h, i);
  }
  return map;
}

/**
 * Parse a delivery BEO Excel file into ParsedInvoice format.
 * Sets eventType: "Delivery" for delivery events.
 */
export async function parseDeliveryExcel(file: File): Promise<ParsedInvoice | null> {
  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return null;

  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
  const map = buildLabelMap(data);

  const get = (key: string) => map.get(key.toUpperCase())?.trim() || undefined;

  const clientRaw = get("CLIENT");
  const contact = get("CONTACT");
  const phone = get("PHONE");
  const address = get("ADDRESS");
  const citySt = get("CITY, ST") || get("CITY ST");
  const eventDateRaw = get("EVENT DATE");
  const guestsRaw = get("GUESTS");
  const deliveryTimeRaw = get("DELIVERY TIME");
  const deliveryNotes = get("DELIVERY NOTES");
  const specialNotes = get("SPECIAL NOTES");
  const orderNum = get("HOUSE ORDER NUMBER");

  const result: ParsedInvoice & { eventType?: string } = {};

  // Client name: "Stephano Slack (Gold Gerstein)" -> first/last or org
  if (clientRaw) {
    const paren = clientRaw.indexOf("(");
    const main = paren >= 0 ? clientRaw.slice(0, paren).trim() : clientRaw;
    const parts = main.split(/\s+/);
    if (parts.length >= 2) {
      result.clientFirstName = parts[0];
      result.clientLastName = parts.slice(1).join(" ");
    } else {
      result.clientOrganization = main;
    }
  }

  result.primaryContactName = contact;
  result.clientPhone = phone;
  result.clientStreet = address;

  const { city, state, zip } = parseCityStateZip(citySt ?? "");
  if (city) result.clientCity = city;
  if (state) result.clientState = state;
  if (zip) result.clientZip = zip;

  // Venue/delivery location: use client org or address for delivery
  if (clientRaw) result.venueName = clientRaw;

  // Event date: Excel serial or YYYY-MM-DD
  if (eventDateRaw) {
    const num = Number(eventDateRaw);
    if (!isNaN(num) && num > 1000) {
      result.eventDate = excelDateToIso(num);
    } else if (/^\d{4}-\d{2}-\d{2}/.test(eventDateRaw)) {
      result.eventDate = eventDateRaw.slice(0, 10);
    }
  }

  const guests = parseInt(guestsRaw ?? "", 10);
  if (!isNaN(guests) && guests > 0) result.guestCount = guests;

  const deliveryTime = parseDeliveryTime(deliveryTimeRaw ?? "");
  if (deliveryTime) {
    result.eventStartTime = deliveryTime;
    result.staffArrivalTime = deliveryTime;
  }

  const notesParts: string[] = [];
  if (deliveryNotes) notesParts.push(`Delivery: ${deliveryNotes}`);
  if (specialNotes) notesParts.push(specialNotes);
  if (orderNum) result.invoiceNumber = orderNum;
  if (notesParts.length > 0) result.notes = notesParts.join("\n");

  result.eventType = "Delivery";

  return result as ParsedInvoice;
}
