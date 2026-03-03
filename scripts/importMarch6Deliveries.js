#!/usr/bin/env node

/**
 * Import March 6 delivery BEO Excel files into Airtable.
 *
 * Usage:
 *   node scripts/importMarch6Deliveries.js
 *   npm run import-march6
 *
 * Reads from: beo templates/deliveries/march 6/
 * Requires in .env: VITE_AIRTABLE_API_KEY, VITE_AIRTABLE_BASE_ID, VITE_AIRTABLE_EVENTS_TABLE
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const MARCH6_DIR = path.join(PROJECT_ROOT, "beo templates", "deliveries", "march 6");

dotenv.config({ path: path.join(PROJECT_ROOT, ".env") });

const API_KEY = process.env.VITE_AIRTABLE_API_KEY?.trim();
const BASE_ID = process.env.VITE_AIRTABLE_BASE_ID?.trim();
const EVENTS_TABLE = process.env.VITE_AIRTABLE_EVENTS_TABLE?.trim();

// Field IDs from src/services/airtable/events.ts
const FIELD_IDS = {
  EVENT_DATE: "fldFYaE7hI27R3PsX",
  EVENT_TYPE: "fldtqnvD7M8xbc0Xb",
  GUEST_COUNT: "fldjgqDUxVxaJ7Y9V",
  CLIENT_FIRST_NAME: "fldFAspB1ds9Yn0Kl",
  CLIENT_LAST_NAME: "fldeciZmsIY3c2T1v",
  BUSINESS_NAME: "fldm6SwoGe6pS7Uam",
  CLIENT_EMAIL: "fldT5lcdCL5ndh84D",
  CLIENT_PHONE: "fldnw1VGIi3oXM4g3",
  CLIENT_STREET: "fldUyi7xzG60H1ML4",
  CLIENT_CITY: "fldoYWmGny8pkCKJQ",
  CLIENT_STATE: "fldffsjG72MWzrCjl",
  CLIENT_ZIP: "fldBuaBTjAkwmtd0J",
  PRIMARY_CONTACT_NAME: "fldmsFPsl2gAtiSCD",
  VENUE: "fldtCOxi4Axjfjt0V",
  VENUE_ADDRESS: "fldJsajSl1l6marzw",
  VENUE_CITY: "fldNToCnV799eggiD",
  VENUE_STATE: "fldxCz5cPLwCetb0C",
  EVENT_START_TIME: "fldDwDE87M9kFAIDn",
  BEO_TIMELINE: "fld6Z6xw9ciygqyff",
  SPECIAL_NOTES: "fldlTlYgvPTIUzzMn",
};

function excelDateToIso(serial) {
  if (typeof serial !== "number" || isNaN(serial) || serial < 1) return undefined;
  const ms = (serial - 25569) * 86400 * 1000;
  const d = new Date(ms);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function parseDeliveryTime(raw) {
  if (!raw || typeof raw !== "string") return undefined;
  const s = raw.trim();
  const rangeMatch = s.match(/(\d{1,2}):?(\d{2})?\s*[-–]\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
  if (rangeMatch) {
    const h = parseInt(rangeMatch[1], 10);
    const m = parseInt(rangeMatch[2] || "0", 10);
    const isPM = /pm/i.test(rangeMatch[5] ?? "") || (h < 8 && !/am/i.test(rangeMatch[5] ?? ""));
    const hour24 = isPM && h < 12 ? h + 12 : !isPM && h === 12 ? 0 : h;
    return `${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
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

function parseCityStateZip(citySt) {
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

function buildLabelMap(data) {
  const map = new Map();
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

function isVendorOrPlaceholderName(name) {
  const lower = (name || "").toLowerCase().trim();
  if (!lower || lower.length < 2) return true;
  const vendorWords = ["info", "infor", "information", "contact", "bill", "sales", "support", "admin", "foodwerx", "hospitality"];
  return vendorWords.includes(lower) || vendorWords.some((w) => lower.startsWith(w + " ") || lower === w);
}

function timeToSeconds(hhmm) {
  if (!hhmm || typeof hhmm !== "string") return undefined;
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return undefined;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  return h * 3600 + min * 60;
}

function secondsTo12Hour(seconds) {
  if (seconds == null || isNaN(seconds)) return "—";
  let h = Math.floor(seconds / 3600);
  let m = Math.floor((seconds % 3600) / 60);
  if (h >= 24) h = h % 24;
  if (m >= 60) m = 59;
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function parseExcelFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const workbook = XLSX.read(buf, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return null;

  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const map = buildLabelMap(data);

  const get = (key) => map.get(key.toUpperCase())?.trim() || undefined;

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

  const result = {};

  if (clientRaw) {
    const paren = clientRaw.indexOf("(");
    const main = paren >= 0 ? clientRaw.slice(0, paren).trim() : clientRaw;
    const parts = main.split(/\s+/);
    if (parts.length >= 2) {
      const fn = parts[0];
      const ln = parts.slice(1).join(" ");
      if (!isVendorOrPlaceholderName(fn)) result.clientFirstName = fn;
      if (!isVendorOrPlaceholderName(ln)) result.clientLastName = ln;
    } else if (!isVendorOrPlaceholderName(main)) {
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

  if (clientRaw) result.venueName = clientRaw;

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

  const notesParts = [];
  if (deliveryNotes) notesParts.push(`Delivery: ${deliveryNotes}`);
  if (specialNotes) notesParts.push(specialNotes);
  if (orderNum) result.invoiceNumber = orderNum;
  if (notesParts.length > 0) result.notes = notesParts.join("\n");

  result.eventType = "Delivery";

  return result;
}

function parsedToFields(parsed, eventDate) {
  const fields = {};
  if (parsed.eventDate) fields[FIELD_IDS.EVENT_DATE] = parsed.eventDate;
  if (parsed.guestCount != null) fields[FIELD_IDS.GUEST_COUNT] = parsed.guestCount;
  if (parsed.clientFirstName && !isVendorOrPlaceholderName(parsed.clientFirstName))
    fields[FIELD_IDS.CLIENT_FIRST_NAME] = parsed.clientFirstName;
  if (parsed.clientLastName && !isVendorOrPlaceholderName(parsed.clientLastName))
    fields[FIELD_IDS.CLIENT_LAST_NAME] = parsed.clientLastName;
  if (parsed.clientOrganization) fields[FIELD_IDS.BUSINESS_NAME] = parsed.clientOrganization;
  if (parsed.clientEmail) fields[FIELD_IDS.CLIENT_EMAIL] = parsed.clientEmail;
  if (parsed.clientPhone) fields[FIELD_IDS.CLIENT_PHONE] = parsed.clientPhone;
  if (parsed.clientStreet) fields[FIELD_IDS.CLIENT_STREET] = parsed.clientStreet;
  if (parsed.clientCity) fields[FIELD_IDS.CLIENT_CITY] = parsed.clientCity;
  if (parsed.clientState) fields[FIELD_IDS.CLIENT_STATE] = parsed.clientState;
  if (parsed.clientZip) fields[FIELD_IDS.CLIENT_ZIP] = parsed.clientZip;
  if (parsed.primaryContactName) fields[FIELD_IDS.PRIMARY_CONTACT_NAME] = parsed.primaryContactName;
  if (parsed.venueName) fields[FIELD_IDS.VENUE] = parsed.venueName;
  if (parsed.venueAddress) fields[FIELD_IDS.VENUE_ADDRESS] = parsed.venueAddress;
  if (parsed.venueCity) fields[FIELD_IDS.VENUE_CITY] = parsed.venueCity;
  if (parsed.venueState) fields[FIELD_IDS.VENUE_STATE] = parsed.venueState;

  const dateStr = parsed.eventDate || eventDate || "";
  if (parsed.eventStartTime) {
    const sec = timeToSeconds(parsed.eventStartTime);
    if (sec != null) fields[FIELD_IDS.EVENT_START_TIME] = sec;
  }
  if (parsed.staffArrivalTime) {
    const sec = timeToSeconds(parsed.staffArrivalTime);
    if (sec != null) fields[FIELD_IDS.EVENT_START_TIME] = sec;
  }

  const timelineParts = [];
  if (parsed.staffArrivalTime)
    timelineParts.push(`${secondsTo12Hour(timeToSeconds(parsed.staffArrivalTime))} – Staff arrival`);
  if (parsed.eventStartTime)
    timelineParts.push(`${secondsTo12Hour(timeToSeconds(parsed.eventStartTime))} – Event begins`);
  if (timelineParts.length > 0) fields[FIELD_IDS.BEO_TIMELINE] = timelineParts.join("\n");

  if (parsed.notes?.trim()) fields[FIELD_IDS.SPECIAL_NOTES] = parsed.notes.trim();

  fields[FIELD_IDS.EVENT_TYPE] = "Delivery";

  // Remove undefined/null to avoid Airtable validation errors
  const cleaned = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null && v !== "") cleaned[k] = v;
  }
  return cleaned;
}

async function createEvent(fields) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${EVENTS_TABLE}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      records: [{ fields }],
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Airtable error: ${res.status}`);
  }
  return data.records?.[0];
}

async function main() {
  if (!API_KEY || !BASE_ID || !EVENTS_TABLE) {
    console.error("❌ Missing env: VITE_AIRTABLE_API_KEY, VITE_AIRTABLE_BASE_ID, VITE_AIRTABLE_EVENTS_TABLE");
    process.exit(1);
  }

  if (!fs.existsSync(MARCH6_DIR)) {
    console.error(`❌ Directory not found: ${MARCH6_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(MARCH6_DIR).filter((f) => /\.xlsx?$/i.test(f));
  if (files.length === 0) {
    console.error(`❌ No Excel files in ${MARCH6_DIR}`);
    process.exit(1);
  }

  console.log(`📂 Found ${files.length} file(s) in March 6 deliveries\n`);

  let created = 0;
  let failed = 0;

  for (const file of files.sort()) {
    const filePath = path.join(MARCH6_DIR, file);
    const name = path.basename(file, path.extname(file));
    try {
      const parsed = parseExcelFile(filePath);
      if (!parsed || (!parsed.clientFirstName && !parsed.clientLastName && !parsed.clientOrganization && !parsed.venueName)) {
        console.warn(`⚠️  ${file}: Could not extract enough data, skipping`);
        failed++;
        continue;
      }

      const fields = parsedToFields(parsed);
      const record = await createEvent(fields);
      const eventId = record?.id;
      const eventName = record?.fields?.["fldZuHc9D29Wcj60h"] || name;

      console.log(`✅ ${file} → ${eventName} (${eventId})`);
      created++;
    } catch (err) {
      console.error(`❌ ${file}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Done: ${created} created, ${failed} failed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
