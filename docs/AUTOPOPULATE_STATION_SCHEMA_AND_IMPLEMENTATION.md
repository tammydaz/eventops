# autopopulateStation — Schema & Implementation

## 1. Detected Fields and IDs (from Airtable Metadata Fetch)

### Stations Table
| Table ID | `tblhFwUfREbpfFXhv` |
|----------|---------------------|
| Table name | `Stations` |

| Field ID | Field Name |
|----------|------------|
| `fldkjGbXJILGhdDwt` | Id |
| `fldRo8xgmoIR2yecn` | Station Items |
| `fldCf9uvjWQdtJkZs` | Station Notes |
| `fldoOaZsMyXiSNKTc` | Event |
| `fldQ1bGDg8jhJvqmJ` | Station Type |
| `fldEsD59DRXA2HjGa` | Additional Components |
| `fldq0re2ySITrbZEq` | Last Autopopulate |

### Station Presets Table
**Status:** Not found in the current base.

Tables in base: Client Intake, Menu Items, BEOs, Pack-Outs, Events, Staff, Rentals, Pack-Out Generator, Rental Items, FW Equipment, Events_Staging, Client Intake (Clean), Stations, Events Clean, Service Ware, Events_GOLD_MASTER_REFERENCE, System Blueprint, Menu Item Specs, Bar Components, Build Log, Dietary Icons, Print Field Index, System Continuity & Build Anchor, Flair Room Decor, Purchase Requests, Receipts, Build Log – Events Fields, Build Log – Enforcement Rules, Staff Intelligence – Ratings, Staff Intelligence – Composite Scores, Staff Incidents, Field Cleanup Tracker, Menu Items CLEAN TEMP, Master Menu Specs, Users.

**To use autopopulateStation:** Create a "Station Presets" table with at least:
- Lookup field (e.g. "Preset Name" or "Station Type") — single line text or single select
- "Line 1 Defaults" — linked to Menu Items (or "Line 1 Items")
- "Line 2 Defaults" — linked to Menu Items (or "Line 2 Items")
- "Individual Defaults" — linked to Menu Items (or "Individual Items")

Then set `VITE_AIRTABLE_STATION_PRESETS_TABLE` in `.env` to the table ID.

---

## 2. Final Function Code

The implementation will be added to `src/services/airtable/linkedRecords.ts`:

