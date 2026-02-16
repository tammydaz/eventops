import { useState } from "react";
import { OpsDiamonds } from "./OpsDiamonds";

const departmentItems = [
  { id: "kitchen", label: "Kitchen", icon: "🍳", className: "bubble-1" },
  { id: "logistics", label: "Logistics", icon: "🚚", className: "bubble-5" },
];

export const DepartmentCircles = () => {
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [isClientIntakeOpen, setIsClientIntakeOpen] = useState(false);

  return (
    <section className="departments-section">
      <OpsDiamonds />
      <h2 className="departments-title">Department Command Ring</h2>
      <div className="departments-grid">
        {departmentItems.map((department) => (
          <div key={department.id} className={`department-bubble ${department.className}`}>
            <div className="bubble-icon">{department.icon}</div>
            <div className="bubble-label">{department.label}</div>
          </div>
        ))}
        <div className="department-folder">
          <div
            className="department-bubble bubble-2"
            role="button"
            tabIndex={0}
            onClick={() => setIsClientIntakeOpen((value) => !value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                setIsClientIntakeOpen((value) => !value);
              }
            }}
          >
            <div className="bubble-icon">📝</div>
            <div className="bubble-label">CENTRAL COMMAND CENTER</div>
          </div>
          <div className={`folder-content ${isClientIntakeOpen ? "active" : ""}`}>
            <div
              className="subfolder-item"
              role="button"
              tabIndex={0}
              onClick={() => (window.location.href = "/quick-intake")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  window.location.href = "/quick-intake";
                }
              }}
            >
              Quick Client Intake
            </div>
            <div
              className="subfolder-item"
              role="button"
              tabIndex={0}
              onClick={() => (window.location.href = "/beo-intake")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  window.location.href = "/beo-intake";
                }
              }}
            >
              BEO Full Intake
            </div>
            <div className="subfolder-item">Rentals</div>
            <div className="subfolder-item">Ops Vault</div>
            <div className="subfolder-item">Upload Invoice</div>
          </div>
        </div>
      </div>
    </section>
  );
};
