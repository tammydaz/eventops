# Airtable Schema Manager - Setup Complete ✅

## What's Been Created

### Script Location
`/scripts/updateAirtableSchema.js`

### Configuration
- ✅ Connected to Base: `appMLgdc3QpV2pwoz`
- ✅ Events Table: `tblYfaWh67Ag4ydXq` (399 fields)
- ✅ Using API Key from `.env`

### Connection Test Results
```
📊 Base contains 32 tables
📋 Events table has 399 fields
✅ Connection successful
```

## Available Commands

### Read Schema
View all tables and Events table fields:
```bash
npm run schema read
```

### Add New Field
Add a field to the Events table:
```bash
npm run schema add "Field Name" "fieldType"
```

Example:
```bash
npm run schema add "Customer Satisfaction" "number"
npm run schema add "Internal Notes" "multilineText"
npm run schema add "Follow Up Date" "date"
```

## Supported Field Types

- `singleLineText` - Short text
- `multilineText` - Long text (paragraph)
- `richText` - Formatted text
- `number` - Numeric value
- `percent` - Percentage
- `currency` - Money ($)
- `singleSelect` - Dropdown (single choice)
- `multipleSelects` - Dropdown (multiple choices)
- `date` - Date only
- `dateTime` - Date + time
- `checkbox` - True/false
- `url` - Web link
- `email` - Email address
- `phoneNumber` - Phone number
- `multipleAttachments` - Files/images

## Safety Features

✅ **Read-only by default** - `readSchema()` never modifies data
✅ **Duplicate check** - Won't create fields that already exist
✅ **No deletions** - Script cannot delete or rename existing fields
✅ **Validation** - Checks if table exists before operations
✅ **Error handling** - Clear error messages with suggestions

## Examples

### View current schema
```bash
npm run schema read
```

### Add a new text field
```bash
npm run schema add "Special Instructions" "multilineText"
```

### Add a checkbox field
```bash
npm run schema add "Requires Setup Call" "checkbox"
```

### Add a date field
```bash
npm run schema add "Contract Due Date" "date"
```

## Integration with QuickBooks

When you're ready to add QuickBooks invoice fields:

```bash
npm run schema add "QuickBooks Invoice ID" "singleLineText"
npm run schema add "QuickBooks Customer ID" "singleLineText"
npm run schema add "Invoice Generated Date" "dateTime"
npm run schema add "Invoice Total" "currency"
npm run schema add "Payment Received" "checkbox"
```

Then the QuickBooks integration service (`src/services/quickbooks.ts`) can automatically populate these fields when creating events from invoices.

## Notes

- The script uses Airtable Metadata API (v0/meta)
- Requires scopes: `schema.bases:read` and `schema.bases:write`
- Your API key already has the necessary permissions
- Changes are immediate and permanent
- Always test with `read` before making changes

## Next Steps

1. ✅ Schema manager is ready
2. Run `npm run schema read` anytime to view current schema
3. Add fields as needed with `npm run schema add`
4. Integrate with QuickBooks when ready
