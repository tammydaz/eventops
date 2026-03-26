# Delivery BEO intake ↔ printed BEO

Use this when training or auditing **delivery / pickup** events in BEO Intake so the on-screen flow matches what you see on real BEOs (see `docs/BEO_RAW_DUMP.txt` and `beo templates/**/**DELIVERY*.xlsx`).

## Intake order (same rhythm as full service)

| Step | Full service | Delivery / pickup |
|------|----------------|-------------------|
| 1 | Header (client, venue, times, FW staff) | Same |
| 2 | Menu — pick sections & shadow menu rows | **Menu — delivery (disposable)** — same picker + shadow table, lane helper, boxed lunch block |
| 3 | Beverage Services | Same |
| 4 | Plates / Serviceware | **Paper products & disposables** (`beo-section-delivery-paper`) — lists → Airtable plates / cutlery / glassware fields used on printed delivery BEO |
| 5 | Timeline, onsite notes | Hidden (not used on standard delivery drops) |
| 6 | Event details (type, occasion, delivery notes, load-in, etc.) | Same |

Jump nav (Ctrl+J): for delivery, **Plates / Serviceware** is replaced by **Paper / disposables**. URL `?section=serviceware` jumps to paper on delivery.

## Printed BEO labels → intake buttons

Printed dumps often use these headers. Map them to the **green buttons** in the delivery menu:

| Printed BEO (examples from `BEO_RAW_DUMP.txt`) | Intake action |
|--------------------------------------------------|----------------|
| HOT / BUFFET – DISPOSABLE | + Passed — HOT, + Presented — HOT, + Buffet metal — HOT |
| DELI – DISPOSABLE | + Deli — DELI, boxed lunch block, platter tools |
| KITCHEN – DISPOSABLE | + Buffet china — KITCHEN |
| SALADS/DISPLAYS – DISPOSABLE | + Room temp — SALADS |
| DESSERTS – DISPOSABLE | + Desserts |
| PAPER PRODUCTS & BEVERAGES | **Paper products & disposables** section (after beverages) + **Beverage Services** |

Kitchen BEO print groups menu data into: **HOT – DISPOSABLE**, **DELI – DISPOSABLE**, **KITCHEN – DISPOSABLE**, **SALADS – DISPOSABLE**, **DESSERTS – DISPOSABLE** (`KitchenBEOPrintPage.tsx` / `BeoPrintPage.tsx`). Intake uses the **same underlying event fields** as full service (passed, presented, buffet metal/china, deli delivery field, room temp, desserts); only presentation and disposable labeling change.

## Files

- Intake layout: `src/pages/BeoIntakePage.tsx`
- Paper block: `src/components/beo-intake/DeliveryPaperProductsSection.tsx`
- Jump nav: `src/components/beo-intake/BeoJumpToNav.tsx`
