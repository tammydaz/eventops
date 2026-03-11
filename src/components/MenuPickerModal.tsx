import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePickerStore } from "../state/usePickerStore";
import { fetchMenuItemsByCategory } from "../services/airtable/menuItems";

interface MenuPickerModalProps {
  onAdd: (item: { id: string; name: string }) => void;
  alreadyAddedIds: string[];
}

export const MenuPickerModal: React.FC<MenuPickerModalProps> = ({ onAdd, alreadyAddedIds }) => {
  const { isOpen, pickerType, pickerTitle, closePicker } = usePickerStore();

  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !pickerType) return;

    setLoading(true);
    fetchMenuItemsByCategory(pickerType)
      .then((results) => {
        setItems(results || []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isOpen, pickerType]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="picker-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={closePicker}
    >
      <div
        className="picker-modal"
        style={{
          backgroundColor: "#1a1a1a",
          borderRadius: "12px",
          border: "2px solid #ff6b6b",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "bold", color: "#e0e0e0", padding: "16px 16px 0" }}>
          {pickerTitle}
        </h2>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px" }}>
          {loading ? (
            <div style={{ color: "#999", fontSize: "14px" }}>Loading items…</div>
          ) : (
            <div className="picker-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {items.map((item) => {
                const isAdded = alreadyAddedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`picker-item ${isAdded ? "active" : ""}`}
                    style={{
                      padding: "12px",
                      backgroundColor: isAdded ? "#2a3a2a" : "#2a2a2a",
                      border: `1px solid ${isAdded ? "#22c55e" : "#444"}`,
                      borderRadius: "6px",
                      cursor: isAdded ? "default" : "pointer",
                      color: "#e0e0e0",
                      transition: "all 0.2s",
                    }}
                    onClick={() => {
                      if (!isAdded) {
                        onAdd(item);
                      }
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {isAdded && <span style={{ color: "#22c55e" }}>✓</span>}
                      {item.name}
                    </span>
                  </div>
                );
              })}
              {items.length === 0 && !loading && (
                <div style={{ textAlign: "center", padding: "32px", color: "#999" }}>No items found</div>
              )}
            </div>
          )}
        </div>

        <div className="picker-actions" style={{ padding: "16px", borderTop: "1px solid #ff6b6b", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={closePicker}
            style={{
              padding: "10px 20px",
              background: "rgba(255,107,107,0.2)",
              color: "#ff6b6b",
              border: "2px solid #ff6b6b",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
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
