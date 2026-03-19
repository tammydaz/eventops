import { useState } from "react";
import { DepartmentLayout } from "../components/DepartmentLayout";
import { OpsChiefTodayCards } from "../components/OpsChiefTodayCards";
import { OpsChiefDailyDispatch } from "../components/OpsChiefDailyDispatch";
import { OpsChiefFleetAndStorage } from "../components/OpsChiefFleetAndStorage";
import { OpsChiefIssueLog } from "../components/OpsChiefIssueLog";

const OPS_CHIEF_NAV = [
  { label: "Ops Chief Home", href: "/ops-chief", icon: "🎯" },
  { label: "Alerts Dashboard", href: "/ops-chief/alerts", icon: "⚠️" },
  { label: "Flair", href: "/flair", icon: "🎪" },
  { label: "Intake", href: "/beo-intake", icon: "📋" },
  { label: "Kitchen", href: "/kitchen", icon: "🍳" },
  { label: "Deliveries", href: "/delivery-command", icon: "🚚" },
];

type TabId = "today" | "dispatch" | "fleet" | "inventory" | "issues";

const TABS: { id: TabId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "dispatch", label: "Daily Dispatch" },
  { id: "fleet", label: "Fleet Management" },
  { id: "inventory", label: "Inventory" },
  { id: "issues", label: "Issue Log" },
];

const tabStyle: React.CSSProperties = {
  padding: "10px 18px",
  fontSize: "14px",
  fontWeight: 600,
  border: "1px solid #444",
  borderRadius: "8px",
  cursor: "pointer",
  background: "transparent",
  color: "#94a3b8",
  transition: "all 0.2s ease",
};

const tabActiveStyle: React.CSSProperties = {
  ...tabStyle,
  background: "#2563eb",
  borderColor: "#2563eb",
  color: "#fff",
};

export default function OpsChiefLandingPage() {
  const [activeTab, setActiveTab] = useState<TabId>("today");

  return (
    <DepartmentLayout title="Ops Chief" navItems={OPS_CHIEF_NAV} departmentContext="ops_chief">
      <div style={{ marginBottom: "20px" }}>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              style={activeTab === tab.id ? tabActiveStyle : tabStyle}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "today" && <OpsChiefTodayCards />}
      {activeTab === "dispatch" && <OpsChiefDailyDispatch />}
      {activeTab === "fleet" && <OpsChiefFleetAndStorage mode="fleet" />}
      {activeTab === "inventory" && <OpsChiefFleetAndStorage mode="inventory" />}
      {activeTab === "issues" && <OpsChiefIssueLog />}
    </DepartmentLayout>
  );
}
