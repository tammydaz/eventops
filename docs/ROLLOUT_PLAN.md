# EventOps BEO Updates — Staff Rollout Plan

**Date:** March 2025  
**Scope:** Delivery BEO intake, Kitchen BEO print, Hydration Station, Spec override

---

## 1. What’s New

### Delivery BEO (Intake & Print)
- **Delivery events** now use disposable sections instead of full-service:
  - **HOT - DISPOSABLE** (passed apps, presented apps, hot buffet)
  - **DELI - DISPOSABLE** (sandwiches & wraps)
  - **KITCHEN - DISPOSABLE** (buffet china / cold items)
  - **SALADS - DISPOSABLE** (room temp / salads)
  - **DESSERTS - DISPOSABLE**
- Delivery sections use **green** headers and styling.
- **Displays** picker removed; salads/room temp items live under SALADS - DISPOSABLE.

### Hydration Station
- If Airtable options fail to load, the modal now shows **fallback options** (Water, Soda, Lemonade, Iced Tea, etc.) instead of staying on “Loading from Airtable…”.

### Spec / Quantity Column
- **Auto spec** (Master Menu Specs) is turned off for now.
- **Override** is the only way to enter quantities:
  - Use the **Override** field on the right.
  - Whatever you type appears in the **left column** (spec/qty).
  - Leave blank to show “—”.

---

## 2. Rollout Phases

### Phase 1: Announce (Day 1)
- [ ] Send email/Slack to staff with link to this doc.
- [ ] Highlight: Delivery BEO sections, Hydration Station fix, Spec override.
- [ ] Point to training session (if scheduled).

### Phase 2: Training (Day 2–3)
- [ ] **15–20 min walkthrough** (live or recorded):
  1. **Delivery BEO intake** — where to find HOT/DELI/KITCHEN/SALADS/DESSERTS.
  2. **Kitchen BEO print** — delivery events show green disposable sections.
  3. **Hydration Station** — select options; fallback if loading fails.
  4. **Spec override** — type quantity in Override; it shows on the left.
- [ ] Share recording link for anyone who can’t attend.

### Phase 3: Soft Launch (Day 4–7)
- [ ] Staff use new flow for **new** delivery events.
- [ ] Collect feedback (Slack channel, email, or form).
- [ ] Fix urgent issues quickly.

### Phase 4: Full Rollout (Day 8+)
- [ ] Treat new flow as standard for all delivery BEOs.
- [ ] Update any internal SOPs or checklists.
- [ ] Archive or update old training materials.

---

## 3. Quick Reference for Staff

| Task | Where | What to do |
|------|-------|------------|
| Add delivery menu items | BEO Intake → Menu & Beverages | Use HOT, DELI, KITCHEN, SALADS, DESSERTS sections. Green headers = delivery. |
| Configure hydration | BEO Intake → Beverage Service → Hydration Station | Click “Select hydration options.” Choose drinks; add notes if needed. |
| Enter quantities on BEO | BEO Print → Kitchen BEO → Spec check | Type in the **Override** field (right side). Value appears on the left. |
| Print delivery Kitchen BEO | Kitchen BEO Print page | Select delivery event. Sections show as HOT/DELI/KITCHEN/SALADS/DESSERTS - DISPOSABLE. |

---

## 4. Known Changes / Limitations

- **Spec engine off:** Quantities are manual only via Override until auto spec is re-enabled.
- **Displays removed:** Salad/room temp items go under SALADS - DISPOSABLE.
- **Delivery vs full-service:** Section names differ by event type; delivery uses “- DISPOSABLE” everywhere.

---

## 5. Support & Feedback

- **Questions:** [Add contact – e.g. ops@company.com or Slack #eventops]
- **Bugs:** [Add issue tracker or support channel]
- **Feedback:** [Add form or channel]

---

## 6. Rollback (If Needed)

If critical issues appear:
- Revert to previous deployment via Vercel dashboard.
- Notify staff to use the prior version until the fix is deployed.

---

*Last updated: March 2025*
