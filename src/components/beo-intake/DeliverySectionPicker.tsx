/**
 * DeliverySectionPicker — checklist-style picker for one delivery section.
 *
 * Fetches available items from Menu_Lab (filtered by Execution Type) and
 * loads/saves selections to the Event Menu shadow table.
 */
import React, { useCallback, useEffect, useState } from "react";
import { type DeliverySectionConfigRow } from "../../config/deliverySectionConfig";
import {
  fetchMenuItemsByExecutionType,
  type MenuLabItem,
} from "../../services/airtable/menuItems";
import {
  loadEventMenuRows,
  createEventMenuRow,
  deleteEventMenuRow,
  type EventMenuRow,
} from "../../services/airtable/eventMenu";
import { isErrorResult } from "../../services/airtable/selectors";

type Props = {
  section: DeliverySectionConfigRow;
  eventId: string | null;
  canEdit?: boolean;
};

export function DeliverySectionPicker({ section, eventId, canEdit = true }: Props) {
  const [catalogItems, setCatalogItems] = useState<MenuLabItem[]>([]);
  const [addedRows, setAddedRows] = useState<EventMenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const [catalogResult, rowsResult] = await Promise.all([
      fetchMenuItemsByExecutionType(section.executionType),
      loadEventMenuRows(eventId),
    ]);

    setCatalogItems(catalogResult);

    if (isErrorResult(rowsResult)) {
      setError("Failed to load existing selections");
    } else {
      setAddedRows(
        (rowsResult as EventMenuRow[]).filter(
          (r) => r.section === section.executionType
        )
      );
    }

    setLoading(false);
  }, [eventId, section.executionType]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (item: MenuLabItem) => {
    if (!eventId || !canEdit) return;
    setSaving(item.id);
    setError(null);
    const result = await createEventMenuRow(eventId, section.executionType, item.id);
    if (!isErrorResult(result)) {
      setAddedRows((prev) => [
        ...prev,
        {
          id: result.id,
          section: section.executionType,
          sortOrder: prev.length + 1,
          catalogItemId: item.id,
          displayName: item.name,
          customText: null,
          sauceOverride: null,
          packOutNotes: null,
          parentItemId: null,
          childOverrides: null,
        },
      ]);
    } else {
      setError("Failed to add item — try again");
    }
    setSaving(null);
  };

  const handleRemove = async (row: EventMenuRow) => {
    if (!eventId || !canEdit) return;
    setSaving(row.id);
    setError(null);
    const result = await deleteEventMenuRow(row.id);
    if (!isErrorResult(result)) {
      setAddedRows((prev) => prev.filter((r) => r.id !== row.id));
    } else {
      setError("Failed to remove item — try again");
    }
    setSaving(null);
  };

  if (!eventId) {
    return (
      <p style={{ color: "#888", fontSize: 13, margin: "8px 0" }}>
        Select an event to manage items.
      </p>
    );
  }

  if (loading) {
    return (
      <p style={{ color: "#888", fontSize: 13, margin: "8px 0" }}>Loading…</p>
    );
  }

  const addedCatalogIds = new Set(
    addedRows.map((r) => r.catalogItemId).filter((id): id is string => id !== null && id !== undefined)
  );
  const available = catalogItems.filter((item) => !addedCatalogIds.has(item.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {error && (
        <p style={{ color: "#f87171", fontSize: 12, margin: "0 0 4px" }}>{error}</p>
      )}

      {/* Already-added items */}
      {addedRows.map((row) => {
        const name =
          catalogItems.find((c) => c.id === row.catalogItemId)?.name ??
          row.displayName ??
          row.catalogItemId ??
          "Item";
        const isBusy = saving === row.id;
        return (
          <div
            key={row.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 10px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: 6,
              fontSize: 13,
            }}
          >
            <span style={{ flex: 1, color: "#fff" }}>{name}</span>
            {canEdit && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleRemove(row)}
                style={{
                  background: "none",
                  border: "none",
                  color: isBusy ? "#666" : "#f87171",
                  cursor: isBusy ? "default" : "pointer",
                  fontSize: 14,
                  padding: "0 4px",
                  lineHeight: 1,
                }}
                aria-label={`Remove ${name}`}
              >
                ✕
              </button>
            )}
          </div>
        );
      })}

      {/* Available items */}
      {available.map((item) => {
        const isBusy = saving === item.id;
        return (
          <button
            key={item.id}
            type="button"
            disabled={!canEdit || isBusy}
            onClick={() => handleAdd(item)}
            style={{
              textAlign: "left",
              background: "none",
              border: "1px dashed rgba(255,255,255,0.18)",
              borderRadius: 6,
              color: isBusy ? "#666" : "#94a3b8",
              cursor: canEdit && !isBusy ? "pointer" : "default",
              fontSize: 13,
              padding: "5px 10px",
            }}
          >
            + {item.name}
          </button>
        );
      })}

      {catalogItems.length === 0 && !loading && (
        <p style={{ color: "#666", fontSize: 12, margin: "4px 0" }}>
          No items found in Menu_Lab for <em>{section.executionType}</em>.
        </p>
      )}
    </div>
  );
}
