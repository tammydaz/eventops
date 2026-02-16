import React, { useState } from "react";
import { SpecLine, type SpecLineRow } from "./SpecLine";

const newId = () => Math.random().toString(36).slice(2, 11);

export function SpecEngineForm() {
  const [itemName, setItemName] = useState("");
  const [lines, setLines] = useState<SpecLineRow[]>([
    { id: newId(), text: "", isSauce: false, chinaMetal: "" },
  ]);
  const [designerNotesByLine, setDesignerNotesByLine] = useState<Record<string, string>>({});

  const addLine = (afterIndex?: number) => {
    const newLine: SpecLineRow = { id: newId(), text: "", isSauce: false, chinaMetal: "" };
    if (afterIndex != null) {
      const next = [...lines];
      next.splice(afterIndex + 1, 0, newLine);
      setLines(next);
    } else {
      setLines((prev) => [...prev, newLine]);
    }
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, patch: Partial<SpecLineRow>) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  };

  const setDesignerNotes = (lineId: string, value: string) => {
    setDesignerNotesByLine((prev) => ({ ...prev, [lineId]: value }));
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "24px",
        background: "linear-gradient(135deg, rgba(20,10,10,0.9), rgba(15,10,15,0.9))",
        border: "2px solid rgba(255,51,51,0.25)",
        borderRadius: "12px",
        color: "#e0e0e0",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontSize: "12px", color: "#888", marginBottom: "6px" }}>
          Item Name
        </label>
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Item name"
          style={{
            width: "100%",
            padding: "10px 14px",
            background: "#0a0a0a",
            border: "2px solid rgba(255,51,51,0.3)",
            borderRadius: "8px",
            color: "#e0e0e0",
            fontSize: "16px",
          }}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <label style={{ fontSize: "12px", color: "#888" }}>Spec Lines</label>
          <button
            type="button"
            onClick={() => addLine()}
            style={{
              padding: "6px 12px",
              background: "rgba(34,197,94,0.2)",
              border: "1px solid rgba(34,197,94,0.4)",
              borderRadius: "6px",
              color: "#22c55e",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Add Line
          </button>
        </div>

        {lines.map((line, index) => (
          <div key={line.id}>
            {line.isSauce && (
              <div style={{ marginLeft: "24px", borderLeft: "3px solid rgba(255,193,7,0.4)", paddingLeft: "12px" }}>
                <span style={{ fontSize: "11px", color: "#ffc107" }}>Nested sauce spec</span>
              </div>
            )}
            <SpecLine
              line={line}
              index={index}
              onChange={(id, patch) => updateLine(id, patch)}
              onRemove={removeLine}
              designerNotes={designerNotesByLine[line.id]}
              onDesignerNotesChange={(v) => setDesignerNotes(line.id, v)}
            />
            <button
              type="button"
              onClick={() => addLine(index)}
              style={{
                marginLeft: "0",
                marginBottom: "8px",
                padding: "2px 8px",
                background: "transparent",
                border: "1px dashed #444",
                borderRadius: "4px",
                color: "#666",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              + Add line below
            </button>
          </div>
        ))}
      </div>

      <p style={{ fontSize: "11px", color: "#666", marginTop: "16px" }}>
        CHINA/METAL tags are inline per line. Indent logic for sauces: mark line as sauce for nested display.
      </p>
    </div>
  );
}