```typescript
/** Extended Stations field IDs (includes Additional Components, Last Autopopulate). */
type StationsFieldIdsFull = StationsFieldIds & {
  additionalComponents: string;
  lastAutopopulate: string;
};

let cachedStationsFieldIdsFull: StationsFieldIdsFull | null | undefined = undefined;

async function getStationsFieldIdsFull(): Promise<StationsFieldIdsFull | null> {
  if (cachedStationsFieldIdsFull) return cachedStationsFieldIdsFull;
  const tableId = getStationsTable();
  const data = await airtableMetaFetch<{ tables: Array<{ id: string; name: string; fields: Array<{ id: string; name: string; type: string }> }> }>("");
  if (isErrorResult(data)) {
    cachedStationsFieldIdsFull = null;
    return null;
  }
  const table = data.tables.find((t) => t.id === tableId || t.name === tableId);
  if (!table) {
    cachedStationsFieldIdsFull = null;
    return null;
  }
  const byName = (name: string) => table.fields.find((f) => f.name === name)?.id ?? "";
  cachedStationsFieldIdsFull = {
    stationType: byName("Station Type"),
    stationItems: byName("Station Items") || STATION_ITEMS_FIELD_ID,
    event: byName("Event") || STATION_EVENT_FIELD_ID,
    stationNotes: byName("Station Notes"),
    additionalComponents: byName("Additional Components"),
    lastAutopopulate: byName("Last Autopopulate"),
  };
  return cachedStationsFieldIdsFull;
}

type StationPresetsFieldIds = {
  tableId: string;
  presetNameField: string;
  line1Field: string;
  line2Field: string;
  individualsField: string;
};

let cachedStationPresetsFieldIds: StationPresetsFieldIds | null | undefined = undefined;

async function getStationPresetsFieldIds(): Promise<StationPresetsFieldIds | null> {
  if (cachedStationPresetsFieldIds !== undefined) return cachedStationPresetsFieldIds;
  const envTableId = (import.meta.env.VITE_AIRTABLE_STATION_PRESETS_TABLE as string | undefined)?.trim();
  const data = await airtableMetaFetch<{ tables: Array<{ id: string; name: string; fields: Array<{ id: string; name: string }> }> }>("");
  if (isErrorResult(data)) {
    cachedStationPresetsFieldIds = null;
    return null;
  }
  const table = envTableId
    ? data.tables.find((t) => t.id === envTableId)
    : data.tables.find((t) => t.name === "Station Presets" || t.name === "Station Preset");
  if (!table) {
    cachedStationPresetsFieldIds = null;
    return null;
  }
  const byName = (name: string) => table.fields.find((f) => f.name === name)?.id ?? "";
  const line1 = byName("Line 1 Defaults") || byName("Line 1 Items");
  const line2 = byName("Line 2 Defaults") || byName("Line 2 Items");
  const individuals = byName("Individual Defaults") || byName("Individual Items");
  const presetName = byName("Preset Name") || byName("Station Type");
  if (!line1 || !line2 || !individuals || !presetName) {
    cachedStationPresetsFieldIds = null;
    return null;
  }
  cachedStationPresetsFieldIds = {
    tableId: table.id,
    presetNameField: presetName,
    line1Field: line1,
    line2Field: line2,
    individualsField: individuals,
  };
  return cachedStationPresetsFieldIds;
}

export type AutopopulateStationResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Autopopulate a station from its Station Type preset.
 * - Fetches Line 1 Defaults, Line 2 Defaults, Individual Defaults from the preset.
 * - Writes them to Station Items (and Additional Components if preset has that split).
 * - Does NOT overwrite existing user-entered items.
 * - Saves Last Autopopulate date.
 * - Returns success state for UI update.
 */
export const autopopulateStation = async (
  stationId: string
): Promise<AutopopulateStationResult> => {
  const apiKeyResult = getApiKey();
  const baseIdResult = getBaseId();
  if (isErrorResult(apiKeyResult)) return { success: false, error: String(apiKeyResult) };
  if (isErrorResult(baseIdResult)) return { success: false, error: String(baseIdResult) };

  const stationFieldIds = await getStationsFieldIdsFull();
  if (!stationFieldIds) {
    return { success: false, error: "Could not resolve Stations table field IDs" };
  }

  const presetFieldIds = await getStationPresetsFieldIds();
  if (!presetFieldIds) {
    return { success: false, error: "Station Presets table not found or missing required fields. Add VITE_AIRTABLE_STATION_PRESETS_TABLE to .env." };
  }

  const stationsTableId = getStationsTable();
  const loadRes = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${stationsTableId}?filterByFormula=RECORD_ID()='${stationId}'&returnFieldsByFieldId=true`
  );
  if (isErrorResult(loadRes)) {
    return { success: false, error: (loadRes as AirtableErrorResult).message ?? "Failed to load station" };
  }
  const records = (loadRes as AirtableListResponse<Record<string, unknown>>).records;
  if (!records?.length) {
    return { success: false, error: "Station not found" };
  }

  const fields = records[0].fields as Record<string, unknown>;
  const stationType = asString(fields[stationFieldIds.stationType]) || asSingleSelectName(fields[stationFieldIds.stationType]) || "";
  if (!stationType.trim()) {
    return { success: false, error: "Station has no Station Type selected" };
  }

  const existingStationItems = asLinkedRecordIds(fields[stationFieldIds.stationItems]);
  const existingAdditionalItems = asLinkedRecordIds(fields[stationFieldIds.additionalComponents]);

  if (existingStationItems.length > 0 || existingAdditionalItems.length > 0) {
    return { success: false, error: "Station already has items. Clear items first to autopopulate, or remove to allow overwrite." };
  }

  const formula = `{${presetFieldIds.presetNameField}} = "${stationType.replace(/"/g, '\\"')}"`;
  const presetRes = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `/${presetFieldIds.tableId}?filterByFormula=${encodeURIComponent(formula)}&returnFieldsByFieldId=true`
  );
  if (isErrorResult(presetRes)) {
    return { success: false, error: (presetRes as AirtableErrorResult).message ?? "Failed to load preset" };
  }
  const presetRecords = (presetRes as AirtableListResponse<Record<string, unknown>>).records;
  if (!presetRecords?.length) {
    return { success: false, error: `No preset found for Station Type "${stationType}"` };
  }

  const presetFields = presetRecords[0].fields as Record<string, unknown>;
  const line1 = asLinkedRecordIds(presetFields[presetFieldIds.line1Field]);
  const line2 = asLinkedRecordIds(presetFields[presetFieldIds.line2Field]);
  const individuals = asLinkedRecordIds(presetFields[presetFieldIds.individualsField]);

  const stationItems = [...line1, ...line2];
  const additionalComponents = [...individuals];

  const now = new Date().toISOString().split("T")[0];

  const updateFields: Record<string, unknown> = {
    [stationFieldIds.stationItems]: stationItems,
    [stationFieldIds.lastAutopopulate]: now,
  };
  if (stationFieldIds.additionalComponents && additionalComponents.length > 0) {
    updateFields[stationFieldIds.additionalComponents] = additionalComponents;
  }

  const patchRes = await airtableFetch<{ records: Array<{ id: string }> }>(
    `/${stationsTableId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        records: [{ id: stationId, fields: updateFields }],
      }),
    }
  );

  if (isErrorResult(patchRes)) {
    return { success: false, error: (patchRes as AirtableErrorResult).message ?? "Failed to update station" };
  }

  return { success: true };
};
```

**Note:** The filterByFormula for loading a single station by ID uses `RECORD_ID()='recXXX'`. Airtable's RECORD_ID() returns the record id, so the formula should work. If not, we may need to use a different approach (e.g. fetch by primary field or use a different API).

---

## 3. Summary of Changes autopopulateStation Will Write

| Field | Action |
|-------|--------|
| **Station Items** | Set to `[Line 1 Defaults] + [Line 2 Defaults]` from preset |
| **Additional Components** | Set to `[Individual Defaults]` from preset (if preset has them) |
| **Last Autopopulate** | Set to today's date (YYYY-MM-DD) |

**Rules enforced:**
- Does NOT overwrite if Station Items or Additional Components already have values (user overrides).
- Requires Station Type to be set (used to lookup preset).
- Requires Station Presets table to exist with correct field names.
- Returns `{ success: true }` or `{ success: false, error: string }` for UI feedback.
