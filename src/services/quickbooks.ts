/**
 * QuickBooks Integration Service
 * 
 * Maps QuickBooks invoice data to Airtable event records
 * Based on invoice structure from Invoice #86308
 */

import { createEvent, FIELD_IDS } from "./airtable/events";

export interface QuickBooksInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  billTo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone?: string;
    email?: string;
  };
  venue?: {
    name: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  serviceCharge: number;
  serviceChargePercent: number;
  salesTax: number;
  salesTaxPercent: number;
  total: number;
  deposit?: number;
}

/**
 * Parse QuickBooks invoice and extract event details
 */
export function parseQuickBooksInvoice(invoiceData: QuickBooksInvoice): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  // Client Information
  fields[FIELD_IDS.CLIENT_FIRST_NAME] = extractFirstName(invoiceData.billTo.name);
  fields[FIELD_IDS.CLIENT_LAST_NAME] = extractLastName(invoiceData.billTo.name);
  fields[FIELD_IDS.CLIENT_PHONE] = invoiceData.billTo.phone || "";
  fields[FIELD_IDS.CLIENT_EMAIL] = invoiceData.billTo.email || "";

  // Event Date (from invoice date - adjust as needed)
  fields[FIELD_IDS.EVENT_DATE] = invoiceData.invoiceDate;

  // Guest Count (extracted from package line items)
  const packageItem = invoiceData.items.find(item => 
    item.description.toLowerCase().includes('package')
  );
  if (packageItem) {
    fields[FIELD_IDS.GUEST_COUNT] = packageItem.quantity;
  }

  // Venue Information
  if (invoiceData.venue) {
    fields[FIELD_IDS.VENUE] = invoiceData.venue.name;
    fields[FIELD_IDS.VENUE_ADDRESS] = invoiceData.venue.address || "";
  }

  // Extract venue from description if present
  const venueMatch = invoiceData.items[0]?.description.match(/Taking place at (.+)/i);
  if (venueMatch) {
    fields[FIELD_IDS.VENUE] = venueMatch[1];
  }

  // Menu Items (extract from line items)
  const menuItems: string[] = [];
  const beverageItems: string[] = [];
  const rentalItems: string[] = [];
  
  invoiceData.items.forEach(item => {
    const desc = item.description.toLowerCase();
    
    // Categorize items
    if (desc.includes('bar') || desc.includes('bartender') || desc.includes('soda') || desc.includes('juice')) {
      beverageItems.push(item.description);
    } else if (desc.includes('linen') || desc.includes('rental') || desc.includes('ceremony fee')) {
      rentalItems.push(item.description);
    } else if (desc.includes('package') || desc.includes('entree') || desc.includes('dessert') || desc.includes('salad')) {
      menuItems.push(item.description);
    }
  });

  fields[FIELD_IDS.MENU_ITEMS] = menuItems.join('\n');
  fields[FIELD_IDS.BEVERAGES] = beverageItems.join('\n');
  fields[FIELD_IDS.RENTALS_NEEDED] = rentalItems.length > 0;

  // Staffing (extract from invoice items)
  const staffingItems = invoiceData.items.filter(item =>
    item.description.toLowerCase().includes('bartender') ||
    item.description.toLowerCase().includes('crew') ||
    item.description.toLowerCase().includes('roxanne')
  );
  
  let totalStaff = 0;
  let bartenders = 0;
  let utility = 0;
  
  staffingItems.forEach(item => {
    const desc = item.description.toLowerCase();
    if (desc.includes('bartender')) {
      bartenders += item.quantity;
      totalStaff += item.quantity;
    } else if (desc.includes('crew') || desc.includes('utility')) {
      utility += item.quantity;
      totalStaff += item.quantity;
    } else {
      totalStaff += item.quantity;
    }
  });

  fields[FIELD_IDS.BARTENDERS] = bartenders;
  fields[FIELD_IDS.UTILITY] = utility;
  fields[FIELD_IDS.STAFF] = totalStaff;

  // Financial Information
  // Store invoice details in notes
  const invoiceNotes = `
QuickBooks Invoice #${invoiceData.invoiceNumber}
Invoice Date: ${invoiceData.invoiceDate}

Subtotal: $${invoiceData.subtotal.toLocaleString()}
Service Charge (${invoiceData.serviceChargePercent}%): $${invoiceData.serviceCharge.toLocaleString()}
Sales Tax (${invoiceData.salesTaxPercent}%): $${invoiceData.salesTax.toLocaleString()}
Total: $${invoiceData.total.toLocaleString()}
${invoiceData.deposit ? `Deposit: $${invoiceData.deposit.toLocaleString()}` : ''}
  `.trim();

  fields[FIELD_IDS.SPECIAL_NOTES] = invoiceNotes;

  // Set initial status
  fields[FIELD_IDS.STATUS] = { name: "Invoice Received" };
  fields[FIELD_IDS.BOOKING_STATUS] = { name: "Confirmed" };

  return fields;
}

/**
 * Create event from QuickBooks invoice
 */
export async function createEventFromQuickBooksInvoice(invoiceData: QuickBooksInvoice) {
  const fields = parseQuickBooksInvoice(invoiceData);
  // Event Name is computed in Airtable (formula) — do not set it
  const result = await createEvent(fields);
  
  return result;
}

/**
 * Helper: Extract first name from full name
 */
function extractFirstName(fullName: string): string {
  const parts = fullName.split(/\s+/);
  return parts[0] || fullName;
}

/**
 * Helper: Extract last name from full name
 */
function extractLastName(fullName: string): string {
  const parts = fullName.split(/\s+/);
  if (parts.length > 1) {
    return parts.slice(1).join(' ');
  }
  return '';
}

/**
 * QuickBooks Webhook Handler
 * Call this endpoint when a new invoice is created in QuickBooks
 */
export async function handleQuickBooksWebhook(webhookPayload: any) {
  // Transform QuickBooks webhook payload to our invoice format
  const invoice: QuickBooksInvoice = {
    invoiceNumber: webhookPayload.DocNumber,
    invoiceDate: webhookPayload.TxnDate,
    billTo: {
      name: webhookPayload.CustomerRef?.name || '',
      address: webhookPayload.BillAddr?.Line1 || '',
      city: webhookPayload.BillAddr?.City || '',
      state: webhookPayload.BillAddr?.CountrySubDivisionCode || '',
      zip: webhookPayload.BillAddr?.PostalCode || '',
      phone: webhookPayload.BillEmail?.Address || '',
      email: webhookPayload.BillEmail?.Address || '',
    },
    items: (webhookPayload.Line || []).map((line: any) => ({
      description: line.Description || '',
      quantity: line.SalesItemLineDetail?.Qty || 0,
      rate: line.SalesItemLineDetail?.UnitPrice || 0,
      amount: line.Amount || 0,
    })),
    subtotal: webhookPayload.TxnTaxDetail?.TotalTax || 0,
    serviceCharge: 0, // Extract from line items if needed
    serviceChargePercent: 20,
    salesTax: webhookPayload.TxnTaxDetail?.TotalTax || 0,
    salesTaxPercent: 6.625,
    total: webhookPayload.TotalAmt || 0,
    deposit: 0,
  };

  // Create event from invoice
  const result = await createEventFromQuickBooksInvoice(invoice);
  
  return result;
}
