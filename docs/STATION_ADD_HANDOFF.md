# Station Add Flow — Handoff for Debugging

**Issue:** "Add Station" button does not open the configuration modal.

**Last updated:** March 2025

---

## Flow Overview

1. User expands **Menu & Beverages** section (FormSection with beo-pill)
2. User sees **Add Creation Station** area with:
   - **Station Preset** dropdown (if `stationPresets.length > 0`)
   - **Station Notes** textarea
   - **+ Add Station** button
3. When user clicks **+ Add Station**:
   - If **preset flow** (`usePresetFlow`): requires `newStationPresetId` AND `selectedPreset` — otherwise **returns early, nothing happens**
   - If **non-preset flow**: requires `newStationType.trim()` — opens `StationItemsConfigModal`
   - Preset flow opens `StationComponentsConfigModal`

---

## Suspected Causes for "Not Opening"

### 1. **Preset not selected**
`openAddStationModal` in MenuSection.tsx returns early if no preset is chosen:

```javascript
const openAddStationModal = () => {
  if (usePresetFlow) {
    if (!newStationPresetId || !selectedPreset) return;  // <-- SILENT RETURN
    setShowComponentsModal(true);
  } else {
    if (!newStationType.trim()) return;
    setShowConfigModal(true);
  }
};
```

**Fix idea:** Show a toast/alert when user clicks Add Station without selecting a preset, e.g. "Please select a station preset first."

### 2. **No station presets loaded**
If `loadStationPresets()` returns `[]` or errors, `usePresetFlow` is false and the UI shows Station Type dropdown instead. If presets fail to load, user might not see the preset dropdown at all.

### 3. **Click-outside handler**
BeoIntakePage has a mousedown handler that dispatches `beo-collapse-all-pills`. Clicks inside `.station-config-modal` are excluded, but if the modal never mounts, this wouldn't apply. Check if something is preventing the modal from rendering.

### 4. **Button disabled**
The Add Station button is disabled when:
- `!canEdit` (user can't edit)
- `usePresetFlow && !newStationPresetId`
- `!usePresetFlow && !newStationType.trim()`

---

## Relevant Files

### 1. `src/components/beo-intake/MenuSection.tsx`
- `openAddStationModal` (lines ~471–479)
- `showComponentsModal` state
- `StationComponentsConfigModal` usage (lines ~709–724)
- Add Station button (lines ~688–694)

### 2. `src/components/beo-intake/StationComponentsConfigModal.tsx`
- Full modal component
- Uses `createPortal` to render to `document.body`
- Requires `isOpen`, `presetId`, `presetName`, etc.

### 3. `src/pages/BeoIntakePage.tsx`
- Click-outside handler excludes `.station-config-modal` (line ~235)

### 4. `src/services/airtable/stationComponents.ts`
- `loadStationPresets()` — populates preset dropdown
- `loadDefaultComponentsForPreset`, `loadAllComponentsForPreset`, `loadStationOptionsForPreset`

### 5. `src/services/airtable/linkedRecords.ts`
- `createStationFromPreset` — creates station record (fixed to use `{ records: [{ fields }] }`)

---

## Quick Debug Steps

1. **Console log in `openAddStationModal`:**
   ```javascript
   console.log("openAddStationModal", { usePresetFlow, newStationPresetId, selectedPreset });
   ```

2. **Check if modal receives `isOpen={true}`:**
   - Add `console.log("StationComponentsConfigModal render", props.isOpen)` at top of modal

3. **Check station presets:**
   - `loadStationPresets().then(console.log)` — should return array of `{ id, name }`

4. **Verify Add Station button is not disabled:**
   - Inspect `disabled={!canEdit || (usePresetFlow ? !newStationPresetId : !newStationType.trim())}`

---

## Code Snippets (Copy-Paste Ready)

### MenuSection.tsx — openAddStationModal and Add Station button

```tsx
const openAddStationModal = () => {
  if (usePresetFlow) {
    if (!newStationPresetId || !selectedPreset) return;
    setShowComponentsModal(true);
  } else {
    if (!newStationType.trim()) return;
    setShowConfigModal(true);
  }
};

// ...

<button
  type="button"
  disabled={!canEdit || (usePresetFlow ? !newStationPresetId : !newStationType.trim())}
  onClick={openAddStationModal}
  style={buttonStyle}
>
  + Add Station
</button>
```

### StationComponentsConfigModal — conditional render

```tsx
if (!isOpen) return null;
// ... rest of modal
return createPortal(content, document.body);
```

---

## Full File Paths to Share

| File | Purpose |
|------|---------|
| `src/components/beo-intake/StationComponentsConfigModal.tsx` | Modal UI (479 lines) |
| `src/components/beo-intake/MenuSection.tsx` | Parent, Add Station button, modal wiring |
| `src/services/airtable/stationComponents.ts` | Load presets, components, options |
| `src/services/airtable/linkedRecords.ts` | createStationFromPreset, getStationsFieldIds |
| `src/pages/BeoIntakePage.tsx` | Click-outside handler (excludes .station-config-modal) |
| `src/components/beo-intake/FormSection.tsx` | CollapsibleSubsection, beo-pill |
