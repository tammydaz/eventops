# BEO Full Intake – Export Bundle

Use this folder to hand off the BEO intake feature to someone else. When they're done, plug the files back into the main app using the paths below.

---

## 1. Files in this export

| Restore path | Description |
|--------------|-------------|
| `src/pages/IntakePage.tsx` | Main BEO intake page (header + event picker + form sections) |
| `src/pages/IntakePage.css` | Section/panel styling for intake |
| `src/components/EventSelector.tsx` | Event picker (dropdown + portal). **Do not use** `src/components/intake/EventSelector.tsx` for BEO – IntakePage imports from `../components/EventSelector` with `variant="beo-header"`. |
| `src/components/intake/EventSelector.tsx` | Re-export of base EventSelector (used by App shell elsewhere) |
| `src/router.tsx` | Entire router – ensure `pathname.startsWith("/beo-intake")` returns `<IntakePage />`. |
| `src/App.tsx` | Entire App – ensure `isBeoIntake = pathname.startsWith("/beo-intake")`, and `{!isBeoIntake && (... header ...)}` so the grey header is hidden on BEO intake. |
| `src/state/eventStore.tsx` | Zustand store (events, selectedEventId, selectEvent, loadEventData, setFields, etc.) |

**Intake sections (each just re-exports a panel):**  
`ClientSection`, `EventDetailsSection`, `MenuSection`, `BarServiceSection`, `HotColdBeveragesSection`, `ServicewareNewSection`, `GlasswareSection`, `DecorNotesSection`, `VenueFacilitiesSection`  
→ Live in `src/components/intake/*Section.tsx` and the corresponding `*Panel.tsx`.

**Panels used by the sections above (all under `src/components/intake/`):**  
`ClientDetailsPanel.tsx`, `EventDetailsPanel.tsx`, `MenuItemsPanel.tsx`, `BarServicePanel.tsx`, `HotColdBeveragesPanel.tsx`, `ServicewareNewPanel.tsx`, `GlasswarePanel.tsx`, `DecorNotesPanel.tsx`, `VenueFacilitiesPanel.tsx`  
→ Copy the **entire** `src/components/intake/` folder so all Section + Panel files (and any shared wrappers) are included.

**Services (used by store and panels – keep in main app):**  
`src/services/airtable/events.ts`, `linkedRecords.ts`, `selectors.ts`, `client.ts`  
→ Required for `eventStore` and for panels that load/save event and menu data. Do not move; the person fixing the code needs the same API.

---

## 2. How to plug back in

1. **Overwrite** the files listed above with the versions from this export (or from the person who fixed them), keeping the same paths inside your repo.
2. **Router:** In `src/router.tsx`, keep the branch:
   - `if (pathname.startsWith("/beo-intake")) { return <IntakePage />; }`
3. **App:** In `src/App.tsx`, keep:
   - `const isBeoIntake = pathname.startsWith("/beo-intake");`
   - Header wrapped in `{!isBeoIntake && ( ... )}` so the BEO intake page doesn’t show the old grey header.
4. **IntakePage** imports **EventSelector** from `../components/EventSelector` and uses `<EventSelector variant="beo-header" />`. The working event picker is the one that uses the portal in that file; don’t replace it with a different component unless you intentionally change the import.

---

## 3. Entry point and route

- **URL:** `/beo-intake` (no id) or `/beo-intake/{eventId}` (with id).
- **Route:** Handled in `router.tsx` → `IntakePage`.
- **Navigation from dashboard:** e.g. "BEO Full Intake" → `href="/beo-intake"` or `Link to="/beo-intake"`.

---

## 4. What to give to someone else

- This **README**
- The contents of the **BUNDLE** file (or the extracted files from `beo-intake-export/src/` if you unpack the bundle)
- Tell them: “Fix only the BEO intake flow and the menu item picker in `MenuItemsPanel`. Do not change the event picker in `EventSelector.tsx` (the one that uses the portal).”
- They need the rest of the repo (or at least `src/services/airtable/`, `src/state/eventStore.tsx`, and the rest of `src/components/intake/`) to run and build.
