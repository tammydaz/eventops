# Screenshot Capture Guide for Staff Training

**Purpose:** Capture these screenshots from your live EventOps app, then save them in this folder. The training guide will display them automatically.

**How to capture:** Use Windows Snipping Tool (Win+Shift+S), browser DevTools, or any screenshot tool. Save as PNG.

---

## Screenshots to Capture

| # | Filename | Page | URL | What to show |
|---|----------|------|-----|--------------|
| 1 | `01-login-email.png` | Login | `/` (logged out) | Email input, Continue button |
| 2 | `02-login-set-password.png` | Set password | After first-time email | Password fields, Set password button |
| 3 | `03-login-password.png` | Login with password | After email submitted | Password input, Log in button |
| 4 | `04-dashboard.png` | Dashboard | `/` (logged in) | Tabs, event cards, Add Event, Departments |
| 5 | `05-quick-intake.png` | Quick Intake | `/quick-intake` | Form: client name, phone, event type |
| 6 | `06-invoice-intake.png` | Invoice Upload | `/invoice-intake` | Drop zone, "Drop PDF here" |
| 7 | `07-beo-intake-header.png` | BEO Intake | `/beo-intake` | Event selector, section headers |
| 8 | `08-beo-intake-client.png` | BEO Intake – Client | `/beo-intake/{id}` | Client & Day-of Contact section |
| 9 | `09-beo-intake-menu.png` | BEO Intake – Menu | `/beo-intake/{id}` | Menu & Beverages, HOT/DELI sections |
| 10 | `10-beo-intake-delivery.png` | BEO Intake – Delivery | `/beo-intake/{id}` (delivery event) | Green delivery sections |
| 11 | `11-hydration-modal.png` | Hydration Station modal | From Beverage Service | Drink options, Notes |
| 12 | `12-kitchen-beo-print.png` | Kitchen BEO Print | `/kitchen-beo-print` | Event selector, section banners |
| 13 | `13-full-beo-print.png` | Full BEO Print | `/beo-print/{id}` | Tabs: Kitchen BEO, Meeting Notes, etc. |
| 14 | `14-spec-override.png` | Spec Override | `/beo-print/{id}` (Spec check) | Left column (qty), Override input |

---

## After Capturing

1. Save each file in `docs/screenshots/` with the exact filename above.
2. The training guide references them as `screenshots/01-login-email.png`, etc.
3. If you use different names, update the image paths in `STAFF_TRAINING_GUIDE.md`.
