import { DepartmentLayout } from "../components/DepartmentLayout";
import { EventsPipeline } from "../components/EventsPipeline";

/** Placeholder nav — user will specify side buttons later */
const INTAKE_FOH_NAV = [
  { label: "Intake/FOH Home", href: "/intake-foh", icon: "📋" },
];

export default function IntakeFOHLandingPage() {
  return (
    <DepartmentLayout title="Intake / FOH" navItems={INTAKE_FOH_NAV}>
      <EventsPipeline title="Intake/FOH — 10-Day Pipeline" departmentContext="intake_foh" />
    </DepartmentLayout>
  );
}
