# QuickBooks Integration Guide

## Overview

This integration automatically creates events in your EventOps system when invoices are generated in QuickBooks.

## Features

✅ **Automatic Event Creation** - New QuickBooks invoices automatically create events in Airtable
✅ **Data Mapping** - Invoice data is intelligently mapped to event fields:
- Client name → First/Last Name
- Invoice date → Event date
- Guest count → Extracted from package quantity
- Menu items → Parsed from line items
- Beverages → Extracted from bar/drink items
- Rentals → Extracted from linen/rental items
- Staffing → Parsed from bartender/crew items
- Venue → Extracted from description or venue field
- Financial summary → Stored in notes

## Invoice Data Mapping

Based on your invoice structure (Invoice #86308):

| QuickBooks Field | Airtable Field | Notes |
|-----------------|----------------|-------|
| Bill To Name | Client First/Last Name | Auto-split |
| Bill To Email | Client Email | Direct mapping |
| Bill To Phone | Client Phone | Direct mapping |
| Invoice Date | Event Date | Can be adjusted |
| Package Quantity | Guest Count | From "Flirty Package 166" |
| "Taking place at..." | Venue | Parsed from description |
| Menu items | Menu Items | All food line items |
| Bar Package | Beverages | Bar-related items |
| Linen Rental | Rentals Needed | Rental items |
| Bartender qty | Bartenders | Staff count |
| Utility Crew | Utility | Staff count |
| Subtotal/Tax/Total | Special Notes | Financial summary |

## Setup Instructions

### Step 1: QuickBooks App Setup

1. Go to [QuickBooks Developer Portal](https://developer.intuit.com/)
2. Create a new app
3. Enable **QuickBooks Online API**
4. Set up OAuth 2.0 credentials
5. Add redirect URI: `https://yourdomain.com/api/quickbooks/callback`

### Step 2: Webhook Configuration

1. In QuickBooks Developer Portal, go to **Webhooks**
2. Add webhook endpoint: `https://yourdomain.com/api/quickbooks/webhook`
3. Subscribe to event: `Invoice.Create`
4. Save webhook verifier token

### Step 3: Environment Variables

Add to your `.env` file:

```env
# QuickBooks OAuth
QUICKBOOKS_CLIENT_ID=your_client_id
QUICKBOOKS_CLIENT_SECRET=your_client_secret
QUICKBOOKS_REDIRECT_URI=https://yourdomain.com/api/quickbooks/callback

# QuickBooks Webhook
QUICKBOOKS_WEBHOOK_VERIFIER=your_webhook_verifier_token

# QuickBooks API
QUICKBOOKS_REALM_ID=your_company_id
QUICKBOOKS_ENVIRONMENT=sandbox # or 'production'
```

### Step 4: Backend API Endpoints

Create these API routes (example for Node.js/Express):

```javascript
// /api/quickbooks/webhook
app.post('/api/quickbooks/webhook', async (req, res) => {
  const { handleQuickBooksWebhook } = require('./services/quickbooks');
  
  try {
    const result = await handleQuickBooksWebhook(req.body);
    res.json({ success: true, eventId: result.id });
  } catch (error) {
    console.error('QuickBooks webhook error:', error);
    res.status(500).json({ error: 'Failed to process invoice' });
  }
});

// /api/quickbooks/callback (OAuth)
app.get('/api/quickbooks/callback', async (req, res) => {
  // Handle OAuth callback
  const authCode = req.query.code;
  // Exchange code for tokens
  // Store tokens securely
  res.redirect('/settings?quickbooks=connected');
});
```

### Step 5: Test the Integration

1. Create a test invoice in QuickBooks Sandbox
2. Fill in:
   - Customer name
   - Line items (menu items, packages, rentals)
   - Guest count in package quantity
   - Venue in description or custom field
3. Save the invoice
4. Check your EventOps Watchtower - new event should appear!

## Manual Import

You can also manually import existing invoices:

```typescript
import { createEventFromQuickBooksInvoice } from './services/quickbooks';

// Example invoice data
const invoice = {
  invoiceNumber: "86308",
  invoiceDate: "2026-02-06",
  billTo: {
    name: "Charles Elsea & Devin Simpkins",
    address: "704 Meadowview Drive",
    city: "Cinnaminson",
    state: "NJ",
    zip: "08077",
    phone: "973-513-3134",
    email: "elseac23@gmail.com"
  },
  venue: {
    name: "Camden County Boathouse"
  },
  items: [
    {
      description: "Flirty Package",
      quantity: 166,
      rate: 105.00,
      amount: 17430.00
    },
    // ... more items
  ],
  subtotal: 21795.00,
  serviceCharge: 4359.00,
  serviceChargePercent: 20,
  salesTax: 1732.70,
  salesTaxPercent: 6.625,
  total: 27886.70,
  deposit: 3500.00
};

const result = await createEventFromQuickBooksInvoice(invoice);
console.log('Event created:', result.id);
```

## View Invoices in Watchtower

Once connected, you can:

1. **View Invoices** - Click "View Invoice (QuickBooks)" on any event card's hover panel
2. **Check Payment Status** - See if invoice is paid/unpaid
3. **Send Reminders** - Email payment reminders directly
4. **Generate Reports** - Export financial reports by date range

## Troubleshooting

### Invoice not creating event
- Check webhook is receiving data (check server logs)
- Verify Airtable API token is valid
- Check field mappings in `quickbooks.ts`

### Wrong data in fields
- Adjust parsing logic in `parseQuickBooksInvoice()`
- Check invoice structure matches your template
- Update field extractors for your specific format

### Duplicate events
- Add invoice number check before creating
- Store invoice IDs in Airtable to prevent duplicates

## Next Steps

1. ✅ Connect QuickBooks OAuth
2. ✅ Set up webhook endpoint
3. ✅ Test with sandbox invoice
4. ✅ Customize field mappings
5. ✅ Go live with production credentials

## Support

For issues or questions:
- Check QuickBooks API docs: https://developer.intuit.com/docs
- Review Airtable API: https://airtable.com/api
- Contact: info@foodwerx.com
