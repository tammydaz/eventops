import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FIELD_IDS, loadSingleSelectOptions, type SingleSelectOption } from "../../services/airtable/events";
import { inputStyle, labelStyle, textareaStyle } from "./FormSection";

type HydrationStationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  drinkOptionsSelected: string[];
  notes: string;
  onSave: (fieldId: string, value: unknown) => void;
  onDrinkOptionsChange: (options: string[]) => void;
  onNotesChange: (notes: string) => void;
  canEdit: boolean;
};

/** Only used when the field’s options can’t be loaded — values must still exist on the Airtable field or PATCH will fail. */
const FALLBACK_DRINK_OPTIONS: SingleSelectOption[] = [
  { id: "water", name: "Water" },
  { id: "soda", name: "Soda" },
  { id: "lemonade", name: "Lemonade" },
  { id: "iced-tea", name: "Iced Tea" },
  { id: "sweet-tea", name: "Sweet Tea" },
  { id: "unsweet-tea", name: "Unsweet Tea" },
  { id: "bottled-water", name: "Bottled Water" },
  { id: "sparkling-water", name: "Sparkling Water" },
  { id: "mimosa-bar", name: "Mimosa Bar" },
];

function normSpaced(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function alnumOnly(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Map a stored/UI string to the exact Airtable multi-select option name.
 * Prevents "Insufficient permissions to create new select option" when the UI used a label
 * that doesn’t match the field (e.g. "Unsweet Tea" vs "Unsweetened Iced Tea").
 */
function resolveToAirtableOptionName(selected: string, allowed: SingleSelectOption[]): string | undefined {
  const s = selected.trim();
  if (!s || allowed.length === 0) return undefined;
  const exact = allowed.find((o) => o.name === s);
  if (exact) return exact.name;
  const ns = normSpaced(s);
  const ci = allowed.find((o) => normSpaced(o.name) === ns);
  if (ci) return ci.name;
  const san = alnumOnly(s);
  const compact = allowed.find((o) => alnumOnly(o.name) === san);
  if (compact) return compact.name;
  if (san.includes("unsweet") && san.includes("tea")) {
    const hit = allowed.find((o) => {
      const on = alnumOnly(o.name);
      return on.includes("unsweet") && on.includes("tea");
    });
    if (hit) return hit.name;
  }
  if (san.includes("sweet") && san.includes("tea") && !san.includes("unsweet")) {
    const hit = allowed.find((o) => {
      const on = alnumOnly(o.name);
      return on.includes("sweet") && on.includes("tea") && !on.includes("unsweet");
    });
    if (hit) return hit.name;
  }
  return undefined;
}

function normalizeHydrationSelections(selected: string[], allowed: SingleSelectOption[]): string[] {
  if (allowed.length === 0) return [...selected];
  const out: string[] = [];
  for (const x of selected) {
    const r = resolveToAirtableOptionName(x, allowed);
    if (r && !out.includes(r)) out.push(r);
  }
  return out;
}

export const HydrationStationModal = ({
  isOpen,
  onClose,
  drinkOptionsSelected,
  notes,
  onSave,
  onDrinkOptionsChange,
  onNotesChange,
  canEdit,
}: HydrationStationModalProps) => {
  const [drinkOptions, setDrinkOptions] = useState<SingleSelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const normalizedOnOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) normalizedOnOpenRef.current = false;
  }, [isOpen]);

  /** Remap legacy labels (e.g. "Unsweet Tea") to exact Airtable option names once per open. */
  useEffect(() => {
    if (!isOpen || loading || drinkOptions.length === 0 || normalizedOnOpenRef.current) return;
    const next = normalizeHydrationSelections(drinkOptionsSelected, drinkOptions);
    const same =
      next.length === drinkOptionsSelected.length && next.every((v, i) => v === drinkOptionsSelected[i]);
    if (same) return;
    normalizedOnOpenRef.current = true;
    onDrinkOptionsChange(next);
    void onSave(FIELD_IDS.HYDRATION_STATION_DRINK_OPTIONS, next);
  }, [isOpen, loading, drinkOptions, drinkOptionsSelected, onDrinkOptionsChange, onSave]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    let cancelled = false;
    loadSingleSelectOptions([FIELD_IDS.HYDRATION_STATION_DRINK_OPTIONS]).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if ("error" in result) {
        setDrinkOptions(FALLBACK_DRINK_OPTIONS);
        return;
      }
      const opts = (result[FIELD_IDS.HYDRATION_STATION_DRINK_OPTIONS] ?? []) as SingleSelectOption[];
      // Use ONLY Airtable option names so PATCH never tries to create a new multi-select choice (PAT often lacks that permission).
      if (opts.length > 0) {
        const seen = new Set<string>();
        const deduped: SingleSelectOption[] = [];
        for (const o of opts) {
          const k = o.name.trim().toLowerCase();
          if (!o.name.trim() || seen.has(k)) continue;
          seen.add(k);
          deduped.push(o);
        }
        setDrinkOptions(deduped);
      } else {
        setDrinkOptions(FALLBACK_DRINK_OPTIONS);
      }
    }).catch(() => {
      if (!cancelled) {
        setLoading(false);
        setDrinkOptions(FALLBACK_DRINK_OPTIONS);
      }
    });
    return () => { cancelled = true; };
  }, [isOpen]);

  const selectedCanonical = normalizeHydrationSelections(drinkOptionsSelected, drinkOptions);

  const toggleOption = (name: string) => {
    const allowed = drinkOptions;
    const base = normalizeHydrationSelections(drinkOptionsSelected, allowed);
    const canonical = allowed.length > 0 ? resolveToAirtableOptionName(name, allowed) ?? name : name;
    if (allowed.length > 0 && !allowed.some((o) => o.name === canonical)) return;
    const inList = base.includes(canonical);
    const next = inList ? base.filter((x) => x !== canonical) : [...base, canonical];
    onDrinkOptionsChange(next);
    void onSave(FIELD_IDS.HYDRATION_STATION_DRINK_OPTIONS, next);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      data-beo-portal-modal
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99998,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hydration-station-modal-title"
        style={{
          backgroundColor: "#2a2a2a",
          borderRadius: "16px",
          border: "2px solid #ff6b6b",
          maxWidth: 480,
          width: "100%",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #444", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 id="hydration-station-modal-title" style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#ff6b6b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            💧 Hydration Station Options
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#ff6b6b", fontSize: "20px", cursor: "pointer", padding: "4px 8px", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={labelStyle}>Drink options</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {loading ? (
                <div style={{ fontSize: 13, color: "#888" }}>Loading options…</div>
              ) : (
                drinkOptions.map((opt) => (
                  <label
                    key={opt.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: canEdit ? "pointer" : "default",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: selectedCanonical.includes(opt.name) ? "1px solid #ff6b6b" : "1px solid #444",
                      backgroundColor: selectedCanonical.includes(opt.name) ? "rgba(255,107,107,0.1)" : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCanonical.includes(opt.name)}
                      disabled={!canEdit}
                      onChange={() => toggleOption(opt.name)}
                      style={{ accentColor: "#ff6b6b" }}
                    />
                    <span style={{ color: "#e0e0e0", fontSize: 14 }}>{opt.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes (custom)</label>
            <textarea
              rows={3}
              value={notes}
              disabled={!canEdit}
              onChange={(e) => onNotesChange(e.target.value)}
              onBlur={(e) => onSave(FIELD_IDS.HYDRATION_STATION_NOTES, e.target.value)}
              style={textareaStyle}
              placeholder="Additional hydration notes..."
            />
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #444" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "12px 20px",
              borderRadius: "8px",
              border: "1px solid #ff6b6b",
              backgroundColor: "#ff6b6b",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
