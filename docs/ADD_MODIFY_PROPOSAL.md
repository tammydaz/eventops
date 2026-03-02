# Add / Modify Buttons — Proposal for Launch

**Goal:** No bottlenecks. Staff can always add or modify items, even when something isn't in the Menu Items table.

---

## Recommended Approach (Minimal Risk for Launch)

### 1. **+ Add Custom** — Every food section gets an escape hatch

**Pattern (like Paper Products):**
- **+ Add from Menu** — Picker (existing) — for items in Airtable Menu Items
- **+ Add Custom** — Free text — for items NOT in the menu

**Sections to update:**

| Section | Has custom? | Action |
|---------|-------------|--------|
| HOT – Passed | ✓ (CUSTOM_PASSED_APP) | Add textarea (currently missing in delivery) |
| HOT – Presented | ✓ (CUSTOM_PRESENTED_APP) | Add textarea |
| HOT – Buffet Metal | ✓ (CUSTOM_BUFFET_METAL) | Add textarea |
| DELI | ❌ | Add textarea → needs new Airtable field or use fallback |
| KITCHEN | ✓ (CUSTOM_BUFFET_CHINA) | Add textarea |
| SALADS | ❌ | Add textarea → needs new Airtable field or use fallback |
| DESSERTS | ✓ | Already has custom |

**For DELI & SALADS (no custom field yet):**
- **Option A:** Create `CUSTOM_DELIVERY_DELI` and `CUSTOM_ROOM_TEMP` in Airtable (Long Text), add field IDs to code.
- **Option B:** Use `OPS_EXCEPTIONS` with a clear label — quick fix, but mixes with kitchen notes.
- **Option C:** Single "Additional Items" Long Text field for overflow — one field for all custom items.

---

### 2. **Modify** — Defer to post-launch

**Why defer:**
- Modify modal (items + child fields) is more complex.
- Current flow already supports: Add (picker) + Add Custom + Remove (✕).
- A full Modify modal would need: load child items per menu item, edit UI, save back.

**For launch:** Rely on:
- **+ Add from Menu** — Add linked items
- **+ Add Custom** — Add items not in menu
- **✕** — Remove items

**Post-launch:** Add a "Modify" button that opens a modal with:
- List of items in that section
- For each: parent name, child items (from Menu Item Child Items), optional notes
- Edit/remove capability

---

## Implementation Plan

### Phase 1 (Today — Launch) ✓ Done

1. Add custom textareas to delivery HOT (Passed, Presented, Buffet Metal).
2. Add custom textarea to delivery KITCHEN (CUSTOM_BUFFET_CHINA).
3. For DELI and SALADS:
   - Added `CUSTOM_DELIVERY_DELI` and `CUSTOM_ROOM_TEMP_DISPLAY` to FIELD_IDS (placeholder IDs).
   - Textareas in UI wired to `customDeli` and `customRoomTemp` state.
   - **To persist to Airtable:** Create two Long Text fields in the Events table:
     - "Custom Delivery Deli" (for sandwiches/wraps not in menu)
     - "Custom Room Temp Display" (for salads/display items not in menu)
   - Copy the field IDs from Airtable (field settings → copy ID), then in `events.ts`:
     - Replace `fldCustomDeliTODO` with the real ID and add it to `SAVE_WHITELIST`
     - Replace `fldCustomRoomTempTODO` with the real ID and add it to `SAVE_WHITELIST`
     - Remove both from `PLACEHOLDER_FIELD_IDS`
4. Use the same green "+ Add" button style as Paper Products for consistency.

### Phase 2 (Post-Launch)

1. Add "Modify" button per section → modal with items + children.
2. Optional: per-item notes field for special instructions.

---

## Summary

| Need | Solution for Launch |
|------|---------------------|
| Add item from menu | ✓ Already have (+ Add from Menu) |
| Add item NOT in menu | Add "+ Add Custom" textarea to every section |
| Modify existing item | Use ✕ to remove, re-add with changes. Full Modify modal post-launch. |
| Consistent UI | Use Paper Products green "+ Add" style |
