import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FIELD_IDS, loadSingleSelectOptions, type SingleSelectOption } from "../../services/airtable/events";

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

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #444",
  backgroundColor: "#1a1a1a",
  color: "#e0e0e0",
  fontSize: "14px",
};

const labelStyle = {
  display: "block",
  fontSize: "11px",
  color: "#999",
  marginBottom: "6px",
  fontWeight: "600" as const,
};

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

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    loadSingleSelectOptions([FIELD_IDS.HYDRATION_STATION_DRINK_OPTIONS]).then((result) => {
      if (cancelled || "error" in result) return;
      const opts = result[FIELD_IDS.HYDRATION_STATION_DRINK_OPTIONS] ?? [];
      setDrinkOptions(opts);
    });
    return () => { cancelled = true; };
  }, [isOpen]);

  const toggleOption = (name: string) => {
    const next = drinkOptionsSelected.includes(name)
      ? drinkOptionsSelected.filter((o) => o !== name)
      : [...drinkOptionsSelected, name];
    onDrinkOptionsChange(next);
    onSave(FIELD_IDS.HYDRATION_STATION_DRINK_OPTIONS, next);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
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
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#ff6b6b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
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
              {drinkOptions.length === 0 ? (
                <div style={{ fontSize: 13, color: "#888" }}>Loading options from Airtable…</div>
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
                      border: drinkOptionsSelected.includes(opt.name) ? "1px solid #ff6b6b" : "1px solid #444",
                      backgroundColor: drinkOptionsSelected.includes(opt.name) ? "rgba(255,107,107,0.1)" : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={drinkOptionsSelected.includes(opt.name)}
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
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
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
