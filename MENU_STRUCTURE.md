## Airtable Menu Items Table - Field Audit

| Field Name | Field Type | Select Options | Special Notes |
|------------|------------|----------------|---------------|
| Description Name/Formula | Formula | — | READ ONLY (Primary field) |
| Item Name | Single line text | — | |
| Category | Multiple select | Presented App/metal, Presented App/china, Passed App, Buffet Metal, Buffet China, Deli/Sandwhiches, Deli/Breads, Dessert/Metal, Dessert/China, Stations, Category, Appetizer, Entrée, Side, Dessert, Beverage, Display, Bar / Beverage Component, Buffet Item, Presented App, Buffet, Description | |
| Photo | Attachment | — | |
| Sauces | Long text | — | |
| Price | Number (Currency $) | — | |
| BEOs | Linked record | — | Links to BEOs table |
| Last Served Date | Date (Rollup) | — | READ ONLY |
| Description/Client Facing | Long text | — | |
| Menu Item Allergen/Restriction Tags (AI) | AI text | — | On-demand AI generation |
| Client Intake (Passed Appetizers) | Linked record | — | Links to Client Intake table |
| Client Intake (Buffet Items) | Linked record | — | Links to Client Intake table |
| Client Intake (Dessert Items) | Linked record | — | Links to Client Intake table |
| Service Vessel | Single select | Plate, Bowl, Cup, Glass, Tray, Skewer, Spoon, Mini Plate, Other, CCBH 7050 N. Park Dr. | |
| Portion Yield | Number (Integer) | — | |
| BEO Generator | Single select | Standard, Custom, N/A | |
| Kitchen Tasks | Long text | — | |
| Pack-Outs | Linked record | — | Links to Pack-Outs table |
| Client Intake (Appetizers) | Linked record | — | Links to Client Intake table |
| Client Intake (Main Course) | Linked record | — | Links to Client Intake table |
| Client Intake (Sides) | Linked record | — | Links to Client Intake table |
| Client Intake (Desserts) | Linked record | — | Links to Client Intake table |
| Equipment Logic | Single line text | — | |
| Pack-Out Generator | Linked record | — | Links to Pack-Out Generator table |
| Pack-Out Generator 2 | Single line text | — | |
| Events (Passed Apps – Metal) | Single line text | — | |
| Events (Presented Apps – China) | Single line text | — | |
| Events (Buffet – Metal (Pan Needed)) | Single line text | — | |
| Events (Buffet – China (Cold / Ready-To-Place)) | Single line text | — | |
| Events (Room Temp Display) | Linked record | — | Links to Events table |
| Events (Deli – China) | Single line text | — | |
| Events (Dessert – China) | Linked record | — | Links to Events table |
| Events (Beverages – Disposable) | Single line text | — | |
| Events (Passed Appetizers) | Linked record | — | Links to Events table |
| Events (Presented Appetizers) | Linked record | — | Links to Events table |
| Events (Buffet – China) | Linked record | — | Links to Events table |
| Events (Pasta Flight Station (China)) | Single line text | — | |
| Events (Street Food Station (China)) | Single line text | — | |
| Events (Late Night Bites – China) | Single line text | — | |
| Events (Desserts – China) | Single line text | — | |
| Events (Beverages (Non-Disposable)) | Single line text | — | |
| Vessel Type | Single select | Full Pan (Hot), Half Pan (Hot), Round Pan (Hot), Metal – Hot, China – Cold / Display, China – Room Temp, Board / Display, Tin / Casual, Disposable, Beverage Container, Individually Plated, Other | |
| Service Type | Single select | Passed App, Presented App, Buffet – Hot, Buffet – Cold, Room Temp Display, Station, Late Night Bites, Dessert, Beverage, Appetizer, Entrée, Buffet, Service Type | |
| Events (Passed Apps) | Single line text | — | |
| Events (Presented Apps) | Single line text | — | |
| Events (Buffet Items) | Linked record | — | Links to Events table |
| Events (Desserts) | Linked record | — | Links to Events table |
| Events (Beverages) | Linked record | — | Links to Events table |
| Temp_ServiceTypeViewTag | Single select | Passed App Selected Items, Presented App Selected Items, Buffet Selected Items, Dessert Selected Items, Beverage Selected Items, Entrée | |
| Spec Portion (Per Guest) | Number (Decimal) | — | |
| Component Type | Single select | Main Item, Sauce / Garnish, Component | |
| Component Group ID | Single line text | — | |
| Component Name Override | Single line text | — | |
| Sauce Spec Type | Single select | Per Guest, Per X Guests, Container Fixed Size, No Spec Needed | |
| Sauce Portion Rule | Single line text | — | |
| Parent Item | Linked record | — | Links to Menu Items table (self-referential) |
| Guest Count Lookup | Lookup | — | READ ONLY |
| Calculated Spec Qty | Formula | — | READ ONLY |
| From field: Parent Item | Linked record | — | Links to Menu Items table |
| Client Intake (Clean) (Passed Apps) | Linked record | — | Links to Client Intake (Clean) table |
| Client Intake (Clean) (Presented Apps) | Linked record | — | Links to Client Intake (Clean) table |
| Client Intake (Clean) (Buffet Items) | Linked record | — | Links to Client Intake (Clean) table |
| Client Intake (Clean) (Main Course) | Linked record | — | Links to Client Intake (Clean) table |
| Client Intake (Clean) (Sides) | Linked record | — | Links to Client Intake (Clean) table |
| Client Intake (Clean) (Desserts) | Linked record | — | Links to Client Intake (Clean) table |
| Stations | Linked record | — | Links to Stations table |
| Events Clean (Menu Items) | Linked record | — | Links to Events Clean table |
| Events Clean (Passed Appetizers) | Linked record | — | Links to Events Clean table |
| Events Clean (Presented Appetizers) | Linked record | — | Links to Events Clean table |
| Events Clean (Buffet Items) | Linked record | — | Links to Events Clean table |
| Events Clean (Desserts) | Linked record | — | Links to Events Clean table |
| Events | Single line text | — | |
| Print Lines | Long text | — | |
| Heat State | Single select | HOT, COLD / ROOM TEMP | |
| Print Line | Formula | — | READ ONLY |
| Allergen Icons | Multiple select | 🌾, 🌱, 🦐, 🥛, 🥚, 🥜, 🐷, 🧀 | |
| Print – Spec Line | Formula | — | READ ONLY |
| Default Vessel | Single select | China, Metal, Disposable | |
| Default Pan Type | Single select | Full, Half, Round, Hotel, QT, LRG | |
| Qty (Nick Spec) | Single line text | — | |
| Pan Type (Nick Spec) | Single select | Full, Half, Round, Hotel, QT, QT+, LRG, #, Platter | |
| Serving Vessel (Nick Spec) | Single select | China, Metal, Disposable | |
| Notes (Nick) | Long text | — | |
| Event | Linked record | — | Links to Events table |
| Section | Single select | Passed Apps, Presented Apps, Buffet – China, Buffet – Metal, Desserts, Appetizers, Buffet | |
| Spec Lock Status | Formula | — | READ ONLY |
| Suggested Pack-Out | Formula | — | READ ONLY |
| Menu Item Specs | Linked record | — | Links to Menu Item Specs table |
| Dietary Icons Record | Linked record (AI) | — | Links to Dietary Icons table; On-demand AI generation |
| Events 2 | Linked record | — | Links to Events table |
| Events (Entrées) | Linked record | — | Links to Events table |
| Events (Sides) | Linked record | — | Links to Events table |
| Events (Bar Items) | Linked record | — | Links to Events table |
| Events (Deli) | Linked record | — | Links to Events table |
| Events (Displays) | Linked record | — | Links to Events table |
| Buffet Type | Single select | Buffet – Hot, Buffet – Cold | |
| Description | Long text | — | |
| Notes | Long text | — | |
| Dietary | Single line text | — | |
| Is Sauce | Single select | Yes, No, Is Sauce | |
| Child Items | Linked record | — | Links to Menu Items table (self-referential) |
| From field: Child Items | Linked record | — | Links to Menu Items table |