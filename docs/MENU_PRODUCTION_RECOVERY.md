# Menu Production Recovery

## Current Production Model
The safest production model in this repo is:

- `Events` = source of truth for each event
- legacy `Menu Items` (`tbl0aN33DGG6R1sPZ`) = production menu library
- `Boxed Lunch Orders` + related tables = production boxed-lunch source
- `Client Intake` / `Clients` = repeat-customer support
- `Menu_Lab` (`tbl6gXRT2FPpTdf0J`) = staging / editorial only for now

This matches the live schema:

- `Events` linked menu fields point to legacy `Menu Items`
- `Event Menu (SHADOW SYSTEM)` links to legacy `Menu Items`
- `Stations` link to legacy `Menu Items`
- boxed-lunch item links point to legacy `Menu Items`
- `Menu_Lab` is not directly linked from `Events`

## Immediate Freeze Rules
Until the menu system is stable again:

- Add and edit production menu items in legacy `Menu Items` only
- Do not treat `Menu_Lab` changes as production-visible
- Do not switch `VITE_AIRTABLE_MENU_ITEMS_TABLE` to `Menu_Lab` for production debugging
- Do not rename or delete legacy menu rows unless you have confirmed they are unused
- Do not move boxed lunches into shadow or event menu flows

## Why The System Feels Like It Is Shifting
The split is structural:

- picker and filtering logic still has `Menu_Lab` branches
- event-safe save, linked-record storage, and print paths still depend on legacy IDs and legacy fields

That means the app can appear to "find" items in one catalog but still save/print against another.

## What `Menu_Lab` Is Useful For Right Now
`Menu_Lab` is still useful as:

- editorial staging
- delivery taxonomy experiments
- `Display Type` / `Execution Type` / `Menu Section` tagging
- future migration prep

It is not yet complete enough to be the only production menu source because it lacks several legacy concepts used by the live operational system, including:

- service type
- vessel type
- boxed-lunch category / type
- legacy-linked production save paths

## Local Config Note
For local recovery work, the active menu table should be set to legacy:

```env
VITE_AIRTABLE_MENU_ITEMS_TABLE=tbl0aN33DGG6R1sPZ
```

If you point local dev at `Menu_Lab`, you are back in mixed-mode behavior.

## Bridge-Later Rule
Do not attempt a full `Menu_Lab` migration until all of the following are true:

- field-by-field mapping from legacy to `Menu_Lab` is explicit
- record-by-record name bridge is verified
- picker visibility is validated for full service and delivery
- print and event-save flows are validated against legacy-compatible IDs or re-linked schemas

Until then, stabilize first and migrate later.
