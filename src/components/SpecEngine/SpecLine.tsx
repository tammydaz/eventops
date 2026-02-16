import React from "react";

export type SpecLineRow = {
  id: string;
  text: string;
  isSauce?: boolean;
  chinaMetal?: string;
};

type SpecLineProps = {
  line: SpecLineRow;
  index: number;
  onChange: (id: string, patch: Partial<SpecLineRow>) => void;
  onRemove: (id: string) => void;
  designerNotes?: string;
  onDesignerNotesChange?: (value: string) => void;
};

export function SpecLine({
  line,
  index,
  onChange,
  onRemove,
  designerNotes,
  onDesignerNotesChange,
}: SpecLineProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 200px",
        gap: "12px",
        alignItems: "start",
        marginBottom: "8px",
      }}
    >
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="text"
          value={line.text}
          onChange={(e) => onChange(line.id, { text: e.target.value })}
          placeholder="Spec line..."
          style={{
            flex: 1,
            padding: "6px 10px",
            background: "#0a0a0a",
            border: "1px solid #333",
            borderRadius: "6px",
            color: "#e0e0e0",
            fontSize: "13px",
          }}
        />
        {line.chinaMetal && (
          <span
            style={{
              padding: "2px 8px",
              fontSize: "11px",
              fontWeight: "600",
              background: "rgba(255,193,7,0.2)",
              color: "#ffc107",
              borderRadius: "4px",
            }}
          >
            {line.chinaMetal}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#888" }}>
          <input
            type="checkbox"
            checked={!!line.isSauce}
            onChange={(e) => onChange(line.id, { isSauce: e.target.checked })}
          />
          Sauce
        </label>
        <input
          type="text"
          value={line.chinaMetal ?? ""}
          onChange={(e) => onChange(line.id, { chinaMetal: e.target.value })}
          placeholder="CHINA/METAL"
          style={{
            width: "90px",
            padding: "4px 6px",
            background: "#0a0a0a",
            border: "1px solid #333",
            borderRadius: "4px",
            color: "#888",
            fontSize: "11px",
          }}
        />
        <button
          type="button"
          onClick={() => onRemove(line.id)}
          style={{
            padding: "4px 8px",
            background: "rgba(244,67,54,0.2)",
            border: "1px solid rgba(244,67,54,0.4)",
            borderRadius: "4px",
            color: "#ef5350",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Remove
        </button>
      </div>
      <div>
        <label style={{ fontSize: "11px", color: "#666", display: "block", marginBottom: "2px" }}>
          Designer Notes
        </label>
        <textarea
          value={designerNotes ?? ""}
          onChange={(e) => onDesignerNotesChange?.(e.target.value)}
          placeholder="Notes..."
          rows={1}
          style={{
            width: "100%",
            padding: "4px 6px",
            background: "#0a0a0a",
            border: "1px solid #333",
            borderRadius: "4px",
            color: "#aaa",
            fontSize: "12px",
            resize: "vertical",
          }}
        />
      </div>
    </div>
  );
}
