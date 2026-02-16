import React, { useState } from "react";
import type { PackOutLine } from "../services/packOutService";

type PackOutModalProps = {
  open: boolean;
  onClose: () => void;
  lines: PackOutLine[];
  eventName?: string;
};

export function PackOutModal({ open, onClose, lines, eventName }: PackOutModalProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="pack-out-print-area"
        style={{
          background: "#1a1a1a",
          border: "1px solid #444",
          borderRadius: "8px",
          maxWidth: "560px",
          width: "90%",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "16px", borderBottom: "1px solid #444", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#ff6b6b" }}>
            Pack-Out List {eventName ? `— ${eventName}` : ""}
          </h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#888", fontSize: "20px", cursor: "pointer" }}>
            ×
          </button>
        </div>
        <div style={{ overflow: "auto", flex: 1, padding: "16px" }}>
          {lines.length === 0 ? (
            <p style={{ color: "#888" }}>No items in pack-out for this event.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {lines.map((line) => (
                <li
                  key={line.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 0",
                    borderBottom: "1px solid #333",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked[line.id] ?? false}
                    onChange={() => toggle(line.id)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <span style={{ color: "#e0e0e0", fontSize: "14px" }}>{line.label}</span>
                  <span style={{ color: "#666", fontSize: "12px" }}>{line.category}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ padding: "16px", borderTop: "1px solid #444", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: "10px 20px",
              background: "#ff6b6b",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Print
          </button>
          <button type="button" onClick={onClose} style={{ padding: "10px 20px", background: "#444", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
