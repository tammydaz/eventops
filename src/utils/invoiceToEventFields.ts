import { FIELD_IDS } from "../services/airtable/events";
import { timeStringToSeconds } from "./timeHelpers";
import type { ParsedInvoice } from "../services/invoiceParser";

/** Map parsed invoice to Airtable event fields */
export function parsedInvoiceToFields(parsed: ParsedInvoice): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  if (parsed.eventDate) fields[FIELD_IDS.EVENT_DATE] = parsed.eventDate;
  if (parsed.guestCount != null) fields[FIELD_IDS.GUEST_COUNT] = parsed.guestCount;
  if (parsed.clientFirstName) fields[FIELD_IDS.CLIENT_FIRST_NAME] = parsed.clientFirstName;
  if (parsed.clientLastName) fields[FIELD_IDS.CLIENT_LAST_NAME] = parsed.clientLastName;
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

  // Event times: convert "9:00" / "9:30" to seconds since midnight
  if (parsed.eventStartTime) {
    const sec = timeStringToSeconds(parsed.eventStartTime);
    if (sec != null) fields[FIELD_IDS.EVENT_START_TIME] = sec;
  }
  if (parsed.eventEndTime) {
    const sec = timeStringToSeconds(parsed.eventEndTime);
    if (sec != null) fields[FIELD_IDS.EVENT_END_TIME] = sec;
  }

  const notesParts = [parsed.notes, parsed.menuText];
  if (parsed.invoiceNumber) notesParts.unshift(`Invoice #${parsed.invoiceNumber}`);
  const notes = notesParts.filter(Boolean).join("\n\n");
  if (notes) fields[FIELD_IDS.SPECIAL_NOTES] = notes;

  return fields;
}
