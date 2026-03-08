import { DepartmentLayout } from "../components/DepartmentLayout";
import { EventsPipeline } from "../components/EventsPipeline";

const OPS_CHIEF_NAV = [
  { label: "Ops Chief Home", href: "/ops-chief", icon: "🎯" },
  { label: "Alerts Dashboard", href: "/ops-chief/alerts", icon: "⚠️" },
];

export default function OpsChiefLandingPage() {
  return (
    <DepartmentLayout title="Ops Chief" navItems={OPS_CHIEF_NAV}>
      <EventsPipeline title="Ops Chief — 10-Day Pipeline" departmentContext="ops_chief" />
    </DepartmentLayout>
  );
}
